# Trip Summary Dedupe Fix — PR #131

Date: 2026-08-15
Branch: `feature/trip-summary-dedupe-clean`
Backup: `backup/pre-trip-summary-dedupe-clean-2026-08-15`

## Problem

The user saw duplicate rows inside Trip Summary after adding expense-derived day stops in PR #130.

Likely duplicate families:

- `Pure גלידה`
- `Náplavka / שוק האיכרים על הנהר`
- `שוק האיכרים על הנהר — Náplavka`

and:

- `Pražská tržnice`
- `השוק הגדול — הולשוביצה`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

## Fix

The existing `_tripSummaryData()` implementation is preserved as `_tripSummaryDataRaw()`.

A new wrapper `_tripSummaryData()` runs the raw rows through `_tripSummaryDedupeRows()` before rendering.

Dedupe is summary-only and uses:

1. known canonical groups for the duplicated families above
2. GPS coordinate key rounded to 5 decimals
3. normalized name fallback

## Safety

No intentional changes to:

- expenses storage
- visited state / `prague_visited_v1`
- days storage / `prague_days_v1`
- Firestore paths
- Firestore rules
- backend
- GAS

No data deletion. No new localStorage keys.

## Version

`BUILD_ID` advanced to `2026-08-15-i`.
