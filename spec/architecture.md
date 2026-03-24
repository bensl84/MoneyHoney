# Architecture — Cash Ops

## Stack

| Layer | Tech | Version | Why |
|---|---|---|---|
| Desktop shell | Electron | 28+ | Wraps React as Windows .exe, provides IPC + native dialogs |
| Frontend | React | 18 | Existing artifact, functional components + hooks |
| Build tool | Vite | 5 | Fast HMR, clean ESM builds |
| Styling | Tailwind CSS | 3 | Utility-first, consistent, no custom CSS sprawl |
| Typography | IBM Plex Sans / Mono | — | Clean readability, Mono for dollar figures |
| Persistence | electron-store | 8+ | Simple JSON in OS user data dir |
| Data source | YNAB API | v1 | Read-only transaction pipe |
| AI | Anthropic Claude API | claude-sonnet-4-20250514 | Analysis, allocation recommendations |
| PDF parsing | pdf-parse | 1.1+ | Statement upload processing (Node.js) |
| Packaging | electron-builder | 24+ | NSIS installer for Windows |
| Testing | Vitest | 1+ | Fast, Vite-native, ESM-compatible |
| Linting | ESLint | 8+ | Code quality enforcement |

---

## Project Structure

```
cash-ops-app/
├── electron/
│   ├── main.js              # Electron main process
│   │   ├── Window creation (1200x800, no resize in Phase 1)
│   │   ├── IPC handlers (store, pdf, dialog)
│   │   ├── electron-store initialization
│   │   └── Dev vs prod mode switching
│   └── preload.js           # Secure bridge
│       ├── electronStore.get(key) / set(key, value)
│       ├── electronPDF.parse(filePath) → {transactions[]}
│       └── electronDialog.openFile(filters) → filePath
├── src/
│   ├── App.jsx              # Root — tab state, data loading, error boundary
│   ├── api/
│   │   ├── ynab.js          # YNAB API client
│   │   │   ├── fetchTransactions(token, budgetId, sinceDate) → Transaction[]
│   │   │   ├── fetchAccounts(token, budgetId) → Account[]
│   │   │   ├── fetchScheduledTransactions(token, budgetId) → ScheduledTransaction[]
│   │   │   └── fetchCategories(token, budgetId) → Category[]
│   │   └── claude.js        # Anthropic API client
│   │       ├── generateBrief(context) → string
│   │       ├── generateAllocation(paydayContext) → AllocationPlan
│   │       └── buildGoalContext(goals, leakage, bofa) → PromptContext
│   ├── engine/
│   │   ├── transactions.js  # Process + categorize raw YNAB data
│   │   │   ├── categorizeTransaction(txn) → CategorizedTransaction
│   │   │   ├── filterByDateRange(txns, start, end) → Transaction[]
│   │   │   ├── groupByCategory(txns) → {category: Transaction[]}
│   │   │   └── calculateMTD(txns) → MTDSummary
│   │   ├── leakage.js       # Leakage detection vs baseline
│   │   │   ├── calculateLeakage(mtdByCategory, baselines) → LeakageReport
│   │   │   ├── computeBaseline(historicalTxns, months) → CategoryBaselines
│   │   │   ├── bofaImpact(leakageTotal) → dollars
│   │   │   └── colorThreshold(mtd, baseline) → 'green' | 'amber' | 'red'
│   │   ├── payday.js        # Payday detection + allocation
│   │   │   ├── detectPayday(recentTxns, today) → PaydayInfo | null
│   │   │   ├── getUpcomingBills(scheduledTxns, days) → Bill[]
│   │   │   ├── generateAllocation(paycheck, bills, estimates, goals) → Allocation
│   │   │   └── PAYCHECK_RANGE = { min: 2400, max: 2600 }
│   │   └── statements.js    # PDF parse + deduplication
│   │       ├── parseStatement(rawText) → ParsedTransaction[]
│   │       ├── deduplicateAgainstYNAB(parsed, ynabTxns) → UniqueTransaction[]
│   │       ├── normalizePayee(payee) → string
│   │       └── mergeIntoBaseline(existing, newTxns) → MergedHistory
│   ├── shared/
│   │   └── constants.js     # All magic numbers and IDs
│   │       ├── YNAB_ACCOUNT_IDS
│   │       ├── LEAKAGE_CATEGORIES
│   │       ├── PAYCHECK_THRESHOLDS
│   │       ├── COLOR_THRESHOLDS
│   │       └── DEFAULT_GOALS
│   ├── views/
│   │   ├── Overview.jsx     # Daily brief + stat cards
│   │   ├── Leakage.jsx      # Off-budget category tracker
│   │   ├── BofA.jsx         # Debt paydown dashboard
│   │   ├── Payday.jsx       # Allocation recommender
│   │   ├── Transactions.jsx # Raw transaction list with search/filter
│   │   └── Settings.jsx     # Token input, goal editing, statement upload
│   └── components/
│       ├── StatCard.jsx     # Single stat with label, value, trend indicator
│       ├── CategoryBar.jsx  # Horizontal bar: MTD vs baseline with color
│       ├── TransactionRow.jsx # Single transaction display
│       ├── TabBar.jsx       # Navigation tabs
│       ├── ErrorBoundary.jsx # Graceful error display
│       └── LoadingSpinner.jsx # Loading state
├── spec/                    # All architecture + planning docs
├── tests/
│   ├── engine/
│   │   ├── leakage.test.js
│   │   ├── payday.test.js
│   │   ├── transactions.test.js
│   │   └── statements.test.js
│   └── api/
│       └── ynab.test.js
├── package.json
├── vite.config.js
├── tailwind.config.js
├── electron-builder.yml
├── .env.example             # ANTHROPIC_API_KEY=your_key_here
├── .gitignore
├── AGENTS.md
└── CLAUDE.md
```

