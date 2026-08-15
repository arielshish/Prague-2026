from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "function openTripSummarySelectionBank()" in app:
    raise SystemExit('selection bank already exists')

bank_js = r'''
// ── PR #129: Trip Summary Selection Bank ─────────────────────────────────────
function _tripSummaryBankEsc(s) {
  try { return (typeof _sxesc === 'function') ? _sxesc(String(s || '')) : esc(String(s || '')); }
  catch(e) { return String(s || '').replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
}

function _tripSummaryBankCompoundParts(name) {
  name = String(name || '').replace(/\s+/g, ' ').trim();
  if (name === 'Josefov, בית הכנסת ירושלים, Café Savoy') {
    return ['הרובע היהודי – Josefov', 'בית הכנסת ירושלים', 'Café Savoy'];
  }
  if (name === 'Primark → Na Příkopě → Palladium → Hamleys/LEGO') {
    return ['Primark — כיכר וצסלב', 'שדרת Na Příkopě', 'Palladium', 'Hamleys + LEGO Store'];
  }
  return name ? [name] : [];
}

function _tripSummaryBankRecByName() {
  var out = {};
  try { _mappablePlaces().forEach(function(p){ if (p && p.name && !out[p.name]) out[p.name] = p; }); } catch(e) {}
  return out;
}

function _tripSummaryBankCoords(name, recByName) {
  var c = PLACE_COORDS[name];
  if (c && c.length === 2) return c;
  var rec = recByName && recByName[name];
  if (rec && rec.coords && rec.coords.length === 2) return rec.coords;
  return null;
}

function _tripSummaryBankBaseHas(name) {
  try { return _tripSummaryBaseData().some(function(it){ return it && it.name === name; }); } catch(e) { return false; }
}

function _tripSummaryBankVisibleHas(name) {
  try { return _tripSummaryData().some(function(it){ return it && it.name === name; }); } catch(e) { return false; }
}

function _tripSummaryBankAddCandidate(map, recByName, rawName, source, day, icon, label) {
  _tripSummaryBankCompoundParts(rawName).forEach(function(name) {
    var coords = _tripSummaryBankCoords(name, recByName);
    if (!coords) return; // hard rule: no GPS = not selectable in the bank
    var key = 'c:' + Number(coords[0]).toFixed(5) + ',' + Number(coords[1]).toFixed(5);
    var rec = recByName[name] || {};
    if (!map[key]) {
      map[key] = { name:name, coords:coords, day:day || null, icon:icon || rec.icon || '📍', label:label || '', sources:{}, aliases:[] };
    }
    map[key].sources[source || 'מקור'] = true;
    if (name !== map[key].name && map[key].aliases.indexOf(name) < 0) map[key].aliases.push(name);
    if (!map[key].day && day) map[key].day = day;
    if (!map[key].label && label) map[key].label = label;
  });
}

function _tripSummarySelectionBankCandidates() {
  var recByName = _tripSummaryBankRecByName();
  var map = {};
  try {
    _tripSummaryBaseData().forEach(function(it) {
      if (!it || !it.name) return;
      _tripSummaryBankAddCandidate(map, recByName, it.name, 'סיכום', it.day || null, it.icon || '📍', it.label || '');
    });
  } catch(e) {}
  try {
    getDaysState().forEach(function(d, idx) {
      (d.stops || []).forEach(function(s) {
        if (!s || !s.name) return;
        _tripSummaryBankAddCandidate(map, recByName, s.name, 'לו״ז', d.dayNum || (idx + 1), s.emoji || '📍', s.time || '');
      });
    });
  } catch(e) {}
  try {
    _mappablePlaces().forEach(function(p) {
      if (!p || !p.name) return;
      _tripSummaryBankAddCandidate(map, recByName, p.name, 'מפה', null, p.icon || '📍', p.cat || p.type || '');
    });
  } catch(e) {}
  try {
    var o = _loadTripSummaryOverrides();
    (o.added || []).forEach(function(a) {
      if (!a || !a.name) return;
      _tripSummaryBankAddCandidate(map, recByName, a.name, 'ידני', a.day || null, a.icon || '📍', a.label || '');
    });
    Object.keys(o.hidden || {}).forEach(function(n) {
      _tripSummaryBankAddCandidate(map, recByName, n, 'מוסתר', null, '🙈', '');
    });
  } catch(e) {}
  var out = Object.keys(map).map(function(k){ return map[k]; });
  out.sort(function(a, b) {
    var av = _tripSummaryBankVisibleHas(a.name) ? 0 : 1;
    var bv = _tripSummaryBankVisibleHas(b.name) ? 0 : 1;
    if (av !== bv) return av - bv;
    return String(a.name).localeCompare(String(b.name), 'he');
  });
  return out;
}

function openTripSummarySelectionBank() {
  try {
    var old = document.getElementById('tripSummarySelectionBankPanel');
    if (old) { old.remove(); return; }
    window._tripSummarySelectionBankItems = _tripSummarySelectionBankCandidates();
    var panel = document.createElement('div');
    panel.id = 'tripSummarySelectionBankPanel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.97);z-index:10080;display:flex;flex-direction:column;color:#fff;font-family:Rubik,Arial,sans-serif;direction:rtl;';
    panel.innerHTML =
      '<div style="display:flex;gap:8px;padding:14px;border-bottom:1px solid rgba(255,255,255,0.14);align-items:center;">' +
        '<button type="button" onclick="document.getElementById(\'tripSummarySelectionBankPanel\').remove()" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#fff;border-radius:12px;padding:10px 14px;font-weight:800;">✕</button>' +
        '<div style="flex:1;font-size:16px;font-weight:900;">📋 בנק בחירה לסיכום</div>' +
      '</div>' +
      '<div style="padding:12px;border-bottom:1px solid rgba(255,255,255,0.12);">' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.72);line-height:1.6;margin-bottom:8px;">רק מקומות עם מיקום נכנסים לבנק. פעולה כאן לא מסמנת “היינו” ולא משנה הוצאות או לו״ז.</div>' +
        '<input id="tsBankSearch" oninput="renderTripSummarySelectionBankList()" placeholder="חיפוש מקום..." style="width:100%;box-sizing:border-box;border:none;border-radius:12px;padding:11px 12px;font-weight:800;margin-bottom:8px;">' +
        '<select id="tsBankFilter" onchange="renderTripSummarySelectionBankList()" style="width:100%;box-sizing:border-box;border:none;border-radius:12px;padding:10px 12px;font-weight:800;">' +
          '<option value="all">הכל</option><option value="visible">מופיע בסיכום</option><option value="hidden">מוסתר</option><option value="missing">לא מופיע בסיכום</option><option value="visited">היינו</option><option value="schedule">לו״ז</option>' +
        '</select>' +
      '</div>' +
      '<div id="tsBankList" style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch;padding:12px;"></div>' +
      '<div style="padding:10px 12px;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;color:rgba(255,255,255,0.56);">📍 כל הפריטים כאן עברו בדיקת מיקום · אין פריטים חסרי GPS</div>';
    document.body.appendChild(panel);
    renderTripSummarySelectionBankList();
  } catch(e) { toast('⚠️ שגיאה בבנק: ' + (e && e.message)); }
}

function renderTripSummarySelectionBankList() {
  var list = document.getElementById('tsBankList'); if (!list) return;
  var items = window._tripSummarySelectionBankItems || [];
  var o = _loadTripSummaryOverrides();
  var q = ((document.getElementById('tsBankSearch') || {}).value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  var filter = ((document.getElementById('tsBankFilter') || {}).value || 'all');
  var shown = 0, html = '';
  items.forEach(function(it) {
    var hidden = !!(o.hidden || {})[it.name];
    var visible = _tripSummaryBankVisibleHas(it.name) && !hidden;
    var visited = (typeof isVisited === 'function') ? !!isVisited(it.name) : false;
    var sourceKeys = Object.keys(it.sources || {});
    var hay = (it.name + ' ' + sourceKeys.join(' ') + ' ' + (it.aliases || []).join(' ')).toLowerCase();
    if (q && hay.indexOf(q) < 0) return;
    if (filter === 'visible' && !visible) return;
    if (filter === 'hidden' && !hidden) return;
    if (filter === 'missing' && visible) return;
    if (filter === 'visited' && !visited) return;
    if (filter === 'schedule' && !it.sources['לו״ז']) return;
    shown++;
    var enc = encodeURIComponent(it.name);
    var badges = '<span style="background:rgba(34,197,94,0.16);border:1px solid rgba(34,197,94,0.28);color:#86efac;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;">📍 יש מיקום</span> ';
    if (visible) badges += '<span style="background:rgba(59,130,246,0.16);color:#93c5fd;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;">✅ בסיכום</span> ';
    if (hidden) badges += '<span style="background:rgba(239,68,68,0.16);color:#fca5a5;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;">🙈 מוסתר</span> ';
    if (visited) badges += '<span style="background:rgba(16,185,129,0.16);color:#6ee7b7;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;">👣 היינו</span> ';
    sourceKeys.forEach(function(s){ badges += '<span style="background:rgba(255,255,255,0.10);color:rgba(255,255,255,0.78);border-radius:999px;padding:3px 8px;font-size:10px;font-weight:800;">' + _tripSummaryBankEsc(s) + '</span> '; });
    var actions = '';
    if (!visible || hidden) actions += '<button type="button" data-name="' + enc + '" onclick="tripSummaryBankAdd(this)" style="flex:1;border:none;border-radius:10px;background:#22c55e;color:#fff;padding:9px;font-weight:900;">הצג / הוסף</button>';
    if (visible && !hidden) actions += '<button type="button" data-name="' + enc + '" onclick="tripSummaryBankHide(this)" style="flex:1;border:none;border-radius:10px;background:#ef4444;color:#fff;padding:9px;font-weight:900;">הסתר</button>';
    html += '<div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:11px;margin-bottom:8px;">' +
      '<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:7px;">' +
        '<div style="font-size:18px;line-height:1;">' + _tripSummaryBankEsc(it.icon || '📍') + '</div>' +
        '<div style="flex:1;min-width:0;"><div style="font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _tripSummaryBankEsc(it.name) + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.54);margin-top:2px;">' + (it.day ? 'יום ' + it.day + ' · ' : '') + Number(it.coords[0]).toFixed(5) + ', ' + Number(it.coords[1]).toFixed(5) + '</div></div>' +
      '</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">' + badges + '</div>' +
      '<div style="display:flex;gap:6px;">' + actions + '</div>' +
    '</div>';
  });
  list.innerHTML = '<div style="font-size:12px;color:rgba(255,255,255,0.62);margin-bottom:8px;">נמצאו ' + shown + ' מתוך ' + items.length + ' מקומות לבחירה</div>' + (html || '<div style="padding:18px;text-align:center;color:rgba(255,255,255,0.55);">אין תוצאות</div>');
}

function _tripSummaryBankName(btn) {
  try { return decodeURIComponent(btn.getAttribute('data-name') || ''); } catch(e) { return ''; }
}

function tripSummaryBankAdd(btn) {
  var name = _tripSummaryBankName(btn); if (!name) return;
  if (!_tripSummaryBankCoords(name, _tripSummaryBankRecByName())) { toast('⚠️ אין מיקום — לא נוסף'); return; }
  var o = _loadTripSummaryOverrides();
  delete o.hidden[name];
  var existsInAdded = (o.added || []).some(function(a){ return a && a.name === name; });
  if (!_tripSummaryBankBaseHas(name) && !existsInAdded) {
    o.added.push({ name:name, day:null, icon:'📍', label:'נוסף מבנק הבחירה' });
  }
  _saveTripSummaryOverrides(o);
  _refreshTripSummaryPreview();
  window._tripSummarySelectionBankItems = _tripSummarySelectionBankCandidates();
  renderTripSummarySelectionBankList();
  toast('✅ הוצג בסיכום');
}

function tripSummaryBankHide(btn) {
  var name = _tripSummaryBankName(btn); if (!name) return;
  var o = _loadTripSummaryOverrides();
  o.hidden[name] = true;
  _saveTripSummaryOverrides(o);
  _refreshTripSummaryPreview();
  window._tripSummarySelectionBankItems = _tripSummarySelectionBankCandidates();
  renderTripSummarySelectionBankList();
  toast('🙈 הוסתר מהסיכום');
}
'''

