/**
 * 12-month cash flow simulation engine.
 * Generates ~26 biweekly pay periods with bills slotted by due date.
 * Returns a timeline of events (paydays + bills) with running balance.
 */

/**
 * Find the next Thursday from a given date.
 */
function nextThursday(from) {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun
  const daysUntil = (4 - day + 7) % 7 || 7; // 4 = Thursday
  d.setDate(d.getDate() + daysUntil);
  return d;
}

/**
 * Add N days to a date.
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Parse a due date string like "9th", "1st", "15th", "28th" into a day number.
 * Returns null if unparseable.
 */
function parseDueDay(dueDateStr) {
  if (!dueDateStr) return null;
  const match = dueDateStr.match(/^(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

/**
 * Check if a bill falls within a date range [start, end).
 * Monthly bills: check if their due day falls in the range.
 * Quarterly/yearly: check if their due months match AND due day falls in range.
 */
function billFallsInPeriod(bill, periodStart, periodEnd) {
  const dueDay = parseDueDay(bill.dueDate) || 1;
  const startMonth = periodStart.getMonth(); // 0-indexed
  const startYear = periodStart.getFullYear();
  const endMonth = periodEnd.getMonth();
  const endYear = periodEnd.getFullYear();

  // Check each month the period spans
  const months = [];
  let m = startMonth;
  let y = startYear;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ month: m, year: y });
    m++;
    if (m > 11) { m = 0; y++; }
  }

  for (const { month, year } of months) {
    // For quarterly/yearly bills, check if this month is a due month
    if (bill.dueMonths) {
      const monthNum = month + 1; // dueMonths uses 1-12
      if (!bill.dueMonths.includes(monthNum)) continue;
    }

    const billDate = new Date(year, month, Math.min(dueDay, daysInMonth(year, month)));
    if (billDate >= periodStart && billDate < periodEnd) {
      return { date: billDate, matches: true };
    }
  }

  return { date: null, matches: false };
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate the full 12-month simulation.
 *
 * @param {object} params
 * @param {number} params.startingBalance - Current account balance
 * @param {number} params.paycheck - Biweekly paycheck amount
 * @param {Array} params.creditCards - Credit card bills [{name, dueDate, payment}]
 * @param {Array} params.monthlyBills - Monthly bills [{name, dueDate, amount}]
 * @param {Array} params.quarterlyBills - Quarterly bills [{name, dueDate, amount, dueMonths}]
 * @param {Array} params.yearlyBills - Yearly bills [{name, dueDate, amount, dueMonths}]
 * @param {number} params.spendPerPeriod - Discretionary spend per pay period
 * @returns {Array} Array of pay periods, each with events and running balance
 */
export function generateSimulation({
  startingBalance = 0,
  paycheck = 4062,
  creditCards = [],
  monthlyBills = [],
  quarterlyBills = [],
  yearlyBills = [],
  spendPerPeriod = 1000,
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find next payday
  let payday = nextThursday(today);
  const periods = [];
  let balance = startingBalance;

  // Build all bills into a unified list
  const allBills = [
    ...creditCards.map((c) => ({ ...c, name: c.name, amount: c.payment, type: 'credit', dueDate: c.dueDate })),
    ...monthlyBills.map((b) => ({ ...b, type: 'monthly' })),
    ...quarterlyBills.map((b) => ({ ...b, type: 'quarterly' })),
    ...yearlyBills.map((b) => ({ ...b, type: 'yearly' })),
  ];

  // Generate 26 pay periods (12 months)
  for (let i = 0; i < 26; i++) {
    const periodStart = new Date(payday);
    const periodEnd = addDays(payday, 14);

    const events = [];

    // Payday event
    balance += paycheck;
    events.push({
      type: 'payday',
      name: 'Paycheck',
      date: new Date(periodStart),
      amount: paycheck,
      balance: Math.round(balance * 100) / 100,
    });

    // Find bills due in this period
    const billsDue = [];
    for (const bill of allBills) {
      const { date, matches } = billFallsInPeriod(bill, periodStart, periodEnd);
      if (matches && date) {
        billsDue.push({ ...bill, billDate: date });
      }
    }

    // Sort bills by date within the period
    billsDue.sort((a, b) => a.billDate - b.billDate);

    // Add bill events
    for (const bill of billsDue) {
      balance -= bill.amount;
      events.push({
        type: bill.type,
        name: bill.name,
        date: bill.billDate,
        amount: -bill.amount,
        balance: Math.round(balance * 100) / 100,
      });
    }

    // Discretionary spending
    balance -= spendPerPeriod;
    events.push({
      type: 'spend',
      name: 'Food & Fun / Discretionary',
      date: null,
      amount: -spendPerPeriod,
      balance: Math.round(balance * 100) / 100,
    });

    periods.push({
      index: i,
      payday: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      month: periodStart.getMonth(),
      year: periodStart.getFullYear(),
      events,
      startBalance: Math.round((balance + spendPerPeriod + billsDue.reduce((s, b) => s + b.amount, 0)) * 100) / 100,
      endBalance: Math.round(balance * 100) / 100,
    });

    // Move to next payday
    payday = addDays(payday, 14);
  }

  return periods;
}

/**
 * Group periods by month for display.
 */
export function groupByMonth(periods) {
  const months = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  for (const period of periods) {
    const key = `${period.year}-${String(period.month + 1).padStart(2, '0')}`;
    if (!months[key]) {
      months[key] = {
        key,
        label: `${monthNames[period.month]} ${period.year}`,
        month: period.month,
        year: period.year,
        periods: [],
      };
    }
    months[key].periods.push(period);
  }

  return Object.values(months);
}
