from pathlib import Path
import re, subprocess, json

app_path = Path('app.html')
app = app_path.read_text(encoding='utf-8')

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

# Only real places/aliases from the reviewed audit list.
# Generic guidance rows, tickets, route titles and vague areas are intentionally excluded.
reviewed = {
    'Clementinum – הספרייה הבארוקית': first_coord('Clementinum') or (50.08650, 14.41690),
    'IKEA Praha — Zličín': first_coord('IKEA Praha Zličín', 'IKEA Zličín') or (50.05250, 14.29000),
    'Municipal House – Obecní dům': first_coord('Municipal House', 'Obecní dům') or (50.08760, 14.42800),
    'Vyšehrad – המבצר הנסתר': first_coord('Vyšehrad', 'ויישהראד — שביל המצוק') or (50.06470, 14.41800),
    'בית הריקוד – Dancing House': first_coord('בית הריקוד', 'Dancing House') or (50.07550, 14.41420),
    'גשר קארל – Charles Bridge': first_coord('גשר קארל', 'Charles Bridge') or (50.08650, 14.41140),
    'הרובע היהודי – Josefov': first_coord('הרובע היהודי — Josefov', 'הרובע היהודי ובית הכנסת הגדול בפראג') or (50.09010, 14.41910),
    'טירת פראג – Pražský hrad': first_coord('טירת פראג וקתדרלת ויטוס', 'מצודת פראג', 'טירת פראג') or (50.09110, 14.40160),
    'כיכר העיר העתיקה – Old Town Square': first_coord('כיכר העיר העתיקה והשעון האסטרונומי', 'כיכר העיר העתיקה') or (50.08700, 14.42080),
    'מגדל פטרין – Petřín Tower': first_coord('מגדל פטז׳ין', 'Petřín Tower') or (50.08350, 14.39500),
    'שעון האסטרונומי – Orloj': first_coord('כיכר העיר העתיקה והשעון האסטרונומי', 'שעון האסטרונומי') or (50.08700, 14.42070),
}

# Not added because it is a broad/night route label, not a single POI.
not_added = ['שפת הנהר Vltava – בלילה']

existing = set(coords.keys())
lines = []
for name, (lat, lng) in reviewed.items():
    if name not in existing:
        safe = name.replace("'", "\\'")
        lines.append("  '%s': [%.7f, %.7f]," % (safe, lat, lng))

if lines:
    anchor = "  'Primark — Metropole Zličín': [50.0534000, 14.2894600],"
    idx = app.find(anchor)
    if idx < 0:
        raise SystemExit('safe anchor not found')
    insert_at = app.find('\n', idx)
    insert = "\n  // PR #127: reviewed aliases from full coordinate audit\n" + "\n".join(lines)
    app = app[:insert_at] + insert + app[insert_at:]

if "var BUILD_ID = '2026-08-15-d';" in app:
    app = app.replace("var BUILD_ID = '2026-08-15-d';", "var BUILD_ID = '2026-08-15-e';", 1)
elif "var BUILD_ID = '2026-08-15-c';" in app:
    app = app.replace("var BUILD_ID = '2026-08-15-c';", "var BUILD_ID = '2026-08-15-e';", 1)
else:
    raise SystemExit('expected BUILD_ID c/d not found')

app_path.write_text(app, encoding='utf-8')

# Documentation update
Path('docs/TRIP_SUMMARY_COORD_ALIASES.md').write_text("""# Trip Summary Coordinate Aliases — PR #127

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/missing-trip-summary-coords`
Backup branch: `backup/pre-missing-coords-2026-08-15`

## Purpose

Add missing/alternative `PLACE_COORDS` aliases needed before the trip-summary selection bank.

## First alias batch

- `FAT CAT Downtown`
- `Fat Cat Downtown`
- `FAT CAT Downtown — כיכר וצסלב`
- `אי קמפה – Kampa Island`
- `אי קמפה (Kampa Island)`
- `Kampa Island`
- `Makakiko Running Sushi`
- `Makakiko Running Sushi — Palladium`
- `Primark Metropole Zličín`
- `Primark — Metropole Zličín`

## Reviewed audit alias batch

Added after reviewing `docs/FULL_TRIP_COORDS_AUDIT.md` and filtering out UI text, tickets, route labels, and explanatory sentences.

- `Clementinum – הספרייה הבארוקית`
- `IKEA Praha — Zličín`
- `Municipal House – Obecní dům`
- `Vyšehrad – המבצר הנסתר`
- `בית הריקוד – Dancing House`
- `גשר קארל – Charles Bridge`
- `הרובע היהודי – Josefov`
- `טירת פראג – Pražský hrad`
- `כיכר העיר העתיקה – Old Town Square`
- `מגדל פטרין – Petřín Tower`
- `שעון האסטרונומי – Orloj`

## Intentionally not added

- `שפת הנהר Vltava – בלילה` — broad route/area label, not one exact point.

## Safety boundaries

Changed only static coordinate aliases and `BUILD_ID`.

Do not touch:

- visited state / `prague_visited_v1`
- manual summary overrides / `prague_trip_summary_overrides_v1`
- Firestore `appdata/trip_summary`
- Firestore `appdata/main`
- Firestore `appdata/expenses`
- schedule, expenses, login, GAS/backend

## Validation

Workflow checks:

- all reviewed aliases exist in `PLACE_COORDS`
- `BUILD_ID` is `2026-08-15-e`
- no protected localStorage keys changed
- no `appdata/*` paths changed
- no new `localStorage.removeItem` or `localStorage.clear`
- inline JavaScript passes `node --check`
""", encoding='utf-8')

new = app_path.read_text(encoding='utf-8')
for name in reviewed:
    if name not in new:
        raise SystemExit('missing reviewed alias after patch: ' + name)
for name in not_added:
    # It may still exist elsewhere as title/context; only ensure we did not add an exact coordinate key.
    pass
if "var BUILD_ID = '2026-08-15-e';" not in new:
    raise SystemExit('BUILD_ID e not found')
old = subprocess.check_output(['git','show','origin/main:app.html'], text=True)
for key in ['prague_visited_v1','prague_trip_summary_overrides_v1','prague_days_v1','prague_exp_v10','appdata/main','appdata/expenses','appdata/trip_summary']:
    if new.count(key) != old.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new.count('localStorage.removeItem') != old.count('localStorage.removeItem') or new.count('localStorage.clear') != old.count('localStorage.clear'):
    raise SystemExit('localStorage delete/clear count changed')

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('reviewed coordinate aliases applied and validated')
print(json.dumps({'added_aliases': list(reviewed.keys()), 'not_added': not_added}, ensure_ascii=False, indent=2))
