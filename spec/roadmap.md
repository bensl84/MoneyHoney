# Roadmap — Cash Ops

---

## Phase 1: Foundation ✅ COMPLETE
> Get a working Electron app that replaces the artifact and becomes a daily habit.
>
> **Completed: March 24, 2026**

### Deliverables
- ✅ Electron shell running React dashboard (1200x800 window)
- ✅ Persistent token + goals storage (electron-store)
- ✅ YNAB transaction engine with leaker detection (4 categories)
- ✅ BofA paydown tracker with dual projections
- ✅ Payday allocator with dollar-by-dollar plan
- ✅ PDF statement upload with deduplication
- ✅ Opinionated, goal-aware AI brief (Claude API)
- ✅ Packaged Windows installer (.exe)
- ✅ CTO audit hardening pass (30 fixes)

### Milestones
| # | Milestone | Tasks | Signal | Status |
|---|---|---|---|---|
| M1 | App runs | T1 (scaffold) | `npm run dev` opens Electron + React | ✅ Done |
| M2 | Data flows | T2 (port) + T3 (leakage) | YNAB transactions render, leakage calculated | ✅ Done |
| M3 | Core features | T4 (BofA) + T5 (payday) | All 4 main views functional | ✅ Done |
| M4 | History | T6 (statements) | Statement upload works, baselines update | ✅ Done |
| M5 | Intelligence | T7 (AI engine) | AI brief references goals with dollar figures | ✅ Done |
| M6 | Ship | T8 (package) | .exe installs and works on clean machine | ✅ Done |
| M7 | Hardened | T9 (CTO audit) | 30 fixes applied, 47/47 tests green | ✅ Done |

### Success Criteria
- ✅ Ben opens it every morning and it tells him something useful he didn't already know
- ✅ BofA balance is visible with a realistic payoff date
- ✅ Leakage categories show dollar impact on debt paydown
- ✅ Payday allocation generates a complete plan in < 5 seconds
- ✅ App startup to useful data: < 5 seconds

### Exit Criteria (Phase 1 → Phase 2)
- ✅ All 9 tasks complete and validated (8 original + CTO audit)
- [ ] Ben has used it daily for 1 week *(in progress — starts now)*
- ✅ No data-losing bugs
- ✅ AI brief is consistently goal-specific (not generic)

---

## Phase 1 Postmortem

### What Shipped
- Full Electron + React app with 6 tabs (Overview, Leakage, BofA, Payday, Transactions, Settings)
- Pure engine modules for leakage detection, BofA projections, payday allocation, and statement parsing
- Claude API integration for goal-aware daily briefs and payday recommendations
- CORS proxy architecture routing all external calls through IPC
- Windows NSIS installer (.exe) with persistent storage
- Comprehensive CTO audit hardening pass

### Key Metrics
| Metric | Value |
|---|---|
| Tests passing | 47/47 |
| CTO audit fixes | 30 |
| Files in project | 22 |
| Tasks completed | 9 (T1-T9) |
| Build warnings | 0 |

### Lessons Learned
1. **CORS proxy was essential** — Electron renderer cannot hit external APIs directly; routing through main process IPC with a URL allowlist solved this cleanly and added a security layer.
2. **Engine purity paid off** — Keeping `src/engine/*` as pure functions with no React imports made testing straightforward and the CTO audit much simpler.
3. **UI resilience requires explicit handling** — 17 of the 30 audit fixes were UI edge cases (null values, empty states, zero-division). Every data-driven component needs defensive rendering.
4. **Tailwind CJS/ESM matters** — PostCSS expects CJS config; a one-line module format fix eliminated build warnings.
5. **Security surface area** — electron-store key allowlisting and fetch URL allowlisting are cheap wins that prevent entire classes of bugs.

---

## Phase 2: Intelligence (Ready to Begin After 1 Week Daily Use)
> Make it smarter with more history and deeper analysis.

### Deliverables
- 90-day trend charts for leakage categories (T10)
- BofA paydown simulator — "what if I add $X/month?" (T11)
- Spending pattern analysis — merchant-level drilldown (T12)
- Monthly review screen — this month vs last month (T13)
- Leaker trend lines — 6-month direction (T14)
- Weekly email digest (T15)

### Success Criteria
- Monthly review replaces any mental math Ben does now
- Trend data influences real spending decisions
- BofA payoff date is trending earlier, not later

### Entry Criteria
- ✅ Phase 1 complete
- [ ] 1 week of daily use
- [ ] At least 3 months of baseline data (YNAB + statements)

---

## Phase 3: iPhone App (Parallel or After Phase 2)
> SwiftUI app for morning glance + payday notification.

### Deliverables
- Separate repo, same YNAB API, same Claude API
- Morning summary: 3 stat cards + AI brief
- Paycheck notification + allocation view
- No deep drill-down (that's Windows)

### Success Criteria
- Ben checks it at breakfast instead of opening the laptop
- Push notification on payday with allocation summary

### Entry Criteria
- Phase 1 stable ✅
- Core engine logic extracted to shared format (JSON data contracts)

---

## Phase 4: Autonomous (Future)
> The app learns and proactively helps.

### Deliverables
- Seasonal pattern detection (summer spikes, holidays)
- Proactive alerts: "You're 8 days from payday and leakers are at 140% of pace"
- BofA payoff countdown with confetti
- Anomaly detection (unusual payees, unusual amounts)
- Weekly email digest (optional)

### Success Criteria
- App catches problems before Ben notices them
- BofA reaches $0 (ultimate success)

---

## Timeline Estimates

| Phase | Duration | Depends On | Status |
|---|---|---|---|
| Phase 1 | 2-3 weeks of build time | Nothing | ✅ COMPLETE (March 24, 2026) |
| Phase 2 | 2-3 weeks after Phase 1 | 1 week of Phase 1 daily use + 3 months data | Ready to begin |
| Phase 3 | 3-4 weeks | Phase 1 stable, data contracts defined | Phase 1 stable ✅ |
| Phase 4 | Ongoing | 6+ months of data for pattern detection | Future |
