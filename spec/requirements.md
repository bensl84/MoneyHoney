# Requirements — Cash Ops

## Purpose

Daily personal finance intelligence. YNAB is the data pipe. Claude AI is the analyst. The app tells Ben the truth about his money every morning and on payday. No sugarcoating, no hedging — direct, opinionated, dollar-denominated analysis.

## Users

Single user: Ben Leonard. No multi-user, no auth, no sharing.

---

## Core Features

### 1. Daily Morning Brief
- Pull last 90 days of YNAB transactions on app open
- Surface: MTD total spend, projected month-end total, vs last month same period
- AI brief: 3 sentences max, opinionated, always references at least one goal
- Always flags: dining/booze/kids/Amazon vs historical baseline with dollar amounts
- Stat cards: MTD spend, days left in month, BofA balance, leakage total

**Acceptance**: App opens, data loads in < 5 seconds, AI brief appears with goal-specific dollar figures.

### 2. Leakage Tracker
- Dedicated view for 4 off-budget categories:
  - Dining Out
  - Booze (any alcohol payee — bars, liquor stores, brewery)
  - Kids Activities / Stuff
  - Amazon / Online Shopping
- MTD spend vs monthly average (baseline from last 3 months or uploaded statements)
- Dollar amount "leaked" vs baseline = dollars NOT going to BofA
- Color coded: Green (under baseline), Amber (0-20% over), Red (20%+ over)
- Category bar visualization showing progress toward limit

**Acceptance**: Leakage view shows 4 categories with MTD, baseline, delta, BofA impact, color coding.

### 3. BofA Paydown Dashboard
- Current balance: manual input, stored in electron-store, updated monthly
- MTD extra payments made (pulled from YNAB — payments to BofA account)
- Paydown velocity: average $/month over last 3 months of payments
- Projection A: payoff date at current pace
- Projection B: payoff date if leakage was zeroed (motivator — show the difference)
- Interest cost estimate at current pace vs zero-leakage pace

**Acceptance**: Dashboard shows balance, velocity, two payoff projections with date and dollar difference.

### 4. Payday Allocator
- Detect payday: inflow to Chase Checking matching ~$2,400-$2,600 range on Thursday
- Pull upcoming bills (next 14 days) from YNAB scheduled transactions
- Calculate: available = paycheck - bills due - variable spending estimate
- Generate allocation: bills first → groceries → gas → variable → BofA extra
- Output as numbered list: "1. Mortgage $789, 2. Gas $168 ... 7. BofA extra $XXX"
- Auto-surface on payday detection, accessible anytime from Payday tab

**Acceptance**: On simulated/real payday, allocator generates complete dollar-by-dollar plan. BofA extra maximized.

### 5. Statement Upload
- File picker for PDF bank/CC statements (native Electron dialog)
- Parse with pdf-parse in main process, send extracted data to renderer via IPC
- Extract: date, payee, amount per transaction
- Deduplicate against existing YNAB transactions: match on `date ± 2 days` + `amount` + `normalized payee`
- Store parsed transactions in electron-store baseline history
- Recalculate category baselines after each upload
- Show upload history: filename, date uploaded, transaction count

**Acceptance**: Upload a Chase PDF statement. Transactions appear. Baselines update. Zero duplicates with YNAB data.

### 6. Goals Engine
- Persistent goals stored in electron-store:
  - BofA target balance ($0), current balance, last updated date
  - Leakage category monthly limits (default: Dining $150, Booze $80, Kids $200, Amazon $150)
- Every Claude API call injects full goal context:
  - BofA balance + target + velocity + months until payoff
  - Leakage limits + current MTD per category
- AI brief must reference at least one goal explicitly with dollar figures
- Payday allocation prompt includes: "allocate to maximize BofA paydown after essentials"
- Goals editable in Settings view

**Acceptance**: AI brief mentions BofA or leakage by name with specific dollar figures. Not generic.

---

## Behavior Specs

```
WHEN app opens
  → SYSTEM SHALL pull latest YNAB transactions (90 days)
  → SYSTEM SHALL refresh AI brief with current goal context
  → SYSTEM SHALL update all stat cards and views

WHEN it is a Thursday AND a paycheck-sized inflow lands in Chase Checking
  → SYSTEM SHALL auto-surface the Payday Allocator tab
  → SYSTEM SHALL generate a complete allocation recommendation

WHEN a leakage category exceeds 20% over baseline
  → SYSTEM SHALL flag it in RED with dollar impact on BofA paydown
  → SYSTEM SHALL include it in the AI brief

WHEN BofA balance is manually updated
  → SYSTEM SHALL recalculate payoff projections
  → SYSTEM SHALL surface the change in the AI brief

WHEN a PDF statement is uploaded
  → SYSTEM SHALL parse transactions
  → SYSTEM SHALL deduplicate against YNAB data
  → SYSTEM SHALL merge into baseline history
  → SYSTEM SHALL recalculate category baselines

WHEN AI brief is generated
  → SYSTEM SHALL always reference at least one goal explicitly
  → SYSTEM SHALL use dollar amounts, not percentages alone
  → SYSTEM SHALL be 3 sentences max, opinionated, direct

WHEN YNAB API call fails
  → SYSTEM SHALL show user-facing error with retry button
  → SYSTEM SHALL use cached data if available
  → SYSTEM SHALL NOT show blank/broken state
```

---

## Out of Scope (Phase 1)

- Bank direct connection (Plaid) — YNAB API is sufficient
- Budget envelope management — YNAB handles this, not our job
- Shared/family view — single user
- Cloud sync — local only, YNAB is the source of truth
- iPhone app — Phase 2
- Auto-update mechanism — manual updates for Phase 1
- Multi-account debt tracking — BofA only
- Investment tracking — out of scope entirely
- Bill reminders/notifications — the allocator covers payday planning

---

## What Must Not Break

| Invariant | Why |
|---|---|
| YNAB token persistence | Must survive app restarts. Enter once, use forever. |
| Transaction deduplication | Statement uploads must never double-count. False positives destroy trust. |
| Goals persistence | User goals must survive app updates. |
| Payday detection | Must reliably detect paycheck inflow on Thursdays. |
| BofA account isolation | Citi Costco must never appear in debt projections. |
| Engine purity | Engine modules must remain testable without React or Electron. |
| Security boundaries | No API keys in renderer. No node access from renderer. |
