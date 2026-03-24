# AGENTS.md — Cash Ops Agent Delegation Hierarchy

## Archetype

**Electron Desktop App** — Electron 28+ wrapping React 18 + Vite, with Node.js backend processing (PDF parsing, IPC), external API integrations (YNAB, Anthropic), and local persistence (electron-store).

---

## Agent Roster

| Role | Agent | Responsibility | Assigned Tasks |
|---|---|---|---|
| Orchestrator | **Pipeline Manager** | Task sequencing, quality gates, handoffs, spec updates | All phases |
| Lead Frontend | **Frontend Developer** | React views, components, Electron UI, tab routing, state | T1, T2, T4 |
| Lead Backend | **Backend Architect** | Engine modules, API clients, IPC handlers, PDF parsing | T3, T5, T6, T7 |
| Infrastructure | **DevOps Automator** | Electron packaging, build pipeline, CI, installer | T1 (scaffold), T8 |
| QA | **Code Reviewer** | Every PR reviewed. No merge without validation. | All tasks |

---

## Delegation Hierarchy

```
Pipeline Manager (Orchestrator)
├── Frontend Developer (Lead)
│   ├── Owns: src/views/*, src/components/*, src/App.jsx
│   ├── Collaborates with Backend Architect on data contracts
│   └── Never touches: electron/main.js, src/engine/*
├── Backend Architect (Lead)
│   ├── Owns: src/engine/*, src/api/*, electron/main.js, electron/preload.js
│   ├── Defines IPC channels and data shapes
│   └── Never touches: src/views/*, src/components/* (except data integration points)
├── DevOps Automator
│   ├── Owns: package.json scripts, vite.config.js, electron-builder.yml
│   ├── Initial scaffold setup, build pipeline, packaging
│   └── Never touches: business logic, UI components
└── Code Reviewer
    ├── Reviews every change before merge
    ├── Validates against acceptance criteria in tasks.md
    └── Blocks merge if: tests fail, security violated, dedup broken
```

---

## Universal Rules (All Agents)

### Execution Protocol
1. **Read first** — Read AGENTS.md + relevant spec files before writing any code
2. **Root-cause before coding** — Explain the problem/approach before writing a line
3. **Minimal safe changes** — Don't redesign what works. Don't refactor adjacent code.
4. **Complete files only** — No partial snippets. Every file must be runnable.
5. **Max 3 steps at a time** — Plain English explanations between steps

### Output Format (Every Task Completion)
```
1. Objective — what was done and why
2. Approach — how it was done
3. Changes made — files created/modified with brief description
4. Validation performed — how correctness was confirmed
5. Remaining risks — what could still go wrong
6. Next task ready — confirm next task is unblocked
```

### Code Conventions
- Engine modules (`src/engine/*`) are **pure functions** — no React, no side effects, no DOM
- Components call engine modules and render results — never inline business logic
- All YNAB account IDs and category IDs live in `src/shared/constants.js`
- Currency always in **milliunits** from YNAB (divide by 1000 for dollars). Internal calculations in cents.
- Dates always as `YYYY-MM-DD` strings until display layer
- Error handling: every API call and IPC channel has try/catch with user-facing error message
- No `console.log` in production — use a simple logger utility

### Security Constraints
- `contextIsolation: true`, `nodeIntegration: false` — always
- YNAB token stored in electron-store (local JSON, user data dir)
- Claude API key: environment variable, injected at build time, **never in renderer process**
- All Node.js work (PDF parse, file system) in main process via IPC only
- Renderer communicates through preload bridge exclusively

---

## Agent-Specific Rules

### Frontend Developer
- **Owns**: All `.jsx` files in `src/views/` and `src/components/`
- **Stack**: React 18 functional components, hooks only, no class components
- **Styling**: Tailwind CSS utility classes. IBM Plex Mono for numbers, IBM Plex Sans for text.
- **State**: React state for UI. electron-store (via preload bridge) for persistence.
- **Data contract**: Receives processed data from engine modules. Never calls YNAB/Claude APIs directly from components.
- **Color system**: Green = under baseline, Amber = 0-20% over, Red = 20%+ over. Use CSS variables.
- **Responsiveness**: Fixed window size (1200x800). No mobile responsive needed.
- **Tab routing**: Simple state-based tabs (Overview, Leakage, BofA, Payday, Transactions, Settings). No react-router.

