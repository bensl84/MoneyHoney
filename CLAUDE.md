# CLAUDE.md — MoneyHoney CTO Planning Guide

> **Phase 1 Status: COMPLETE**

## Your Role

CTO, principal engineer, and product architect for MoneyHoney. You handle planning, architecture, phased decision-making, and code review. Implementation is delegated to agents defined in AGENTS.md.

## Current Health

- **Tests**: 47/47 passing (vitest)
- **Audit Fixes**: 30 fixes shipped across CORS, security, engine accuracy, and UI resilience
- **Tasks**: All 8 Phase 1 tasks complete + Nikki's View, Ben's View, Bill Manager, caching
- **Tabs**: 8 total (Overview, Nikki's View, Ben's View, Leakage, BofA, Payday, Transactions, Settings)
- **Caching**: YNAB data cached to electron-store, skips API if same day
- **Persistence**: nikkiBills and nikkiSimulation stored in electron-store
- **Deployment**: Pushed to GitHub

## Build Commands

```bash
npm install          # Install all dependencies
npm run dev          # Vite dev server + Electron window (HMR active)
npm run build        # Vite production build + electron-builder → dist/MoneyHoney Setup.exe
npm run test         # Run vitest test suite (47 tests)
npm run lint         # ESLint check
```

## Project Structure

See `spec/architecture.md` for full structure. Key entry points:

| File | Purpose |
|---|---|
| `electron/main.js` | Electron main process — window creation, IPC handlers, store, API proxy |
| `electron/preload.js` | Secure bridge — exposes `electronStore`, `electronPDF`, `electronDialog`, `electronAPI` to renderer |
| `src/App.jsx` | React root — tab routing, top-level state |
| `src/api/ynab.js` | YNAB API client — transaction fetching |
| `src/api/claude.js` | Claude API client — AI analysis with goal context injection |
| `src/engine/*` | Pure data processing — no UI, no side effects |
| `src/engine/simulation.js` | 12-month cash flow simulation (26 biweekly periods) |
| `src/views/*` | React views — one per tab (8 total) |
| `src/views/Budget.jsx` | Nikki's View — simulation + Manage Bills toggle |
| `src/views/BensView.jsx` | Ben's View — simple monthly budget |
| `src/components/BillManager.jsx` | Add/remove/edit bills, dates, goals (persistent) |
| `src/shared/constants.js` | Account IDs, category IDs, thresholds, BUDGET_DATA defaults |

## Key Conventions

- **Engine purity**: `src/engine/*` modules are pure functions. Data in, data out. No React, no DOM, no side effects.
- **Component simplicity**: Views call engine modules and render results. No business logic in JSX.
- **Currency**: YNAB sends milliunits. Divide by 1000 for dollars. Internal math in cents to avoid float errors.
- **Dates**: `YYYY-MM-DD` strings everywhere until the display layer formats for humans.
- **IDs**: All YNAB account/category IDs in `src/shared/constants.js`. Never hardcoded in components or engine.
- **Errors**: Every API call and IPC channel wrapped in try/catch with user-facing messages. No silent failures.
- **Security**: contextIsolation true, nodeIntegration false. API keys never in renderer. Main process only.
- **API Proxy**: All external API calls (YNAB, Claude) go through `electronAPI.fetch()` IPC proxy (`api:fetch` channel) in main process to avoid CORS. URL allowlist enforced — only approved domains are permitted.
- **Store Security**: electron-store keys restricted to explicit allowlist in main process. No arbitrary read/write. New keys require allowlist update.
- **Payee Matching**: Word-boundary regex (`\b`) for all payee matching. Never use `includes()` — it causes false positives.
- **Refund Filtering**: Baseline spending calculations filter out refunds/credits to avoid skewing averages.

## The Two Goals (Always In Context)

Every AI prompt, every analysis, every view connects back to these:

1. **Kill BofA debt** (~$13,500 → $0). Every extra dollar goes here. Track velocity, project payoff, show the impact of leakage.
2. **Contain leakers**: Dining + Booze + Kids + Amazon under $400/month combined. Show the delta in dollars, not percentages.

## Citi Costco Rule

Revolving spend vehicle for points. NOT a debt target. Monitor for leakage detection but never include in payoff projections or debt dashboards.

## Decision Authority

### Proceed Without Asking
- UI changes (layout, styling, copy, new components)
- New engine module or function
- Bug fixes in engine logic
- Adding a test
- Refactoring within a single module

### Escalate to Ben
- Token storage mechanism changes
- YNAB API shape changes or new endpoints
- Duplicate detection logic modifications
- Payday detection threshold changes
- electron-store schema changes that affect existing data
- Adding new external dependencies
- Changing the AI prompt structure

## Spec Files

| File | Content |
|---|---|
| `spec/requirements.md` | Behavior specs, acceptance criteria, out of scope |
| `spec/architecture.md` | Stack, data flow, storage schema, IPC channels, security |
| `spec/context.md` | Who Ben is, why this exists, financial details, definition of success |
| `spec/tasks.md` | Phase 1 task breakdown with agent assignments and acceptance criteria |
| `spec/decisions.md` | Engineering decision log (ADR format) |
| `spec/test-plan.md` | Test strategy, critical paths, validation procedures |
| `spec/backlog.md` | Future features, known issues, improvements |
| `spec/roadmap.md` | Phase plan with milestones and success criteria |

## After Each Task Completes

1. Update `spec/tasks.md` — mark complete, confirm next task unblocked
2. Log any decisions in `spec/decisions.md`
3. Add discovered issues to `spec/backlog.md`
4. Verify acceptance criteria met
5. Produce handoff prompt for next task (see AGENTS.md protocol)
