import React from 'react';
import StatCard from '../components/StatCard';

export default function Overview({ mtd, leakageReport, bofaData, aiBrief, briefLoading, onRefresh }) {
  const totalLeakage = leakageReport?.reduce((sum, c) => sum + c.mtdSpend, 0) || 0;
  const projectedMonthEnd = mtd && mtd.dayOfMonth > 0
    ? Math.round((mtd.totalSpend / mtd.dayOfMonth) * mtd.daysInMonth)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-honey-400 flex items-center gap-2">
            🍯 MoneyHoney
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-surface-2 text-gray-300 rounded-lg hover:bg-surface-3 transition-colors text-sm border border-surface-3"
        >
          Refresh
        </button>
      </div>

      {/* AI Brief */}
      <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-honey-400 font-semibold text-sm">AI BRIEF</span>
          {briefLoading && (
            <div className="w-3 h-3 border border-honey-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <p className="text-gray-200 leading-relaxed">
          {briefLoading
            ? 'Analyzing your spending...'
            : aiBrief || 'Add your Anthropic API key in Settings to enable AI briefs.'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="MTD Spend"
          value={`$${(mtd?.totalSpend || 0).toLocaleString()}`}
          sublabel={`Day ${mtd?.dayOfMonth || '—'} of ${mtd?.daysInMonth || '—'}`}
          color="default"
        />
        <StatCard
          label="Projected Month-End"
          value={`$${projectedMonthEnd.toLocaleString()}`}
          sublabel="At current pace"
          color={projectedMonthEnd > 5200 ? 'red' : projectedMonthEnd > 4500 ? 'amber' : 'green'}
        />
        <StatCard
          label="Leakage Total"
          value={`$${totalLeakage.toFixed(0)}`}
          sublabel="4 tracked categories"
          color={totalLeakage > 400 ? 'red' : totalLeakage > 300 ? 'amber' : 'green'}
        />
        <StatCard
          label="BofA Balance"
          value={`$${(bofaData?.currentBalance || 0).toLocaleString()}`}
          sublabel={bofaData?.projections?.currentPace?.date ? `Payoff: ${bofaData.projections.currentPace.date}` : ''}
          color="honey"
        />
      </div>

      {/* Leakage Quick View */}
      <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Leakage Snapshot
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(!leakageReport || leakageReport.length === 0) && (
            <p className="text-sm text-gray-500 col-span-2">No leakage data yet. Refresh to load.</p>
          )}
          {leakageReport?.map((cat) => {
            const colorClass = cat.color === 'red' ? 'text-red-400' : cat.color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
            return (
              <div key={cat.category} className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
                <span className="text-sm text-gray-300">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm font-medium ${colorClass}`}>
                    ${(cat.mtdSpend ?? 0).toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-500">/ ${(cat.baseline ?? 0).toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BofA Quick View */}
      {bofaData && (
        <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            BofA Paydown
          </h3>
          <div className="flex items-center gap-8">
            <div>
              <span className="text-xs text-gray-500">MTD Payments</span>
              <p className="text-lg font-mono text-emerald-400">${(bofaData.mtdPayments ?? 0).toFixed(0)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Monthly Velocity</span>
              <p className="text-lg font-mono text-gray-200">${(bofaData.velocity ?? 0).toFixed(0)}/mo</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Payoff at Current Pace</span>
              <p className="text-lg font-mono text-honey-400">{bofaData.projections?.currentPace?.date ?? '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">If Leakage = $0</span>
              <p className="text-lg font-mono text-emerald-400">{bofaData.projections?.zeroLeakage?.date ?? '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