### Backend Architect
- **Owns**: All files in `src/engine/`, `src/api/`, `electron/`
- **Engine purity**: Engine modules take data in, return data out. No side effects. Testable in isolation.
- **API clients**: `src/api/ynab.js` and `src/api/claude.js` handle all external calls. Retry logic for network errors (max 3, exponential backoff).
- **IPC channels**: Defined in `electron/main.js`, exposed through `electron/preload.js`. Channels:
  - `store:get` / `store:set` — electron-store read/write
  - `pdf:parse` — PDF statement parsing
  - `dialog:openFile` — native file picker
- **Deduplication**: Match transactions on `date ± 2 days` + `amount` + `normalized payee`. This is critical — never double-count.
- **YNAB account IDs** (from constants.js):
  - Chase Main Checking: `4a9ce8a8-66a1-4a1a-99f5-09a460f59729`
  - BofA Cash Rewards: `cb7fb148-421f-4925-a3ff-0bdf69924e2a`
  - Budget ID: look up dynamically on first load, cache in electron-store

### DevOps Automator
- **Owns**: Build configuration, packaging, CI
- **Scaffold**: Vite 5 + React 18 + Electron 28+
- **Build**: `npm run dev` = Vite dev server + Electron loading localhost. `npm run build` = Vite build + electron-builder NSIS.
- **Packaging**: electron-builder targeting Windows NSIS installer. Output: `dist/Cash Ops Setup.exe`
- **No dev tools in production**: `mainWindow.webContents.openDevTools()` only in dev mode

### Code Reviewer
- **Gate criteria**: Every change must pass before merge:
  1. Acceptance criteria from `spec/tasks.md` met
  2. No `console.log` in production code
  3. No API keys/tokens in renderer code
  4. Engine modules remain pure (no React imports, no side effects)
  5. Deduplication logic intact (if statement upload touched)
  6. electron-store schema backward compatible (no breaking changes to existing data)
  7. All error paths have user-facing messages (no silent failures)

---

## Escalation Criteria (Stop and Ask Ben)

- Ambiguous transaction categorization — unknown payee, unclear category
- Payday detection logic fails — no inflow detected on expected date
- PDF parsing fails for a specific statement format
- Goals conflict — not enough to cover bills AND send to BofA
- Any change to electron-store schema that would break existing saved data
- YNAB API shape changes or rate limiting issues
- Duplicate detection produces false positives or misses real duplicates
- AI brief generates generic output instead of goal-specific analysis

---

## What NOT To Do (All Agents)

- **Do NOT** add YNAB envelope/budgeting features — this app is read-only on YNAB data
- **Do NOT** store the Anthropic API key in the renderer — main process only
- **Do NOT** use Plaid or direct bank connections — YNAB is the only data pipe
- **Do NOT** auto-send money or take any financial action — analysis and recommendations only
- **Do NOT** over-hedge in AI output — Ben wants direct, opinionated analysis with dollar amounts
- **Do NOT** treat Citi Costco as a debt payoff target — it's a revolving spend card
- **Do NOT** add react-router — use simple tab state
- **Do NOT** add a database — electron-store is sufficient for Phase 1
- **Do NOT** add user auth — single user, local app
- **Do NOT** refactor working code while implementing a task — stay focused

---

## Task Handoff Protocol

When a task completes:
1. Pipeline Manager updates `spec/tasks.md` — marks complete, unblocks next
2. Log any new decisions in `spec/decisions.md`
3. Add any discovered issues to `spec/backlog.md`
4. Produce next agent handoff prompt with task number, assigned agent, and files involved
5. Code Reviewer validates before handoff

## First Task Handoff Prompt

```
Read AGENTS.md and all files in /spec.

You are the DevOps Automator + Frontend Developer for Cash Ops.

Start with Task 1 from spec/tasks.md: Project Scaffold.

Rules:
- Init Vite 5 + React 18 project
- Add Electron 28+, electron-store, electron-builder
- Configure main.js, preload.js with IPC channels
- Validate: `npm run dev` opens Electron window with React app
- No business logic yet — scaffold only

Output format:
1. Objective
2. Approach
3. Changes made
4. Files modified
5. Validation performed
6. Remaining risks
```
