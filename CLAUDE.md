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

#### תיקון קואורדינטות שגויות + קורלציה מלאה בטאב מיקום (2026-08-11)

**סוג C נסגר** — שתי נקודות שבהן שני מקומות חלקו קואורדינטה:
| מקום | היה | הפך ל | אימות |
|------|-----|-------|--------|
| `מוזיאון החושים` | `[50.0875, 14.4213]` (העיר העתיקה — **שגוי**) | `[50.0840, 14.4291]` | Jindřišská 939/20; Google Maps place `50.0839944,14.4290621`, ותואם למרחק מ-`Praha Exchange — Jindřišská` שכבר במאגר |
| `Westfield Chodov` | `[50.0277, 14.4892]` (~350 מ׳ סטייה) | `[50.0311, 14.4905]` | ויקיפדיה `50°01′50″N 14°29′26″E` + Apple Maps `50.031557,14.490308` + מקור שלישי `50.03137,14.49234` |
| `Albert Supermarket — Chodov` | `[50.0277, 14.4892]` | `[50.0311, 14.4905]` | **אותה נקודה כמו הקניון במכוון** — ההיפרמרקט יושב בתוכו (`albert.cz` + `westfield.com`). זו לא כפילות לתיקון |

תוצאה: נקודות מוערמות 5 → **1**, וזו שנשארה נכונה.

**כפילות שנמצאה רק ב-audit מטושטש (11/08)**: `קריוטוש כשר` ו-`קריוטוש כשר — רובע יהודי` — אותו מקום, **21 מ׳** הפרש. חמקה מכל הבדיקות הקודמות כי גם השם וגם הקואורדינטה היו שונים *במעט*, ולכן לא נתפסה לא ע"י de-dupe לפי שם ולא ע"י התנגשות קואורדינטה. אוחדה. **בדיקת כפילויות חייבת להיות מטושטשת** — הכלה של שם אחד בשני + קרבה גאוגרפית, לא רק שוויון מדויק. אחרי: 99 נעצים על 98 נקודות.

**⚠️ ארבעה זוגות שנראים כפולים ואינם** — לא לאחד אותם: `Westfield Chodov`/`Albert Chodov` (היפרמרקט בתוך הקניון) · `מוזיאון האשליות`/`מוזיאון הלגו` (112 מ׳, חולקים רק את המילה "מוזיאון") · `בית הכנסת פינקס`/`בית הכנסת מייזל` (110 מ׳, שני בתי כנסת אמיתיים ברובע היהודי) · `מוזיאון הלגו`/`Escape Room` (חולקים רק "Prague"). וכן **שני פסלי קפקא שונים**: `פסל קפקא המסתובב` (דוד צ׳רני, ראש מסתובב 11 מ׳, `[50.0892, 14.4228]`) מול `פסל פרנץ קפקא — Vězeňská` (ירוסלב רונה, 2003, 3.75 מ׳, `[50.0906, 14.4200]`) — 250 מ׳ זה מזה.

**פילטרים חסרים בטאב מיקום** — כל המקומות היו על המפה (0 חסרים מכל הטאבים), אבל **לא היה כפתור סינון** ל-`shop` ול-`dessert`, אז 7 חנויות ו-11 קינוחים היו נגישים רק דרך "הכל". נוספו שלושה צ׳יפים: 🍦 קינוחים · 🛍 קניות · ✅ היינו.

**⚠️ סחיפת type במיזוג** — `_uniquePlacesForMap` קבע `merged.type = rich.type`, ולכן מקום שה-community שלו היה עשיר יותר נרשם כ-`community` ונעלם מהפילטר הייעודי שלו (`Manifesto Market — Anděl`: 25 מסעדות מתוך 26). התיקון: **ה-type הספציפי גובר על `community`** — `community` הוא הקטלוג הגנרי, `restaurant`/`shop`/`dessert`/`photo` הם הסיווג האמיתי שקובע פילטר.

**מדידה סופית**: מסעדות 26/26 · אטרקציות 32 · קינוחים 11/11 · קניות 7/7 · צילום 10/10 · המרת כסף 3/3 · בלוז 18 · היינו — לפי הסימון. 0 סחיפת type.

#### איחוד שמות כפולים (2026-08-10)
ביקורת מדדה **שלושה** סוגי כפילויות נפרדים:

