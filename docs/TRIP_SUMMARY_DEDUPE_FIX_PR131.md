# Trip Summary Dedupe Fix — PR #131

Date: 2026-08-15
Branch: `feature/trip-summary-dedupe-fix`
Backup: `backup/pre-trip-summary-dedupe-fix-2026-08-15`

## Problem

After adding expense-derived stops in PR #130, the Trip Summary can show duplicate rows when the same real stop arrives from more than one source:

- itinerary/day guard
- map/place aliases
- manual summary/bank rows
- expense-derived names

The user noticed the duplication specifically in the summary.

## Fix

Add summary-only de-duplication around `_tripSummaryData()`.

The original data builder remains intact. The wrapper only de-duplicates the returned rows before rendering.

The dedupe key prefers:

1. explicit known canonical groups for the new stops
2. GPS coordinates rounded to 5 decimals
3. normalized name fallback

Known canonical groups added:

- `Pure גלידה` / `Náplavka` / `שוק האיכרים על הנהר`
- `Pražská tržnice` / `השוק הגדול` / `הולשוביצה`

## Safety

This fix does not change:

- expenses storage
- visited state
- days storage
- Firestore paths
- backend
- GAS

It only affects Trip Summary row display de-duplication.

## Version

`BUILD_ID` advanced to `2026-08-15-i`.
