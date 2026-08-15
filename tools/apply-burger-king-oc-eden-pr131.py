from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "Burger King OC Eden" in app or "Burger King — OC Eden" in app:
    print('Burger King OC Eden already present; leaving app unchanged')
else:
    # Keep version i: PR #131 already advanced from h to i for the summary fix.
    if "var BUILD_ID = '2026-08-15-i';" not in app:
        raise SystemExit('expected BUILD_ID 2026-08-15-i not found')

    # Add GPS aliases near PLACE_COORDS. Coordinates are for OC Eden / Slavia area, not a random BK.
    # U Slavie 1527, Praha 10.
    coord_anchor = "'Pražská tržnice':"
    if coord_anchor not in app:
        # fallback: add near PR #130 aliases if exact anchor differs
        coord_anchor = "'השוק הגדול — הולשוביצה':"
    if coord_anchor not in app:
        raise SystemExit('coordinate anchor for PR130 aliases not found')

    insert_at = app.find(coord_anchor)
    line_start = app.rfind('\n', 0, insert_at) + 1
    # Put BK block before/near recent expense-derived aliases for readability.
    bk_coords = """  // PR #131: expense-derived Burger King stop, receipt: BK Praha OC Eden, U Slavie 1527, Praha 10
  'Burger King — OC Eden': [50.06780, 14.47170],
  'Burger King OC Eden': [50.06780, 14.47170],
  'BK Praha OC Eden': [50.06780, 14.47170],
  'Burger King — U Slavie': [50.06780, 14.47170],
"""
    app = app[:line_start] + bk_coords + app[line_start:]

    # Add guaranteed day stop by extending the existing PR #130 guaranteed stop helper if present.
    # Prefer to insert BK before Pure/Prazska so it appears above the existing expense-derived stops.
    marker = "Pure גלידה — Náplavka / שוק האיכרים על הנהר"
    idx = app.find(marker)
    if idx < 0:
        raise SystemExit('Pure guaranteed stop marker not found')
    obj_start = app.rfind('{', 0, idx)
    if obj_start < 0:
        raise SystemExit('could not find guaranteed stops object start')
    bk_stop = """    {
      emoji: '🍔',
      name: 'Burger King — OC Eden',
      time: '13:56',
      area: 'OC Eden / U Slavie 1527, Praha 10',
      note: 'מהקבלה — 918 CZK, Burger King BK Praha OC Eden'
    },
"""
    app = app[:obj_start] + bk_stop + app[obj_start:]

    # Expand summary dedupe with Burger King aliases.
    dedupe_anchor = "if(n.indexOf('pražská tržnice') >= 0"
    if dedupe_anchor not in app:
        raise SystemExit('summary dedupe anchor not found')
    bk_dedupe = """  if(n.indexOf('burger king') >= 0 || n.indexOf('bk praha oc eden') >= 0 || n.indexOf('oc eden') >= 0 || s.indexOf('בורגר קינג') >= 0){
    return 'burger-king-oc-eden';
  }
"""
    app = app.replace(dedupe_anchor, bk_dedupe + dedupe_anchor, 1)

# Docs update / create note.
DOC = Path('docs/TRIP_SUMMARY_DEDUPE_FIX_PR131.md')
if DOC.exists():
    txt = DOC.read_text(encoding='utf-8')
    if 'Burger King — OC Eden' not in txt:
        txt += """

## Added from receipt — Burger King OC Eden

Added another expense-derived stop from the receipt uploaded by the user:

- `Burger King — OC Eden`
- Receipt text: `BK Praha OC Eden`, `U Slavie 1527, Praha 10`
- Date/time: `15.08.2026 13:56`
- Amount: `918 CZK`

The stop is added above the existing expense-derived stops for day 8 / 15.08.2026.
It is not marked as visited automatically.
"""
        DOC.write_text(txt, encoding='utf-8')
else:
    raise SystemExit('expected PR131 doc missing')

CDOC = Path('docs/CLAUDE_TRIP_SUMMARY_DEDUPE_FIX_PR131.md')
if CDOC.exists():
    txt = CDOC.read_text(encoding='utf-8')
    if 'Burger King — OC Eden' not in txt:
        txt += """

## Later addition in same PR

User uploaded a Burger King receipt and asked to add it.
Added:

- `Burger King — OC Eden`
- aliases: `Burger King OC Eden`, `BK Praha OC Eden`, `Burger King — U Slavie`
- day stop above the other 15.08 expense-derived stops
- summary dedupe key `burger-king-oc-eden`

Do not mark as visited automatically; the user can mark it in the app.
"""
        CDOC.write_text(txt, encoding='utf-8')
else:
    raise SystemExit('expected PR131 Claude doc missing')

# Safety checks: no storage/path/delete behavior changes.
protected = [
    'prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1',
    'prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts',
    'appdata/main','appdata/expenses','appdata/trip_summary'
]
for key in protected:
    if app.count(key) != old_app.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
if app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')
if "Burger King — OC Eden" not in app:
    raise SystemExit('Burger King stop not found in app')
if "burger-king-oc-eden" not in app:
    raise SystemExit('Burger King dedupe key not found')

APP.write_text(app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('Burger King OC Eden added')
