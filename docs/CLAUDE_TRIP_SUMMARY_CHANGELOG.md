# Claude Trip Summary Changelog — Prague 2026

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Current PR: `#123 Add read-only trip summary rows and storage helpers`

## Current safety state

This PR is intentionally isolated. It does **not** change the live app runtime.

No changes were made to:

- `app.html`
- active UI
- active script loading
- GitHub Pages workflow / deploy workflow
- existing localStorage keys
- existing Firestore sync paths
- `DAYS`
- visited state
- expenses
- budget
- packing list

The PR currently adds files under `tools/` plus this documentation file only.

## Backup branches

Relevant rollback/checkpoint branches:

- `backup/pre-trip-summary-audit-2026-08-15`
- `backup/pre-audit-mode-implementation-2026-08-15`
- `backup/pre-build-trip-summary-rows-2026-08-15`

The branch used for this PR is:

- `feature/build-trip-summary-rows-readonly`

The current base for this PR is the `main` commit that already includes PR #122:

- `cb12191f88cfd61834298aa1e8503688d8919a2d`

## What PR #122 did

PR #122 added a read-only audit tool and documentation:

- `tools/trip-summary-audit.js`
- `docs/TRIP_SUMMARY_AUDIT_MODE.md`

It was merged only after verifying that it changed no runtime files.

## What PR #123 adds

### 1. `tools/trip-summary-rows-readonly.js`

Adds `buildTripSummaryRows()` as a pure function.

Inputs are passed explicitly as a snapshot object:

- `days`
- `visited`
- `expenses`
- `allPlaces`
- `placeCoords`
- optional `canonicalName(name)`
- optional `visitedDayOf(name)`

Output is an array of summary rows only.

Important behavior:

- Scheduled day is preferred as the proposed summary day.
- Visited timestamp day is used as fallback.
- Expense evidence is supporting evidence only, not the source of truth.
- Same-coordinate aliases can be identified, but distinct chain branches must remain distinct.
- Warnings are produced for mismatches and missing coordinates.

### 2. `tools/trip-summary-rows-readonly.test.js`

Tests cover:

- scheduled + visited + expense place
- alias by coordinates: `Gran Fierro` / `ארוחת ערב — Gran Fierro`
- separation between `Primark Wenceslas Square` and `Primark Metropole Zličín`

### 3. `tools/trip-summary-overrides-store.js`

Adds a storage helper for future manual summary overrides.

This is adapter-based and not connected to the app yet.

Intended keys:

- localStorage: `prague_trip_summary_overrides_v1`
- localStorage timestamp: `prague_trip_summary_overrides_ts`
- Firestore document: `appdata/trip_summary`

Safety behavior:

- Remote empty state must not overwrite local meaningful data.
- Older remote state must not overwrite newer local state.
- Cloud save uses `{ merge: true }` on an isolated Firestore document.
- No existing app keys are touched.

Existing app keys that must remain protected:

- `prague_days_v1`
- `prague_visited_v1`
- `prague_exp_v10`
- `prague_exp_ts`
- `prague_budget_v1`
- `prague_total_budget`
- `prague_pack_v2`
- `prague_remindersDone`

### 4. `tools/trip-summary-overrides-store.test.js`

Tests cover:

- local save writes only the new override keys
- remote empty does not overwrite local meaningful data
- remote older than local does not overwrite local
- cloud save uses isolated document and `merge: true`

## Important user constraints

The user explicitly required:

- full backup before changes
- read-only/audit-first workflow
- no accidental damage to localStorage or Firestore
- no silent changes to `app.html`
- item-by-item controlled approval
- no merge/deploy without clear checkpointing

## Current implementation boundary

PR #123 is still a safe checkpoint. It prepares testable logic but does not activate it.

Do not claim the live app uses these helpers until a future PR explicitly wires them into `app.html`.

## Future integration plan

Only after PR #123 is reviewed/accepted:

1. Create a new backup branch from current `main`.
2. Create a new feature branch for app integration.
3. Patch `app.html` minimally and surgically.
4. Add `buildTripSummaryRows()` usage only as read-only display first.
5. Do not add manual overrides until read-only rendering is verified.
6. Add override UI only after confirming protected keys remain unchanged.
7. Add Firestore sync for `appdata/trip_summary` only after local behavior is tested.

## Stop conditions

Stop immediately if any diff includes unintended changes to:

- `app.html` beyond the approved integration block
- GitHub workflows
- existing Firestore paths
- existing localStorage keys
- map rendering functions
- visited save/load functions
- expense save/load functions

## Recommended validation commands

When running locally from repository root:

```bash
node --check tools/trip-summary-rows-readonly.js
node --check tools/trip-summary-rows-readonly.test.js
node tools/trip-summary-rows-readonly.test.js

node --check tools/trip-summary-overrides-store.js
node --check tools/trip-summary-overrides-store.test.js
node tools/trip-summary-overrides-store.test.js
```

Expected: all commands pass.

## Human-readable summary

This PR is a preparation layer only. It creates tested, isolated logic for trip-summary rows and future override storage. It does not alter the live app, does not write to the user's real localStorage or Firestore, and does not change deployment behavior.
