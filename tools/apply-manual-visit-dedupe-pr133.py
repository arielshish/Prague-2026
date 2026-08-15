from pathlib import Path
import re, subprocess

APP=Path('app.html')
app=APP.read_text(encoding='utf-8')
old_app=subprocess.check_output(['git','show','origin/main:app.html'],text=True)
PROTECTED=['prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1','prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts','appdata/main','appdata/expenses','appdata/trip_summary']

def fail(msg):
    print('::error file=tools/apply-manual-visit-dedupe-pr133.py::'+msg, flush=True)
    raise SystemExit(msg)
def need(cond,msg):
    if not cond: fail(msg)
def rep(old,new,label):
    global app
    need(old in app,'missing anchor: '+label)
    app=app.replace(old,new,1)
    print('[PR133]',label,flush=True)
def sub(pattern,repl,label,flags=0):
    global app
    app2,n=re.subn(pattern,repl,app,count=1,flags=flags)
    need(n==1,'regex missing: '+label)
    app=app2
    print('[PR133]',label,flush=True)

rep("var BUILD_ID = '2026-08-15-j';", "var BUILD_ID = '2026-08-15-k';", 'BUILD_ID j->k')

old_block="""    if (ov && Array.isArray(ov.visits) && ov.visits.length) {
      ov.visits.forEach(function(v, idx) {
        var extra = _cloneTripSummaryItem(it);
        var d = parseInt(v.day, 10);
        if (d >= 1 && d <= 30) { extra.day = d; extra.dayFrom = 'manual'; }
        if (v.label) extra.desc = _sclip(v.label, 62);
        extra.manual = true;
        extra.manualVisit = idx + 1;
        out.push(extra);
      });
    }
"""
new_block="""    if (ov && Array.isArray(ov.visits) && ov.visits.length) {
      // PR #133: old repeated taps may have saved identical manual visits.
      // Keep the data untouched, but render each place+day+label manual visit only once.
      var seenManualVisits = {};
      var manualVisitN = 0;
      ov.visits.forEach(function(v) {
        var d = parseInt(v.day, 10);
        var label = _sclip(v && v.label ? v.label : 'ביקור נוסף', 62);
        var key = String((d >= 1 && d <= 30) ? d : '') + '|' + label.replace(/\s+/g,' ').trim().toLowerCase();
        if (seenManualVisits[key]) return;
        seenManualVisits[key] = true;
        manualVisitN++;
        var extra = _cloneTripSummaryItem(it);
        if (d >= 1 && d <= 30) { extra.day = d; extra.dayFrom = 'manual'; }
        extra.desc = label;
        extra.manual = true;
        extra.manualVisit = manualVisitN;
        out.push(extra);
      });
    }
"""
rep(old_block,new_block,'dedupe duplicate manual visits while rendering')

Path('docs/TRIP_SUMMARY_MANUAL_VISIT_DEDUPE_PR133.md').write_text("""# Trip Summary Manual Visit De-dupe — PR #133

Date: 2026-08-15
Branch: `feature/manual-visit-dedupe-fix`
Backup: `backup/pre-manual-visit-dedupe-2026-08-15`

## Problem

After PR #132 correctly stopped hiding manual additional visits, older repeated taps on `+ ביקור` became visible as multiple identical `Pizza & Pasta Factory — ביקור נוסף` rows.

## Fix

- Do not delete or mutate saved override data.
- During Trip Summary rendering, collapse identical manual visits for the same place by `day + label`.
- Keep the base row and one unique additional manual visit.
- Preserve distinct manual visits when the day or label is different.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests extracted from `app.html`:
  - repeated same-day/same-label Pizza & Pasta Factory manual visits render once.
  - different-day manual visits remain distinct.
  - Pure/Náplavka duplicate still collapses.
- Static guards ensure protected storage/Firestore key counts are unchanged.

## Boundaries

No changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-k`.
""",encoding='utf-8')
Path('docs/CLAUDE_TRIP_SUMMARY_MANUAL_VISIT_DEDUPE_PR133.md').write_text("""# Claude Handoff — Trip Summary Manual Visit De-dupe PR #133

PR #132 exposed existing duplicate manual visits saved from repeated `+ ביקור` taps. PR #133 keeps the saved data intact and only de-dupes identical manual visit rows during rendering.

Key rule: collapse duplicate manual visits by `day + label` for the same source place, but keep distinct days/labels.

Final diff must contain only `app.html` and the two PR #133 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
""",encoding='utf-8')

