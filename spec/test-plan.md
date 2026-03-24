# Test Plan — Cash Ops

## Strategy

Engine modules (`src/engine/*`) are pure functions — fully unit testable without React or Electron. API clients (`src/api/*`) are tested with mocked HTTP responses. Views are validated manually + snapshot tests where valuable.

**Framework**: Vitest
**Run**: `npm run test`

---

## Critical Paths (Must Not Break)

### 1. Transaction Deduplication
The highest-risk logic in the app. False positives (missing real transactions) or false negatives (double-counting) destroy trust.

**Tests**:
- Exact match (same date, amount, payee) → deduplicated
- Date ± 1 day with same amount and payee → deduplicated
- Date ± 2 days with same amount and payee → deduplicated
- Date ± 3 days with same amount → NOT deduplicated (outside window)
- Same date and amount but different payee → NOT deduplicated
- Payee normalization: "AMAZON.COM*123ABC" → "amazon" matches "Amazon.com"
- Empty YNAB data → all statement transactions kept
- Empty statement data → no changes to baseline

### 2. Leakage Calculation
- MTD under baseline → green, delta negative, BofA impact = 0
- MTD 0-20% over baseline → amber, delta positive
- MTD 20%+ over baseline → red, delta positive
- BofA impact = sum of all positive deltas
- Zero baseline (no history) → show MTD only, no color coding
- Category with zero MTD spend → green

### 3. Payday Detection
- Thursday inflow to Chase Checking, $2,400-$2,600 → detected
- Thursday inflow, $2,399 → NOT detected (under threshold)
- Thursday inflow, $2,601 → NOT detected (over threshold)
- Friday inflow (day after Thursday) → NOT detected
- Multiple inflows on Thursday (e.g., reimbursement + paycheck) → only paycheck-sized one detected
- No inflow → null returned, no error

### 4. Payday Allocation
- Bills + variable + gas = less than paycheck → BofA extra > 0
- Bills alone exceed paycheck → BofA extra = 0, warning surfaced
- All items sum to exactly paycheck amount (no rounding errors)
- Empty bills list → full paycheck allocated to variable + BofA

### 5. Token Persistence
- Save token via electron-store → survives app restart
- Clear token → next open prompts for token
- Invalid token → YNAB API returns 401 → user-facing error message

### 6. Goals Persistence
- Set BofA balance → survives restart
- Set leakage limits → survives restart
- Update balance → projections recalculate immediately

---

## Unit Tests (Engine Modules)

### `tests/engine/leakage.test.js`
```
describe('calculateLeakage')
  - returns correct delta for each category
  - color thresholds: green, amber, red
  - handles zero baseline gracefully
  - BofA impact = sum of positive deltas only

describe('computeBaseline')
  - averages correctly over 3 months
  - handles missing months (less than 3 months of data)
  - updates when new statement added

describe('colorThreshold')
  - under baseline → green
  - 0-20% over → amber
  - 20%+ over → red
  - exact baseline → green
```

### `tests/engine/payday.test.js`
```
describe('detectPayday')
  - detects paycheck on Thursday
  - ignores non-Thursday inflows
  - ignores amounts outside range
  - handles no recent transactions

describe('generateAllocation')
  - allocates bills first, then variable, then BofA
  - BofA extra = paycheck - bills - variable
  - handles edge case: bills exceed paycheck
  - all items sum to paycheck total
```

### `tests/engine/transactions.test.js`
```
describe('categorizeTransaction')
  - maps known restaurant payees to Dining Out
  - maps alcohol-related payees to Booze
  - maps Amazon payees to Amazon/Online Shopping
  - unknown payee → null leakage category

describe('filterByDateRange')
  - includes transactions within range
  - excludes transactions outside range
  - handles empty transaction list

describe('calculateMTD')
  - sums correctly for current month
  - excludes previous month transactions
```

### `tests/engine/statements.test.js`
```
describe('deduplicateAgainstYNAB')
  - removes exact matches
  - removes date ± 2 day matches with same amount + payee
  - keeps transactions outside dedup window
  - keeps transactions with different amounts

describe('normalizePayee')
  - lowercases
  - strips whitespace
  - removes transaction IDs (AMAZON.COM*123ABC → amazon.com)
  - handles empty string
```

---

## Integration Tests

### YNAB API Client (`tests/api/ynab.test.js`)
- Mock successful response → returns parsed transactions
- Mock 401 → throws with user-facing message
- Mock network error → retries 3x then throws
- Mock rate limit (429) → backs off and retries

---

## Manual Verification Checklist

### First Run
- [ ] App opens to Settings tab (no token saved)
- [ ] Enter YNAB token → saved → Overview tab loads with data
- [ ] Close and reopen → token still there, data loads automatically

### Daily Use
- [ ] Overview shows MTD spend, stat cards, AI brief
- [ ] AI brief mentions BofA or leakage with dollar figures
- [ ] Leakage tab shows 4 categories with correct colors
- [ ] BofA tab shows balance, velocity, two projections

### Payday
- [ ] Simulate payday inflow → Payday tab auto-surfaces
- [ ] Allocation shows numbered list of all items
- [ ] BofA extra is the final line item
- [ ] All items sum to paycheck amount

### Statement Upload
- [ ] Upload Chase PDF → transactions extracted
- [ ] No duplicates with existing YNAB data
- [ ] Baselines recalculate
- [ ] Upload history shows in Settings

### Packaging
- [ ] `npm run build` produces .exe
- [ ] Install on clean machine
- [ ] All features work
- [ ] No dev tools visible

---

## Regression Risks

| Change | Risk | Mitigation |
|---|---|---|
| Dedup logic modified | Double-counting transactions | Run full dedup test suite |
| electron-store schema change | Existing saved data lost | Schema migration or backward-compat |
| YNAB API update | Data parsing breaks | Pin API version, test with mocked responses |
| New leakage category added | Existing baselines invalidated | Recalculate baselines on category change |
| Paycheck amount changes | Detection fails | Make thresholds configurable in constants.js |
