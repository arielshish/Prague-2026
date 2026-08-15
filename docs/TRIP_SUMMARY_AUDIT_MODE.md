# Trip Summary Audit Mode — Read Only

This is the first controlled implementation step for the Prague 2026 trip-summary cleanup.

## Status

Branch: `feature/trip-summary-audit-mode`

This phase is intentionally **read-only**.

## Files added

- `tools/trip-summary-audit.js`

No changes were made to:

- `app.html`
- `DAYS`
- `PLACE_COORDS`
- `VISITED_KEY`
- `prague_days_v1`
- `prague_visited_v1`
- `prague_exp_v10`
- Firestore sync listeners
- Firebase save paths

## Purpose

The audit tool maps how the app currently sees each candidate place:

- place name
- canonical name
- visited state
- visited day by timestamp
- scheduled day from `getDaysState()`
- coordinate availability
- expense evidence
- proposed summary day
- warnings

It is meant to expose problems before implementing any summary overrides.

## Read-only safety rules

The tool must not call:

- `localStorage.setItem()`
- `localStorage.removeItem()`
- `localStorage.clear()`
- `saveVisitedState()`
- `saveDaysState()`
- `saveLocal()`
- Firestore `.set()` / `.update()` / `.delete()`

The tool only reads app globals and localStorage.

## Privacy guard

The audit snapshot does **not** include localStorage values or previews.

For protected localStorage keys, it records only:

- whether the key exists
- the value length

This is enough to detect whether a key changed during the audit without exposing the saved trip data.

## How to run manually

1. Open the live Prague app in a browser.
2. Open DevTools Console.
3. Paste the contents of `tools/trip-summary-audit.js`.
4. Run:

```js
PragueTripSummaryAudit.run()
```

The return value is a report object:

```js
{
  summary: {...},
  localStorageChangedDuringAudit: [],
  rows: [...]
}
```

`localStorageChangedDuringAudit` must remain an empty array. If it is not empty, stop and investigate before doing any additional work.

## Expected next phase

Only after this audit output is reviewed:

1. Add `buildTripSummaryRows()` in the app.
2. Keep it read-only.
3. Add a separate override key only after manual approval:
   `prague_trip_summary_overrides_v1`

## Rollback

Since this phase only adds standalone files, rollback is simply reverting/removing the added files from the feature branch.

The protected backup branches remain available:

- `backup/pre-trip-summary-audit-2026-08-15`
- `backup/pre-audit-mode-implementation-2026-08-15`
