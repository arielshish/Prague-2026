# Prague 2026 — משפחת שיש (repo ציבורי — GitHub Pages בלבד)

זהו repo **ציבורי בכוונה** (חייב להישאר public כדי ש-GitHub Pages יעבוד בחשבון חינמי).

## מה יש כאן, ומה לא

הריפו הזה מכיל **רק** את מה שצריך להיות מוגש דרך GitHub Pages:
- `app.html` — האפליקציה (login screen + Firebase, לגלישה ב-`arielshish.github.io/Prague-2026/app.html`)
- `translator.html` — מתרגם קולי עצמאי
- `robots.txt` — חוסם אינדוקס במנועי חיפוש
- `.github/workflows/pages.yml` — בונה תיקיית `_site` זמנית עם רק שלושת הקבצים האלה ופורס אותה (**לא** את כל הריפו)

**כל השאר עבר ל-repo פרטי:** `arielshish/Prague-2026-backend` — כולל `gas_project/Code.gs` (הבאקאנד של GAS), `sync_gas.py`, `_archive/` (גרסאות ישנות), ותיעוד מלא (מיילים משפחתיים, Spreadsheet ID, Deployment ID). זה עבר כי הריפו הזה חייב להישאר public.

## מפת הפיצ'רים הקיימים ב-app.html

> עדכון אחרון: 2026-07-18 (Premium UI v6)

### מבנה נתונים מרכזי

#### ALL_PLACES[] — מקור יחיד לכל האטרקציות (2026-07-18)
```
ALL_PLACES[] — 105 פריטים עם שדה type:
  type:'shop'       → {icon, name, stars, hours, metro, duration, brands, tip, mapUrl}
  type:'restaurant' → {icon, name, level, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl}
  type:'dessert'    → {icon, name, level, sub, desc, price, rating, tag, tagClr, where, mapUrl}
  type:'community'  → {icon, name, cat, fb, google, desc, booking, duration, tips, who, how, mapUrl}
  type:'photo'      → {icon, name, fee, sub, desc, best, crowds, fee_txt, rating, tip, mapUrl}
```
**Computed views** (נגז��ות מ-ALL_PLACES, read-only):
```javascript
var COMMUNITY   = ALL_PLACES.filter(p => p.type==='community');
var RESTAURANTS = ALL_PLACES.filter(p => p.type==='restaurant');
var SHOPS       = ALL_PLACES.filter(p => p.type==='shop');
var DESSERTS    = ALL_PLACES.filter(p => p.type==='dessert');
var PHOTO_SPOTS = ALL_PLACES.filter(p => p.type==='photo');
```
**נשארים נפרדים** (לא חלק מ-ALL_PLACES):
- `REMINDERS[]` — משימות לפני הטיול לסימון ✅
- `DAYS[]` — לוז בסיס ראשוני (מחליפו `DAYS_STATE` מ-Firestore)

#### שדות תזמון
- `getDaysState()` — מח��יר את מצב הימים הנוכחי (Firestore / local)
- `findItemInDays(name)` — מחזיר `{dayNum, dayTitle, time}` אם תחנה נמצאת ביום כלשהו, אחרת `null`

### טאבים ראשיים
| טאב | פונקציית render | תיאור |
|-----|----------------|--------|
| ימים (`days`) | `renderDays()` ~3001 | ציר זמן של תחנות יומיות |
| קהילה (`community`) | `renderCommunity()` ~3649 | בנק אטרקציות לפי קטגוריה |
| מסעדות (`restaurants`) | `renderRestaurants()` ~3794 | מסעדות, קינוחים, נקודות צילום |

### פיצ'רים מיושמים

#### ציוני Google + משך + מתאים ל (2026-07-18)
- כל תחנה ב-DAYS מציגה ⭐ ציון Google, משך ביקור, ו"מתאים ל" (who)
- `showStopDetail()` popup מציג chips של ציון + who
- `saveAddCommunityStop()` מעביר אוטומטית google/duration/who מ-COMMUNITY ל-DAYS

#### תג "כבר בלוז" (2026-07-18)
- `renderCommunity()`: אם פריט כבר ב-DAYS → תג ירוק **"✅ יום X · שעה"** + כפתור משתנה ל-**"✏️ עדכן"**
- `renderRestaurants()`: תג זהה אם מסעדה קיימת ב-DAYS
- `renderReminders()`: schedInfo ירוק "✅ יום X · שעה" אם ב-DAYS
- `renderPhotoSpots()` / `renderDesserts()`: כפתור ➕ מוחלף בתג ✅
- `buildBankCards()`: כרטיסי בנק מורחבים עם תיאור, ⭐, משך, תג הזמנה, ותג "כבר בלוז"
- מבוסס על `findItemInDays()` — תמיד live מ-Firestore

#### תג "כבר בלוז" — קניות (2026-07-18)
- `renderShopping()`: תג ירוק "✅ יום X · שעה" + כפתור "✏️ עדכן" כשחנות כבר ב-DAYS
- `openTab('shopping')` + `refreshScheduleBadges()` מכסים גם shopping

