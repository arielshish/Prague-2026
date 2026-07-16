---
name: prague-2026-app
description: Full documentation of the Prague 2026 family trip PWA — architecture, all features built, Firebase sync, GAS deployment, critical bugs fixed, and development patterns
---

# Prague 2026 Family Trip App — Full Project Documentation

This skill documents the entire Prague 2026 family trip PWA built for the Shish family. It covers architecture, every feature implemented, bugs encountered and fixed, and lessons learned.

## Project Overview

A mobile-first PWA (Progressive Web App) for managing a family trip to Prague (July 2026). Exists in **two parallel versions**:

| Version | File | URL | Sync |
|---------|------|-----|------|
| GitHub Pages (light mode) | `app.html` | `https://arielshish.github.io/Prague-2026/` | Firebase Firestore |
| Google Apps Script (dark mode) | `gas_project/index.html` | GAS `/exec` URL | Google Sheets + Firestore |

**Repo:** `https://github.com/arielshish/Prague-2026.git`
**GAS:** managed via `npx @google/clasp push -f` from `gas_project/`

---

## Architecture

### File Structure
```
פראג/
├── app.html                  # GitHub Pages version (light mode)
├── gas_project/
│   ├── index.html            # GAS version (dark mode)
│   ├── Code.gs               # GAS backend (doGet, Sheets API)
│   └── appsscript.json
├── .agents/skills/           # Antigravity skills
├── sync_bidirectional.sh     # Manual sync helper script
└── index.html                # GitHub Pages entry
```

### Two-File Sync Pattern
Both `app.html` and `gas_project/index.html` must be kept in sync. **Always edit both files.**  
Use Python batch-replace scripts:

```python
for filepath in [app_html, index_html]:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(OLD, NEW)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
```

### Firebase Sync (app.html)
- Firebase Firestore compat SDK v10.12.0
- Anonymous auth via `firebase-auth-compat.js`
- All data under a family Firestore collection
- Key functions: `dbSaveDays()`, `dbLoadDays()`, `dbAddPhoto()`, `dbGetAllPhotos()`, `dbSaveReminders()`

### GAS Backend (index.html)
- `Code.gs` uses `SpreadsheetApp` for persistent storage
- Pattern: `google.script.run.withSuccessHandler(cb).saveData(key, value)`
- Falls back to `localStorage` if GAS call fails

---

## Tabs / Features Built

### 1. 📅 ימים (Days)
- Multi-day itinerary planner
- Each day has **stops** with: emoji, name, time, time-of-day (בוקר/צהריים/ערב), notes, budget (CZK)
- **Drag & Drop** reordering (desktop)
- **🔼🔽 Up/Down buttons** for mobile reordering: `moveStopUp()` / `moveStopDown()`
- **Edit stop time** via full overlay modal
- **Day overload alert**: warns when too many stops; offers to move to another day
- Stops sorted chronologically by time-of-day

### 2. 💰 תקציב (Budget)
- Expense tracker with CZK ↔ ILS conversion
- Exchange rate stored in `localStorage` as `prague_rate_v10`
- Full CRUD per entry, synced to Firebase/Sheets

### 3. 🤝 קהילה (Community)
- Community recommendations: restaurants, desserts, attractions, shopping
- **"➕ הוסף ללו"ז" button** per card: opens full day+time selection overlay
- Adds community recommendation directly to a specific day & time slot

### 4. 📸 נקודות צילום (Photo Spots)
- Curated photography spots in Prague (Charles Bridge, Old Town Square, Kampa Island, etc.)
- Each card: icon, name, description, best time, crowd level, entrance fee, tips, map link
- **"📷 צלם" button**: `openPhotoModal(PHOTO_SPOTS[idx].name)` — opens photo diary modal
- **"➕ ללו"ז" button**: `openAddPhotoStop(idx)` — adds as a day stop

### 5. 🏛️ היסטוריה (History Spots)
- Historical/food locations with full stories
- Each card: emoji, name, year, historical story, photo tips, insider tip
- **"📷 צלם כאן" button**: opens photo modal pre-filled with location name

### 6. 📷 יומן צילום (Photo Diary)
- Camera roll via `<input type="file" accept="image/*" capture="environment">`
- **Mandatory GPS**: `navigator.geolocation` fetched on modal open
  - Reverse-geocoded via Nominatim → shows human-readable address
  - Saves `{ lat, lng, alt }` with every photo
  - **Blocks save** if no GPS — shows 🔄 retry button
- Prague watermark/frame added via Canvas API (`addPragueFrame()`)
- Grid display with date, place tag, GPS map link

### 7. ⏰ תזכורות (Reminders)
- Reminder list with day+time scheduling (same overlay modal as Days tab)
- Each reminder can be added to a specific day as a stop

