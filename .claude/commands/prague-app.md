# Prague 2026 — Family Trip App Skill

אפליקציית ווב לניהול טיול משפחתי מבוססת Google Apps Script.
פותחה עבור משפחת שיש — פראג, 8–15 אוגוסט 2026.

## זהות הפרויקט

- **Deployment URL:** `https://script.google.com/macros/s/AKfycbyR8p3GbMaOnJ5_47acO_Ejo4-rkL_r_Iw-n2PY5mNWnOTZZmhlaukzXuJyDe2QQjMC/exec`
- **Deployment ID:** `AKfycbyR8p3GbMaOnJ5_47acO_Ejo4-rkL_r_Iw-n2PY5mNWnOTZZmhlaukzXuJyDe2QQjMC`
- **Spreadsheet ID:** `10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE`
- **GitHub repo:** `arielshish/prague-2026`
- **Branch:** `claude/unknown-session-xpa0pr`
- **Current version:** @150

## Deploy — תמיד כך

```bash
git add .
git commit -m "תיאור"
git push -u origin claude/unknown-session-xpa0pr
clasp push --force
clasp deploy -i AKfycbyR8p3GbMaOnJ5_47acO_Ejo4-rkL_r_Iw-n2PY5mNWnOTZZmhlaukzXuJyDe2QQjMC
```

איפוס נתוני Sheets: פתח URL + `?reset=1`

## Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | HTML5 + Vanilla JS (SPA, ~2,600 שורות) |
| Backend | Google Apps Script (קוד.js) |
| Database | Google Sheets (6 טאבים) |
| Photo Storage | IndexedDB — "PraguePhotosDiary" |
| Fonts | Google Fonts — Rubik (RTL) |

## קבצים

- `קוד.js` — כל ה-backend (GAS functions)
- `index.html` — כל ה-frontend (SPA)
- `appsscript.json` — הגדרות OAuth + webapp

## appsscript.json — חשוב

```json
{
  "timeZone": "Asia/Jerusalem",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```

> `executeAs: USER_DEPLOYING` = אין prompt OAuth למשתמשים אחרים.

## Google Sheets — מבנה

| טאב | עמודות |
|-----|--------|
| הוצאות | תאריך, שם, CZK, ₪, הערה |
| הגדרות | מפתח, ערך, עדכון אחרון |
| Checklist | ID, Category, Item, Done |
| Days | DayIndex, Icon, Title, Description, HeroImage, DBVersion |
| PlacesBank | ID, DayIndex, Type, Title, Desc, Link, Priority, Hours, Price, Duration, Tip |
| AppData | Key, Value |

## פונקציות GAS עיקריות

```
loadExpenses() / addExpense() / updateExpense() / deleteExpense()
importExpenses(rows) / getSummary()
saveSetting(key,val) / loadSettings()
loadItinerary() / moveAttraction(id, dayIndex) / resetAndInitItineraryDB()
loadChecklist() / syncChecklist(items)
loadAppData() / saveAppData(budget, packingList)
doGet(e) — ?reset=1 לאיפוס, ?test=1 לדיאגנוסטיקה
healthCheck()
```

## טאבים ב-Frontend

`#home` · `#days` · `#shopping` · `#expenses` · `#flights`
`#restaurants` · `#pack` · `#info` · `#history` · `#photo`

## יומן תמונות — Photo Diary

**Storage:** IndexedDB — objectStore "photos"

**GPS flow:**
1. משתמש בוחר תמונה (camera/gallery)
2. `navigator.geolocation.getCurrentPosition()` נקרא (אחרי בחירה, לא לפני!)
3. Fallback: EXIF extraction
4. Reverse geocoding: Nominatim `zoom=18&addressdetails=1&Accept-Language=he,en`
5. מציג: POI → רחוב → שכונה → עיר → מדינה + קישור מפות

**5 עיצובי מסגרת (אקראי):**
- `0` CINEMATIC — גרדיאנט כהה + צללית טירה + גבול זהב כפול
- `1` POLAROID — פס לבן תחתון + טקסט שחור + אמוג'י
- `2` FILM STRIP — פסי שחור + חורי סרט + SHISH FAMILY
- `3` STAMP — חותמת זהב עגולה + ★ PRAGUE 2026 ★
- `4` MAGAZINE — גרדיאנט שמאלי + טקסט עברי גדול + סימוני פינה

המסגרת נשרפת לתוך dataUrl לפני שמירה ל-IndexedDB.

**Share:** `navigator.share({ files: [...] })` — Web Share API נייטיב

## שער המרה

```js
fetch('https://open.er-api.com/v6/latest/ILS')  // תומך ב-ILS (frankfurter.app לא תומך!)
// data.rates.CZK → RATE
// Auto-fetch 1.5s אחרי load
// Cache: localStorage['prague_rate_v10']
```

- כפתור "🔄 שער חי" — מושך שער בזמן אמת
- כפתור "💾 שמור ידני" — שומר את הערך שהוקלד ידנית

## מחשבון המרה דו-כיווני

פונקציה: `initCalc()` — נקראת ב-DOMContentLoaded

- שדה `#calcIls` — הקלד שקלים → מחשב קרונות אוטומטית
- שדה `#calcCzk` — הקלד קרונות → מחשב שקלים אוטומטית
- שני הכיוונים עובדים בזמן אמת לפי `RATE`
- `#calcHint` — מציג תרגום טקסטואלי (לדוג׳ "₪100 = 640 Kč")

## Lessons Learned — בעיות שנפתרו

| בעיה | סיבה | פתרון |
|------|------|--------|
| Drive backup נכשל | drive.file חוסם createFolder; REST API דורש Cloud Console | הוחלף ב-navigator.share() |
| Auth prompt לכל משתמש | USER_ACCESSING | שינוי ל-USER_DEPLOYING |
| Camera לא נפתחת | geolocation לפני camera חסמה iOS | geolocation רק ב-onChange אחרי בחירה |
| GPS "מקום לא ידוע" | iOS מוחק EXIF GPS | navigator.geolocation + Nominatim zoom=18 |
| שער המרה לא מתעדכן | frankfurter.app לא תומך ב-ILS (ECB rates בלבד) | הוחלף ב-open.er-api.com |

## כיצד להרחיב ליעד חדש

1. שנה `SPREADSHEET_ID` ב-`קוד.js`
2. עדכן `STOP_CATALOG` ביעד החדש
3. עדכן `initItineraryDB()` עם ימים ואטרקציות של היעד
4. עדכן ב-`index.html`: שמות, תאריכים, פרטי טיסות, מסעדות, מידע שימושי
5. Deploy חדש → `clasp deploy` (ללא `-i` ליצירת deployment חדש)

## רעיונות למוצר עתידי

- Admin panel להגדרת יעד ללא קוד
- Multi-tenant (יעדים מרובים, משתמשים שונים)
- Google Photos integration
- PWA מלא עם Service Worker
- Push notifications
- תשלום / onboarding flow
