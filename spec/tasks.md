# Tasks — Cash Ops Phase 1

## Current Objective

Build Phase 1 of Cash Ops Windows app — scaffold Electron shell, port existing React artifact, add persistence, leakage engine, BofA dashboard, payday allocator, statement upload, AI goals engine, and package as Windows installer.

## Status Key
- [ ] Not started
- [~] In progress
- [x] Complete

---

## Task 1: Project Scaffold
**Status**: [ ] Not started
**Agent**: DevOps Automator + Frontend Developer
**Risk**: Low
**Files**: `package.json`, `vite.config.js`, `tailwind.config.js`, `electron/main.js`, `electron/preload.js`, `.env.example`, `.gitignore`

**Work**:
1. Init project with Vite 5 + React 18 (`npm create vite@latest`)
2. Add dependencies: `electron`, `electron-store`, `electron-builder`, `pdf-parse`, `tailwindcss`
3. Add dev dependencies: `vitest`, `eslint`, `concurrently`, `wait-on`
4. Configure Vite: build output to `dist/`, base path for Electron
5. Configure Tailwind: content paths, IBM Plex font imports
6. Set up `electron/main.js`:
   - Create BrowserWindow (1200x800, no resize)
   - Load Vite dev server URL in dev, `dist/index.html` in prod
   - Initialize electron-store with default schema
   - Register IPC handlers: `store:get`, `store:set`, `pdf:parse`, `dialog:openFile`
   - Dev tools open in dev mode only
7. Set up `electron/preload.js`:
   - Expose `window.electronStore.get(key)` / `set(key, value)`
   - Expose `window.electronPDF.parse(filePath)`
   - Expose `window.electronDialog.openFile(filters)`
8. Add npm scripts:
   - `dev`: concurrently run Vite + Electron
   - `build`: Vite build + electron-builder
   - `test`: vitest
   - `lint`: eslint
9. Create `src/shared/constants.js` with all account IDs and config
10. Create `.env.example` with `ANTHROPIC_API_KEY=`
11. Create `.gitignore` (node_modules, dist, .env, electron-store data)

**Acceptance**:
- `npm run dev` opens Electron window showing React app
- No console errors
- `electronStore.get/set` work from renderer (test with token storage)
- IPC channels respond correctly
- Tailwind classes render correctly

**Blocked by**: Nothing
**Unblocks**: Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8

---

## Task 2: Port Existing Artifact + Tab Navigation
**Status**: [ ] Not started
**Agent**: Frontend Developer
**Risk**: Low
**Files**: `src/App.jsx`, `src/views/*.jsx`, `src/components/*.jsx`

**Work**:
1. Create `src/App.jsx` with tab state (Overview, Leakage, BofA, Payday, Transactions, Settings)
2. Create `TabBar.jsx` component
3. Create `ErrorBoundary.jsx` and `LoadingSpinner.jsx`
4. Move artifact overview code into `src/views/Overview.jsx`
5. Create placeholder views for all other tabs
6. Replace React state token storage with electron-store via preload bridge
7. Token flow: check electron-store on load → if empty, show Settings tab with token input → save → auto-load on next open
8. Create `StatCard.jsx`, `CategoryBar.jsx`, `TransactionRow.jsx` components
9. Apply Tailwind styling: dark theme, IBM Plex fonts, consistent spacing

**Acceptance**:
- All 6 tabs render and switch correctly
- Token entered once → saved to electron-store → auto-loaded on next app open
- No re-entry required after first setup
- Components render with Tailwind styling
- Error boundary catches and displays errors gracefully

**Blocked by**: Task 1
**Unblocks**: Task 3, Task 4, Task 5

---

## Task 3: Leakage Engine + View
**Status**: [ ] Not started
**Agent**: Backend Architect (engine) + Frontend Developer (view)
**Risk**: Medium — category mapping must be accurate
**Files**: `src/engine/leakage.js`, `src/views/Leakage.jsx`, `src/shared/constants.js`

**Work**:
1. Define leakage category mappings in `constants.js`:
   - Dining Out: YNAB category match + payee patterns (restaurants, fast food, delivery)
   - Booze: payee patterns (bar, brewery, liquor, wine, beer)
   - Kids Activities / Stuff: YNAB category match
   - Amazon / Online Shopping: payee patterns (amazon, amzn, online retailers)
