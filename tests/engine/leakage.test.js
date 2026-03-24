import { describe, it, expect } from 'vitest';
import { calculateLeakage, colorThreshold, computeBaseline, calculateBofAProjections, calculatePaydownVelocity } from '../../src/engine/leakage';

describe('colorThreshold', () => {
  it('returns green when under baseline', () => {
    expect(colorThreshold(80, 100)).toBe('green');
  });

  it('returns green at exact baseline', () => {
    expect(colorThreshold(100, 100)).toBe('green');
  });

  it('returns amber when 0-20% over', () => {
    expect(colorThreshold(115, 100)).toBe('amber');
  });

  it('returns red when 20%+ over', () => {
    expect(colorThreshold(125, 100)).toBe('red');
  });

  it('returns green when baseline is 0', () => {
    expect(colorThreshold(50, 0)).toBe('green');
  });
});

describe('calculateLeakage', () => {
  it('returns correct report for all 4 categories', () => {
    const mtd = {
      'Dining Out': 200,
      'Booze': 50,
      'Kids Activities / Stuff': 180,
      'Amazon / Online Shopping': 100,
    };
    const baselines = {
      'Dining Out': 150,
      'Booze': 80,
      'Kids Activities / Stuff': 200,
      'Amazon / Online Shopping': 150,
    };

    const report = calculateLeakage(mtd, baselines);
    expect(report).toHaveLength(4);

    const dining = report.find((r) => r.category === 'Dining Out');
    expect(dining.mtdSpend).toBe(200);
    expect(dining.baseline).toBe(150);
    expect(dining.delta).toBe(50);
    expect(dining.bofaImpact).toBe(50);
    expect(dining.color).toBe('red');

    const booze = report.find((r) => r.category === 'Booze');
    expect(booze.delta).toBe(-30);
    expect(booze.bofaImpact).toBe(0);
    expect(booze.color).toBe('green');
  });

  it('handles zero baseline gracefully', () => {
    const mtd = { 'Dining Out': 100 };
    const baselines = {};
    const report = calculateLeakage(mtd, baselines);
    const dining = report.find((r) => r.category === 'Dining Out');
    expect(dining.color).toBe('green');
    expect(dining.delta).toBe(0);
  });
});

describe('computeBaseline', () => {
  it('averages correctly over multiple months', () => {
    const txns = [
      { date: '2026-01-15', leakageCategory: 'Dining Out', amount: -150000 },
      { date: '2026-02-15', leakageCategory: 'Dining Out', amount: -200000 },
      { date: '2026-03-15', leakageCategory: 'Dining Out', amount: -100000 },
    ];
    const baselines = computeBaseline(txns, 3);
    expect(baselines['Dining Out']).toBe(150);
  });

  it('returns empty for no transactions', () => {
    expect(computeBaseline([], 3)).toEqual({});
    expect(computeBaseline(null, 3)).toEqual({});
  });
});

describe('calculateBofAProjections', () => {
  it('calculates months to payoff', () => {
    const proj = calculateBofAProjections(6000, 500, 100);
    expect(proj.currentPace.months).toBe(12);
    expect(proj.zeroLeakage.months).toBe(10);
    expect(proj.monthsSaved).toBe(2);
  });

  it('handles zero velocity', () => {
    const proj = calculateBofAProjections(6000, 0, 0);
    expect(proj.currentPace.months).toBe(Infinity);
  });
});

describe('calculatePaydownVelocity', () => {
  it('calculates average monthly payments', () => {
    const payments = [
      { date: '2026-01-10', amount: -500000 },
      { date: '2026-02-10', amount: -600000 },
      { date: '2026-03-10', amount: -400000 },
    ];
    const velocity = calculatePaydownVelocity(payments, 3);
    expect(velocity).toBe(500);
  });

  it('returns 0 for empty payments', () => {
    expect(calculatePaydownVelocity([], 3)).toBe(0);
    expect(calculatePaydownVelocity(null, 3)).toBe(0);
  });
});
