from pathlib import Path
import re, subprocess

APP=Path('app.html')
app=APP.read_text(encoding='utf-8')
old_app=subprocess.check_output(['git','show','origin/main:app.html'],text=True)
PROTECTED=['prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1','prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts','appdata/main','appdata/expenses','appdata/trip_summary']

def fail(m): print('::error file=tools/apply-trip-summary-regression-fix-pr132b.py::'+m,flush=True); raise SystemExit(m)
def need(c,m):
    if not c: fail(m)
def rep(o,n,l):
    global app; need(o in app,'missing '+l); app=app.replace(o,n,1); print('[PR132]',l,flush=True)
def sub(p,r,l,flags=0):
    global app; app2,n=re.subn(p,r,app,count=1,flags=flags); need(n==1,'regex missing '+l); app=app2; print('[PR132]',l,flush=True)

rep("var BUILD_ID = '2026-08-15-i';","var BUILD_ID = '2026-08-15-j';",'build id')
marker="  // PR #130: expense-derived day stops — real locations only\n"
need(marker in app,'place coords marker')
if not re.search(r"['\"]Burger King — OC Eden['\"]\s*:\s*\[50\.06780\s*,\s*14\.47170\]", app.split(marker,1)[0]):
    rep(marker, marker+"""  // PR #132: Burger King OC Eden aliases moved to PLACE_COORDS
  'Burger King — OC Eden': [50.06780, 14.47170],
  'Burger King OC Eden': [50.06780, 14.47170],
  'BK Praha OC Eden': [50.06780, 14.47170],
  'Burger King — U Slavie': [50.06780, 14.47170],
""", 'BK coords')
sub(r"\s*// PR #131: expense-derived Burger King stop, receipt: BK Praha OC Eden, U Slavie 1527, Praha 10\n\s*'Burger King — OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King OC Eden': \[50\.06780, 14\.47170\],\n\s*'BK Praha OC Eden': \[50\.06780, 14\.47170\],\n\s*'Burger King — U Slavie': \[50\.06780, 14\.47170\],\n", """
      // PR #132: existence aliases only; GPS lives in PLACE_COORDS.
      'Burger King — OC Eden': true,
      'Burger King OC Eden': true,
      'BK Praha OC Eden': true,
      'Burger King — U Slavie': true,
""", 'BK aliases')
sub(r"\{\s*emoji:\s*'🍔',\s*name:\s*'Burger King — OC Eden',\s*time:\s*'13:56',\s*area:\s*'OC Eden / U Slavie 1527, Praha 10',\s*note:\s*'מהקבלה — 918 CZK, Burger King BK Praha OC Eden'\s*\},", """{
    emoji: '🍔',
    name: 'Burger King — OC Eden',
    time: '13:56',
    desc: 'נוסף לפי הוצאה: 918 CZK · BK Praha OC Eden · U Slavie 1527, Praha 10.',
    mapUrl: 'https://www.google.com/maps/search/Burger+King+OC+Eden+U+Slavie+1527+Praha'
  },""", 'BK stop', re.S)

