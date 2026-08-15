from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git','show','origin/main:app.html'], text=True)
PROTECTED = ['prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1','prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts','appdata/main','appdata/expenses','appdata/trip_summary']

def fail(msg):
    print('::error file=tools/apply-trip-summary-regression-fix-pr132c.py::' + msg, flush=True)
    raise SystemExit(msg)

def need(cond, msg):
    if not cond:
        fail(msg)

def rep(old, new, label):
    global app
    need(old in app, 'missing anchor: ' + label)
    app = app.replace(old, new, 1)
    print('[PR132c]', label, flush=True)

def sub(pattern, repl, label, flags=0):
    global app
    app2, n = re.subn(pattern, repl, app, count=1, flags=flags)
    need(n == 1, 'regex missing: ' + label)
    app = app2
    print('[PR132c]', label, flush=True)

rep("var BUILD_ID = '2026-08-15-i';", "var BUILD_ID = '2026-08-15-j';", 'BUILD_ID i->j')

# Move Burger King aliases into PLACE_COORDS.
marker = "  // PR #130: expense-derived day stops — real locations only\n"
need(marker in app, 'PLACE_COORDS PR130 marker missing')
if 'Burger King — OC Eden' not in app.split(marker, 1)[0]:
    rep(marker, marker + """  // PR #132: Burger King OC Eden aliases moved to PLACE_COORDS
  'Burger King — OC Eden': [50.06780, 14.47170],
  'Burger King OC Eden': [50.06780, 14.47170],
  'BK Praha OC Eden': [50.06780, 14.47170],
  'Burger King — U Slavie': [50.06780, 14.47170],
""", 'insert BK coords before PR130 marker')

# The day guard alias map should only contain boolean aliases.
sub(r"\s*// PR #131: expense-derived Burger King stop, receipt: BK Praha OC Eden, U Slavie 1527, Praha 10\n\s*'Burger King — OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King OC Eden': \[50\.06780, 14\.47170\],\n\s*'BK Praha OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King — U Slavie': \[50\.06780, 14\.47170\],\n", """
      // PR #132: existence aliases only; GPS lives in PLACE_COORDS.
      'Burger King — OC Eden': true,
      'Burger King OC Eden': true,
      'BK Praha OC Eden': true,
      'Burger King — U Slavie': true,
""", 'BK aliases arrays -> boolean')

# Normalize the BK day stop to existing stop field names.
sub(r"\{\s*emoji:\s*'🍔',\s*name:\s*'Burger King — OC Eden',\s*time:\s*'13:56',\s*area:\s*'OC Eden / U Slavie 1527, Praha 10',\s*note:\s*'מהקבלה — 918 CZK, Burger King BK Praha OC Eden'\s*\},", """{
    emoji: '🍔',
    name: 'Burger King — OC Eden',
    time: '13:56',
    desc: 'נוסף לפי הוצאה: 918 CZK · BK Praha OC Eden · U Slavie 1527, Praha 10.',
    mapUrl: 'https://www.google.com/maps/search/Burger+King+OC+Eden+U+Slavie+1527+Praha'
  },""", 'normalize BK stop', re.S)

# Scroll lock helpers.
if 'function _lockTripSummaryOverlayScroll()' not in app:
    anchor = """function isGas() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}
"""
    helpers = """
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
    var p = _tripSummaryBodyPrevStyle || {};
    document.body.style.position = p.position || '';
    document.body.style.top = p.top || '';
    document.body.style.left = p.left || '';
    document.body.style.right = p.right || '';
    document.body.style.width = p.width || '';
    document.body.style.overflow = p.overflow || '';
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
    rep(anchor, helpers + '\n' + anchor, 'insert overlay scroll helpers')

# Manual visits must not be collapsed by summary de-dupe.
if "return 'manual-visit:'" not in app:
    m = re.search(r"(function _tripSummaryDedupeKey\(r\)\{[\s\S]*?if\(!name\) return '';\n)", app)
    need(m, 'manualVisit insertion point missing')
    app = app[:m.end()] + """  if(r && r.manualVisit){
    return 'manual-visit:' + name.replace(/\s+/g,' ').toLowerCase() + ':' + r.manualVisit + ':' + (r.day || '');
  }
