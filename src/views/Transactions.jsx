import React, { useState, useMemo } from 'react';
import TransactionRow from '../components/TransactionRow';

export default function Transactions({ transactions }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, leakage, bofa, inflow

  const filtered = useMemo(() => {
    let txns = [...(transactions || [])];

    // Sort by date descending
    txns.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Apply filter
    switch (filter) {
      case 'leakage':
        txns = txns.filter((t) => t.leakageCategory);
        break;
      case 'bofa':
        txns = txns.filter((t) => t.isBofAPayment);
        break;
      case 'inflow':
        txns = txns.filter((t) => t.amount > 0);
        break;
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      txns = txns.filter(
        (t) =>
          (t.payee || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q) ||
          (t.memo || '').toLowerCase().includes(q)
      );
    }

    return txns;
  }, [transactions, search, filter]);

  const filterButtons = [
    { id: 'all', label: 'All' },
    { id: 'leakage', label: 'Leakers' },
    { id: 'bofa', label: 'BofA' },
    { id: 'inflow', label: 'Income' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Transactions</h2>
        <p className="text-sm text-gray-500">Last 90 days from YNAB</p>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search payee, category..."
          className="flex-1 bg-surface-2 border border-surface-3 rounded-lg px-4 py-2 text-gray-200 text-sm focus:outline-none focus:border-honey-400 placeholder-gray-600"
        />
        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === btn.id
                  ? 'bg-honey-600 text-white'
                  : 'bg-surface-2 text-gray-400 hover:bg-surface-3'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-gray-500">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {filter !== 'all' && ` (filtered)`}
      </div>

      {/* Transaction list */}
      <div className="bg-surface-1 rounded-xl border border-surface-3 divide-y divide-surface-3 max-h-[60vh] overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No transactions found.
          </div>
        ) : (
          filtered.slice(0, 200).map((txn) => (
            <TransactionRow key={txn.id || `${txn.date}-${txn.payee}-${txn.amount}`} transaction={txn} />
          ))
        )}
      </div>

      {filtered.length > 200 && (
        <p className="text-xs text-gray-500 text-center">
          Showing 200 of {filtered.length} transactions
        </p>
      )}
    </div>
  );
}
