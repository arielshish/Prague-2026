from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

protected = [
    'prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1',
    'prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts',
    'appdata/main','appdata/expenses','appdata/trip_summary'
]

def log(msg):
    print('[PR132]', msg, flush=True)

def require(cond, msg):
    if not cond:
        print('::error file=tools/apply-trip-summary-regression-fix-pr132.py::[PR132 fail] ' + msg, flush=True)
        raise SystemExit('[PR132 fail] ' + msg)

def replace_once(src, old, new, label):
    require(old in src, 'missing anchor: ' + label)
    log('replace ' + label)
    return src.replace(old, new, 1)

def sub_once(src, pattern, repl, label, flags=0):
    new, n = re.subn(pattern, repl, src, count=1, flags=flags)
    require(n == 1, 'regex did not match: ' + label)
    log('regex replace ' + label)
    return new

log('start')

# 1) Build ID
app = replace_once(app, "var BUILD_ID = '2026-08-15-i';", "var BUILD_ID = '2026-08-15-j';", 'BUILD_ID i -> j')

# 2) Burger King GPS aliases belong in PLACE_COORDS, not in the day-stop alias map.
coords_block = """  // PR #132: Burger King OC Eden aliases moved to PLACE_COORDS (were accidentally placed in day-stop aliases in PR #131)
  'Burger King — OC Eden': [50.06780, 14.47170],
  'Burger King OC Eden': [50.06780, 14.47170],
  'BK Praha OC Eden': [50.06780, 14.47170],
  'Burger King — U Slavie': [50.06780, 14.47170],
"""
place_marker = "  // PR #130: expense-derived day stops — real locations only\n"
require(place_marker in app, 'PLACE_COORDS PR130 marker missing')
place_prefix = app.split(place_marker, 1)[0]
if "'Burger King — OC Eden': [50.06780, 14.47170]," not in place_prefix:
    app = replace_once(app, place_marker, place_marker + coords_block, 'insert Burger King PLACE_COORDS')
else:
    log('Burger King PLACE_COORDS already present')

bk_array_alias_pattern = r"\s*// PR #131: expense-derived Burger King stop, receipt: BK Praha OC Eden, U Slavie 1527, Praha 10\n\s*'Burger King — OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King OC Eden': \[50\.06780, 14\.47170\],\n\s*'BK Praha OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King — U Slavie': \[50\.06780, 14\.47170\],\n"
good_alias_block = """
      // PR #132: aliases here are only existence aliases; GPS lives in PLACE_COORDS.
      'Burger King — OC Eden': true,
      'Burger King OC Eden': true,
      'BK Praha OC Eden': true,
      'Burger King — U Slavie': true,
"""
app = sub_once(app, bk_array_alias_pattern, good_alias_block, 'Burger King aliases arrays -> true')

# 3) Normalize Burger King day stop object fields.
bk_stop_pattern = r"\{\s*emoji:\s*'🍔',\s*name:\s*'Burger King — OC Eden',\s*time:\s*'13:56',\s*area:\s*'OC Eden / U Slavie 1527, Praha 10',\s*note:\s*'מהקבלה — 918 CZK, Burger King BK Praha OC Eden'\s*\},"
new_bk_stop = """{
    emoji: '🍔',
    name: 'Burger King — OC Eden',
    time: '13:56',
    desc: 'נוסף לפי הוצאה: 918 CZK · BK Praha OC Eden · U Slavie 1527, Praha 10.',
    mapUrl: 'https://www.google.com/maps/search/Burger+King+OC+Eden+U+Slavie+1527+Praha'
  },"""
app = sub_once(app, bk_stop_pattern, new_bk_stop, 'normalize Burger King day stop', flags=re.S)