""" + app[m.end():]

visit_pat = r"\s*if \(ov && Array\.isArray\(ov\.visits\) && ov\.visits\.length\) \{\s*ov\.visits\.forEach\(function\(v, idx\) \{\s*var c = _cloneTripSummaryItem\(it\);\s*var d = parseInt\(v\.day, 10\);\s*if \(d >= 1 && d <= 30\) \{ c\.day = d; c\.dayFrom = 'manual'; \}\s*if \(v\.label\) c\.desc = _sclip\(v\.label, 62\);\s*c\.manual = true;\s*c\.manualVisit = idx \+ 1;\s*out\.push\(c\);\s*\}\);\s*return;\s*\}\s*var c = _cloneTripSummaryItem\(it\);\s*if \(ov\) \{\s*var od = parseInt\(ov\.day, 10\);\s*if \(od >= 1 && od <= 30\) \{ c\.day = od; c\.dayFrom = 'manual'; c\.manual = true; \}\s*if \(ov\.label\) c\.desc = _sclip\(ov\.label, 62\);\s*\}\s*out\.push\(c\);"
visit_new = """
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
sub(visit_pat, visit_new, 'preserve base row plus manual visits', re.S)

# Use close helpers and lock on overlay open.
rep("if (old) { old.remove(); return; }\n    window._tripSummarySelectionBankItems", "if (old) { _closeTripSummarySelectionBank(); return; }\n    _lockTripSummaryOverlayScroll();\n    window._tripSummarySelectionBankItems", 'bank open scroll lock')
rep("onclick=\"document.getElementById(\\'tripSummarySelectionBankPanel\\').remove()\"", "onclick=\"_closeTripSummarySelectionBank()\"", 'bank close helper')
rep("if (old) { old.remove(); return; }\n    var o = _loadTripSummaryOverrides();", "if (old) { _closeTripSummaryEditPanel(); return; }\n    _lockTripSummaryOverlayScroll();\n    var o = _loadTripSummaryOverrides();", 'editor open scroll lock')
app = app.replace("onclick=\"document.getElementById(\\'tripSummaryEditPanel\\').remove()\"", "onclick=\"_closeTripSummaryEditPanel()\"")

