---
name: prague-2026
description: ידע מעמיק על פרויקט Prague 2026 — app.html, מבנה הנתונים, כל הפונקציות, באגים ידועים, וכללי עבודה. השתמש בסקיל זה לפני כל עריכה ב-app.html.
---

# Prague 2026 — מדריך מלא לעריכה

> עדכון אחרון: 2026-07-18 (גרסה 10)

## קובץ עיקרי
`/home/user/Prague-2026/app.html` — קובץ HTML יחיד, RTL עברי, ~7100 שורות.
GitHub Pages: `arielshish.github.io/Prague-2026/app.html`
Branch: `claude/unknown-session-xpa0pr` → PR → merge ל-`main`

---

## מבנה נתונים

### ALL_PLACES[] (~שורה 2675) — מקור יחיד לכל המקומות

```javascript
// 105 פריטים עם שדה type:
type:'shop'       → {icon, name, stars, hours, metro, duration, brands, tip, mapUrl}
type:'restaurant' → {icon, name, level, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl}
type:'dessert'    → {icon, name, level, sub, desc, price, rating, tag, tagClr, where, mapUrl}
type:'community'  → {icon, name, cat, fb, google, desc, booking, duration, tips, who, how, mapUrl}
type:'photo'      → {icon, name, fee, sub, desc, best, crowds, fee_txt, rating, tip, mapUrl}
```

**⚠️ שדה `tips` ב-community**: תמיד **string** (לא array) — לעולם לא לקרוא `p.tips.forEach()` ישירות. תמיד `Array.isArray` guard.

**Computed views** (~שורה 3133, read-only):
```javascript
var COMMUNITY   = ALL_PLACES.filter(p => p.type==='community');  // 47 פריטים
var RESTAURANTS = ALL_PLACES.filter(p => p.type==='restaurant'); // 25 פריטים
var SHOPS       = ALL_PLACES.filter(p => p.type==='shop');       // 8 פריטים
var DESSERTS    = ALL_PLACES.filter(p => p.type==='dessert');    // 13 פריטים
var PHOTO_SPOTS = ALL_PLACES.filter(p => p.type==='photo');      // 12 פריטים
```

**⚠️ COMMUNITY כולל categories שונות** — לא רק אטרקציות:
- `cat:'🎟️ אטרקציות'` — 24 אטרקציות
- `cat:'🍽️ מסעדות'` — ביקורות קהילה על מסעדות
- `cat:'🍦 קינוחים'` — קינוחים קהילה
- `cat:'🛍️ קניות'` — קניות קהילה
כשמסננים לפי אטרקציות, חובה `(p.cat||'').indexOf('אטרקציות') !== -1` — לא `p.type === 'community'`!

**נפרדים** (לא ב-ALL_PLACES):
```javascript
REMINDERS[]  // (~שורה 1750) — משימות לפני הטיול
DAYS[]       // לוז בסיס, מוחלף ע"י DAYS_STATE מ-Firestore
```

**DAYS_STATE stops** — כל stop:
```javascript
{ emoji, name, time, desc, details, tips, booking, mapUrl, google, duration, who }
```

---

## מיפוי פונקציות עם שורות מדויקות

| פונקציה | שורה | תיאור |
|---------|------|--------|
| `esc(s)` | 3189 | HTML escape — מטפל ב-`&<>"'`. **חובה לכל ערך שמוכנס ל-innerHTML** |
| `timeOfDay(timeStr)` | 3243 | מחזיר `{label,emoji}` לפי שעה, או `null` אם לא HH:MM |
| `getDaysState()` | 3234 | מצב ימים נוכחי (Firestore/local) |
| `refreshScheduleBadges()` | 3272 | מרנדר מחדש טאב פעיל — נקראת אחרי כל שמירה |
| `openTab(id)` | 3211 | מחליף טאב + קורא ל-renderNearbyList אם location |
| `saveDaysState()` | 3254 | שומר DAYS_STATE + קורא refreshScheduleBadges |
| `initDaySwipe()` | 3336 | IIFE — Pointer Events API, סווייפ ימים, threshold 40px |
| `renderDays()` | 3372 | לוז יומי — stop cards עם DS tokens, numbered markers |
| `findItemInDays(name)` | 3551 | מחזיר `{dayNum, dayTitle, time}` או `null` |
| `showStopDetail(dayIdx,stopIdx)` | 3494 | popup פרטי תחנה + chips google/who |
| `renderReminders()` | 2154 | תזכורות עם schedInfo ירוק |
| `buildBankCards(items,...)` | 3674 | כרטיסי בנק עם תיאור/ציון/משך/תג כבר בלוז |
| `renderCommunity()` | 4062 | בנק אטרקציות לפי קטגוריה |
| `openAddCommunityStop(recIdx)` | 4113 | modal הוספת תחנה מ-community |
| `saveAddCommunityStop(recIdx)` | 4152 | שומר community → DAYS (כולל google/duration/who) |
| `renderShopping()` | 4193 | SHOPS עם תגי כבר בלוז |
| `renderRestaurants()` | 4223 | RESTAURANTS + DESSERTS + PHOTO_SPOTS |
| `renderDesserts()` | 4294 | DESSERTS |
| `renderPhotoSpots()` | 4339 | PHOTO_SPOTS |
| `haversine(lat1,lng1,lat2,lng2)` | 4567 | מרחק בק"מ |
| `initLeafletMap()` | 4583 | Leaflet retry loop עד 50×200ms |
| `addMapMarkers()` | 4623 | pins לכל ALL_PLACES + צבע לפי type + כתום אם בלוז |
| `showMapNavDialog(p, coords)` | 4644 | bottom sheet ניווט + מידע לפי type |
| `locateMe()` | 4770 | Geolocation → pin סגול "אתם כאן" |
| `filterNearby(cat)` | 4803 | מעדכן `_nearbyFilter` + מרנדר רשימה |
| `renderNearbyList()` | 4814 | רשימה ממוינת Haversine + פילטר |
| `_openNearbyDialog(apIdx,lat,lng)` | 4901 | wrapper עם try-catch → showMapNavDialog |
| `restaurantImgHtml(r)` | 4914 | header תמונה 150px עם gradient+Wikimedia fallback |
| `renderLocationTab()` | 4578 | מאתחל מפה + renderNearbyList |

