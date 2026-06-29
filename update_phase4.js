const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// 1. Add hero images to DAYS array
const oldDays = `var DAYS = [
      { e: '🛬', t: 'נחיתה והגעה', s: 'נחיתה בפראג, נסיעה ל-Comfort Hotel East והתארגנות קלילה בעיר.', st: ['נחיתה בפראג', 'Comfort Hotel Prague City East', 'ארוחת ערב רגועה'] },
      { e: '🏰', t: 'העיר העתיקה', s: 'סיור במרכז ההיסטורי, השעון האסטרונומי וגשר קארל.', st: ['נסיעה במטרו למרכז', 'Old Town Square', 'Astronomical Clock', 'Charles Bridge'] },
      { e: '👑', t: 'טירת פראג', s: 'עלייה לטירה, סמטת הזהב ותצפית שקיעה מטורפת.', st: ['חשמלית לטירת פראג', 'Prague Castle', 'Golden Lane', 'תצפית שקיעה'] },
      { e: '🧸', t: 'ילדים וכייף', s: 'ממלכת הרכבות המדהימה וחנות הצעצועים Hamleys.', st: ['Kingdom of Railways', 'Hamleys', 'קינוח טרדלניק במרכז'] },
      { e: '💦', t: 'פארק מים', s: 'יום פינוק ב-Aquapalace - הפארק המקורה הענק.', st: ['נסיעה ל-Aquapalace', 'Aquapalace Prague', 'ארוחת ערב בקניון'] },
      { e: '🐘', t: 'גן חיות וטבע', s: 'גן החיות העצום של פראג ומנוחה בפארק ליד.', st: ['נסיעה לגן החיות', 'Prague Zoo', 'פארק Stromovka'] },
      { e: '🛍️', t: 'יום קניות', s: 'השלמת מתנות ופינוקים בפריימארק ופלדיום.', st: ['Primark Wenceslas Square', 'הליכה דרך כיכר ואצלב', 'Palladium', 'ארוחת סיום'] },
      { e: '🛫', t: 'חוזרים הביתה', s: 'אריזות, פרידה מהמלון ונסיעה לשדה.', st: ['צ׳ק-אאוט מהמלון', 'נסיעה לשדה התעופה'] }
    ];`;

const newDays = `var DAYS = [
      { e: '🛬', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg', t: 'נחיתה והגעה', s: 'נחיתה בפראג, נסיעה ל-Comfort Hotel East והתארגנות קלילה בעיר.', st: ['נחיתה בפראג', 'Comfort Hotel Prague City East', 'ארוחת ערב רגועה'] },
      { e: '🏰', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg', t: 'העיר העתיקה', s: 'סיור במרכז ההיסטורי, השעון האסטרונומי וגשר קארל.', st: ['נסיעה במטרו למרכז', 'Old Town Square', 'Astronomical Clock', 'Charles Bridge'] },
      { e: '👑', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg', t: 'טירת פראג', s: 'עלייה לטירה, סמטת הזהב ותצפית שקיעה מטורפת.', st: ['חשמלית לטירת פראג', 'Prague Castle', 'Golden Lane', 'תצפית שקיעה'] },
      { e: '🧸', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg', t: 'ילדים וכייף', s: 'ממלכת הרכבות המדהימה וחנות הצעצועים Hamleys.', st: ['Kingdom of Railways', 'Hamleys', 'קינוח טרדלניק במרכז'] },
      { e: '💦', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg', t: 'פארק מים', s: 'יום פינוק ב-Aquapalace - הפארק המקורה הענק.', st: ['נסיעה ל-Aquapalace', 'Aquapalace Prague', 'ארוחת ערב בקניון'] },
      { e: '🐘', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg', t: 'גן חיות וטבע', s: 'גן החיות העצום של פראג ומנוחה בפארק ליד.', st: ['נסיעה לגן החיות', 'Prague Zoo', 'פארק Stromovka'] },
      { e: '🛍️', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg', t: 'יום קניות', s: 'השלמת מתנות ופינוקים בפריימארק ופלדיום.', st: ['Primark Wenceslas Square', 'הליכה דרך כיכר ואצלב', 'Palladium', 'ארוחת סיום'] },
      { e: '🛫', hero: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg', t: 'חוזרים הביתה', s: 'אריזות, פרידה מהמלון ונסיעה לשדה.', st: ['צ׳ק-אאוט מהמלון', 'נסיעה לשדה התעופה'] }
    ];`;