# Docs.
Path('docs/TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text("""# Trip Summary Regression Fix — PR #132

Branch: `feature/trip-summary-regression-fix-clean`
Backup: `backup/pre-trip-summary-regression-fix-2026-08-15`

## Fixes

- `+ ביקור` now preserves the base summary row and appends additional manual visit rows.
- Manual visit rows use a unique de-duplication key and are not swallowed by GPS/name de-dupe.
- Trip Summary editor and selection bank lock body scroll while open.
- Burger King OC Eden GPS aliases moved into `PLACE_COORDS`.
- Burger King day stop normalized to `desc` and `mapUrl`.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests extracted from the real `app.html` functions:
  - Pure/Náplavka still de-dupes to one row.
  - Pizza & Pasta Factory base + extra manual visit stays two rows.
  - `_applyTripSummaryOverrides()` preserves base and appends extra visit.
- Static guards verify scroll helpers, Burger King GPS/boolean aliases, and protected storage/Firestore key counts.

## Boundaries

No intentional changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-j`.
""", encoding='utf-8')
Path('docs/CLAUDE_TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text("""# Claude Handoff — Trip Summary Regression Fix PR #132

PR #131 de-duplicated summary rows too aggressively. This PR keeps canonical duplicate cleanup but excludes `manualVisit` rows from normal de-dupe so a second Pizza & Pasta Factory visit remains visible.

It also locks body scroll while full-screen Trip Summary overlays are open and moves Burger King OC Eden GPS aliases into `PLACE_COORDS`.

Final diff must contain only `app.html` and the two PR #132 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
""", encoding='utf-8')

# Safety and semantic validation files.
for key in PROTECTED:
    need(app.count(key) == old_app.count(key), 'protected key/path count changed: ' + key)
need(app.count('localStorage.removeItem') == old_app.count('localStorage.removeItem'), 'localStorage.removeItem count changed')
need(app.count('localStorage.clear') == old_app.count('localStorage.clear'), 'localStorage.clear count changed')
need("var BUILD_ID = '2026-08-15-j';" in app, 'BUILD_ID missing')
need("return 'manual-visit:'" in app, 'manualVisit key missing')
need('function _lockTripSummaryOverlayScroll()' in app and 'function _unlockTripSummaryOverlayScroll()' in app, 'overlay lock helpers missing')
need('_closeTripSummaryEditPanel()' in app and '_closeTripSummarySelectionBank()' in app, 'overlay close helpers missing')
need('Burger King — OC Eden' in app and '50.06780' in app and '14.47170' in app, 'Burger King GPS tokens missing')
need("'Burger King — OC Eden': true" in app, 'Burger King boolean day alias missing')

APP.write_text(app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')

def extract_func(src, name):
    start = src.find('function ' + name + '(')
    need(start >= 0, 'function missing: ' + name)
    brace = src.find('{', start)
    depth = 0
    for i in range(brace, len(src)):
        if src[i] == '{': depth += 1
        elif src[i] == '}':
            depth -= 1
            if depth == 0:
                return src[start:i+1]
    fail('function end missing: ' + name)

semantic = """
var PLACE_COORDS = {
  'Pizza & Pasta Factory': [50.083515,14.422403],
  'Pure גלידה': [50.0692,14.4142],
  'Náplavka / שוק האיכרים על הנהר': [50.0692,14.4142]
};
function assert(cond,msg){ if(!cond) throw new Error(msg); }
function _cloneTripSummaryItem(it){ var c={}; Object.keys(it||{}).forEach(function(k){c[k]=it[k];}); return c; }
function _sclip(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function _sortTripSummaryItems(items){ return items; }
var __ov = { version:1, places:{}, hidden:{}, added:[] };
function _loadTripSummaryOverrides(){ return __ov; }
""" + "\n".join([
    extract_func(app, '_applyTripSummaryOverrides'),
    extract_func(app, '_tripSummaryDedupeKey'),
    extract_func(app, '_tripSummaryDedupeRows')
]) + """
var pure = _tripSummaryDedupeRows([
  {name:'Pure גלידה', coords:[50.0692,14.4142], day:8},
  {name:'Náplavka / שוק האיכרים על הנהר', coords:[50.0692,14.4142], day:8}
]);
assert(pure.length === 1, 'Pure/Naplavka did not de-dupe');
var pizza = _tripSummaryDedupeRows([
  {name:'Pizza & Pasta Factory', coords:[50.083515,14.422403], day:3},
  {name:'Pizza & Pasta Factory', coords:[50.083515,14.422403], day:7, manual:true, manualVisit:1}
]);
assert(pizza.length === 2, 'Pizza manual visit swallowed by de-dupe');
__ov = { version:1, places:{'Pizza & Pasta Factory':{visits:[{day:7,label:'ביקור נוסף'}]}}, hidden:{}, added:[] };
var applied = _applyTripSummaryOverrides([{name:'Pizza & Pasta Factory', day:3, coords:[50.083515,14.422403], icon:'🍕', desc:'base', ts:1}]);
assert(applied.length === 2, 'apply overrides did not return base + extra');
assert(applied[0].day === 3 && !applied[0].manualVisit, 'base visit changed');
assert(applied[1].day === 7 && applied[1].manualVisit === 1, 'extra visit missing');
console.log('semantic trip summary regression tests passed');
"""
Path('/tmp/trip-summary-regression-tests.js').write_text(semantic, encoding='utf-8')
print('[PR132c] prepared fix')