if 'function _lockTripSummaryOverlayScroll()' not in app:
    anchor="""function isGas() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}
"""
    helpers="""
// PR #132: lock background scroll while full-screen trip-summary overlays are open.
var _tripSummaryOverlayScrollDepth = 0;
var _tripSummaryOverlayScrollY = 0;
var _tripSummaryBodyPrevStyle = null;
function _lockTripSummaryOverlayScroll() {
  try {
    if (_tripSummaryOverlayScrollDepth++ > 0) return;
    _tripSummaryOverlayScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    _tripSummaryBodyPrevStyle = { position: document.body.style.position || '', top: document.body.style.top || '', left: document.body.style.left || '', right: document.body.style.right || '', width: document.body.style.width || '', overflow: document.body.style.overflow || '' };
    document.body.style.position = 'fixed'; document.body.style.top = '-' + _tripSummaryOverlayScrollY + 'px'; document.body.style.left = '0'; document.body.style.right = '0'; document.body.style.width = '100%'; document.body.style.overflow = 'hidden';
  } catch (e) {}
}
function _unlockTripSummaryOverlayScroll() {
  try {
    if (_tripSummaryOverlayScrollDepth <= 0) return;
    _tripSummaryOverlayScrollDepth--; if (_tripSummaryOverlayScrollDepth > 0) return;
    var y = _tripSummaryOverlayScrollY || 0, p = _tripSummaryBodyPrevStyle || {};
    document.body.style.position = p.position || ''; document.body.style.top = p.top || ''; document.body.style.left = p.left || ''; document.body.style.right = p.right || ''; document.body.style.width = p.width || ''; document.body.style.overflow = p.overflow || '';
    window.scrollTo(0, y);
  } catch (e) {}
}
function _closeTripSummaryEditPanel() { var el = document.getElementById('tripSummaryEditPanel'); if (el) el.remove(); _unlockTripSummaryOverlayScroll(); }
function _closeTripSummarySelectionBank() { var el = document.getElementById('tripSummarySelectionBankPanel'); if (el) el.remove(); _unlockTripSummaryOverlayScroll(); }
"""
    rep(anchor, helpers+'\n'+anchor, 'scroll helpers')

if "return 'manual-visit:'" not in app:
    m=re.search(r"(function _tripSummaryDedupeKey\(r\)\{[\s\S]*?if\(!name\) return '';\n)",app); need(m,'manual guard anchor')
    app=app[:m.end()]+"""  if(r && r.manualVisit){
    return 'manual-visit:' + name.replace(/\s+/g,' ').toLowerCase() + ':' + r.manualVisit + ':' + (r.day || '');
  }
"""+app[m.end():]

