import { YNAB_ACCOUNTS, PAYCHECK } from '../shared/constants';

/**
 * Detect if today (or recent days) is a payday
 * @param {Array} recentTxns - recent transactions from YNAB
 * @param {string} today - YYYY-MM-DD
 * @returns {Object|null} - { date, amount, accountId } or null
 */
export function detectPayday(recentTxns, today) {
  if (!recentTxns || recentTxns.length === 0) return null;

  // Look for paycheck-sized inflow to Chase Checking in the last 3 days
  const todayDate = new Date(today + 'T12:00:00');
  const threeDaysAgo = new Date(todayDate);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  const paycheckTxns = recentTxns.filter((txn) => {
    if (txn.accountId !== YNAB_ACCOUNTS.CHASE_CHECKING) return false;
    if (txn.amount <= 0) return false; // Must be inflow
    const amountDollars = txn.amount / 1000;
    if (amountDollars < PAYCHECK.MIN_AMOUNT || amountDollars > PAYCHECK.MAX_AMOUNT) return false;
    if (txn.date < threeDaysAgoStr || txn.date > today) return false;

    // Check if it landed on a Thursday
    const txnDate = new Date(txn.date + 'T12:00:00');
    return txnDate.getDay() === PAYCHECK.DAY_OF_WEEK;
  });

  if (paycheckTxns.length === 0) return null;

  // Return the most recent one
  const latest = paycheckTxns.sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    date: latest.date,
    amount: Math.round(latest.amount / 1000 * 100) / 100,
    amountMilliunits: latest.amount,
    accountId: latest.accountId,
    payee: latest.payee,
  };
}

/**
 * Get upcoming bills from scheduled transactions
 * @param {Array} scheduledTxns - YNAB scheduled transactions
 * @param {number} days - how many days to look ahead
 * @returns {Array} - sorted bills with due dates
 */
export function getUpcomingBills(scheduledTxns, days = 14) {
  if (!scheduledTxns || scheduledTxns.length === 0) return [];

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  const todayStr = today.toISOString().split('T')[0];
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return scheduledTxns
    .filter((t) => {
      if (!t.dateNext) return false;
      return t.dateNext >= todayStr && t.dateNext <= cutoffStr && t.amount < 0;
    })
    .map((t) => ({
      name: t.payee || t.category || 'Unknown bill',
      amount: Math.round(Math.abs(t.amount / 1000) * 100) / 100,
      dueDate: t.dateNext,
      category: t.category,
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Generate a full payday allocation plan
 * @param {number} paycheckAmount - dollars
 * @param {Array} bills - upcoming bills
 * @param {Object} estimates - { groceries, gas, variable }
 * @param {Object} goals - from electron-store
 * @returns {Object} - { items: AllocationItem[], bofaExtra, totalAllocated }
 */
export function generateAllocation(paycheckAmount, bills, estimates = {}, goals = {}) {
  const items = [];
  let remaining = paycheckAmount;

  // 1. Bills first
  for (const bill of bills) {
    const amount = Math.min(bill.amount, remaining);
    items.push({
      name: bill.name,
      amount,
      category: 'bill',
      dueDate: bill.dueDate,
    });
    remaining -= amount;
  }

  // 2. Variable spending estimates
  const variableItems = [
    { name: 'Groceries', amount: estimates.groceries || 300, category: 'variable' },
    { name: 'Gas', amount: estimates.gas || 168, category: 'variable' },
    { name: 'Household / misc', amount: estimates.misc || 100, category: 'variable' },
  ];

  for (const item of variableItems) {
    const amount = Math.min(item.amount, remaining);
    if (amount > 0) {
      items.push({ ...item, amount, dueDate: null });
      remaining -= amount;
    }
  }

  // 3. Everything left goes to BofA
  const bofaExtra = Math.max(0, Math.round(remaining * 100) / 100);
  if (bofaExtra > 0) {
    items.push({
      name: 'BofA extra payment',
      amount: bofaExtra,
      category: 'debt',
      dueDate: null,
    });
  }

  const totalAllocated = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    paycheckAmount,
    items,
    bofaExtra,
    totalAllocated: Math.round(totalAllocated * 100) / 100,
    billsTotal: bills.reduce((sum, b) => sum + b.amount, 0),
    variableTotal: items
      .filter((item) => item.category === 'variable')
      .reduce((sum, item) => sum + item.amount, 0),
  };
}

/**
 * Build context string for AI allocation prompt
 */
export function buildPaydayContext(payday, bills, mtdSummary, goals) {
  const lines = [
    `Paycheck amount: $${payday.amount}`,
    `Paycheck date: ${payday.date}`,
    '',
    'Upcoming bills (next 14 days):',
  ];

  if (bills.length === 0) {
    lines.push('- No scheduled bills found');
  } else {
    for (const bill of bills) {
      lines.push(`- ${bill.name}: $${bill.amount} (due ${bill.dueDate})`);
    }
  }

  lines.push('');
  lines.push(`BofA balance: $${goals?.bofaCurrentBalance || 'unknown'}`);
  lines.push('');
  lines.push('Allocate every dollar. Maximize BofA extra payment after essentials.');

  return lines.join('\n');
}