# 4) Overlay scroll lock helpers after toast/isGas utilities.
if 'function _lockTripSummaryOverlayScroll()' not in app:
    toast_end = """function isGas() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}
"""
    scroll_helpers = """
// PR #132: lock background scroll while full-screen trip-summary overlays are open.
var _tripSummaryOverlayScrollDepth = 0;
var _tripSummaryOverlayScrollY = 0;
var _tripSummaryBodyPrevStyle = null;
function _lockTripSummaryOverlayScroll() {
  try {
    if (_tripSummaryOverlayScrollDepth++ > 0) return;
    _tripSummaryOverlayScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    _tripSummaryBodyPrevStyle = {
      position: document.body.style.position || '',
      top: document.body.style.top || '',
      left: document.body.style.left || '',
      right: document.body.style.right || '',
      width: document.body.style.width || '',
      overflow: document.body.style.overflow || ''
    };
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + _tripSummaryOverlayScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
  } catch (e) {}
}
function _unlockTripSummaryOverlayScroll() {
  try {
    if (_tripSummaryOverlayScrollDepth <= 0) return;
    _tripSummaryOverlayScrollDepth--;
    if (_tripSummaryOverlayScrollDepth > 0) return;
    var y = _tripSummaryOverlayScrollY || 0;
    var prev = _tripSummaryBodyPrevStyle || {};
    document.body.style.position = prev.position || '';
    document.body.style.top = prev.top || '';
    document.body.style.left = prev.left || '';
    document.body.style.right = prev.right || '';
    document.body.style.width = prev.width || '';
    document.body.style.overflow = prev.overflow || '';
    window.scrollTo(0, y);
  } catch (e) {}
}
function _closeTripSummaryEditPanel() {
  var el = document.getElementById('tripSummaryEditPanel');
  if (el) el.remove();
  _unlockTripSummaryOverlayScroll();
}
function _closeTripSummarySelectionBank() {
  var el = document.getElementById('tripSummarySelectionBankPanel');
  if (el) el.remove();
  _unlockTripSummaryOverlayScroll();
}
"""
    app = replace_once(app, toast_end, scroll_helpers + "\n" + toast_end, 'insert overlay scroll lock helpers')
else:
    log('scroll lock helpers already present')

# 5) Manual visits must survive de-dupe as separate rows.
manual_visit_guard = """  if(r && r.manualVisit){
    return 'manual-visit:' + name.replace(/\s+/g,' ').toLowerCase() + ':' + r.manualVisit + ':' + (r.day || '');
  }
"""
if "return 'manual-visit:'" not in app:
    app = sub_once(app, r"(function _tripSummaryDedupeKey\(r\)\{[\s\S]*?if\(!name\) return '';\n)", r"\1" + manual_visit_guard, 'manualVisit dedupe guard')
else:
    log('manualVisit guard already present')

# 6) Preserve base visit when additional manual visits exist.
visit_branch_pattern = r"\s*if \(ov && Array\.isArray\(ov\.visits\) && ov\.visits\.length\) \{\s*ov\.visits\.forEach\(function\(v, idx\) \{\s*var c = _cloneTripSummaryItem\(it\);\s*var d = parseInt\(v\.day, 10\);\s*if \(d >= 1 && d <= 30\) \{ c\.day = d; c\.dayFrom = 'manual'; \}\s*if \(v\.label\) c\.desc = _sclip\(v\.label, 62\);\s*c\.manual = true;\s*c\.manualVisit = idx \+ 1;\s*out\.push\(c\);\s*\}\);\s*return;\s*\}\s*var c = _cloneTripSummaryItem\(it\);\s*if \(ov\) \{\s*var od = parseInt\(ov\.day, 10\);\s*if \(od >= 1 && od <= 30\) \{ c\.day = od; c\.dayFrom = 'manual'; c\.manual = true; \}\s*if \(ov\.label\) c\.desc = _sclip\(ov\.label, 62\);\s*\}\s*out\.push\(c\);"
new_visit_branch = """
    var c = _cloneTripSummaryItem(it);
    if (ov) {
      var od = parseInt(ov.day, 10);
      if (od >= 1 && od <= 30) { c.day = od; c.dayFrom = 'manual'; c.manual = true; }
      if (ov.label) c.desc = _sclip(ov.label, 62);
    }
    out.push(c);
    if (ov && Array.isArray(ov.visits) && ov.visits.length) {
      ov.visits.forEach(function(v, idx) {
        var extra = _cloneTripSummaryItem(it);
        var d = parseInt(v.day, 10);
        if (d >= 1 && d <= 30) { extra.day = d; extra.dayFrom = 'manual'; }
        if (v.label) extra.desc = _sclip(v.label, 62);
        extra.manual = true;
        extra.manualVisit = idx + 1;
        out.push(extra);
      });
    }"""
app = sub_once(app, visit_branch_pattern, new_visit_branch, 'preserve base row plus manual visits', flags=re.S)

