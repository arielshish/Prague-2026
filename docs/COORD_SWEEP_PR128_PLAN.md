# Coordinate Sweep Plan for Selection Bank — PR #128

Date: 2026-08-15

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

Create a new branch from `main`, add a strict audit focused on selection-bank candidates, and add the remaining safe aliases.

The output must include:

- all items eligible for the bank have coordinates
- excluded non-place strings documented
- unresolved ambiguous strings documented for user decision
- no changes to visited, expenses, days, Firestore rules, backend or GAS
