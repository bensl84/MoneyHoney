# Backlog — MoneyHoney

## Priority Labels
- **P0**: Blocks daily use
- **P1**: Important for Phase 1 quality
- **P2**: Nice to have, Phase 2 candidate
- **P3**: Future / low priority

---

## Done (Phase 1)

- [x] **Loading states**: Every view shows a spinner or skeleton while data loads. No blank screens. *(Fixed in CTO audit)*
- [x] **Error messages**: Every error tells the user what happened and what to do. No technical jargon. *(Fixed in CTO audit)*

---

## Bugs
*(None open)*

---

## Improvements (P1)

- [ ] **Graceful offline mode**: Cache last successful YNAB fetch. If API unavailable, show cached data with "last updated" timestamp.
- [ ] **Keyboard navigation**: Tab/Enter should work for all primary actions. Power user efficiency.
- [ ] **App icon**: Currently uses default Electron icon. Add branded MoneyHoney icon for taskbar, installer, and window title.
- [ ] **Code signing**: Add code signing for Windows installer to avoid SmartScreen warnings.

---

## Phase 2 Features (P2)

- [ ] **90-day trend charts**: Line charts for MTD spend over time per leakage category
- [ ] **BofA paydown simulator**: "What if I add $X/month?" slider with projected payoff date
- [ ] **Merchant-level drilldown**: Click a category to see individual transactions ranked by amount
- [ ] **Monthly review screen**: End-of-month summary comparing to previous month
- [ ] **Leaker trend lines**: Is dining going up or down over 6 months? Directional arrow.
- [ ] **Weekly email summary**: Optional email digest with key stats (requires email integration)
- [ ] **Multiple debt targets**: Support tracking more than just BofA (future credit cards, loans)
- [ ] **CSV export**: Export transaction data and reports for spreadsheet analysis
- [ ] **Transaction search/filter**: Add search and filtering in the Transactions view (by payee, amount, date range, category)
- [ ] **Data export (CSV)**: Export transactions from any view to CSV for external analysis

---

## Phase 3 Features (P3)

- [ ] **iPhone app (SwiftUI)**: Morning summary, payday notification, no deep drill-down
- [ ] **Seasonal pattern detection**: App learns summer spending spikes, holiday spending, etc.
- [ ] **Proactive alerts**: "You're 8 days from payday and leakers are at 140% of pace"
- [ ] **Anomaly detection**: Flag unusual payees or unusual amounts automatically
- [ ] **BofA payoff countdown**: Confetti animation when balance hits $0
- [ ] **Auto-update**: Electron auto-updater for seamless version upgrades

---

## Technical Debt (address as encountered)

- [ ] **PDF parser robustness**: Initial support for Chase and BofA formats only. Other banks will need format-specific parsers.
- [ ] **API key security**: Phase 1 stores Claude API key in electron-store. Future: move to OS keychain or environment variable.
- [ ] **Transaction caching strategy**: Current approach caches in electron-store. May need to limit cache size for 12+ months of data.
- [ ] **Test coverage**: Engine modules must have >90% coverage. Views are manual verification for Phase 1.

---

## Ideas (Unvalidated)

- [ ] Spending velocity indicator: "At this pace, you'll spend $X by month end"
- [ ] Category rename/merge: Let Ben rename or combine leakage categories
- [ ] Receipt photo storage: Attach photos to transactions (camera or file)
- [ ] Net worth tracker: Simple assets vs liabilities view
- [ ] Savings goal: After BofA is killed, redirect extra to savings target
