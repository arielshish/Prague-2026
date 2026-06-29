with open('gas_project/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

import re

# Remove the old specific sheets constants
code = re.sub(r"const DAYS_SHEET_NAME = 'Days';\nconst ATTRACTIONS_SHEET_NAME = 'Attractions';", 
              "const DAYS_SHEET_NAME = 'Days';\nconst PLACES_SHEET_NAME = 'PlacesBank';", code)

# Replace initItineraryDB completely
init_func = """function initItineraryDB() {
  var ss = getSpreadsheet_();
  var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
  
  if (!daysSheet) {
    daysSheet = ss.insertSheet(DAYS_SHEET_NAME);
    daysSheet.getRange(1, 1, 1, 5).setValues([['DayIndex', 'Icon', 'Title', 'Description', 'HeroImage']]);
    daysSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    
    var defaultDays = [
      [0, '🛬', 'נחיתה והגעה', 'נחיתה בפראג, נסיעה למלון והתארגנות קלילה בעיר.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg'],
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
  
  var placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
  if (!placesSheet) {
    placesSheet = ss.insertSheet(PLACES_SHEET_NAME);
    placesSheet.getRange(1, 1, 1, 7).setValues([['ID', 'DayIndex', 'Type', 'Title', 'Description', 'Link', 'Priority']]);
    placesSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    placesSheet.setFrozenRows(1);
    
    // DayIndex -1 means it is in the "Bank" (Unassigned).
    var defaultPlaces = [
      // Some pre-assigned
      ['p1', 0, 'attraction', 'נחיתה בפראג', 'הגעה לשדה התעופה', '', 'High'],
      ['p2', 0, 'hotel', 'Comfort Hotel Prague City East', 'צ\'ק אין', '', 'High'],
      
      // Some in the bank
      ['p3', -1, 'attraction', 'Old Town Square', 'כיכר העיר העתיקה', '', 'High'],
      ['p4', -1, 'attraction', 'Astronomical Clock', 'השעון האסטרונומי המפורסם שמצלצל כל שעה עגולה.', 'https://www.prague.eu/en/object/places/3129/astronomical-clock', 'High'],
      ['p5', -1, 'attraction', 'Charles Bridge', 'גשר קארל ההיסטורי', '', 'High'],
      ['p6', -1, 'attraction', 'Prague Castle', 'טירת פראג העצומה', 'https://www.hrad.cz/en/prague-castle-for-visitors/tickets', 'High'],
      ['p7', -1, 'attraction', 'Kingdom of Railways', 'ממלכת הרכבות - חובה לילדים', 'https://www.kralovstvi-zeleznic.cz/en/', 'High'],
      ['p8', -1, 'attraction', 'Aquapalace Prague', 'פארק מים מקורה', 'https://www.aquapalace.cz/en/', 'Medium'],
      
      // Shopping
      ['s1', -1, 'shopping', 'Primark Wenceslas Square', 'בגדים זולים למשפחה', '', 'High'],
      ['s2', -1, 'shopping', 'Palladium', 'הקניון הגדול במרכז העיר', '', 'Medium'],
      
      // Restaurants
      ['r1', -1, 'restaurant', 'Kantýna', 'מסעדת בשרים מעולה - חובה להזמין מקום', 'https://www.google.com/maps/search/Kantýna+Prague', 'High'],
      ['r2', -1, 'restaurant', 'V Kolkovně', 'אוכל צ\'כי מסורתי', 'https://www.google.com/maps/search/V+Kolkovně+Prague', 'Medium']
    ];
    placesSheet.getRange(2, 1, defaultPlaces.length, 7).setValues(defaultPlaces);
  }
}"""

code = re.sub(r'function initItineraryDB\(\) \{.*?\n\nfunction loadItinerary\(\) \{', init_func + '\n\nfunction loadItinerary() {', code, flags=re.DOTALL)

# Replace loadItinerary
load_itinerary_func = """function loadItinerary() {
  try {
    var ss = getSpreadsheet_();
    var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
    var placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
    
    if (!daysSheet || !placesSheet) {
      initItineraryDB();
      daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
      placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
    }
    
    var daysData = daysSheet.getDataRange().getValues();
    var placesData = placesSheet.getDataRange().getValues();
    
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
    
    var bank = [];
    
    for (var j = 1; j < placesData.length; j++) {
      var a = placesData[j];
      var dayIdx = Number(a[1]);
      var attrObj = {
        id: String(a[0]),
        type: String(a[2]),
        title: String(a[3]),
        desc: String(a[4]),
        link: String(a[5]),
        priority: String(a[6])
      };
      
      if (dayIdx >= 0) {
        var targetDay = itinerary.find(function(day) { return day.index === dayIdx; });
        if (targetDay) {
          targetDay.attractions.push(attrObj);
        }
      } else {
        bank.push(attrObj);
      }
    }
    
    return { ok: true, data: itinerary, bank: bank };
  } catch (e) {
    Logger.log('loadItinerary error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}"""

code = re.sub(r'function loadItinerary\(\) \{.*?\n\}\n\nfunction moveAttraction', load_itinerary_func + '\n\nfunction moveAttraction', code, flags=re.DOTALL)

# Update moveAttraction to just update the dayIndex
move_attr_func = """function moveAttraction(attractionId, newDayIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet_();
    var placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
    var data = placesSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(attractionId)) {
        placesSheet.getRange(i + 1, 2).setValue(Number(newDayIndex)); // Update DayIndex
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
}"""

code = re.sub(r'function moveAttraction\(attractionId, newDayIndex\) \{.*?\n\}\n', move_attr_func + '\n', code, flags=re.DOTALL)

# Delete loadPlaces function (since we merged everything into loadItinerary bank)
code = re.sub(r'function loadPlaces\(\) \{.*?\}\n', '', code, flags=re.DOTALL)

with open('gas_project/Code.gs', 'w', encoding='utf-8') as f:
    f.write(code)
