import { YNAB_API_BASE, YNAB_ACCOUNTS } from '../shared/constants';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

async function ynabFetch(endpoint, token, retries = 0) {
  const url = `${YNAB_API_BASE}${endpoint}`;
  const options = {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  };

  try {
    let res;

    // Use Electron's main process proxy to avoid CORS issues
    if (window.electronAPI) {
      res = await window.electronAPI.fetch(url, options);
    } else {
      // Fallback for browser dev (won't work due to CORS but useful for testing)
      const fetchRes = await fetch(url, { headers: options.headers });
      res = {
        ok: fetchRes.ok,
        status: fetchRes.status,
        statusText: fetchRes.statusText,
        data: await fetchRes.json(),
      };
    }

    if (res.status === 401) {
      throw new Error('Invalid YNAB token. Check your personal access token in Settings.');
    }

    if (res.status === 403) {
      throw new Error('YNAB token lacks permissions. Re-create your token in YNAB settings.');
    }

    if (res.status === 404) {
      throw new Error('YNAB resource not found. Your budget ID may be incorrect.');
    }

    if (res.status === 429) {
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retries);
        await new Promise((r) => setTimeout(r, delay));
        return ynabFetch(endpoint, token, retries + 1);
      }
      throw new Error('YNAB API rate limit reached. Try again in a few minutes.');
    }

    if (!res.ok) {
      throw new Error(`YNAB API error: ${res.status} ${res.statusText}`);
    }

    return res.data;
  } catch (err) {
    if (err.message.includes('YNAB') || err.message.includes('Invalid') || err.message.includes('rate limit') || err.message.includes('lacks permissions') || err.message.includes('not found')) {
      throw err;
    }
    if (retries < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retries);
      await new Promise((r) => setTimeout(r, delay));
      return ynabFetch(endpoint, token, retries + 1);
    }
    throw new Error('Unable to reach YNAB. Check your internet connection.');
  }
}

export async function fetchBudgets(token) {
  const data = await ynabFetch('/budgets', token);
  return data.data.budgets;
}

export async function fetchBudgetId(token) {
  const budgets = await fetchBudgets(token);
  if (budgets.length === 0) throw new Error('No budgets found in your YNAB account.');
  return budgets[0].id;
}

export async function fetchTransactions(token, budgetId, sinceDate) {
  const since = sinceDate ? `?since_date=${sinceDate}` : '';
  const data = await ynabFetch(`/budgets/${budgetId}/transactions${since}`, token);
  return data.data.transactions.map((t) => ({
    id: t.id,
    date: t.date,
    payee: t.payee_name || '',
    amount: t.amount, // milliunits
    category: t.category_name || 'Uncategorized',
    categoryId: t.category_id,
    accountId: t.account_id,
    accountName: t.account_name || '',
    memo: t.memo,
    cleared: t.cleared,
    approved: t.approved,
  }));
}

export async function fetchAccounts(token, budgetId) {
  const data = await ynabFetch(`/budgets/${budgetId}/accounts`, token);
  return data.data.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: a.balance, // milliunits
    clearedBalance: a.cleared_balance,
    onBudget: a.on_budget,
    closed: a.closed,
  }));
}

export async function fetchScheduledTransactions(token, budgetId) {
  const data = await ynabFetch(`/budgets/${budgetId}/scheduled_transactions`, token);
  return data.data.scheduled_transactions.map((t) => ({
    id: t.id,
    dateNext: t.date_next,
    frequency: t.frequency,
    payee: t.payee_name || '',
    amount: t.amount,
    category: t.category_name || '',
    accountId: t.account_id,
    memo: t.memo,
  }));
}

export async function fetchCategories(token, budgetId) {
  const data = await ynabFetch(`/budgets/${budgetId}/categories`, token);
  return data.data.category_groups.flatMap((g) =>
    g.categories.map((c) => ({
      id: c.id,
      name: c.name,
      group: g.name,
      budgeted: c.budgeted,
      activity: c.activity,
      balance: c.balance,
    }))
  );
}

export function getBofAPayments(transactions) {
  return transactions.filter(
    (t) => t.accountId === YNAB_ACCOUNTS.BOFA_CASH_REWARDS && t.amount > 0
  );
}
