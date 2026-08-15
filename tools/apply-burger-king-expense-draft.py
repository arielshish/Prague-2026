from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if "var BUILD_ID = '2026-08-15-i';" not in app:
    raise SystemExit('expected BUILD_ID 2026-08-15-i not found')
app = app.replace("var BUILD_ID = '2026-08-15-i';", "var BUILD_ID = '2026-08-15-j';", 1)

helper = r"""
// PR #132: one-time Burger King expense draft from receipt.
// Creates a zero-amount draft so Ariel can edit only the amount in the app.
function _ensureBurgerKingExpenseDraft(){
  var draftId = 'receipt-burger-king-oc-eden-2026-08-15-1356';
  var markerKey = 'prague_exp_draft_' + draftId;
  try {
    var exists = (EXPENSES || []).some(function(e){
      var s = String((e && e.name) || '') + ' ' + String((e && e.note) || '') + ' ' + String((e && e.place) || '');
      return s.indexOf('BK Praha OC Eden') >= 0 || s.indexOf('Burger King — OC Eden') >= 0 || s.indexOf(draftId) >= 0;
    });
    if (exists) {
      try { localStorage.setItem(markerKey, 'done'); } catch(e) {}
      return false;
    }
    if (localStorage.getItem(markerKey) === 'done') return false;
    EXPENSES.unshift({
      id: Date.now(),
      draftId: draftId,
      date: '15.8.2026, 13:56:00',
      name: '🍔 Burger King — OC Eden',
      czk: 0,
      ils: 0,
      note: 'טיוטה מקבלה — BK Praha OC Eden · U Slavie 1527 · הזן סכום',
      place: 'Burger King — OC Eden',
      cat: 'אוכל ומסעדות 🍽️'
    });
    localStorage.setItem(markerKey, 'done');
    return true;
  } catch(e) {
    console.warn('Burger King expense draft failed', e);
    return false;
  }
}
function ensureBurgerKingExpenseDraft(){
  if (_ensureBurgerKingExpenseDraft()) {
    saveLocal();
    try {
      ensureFirebaseAuth().then(function(){
        return getFirestoreDb().collection('appdata').doc('main').set({ expenses: JSON.stringify(EXPENSES) }, { merge: true });
      }).catch(function(e){ console.warn('Burger King expense draft main sync failed', e); });
    } catch(e) {}
    renderExpenses();
    try { toast('🍔 נוספה טיוטת הוצאה ל-Burger King — הזן סכום'); } catch(e) {}
  }
}
"""

if '_ensureBurgerKingExpenseDraft' in app:
    raise SystemExit('Burger King expense draft helper already exists')
anchor = "var currentDay = 1;"
if anchor not in app:
    raise SystemExit('currentDay anchor not found')
app = app.replace(anchor, anchor + "\n" + helper, 1)

# Call after local load and after remote expense refreshes, without touching existing data.
if "ensureBurgerKingExpenseDraft();" in app:
    raise SystemExit('draft call already exists')
local_anchor = "function loadLocal() {\n  try { EXPENSES = JSON.parse(localStorage.getItem('prague_exp_v10') || '[]'); } catch(e) { EXPENSES = []; }\n  renderExpenses();\n}"
if local_anchor not in app:
    raise SystemExit('loadLocal exact anchor not found')
app = app.replace(local_anchor, "function loadLocal() {\n  try { EXPENSES = JSON.parse(localStorage.getItem('prague_exp_v10') || '[]'); } catch(e) { EXPENSES = []; }\n  ensureBurgerKingExpenseDraft();\n  renderExpenses();\n}", 1)

# If a remote pull later overwrites local data before the draft exists remotely, recreate once after remote render.
remote_pattern = "EXPENSES = remote;\n            localStorage.setItem('prague_exp_v10', doc.data().data);\n            localStorage.setItem('prague_exp_ts', String(remoteTs));\n            renderExpenses();"
if remote_pattern not in app:
    raise SystemExit('remote appdata/expenses anchor not found')
app = app.replace(remote_pattern, "EXPENSES = remote;\n            localStorage.setItem('prague_exp_v10', doc.data().data);\n            localStorage.setItem('prague_exp_ts', String(remoteTs));\n            ensureBurgerKingExpenseDraft();\n            renderExpenses();", 1)

# Add docs.
Path('docs/BURGER_KING_EXPENSE_DRAFT_PR132.md').write_text("""# Burger King Expense Draft — PR #132

Date: 2026-08-15
Branch: `feature/burger-king-expense-draft`
Backup: `backup/pre-burger-king-expense-draft-2026-08-15`

## Request

The user asked to add Burger King as an expense object, with the amount left for manual entry.

Receipt details:

- `BK Praha OC Eden`
- `U Slavie 1527, Praha 10`
- `15.08.2026 13:56`
- receipt total shown: `918 CZK`

## Implementation

Adds a one-time zero-amount expense draft:

```js
{
  date: '15.8.2026, 13:56:00',
  name: '🍔 Burger King — OC Eden',
  czk: 0,
  ils: 0,
  note: 'טיוטה מקבלה — BK Praha OC Eden · U Slavie 1527 · הזן סכום',
  place: 'Burger King — OC Eden',
  cat: 'אוכל ומסעדות 🍽️'
}
```

A local marker prevents duplicate draft creation. The code also checks existing expense names/notes/place before inserting.

## Safety

- Does not delete or overwrite existing expenses.
- Does not mark visited state.
- Does not change budget categories.
- Does not touch days, backend, GAS, or Firestore rules.
- The only data mutation is inserting one zero-amount draft if no matching Burger King expense exists.

## Version

`BUILD_ID` advanced to `2026-08-15-j`.
""", encoding='utf-8')

Path('docs/CLAUDE_BURGER_KING_EXPENSE_DRAFT_PR132.md').write_text("""# Claude Handoff — Burger King Expense Draft PR #132

Date: 2026-08-15

## Context

The user uploaded a Burger King receipt and previously asked to add it as a stop. After PR #131, the user asked why it was not visible in expenses, then clarified: add it as an expense object and leave the amount for the user to fill in.

## Change

Adds `_ensureBurgerKingExpenseDraft()` and `ensureBurgerKingExpenseDraft()`.

The draft is inserted only if no existing expense matches:

- `BK Praha OC Eden`
- `Burger King — OC Eden`
- `receipt-burger-king-oc-eden-2026-08-15-1356`

The inserted draft has:

- name: `🍔 Burger King — OC Eden`
- date: `15.8.2026, 13:56:00`
- `czk: 0`
- `ils: 0`
- category: `אוכל ומסעדות 🍽️`
- place: `Burger King — OC Eden`

## Important

This intentionally mutates expenses by adding a single zero-amount draft. It does not delete, overwrite, or auto-fill the 918 CZK amount. Ariel will edit the amount manually in the app.
""", encoding='utf-8')

# Safety checks.
new_app = app
protected_same = [
    'prague_visited_v1','prague_days_v1','prague_trip_summary_overrides_v1','prague_trip_summary_overrides_ts',
    'appdata/trip_summary'
]
for key in protected_same:
    if new_app.count(key) != old_app.count(key):
        raise SystemExit('protected non-expense key/path count changed: ' + key)
if new_app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')
if new_app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
for needle in ["var BUILD_ID = '2026-08-15-j';", '_ensureBurgerKingExpenseDraft', '🍔 Burger King — OC Eden', 'czk: 0', 'ils: 0']:
    if needle not in new_app:
        raise SystemExit('missing expected needle: ' + needle)

APP.write_text(new_app, encoding='utf-8')
scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('Burger King expense draft applied')
