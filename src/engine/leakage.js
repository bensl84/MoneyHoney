import { LEAKAGE_CATEGORIES, COLOR_THRESHOLDS, BASELINE_MONTHS } from '../shared/constants';

/**
 * Calculate leakage report for all categories
 * @param {Object} mtdByCategory - { categoryName: dollarAmount }
 * @param {Object} baselines - { categoryName: averageDollarAmount }
 * @returns {Array<LeakageReport>}
 */
export function calculateLeakage(mtdByCategory, baselines) {
  const report = [];

  for (const catName of Object.keys(LEAKAGE_CATEGORIES)) {
    const mtdSpend = mtdByCategory[catName] || 0;
    const baseline = baselines[catName] || 0;
    const delta = baseline > 0 ? Math.round((mtdSpend - baseline) * 100) / 100 : 0;
    const deltaPercent = baseline > 0 ? Math.round(((mtdSpend - baseline) / baseline) * 100) : 0;
    const bofaImpact = Math.max(0, delta);

    report.push({
      category: catName,
      mtdSpend: Math.round(mtdSpend * 100) / 100,
      baseline: Math.round(baseline * 100) / 100,
      delta,
      deltaPercent,
      bofaImpact: Math.round(bofaImpact * 100) / 100,
      color: colorThreshold(mtdSpend, baseline),
    });
  }

  return report;
}

/**
 * Compute baseline averages from historical transactions
 * @param {Array} historicalTxns - categorized transactions with leakageCategory
 * @param {number} months - number of months to average
 * @returns {Object} - { categoryName: averageDollarAmount }
 */
export function computeBaseline(historicalTxns, months = BASELINE_MONTHS) {
  if (!historicalTxns || historicalTxns.length === 0) {
    return {};
  }

  // Group by month and category
  const monthlyTotals = {};

  for (const txn of historicalTxns) {
    if (!txn.leakageCategory) continue;
    if (txn.amount >= 0) continue; // Skip inflows (refunds, returns)
    const monthKey = txn.date.substring(0, 7); // YYYY-MM
    if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = {};
    if (!monthlyTotals[monthKey][txn.leakageCategory]) {
      monthlyTotals[monthKey][txn.leakageCategory] = 0;
    }
    const amount = typeof txn.amount === 'number' ? Math.abs(txn.amount / 1000) : 0;
    monthlyTotals[monthKey][txn.leakageCategory] += amount;
  }

  // Get the most recent N months
  const sortedMonths = Object.keys(monthlyTotals).sort().reverse().slice(0, months);

  if (sortedMonths.length === 0) return {};

  // Average across months
  const averages = {};
  for (const catName of Object.keys(LEAKAGE_CATEGORIES)) {
    let total = 0;
    let count = 0;
    for (const month of sortedMonths) {
      if (monthlyTotals[month]?.[catName]) {
        total += monthlyTotals[month][catName];
        count++;
      }
    }
    averages[catName] = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
  }

  return averages;
}

/**
 * Calculate total BofA impact from leakage report
 */
export function totalBofAImpact(leakageReport) {
  return leakageReport.reduce((sum, cat) => sum + cat.bofaImpact, 0);
}

/**
 * Determine color threshold for a category
 * @param {number} mtd - month-to-date spend in dollars
 * @param {number} baseline - average monthly spend in dollars
 * @returns {'green' | 'amber' | 'red'}
 */
export function colorThreshold(mtd, baseline) {
  if (baseline <= 0) return 'green'; // No baseline yet
  const ratio = mtd / baseline;
  if (ratio <= COLOR_THRESHOLDS.GREEN_MAX) return 'green';
  if (ratio <= COLOR_THRESHOLDS.AMBER_MAX) return 'amber';
  return 'red';
}

/**
 * Calculate BofA payoff projections
 */
export function calculateBofAProjections(currentBalance, monthlyVelocity, monthlyLeakage) {
  if (monthlyVelocity <= 0) {
    return {
      currentPace: { months: Infinity, date: 'Never at current pace' },
      zeroLeakage: { months: Infinity, date: 'Never' },
      monthsSaved: 0,
    };
  }

  const monthsCurrentPace = Math.ceil(currentBalance / monthlyVelocity);
  const velocityWithLeakage = monthlyVelocity + monthlyLeakage;
  const monthsZeroLeakage = velocityWithLeakage > 0
    ? Math.ceil(currentBalance / velocityWithLeakage)
    : Infinity;

  const currentDate = new Date();
  const payoffCurrent = new Date(currentDate);
  payoffCurrent.setMonth(payoffCurrent.getMonth() + monthsCurrentPace);

  const payoffZeroLeak = new Date(currentDate);
  payoffZeroLeak.setMonth(payoffZeroLeak.getMonth() + monthsZeroLeakage);

  const formatDate = (d) => {
    if (!isFinite(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return {
    currentPace: {
      months: monthsCurrentPace,
      date: formatDate(payoffCurrent),
    },
    zeroLeakage: {
      months: isFinite(monthsZeroLeakage) ? monthsZeroLeakage : Infinity,
      date: formatDate(payoffZeroLeak),
    },
    monthsSaved: isFinite(monthsCurrentPace) && isFinite(monthsZeroLeakage)
      ? monthsCurrentPace - monthsZeroLeakage
      : 0,
  };
}

/**
 * Calculate average monthly payments to BofA from transaction history
 */
export function calculatePaydownVelocity(bofaPayments, months = BASELINE_MONTHS) {
  if (!bofaPayments || bofaPayments.length === 0) return 0;

  // Group by month
  const monthlyPayments = {};
  for (const txn of bofaPayments) {
    const monthKey = txn.date.substring(0, 7);
    if (!monthlyPayments[monthKey]) monthlyPayments[monthKey] = 0;
    monthlyPayments[monthKey] += Math.abs(txn.amount / 1000);
  }

  const sortedMonths = Object.keys(monthlyPayments).sort().reverse().slice(0, months);
  if (sortedMonths.length === 0) return 0;

  const total = sortedMonths.reduce((sum, m) => sum + monthlyPayments[m], 0);
  return Math.round((total / sortedMonths.length) * 100) / 100;
}
