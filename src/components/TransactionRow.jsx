import React from 'react';

export default function TransactionRow({ transaction }) {
  const amount = (transaction.amount ?? 0) / 1000;
  const isInflow = amount > 0;

  const leakageBadge = transaction.leakageCategory ? (
    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-amber-400">
      {transaction.leakageCategory}
    </span>
  ) : null;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-surface-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xs text-gray-500 font-mono w-20 shrink-0">
          {transaction.date}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-gray-200 truncate">
            {transaction.payee || 'Unknown'}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {transaction.category || 'Uncategorized'}
          </span>
        </div>
        {leakageBadge}
      </div>
      <span className={`font-mono text-sm font-medium shrink-0 ${isInflow ? 'text-emerald-400' : 'text-gray-300'}`}>
        {isInflow ? '+' : '-'}${Math.abs(amount).toFixed(2)}
      </span>
    </div>
  );
}