---

## תשתית מפה ומיקום (~שורה 4396+)

### PLACE_COORDS (~שורה 4396)
```javascript
var PLACE_COORDS = {
  'שם מקום': [lat, lng],
  // ... כל 105 המקומות ב-ALL_PLACES
}
```
- **חובה לכל פריט שרוצים שיופיע במפה/רשימה** — אם `!PLACE_COORDS[p.name]` הפריט מדולג
- ⚠️ השם חייב להיות **זהה בדיוק** לשדה `name` ב-ALL_PLACES (Unicode, -, —, רווחים)

### PLACE_IMGS (~שורה 4494)
```javascript
var PLACE_IMGS = {
  'שם מקום': 'https://upload.wikimedia.org/...',
  // 35+ תמונות Wikimedia Commons
}
```
- `onerror="this.remove()"` — תמונה כושלת נעלמת, gradient+emoji נשאר
- **לא להוסיף URLs שאינם Wikimedia Commons** — CDN אחרים נחסמים

### TYPE_GRAD (~שורה 4558)
```javascript
var TYPE_GRAD = {
  restaurant: ['#2563EB','#1D4ED8'],
  community:  ['#16a34a','#15803d'],
  photo:      ['#9333ea','#7e22ce'],
  dessert:    ['#e879f9','#c026d3'],
  shop:       ['#f59e0b','#d97706'],
  schedule:   ['#F4634A','#e55039'],
}
```

---

## טאב מיקום — פירוט מלא

### פילטרים
```
'all'        → כל המקומות שיש להם PLACE_COORDS
'schedule'   → רק מה שב-DAYS_STATE
'restaurant' → type === 'restaurant'
'community'  → type === 'community' && cat.indexOf('אטרקציות') !== -1  ← חשוב!
'photo'      → type === 'photo'
```
⚠️ פילטר 'community' = **רק אטרקציות** — לא כל community. השתמש ב-indexOf לא ב-type בלבד.

### renderNearbyList() — זרימה
1. בונה `items[]` מכל ALL_PLACES שיש להם PLACE_COORDS
2. מוסיף: `{p, coords, dist, inDays, effType}`
3. מסנן לפי `_nearbyFilter`
4. ממיין: קרוב → רחוק (Haversine), ללא GPS → אלפביתי
5. מרנדר כרטיסים עם `onclick="_openNearbyDialog(apIdx, c0, c1)"`
   - `apIdx = ALL_PLACES.indexOf(p)` — אינדקס מספרי, בטוח לחלוטין בonclick

### showMapNavDialog(p, coords) — מנגנון בטוח
```javascript
// ✅ נכון — window._mapNavPlace מונע בעיות escaping
window._mapNavPlace = p;
// ...onclick uses: var mp = window._mapNavPlace || {};

// ✅ נכון — Array.isArray guard לפני forEach
if (p.tips && p.tips.length) {
  if (Array.isArray(p.tips)) {
    p.tips.forEach(t => ...);
  } else {
    infoHtml += '💡 ' + esc(p.tips);
  }
}

// ❌ אסור — community tips הם strings, forEach זורק TypeError:
p.tips.forEach(...)  // ← גורם לקריסה שקטה, dialog לא נפתח
```

---

## Design System

### CSS Tokens (~שורה 19)
```css
:root {
  --c-primary: #F4634A;
  --c-card: #fff;
  --r-card: 22px;
  --s-card: 0 2px 16px rgba(0,0,0,0.08);
  --t-fast: 0.15s; --t-base: 0.25s; --t-slow: 0.4s;
  --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
  --c-surface: #F7F3EE;
}
```

