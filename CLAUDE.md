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

> עדכון אחרון: 2026-07-18

### מבנה נתונים מרכזי
- `COMMUNITY[]` — בנק אטרקציות: `{cat, icon, name, fb, google, desc, booking, duration, tips, who, how, mapUrl}`
- `RESTAURANTS[]` — מסעדות: `{level, icon, name, sub, desc, price, badge, badgeClr, badgeTxt, google, mapUrl}`
- `DAYS[]` — לוז ראשוני: ימים עם stops: `{emoji, name, time, desc, details, tips, booking, mapUrl, google, duration, who}`
- `getDaysState()` — מחזיר את מצב הימים הנוכחי (Firestore / local)
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
- `renderRestaurants()`: מציג תג זהה אם מסעדה קיימת ב-DAYS (בנוסף ל-`restaurantsSchedule`)
- מבוסס על `findItemInDays()` — תמיד live מ-Firestore

### כללי עבודה
- **לפני שינוי גדול**: `git tag backup-<תיאור>-<תאריך>` + push
- **branch**: `claude/unknown-session-xpa0pr` → PR → merge ל-`main`
- **אחרי כל פיצ'ר**: עדכן סעיף זה + skill ב-`.claude/skills/prague-2026.md`
- **ציוני Google**: אימות רק מ-top-rated.online / TripAdvisor — לא להמציא

## איך לערוך את האפליקציה

**אף פעם לא לערוך `index.html` או `gas_project/Code.gs` כאן — הם לא קיימים בריפו הזה בכלל.**

1. ערוך `app.html` כאן.
2. שכפל גם את `arielshish/Prague-2026-backend` **לצד** הריפו הזה (siblings, אותה תיקיית אב).
3. ב-`Prague-2026-backend`, הרץ `python3 sync_gas.py` — זה קורא את `app.html` מכאן ומעדכן את `gas_project/index.html` שם.
4. לפריסת GAS: לך ל-`Prague-2026-backend` — כל הוראות ה-deploy וה-CLAUDE.md המלא נמצאים שם.
