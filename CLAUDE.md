# Prague 2026 — משפחת שיש

## מה הפרויקט
אפליקציית טיול משפחתית לפראג 2026. Single-page app (SPA) בעברית עם:
- מעקב הוצאות (CZK / ₪)
- תקציב לפי קטגוריות
- מסלול יומי
- צ'ק-ליסט אריזה
- מידע טיסות, מסעדות, קניות, מדריכים
- תזכורות לפני הטיול עם פופאפ מפורט
- המלצות קהילה עם פופאפ מפורט לכל אטרקציה

## ארכיטקטורה

### שני מצבי הפעלה:
1. **GAS (script.google.com)** — הגרסה הראשית. מוגש דרך Google Apps Script. `google.script.run` עובד natively. **אין** login screen.
2. **GitHub Pages (arielshish.github.io/Prague-2026/app.html)** — גרסה לתצוגה מלאה ב-iOS. יש login screen עם סיסמה `Shish2026`. שומר ל-Firestore ישירות דרך Firebase SDK.

### קבצים עיקריים:
| קובץ | תפקיד |
|------|--------|
| `gas_project/index.html` | HTML שמוגש על ידי GAS — **זהה ל-index.html בשורש** |
| `gas_project/Code.gs` | Backend של GAS — כל פונקציות השרת |
| `gas_project/appsscript.json` | הגדרות GAS (timezone, webapp, services) |
| `index.html` | עותק של gas_project/index.html (לsync) |
| `app.html` | גרסת GitHub Pages — כולל Firebase SDK, login screen, JSONP לשליחת מייל |

### סנכרון index.html ← app.html:
**אף פעם לא עורכים index.html ישירות.** עורכים app.html ואז מריצים:
```bash
python3 << 'PYEOF'
# (ראה סקריפט sync_gas.py בתיקיית הפרויקט)
PYEOF
```
הסקריפט מסיר: Firebase SDK tags, Firebase init block, loginScreen div, GAS_URL + JSONP triggerReminderEmail.
מחליף: `<div id="app" style="display:none">` → `<div id="app">`, JSONP → google.script.run.

### Google Spreadsheet:
- ID: `10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE`
- Sheets: `הוצאות`, `הגדרות`, `צ'קליסט`, `מסלול`

### Firebase / Firestore:
- Project: `prague2026`
- apiKey: `AIzaSyAF9QNVV5LZNNRlxS5MNT37_FhF6kh2nBY`
- Document ראשי: `appdata/main`
- שדות: `remindersDone` (JSON string), `packingList`, `budget`, `daysCustom`

### Deployment:
- GAS URL: `https://script.google.com/macros/s/AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6/exec`
- Deployment ID: `AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6`
- clasp scriptId: `1QwRZZlll_ZUcFjZZ5UJvnaoX0mdU2dD1AYMf9lwCSn_hqHd4nxscVud0`
- גרסה פעילה: @7 (יולי 2026)
- **הערה:** פרויקט GAS חדש — הפרויקט הישן (1QLerMZ...) פגע במגבלת 200 גרסאות

## Deploy — תמיד ככה:
```bash
cd /home/user/Prague-2026/gas_project
clasp push
clasp deploy --deploymentId AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6 --description "תיאור"
```

## כללים חשובים

### gas_project/index.html חייב להיות נקי:
- **אסור**: Firebase SDK tags, Firebase init block, loginScreen div, GAS_URL, JSONP code
- חייב להיות זהה ל-`index.html` בשורש הפרויקט
- לבדוק: `diff index.html gas_project/index.html` — חייב להחזיר ריק

### app.html מכיל (ש-index.html לא מכיל):
```html
<!-- Firebase SDK (compat mode) -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<script>
// Firebase init for GitHub Pages (non-GAS) persistence
var _fbApp = null; var _fbDb = null;
function getFirestoreDb() { ... firebase.initializeApp({apiKey:..., projectId:'prague2026'}) ... }
// Firebase Firestore polyfill — replaces GAS/JSONP backend
var APP_PASSWORD = 'Shish2026'; ...
</script>
<div id="loginScreen" ...>...</div>
<div id="app" style="display:none">
```
ו-index.html מכיל פשוט: `<div id="app">`

### triggerReminderEmail:
- **app.html**: JSONP עם `GAS_URL + '?action=sendTestReminder&callback=' + cb`
- **index.html**: `google.script.run.sendTestReminder()`

### isGas() — בדיקה בכל מקום לפני google.script.run:
```javascript
function isGas() {
  return typeof google !== 'undefined' && google.script && google.script.run;
}
```
כל קריאה ל-`google.script.run` **חייבת** להיות בתוך `if (isGas()) { ... } else { /* fallback */ }`.

### Viewport tag:
- `gas_project/Code.gs` — `doGet` חייב לכלול `.addMetaTag('viewport', 'width=device-width, initial-scale=1')`
- `index.html` שורה 5: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- שתיהן קיימות בו-זמנית — זה בסדר

### כפתורים ב-iOS:
- כפתורים חשובים צריכים `onclick="functionName()"` ישירות על האלמנט
- זה מבטיח שעובד ב-iOS Safari בתוך GAS iframe

### פונקציות תזכורות (Code.gs ↔ app.html):
- `saveRemindersDone(jsonStr)` → PATCH Firestore `appdata/main.remindersDone`
- `loadRemindersDone()` → GET Firestore `appdata/main.remindersDone` → `{ ok, remindersDone }`
- `sendTestReminder` → שולח מייל **תמיד** (ללא תנאי יום/דחיפות) לכל FAMILY_EMAILS
- `sendDailyReminders()` → שולח רק אם urgent או dayOfYear%3===0 (אוטומטי בלבד)

### REMINDERS_DEF ב-Code.gs ↔ REMINDERS ב-app.html:
שני המערכים חייבים להיות מסונכרנים. כל פריט יש לו: `id, title, emoji, deadline, priority, details, tips, duration`.

## נדרש לעשות עדיין (חד-פעמי):
- [ ] הרץ `setupDailyReminderTrigger()` בעורך GAS למיילים יומיים אוטומטיים

## בעיות ידועות וידע היסטורי

### iOS GAS "מלבן קטן":
Google מציגה GAS web apps ב-iOS בתוך iframe עם באנר אזהרה. **לא ניתן לתיקון מהקוד.** הפתרון: `app.html` ב-GitHub Pages.

### CORS:
`fetch()` מ-GitHub Pages ל-GAS נכשל. הפתרון: JSONP (dynamic `<script>` tag injection).

### executeAs: USER_DEPLOYING:
`Session.getActiveUser().getEmail()` תמיד מחזיר `""`.

### מגבלת 200 גרסאות GAS:
הפרויקט הישן (1QLerMZ...) פגע במגבלה. נוצר פרויקט חדש (1QwRZZlll...) — **לא לחזור לישן**.
אם שוב מגיעים ל-200: צור פרויקט חדש דרך Apps Script REST API, העלה content, deploy.

## אימיילים מורשים (FAMILY_EMAILS ב-Code.gs):
- arielshish@gmail.com
- maridubi3@gmail.com
- adiyasminshish@gmail.com
- ariel.mariana.shish@gmail.com

## טיסות:
- Smart Wings QS1287 (הלוך) / QS1286 (חזור)
- תאריכים: 8–15 אוגוסט 2026
- מלון: Comfort Hotel Prague City East
