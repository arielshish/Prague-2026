# Claude Handoff — Trip Summary Selection Bank PR #129

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-selection-bank`
Backup: `backup/pre-trip-summary-selection-bank-2026-08-15`

## User intent

The user wants the trip-summary bank implemented and deployed, with backup and documentation.

The user emphasized:

- every selectable bank item must have location
- items without location must not enter the bank
- compound strings containing several real places should be split/de-duplicated, not represented as one fake GPS point

## Implementation summary

Adds a `📋 בנק בחירה` panel for Trip Summary.

The panel collects candidates from:

- `_tripSummaryBaseData()`
- `getDaysState()` itinerary stops
- `_mappablePlaces()`
- existing trip-summary overrides / manual additions
- hidden override names when they resolve to GPS

Each candidate is included only if it has coordinates.

## Actions

- Show/add: removes `hidden[name]`; if the item is not part of base summary, adds it to `o.added` with label `נוסף מבנק הבחירה`
- Hide: sets `o.hidden[name] = true`

Actions save through `_saveTripSummaryOverrides(o)` and refresh via `_refreshTripSummaryPreview()`.

## Explicit non-goals

Do not mutate:

- `prague_visited_v1`
- expenses
- days/schedule storage
- backend/GAS
- Firestore rules

Do not geocode or guess GPS client-side.

## Validation expectations

- `BUILD_ID` is `2026-08-15-g`
- inline JS passes `node --check`
- no new `localStorage.removeItem`
- no new `localStorage.clear`
- protected localStorage keys and Firestore paths unchanged
- final diff contains only `app.html` and docs
