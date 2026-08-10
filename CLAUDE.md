# Prague 2026 — משפחת שיש (repo ציבורי — GitHub Pages בלבד)

> עדכון אחרון: 2026-08-07 (גרסה 11 — OTP מספרי במקום magic link)

זהו repo **ציבורי בכוונה** (חייב להישאר public כדי ש-GitHub Pages יעבוד בחשבון חינמי).

## מה יש כאן, ומה לא

הריפו הזה מכיל **רק** את מה שצריך להיות מוגש דרך GitHub Pages:
- `app.html` — האפליקציה (login screen + Firebase, לגלישה ב-`arielshish.github.io/Prague-2026/app.html`)
- `translator.html` — מתרגם קולי עצמאי
- `robots.txt` — חוסם אינדוקס במנועי חיפוש
- `.github/workflows/pages.yml` — בונה תיקיית `_site` זמנית עם רק שלושת הקבצים האלה ופורס אותה (**לא** את כל הריפו)

**כל השאר עבר ל-repo פרטי:** `arielshish/Prague-2026-backend` — כולל `gas_project/Code.gs` (הבאקאנד של GAS), `sync_gas.py`, `_archive/` (גרסאות ישנות), ותיעוד מלא (מיילים משפחתיים, Spreadsheet ID, Deployment ID). זה עבר כי הריפו הזה חייב להישאר public.

## מפת הפיצ'רים הקיימים ב-app.html

> עדכון אחרון: 2026-08-07 (גרסה 11 — OTP מספרי במקום magic link)

### מבנה נתונים מרכזי

#### ALL_PLACES[] — מקור יחיד לכל האטרקציות (2026-07-18)
```
ALL_PLACES[] — פריטים עם שדה type:
  type:'shop'       → {icon, name, stars, hours, metro, duration, brands, tip, mapUrl}
  type:'restaurant' → {icon, name, level, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl}
  type:'dessert'    → {icon, name, level, sub, desc, price, rating, tag, tagClr, where, mapUrl}
  type:'community'  → {icon, name, cat, fb, google, desc, booking, duration, tips, who, how, mapUrl}
  type:'photo'      → {icon, name, fee, sub, desc, best, crowds, fee_txt, rating, tip, mapUrl}
  type:'exchange'   → {icon, name, stars, hours, metro, duration, brands, tip, mapUrl} (2026-08-07, אותו schema כמו shop)
```
`type:'exchange'` — נעצי "המרת כסף בטוחה" בטאב מיקום בלבד (אין לו computed view/טאב ייעודי, כמו photo). כל מקום שרוץ על ALL_PLACES/TYPE_GRAD/catColor/typeColor/typeLabel חייב לכלול ערך ל-`exchange` (ראה `renderNearbyList`, `addMapMarkers`, `showMapNavDialog` ב-app.html) — **רק מקומות שאומתו בפועל (דירוג גוגל/ביקורות עקביות משני מקורות לפחות)** — לא להוסיף דוכן רק כי הוא "נשמע בסדר" במקור בודד.

**⚠️ לקח מ-2026-08-07**: המשתמש העלה שני קבצי `.docx` שנוצרו ב-ChatGPT עם "רשימות מאומתות" של דוכני חליפין (כולל "דוח אימות" עם מתודולוגיה נשמעת-רצינית). **שני הקבצים הכילו טעויות עובדתיות** — כולל אחת שכבר תפסתי בעצמי בחיפוש עצמאי (כתובת שנסגרה ב-2024, שהקובץ טען שעדיין פעילה). מסמך שנוצר ע"י LLM אחר, גם עם "מתודולוגיית אימות" מפורטת, **הוא לא מקור — הוא claim שצריך לאמת בעצמך** בדיוק כמו כל מקור בודד אחר. לעולם לא להטמיע רשימות "מאומתות" כאלה בלי לחפש כל שם+כתובת בעצמך.
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

