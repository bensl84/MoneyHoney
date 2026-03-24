import React from 'react';

export default function CategoryBar({ category, mtdSpend, baseline, delta, bofaImpact, color }) {
  const colorConfig = {
    green: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'On track' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Watch it' },
    red: { bg: 'bg-red-500', text: 'text-red-400', label: 'Over limit' },
  };

  const config = colorConfig[color] || colorConfig.green;
  const progress = baseline > 0 ? Math.min((mtdSpend / baseline) * 100, 150) : 0;

  return (
    <div className="bg-surface-2 rounded-lg p-4 border border-surface-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-200">{category}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${config.text} bg-surface-3`}>
            {config.label}
          </span>
        </div>
        <div className="text-right">
          <span className={`font-mono font-semibold ${config.text}`}>
            ${mtdSpend.toFixed(0)}
          </span>
          <span className="text-gray-500 text-sm"> / ${baseline.toFixed(0)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-3 rounded-full h-2 mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.bg}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
        {progress > 100 && (
          <div
            className="h-full rounded-full bg-red-500 opacity-50 -mt-2"
            style={{ width: `${progress - 100}%`, marginLeft: '100%', transform: `translateX(-${progress - 100}%)` }}
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {delta >= 0 ? (
            <span className={config.text}>${delta.toFixed(0)} over</span>
          ) : (
            <span className="text-emerald-400">${Math.abs(delta).toFixed(0)} under</span>
          )}
        </span>
        {bofaImpact > 0 && (
          <span className="text-red-400">
            ${bofaImpact.toFixed(0)} not going to BofA
          </span>
        )}
      </div>
    </div>
  );
}