2. Implement `leakage.js`:
   - `calculateLeakage(mtdByCategory, baselines)` → LeakageReport[]
   - `computeBaseline(historicalTxns, months)` → CategoryBaselines
   - `bofaImpact(leakageTotal)` → dollars over baseline
   - `colorThreshold(mtd, baseline)` → green/amber/red
3. Build `Leakage.jsx` view:
   - 4 category rows with CategoryBar components
   - Each row: category name, MTD spend, baseline, delta ($), BofA impact
   - Color coding: green/amber/red based on thresholds
   - Summary row: total leakage, total BofA impact

**Acceptance**:
- Leakage view shows 4 categories with all fields populated
- Color thresholds work correctly (green < baseline, amber 0-20% over, red > 20% over)
- Engine module is pure — no React imports, no side effects
- BofA impact shows real dollar amounts
- Unit tests pass for leakage.js

**Blocked by**: Task 1, Task 2 (for view)
**Unblocks**: Task 7

---

## Task 4: BofA Paydown Dashboard
**Status**: [ ] Not started
**Agent**: Frontend Developer + Backend Architect (projections)
**Risk**: Low
**Files**: `src/views/BofA.jsx`, `src/engine/leakage.js` (add projection functions)

**Work**:
1. Manual balance input with save to electron-store goals
2. Pull BofA payment transactions from YNAB (account ID in constants.js)
3. Calculate average extra payment per month (last 3 months)
4. Projection A: payoff date at current velocity
5. Projection B: payoff date if leakage was zeroed (redirect leakage dollars to BofA)
6. Show MTD payments toward BofA this month
7. Interest cost comparison between the two projections
8. Visual: balance trend line (if enough data), stat cards for velocity and dates

**Acceptance**:
- Dashboard shows current balance (from manual input)
- MTD payments pulled from YNAB and displayed
- Two payoff projections with dates and month difference
- Projections update when balance is manually updated
- Data persists between app restarts

**Blocked by**: Task 1, Task 2
**Unblocks**: Task 7

---

## Task 5: Payday Allocator
**Status**: [ ] Not started
**Agent**: Backend Architect (engine) + Frontend Developer (view)
**Risk**: Medium — payday detection must be reliable
**Files**: `src/engine/payday.js`, `src/views/Payday.jsx`

**Work**:
1. Implement `payday.js`:
   - `detectPayday(recentTxns, today)` — check Chase Checking for inflow $2,400-$2,600 on Thursday
   - `getUpcomingBills(scheduledTxns, days)` — next 14 days of scheduled transactions
   - `generateAllocation(paycheck, bills, estimates, goals)` — full dollar-by-dollar plan
   - Priority order: bills → groceries → gas → variable → BofA extra
2. Build `Payday.jsx` view:
   - Numbered allocation list: "1. Mortgage $789, 2. Gas $168..."
   - Final line: BofA extra = whatever is left after essentials
   - Highlight the BofA extra amount prominently
   - Show bill due dates alongside amounts
3. Auto-detection: if payday detected on app open, switch to Payday tab
4. Manual trigger: "Generate allocation" button always available

**Acceptance**:
- On simulated payday (test with fixture data), allocator generates complete plan
- Every dollar from paycheck is accounted for
- BofA extra is maximized after essentials
- Bills show due dates
- Payday tab auto-surfaces when payday detected
- Engine module is pure and testable
- Unit tests pass for payday.js

**Blocked by**: Task 1, Task 2
**Unblocks**: Task 7

---

## Task 6: Statement Upload + Deduplication
**Status**: [ ] Not started
**Agent**: Backend Architect
**Risk**: High — deduplication logic is critical, PDF parsing varies by bank
**Files**: `src/engine/statements.js`, `src/views/Settings.jsx` (upload section)

