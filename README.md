# MoneyHoney

> Daily spending intelligence. YNAB is the data pipe. Claude AI is the brain. The app does the thinking so you don't have to.

## What It Does

### 8 Tabs

| Tab | What It Does |
|---|---|
| **Overview** | Morning brief: MTD spend, leakage alerts, BofA progress, AI analysis, 🔄 Refresh button |
| **💅 Nikki's View** | 12-month cash flow simulation — every payday, every bill, running balance. Editable per-period amounts. ⚙ Manage Bills to add/remove/edit bills & dates |
| **🧢 Ben's View** | Simple monthly budget — all bills divided out (quarterly ÷3, yearly ÷12), running balance after each bill, weekly breakdown |
| **Leakage** | 4-category tracker: Dining, Booze, Kids, Amazon vs baselines with BofA impact |
| **BofA** | Paydown dashboard: balance, velocity, dual payoff projections |
| **Payday** | Biweekly allocator: bills first, BofA maximized, dollar-by-dollar plan |
| **Transactions** | Raw transaction list from YNAB |
| **Settings** | API keys, goals, statement upload for historical baselines |

## Stack

| Layer | Tech |
|---|---|
| Desktop | Electron 28+ |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS + IBM Plex |
| Storage | electron-store (persistent) |
| Data | YNAB API v1 (read-only, proxied, cached) |
| AI | Anthropic Claude API (proxied) |
| Simulation | Custom 26-period biweekly engine |
| PDF | pdf-parse |
| Package | electron-builder (NSIS) |
| Tests | Vitest (47 tests) |

## Quick Start

```bash
npm install
npm run dev          # Vite + Electron with HMR
npm run build        # Package -> dist-electron/MoneyHoney Setup 1.0.0.exe
npm run test         # Vitest test suite (47 tests)
```

### First Run
1. App opens to welcome screen
2. Click **Settings** tab
3. Paste your **YNAB Personal Access Token** (from app.ynab.com -> Account Settings -> Developer Settings)
4. Paste your **Anthropic API Key** (for AI briefs)
5. Click **Save Settings** -> app switches to Overview and pulls data
6. YNAB data is cached — subsequent opens are instant (no API call if same day)

### Nikki's View & Ben's View
These work without YNAB — they use the built-in bill data. Click **⚙ Manage Bills** in Nikki's View to add/remove/edit bills, dates, and goals. Changes persist and flow to both views.

## Architecture

```
electron/main.js       — Window, IPC handlers, API proxy (CORS-free), electron-store
electron/preload.js    — Secure bridge (electronStore, electronPDF, electronDialog, electronAPI)
src/engine/            — Pure functions (transactions, leakage, payday, statements, simulation)
src/api/               — YNAB + Claude clients (routed through IPC proxy)
src/views/             — 8 tabs (Overview, Budget/Nikki, BensView, Leakage, BofA, Payday, Transactions, Settings)
src/components/        — Reusable UI (StatCard, CategoryBar, TransactionRow, TabBar, BillManager)
```

### Data Flow
- **YNAB views** (Overview, Leakage, BofA, Payday, Transactions): YNAB API -> cache -> engine -> views
- **Budget views** (Nikki's View, Ben's View): electron-store (nikkiBills) -> simulation engine -> views
- **Manage Bills**: BillManager component -> electron-store -> both budget views update

## Security

- All API calls proxied through Electron main process (no CORS, no browser exposure)
- API proxy restricted to `api.ynab.com` and `api.anthropic.com` only
- Store keys restricted to allowlist
- PDF parsing restricted to `.pdf` files only
- `contextIsolation: true`, `nodeIntegration: false`

## Caching

- YNAB data cached to electron-store after first successful fetch
- On startup: loads cache instantly, skips API if cache is from today
- Manual refresh via 🔄 button on Overview forces fresh fetch
- YNAB rate limit: 200 requests/hour — app uses 1 retry max to avoid exhaustion

## Goals

- **Kill BofA**: ~$13,500 -> $0
- **Stop Leakage**: Dining + Booze + Kids + Amazon < $400/month
- **Citi Costco**: Monitor only. NOT a debt target.

## Tests

47 tests across 4 test files covering all engine modules:
- `leakage.test.js` — baselines, color thresholds, projections, velocity
- `payday.test.js` — paycheck detection, bill allocation, BofA maximization
- `transactions.test.js` — categorization, filtering, paycheck/BofA detection
- `statements.test.js` — payee normalization, deduplication, baseline merging

## Docs

See `spec/` directory for full architecture, requirements, tasks, decisions, test plan, backlog, and roadmap.
