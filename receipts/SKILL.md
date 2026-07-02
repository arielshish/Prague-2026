# 📊 Receipts Dashboard Skill

## מה זה
מערכת אוטומטית שמסנכרנת חשבוניות וקבלות מ-Gmail → Google Sheets → Web Dashboard.

## קבצים
| קובץ | תיאור |
|------|--------|
| `receipts-gas.js` | GAS script — סורק Gmail ומעדכן Sheets |
| `receipts-webapp.js` | GAS Web App — מציג דאשבורד HTML דינמי |
| `receipts-dashboard.html` | גרסת HTML סטטית של הדאשבורד |

## Google Sheet
- ID: `13s1Sr3fWICwSDYF1XjAyZuYEvr5tpADL262L87k3-8w`
- גיליונות: חשבוניות / סיכום / מינויים

## Web App URL
https://script.google.com/macros/s/AKfycbzpY4sBuTdkAWLhykEd7VrPLu7tgfwMFz3E18jRq1p4wvhNZMvOk6Bqf7WwnL2XWhEi/exec

## שימוש
1. פתח Apps Script בשיטס: Extensions → Apps Script
2. הדבק `receipts-gas.js` בקובץ קיים
3. הוסף קובץ חדש `webapp.js` והדבק `receipts-webapp.js`
4. הרץ `syncReceipts` לסנכרון ראשוני
5. Deploy → Web App לקבלת URL

## פונקציות עיקריות
- `syncReceipts()` — סורק Gmail ומעדכן Sheets
- `setupDailyTrigger()` — מגדיר עדכון יומי אוטומטי ב-07:00
- `doGet()` — מחזיר דאשבורד HTML דינמי
- `onOpen()` — מוסיף תפריט "📊 חשבוניות" לשיטס

## קטגוריות מזוהות
ספורט וחינוך, Apple, תקשורת, דיגיטל, נסיעות, קניות, עיריות, בית, AI, בידור, רכב, תחזוקה, תשלומים, טיפוח, אוכל, שירותים, בריאות
