import { describe, it, expect } from 'vitest';
import { detectPayday, getUpcomingBills, generateAllocation } from '../../src/engine/payday';
import { YNAB_ACCOUNTS } from '../../src/shared/constants';

describe('detectPayday', () => {
  const makePaycheckTxn = (date, amount) => ({
    date,
    amount: amount * 1000, // milliunits
    accountId: YNAB_ACCOUNTS.CHASE_CHECKING,
    payee: 'BlueHat Mechanical',
  });

  it('detects paycheck on Thursday', () => {
    // 2026-03-19 is a Thursday
    const txns = [makePaycheckTxn('2026-03-19', 2500)];
    const result = detectPayday(txns, '2026-03-19');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(2500);
  });

  it('ignores non-Thursday inflows', () => {
    // 2026-03-20 is a Friday
    const txns = [makePaycheckTxn('2026-03-20', 2500)];
    const result = detectPayday(txns, '2026-03-20');
    expect(result).toBeNull();
  });

  it('ignores amounts outside range', () => {
    const txns = [makePaycheckTxn('2026-03-19', 1000)];
    const result = detectPayday(txns, '2026-03-19');
    expect(result).toBeNull();
  });

  it('ignores wrong account', () => {
    const txns = [{
      date: '2026-03-19',
      amount: 2500000,
      accountId: 'wrong-account',
      payee: 'Test',
    }];
    const result = detectPayday(txns, '2026-03-19');
    expect(result).toBeNull();
  });

  it('handles empty transactions', () => {
    expect(detectPayday([], '2026-03-19')).toBeNull();
    expect(detectPayday(null, '2026-03-19')).toBeNull();
  });
});

describe('getUpcomingBills', () => {
  it('returns bills within 14 days', () => {
    const today = new Date();
    const in5Days = new Date(today);
    in5Days.setDate(in5Days.getDate() + 5);
    const in20Days = new Date(today);
    in20Days.setDate(in20Days.getDate() + 20);

    const scheduled = [
      { dateNext: in5Days.toISOString().split('T')[0], amount: -100000, payee_name: 'Electric', payee: 'Electric', category: 'Utilities' },
      { dateNext: in20Days.toISOString().split('T')[0], amount: -200000, payee_name: 'Insurance', payee: 'Insurance', category: 'Insurance' },
    ];

    const bills = getUpcomingBills(scheduled, 14);
    expect(bills).toHaveLength(1);
    expect(bills[0].name).toBe('Electric');
    expect(bills[0].amount).toBe(100);
  });

  it('returns empty for no scheduled transactions', () => {
    expect(getUpcomingBills([], 14)).toEqual([]);
    expect(getUpcomingBills(null, 14)).toEqual([]);
  });
});

describe('generateAllocation', () => {
  it('allocates bills first, then variable, then BofA', () => {
    const bills = [
      { name: 'Electric', amount: 150, dueDate: '2026-03-20' },
      { name: 'Internet', amount: 80, dueDate: '2026-03-22' },
    ];
    const alloc = generateAllocation(2500, bills);

    expect(alloc.paycheckAmount).toBe(2500);
    expect(alloc.items[0].name).toBe('Electric');
    expect(alloc.items[0].category).toBe('bill');
    expect(alloc.bofaExtra).toBeGreaterThan(0);
    expect(alloc.totalAllocated).toBe(2500);
  });

  it('handles bills exceeding paycheck', () => {
    const bills = [
      { name: 'Mortgage', amount: 2000, dueDate: '2026-03-20' },
      { name: 'Car', amount: 800, dueDate: '2026-03-22' },
    ];
    const alloc = generateAllocation(2500, bills);
    expect(alloc.bofaExtra).toBe(0);
  });

  it('maximizes BofA extra with no bills', () => {
    const alloc = generateAllocation(2500, []);
    expect(alloc.bofaExtra).toBeGreaterThan(0);
    // Variable spending (groceries + gas + misc = 568 default)
    expect(alloc.bofaExtra).toBe(2500 - 300 - 168 - 100);
  });
});
