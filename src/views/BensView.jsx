import { useState, useEffect, useMemo } from 'react';
import { BUDGET_DATA } from '../shared/constants';

const fmt = (n) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Storage helpers
const store = {
  get: async (key) => {
    if (window.electronStore) return window.electronStore.get(key);
    const val = localStorage.getItem('mh_' + key);
    return val ? JSON.parse(val) : undefined;
  },
};

export default function BensView() {
  const [bills, setBills] = useState(BUDGET_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await store.get('nikkiBills');
      if (saved) setBills(saved);
      setLoaded(true);
    })();
  }, []);

  const monthly = bills.income?.monthly || BUDGET_DATA.income.monthly;
  const biweekly = bills.income?.biweekly || BUDGET_DATA.income.biweekly;

  // Build one unified list: every bill as a monthly amount
  const allBills = useMemo(() => {
    const items = [];

    // Credit cards
    (bills.creditCards || []).forEach((c) => {
      items.push({ name: c.name, amount: c.payment, category: 'Credit Cards', due: c.dueDate, note: c.balance > 0 ? `Bal: ${fmt(c.balance)}` : '' });
    });

    // Monthly bills
    (bills.monthlyBills || []).forEach((b) => {
      items.push({ name: b.name, amount: b.amount, category: 'Monthly Bills', due: b.dueDate });
    });

    // Quarterly bills ÷ 3
    (bills.quarterlyBills || []).forEach((b) => {
      const perMonth = Math.round((b.amount / 3) * 100) / 100;
      const dueLabel = (b.dueMonths || []).map((m) => ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]).join(', ');
      items.push({ name: b.name, amount: perMonth, category: 'Quarterly (÷3)', due: dueLabel, note: `${fmt(b.amount)}/qtr`, isQuarterly: true });
    });

    // Yearly bills ÷ 12
    (bills.yearlyBills || []).forEach((b) => {
      const perMonth = Math.round((b.amount / 12) * 100) / 100;
      items.push({ name: b.name, amount: perMonth, category: 'Yearly (÷12)', due: b.dueMonth, note: `${fmt(b.amount)}/yr`, isYearly: true });
    });

    return items;
  }, [bills]);

  // Group by category
  const categories = useMemo(() => {
    const cats = {};
    for (const item of allBills) {
      if (!cats[item.category]) cats[item.category] = [];
      cats[item.category].push(item);
    }
    return cats;
  }, [allBills]);

  // Totals
  const totalBills = allBills.reduce((s, b) => s + b.amount, 0);
  const leftover = monthly - totalBills;
  const foodAndFun = bills.spendTarget?.foodAndFun || BUDGET_DATA.spendTarget.foodAndFun;
  const afterFoodFun = leftover - foodAndFun;

  // Running balance through all bills
  const runningBalance = useMemo(() => {
    let remaining = monthly;
    return allBills.map((b) => {
      remaining -= b.amount;
      return Math.round(remaining * 100) / 100;
    });
  }, [monthly, allBills]);

  // Category styling
  const catStyle = {
    'Credit Cards': { badge: 'bg-red-900/40 text-red-300', icon: '💳' },
    'Monthly Bills': { badge: 'bg-blue-900/40 text-blue-300', icon: '📋' },
    'Quarterly (÷3)': { badge: 'bg-yellow-900/40 text-yellow-300', icon: '📅' },
    'Yearly (÷12)': { badge: 'bg-purple-900/40 text-purple-300', icon: '📆' },
  };

  if (!loaded) return <div className="flex items-center justify-center h-64"><span className="text-gray-500">Loading...</span></div>;

  let globalIdx = 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Ben&apos;s View</h1>
          <p className="text-sm text-gray-500 mt-1">Monthly budget &mdash; everything divided out, one page</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Income</p>
          <p className="text-2xl font-mono font-semibold text-emerald-400">{fmt(monthly)}</p>
          <p className="text-xs text-gray-500">{fmt(biweekly)} biweekly</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Total Bills" value={totalBills} color="amber" />
        <SummaryCard label="Leftover" value={leftover} color={leftover >= 0 ? 'emerald' : 'red'} />
        <SummaryCard label="Food & Fun" value={foodAndFun} color="orange" />
        <SummaryCard label="After Everything" value={afterFoodFun} color={afterFoodFun >= 0 ? 'honey' : 'red'} />
      </div>

      {/* The big table — every bill, grouped, with running balance */}
      <div className="bg-surface-2 rounded-xl border border-surface-3 overflow-hidden">
        {/* Header */}
        <div className="bg-surface-3 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">All Monthly Obligations</span>
          <span className="text-xs text-gray-500">{allBills.length} items</span>
        </div>

        {/* Column headers */}
        <div className="flex items-center px-5 py-2 border-b border-surface-4 text-xs text-gray-500 uppercase">
          <span className="w-6"></span>
          <span className="flex-1">Bill</span>
          <span className="w-16 text-right">Due</span>
          <span className="w-20 text-right">Amount</span>
          <span className="w-20 text-right">Note</span>
          <span className="w-28 text-right">Remaining</span>
        </div>

        {/* Grouped rows */}
        <div className="px-5">
          {Object.entries(categories).map(([catName, items]) => {
            const style = catStyle[catName] || { badge: 'bg-surface-3 text-gray-400', icon: '📋' };
            const catTotal = items.reduce((s, b) => s + b.amount, 0);

            return (
              <div key={catName}>
                {/* Category header */}
                <div className="flex items-center justify-between py-2 mt-3 mb-1 border-b border-surface-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${style.badge}`}>{catName}</span>
                  </div>
                  <span className="font-mono text-xs text-gray-400">{fmt(catTotal)}/mo</span>
                </div>

                {/* Bill rows */}
                {items.map((bill) => {
                  const remaining = runningBalance[globalIdx];
                  globalIdx++;
                  const isDanger = remaining < 0;
                  const isWarning = remaining >= 0 && remaining < 1000;

                  return (
                    <div key={catName + '-' + bill.name} className="flex items-center py-1.5 border-b border-surface-4/30 text-sm">
                      <span className="w-6"></span>
                      <span className="flex-1 text-gray-300 text-xs">{bill.name}</span>
                      <span className="w-16 text-right text-xs text-gray-500">{bill.due || ''}</span>
                      <span className="w-20 text-right font-mono text-xs text-gray-200">{fmt(bill.amount)}</span>
                      <span className="w-20 text-right text-xs text-gray-500">{bill.note || ''}</span>
                      <span className={`w-28 text-right font-mono text-sm font-semibold ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {remaining < 0 ? '−' : ''}{fmt(remaining)}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Food & Fun row */}
          <div className="flex items-center py-2 mt-3 border-t-2 border-surface-4">
            <span className="w-6 text-center text-sm">🛒</span>
            <span className="flex-1 text-orange-400 font-semibold text-sm">Food & Fun ({bills.spendTarget?.label || 'Sapphire'})</span>
            <span className="w-16"></span>
            <span className="w-20 text-right font-mono text-sm text-orange-400">{fmt(foodAndFun)}</span>
            <span className="w-20"></span>
            <span className={`w-28 text-right font-mono text-sm font-semibold ${afterFoodFun >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {afterFoodFun < 0 ? '−' : ''}{fmt(afterFoodFun)}
            </span>
          </div>

          {/* Bottom line */}
          <div className="flex items-center py-3 border-t-2 border-honey-600">
            <span className="w-6"></span>
            <span className="flex-1 text-honey-400 font-bold text-base">Monthly Leftover</span>
            <span className="w-16"></span>
            <span className="w-20"></span>
            <span className="w-20"></span>
            <span className={`w-28 text-right font-mono text-lg font-bold ${afterFoodFun >= 0 ? 'text-honey-400' : 'text-red-400'}`}>
              {afterFoodFun < 0 ? '−' : ''}{fmt(afterFoodFun)}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly breakdown */}
      <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Breakdown</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Monthly Food & Fun</p>
            <p className="font-mono text-lg text-orange-400">{fmt(foodAndFun)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Per Week</p>
            <p className="font-mono text-lg text-red-400">{fmt(foodAndFun / 4)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Per Day</p>
            <p className="font-mono text-lg text-gray-300">{fmt(foodAndFun / 30)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Savings Potential</p>
            <p className={`font-mono text-lg ${afterFoodFun >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{afterFoodFun < 0 ? '−' : ''}{fmt(afterFoodFun)}</p>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Goals</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {(bills.goals || []).map((goal, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs py-0.5">
              <span className="text-honey-500 mt-0.5">•</span>
              <span className="text-gray-400">{goal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    honey: 'text-honey-400',
  };
  return (
    <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-mono font-bold ${colors[color] || 'text-gray-200'}`}>
        {value < 0 ? '−' : ''}{fmt(value)}
      </p>
    </div>
  );
}
