# מדריך יצירת אפליקציית טיול גנרית — מבוסס Prague 2026

## ארכיטקטורה כללית

```
┌─────────────────────────────────────────────────┐
│                   app.html                       │
│  (Single HTML file — GitHub Pages + GAS served) │
├─────────────────────────────────────────────────┤
│  localStorage     Firebase Firestore    GAS+Sheets│
│  (מהיר, מקומי)  (sync בין מכשירים)  (backup+email)│
└─────────────────────────────────────────────────┘
```

**2 מצבי הרצה:**
- **GitHub Pages** — Firebase Firestore ישיר + localStorage
- **GAS Web App** — `google.script.run` + Firebase + Sheets

---

## מה להחליף לכל יעד חדש

### 1. קבועים בסיסיים (app.html — תחילת ה-JS)

```javascript
// ═══ החלף כל אלה ═══
var APP_PASSWORD  = 'FamilyDest2027';        // סיסמת כניסה
var SESSION_KEY   = 'dest_auth_ok';          // מפתח sessionStorage (ייחודי לפרויקט)
var RATE          = 7.5;                      // שע"ח מקומי לשקל (ברירת מחדל)
var RATE_KEY      = 'dest_rate_v1';          // localStorage key לשע"ח
var DAYS_KEY      = 'dest_days_v1';          // localStorage key לימי הטיול
var WEATHER_KEY   = 'dest_weather_v1';       // localStorage key למזג אוויר
var CURRENCY_CODE = 'EUR';                   // קוד מטבע
var CURRENCY_NAME = 'אירו';                  // שם מטבע בעברית
var CITY_LAT      = 48.85;                   // קו רוחב למזג אוויר
var CITY_LNG      = 2.35;                    // קו אורך למזג אוויר
var GAS_URL       = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
var TRIP_START_DATE = new Date('2027-07-01T05:00:00'); // לספירה לאחור
var TRIP_END_DATE   = new Date('2027-07-08');
```

### 2. Firebase (app.html — initializeApp)

```javascript
// פרויקט Firebase חדש לכל יעד — או אותו פרויקט עם collection שונה
_fbApp = firebase.initializeApp({
  apiKey:      'AIzaSy...',
  authDomain:  'tripname2027.firebaseapp.com',
  projectId:   'tripname2027'
});
```

**Firestore collections (ללא שינוי מבנה):**
```
appdata/main    → days_custom, expenses, packing_list, remindersDone
appdata/expenses → {data, ts}
appdata/pack    → {data, ts}
appdata/budget  → {total, ts}
```

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. כותרת ומטא

```html
<title>פריז 2027 - משפחת כהן</title>
```

### 4. ימי הטיול — DAYS array

```javascript
var DAYS = [
  {
    id: 1,
    date: '1 ביולי',
    emoji: '✈️',
    theme: 'הגעה',
    story: 'נוחתים בשארל דה גול...',
    peak: 'מגדל אייפל בלילה',
    mapUrl: 'https://maps.google.com/...',
    meals: { lunch: 'בדרך', dinner: 'מסעדה מקומית' },
    tips: ['קחו מטרו לעיר', 'לא ליקרת מונית'],
    stops: [
      {
        emoji: '🏨',
        name: 'Hotel du Louvre',
        time: '🌇 אחה"צ',
        desc: 'צ\'ק-אין ומנוחה',
        details: 'כתובת: Place André Malraux',
        tips: ['חינניון מאחורה'],
        booking: 'אישור הזמנה #12345',
        mapUrl: 'https://maps.google.com/...'
      }
    ]
  }
  // ... שאר הימים
];
```

**שדות חובה בכל stop:**
| שדה | תיאור |
|-----|--------|
| `emoji` | אמוג'י אייקון |
| `name` | שם התחנה |
| `time` | שעה/חלק יום (`🌅 בוקר` / `☀️ צהריים` / `🌇 אחה"צ` / `🌙 ערב`) |
| `desc` | תיאור קצר |
| `details` | פרטים מורחבים |
| `tips[]` | מערך טיפים |
| `booking` | פרטי הזמנה/מחיר |
| `mapUrl` | קישור Google Maps |

### 5. REMINDERS — תזכורות לפני הטיסה

```javascript
var REMINDERS = [
  {
    id: 'r1',
    cat: 'critical',           // 'critical' | 'important' | 'logistics'
    emoji: '🎫',
    title: 'הזמן כרטיסים למוזיאון הלובר',
    desc: 'כרטיסים מוקדמים חובה בקיץ',
    details: 'louvre.fr/en — 22€/אדם',
    url: 'https://www.louvre.fr',
    date: '15 ביוני',          // deadline
    days: ['יום 2', 'יום 4'],
    price: '22€',
    tips: 'הזמן בוקר מוקדם לפחות פחות צפוף',
    done: false
  }
];
```

**קטגוריות:**
- `critical` — אדום — הזמן עכשיו
- `important` — כתום — תוך שבועיים
- `logistics` — כחול — לוגיסטיקה

