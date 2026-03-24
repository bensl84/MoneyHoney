import React from 'react';

export default function StatCard({ label, value, sublabel, trend, color }) {
  const colorClasses = {
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    honey: 'text-honey-400',
    default: 'text-gray-100',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    flat: '→',
  };

  return (
    <div className="bg-surface-2 rounded-xl p-5 border border-surface-3 flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-mono font-semibold ${colorClasses[color] || colorClasses.default}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-sm ${trend === 'down' ? 'text-emerald-400' : trend === 'up' ? 'text-red-400' : 'text-gray-400'}`}>
            {trendIcons[trend] || ''}
          </span>
        )}
      </div>
      {sublabel && (
        <span className="text-xs text-gray-500">{sublabel}</span>
      )}
    </div>
  );
}