#### כפתור "משוך גרסה עדכנית" + חותמת גרסה (2026-08-10)
- **הבעיה**: האפליקציה היא קובץ HTML יחיד מ-GitHub Pages עם `apple-mobile-web-app-capable`. כשמוסיפים אותה למסך הבית ב-iOS היא רצה standalone — **בלי סרגל כתובות ובלי כפתור רענון** — ו-Safari מגיש את הגרסה השמורה. תיקון נפרס בהצלחה והמשפחה ממשיכה לראות ישן, בלי שום דרך לדעת שהם על גרסה ישנה
- `BUILD_ID` — מחרוזת שמתעדכנת **ידנית בכל שינוי מהותי**, מוצגת על הכפתור (`_renderBuildStamp()` נקראת מ-`_showApp()`). מאפשרת לדעת במבט אחד איזו גרסה טעונה בטלפון
- `forceUpdate()` — מוסיף `?v=<timestamp>` ל-URL ומנווט מחדש. **`location.reload(true)` לא מספיק** — הפרמטר הוסר מהתקן ורוב הדפדפנים מתעלמים ממנו; URL שונה הוא הדרך היחידה לאלץ הבאה מהרשת
- אין service worker באפליקציה — הבעיה היא מטמון HTTP של Safari, לא cache של SW

#### קורלציה תחנות ↔ מקומות ↔ מיקום (2026-08-10)
- **הבאג**: `addMapMarkers()` ו-`renderNearbyList()` רצו על `_uniquePlacesForMap()` = `ALL_PLACES` בלבד. תחנה שקיימת בלוז אבל לא ב-`ALL_PLACES` **לא צוירה כלל** — גם כשהיו לה קואורדינטות. נמדד: **29 תחנות עם מיקום, 7 בלבד על המפה**. המלון, טירת פראג, כיכר העיר העתיקה, אי קמפה — נעלמו מהמפה ומרשימת "קרוב אליי"
- **`_mappablePlaces()`** — האיחוד: כל `ALL_PLACES` + כל תחנת לוז עם קואורדינטות שאינה כבר ברשימה, מסונתזת כ-`type:'stop'` ומועשרת ב-`_withPlaceDetails`
- ⚠️ **חייב להיות memoized** (`_mappableCache`): כרטיסי הרשימה מעבירים לדיאלוג **אינדקס מספרי** לתוך הרשימה. מערך חדש בכל קריאה היה מחזיר `indexOf === -1` לאובייקט מסונתז והדיאלוג לא היה נפתח. המטמון מבוטל ב-`_invalidateMappable()` מ-`saveDaysState` ומה-listener של הלוז
- ⚠️ **de-dupe לפי קואורדינטה ולא רק לפי שם**: `"ארוחת ערב — Gran Fierro"` ו-`"Gran Fierro"` הם שמות שונים באותה נקודה, וכך גם **6** תחנות "מלון" הממופות לעוגן אחד. בלי זה: 120 נעצים על 98 נקודות. אחרי: 103 נעצים, ו-15 נקודות מוערמות ירדו ל-5 (כולן קיימות מלפני כן ב-`ALL_PLACES`)
- **`_scheduledPlaceNames()`** — מקור יחיד ל"מה בלוז", משותף למפה ולרשימה. מסמן גם מקום ב-`ALL_PLACES` שתחנה היא כינוי שלו (אותן קואורדינטות), אחרת הנעץ ששרד את ה-de-dupe לא היה מקבל תג יום
- `type:'stop'` נוסף ל-`TYPE_GRAD`/`catColor`/`typeColor`/`typeLabel` — כל מפת type חדשה חייבת ערך, אחרת נפילה ל-fallback אפור
- **"היינו" מקורלל לשלושתם**: נעץ ירוק עם ✓ במפה (`makeVisitedPinIcon`), תג ברשימת הקרובים, וכפתור toggle בדיאלוג הנעץ. `refreshVisitedUI()` מעדכן כפתורים **במקום** (`outerHTML`) כדי לתפוס גם דיאלוג פתוח

**⚠️ באג נתונים שנותר (לא תוקן — דורש אימות)**: `Trdelník (טרדלניק)` ו-`מוזיאון החושים` חולקים קואורדינטה זהה `[50.0875, 14.4213]`, וכך גם `Westfield Chodov` ו-`Albert Supermarket — Chodov`. אחת מכל זוג שגויה. **לא נוחשה קואורדינטה חדשה** — צריך אימות משני מקורות כמו כל השאר.