#### סינכרון תגים בזמן אמת (2026-07-18)
- `saveDaysState()` קוראת ל-`refreshScheduleBadges()` — מרנדרת מחדש את הטאב הפעיל מיד עם כל שמירה
- `openTab('community')` מרנדר `renderCommunity()` — תגים תמיד עדכניים בכניסה לטאב
- כיסוי מלא: הוסף → תג מופיע מיד; מחק/הזז → תג נעלם מיד בכל טאב פעיל

#### Swipe ימינה/שמאלה בין ימים (2026-07-18)
- `initDaySwipe()` IIFE — listeners על `document` (לא `#dayCard`) לעקיפת `draggable` ב-iOS Safari
- `touchmove` מעדכן מיקום אחרון; `touchcancel` מבצע סווייפ (לא מבטל)
- threshold: `|dx| >= 40` ו-`|dx| > |dy| * 1.2`

#### Fallback לנתוני Firestore ישנים (2026-07-18)
- `renderDays()` ו-`showStopDetail()` — fallback ל-COMMUNITY/RESTAURANTS אם stop חסר google/duration/who

#### חצי ניווט ימים (2026-07-18)
- ‹ ו-› משני צידי שורת `#dayButtons` — ניווט מהיר בין ימים
- `renderDays()` מעדכן opacity/pointerEvents — מתעמם ביום ראשון/אחרון
- משלים את ה-swipe (לא מחליף)

#### תיקון סנכרון תקציב (2026-07-18)
- `saveTotalBudget()` כותב גם ל-`appdata/main.total_budget` (+ `appdata/budget.total` לתאימות)
- `saveBudgetFromModal()` קורא ל-`saveTotalBudget()` גם בסביבת web (קודם רק GAS)
- realtime listener (`appdata/main` onSnapshot) מקשיב ל-`total_budget` ומעדכן `renderBudget()` מיידית
- הוסרה קריאה מתה ל-`appdata/budget.categories` ב-`syncBudgetFromFirebase()`

#### Premium UI — Design System v6 (2026-07-18)
- **Phase 0**: CSS Design System — `:root` tokens (`--c-primary`, `--c-card`, `--r-card`, `--s-card`, `--t-fast` etc.), keyframes (`fadeSlideUp`, `scaleIn`, `skeletonPulse`), DS classes (`.ds-badge-{red,amber,green,blue,gray}`, `.ds-chip`, `.ds-fab`, `.ds-stat`, `.ds-section-hdr`, `.skeleton`, `.btn-primary` gradient, `.btn-ghost`)
- **Phase 1**: Bottom nav — `<button class="nav-item">` with `.nav-icon` / `.nav-label` children; `openTab()` toggles `.active` class (CSS handles color + scale + backdrop-blur pill)
- **Phase 2.1**: ימים — stop cards use DS tokens, numbered circle markers on timeline, time chip in primary color, `.ds-badge-amber` for Google rating, `.btn-primary` for "הוסף תחנה", `.ds-section-hdr` with stop count
- **Phase 2.2**: תזכורות — priority right-border per card (red/amber/blue), urgency chips use `.ds-badge-*`, primary action uses `.btn-primary`, links use `.btn-ghost`
- **Phase 2.3**: הוצאות — removed stray "ביטול" button; summary stats use `.ds-stat`; export button gets 📤 icon
- **Phase 2.4**: ציוד — "איפוס" button moved from header to progress bar row (red-tinted), same ID for JS listener
- **Phase 2.5**: טיסות — two info chips (check-in timing, airport arrival) above flight cards

#### מסד נתונים אחיד לתזמון (2026-07-18)
- **`DAYS_STATE`** = מקור יחיד של אמת לכל תזמון תחנות (קהילה, מסעדות, קניות, צילום, קינוחים)
- **`remindersSchedule`** = נשאר נפרד — תזכורות הן *משימות* לפני הטיול, לא תחנות ב-DAYS
- הוסר `restaurantsSchedule` + `openEditRestaurantSchedule` + כפתור "⏰ קבע זמן" הישן
- `saveSchedules()` שומר רק `remindersSchedule`

### כללי עבודה
- **לפני כל שינוי — גדול או קטן**: `git tag backup-<תיאור>-$(date +%Y%m%d-%H%M)` + push. אין יוצאים מן הכלל.
- **סדר קבוע**: tag לפני → שינוי → commit + push → עדכן CLAUDE.md → עדכן skill
- **branch**: `claude/unknown-session-xpa0pr` → PR → merge ל-`main`
- **אחרי כל שינוי**: עדכן סעיף זה + skill ב-`.claude/skills/prague-2026.md`
- **ציוני Google**: אימות רק מ-top-rated.online / TripAdvisor — לא להמציא

## איך לערוך את האפליקציה

**אף פעם לא לערוך `index.html` או `gas_project/Code.gs` כאן — הם לא קיימים בריפו הזה בכלל.**

1. ערוך `app.html` כאן.
2. שכפל גם את `arielshish/Prague-2026-backend` **לצד** הריפו הזה (siblings, אותה תיקיית אב).
3. ב-`Prague-2026-backend`, הרץ `python3 sync_gas.py` — זה קורא את `app.html` מכאן ומעדכן את `gas_project/index.html` שם.
4. לפריסת GAS: לך ל-`Prague-2026-backend` — כל הוראות ה-deploy וה-CLAUDE.md המלא נמצאים שם.
