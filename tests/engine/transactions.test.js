import { describe, it, expect } from 'vitest';
import { categorizeTransaction, filterByDateRange, groupByCategory } from '../../src/engine/transactions';
import { YNAB_ACCOUNTS } from '../../src/shared/constants';

describe('categorizeTransaction', () => {
  it('maps restaurant payees to Dining Out', () => {
    const txn = { payee: 'Chipotle Mexican Grill', category: 'Uncategorized', amount: -15000, accountId: 'test' };
    const result = categorizeTransaction(txn);
    expect(result.leakageCategory).toBe('Dining Out');
  });

  it('maps Amazon payees to Amazon / Online Shopping', () => {
    const txn = { payee: 'AMZN Mktp US*1234', category: 'Uncategorized', amount: -25000, accountId: 'test' };
    const result = categorizeTransaction(txn);
    expect(result.leakageCategory).toBe('Amazon / Online Shopping');
  });

  it('maps brewery payees to Booze', () => {
    const txn = { payee: 'Local Brewery Taproom', category: 'Uncategorized', amount: -30000, accountId: 'test' };
    const result = categorizeTransaction(txn);
    expect(result.leakageCategory).toBe('Booze');
  });

  it('returns null leakageCategory for unknown payees', () => {
    const txn = { payee: 'Duke Energy', category: 'Utilities', amount: -120000, accountId: 'test' };
    const result = categorizeTransaction(txn);
    expect(result.leakageCategory).toBeNull();
  });

  it('detects paycheck inflow', () => {
    const txn = {
      payee: 'BlueHat Mechanical',
      category: 'Income',
      amount: 2500000, // $2,500 inflow
      accountId: YNAB_ACCOUNTS.CHASE_CHECKING,
    };
    const result = categorizeTransaction(txn);
    expect(result.isPaycheck).toBe(true);
  });

  it('does not flag non-paycheck amounts as paycheck', () => {
    const txn = {
      payee: 'Refund',
      category: 'Income',
      amount: 50000, // $50 inflow
      accountId: YNAB_ACCOUNTS.CHASE_CHECKING,
    };
    const result = categorizeTransaction(txn);
    expect(result.isPaycheck).toBe(false);
  });
});

describe('filterByDateRange', () => {
  const txns = [
    { date: '2026-01-01', payee: 'A' },
    { date: '2026-01-15', payee: 'B' },
    { date: '2026-02-01', payee: 'C' },
    { date: '2026-03-01', payee: 'D' },
  ];

  it('includes transactions within range', () => {
    const result = filterByDateRange(txns, '2026-01-01', '2026-01-31');
    expect(result).toHaveLength(2);
  });

  it('excludes transactions outside range', () => {
    const result = filterByDateRange(txns, '2026-02-01', '2026-02-28');
    expect(result).toHaveLength(1);
    expect(result[0].payee).toBe('C');
  });

  it('handles empty transaction list', () => {
    expect(filterByDateRange([], '2026-01-01', '2026-12-31')).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('groups transactions by leakage category', () => {
    const txns = [
      { leakageCategory: 'Dining Out', payee: 'A' },
      { leakageCategory: 'Dining Out', payee: 'B' },
      { leakageCategory: 'Booze', payee: 'C' },
      { leakageCategory: null, payee: 'D' },
    ];
    const grouped = groupByCategory(txns);
    expect(grouped['Dining Out']).toHaveLength(2);
    expect(grouped['Booze']).toHaveLength(1);
    expect(grouped['Other']).toHaveLength(1);
  });
});
