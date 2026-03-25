import React, { useState, useEffect, useCallback } from 'react';
import TabBar from './components/TabBar';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Overview from './views/Overview';
import Leakage from './views/Leakage';
import BofA from './views/BofA';
import Payday from './views/Payday';
import Transactions from './views/Transactions';
import Settings from './views/Settings';
import Budget from './views/Budget';
import BensView from './views/BensView';
import { fetchTransactions, fetchBudgetId, fetchScheduledTransactions, fetchAccounts } from './api/ynab';
import { buildGoalContext, generateBrief } from './api/claude';
import { calculateMTD, buildMTDSummary, get90DaysAgo, categorizeTransaction } from './engine/transactions';
import { calculateLeakage, computeBaseline, calculateBofAProjections, calculatePaydownVelocity } from './engine/leakage';
import { detectPayday, getUpcomingBills } from './engine/payday';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Config
  const [ynabToken, setYnabToken] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [goals, setGoals] = useState(null);

  // Data
  const [transactions, setTransactions] = useState([]);
  const [scheduledTxns, setScheduledTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mtd, setMtd] = useState(null);
  const [leakageReport, setLeakageReport] = useState([]);
  const [baselines, setBaselines] = useState({});
  const [bofaData, setBofaData] = useState(null);
  const [payday, setPayday] = useState(null);
  const [aiBrief, setAiBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  // Load stored config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        if (!window.electronStore) {
          // Running in browser (dev without Electron)
          setLoading(false);
          setActiveTab('settings');
          return;
        }
        const token = await window.electronStore.get('ynabToken');
        const aiKey = await window.electronStore.get('anthropicApiKey');
        const storedGoals = await window.electronStore.get('goals');
        const storedBudgetId = await window.electronStore.get('ynabBudgetId');
        const storedBaseline = await window.electronStore.get('baseline');

        setYnabToken(token || '');
        setAnthropicKey(aiKey || '');
        setGoals(storedGoals || null);
        setBudgetId(storedBudgetId || '');
        if (storedBaseline?.categoryAverages) {
          setBaselines(storedBaseline.categoryAverages);
        }

        if (!token) {
          setActiveTab('settings');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load settings: ' + err.message);
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Fetch data when token is available
  const refreshData = useCallback(async (tokenOverride) => {
    const token = tokenOverride || ynabToken;
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Get or fetch budget ID
      let bid = budgetId;
      if (!bid) {
        bid = await fetchBudgetId(token);
        setBudgetId(bid);
        if (window.electronStore) {
          await window.electronStore.set('ynabBudgetId', bid);
        }
      }

      // Fetch all data in parallel
      const sinceDate = get90DaysAgo();
      const [txns, scheduled, accts] = await Promise.all([
        fetchTransactions(token, bid, sinceDate),
        fetchScheduledTransactions(token, bid),
        fetchAccounts(token, bid),
      ]);

      // Categorize transactions
      const categorized = txns.map(categorizeTransaction);
      setTransactions(categorized);
      setScheduledTxns(scheduled);
      setAccounts(accts);

      // Calculate MTD
      const mtdData = calculateMTD(txns);
      setMtd(mtdData);

      // Calculate baselines from available data
      const computedBaselines = computeBaseline(categorized);
      const mergedBaselines = { ...baselines, ...computedBaselines };
      setBaselines(mergedBaselines);

      // Calculate leakage
      const leakage = calculateLeakage(mtdData.leakageByCategory, mergedBaselines);
      setLeakageReport(leakage);

      // Calculate BofA data
      const bofaPayments = categorized.filter((t) => t.isBofAPayment);
      const velocity = calculatePaydownVelocity(bofaPayments);
      const totalLeakage = leakage.reduce((sum, c) => sum + c.bofaImpact, 0);
      const currentBalance = goals?.bofaCurrentBalance || 13500;
      const projections = calculateBofAProjections(currentBalance, velocity, totalLeakage);

      setBofaData({
        currentBalance,
        velocity,
        mtdPayments: mtdData.bofaPayments,
        projections,
        recentPayments: bofaPayments.slice(0, 10),
        monthsToPayoff: projections.currentPace.months,
      });

      // Detect payday
      const today = new Date().toISOString().split('T')[0];
      const paydayInfo = detectPayday(categorized, today);
      setPayday(paydayInfo);
      if (paydayInfo) {
        setActiveTab('payday');
      }

      // Cache data
      if (window.electronStore) {
        await window.electronStore.set('cache', {
          lastFetchDate: today,
          transactions: txns.slice(0, 500), // Limit cache size
        });
        await window.electronStore.set('baseline', {
          categoryAverages: mergedBaselines,
          lastCalculated: today,
          monthsOfData: Object.keys(computedBaselines).length > 0 ? 3 : 0,
        });
      }

      setLoading(false);

      // Generate AI brief (non-blocking)
      if (anthropicKey) {
        setBriefLoading(true);
        const goalCtx = buildGoalContext(goals, leakage, {
          velocity,
          mtdPayments: mtdData.bofaPayments,
          monthsToPayoff: projections.currentPace.months,
        });
        const mtdSummary = buildMTDSummary(mtdData);
        const brief = await generateBrief(anthropicKey, goalCtx, mtdSummary);
        setAiBrief(brief);
        setBriefLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [ynabToken, budgetId, anthropicKey, goals, baselines]);

  // Load cached data instantly on startup, then fetch fresh in background
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes refreshData to avoid infinite loop
  useEffect(() => {
    if (!ynabToken || loading) return;
    if (transactions.length > 0) return; // Already loaded

    (async () => {
      // Step 1: Load cache instantly so the UI isn't empty
      if (window.electronStore) {
        try {
          const cached = await window.electronStore.get('cache');
          if (cached?.transactions?.length > 0) {
            const categorized = cached.transactions.map(categorizeTransaction);
            setTransactions(categorized);
            const mtdData = calculateMTD(cached.transactions);
            setMtd(mtdData);
            const computedBaselines = computeBaseline(categorized);
            const mergedBaselines = { ...baselines, ...computedBaselines };
            setBaselines(mergedBaselines);
            const leakage = calculateLeakage(mtdData.leakageByCategory, mergedBaselines);
            setLeakageReport(leakage);

            const bofaPayments = categorized.filter((t) => t.isBofAPayment);
            const velocity = calculatePaydownVelocity(bofaPayments);
            const totalLeakage = leakage.reduce((sum, c) => sum + c.bofaImpact, 0);
            const currentBalance = goals?.bofaCurrentBalance || 13500;
            const projections = calculateBofAProjections(currentBalance, velocity, totalLeakage);
            setBofaData({
              currentBalance, velocity, mtdPayments: mtdData.bofaPayments,
              projections, recentPayments: bofaPayments.slice(0, 10),
              monthsToPayoff: projections.currentPace.months,
            });

            // Check if cache is from today — if so, skip the fetch
            const today = new Date().toISOString().split('T')[0];
            if (cached.lastFetchDate === today) {
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          // Cache read failed, proceed to fresh fetch
        }
      }

      // Step 2: Fetch fresh data (in background if cache was loaded)
      refreshData(ynabToken);
    })();
  }, [ynabToken, loading]);

  const handleSaveSettings = async (newToken, newApiKey, newGoals) => {
    if (window.electronStore) {
      if (newToken !== undefined) await window.electronStore.set('ynabToken', newToken);
      if (newApiKey !== undefined) await window.electronStore.set('anthropicApiKey', newApiKey);
      if (newGoals !== undefined) await window.electronStore.set('goals', newGoals);
    }
    if (newToken !== undefined) setYnabToken(newToken);
    if (newApiKey !== undefined) setAnthropicKey(newApiKey);
    if (newGoals !== undefined) setGoals(newGoals);

    // Immediately fetch data with the new token
    if (newToken && newToken !== ynabToken) {
      setActiveTab('overview');
      refreshData(newToken);
    }
  };

  const handleBaselinesUpdate = (newBaselines) => {
    setBaselines(newBaselines);
    if (mtd) {
      const leakage = calculateLeakage(mtd.leakageByCategory, newBaselines);
      setLeakageReport(leakage);
    }
  };

  // Render current view
  const renderView = () => {
    if (!ynabToken && activeTab !== 'settings' && activeTab !== 'budget' && activeTab !== 'bensview') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-5xl">🍯</div>
          <h1 className="text-2xl font-bold text-honey-400">MoneyHoney</h1>
          <p className="text-gray-400">Add your YNAB token in Settings to get started.</p>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-6 py-2 bg-honey-600 text-white rounded-lg hover:bg-honey-500 transition-colors"
          >
            Open Settings
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'budget':
        return <Budget />;
      case 'bensview':
        return <BensView />;
      case 'overview':
        return (
          <Overview
            mtd={mtd}
            leakageReport={leakageReport}
            bofaData={bofaData}
            aiBrief={aiBrief}
            briefLoading={briefLoading}
            onRefresh={() => refreshData(ynabToken)}
          />
        );
      case 'leakage':
        return <Leakage leakageReport={leakageReport} goals={goals} />;
      case 'bofa':
        return (
          <BofA
            bofaData={bofaData}
            goals={goals}
            onUpdateBalance={async (balance) => {
              const newGoals = { ...goals, bofaCurrentBalance: balance, bofaLastUpdated: new Date().toISOString().split('T')[0] };
              await handleSaveSettings(undefined, undefined, newGoals);
              refreshData();
            }}
          />
        );
      case 'payday':
        return (
          <Payday
            payday={payday}
            scheduledTxns={scheduledTxns}
            mtd={mtd}
            goals={goals}
            anthropicKey={anthropicKey}
            leakageReport={leakageReport}
            bofaData={bofaData}
          />
        );
      case 'transactions':
        return <Transactions transactions={transactions} />;
      case 'settings':
        return (
          <Settings
            ynabToken={ynabToken}
            anthropicKey={anthropicKey}
            goals={goals}
            baselines={baselines}
            onSave={handleSaveSettings}
            onBaselinesUpdate={handleBaselinesUpdate}
            transactions={transactions}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        paydayDetected={!!payday}
      />
      <ErrorBoundary>
        <main className="flex-1 overflow-auto p-6">
          {loading && activeTab !== 'settings' ? (
            <LoadingSpinner message="Pulling your data from YNAB..." />
          ) : error && activeTab !== 'settings' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-400 text-center max-w-md">{error}</p>
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-surface-3 text-gray-200 rounded-lg hover:bg-surface-4 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : (
            renderView()
          )}
        </main>
      </ErrorBoundary>
    </div>
  );
}
