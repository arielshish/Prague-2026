# Trip Summary Coordinate Aliases — PR #127

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/missing-trip-summary-coords`
Backup branch: `backup/pre-missing-coords-2026-08-15`

## Purpose

Add missing/alternative `PLACE_COORDS` aliases needed before the trip-summary selection bank.

## First alias batch

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

## Reviewed audit alias batch

Added after reviewing `docs/FULL_TRIP_COORDS_AUDIT.md` and filtering out UI text, tickets, route labels, and explanatory sentences.

- `Clementinum – הספרייה הבארוקית`
- `IKEA Praha — Zličín`
- `Municipal House – Obecní dům`
- `Vyšehrad – המבצר הנסתר`
- `בית הריקוד – Dancing House`
- `גשר קארל – Charles Bridge`
- `הרובע היהודי – Josefov`
- `טירת פראג – Pražský hrad`
- `כיכר העיר העתיקה – Old Town Square`
- `מגדל פטרין – Petřín Tower`
- `שעון האסטרונומי – Orloj`

## Intentionally not added

- `שפת הנהר Vltava – בלילה` — broad route/area label, not one exact point.

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

Workflow checks:

- all reviewed aliases exist in `PLACE_COORDS`
- `BUILD_ID` is `2026-08-15-e`
- no protected localStorage keys changed
- no `appdata/*` paths changed
- no new `localStorage.removeItem` or `localStorage.clear`
- inline JavaScript passes `node --check`
