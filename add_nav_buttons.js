const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// Replace rec-item content to include navigation buttons
html = html.replace(
  '<h4>Kantýna (קנטינה)</h4>\n            <p>חוויית בשרים אולטימטיבית! בוחרים נתחים טריים מהקצב במקום ויושבים באולם מרשים. אל תפספסו את הקרפצ\'יו והסטייקים. אווירה רועשת ושמחה.</p>',
  `<h4>Kantýna (קנטינה)</h4>
            <p>חוויית בשרים אולטימטיבית! בוחרים נתחים טריים מהקצב במקום ויושבים באולם מרשים. אל תפספסו את הקרפצ'יו והסטייקים. אווירה רועשת ושמחה.</p>
            <a href="https://www.google.com/maps/search/Kantýna+Prague" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט לקנטינה</a>`
);

html = html.replace(
  '<h4>V Kolkovně</h4>\n            <p>מסעדה צ\'כית קלאסית בעיר העתיקה (רשת פילזנר אורקוול). ברווז צלוי מעולה, גולאש אותנטי, ומנות ילדים נוחות. כדאי להזמין מקום מראש!</p>',
  `<h4>V Kolkovně</h4>
            <p>מסעדה צ'כית קלאסית בעיר העתיקה (רשת פילזנר אורקוול). ברווז צלוי מעולה, גולאש אותנטי, ומנות ילדים נוחות. כדאי להזמין מקום מראש!</p>
            <a href="https://www.google.com/maps/search/V+Kolkovně+Prague" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט למסעדה</a>`
);

html = html.replace(
  '<h4>Naše maso</h4>\n            <p>קצביית בוטיק שמכינה צ\'יזבורגרים פסיכיים ונקניקיות פרימיום. המקום קטן מאוד (לרוב אוכלים בעמידה), אבל שווה כל ביס!</p>',
  `<h4>Naše maso</h4>
            <p>קצביית בוטיק שמכינה צ'יזבורגרים פסיכיים ונקניקיות פרימיום. המקום קטן מאוד (לרוב אוכלים בעמידה), אבל שווה כל ביס!</p>
            <a href="https://www.google.com/maps/search/Naše+maso+Prague" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט לקצבייה</a>`
);

html = html.replace(
  '<h4>Primark Wenceslas Square</h4>\n            <p>הסניף הענק והחדש (נפתח ב-2021). 3 קומות של ביגוד, הנעלה ומוצרי בית במחירים זולים במיוחד. טיפ: תגיעו מיד עם הפתיחה (09:00) כי התורים לקופות ולתאי המדידה הופכים לבלתי נסבלים בצהריים.</p>',
  `<h4>Primark Wenceslas Square</h4>
            <p>הסניף הענק והחדש (נפתח ב-2021). 3 קומות של ביגוד, הנעלה ומוצרי בית במחירים זולים במיוחד. טיפ: תגיעו מיד עם הפתיחה (09:00) כי התורים לקופות ולתאי המדידה הופכים לבלתי נסבלים בצהריים.</p>
            <a href="https://www.google.com/maps/search/Primark+Wenceslas+Square+Prague" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט לפריימארק</a>`
);

html = html.replace(
  '<h4>Palladium (פלדיום)</h4>\n            <p>הקניון הכי גדול ויפה במרכז העיר. למעלה מ-170 חנויות מותגים, קומת אוכל גדולה למעלה. בניין היסטורי שהפך לפנינת קניות ממוזגת!</p>',
  `<h4>Palladium (פלדיום)</h4>
            <p>הקניון הכי גדול ויפה במרכז העיר. למעלה מ-170 חנויות מותגים, קומת אוכל גדולה למעלה. בניין היסטורי שהפך לפנינת קניות ממוזגת!</p>
            <a href="https://www.google.com/maps/search/Palladium+Prague" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט לפלדיום</a>`
);

html = html.replace(
  '<h4>Fashion Arena Prague Outlet</h4>\n            <p>לאוהבי מותגים במבצעים - אאוטלט ענק בצורת מעגל בפאתי העיר. יש שאטלים ממרכז העיר או נסיעה במטרו A ל-Depo Hostivař ומשם אוטובוס חינם.</p>',
  `<h4>Fashion Arena Prague Outlet</h4>
            <p>לאוהבי מותגים במבצעים - אאוטלט ענק בצורת מעגל בפאתי העיר. יש שאטלים ממרכז העיר או נסיעה במטרו A ל-Depo Hostivař ומשם אוטובוס חינם.</p>
            <a href="https://www.google.com/maps/search/Fashion+Arena+Prague+Outlet" target="_blank" class="btn btn-outline" style="padding: 8px; margin-top: 8px; font-size: 14px;">🗺️ נווט לאאוטלט</a>`
);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
