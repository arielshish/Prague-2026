from pathlib import Path
import re, subprocess

APP=Path('app.html')
app=APP.read_text(encoding='utf-8')
old_app=subprocess.check_output(['git','show','origin/main:app.html'], text=True)
PROTECTED=['prague_visited_v1','prague_exp_v10','prague_exp_ts','prague_days_v1','prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts','appdata/main','appdata/expenses','appdata/trip_summary']

def fail(msg):
    print('::error file=tools/apply-trip-summary-added-editor-pr134.py::'+msg, flush=True)
    raise SystemExit(msg)
def need(cond,msg):
    if not cond: fail(msg)
def rep(old,new,label):
    global app
    need(old in app, 'missing anchor: '+label)
    app=app.replace(old,new,1)
    print('[PR134]',label,flush=True)

rep("var BUILD_ID = '2026-08-15-k';", "var BUILD_ID = '2026-08-15-l';", 'BUILD_ID k->l')

helper = r"""

// PR #134: edit/remove items that were added from the Trip Summary selection bank.
function tripSummaryManualSetAdded(btn) {
  var idx = parseInt(btn && btn.getAttribute('data-idx'), 10);
  if (!isFinite(idx) || idx < 0) return;
  var o = _loadTripSummaryOverrides();
  if (!o.added || !o.added[idx]) return;
  var dayEl = document.getElementById('tsAddedDay_' + idx);
  var labelEl = document.getElementById('tsAddedLabel_' + idx);
  var d = parseInt(dayEl && dayEl.value, 10);
  o.added[idx].day = (d >= 1 && d <= 30) ? d : null;
  var label = labelEl ? String(labelEl.value || '').replace(/\s+/g, ' ').trim() : '';
  o.added[idx].label = label || 'נוסף מבנק הבחירה';
  _saveTripSummaryOverrides(o);
  _refreshTripSummaryPreview();
  toast('✅ פריט בנק הבחירה עודכן');
}
function tripSummaryManualRemoveAdded(btn) {
  var idx = parseInt(btn && btn.getAttribute('data-idx'), 10);
  if (!isFinite(idx) || idx < 0) return;
  var o = _loadTripSummaryOverrides();
  if (!o.added || !o.added[idx]) return;
  var name = o.added[idx].name || 'פריט';
  o.added.splice(idx, 1);
  _saveTripSummaryOverrides(o);
  _refreshTripSummaryPreview();
  _closeTripSummaryEditPanel();
  openTripSummaryOverridesEditor();
  toast('🗑️ הוסר מהסיכום: ' + name);
}
"""
rep("function openTripSummaryOverridesEditor() {", helper + "\nfunction openTripSummaryOverridesEditor() {", 'insert added-item editor helpers')

fn=app.index('function openTripSummaryOverridesEditor()')
pi=app.index('    panel.innerHTML =', fn)
pre=app[:pi]
anchor='    });\n'
last=pre.rfind(anchor, fn, pi)
need(last>=0, 'cannot find end of base editor rows loop')
insert=r"""    var addedRows = '';
    (o.added || []).forEach(function(a, idx) {
      if (!a || !a.name) return;
      var day = a.day || '';
      var label = a.label || 'נוסף מבנק הבחירה';
      addedRows += '<div style="background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.28);border-radius:14px;padding:10px;margin-bottom:8px;">' +
        '<div style="font-weight:900;font-size:13px;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📌 ' + _sxesc(a.name) + '</div>' +
        '<div style="font-size:10px;color:#86efac;font-weight:900;margin-bottom:7px;">נוסף מבנק הבחירה — אפשר לערוך או להסיר מכאן</div>' +
        '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">' +
          '<select id="tsAddedDay_' + idx + '" style="flex:1;border-radius:10px;border:none;padding:9px;font-weight:800;">' + _tripSummaryDayOptions(day) + '</select>' +
          '<button type="button" data-idx="' + idx + '" onclick="tripSummaryManualSetAdded(this)" style="border:none;border-radius:10px;background:#22c55e;color:#fff;padding:9px 10px;font-weight:800;">שמור</button>' +
        '</div>' +
        '<input id="tsAddedLabel_' + idx + '" value="' + _sxesc(label) + '" placeholder="תווית בסיכום" style="width:100%;box-sizing:border-box;border:none;border-radius:10px;padding:9px;font-weight:800;margin-bottom:6px;direction:rtl;">' +
        '<button type="button" data-idx="' + idx + '" onclick="tripSummaryManualRemoveAdded(this)" style="width:100%;border:none;border-radius:10px;background:#ef4444;color:#fff;padding:9px;font-weight:900;">הסר מהסיכום</button>' +
      '</div>';
    });
    if (addedRows) {
      rows += '<div style="margin:14px 0 8px;font-size:12px;font-weight:900;color:#86efac;border-top:1px solid rgba(255,255,255,0.16);padding-top:12px;">📌 פריטים שנוספו מבנק הבחירה</div>' + addedRows;
    }
"""
app=app[:last+len(anchor)] + insert + app[last+len(anchor):]
print('[PR134] inject added rows into manual editor', flush=True)

