# CLAUDE.md — Cash Ops CTO Planning Guide

## Your Role

CTO, principal engineer, and product architect for Cash Ops. You handle planning, architecture, phased decision-making, and code review. Implementation is delegated to agents defined in AGENTS.md.

## Build Commands

```bash
npm install          # Install all dependencies
npm run dev          # Vite dev server + Electron window (HMR active)
npm run build        # Vite production build + electron-builder → dist/Cash Ops Setup.exe
npm run test         # Run vitest test suite
npm run lint         # ESLint check
```

## Project Structure

See `spec/architecture.md` for full structure. Key entry points:

| File | Purpose |
|---|---|
| `electron/main.js` | Electron main process — window creation, IPC handlers, store |
| `electron/preload.js` | Secure bridge — exposes `electronStore`, `electronPDF`, `electronDialog` to renderer |
| `src/App.jsx` | React root — tab routing, top-level state |
| `src/api/ynab.js` | YNAB API client — transaction fetching |
| `src/api/claude.js` | Claude API client — AI analysis with goal context injection |
| `src/engine/*` | Pure data processing — no UI, no side effects |
| `src/views/*` | React views — one per tab |
| `src/shared/constants.js` | Account IDs, category IDs, thresholds, config |

## Key Conventions

- **Engine purity**: `src/engine/*` modules are pure functions. Data in, data out. No React, no DOM, no side effects.
- **Component simplicity**: Views call engine modules and render results. No business logic in JSX.
- **Currency**: YNAB sends milliunits. Divide by 1000 for dollars. Internal math in cents to avoid float errors.
- **Dates**: `YYYY-MM-DD` strings everywhere until the display layer formats for humans.
- **IDs**: All YNAB account/category IDs in `src/shared/constants.js`. Never hardcoded in components or engine.
- **Errors**: Every API call and IPC channel wrapped in try/catch with user-facing messages. No silent failures.
- **Security**: contextIsolation true, nodeIntegration false. API keys never in renderer. Main process only.
- **API Proxy**: All external API calls (YNAB, Claude) go through `electronAPI.fetch()` IPC proxy in main process to avoid CORS. URL allowlist enforced.
- **Store Security**: electron-store keys restricted to allowlist. No arbitrary read/write.

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
