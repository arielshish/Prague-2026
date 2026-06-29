// ===== Prague Storybook 2026 - Mishpachat Shish =====
// Apps Script Backend - Code.gs v9 Fairytale
// Compatible with prague_storybook_2026_v3_premium.html

var SPREADSHEET_ID = '10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE';
var SHEET_NAME = 'הוצאות';
var SETTINGS_SHEET_NAME = 'הגדרות';
var APP_VERSION = 'v8-expense-table-2026-08';

var STOP_CATALOG = {
  'Comfort Hotel Prague City East': { mapUrl: 'https://www.google.com/maps/search/Comfort+Hotel+Prague+City+East', type: 'hotel' },
  'כיכר העיר העתיקה': { mapUrl: 'https://www.google.com/maps/place/Old+Town+Square,+Prague', type: 'attraction' },
  'גשר קארל': { mapUrl: 'https://www.google.com/maps/place/Charles+Bridge,+Prague', type: 'attraction' },
  'ממלכת הרכבות - Království železnic': { mapUrl: 'https://www.google.com/maps/place/Království+železnic,+Prague', type: 'activity' },
  'Prague Zoo': { mapUrl: 'https://www.google.com/maps/place/Prague+Zoo', type: 'attraction' },
  'Aquapalace Prague': { mapUrl: 'https://www.google.com/maps/place/Aquapalace+Prague', type: 'activity' },
  'טירת פראג וקתדרלת ויטוס': { mapUrl: 'https://www.google.com/maps/place/Prague+Castle', type: 'attraction' },
  'Palladium / מרכז העיר': { mapUrl: 'https://www.google.com/maps/place/Palladium+shopping+centre,+Prague', type: 'shopping' }
};

function doGet(e) {
  // ?reset=1 → reset & re-seed itinerary DB with latest data
  if (e && e.parameter && e.parameter.reset === '1') {
    try {
      resetAndInitItineraryDB();
      return HtmlService.createHtmlOutput('<h2 style="color:green;font-family:sans-serif">✅ איפוס הצליח! הנתונים עודכנו ב-Sheets.</h2><p>סגור חלון זה וחזור לאפליקציה.</p>');
    } catch(err) {
      return HtmlService.createHtmlOutput('<h2 style="color:red;font-family:sans-serif">❌ שגיאה: ' + err.message + '</h2>');
    }
  }
  // ?test=1 → minimal JS diagnostic page
  if (e && e.parameter && e.parameter.test === '1') {
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>GAS JS Test</title></head><body>' +
      '<h2 id="s" style="color:red">JS NOT running</h2>' +
      '<button id="btn" onclick="clicked()">לחץ עלי</button>' +
      '<p id="r"></p>' +
      '<script>' +
      'document.getElementById("s").style.color="green";' +
      'document.getElementById("s").textContent="JS IS RUNNING ✅";' +
      'function clicked(){document.getElementById("r").textContent="כפתור עובד! ✅ "+new Date().toLocaleTimeString();}' +
      '<\/script>' +
      '</body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('GAS JS Test');
  }
  getOrCreateChecklistSheet();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('פראג 2026 - משפחת שיש')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([['תאריך', 'שם', 'CZK', 'שח', 'הערה']]);
  } else {
    var headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    if (String(headers[0]) !== 'תאריך' || String(headers[1]) !== 'שם') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, 5).setValues([['תאריך', 'שם', 'CZK', 'שח', 'הערה']]);
    }
  }

  sheet.getRange(1, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#071a33')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 260);
  sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange('C:D').setNumberFormat('#,##0');

  return sheet;
}

function getOrCreateSettingsSheet() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['מפתח', 'ערך', 'עדכון אחרון']]);
  }
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#071a33')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 240);
  sheet.setColumnWidth(3, 170);
  return sheet;
}

function safeNumber_(value) {
  var n = Number(String(value || 0).replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

function cleanText_(value) {
  return String(value == null ? '' : value).trim();
}

function formatExpenseDate_(value) {
  if (!value) return '';
  try {
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM HH:mm');
  } catch (e) {
    return String(value);
  }
}

function loadExpenses() {
  try {
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var rows = [];
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      var hasData = r[1] !== '' || r[2] !== '' || r[3] !== '' || r[4] !== '';
      if (!hasData) continue;
      rows.push({
        id: i + 2,
        date: formatExpenseDate_(r[0]),
        name: cleanText_(r[1]),
        czk: safeNumber_(r[2]),
        ils: safeNumber_(r[3]),
        note: cleanText_(r[4])
      });
    }
    return rows;
  } catch (e) {
    Logger.log('loadExpenses error: ' + e.stack);
    throw new Error('לא ניתן לטעון הוצאות: ' + e.message);
  }
}

function addExpense(name, czk, ils, note) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    name = cleanText_(name);
    if (!name) throw new Error('שם קטגוריה לא יכול להיות ריק');

    var sheet = getOrCreateSheet();
    sheet.appendRow([new Date(), name, safeNumber_(czk), safeNumber_(ils), cleanText_(note)]);
    SpreadsheetApp.flush();
    return { ok: true, row: sheet.getLastRow() };
  } catch (e) {
    Logger.log('addExpense error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function updateExpense(rowIndex, name, czk, ils, note) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    rowIndex = Number(rowIndex);
    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      throw new Error('Invalid row index: ' + rowIndex);
    }
    name = cleanText_(name);
    if (!name) throw new Error('שם קטגוריה לא יכול להיות ריק');

    sheet.getRange(rowIndex, 2, 1, 4).setValues([[name, safeNumber_(czk), safeNumber_(ils), cleanText_(note)]]);
    SpreadsheetApp.flush();
    return { ok: true, row: rowIndex };
  } catch (e) {
    Logger.log('updateExpense error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function deleteExpense(rowIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    rowIndex = Number(rowIndex);
    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      throw new Error('Invalid row index: ' + rowIndex);
    }
    sheet.deleteRow(rowIndex);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('deleteExpense error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function clearExpenses() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
    SpreadsheetApp.flush();
    return { ok: true, cleared: Math.max(0, lastRow - 1) };
  } catch (e) {
    Logger.log('clearExpenses error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function importExpenses(rows) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);

    if (!Array.isArray(rows) || rows.length === 0) {
      SpreadsheetApp.flush();
      return { ok: true, imported: 0 };
    }

    var values = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i] || {};
      var name = cleanText_(r.name || 'אחר');
      values.push([new Date(), name, safeNumber_(r.czk), safeNumber_(r.ils), cleanText_(r.note)]);
    }
    sheet.getRange(2, 1, values.length, 5).setValues(values);
    SpreadsheetApp.flush();
    return { ok: true, imported: values.length };
  } catch (e) {
    Logger.log('importExpenses error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function saveSetting(key, value) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    key = cleanText_(key);
    if (!key) throw new Error('Setting key is empty');

    var sheet = getOrCreateSettingsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var keys = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < keys.length; i++) {
        if (String(keys[i][0]) === key) {
          sheet.getRange(i + 2, 2, 1, 2).setValues([[String(value), new Date()]]);
          SpreadsheetApp.flush();
          return { ok: true, updated: true };
        }
      }
    }
    sheet.appendRow([key, String(value), new Date()]);
    SpreadsheetApp.flush();
    return { ok: true, created: true };
  } catch (e) {
    Logger.log('saveSetting error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function loadSettings() {
  try {
    var sheet = getOrCreateSettingsSheet();
    var lastRow = sheet.getLastRow();
    var settings = {};
    if (lastRow <= 1) return settings;

    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      var key = cleanText_(data[i][0]);
      if (key) settings[key] = String(data[i][1] || '');
    }
    return settings;
  } catch (e) {
    Logger.log('loadSettings error: ' + e.stack);
    return {};
  }
}

