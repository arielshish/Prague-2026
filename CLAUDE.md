# Prague 2026 — משפחת שיש

## מה הפרויקט
אפליקציית טיול משפחתית לפראג 2026. Single-page app (SPA) בעברית עם:
- מעקב הוצאות (CZK / ₪)
- תקציב לפי קטגוריות
- מסלול יומי
- צ'ק-ליסט אריזה
- מידע טיסות, מסעדות, קניות, מדריכים

## ארכיטקטורה

### שני מצבי הפעלה:
1. **GAS (script.google.com)** — הגרסה הראשית. מוגש דרך Google Apps Script. `google.script.run` עובד natively.
2. **GitHub Pages (arielshish.github.io/Prague-2026/app.html)** — גרסה לתצוגה מלאה ב-iOS. משתמשת ב-JSONP mock שמחקה `google.script.run`.

### קבצים עיקריים:
| קובץ | תפקיד |
|------|--------|
| `gas_project/index.html` | HTML שמוגש על ידי GAS (זהה ל-index.html) |
| `gas_project/Code.gs` | Backend של GAS — כל פונקציות השרת |
| `gas_project/appsscript.json` | הגדרות GAS (timezone, webapp, services) |
| `index.html` | עותק של gas_project/index.html (לsync) |
| `app.html` | גרסת GitHub Pages עם JSONP mock מוזרק |

### Google Spreadsheet:
- ID: `10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE`
- Sheets: `הוצאות`, `הגדרות`, `צ'קליסט`, `מסלול`

### Deployment:
- Deployment ID: `AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6`
- clasp scriptId: `1QwRZZlll_ZUcFjZZ5UJvnaoX0mdU2dD1AYMf9lwCSn_hqHd4nxscVud0`
- גרסה פעילה: @2 (יולי 2026)

## Deploy — תמיד ככה:
```bash
cd /home/user/Prague-2026/gas_project
clasp push
clasp deploy --deploymentId AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6 --description "תיאור"
```

## כללים חשובים

### gas_project/index.html חייב להיות נקי:
- **אסור** שיכיל JSONP mock או כל קוד שמחקה `google.script.run`
- חייב להיות זהה ל-`index.html` בשורש הפרויקט
- לבדוק: `diff index.html gas_project/index.html` — חייב להחזיר ריק

### Viewport tag:
- `gas_project/Code.gs` — `doGet` חייב לכלול `.addMetaTag('viewport', 'width=device-width, initial-scale=1')`
- `index.html` שורה 5 כולל `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- שתיהן קיימות בו-זמנית — זה בסדר (GAS דורש את שלו)

### כפתורים ב-iOS:
- כפתורים חשובים צריכים `onclick="functionName()"` ישירות על האלמנט (לא רק addEventListener)
- זה מבטיח שעובד ב-iOS Safari בתוך GAS iframe

### JSONP ב-app.html:
- `ALL_FNS` ב-mock חייב לכלול את כל הפונקציות שב-`dispatch_` ב-Code.gs
- פונקציות שנוספות ל-Code.gs צריכות להתווסף גם ל-ALL_FNS ב-app.html

### פונקציות שרת (Code.gs):
כל פונקציה שנקראת דרך `google.script.run` חייבת להיות מוגדרת ב-Code.gs:
- `saveTotalBudget(val)` → `saveSetting('total_budget', String(val))`
- `saveBudgetCategories(cats)` → `saveSetting('budget_categories', JSON.stringify(cats))`
- `loadBudgetSettings()` → מחזיר total_budget ו-budget_categories מ-Settings sheet

## בעיות ידועות וידע היסטורי

### iOS GAS "מלבן קטן":
Google מציגה GAS web apps ב-iOS בתוך iframe עם באנר אזהרה. **לא ניתן לתיקון מהקוד.** הפתרון: `app.html` ב-GitHub Pages מציג מלא מסך.

### CORS:
`fetch()` מ-GitHub Pages ל-GAS נכשל. הפתרון: JSONP (dynamic `<script>` tag injection).

### executeAs: USER_DEPLOYING:
`Session.getActiveUser().getEmail()` תמיד מחזיר `""` — לא ניתן לזהות משתמשים.

## אימיילים מורשים:
- arielshish@gmail.com
- maridubi3@gmail.com
- adiyasminshish@gmail.com
- ariel.mariana.shish@gmail.com