# 7) Use close helpers and lock helpers in overlays.
app = replace_once(app, "if (old) { old.remove(); return; }\n    window._tripSummarySelectionBankItems", "if (old) { _closeTripSummarySelectionBank(); return; }\n    _lockTripSummaryOverlayScroll();\n    window._tripSummarySelectionBankItems", 'selection bank open lock')
app = replace_once(app, "onclick=\"document.getElementById(\\'tripSummarySelectionBankPanel\\').remove()\"", "onclick=\"_closeTripSummarySelectionBank()\"", 'selection bank close button')
app = replace_once(app, "if (old) { old.remove(); return; }\n    var o = _loadTripSummaryOverrides();", "if (old) { _closeTripSummaryEditPanel(); return; }\n    _lockTripSummaryOverlayScroll();\n    var o = _loadTripSummaryOverrides();", 'editor open lock')
app = app.replace("onclick=\"document.getElementById(\\'tripSummaryEditPanel\\').remove()\"", "onclick=\"_closeTripSummaryEditPanel()\"")

# 8) Docs
Path('docs/TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text("""# Trip Summary Regression Fix — PR #132

Date: 2026-08-15
Branch: `feature/trip-summary-regression-fix`
Backup: `backup/pre-trip-summary-regression-fix-2026-08-15`

## Problems

After PR #131, the user reported two regressions:

1. `+ ביקור` in the Trip Summary editor did not visibly add a second visit for `Pizza & Pasta Factory`.
2. The page behind the Trip Summary editor scrolled while trying to scroll the editor on mobile.

During audit, a third issue was found:

3. Burger King OC Eden GPS aliases were accidentally placed inside the day-stop existence alias map instead of `PLACE_COORDS`.

## Fix

- Preserve the base summary row when manual additional visits exist.
- Mark manual visits with `manualVisit` and exclude them from normal de-duplication.
- Add overlay body scroll locking for the Trip Summary editor and selection bank.
- Move Burger King OC Eden aliases into `PLACE_COORDS`.
- Normalize the Burger King day stop to use `desc` and `mapUrl` like the other expense-derived stops.

## Validation

The workflow runs:

- `node --check` on all inline JavaScript.
- JS semantic tests extracted from `app.html` for:
  - duplicate Pure rows still de-dupe to one row.
  - Pizza & Pasta Factory base visit + additional manual visit remain two rows.
  - `_applyTripSummaryOverrides()` preserves base row and adds extra manual visit.
- Static checks for:
  - scroll lock helpers and close helpers.
  - Burger King coordinates in `PLACE_COORDS`.
  - Burger King day aliases as boolean aliases only.
  - no protected storage/Firestore key count changes.

## Boundaries

No intentional changes to:

- expenses storage or values
- visited state / `prague_visited_v1`
- days storage / `prague_days_v1`
- Firestore paths/rules
- backend
- GAS
- auth/login

## Version

`BUILD_ID` advanced to `2026-08-15-j`.
""", encoding='utf-8')

Path('docs/CLAUDE_TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text("""# Claude Handoff — Trip Summary Regression Fix PR #132

Date: 2026-08-15

## Context

PR #131 fixed duplicate rows too aggressively. It unintentionally caused manual additional visits for the same place to be collapsed by the summary de-dupe layer.

The user also reported mobile scroll bleed: while scrolling the Trip Summary editor, the page behind the overlay moved.

A Burger King audit found GPS aliases inserted into the day-stop alias map instead of `PLACE_COORDS`.

## Implementation notes

- `_applyTripSummaryOverrides()` now keeps the base row and appends manual visit rows.
- `_tripSummaryDedupeKey()` returns a unique key for rows with `manualVisit`, so additional visits are not swallowed by GPS/name dedupe.
- Trip Summary editor and selection bank use scroll lock helpers and close helpers instead of direct `.remove()`.
- Burger King OC Eden aliases are now in `PLACE_COORDS`; the day-stop alias map keeps only boolean existence aliases.

## Validation expectation

Before merge/deploy, confirm:

- `node --check` passed.
- Semantic JS tests passed for Pizza & Pasta Factory two visits.
- Overlay helpers exist and are used by both Trip Summary editor and selection bank.
- Final diff contains only `app.html` and docs, no `tools/` or `.github/workflows/`.
- Pages deploy is observed after merge before telling the user it is live.

## Boundaries

Do not touch expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.
""", encoding='utf-8')

# Safety validations
for key in protected:
    require(app.count(key) == old_app.count(key), 'protected key/path count changed: ' + key)
require(app.count('localStorage.removeItem') == old_app.count('localStorage.removeItem'), 'localStorage.removeItem count changed')
require(app.count('localStorage.clear') == old_app.count('localStorage.clear'), 'localStorage.clear count changed')
require("var BUILD_ID = '2026-08-15-j';" in app, 'BUILD_ID j missing')
require("'Burger King — OC Eden': [50.06780, 14.47170]," in app, 'Burger King PLACE_COORDS missing')
require("'Burger King — OC Eden': true" in app, 'Burger King day alias true missing')
require("return 'manual-visit:'" in app, 'manualVisit dedupe guard missing')
require('function _lockTripSummaryOverlayScroll()' in app and 'function _unlockTripSummaryOverlayScroll()' in app, 'scroll lock helpers missing')
require('_closeTripSummaryEditPanel()' in app and '_closeTripSummarySelectionBank()' in app, 'overlay close helpers missing')

APP.write_text(app, encoding='utf-8')

# Extract inline JS for syntax check.
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')

# Brace-matching extractor for semantic tests on real functions from app.html.
def extract_func(src, name):
    sig = 'function ' + name + '('
    start = src.find(sig)
    require(start >= 0, 'function not found: ' + name)
    brace = src.find('{', start)
    require(brace >= 0, 'function brace not found: ' + name)
    depth = 0
    for i in range(brace, len(src)):
        ch = src[i]
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return src[start:i+1]
    raise SystemExit('function end not found: ' + name)

semantic = """
var PLACE_COORDS = {
  'Pizza & Pasta Factory': [50.083515,14.422403],
  'Pure גלידה': [50.0692,14.4142],
  'Náplavka / שוק האיכרים על הנהר': [50.0692,14.4142]
};
function assert(cond, msg){ if(!cond){ throw new Error(msg); } }
function _cloneTripSummaryItem(it){ var c={}; Object.keys(it||{}).forEach(function(k){ c[k]=it[k]; }); return c; }
function _sclip(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function _sortTripSummaryItems(items){ return items; }
var __ov = { version:1, places:{}, hidden:{}, added:[] };
function _loadTripSummaryOverrides(){ return __ov; }
""" + "\n".join([
    extract_func(app, '_applyTripSummaryOverrides'),
    extract_func(app, '_tripSummaryDedupeKey'),
    extract_func(app, '_tripSummaryDedupeRows'),
]) + """
var pureRows = _tripSummaryDedupeRows([
  {name:'Pure גלידה', coords:[50.0692,14.4142], day:8},
  {name:'Náplavka / שוק האיכרים על הנהר', coords:[50.0692,14.4142], day:8}
]);
assert(pureRows.length === 1, 'Pure/Naplavka duplicate did not collapse');
var pizzaRows = _tripSummaryDedupeRows([
  {name:'Pizza & Pasta Factory', coords:[50.083515,14.422403], day:3},
  {name:'Pizza & Pasta Factory', coords:[50.083515,14.422403], day:7, manual:true, manualVisit:1}
]);
assert(pizzaRows.length === 2, 'Pizza manual visit was swallowed by dedupe');
assert(pizzaRows[1].manualVisit === 1 && pizzaRows[1].day === 7, 'Pizza manual visit metadata lost');
__ov = { version:1, places:{'Pizza & Pasta Factory':{visits:[{day:7,label:'ביקור נוסף'}]}}, hidden:{}, added:[] };
var applied = _applyTripSummaryOverrides([{name:'Pizza & Pasta Factory', day:3, coords:[50.083515,14.422403], icon:'🍕', desc:'base', ts:1}]);
assert(applied.length === 2, 'apply overrides did not return base + extra');
assert(applied[0].day === 3 && !applied[0].manualVisit, 'base Pizza row changed unexpectedly');
assert(applied[1].day === 7 && applied[1].manualVisit === 1, 'extra Pizza visit missing');
console.log('semantic trip summary regression tests passed');
"""
Path('/tmp/trip-summary-regression-tests.js').write_text(semantic, encoding='utf-8')
log('prepared fix and semantic tests')
