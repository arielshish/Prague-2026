const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// --- 1. CSS INJECTIONS ---
const newCss = `
    .poi-sheet { padding: 0; overflow: hidden; border-radius: 32px 32px 0 0; }
    .poi-header { height: 240px; background: #e2e8f0; position: relative; background-size: cover; background-position: center; transition: background 0.3s ease; }
    .poi-header::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, white 0%, rgba(255,255,255,0.8) 15%, transparent 60%); }
    .close-btn { position: absolute; top: 16px; right: 16px; width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.85); border: 1px solid rgba(0,0,0,0.05); font-size: 16px; font-weight: bold; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); box-shadow: 0 6px 16px rgba(0,0,0,0.12); color: var(--navy); transition: all 0.2s; }
    .close-btn:active { transform: scale(0.9); }
    .poi-content { padding: 24px; position: relative; z-index: 2; margin-top: -20px; background: transparent; }
    .poi-content h2 { margin: 0 0 12px; color: var(--navy); font-size: 26px; font-weight: 800; line-height: 1.2; }
    .poi-content p { color: #475569; line-height: 1.6; font-size: 16px; margin: 0 0 20px; }
    .poi-tip { background: linear-gradient(135deg, #fffaf0, #fff7e6); border-right: 4px solid var(--gold); padding: 14px 18px; border-radius: 12px 0 0 12px; margin-bottom: 24px; display: flex; gap: 12px; align-items: flex-start; box-shadow: 0 4px 12px rgba(214,165,74,0.1); }
    .poi-tip::before { content: '💡'; font-size: 22px; margin-top: -2px; }
    .poi-tip-text { color: #854d0e; font-size: 14px; line-height: 1.5; font-weight: 600; margin:0; }
    .full-width { width: 100%; display: flex; justify-content: center; padding: 14px; font-size: 16px; }
    
    .stop { cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-right: 4px solid transparent; }
    .stop:active { transform: scale(0.97); }
    .stop:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(15,35,55,.12); border-right: 4px solid var(--accent); }
    .stop::after { content: '👈'; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); opacity: 0; transition: all 0.3s; font-size: 18px; filter: grayscale(1); }
    .stop:hover::after { opacity: 1; left: 10px; filter: grayscale(0); }
`;

html = html.replace('</style>', newCss + '\n  </style>');

// --- 2. HTML INJECTIONS ---
const newHtml = `
  <div id="poiModal" class="modal">
    <div class="poi-sheet sheet" style="max-height: 92vh;">
      <button class="close-btn" onclick="closePoi()">✕</button>
      <div class="poi-header" id="poiImage"></div>
      <div class="poi-content">
        <h2 id="poiTitle">שם המקום</h2>
        <p id="poiDesc">תיאור</p>
        <div class="poi-tip" id="poiTip"></div>
        <a id="poiMapBtn" class="btn full-width" target="_blank" href="#">🗺️ פתח מפה ונווט</a>
      </div>
    </div>
  </div>
  <div id="toast" class="toast"></div>
`;

html = html.replace('<div id="toast" class="toast"></div>', newHtml);


