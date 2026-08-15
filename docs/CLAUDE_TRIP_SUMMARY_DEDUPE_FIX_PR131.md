# Claude Handoff — Trip Summary Dedupe Fix PR #131

Date: 2026-08-15

## Context

PR #130 added two expense-derived places as guaranteed day stops:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

The user then reported duplicate rows in the Trip Summary.

## Fix Applied

Trip Summary now wraps `_tripSummaryData()` and runs returned rows through `_tripSummaryDedupeRows(rows)` before rendering.

`_tripSummaryDedupeKey(r)` canonicalizes the new stop families and then falls back to GPS rounding / normalized name.

## Important

This is summary-only. It does not mutate days, expenses, visited state, or Firestore.

Future additions should prefer adding canonical mappings to `_tripSummaryDedupeKey` instead of adding broader destructive normalization.
