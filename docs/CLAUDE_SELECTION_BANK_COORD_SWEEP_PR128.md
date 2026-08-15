# Claude Handoff — Selection Bank Coordinate Sweep PR #128

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/selection-bank-coordinate-sweep`
Backup: `backup/pre-selection-bank-coord-sweep-2026-08-15`

## Purpose

The user wants the future trip-summary selection bank to contain only places with GPS coordinates.

This PR is the preparation step before the actual bank UI.

## Hard rule for the future bank

Do not let a selectable bank item appear without coordinates.

If a candidate does not resolve through `PLACE_COORDS[name]` or an existing map record coordinate, it must not be selectable.

## What this PR does

Adds safe `PLACE_COORDS` aliases for real places that appeared in the audit as context or alternate wording.

This includes real places such as Manifesto Market Anděl, Prague Zoo, Museum Kampa, Jerusalem/Jubilee Synagogue, LEGO Store, and Albert in Palladium.

## What this PR does not do

It does not build the bank UI.
It does not alter visited state.
It does not alter expenses.
It does not alter days/schedule storage.
It does not change Firestore paths or rules.
It does not touch backend/GAS.

## Important implementation detail

Trip-summary manual additions resolve coordinates by exact name:

```js
coords: PLACE_COORDS[a.name] || null
```

Therefore aliases are useful and safe when they represent the same exact physical place.

## Non-place policy

Do not add GPS for strings that are:

- tips
- tickets
- instructions
- route titles
- combined multi-place labels
- broad areas without a chosen exact stop

Examples that should not be single GPS entries:

- `שפת הנהר Vltava – בלילה`
- `גן החיות של פראג + שייט ערב`
- `בין השעון האסטרונומי לגשר קארל`
- `Josefov, בית הכנסת ירושלים, Café Savoy`

These should be handled by the future bank as non-selectable or split into real POIs.

## Next PR after this

PR #129 should build the actual selection bank UI.

Required validation for PR #129:

- every selectable bank item has GPS
- missing-GPS items appear only in a separate review/non-selectable area
- no mutation of `prague_visited_v1` from bank actions
- use existing trip-summary override storage for show/hide/include choices