for k in PROTECTED:
    need(app.count(k)==old_app.count(k),'protected key/path count changed: '+k)
need(app.count('localStorage.removeItem')==old_app.count('localStorage.removeItem'),'localStorage.removeItem count changed')
need(app.count('localStorage.clear')==old_app.count('localStorage.clear'),'localStorage.clear count changed')
need("var BUILD_ID = '2026-08-15-k';" in app,'build id missing')
need('seenManualVisits' in app and 'manualVisitN' in app,'manual visit render dedupe missing')
APP.write_text(app,encoding='utf-8')

scripts=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',app,flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts),encoding='utf-8')

def extract_func(src,name):
    start=src.find('function '+name+'(')
    need(start>=0,'function missing: '+name)
    b=src.find('{',start); need(b>=0,'brace missing: '+name)
    depth=0
    for i in range(b,len(src)):
        if src[i]=='{': depth+=1
        elif src[i]=='}':
            depth-=1
            if depth==0: return src[start:i+1]
    fail('function end missing: '+name)

semantic="""
var PLACE_COORDS={'Pizza & Pasta Factory':[50.083515,14.422403],'Pure גלידה':[50.0692,14.4142],'Náplavka / שוק האיכרים על הנהר':[50.0692,14.4142]};
function assert(c,m){ if(!c) throw new Error(m); }
function _cloneTripSummaryItem(it){ var c={}; Object.keys(it||{}).forEach(function(k){c[k]=it[k];}); return c; }
function _sclip(s,n){ s=String(s||''); return s.length>n ? s.slice(0,n-1)+'…' : s; }
function _sortTripSummaryItems(items){ return items; }
var __ov={version:1,places:{},hidden:{},added:[]};
function _loadTripSummaryOverrides(){ return __ov; }
"""+'\n'.join([extract_func(app,'_applyTripSummaryOverrides'),extract_func(app,'_tripSummaryDedupeKey'),extract_func(app,'_tripSummaryDedupeRows')])+"""
__ov={version:1,places:{'Pizza & Pasta Factory':{visits:[{day:3,label:'ביקור נוסף'},{day:3,label:'ביקור נוסף'},{day:3,label:'ביקור נוסף'}]}},hidden:{},added:[]};
var dupApplied=_applyTripSummaryOverrides([{name:'Pizza & Pasta Factory',day:3,coords:[50.083515,14.422403],icon:'🍕',desc:'base'}]);
assert(dupApplied.length===2,'duplicate identical manual visits should render base + one extra');
assert(dupApplied[1].manualVisit===1 && dupApplied[1].desc==='ביקור נוסף','unique manual visit metadata wrong');
__ov={version:1,places:{'Pizza & Pasta Factory':{visits:[{day:3,label:'ביקור נוסף'},{day:7,label:'ביקור נוסף'}]}},hidden:{},added:[]};
var distinctApplied=_applyTripSummaryOverrides([{name:'Pizza & Pasta Factory',day:3,coords:[50.083515,14.422403],icon:'🍕',desc:'base'}]);
assert(distinctApplied.length===3,'distinct manual visit days should remain');
var pure=_tripSummaryDedupeRows([{name:'Pure גלידה',coords:[50.0692,14.4142],day:8},{name:'Náplavka / שוק האיכרים על הנהר',coords:[50.0692,14.4142],day:8}]);
assert(pure.length===1,'Pure/Naplavka de-dupe regressed');
console.log('manual visit dedupe semantic tests passed');
"""
Path('/tmp/manual-visit-dedupe-tests.js').write_text(semantic,encoding='utf-8')
print('[PR133] prepared fix')