### 8. 🎒 ציוד (Packing)
- Packing checklist organized by categories
- Check/uncheck items, add custom items per category

### 9. 🌐 שפה (Language)
- Hebrew ↔ Czech phrasebook & voice translator

---

## Key Shared UI Patterns

### Day + Time Selection Overlay
Used consistently across Days, Community, Photo Spots, History Spots, Reminders.

```javascript
// Overlay contains:
// 1. Day buttons: יום 1, יום 2, ...
// 2. Time-of-day buttons: 🌅 בוקר / 🌞 צהריים / 🌙 ערב
// 3. Free-text hour input: e.g. "10:30"
// 4. "שמור וסדר" → saves and re-sorts stops chronologically
```

### Helper Functions
```javascript
function qs(id) { return document.getElementById(id); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toast(msg) { /* floating message, ~2.5 sec */ }
```

---

## Critical Bugs Fixed

### Bug 1: Unclosed `<script>` tag → ALL buttons stop working
**Root cause:** `<script>` opened on line ~1556 was never closed. Browser parsed all HTML as JS text.  
**Fix:** Add `</script>` before `</body>`.  
**Prevention check:**
```python
opens = len(re.findall(r'<script[^>]*>', content, re.IGNORECASE))
closes = content.count('</script>')
assert opens == closes
```

### Bug 2: JS code appended outside `</html>` → shows as visible text
**Root cause:** `content += new_code` adds after `</html>` closing tag.  
**Fix:** Always insert before last `</script>`:
```python
last_script_close = content.rfind('</script>')
content = content[:last_script_close] + '\n' + new_code + '\n' + content[last_script_close:]
```

### Bug 3: `JSON.stringify` in onclick attribute → button silently broken
**Root cause:** `onclick="func(' + JSON.stringify(name) + ')"` produces `onclick="func("text")"` — inner double quotes close the attribute.  
**Fix — Use array index:**
```javascript
// ❌ WRONG:
'<button onclick="openFunc(' + JSON.stringify(s.name) + ')">'
// ✅ CORRECT:
'<button onclick="openFunc(MY_ARRAY[' + MY_ARRAY.indexOf(s) + '].name)">'
```
**Fix — Use data attribute:**
```javascript
// ✅ CORRECT:
'<button data-place="' + esc(s.name) + '" onclick="selectPlaceChip(this)">'
// In JS: btn.getAttribute('data-place')
```

### Bug 4: Duplicate function definitions → silent overwrite
**Symptom:** New logic has no effect; old behavior persists.  
**Prevention:** Run `deep_check.js` before every push.

---

## Validation Scripts (keep in scratch/)

### `validate_js_v2.js`
Extracts all inline `<script>` blocks and validates syntax with `new Function()`.

### `deep_check.js`
Checks: (1) duplicate functions, (2) code after `</html>`.

```bash
node validate_js_v2.js   # Must show ✅ for both files
node deep_check.js       # Must show ✅ for both files
```

---

## Deploy Commands

```bash
# Validate first:
node /path/to/validate_js_v2.js
node /path/to/deep_check.js

# Push to GAS:
cd gas_project && npx @google/clasp push -f

# Push to GitHub Pages:
git add app.html gas_project/index.html
git commit -m "description"
git push origin main
```

---

## Mandatory GPS Photo Pattern

```javascript
// 1. Fetch GPS immediately when modal opens:
function openPhotoModal(placeName) {
  fetchPhotoGps(); // auto-fetch on open
  setTimeout(() => qs('photoFileInput').click(), 200);
}

// 2. UI feedback with retry button in modal HTML:
// <div id="photoGpsDisplay">
//   <span id="photoGpsText">📍 מאתר מיקום...</span>
//   <button onclick="fetchPhotoGps()">🔄 נסה שוב</button>
// </div>

// 3. Block save if GPS missing:
function savePhotoEntry() {
  if (!window._photoPendingGps?.lat) {
    toast('📍 יש לאתר מיקום GPS לפני שמירה');
    fetchPhotoGps();
    return;
  }
  // save with GPS guaranteed
}
```

---

## Data Model

```javascript
// Days (stored as JSON in Firebase / Sheets)
DAYS = [{
  name: 'יום 1 — יום הגעה',
  stops: [{ emoji, name, time, timeOfDay, notes, budget }]
}]

// Expenses
EXPENSES = [{ id, cat, desc, czk, ils, ts }]

// Photos
PHOTOS = [{ dataUrl, place, note, ts, gps: { lat, lng, alt } }]

// Reminders
REMINDERS = [{ id, text, day, timeOfDay, time, done }]

// Packing
PACK_STATE = [{ cat, items: [{ id, text, done }] }]
```
