from pathlib import Path
import re
import subprocess
import sys

APP = Path('app.html')
DOC = Path('docs/CLAUDE_TRIP_SUMMARY_CLOUD_SYNC.md')

def repl(src: str, old: str, new: str, label: str) -> str:
    if old not in src:
        raise SystemExit(f'missing marker: {label}')
    return src.replace(old, new, 1)

app = APP.read_text(encoding='utf-8')

app = repl(app,
"  try { if (_hasLocalData('prague_budget_v1') && typeof saveBudget === 'function' && typeof loadBudget === 'function') saveBudget(loadBudget()); } catch (e) { console.warn('resync budget categories failed', e); }\n}",
"  try { if (_hasLocalData('prague_budget_v1') && typeof saveBudget === 'function' && typeof loadBudget === 'function') saveBudget(loadBudget()); } catch (e) { console.warn('resync budget categories failed', e); }\n  try { if (_hasLocalData('prague_trip_summary_overrides_v1') && typeof _saveTripSummaryOverridesToCloud === 'function') _saveTripSummaryOverridesToCloud(_loadTripSummaryOverrides(), _tripSummaryOverridesLocalTs() || Date.now()); } catch (e) { console.warn('resync trip summary overrides failed', e); }\n}",
'resync trip summary overrides')

cloud_block = """var TRIP_SUMMARY_OVERRIDES_KEY = 'prague_trip_summary_overrides_v1';
var TRIP_SUMMARY_OVERRIDES_TS_KEY = 'prague_trip_summary_overrides_ts';
var _tripSummaryCloudUnsub = null;
var _tripSummaryCloudApplying = false;

function _emptyTripSummaryOverrides() { return { version: 1, places: {}, hidden: {}, added: [] }; }

function _tripSummaryOverridesLocalTs() {
  try { return Number(localStorage.getItem(TRIP_SUMMARY_OVERRIDES_TS_KEY) || '0') || 0; } catch (e) { return 0; }
}

function _tripSummaryOverridesMeaningful(o) {
  if (!o || typeof o !== 'object') return false;
  var places = o.places && typeof o.places === 'object' ? o.places : {};
  var hidden = o.hidden && typeof o.hidden === 'object' ? o.hidden : {};
  var added = Array.isArray(o.added) ? o.added : [];
  return Object.keys(places).length > 0 || Object.keys(hidden).length > 0 || added.length > 0;
}

function _saveTripSummaryOverridesToCloud(o, ts) {
  if (_tripSummaryCloudApplying) return;
  o = o || _emptyTripSummaryOverrides();
  ts = Number(ts || Date.now()) || Date.now();
  try {
    ensureFirebaseAuth().then(function(ok) {
      if (!ok) return;
      var db = getFirestoreDb();
      db.collection('appdata').doc('trip_summary').set({
        version: 1,
        overrides_json: JSON.stringify(o),
        ts: ts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(function(e) { console.warn('trip summary cloud save failed', e); });
    }).catch(function(e) { console.warn('trip summary auth check failed', e); });
  } catch (e) { console.warn('trip summary cloud save init failed', e); }
}

function _applyTripSummaryOverridesFromCloud(d) {
  if (!d) return;
  var remote = null;
  try {
    if (d.overrides_json) remote = JSON.parse(d.overrides_json);
    else if (d.overrides && typeof d.overrides === 'object') remote = d.overrides;
  } catch (e) { console.warn('trip summary cloud parse failed', e); return; }
  if (!remote || typeof remote !== 'object') return;
  var remoteTs = Number(d.ts || 0) || 0;
  var localTs = _tripSummaryOverridesLocalTs();
  var remoteMeaningful = _tripSummaryOverridesMeaningful(remote);
  var localMeaningful = _hasLocalData(TRIP_SUMMARY_OVERRIDES_KEY);
  if (!remoteMeaningful && localMeaningful) return;
  if (localMeaningful && localTs && remoteTs && remoteTs < localTs) {
    _saveTripSummaryOverridesToCloud(_loadTripSummaryOverrides(), localTs);
    return;
  }
  _tripSummaryCloudApplying = true;
  try {
    localStorage.setItem(TRIP_SUMMARY_OVERRIDES_KEY, JSON.stringify(remote));
    if (remoteTs) localStorage.setItem(TRIP_SUMMARY_OVERRIDES_TS_KEY, String(remoteTs));
  } catch (e) { console.warn('trip summary cloud apply failed', e); }
  _tripSummaryCloudApplying = false;
  try { if (document.getElementById('tripSummaryOverlay')) _refreshTripSummaryPreview(); } catch (e) {}
}

function initTripSummaryOverridesCloudSync() {
  if (_tripSummaryCloudUnsub) return;
  try {
    ensureFirebaseAuth().then(function(ok) {
      if (!ok || _tripSummaryCloudUnsub) return;
      var db = getFirestoreDb();
      _tripSummaryCloudUnsub = db.collection('appdata').doc('trip_summary').onSnapshot(function(snap) {
        if (!snap.exists) {
          if (_hasLocalData(TRIP_SUMMARY_OVERRIDES_KEY)) _saveTripSummaryOverridesToCloud(_loadTripSummaryOverrides(), _tripSummaryOverridesLocalTs() || Date.now());
          return;
        }
        _applyTripSummaryOverridesFromCloud(snap.data() || {});
      }, function(e) { console.warn('trip summary cloud listener failed', e); });
    }).catch(function(e) { console.warn('trip summary cloud auth failed', e); });
  } catch (e) { console.warn('trip summary cloud init failed', e); }
}"""