| סוג | כמות | נראה למשתמש |
|-----|------|--------------|
| A — אותו **שם** פעמיים ב-`ALL_PLACES` (`shop`/`restaurant`/`dessert` + `community`) | 15 | לא במפה (`_uniquePlacesForMap` ממזג), **כן בין טאבים** |
| B — אותו מקום בשני **שמות שונים** | 3 | **כן** — שני נעצים ושני כרטיסים |
| C — שני מקומות **שונים** באותה קואורדינטה | 2 | כן — נעצים מוערמים |

**B תוקן** — ארבע רשומות אוחדו לשם קנוני אחד, כך שה-de-dupe הקיים לפי שם קולט אותן:
- `Primark Wenceslas Square` + `Primark — וצסלב` → **`Primark — כיכר וצסלב`** (שם התחנה ב-`DAYS`)
- `מאפה פרג — מאקובי זאוין` → **`מאפה פרג`**
- `Little Chimney` → **`Little Chimney — קריוטוש דובאי`**

תוצאה: 103 נעצים → **100**, התנגשויות קואורדינטה 5 → **2**, שמות ייחודיים 98 → 95.

⚠️ **בעת שינוי שם של מקום — לבדוק את `PLACE_IMGS`**: המפתח `Primark Wenceslas Square` התייתם והכרטיס איבד את התמונה. נוסף מפתח לשם הקנוני. `PLACE_COORDS` לא דרש שינוי (הכינויים הישנים נשארו, לא מזיקים).
⚠️ `VISITED_STATE` ממופתח לפי שם — שינוי שם מאבד סימון "היינו" קיים על אותו מקום.

**A ו-C לא טופלו** — A דורש שינוי מבני ב-`COMMUNITY` (הטאב מרנדר ישירות מ-`type:'community'`, ראה האזהרה ב-`_uniquePlacesForMap`), ו-C הוא שגיאת נתונים שדורשת אימות קואורדינטה משני מקורות.

#### סט פעולות אחיד בכל המשטחים (2026-08-10)
ביקורת מדדה 6 פערים; כולם נסגרו. **8 משטחים × 4 קבוצות פעולה — הכל ✅**:

| משטח | נווט | ממני | היינו | לוז |
|-------|:----:|:----:|:-----:|:---:|
| אטרקציות · מסעדות · קינוחים · צילום · קניות | ✅ | ✅ | ✅ | ✅ |
| כרטיס תחנה (ימים) | ✅ | ✅ | ✅ | ✅ |
| פופ-אפ פרטי תחנה | ✅ | ✅ | ✅ | ⏰ שעה · ↔ העבר יום |
| דיאלוג נעץ במפה | ✅ | ✅ | ✅ | ✅ |

- נוסף `📍 ממני` לקינוחים (11), צילום (10) וקניות (7)
- כרטיס התחנה: התג הפסיבי `✅ היינו` הוחלף ב**כפתור toggle אמיתי** (variant `'chip'` — קומפקטי לשורה צפופה)
- פופ-אפ התחנה קיבל `📍 ממני`, `⏰ שעה` ו-`↔ העבר יום` — קודם היה צריך לסגור ולחזור לכרטיס בשביל כל פעולה
- **⚠️ ה-listener של `.visitedBtn` עבר ל-capture phase (`addEventListener(..., true)`)**: כרטיס התחנה נושא `onclick="showStopDetail(...)"` כ-attribute. ב-bubble ה-listener ב-`document` רץ **אחרי** ה-onclick של הכרטיס, ולכן `stopPropagation` איחר והפופ-אפ נפתח יחד עם הסימון. נתפס בבדיקה (`popupOpened: true`), תוקן, ואומת (`popupOpened: false`)

#### תצוגת "היום" בטאב ימים (2026-08-11)
- `TRIP_START = new Date(2026, 7, 8)` + `tripDayNumber()` — מחשב את מספר יום הטיול מהתאריך בפועל. ⚠️ **חייב תאריך מקומי ולא UTC**: `new Date('2026-08-08')` הוא חצות UTC, ובפראג זה כבר 03:00 באותו יום — חיסור timestamps היה מחזיר יום שגוי בשעות הקטנות. אומת ב-00:30 מקומי
- `_autoSelectToday()` נקראת מ-`renderDays()` ופותחת את **היום הנוכחי** במקום יום 1. `selectDay()` מדליקה `_daySelectedManually` — אחרי בחירה ידנית, רינדור מחדש (סנכרון ענן, סימון "היינו", חזרה לטאב) **לא** מקפיץ בחזרה להיום
- לפני הטיול → יום 1 · אחרי → היום האחרון
- **תגים בכותרת**: `● היום` (כתום) · `✓ עבר` (אפור) · `בעוד N ימים` (כחול)
- **כדורי הימים**: יום שעבר מציג ✓ במקום המספר, מתעמעם ומאבד רקע לבן; היום הנוכחי מקבל טבעת כתומה גם כשאינו הנבחר
- ⚠️ **עריכה בימים שעברו נשארת פתוחה במלואה** — הוספה, הזזה בין ימים, שינוי שעה. הסימון הוא ויזואלי בלבד ולא נעילה

