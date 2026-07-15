# Prague 2026 — Family Trip App Skill

אפליקציית טיול משפחתית לפראג 2026 — משפחת שיש. Single-page app בעברית.
טיסות: Smart Wings QS1287/QS1286, 8–15 אוגוסט 2026. מלון: Comfort Hotel Prague City East.

## שני מצבי הפעלה

1. **GAS** — `gas_project/`, מוגש דרך script.google.com. `google.script.run` נטיבי. **אין** login screen.
2. **GitHub Pages** — `app.html`, ב-`arielshish.github.io/Prague-2026/app.html`. login screen (סיסמה `Shish2026`), שומר ל-Firestore ישירות דרך Firebase SDK.

## 3 הקישורים של הפרויקט

- GitHub Pages: `https://arielshish.github.io/Prague-2026/app.html`
- GAS (deployment נוכחי): `https://script.google.com/macros/s/AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6/exec`
- Deployment ID: `AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6`

> clasp scriptId (ב-`gas_project/.clasp.json`): `1QwRZZlll_ZUcFjZZ5UJvnaoX0mdU2dD1AYMf9lwCSn_hqHd4nxscVud0`.
> בעבר היה גם `.clasp.json` בשורש הריפו שהצביע על scriptId ישן (שפגע במגבלת 200 הגרסאות) — הוסר. תמיד להריץ clasp מתוך `gas_project/` בלבד.

## קבצים עיקריים

| קובץ | תפקיד |
|------|--------|
| `gas_project/Code.gs` | Backend של GAS — כל פונקציות השרת |
| `gas_project/index.html` | HTML שמוגש ע"י GAS — זהה ל-`index.html` בשורש |
| `gas_project/appsscript.json` | הגדרות GAS (timezone, webapp, scopes) |
| `index.html` | עותק של `gas_project/index.html` (לsync) |
| `app.html` | גרסת GitHub Pages — Firebase SDK, login screen, JSONP |
| `sync_gas.py` | מסנכרן app.html → index.html + gas_project/index.html |
| `translator.html` | מתרגם קולי עצמאי (GitHub Pages), עברית↔צ'כית |

## סנכרון index.html ← app.html

**אף פעם לא עורכים index.html ישירות.** עורכים `app.html`, מריצים `python3 sync_gas.py`,
ומוודאים `diff index.html gas_project/index.html` ריק.
הסקריפט מסיר: Firebase SDK tags, Firebase init, loginScreen div, GAS_URL+JSONP.
מחליף: `<div id="app" style="display:none">` → `<div id="app">`, JSONP → `google.script.run`.

## Google Spreadsheet

- ID: `10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE`
- Sheets: `הוצאות`, `הגדרות`, `צ'קליסט`, `מסלול`

## Firebase / Firestore (רק ל-app.html)

- Project: `prague2026`
- Document ראשי: `appdata/main`
- שדות: `remindersDone` (JSON string), `packingList`, `budget`, `daysCustom`

## Deploy

```bash
cd /home/user/Prague-2026/gas_project
clasp push
clasp deploy --deploymentId AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6 --description "תיאור"
```

> שים לב: clasp לא בהכרח זמין/מחובר בכל סביבת ריצה (למשל בסביבות remote מסוימות אין clasp מותקן וגם הרשת חוסמת script.google.com) — לבדוק לפני שמניחים שה-deploy בוצע בפועל.

## isGas() — חובה סביב כל google.script.run

```javascript
function isGas() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}
```
כל קריאה ל-`google.script.run` חייבת להיות בתוך `if (isGas()) { ... } else { /* fallback */ }`.

## פונקציות תזכורות (Code.gs ↔ app.html)

- `saveRemindersDone(jsonStr)` → PATCH Firestore `appdata/main.remindersDone`
- `loadRemindersDone()` → GET Firestore → `{ ok, remindersDone }`
- `sendTestReminder` → שולח מייל תמיד (ללא תנאי) לכל FAMILY_EMAILS
- `sendDailyReminders()` → שולח רק אם urgent או dayOfYear%3===0 (אוטומטי)

`REMINDERS_DEF` ב-Code.gs חייב להיות מסונכרן עם `REMINDERS` ב-app.html.

## אימיילים מורשים (FAMILY_EMAILS)

- arielshish@gmail.com, maridubi3@gmail.com, adiyasminshish@gmail.com, ariel.mariana.shish@gmail.com

## בעיות ידועות

| בעיה | פתרון |
|------|--------|
| iOS GAS "מלבן קטן" (iframe warning banner) | לא ניתן לתיקון מקוד — הפתרון הוא app.html ב-GitHub Pages |
| CORS מ-GitHub Pages ל-GAS | JSONP (dynamic `<script>` tag) |
| `Session.getActiveUser().getEmail()` | תמיד `""` תחת `executeAs: USER_DEPLOYING` |
| מגבלת 200 גרסאות GAS | פרויקט חדש (`1QwRZZlll...`) הוקם אחרי שהישן (`1QLerMZ...`) נתקע — לא לחזור לישן |

## עדכון אחרון בתחזוקת הריפו

הקובץ `.claude/commands/_archive/prague-app-old-v158.md` הוא ארכיון של גרסה קודמת (מלפני המעבר ל-`gas_project/`+Firebase) — אינו רלוונטי יותר.
