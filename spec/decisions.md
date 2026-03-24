# Engineering Decisions — Cash Ops

All decisions logged in ADR (Architecture Decision Record) format.

---

## ADR-001: Electron over PWA or Native Win32

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need a Windows desktop app that persists a YNAB token, opens daily, and can parse PDFs. Options: Electron, Tauri, PWA, native Win32/.NET.
**Decision**: Electron wrapping existing React artifact.
**Consequences**:
- (+) Reuses 100% of existing React code from artifact
- (+) Full Node.js for PDF parsing, no WASM complexity
- (+) electron-store for simple persistence
- (-) ~150MB app size (acceptable for personal use)
- (-) Memory overhead vs native (acceptable — single user, modern machine)

---

## ADR-002: YNAB as Read-Only Data Pipe

**Date**: 2026-03-23
**Status**: Accepted
**Context**: YNAB has built-in budgeting (envelopes) but Ben doesn't want to maintain them. Question: should the app integrate deeply with YNAB budgeting or treat it as a transaction source only?
**Decision**: Use YNAB API for transaction data only. All budgeting/analysis logic lives in Cash Ops.
**Consequences**:
- (+) Cleaner mental model — one tool for data, one tool for analysis
- (+) No YNAB maintenance burden
- (+) App works even if Ben stops using YNAB envelopes
- (-) Must build own baseline/goal engine (worth it for customization)
- (-) No write-back to YNAB (acceptable — analysis only)

---

## ADR-003: Citi Costco is NOT a Debt Target

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Citi Costco has ~$4,000-$6,500 revolving balance. It's used as a daily spend card for Costco cashback. Including it in debt projections would be misleading.
**Decision**: Track for leakage detection only. Never include in debt payoff projections.
**Consequences**:
- (+) Payoff projections are accurate (BofA only)
- (+) No false alarms on normal Costco spend fluctuations
- (-) Requires clear separation in code — BofA account ID vs all others

---

## ADR-004: electron-store for All Persistence

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to store YNAB token, goals, statement history, and cached transactions between sessions. Options: electron-store (JSON), SQLite, IndexedDB via Electron.
**Decision**: electron-store (JSON file in OS user data directory).
**Consequences**:
- (+) Simple — no database setup, no migrations
- (+) Human-readable JSON for debugging
- (+) Survives app updates (stored in user data dir, not app dir)
- (-) Not encrypted (acceptable: personal machine, personal data)
- (-) Not suitable for large datasets (acceptable: ~12 months of transactions fits easily)

---

## ADR-005: Statement Upload for Historical Baseline

**Date**: 2026-03-23
**Status**: Accepted
**Context**: YNAB is new — limited transaction history (2-3 months). Need baselines to detect leakage patterns. Options: manual entry, CSV import, PDF upload.
**Decision**: Allow PDF statement uploads, parse locally with pdf-parse, merge with YNAB data.
**Consequences**:
- (+) Ben can backfill 6-12 months from existing bank statements
- (+) Baselines improve over time as more statements are added
- (-) Requires deduplication logic (critical — must never double-count)
- (-) PDF format varies by bank (initial support: Chase, BofA)

---

## ADR-006: Tailwind CSS over Inline Styles

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Existing artifact used inline CSS. For a full app with multiple views, inline styles become hard to maintain consistently.
**Decision**: Tailwind CSS with utility classes. IBM Plex fonts via Google Fonts import.
**Consequences**:
- (+) Consistent spacing, colors, typography across all views
- (+) Dark theme via Tailwind dark mode utilities
- (+) Faster development — no context switching between JSX and CSS files
- (-) Additional build step (Tailwind JIT via PostCSS — handled by Vite)

---

## ADR-007: Simple Tab State over React Router

**Date**: 2026-03-23
**Status**: Accepted
**Context**: App has 6 views. Options: react-router, simple state-based tabs.
**Decision**: Simple `activeTab` state in App.jsx. No react-router.
**Consequences**:
- (+) Zero additional dependencies
- (+) Simpler mental model — no URL management in a desktop app
- (+) Easy to auto-switch tabs (e.g., payday detection → Payday tab)
- (-) No deep linking (not needed — desktop app, not web)

---

## ADR-008: Vitest for Testing

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Need to test pure engine modules. Options: Jest, Vitest, Mocha.
**Decision**: Vitest — Vite-native, fast, ESM-compatible.
**Consequences**:
- (+) Zero config with Vite
- (+) Same module resolution as production code
- (+) Fast — no babel transform overhead
- (-) Slightly newer ecosystem than Jest (acceptable — well-maintained)

---

## ADR-009: Claude API Key Storage Strategy

**Date**: 2026-03-23
**Status**: Accepted
**Context**: Claude API key needs to be accessible to the app. Options: environment variable, electron-store, hardcoded (never).
**Decision**: Phase 1: stored in electron-store alongside YNAB token (entered in Settings). Future: environment variable injected at build time.
**Rationale**: For a single-user personal app, storing in electron-store is equivalent security to a .env file. Both are local, both are unencrypted. Simpler UX for Phase 1.
**Consequences**:
- (+) Single settings flow for both API keys
- (+) No .env file management for non-developer user flow
- (-) Key is in plaintext JSON (same as .env — acceptable for personal use)
- Key NEVER sent to renderer — all Claude API calls made from main process or via secure IPC
