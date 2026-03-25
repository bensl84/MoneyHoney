import { useState, useMemo } from 'react';
import { BUDGET_DATA } from '../shared/constants';

const fmt = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Check if a bill is due this month
function isDueThisMonth(dueMonths) {
  if (!dueMonths || dueMonths.length === 0) return false;
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return dueMonths.includes(currentMonth);
}

export default function Budget() {
  const defaults = BUDGET_DATA;
  const currentMonth = new Date().getMonth() + 1;
  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Editable income
  const [biweekly, setBiweekly] = useState(defaults.income.biweekly);
  const monthly = biweekly * 2;

  // Editable credit card payments
  const [cardPayments, setCardPayments] = useState(
    defaults.creditCards.map((c) => c.payment)
  );

  // Editable monthly bill amounts
  const [monthlyAmounts, setMonthlyAmounts] = useState(
    defaults.monthlyBills.map((b) => b.amount)
  );

  // Editable quarterly — default to full amount if due this month, 0 if not
  const [quarterlyAmounts, setQuarterlyAmounts] = useState(
    defaults.quarterlyBills.map((b) => isDueThisMonth(b.dueMonths) ? b.amount : 0)
  );

  // Editable yearly — default to full amount if due this month, 0 if not
  const [yearlyAmounts, setYearlyAmounts] = useState(
    defaults.yearlyBills.map((b) => isDueThisMonth(b.dueMonths) ? b.amount : 0)
  );

  // Editable food & fun
  const [foodAndFun, setFoodAndFun] = useState(defaults.spendTarget.foodAndFun);

  // Totals
  const cardPaymentsTotal = cardPayments.reduce((s, p) => s + p, 0);
  const cardBalanceTotal = defaults.creditCards.reduce((s, c) => s + c.balance, 0);
  const monthlyTotal = monthlyAmounts.reduce((s, a) => s + a, 0);
  const quarterlyThisMonth = quarterlyAmounts.reduce((s, a) => s + a, 0);
  const yearlyThisMonth = yearlyAmounts.reduce((s, a) => s + a, 0);

  // "Between 2 Paydays" waterfall — everything divided by 2
  const paycheck = biweekly;
  const allBills = cardPaymentsTotal / 2 + monthlyTotal / 2 + quarterlyThisMonth / 2 + yearlyThisMonth / 2;
  const leftover = paycheck - allBills;
  const weeklySpend = foodAndFun / 2 / 2; // biweekly food&fun / 2 weeks

  // Build unified bill list for the "Between 2 Paydays" running balance
  const allItems = useMemo(() => {
    const items = [];

    // Credit cards (÷2)
    defaults.creditCards.forEach((card, i) => {
      items.push({
        name: card.name,
        dueDate: card.dueDate,
        amount: cardPayments[i] / 2,
        type: 'credit',
        isDue: true,
      });
    });

    // Monthly bills (÷2)
    defaults.monthlyBills.forEach((bill, i) => {
      items.push({
        name: bill.name,
        dueDate: bill.dueDate,
        amount: monthlyAmounts[i] / 2,
        type: 'monthly',
        isDue: true,
      });
    });

    // Quarterly bills (÷2, yellow if due this month)
    defaults.quarterlyBills.forEach((bill, i) => {
      const due = isDueThisMonth(bill.dueMonths);
      items.push({
        name: bill.name,
        dueDate: bill.dueMonth,
        amount: quarterlyAmounts[i] / 2,
        type: 'quarterly',
        isDue: due,
        fullAmount: bill.amount,
        nextDue: bill.dueMonths ? monthNames[bill.dueMonths.find((m) => m >= currentMonth) || bill.dueMonths[0]] : '',
      });
    });

    // Yearly bills (÷2, yellow if due this month)
    defaults.yearlyBills.forEach((bill, i) => {
      const due = isDueThisMonth(bill.dueMonths);
      items.push({
        name: bill.name,
        dueDate: bill.dueMonth,
        amount: yearlyAmounts[i] / 2,
        type: 'yearly',
        isDue: due,
        fullAmount: bill.amount,
      });
    });

    return items;
  }, [cardPayments, monthlyAmounts, quarterlyAmounts, yearlyAmounts, defaults, currentMonth]);

  // Running balance for unified list
  const runningBalance = useMemo(() => {
    let remaining = paycheck;
    return allItems.map((item) => {
      remaining -= item.amount;
      return remaining;
    });
  }, [paycheck, allItems]);

  const updateCardPayment = (i, val) => {
    const next = [...cardPayments];
    next[i] = parseFloat(val) || 0;
    setCardPayments(next);
  };

  const updateMonthlyAmount = (i, val) => {
    const next = [...monthlyAmounts];
    next[i] = parseFloat(val) || 0;
    setMonthlyAmounts(next);
  };

  const updateQuarterlyAmount = (i, val) => {
    const next = [...quarterlyAmounts];
    next[i] = parseFloat(val) || 0;
    setQuarterlyAmounts(next);
  };

  const updateYearlyAmount = (i, val) => {
    const next = [...yearlyAmounts];
    next[i] = parseFloat(val) || 0;
    setYearlyAmounts(next);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Nikki&apos;s View</h1>
          <p className="text-sm text-gray-500 mt-1">Between 2 paydays &mdash; {monthNames[currentMonth]} {new Date().getFullYear()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Biweekly Paycheck</p>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-emerald-400 text-lg">$</span>
            <input
              type="number"
              value={biweekly}
              onChange={(e) => setBiweekly(parseFloat(e.target.value) || 0)}
              className="w-24 bg-surface-3 border border-surface-4 rounded px-2 py-1 text-lg font-mono text-emerald-400 text-right focus:border-honey-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{fmt(monthly)} monthly</p>
        </div>
      </div>

      {/* Main layout: Between 2 Paydays (left) + Waterfall (right) */}
      <div className="grid grid-cols-5 gap-4">

        {/* Between 2 Paydays — unified editable bill list (3 cols wide) */}
        <div className="col-span-3 bg-surface-2 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Between 2 Paydays</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500">Paycheck: <span className="font-mono text-emerald-400">{fmt(paycheck)}</span></span>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
            <span className="w-40">Bill</span>
            <div className="flex items-center gap-2">
              <span className="w-12 text-right">Due</span>
              <span className="w-20 text-right">Amount (÷2)</span>
              <span className="w-24 text-right">Remaining</span>
            </div>
          </div>

          {/* Credit Cards section */}
          <div className="mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-2 mb-1 font-semibold">Credit Cards</p>
            {defaults.creditCards.map((card, i) => (
              <BillRow
                key={'cc-' + card.name}
                name={card.name}
                dueDate={card.dueDate}
                amount={cardPayments[i] / 2}
                remaining={runningBalance[i]}
                onAmountChange={(val) => updateCardPayment(i, val * 2)}
                type="credit"
              />
            ))}
          </div>

          {/* Monthly Bills section */}
          <div className="mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-3 mb-1 font-semibold">Monthly Bills</p>
            {defaults.monthlyBills.map((bill, i) => {
              const idx = defaults.creditCards.length + i;
              return (
                <BillRow
                  key={'mo-' + bill.name}
                  name={bill.name}
                  dueDate={bill.dueDate}
                  amount={monthlyAmounts[i] / 2}
                  remaining={runningBalance[idx]}
                  onAmountChange={(val) => updateMonthlyAmount(i, val * 2)}
                  type="monthly"
                />
              );
            })}
          </div>

          {/* Quarterly section */}
          <div className="mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-3 mb-1 font-semibold">
              Quarterly
              {quarterlyThisMonth > 0 && <span className="text-yellow-400 ml-2 normal-case">({monthNames[currentMonth]} bills active)</span>}
            </p>
            {defaults.quarterlyBills.map((bill, i) => {
              const idx = defaults.creditCards.length + defaults.monthlyBills.length + i;
              const due = isDueThisMonth(bill.dueMonths);
              return (
                <BillRow
                  key={'qt-' + bill.name}
                  name={bill.name}
                  dueDate={bill.dueMonth}
                  amount={quarterlyAmounts[i] / 2}
                  remaining={runningBalance[idx]}
                  onAmountChange={(val) => updateQuarterlyAmount(i, val * 2)}
                  type="quarterly"
                  isDue={due}
                  fullAmount={bill.amount}
                />
              );
            })}
          </div>

          {/* Yearly section */}
          <div className="mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-3 mb-1 font-semibold">
              Yearly
              {yearlyThisMonth > 0 && <span className="text-yellow-400 ml-2 normal-case">({monthNames[currentMonth]} bills active)</span>}
            </p>
            {defaults.yearlyBills.map((bill, i) => {
              const idx = defaults.creditCards.length + defaults.monthlyBills.length + defaults.quarterlyBills.length + i;
              const due = isDueThisMonth(bill.dueMonths);
              return (
                <BillRow
                  key={'yr-' + bill.name}
                  name={bill.name}
                  dueDate={bill.dueMonth}
                  amount={yearlyAmounts[i] / 2}
                  remaining={runningBalance[idx]}
                  onAmountChange={(val) => updateYearlyAmount(i, val * 2)}
                  type="yearly"
                  isDue={due}
                  fullAmount={bill.amount}
                />
              );
            })}
          </div>

          {/* Totals */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-surface-4">
            <span className="font-semibold text-gray-300">Total Bills (per paycheck)</span>
            <span className="font-mono font-semibold text-amber-400">{fmt(allBills)}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-honey-600">
            <span className="font-semibold text-honey-400 text-lg">Leftover</span>
            <span className={`text-xl font-mono font-bold ${leftover >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
              {fmt(leftover)}
            </span>
          </div>
        </div>

        {/* Right side: Waterfall + Spend Target (2 cols wide) */}
        <div className="col-span-2 space-y-4">
          {/* Income Waterfall (monthly view) */}
          <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Summary</h2>
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
              <span></span>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right">Per Check</span>
                <span className="w-24 text-right">Monthly</span>
              </div>
            </div>
            <WaterfallRow label="Income" perCheck={paycheck} monthly={monthly} isFirst />
            <WaterfallRow label="Cards" perCheck={cardPaymentsTotal / 2} monthly={monthly - cardPaymentsTotal} />
            <WaterfallRow label="Monthly" perCheck={monthlyTotal / 2} monthly={monthly - cardPaymentsTotal - monthlyTotal} />
            <WaterfallRow label="Quarterly" perCheck={quarterlyThisMonth / 2} monthly={monthly - cardPaymentsTotal - monthlyTotal - quarterlyThisMonth} highlight={quarterlyThisMonth > 0} />
            <WaterfallRow label="Yearly" perCheck={yearlyThisMonth / 2} monthly={monthly - cardPaymentsTotal - monthlyTotal - quarterlyThisMonth - yearlyThisMonth} highlight={yearlyThisMonth > 0} />
            <div className="border-t-2 border-honey-600 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-honey-400">Leftover</span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold w-20 text-right ${leftover >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
                    {fmt(leftover)}
                  </span>
                  <span className={`text-lg font-mono font-bold w-24 text-right ${leftover * 2 >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
                    {fmt(leftover * 2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Spend Target */}
          <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Spend Target</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-400">Food & Fun ({defaults.spendTarget.label})</span>
                <div className="flex items-center gap-1">
                  <span className="text-orange-400 text-xs">$</span>
                  <input
                    type="number"
                    value={foodAndFun}
                    onChange={(e) => setFoodAndFun(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono text-orange-400 text-right text-xs focus:border-honey-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">/mo</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Per paycheck</span>
                <span className="font-mono text-sm text-orange-400">{fmt(foodAndFun / 2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-400">Weekly Max</span>
                <span className="font-mono text-sm font-semibold text-red-400">{fmt(weeklySpend)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-surface-4">
                <span className="text-xs text-gray-500">After food & fun (per check)</span>
                <span className={`font-mono text-sm font-bold ${leftover - foodAndFun / 2 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(leftover - foodAndFun / 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Goals</h2>
            <div className="space-y-1">
              {defaults.goals.map((goal, i) => (
                <div key={i} className="flex items-start gap-2 text-sm py-0.5">
                  <span className="text-honey-500 mt-0.5">•</span>
                  <span className="text-gray-300 text-xs">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillRow({ name, dueDate, amount, remaining, onAmountChange, type, isDue, fullAmount }) {
  const isQuarterlyOrYearly = type === 'quarterly' || type === 'yearly';
  const isActive = !isQuarterlyOrYearly || isDue || amount > 0;

  // Yellow highlight for quarterly/yearly bills that are due this month
  const rowClass = isQuarterlyOrYearly && isDue
    ? 'bg-yellow-900/30 border-yellow-700/50'
    : 'border-surface-4/30';

  const nameColor = isQuarterlyOrYearly && isDue
    ? 'text-yellow-300'
    : isQuarterlyOrYearly && !isDue
      ? 'text-gray-500'
      : 'text-gray-300';

  return (
    <div className={`flex items-center justify-between py-1 text-sm border-b ${rowClass}`}>
      <div className="flex items-center gap-1 truncate mr-1 w-40">
        <span className={`truncate text-xs ${nameColor}`}>{name}</span>
        {isQuarterlyOrYearly && isDue && (
          <span className="text-yellow-400 text-xs shrink-0">DUE</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {dueDate && <span className="text-gray-600 text-xs w-12 text-right">{dueDate}</span>}
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
          className={`w-20 bg-surface-3 border rounded px-1 py-0.5 font-mono text-right text-xs focus:border-honey-500 focus:outline-none ${
            isQuarterlyOrYearly && isDue
              ? 'border-yellow-700 text-yellow-300'
              : isQuarterlyOrYearly && !isDue
                ? 'border-surface-4 text-gray-500'
                : 'border-surface-4 text-gray-200'
          }`}
          step="0.01"
        />
        <span className={`font-mono text-xs w-24 text-right ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {fmt(remaining)}
        </span>
      </div>
    </div>
  );
}

function WaterfallRow({ label, perCheck, monthly, isFirst, highlight }) {
  const checkColor = isFirst ? 'text-emerald-400' : highlight ? 'text-yellow-300' : 'text-gray-300';
  const monthlyColor = isFirst ? 'text-emerald-400' : (monthly >= 0 ? 'text-emerald-400' : 'text-red-400');

  return (
    <div className={`flex items-center justify-between py-2 border-b ${highlight ? 'border-yellow-700/50 bg-yellow-900/20' : 'border-surface-4/30'}`}>
      <span className={`text-sm ${highlight ? 'text-yellow-300' : 'text-gray-300'}`}>{label}</span>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-xs ${checkColor} w-20 text-right`}>
          {isFirst ? fmt(perCheck) : perCheck > 0 ? '−' + fmt(perCheck) : fmt(0)}
        </span>
        <span className={`font-mono text-xs ${monthlyColor} bg-surface-3 px-2 py-0.5 rounded w-24 text-right`}>
          {fmt(monthly)}
        </span>
      </div>
    </div>
  );
}
