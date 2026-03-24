import React from 'react';
import CategoryBar from '../components/CategoryBar';

export default function Leakage({ leakageReport, goals }) {
  const totalMTD = leakageReport?.reduce((sum, c) => sum + c.mtdSpend, 0) || 0;
  const totalBaseline = leakageReport?.reduce((sum, c) => sum + c.baseline, 0) || 0;
  const totalBofAImpact = leakageReport?.reduce((sum, c) => sum + c.bofaImpact, 0) || 0;
  const combinedLimit = goals?.leakageLimits
    ? Object.values(goals.leakageLimits).reduce((s, v) => s + v, 0)
    : 400;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Leakage Tracker</h2>
        <p className="text-sm text-gray-500">Off-budget spending eating into your BofA paydown</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Total MTD</span>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalMTD > combinedLimit ? 'text-red-400' : 'text-emerald-400'}`}>
            ${totalMTD.toFixed(0)}
          </p>
          <span className="text-xs text-gray-500">limit: ${combinedLimit}</span>
        </div>
        <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">vs Baseline</span>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalMTD > totalBaseline ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalMTD > totalBaseline ? '+' : '-'}${Math.abs(totalMTD - totalBaseline).toFixed(0)}
          </p>
          <span className="text-xs text-gray-500">baseline: ${totalBaseline.toFixed(0)}/mo</span>
        </div>
        <div className="bg-surface-2 rounded-xl p-4 border border-surface-3 text-center">
          <span className="text-xs text-gray-500 uppercase tracking-wider">BofA Impact</span>
          <p className={`text-2xl font-mono font-bold mt-1 ${totalBofAImpact > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            ${totalBofAImpact.toFixed(0)}
          </p>
          <span className="text-xs text-gray-500">not going to debt paydown</span>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-3">
        {(!leakageReport || leakageReport.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-4">No leakage data yet. Connect YNAB and refresh to load data.</p>
        )}
        {leakageReport?.map((cat) => (
          <CategoryBar
            key={cat.category}
            category={cat.category}
            mtdSpend={cat.mtdSpend}
            baseline={cat.baseline}
            delta={cat.delta}
            bofaImpact={cat.bofaImpact}
            color={cat.color}
          />
        ))}
      </div>

      {/* Interpretation */}
      {totalBofAImpact > 0 && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
          <p className="text-red-300 text-sm">
            <strong>${totalBofAImpact.toFixed(0)}</strong> of leakage over baseline this month.
            That's <strong>${totalBofAImpact.toFixed(0)}</strong> that could have gone to BofA.
          </p>
        </div>
      )}

      {totalBofAImpact === 0 && totalMTD > 0 && (
        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4">
          <p className="text-emerald-300 text-sm">
            All leakage categories are at or below baseline. Keep it up.
          </p>
        </div>
      )}
    </div>
  );
}
