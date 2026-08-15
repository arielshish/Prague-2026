# Trip Summary Manual Visit De-dupe — PR #133

Date: 2026-08-15
Branch: `feature/manual-visit-dedupe-fix`
Backup: `backup/pre-manual-visit-dedupe-2026-08-15`

## Problem

After PR #132 correctly stopped hiding manual additional visits, older repeated taps on `+ ביקור` became visible as multiple identical `Pizza & Pasta Factory — ביקור נוסף` rows.

## Fix

- Do not delete or mutate saved override data.
- During Trip Summary rendering, collapse identical manual visits for the same place by `day + label`.
- Keep the base row and one unique additional manual visit.
- Preserve distinct manual visits when the day or label is different.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests extracted from `app.html`:
  - repeated same-day/same-label Pizza & Pasta Factory manual visits render once.
  - different-day manual visits remain distinct.
  - Pure/Náplavka duplicate still collapses.
- Static guards ensure protected storage/Firestore key counts are unchanged.

## Boundaries

No changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-k`.
