from pathlib import Path
import re, subprocess

APP = Path('app.html')
app = APP.read_text(encoding='utf-8')
old_app = subprocess.check_output(['git', 'show', 'origin/main:app.html'], text=True)

if 'EXPENSE_DAY_STOPS_PR130' in app:
    raise SystemExit('PR130 expense stops already exist')

# Update BUILD_ID
if "var BUILD_ID = '2026-08-15-g';" in app:
    app = app.replace("var BUILD_ID = '2026-08-15-g';", "var BUILD_ID = '2026-08-15-h';", 1)
else:
    raise SystemExit('expected BUILD_ID 2026-08-15-g not found')

# Add GPS aliases for the two expense-derived stops. Pure is mapped to Naplavka farmers-market area,
# not to an invented standalone Pure shop. Prazska trznice is the Holešovice market hall complex.
coord_block = """
  // PR #130: expense-derived day stops — real locations only
  'Pure גלידה — Náplavka / שוק האיכרים על הנהר': [50.0692000, 14.4142000],
  'Náplavka / שוק האיכרים על הנהר': [50.0692000, 14.4142000],
  'שוק האיכרים על הנהר — Náplavka': [50.0692000, 14.4142000],
  'Pražská tržnice — השוק הגדול (הולשוביצה)': [50.0996700, 14.4459800],
  'Pražská tržnice': [50.0996700, 14.4459800],
  'השוק הגדול — הולשוביצה': [50.0996700, 14.4459800],
"""
anchor = "  // PR #128: selection bank coordinate sweep — safe real-place aliases"
idx = app.find(anchor)
if idx < 0:
    anchor = "var BUILD_ID"
    idx = app.find(anchor)
if idx < 0:
    raise SystemExit('coordinate insertion anchor not found')
# Insert coordinate aliases near existing PR coordinate aliases; if anchor fallback is BUILD_ID this fails safely.
if anchor == "var BUILD_ID":
    raise SystemExit('safe PLACE_COORDS anchor not found')
insert_at = app.find('\n', idx)
app = app[:insert_at] + coord_block.rstrip('\n') + app[insert_at:]

# Locate getDaysState function and insert a wrapper right after it.
m = re.search(r'function\s+getDaysState\s*\([^)]*\)\s*\{', app)
if not m:
    raise SystemExit('getDaysState function not found')
start = app.find('{', m.start())
depth = 0
quote = None
esc = False
end = None
for i in range(start, len(app)):
    ch = app[i]
    if quote:
        if esc:
            esc = False
        elif ch == '\\':
            esc = True
        elif ch == quote:
            quote = None
        continue
    if ch in ('"', "'", '`'):
        quote = ch
        continue
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
        if depth == 0:
            end = i + 1
            break
if end is None:
    raise SystemExit('getDaysState function end not found')

helper = r'''

// PR #130: expense-derived stops shown above the rest of the day stops.
// These are UI/day-plan stops only. They do not mark places as visited and do not touch expenses.
var EXPENSE_DAY_STOPS_PR130 = [
  {
    emoji: '🍦',
    name: 'Pure גלידה — Náplavka / שוק האיכרים על הנהר',
    time: '12:44',
    desc: 'נוסף לפי הוצאה: 200 CZK · ליד שוק האיכרים על הנהר. מיקום קנוני: Náplavka / Rašínovo nábřeží.',
    mapUrl: 'https://www.google.com/maps/search/Naplavka+farmers+market+Prague'
  },
  {
    emoji: '🏰🛍️',
    name: 'Pražská tržnice — השוק הגדול (הולשוביצה)',
    time: '12:43',
    desc: 'נוסף לפי הוצאה: 117 CZK · השוק הגדול בהולשוביצה.',
    mapUrl: 'https://www.google.com/maps/search/Prazska+trznice+Prague'
  }
];

function _isPr130TargetExpenseDay(day, idx) {
  var s = [day && day.date, day && day.title, day && day.subtitle, day && day.label, day && day.day].filter(Boolean).join(' ');
  if (/15[./-]0?8/.test(s) || /0?8[./-]15/.test(s)) return true;
  if (day && Number(day.dayNum) === 8) return true;
  if (/יום\s*8/.test(s)) return true;
  // Fallback: 15.08.2026 is trip day 8 in this itinerary.
  return idx === 7;
}

function _ensureExpenseStopsPr130(days) {
  try {
    if (!Array.isArray(days) || !days.length) return days;
    var targetIdx = -1;
    for (var i = 0; i < days.length; i++) {
      if (_isPr130TargetExpenseDay(days[i], i)) { targetIdx = i; break; }
    }
    if (targetIdx < 0) return days;
    var day = days[targetIdx];
    if (!day) return days;
    if (!Array.isArray(day.stops)) day.stops = [];
    var aliases = {
      'Pure גלידה': true,
      'Pure גלידה — Náplavka / שוק האיכרים על הנהר': true,
      'Pražská tržnice': true,
      'Pražská tržnice — השוק הגדול (הולשוביצה)': true,
      'השוק הגדול — הולשוביצה': true
    };
    var existing = {};
    day.stops.forEach(function(s) {
      if (s && s.name) existing[s.name] = true;
    });
    var toAdd = [];
    EXPENSE_DAY_STOPS_PR130.forEach(function(stop) {
      var exists = !!existing[stop.name];
      Object.keys(aliases).forEach(function(a) {
        if (!exists && existing[a] && (a === stop.name || stop.name.indexOf(a) >= 0 || a.indexOf(stop.name) >= 0)) exists = true;
      });
      if (!exists) toAdd.push(Object.assign({}, stop));
    });
    if (toAdd.length) day.stops = toAdd.concat(day.stops);
  } catch (e) {}
  return days;
}

var _getDaysStateBeforePr130ExpenseStops = getDaysState;
getDaysState = function() {
  return _ensureExpenseStopsPr130(_getDaysStateBeforePr130ExpenseStops());
};
'''
app = app[:end] + helper + app[end:]

