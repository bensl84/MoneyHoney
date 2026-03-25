import { useState } from 'react';

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];

export default function BillManager({ bills, onSave }) {
  const [editBills, setEditBills] = useState(JSON.parse(JSON.stringify(bills)));
  const [hasChanges, setHasChanges] = useState(false);

  const update = (newBills) => {
    setEditBills(newBills);
    setHasChanges(true);
  };

  const save = () => {
    onSave(editBills);
    setHasChanges(false);
  };

  // Credit card helpers
  const addCreditCard = () => {
    const next = { ...editBills };
    next.creditCards = [...next.creditCards, { name: '', dueDate: '1st', payment: 0, balance: 0, rate: '0%', notes: '' }];
    update(next);
  };
  const removeCreditCard = (i) => {
    const next = { ...editBills };
    next.creditCards = next.creditCards.filter((_, idx) => idx !== i);
    update(next);
  };
  const updateCreditCard = (i, field, val) => {
    const next = { ...editBills };
    next.creditCards = [...next.creditCards];
    next.creditCards[i] = { ...next.creditCards[i], [field]: val };
    update(next);
  };

  // Monthly bill helpers
  const addMonthlyBill = () => {
    const next = { ...editBills };
    next.monthlyBills = [...next.monthlyBills, { name: '', dueDate: '1st', amount: 0 }];
    update(next);
  };
  const removeMonthlyBill = (i) => {
    const next = { ...editBills };
    next.monthlyBills = next.monthlyBills.filter((_, idx) => idx !== i);
    update(next);
  };
  const updateMonthlyBill = (i, field, val) => {
    const next = { ...editBills };
    next.monthlyBills = [...next.monthlyBills];
    next.monthlyBills[i] = { ...next.monthlyBills[i], [field]: val };
    update(next);
  };

  // Quarterly bill helpers
  const addQuarterlyBill = () => {
    const next = { ...editBills };
    next.quarterlyBills = [...next.quarterlyBills, { name: '', dueMonth: '', amount: 0, dueMonths: [] }];
    update(next);
  };
  const removeQuarterlyBill = (i) => {
    const next = { ...editBills };
    next.quarterlyBills = next.quarterlyBills.filter((_, idx) => idx !== i);
    update(next);
  };
  const updateQuarterlyBill = (i, field, val) => {
    const next = { ...editBills };
    next.quarterlyBills = [...next.quarterlyBills];
    next.quarterlyBills[i] = { ...next.quarterlyBills[i], [field]: val };
    update(next);
  };
  const toggleQuarterlyMonth = (i, month) => {
    const next = { ...editBills };
    next.quarterlyBills = [...next.quarterlyBills];
    const bill = { ...next.quarterlyBills[i] };
    const months = [...(bill.dueMonths || [])];
    const idx = months.indexOf(month);
    if (idx >= 0) months.splice(idx, 1);
    else months.push(month);
    months.sort((a, b) => a - b);
    bill.dueMonths = months;
    bill.dueMonth = months.map((m) => MONTH_OPTIONS[m - 1]?.label).join(', ');
    next.quarterlyBills[i] = bill;
    update(next);
  };

  // Yearly bill helpers
  const addYearlyBill = () => {
    const next = { ...editBills };
    next.yearlyBills = [...next.yearlyBills, { name: '', dueMonth: '', amount: 0, dueMonths: [] }];
    update(next);
  };
  const removeYearlyBill = (i) => {
    const next = { ...editBills };
    next.yearlyBills = next.yearlyBills.filter((_, idx) => idx !== i);
    update(next);
  };
  const updateYearlyBill = (i, field, val) => {
    const next = { ...editBills };
    next.yearlyBills = [...next.yearlyBills];
    next.yearlyBills[i] = { ...next.yearlyBills[i], [field]: val };
    update(next);
  };
  const setYearlyMonth = (i, month) => {
    const next = { ...editBills };
    next.yearlyBills = [...next.yearlyBills];
    next.yearlyBills[i] = {
      ...next.yearlyBills[i],
      dueMonths: [month],
      dueMonth: MONTH_OPTIONS[month - 1]?.label || '',
    };
    update(next);
  };

  // Goal helpers
  const addGoal = () => {
    const next = { ...editBills };
    next.goals = [...next.goals, ''];
    update(next);
  };
  const removeGoal = (i) => {
    const next = { ...editBills };
    next.goals = next.goals.filter((_, idx) => idx !== i);
    update(next);
  };
  const updateGoal = (i, val) => {
    const next = { ...editBills };
    next.goals = [...next.goals];
    next.goals[i] = val;
    update(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-honey-400">Manage Bills & Dates</h2>
          <p className="text-sm text-gray-500 mt-1">Add, remove, or edit bills. Changes update the simulation.</p>
        </div>
        <button
          onClick={save}
          disabled={!hasChanges}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            hasChanges
              ? 'bg-honey-600 text-white hover:bg-honey-500'
              : 'bg-surface-3 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      {/* Credit Cards */}
      <Section title="Credit Cards & Debt" onAdd={addCreditCard} addLabel="+ Add Card">
        <div className="grid grid-cols-12 gap-2 pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
          <span className="col-span-3">Name</span>
          <span className="col-span-1">Due Day</span>
          <span className="col-span-2">Payment</span>
          <span className="col-span-2">Balance</span>
          <span className="col-span-1">Rate</span>
          <span className="col-span-2">Notes</span>
          <span className="col-span-1"></span>
        </div>
        {editBills.creditCards.map((card, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-1 border-b border-surface-4/30 items-center">
            <Input className="col-span-3" value={card.name} onChange={(v) => updateCreditCard(i, 'name', v)} placeholder="Card name" />
            <Input className="col-span-1" value={card.dueDate} onChange={(v) => updateCreditCard(i, 'dueDate', v)} placeholder="1st" />
            <NumInput className="col-span-2" value={card.payment} onChange={(v) => updateCreditCard(i, 'payment', v)} />
            <NumInput className="col-span-2" value={card.balance} onChange={(v) => updateCreditCard(i, 'balance', v)} />
            <Input className="col-span-1" value={card.rate} onChange={(v) => updateCreditCard(i, 'rate', v)} placeholder="0%" />
            <Input className="col-span-2" value={card.notes} onChange={(v) => updateCreditCard(i, 'notes', v)} placeholder="Notes" />
            <div className="col-span-1 text-center">
              <DeleteBtn onClick={() => removeCreditCard(i)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Monthly Bills */}
      <Section title="Monthly Bills" onAdd={addMonthlyBill} addLabel="+ Add Monthly Bill">
        <div className="grid grid-cols-12 gap-2 pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
          <span className="col-span-5">Name</span>
          <span className="col-span-3">Due Day</span>
          <span className="col-span-3">Amount</span>
          <span className="col-span-1"></span>
        </div>
        {editBills.monthlyBills.map((bill, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-1 border-b border-surface-4/30 items-center">
            <Input className="col-span-5" value={bill.name} onChange={(v) => updateMonthlyBill(i, 'name', v)} placeholder="Bill name" />
            <Input className="col-span-3" value={bill.dueDate} onChange={(v) => updateMonthlyBill(i, 'dueDate', v)} placeholder="15th" />
            <NumInput className="col-span-3" value={bill.amount} onChange={(v) => updateMonthlyBill(i, 'amount', v)} />
            <div className="col-span-1 text-center">
              <DeleteBtn onClick={() => removeMonthlyBill(i)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Quarterly Bills */}
      <Section title="Quarterly Bills" onAdd={addQuarterlyBill} addLabel="+ Add Quarterly Bill">
        <div className="grid grid-cols-12 gap-2 pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-6">Due Months (click to toggle)</span>
          <span className="col-span-1"></span>
        </div>
        {editBills.quarterlyBills.map((bill, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-surface-4/30 items-center">
            <Input className="col-span-3" value={bill.name} onChange={(v) => updateQuarterlyBill(i, 'name', v)} placeholder="Bill name" />
            <NumInput className="col-span-2" value={bill.amount} onChange={(v) => updateQuarterlyBill(i, 'amount', v)} />
            <div className="col-span-6 flex flex-wrap gap-1">
              {MONTH_OPTIONS.map((m) => {
                const active = (bill.dueMonths || []).includes(m.value);
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleQuarterlyMonth(i, m.value)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      active
                        ? 'bg-yellow-600 text-white'
                        : 'bg-surface-3 text-gray-500 hover:bg-surface-4'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div className="col-span-1 text-center">
              <DeleteBtn onClick={() => removeQuarterlyBill(i)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Yearly Bills */}
      <Section title="Yearly Bills" onAdd={addYearlyBill} addLabel="+ Add Yearly Bill">
        <div className="grid grid-cols-12 gap-2 pb-1 mb-1 border-b border-surface-4 text-xs text-gray-500 uppercase">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-6">Due Month</span>
          <span className="col-span-1"></span>
        </div>
        {editBills.yearlyBills.map((bill, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-surface-4/30 items-center">
            <Input className="col-span-3" value={bill.name} onChange={(v) => updateYearlyBill(i, 'name', v)} placeholder="Bill name" />
            <NumInput className="col-span-2" value={bill.amount} onChange={(v) => updateYearlyBill(i, 'amount', v)} />
            <div className="col-span-6 flex flex-wrap gap-1">
              {MONTH_OPTIONS.map((m) => {
                const active = (bill.dueMonths || []).includes(m.value);
                return (
                  <button
                    key={m.value}
                    onClick={() => setYearlyMonth(i, m.value)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      active
                        ? 'bg-yellow-600 text-white'
                        : 'bg-surface-3 text-gray-500 hover:bg-surface-4'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div className="col-span-1 text-center">
              <DeleteBtn onClick={() => removeYearlyBill(i)} />
            </div>
          </div>
        ))}
      </Section>

      {/* Goals */}
      <Section title="Goals" onAdd={addGoal} addLabel="+ Add Goal">
        {editBills.goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-b border-surface-4/30">
            <span className="text-honey-500">•</span>
            <input
              type="text"
              value={goal}
              onChange={(e) => updateGoal(i, e.target.value)}
              className="flex-1 bg-surface-3 border border-surface-4 rounded px-2 py-1 text-sm text-gray-200 focus:border-honey-500 focus:outline-none"
              placeholder="Goal description"
            />
            <DeleteBtn onClick={() => removeGoal(i)} />
          </div>
        ))}
      </Section>

      {/* Bottom save */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-center">
          <button
            onClick={save}
            className="px-8 py-3 bg-honey-600 text-white rounded-xl font-semibold shadow-lg hover:bg-honey-500 transition-colors"
          >
            Save All Changes
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, onAdd, addLabel }) {
  return (
    <div className="bg-surface-2 rounded-xl p-5 border border-surface-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        <button
          onClick={onAdd}
          className="px-3 py-1 bg-surface-3 text-honey-400 rounded-lg text-xs hover:bg-surface-4 transition-colors border border-surface-4"
        >
          {addLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, className }) {
  return (
    <div className={className}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-3 border border-surface-4 rounded px-2 py-1 text-sm text-gray-200 focus:border-honey-500 focus:outline-none"
      />
    </div>
  );
}

function NumInput({ value, onChange, className }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">$</span>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step="0.01"
          className="w-full bg-surface-3 border border-surface-4 rounded px-2 py-1 text-sm font-mono text-gray-200 text-right focus:border-honey-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-gray-600 hover:text-red-400 transition-colors text-sm px-1"
      title="Remove"
    >
      ✕
    </button>
  );
}
