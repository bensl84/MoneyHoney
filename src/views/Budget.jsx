import { useState, useMemo } from 'react';
import { BUDGET_DATA } from '../shared/constants';
import { generateSimulation, groupByMonth } from '../engine/simulation';

const fmt = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSigned = (n) => (n < 0 ? '−' : '') + fmt(n);
const fmtDate = (d) => {
  if (!d) return '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
};

export default function Budget() {
  const defaults = BUDGET_DATA;

  // Editable simulation inputs
  const [startingBalance, setStartingBalance] = useState(2500);
  const [paycheck, setPaycheck] = useState(defaults.income.biweekly);
  const [spendPerPeriod, setSpendPerPeriod] = useState(defaults.spendTarget.foodAndFun / 2);

  // Editable overrides — user can tweak any bill amount
  const [cardOverrides, setCardOverrides] = useState(
    defaults.creditCards.map((c) => c.payment)
  );
  const [monthlyOverrides, setMonthlyOverrides] = useState(
    defaults.monthlyBills.map((b) => b.amount)
  );
  const [quarterlyOverrides, setQuarterlyOverrides] = useState(
    defaults.quarterlyBills.map((b) => b.amount)
  );
  const [yearlyOverrides, setYearlyOverrides] = useState(
    defaults.yearlyBills.map((b) => b.amount)
  );

  // Selected month for page view
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);

  // Generate simulation with overridden amounts
  const simulation = useMemo(() => {
    const creditCards = defaults.creditCards.map((c, i) => ({
      ...c,
      payment: cardOverrides[i],
    }));
    const monthlyBills = defaults.monthlyBills.map((b, i) => ({
      ...b,
      amount: monthlyOverrides[i],
    }));
    const quarterlyBills = defaults.quarterlyBills.map((b, i) => ({
      ...b,
      amount: quarterlyOverrides[i],
    }));
    const yearlyBills = defaults.yearlyBills.map((b, i) => ({
      ...b,
      amount: yearlyOverrides[i],
    }));

    return generateSimulation({
      startingBalance,
      paycheck,
      creditCards,
      monthlyBills,
      quarterlyBills,
      yearlyBills,
      spendPerPeriod,
    });
  }, [startingBalance, paycheck, spendPerPeriod, cardOverrides, monthlyOverrides, quarterlyOverrides, yearlyOverrides, defaults]);

  const months = useMemo(() => groupByMonth(simulation), [simulation]);
  const currentMonthData = months[selectedMonthIdx] || months[0];

  // Find lowest balance across all periods
  const lowestBalance = useMemo(() => {
    let lowest = Infinity;
    let lowestDate = null;
    for (const period of simulation) {
      for (const event of period.events) {
        if (event.balance < lowest) {
          lowest = event.balance;
          lowestDate = event.date || period.payday;
        }
      }
    }
    return { amount: lowest, date: lowestDate };
  }, [simulation]);

  const updateOverride = (setter, idx, val) => {
    setter((prev) => {
      const next = [...prev];
      next[idx] = parseFloat(val) || 0;
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Nikki&apos;s View</h1>
          <p className="text-sm text-gray-500 mt-1">12-month cash flow simulation &mdash; every payday, every bill, every dollar</p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">Starting Balance</label>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-sm">$</span>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                className="w-24 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono text-emerald-400 text-right text-sm focus:border-honey-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">Paycheck (biweekly)</label>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 text-sm">$</span>
              <input
                type="number"
                value={paycheck}
                onChange={(e) => setPaycheck(parseFloat(e.target.value) || 0)}
                className="w-24 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono text-emerald-400 text-right text-sm focus:border-honey-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase block mb-1">Food & Fun (per check)</label>
            <div className="flex items-center gap-1">
              <span className="text-orange-400 text-sm">$</span>
              <input
                type="number"
                value={spendPerPeriod}
                onChange={(e) => setSpendPerPeriod(parseFloat(e.target.value) || 0)}
                className="w-24 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono text-orange-400 text-right text-sm focus:border-honey-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500 uppercase">Lowest Balance</p>
            <p className={`font-mono font-bold text-lg ${lowestBalance.amount >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {lowestBalance.amount < 0 ? '−' : ''}{fmt(lowestBalance.amount)}
            </p>
            <p className="text-xs text-gray-500">{lowestBalance.date ? fmtDate(lowestBalance.date) : ''}</p>
          </div>
        </div>
      </div>

      {/* Month selector tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {months.map((m, i) => {
          const endBal = m.periods[m.periods.length - 1]?.endBalance ?? 0;
          const isSelected = i === selectedMonthIdx;
          return (
            <button
              key={m.key}
              onClick={() => setSelectedMonthIdx(i)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-honey-600 text-white'
                  : 'bg-surface-2 text-gray-400 hover:bg-surface-3 border border-surface-3'
              }`}
            >
              <div>{m.label.split(' ')[0].substring(0, 3)}</div>
              <div className={`font-mono text-xs mt-0.5 ${endBal >= 0 ? (isSelected ? 'text-white' : 'text-emerald-400') : 'text-red-400'}`}>
                {endBal < 0 ? '−' : ''}{fmt(endBal)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main content: Simulation + Bill Editor */}
      <div className="grid grid-cols-3 gap-4">

        {/* Simulation timeline (2 cols) */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {currentMonthData?.label} — Pay Period Detail
          </h2>

          {currentMonthData?.periods.map((period) => (
            <div key={period.index} className="bg-surface-2 rounded-xl border border-surface-3 overflow-hidden">
              {/* Period header */}
              <div className="bg-surface-3 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-honey-400 font-semibold text-sm">
                    Payday: {fmtDate(period.payday)}
                  </span>
                  <span className="text-xs text-gray-500">
                    — {fmtDate(period.periodEnd)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">End balance:</span>
                  <span className={`font-mono font-bold ${period.endBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {period.endBalance < 0 ? '−' : ''}{fmt(period.endBalance)}
                  </span>
                </div>
              </div>

              {/* Events table */}
              <div className="px-4">
                {/* Column headers */}
                <div className="flex items-center py-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
                  <span className="w-8"></span>
                  <span className="flex-1">Description</span>
                  <span className="w-20 text-right">Date</span>
                  <span className="w-24 text-right">Amount</span>
                  <span className="w-28 text-right">Balance</span>
                </div>

                {period.events.map((event, ei) => {
                  const isPayday = event.type === 'payday';
                  const isSpend = event.type === 'spend';
                  const isQuarterly = event.type === 'quarterly';
                  const isYearly = event.type === 'yearly';
                  const isDanger = event.balance < 0;
                  const isWarning = event.balance >= 0 && event.balance < 500;

                  let icon = '📋';
                  if (isPayday) icon = '💰';
                  else if (event.type === 'credit') icon = '💳';
                  else if (isSpend) icon = '🛒';
                  else if (isQuarterly) icon = '📅';
                  else if (isYearly) icon = '📆';

                  const rowBg = isPayday
                    ? 'bg-emerald-950/30'
                    : isDanger
                      ? 'bg-red-950/30'
                      : (isQuarterly || isYearly)
                        ? 'bg-yellow-950/20'
                        : '';

                  return (
                    <div key={ei} className={`flex items-center py-1.5 border-b border-surface-4/30 text-sm ${rowBg}`}>
                      <span className="w-8 text-center text-xs">{icon}</span>
                      <span className={`flex-1 ${isPayday ? 'text-emerald-400 font-semibold' : isSpend ? 'text-orange-400' : (isQuarterly || isYearly) ? 'text-yellow-300' : 'text-gray-300'}`}>
                        {event.name}
                        {(isQuarterly || isYearly) && <span className="text-yellow-500 text-xs ml-1">({event.type})</span>}
                      </span>
                      <span className="w-20 text-right text-xs text-gray-500">
                        {event.date ? fmtDate(event.date) : ''}
                      </span>
                      <span className={`w-24 text-right font-mono text-xs ${event.amount >= 0 ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {event.amount >= 0 ? '+' : '−'}{fmt(event.amount)}
                      </span>
                      <span className={`w-28 text-right font-mono text-sm font-semibold ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {event.balance < 0 ? '−' : ''}{fmt(event.balance)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bill editor sidebar (1 col) */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Edit Bills</h2>

          {/* Credit Cards */}
          <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Credit Cards</h3>
            {defaults.creditCards.map((card, i) => (
              <div key={card.name} className="flex items-center justify-between py-1 text-xs border-b border-surface-4/30">
                <span className="text-gray-300 truncate mr-2">{card.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={cardOverrides[i]}
                    onChange={(e) => updateOverride(setCardOverrides, i, e.target.value)}
                    className="w-16 bg-surface-3 border border-surface-4 rounded px-1 py-0.5 font-mono text-amber-400 text-right text-xs focus:border-honey-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Bills */}
          <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 max-h-64 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Monthly Bills</h3>
            {defaults.monthlyBills.map((bill, i) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-xs border-b border-surface-4/30">
                <span className="text-gray-300 truncate mr-2">{bill.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={monthlyOverrides[i]}
                    onChange={(e) => updateOverride(setMonthlyOverrides, i, e.target.value)}
                    className="w-16 bg-surface-3 border border-surface-4 rounded px-1 py-0.5 font-mono text-gray-200 text-right text-xs focus:border-honey-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quarterly Bills */}
          <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quarterly Bills</h3>
            {defaults.quarterlyBills.map((bill, i) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-xs border-b border-surface-4/30">
                <span className="text-yellow-300 truncate mr-2">{bill.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={quarterlyOverrides[i]}
                    onChange={(e) => updateOverride(setQuarterlyOverrides, i, e.target.value)}
                    className="w-16 bg-surface-3 border border-yellow-800 rounded px-1 py-0.5 font-mono text-yellow-300 text-right text-xs focus:border-honey-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-600 mt-1 italic">Due months auto-detected</p>
          </div>

          {/* Yearly Bills */}
          <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Yearly Bills</h3>
            {defaults.yearlyBills.map((bill, i) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-xs border-b border-surface-4/30">
                <span className="text-yellow-300 truncate mr-2">{bill.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={yearlyOverrides[i]}
                    onChange={(e) => updateOverride(setYearlyOverrides, i, e.target.value)}
                    className="w-16 bg-surface-3 border border-yellow-800 rounded px-1 py-0.5 font-mono text-yellow-300 text-right text-xs focus:border-honey-500 focus:outline-none"
                    step="0.01"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Goals */}
          <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Goals</h3>
            {defaults.goals.map((goal, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs py-0.5">
                <span className="text-honey-500 mt-0.5">•</span>
                <span className="text-gray-400">{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
