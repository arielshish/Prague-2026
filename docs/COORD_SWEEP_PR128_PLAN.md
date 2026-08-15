# Coordinate Sweep Plan for Selection Bank — PR #128

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Working branch: `feature/selection-bank-coordinate-sweep`
Backup branch: `backup/pre-selection-bank-coord-sweep-2026-08-15`

## Goal

Before implementing the trip-summary selection bank, every item that can enter the bank must have a real coordinate.

The bank must not contain unlocated items.

## Rule

- Real places: add exact `PLACE_COORDS` aliases or coordinates.
- Existing places with alternate wording: add alias to the existing coordinate.
- Multi-place sentences: do not add as a single point.
- Tips, tickets, instructions, routes and broad areas: do not treat as places.
- Broad labels like `שפת הנהר Vltava – בלילה` need a chosen exact stop before they can become a selectable map item.

## Current baseline

PR #127 already added 21 coordinate aliases and deployed as `2026-08-15-e`.

## Next implementation step

Add a strict audit focused on selection-bank candidates, then add remaining safe aliases.

The output must include:

- all items eligible for the bank have coordinates
- excluded non-place strings documented
- unresolved ambiguous strings documented for user decision
- no changes to visited, expenses, days, Firestore rules, backend or GAS

## Important correction log

A documentation file was briefly added directly to `main` by mistake and immediately removed. It was docs-only and did not modify `app.html`, production logic, localStorage keys, Firestore paths, backend, or GAS.

All further PR #128 work must happen only on `feature/selection-bank-coordinate-sweep` until the user approves a PR/merge.
