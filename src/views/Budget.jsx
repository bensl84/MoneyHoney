import { useState, useMemo } from 'react';
import { BUDGET_DATA } from '../shared/constants';

const fmt = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Budget() {
  const defaults = BUDGET_DATA;

  // Editable state — credit card payments
  const [cardPayments, setCardPayments] = useState(
    defaults.creditCards.map((c) => c.payment)
  );
  // Editable state — monthly bill amounts
  const [monthlyAmounts, setMonthlyAmounts] = useState(
    defaults.monthlyBills.map((b) => b.amount)
  );
  // Editable state — food & fun target
  const [foodAndFun, setFoodAndFun] = useState(defaults.spendTarget.foodAndFun);
  // Editable state — income
  const [biweekly, setBiweekly] = useState(defaults.income.biweekly);

  const monthly = biweekly * 2;

  // Totals
  const cardPaymentsTotal = cardPayments.reduce((s, p) => s + p, 0);
  const cardBalanceTotal = defaults.creditCards.reduce((s, c) => s + c.balance, 0);
  const monthlyTotal = monthlyAmounts.reduce((s, a) => s + a, 0);
  const quarterlyTotal = defaults.quarterlyBills.reduce((s, b) => s + b.amount, 0);
  const quarterlyMonthly = quarterlyTotal / 3;
  const yearlyTotal = defaults.yearlyBills.reduce((s, b) => s + b.amount, 0);
  const yearlyMonthly = yearlyTotal / 12;

  // Waterfall
  const afterCards = monthly - cardPaymentsTotal;
  const afterMonthly = afterCards - monthlyTotal;
  const afterQuarterly = afterMonthly - quarterlyMonthly;
  const afterYearly = afterQuarterly - yearlyMonthly;
  const weeklySpend = foodAndFun / 4;

  // Running remaining for monthly bills
  const monthlyRunning = useMemo(() => {
    let remaining = afterCards;
    return monthlyAmounts.map((amt) => {
      remaining -= amt;
      return remaining;
    });
  }, [afterCards, monthlyAmounts]);

  const updateCardPayment = (idx, val) => {
    const next = [...cardPayments];
    next[idx] = parseFloat(val) || 0;
    setCardPayments(next);
  };

  const updateMonthlyAmount = (idx, val) => {
    const next = [...monthlyAmounts];
    next[idx] = parseFloat(val) || 0;
    setMonthlyAmounts(next);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Nikki&apos;s View</h1>
          <p className="text-sm text-gray-500 mt-1">Between 2 paydays &mdash; adjust amounts to see how they affect your leftover</p>
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

      {/* Row 1: Credit Cards + Income Waterfall */}
      <div className="grid grid-cols-2 gap-4">
        {/* Credit Cards — editable payments */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Credit Cards & Debt</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-surface-4">
                <th className="text-left pb-2">Name</th>
                <th className="text-center pb-2">Due</th>
                <th className="text-right pb-2">Payment</th>
                <th className="text-right pb-2">Balance</th>
                <th className="text-right pb-2">Rate</th>
              </tr>
            </thead>
            <tbody>
              {defaults.creditCards.map((card, i) => (
                <tr key={card.name} className="border-b border-surface-4/50">
                  <td className="py-2 text-gray-200">{card.name}</td>
                  <td className="py-2 text-center text-gray-400 font-mono text-xs">{card.dueDate}</td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        value={cardPayments[i]}
                        onChange={(e) => updateCardPayment(i, e.target.value)}
                        className="w-20 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono text-amber-400 text-right text-xs focus:border-honey-500 focus:outline-none"
                        step="0.01"
                      />
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono text-gray-300 text-xs">{card.balance > 0 ? fmt(card.balance) : '—'}</td>
                  <td className="py-2 text-right">
                    {card.rate === '0%' ? (
                      <span className="text-emerald-400 text-xs font-medium">0% APR</span>
                    ) : (
                      <span className="text-gray-400 text-xs">{card.rate}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t-2 border-surface-4">
                <td className="pt-3 text-gray-300">Totals</td>
                <td></td>
                <td className="pt-3 text-right font-mono text-amber-400 text-xs">{fmt(cardPaymentsTotal)}</td>
                <td className="pt-3 text-right font-mono text-gray-300 text-xs">{fmt(cardBalanceTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          {defaults.creditCards.some((c) => c.notes) && (
            <div className="mt-3 space-y-1">
              {defaults.creditCards.filter((c) => c.notes).map((c) => (
                <p key={c.name} className="text-xs text-gray-500 italic">{c.name}: {c.notes}</p>
              ))}
            </div>
          )}
        </div>

        {/* Income Waterfall */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Income Waterfall</h2>
          {/* Column headers */}
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
            <span></span>
            <div className="flex items-center gap-3">
              <span className="w-20 text-right">Biweekly</span>
              <span className="w-24 text-right">Monthly</span>
            </div>
          </div>
          <div className="space-y-0">
            <WaterfallRow label="Income" biweekly={biweekly} monthly={monthly} isFirst />
            <WaterfallRow label="Card Payments" biweekly={cardPaymentsTotal / 2} monthly={afterCards} note="After cards" />
            <WaterfallRow label="Monthly Bills" biweekly={monthlyTotal / 2} monthly={afterMonthly} note="After monthlys" />
            <WaterfallRow label="Quarterly" biweekly={quarterlyMonthly / 2} monthly={afterQuarterly} note="After quarterlys" />
            <WaterfallRow label="Yearly" biweekly={yearlyMonthly / 2} monthly={afterYearly} note="After yearlys" />
            <div className="border-t-2 border-honey-600 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-honey-400">Leftover</span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold w-20 text-right ${afterYearly / 2 >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
                    {fmt(afterYearly / 2)}
                  </span>
                  <span className={`text-lg font-mono font-bold w-24 text-right ${afterYearly >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
                    {fmt(afterYearly)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-4 space-y-2">
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
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-400">Weekly Spend Max</span>
                <span className="font-mono text-sm font-semibold text-red-400">{fmt(weeklySpend)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-4">
                <span className="text-xs text-gray-500">After food & fun</span>
                <span className={`font-mono text-xs ${afterYearly - foodAndFun >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(afterYearly - foodAndFun)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly + Quarterly + Yearly bills */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Bills — editable with running remaining */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Monthly</h2>
            <span className="text-xs font-mono text-gray-500 bg-surface-3 px-2 py-0.5 rounded">{fmt(monthlyTotal)}</span>
          </div>
          <div className="space-y-0">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
              <span>Bill</span>
              <div className="flex items-center gap-2">
                <span className="w-16 text-right">Amount</span>
                <span className="w-20 text-right">Left</span>
              </div>
            </div>
            {defaults.monthlyBills.map((bill, i) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-sm border-b border-surface-4/30">
                <div className="flex items-center gap-1 truncate mr-1">
                  <span className="text-gray-300 truncate text-xs">{bill.name}</span>
                  {bill.dueDate && <span className="text-gray-600 text-xs shrink-0">({bill.dueDate})</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={monthlyAmounts[i]}
                    onChange={(e) => updateMonthlyAmount(i, e.target.value)}
                    className="w-16 bg-surface-3 border border-surface-4 rounded px-1 py-0.5 font-mono text-gray-200 text-right text-xs focus:border-honey-500 focus:outline-none"
                    step="0.01"
                  />
                  <span className={`font-mono text-xs w-20 text-right ${monthlyRunning[i] >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(monthlyRunning[i])}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-surface-4 font-semibold text-sm">
            <span className="text-gray-300">Total</span>
            <span className="font-mono text-amber-400">{fmt(monthlyTotal)}</span>
          </div>
        </div>

        {/* Quarterly Bills */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quarterly</h2>
            <span className="text-xs font-mono text-gray-500 bg-surface-3 px-2 py-0.5 rounded">{fmt(quarterlyMonthly)}/mo</span>
          </div>
          <div className="space-y-1">
            {defaults.quarterlyBills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-sm border-b border-surface-4/30">
                <span className="text-gray-300">{bill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{bill.dueMonth}</span>
                  <span className="font-mono text-gray-200 w-16 text-right">{fmt(bill.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-surface-4 font-semibold text-sm">
            <span className="text-gray-300">Per Quarter</span>
            <span className="font-mono text-amber-400">{fmt(quarterlyTotal)}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-gray-500">Monthly equivalent</span>
            <span className="font-mono text-gray-400">{fmt(quarterlyMonthly)}</span>
          </div>
        </div>

        {/* Yearly Bills */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Yearly</h2>
            <span className="text-xs font-mono text-gray-500 bg-surface-3 px-2 py-0.5 rounded">{fmt(yearlyMonthly)}/mo</span>
          </div>
          <div className="space-y-1">
            {defaults.yearlyBills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-sm border-b border-surface-4/30">
                <span className="text-gray-300">{bill.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{bill.dueMonth}</span>
                  <span className="font-mono text-gray-200 w-16 text-right">{fmt(bill.amount)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-surface-4 font-semibold text-sm">
            <span className="text-gray-300">Per Year</span>
            <span className="font-mono text-amber-400">{fmt(yearlyTotal)}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-gray-500">Monthly equivalent</span>
            <span className="font-mono text-gray-400">{fmt(yearlyMonthly)}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Statement Exercise */}
      <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Next Month Projection</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Monthly Income</p>
            <p className="text-lg font-mono text-emerald-400">{fmt(monthly)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Statement Balance Due</p>
            <p className="text-lg font-mono text-orange-400">{fmt(foodAndFun)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">After Statement</p>
            <p className="text-lg font-mono text-gray-300">{fmt(monthly - foodAndFun)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-4 pt-3 border-t border-surface-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Credit + Monthly Bills</p>
            <p className="font-mono text-amber-400">{fmt((cardPaymentsTotal + monthlyTotal + quarterlyMonthly + yearlyMonthly))}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Left to Spend / Save / Overspend</p>
            <p className={`text-lg font-mono font-bold ${monthly - foodAndFun - (cardPaymentsTotal + monthlyTotal + quarterlyMonthly + yearlyMonthly) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(monthly - foodAndFun - (cardPaymentsTotal + monthlyTotal + quarterlyMonthly + yearlyMonthly))}
            </p>
          </div>
        </div>
      </div>

      {/* Row 4: Goals */}
      <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Goals</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {defaults.goals.map((goal, i) => (
            <div key={i} className="flex items-start gap-2 text-sm py-1">
              <span className="text-honey-500 mt-0.5">•</span>
              <span className="text-gray-300">{goal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WaterfallRow({ label, biweekly, monthly, isFirst }) {
  const biweeklyColor = isFirst ? 'text-emerald-400' : 'text-gray-300';
  const monthlyColor = isFirst ? 'text-emerald-400' : (monthly >= 0 ? 'text-emerald-400' : 'text-red-400');

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-4/30">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-xs ${biweeklyColor} w-20 text-right`}>
          {isFirst ? fmt(biweekly) : '−' + fmt(biweekly)}
        </span>
        <span className={`font-mono text-xs ${monthlyColor} bg-surface-3 px-2 py-0.5 rounded w-24 text-right`}>
          {isFirst ? fmt(monthly) : fmt(monthly)}
        </span>
      </div>
    </div>
  );
}
