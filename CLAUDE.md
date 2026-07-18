# Prague 2026 — משפחת שיש (repo ציבורי — GitHub Pages בלבד)

> עדכון אחרון: 2026-07-18 (גרסה 10 — תיקון טאב מיקום + PLACE_IMGS מורחב)

זהו repo **ציבורי בכוונה** (חייב להישאר public כדי ש-GitHub Pages יעבוד בחשבון חינמי).

## מה יש כאן, ומה לא

הריפו הזה מכיל **רק** את מה שצריך להיות מוגש דרך GitHub Pages:
- `app.html` — האפליקציה (login screen + Firebase, לגלישה ב-`arielshish.github.io/Prague-2026/app.html`)
- `translator.html` — מתרגם קולי עצמאי
- `robots.txt` — חוסם אינדוקס במנועי חיפוש
- `.github/workflows/pages.yml` — בונה תיקיית `_site` זמנית עם רק שלושת הקבצים האלה ופורס אותה (**לא** את כל הריפו)

**כל השאר עבר ל-repo פרטי:** `arielshish/Prague-2026-backend` — כולל `gas_project/Code.gs` (הבאקאנד של GAS), `sync_gas.py`, `_archive/` (גרסאות ישנות), ותיעוד מלא (מיילים משפחתיים, Spreadsheet ID, Deployment ID). זה עבר כי הריפו הזה חייב להישאר public.

## מפת הפיצ'רים הקיימים ב-app.html

> עדכון אחרון: 2026-07-18 (גרסה 10 — תיקון טאב מיקום + PLACE_IMGS מורחב)

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

#### דיאלוג מפה עשיר — Rich Map Dialog (גרסה 10)
- `showMapNavDialog(p, coords)` (~שורה 4644) — scrollable bottom sheet בלחיצה על כל pin/כרטיס
- header: icon + שם + תג ✅ "כבר בלוז · יום X" אם ב-DAYS
- מידע לפי type: community (desc/duration/google/who/how/booking/tips) | restaurant (badge/sub/desc/price/google) | dessert (sub/desc/tag/rating/price/where) | shop (stars/hours/metro/duration/brands/tip) | photo (sub/desc/rating/best/crowds/fee/tip)
- **תיקון קריטי (גרסה 10)**: `tips` community items הוא **string** לא array — שמירה מלאה עם `Array.isArray` guard. בלי זה: `p.tips.forEach` זורק TypeError ושום דיאלוג לא נפתח.
- **תיקון קריטי (גרסה 10)**: כפתור "הוסף ללוז" בדיאלוג משתמש ב-`window._mapNavPlace` — לא inline data — מונע שבירת onclick בגלל `"` בתוך desc/name (כמו `מ"ר`, `בסופ"ש`).
- `_openNearbyDialog(apIdx, lat, lng)` (~שורה 4901) — wrapper עם try-catch; `apIdx = ALL_PLACES.indexOf(p)` — אינדקס מספרי, ללא בעיות escaping
- כפתורי ניווט נעוצים בתחתית: Google Maps | Waze | 📍 מפה מקומית | סגור

#### תמונות + טאב מיקום (2026-07-18)
- **תמונות מסעדות**: כרטיסי מסעדה עם תמונה 150px — gradient+emoji fallback, Wikimedia Commons אם קיים ב-PLACE_IMGS
- `restaurantImgHtml(r)` — helper שמחזיר HTML של תמונה עם onerror fallback
- `PLACE_IMGS` — lookup לפי שם מקום → URL תמונה (Wikimedia Commons)
- `PLACE_COORDS` — קואורדינטות [lat,lng] לכל 105 המקומות ב-ALL_PLACES (~שורה 4396)
- `PLACE_IMGS` — 35+ תמונות Wikimedia Commons לפי שם מקום (~שורה 4494)
- **טאב מיקום** (`location`) — מפת Leaflet+OpenStreetMap, כפתור "📍 אתרו אותי" (Geolocation API)
- Pins צבעוניים: כתום=בלוז, כחול=מסעדות, ירוק=אטרקציות, סגול=אתם כאן, צהוב=קניות
- רשימת מקומות קרובים ממוינת לפי מרחק Haversine + פילטר קטגוריה
- פילטר אטרקציות: `.indexOf('אטרקציות')` על `cat` — לא על `type` — מונע הצגת מסעדות/קינוחים community
- תג "✅ כבר בלוז" גם ברשימת הקרובים

#### Light Theme v7 (2026-07-18)
- **עיצוב בהיר שולט** — לבן (`#ffffff`) בכרטיסים, מודאלים, nav, sidebar
- **body/html**: `#F7F3EE` / `#FAF7F4` gradient (במקום beige כהה)
- **`--c-surface`**: `#F7F3EE` (עדכון טוקן)
- **טיסות**: שני כרטיסי הטיסה (הלוך/חזור) שוכתבו לגמרי — רקע לבן עם border צבעוני (`rgba(244,99,74,0.18)` / `rgba(59,130,246,0.18)`)
- **כדורי ימים (day pills)**: כדורים לא-פעילים עכשיו `#ffffff` עם border דק (במקום `rgba(0,0,0,0.08)`)
- **מודאלים (bottom sheets)**: כולם `#ffffff` (במקום `#F5EFE6` beige)
- **Nav + sidebar**: `rgba(255,255,255,0.95)` backdrop (במקום `rgba(237,228,216,0.97)`)
- **login screen**: `#FAF7F4` (במקום `#EDE4D8`)
- **header**: **נשאר כהה בכוונה** — skyline של פראג בלילה כ-accent עיצובי
- **גבולות**: `rgba(255,255,255,0.14/0.15)` → `rgba(0,0,0,0.10)` (replace_all — גבולות לבנים היו בלתי נראים על רקע לבן)

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
