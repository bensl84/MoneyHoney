import { BUDGET_DATA } from '../shared/constants';

const fmt = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtWhole = (n) => '$' + Math.round(n ?? 0).toLocaleString('en-US');

export default function Budget() {
  const {
    income,
    creditCards,
    monthlyBills,
    quarterlyBills,
    yearlyBills,
    spendTarget,
    goals,
  } = BUDGET_DATA;

  const cardPaymentsTotal = creditCards.reduce((s, c) => s + c.payment, 0);
  const cardBalanceTotal = creditCards.reduce((s, c) => s + c.balance, 0);
  const monthlyTotal = monthlyBills.reduce((s, b) => s + b.amount, 0);
  const quarterlyTotal = quarterlyBills.reduce((s, b) => s + b.amount, 0);
  const quarterlyMonthly = quarterlyTotal / 3;
  const yearlyTotal = yearlyBills.reduce((s, b) => s + b.amount, 0);
  const yearlyMonthly = yearlyTotal / 12;

  // Waterfall
  const afterCards = income.monthly - cardPaymentsTotal;
  const afterMonthly = afterCards - monthlyTotal;
  const afterQuarterly = afterMonthly - quarterlyMonthly;
  const afterYearly = afterQuarterly - yearlyMonthly;
  const weeklySpend = spendTarget.foodAndFun / 4;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Monthly Budget</h1>
          <p className="text-sm text-gray-500 mt-1">Nikki&apos;s required expenses breakdown</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Income</p>
          <p className="text-2xl font-mono font-semibold text-emerald-400">{fmt(income.monthly)}</p>
          <p className="text-xs text-gray-500">{fmt(income.biweekly)} biweekly</p>
        </div>
      </div>

      {/* Row 1: Credit Cards + Income Waterfall */}
      <div className="grid grid-cols-2 gap-4">
        {/* Credit Cards */}
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
              {creditCards.map((card) => (
                <tr key={card.name} className="border-b border-surface-4/50">
                  <td className="py-2 text-gray-200">{card.name}</td>
                  <td className="py-2 text-center text-gray-400 font-mono text-xs">{card.dueDate}</td>
                  <td className="py-2 text-right font-mono text-amber-400">{fmt(card.payment)}</td>
                  <td className="py-2 text-right font-mono text-gray-300">{card.balance > 0 ? fmt(card.balance) : '—'}</td>
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
                <td className="pt-3 text-right font-mono text-amber-400">{fmt(cardPaymentsTotal)}</td>
                <td className="pt-3 text-right font-mono text-gray-300">{fmt(cardBalanceTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          {creditCards.some((c) => c.notes) && (
            <div className="mt-3 space-y-1">
              {creditCards.filter((c) => c.notes).map((c) => (
                <p key={c.name} className="text-xs text-gray-500 italic">{c.name}: {c.notes}</p>
              ))}
            </div>
          )}
        </div>

        {/* Income Waterfall */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Income Waterfall</h2>
          <div className="space-y-0">
            <WaterfallRow label="Monthly Income" amount={income.monthly} remaining={income.monthly} color="emerald" isFirst />
            <WaterfallRow label="Card Payments" amount={-cardPaymentsTotal} remaining={afterCards} note="After cards" />
            <WaterfallRow label="Monthly Bills" amount={-monthlyTotal} remaining={afterMonthly} note="After monthlys" />
            <WaterfallRow label="Quarterly (÷3)" amount={-quarterlyMonthly} remaining={afterQuarterly} note="After quarterlys" />
            <WaterfallRow label="Yearly (÷12)" amount={-yearlyMonthly} remaining={afterYearly} note="After yearlys" />
            <div className="border-t-2 border-honey-600 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-honey-400">Leftover</span>
                <span className={`text-xl font-mono font-bold ${afterYearly >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
                  {fmt(afterYearly)}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-400">Food & Fun ({spendTarget.label})</span>
                <span className="font-mono text-sm text-orange-400">{fmt(spendTarget.foodAndFun)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-400">Weekly Spend Max</span>
                <span className="font-mono text-sm font-semibold text-red-400">{fmt(weeklySpend)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-4">
                <span className="text-xs text-gray-500">After food & fun</span>
                <span className={`font-mono text-xs ${afterYearly - spendTarget.foodAndFun >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmt(afterYearly - spendTarget.foodAndFun)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly + Quarterly + Yearly bills */}
      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Bills */}
        <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Monthly</h2>
            <span className="text-xs font-mono text-gray-500 bg-surface-3 px-2 py-0.5 rounded">{fmt(monthlyTotal)}</span>
          </div>
          <div className="space-y-1">
            {monthlyBills.map((bill) => (
              <div key={bill.name} className="flex items-center justify-between py-1 text-sm border-b border-surface-4/30">
                <span className="text-gray-300 truncate mr-2">{bill.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {bill.dueDate && <span className="text-xs text-gray-500">{bill.dueDate}</span>}
                  <span className="font-mono text-gray-200 w-16 text-right">{fmt(bill.amount)}</span>
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
            {quarterlyBills.map((bill) => (
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
            {yearlyBills.map((bill) => (
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

      {/* Row 3: Goals */}
      <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Goals</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {goals.map((goal, i) => (
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

function WaterfallRow({ label, amount, remaining, note, color, isFirst }) {
  const amountColor = isFirst ? 'text-emerald-400' : 'text-red-400';
  const remainingColor = remaining >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className={`flex items-center justify-between py-2 ${!isFirst ? 'border-b border-surface-4/30' : 'border-b border-surface-4/30'}`}>
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex items-center gap-4">
        <span className={`font-mono text-sm ${amountColor}`}>
          {amount >= 0 ? fmt(amount) : '−' + fmt(Math.abs(amount))}
        </span>
        {!isFirst && (
          <span className={`font-mono text-xs ${remainingColor} bg-surface-3 px-2 py-0.5 rounded w-24 text-right`}>
            {fmt(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}
