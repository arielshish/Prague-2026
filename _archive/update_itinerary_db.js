const fs = require('fs');

let gs = fs.readFileSync('gas_project/Code.gs', 'utf8');

const dbFuncs = `
const DAYS_SHEET_NAME = 'Days';
const ATTRACTIONS_SHEET_NAME = 'Attractions';

function initItineraryDB() {
  var ss = getSpreadsheet_();
  var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
  
  if (!daysSheet) {
    daysSheet = ss.insertSheet(DAYS_SHEET_NAME);
    daysSheet.getRange(1, 1, 1, 5).setValues([['DayIndex', 'Icon', 'Title', 'Description', 'HeroImage']]);
    daysSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    
    var defaultDays = [
      [0, '🛬', 'נחיתה והגעה', 'נחיתה בפראג, נסיעה ל-Comfort Hotel East והתארגנות קלילה בעיר.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg'],
      [1, '🏰', 'העיר העתיקה', 'סיור במרכז ההיסטורי, השעון האסטרונומי וגשר קארל.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg'],
      [2, '👑', 'טירת פראג', 'עלייה לטירה, סמטת הזהב ותצפית שקיעה מטורפת.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg'],
      [3, '🧸', 'ילדים וכייף', 'ממלכת הרכבות המדהימה וחנות הצעצועים Hamleys.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg'],
      [4, '💦', 'פארק מים', 'יום פינוק ב-Aquapalace - הפארק המקורה הענק.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg'],
      [5, '🐘', 'גן חיות וטבע', 'גן החיות העצום של פראג ומנוחה בפארק ליד.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg'],
      [6, '🛍️', 'יום קניות', 'השלמת מתנות ופינוקים בפריימארק ופלדיום.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg'],
      [7, '🛫', 'חוזרים הביתה', 'אריזות, פרידה מהמלון ונסיעה לשדה.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg']
    ];
    daysSheet.getRange(2, 1, defaultDays.length, 5).setValues(defaultDays);
  }
  
  var attrSheet = ss.getSheetByName(ATTRACTIONS_SHEET_NAME);
  if (!attrSheet) {
    attrSheet = ss.insertSheet(ATTRACTIONS_SHEET_NAME);
    attrSheet.getRange(1, 1, 1, 5).setValues([['ID', 'DayIndex', 'Title', 'Description', 'BookingLink']]);
    attrSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    
    var defaultAttr = [
      ['a1', 0, 'נחיתה בפראג', 'הגעה לשדה התעופה ואצלב האוול.', ''],
      ['a2', 0, 'Comfort Hotel Prague City East', 'צ\'ק אין והתארגנות בחדרים.', ''],
      ['a3', 1, 'Old Town Square', 'כיכר העיר העתיקה, לב ליבה של פראג.', ''],
      ['a4', 1, 'Astronomical Clock', 'השעון האסטרונומי המפורסם שמצלצל כל שעה עגולה.', 'https://www.prague.eu/en/object/places/3129/astronomical-clock'],
      ['a5', 1, 'Charles Bridge', 'גשר קארל ההיסטורי, מומלץ לחצות אותו בנחת.', ''],
      ['a6', 2, 'Prague Castle', 'טירת פראג העצומה, כולל קתדרלת סנט ויטוס.', 'https://www.hrad.cz/en/prague-castle-for-visitors/tickets'],
      ['a7', 2, 'Golden Lane', 'סמטת הזהב הקסומה בתוך מתחם הטירה.', ''],
      ['a8', 3, 'Kingdom of Railways', 'דגם הרכבות הגדול ביותר במרכז אירופה, מושלם לילדים.', 'https://www.kralovstvi-zeleznic.cz/en/'],
      ['a9', 3, 'Hamleys', 'חנות הצעצועים הענקית שכוללת קרוסלה ומגלשות בפנים.', ''],
      ['a10', 4, 'Aquapalace Prague', 'פארק המים המקורה הגדול במרכז אירופה! מגלשות, בריכות גלים וספא.', 'https://www.aquapalace.cz/en/'],
      ['a11', 5, 'Prague Zoo', 'גן החיות הענק והיפהפה של פראג. שווה להקדיש חצי יום לפחות.', 'https://www.zoopraha.cz/en/'],
      ['a12', 6, 'Primark Wenceslas Square', 'חנות הענק של פריימארק.', ''],
      ['a13', 6, 'Palladium', 'הקניון הגדול במרכז העיר עם מעל 170 חנויות.', ''],
      ['a14', 7, 'נסיעה לשדה התעופה', 'חזרה הביתה.', '']
    ];
    attrSheet.getRange(2, 1, defaultAttr.length, 5).setValues(defaultAttr);
  }
}

function loadItinerary() {
  try {
    var ss = getSpreadsheet_();
    var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
    var attrSheet = ss.getSheetByName(ATTRACTIONS_SHEET_NAME);
    
    if (!daysSheet || !attrSheet) {
      initItineraryDB();
      daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
      attrSheet = ss.getSheetByName(ATTRACTIONS_SHEET_NAME);
    }
    
    var daysData = daysSheet.getDataRange().getValues();
    var attrData = attrSheet.getDataRange().getValues();
    
    var itinerary = [];
    // Skip headers
    for (var i = 1; i < daysData.length; i++) {
      var d = daysData[i];
      itinerary.push({
        index: Number(d[0]),
        e: String(d[1]),
        t: String(d[2]),
        s: String(d[3]),
        hero: String(d[4]),
        attractions: []
      });
    }
    
    for (var j = 1; j < attrData.length; j++) {
      var a = attrData[j];
      var dayIdx = Number(a[1]);
      var attrObj = {
        id: String(a[0]),
        title: String(a[2]),
        desc: String(a[3]),
        link: String(a[4])
      };
      
      var targetDay = itinerary.find(function(day) { return day.index === dayIdx; });
      if (targetDay) {
        targetDay.attractions.push(attrObj);
      }
    }
    
    return { ok: true, data: itinerary };
  } catch (e) {
    Logger.log('loadItinerary error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}

function moveAttraction(attractionId, newDayIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet_();
    var attrSheet = ss.getSheetByName(ATTRACTIONS_SHEET_NAME);
    var data = attrSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(attractionId)) {
        attrSheet.getRange(i + 1, 2).setValue(Number(newDayIndex)); // Update DayIndex
        break;
      }
    }
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('moveAttraction error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
`;

// Append to Code.gs
gs += '\n' + dbFuncs;
fs.writeFileSync('gas_project/Code.gs', gs, 'utf8');
