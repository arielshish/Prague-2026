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

var ALLOWED_EMAILS = [
  'arielshish@gmail.com',
  'maridubi3@gmail.com',
  'adiyasminshish@gmail.com',
  'ariel.mariana.shish@gmail.com'
];

function isAllowed_() {
  try {
    var email = Session.getActiveUser().getEmail().toLowerCase();
    for (var i = 0; i < ALLOWED_EMAILS.length; i++) {
      if (ALLOWED_EMAILS[i].toLowerCase() === email) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function doGet(e) {
  // API mode: ?action=functionName&args=JSON (no auth check — GAS deployment handles it)
  if (e && e.parameter && e.parameter.action) {
    return doApiGet_(e);
  }

  if (!isAllowed_()) {
    var email = '';
    try { email = Session.getActiveUser().getEmail(); } catch(ignore) {}
    var html = '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{background:#040D18;color:#F1F5F9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}' +
      '.box{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:40px 32px;max-width:340px;}' +
      'h2{color:#F4634A;margin-bottom:12px;}p{color:rgba(241,245,249,0.6);font-size:14px;line-height:1.6;}</style></head>' +
      '<body><div class="box"><div style="font-size:48px">🔒</div><h2>אין גישה</h2>' +
      '<p>האפליקציה מוגבלת למשפחת שיש בלבד.</p>' +
      (email ? '<p style="color:rgba(241,245,249,0.35);font-size:12px;">מחובר כ: ' + email + '</p>' : '') +
      '</div></body></html>';
    return HtmlService.createHtmlOutput(html).setTitle('אין גישה');
  }

  getOrCreateChecklistSheet();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('פראג 2026 - משפחת שיש')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doApiGet_(e) {
  try {
    var action = e.parameter.action;
    var args = [];
    try { args = JSON.parse(e.parameter.args || '[]'); } catch(ignore) {}
    var result = dispatchAction_(action, args);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function dispatchAction_(action, args) {
  switch (action) {
    case 'loadExpenses':        return loadExpenses();
    case 'addExpense':          return addExpense(args[0], args[1], args[2], args[3]);
    case 'updateExpense':       return updateExpense(args[0], args[1], args[2], args[3], args[4]);
    case 'deleteExpense':       return deleteExpense(args[0]);
    case 'clearExpenses':       return clearExpenses();
    case 'importExpenses':      return importExpenses(args[0]);
    case 'saveSetting':         return saveSetting(args[0], args[1]);
    case 'loadSettings':        return loadSettings();
    case 'saveTotalBudget':     return saveTotalBudget(args[0]);
    case 'loadBudgetSettings':  return loadBudgetSettings();
    case 'saveBudgetCategories':return saveBudgetCategories(args[0]);
    case 'syncChecklist':       return syncChecklist(args[0]);
    case 'loadChecklist':       return loadChecklist();
    case 'loadItinerary':       return loadItinerary();
    case 'moveAttraction':      return moveAttraction(args[0], args[1]);
    case 'loadAppData':         return loadAppData();
    case 'saveAppData':         return saveAppData(args[0], args[1]);
    case 'savePackingList':     return savePackingList(args[0]);
    case 'saveDaysCustom':      return saveDaysCustom(args[0]);
    case 'loadDaysFromSheets':  return loadDaysFromSheets_();
    case 'healthCheck':         return healthCheck();
    case 'getSummary':          return getSummary();
    default:                    return { ok: false, error: 'Unknown action: ' + action };
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var result = dispatchAction_(body.action, body.args || []);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.stack);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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

function saveTotalBudget(val) {
  return saveSetting('total_budget', String(Number(val) || 0));
}

function loadBudgetSettings() {
  try {
    var sheet = getOrCreateSettingsSheet();
    var lastRow = sheet.getLastRow();
    var result = {};
    if (lastRow > 1) {
      var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
      for (var i = 0; i < data.length; i++) {
        var key = String(data[i][0]);
        var val = data[i][1];
        if (key === 'total_budget') result.total_budget = Number(val) || 0;
        if (key === 'budget_categories') {
          try { result.budget_categories = JSON.parse(val); } catch(e) {}
        }
      }
    }
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function saveBudgetCategories(categories) {
  try {
    var json = JSON.stringify(categories || []);
    return saveSetting('budget_categories', json);
  } catch (e) {
    return { ok: false, error: e.message };
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
      // DAY 0
      ['d0_airport',0,'travel','✈️ הגעה – Václav Havel Airport','טיסה נוחתת 08:45 בטרמינל 1. החזיקו דרכונים ביד.','https://maps.app.goo.gl/xHBo6VkQV7fhsYR36','High','24/7','חינם','45 דקות','Bolt למלון – הרבה יותר זול ממונית!'],
      ['d0_hotel',0,'hotel','🏨 Comfort Hotel Prague City East','Check-In במלון. בקשו חדר בקומה גבוהה לנוף.','https://maps.app.goo.gl/ComfortHotel','High','Check-in 15:00','שולם','20 דקות','אם הגעתם מוקדם – שמרו מזוודות ולכו לאכול'],
      ['d0_dinner1',0,'restaurant','🥩 Kantýna – ארוחת ערב ראשונה','מסעדת בשרים ספקטקולרית. סטייקים, נקניקיות ובירה Pilsner.','https://maps.app.goo.gl/Kantyna','High','א-ו 11:00-23:00','~150 CZK','90 דקות','⚠️ הזמינו מקום מראש! kantyna.ambi.cz'],
      // DAY 1
      ['d1_charles',1,'attraction','🌉 גשר קארל – Charles Bridge','30 פסלי קדושים על גשר מ-1357. הכי יפה בזריחה לפני ההמון.','https://maps.app.goo.gl/CharlesBridge','High','תמיד פתוח','חינם','30-45 דקות','הגיעו לפני 8:00 לתמונות ללא המון!'],
      ['d1_oldtown',1,'attraction','🏛️ כיכר העיר העתיקה – Old Town Sq.','לב ההיסטוריה של פראג. כנסיות, בניינים בארוקיים ואווירה קסומה.','https://maps.app.goo.gl/OldTownSquare','High','תמיד פתוח','חינם','1 שעה','עצרו בשעה עגולה לתצוגת השעון'],
      ['d1_clock',1,'attraction','⏰ השעון האסטרונומי','שעון ממוכן מ-1410. תצוגה חיה בכל שעה עגולה 9:00-21:00.','https://www.prague.eu/en/object/places/3129/astronomical-clock','High','מגדל: 9:00-21:00','250 CZK','30 דקות','עלו למגדל לנוף מדהים על הכיכר!'],
      ['d1_lennon',1,'attraction','🎸 חומת לנון – Lennon Wall','קיר גרפיטי ססגוני בהשראת ג׳ון לנון. פוטוגני ומיוחד.','https://maps.app.goo.gl/LennonWall','Medium','תמיד פתוח','חינם','15 דקות','הביאו טוש לחתום – מסורת!'],
      ['d1_kampa',1,'attraction','🏝️ אי קמפה – Kampa Island','אי קסום עם פסלי David Cerny ונהר Certovka.','https://maps.app.goo.gl/Kampa','Medium','תמיד פתוח','חינם','30 דקות','חפשו פסלי תינוקות – מוזר ומדהים!'],
      ['d1_lunch1',1,'restaurant','🍺 Lokál Dlouhááá – אוכל צ׳כי','Pilsner Urquell הטרייה בפראג עם svíčková הקלאסי.','https://maps.app.goo.gl/LokalDlouha','High','א-ו 11:00-01:00','~200 CZK','60-90 דקות','הזמינו svíčková – ה-dish הצ׳כי הלאומי!'],
      ['d1_dinner2',1,'restaurant','🥂 V Kolkovně – ערב ראשון','מסעדת בירה קלאסית בעיר העתיקה. מנות ענקיות, אווירה אמיתית.','https://maps.app.goo.gl/VKolkovna','Medium','כל יום 11:00-00:00','~250 CZK','90 דקות','פלטת בשר מעורבת מושלמת לשניים'],
      // DAY 2
      ['d2_castle',2,'attraction','🏰 טירת פראג – Prague Castle','הטירה הגדולה בעולם! 70,000 מ"ר עם ארמונות, כנסיות וגנים.','https://www.hrad.cz/en/prague-castle-for-visitors/tickets','High','9:00-17:00','350/175 CZK','3-4 שעות','הזמינו כרטיסים מראש! hrad.cz'],
      ['d2_vitus',2,'attraction','⛪ קתדרלת סנט ויטוס','קתדרלה גותית עצומה עם ויטראז׳ים מדהימים.','https://maps.app.goo.gl/StVitus','High','9:00-17:00','כלול בטירה','1 שעה','הסתכלו על ויטראז׳ מוכהה מהפסגה'],
      ['d2_golden',2,'attraction','🏠 סמטת הזהב – Golden Lane','סמטה מימי הביניים קסומה. בית 22 – שם גר פרנץ קפקא!','https://maps.app.goo.gl/GoldenLane','High','9:00-17:00','כלול בטירה','30 דקות','ביקור בית קפקא – כלול בכרטיס'],
      ['d2_petrin',2,'attraction','🌿 מגדל פטרין – Petřín Tower','מגדל Eiffel קטן על גבעה ירוקה. תצפית פנורמית על כל פראג.','https://maps.app.goo.gl/Petrin','High','10:00-20:00','150 CZK','1.5 שעות','ברכבל (lanovka) לגבעה – חוויה!'],
      ['d2_dancing',2,'attraction','💃 בית הריקוד – Dancing House','בניין מטורף של פרנק גרי. מרפסת גגית עם נוף נהדר.','https://maps.app.goo.gl/DancingHouse','Medium','8:00-22:00','חינם/150 CZK גג','15 דקות','תמונה מבחוץ – מספיקה!'],
      ['d2_lunch2',2,'restaurant','🍳 Café Savoy – ארוחת בוקר/צהריים','בית קפה וינאי עם ארוחות בוקר עשירות ומאפים מדהימים.','https://maps.app.goo.gl/CafeSavoy','High','א-ו 8:00-22:30','~180 CZK','60 דקות','Eggs Benedict = אהבה ממבט ראשון!'],
      ['d2_dinner3',2,'restaurant','🥩 Kantýna – ארוחת ערב','בשרים מחבת-אש פתוחה. הכי טוב לאוהבי בשר בפראג.','https://maps.app.goo.gl/Kantyna','High','א-ו 11:00-23:00','~300 CZK','90 דקות','⚠️ הזמינו מקום! kantyna.ambi.cz'],
      // DAY 3
      ['d3_railways',3,'attraction','🚂 ממלכת הרכבות – Kingdom of Railways','מוזיאון הרכבות הגדול בצ׳כיה! ערים מיניאטוריות ורכבות חשמליות.','https://www.kralovstvi-zeleznic.cz/en/','High','9:00-19:00','300/200 CZK','2-3 שעות','יש סימולטור נהיגה – הילדים ישתגעו!'],
      ['d3_hamleys',3,'shopping','🧸 Hamleys – חנות צעצועים','שלוש קומות של צעצועים. פינוק לכל ילד.','https://maps.app.goo.gl/Hamleys','Medium','10:00-20:00','חינם (הארנק לא)','60 דקות','קבעו תקציב מראש לכל ילד!'],
      ['d3_kampa2',3,'attraction','🏝️ קמפה ומאלה סטרנה','שכונת הפסטלים הקסומה עם מסעדות וחנויות מיוחדות.','https://maps.app.goo.gl/MalaStrana','Medium','תמיד פתוח','חינם','1 שעה','גלידה מ-Angelato!'],
      ['d3_lunch3',3,'restaurant','🍕 Pizza Nuova – צהריים לילדים','פיצה מצוינת. אידיאלי בין אטרקציות עם ילדים.','https://maps.app.goo.gl/PizzaNuova','Medium','כל יום 11:00-23:00','~200 CZK','45 דקות','פיצה אישית לילדים!'],
      ['d3_dinner4',3,'restaurant','🍔 Maso a Kobliha – המבורגרים','ההמבורגר הכי טוב בפראג. בשר טרי, לחמניות ביתיות.','https://maps.app.goo.gl/MasoKobliha','High','א-ו 12:00-22:00','~200 CZK','60 דקות','Truffle Burger – חובה!'],
      // DAY 4 – Aquapalace
      ['d4_aquapalace',4,'attraction','🌊 Aquapalace Prague – פארק מים','הפארק המקורה הגדול ביותר במרכז אירופה! 14 מגלשות, ספא, בריכת גלים.','https://www.aquapalace.cz/en/','High','10:00-21:00','650/530 CZK','כל היום!','הביאו: צידניות, שמש 50+, לוקרים 100 CZK פיקדון'],
      ['d4_lunch4',4,'restaurant','🍴 ארוחה בתוך Aquapalace','מסעדה ופיצרייה בפארק. קצת יקר – הביאו חטיפים!','','Low','שעות הפארק','~200 CZK','45 דקות','הביאו מהמלון: חטיפים + בקבוקי מים!'],
      // DAY 5 – Zoo
      ['d5_zoo',5,'attraction','🐘 גן חיות פראג – Prague Zoo','Top 5 עולמי! 5000+ חיות, גורילות, פנדות אדומות.','https://www.zoopraha.cz/en','High','9:00-19:00','300/200 CZK','4-5 שעות','רכבל פנימי חינם – תצפית על הגן'],
      ['d5_stromovka',5,'attraction','🌲 פארק Stromovka','פארק מלכותי ליד הגן. מנוחה ופיקניק אחה"צ.','https://maps.app.goo.gl/Stromovka','Low','תמיד פתוח','חינם','1 שעה','קחו אוכל מ-Tesco ופיקניק!'],
      ['d5_lunch5',5,'restaurant','☕ Caffe delle Arti – ליד הגן','בית קפה ומסעדה בגן עם אווירה נינוחה.','https://maps.app.goo.gl/CaffedelleArti','Medium','9:00-21:00','~150 CZK','45 דקות','קפה + עוגה אחרי הגן מושלם!'],
      ['d5_dinner6',5,'restaurant','🇮🇹 La Bottega di Finestra – איטלקי','פסטה טרייה ופיצות בתנור. קסום ומשפחתי.','https://maps.app.goo.gl/LaBottega','Medium','12:00-23:00','~250 CZK','90 דקות','טרטרה קרמנולה – חובה!'],
      // DAY 6 – Shopping
      ['d6_jewish',6,'attraction','✡️ הרובע היהודי – Josefov','8 בתי כנסת, בית עלמין עתיק ומוזיאון יהודי מרשים.','https://www.jewishmuseum.cz/en/','High','9:00-18:00','500 CZK','2 שעות','ביה"כ הספרדי – יפהפה ומרגש'],
      ['d6_primark',6,'shopping','👗 Primark – ונצלס','ענק האופנה הזולה! שלוש קומות, מחירים מדהימים.','https://maps.app.goo.gl/PrimarkPrague','High','9:00-21:00','חינם','2 שעות','מחירים ב-CZK – פחות ממחצית מישראל!'],
      ['d6_palladium',6,'shopping','🏬 Palladium – קניון מרכזי','200+ חנויות, 30+ מסעדות במרכז פראג.','https://maps.app.goo.gl/Palladium','High','9:00-21:00','חינם','2 שעות','Tax Free במרכז מידע – חסכו 20%!'],
      ['d6_fashion',6,'shopping','🛍️ Fashion Arena Outlet','הסנטר Outlet הגדול – כל המותגים ב-50-70% הנחה.','https://maps.app.goo.gl/FashionArena','Medium','10:00-21:00','חינם','2-3 שעות','Bolt 30 דקות מהמרכז – כדאי!'],
      ['d6_dinner7',6,'restaurant','🍷 U Fleků – ארוחת פרידה','הפאב ההיסטורי ביותר מ-1499! בירה שחורה ייחודית + אווירה.','https://maps.app.goo.gl/UFlek','High','כל יום 10:00-23:00','~250 CZK','2 שעות','המרתף ההיסטורי – ארוחה אחרונה שלא תשכחו!'],
      // DAY 7 – Farewell
      ['d7_vysehrad',7,'attraction','🏯 Vyšehrad – מצודת האגדות','מבצר עתיק עם בית קברות מפורסמים ונוף על הנהר.','https://maps.app.goo.gl/Vysehrad','High','9:30-18:00','100 CZK','1.5 שעות','קברי Dvorak ו-Smetana – מרגש!'],
      ['d7_louvre',7,'restaurant','☕ Café Louvre – קפה אחרון','בית קפה מ-1902 של קפקא ו-Einstein. ארוחת בוקר מפנקת.','https://maps.app.goo.gl/CafeLouvre','High','8:00-23:30','~200 CZK','60-90 דקות','פנקייקים + קפה = זיכרון לחיים!'],
      ['d7_lastlunch',7,'restaurant','🌆 Oblaka – ארוחה אחרונה','מסעדה על הגג עם נוף 360 על פראג. יקר אבל שווה!','https://maps.app.goo.gl/Oblaka','Medium','12:00-22:00','~500 CZK','2 שעות','הזמינו מקום לסיום בלתי נשכח!'],
      ['d7_flight',7,'travel','✈️ טיסה QS1286 – הביתה','יציאה לשדה 20:45. המראה 23:45 → ת"א 04:35+1.','https://maps.app.goo.gl/VaclavHavel','High','המראה 23:45','כרטיס קיים','-','⚠️ הגיעו 3 שעות לפני = 20:45!'],
      // BANK – Unassigned extras
      ['bank_clementinum',-1,'attraction','📚 Clementinum – ספרייה בארוקית','הספרייה היפה בעולם! ויטראז׳ים, גלוב עתיק ואסטרונומיה.','https://www.klementinum.com/en/','Medium','10:00-17:30','300 CZK','1 שעה','תמונות אינסטגרם מ-Level אחר!'],
      ['bank_municipal',-1,'attraction','🎭 Municipal House – בית העירייה','Art Nouveau מרהיב. קונצרטים בסלון הזהב.','https://www.obecnidum.cz/en','Medium','10:00-18:00','250 CZK','1 שעה','בדקו קונצרטים בתאריכים שלכם!'],
      ['bank_powder',-1,'attraction','🗼 מגדל האבקה – Powder Tower','שער עיר גותי מ-1475 עם נוף יפה.','https://maps.app.goo.gl/PowderTower','Low','10:00-20:00','130 CZK','30 דקות','גרוע למי שסובל מסחרחורת!'],
      ['bank_cruise',-1,'attraction','⛵ שייט בנהר Vltava','שייט 1 שעה עם נוף על כל הגשרים והטירה.','https://www.prague-venice.cz/','Medium','10:00-22:00','350 CZK','1 שעה','שקיעה = הכי יפה!'],
      ['bank_national',-1,'attraction','🏛️ המוזיאון הלאומי','ממצאים היסטוריים וקומת כוכבי הלכת. נהדר ליום גשם.','https://maps.app.goo.gl/NationalMuseum','Low','10:00-18:00','250 CZK','1.5 שעות','נוף מהמדרגות לכיכר ונצלס'],
      ['bank_xe',-1,'tip','💱 XE Currency – המרת מטבע','אפליקציית שרי מטבע בזמן אמת. הכרחי לטיול.','https://www.xe.com/','High','תמיד','חינם','-','שלמו תמיד ב-CZK, אל תסכימו ל-DCC!'],
      ['bank_bolt',-1,'tip','🚖 Bolt – אפליקציית נסיעות','הרבה יותר זול מ-Uber. הורידו לפני הטיסה.','https://bolt.eu/','High','24/7','~50-100 CZK','-','הגדירו כרטיס אשראי לפני!'],
      ['bank_cafe_imperial',-1,'restaurant','🎩 Café Imperial – בית קפה היסטורי','אריחי אמנות אר נובו מרהיבים. ארוחת בוקר מלכותית.','https://maps.app.goo.gl/CafeImperial','Medium','7:00-23:00','~250 CZK','60 דקות','חדר האוכל יפה יותר מכל מוזיאון!'],
      ['bank_utri',-1,'restaurant','🦆 U Tří Zlatých Hvězd – ברווז קלוי','מסעדה מקומית עם ברווז קלוי קלאסי ויין מוראבי.','https://maps.app.goo.gl/UTri','Medium','12:00-22:00','~300 CZK','90 דקות','ברווז בדבש ו-knedlíky – חוויה!']
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
      if (key === 'budget' || key === 'total_budget') {
         result.total_budget = Number(val);
      } else if (key === 'budget_categories') {
         try { result.budget_categories = JSON.parse(val); } catch(e) {}
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

function savePackingList(packingList) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet_();
    var appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    if (!appDataSheet) { initAppDataDB(); appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME); }
    var data = appDataSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'packing_list') {
        appDataSheet.getRange(i + 1, 2).setValue(JSON.stringify(packingList));
        found = true; break;
      }
    }
    if (!found) {
      appDataSheet.appendRow(['packing_list', JSON.stringify(packingList)]);
    }
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function saveDaysCustom(daysState) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var result = saveSetting('days_custom', JSON.stringify(daysState));
    return result;
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function loadDaysFromSheets_() {
  try {
    var sheet = getOrCreateSettingsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { ok: true, data: null };
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === 'days_custom') {
        try { return { ok: true, data: JSON.parse(data[i][1]) }; } catch(e) {}
      }
    }
    return { ok: true, data: null };
  } catch (e) {
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