anchor = 'function openTripSummaryOverridesEditor() {'
pos = app.find(anchor)
if pos < 0:
    raise SystemExit('openTripSummaryOverridesEditor anchor not found')
app = app[:pos] + bank_js + '\n' + app[pos:]

header_old = "'<div style=\"flex:1;font-size:16px;font-weight:900;\">✏️ תיקון ידני לסיכום</div>' +"
header_new = "'<div style=\"flex:1;font-size:16px;font-weight:900;\">✏️ תיקון ידני לסיכום</div>' +\n        '<button type=\"button\" onclick=\"openTripSummarySelectionBank()\" style=\"border:none;border-radius:12px;background:#22c55e;color:#fff;padding:10px 12px;font-weight:900;\">📋 בנק בחירה</button>' +"
if header_old not in app:
    raise SystemExit('manual editor header pattern not found')
app = app.replace(header_old, header_new, 1)

# Make any existing main button text more explicit if present.
app = app.replace('✏️ תיקון ידני</button>', '✏️ תיקון ידני · 📋 בנק בחירה</button>', 1)

if "var BUILD_ID = '2026-08-15-f';" in app:
    app = app.replace("var BUILD_ID = '2026-08-15-f';", "var BUILD_ID = '2026-08-15-g';", 1)
else:
    raise SystemExit('expected BUILD_ID 2026-08-15-f not found')