app = repl(app,
"var TRIP_SUMMARY_OVERRIDES_KEY = 'prague_trip_summary_overrides_v1';\nvar TRIP_SUMMARY_OVERRIDES_TS_KEY = 'prague_trip_summary_overrides_ts';\n\nfunction _emptyTripSummaryOverrides() { return { version: 1, places: {}, hidden: {}, added: [] }; }",
cloud_block,
'trip summary cloud functions')

app = repl(app,
"  localStorage.setItem(TRIP_SUMMARY_OVERRIDES_KEY, JSON.stringify(o));\n  localStorage.setItem(TRIP_SUMMARY_OVERRIDES_TS_KEY, String(Date.now()));\n}",
"  localStorage.setItem(TRIP_SUMMARY_OVERRIDES_KEY, JSON.stringify(o));\n  localStorage.setItem(TRIP_SUMMARY_OVERRIDES_TS_KEY, String(Date.now()));\n  _saveTripSummaryOverridesToCloud(o, _tripSummaryOverridesLocalTs());\n}",
'save cloud call')

app = repl(app, "var BUILD_ID = '2026-08-15-b';", "var BUILD_ID = '2026-08-15-c';", 'build id')
app = repl(app,
"  try { _renderBuildStamp(); } catch (e) {}\n}",
"  try { _renderBuildStamp(); } catch (e) {}\n  try { if (typeof initTripSummaryOverridesCloudSync === 'function') initTripSummaryOverridesCloudSync(); } catch (e) { console.warn('trip summary cloud init from showApp failed', e); }\n}",
'show app cloud init')

APP.write_text(app, encoding='utf-8')

DOC.write_text('''# Claude Trip Summary Cloud Sync — PR #126

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-cloud-sync`
Backup branch: `backup/pre-trip-summary-cloud-sync-2026-08-15`

## Purpose

Persist manual trip-summary corrections from PR #125 to Firestore without touching existing app data.

## Files changed

- `app.html`
- `docs/CLAUDE_TRIP_SUMMARY_CLOUD_SYNC.md`

## Runtime change in `app.html`

New isolated Firestore document:

- `appdata/trip_summary`

Existing local keys remain the local cache/source:

- `prague_trip_summary_overrides_v1`
- `prague_trip_summary_overrides_ts`

Added functions:

- `_tripSummaryOverridesLocalTs()`
- `_tripSummaryOverridesMeaningful(o)`
- `_saveTripSummaryOverridesToCloud(o, ts)`
- `_applyTripSummaryOverridesFromCloud(d)`
- `initTripSummaryOverridesCloudSync()`

Integration points:

- `_saveTripSummaryOverrides(o)` writes local first, then attempts Firestore save.
- `_resyncLocalDataToCloud()` uploads local trip-summary overrides after login only if local override data exists.
- `_showApp()` starts the isolated listener after the authenticated app is displayed.
- `BUILD_ID` becomes `2026-08-15-c`.

## Safety boundaries

Do not touch or reuse:

- `appdata/main`
- `appdata/expenses`
- `prague_days_v1`
- `prague_visited_v1`
- `prague_exp_v10`
- GAS / backend login code

Conflict protection:

- Empty remote state does not overwrite meaningful local override data.
- Older remote timestamp does not overwrite newer local override data.
- Newer local data is pushed back to `appdata/trip_summary`.
- Firestore save uses `{ merge: true }`.
''', encoding='utf-8')

old = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)
new = APP.read_text(encoding='utf-8')
doc = DOC.read_text(encoding='utf-8')
def count(s, needle): return s.count(needle)
checks = [
    ('BUILD_ID', "var BUILD_ID = '2026-08-15-c';" in new),
    ('cloud doc path', "collection('appdata').doc('trip_summary')" in new and 'appdata/trip_summary' in doc),
    ('override keys', 'prague_trip_summary_overrides_v1' in new and 'prague_trip_summary_overrides_ts' in new),
    ('no appdata/main', count(new, 'appdata/main') == count(old, 'appdata/main')),
    ('no appdata/expenses', count(new, 'appdata/expenses') == count(old, 'appdata/expenses')),
    ('only collection additions', count(new, "collection('appdata')") == count(old, "collection('appdata')") + 2),
    ('protected local keys unchanged', all(count(new, k) == count(old, k) for k in ['prague_days_v1','prague_visited_v1','prague_exp_v10','prague_exp_ts'])),
    ('no remove/clear added', count(new, 'localStorage.removeItem') == count(old, 'localStorage.removeItem') and count(new, 'localStorage.clear') == count(old, 'localStorage.clear')),
    ('merge true', '{ merge: true }' in new),
]
bad = [name for name, ok in checks if not ok]
if bad:
    print('FAILED:', bad)
    sys.exit(1)
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
