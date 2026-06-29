import re

user_html = """
<div id="tab-food" class="tab">
<style>
#tab-food .hero{background:linear-gradient(135deg,var(--navy),#244b70);color:white;padding:24px;border-radius:24px;margin-bottom:20px;box-shadow:var(--shadow-sm);}
#tab-food .hero h1{margin:0;font-size:24px;color:white;}
#tab-food .hero p{margin:10px 0 0;color:#dbeafe;font-size:14px;}
#tab-food .panel{background:var(--surface);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow-sm);padding:20px;margin-bottom:20px;}
#tab-food h2{color:var(--navy);margin:0 0 16px;font-size:20px;border-bottom:2px solid var(--line);padding-bottom:8px;} 
#tab-food h3{color:var(--navy);margin:0 0 8px;font-size:18px;}
#tab-food .grid{display:grid;grid-template-columns:1fr;gap:16px;}
#tab-food .card{background:var(--bg);border:1px solid var(--line);border-radius:20px;padding:16px;}
#tab-food .card h3{display:flex;align-items:center;gap:8px;font-size:17px;color:var(--accent);}
#tab-food .meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}
#tab-food .pill{display:inline-flex;border-radius:12px;background:var(--line);color:var(--text);padding:4px 10px;font-size:12px;font-weight:600;}
#tab-food .priority{background:rgba(244,63,94,0.1);color:var(--accent);}
#tab-food .route{border-right:4px solid var(--accent);background:rgba(245,158,11,0.1);border-radius:12px;padding:12px;margin:12px 0;color:var(--text);font-size:14px;line-height:1.5;}
#tab-food ul{margin:8px 0 0;padding:0 20px;color:var(--text-light);font-size:14px;line-height:1.6;} 
#tab-food li{margin:6px 0;}
#tab-food p{color:var(--text);font-size:14px;line-height:1.6;margin:8px 0;}
#tab-food .day{display:grid;grid-template-columns:1fr;gap:12px;border-bottom:1px solid var(--line);padding:16px 0;}
#tab-food .day:last-child{border-bottom:0;} 
#tab-food .day strong{color:var(--accent);font-size:18px;}
#tab-food .summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
#tab-food .summary .card{text-align:center;}
#tab-food .big{font-size:28px;color:var(--accent);font-weight:900;}
#tab-food .note{background:rgba(245,158,11,0.1);border:1px solid var(--gold);border-radius:16px;padding:16px;color:#B45309;font-size:13px;line-height:1.5;}
#tab-food .toc{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
#tab-food .toc a{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:8px 16px;color:var(--navy);text-decoration:none;font-weight:700;font-size:13px;}
</style>

<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
  <button class="btn btn-outline" style="width:auto; padding:8px 16px; border-radius:20px; font-size:14px;" onclick="switchTab('home')">🏠 חזור לדאשבורד</button>
</div>

<header class="hero">
  <h1>מדריך פראג המלא</h1>
  <p>חלוקה לפי קטגוריות, המלצות לכל מקום, טיפים וזמנים.</p>
</header>

<section class="panel">
<h2>תקציר מהיר</h2>
<div class="summary">
<div class="card"><div class="big">5</div><div>אזורי חובה</div></div>
<div class="card"><div class="big">5</div><div>משפחה/גשם</div></div>
<div class="card"><div class="big">5</div><div>מרכזי קניות</div></div>
<div class="card"><div class="big">8</div><div>ימי מסלול</div></div>
</div>
<p class="note"><b>נקודת מוצא:</b> Comfort Hotel Prague City East. במסלולים כתבתי יציאה כללית דרך מטרו A (תחנת Strašnická).</p>
<div class="toc"><a href="#days_guide">ימים</a><a href="#cat0">חובה</a><a href="#cat1">משפחה/גשם</a><a href="#cat2">קניות</a><a href="#cat3">אזורים</a></div>
</section>

<section id="days_guide" class="panel"><h2>חלוקה מומלצת לימים</h2>
<div class="day"><strong>יום 1</strong><div><h3>הגעה והתארגנות</h3><div class="meta"><span class="pill">📍 נחיתה</span><span class="pill">📍 נסיעה למלון</span></div><p><b>המלצה:</b> סופר/ארוחה/סיבוב קצר. לא לדחוס אטרקציות.</p></div></div>
<div class="day"><strong>יום 2</strong><div><h3>העיר העתיקה הקלאסית</h3><div class="meta"><span class="pill">📍 כיכר העיר</span><span class="pill">📍 השעון</span><span class="pill">📍 גשר קארל</span></div><p><b>המלצה:</b> להתחיל מוקדם, לשמור את הערב לשיטוט רגוע.</p></div></div>
<div class="day"><strong>יום 3</strong><div><h3>טירת פראג</h3><div class="meta"><span class="pill">📍 טירה</span><span class="pill">📍 קתדרלה</span><span class="pill">📍 Kampa</span></div><p><b>המלצה:</b> הרבה הליכה ואבנים — נעליים נוחות חובה.</p></div></div>
<div class="day"><strong>יום 4</strong><div><h3>משפחה ורכבות</h3><div class="meta"><span class="pill">📍 Kingdom of Railways</span><span class="pill">📍 Hamleys</span></div><p><b>המלצה:</b> יום של חוויות לילדים.</p></div></div>
<div class="day"><strong>יום 5</strong><div><h3>מים או גשם</h3><div class="meta"><span class="pill">📍 Aquapalace</span><span class="pill">📍 או מוזיאון</span></div><p><b>המלצה:</b> יום גמיש לפי מזג אוויר ועייפות.</p></div></div>
<div class="day"><strong>יום 6</strong><div><h3>Prague Zoo</h3><div class="meta"><span class="pill">📍 Zoo</span><span class="pill">📍 Stromovka</span></div><p><b>המלצה:</b> לא לשלב עם קניות כבדות. זה יום בפני עצמו.</p></div></div>
<div class="day"><strong>יום 7</strong><div><h3>קניות במרכז</h3><div class="meta"><span class="pill">📍 Primark</span><span class="pill">📍 Palladium</span></div><p><b>המלצה:</b> להתחיל ב-Primark בבוקר אחרת עמוס מדי.</p></div></div>
<div class="day"><strong>יום 8</strong><div><h3>חזרה</h3><div class="meta"><span class="pill">📍 אריזה</span><span class="pill">📍 נסיעה לשדה</span></div><p><b>המלצה:</b> לא לבנות על קניות של הרגע האחרון.</p></div></div>
</section>

<section id="cat0" class="panel"><h2>🕰️ אטרקציות חובה</h2><div class="grid">
<article class="card">
<h3><span>🕰️</span>כיכר העיר והשעון</h3>
<div class="meta"><span class="pill priority">עדיפות: חובה</span><span class="pill">משך: 90 דק'</span></div>
<p><b>למה להגיע:</b> הלב הקלאסי, שעון אסטרונומי ומופע בכל שעה.</p>
<div class="route"><b>הגעה:</b> מטרו A ל-Staroměstská.</div>
<p><b>טיפים:</b> לעמוד מול השעון 5 דקות לפני שעה עגולה. להיזהר מכייסים.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Old+Town+Square+Prague">🗺️ ניווט מפות</a>
</article>
<article class="card">
<h3><span>🕰️</span>גשר קארל</h3>
<div class="meta"><span class="pill priority">עדיפות: חובה</span><span class="pill">משך: 60 דק'</span></div>
<p><b>למה להגיע:</b> סמל פראג, נוף לנהר, אמני רחוב.</p>
<div class="route"><b>הגעה:</b> קרוב לכיכר העיר. הליכה רגלית.</div>
<p><b>טיפים:</b> בבוקר מוקדם ריק, בצהריים עמוס בטירוף.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/place/Charles+Bridge">🗺️ ניווט מפות</a>
</article>
<article class="card">
<h3><span>🕰️</span>טירת פראג</h3>
<div class="meta"><span class="pill priority">עדיפות: חובה</span><span class="pill">משך: 3 שעות</span></div>
<p><b>למה להגיע:</b> מתחם ענק, קתדרלה מרהיבה, תצפיות לעיר.</p>
<div class="route"><b>הגעה:</b> טראם 22/23 ל-Pražský hrad כדי להימנע מהעלייה התלולה.</div>
<p><b>טיפים:</b> חילופי משמר ב-12:00. לרדת מהטירה רגלית לכיוון העיר.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/place/Prague+Castle">🗺️ ניווט מפות</a>
</article>
</div></section>

<section id="cat1" class="panel"><h2>👨‍👩‍👧 משפחה / יום גשם</h2><div class="grid">
<article class="card">
<h3><span>👨‍👩‍👧</span>Kingdom of Railways</h3>
<div class="meta"><span class="pill priority">מומלץ למשפחה</span><span class="pill">משך: 120 דק'</span></div>
<p><b>למה להגיע:</b> מודל רכבות מיניאטוריות מרתק לילדים.</p>
<div class="route"><b>הגעה:</b> מטרו B ל-Anděl.</div>
<p><b>טיפים:</b> מושלם ליום גשם. אפשר לשלב עם קניון Nový Smíchov.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Kingdom+of+Railways+Prague">🗺️ ניווט</a>
</article>
<article class="card">
<h3><span>👨‍👩‍👧</span>Hamleys + LEGO</h3>
<div class="meta"><span class="pill priority">מומלץ לילדים</span><span class="pill">משך: 90 דק'</span></div>
<p><b>למה להגיע:</b> חנות צעצועים ענקית וחווייתית.</p>
<div class="route"><b>הגעה:</b> צמוד לשדרות ואצלב ו-Primark (תחנת Můstek).</div>
<p><b>טיפים:</b> כדאי אחרי קניות מתישות בפרימארק כפיצוי לילדים.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Hamleys+Prague">🗺️ ניווט</a>
</article>
<article class="card">
<h3><span>👨‍👩‍👧</span>Prague Zoo</h3>
<div class="meta"><span class="pill priority">חובה ביום יפה</span><span class="pill">משך: חצי יום</span></div>
<p><b>למה להגיע:</b> גן חיות מהמם וענק (טופ 5 בעולם).</p>
<div class="route"><b>הגעה:</b> אוטובוס 112 מתחנת Nádraží Holešovice (מטרו C).</div>
<p><b>טיפים:</b> הרבה הליכה. לא לשלב עם עוד פעילות גדולה באותו יום.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/place/Prague+Zoo">🗺️ ניווט</a>
</article>
<article class="card">
<h3><span>👨‍👩‍👧</span>Aquapalace</h3>
<div class="meta"><span class="pill priority">מעולה לגשם/חום</span><span class="pill">משך: חצי יום</span></div>
<p><b>למה להגיע:</b> פארק מים ענק, רובו מקורה.</p>
<div class="route"><b>הגעה:</b> לרוב נוח ב-Bolt/Uber (כחצי שעה מהמרכז).</div>
<p><b>טיפים:</b> להביא מגבות מהמלון.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/place/Aquapalace+Prague">🗺️ ניווט</a>
</article>
</div></section>

<section id="cat2" class="panel"><h2>🛍️ קניות בולטות</h2><div class="grid">
<article class="card">
<h3><span>🛍️</span>Primark</h3>
<div class="meta"><span class="pill priority">חובה לשופינג</span><span class="pill">אזור: ואצלב</span></div>
<p><b>למה להגיע:</b> 3 קומות של מחירי רצפה לבגדים ואביזרים.</p>
<div class="route"><b>הגעה:</b> מטרו A לתחנת Můstek.</div>
<p><b>טיפים:</b> להגיע ב-09:00 בדיוק. בצהריים התורים בלתי אפשריים.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Primark+Prague">🗺️ ניווט</a>
</article>
<article class="card">
<h3><span>🛍️</span>Palladium</h3>
<div class="meta"><span class="pill priority">קניון מרכזי</span><span class="pill">אזור: Náměstí Republiky</span></div>
<p><b>למה להגיע:</b> 170 חנויות בלב העיר במבנה היסטורי.</p>
<div class="route"><b>הגעה:</b> אפשר ללכת רגלית מכיכר העיר או ואצלב דרך Na Příkopě.</div>
<p><b>טיפים:</b> קומת האוכל למעלה טובה לארוחה משפחתית משותפת.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/place/Palladium">🗺️ ניווט</a>
</article>
<article class="card">
<h3><span>🛍️</span>Westfield Chodov</h3>
<div class="meta"><span class="pill priority">ביום גשם</span><span class="pill">אזור: מחוץ למרכז</span></div>
<p><b>למה להגיע:</b> קניון ענק ומודרני מאוד (יותר מפלדיום).</p>
<div class="route"><b>הגעה:</b> מטרו C ישירות לתחנת Chodov.</div>
<p><b>טיפים:</b> נסיעה של 20 דק' ממרכז העיר.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Westfield+Chodov">🗺️ ניווט</a>
</article>
</div></section>

<section id="cat3" class="panel"><h2>🚶 אזורי שיטוט</h2><div class="grid">
<article class="card">
<h3><span>🚶</span>Malá Strana</h3>
<div class="meta"><span class="pill priority">רומנטי/צילומים</span></div>
<p><b>למה להגיע:</b> קיר לנון, האי קמפה (Kampa), רחובות ציוריים מתחת לטירה.</p>
<p><b>טיפים:</b> לרדת ברגל מטירת פראג דרך האזור הזה עד לגשר קארל.</p>
<a class="btn" target="_blank" href="https://www.google.com/maps/search/Lennon+Wall">🗺️ ניווט מפות</a>
</article>
<article class="card">
<h3><span>🚶</span>Na Příkopě + Pařížská</h3>
<div class="meta"><span class="pill priority">יוקרה וקניות</span></div>
<p><b>למה להגיע:</b> Na Příkopě זו שדרת המותגים הרגילים. Pařížská רחוב מעצבי העל היוקרתי מכיכר העיר לנהר.</p>
<p><b>טיפים:</b> טוב למעבר נעים בין אזורי העיר.</p>
</article>
</div></section>
</div>
"""

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
old_tab_food = re.search(r'<div id="tab-food" class="tab">.*?</main>', html, re.DOTALL).group(0)

# We want to replace everything inside tab-food with our new html, and preserve </main>
html = html.replace(old_tab_food, user_html + '\n\n    </main>')

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
