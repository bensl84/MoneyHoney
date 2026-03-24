# Roadmap — Cash Ops

---

## Phase 1: Foundation (Current)
> Get a working Electron app that replaces the artifact and becomes a daily habit.

### Deliverables
- Electron shell running React dashboard (1200x800 window)
- Persistent token + goals storage (electron-store)
- YNAB transaction engine with leaker detection (4 categories)
- BofA paydown tracker with dual projections
- Payday allocator with dollar-by-dollar plan
- PDF statement upload with deduplication
- Opinionated, goal-aware AI brief (Claude API)
- Packaged Windows installer (.exe)

### Milestones
| # | Milestone | Tasks | Signal |
|---|---|---|---|
| M1 | App runs | T1 (scaffold) | `npm run dev` opens Electron + React |
| M2 | Data flows | T2 (port) + T3 (leakage) | YNAB transactions render, leakage calculated |
| M3 | Core features | T4 (BofA) + T5 (payday) | All 4 main views functional |
| M4 | History | T6 (statements) | Statement upload works, baselines update |
| M5 | Intelligence | T7 (AI engine) | AI brief references goals with dollar figures |
| M6 | Ship | T8 (package) | .exe installs and works on clean machine |

### Success Criteria
- Ben opens it every morning and it tells him something useful he didn't already know
- BofA balance is visible with a realistic payoff date
- Leakage categories show dollar impact on debt paydown
- Payday allocation generates a complete plan in < 5 seconds
- App startup to useful data: < 5 seconds

### Exit Criteria (Phase 1 → Phase 2)
- All 8 tasks complete and validated
- Ben has used it daily for 1 week
- No data-losing bugs
- AI brief is consistently goal-specific (not generic)

---

## Phase 2: Intelligence (After Daily Habit Established)
> Make it smarter with more history and deeper analysis.

### Deliverables
- 90-day trend charts for leakage categories
- BofA paydown simulator ("what if I add $X/month?")
- Spending pattern analysis (merchant-level drilldown)
- Monthly review screen (this month vs last month)
- Leaker trend lines (6-month direction)

### Success Criteria
- Monthly review replaces any mental math Ben does now
- Trend data influences real spending decisions
- BofA payoff date is trending earlier, not later

### Entry Criteria
- Phase 1 complete + 1 week of daily use
- At least 3 months of baseline data (YNAB + statements)

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
- Phase 1 stable
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

| Phase | Duration | Depends On |
|---|---|---|
| Phase 1 | 2-3 weeks of build time | Nothing — ready to start |
| Phase 2 | 2-3 weeks after Phase 1 | 1 week of Phase 1 daily use + 3 months data |
| Phase 3 | 3-4 weeks | Phase 1 stable, data contracts defined |
| Phase 4 | Ongoing | 6+ months of data for pattern detection |
