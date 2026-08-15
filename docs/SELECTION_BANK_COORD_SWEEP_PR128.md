# Selection Bank Coordinate Sweep — PR #128

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/selection-bank-coordinate-sweep`
Backup: `backup/pre-selection-bank-coord-sweep-2026-08-15`

## Goal

Before building the trip-summary selection bank, add coordinates/aliases for real places that could appear as selectable items.

Bank rule for the next UI PR:

- selectable item must have GPS
- no GPS = not selectable
- non-place strings are documented, not forced onto the map
- compound strings that contain several real places must be split and de-duplicated into canonical places

## Added safe aliases

- `Manifesto`
- `Manifesto Market — Anděl (שוק ערב)`
- `גן החיות של פראג`
- `Prague Zoo`
- `Zoo Praha`
- `מוזיאון קמפה`
- `Museum Kampa`
- `בית הכנסת ירושלים`
- `Jerusalem Synagogue`
- `Jubilee Synagogue`
- `בית הכנסת הגדול בפראג`
- `LEGO Store`
- `LEGO Store Prague`
- `Albert — Palladium`
- `Albert בקומה -1`
- `Albert בקומה -1 — לקנות שוקולדים ומזכרות`

Total safe aliases in this sweep: 16

## Excluded from coordinate insertion

These are not single POIs and must not be forced into `PLACE_COORDS` as one coordinate:

- `שפת הנהר Vltava – בלילה`
- `גן החיות של פראג + שייט ערב`
- `בין השעון האסטרונומי לגשר קארל`
- `Primark → Na Příkopě → Palladium → Hamleys/LEGO`
- `Kantýna או Lokál — בקר/עוף בלבד`
- `Gran Fierro / George Prime Steak — לסיים ביג!`
- `קפה טוב: Café Louvre או Café Imperial`
- `כרטיסים לגן חיות פראג`
- `כרטיסים לטירת פראג`
- `כרטיסים ל-Aquapalace`
- `כרטיסים לממלכת הרכבות`
- `אישור הזמנת המלון`
- `אוכל בגן החיות`
- `ארוחת צהריים בגן — יש כמה מסעדות בפנים`
- `להגיע ל-Primark בבוקר — פחות תורים`
- `להזמין Gran Fierro בזמן המנוחה`
- `להכין כתובת מלון Offline לפני הנחיתה`
- `לשמור גשר קארל לשעת ערב`

## Compound visited-place strings to de-duplicate

The following string contains real places that the user confirmed were visited and already have coordinates, but it should not become one GPS point:

- `Josefov, בית הכנסת ירושלים, Café Savoy`

Future selection-bank logic should split/normalize it into canonical entries and avoid duplicates:

- `הרובע היהודי – Josefov` / `Josefov`
- `בית הכנסת ירושלים` / `Jerusalem Synagogue` / `Jubilee Synagogue`
- `Café Savoy`

This means the bank should show the real places once each, with their own coordinates, instead of also showing the combined comma-separated string.

## Safety boundaries

This sweep changes only:

- static `PLACE_COORDS` aliases
- `BUILD_ID`
- documentation

It does not intentionally change:

- visited state
- expenses
- days/schedule storage
- trip-summary override storage
- Firestore paths
- login/auth
- backend
- GAS

## Validation

The apply workflow verifies:

- every safe alias exists after patch
- `BUILD_ID` is `2026-08-15-f`
- protected localStorage keys and Firestore path counts are unchanged
- no new `localStorage.removeItem`
- no new `localStorage.clear`
- inline JavaScript passes `node --check`
- temporary scripts/workflows are removed from the final PR diff
