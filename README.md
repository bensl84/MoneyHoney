# MoneyHoney

> Daily spending intelligence. YNAB is the data pipe. Claude AI is the brain. The app does the thinking so you don't have to.

## What It Does

1. **Morning Brief** — Opens in 30 seconds with MTD spend, leakage alerts, BofA progress, AI analysis
2. **Leakage Tracker** — Monitors dining, booze, kids stuff, Amazon against baselines with BofA impact
3. **BofA Paydown Dashboard** — Balance, velocity, dual payoff projections (current vs zero-leakage)
4. **Payday Allocator** — Biweekly Thursdays: bills, discretionary, dollar-by-dollar plan with BofA maximized
5. **Statement Upload** — PDF parsing, historical baselines, deduplication against YNAB
6. **Goals Engine** — Every AI analysis references BofA and leakage with real dollar figures

## Stack

| Layer | Tech |
|---|---|
| Desktop | Electron 28+ |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS + IBM Plex |
| Storage | electron-store |
| Data | YNAB API v1 (read-only, proxied through Electron main process) |
| AI | Anthropic Claude API (proxied through Electron main process) |
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

## Architecture

```
electron/main.js     — Window, IPC handlers, API proxy (CORS-free), electron-store
electron/preload.js  — Secure bridge (electronStore, electronPDF, electronDialog, electronAPI)
src/engine/          — Pure functions (transactions, leakage, payday, statements)
src/api/             — YNAB + Claude clients (routed through IPC proxy)
src/views/           — 6 tabs (Overview, Leakage, BofA, Payday, Transactions, Settings)
src/components/      — Reusable UI (StatCard, CategoryBar, TransactionRow, TabBar)
```

## Security

- All API calls proxied through Electron main process (no CORS, no browser exposure)
- API proxy restricted to `api.ynab.com` and `api.anthropic.com` only
- Store keys restricted to allowlist
- PDF parsing restricted to `.pdf` files only
- `contextIsolation: true`, `nodeIntegration: false`

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
