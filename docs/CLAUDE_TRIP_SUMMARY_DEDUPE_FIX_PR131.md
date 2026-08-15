# Claude Handoff — Trip Summary Dedupe Fix PR #131

Date: 2026-08-15

## Context

PR #130 added two expense-derived places as guaranteed day stops:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

The user then reported duplicates in Trip Summary.

## Implementation

This PR keeps the original trip-summary row builder intact by renaming it from `_tripSummaryData()` to `_tripSummaryDataRaw()`.

A new `_tripSummaryData()` wrapper returns:

```js
_tripSummaryDedupeRows(_tripSummaryDataRaw())
```

This means all existing summary behavior remains, with only final row de-duplication added.

## Canonical groups

- Pure / Náplavka / farmers market on the river
- Pražská tržnice / השוק הגדול / Holešovice

## Boundaries

Summary display only. Do not mutate days, expenses, visited state, Firestore, backend, or GAS.
