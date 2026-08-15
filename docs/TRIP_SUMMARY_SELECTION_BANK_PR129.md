# Trip Summary Selection Bank — PR #129

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-selection-bank`
Backup: `backup/pre-trip-summary-selection-bank-2026-08-15`

## Goal

Add a selectable bank inside Trip Summary so the user can show, add, or hide places from the trip summary.

## Hard rule

No GPS = not selectable.

The bank only includes candidates that resolve through `PLACE_COORDS[name]` or an existing map record coordinate.

## UI

Adds a `📋 בנק בחירה` button inside the existing manual trip-summary editor.

The bank panel includes:

- search by name
- filters: all / visible / hidden / not visible / visited / schedule
- GPS status badge
- source badges: summary, itinerary, map, manual, hidden
- actions: show/add or hide

## De-duplication

The bank de-duplicates by coordinate, so the same physical place does not appear multiple times when it comes from itinerary, map, and summary sources.

Compound strings are split into canonical places where explicitly known:

- `Josefov, בית הכנסת ירושלים, Café Savoy` → Josefov / Jerusalem Synagogue / Café Savoy
- `Primark → Na Příkopě → Palladium → Hamleys/LEGO` → Primark / Na Příkopě / Palladium / Hamleys + LEGO

## Storage

Uses the existing trip-summary override storage only:

- `prague_trip_summary_overrides_v1`
- `prague_trip_summary_overrides_ts`
- Firestore sync path already used by PR #126: `appdata/trip_summary`

No new localStorage keys or Firestore paths are introduced.

## Safety boundaries

No intentional changes to:

- visited state / `prague_visited_v1`
- expenses
- days/schedule storage
- Firestore rules
- login/auth
- backend
- GAS

Bank actions do not mark a place as visited.