**Work**:
1. Implement native file picker via `dialog:openFile` IPC channel
2. Parse PDF in main process with pdf-parse, extract raw text
3. Implement `statements.js`:
   - `parseStatement(rawText)` — extract date, payee, amount per transaction
   - `normalizePayee(payee)` — lowercase, strip extra whitespace, remove common suffixes
   - `deduplicateAgainstYNAB(parsed, ynabTxns)` — match on date ± 2 days + amount + normalized payee
   - `mergeIntoBaseline(existing, newTxns)` — add new transactions to baseline history
4. Store parsed transactions in electron-store statementHistory
5. Recalculate category baselines after each upload
6. Add upload UI to Settings view:
   - Upload button → file picker → progress indicator → result summary
   - Upload history: filename, date, transaction count
   - Option to delete an uploaded statement

**Acceptance**:
- Upload a Chase PDF statement — transactions extracted correctly
- Zero duplicates with existing YNAB data
- Baselines recalculate after upload
- Upload history visible in Settings
- Multiple statement formats handled (Chase, BofA at minimum)
- Unit tests for deduplication logic pass with edge cases

**Blocked by**: Task 1
**Unblocks**: Task 7

---

## Task 7: AI Goals Engine
**Status**: [ ] Not started
**Agent**: Backend Architect
**Risk**: Medium — prompt engineering must produce goal-specific output
**Files**: `src/api/claude.js`, `src/engine/leakage.js` (context builder)

**Work**:
1. Implement `claude.js`:
   - `buildGoalContext(goals, leakage, bofa)` — assemble full context for every API call
   - `generateBrief(context)` — daily morning brief (3 sentences, opinionated)
   - `generateAllocation(paydayContext)` — payday allocation with BofA maximization
2. Goal context always injected:
   - BofA: current balance, target ($0), velocity ($/month), months until payoff
   - Leakage: category limits, current MTD per category, delta vs baseline
   - Payoff impact: "if leakage was $0, payoff would be X months sooner"
3. AI brief requirements:
   - Always reference at least one goal by name with dollar figures
   - 3 sentences max
   - Opinionated tone: "You spent $X on Y, that's $Z over baseline"
   - If everything is fine, say so simply
4. Payday prompt: "allocate to maximize BofA paydown after essentials"
5. Goals editable in Settings view — stored in electron-store
6. Error handling: if Claude API fails, show cached brief or "AI unavailable" message

**Acceptance**:
- AI brief mentions BofA or leakage by name with specific dollar figures
- Brief is 3 sentences max, opinionated, not generic
- Payday allocation references BofA maximization
- Goals persist in electron-store and are editable
- API failure doesn't crash the app

**Blocked by**: Task 1, Task 3, Task 4, Task 5 (needs all data to build context)
**Unblocks**: Task 8

---

## Task 8: Package for Windows
**Status**: [ ] Not started
**Agent**: DevOps Automator
**Risk**: Low
**Files**: `electron-builder.yml`, `package.json` scripts, app icon

**Work**:
1. Configure electron-builder for Windows NSIS installer
2. Add app icon (simple cash/dollar design)
3. Configure: app name "Cash Ops", single-user install, desktop shortcut
4. Exclude dev dependencies and source maps from build
5. `npm run build` → produces `dist/Cash Ops Setup.exe`
6. Test: install on clean Windows machine, verify:
   - App opens
   - Token persists between sessions
   - Goals persist
   - No dev tools visible
   - No console errors in production

**Acceptance**:
- `.exe` installs cleanly
- App opens from desktop shortcut
- All features work in packaged build
- No dev tools, no source maps
- File size < 200MB
- Electron-store data persists after update/reinstall

**Blocked by**: Task 1-7 (all features complete)
**Unblocks**: Phase 1 complete → daily use begins

---

## Phase 2 — Intelligence Improvements (After Phase 1)
- 90-day rolling trend charts
- BofA paydown simulator ("what if I add $X/month?")
- Merchant-level drilldown
- Monthly review screen
- Leaker trend lines over 6 months

## Phase 3 — iPhone App (SwiftUI)
- Separate repo, same APIs
- Morning summary (3 stats + AI brief)
- Paycheck notification + allocation
- No deep drill-down

## Phase 4 — Autonomous
- Seasonal pattern detection
- Proactive alerts
- BofA payoff countdown with confetti
