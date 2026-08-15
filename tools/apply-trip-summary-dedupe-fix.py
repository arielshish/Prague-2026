from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "var BUILD_ID = '2026-08-15-h';" not in app:
    raise SystemExit('expected BUILD_ID 2026-08-15-h not found')
app = app.replace("var BUILD_ID = '2026-08-15-h';", "var BUILD_ID = '2026-08-15-i';", 1)

anchor = "function _tripSummaryData()"
idx = app.find(anchor)
if idx < 0:
    raise SystemExit('_tripSummaryData function not found')

helper = r"""
function _tripSummaryDedupeKey(r){
  var name = String((r && r.name) || '').trim();
  var lower = name.toLowerCase();
  if(!name) return '';

  // PR #131: summary-only canonicalization to prevent duplicates when the same
  // real stop arrives through expenses/day guard/map/manual names.
  if(lower.indexOf('pure') >= 0 || name.indexOf('שוק האיכרים') >= 0 || lower.indexOf('náplavka') >= 0 || lower.indexOf('naplavka') >= 0){
    return 'poi:naplavka-farmers-market-pure-gelato';
  }
  if(lower.indexOf('pražská tržnice') >= 0 || lower.indexOf('prazska trznice') >= 0 || name.indexOf('השוק הגדול') >= 0 || name.indexOf('הולשוביצה') >= 0){
    return 'poi:prazska-trznice-holesovice';
  }
  if(name.indexOf('Josefov') >= 0 && name.indexOf('בית הכנסת ירושלים') >= 0 && name.indexOf('Café Savoy') >= 0){
    return 'compound:josefov-jerusalem-synagogue-cafe-savoy';
  }

  var coords = (r && r.coords) || PLACE_COORDS[name] || null;
  if(coords && coords.length >= 2){
    return 'gps:' + Number(coords[0]).toFixed(5) + ',' + Number(coords[1]).toFixed(5);
  }
  return 'name:' + name.replace(/\s+/g,' ').toLowerCase();
}
function _tripSummaryDedupeRows(rows){
  var out = [];
  var seen = {};
  (rows || []).forEach(function(r){
    var key = _tripSummaryDedupeKey(r);
    if(!key) return;
    if(seen[key]){
      var existing = seen[key];
      if(!existing.day && r.day) existing.day = r.day;
      if(!existing.dayFrom && r.dayFrom) existing.dayFrom = r.dayFrom;
      if(!existing.coords && r.coords) existing.coords = r.coords;
      if(!existing.label && r.label) existing.label = r.label;
      if(existing.visited !== true && r.visited === true) existing.visited = true;
      if(!existing.sources) existing.sources = [];
      (r.sources || []).forEach(function(s){ if(existing.sources.indexOf(s) < 0) existing.sources.push(s); });
      return;
    }
    seen[key] = r;
    out.push(r);
  });
  return out;
}
"""

# Insert helper before _tripSummaryData.
if '_tripSummaryDedupeKey' not in app:
    app = app[:idx] + helper + '\n' + app[idx:]
else:
    raise SystemExit('dedupe helper already exists')

# Find _tripSummaryData function end after helper insertion, then wrap externally.
start = app.find(anchor)
brace = app.find('{', start)
depth = 0
end = None
quote = None
esc = False
for i in range(brace, len(app)):
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
    raise SystemExit('could not find _tripSummaryData end')

wrapper = r"""
// PR #131: summary-only wrapper. Keep the original data builder intact and
// de-duplicate only its returned rows.
var _tripSummaryDataRaw_PR131 = _tripSummaryData;
function _tripSummaryData(){
  return _tripSummaryDedupeRows(_tripSummaryDataRaw_PR131());
}
"""

if '_tripSummaryDataRaw_PR131' in app:
    raise SystemExit('wrapper already exists')
app = app[:end+1] + '\n' + wrapper + app[end+1:]

Path('docs/TRIP_SUMMARY_DEDUPE_FIX_PR131.md').write_text("""# Trip Summary Dedupe Fix — PR #131

Date: 2026-08-15
Branch: `feature/trip-summary-dedupe-fix`
Backup: `backup/pre-trip-summary-dedupe-fix-2026-08-15`

## Problem

After adding expense-derived stops in PR #130, the Trip Summary can show duplicate rows when the same real stop arrives from more than one source:

- itinerary/day guard
- map/place aliases
- manual summary/bank rows
- expense-derived names

The user noticed the duplication specifically in the summary.

## Fix

Add summary-only de-duplication around `_tripSummaryData()`.

The original data builder remains intact. The wrapper only de-duplicates the returned rows before rendering.

The dedupe key prefers:

1. explicit known canonical groups for the new stops
2. GPS coordinates rounded to 5 decimals
3. normalized name fallback

Known canonical groups added:

- `Pure גלידה` / `Náplavka` / `שוק האיכרים על הנהר`
- `Pražská tržnice` / `השוק הגדול` / `הולשוביצה`

## Safety

This fix does not change:

- expenses storage
- visited state
- days storage
- Firestore paths
- backend
- GAS

It only affects Trip Summary row display de-duplication.

## Version

`BUILD_ID` advanced to `2026-08-15-i`.
""", encoding='utf-8')

Path('docs/CLAUDE_TRIP_SUMMARY_DEDUPE_FIX_PR131.md').write_text("""# Claude Handoff — Trip Summary Dedupe Fix PR #131

Date: 2026-08-15

## Context

PR #130 added two expense-derived places as guaranteed day stops:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

The user then reported duplicate rows in the Trip Summary.

## Fix Applied

Trip Summary now wraps `_tripSummaryData()` and runs returned rows through `_tripSummaryDedupeRows(rows)` before rendering.

`_tripSummaryDedupeKey(r)` canonicalizes the new stop families and then falls back to GPS rounding / normalized name.

## Important

This is summary-only. It does not mutate days, expenses, visited state, or Firestore.

Future additions should prefer adding canonical mappings to `_tripSummaryDedupeKey` instead of adding broader destructive normalization.
""", encoding='utf-8')

new_app = app
protected = [
    'prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1',
    'prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts',
    'appdata/main','appdata/expenses','appdata/trip_summary'
]
for key in protected:
    if new_app.count(key) != old_app.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new_app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
if new_app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')
if "var BUILD_ID = '2026-08-15-i';" not in new_app:
    raise SystemExit('BUILD_ID i not found')
if '_tripSummaryDedupeRows(_tripSummaryDataRaw_PR131())' not in new_app:
    raise SystemExit('dedupe wrapper call not found')

APP.write_text(new_app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('trip summary dedupe fix applied')
