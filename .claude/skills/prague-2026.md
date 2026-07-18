---
name: prague-2026
description: ידע מעמיק על פרויקט Prague 2026 — app.html, מבנה הנתונים, הפונקציות, וכללי עבודה. השתמש בסקיל זה לפני כל עריכה ב-app.html.
---

# Prague 2026 — מדריך מהיר לעריכה

## קובץ עיקרי
`/home/user/Prague-2026/app.html` — קובץ HTML יחיד, RTL עברי, ~6500 שורות.
GitHub Pages: `arielshish.github.io/Prague-2026/app.html`

## מבנה נתונים

```javascript
// ── ALL_PLACES[] — מקור יחיד (שורה ~2383) ──
// type:'shop'       → {icon, name, stars, hours, metro, duration, brands, tip, mapUrl}
// type:'restaurant' → {icon, name, level, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl}
// type:'dessert'    → {icon, name, level, sub, desc, price, rating, tag, tagClr, where, mapUrl}
// type:'community'  → {icon, name, cat, fb, google, desc, booking, duration, tips, who, how, mapUrl}
// type:'photo'      → {icon, name, fee, sub, desc, best, crowds, fee_txt, rating, tip, mapUrl}

// Computed views (שורה ~2843):
var COMMUNITY   = ALL_PLACES.filter(p => p.type==='community');  // 47 פריטים
var RESTAURANTS = ALL_PLACES.filter(p => p.type==='restaurant'); // 25 פריטים
var SHOPS       = ALL_PLACES.filter(p => p.type==='shop');       // 8 פריטים
var DESSERTS    = ALL_PLACES.filter(p => p.type==='dessert');    // 13 פריטים
var PHOTO_SPOTS = ALL_PLACES.filter(p => p.type==='photo');      // 12 פריטים

// נפרדים — לא חלק מ-ALL_PLACES:
// REMINDERS[] (שורה ~1560) — משימות לפני הטיול
// DAYS[]      (שורה ~2163) — לוז בסיס (מוחלף ע"י DAYS_STATE מ-Firestore)

// לוז — DAYS_STATE stops:
{ emoji, name, time, desc, details, tips, booking, mapUrl, google, duration, who }
```

## פונקציות מפתח

| פונקציה | שורה | תיאור |
|---------|------|--------|
| `getDaysState()` | ~2980 | מצב ימים נוכחי (Firestore/local) |
| `findItemInDays(name)` | ~3154 | מחזיר `{dayNum, dayTitle, time}` או null |
| `renderDays()` | ~3001 | מרנדר לוז יומי |
| `showStopDetail()` | ~3089 | popup פרטי תחנה |
| `renderCommunity()` | ~3649 | בנק אטרקציות |
| `renderRestaurants()` | ~3794 | מסעדות |
| `renderShopping()` | ~3847 | קניות (SHOPS) |
| `renderDesserts()` | ~3946 | קינוחים (DESSERTS) |
| `renderPhotoSpots()` | ~3991 | נקודות צילום (PHOTO_SPOTS) |
| `saveAddCommunityStop()` | ~3712 | שומר COMMUNITY → DAYS (כולל google/duration/who) |
| `openAddCommunityStop(idx)` | ~3693 | modal להוספת תחנה |

## פיצ'רים קיימים (עדכון 2026-07-18 — גרסה 5)

### ציוני Google ב-DAYS
- תחנות ב-DAYS מציגות ⭐ ציון, משך, ו"מתאים ל"
- `showStopDetail()` popup — chips של ציון + who
- `saveAddCommunityStop()` מעביר google/duration/who אוטומטית

### תג "כבר בלוז" — בכל הטאבים
- **COMMUNITY**: תג ירוק "✅ יום X · שעה" + כפתור "✏️ עדכן" כשהפריט כבר ב-DAYS
- **RESTAURANTS**: תג זהה מ-`findItemInDays()` (live מ-Firestore)
- **REMINDERS** (`renderReminders()`): schedInfo ירוק עם "✅ יום X · שעה" אם ב-DAYS
- **PHOTO SPOTS** (`renderPhotoSpots()`): כפתור ➕ מוחלף בתג ✅ יום X
- **DESSERTS** (`renderDesserts()`): אותו דפוס
- **SHOPPING** (`renderShopping()`): תג ירוק + כפתור "✏️ עדכן"; `openTab('shopping')` ו-`refreshScheduleBadges()` מכסים גם אותו
- **מודל הוסף תחנה** (`buildBankCards()`): כרטיסים מורחבים עם שם, תיאור (80 תווים), ⭐ ציון, משך, תג הזמנה, ותג "כבר בלוז"