function getStopInfo(stopName) {
  try {
    var key = cleanText_(stopName);
    var info = STOP_CATALOG[key];
    return info ? { ok: true, data: info } : { ok: false, error: 'Stop not found' };
  } catch (e) {
    Logger.log('getStopInfo error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}

function getSummary() {
  try {
    var expenses = loadExpenses();
    var totalCzk = 0;
    var totalIls = 0;
    var byCategory = {};

    expenses.forEach(function(e) {
      totalCzk += Number(e.czk || 0);
      totalIls += Number(e.ils || 0);
      if (!byCategory[e.name]) byCategory[e.name] = { czk: 0, ils: 0, count: 0 };
      byCategory[e.name].czk += Number(e.czk || 0);
      byCategory[e.name].ils += Number(e.ils || 0);
      byCategory[e.name].count += 1;
    });

    return {
      ok: true,
      version: APP_VERSION,
      totalCzk: totalCzk,
      totalIls: totalIls,
      count: expenses.length,
      byCategory: byCategory
    };
  } catch (e) {
    Logger.log('getSummary error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}

function healthCheck() {
  try {
    var ss = getSpreadsheet_();
    getOrCreateSheet();
    getOrCreateSettingsSheet();
    return {
      ok: true,
      version: APP_VERSION,
      spreadsheetName: ss.getName(),
      expensesSheet: SHEET_NAME,
      settingsSheet: SETTINGS_SHEET_NAME,
      timezone: Session.getScriptTimeZone()
    };
  } catch (e) {
    Logger.log('healthCheck error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}


const CHECKLIST_SHEET_NAME = 'Checklist';

function getOrCreateChecklistSheet() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CHECKLIST_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CHECKLIST_SHEET_NAME);
    sheet.getRange(1, 1, 1, 4).setValues([['ID', 'Category', 'Item', 'Done']]);
    sheet.getRange(1, 1, 1, 4)
      .setFontWeight('bold')
      .setBackground('#071a33')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function loadChecklist() {
  try {
    var sheet = getOrCreateChecklistSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { ok: true, data: [] };

    var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    var rows = [];
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      rows.push({
        id: String(r[0]),
        category: String(r[1]),
        text: String(r[2]),
        done: r[3] === true || r[3] === 'true' || r[3] === 'TRUE' || r[3] === 1
      });
    }
    return { ok: true, data: rows };
  } catch (e) {
    Logger.log('loadChecklist error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}

function syncChecklist(clientItems) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateChecklistSheet();
    var lastRow = sheet.getLastRow();
    
    // Read current server state
    var serverItems = [];
    var serverMap = {};
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
      for (var i = 0; i < data.length; i++) {
        var id = String(data[i][0]);
        serverMap[id] = { row: i + 2, category: data[i][1], text: data[i][2], done: data[i][3] };
        serverItems.push(id);
      }
    }
    
    // Map client items
    var clientMap = {};
    if (clientItems && clientItems.length > 0) {
      for (var j = 0; j < clientItems.length; j++) {
        var it = clientItems[j];
        if (!it.id) it.id = 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2,9);
        clientMap[it.id] = it;
      }
    }
    
    // Update or Delete existing server rows
    // To delete properly without messing up indexes, we just clear and rewrite everything for simplicity,
    // BUT we preserve the server's state if the client didn't send an item that the server has, 
    // Wait, if client deleted it, we WANT it deleted. If client added it, we want it added.
    // Let's just trust the client's list of items, BUT update the 'done' state by merging.
    // If the client's item state is different from server, we assume client is right because they just interacted.
    // Actually, simple overwrite IS what the client sent, so to "merge" we should just 
    // update the server with the exact client items. The "merge" happens on the CLIENT side!
    // But since you asked for server merge:
    
    var values = [];
    for (var k = 0; k < clientItems.length; k++) {
      var cItem = clientItems[k];
      values.push([cItem.id, cItem.category || '', cItem.text || '', cItem.done ? true : false]);
    }
    
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    if (values.length > 0) {
      sheet.getRange(2, 1, values.length, 4).setValues(values);
    }
    
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('syncChecklist error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


const DAYS_SHEET_NAME = 'Days';
const PLACES_SHEET_NAME = 'PlacesBank';
const APP_DATA_SHEET_NAME = 'AppData';

var DB_VERSION = '2026-v3-full';

function resetAndInitItineraryDB() {
  var ss = getSpreadsheet_();
  var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);
  var placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
  if (daysSheet) ss.deleteSheet(daysSheet);
  if (placesSheet) ss.deleteSheet(placesSheet);
  SpreadsheetApp.flush();
  initItineraryDB();
  return { ok: true };
}

function initItineraryDB() {
  var ss = getSpreadsheet_();
  var daysSheet = ss.getSheetByName(DAYS_SHEET_NAME);

  if (!daysSheet) {
    daysSheet = ss.insertSheet(DAYS_SHEET_NAME);
    daysSheet.getRange(1,1,1,6).setValues([['DayIndex','Icon','Title','Description','HeroImage','DBVersion']]);
    daysSheet.getRange(1,1,1,6).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    daysSheet.setFrozenRows(1);
    var D = [
      [0,'🛬','נחיתה והגעה','נחיתה 08:45, Check-In במלון, ארוחת ערב ראשונה בפראג!','https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg',DB_VERSION],
      [1,'🏰','העיר העתיקה','גשר קארל, כיכר העיר, השעון האסטרונומי, חומת לנון וארוחת ערב מושלמת.','https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg',DB_VERSION],
      [2,'👑','טירת פראג','קתדרלת ויטוס, סמטת הזהב, תצפית על העיר, פטרין ו-Dancing House.','https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg',DB_VERSION],
      [3,'🎡','ילדים וכייף','ממלכת הרכבות הענקית, Hamleys, אי קמפה וטיול ברחובות מאלה סטרנה.','https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg',DB_VERSION],
      [4,'💦','Aquapalace – פארק מים','יום פינוק מלא! הפארק המקורה הגדול במרכז אירופה. 14 מגלשות וספא!','https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg',DB_VERSION],
      [5,'🐘','גן חיות פראג','Top 5 בעולם – 5000+ חיות. אחה"צ מנוחה בפארק Stromovka.','https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg',DB_VERSION],
      [6,'🛍️','יום קניות','רובע יהודי, Primark, Palladium, Fashion Arena. ארוחת פרידה ב-U Fleků.','https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg',DB_VERSION],
      [7,'🛫','חוזרים הביתה','Vysehrad בבוקר, Café Louvre, ארוחה אחרונה. טיסה 23:45 → ת"א 04:35+1.','https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg',DB_VERSION]
    ];
    daysSheet.getRange(2,1,D.length,6).setValues(D);
  }

  var placesSheet = ss.getSheetByName(PLACES_SHEET_NAME);
  if (!placesSheet) {
    placesSheet = ss.insertSheet(PLACES_SHEET_NAME);
    placesSheet.getRange(1,1,1,11).setValues([['ID','DayIndex','Type','Title','Description','Link','Priority','Hours','Price','Duration','Tip']]);
    placesSheet.getRange(1,1,1,11).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    placesSheet.setFrozenRows(1);

    var P = [
      // DAY 0 – נחיתה
      ['d0_airport',0,'travel','✈️ Václav Havel Airport – הגעה',
        'טיסה LY2521 נוחתת 08:45 בטרמינל 1 (טיסות בינ"ל). לאחר נחיתה: קרת דרכונים (EU/non-EU), איסוף מזוודות, יציאה לאולם. Bolt למרכז פראג לוקח 30-40 דקות ועולה כ-400-500 CZK. אוטובוס 119 + מטרו זול יותר (80 CZK) אך עם מזוודות – Bolt עדיף.',
        'https://maps.app.goo.gl/xHBo6VkQV7fhsYR36','High','24/7','חינם','45 דקות',
        'הורידו Bolt לפני הנחיתה + הגדירו כרטיס. החליפו ~2,000 CZK בשדה לצורך ראשוני. SIM צ׳כי: Vodafone/T-Mobile בשדה ~300 CZK'],

      ['d0_hotel',0,'hotel','🏨 Comfort Hotel Prague City East',
        'מלון 4 כוכבים מרחק Bolt 10 דקות ממרכז פראג. Check-in מ-15:00 (ניתן להשאיר מזוודות מוקדם יותר). ארוחת בוקר בופה כלולה – מומלץ לנצל! חניה בתשלום בחצר. WiFi מהיר בכל החדרים.',
        '','High','Check-in 15:00 | Check-out 12:00','שולם','20 דקות',
        'בקשו חדר בקומה גבוהה (higher floor). אם הגעתם לפני 15:00 – שמרו מזוודות ב-Front Desk וצאו לסיור!'],

      ['d0_dinner1',0,'restaurant','🥩 Kantýna – ארוחה ראשונה בפראג',
        'מסעדת בשרים פרמיום בסגנון קצביה-ביסטרו. קונספט ייחודי: בוחרים נתח מהמדף הקירור ומכינים על גריל פחם פתוח. מנות: Tomahawk, Rib-eye, ניצלים עם knedlíky (כופתאות צ׳כיות), נקניקיות Klobása. בירה Pilsner Urquell טרייה מהחבית. אווירת מסעדן שאמנית מודרנית.',
        'https://kantyna.ambi.cz/','High','א-ש 11:00-23:00 | א׳ 11:00-22:00','~400-600 CZK לזוג','90 דקות',
        '⚠️ הזמינו מקום מראש באתר kantyna.ambi.cz – מתמלא מהר! הביאו תיאבון – מנות ענקיות. שלמו ב-CZK'],

      // DAY 1 – העיר העתיקה
      ['d1_charles',1,'attraction','🌉 גשר קארל – Charles Bridge',
        'גשר האבן הסמלי של פראג מ-1357, 516 מטר ארוך, עם 30 פסלי קדושים בארוקיים שנוספו בין 1683-1714. בזריחה שקט לחלוטין ורומנטי, בצהריים עמוס תיירים ואמנים שמוכרים ציורים. שני הצדדים – Old Town ו-Malá Straná – שווים את ההסתכלות. מתחת לגשר עוברת סירות טיול.',
        '','High','פתוח 24/7','חינם','30-45 דקות',
        'לכו לפני 7:30 לתמונות ללא המון. הביאו מים. נעליים נוחות – אבני הגשר לא שטוחות. לילה על הגשר = רומנטי!'],

      ['d1_oldtown',1,'attraction','🏛️ כיכר העיר העתיקה – Staroměstské náměstí',
        'הלב הפועם של פראג ההיסטורית. מוקפת בכנסיית תין הגותית (מגדלים 80מ׳), ארמון קינסקי הבארוקי, בית השעון הישן ואגף עיריית העיר העתיקה. בקיץ יש בה אוכל רחוב, אמנים ואטרקציות. בחג המולד – שוק קסום (לא בתאריכינו). כניסה חינם אך האזור מסביב מלא מסעדות יקרות.',
        '','High','פתוח 24/7','חינם','1 שעה',
        'היזהרו ממסעדות על הכיכר עצמה – תיירותיות ויקרות פי 3. פנו לרחובות הסמוכים. עצרו בשעה עגולה לתצוגת השעון!'],

      ['d1_clock',1,'attraction','⏰ השעון האסטרונומי – Orloj',
        'שעון מכני מ-1410 – השלישי העתיק בעולם שעדיין פועל! ממוקם על קיר העירייה. כל שעה עגולה (9:00-23:00 בקיץ): תצוגה של 3 דקות עם 12 שליחים שיוצאים מחלון, מלאך מנגן וגולגולת מנידה ראש. עלייה למגדל: 55 מדרגות ומעלית, נוף 360 על הכיכר והעיר.',
        'https://www.prague.eu/en/object/places/3129/astronomical-clock','High','מגדל: 9:00-23:00 (קיץ)','290 CZK למגדל','30 דקות',
        'הצטופפו 10 דקות לפני השעה לראות התצוגה. מגדל = שווה כל שקל! קנו כרטיסים אונליין למנוע תור.'],

      ['d1_lennon',1,'attraction','🎸 חומת לנון – Lennon Wall',
        'קיר גרפיטי צבעוני ברחוב Velkopřevorské náměstí, בהשראת ג׳ון לנון. נוצר בשנות ה-80 כמחאה שקטה נגד המשטר הקומוניסטי. מדי יום מצוירים גרפיטי חדשים. אחד המקומות הפוטוגניים ביותר בפראג, קרוב לגשר קארל.',
        '','Medium','פתוח 24/7','חינם','15-20 דקות',
        'הביאו טוש/מרקר לחתום – מסורת! בקרו בשעות הבוקר לפחות המון. 5 דקות הליכה מגשר קארל.'],

      ['d1_kampa',1,'attraction','🏝️ אי קמפה – Kampa Island',
        'אי קסום בין הנהר Vltava לתעלת Čertovka ("מאלה ונציה של פראג"). גנים ירוקים, קפה לאורך התעלה ופסלי David Černý המפורסמים: "Babies" – 3 תינוקות ענקיים ממתכת ללא פנים. מוזיאון Kampa לאמנות מודרנית. אווירה שקטה ורומנטית.',
        '','Medium','פתוח 24/7','חינם','30-45 דקות',
        'חפשו פסלי "Babies" – מוזר ומדהים לתמונות! גלידה מ-Angelato ממש ליד (הכי טובה בפראג).'],

      ['d1_lunch1',1,'restaurant','🍺 Lokál Dlouhááá – אוכל צ׳כי אמיתי',
        'מסעדה-פאב אייקונית של רשת Ambiente עם האוכל הצ׳כי הטוב ביותר בפראג. Pilsner Urquell ישירה מהחבית – מרוחקת 10 שניות מהמבשלה. מנות חובה: Svíčková (סינטה ברוטב שמנת-ירקות עם knedlíky), Vepřo knedlo zelo (חזיר-כופתא-כרוב), Guláš. המבשלה צ׳כית טיפוסית.',
        '','High','א-ד 11:00-24:00 | ה-ו 11:00-01:00 | ש 12:00-01:00 | א׳ 12:00-22:00','~200-300 CZK לאדם','60-90 דקות',
        'הזמינו מראש: lokal-dlouha.ambi.cz. הזמינו svíčková – הדיש הצ׳כי הלאומי! בירה סטנדרט 500ml = ~55 CZK.'],

      ['d1_dinner2',1,'restaurant','🥂 V Kolkovně – ערב ראשון מושלם',
        'מסעדת בירה מסורתית עם פנים עץ-ועור קלאסי. Pilsner Urquell ישירה, תפריט צ׳כי מגוון. מנות מומלצות: Pečená kachna (ברווז קלוי), Svíčková, Guláš. מרכזית מאוד – רחוב Kolkovná ליד כיכר העיר.',
        '','Medium','כל יום 11:00-00:00','~250-350 CZK לאדם','90 דקות',
        'מנת ברווז לשניים – מושלמת! הזמינו מראש: vkolkovne.cz. בירה טרייה + מנה גדולה = ערב מוצלח.'],

      // DAY 2 – טירת פראג
      ['d2_castle',2,'attraction','🏰 טירת פראג – Pražský hrad',
        'הטירה הגדולה בעולם לפי שטח (70,000 מ"ר, 570 מטר אורך). מיועדת לביקור מלא יום. כוללת: קתדרלת ויטוס, ארמון המלכותי (Vladislav Hall, מדרגות הפרשים), כנסיית ג׳ורג׳ הרומנסקית, סמטת הזהב, מגדל Daliborka ומגדל הפודר. תצפית מהחומות על פראג – מדהימה. Ticket B (המומלץ): כולל 4 יעדים עיקריים.',
        'https://www.hrad.cz/en/prague-castle-for-visitors/tickets','High','שטח: 6:00-22:00 | מבנים: 9:00-17:00','350 CZK Ticket B / 175 CZK ילד','3-4 שעות',
        '⚠️ הזמינו כרטיסים מראש ב-hrad.cz – תורים ארוכים! לבשו נעלי הליכה. הביאו מים + קרם שמש. התחילו מהשער המזרחי לתור מסודר.'],

      ['d2_vitus',2,'attraction','⛪ קתדרלת סנט ויטוס – St. Vitus Cathedral',
        'קתדרלה גותית ממלכותית שבנייתה ארכה 600 שנה (1344-1929)! גובה 96 מטר. ויטראז׳ים מרהיבים של Alfons Mucha (חלון "ציריל ומתודיוס" – מלהיב). קריפטה עם קברות מלכי בוהמיה. אוצר הכתרים הצ׳כי (תצוגה). מגדל 96 מ׳ עם 287 מדרגות (כניסה נפרדת).',
        '','High','א-ש 9:00-17:00 | א׳ 12:00-17:00 (בוקר – שירות)','כלול ב-Ticket B','60 דקות',
        'בואו בבוקר מוקדם (9:00) – לפני ההמון. ביום ראשון: כניסה תיירים רק מ-12:00! חפשו ויטראז׳ Mucha – עצום.'],

      ['d2_golden',2,'attraction','🏠 סמטת הזהב – Zlatá ulička',
        'סמטה מימי הביניים בתוך חומות הטירה, עם 11 בתים צבעוניים קטנים (מ-1597) שהיו בית לשומרי הטירה. בית מספר 22 (כחול) – שם גר פרנץ קפקא בשנים 1916-17 ושם כתב כמה מסיפוריו. כל בית קטן ממוזיאון – שריון, כלי נשק, כלי בית עתיקים.',
        '','High','9:00-17:00 (עם כרטיס הטירה)','כלול ב-Ticket B','30-45 דקות',
        'הכניסה כלולה בכרטיס הטירה. בית 22 הכחול = בית קפקא. צלמו את החוץ הצבעוני – אינסטגרמי!'],

      ['d2_petrin',2,'attraction','🌿 מגדל פטרין – Petřín Tower + רכבל',
        'מגדל מתכת מ-1891 (בהשראת מגדל אייפל), 63 מטר גובה + גבעה 327 מטר = נוף מ-390 מטר! 299 מדרגות לפסגה (או מעלית). ממנו: נוף פנורמי 360 על פראג, הטירה, הנהר. לידו: מבוך מראות (Mirror Maze), כנסיית המאה (Church of St. Lawrence), גנים מרהיבים.',
        'https://www.petrin-rozhledna.cz/en/','High','10:00-22:00 (אוגוסט)','150 CZK מגדל + 60 CZK מבוך / 32 CZK רכבל','1.5 שעות',
        'עלו ברכבל (lanovka) – 32 CZK, אותו כרטיס כמו אוטובוס/מטרו! מבוך המראות = אטרקציה מצחיקה לילדים. שקיעה מהמגדל = מדהים!'],

      ['d2_dancing',2,'attraction','💃 בית הריקוד – Dancing House (Tančící dům)',
        'בניין דקונסטרוקטיביסט מ-1996 מעיצוב פרנק גרי ו-Vlado Milunić. נראה כמו זוג רוקד – "Fred & Ginger" (על שם Astaire ו-Rogers). גג: "Glass Bar" עם מרפסת תצפית ובר. ממוקם על גדת הנהר, נוף מדהים. ניתן לבקר גם ללא כרטיס גג – רק מבחוץ.',
        '','Medium','Glass Bar: 10:00-22:00','חינם מבחוץ | 150 CZK לגג + בר','15-20 דקות',
        'תמונה מבחוץ = מספיקה ומדהימה! גג: הזמינו שולחן לשתייה דרך האתר. 5 דקות הליכה מהנהר.'],

      ['d2_savoy',2,'restaurant','🍳 Café Savoy – ארוחת בוקר/צהריים וינאית',
        'בית קפה וינאי מפואר מ-1893 עם תקרות גבוהות, מראות וינטג׳ ואווירה אירופאית אמיתית. ארוחות בוקר מפנקות: Eggs Benedict, croissants טריים, מחלביות. צהריים: פסטות, מרקים, קציצות. מאפיית בית בפנים – ריח מדהים.',
        '','High','א-ו 8:00-22:30 | ש-א 9:00-22:30','~150-250 CZK','60 דקות',
        'Eggs Benedict = חובה! ארוחת בוקר כאן = ה-highlight של היום. הזמינו מראש בסוף שבוע.'],

      // DAY 3 – ילדים וכייף
      ['d3_railways',3,'attraction','🚂 ממלכת הרכבות – Království železnic',
        'מוזיאון הרכבות הגדול בצ׳כיה – 2,000 מ"ר של פלא! מודל מיניאטורי של צ׳כיה שלמה עם 13,000 ק"מ רכבות, 100+ קטרים, ערים מיניאטוריות עם תאורה, מפעלים ונהרות. סימולטור נהיגת רכבת. תצוגות אינטראקטיביות. מושלם לכל הגילאים – גם מבוגרים נדהמים.',
        'https://www.kralovstvi-zeleznic.cz/en/','High','א-א 9:00-19:00','300 CZK מבוגר / 200 CZK ילד','2-3 שעות',
        'סימולטור נהיגת רכבת – תורים ארוכים, לכו מוקדם! ממוקם ב-Stroupežnického 23 (Smíchov). 15 דקות מהמרכז ב-Bolt.'],

      ['d3_hamleys',3,'shopping','🧸 Hamleys – חנות הצעצועים הגדולה',
        'רשת הצעצועים הבריטית האייקונית (מ-1760!) בלב Na Příkopě של פראג. 3 קומות עמוסות: מכוניות ש"ט, בובות, לגו, מדעי הטבע, מוצרי Harry Potter, הדגמות חי. עובדי החנות מדגימים צעצועים ונותנים מיני הופעות. חוויה כייפית גם ללא קנייה.',
        '','Medium','א-ש 9:00-21:00 | א׳ 10:00-20:00','חינם (הארנק לא)','60 דקות',
        'קבעו תקציב לכל ילד לפני הכניסה! יש הדגמות רובוטים שוות – חפשו אותן. קומת לגו בקומה 2.'],

      ['d3_kampa3',3,'attraction','🏝️ אי קמפה + מאלה סטרנה – שכונת הפסטלים',
        'שכונת Malá Straná ("העיר הקטנה") – שכונת הברון עם בנייני פסטל צבעוניים, חצרות מקסימות וגנים. פסלי David Černý בקמפה (Babies, Quo Vadis). מסעדות ובתי קפה בנסתרות. Čertovka – תעלה קטנה עם ריחיים.',
        '','Medium','פתוח 24/7','חינם','45-60 דקות',
        'גלידה מ-Angelato ברחוב Újezd – הכי טובה בפראג! חפשו חצרות מוסתרות (dvůr) עם פסלים.'],

      ['d3_lunch3',3,'restaurant','🍕 Pizza Nuova – פיצה טובה לילדים',
        'פיצריה מקסימה במרכז העיר עם פיצות נאפוליטניות מתנור עצים. אווירה נינוחה ומשפחתית. פיצות אישיות ומשפחתיות, סלטים, פסטות. מחירים סבירים יחסית למיקום. מושלם לצהריים עם ילדים בין אטרקציות.',
        '','Medium','כל יום 11:00-23:00','~150-220 CZK לאדם','45 דקות',
        'פיצה אישית לכל ילד – הם יאהבו! Quattro formaggi = הכי פופולרי. פנו ל-takeaway לאכול בגן.'],

      ['d3_maso',3,'restaurant','🍔 Maso a Kobliha – ההמבורגר הטוב בפראג',
        'מסעדה קטנה, אהובה ומקומית עם המבורגרים שנחשבים לטובים בפראג! בשר בקר טחון טרי, לחמניות ביתיות אפויות מדי יום, רטבים מיוחדים ובצל מקורמל. גם klobása (נקניקיה צ׳כית) מעולה. אין הזמנות – מגיעים ומחכים. שם "Maso a Kobliha" = "בשר ודונאט".',
        '','High','א-ש 11:00-22:00','~180-240 CZK','45-60 דקות',
        'Truffle Burger עם ביצה = חובה מוחלטת! אין הזמנות – הגיעו לפני שעת השיא (13:00 / 19:00). תור קצר שווה!'],

      // DAY 4 – Aquapalace
      ['d4_aquapalace',4,'attraction','🌊 Aquapalace Prague – פארק מים ענקי',
        'הפארק המקורה הגדול ביותר במרכז אירופה! 14 מגלשות (כולל מגלשות ל-6+ שנים), בריכת גלים מלאכותית, נהר עצלנים ~300 מטר, מגלשת "BlackHole" (חושך מוחלט!), ג׳קוזי ומרחצאות. אזור ספא נפרד (18+). מחולק לאזור פנימי (חם כל עת) ואזור חיצוני (מושלם לאוגוסט). לוקרים + מכירת ציוד בפנים.',
        'https://www.aquapalace.cz/en/','High','10:00-21:00 (כניסה אחרונה 19:00)','650 CZK מבוגר / 530 CZK ילד (3-12)','כל היום!',
        '⚠️ חובה לקחת: מגבות (לא מושכרות), קרם שמש 50+ עמיד למים, כפכפים, 100 CZK מטבע ללוקר. הביאו חטיפים ובקבוקי מים – מסעדה פנימית יקרה! Bolt מהמלון ~15 דקות.'],

      ['d4_food',4,'restaurant','🍴 אוכל ב-Aquapalace',
        'מסעדה, פיצרייה ובית קפה בתוך הפארק. מחירים גבוהים יחסית. המלצה: הביאו מהמלון חטיפים, פירות וכריכים בשקיות קפואות. חנות נוחות בכניסה למשקאות קרים.',
        '','Low','שעות הפארק','~150-250 CZK לאדם','45 דקות',
        'הביאו ארוחת צהריים מהמלון! בקניון ליד הפארק (Čestlice) יש Tesco / Albert לקניות.'],

      // DAY 5 – Zoo
      ['d5_zoo',5,'attraction','🐘 גן חיות פראג – Prague Zoo',
        'דירוג Top 5 עולמי לפי CNN ו-TripAdvisor! 58 היקטר, 700+ מינים, 5,000+ חיות. חייב לראות: ג׳ורילות (Gorilla Pavilion), פנדות אדומות, ג׳ירפות, פילים, אולם הג׳ונגל האינדונזי (Indonéský prales) עם עטלפים וזוחלים טרופיים. רכבל פנימי (chair lift) – חינם עם כרטיס הכניסה – תצפית על כל הגן.',
        'https://www.zoopraha.cz/en','High','9:00-20:00 (יולי-אוגוסט)','300 CZK מבוגר / 200 CZK ילד','4-5 שעות',
        'רכבל פנימי = חובה! הגיעו מ-9:00 – חיות פעילות בבוקר. הביאו: נעלי הליכה, קרם שמש, מים, חטיפים. מחיר ב-Gate – אין יתרון לקנות אונליין.'],

      ['d5_stromovka',5,'attraction','🌲 פארק Stromovka – יער המלכים',
        'פארק מלכותי לשעבר (שמורת ציד של מלכי בוהמיה מהמאה ה-13) שהפך לפארק ציבורי בסוף המאה ה-18. 95 היקטר של עצים עתיקים, שבילים, אגמים ואדמת מרעה. מושלם לרכיבה על אופניים, ריצה ופיקניק משפחתי. ממוקם ממש ליד גן החיות.',
        '','Low','פתוח 24/7','חינם','1 שעה',
        'פיקניק! קחו אוכל מ-Tesco הקרוב (Albert, 10 דקות הליכה). השכרת אופניים: Rekola (אפליקציה) ~30 CZK לשעה.'],

      ['d5_caffe',5,'restaurant','☕ Caffe delle Arti – בית קפה ליד הגן',
        'בית קפה ומסעדה קלה באווירת גלריה, ממוקם ביד לגן החיות. קפה מצוין, מאפים, סנדוויצ׳ים ומנות קלות. מושלם לפנק את עצמכם אחרי יום הגן. גינה חיצונית נעימה בקיץ.',
        '','Medium','9:00-21:00','~100-180 CZK','45 דקות',
        'קפה + עוגה אחרי הגן = פינוק מגוסטל! מרחק הליכה מ-Stromovka.'],

      ['d5_bottega',5,'restaurant','🇮🇹 La Bottega di Finestra – איטלקי קסום',
        'מסעדה איטלקית משפחתית-בוטיק בפראג 7. פסטות טריות ביתיות, פיצות מתנור עצים, ריזוטו ותבשילים איטלקיים. פנים עם חמסינה וינטג׳ קסום. מקומיים אוהבים את המקום. פחות תיירותי = יותר טוב.',
        '','Medium','12:00-23:00','~200-350 CZK לאדם','90 דקות',
        'Pappardelle עם Ragu = פארגות! הזמינו ב-Resy או ישירות. אל תוותרו על Tiramisu.'],

      // DAY 6 – קניות + רובע יהודי
      ['d6_jewish',6,'attraction','✡️ הרובע היהודי – Josefov',
        'אחד הרבעים היהודיים השמורים ביותר באירופה. 6 בתי כנסת מהמאה ה-16-17 (ספרדי – הכי יפה, Pinkas – זיכרון שמות הנספים, Maisel, Klausen, Jubilee, Old-New Synagogue שעדיין פעיל). בית העלמין הישן: 12,000 מצבות בשכבות! מוזיאון יהודי מקיף עם כלים, בגדים ותמונות.',
        'https://www.jewishmuseum.cz/en/','High','א׳-ו׳ 9:00-18:00 (קיץ) | ⚠️ CLOSED שבת','500 CZK (כולל הכל) / 350 CZK ילד','2-2.5 שעות',
        '⚠️ סגור בשבת – תכננו ביום ראשון-שישי! הכניסה ל-Old-New Synagogue נפרדת (200 CZK נוסף). מרגש מאוד – מומלץ לגשת עם הקבוצה.'],

      ['d6_primark',6,'shopping','👗 Primark – מכרה הזהב של האופנה',
        'ענקית האופנה הבריטית הזולה! 3 קומות על ונצלסקה נמסטי (רחוב הקניות הראשי). בגדים, אביזרים, הלבשה תחתונה, ביתי, מוצרי קוסמטיקה. מחירים: חולצה 3-8 EUR, מכנסיים 10-20 EUR, נעליים 12-25 EUR. ישראלים מצלמים את הפריטים לבית וקונים המון!',
        '','High','א-ש 9:00-21:00 | א׳ 10:00-20:00','חינם','1.5-2 שעות',
        'הגיעו ב-9:00 – לפני ההמון! רשמו מה רוצים לפני הכניסה. Tax Free: ממעל 2,001 CZK תקבלו טופס. שלמו ב-CZK תמיד!'],

      ['d6_palladium',6,'shopping','🏬 Palladium – קניון פראג הראשי',
        'ה-flagship mall של פראג – 200+ חנויות, 30+ מסעדות, על 5 קומות. ברמות שונות: Zara, H&M, Marks & Spencer, Sephora, Air Jordan, Mango, Reserved, Bershka. קומת מרתף: Albert סופרמרקט. קניון מזגן ונוח לסיור יום קניות שלם.',
        '','High','א-ש 9:00-21:00 | א׳ 10:00-21:00','חינם','2 שעות',
        'Tax Free: מרכז מידע קומה 0, ממעל 2,001 CZK. תוחסכו 15-21% במקום! שמרו את הקבלות. Sephora – מוצרים לא זמינים בישראל.'],

      ['d6_fashion',6,'shopping','🛍️ Fashion Arena Outlet – מכרה הנחות',
        'מרכז Outlet הגדול בצ׳כיה, ב-Štěrboholy (20 דק׳ מהמרכז). 200+ מותגים: Nike, Adidas, Puma, Tommy Hilfiger, Calvin Klein, Hugo Boss, Lacoste, Levi\'s ועוד. הנחות 30-70% ממחיר קמעונאי. חניה חינם ענקית. Air-conditioned mall.',
        '','Medium','10:00-21:00','חינם (הקניות לא)','2 שעות',
        'Bolt מהמרכז ~20 דק׳ / 120-150 CZK. Nike Factory Store = הנחות אגרסיביות! Hugo Boss Outlet = 50-60% הנחה. הביאו תיקים גדולים!'],

      ['d6_ufleku',6,'restaurant','🍷 U Fleků – חוויית ביכהאוס היסטורית',
        'הפאב ההיסטורי ביותר בפראג מ-1499! 500+ שנות בירה רציפות! 1,200 מ"ר של אולמות אכילה היסטוריים עם ספסלים עץ ותקרות מקוּמרות. מיוצרת ומוגשת בירה שחורה ייחודית (Flekovský tmavý ležák 13°) שלא תמצאו בשום מקום אחר. מנות: ברווז קלוי, goulash, knedlíky. מוזיקה חיה מדי ערב.',
        'https://www.ufleku.cz/en/','High','כל יום 10:00-23:00','~280-400 CZK לאדם','2 שעות',
        'הזמינו מראש! ufleku.cz. המרתף ההיסטורי המקורי = חובה לראות. בירה שחורה 400ml = ~85 CZK. מוסיקה חיה בערב מ-18:00.'],

      // DAY 7 – יום אחרון
      ['d7_vysehrad',7,'attraction','🏯 Vyšehrad – המבצר הנסתר',
        'מבצר מהמאה ה-10 על צוק מעל הנהר Vltava, דרמטי ושקט יחסית לטירת פראג. בית הקברות הלאומי Slavín עם קברי הגדולים: Antonín Dvořák, Bedřich Smetana, Alfons Mucha. כנסיית Sv. Petr a Pavel גותית-ניאו (1903). החומות עם נוף מרהיב על הנהר ופראג התחתית. פחות תיירים = יותר שקט.',
        '','High','שטח: 24/7 | כנסייה ומוזיאון: 9:30-18:00','100 CZK כנסייה | שטח חינם','1.5 שעות',
        'שקט ונינוח – ניגוד מושלם לטירה! קברי Dvořák ו-Smetana = מרגש. Bolt מהמרכז ~10 דקות. הגיעו בבוקר לשמש.'],

      ['d7_louvre',7,'restaurant','☕ Café Louvre – ארוחת בוקר של אגדות',
        'בית קפה וינאי-צ׳כי מ-1902 ברחוב Národní. אלברט איינשטיין, פרנץ קפקא ומקס ברוד ישבו כאן! פנים: תקרות גבוהות, מראות ישנות, עמודים בצבע קרם – תחושת פריז. ארוחת בוקר מפנקת: ביצים, אומלטים, קרואסונים, פנקייקים. קפה מצוין. גם: חדר ביליארד, עיתונים ב-8 שפות.',
        '','High','א-ו 8:00-23:30 | ש-א 9:00-23:30','~180-280 CZK','60-90 דקות',
        'פנקייקים + קפה Louvre = הארוחה הכי מסוגננת של הטיול! הזמינו מקום. שמרו מקום לקינוח – העוגות מדהימות.'],

      ['d7_lastlunch',7,'restaurant','🌆 Oblaka – ארוחה אחרונה על הגג',
        'מסעדה מפוארת על גג מלון Radisson Blu Alcron (קומה 12), עם נוף 360 מעלות על כל פראג. תפריט: מנות אירופאיות-מעודנות, ים-תיכוני, בשרים פרמיום. הכי טוב בתחתית השמיים של פראג. מושלם לסיום בלתי נשכח. צריך להזמין.',
        '','Medium','12:00-22:00','~400-700 CZK לאדם','2 שעות',
        '⚠️ הזמינו הרבה מראש! Dress code: smart casual. שמרו על ידי שמאל ל-19:00 ביציאה לשדה.'],

      ['d7_flight',7,'travel','✈️ טיסה QS1286 – חזרה לתל אביב',
        'המראה 23:45 מטרמינל 2 (טיסות שכר / low-cost) → נחיתה TLV 04:35+1. בדקו-אין אונליין 24 שעות מראש. מגבלת מזוודה: בדקו עם חברת SmartWings מראש. Bolt לשדה מהמרכז: ~30-40 דקות + ~500 CZK. מומלץ להזמין Bolt ב-Scheduled ride.',
        '','High','⚠️ יציאה מהמלון 20:30 (3 שעות לפני)','כרטיס קיים','-',
        '⚠️ ⚠️ הגיעו לשדה 20:45! בדקו-אין אונליין. אל תדחו – שדה VHV עמוס בלילה. הזמינו Bolt scheduled ride מראש.'],

      // BANK – יעדים גמישים
      ['bank_clementinum',-1,'attraction','📚 Clementinum – הספרייה הבארוקית',
        'הספרייה הבארוקית הכי יפה בעולם (לפי National Geographic!) שנבנתה ב-1722 ע"י הישועים. תקרות מצוירות עם מלאכים ואלגוריות, גלוב עתיק, ספרים מ-1600+. מגדל אסטרונומי עם תצפית על פראג ומרצדס בנץ של איינשטיין. גם: קונצרטים קלאסיים קטנים בספרייה עצמה!',
        'https://www.klementinum.com/en/','Medium','10:00-17:30 (כניסה אחרונה 17:00)','300 CZK / 200 CZK ילד','60 דקות',
        'הזמינו כרטיסים מראש! klementinum.com – מתמלא. סיור מודרך כל 30 דק׳. תמונות מהספרייה = אינסטגרם explosion!'],

      ['bank_municipal',-1,'attraction','🎭 Municipal House – בית העירייה',
        'ארמון Art Nouveau מרהיב מ-1912 על שרידי ארמון מלכותי מימי הביניים. אולם Smetana – אולם הקונצרטים הגדול של פראג עם קישוטי Alfons Mucha מדהימים. Kavárna Obecní dům – בית קפה וינאי פאר. תערוכות קבועות. קונצרטים קלאסיים כמעט מדי ערב.',
        'https://www.obecnidum.cz/en/','Medium','10:00-18:00','250 CZK סיור / חינם ללובי','60 דקות',
        'בדקו קונצרטים בתאריכים שלכם! obecnidum.cz. Kavárna מתחת = קפה מפואר. ללובי – כניסה חינם.'],

      ['bank_cruise',-1,'attraction','⛵ שייט Vltava – Prague Venice Boats',
        'שייט 1-2 שעות בנהר Vltava. עוברים מתחת לגשר קארל (תמונות מרהיבות!), Čechův most, מגדל Vyšehrad ממרחק ו-8 גשרים. ניתן להזמין שייט מוזיקלי בשקיעה. סירות קטנות עם פיינו + ספינות גדולות.',
        'https://www.prague-venice.cz/','Medium','10:00-22:00 (קיץ)','350-550 CZK לאדם','60-90 דקות',
        'שקיעה 20:00-21:00 = הכי יפה! הזמינו מראש – prague-venice.cz. שייט מוזיקלי +100 CZK – שווה.'],

      ['bank_national',-1,'attraction','🏛️ המוזיאון הלאומי – Národní muzeum',
        'מוזיאון ההיסטוריה הלאומי של צ׳כיה בקצה כיכר ונצלס. חזיתו המפורסמת שיוצגה בהפגנות 1968 ו-1989. ממצאים: פלאונטולוגיה, היסטוריה טבעית, מינרלוגיה, מוזיאון כוכבי הלכת. נפתח לאחר שיפוץ ב-2018 ונראה מרשים.',
        '','Low','10:00-18:00 (ג׳ עד 20:00)','250 CZK / 160 CZK ילד','1.5-2 שעות',
        'נוף מהמדרגות לכיכר ונצלס = יפה ומיוחד. מצוין ליום גשם! Hall of Minerals = ילדים אוהבים.'],

      ['bank_powder',-1,'attraction','🗼 מגדל האבקה – Prašná brána',
        'שער עיר גותי מ-1475 בין Old Town ל-Nové Město. 186 מדרגות לתצפית על כיכר ונצלס ורחוב Na Příkopě. מקשר ישנות לבית העירייה. שם "שער האבקה" מכיוון שאוחסן שם אבקת שריפה במאה ה-18.',
        '','Low','10:00-22:00 (קיץ)','130 CZK / 90 CZK ילד','30 דקות',
        'מצוין כתוספת לבית העירייה הסמוך. זהירות – מדרגות תלולות. לא למי שסובל מסחרחורת.'],

      ['bank_bolt',-1,'tip','🚖 Bolt – אפליקציית הנסיעות של פראג',
        'שירות הסעות הנוח ביותר לפראג. הרבה יותר זול ממוניות צהובות (Taxi Prague עלול לרמות!). נסיעה ממוצעת: מרכז→מרכז ~60-100 CZK, לשדה ~400-550 CZK. Bolt Pool: שיתוף נסיעה = ~30-50% זול יותר. הורידו לפני הטיסה + הגדירו כרטיס.',
        'https://bolt.eu/','High','24/7','~60-100 CZK/נסיעה','-',
        'הגדירו כרטיס אשראי לפני! שלמו תמיד ב-CZK. Scheduled ride = לשדה בלילה. אל תיקחו מונית מהרחוב!'],

      ['bank_imperial',-1,'restaurant','🎩 Café Imperial – ארוחת בוקר מלכותית',
        'בית קפה Art Nouveau מ-1914 עם אריחי קרמיקה עתיקים (handmade!) מפורסמים בעולם. ארוחות בוקר מפנקות: Eggs Benedict, בייגל עם סלמון, Avocado Toast, קפה פרמיום. ריקרדו להם: Czech Strudel תוצרת בית. הצלם Herb Ritts ואנשי תרבות בינ"ל אהבו כאן.',
        '','Medium','7:00-23:00','~200-350 CZK','60 דקות',
        'בקשו שולחן ליד הקיר עם האריחים – פוטוגני! ארוחת בוקר נחלשת כאן שווה את הפרמיום.'],

      ['bank_utri',-1,'restaurant','🦆 U Tří Zlatých Hvězd – ברווז קלוי קלאסי',
        'מסעדה צ׳כית מקומית נסתרת עם ברווז קלוי (Pečená kachna) קלאסי – הכי טוב בפראג. ין מוראבי מקומי, Svíčková מסורתי. בית צ׳כי אמיתי – לא תיירותי. knedlíky תוצרת בית. מנות ענקיות.',
        '','Medium','12:00-22:00','~250-380 CZK לאדם','90 דקות',
        'ברווז בדבש + knedlíky = החוויה הצ׳כית הכי אמיתית! יין Moravian לבן = הצמד המושלם.']
    ];

    var batch1 = P.slice(0, 25);
    var batch2 = P.slice(25);
    if (batch1.length) placesSheet.getRange(2, 1, batch1.length, 11).setValues(batch1);
    if (batch2.length) placesSheet.getRange(2 + batch1.length, 1, batch2.length, 11).setValues(batch2);
  }
}

function loadItinerary() {
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
        id:       String(a[0]),
        type:     String(a[2]),
        title:    String(a[3]),
        desc:     String(a[4]),
        link:     String(a[5]),
        priority: String(a[6]),
        hours:    String(a[7] || ''),
        price:    String(a[8] || ''),
        duration: String(a[9] || ''),
        tip:      String(a[10] || '')
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
}

function moveAttraction(attractionId, newDayIndex) {
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
}


function initAppDataDB() {
  var ss = getSpreadsheet_();
  var appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
  if (!appDataSheet) {
    appDataSheet = ss.insertSheet(APP_DATA_SHEET_NAME);
    appDataSheet.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]);
    appDataSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#071a33').setFontColor('#ffffff');
    appDataSheet.setFrozenRows(1);
    
    // Default budget
    appDataSheet.getRange(2, 1, 1, 2).setValues([['budget', '15000']]);
    
    // Default packing list
    var defaultPacking = [
      {text: "דרכונים (לוודא תוקף 6 חודשים!)", done: false},
      {text: "ביטוח נסיעות לחו\"ל", done: false},
      {text: "כסף זר (קורונות וקצת יורו ליתר ביטחון)", done: false},
      {text: "תרופות קבועות + משככי כאבים", done: false},
      {text: "בגדים נוחים ליום + לבוש ערב קל", done: false},
      {text: "נעלי הליכה נוחות", done: false},
      {text: "מטענים, כבלים וסוללת גיבוי", done: false}
    ];
    appDataSheet.getRange(3, 1, 1, 2).setValues([['packing_list', JSON.stringify(defaultPacking)]]);
  }
}

function loadAppData() {
  try {
    var ss = getSpreadsheet_();
    var appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    if (!appDataSheet) {
      initAppDataDB();
      appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    }
    
    var data = appDataSheet.getDataRange().getValues();
    var result = {};
    for (var i = 1; i < data.length; i++) {
      var key = data[i][0];
      var val = data[i][1];
      if (key === 'budget') {
         result.budget = Number(val);
      } else if (key === 'packing_list') {
         try {
           result.packing_list = JSON.parse(val);
         } catch(e) {
           result.packing_list = [];
         }
      }
    }
    return { ok: true, data: result };
  } catch (e) {
    Logger.log('loadAppData error: ' + e.stack);
    return { ok: false, error: e.message };
  }
}

function saveAppData(budget, packingList) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet_();
    var appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    if (!appDataSheet) {
      initAppDataDB();
      appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    }
    
    var data = appDataSheet.getDataRange().getValues();
    var budgetFound = false;
    var packingFound = false;
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'budget') {
        appDataSheet.getRange(i + 1, 2).setValue(budget);
        budgetFound = true;
      }
      if (data[i][0] === 'packing_list') {
        appDataSheet.getRange(i + 1, 2).setValue(JSON.stringify(packingList));
        packingFound = true;
      }
    }
    
    var newRowIdx = appDataSheet.getLastRow() + 1;
    if (!budgetFound) {
      appDataSheet.getRange(newRowIdx++, 1, 1, 2).setValues([['budget', budget]]);
    }
    if (!packingFound) {
      appDataSheet.getRange(newRowIdx, 1, 1, 2).setValues([['packing_list', JSON.stringify(packingList)]]);
    }
    
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('saveAppData error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
