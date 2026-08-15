from pathlib import Path
import re, subprocess, json

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

m = re.search(r'var\s+PLACE_COORDS\s*=\s*\{', app)
if not m:
    raise SystemExit('PLACE_COORDS declaration not found')
start = app.find('{', m.start())
depth = 0
quote = None
esc = False
end = None
for i in range(start, len(app)):
    ch = app[i]
    if quote:
        if esc:
            esc = False
        elif ch == '\\':
            esc = True
        elif ch == quote:
            quote = None
        continue
    if ch in ('"', "'", '`'):
        quote = ch
        continue
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = i
            break
if end is None:
    raise SystemExit('PLACE_COORDS closing brace not found')

obj = app[start:end+1]
entry_re = re.compile(r"['\"]([^'\"]+)['\"]\s*:\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\]")
coords = {name: (float(lat), float(lng)) for name, lat, lng in entry_re.findall(obj)}

def first_coord(*names):
    for n in names:
        if n in coords:
            return coords[n]
    return None

# Safe additions for real places that can appear as selection-bank candidates.
# Do not add coordinates for generic tips, tickets, combined routes, or instructions.
SAFE_ALIASES = {
    # Manifesto Market Andel. Prefer existing coordinate if already present in app.
    'Manifesto': first_coord('Manifesto Market — Anděl') or (50.0709000, 14.4048000),
    'Manifesto Market — Anděl (שוק ערב)': first_coord('Manifesto Market — Anděl') or (50.0709000, 14.4048000),

    # Prague Zoo / Zoo Praha.
    'גן החיות של פראג': first_coord('Prague Zoo', 'Zoo Praha', 'גן החיות של פראג') or (50.1167000, 14.4114000),
    'Prague Zoo': first_coord('גן החיות של פראג', 'Zoo Praha') or (50.1167000, 14.4114000),
    'Zoo Praha': first_coord('גן החיות של פראג', 'Prague Zoo') or (50.1167000, 14.4114000),

    # Museum Kampa.
    'מוזיאון קמפה': first_coord('Museum Kampa', 'מוזיאון קמפה') or (50.0839000, 14.4086000),
    'Museum Kampa': first_coord('מוזיאון קמפה', 'Museum Kampa') or (50.0839000, 14.4086000),

    # Jerusalem/Jubilee Synagogue.
    'בית הכנסת ירושלים': first_coord('Jerusalem Synagogue', 'Jubilee Synagogue', 'בית הכנסת ירושלים') or (50.0847020, 14.4320130),
    'Jerusalem Synagogue': first_coord('בית הכנסת ירושלים', 'Jubilee Synagogue') or (50.0847020, 14.4320130),
    'Jubilee Synagogue': first_coord('בית הכנסת ירושלים', 'Jerusalem Synagogue') or (50.0847020, 14.4320130),
    'בית הכנסת הגדול בפראג': first_coord('בית הכנסת ירושלים', 'Jerusalem Synagogue', 'Jubilee Synagogue') or (50.0847020, 14.4320130),

    # LEGO Store in the trip context is paired with Hamleys in the center.
    'LEGO Store': first_coord('Hamleys + LEGO Store', 'Hamleys Prague') or (50.0857000, 14.4235000),
    'LEGO Store Prague': first_coord('Hamleys + LEGO Store', 'Hamleys Prague', 'LEGO Store') or (50.0857000, 14.4235000),

    # Albert in the trip text refers to supermarket in Palladium / floor -1.
    'Albert — Palladium': first_coord('Palladium') or (50.0892000, 14.4286000),
    'Albert בקומה -1': first_coord('Palladium') or (50.0892000, 14.4286000),
    'Albert בקומה -1 — לקנות שוקולדים ומזכרות': first_coord('Palladium') or (50.0892000, 14.4286000),
}

