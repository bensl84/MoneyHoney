import { describe, it, expect } from 'vitest';
import { normalizePayee, deduplicateAgainstYNAB, mergeIntoBaseline } from '../../src/engine/statements';

describe('normalizePayee', () => {
  it('lowercases', () => {
    expect(normalizePayee('STARBUCKS')).toBe('starbucks');
  });

  it('strips special characters', () => {
    // Special chars stripped, short alphanumeric kept
    expect(normalizePayee('AMAZON.COM*123ABC')).toBe('amazoncom123abc');
  });

  it('removes long numbers (transaction IDs)', () => {
    expect(normalizePayee('Amazon 12345678')).toBe('amazon');
  });

  it('collapses whitespace', () => {
    expect(normalizePayee('  Chi  potle  ')).toBe('chi potle');
  });

  it('handles empty string', () => {
    expect(normalizePayee('')).toBe('');
    expect(normalizePayee(null)).toBe('');
  });
});

describe('deduplicateAgainstYNAB', () => {
  it('removes exact matches', () => {
    const parsed = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const ynab = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const result = deduplicateAgainstYNAB(parsed, ynab);
    expect(result).toHaveLength(0);
  });

  it('removes date ± 2 day matches with same amount and payee', () => {
    const parsed = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const ynab = [{ date: '2026-01-17', payee: 'Starbucks', amount: -5000 }];
    const result = deduplicateAgainstYNAB(parsed, ynab);
    expect(result).toHaveLength(0);
  });

  it('keeps transactions outside dedup window', () => {
    const parsed = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const ynab = [{ date: '2026-01-20', payee: 'Starbucks', amount: -5000 }];
    const result = deduplicateAgainstYNAB(parsed, ynab);
    expect(result).toHaveLength(1);
  });

  it('keeps transactions with different amounts', () => {
    const parsed = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const ynab = [{ date: '2026-01-15', payee: 'Starbucks', amount: -7000 }];
    const result = deduplicateAgainstYNAB(parsed, ynab);
    expect(result).toHaveLength(1);
  });

  it('handles empty YNAB data', () => {
    const parsed = [{ date: '2026-01-15', payee: 'Test', amount: -5000 }];
    const result = deduplicateAgainstYNAB(parsed, []);
    expect(result).toHaveLength(1);
  });

  it('handles empty statement data', () => {
    const result = deduplicateAgainstYNAB([], [{ date: '2026-01-15', payee: 'Test', amount: -5000 }]);
    expect(result).toHaveLength(0);
  });
});

describe('mergeIntoBaseline', () => {
  it('merges new transactions into existing', () => {
    const existing = [{ date: '2026-01-15', payee: 'A', amount: -5000 }];
    const newTxns = [{ date: '2026-02-15', payee: 'B', amount: -6000 }];
    const result = mergeIntoBaseline(existing, newTxns);
    expect(result).toHaveLength(2);
  });

  it('deduplicates during merge', () => {
    const existing = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const newTxns = [{ date: '2026-01-15', payee: 'Starbucks', amount: -5000 }];
    const result = mergeIntoBaseline(existing, newTxns);
    expect(result).toHaveLength(1);
  });

  it('handles null existing history', () => {
    const newTxns = [{ date: '2026-01-15', payee: 'A', amount: -5000 }];
    const result = mergeIntoBaseline(null, newTxns);
    expect(result).toHaveLength(1);
  });
});