// --- 3. JS INJECTIONS ---
const newJs = `
    var POIS_DATA = {
      'Old Town Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg', desc: 'כיכר העיר העתיקה היא הלב הפועם של פראג. סביבה מבנים צבעוניים מהממים, כרכרות סוסים והמון מסעדות.', tip: 'מקום מושלם להצטלם עם בועות הסבון הענקיות שיש בדרך כלל בכיכר!' },
      'Astronomical Clock': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Prague_Astronomical_Clock_%2848386348421%29.jpg/800px-Prague_Astronomical_Clock_%2848386348421%29.jpg', desc: 'השעון האסטרונומי המפורסם והעתיק ביותר שעדיין פועל בעולם (משנת 1410).', tip: 'הגיעו כ-10 דקות לפני שעה עגולה כדי לתפוס מקום טוב למופע הבובות הקצר של השעון.' },
      'Charles Bridge': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Charles_Bridge_in_Prague_at_sunset.jpg/800px-Charles_Bridge_in_Prague_at_sunset.jpg', desc: 'גשר אבן עתיק ויפהפה מעל נהר הוולטאבה, מעוטר ב-30 פסלים מרהיבים של קדושים.', tip: 'השתדלו להגיע מוקדם בבוקר כדי להימנע מהעומס, או בשקיעה לתמונות מדהימות של הטירה.' },
      'Prague Castle': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg', desc: 'מתחם הטירה הגדול בעולם! כולל את קתדרלת ויטוס הקדוש המרשימה, ארמונות וגנים.', tip: 'יש טקס חילופי משמרות מרשים בשעה 12:00 בדיוק בחצר הראשונה, כולל תזמורת!' },
      'Golden Lane': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Golden_Lane.jpg/800px-Golden_Lane.jpg', desc: 'סמטת הזהב הקסומה בתוך מתחם הטירה, עם בתים צבעוניים וקטנטנים שבעבר גרו בהם שומרים וצורפים.', tip: 'תנו לילדים לחפש את השריונות הישנים ואת הנשקייה העתיקה שבקומה העליונה של הבתים.' },
      'Kingdom of Railways': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg', desc: 'ממלכת הרכבות המיניאטוריות הגדולה בצ\\'כיה. עולם שלם בקטן, כולל יום ולילה שמתחלפים.', tip: 'מעולה לילדים ומבוגרים כאחד! יש גם סימולטורים של רכבות ואוטובוסים שאפשר "לנהוג" בהם.' },
      'Hamleys': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Hamleys_Prague_2.jpg/800px-Hamleys_Prague_2.jpg', desc: 'חנות הצעצועים העצומה במרכז העיר, שכוללת הרבה מעבר לקניות - זו ממש חוויה אטרקטיבית.', tip: 'אל תפספסו את מגלשת הענק המפותלת בתוך החנות (חינם) ואת קרוסלת הסוסים בקומה התחתונה!' },
      'Hamleys / LEGO': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Hamleys_Prague_2.jpg/800px-Hamleys_Prague_2.jpg', desc: 'המרכז המסחרי של פראג מציע את חנות המותג המושקעת של LEGO לצד חנות Hamleys המטורפת.', tip: 'בחנות הלגו תוכלו להרכיב דמויות מיניאטוריות שדומות לכם ואפילו להצטלם איתן.' },
      'Aquapalace Prague': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg', desc: 'פארק המים המקורה הגדול ביותר במרכז אירופה, עם עולם מים מרתק, מגלשות אקסטרים ובריכות גלים.', tip: 'תביאו איתכם מגבות מהמלון כדי לחסוך עמלות. מתאים מאוד כפתרון מושלם ליום גשום.' },
      'Prague Zoo': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg', desc: 'נחשב לאחד מגני החיות הטובים והיפים בעולם, ממוקם על צלע הר ומשתרע על שטח ענק.', tip: 'הגן מחולק למפלס תחתון ועליון. מומלץ לעלות ברכבל הכיסאות הקטן לחלק העליון ולרדת ברגל כדי לחסוך עליות קשות.' },
      'Primark Wenceslas Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Wenceslas_Square_-_Primark_Prague.jpg/800px-Wenceslas_Square_-_Primark_Prague.jpg', desc: 'חנות האופנה הענקית והפופולרית בכיכר ואצלב. 3 קומות של ביגוד במחירים נוחים.', tip: 'הגיעו כמה שיותר קרוב לשעת הפתיחה (09:00 בבוקר), אחרת תתקלו בתורים עצומים למדידות ולקופות.' },
      'Palladium': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg', desc: 'קניון ענק ויפהפה במרכז העיר, בנוי בתוך מבנה היסטורי מרשים (לשעבר קסרקטין).', tip: 'בקומת האוכל למעלה (Food Court) יש מבחר עצום של אפשרויות לכולם במקום אחד, במחירים הוגנים.' },
      'פארק Stromovka': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Stromovka_%28Prague%29.jpg/800px-Stromovka_%28Prague%29.jpg', desc: 'הסנטרל פארק של פראג! פארק ירוק, ענק ושקט עם עצים עתיקים ואגמים קטנים.', tip: 'מושלם לפיקניק רגוע או לתת לילדים לפרוק מרץ במדשאות הפתוחות.' }
    };

    function openPoi(stopName) {
      var data = POIS_DATA[stopName] || { 
        desc: 'נקודת עניין מרתקת במסלול היומי. פראג מלאה בפינות חמד היסטוריות וקסומות.', 
        tip: 'הכינו את המצלמות ותיהנו מהאווירה המיוחדת.',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Prague_collage.jpg/800px-Prague_collage.jpg' 
      };
      
      var url = 'https://www.google.com/maps/search/' + encodeURIComponent(stopName + ' Prague');
      
      qs('poiTitle').textContent = stopName;
      qs('poiDesc').textContent = data.desc;
      qs('poiTip').innerHTML = '<p class="poi-tip-text">' + data.tip + '</p>';
      qs('poiMapBtn').href = url;
      qs('poiImage').style.backgroundImage = "url('" + data.img + "')";
      
      qs('poiModal').classList.add('show');
    }

    function closePoi() {
      qs('poiModal').classList.remove('show');
    }
`;

html = html.replace('function renderDays(){', newJs + '\n    function renderDays(){');

// 4. Update the renderDays function
html = html.replace(
  "qs('dayTimeline').innerHTML=d.st.map(function(s){var url='https://www.google.com/maps/search/'+encodeURIComponent(s+' Prague');return '<div class=\"stop\"><h4>📍 '+s+'</h4><p class=\"muted\">תחנה במסלול היום</p><a class=\"btn small secondary\" target=\"_blank\" href=\"'+url+'\">נווט</a></div>'}).join('')}",
  "qs('dayTimeline').innerHTML=d.st.map(function(s){return '<div class=\"stop\" onclick=\"openPoi(\\\''+s.replace(/'/g, '\\\\\\'')+'\\\')\"><h4>📍 '+s+'</h4><p class=\"muted\">לחץ למידע, טיפים ותמונות 📸</p></div>'}).join('')}"
);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
