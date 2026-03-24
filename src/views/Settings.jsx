import React, { useState } from 'react';
import { parseStatement, deduplicateAgainstYNAB, mergeIntoBaseline } from '../engine/statements';
import { computeBaseline } from '../engine/leakage';
import { categorizeTransaction } from '../engine/transactions';

export default function Settings({ ynabToken, anthropicKey, goals, baselines, onSave, onBaselinesUpdate, transactions }) {
  const [token, setToken] = useState(ynabToken || '');
  const [aiKey, setAiKey] = useState(anthropicKey || '');
  const [bofaBalance, setBofaBalance] = useState(String(goals?.bofaCurrentBalance || 13500));
  const [limits, setLimits] = useState(goals?.leakageLimits || {
    'Dining Out': 150,
    'Booze': 80,
    'Kids Activities / Stuff': 200,
    'Amazon / Online Shopping': 150,
  });
  const [saved, setSaved] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadHistory, setUploadHistory] = useState([]);

  const handleSave = async () => {
    const newGoals = {
      ...goals,
      bofaCurrentBalance: parseFloat(bofaBalance) || 13500,
      bofaLastUpdated: new Date().toISOString().split('T')[0],
      leakageLimits: limits,
    };
    await onSave(token, aiKey, newGoals);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpload = async () => {
    if (!window.electronDialog || !window.electronPDF) {
      setUploadStatus('Statement upload requires the Electron desktop app.');
      return;
    }

    try {
      setUploadStatus('Selecting file...');
      const { filePath } = await window.electronDialog.openFile([
        { name: 'PDF Statements', extensions: ['pdf'] },
      ]);

      if (!filePath) {
        setUploadStatus('');
        return;
      }

      setUploadStatus('Parsing PDF...');
      const result = await window.electronPDF.parse(filePath);

      if (!result.success) {
        setUploadStatus(`Error parsing PDF: ${result.error}`);
        return;
      }

      // Parse transactions from PDF text
      const parsed = parseStatement(result.text);
      if (parsed.length === 0) {
        setUploadStatus('No transactions found in this PDF. Try a different statement format.');
        return;
      }

      // Deduplicate against YNAB data
      const unique = deduplicateAgainstYNAB(parsed, transactions || []);
      const dupeCount = parsed.length - unique.length;

      // Get existing statement history and merge
      let existingHistory = [];
      if (window.electronStore) {
        const stored = await window.electronStore.get('statementHistory');
        existingHistory = stored || [];
      }

      // Add to history
      const filename = filePath.split(/[/\\]/).pop();
      const historyEntry = {
        filename,
        uploadedAt: new Date().toISOString().split('T')[0],
        transactionCount: unique.length,
        duplicatesRemoved: dupeCount,
      };

      const updatedHistory = [...existingHistory, historyEntry];

      // Merge transactions into baseline
      const allBaseline = mergeIntoBaseline(
        existingHistory.flatMap((h) => h.transactions || []),
        unique
      );

      // Recalculate baselines
      const categorized = unique.map(categorizeTransaction);
      const allCategorized = [...(transactions || []).map(categorizeTransaction), ...categorized];
      const newBaselines = computeBaseline(allCategorized);

      // Save
      if (window.electronStore) {
        await window.electronStore.set('statementHistory', updatedHistory);
        await window.electronStore.set('baseline', {
          categoryAverages: newBaselines,
          lastCalculated: new Date().toISOString().split('T')[0],
          monthsOfData: Object.keys(newBaselines).length > 0 ? 3 : 0,
        });
      }

      onBaselinesUpdate(newBaselines);
      setUploadHistory(updatedHistory);
      setUploadStatus(
        `Imported ${unique.length} transactions (${dupeCount} duplicates removed). Baselines updated.`
      );
    } catch (err) {
      setUploadStatus(`Upload error: ${err.message}`);
    }
  };

  // Load upload history on mount
  React.useEffect(() => {
    async function loadHistory() {
      if (window.electronStore) {
        const history = await window.electronStore.get('statementHistory');
        setUploadHistory(history || []);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Settings</h2>
        <p className="text-sm text-gray-500">API keys, goals, and statement uploads</p>
      </div>

      {/* API Keys */}
      <section className="bg-surface-1 rounded-xl p-5 border border-surface-3 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">API Keys</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">YNAB Personal Access Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your YNAB token"
            className="w-full bg-surface-3 border border-surface-4 rounded-lg px-4 py-2 text-gray-200 text-sm focus:outline-none focus:border-honey-400 placeholder-gray-600"
          />
          <p className="text-xs text-gray-600 mt-1">
            Get this from app.ynab.com → Account Settings → Developer Settings
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Anthropic API Key</label>
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-surface-3 border border-surface-4 rounded-lg px-4 py-2 text-gray-200 text-sm focus:outline-none focus:border-honey-400 placeholder-gray-600"
          />
          <p className="text-xs text-gray-600 mt-1">
            Powers the AI brief and allocation recommendations
          </p>
        </div>
      </section>

      {/* Goals */}
      <section className="bg-surface-1 rounded-xl p-5 border border-surface-3 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Goals</h3>

        <div>
          <label className="block text-sm text-gray-400 mb-1">BofA Current Balance ($)</label>
          <input
            type="number"
            value={bofaBalance}
            onChange={(e) => setBofaBalance(e.target.value)}
            className="bg-surface-3 border border-surface-4 rounded-lg px-4 py-2 text-gray-200 text-sm font-mono focus:outline-none focus:border-honey-400 w-40"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-3">Monthly Leakage Limits</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(limits).map(([cat, limit]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-sm text-gray-300 flex-1">{cat}</span>
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimits({ ...limits, [cat]: parseInt(e.target.value) || 0 })}
                  className="bg-surface-3 border border-surface-4 rounded px-3 py-1.5 text-gray-200 text-sm font-mono focus:outline-none focus:border-honey-400 w-20"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-lg font-medium transition-all text-sm ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-honey-600 text-white hover:bg-honey-500'
        }`}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>

      {/* Statement Upload */}
      <section className="bg-surface-1 rounded-xl p-5 border border-surface-3 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Statement Upload
        </h3>
        <p className="text-sm text-gray-500">
          Upload PDF bank/CC statements to build historical baselines for leakage detection.
        </p>

        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-surface-3 text-gray-200 rounded-lg hover:bg-surface-4 transition-colors text-sm border border-surface-4"
        >
          Upload PDF Statement
        </button>

        {uploadStatus && (
          <p className={`text-sm ${uploadStatus.includes('Error') || uploadStatus.includes('error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {uploadStatus}
          </p>
        )}

        {/* Upload history */}
        {uploadHistory.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Upload History</h4>
            <div className="space-y-1">
              {uploadHistory.map((entry, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-400">{entry.filename}</span>
                  <span className="text-gray-500">
                    {entry.transactionCount} txns • {entry.uploadedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Current baselines */}
      {Object.keys(baselines).length > 0 && (
        <section className="bg-surface-1 rounded-xl p-5 border border-surface-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Current Baselines
          </h3>
          <div className="space-y-1">
            {Object.entries(baselines).map(([cat, avg]) => (
              <div key={cat} className="flex justify-between text-sm py-1">
                <span className="text-gray-400">{cat}</span>
                <span className="text-gray-300 font-mono">${(Number(avg) || 0).toFixed(0)}/mo</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