**באג נסתר שנתפס תוך כדי**: היה `<div id="dayButtons">` **סטטי וריק** ב-HTML בנוסף לזה ש-`renderDays` מייצר בתוך `#dayCard` — **id כפול**. `getElementById` החזיר תמיד את הריק, ולכן המגן ב-`initDaySwipe` ("אל תחליף יום כשגוררים את שורת הכדורים") בדק אלמנט ריק ו**מעולם לא פעל**. הסטטי הוסר.

#### בית הכנסת ירושלים — פער שהתגלה בחיפוש (2026-08-11)
המשתמש חיפש "בית כנסת ירושלים" — **לא היה באפליקציה בכלל**. הסיבה: הוא **לא ברובע היהודי** אלא ב-Nové Město, ולכן לא נכלל לא בששת אתרי Josefov ולא בכרטיס המשולב של Jewish Museum.

- `בית הכנסת ירושלים — Jeruzalémská` — הגדול בפראג (1906, Wilhelm Stiassny), מאורי + ארט נובו, 850 מקומות
- **קואורדינטה אומתה משני מקורות זהים**: ויקיפדיה `50°05′05″N 14°25′55″E` + unesco-czech.cz `50°5'4.96"N 14°25'55.13"E` → `[50.0847, 14.4319]`. מרחק 163 מ׳ מ-`Praha Exchange — Jindřišská` ו-214 מ׳ מ-`מוזיאון החושים` — עקבי עם הכתובת Jeruzalémská 1310/7, ו-~1.1 ק״מ מאתרי הרובע (כלומר בבירור לא כפילות)
- **כרטיס נפרד** 150/100 CZK, אין הזמנה מראש ואין בידוק. פתוח אפריל–אוקטובר 09:00–18:00
- ⚠️ **סגור בשבת ובחגי ישראל** — בטיול הנוכחי 8/8 ו-15/8 הם שבתות, כלומר הביקור אפשרי רק ב-9–14/8

#### שחזור "הרובע היהודי" + ביקורת מה עוד ירד (2026-08-11)
המשתמש חיפש תחנה בשם "הרובע היהודי" ולא מצא. **היא באמת הייתה** — בקומיט `493b113`, כתחנת `DAYS` מלאה. אבל:

> ⚠️ **`493b113` אינו אב-קדמון של `main`** — קו היסטוריה נפרד שמעולם לא מוזג. התוכן נכתב בגרסה מקבילה של האפליקציה ולא "נמחק" מכאן.

**ביקורת מלאה מול הגרסה ההיא** (`git show 493b113:app.html`):

| מערך | ישן | חדש | חסר באמת |
|-------|-----|-----|-----------|
| `DAYS` | 31 | 29 | **1** (`הרובע היהודי`) — 4 קיימים תחת שם אחר, 2 הן פעולות שמכוסות ע"י `צ'ק-אאוט ויציאה לשדה` |
| `ALL_PLACES` | 83 | 114 | **0** — 5 ה"חסרים" הם שמות שאוחדו במכוון ב-#80 |
| `HISTORY_SPOTS` | 12 | 12 | 0 |
| `REMINDERS` | 17 | 16 | 1 (`כרטיסים ל-Majaland Prague`) — **לא שוחזר במכוון**: Majaland קיים בבנק אבל **אינו בלוז**, ותזכורת "לקנות כרטיסים עד תאריך" למשהו לא מתוכנן היא משימה מדומה |

**מה שוחזר**: `הרובע היהודי — Josefov` כרשומת `community`/`אטרקציות` מלאה — תיאור, הזמנה (600/200 CZK), משך, מתאים ל, טיפים ותחבורה. בכך הוא מופיע בבנק, במפה, ב"קרוב אליי", ניתן להוספה ללוז ולסימון "היינו".

