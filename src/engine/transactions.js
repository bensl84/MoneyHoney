import { LEAKAGE_CATEGORIES, YNAB_ACCOUNTS, PAYCHECK } from '../shared/constants';

/**
 * Categorize a single transaction into a leakage category (or null)
 */
export function categorizeTransaction(txn) {
  const payeeLower = (txn.payee || '').toLowerCase();
  const categoryLower = (txn.category || '').toLowerCase();

  for (const [catName, config] of Object.entries(LEAKAGE_CATEGORIES)) {
    // Check YNAB category name match
    for (const ynabCat of config.ynabCategories) {
      if (categoryLower.includes(ynabCat.toLowerCase())) {
        return {
          ...txn,
          leakageCategory: catName,
          isPaycheck: isPaycheck(txn),
          isBofAPayment: isBofAPayment(txn),
        };
      }
    }

    // Check payee pattern match (word boundary to avoid false positives like "bar" in "barbershop")
    for (const pattern of config.payeePatterns) {
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(payeeLower)) {
        return {
          ...txn,
          leakageCategory: catName,
          isPaycheck: isPaycheck(txn),
          isBofAPayment: isBofAPayment(txn),
        };
      }
    }
  }

  return {
    ...txn,
    leakageCategory: null,
    isPaycheck: isPaycheck(txn),
    isBofAPayment: isBofAPayment(txn),
  };
}

/**
 * Check if a transaction is a paycheck deposit
 */
function isPaycheck(txn) {
  if (txn.accountId !== YNAB_ACCOUNTS.CHASE_CHECKING) return false;
  const amountDollars = Math.abs(txn.amount / 1000);
  if (txn.amount <= 0) return false; // inflow is positive in YNAB
  return amountDollars >= PAYCHECK.MIN_AMOUNT && amountDollars <= PAYCHECK.MAX_AMOUNT;
}

/**
 * Check if a transaction is a payment to BofA
 */
function isBofAPayment(txn) {
  // Transfers to BofA show as outflows from other accounts referencing BofA
  // or as inflows to the BofA account
  if (txn.accountId === YNAB_ACCOUNTS.BOFA_CASH_REWARDS && txn.amount > 0) {
    return true;
  }
  const payeeLower = (txn.payee || '').toLowerCase();
  return payeeLower.includes('bank of america') || payeeLower.includes('bofa');
}

/**
 * Filter transactions within a date range (inclusive)
 */
export function filterByDateRange(transactions, startDate, endDate) {
  return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
}

/**
 * Group transactions by their leakage category
 */
export function groupByCategory(transactions) {
  const grouped = {};
  for (const txn of transactions) {
    const cat = txn.leakageCategory || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(txn);
  }
  return grouped;
}

/**
 * Calculate month-to-date summary
 */
export function calculateMTD(transactions) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const today = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;

  const mtdTxns = filterByDateRange(transactions, monthStart, today);
  const categorized = mtdTxns.map(categorizeTransaction);

  // Total outflows (negative amounts in YNAB = spending)
  const totalSpend = categorized
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount / 1000), 0);

  // Group leakage spending
  const leakageByCategory = {};
  for (const cat of Object.keys(LEAKAGE_CATEGORIES)) {
    leakageByCategory[cat] = categorized
      .filter((t) => t.leakageCategory === cat && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount / 1000), 0);
  }

  // BofA payments this month
  const bofaPayments = categorized
    .filter((t) => t.isBofAPayment)
    .reduce((sum, t) => sum + Math.abs(t.amount / 1000), 0);

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    leakageByCategory,
    bofaPayments: Math.round(bofaPayments * 100) / 100,
    transactionCount: mtdTxns.length,
    startDate: monthStart,
    endDate: today,
    daysInMonth: new Date(year, now.getMonth() + 1, 0).getDate(),
    dayOfMonth: now.getDate(),
  };
}

/**
 * Build a text summary for AI brief
 */
export function buildMTDSummary(mtd) {
  const lines = [
    `Month-to-date total spend: $${mtd.totalSpend.toLocaleString()}`,
    `Day ${mtd.dayOfMonth} of ${mtd.daysInMonth} (${Math.round((mtd.dayOfMonth / mtd.daysInMonth) * 100)}% through the month)`,
    `Projected month-end: $${Math.round((mtd.totalSpend / mtd.dayOfMonth) * mtd.daysInMonth).toLocaleString()}`,
    '',
    'Leakage categories:',
  ];

  for (const [cat, amount] of Object.entries(mtd.leakageByCategory)) {
    lines.push(`- ${cat}: $${amount.toFixed(2)}`);
  }

  const totalLeakage = Object.values(mtd.leakageByCategory).reduce((s, v) => s + v, 0);
  lines.push(`Total leakage: $${totalLeakage.toFixed(2)}`);
  lines.push(`BofA payments MTD: $${mtd.bofaPayments.toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Get the date 90 days ago as YYYY-MM-DD
 */
export function get90DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().split('T')[0];
}

/**
 * Get the first day of the current month as YYYY-MM-DD
 */
export function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Get today as YYYY-MM-DD
 */
export function getToday() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}