Path('docs/TRIP_SUMMARY_ADDED_EDITOR_PR134.md').write_text("""# Trip Summary Added Items Editor — PR #134

Date: 2026-08-15
Branch: `feature/trip-summary-added-editor`
Backup: `backup/pre-trip-summary-added-editor-2026-08-15`

## Problem

Items added through the Trip Summary selection bank were stored in `overrides.added` and rendered in the Trip Summary as `נוסף מבנק הבחירה`, but the manual editor only listed base trip-summary places. Therefore the user could see bank-added items in the summary but could not edit or remove them from the editor.

## Fix

- Add a dedicated section in the Trip Summary manual editor: `פריטים שנוספו מבנק הבחירה`.
- Each bank-added item now exposes name, day selector, label input, save button, and remove-from-summary button.
- Keep data model unchanged: items remain in `overrides.added` until the user removes a specific item.

## Validation

- `node --check` on inline JavaScript.
- Semantic JS tests for `tripSummaryManualSetAdded` and `tripSummaryManualRemoveAdded` with mocked override store and DOM.
- Static guards verify final UI strings and protected storage/Firestore key counts.

## Boundaries

No changes to expenses, visited state, days storage, Firestore paths/rules, backend, GAS, or auth/login.

Version: `2026-08-15-l`.
""", encoding='utf-8')
Path('docs/CLAUDE_TRIP_SUMMARY_ADDED_EDITOR_PR134.md').write_text("""# Claude Handoff — Trip Summary Added Items Editor PR #134

PR #134 fixes a UI gap after the selection bank feature: `overrides.added` rows appeared in the Trip Summary but were not editable in the manual editor.

The manual editor now renders a dedicated section for bank-added items, with day/label editing and a remove-from-summary action. The data model remains unchanged and saved overrides are not bulk-deleted.

Final diff must contain only `app.html` and the two PR #134 docs. Do not merge temporary `tools/` or `.github/workflows/` files.
""", encoding='utf-8')

for k in PROTECTED:
    need(app.count(k)==old_app.count(k), 'protected key/path count changed: '+k)
need(app.count('localStorage.removeItem')==old_app.count('localStorage.removeItem'), 'localStorage.removeItem count changed')
need(app.count('localStorage.clear')==old_app.count('localStorage.clear'), 'localStorage.clear count changed')
for s in ["var BUILD_ID = '2026-08-15-l';", 'tripSummaryManualSetAdded', 'tripSummaryManualRemoveAdded', 'פריטים שנוספו מבנק הבחירה', 'tsAddedLabel_']:
    need(s in app, 'missing final string: '+s)
APP.write_text(app, encoding='utf-8')
scripts=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')

def extract_func(src,name):
    start=src.find('function '+name+'(')
    need(start>=0, 'function missing: '+name)
    b=src.find('{', start); need(b>=0, 'brace missing: '+name)
    depth=0
    for i in range(b, len(src)):
        if src[i]=='{': depth+=1
        elif src[i]=='}':
            depth-=1
            if depth==0: return src[start:i+1]
    fail('function end missing: '+name)
semantic="""
function assert(c,m){ if(!c) throw new Error(m); }
var __saved=null, __refreshed=0, __reopened=0, __closed=0, __toast='';
var __ov={version:1,places:{},hidden:{},added:[{name:'Havelské tržiště',day:null,label:'נוסף מבנק הבחירה'},{name:'Primark — כיכר וצסלב',day:8,label:'ישן'}]};
var __els={};
var document={getElementById:function(id){ return __els[id] || null; }};
function _loadTripSummaryOverrides(){ return JSON.parse(JSON.stringify(__ov)); }
function _saveTripSummaryOverrides(o){ __ov=o; __saved=o; }
function _refreshTripSummaryPreview(){ __refreshed++; }
function _closeTripSummaryEditPanel(){ __closed++; }
function openTripSummaryOverridesEditor(){ __reopened++; }
function toast(s){ __toast=s; }
""" + extract_func(app,'tripSummaryManualSetAdded') + "\n" + extract_func(app,'tripSummaryManualRemoveAdded') + """
__els['tsAddedDay_0']={value:'8'};
__els['tsAddedLabel_0']={value:'שוק האוכל'};
tripSummaryManualSetAdded({getAttribute:function(){return '0';}});
assert(__ov.added[0].day===8, 'set added day failed');
assert(__ov.added[0].label==='שוק האוכל', 'set added label failed');
assert(__saved && __refreshed===1, 'save/refresh missing on set');
tripSummaryManualRemoveAdded({getAttribute:function(){return '0';}});
assert(__ov.added.length===1, 'remove added failed');
assert(__ov.added[0].name==='Primark — כיכר וצסלב', 'wrong item remained after remove');
assert(__closed===1 && __reopened===1 && __refreshed===2, 'close/reopen/refresh missing on remove');
console.log('added editor semantic tests passed');
"""
Path('/tmp/trip-summary-added-editor-tests.js').write_text(semantic, encoding='utf-8')
print('[PR134] prepared fix')