html = html.replace(oldDays, newDays);

// 2. Add hero div to DOM in tab-days
const oldTabDays = `<div style="background:var(--surface); border-radius:24px; padding:20px; box-shadow:var(--shadow-sm); border:1px solid var(--line);">
          <h3 id="dayTitle" style="margin:0 0 8px; font-size:20px; color:var(--navy);"></h3>`;

const newTabDays = `<div class="day-hero-container">
          <div id="dayHero" class="day-hero"></div>
        </div>
        <div style="background:var(--surface); border-radius:24px; padding:20px; box-shadow:var(--shadow-sm); border:1px solid var(--line); position:relative; z-index:2; margin-top:-30px;">
          <h3 id="dayTitle" style="margin:0 0 8px; font-size:20px; color:var(--navy);"></h3>`;

html = html.replace(oldTabDays, newTabDays);

// 3. Update selectDay function to set hero background
const oldSelectDay = `const day = DAYS[index];
      id('dayTitle').textContent = day.t;`;

const newSelectDay = `const day = DAYS[index];
      id('dayTitle').textContent = day.t;
      id('dayHero').style.backgroundImage = "url('" + day.hero + "')";`;

html = html.replace(oldSelectDay, newSelectDay);

// 4. Add Fairy Tale CSS
const newCss = `
    /* Fairy Tale CSS Enhancements */
    body { background-image: radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.05) 0%, transparent 70%); }
    .dark-mode body { background-image: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%); }
    
    .day-hero-container { position: relative; z-index: 1; padding: 0 4px; }
    .day-hero { 
      width: 100%; height: 220px; border-radius: 24px; background-size: cover; background-position: center; 
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2), 0 0 0 2px rgba(245, 158, 11, 0.5); 
      animation: magicFloat 6s ease-in-out infinite; 
      position: relative; overflow: hidden;
    }
    .day-hero::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 60%);
    }

    @keyframes magicFloat { 
      0%, 100% { transform: translateY(0); box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2), 0 0 0 2px rgba(245, 158, 11, 0.3); } 
      50% { transform: translateY(-6px); box-shadow: 0 25px 45px rgba(15, 23, 42, 0.3), 0 0 15px 2px rgba(245, 158, 11, 0.6); } 
    }
    
    .stop-card {
      transition: transform 0.3s, box-shadow 0.3s;
      border-left: 3px solid transparent;
    }
    .stop-card:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 24px var(--accent-glow);
      border-left-color: var(--gold);
    }
    
    .magic-sparkles {
      position: fixed; inset: 0; pointer-events: none; z-index: -1;
      background-image: 
        radial-gradient(2px 2px at 20px 30px, #F59E0B, rgba(0,0,0,0)),
        radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)),
        radial-gradient(3px 3px at 50px 160px, rgba(244,63,94,0.8), rgba(0,0,0,0)),
        radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0));
      background-repeat: repeat;
      background-size: 200px 200px;
      opacity: 0.3;
      animation: sparkleAnim 60s linear infinite;
    }
    .dark-mode .magic-sparkles { opacity: 0.6; }
    
    @keyframes sparkleAnim {
      from { background-position: 0 0; }
      to { background-position: 200px 600px; }
    }
    /* End Fairy Tale Enhancements */
  </style>
`;
html = html.replace('</style>', newCss);

// Add the magical sparkles div right after body
html = html.replace('<body>', '<body>\n  <div class="magic-sparkles"></div>');

fs.writeFileSync('gas_project/index.html', html, 'utf8');