### 6. RESTAURANTS — מסעדות

```javascript
var RESTAURANTS = [
  {
    icon: '🥐',
    name: 'Café de Flore',
    sub: 'סאן-ז\'רמן-דה-פרה',
    desc: 'בית קפה היסטורי מ-1887',
    price: 25,                  // מחיר ממוצע למנה (במטבע המקומי)
    badge: '⭐ אייקוני',
    badgeClr: '#F59E0B',
    badgeTxt: '#92400E',
    mapUrl: 'https://maps.google.com/...',
    kosher: false,
    level: 2                    // 1-4 (רמת מחיר)
  }
];
```

### 7. PHOTO_SPOTS — נקודות צילום

```javascript
var PHOTO_SPOTS = [
  {
    icon: '🗼',
    name: 'מגדל אייפל',
    desc: 'הסמל של פריז',
    best: 'שקיעה ו-22:00 (אורות)',
    crowds: 'גבוהה — בוא מוקדם',
    tip: 'Trocadéro לצילום מלפנים',
    fee_txt: '26.80€ לקומה 3',
    mapUrl: 'https://maps.google.com/...',
    rating: '⭐⭐⭐⭐⭐'
  }
];
```

### 8. PACK_CATS — רשימת ציוד

```javascript
var PACK_CATS = [
  {
    cat: 'מסמכים 📄',
    items: [
      { id: 'p1', text: 'דרכון — Ariel (תוקף עד 2030)', done: false },
      { id: 'p2', text: 'כרטיסי טיסה — הדפסה', done: false },
      { id: 'p3', text: 'ביטוח נסיעות', done: false }
    ]
  },
  {
    cat: 'אלקטרוניקה 🔌',
    items: [
      { id: 'p10', text: 'מתאם חשמל (Type E — צרפת)', done: false },
      { id: 'p11', text: 'בנק סוללות', done: false }
    ]
  }
];
```

### 9. COMMUNITY — המלצות קהילה

```javascript
var COMMUNITY = [
  {
    id: 'c1',
    cat: '🍽️ מסעדות',
    emoji: '🥩',
    name: 'L\'Ami Louis',
    sub: 'פריז — מהטובות ביותר',
    desc: 'ביסטרו קלאסי מ-1924',
    badge: '💰💰💰',
    mapUrl: 'https://maps.google.com/...'
  }
];
```

### 10. ATTRACTIONS / HISTORY — תוכן היסטורי

```javascript
// טאב 'history' — מידע ורקע על היעד
var ATTRACTIONS = [
  {
    icon: '🏛️',
    name: 'הלובר',
    period: '1793 — היום',
    desc: 'המוזיאון הגדול בעולם...',
    tip: 'הזמן מוקדם, התמקד בקומה 1'
  }
];
```

### 11. FLIGHTS — פרטי טיסה

```javascript
// app.html — בתוך renderFlights() או כ-DATA
var FLIGHTS_DATA = {
  outbound: {
    airline: 'Air France',
    flight: 'AF123',
    from: 'TLV', fromName: 'בן גוריון',
    to: 'CDG', toName: 'שארל דה גול',
    dep: '2027-07-01T06:00',
    arr: '2027-07-01T09:30',
    pax: ['Ariel Cohen', 'Sarah Cohen', 'Yoav Cohen']
  },
  return: {
    airline: 'Air France',
    flight: 'AF456',
    from: 'CDG', fromName: 'שארל דה גול',
    to: 'TLV', toName: 'בן גוריון',
    dep: '2027-07-08T22:00',
    arr: '2027-07-09T02:30'
  }
};
```

### 12. מלון

```javascript
var HOTEL_DATA = {
  name: 'Hotel Le Marais',
  address: '15 Rue de Bretagne, Paris',
  stars: 4,
  checkin: '2027-07-01 14:00',
  checkout: '2027-07-08 12:00',
  mapUrl: 'https://maps.google.com/...',
  conf: '#CONF123456'
};
```

---

## Code.gs — מה להחליף

```javascript
// ═══ ראשית הקובץ — החלף אלה ═══
var SPREADSHEET_ID      = '1abc...xyz';           // Spreadsheet ID חדש
var SHEET_NAME          = 'הוצאות';               // ניתן לשמר
var SETTINGS_SHEET_NAME = 'הגדרות';               // ניתן לשמר
var APP_VERSION         = 'v1-paris-2027';
var DB_VERSION          = '2027-v1';
var TRIP_START          = new Date('2027-07-01');
var FIRESTORE_PROJECT   = 'paris2027';             // שם פרויקט Firebase
var FAMILY_EMAILS       = [
  'parent1@gmail.com',
  'parent2@gmail.com'
];
var REMINDERS_DEF = [ /* זהה ל-REMINDERS ב-app.html */ ];
```

**מבנה ה-Spreadsheet (צור Sheets אלה):**