⚠️ **הקואורדינטה אינה זו שבקומיט הישן** (`[50.0904, 14.4183]`) — היא כמעט זהה לבית הכנסת הגדול והייתה יוצרת זוג שנראה ככפילות. במקום זה: **מרכז המסה של ששת אתרי הרובע שכבר אומתו במאגר** → `[50.0897, 14.4182]`, במרחק 47–197 מ׳ מכל אחד מהם — סמן של **אזור** ולא של מבנה. 0 התנגשויות קואורדינטה.

**הלקח**: לפני שמסיקים "פיצ'ר נמחק" — לבדוק `git merge-base --is-ancestor`. תוכן שקיים בקומיט **לא אומר** שהוא היה אי פעם ב-`main`.

#### רזולוציית הייצוא (2026-08-11)
תמונה מיוצאת נראתה מטושטשת בהגדלה. **המקור לא היה הטקסט** (הוא וקטורי וחד ממילא) אלא **האריחים**: הם צוירו ב-256px ונמתחו פי 2.

- **`_tripMapGeo(pts, w, h, density)`** — בוחר zoom שנותן `density`× יותר פיקסלי-אריח מגודל הפאנל, ומחזיר `k = 1/density` (יחידות-קנבס לפיקסל-אריח). האריח מצויר בגודל `256*k`, ואחרי `ctx.scale(scale)` זה יוצא **256 פיקסלי-מכשיר — 1:1, בלי מתיחה**
- **scale אדפטיבי**: 3× כשהשטח מתחת ל-~20MP, אחרת 2×. ⚠️ iOS מגביל את **שטח** ה-canvas ולא רק את הצלע, ומחזיר canvas **ריק בלי לזרוק** — לכן התקרה, לא ניסוי וטעייה
- **צפיפות אדפטיבית**: כל הכפלה בצפיפות כמעט מרבעת את מספר האריחים. בצפיפות 3 נמדדו **74 אריחים** — מעל התקרה, וה-`_drawTripMapTiles` פשוט ויתר, כלומר **המפה לא נטענה בכלל**. `_tripTileCount(L)` מחשב מראש, ויורדים בצפיפות עד ≤44

**מדידה**: 10 מקומות → 3240×5514 (17.9MP, 1.28MB, 36 אריחים, zoom 15 במקום 14) · 40 מקומות → 2160×8236 (17.8MP, נפילה מבוקרת ל-2×, 36 אריחים).

#### מפה אמיתית בלוח הסיכום (2026-08-11)
הגרסה הראשונה ציירה נקודות על רקע ריק — נראה כמו scatter plot, לא כמו פראג. עכשיו הרקע הוא **אריחי OpenStreetMap אמיתיים**.

- **`_lon2tileF` / `_lat2tileF`** — Web Mercator, אותה מתמטיקה של Leaflet/OSM. ⚠️ הפרויקציה הקודמת הייתה שטוחה (equirectangular); עם אריחים היא הייתה מציבה את הנעצים במקום הלא נכון
- **`_tripMapGeo`** בוחר zoom שבו כל הנקודות נכנסות לפאנל (עד 16, ברירת מחדל 14 לפראג), וממרכז אותן
- **`_drawTripMapTiles`** מצייר ל-canvas בתוך clip מעוגל. ⚠️ **`crossOrigin='anonymous'` חובה** — בלעדיו ה-canvas נהיה tainted ו-`toBlob` זורק `SecurityError`. `tile.openstreetmap.org` מחזיר `Access-Control-Allow-Origin`
- תקרת 24 אריחים + timeout של 9 שנ׳; **בלי רשת הלוח עדיין נבנה** (אומת: 443KB PNG בלי אריחים)
- **ייחוס OSM** מוצג בתחתית פאנל המפה — חובה לפי תנאי השימוש
- הארכיטקטורה: canvas מצייר רקע → אריחים → **ה-SVG מעל**. ה-SVG מצייר רקע רק **מחוץ** לפאנל, אחרת מלבן אטום היה מוחק את האריחים
- התצוגה על המסך היא ה-canvas עצמו — WYSIWYG, מה שרואים הוא בדיוק מה שמיוצא

⚠️ **באג מספור שנתפס**: מספרי הנעצים נלקחו מהאינדקס בתוך רשימת הנקודות, והשורות מהרשימה המלאה. ברגע שלמקום אחד אין קואורדינטות — כל המספרים במפה מוסטים מול הרשימה. נשמר עכשיו האינדקס המקורי.

