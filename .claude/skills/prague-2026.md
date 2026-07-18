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
// אטרקציות — COMMUNITY[]
{ cat, icon, name, fb, google, desc, booking, duration, tips, who, how, mapUrl }

// מסעדות — RESTAURANTS[]
{ level, icon, name, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl }

// לוז — DAYS[]  (stops עם שדות מלאים)
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
| `saveAddCommunityStop()` | ~3712 | שומר COMMUNITY → DAYS (כולל google/duration/who) |
| `openAddCommunityStop(idx)` | ~3693 | modal להוספת תחנה |

## פיצ'רים קיימים (עדכון 2026-07-18 — גרסה 2)

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
- **מודל הוסף תחנה** (`buildBankCards()`): כרטיסים מורחבים עם שם, תיאור (80 תווים), ⭐ ציון, משך, תג הזמנה, ותג "כבר בלוז"

### Fallback לנתוני Firestore ישנים
- תחנות שנשמרו לפני הוספת שדות google/duration/who — מקבלות fallback מ-COMMUNITY/RESTAURANTS בזמן render
- פועל ב: `renderDays()`, `showStopDetail()`
- קוד: `var _fb = COMMUNITY.find(c=>c.name===s.name) || RESTAURANTS.find(r=>r.name===s.name) || {};`

### Swipe ימינה/שמאלה בין ימים
- `initDaySwipe()` IIFE מוזרק בתוך `renderDays()` אחרי בניית ה-HTML
- מאזין על `section#days` (לא `#dayCard`) בגלל `draggable="true"` שמיירט touches ב-iOS Safari
- `touchcancel` handler לאיפוס `_active`
- threshold: `|dx| >= 50` ו-`|dx| > |dy|`

## כללי עבודה קריטיים

1. **לפני שינוי גדול** — צור git tag:
   ```bash
   git tag backup-<תיאור>-$(date +%Y%m%d-%H%M)
   git push origin --tags
   ```

2. **branch קבוע**: `claude/unknown-session-xpa0pr` — לעולם לא לדחוף ישירות ל-`main`

3. **ציוני Google** — לאמת רק מ:
   - `top-rated.online` (search snippet, כי WebFetch מחזיר 403)
   - TripAdvisor search results
   - **לא להמציא ציונים**

4. **אחרי כל פיצ'ר** — עדכן:
   - סעיף "פיצ'רים קיימים" בסקיל זה
   - סעיף "מפת הפיצ'רים" ב-CLAUDE.md

5. **merge**: PR → review → merge ל-`main` → GitHub Pages מפרסם אוטומטית
