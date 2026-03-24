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
| Data | YNAB API v1 (read-only) |
| AI | Anthropic Claude API |
| PDF | pdf-parse |
| Package | electron-builder (NSIS) |

## Quick Start

```bash
npm install
npm run dev          # Vite + Electron with HMR
npm run build        # Package → dist-electron/MoneyHoney Setup.exe
npm run test         # Vitest test suite
```

## Goals

- **Kill BofA**: ~$13,500 → $0
- **Stop Leakage**: Dining + Booze + Kids + Amazon < $400/month
- **Citi Costco**: Monitor only. NOT a debt target.

## Docs

See `spec/` directory for architecture, requirements, tasks, decisions, test plan, backlog, and roadmap.