APP.write_text(app, encoding='utf-8')
new_app = APP.read_text(encoding='utf-8')

required = [
    'function openTripSummarySelectionBank()',
    'function _tripSummarySelectionBankCandidates()',
    'function tripSummaryBankAdd(btn)',
    'function tripSummaryBankHide(btn)',
    '📋 בנק בחירה',
    "var BUILD_ID = '2026-08-15-g';",
]
for token in required:
    if token not in new_app:
        raise SystemExit('required token missing: ' + token)

protected = [
    'prague_visited_v1',
    'prague_trip_summary_overrides_v1',
    'prague_trip_summary_overrides_ts',
    'prague_days_v1',
    'prague_exp_v10',
    'appdata/main',
    'appdata/expenses',
    'appdata/trip_summary',
]
for key in protected:
    if new_app.count(key) != old_app.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new_app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
if new_app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')
if new_app.count('prague_visited_v1') != old_app.count('prague_visited_v1'):
    raise SystemExit('visited key count changed')

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')

Path('docs/TRIP_SUMMARY_SELECTION_BANK_PR129.md').write_text('''# Trip Summary Selection Bank — PR #129

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-selection-bank`
Backup: `backup/pre-trip-summary-selection-bank-2026-08-15`

## Goal

Add a selectable bank inside Trip Summary so the user can show, add, or hide places from the trip summary.

## Hard rule

No GPS = not selectable.

The bank only includes candidates that resolve through `PLACE_COORDS[name]` or an existing map record coordinate.

## UI

Adds a `📋 בנק בחירה` button inside the existing manual trip-summary editor.

The bank panel includes:

- search by name
- filters: all / visible / hidden / not visible / visited / schedule
- GPS status badge
- source badges: summary, itinerary, map, manual, hidden
- actions: show/add or hide

## De-duplication

The bank de-duplicates by coordinate, so the same physical place does not appear multiple times when it comes from itinerary, map, and summary sources.

Compound strings are split into canonical places where explicitly known:

- `Josefov, בית הכנסת ירושלים, Café Savoy` → Josefov / Jerusalem Synagogue / Café Savoy
- `Primark → Na Příkopě → Palladium → Hamleys/LEGO` → Primark / Na Příkopě / Palladium / Hamleys + LEGO

## Storage

Uses the existing trip-summary override storage only:

- `prague_trip_summary_overrides_v1`
- `prague_trip_summary_overrides_ts`
- Firestore sync path already used by PR #126: `appdata/trip_summary`

No new localStorage keys or Firestore paths are introduced.

## Safety boundaries

No intentional changes to:

- visited state / `prague_visited_v1`
- expenses
- days/schedule storage
- Firestore rules
- login/auth
- backend
- GAS

Bank actions do not mark a place as visited.
''', encoding='utf-8')