visit_pat=r"\s*if \(ov && Array\.isArray\(ov\.visits\) && ov\.visits\.length\) \{\s*ov\.visits\.forEach\(function\(v, idx\) \{\s*var c = _cloneTripSummaryItem\(it\);\s*var d = parseInt\(v\.day, 10\);\s*if \(d >= 1 && d <= 30\) \{ c\.day = d; c\.dayFrom = 'manual'; \}\s*if \(v\.label\) c\.desc = _sclip\(v\.label, 62\);\s*c\.manual = true;\s*c\.manualVisit = idx \+ 1;\s*out\.push\(c\);\s*\}\);\s*return;\s*\}\s*var c = _cloneTripSummaryItem\(it\);\s*if \(ov\) \{\s*var od = parseInt\(ov\.day, 10\);\s*if \(od >= 1 && od <= 30\) \{ c\.day = od; c\.dayFrom = 'manual'; c\.manual = true; \}\s*if \(ov\.label\) c\.desc = _sclip\(ov\.label, 62\);\s*\}\s*out\.push\(c\);"
visit_new="""
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
sub(visit_pat,visit_new,'manual visits',re.S)
rep("if (old) { old.remove(); return; }\n    window._tripSummarySelectionBankItems", "if (old) { _closeTripSummarySelectionBank(); return; }\n    _lockTripSummaryOverlayScroll();\n    window._tripSummarySelectionBankItems", 'bank lock')
rep("onclick=\"document.getElementById(\\'tripSummarySelectionBankPanel\\').remove()\"", "onclick=\"_closeTripSummarySelectionBank()\"", 'bank close')
rep("if (old) { old.remove(); return; }\n    var o = _loadTripSummaryOverrides();", "if (old) { _closeTripSummaryEditPanel(); return; }\n    _lockTripSummaryOverlayScroll();\n    var o = _loadTripSummaryOverrides();", 'editor lock')
app=app.replace("onclick=\"document.getElementById(\\'tripSummaryEditPanel\\').remove()\"","onclick=\"_closeTripSummaryEditPanel()\"")

Path('docs/TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text('# Trip Summary Regression Fix — PR #132\n\nFixes manual visit de-dupe, overlay scroll lock, and Burger King PLACE_COORDS.\n\nValidation: node --check plus semantic JS tests for Pure de-dupe and Pizza & Pasta Factory base + extra visit.\n\nNo expenses/visited/days/Firestore/backend/GAS/auth changes.\n\nVersion: `2026-08-15-j`.\n',encoding='utf-8')
Path('docs/CLAUDE_TRIP_SUMMARY_REGRESSION_FIX_PR132.md').write_text('# Claude Handoff — Trip Summary Regression Fix PR #132\n\nManual visits must not be swallowed by de-dupe. Body scroll must be locked while trip summary overlays are open. Burger King GPS aliases belong in PLACE_COORDS, not the day alias map.\n\nFinal diff should contain only app.html and docs.\n',encoding='utf-8')

for k in PROTECTED: need(app.count(k)==old_app.count(k),'protected count changed '+k)
need(app.count('localStorage.removeItem')==old_app.count('localStorage.removeItem'),'removeItem changed')
need(app.count('localStorage.clear')==old_app.count('localStorage.clear'),'clear changed')
need("var BUILD_ID = '2026-08-15-j';" in app,'version missing')
need("return 'manual-visit:'" in app,'manual key missing')
need('function _lockTripSummaryOverlayScroll()' in app and 'function _closeTripSummaryEditPanel()' in app and 'function _closeTripSummarySelectionBank()' in app,'overlay helpers missing')
need(re.search(r"['\"]Burger King — OC Eden['\"]\s*:\s*\[50\.06780\s*,\s*14\.47170\]", app), 'BK coords missing')
need("'Burger King — OC Eden': true" in app,'BK boolean alias missing')
APP.write_text(app,encoding='utf-8')
scripts=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',app,flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts),encoding='utf-8')

def extract(src,name):
    s=src.find('function '+name+'('); need(s>=0,'missing fn '+name); b=src.find('{',s); d=0
    for i in range(b,len(src)):
        if src[i]=='{': d+=1
        elif src[i]=='}':
            d-=1
            if d==0: return src[s:i+1]
    fail('fn end '+name)
semantic="""
var PLACE_COORDS={'Pizza & Pasta Factory':[50.083515,14.422403],'Pure גלידה':[50.0692,14.4142],'Náplavka / שוק האיכרים על הנהר':[50.0692,14.4142]};
function assert(c,m){if(!c)throw new Error(m)}
function _cloneTripSummaryItem(it){var c={};Object.keys(it||{}).forEach(function(k){c[k]=it[k]});return c}
function _sclip(s,n){s=String(s||'');return s.length>n?s.slice(0,n-1)+'…':s}
function _sortTripSummaryItems(items){return items}
var __ov={version:1,places:{},hidden:{},added:[]};function _loadTripSummaryOverrides(){return __ov}
"""+'\n'.join([extract(app,'_applyTripSummaryOverrides'),extract(app,'_tripSummaryDedupeKey'),extract(app,'_tripSummaryDedupeRows')])+"""
var pure=_tripSummaryDedupeRows([{name:'Pure גלידה',coords:[50.0692,14.4142],day:8},{name:'Náplavka / שוק האיכרים על הנהר',coords:[50.0692,14.4142],day:8}]);assert(pure.length===1,'pure')
var pizza=_tripSummaryDedupeRows([{name:'Pizza & Pasta Factory',coords:[50.083515,14.422403],day:3},{name:'Pizza & Pasta Factory',coords:[50.083515,14.422403],day:7,manual:true,manualVisit:1}]);assert(pizza.length===2,'pizza dedupe')
__ov={version:1,places:{'Pizza & Pasta Factory':{visits:[{day:7,label:'ביקור נוסף'}]}},hidden:{},added:[]};
var applied=_applyTripSummaryOverrides([{name:'Pizza & Pasta Factory',day:3,coords:[50.083515,14.422403],icon:'🍕',desc:'base',ts:1}]);assert(applied.length===2,'apply len');assert(applied[0].day===3&&!applied[0].manualVisit,'base');assert(applied[1].day===7&&applied[1].manualVisit===1,'extra');console.log('semantic ok')
"""
Path('/tmp/trip-summary-regression-tests.js').write_text(semantic,encoding='utf-8')
print('[PR132] prepared fix B')
