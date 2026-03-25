import { useState, useMemo, useEffect, useCallback } from 'react';
import { BUDGET_DATA } from '../shared/constants';
import { generateSimulation, groupByMonth } from '../engine/simulation';
import BillManager from '../components/BillManager';

const fmt = (n) => '$' + Math.abs(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
};

// Storage helpers
const store = {
  get: async (key) => {
    if (window.electronStore) return window.electronStore.get(key);
    const val = localStorage.getItem('mh_' + key);
    return val ? JSON.parse(val) : undefined;
  },
  set: async (key, val) => {
    if (window.electronStore) return window.electronStore.set(key, val);
    localStorage.setItem('mh_' + key, JSON.stringify(val));
  },
};

export default function Budget() {
  const [view, setView] = useState('simulation'); // 'simulation' | 'manage'
  const [bills, setBills] = useState(null);
  const [startingBalance, setStartingBalance] = useState(2500);
  const [paycheck, setPaycheck] = useState(BUDGET_DATA.income.biweekly);
  const [spendPerPeriod, setSpendPerPeriod] = useState(BUDGET_DATA.spendTarget.foodAndFun / 2);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);
  const [overrides, setOverrides] = useState({});
  const [loaded, setLoaded] = useState(false);

  // Load persisted bills + simulation state
  useEffect(() => {
    (async () => {
      const savedBills = await store.get('nikkiBills');
      setBills(savedBills || BUDGET_DATA);

      const savedSim = await store.get('nikkiSimulation');
      if (savedSim) {
        if (savedSim.startingBalance != null) setStartingBalance(savedSim.startingBalance);
        if (savedSim.paycheck != null) setPaycheck(savedSim.paycheck);
        if (savedSim.spendPerPeriod != null) setSpendPerPeriod(savedSim.spendPerPeriod);
        if (savedSim.overrides) setOverrides(savedSim.overrides);
      }
      setLoaded(true);
    })();
  }, []);

  const saveSim = useCallback(async (updates) => {
    const state = {
      startingBalance: updates.startingBalance ?? startingBalance,
      paycheck: updates.paycheck ?? paycheck,
      spendPerPeriod: updates.spendPerPeriod ?? spendPerPeriod,
      overrides: updates.overrides ?? overrides,
      savedAt: new Date().toISOString(),
    };
    await store.set('nikkiSimulation', state);
  }, [startingBalance, paycheck, spendPerPeriod, overrides]);

  const handleSaveBills = async (newBills) => {
    setBills(newBills);
    await store.set('nikkiBills', newBills);
    // Clear overrides since bill structure changed
    setOverrides({});
    await saveSim({ overrides: {} });
    setView('simulation');
  };

  // Generate simulation from current bills
  const baseSimulation = useMemo(() => {
    if (!bills) return [];
    return generateSimulation({
      startingBalance,
      paycheck,
      creditCards: bills.creditCards || [],
      monthlyBills: bills.monthlyBills || [],
      quarterlyBills: bills.quarterlyBills || [],
      yearlyBills: bills.yearlyBills || [],
      spendPerPeriod,
    });
  }, [startingBalance, paycheck, spendPerPeriod, bills]);

  // Apply per-period overrides
  const simulation = useMemo(() => {
    let balance = startingBalance;
    return baseSimulation.map((period) => {
      const newEvents = period.events.map((event) => {
        const key = `period-${period.index}_${event.name}`;
        const hasOverride = overrides[key] !== undefined;
        let amount = event.amount;
        if (hasOverride) {
          const val = overrides[key];
          amount = event.type === 'payday' ? val : -Math.abs(val);
        }
        balance += amount;
        return { ...event, amount, balance: Math.round(balance * 100) / 100, hasOverride };
      });
      return { ...period, events: newEvents, endBalance: Math.round(balance * 100) / 100 };
    });
  }, [baseSimulation, overrides, startingBalance]);

  const months = useMemo(() => groupByMonth(simulation), [simulation]);
  const currentMonthData = months[selectedMonthIdx] || months[0];

  const lowestBalance = useMemo(() => {
    let lowest = Infinity, lowestDate = null;
    for (const p of simulation) for (const e of p.events) {
      if (e.balance < lowest) { lowest = e.balance; lowestDate = e.date || p.payday; }
    }
    return { amount: lowest, date: lowestDate };
  }, [simulation]);

  const updateOverride = (periodIndex, eventName, val) => {
    const key = `period-${periodIndex}_${eventName}`;
    const next = { ...overrides, [key]: parseFloat(val) || 0 };
    setOverrides(next);
    saveSim({ overrides: next });
  };

  const clearOverride = (periodIndex, eventName) => {
    const key = `period-${periodIndex}_${eventName}`;
    const next = { ...overrides };
    delete next[key];
    setOverrides(next);
    saveSim({ overrides: next });
  };

  const updateAndSave = (setter, field) => (e) => {
    const val = parseFloat(e.target.value) || 0;
    setter(val);
    saveSim({ [field]: val });
  };

  if (!loaded || !bills) {
    return <div className="flex items-center justify-center h-64"><span className="text-gray-500">Loading...</span></div>;
  }

  // Manage Bills view
  if (view === 'manage') {
    return (
      <div>
        <div className="max-w-4xl mx-auto mb-4">
          <button onClick={() => setView('simulation')} className="text-sm text-gray-400 hover:text-honey-400 transition-colors">
            ← Back to Simulation
          </button>
        </div>
        <BillManager bills={bills} onSave={handleSaveBills} />
      </div>
    );
  }

  // Simulation view
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400">Nikki&apos;s View</h1>
          <p className="text-sm text-gray-500 mt-1">12-month simulation &mdash; edit any amount, changes saved automatically</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('manage')}
            className="px-4 py-2 bg-surface-2 text-honey-400 rounded-lg text-sm hover:bg-surface-3 transition-colors border border-surface-3"
          >
            ⚙ Manage Bills
          </button>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Lowest Point</p>
            <p className={`font-mono font-bold text-lg ${lowestBalance.amount >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {lowestBalance.amount < 0 ? '−' : ''}{fmt(lowestBalance.amount)}
            </p>
            <p className="text-xs text-gray-500">{lowestBalance.date ? fmtDate(lowestBalance.date) : ''}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 flex items-center gap-6 flex-wrap">
        <ControlInput label="Starting Balance" value={startingBalance} onChange={updateAndSave(setStartingBalance, 'startingBalance')} color="emerald" />
        <ControlInput label="Paycheck" value={paycheck} onChange={updateAndSave(setPaycheck, 'paycheck')} color="emerald" />
        <ControlInput label="Food & Fun / Check" value={spendPerPeriod} onChange={updateAndSave(setSpendPerPeriod, 'spendPerPeriod')} color="orange" />
        <div className="ml-auto">
          <button
            onClick={() => { setOverrides({}); saveSim({ overrides: {} }); }}
            className="px-3 py-1.5 bg-surface-3 text-gray-400 rounded-lg text-xs hover:bg-surface-4 hover:text-gray-200 transition-colors"
          >
            Reset Overrides
          </button>
        </div>
      </div>

      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {months.map((m, i) => {
          const endBal = m.periods[m.periods.length - 1]?.endBalance ?? 0;
          const sel = i === selectedMonthIdx;
          return (
            <button
              key={m.key}
              onClick={() => setSelectedMonthIdx(i)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                sel ? 'bg-honey-600 text-white' : 'bg-surface-2 text-gray-400 hover:bg-surface-3 border border-surface-3'
              }`}
            >
              <div>{m.label.split(' ')[0].substring(0, 3)} {m.label.split(' ')[1]?.substring(2)}</div>
              <div className={`font-mono text-xs mt-0.5 ${endBal >= 0 ? (sel ? 'text-white' : 'text-emerald-400') : 'text-red-400'}`}>
                {endBal < 0 ? '−' : ''}{fmt(endBal)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pay periods */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{currentMonthData?.label}</h2>
        {currentMonthData?.periods.map((period) => (
          <div key={period.index} className="bg-surface-2 rounded-xl border border-surface-3 overflow-hidden">
            <div className="bg-surface-3 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-honey-400 font-semibold text-sm">💰 Payday: {fmtDate(period.payday)}</span>
                <span className="text-xs text-gray-500">→ {fmtDate(period.periodEnd)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">End:</span>
                <span className={`font-mono font-bold text-base ${period.endBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {period.endBalance < 0 ? '−' : ''}{fmt(period.endBalance)}
                </span>
              </div>
            </div>
            <div className="flex items-center px-4 py-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
              <span className="w-6"></span>
              <span className="flex-1">Description</span>
              <span className="w-16 text-right">Date</span>
              <span className="w-24 text-right">Amount</span>
              <span className="w-28 text-right">Balance</span>
              <span className="w-6"></span>
            </div>
            <div className="px-4">
              {period.events.map((event, ei) => (
                <SimRow key={ei} event={event} periodIndex={period.index} onOverride={updateOverride} onClear={clearOverride} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Goals */}
      <div className="bg-surface-2 rounded-xl p-4 border border-surface-3">
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

function SimRow({ event, periodIndex, onOverride, onClear }) {
  const isPayday = event.type === 'payday';
  const isSpend = event.type === 'spend';
  const isQ = event.type === 'quarterly';
  const isY = event.type === 'yearly';
  const isDanger = event.balance < 0;
  const isWarning = event.balance >= 0 && event.balance < 500;

  let icon = '📋';
  if (isPayday) icon = '💰';
  else if (event.type === 'credit') icon = '💳';
  else if (isSpend) icon = '🛒';
  else if (isQ) icon = '📅';
  else if (isY) icon = '📆';

  const rowBg = isPayday ? 'bg-emerald-950/30' : isDanger ? 'bg-red-950/30' : (isQ || isY) ? 'bg-yellow-950/20' : '';
  const nameColor = isPayday ? 'text-emerald-400 font-semibold' : isSpend ? 'text-orange-400' : (isQ || isY) ? 'text-yellow-300' : 'text-gray-300';

  return (
    <div className={`flex items-center py-1.5 border-b border-surface-4/30 text-sm ${rowBg}`}>
      <span className="w-6 text-center text-xs">{icon}</span>
      <span className={`flex-1 text-xs ${nameColor}`}>
        {event.name}
        {(isQ || isY) && <span className="text-yellow-500 text-xs ml-1">({event.type})</span>}
      </span>
      <span className="w-16 text-right text-xs text-gray-500">{event.date ? fmtDate(event.date) : ''}</span>
      <div className="w-24 flex items-center justify-end gap-0.5">
        <span className={`text-xs ${event.amount >= 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
          {event.amount >= 0 ? '+$' : '−$'}
        </span>
        <input
          type="number"
          value={Math.abs(event.amount)}
          onChange={(e) => onOverride(periodIndex, event.name, parseFloat(e.target.value) || 0)}
          className={`w-16 bg-surface-3 border rounded px-1 py-0.5 font-mono text-right text-xs focus:border-honey-500 focus:outline-none ${
            event.hasOverride ? 'border-honey-600 text-honey-300' : (isQ || isY) ? 'border-yellow-800 text-yellow-300' : 'border-surface-4 text-gray-200'
          }`}
          step="0.01"
        />
      </div>
      <span className={`w-28 text-right font-mono text-sm font-semibold ${isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
        {event.balance < 0 ? '−' : ''}{fmt(event.balance)}
      </span>
      <span className="w-6 text-center">
        {event.hasOverride && (
          <button onClick={() => onClear(periodIndex, event.name)} className="text-gray-600 hover:text-gray-300 text-xs" title="Reset">↺</button>
        )}
      </span>
    </div>
  );
}

function ControlInput({ label, value, onChange, color }) {
  const c = color === 'orange' ? 'text-orange-400' : 'text-emerald-400';
  return (
    <div>
      <label className="text-xs text-gray-500 uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <span className={`${c} text-sm`}>$</span>
        <input type="number" value={value} onChange={onChange}
          className={`w-24 bg-surface-3 border border-surface-4 rounded px-2 py-1 font-mono ${c} text-right text-sm focus:border-honey-500 focus:outline-none`} />
      </div>
    </div>
  );
}