Path('docs/CLAUDE_TRIP_SUMMARY_SELECTION_BANK_PR129.md').write_text('''# Claude Handoff — Trip Summary Selection Bank PR #129

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/trip-summary-selection-bank`
Backup: `backup/pre-trip-summary-selection-bank-2026-08-15`

## User intent

The user wants the trip-summary bank implemented and deployed, with backup and documentation.

The user emphasized:

- every selectable bank item must have location
- items without location must not enter the bank
- compound strings containing several real places should be split/de-duplicated, not represented as one fake GPS point

## Implementation summary

Adds a `📋 בנק בחירה` panel for Trip Summary.

The panel collects candidates from:

- `_tripSummaryBaseData()`
- `getDaysState()` itinerary stops
- `_mappablePlaces()`
- existing trip-summary overrides / manual additions
- hidden override names when they resolve to GPS

Each candidate is included only if it has coordinates.

## Actions

- Show/add: removes `hidden[name]`; if the item is not part of base summary, adds it to `o.added` with label `נוסף מבנק הבחירה`
- Hide: sets `o.hidden[name] = true`

Actions save through `_saveTripSummaryOverrides(o)` and refresh via `_refreshTripSummaryPreview()`.

## Explicit non-goals

Do not mutate:

- `prague_visited_v1`
- expenses
- days/schedule storage
- backend/GAS
- Firestore rules

Do not geocode or guess GPS client-side.

## Validation expectations

- `BUILD_ID` is `2026-08-15-g`
- inline JS passes `node --check`
- no new `localStorage.removeItem`
- no new `localStorage.clear`
- protected localStorage keys and Firestore paths unchanged
- final diff contains only `app.html` and docs
''', encoding='utf-8')

print('trip summary selection bank applied')