# Strings from the broad audit that must not become GPS keys because they are not a single POI.
EXCLUDED_NON_PLACES = [
    'שפת הנהר Vltava – בלילה',
    'גן החיות של פראג + שייט ערב',
    'בין השעון האסטרונומי לגשר קארל',
    'Primark → Na Příkopě → Palladium → Hamleys/LEGO',
    'Josefov, בית הכנסת ירושלים, Café Savoy',
    'Kantýna או Lokál — בקר/עוף בלבד',
    'Gran Fierro / George Prime Steak — לסיים ביג!',
    'קפה טוב: Café Louvre או Café Imperial',
    'כרטיסים לגן חיות פראג',
    'כרטיסים לטירת פראג',
    'כרטיסים ל-Aquapalace',
    'כרטיסים לממלכת הרכבות',
    'אישור הזמנת המלון',
    'אוכל בגן החיות',
    'ארוחת צהריים בגן — יש כמה מסעדות בפנים',
    'להגיע ל-Primark בבוקר — פחות תורים',
    'להזמין Gran Fierro בזמן המנוחה',
    'להכין כתובת מלון Offline לפני הנחיתה',
    'לשמור גשר קארל לשעת ערב',
]

lines = []
for name, (lat, lng) in SAFE_ALIASES.items():
    if name not in coords:
        safe = name.replace("'", "\\'")
        lines.append("  '%s': [%.7f, %.7f]," % (safe, lat, lng))

if lines:
    anchor = "  // PR #127: reviewed aliases from full coordinate audit"
    idx = app.find(anchor)
    if idx < 0:
        # fallback to a stable key added in PR #127
        anchor = "  'שעון האסטרונומי – Orloj':"
        idx = app.find(anchor)
    if idx < 0:
        raise SystemExit('safe insertion anchor not found')
    insert_at = app.find('\n', idx)
    insert = "\n  // PR #128: selection bank coordinate sweep — safe real-place aliases\n" + "\n".join(lines)
    app = app[:insert_at] + insert + app[insert_at:]

if "var BUILD_ID = '2026-08-15-e';" in app:
    app = app.replace("var BUILD_ID = '2026-08-15-e';", "var BUILD_ID = '2026-08-15-f';", 1)
else:
    raise SystemExit('expected BUILD_ID 2026-08-15-e not found')

APP.write_text(app, encoding='utf-8')
new_app = APP.read_text(encoding='utf-8')

for name in SAFE_ALIASES:
    if name not in new_app:
        raise SystemExit('safe alias missing after patch: ' + name)
if "var BUILD_ID = '2026-08-15-f';" not in new_app:
    raise SystemExit('BUILD_ID f not found')

# Protected storage/path checks. BUILD_ID and PLACE_COORDS may change; these must not.
protected = [
    'prague_visited_v1',
    'prague_trip_summary_overrides_v1',
    'prague_trip_summary_overrides_ts',
    'prague_days_v1',
    'prague_exp_v10',
    'appdata/main',
    'appdata/expenses',
    'appdata/trip_summary',
]
for key in protected:
    if new_app.count(key) != old_app.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new_app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
if new_app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')

report = Path('docs/SELECTION_BANK_COORD_SWEEP_PR128.md')
report.write_text(f"""# Selection Bank Coordinate Sweep — PR #128

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

## Added safe aliases

""" + "\n".join([f"- `{name}`" for name in SAFE_ALIASES]) + f"""

Total safe aliases in this sweep: {len(SAFE_ALIASES)}

## Excluded from coordinate insertion

These are not single POIs and must not be forced into `PLACE_COORDS`:

""" + "\n".join([f"- `{name}`" for name in EXCLUDED_NON_PLACES]) + """

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
""", encoding='utf-8')

handoff = Path('docs/CLAUDE_SELECTION_BANK_COORD_SWEEP_PR128.md')
handoff.write_text("""# Claude Handoff — Selection Bank Coordinate Sweep PR #128

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
""", encoding='utf-8')

print('selection bank coordinate sweep applied and validated')
print(json.dumps({'added_aliases': list(SAFE_ALIASES.keys()), 'excluded_non_places': EXCLUDED_NON_PLACES}, ensure_ascii=False, indent=2))