### DS Classes
```
.ds-badge-{red,amber,green,blue,gray}
.ds-chip
.ds-fab
.ds-stat
.ds-section-hdr
.skeleton
.btn-primary  → gradient כתום + shadow
.btn-ghost    → transparent + border
```

### Light Theme v7
- body/html: `#F7F3EE` / `#FAF7F4`
- כרטיסים/מודאלים/nav: `#ffffff`
- header: כהה בכוונה (Prague skyline)
- גבולות: `rgba(0,0,0,0.10)` (לבנים לא נראים על רקע לבן!)

---

## Firebase / Firestore

| נתיב | תוכן |
|------|------|
| `appdata/main` | `days`, `total_budget`, `ts` |
| `appdata/pack` | `data` (JSON string של pack state) |
| `appdata/reminders` | `data` (JSON string) |
| `appdata/budget` | `total` (לתאימות אחורה) |

- `ensureFirebaseAuth()` → anonymous auth → מחזיר Promise
- `getFirestoreDb()` → Firestore instance
- `onSnapshot` על `appdata/main` → sync real-time לימים + תקציב

---

## באגים ידועים שתוקנו (אל תחזיר אותם!)

| באג | תיקון |
|-----|-------|
| `p.tips.forEach` על community item → TypeError, dialog לא נפתח | `Array.isArray` guard |
| `p.name`/`p.desc` עם `"` בתוך onclick attribute → שבירת HTML | `window._mapNavPlace` בmapNavDialog |
| פילטר אטרקציות מציג מסעדות/קינוחים community | `indexOf('אטרקציות')` על `cat` |
| `renderNearbyList` — שגיאה ב-item אחד שוברת כל הרשימה | `try-catch` per item |

---

## כללי עבודה קריטיים

### לפני כל שינוי — ללא יוצא מן הכלל:
```bash
git tag backup-<תיאור>-$(date +%Y%m%d-%H%M)
git push origin --tags
```

### סדר קבוע:
1. `git tag` לפני הנגיעה הראשונה
2. בצע שינוי
3. `git commit` + `git push`
4. עדכן CLAUDE.md + עדכן skill זה

### branch וdeploy:
- פיתוח תמיד על: `claude/unknown-session-xpa0pr`
- PR → merge ל-`main` → GitHub Actions פורס ל-GitHub Pages (~1-2 דקות)
- **לעולם לא לדחוף ישירות ל-main**

### ציוני Google:
- לאמת רק מ: `top-rated.online` או TripAdvisor
- **לא להמציא ציונים**

### HTML safety:
- כל ערך ב-innerHTML → `esc(value)` בלי יוצא מן הכלל
- onclick עם data → `window._mapNavPlace` pattern, לא inline strings
- `"` בשדה JS string ('בסופ"ש', 'מ"ר') — תקין ב-JS, אבל מסוכן ב-HTML attribute

---

## פיצ'רים קיימים (גרסה 10 — 2026-07-18)

### תגי "כבר בלוז" — כיסוי מלא
- כל טאב (community, restaurants, shopping, reminders, photo, desserts) — תג ירוק + כפתור "✏️ עדכן"
- טאב מיקום — תג ✅ ברשימת הקרובים + ב-showMapNavDialog
- מבוסס על `findItemInDays(name)` — live מ-Firestore

### Swipe ימינה/שמאלה
- `initDaySwipe()` IIFE — Pointer Events API (חסין מ-iOS Safari draggable)
- listeners על `document`, מסנן `section#days`, מוציא `#dayButtons`
- threshold: `|dx| >= 40` ו-`|dx| > |dy| * 1.2`
- `pointercancel` מבצע סווייפ

### חצי ניווט ‹ › בין ימים
- מתעמם opacity ביום ראשון/אחרון
- משלים את הsswipe (לא מחליף)

### Fallback לנתוני Firestore ישנים
```javascript
var _fb = COMMUNITY.find(c=>c.name===s.name) || RESTAURANTS.find(r=>r.name===s.name) || {};
```
- `renderDays()` + `showStopDetail()` — fallback ל-google/duration/who אם stop ישן

### תיקון תקציב
- `saveTotalBudget()` כותב ל-`appdata/main.total_budget` (+ `appdata/budget.total` legacy)
- `saveBudgetFromModal()` קורא תמיד ל-`saveTotalBudget()` גם בweb
- realtime listener מקשיב ל-`total_budget`

### PLACE_IMGS — 35+ תמונות
גשר קארל, לטנה, ויישהראד, מנזר סטרהוב, מגדל פטז'ין, גן ולנשטיין, חומת לנון, גן חיות, Aquapalace, Westfield Chodov, Café Savoy, U Fleků, ועוד.
