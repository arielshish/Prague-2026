# Claude handoff — PR #130 expense-derived stops

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/add-expense-stops`
Backup: `backup/pre-add-expense-stops-2026-08-15`

## Context

After PR #129 deployed the trip-summary selection bank, the user added two expenses and asked to add them to `היינו` or as day stops.

Because visited state is live app data and should not be mutated from code, this PR adds the two items as day stops only. The user can mark them as visited in the app.

## User clarification

`Pure גלידה` was near the farmers market on the river. Do not map it to Výstaviště. Use `Náplavka / שוק האיכרים על הנהר` as the canonical location.

## Added stops

Trip day 8 / 15.08.2026, above existing stops:

- `🍦 Pure גלידה — Náplavka / שוק האיכרים על הנהר` at `12:44`
- `🏰🛍️ Pražská tržnice — השוק הגדול (הולשוביצה)` at `12:43`

## Technical note

The app may already have a saved/synced days state from `prague_days_v1` / Firestore. Editing only static `DAYS` may not appear on those devices. Therefore PR #130 wraps `getDaysState()` with `_ensureExpenseStopsPr130()` so the two stops are shown above the other stops without clearing or replacing the user's existing plan.

## Safety boundaries

Do not mark these as visited in code.
Do not edit expenses data.
Do not touch backend/GAS.
Do not change Firestore paths or rules.