#### כפתור "היינו" (2026-08-10)
- `VISITED_STATE` — אובייקט `{שם מקום: timestamp}`, מקור יחיד לסימון מקומות שכבר ביקרנו בהם
- **ממופתח לפי שם ולא לפי אינדקס** — אינדקסים ב-`ALL_PLACES` זזים בכל הוספת מקום, והסימון היה עובר למקום אחר. ה-timestamp נשמר כדי שאפשר יהיה להציג "מתי היינו" בעתיד בלי מיגרציה
- `isVisited(name)` · `toggleVisited(name)` · `visitedCount()` · `visitedBtnHtml(name, variant)` — `variant:'icon'` לכרטיסי קהילה (כפתור צר ליד נווט/ממני), `'block'` לכרטיסי מסעדות (שורת הפעולות)
- **event delegation** — listener אחד על `document` עם `.closest('.visitedBtn')` ו-`data-vn`, **לא** `onclick` inline: שמות מקומות מכילים גרשים ומרכאות (`מגדל פטז׳ין`, `מ"ר`) וזו בדיוק המלכודת ששברה `onclick` בעבר
- **סנכרון**: `localStorage['prague_visited_v1']` קודם, ואז `appdata/main.visited` — אותו דפוס של `saveDaysState`. יש listener ב-`initRealtimeSync`, והשדה נדחף גם ב-`_resyncLocalDataToCloud` אחרי כניסה
- `refreshVisitedUI()` מרנדר מחדש את הטאב הפעיל (כולל `days`, ש-`refreshScheduleBadges` מדלגת עליו בכוונה)
- כיסוי: 56/56 כרטיסי קהילה + 26/26 כרטיסי מסעדות

#### פרטי אטרקציה שנעלמו בפופ-אפ (2026-08-10)
- `showDayTimePicker(emoji, name, desc)` קיבל `desc` כפרמטר ו**מעולם לא הציג אותו** — הפופ-אפ הראה רק emoji+שם (מקוצר ל-26 תווים). בלי תיאור, דירוג, משך או הזמנה, אי אפשר היה להחליט לאיזה יום לשבץ בלי לצאת ולחזור
- חמור יותר: בשמירה הוא דחף תחנה **רזה** — `{emoji, name, time, desc, mapUrl:''}` בלבד — ואיבד `details`/`tips`/`booking`/`google`/`duration`/`who`/`mapUrl`. `saveAddCommunityStop` לעומתו שמר את הרשומה המלאה. תוצאה: כל מקום שנוסף מבנק האטרקציות נפתח אח"כ ב"ימים" ככותרת ריקה
- `showStopDetail` ו-`renderDays` עשו fallback רק ל-`google`/`duration`/`who`, ורק מול `COMMUNITY`/`RESTAURANTS` — לא מול `ALL_PLACES` המלא, ולא ל-`details`/`tips`/`booking`/`mapUrl`
- **התיקון**: `_placeToStopFields(rec)` מנרמל את סכימות ה-type השונות (community: `how`/`booking`/`tips`־string · shop: `hours`/`metro`/`brands` · dessert: `where`/`rating` · photo: `best`/`crowds`/`fee_txt`) לשדות של תחנה. `_stopFallback(name)` מאתר ב-`_uniquePlacesForMap()`, ו-`_withPlaceDetails(stop)` ממלא **רק שדות ריקים** כדי לא לדרוס עריכות של המשתמש
- מוחל בשלושה מקומות: `showStopDetail`, `renderDays`, ובשמירה של `showDayTimePicker`. **ההשלמה בזמן תצוגה מתקנת גם תחנות שכבר נשמרו רזות בענן** — בלי מיגרציה של הנתונים
- הפופ-אפ של בחירת היום מציג עכשיו תיאור מלא + צ׳יפים של ⭐ דירוג / משך / מתאים ל / הזמנה

#### תיקון גלילה במודל "הוסף תחנה" (2026-08-10)
- `#addStopModal` היה ה-bottom sheet **היחיד** בקובץ בלי `max-height`+`overflow-y`. תוכן הגיליון ~730px — גבוה ממסך של רוב הטלפונים — ועם `align-items:flex-end` הכותרת וטאבי הבנק נחתכו **מעל** גבול המסך בלי אפשרות לגלול אליהם (קונטיינר `position:fixed`). נמדד ב-Chromium: 62px חתוכים ב-375×667, 65px ב-390×664, 14px ב-414×715
- תוקן: `max-height:88vh;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box` על הפאנל
- רשימת הבנק (`#attrBankRow`) הוגדלה מ-220px ל-`min(42vh,300px)`, והסגנון שלה רוכז ב-`BANK_ROW_STYLE` — `buildBankCards` הייתה דורסת את ה-`cssText` בכל החלפת טאב ומוחקת בשקט מאפיינים שהיו ב-HTML, ו-`buildBankRemCards` בכלל לא הציבה סגנון (ירשה את של הטאב הקודם)
- שורת הכפתורים בכרטיס תחנה קיבלה `flex-wrap:wrap` — היא גדלה בכפתור "📍 ממני" ובמסך צר גלשה

