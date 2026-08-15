# Expense-derived stops — PR #130

Date: 2026-08-15
Branch: `feature/add-expense-stops`
Backup: `backup/pre-add-expense-stops-2026-08-15`

## User request

The user added two expenses and asked to add them to the itinerary/day stops, above the other stops.

Screenshot identified:

1. `Pure גלידה` — 200 CZK — 15.08.2026 12:44
2. `Pražská tržnice — השוק הגדול (הולשוביצה)` — 117 CZK — 15.08.2026 12:43

The user clarified that `Pure גלידה` was near the farmers market on the river, so it must be mapped to `Náplavka / שוק האיכרים על הנהר`, not to Výstaviště or an invented Pure shop.

## Implementation

Adds both stops above the other stops on trip day 8 / 15.08.2026.

The implementation wraps `getDaysState()` with a small guard that ensures these two stops appear even on devices that already have a saved/synced days state. It does not clear or overwrite the user's existing day plan.

## GPS

Added static coordinate aliases:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר` → Náplavka farmers market area
- `Pražská tržnice — השוק הגדול (הולשוביצה)` → Pražská tržnice / Holešovice market complex

## Safety boundaries

No changes to:

- expenses storage
- visited state / `prague_visited_v1`
- Firestore paths
- Firestore rules
- backend
- GAS
- login/auth

The stops do not mark places as visited. The user can mark them as visited manually from the app.

## Version

`BUILD_ID` advances to `2026-08-15-h`.
