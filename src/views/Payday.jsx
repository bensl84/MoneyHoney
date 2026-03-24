import React, { useState, useEffect } from 'react';
import { getUpcomingBills, generateAllocation, buildPaydayContext } from '../engine/payday';
import { buildGoalContext, generateAllocation as aiGenerateAllocation } from '../api/claude';

export default function Payday({ payday, scheduledTxns, mtd, goals, anthropicKey, leakageReport, bofaData }) {
  const [allocation, setAllocation] = useState(null);
  const [aiAllocation, setAiAllocation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualAmount, setManualAmount] = useState('');

  const bills = getUpcomingBills(scheduledTxns || []);

  useEffect(() => {
    if (payday) {
      const alloc = generateAllocation(payday.amount, bills, {}, goals);
      setAllocation(alloc);
    }
  }, [payday, scheduledTxns, goals]);

  const handleManualAllocate = () => {
    const amount = parseFloat(manualAmount);
    if (!isNaN(amount) && amount > 0) {
      const alloc = generateAllocation(amount, bills, {}, goals);
      setAllocation(alloc);
    }
  };

  const handleAiAllocation = async () => {
    if (!anthropicKey || !allocation) return;
    setAiLoading(true);

    const payInfo = payday || { amount: parseFloat(manualAmount), date: new Date().toISOString().split('T')[0] };
    const goalCtx = buildGoalContext(goals, leakageReport, bofaData);
    const paydayCtx = buildPaydayContext(payInfo, bills, mtd, goals);
    const result = await aiGenerateAllocation(anthropicKey, goalCtx, paydayCtx);
    setAiAllocation(result);
    setAiLoading(false);
  };

  const categoryColors = {
    bill: 'text-red-300',
    variable: 'text-amber-300',
    debt: 'text-emerald-400',
  };

  const categoryIcons = {
    bill: '📅',
    variable: '🛒',
    debt: '💳',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Payday Allocator</h2>
        <p className="text-sm text-gray-500">Every dollar assigned. BofA extra maximized.</p>
      </div>

      {/* Payday status */}
      {payday ? (
        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-emerald-300 font-medium">
              Payday detected: ${payday.amount.toLocaleString()} on {payday.date}
            </p>
            <p className="text-emerald-400/70 text-sm">{payday.payee}</p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <p className="text-gray-400 text-sm mb-3">
            No payday detected recently. Enter a paycheck amount to generate an allocation:
          </p>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">$</span>
            <input
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="2,500"
              className="bg-surface-3 border border-surface-4 rounded px-3 py-2 text-gray-100 font-mono w-32 focus:outline-none focus:border-honey-400"
            />
            <button
              onClick={handleManualAllocate}
              className="px-4 py-2 bg-honey-600 text-white rounded-lg hover:bg-honey-500 transition-colors text-sm"
            >
              Generate Allocation
            </button>
          </div>
        </div>
      )}

      {/* Allocation list */}
      {allocation && (
        <div className="bg-surface-1 rounded-xl border border-surface-3 overflow-hidden">
          <div className="p-5 border-b border-surface-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-200">Allocation Plan</h3>
              <span className="font-mono text-honey-400">
                ${allocation.paycheckAmount.toLocaleString()} total
              </span>
            </div>
          </div>

          <div className="divide-y divide-surface-3">
            {allocation.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{categoryIcons[item.category] || '📌'}</span>
                  <span className="text-gray-500 font-mono text-sm w-6">{i + 1}.</span>
                  <div>
                    <span className="text-gray-200">{item.name}</span>
                    {item.dueDate && (
                      <span className="text-xs text-gray-500 ml-2">due {item.dueDate}</span>
                    )}
                  </div>
                </div>
                <span className={`font-mono font-medium ${categoryColors[item.category] || 'text-gray-300'}`}>
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-5 bg-surface-2 border-t border-surface-3">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Bills: ${allocation.billsTotal.toFixed(0)}</span>
              <span>Variable: ${allocation.variableTotal.toFixed(0)}</span>
              <span className="text-emerald-400 font-semibold">
                BofA Extra: ${allocation.bofaExtra.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI allocation */}
      {allocation && anthropicKey && (
        <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-honey-400 font-semibold text-sm">AI ALLOCATION ADVICE</span>
            <button
              onClick={handleAiAllocation}
              disabled={aiLoading}
              className="px-3 py-1.5 bg-honey-600 text-white rounded text-sm hover:bg-honey-500 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? 'Thinking...' : 'Get AI Recommendation'}
            </button>
          </div>
          {aiAllocation && (
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{aiAllocation}</p>
          )}
        </div>
      )}

      {/* Upcoming bills */}
      {bills.length > 0 && (
        <div className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Upcoming Bills (Next 14 Days)
          </h3>
          <div className="space-y-2">
            {bills.map((bill, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono text-xs">{bill.dueDate}</span>
                  <span className="text-gray-300">{bill.name}</span>
                </div>
                <span className="text-red-300 font-mono">${bill.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
