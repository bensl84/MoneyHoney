# Context — Who This Is For and Why

## App Identity

| Field | Value |
|---|---|
| **App Name** | Cash Ops |
| **App Type** | Windows desktop app (Electron) |
| **Stage** | Concept → Phase 1 build |
| **Business Priority** | High — daily-use personal tool |
| **Single User** | Ben Leonard |

---

## The User

Ben Leonard. Operations Manager at BlueHat Mechanical (commercial HVAC). Lives in Raleigh, NC. Family: wife Nikki + kids.

### Income
- ~$6,100/month take-home
- Paid biweekly, every other Thursday
- Paycheck: ~$2,400-$2,600 per deposit
- Direct deposit to Chase Main Checking

### Fixed Floor (~$5,210/month)
Bills that don't move. These are covered before anything else:
- Mortgage, car payments, insurance, utilities, subscriptions, daycare

### Real Discretionary Margin
~$890/month. Razor thin. Every dollar that leaks into unplanned spending is a dollar that doesn't go to BofA.

---

## The Core Problem

Ben knows his fixed bills. He doesn't know where the other money goes. Specifically:

1. **Eating out / restaurants** — Convenient but expensive. Adds up fast.
2. **Booze** — Bars, breweries, liquor stores. Not budgeted, not tracked.
3. **Kids stuff** — Activities, supplies, random purchases. Death by 1,000 cuts.
4. **Amazon / online drift** — Small purchases that compound. Easy to forget.
5. **Any spending that isn't on the planned budget** — Anything off-script erodes the margin.

These categories leak quietly and erode the margin he needs to kill debt and build savings. The current system (mental math + checking YNAB occasionally) doesn't catch it until it's too late.

---

## The Two Goals (Always In AI Context)

### Goal 1: Kill BofA
- Current balance: ~$13,500 (BofA Cash Rewards credit card)
- Account ID: `cb7fb148-421f-4925-a3ff-0bdf69924e2a`
- This is the primary debt target — every extra dollar should go here
- App must always know the current balance and track paydown velocity
- Expected payoff timeline should be surfaced regularly
- Interest is costing real money every month — the app should quantify this

### Goal 2: Stop the Leakage
- Combined limit: $400/month across all 4 categories
- Default limits: Dining $150, Booze $80, Kids $200, Amazon $150
- The AI should be opinionated and direct: "You spent $380 on restaurants this month, that's $230 over your baseline, that's $230 not going to BofA"
- Every dollar of leakage has a direct, quantifiable impact on BofA payoff timeline

---

## What the Citi Costco Card Actually Is

- **NOT a debt payoff target**
- Revolving daily spend card used for Costco cashback rewards
- Ben and Nikki run daily spending through it and pay it monthly
- Balance fluctuates with normal spend (~$4,000-$6,500 at any point)
- Track it for leakage detection (transactions flow through it) but don't treat it as debt
- Never alarm on its balance. Never include in payoff projections.

---

## How Ben Uses Money

- **Payday** = biweekly Thursday, ~$2,400-$2,600 to Chase Checking
- On payday he wants to know:
  1. What bills are due before next check?
  2. How much discretionary is left?
  3. How much extra can go to BofA?
- He wants an **actual allocation** — "put $X here, $Y here, $Z at BofA" — not a suggestion to think about it
- He does not want to maintain YNAB envelopes — the app does the thinking

---

## AI Tone Requirements

- **Opinionated**. Direct. No hedging. No "you might want to consider..."
- **Always goal-aware** — every analysis connects back to BofA paydown and leakage control
- **Call out bad patterns** with dollar amounts: "Dining is $230 over baseline. That's pushing your BofA payoff back 3 weeks."
- **If spending is fine, say so simply** — don't manufacture concern
- **Build toward goals**, not just report on them
- **3 sentences max** for the daily brief

---

## Historical Data

- YNAB is new — limited history in the API (maybe 2-3 months)
- Ben can upload past bank/CC statements (PDF) to build a fuller picture
- Goal: eventually have 12+ months of data to establish true baseline patterns
- Statement upload + deduplication is the mechanism to backfill history

---

## Definition of Success

Ben opens the app every morning in 30 seconds and knows:

1. **Am I on track this month?** (MTD spend vs projection)
2. **Where is the leakage?** (4 categories, dollar amounts, BofA impact)
3. **What does BofA look like?** (balance, velocity, payoff date)
4. **On payday: exactly where does this money go?** (full allocation)

He stops guessing. The app does the thinking. The BofA balance goes down. The leakage stays contained.

**Phase 1 is done when**: Ben opens it every morning and it tells him something useful that he didn't already know.