### Fallback לנתוני Firestore ישנים
- תחנות שנשמרו לפני הוספת שדות google/duration/who — מקבלות fallback מ-COMMUNITY/RESTAURANTS בזמן render
- פועל ב: `renderDays()`, `showStopDetail()`
- קוד: `var _fb = COMMUNITY.find(c=>c.name===s.name) || RESTAURANTS.find(r=>r.name===s.name) || {};`

### ALL_PLACES — איחוד מסד נתוני מקומות (2026-07-18)
- מערך יחיד `ALL_PLACES[]` (~שורה 2383) מכיל 105 פריטים עם `type` field
- **computed views** מ-ALL_PLACES: COMMUNITY, RESTAURANTS, SHOPS, DESSERTS, PHOTO_SPOTS
- שדות SHOPS נורמלו: `e→icon`, `n→name`, `map→mapUrl`, `time→duration`
- כל render functions ממשיכות לעבוד ללא שינוי (קוראות ל-computed views)
- REMINDERS[] ו-DAYS[] נשארים נפרדים

### Swipe ימינה/שמאלה בין ימים
- `initDaySwipe()` IIFE — Pointer Events API (לא Touch Events) — חסין מ-draggable-iOS
- listeners על `document`, מסנן `section#days`, מוציא `#dayButtons`
- threshold: `|dx| >= 40` ו-`|dx| > |dy| * 1.2`
- `pointercancel` מבצע סווייפ — פותר iOS Safari draggable interference

### מסד נתונים אחיד (2026-07-18)
- **`DAYS_STATE`** = מקור יחיד לכל תזמון (קהילה, מסעדות, קניות, צילום, קינוחים)
- **`remindersSchedule`** = נפרד — משימות לפני הטיול בלבד
- הוסר `restaurantsSchedule` + `openEditRestaurantSchedule` + `TRIP_DAYS` הישן
- `saveSchedules()` → רק remindersSchedule

### חצי ניווט ימים (2026-07-18)
- ‹ ו-› משני צידי שורת `#dayButtons`
- `renderDays()` מעדכן opacity/pointerEvents — מתעמם ביום ראשון/אחרון
- משלים את ה-swipe (לא מחליף)

### תיקון סנכרון תקציב (2026-07-18)
- **בעיה שתוקנה**: `saveBudgetFromModal()` לא קרא ל-`saveTotalBudget()` בסביבת web → total לא נשמר ל-Firestore
- **בעיה שתוקנה**: `syncBudgetFromFirebase()` קרא `appdata/budget.categories` — מסלול שלא נכתב
- **בעיה שתוקנה**: realtime listener לא הקשיב ל-`total_budget`
- **פתרון**: `saveTotalBudget()` כותב גם ל-`appdata/main.total_budget`; `saveBudgetFromModal()` קורא לו תמיד; realtime listener מקשיב ל-`total_budget`

### מסד נתונים אחיד (2026-07-18)
- **`DAYS_STATE`** = מקור יחיד לכל תזמון (קהילה, מסעדות, קניות, צילום, קינוחים)
- **`remindersSchedule`** = נפרד — משימות לפני הטיול בלבד
- הוסר `restaurantsSchedule` + `openEditRestaurantSchedule` + `TRIP_DAYS` הישן
- `saveSchedules()` → רק remindersSchedule

### סינכרון תגים בזמן אמת
- `refreshScheduleBadges()` (~line 2971) — מזהה טאב פעיל ומרנדר Community/Restaurants/Reminders
- נקראת מ-`saveDaysState()` — כלומר אחרי כל הוספה, מחיקה, הזזה
- `openTab('community')` קורא `renderCommunity()` — תגים עדכניים בכל כניסה לטאב

## כללי עבודה קריטיים

1. **לפני כל שינוי — גדול או קטן — חובה git tag לפני הנגיעה הראשונה:**
   ```bash
   git tag backup-<תיאור>-$(date +%Y%m%d-%H%M)
   git push origin --tags
   ```
   אין יוצאים מן הכלל. גם תיקון שורה אחת. גם עדכון טקסט. **תמיד.**

   סדר קבוע לכל שינוי:
   - **לפני**: `git tag` + commit מצב נוכחי אם יש שינויים תלויים
   - **בצע**: השינוי עצמו
   - **אחרי**: commit + push + עדכן CLAUDE.md + עדכן skill

2. **branch קבוע**: `claude/unknown-session-xpa0pr` — לעולם לא לדחוף ישירות ל-`main`

3. **ציוני Google** — לאמת רק מ:
   - `top-rated.online` (search snippet, כי WebFetch מחזיר 403)
   - TripAdvisor search results
   - **לא להמציא ציונים**

4. **אחרי כל פיצ'ר** — עדכן:
   - סעיף "פיצ'רים קיימים" בסקיל זה
   - סעיף "מפת הפיצ'רים" ב-CLAUDE.md

5. **merge**: PR → review → merge ל-`main` → GitHub Pages מפרסם אוטומטית