| Sheet | עמודות |
|-------|--------|
| `הוצאות` | תאריך, שם, מקומי, שח, הערה |
| `הגדרות` | מפתח, ערך, עדכון אחרון |
| `Checklist` | ID, Category, Item, Done |
| `Days` | DayIndex, Icon, Title, Description, HeroImage, DBVersion |
| `PlacesBank` | ID, DayIndex, Type, Title, Description, Link, Priority, Hours, Price, Duration, Tip |
| `AppData` | Key, Value |

---

## תהליך הקמה — צ'ק-ליסט

### שלב 1 — Firebase
- [ ] צור פרויקט חדש ב-console.firebase.google.com
- [ ] הפעל Firestore Database
- [ ] הגדר rules: `allow read, write: if true`
- [ ] העתק `apiKey`, `authDomain`, `projectId`

### שלב 2 — Google Spreadsheet
- [ ] צור Spreadsheet חדש
- [ ] צור את 6 ה-Sheets לפי הטבלה למעלה
- [ ] העתק את ה-Spreadsheet ID מה-URL

### שלב 3 — Google Apps Script
- [ ] פתח script.google.com → פרויקט חדש
- [ ] העתק `Code.gs` ו-`appsscript.json`
- [ ] עדכן `SPREADSHEET_ID`, `FIRESTORE_PROJECT`, `FAMILY_EMAILS`, `REMINDERS_DEF`, `TRIP_START`
- [ ] פרוס: Deploy → New deployment → Web app → Access: Anyone
- [ ] העתק את ה-Deployment URL

### שלב 4 — app.html
- [ ] העתק `app.html` ממאגר Prague-2026 כבסיס
- [ ] החלף את כל 12 הסעיפים לעיל
- [ ] עדכן `GAS_URL` ל-URL החדש
- [ ] עדכן Firebase config
- [ ] שנה `<title>` ו-APP_PASSWORD

### שלב 5 — GitHub Pages
- [ ] צור repo חדש (ציבורי)
- [ ] העלה `app.html`, `robots.txt`
- [ ] הפעל GitHub Pages (Settings → Pages → main → root)
- [ ] URL: `https://USERNAME.github.io/REPO-NAME/app.html`

### שלב 6 — clasp (GAS sync מ-terminal)
```bash
mkdir gas_project && cd gas_project
# צור .clasp.json עם scriptId מה-GAS URL
clasp pull              # משוך קבצים קיימים
cp ../app.html index.html
clasp push
clasp deploy --description "Initial deploy"
```

---

## appsscript.json — שכפל בלי שינוי

```json
{
  "timeZone": "Asia/Jerusalem",
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/spreadsheets"
  ],
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```

---

## localStorage Keys — חייבים להיות ייחודיים לכל פרויקט

```
dest_auth_ok      ← sessionStorage
dest_days_v1      ← localStorage (ימי הטיול)
dest_rate_v1      ← localStorage (שע"ח)
dest_weather_v1   ← localStorage (מזג אוויר cache)
```

**שנה את הprefix `dest_` לשם הפרויקט** (לדוג' `paris_`, `rome_`, `tokyo_`) כדי שמכשיר שכבר ביקר ב-Prague-2026 לא יעמיס נתונים ישנים.

---

## טאבים — מה לשמר ומה להסיר/להוסיף

**גנרי לחלוטין (שמור תמיד):**
`home`, `days`, `expenses`, `pack`, `photodiary`, `lang`

**ספציפי — שנה לפי יעד:**
`shopping` — מרכזי קניות מקומיים
`restaurants` — מסעדות ביעד
`flights` — פרטי טיסה
`reminders` — משימות לפני הטיסה
`guides` / `history` — תוכן על היעד
`community` — המלצות

**הוסף לפי צורך:**
`transport` — תחבורה ציבורית מקומית
`maps` — מפות offline
`emergency` — מספרי חירום מקומיים

---

## הערות חשובות

1. **מטבע:** `RATE` + `CURRENCY_CODE` + `CURRENCY_NAME` — שלושתם ביחד. אם יש 2 מטבעות (לדוג' EUR + מטבע מקומי) — תוסיף RATE2.

2. **RTL:** הקוד כולו RTL. אם היעד לא ישראלי — לשמר RTL, הממשק בעברית לתמיד.

3. **מזג אוויר:** open-meteo.com — עדכן `lat`+`lng` בלבד.

4. **Photo Diary:** IndexedDB — לא קשור ליעד, עובד אוטומטית.

5. **GPS בתמונות:** קוד GPS מלא (כולל iOS/Safari fix) — שמור כמו שהוא.

6. **תזכורות אוטומטיות במייל:** דורשות `FAMILY_EMAILS` עדכני ב-Code.gs. מגיעות דרך GAS + Gmail API.

7. **Day Overload:** אוטומטי — מתריע כש-5+ תחנות ביום אחד. לא צריך לשנות.

8. **Drag & Drop:** אוטומטי — עובד על DAYS_STATE. לא צריך לשנות.
