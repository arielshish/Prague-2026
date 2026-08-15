from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "var BUILD_ID = '2026-08-15-h';" not in app:
    raise SystemExit('expected BUILD_ID 2026-08-15-h not found')
app = app.replace("var BUILD_ID = '2026-08-15-h';", "var BUILD_ID = '2026-08-15-i';", 1)

needle = 'function _tripSummaryData()'
if needle not in app:
    raise SystemExit('_tripSummaryData declaration not found')
if 'function _tripSummaryDataRaw()' in app or 'function _tripSummaryDedupeRows' in app:
    raise SystemExit('dedupe wrapper already present')

helper = r'''
function _tripSummaryDedupeKey(r){
  var name = String((r && r.name) || '').trim();
  var lower = name.toLowerCase();
  if(!name) return '';

  // PR #131: summary-only canonicalization to prevent duplicate rows when
  // the same real stop arrives from itinerary/day guard, map aliases, bank,
  // or manual summary rows.
  if(lower.indexOf('pure') >= 0 || name.indexOf('שוק האיכרים') >= 0 || lower.indexOf('náplavka') >= 0 || lower.indexOf('naplavka') >= 0){
    return 'poi:naplavka-farmers-market-pure-gelato';
  }
  if(lower.indexOf('pražská tržnice') >= 0 || lower.indexOf('prazska trznice') >= 0 || name.indexOf('השוק הגדול') >= 0 || name.indexOf('הולשוביצה') >= 0){
    return 'poi:prazska-trznice-holesovice';
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
      if(existing.visited !== true && r.visited === true) existing.visited = true;
      if(!existing.sources) existing.sources = [];
      (r.sources || []).forEach(function(s){
        if(existing.sources.indexOf(s) < 0) existing.sources.push(s);
      });
      return;
    }
    seen[key] = r;
    out.push(r);
  });
  return out;
}
function _tripSummaryData(){
  return _tripSummaryDedupeRows(_tripSummaryDataRaw());
}
'''

# Rename the existing implementation and add a wrapper before it.
app = app.replace(needle, helper + '\nfunction _tripSummaryDataRaw()', 1)

# Docs.
Path('docs/TRIP_SUMMARY_DEDUPE_FIX_PR131.md').write_text("""# Trip Summary Dedupe Fix — PR #131

Date: 2026-08-15
Branch: `feature/trip-summary-dedupe-clean`
Backup: `backup/pre-trip-summary-dedupe-clean-2026-08-15`

## Problem

The user saw duplicate rows inside Trip Summary after adding expense-derived day stops in PR #130.

Likely duplicate families:

- `Pure גלידה`
- `Náplavka / שוק האיכרים על הנהר`
- `שוק האיכרים על הנהר — Náplavka`

and:

- `Pražská tržnice`
- `השוק הגדול — הולשוביצה`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

## Fix

The existing `_tripSummaryData()` implementation is preserved as `_tripSummaryDataRaw()`.

A new wrapper `_tripSummaryData()` runs the raw rows through `_tripSummaryDedupeRows()` before rendering.

Dedupe is summary-only and uses:

1. known canonical groups for the duplicated families above
2. GPS coordinate key rounded to 5 decimals
3. normalized name fallback

## Safety

No intentional changes to:

- expenses storage
- visited state / `prague_visited_v1`
- days storage / `prague_days_v1`
- Firestore paths
- Firestore rules
- backend
- GAS

No data deletion. No new localStorage keys.

## Version

`BUILD_ID` advanced to `2026-08-15-i`.
""", encoding='utf-8')

Path('docs/CLAUDE_TRIP_SUMMARY_DEDUPE_FIX_PR131.md').write_text("""# Claude Handoff — Trip Summary Dedupe Fix PR #131

Date: 2026-08-15

## Context

PR #130 added two expense-derived places as guaranteed day stops:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר`
- `Pražská tržnice — השוק הגדול (הולשוביצה)`

The user then reported duplicates in Trip Summary.

## Implementation

This PR keeps the original trip-summary row builder intact by renaming it from `_tripSummaryData()` to `_tripSummaryDataRaw()`.

A new `_tripSummaryData()` wrapper returns:

```js
_tripSummaryDedupeRows(_tripSummaryDataRaw())
```

This means all existing summary behavior remains, with only final row de-duplication added.

## Canonical groups

- Pure / Náplavka / farmers market on the river
- Pražská tržnice / השוק הגדול / Holešovice

## Boundaries

Summary display only. Do not mutate days, expenses, visited state, Firestore, backend, or GAS.
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
    raise SystemExit('BUILD_ID i missing')
if 'function _tripSummaryDataRaw()' not in new_app:
    raise SystemExit('_tripSummaryDataRaw missing')
if 'function _tripSummaryData(){' not in new_app:
    raise SystemExit('_tripSummaryData wrapper missing')

APP.write_text(new_app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('clean trip summary dedupe applied')