---

## Data Flow

```
                    ┌─────────────┐
                    │  YNAB API   │
                    └──────┬──────┘
                           │ REST (GET)
                    ┌──────▼──────┐
                    │  ynab.js    │  API client (retry, error handling)
                    └──────┬──────┘
                           │ Transaction[], Account[]
                    ┌──────▼──────────┐
                    │ transactions.js  │  Categorize, filter, group
                    └──────┬──────────┘
                           │ CategorizedTransaction[]
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼───┐ ┌──────▼──────┐
       │ leakage.js  │ │payday│ │  claude.js  │
       │ MTD vs base │ │.js   │ │ + goal ctx  │
       └──────┬──────┘ └──┬───┘ └──────┬──────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │   Views     │  React renders processed data
                    └─────────────┘

PDF Statement Flow:
  File picker → main.js (pdf-parse) → IPC → statements.js (dedup) → electron-store
```

---

## Local Storage Schema (electron-store)

```json
{
  "ynabToken": "string — YNAB personal access token",
  "ynabBudgetId": "string — cached budget ID (looked up on first load)",
  "anthropicApiKey": "string — Claude API key (Phase 1: stored locally, future: env var only)",
  "goals": {
    "bofaTarget": 0,
    "bofaCurrentBalance": 13500,
    "bofaLastUpdated": "2026-03-01",
    "leakageLimits": {
      "Dining Out": 150,
      "Booze": 80,
      "Kids Activities / Stuff": 200,
      "Amazon / Online Shopping": 150
    }
  },
  "baseline": {
    "categoryAverages": {
      "Dining Out": 247,
      "Booze": 112,
      "Kids Activities / Stuff": 183,
      "Amazon / Online Shopping": 201
    },
    "lastCalculated": "2026-03-01",
    "monthsOfData": 3
  },
  "statementHistory": [
    {
      "filename": "chase-jan-2026.pdf",
      "uploadedAt": "2026-02-15",
      "transactionCount": 47,
      "transactions": []
    }
  ],
  "cache": {
    "lastFetchDate": "2026-03-23",
    "transactions": []
  }
}
```

---

## IPC Channels

| Channel | Direction | Payload | Response |
|---|---|---|---|
| `store:get` | renderer → main | `{ key: string }` | `{ value: any }` |
| `store:set` | renderer → main | `{ key: string, value: any }` | `{ success: boolean }` |
| `pdf:parse` | renderer → main | `{ filePath: string }` | `{ transactions: ParsedTransaction[] }` |
| `dialog:openFile` | renderer → main | `{ filters: FileFilter[] }` | `{ filePath: string \| null }` |

---

## Data Types

```typescript
// Core transaction from YNAB
interface Transaction {
  id: string;
  date: string;           // YYYY-MM-DD
  payee: string;
  amount: number;          // milliunits (divide by 1000 for dollars)
  category: string;
  accountId: string;
  memo: string | null;
}

// After engine processing
interface CategorizedTransaction extends Transaction {
  leakageCategory: string | null;  // One of the 4 leaker categories, or null
  isPaycheck: boolean;
  isBofAPayment: boolean;
}

// Leakage report per category
interface LeakageReport {
  category: string;
  mtdSpend: number;        // dollars
  baseline: number;        // dollars (monthly average)
  delta: number;           // dollars over/under
  deltaPercent: number;
  bofaImpact: number;      // dollars not going to BofA
  color: 'green' | 'amber' | 'red';
}

// Payday allocation
interface Allocation {
  paycheckAmount: number;
  items: AllocationItem[];  // ordered list
  bofaExtra: number;        // what's left for BofA
  totalAllocated: number;
}

interface AllocationItem {
  name: string;
  amount: number;
  category: 'bill' | 'variable' | 'debt';
  dueDate: string | null;
}
```

---

## Security Model

| Concern | Mitigation |
|---|---|
| YNAB token exposure | Stored in electron-store (OS user data dir). Never in env file or source. |
| Claude API key exposure | Environment variable at build time. Never in renderer process. |
| Node.js in renderer | `nodeIntegration: false`, `contextIsolation: true`. Preload bridge only. |
| PDF file access | Native dialog for file selection. pdf-parse runs in main process only. |
| Data at rest | electron-store JSON file. Not encrypted (acceptable: personal machine, personal data). |
| Network | HTTPS only for YNAB and Anthropic APIs. No other outbound connections. |

---

## Packaging

| Setting | Value |
|---|---|
| Builder | electron-builder |
| Target | Windows NSIS installer |
| Output | `dist/Cash Ops Setup.exe` |
| App size | ~150MB (Electron + Chromium overhead) |
| Auto-update | Not in Phase 1 |
| Code signing | Not in Phase 1 |
| Dev tools | Disabled in production builds |
