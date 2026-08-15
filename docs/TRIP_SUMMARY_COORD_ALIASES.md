# Trip Summary Missing Coordinate Aliases — PR #127

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/missing-trip-summary-coords`
Backup branch: `backup/pre-missing-coords-2026-08-15`

## Purpose

Add missing/alternative `PLACE_COORDS` aliases needed before the trip-summary selection bank.

## Added aliases

- `FAT CAT Downtown`
- `Fat Cat Downtown`
- `FAT CAT Downtown — כיכר וצסלב`
- `אי קמפה – Kampa Island`
- `אי קמפה (Kampa Island)`
- `Kampa Island`
- `Makakiko Running Sushi`
- `Makakiko Running Sushi — Palladium`
- `Primark Metropole Zličín`
- `Primark — Metropole Zličín`

## Coordinates used

- FAT CAT Downtown / Wenceslas Square: `[50.0811606, 14.4284073]`
- Kampa Island: `[50.084581, 14.408223]`
- Makakiko Running Sushi Palladium: `[50.0890049, 14.4291743]`
- Primark Metropole Zličín: `[50.05340, 14.28946]`

## Safety boundaries

Changed only static coordinate aliases and `BUILD_ID`.

Do not touch:

- visited state / `prague_visited_v1`
- manual summary overrides / `prague_trip_summary_overrides_v1`
- Firestore `appdata/trip_summary`
- Firestore `appdata/main`
- Firestore `appdata/expenses`
- schedule, expenses, login, GAS/backend

## Validation

The apply workflow checks:

- all aliases exist in `PLACE_COORDS`
- `BUILD_ID` is `2026-08-15-d`
- no protected localStorage keys changed
- no `appdata/*` paths changed
- no new `localStorage.removeItem` or `localStorage.clear`
- inline JavaScript passes `node --check`
