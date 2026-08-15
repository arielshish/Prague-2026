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


## Later addition in same PR

User uploaded a Burger King receipt and asked to add it.
Added:

- `Burger King — OC Eden`
- aliases: `Burger King OC Eden`, `BK Praha OC Eden`, `Burger King — U Slavie`
- day stop above the other 15.08 expense-derived stops
- summary dedupe key `poi:burger-king-oc-eden`

Do not mark as visited automatically; the user can mark it in the app.
