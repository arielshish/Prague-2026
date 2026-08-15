from pathlib import Path
import re
import subprocess

app_path = Path('app.html')
app = app_path.read_text(encoding='utf-8')

additions = {
    'FAT CAT Downtown': [50.0811606, 14.4284073],
    'Fat Cat Downtown': [50.0811606, 14.4284073],
    'FAT CAT Downtown — כיכר וצסלב': [50.0811606, 14.4284073],
    'אי קמפה – Kampa Island': [50.084581, 14.408223],
    'אי קמפה (Kampa Island)': [50.084581, 14.408223],
    'Kampa Island': [50.084581, 14.408223],
    'Makakiko Running Sushi': [50.0890049, 14.4291743],
    'Makakiko Running Sushi — Palladium': [50.0890049, 14.4291743],
    'Primark Metropole Zličín': [50.05340, 14.28946],
    'Primark — Metropole Zličín': [50.05340, 14.28946],
}

m = re.search(r'(var|const|let)\s+PLACE_COORDS\s*=\s*\{', app)
if not m:
    raise SystemExit('PLACE_COORDS not found')
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
    raise SystemExit('PLACE_COORDS close not found')

obj = app[start:end+1]
existing = set(re.findall(r"['\"]([^'\"]+)['\"]\s*:\s*\[", obj))
lines = []
for name, coord in additions.items():
    if name not in existing:
        safe = name.replace("'", "\\'")
        lines.append("  '%s': [%.7f, %.7f]," % (safe, coord[0], coord[1]))

if lines:
    insert = "\n  // PR #127: aliases for trip-summary selection bank / manual summary fixes\n" + "\n".join(lines) + "\n"
    app = app[:end] + insert + app[end:]

if "var BUILD_ID = '2026-08-15-c';" not in app:
    raise SystemExit('expected BUILD_ID c not found')
app = app.replace("var BUILD_ID = '2026-08-15-c';", "var BUILD_ID = '2026-08-15-d';", 1)
app_path.write_text(app, encoding='utf-8')

doc = """# Trip Summary Missing Coordinate Aliases — PR #127

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/missing-trip-summary-coords`
Backup branch: `backup/pre-missing-coords-2026-08-15`

## Purpose

Add missing/alternative `PLACE_COORDS` aliases needed before the trip-summary selection bank.

## Added aliases

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

## Coordinates used

- FAT CAT Downtown / Wenceslas Square: `[50.0811606, 14.4284073]`
- Kampa Island: `[50.084581, 14.408223]`
- Makakiko Running Sushi Palladium: `[50.0890049, 14.4291743]`
- Primark Metropole Zličín: `[50.05340, 14.28946]`

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

The apply workflow checks:

- all aliases exist in `PLACE_COORDS`
- `BUILD_ID` is `2026-08-15-d`
- no protected localStorage keys changed
- no `appdata/*` paths changed
- no new `localStorage.removeItem` or `localStorage.clear`
- inline JavaScript passes `node --check`
"""
Path('docs/TRIP_SUMMARY_COORD_ALIASES.md').write_text(doc, encoding='utf-8')

new = app_path.read_text(encoding='utf-8')
for name in additions:
    if name not in new:
        raise SystemExit('missing alias after patch: ' + name)
if "var BUILD_ID = '2026-08-15-d';" not in new:
    raise SystemExit('BUILD_ID d not found')
old = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)
for key in ['prague_visited_v1','prague_trip_summary_overrides_v1','prague_days_v1','prague_exp_v10','appdata/main','appdata/expenses','appdata/trip_summary']:
    if new.count(key) != old.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new.count('localStorage.removeItem') != old.count('localStorage.removeItem') or new.count('localStorage.clear') != old.count('localStorage.clear'):
    raise SystemExit('localStorage delete/clear count changed')

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('coordinate aliases applied and validated')
