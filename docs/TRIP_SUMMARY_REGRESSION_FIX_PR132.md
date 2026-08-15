# Trip Summary Regression Fix — PR #132

Branch: `feature/trip-summary-regression-fix-clean`
Backup: `backup/pre-trip-summary-regression-fix-2026-08-15`

## Fixes

- `+ ביקור` now preserves the base summary row and appends additional manual visit rows.
- Manual visit rows use a unique de-duplication key and are not swallowed by GPS/name de-dupe.
- Trip Summary editor and selection bank lock body scroll while open.
- Burger King OC Eden GPS aliases moved into `PLACE_COORDS`.
- Burger King day stop normalized to `desc` and `mapUrl`.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests extracted from the real `app.html` functions:
  - Pure/Náplavka still de-dupes to one row.
  - Pizza & Pasta Factory base + extra manual visit stays two rows.
  - `_applyTripSummaryOverrides()` preserves base and appends extra visit.
- Static guards verify scroll helpers, Burger King GPS/boolean aliases, and protected storage/Firestore key counts.

## Boundaries

No intentional changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-j`.
