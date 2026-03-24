import React, { useState } from 'react';
import StatCard from '../components/StatCard';

export default function BofA({ bofaData, goals, onUpdateBalance }) {
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const handleSaveBalance = () => {
    const num = parseFloat(balanceInput);
    if (!isNaN(num) && num >= 0) {
      onUpdateBalance(num);
      setEditingBalance(false);
    }
  };

  if (!bofaData) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center h-64 text-gray-400">
        <p>No BofA data available yet. Connect YNAB first.</p>
      </div>
    );
  }

  const { currentBalance = 0, velocity = 0, mtdPayments = 0, projections = {} } = bofaData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">BofA Paydown Dashboard</h2>
          <p className="text-sm text-gray-500">Kill the debt. Every dollar counts.</p>
        </div>
      </div>

      {/* Balance display */}
      <div className="bg-surface-1 rounded-xl p-6 border border-surface-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Current Balance</span>
            {editingBalance ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl text-gray-400">$</span>
                <input
                  type="number"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="bg-surface-3 border border-surface-4 rounded px-3 py-1 text-2xl font-mono text-gray-100 w-40 focus:outline-none focus:border-honey-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveBalance}
                  className="px-3 py-1 bg-honey-600 text-white rounded text-sm hover:bg-honey-500"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingBalance(false)}
                  className="px-3 py-1 bg-surface-3 text-gray-400 rounded text-sm hover:bg-surface-4"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-4xl font-mono font-bold text-red-400">
                  ${currentBalance.toLocaleString()}
                </span>
                <button
                  onClick={() => { setBalanceInput(String(currentBalance)); setEditingBalance(true); }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Update
                </button>
              </div>
            )}
            {goals?.bofaLastUpdated && (
              <span className="text-xs text-gray-600 mt-1 block">
                Last updated: {goals.bofaLastUpdated}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Target</span>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">$0</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-surface-3 rounded-full h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-1000"
              style={{ width: `${Math.max(5, Math.min(100, 100 - (currentBalance / (goals?.bofaOriginalBalance || 13500)) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">$13,500</span>
            <span className="text-xs text-gray-500">$0 PAID OFF</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="MTD Payments"
          value={`$${mtdPayments.toFixed(0)}`}
          sublabel="This month so far"
          color="green"
        />
        <StatCard
          label="Monthly Velocity"
          value={`$${velocity.toFixed(0)}/mo`}
          sublabel="3-month average"
          color="default"
        />
        <StatCard
          label="Payoff Date"
          value={projections?.currentPace?.date ?? '—'}
          sublabel={`${projections?.currentPace?.months ?? '—'} months`}
          color="honey"
        />
        <StatCard
          label="If Leakage = $0"
          value={projections?.zeroLeakage?.date ?? '—'}
          sublabel={`${projections?.monthsSaved ?? 0} months sooner`}
          color="green"
        />
      </div>

      {/* Motivation box */}
      {(projections?.monthsSaved ?? 0) > 0 && (
        <div className="bg-honey-900/20 border border-honey-700/30 rounded-xl p-5">
          <p className="text-honey-300">
            Eliminating leakage would pay off BofA <strong>{projections.monthsSaved} months sooner</strong>.
            That's <strong>{projections?.zeroLeakage?.date ?? '—'}</strong> instead of{' '}
            <strong>{projections?.currentPace?.date ?? '—'}</strong>.
          </p>
        </div>
      )}

      {/* Recent payments */}
      {bofaData.recentPayments && bofaData.recentPayments.length > 0 && (
        <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent BofA Payments
          </h3>
          <div className="space-y-2">
            {bofaData.recentPayments.map((txn, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-gray-400 font-mono">{txn.date}</span>
                <span className="text-emerald-400 font-mono">
                  ${Math.abs((txn.amount ?? 0) / 1000).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