#### תמונות + טאב מיקום (2026-07-18)
- **תמונות מסעדות**: כרטיסי מסעדה עם תמונה 150px — gradient+emoji fallback, Wikimedia Commons אם קיים ב-PLACE_IMGS
- `restaurantImgHtml(r)` — helper שמחזיר HTML של תמונה עם onerror fallback
- `PLACE_IMGS` — lookup לפי שם מקום → URL תמונה (Wikimedia Commons)
- `PLACE_COORDS` — קואורדינטות [lat,lng]; **126 מפתחות, כיסוי מלא: 98/98 שמות ב-`ALL_PLACES` + 29/29 שמות תחנות ב-`DAYS`** (2026-08-10). ממופתח לפי **שם מדויק**, ולכן יש בו גם כינויים לשמות תחנות שלא זהים לשם ב-`ALL_PLACES`. תחנות "פעולה" (מנוחה במלון, צ'ק-אאוט) ממופות לעוגן ההגיוני שלהן (המלון). כל קואורדינטה **אומתה משני מקורות בלתי-תלויים לפחות** — אין ניחושים (ראה הסקיל לטבלת המקורות)
- `PLACE_IMGS` — 35+ תמונות Wikimedia Commons לפי שם מקום (~שורה 4494)
- **טאב מיקום** (`location`) — מפת Leaflet+OpenStreetMap, כפתור "📍 אתרו אותי" (Geolocation API)
- **מעקב מיקום חי** (2026-08-10) — הכפתור הוא toggle על `watchPosition`: המרחק/כיוון/מיון מתעדכנים תוך כדי הליכה, נעץ יחיד שזז + עיגול דיוק. throttle לרשימה (3 שנ׳ / 15 מ׳) ועצירה אוטומטית ביציאה מהטאב וב-`visibilitychange` — סוללה
- Pins צבעוניים: כתום=בלוז, כחול=מסעדות, ירוק=אטרקציות, סגול=אתם כאן, צהוב=קניות
- רשימת מקומות קרובים ממוינת לפי מרחק Haversine + פילטר קטגוריה
- **כיוון (מצפן) יחסי למיקום הנוכחי** (2026-08-10) — `bearingTo()` (forward azimuth) + `compassFor()` (8 רוחות, חץ + שם בעברית). מוצג גם בכרטיס ברשימת הקרובים וגם בדיאלוג הנעץ, **רק כשיש GPS פעיל**. החץ מצביע לכיוון גאוגרפי (⬆️=צפון) — לא בוסולה שמתחשבת בכיוון שאליו הטלפון מופנה
- **de-dupe לתצוגה**: `_uniquePlacesForMap()` — 15 מקומות כפולים ב-`ALL_PLACES` ציירו נעצים כפולים; ממוזג בשכבת התצוגה בלבד (לא ב-`ALL_PLACES`, אחרת טאב קהילה נשבר). ראה סקיל לפרטים
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

#### כניסה — OTP מספרי, בלי magic link (2026-08-07)
- מסך הכניסה שולח קוד בן 6 ספרות למייל (`sendLoginCode()` → GAS `sendOtpCode` דרך JSONP) והמשתמש מקליד אותו (`verifyLoginCode()` → GAS `verifyOtpCode`) — **אין** לחיצה על קישור בכלל
- מוגבל ל-4 מיילי המשפחה — **בצד שרת בלבד** (`FAMILY_EMAILS` ב-`Code.gs`, repo פרטי). הקליינט לא מכיל רשימת מיילים — הוסרה מ-app.html מטעמי אבטחה (הייתה hardcoded ונגישה לכל מי שגולש ל-repo הציבורי); בצד קליינט נבדק רק שהמייל תקין בפורמט
- הקוד עצמו + התוקף (10 דק') מנוהלים ב-GAS backend (`Prague-2026-backend/gas_project/Code.gs`) — לא ב-Firebase
- כניסה מוצלחת (`verifyOtpCode`) מחזירה גם Firebase custom token — הקליינט קורא `signInWithCustomToken()` לפני הצגת האפליקציה. **קריטי**: בלי זה, הכניסה "מצליחה" אבל שום שמירה ל-DB לא עובדת (Firestore דוחה anonymous auth) — ראה `Prague-2026-backend/CLAUDE.md` → "Firebase custom token"
- **`ensureFirebaseAuth()` ממתין ל-`onAuthStateChanged`** ולא קורא `currentUser` סינכרונית (PR #63) — Firebase משחזר session אסינכרונית, אז קריאה סינכרונית מִמְשָה `false` לצמיתות וכל טעינה ראשונית נדחתה (תג "⚠️ מקומי"). אחרי כניסה `_resetAuthAndSync()` מאפסת את ה-memoization ומפעילה realtime sync מחדש
- **`ensureFirebaseAuth()` לא נופל יותר ל-`signInAnonymously()`** (PR #61) — Firestore דוחה anonymous תמיד, אז ה-fallback רק ייצר "הצלחה למראה" שנכשלת בשקט בכל כתיבה. **אל תחזירו אותו.** גם ה-IIFE בטעינת העמוד מוודא `!user.isAnonymous` עם `onAuthStateChanged` לפני שמדלג על מסך הכניסה
- **`_resyncLocalDataToCloud()`** (PR #61) — אחרי כניסה אמיתית, דוחפת לענן את כל מה שנצבר ב-localStorage בזמן שה-session היה שבור (הוצאות/ימים/ציוד/תזכורות/תקציב), דרך פונקציות השמירה הקיימות
- **`_showAppWhenReady()`** (PR #63) — כל הצגת UI מתוך callback אסינכרוני (כמו `onAuthStateChanged`) חייבת לבדוק `document.readyState`; `addEventListener('DOMContentLoaded')` על אירוע שכבר קרה לא יורה לעולם, וזה השאיר את מסך הכניסה תקוע למרות session תקף
- **זכירת מכשיר ל-7 ימים** (PR #62) — `SESSION_KEY` ב-`localStorage` עם timestamp תפוגה (`_setDeviceRemembered`/`_isDeviceRemembered`), במקום `sessionStorage` שנמחק בכל סגירת טאב. הדגל לבדו אף פעם לא מספיק — תמיד מאומת מול Firebase Auth
- **הוחלף**: הגישה הקודמת דרך Firebase Email Link (`sendSignInLinkToEmail`) הוסרה — הייתה שבירה כשהקישור נפתח בדפדפן/מכשיר אחר מזה ששלח את הבקשה
- דורש deploy נפרד ל-GAS backend (`clasp push && clasp deploy`) — ראה `Prague-2026-backend/CLAUDE.md`
- **כפתור "🚪 התנתק מהמכשיר"** (טאב ראשי) → `doLogout()` — מוחק את הדגל ב-localStorage + `signOut()` מ-Firebase ומרענן. לא מוחק נתונים (מקומית או בענן), רק מנתק גישה
- **✅ אימות אבטחה (2026-08-07, נבדק אמפירית מול הפרויקט החי)**: ה-`apiKey` פומבי וספק email/password פעיל, כך שכל אחד **יכול ליצור חשבון** ב-Firebase Auth של הפרויקט. אבל **Firestore Rules חוסמות אותו**: נרשם חשבון עם מייל אקראי לא-משפחתי → קריאה מ-`appdata/main` החזירה `403 PERMISSION_DENIED`, וכתיבה ל-`appdata/` גם `403`. (חשבון הבדיקה נמחק ואומת שנמחק.) **מסקנה: גישה ל-DB רק דרך custom token של ה-GAS, שמונפק רק ל-`FAMILY_EMAILS`.** אל תשנו את ה-Rules ל-`if request.auth != null` — זה יפתח את ה-DB לכל אחד
- **החלטה מודעת (2026-08-07)**: commit `3db2deb` בהיסטוריית `main` הציבורי עדיין מכיל את 4 מיילי המשפחה (הוסרו מה-קוד הנוכחי, לא מההיסטוריה). המשתמש נשאל אם לשכתב היסטוריה (`rebase`+`force-push`) כדי להסיר — **בחר במפורש שלא**, זה לא נתפס כמידע רגיש מספיק כדי להצדיק פעולת git הרסנית. **אל תיזום שכתוב היסטוריה על דעת עצמך** — זו החלטה שכבר התקבלה.

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