# Write docs.
Path('docs').mkdir(exist_ok=True)
Path('docs/EXPENSE_STOPS_PR130.md').write_text("""# Expense-derived stops — PR #130

Date: 2026-08-15
Branch: `feature/add-expense-stops`
Backup: `backup/pre-add-expense-stops-2026-08-15`

## User request

The user added two expenses and asked to add them to the itinerary/day stops, above the other stops.

Screenshot identified:

1. `Pure גלידה` — 200 CZK — 15.08.2026 12:44
2. `Pražská tržnice — השוק הגדול (הולשוביצה)` — 117 CZK — 15.08.2026 12:43

The user clarified that `Pure גלידה` was near the farmers market on the river, so it must be mapped to `Náplavka / שוק האיכרים על הנהר`, not to Výstaviště or an invented Pure shop.

## Implementation

Adds both stops above the other stops on trip day 8 / 15.08.2026.

The implementation wraps `getDaysState()` with a small guard that ensures these two stops appear even on devices that already have a saved/synced days state. It does not clear or overwrite the user's existing day plan.

## GPS

Added static coordinate aliases:

- `Pure גלידה — Náplavka / שוק האיכרים על הנהר` → Náplavka farmers market area
- `Pražská tržnice — השוק הגדול (הולשוביצה)` → Pražská tržnice / Holešovice market complex

## Safety boundaries

No changes to:

- expenses storage
- visited state / `prague_visited_v1`
- Firestore paths
- Firestore rules
- backend
- GAS
- login/auth

The stops do not mark places as visited. The user can mark them as visited manually from the app.

## Version

`BUILD_ID` advances to `2026-08-15-h`.
""", encoding='utf-8')

Path('docs/CLAUDE_EXPENSE_STOPS_PR130.md').write_text("""# Claude handoff — PR #130 expense-derived stops

Date: 2026-08-15
Repository: `arielshish/Prague-2026`
Branch: `feature/add-expense-stops`
Backup: `backup/pre-add-expense-stops-2026-08-15`

## Context

After PR #129 deployed the trip-summary selection bank, the user added two expenses and asked to add them to `היינו` or as day stops.

Because visited state is live app data and should not be mutated from code, this PR adds the two items as day stops only. The user can mark them as visited in the app.

## User clarification

`Pure גלידה` was near the farmers market on the river. Do not map it to Výstaviště. Use `Náplavka / שוק האיכרים על הנהר` as the canonical location.

## Added stops

Trip day 8 / 15.08.2026, above existing stops:

- `🍦 Pure גלידה — Náplavka / שוק האיכרים על הנהר` at `12:44`
- `🏰🛍️ Pražská tržnice — השוק הגדול (הולשוביצה)` at `12:43`

## Technical note

The app may already have a saved/synced days state from `prague_days_v1` / Firestore. Editing only static `DAYS` may not appear on those devices. Therefore PR #130 wraps `getDaysState()` with `_ensureExpenseStopsPr130()` so the two stops are shown above the other stops without clearing or replacing the user's existing plan.

## Safety boundaries

Do not mark these as visited in code.
Do not edit expenses data.
Do not touch backend/GAS.
Do not change Firestore paths or rules.
""", encoding='utf-8')

APP.write_text(app, encoding='utf-8')
new_app = APP.read_text(encoding='utf-8')

# Safety checks.
required = [
    "var BUILD_ID = '2026-08-15-h';",
    'EXPENSE_DAY_STOPS_PR130',
    'Pure גלידה — Náplavka / שוק האיכרים על הנהר',
    'Pražská tržnice — השוק הגדול (הולשוביצה)',
    '_getDaysStateBeforePr130ExpenseStops',
]
for token in required:
    if token not in new_app:
        raise SystemExit('required token missing: ' + token)
for key in ['prague_visited_v1', 'prague_exp_v10', 'prague_exp_ts', 'appdata/main', 'appdata/expenses', 'appdata/trip_summary']:
    if new_app.count(key) != old_app.count(key):
        raise SystemExit('protected key/path count changed: ' + key)
if new_app.count('localStorage.removeItem') != old_app.count('localStorage.removeItem'):
    raise SystemExit('localStorage.removeItem count changed')
if new_app.count('localStorage.clear') != old_app.count('localStorage.clear'):
    raise SystemExit('localStorage.clear count changed')

scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', new_app, flags=re.S|re.I)
Path('/tmp/app-inline.js').write_text('\n;\n'.join(scripts), encoding='utf-8')
print('PR130 expense stops applied')