#### שם קנוני לכל נקודה — סוף הכפילויות (2026-08-11)
**הבעיה שנשארה**: ב-`PLACE_COORDS` יש 126 מפתחות אבל רק ~98 נקודות פיזיות. **17 קבוצות, 41 שמות** מתארות את אותה נקודה תחת שמות שונים — הכינויים שנוצרו כדי שתחנות `DAYS` יקבלו מיקום. התוצאה שהמשתמש ראה בלוח הסיכום: `Výtopna` ו-`Výtopna — מסעדת הרכבות` כשתי שורות, וכך גם `מצודת פראג` מול `טירת פראג וקתדרלת ויטוס`. וגרוע מזה — סימון "היינו" מכרטיס אחד **לא השתקף** בשני.

- **`_canonMap()`** — מקבץ את כל מפתחות `PLACE_COORDS` לפי קואורדינטה ובוחר שם קנוני לכל נקודה:
  1. שם שקיים ב-`ALL_PLACES` (הרשומה האמיתית) — הקצר מביניהם
  2. אחרת **הארוך ביותר** — בקבוצת המלון כל השמות הם תחנות פעולה (`חזרה למלון ומנוחה`), והארוך הוא `Comfort Hotel Prague City East`, השם היחיד שמתאר מקום. הקצר היה נותן כותרת מגוחכת בלוח
- **`isVisited` / `toggleVisited` עוברים דרך `_canonicalName`** — סימון מכל כינוי מתייחס לאותה נקודה, ומשתקף בכל המשטחים
- **מיגרציה אוטומטית** ב-`getVisitedState()`: מפתחות ישנים מומרים לקנוני, ובהתנגשות נשמר ה-timestamp **המוקדם** ("מתי היינו שם"). נשמר חזרה מיד — בלי מיגרציה ידנית
- ⚠️ **`_normalizeVisited` חייב לרוץ גם על מה שמגיע מהענן**. ה-listener הציב `VISITED_STATE = JSON.parse(d.visited)` ישירות ועקף את המיגרציה — מכשיר אחר ששמר תחת כינוי, הסימון שלו פשוט לא נראה. נתפס ברגרסיה (`remote applied: false`) ותוקן

**מדידה**: 9 שמות מסומנים → **5 מקומות** בלוח. סימון מכינוי ↔ שם קנוני משתקף בשני הכיוונים.

#### כפתור "היינו" (2026-08-10)
- `VISITED_STATE` — אובייקט `{שם מקום: timestamp}`, מקור יחיד לסימון מקומות שכבר ביקרנו בהם
- **ממופתח לפי שם ולא לפי אינדקס** — אינדקסים ב-`ALL_PLACES` זזים בכל הוספת מקום, והסימון היה עובר למקום אחר. ה-timestamp נשמר כדי שאפשר יהיה להציג "מתי היינו" בעתיד בלי מיגרציה
- `isVisited(name)` · `toggleVisited(name)` · `visitedCount()` · `visitedBtnHtml(name, variant)` — `variant:'icon'` לכרטיסי קהילה (כפתור צר ליד נווט/ממני), `'block'` לכרטיסי מסעדות (שורת הפעולות)
- **event delegation** — listener אחד על `document` עם `.closest('.visitedBtn')` ו-`data-vn`, **לא** `onclick` inline: שמות מקומות מכילים גרשים ומרכאות (`מגדל פטז׳ין`, `מ"ר`) וזו בדיוק המלכודת ששברה `onclick` בעבר
- **סנכרון**: `localStorage['prague_visited_v1']` קודם, ואז `appdata/main.visited` — אותו דפוס של `saveDaysState`. יש listener ב-`initRealtimeSync`, והשדה נדחף גם ב-`_resyncLocalDataToCloud` אחרי כניסה
- `refreshVisitedUI()` מרנדר מחדש את הטאב הפעיל (כולל `days`, ש-`refreshScheduleBadges` מדלגת עליו בכוונה)
- **כיסוי מלא — 110/110 כרטיסים**: אטרקציות 56/56 · מסעדות 26/26 · קינוחים 11/11 · צילום 10/10 · קניות 7/7, **וגם** בפופ-אפ פרטי התחנה (`showStopDetail`), בכרטיס התחנה בטאב ימים (תג ✅), ובדיאלוג הנעץ במפה
- **סימון מכל משטח משתקף בכולם**: `refreshVisitedUI()` מעדכן כפתורים במקום (`outerHTML` — תופס גם דיאלוג/פופ-אפ פתוח), מרנדר את הטאב הפעיל, מרנדר את `days` בנפרד, **ומצייר מחדש את נעצי המפה** כדי שהנעץ הירוק יתעדכן בלי מעבר טאב

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
