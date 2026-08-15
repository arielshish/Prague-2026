# Trip Summary Added Items Editor — PR #134

Date: 2026-08-15
Branch: `feature/trip-summary-added-editor`
Backup: `backup/pre-trip-summary-added-editor-2026-08-15`

## Problem

Items added through the Trip Summary selection bank were stored in `overrides.added` and rendered in the Trip Summary as `נוסף מבנק הבחירה`, but the manual editor only listed base trip-summary places. Therefore the user could see bank-added items in the summary but could not edit or remove them from the editor.

## Fix

- Add a dedicated section in the Trip Summary manual editor: `פריטים שנוספו מבנק הבחירה`.
- Each bank-added item now exposes name, day selector, label input, save button, and remove-from-summary button.
- Keep data model unchanged: items remain in `overrides.added` until the user removes a specific item.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests for `tripSummaryManualSetAdded` and `tripSummaryManualRemoveAdded` with mocked override store and DOM.
- Static guards verify final UI strings and protected storage/Firestore key counts.

## Boundaries

No changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-l`.
