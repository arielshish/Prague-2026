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

  // PR #131: summary-only canonicalization to prevent duplicate rows when the
  // same real stop arrives through expenses/day guard/map/manual names.
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

if '_tripSummaryDedupeKey' not in app:
    app = app[:idx] + helper + '\n' + app[idx:]
else:
    raise SystemExit('dedupe helper already exists')

# Rather than depending on the exact return shape inside _tripSummaryData, wrap
# consumers of _tripSummaryData(). This is safer across small implementation changes.
app, n = re.subn(r'(?<!function\s)_tripSummaryData\(\)', r'_tripSummaryDedupeRows(_tripSummaryData())', app)
# The substitution above also changes the function declaration in some engines if the
# negative lookbehind cannot account for whitespace variants, so correct that explicitly.
app = app.replace('function _tripSummaryDedupeRows(_tripSummaryData())', 'function _tripSummaryData()')
# At minimum the rendered summary/bank should have at least one wrapped consumer.
if n < 1 or '_tripSummaryDedupeRows(_tripSummaryData())' not in app:
    raise SystemExit('no _tripSummaryData consumer was wrapped')

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

Add summary-only de-duplication for Trip Summary consumers of `_tripSummaryData()`.

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

Consumers of `_tripSummaryData()` now use `_tripSummaryDedupeRows(_tripSummaryData())`.

`_tripSummaryDedupeKey(r)` canonicalizes the new stop families and then falls back to GPS rounding / normalized name.

## Important

This is summary-only display de-duplication. It does not mutate days, expenses, visited state, or Firestore.

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
if '_tripSummaryDedupeRows(_tripSummaryData())' not in new_app:
    raise SystemExit('dedupe rows call not found')

APP.write_text(new_app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('trip summary dedupe fix applied')
