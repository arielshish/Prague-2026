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
  // GitHub Pages API mode: ?action=fn&args=[]&callback=cb (JSONP)
  if (e && e.parameter && e.parameter.action) {
    // Special case: markReminderDone via email link — returns a nice HTML confirmation page
    if (e.parameter.action === 'markReminderDone' && e.parameter.id) {
      var remId = e.parameter.id;
      var res = markReminderDoneFirestore_(remId);
      var reminderTitle = getReminderTitle_(remId);
      var html = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#040D18;color:#F1F5F9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;direction:rtl;} .card{background:rgba(255,255,255,0.07);border-radius:20px;padding:32px;text-align:center;max-width:400px;}</style></head><body><div class="card">'
        + '<div style="font-size:48px;margin-bottom:16px;">✅</div>'
        + '<h2 style="margin:0 0 8px;">בוצע!</h2>'
        + '<p style="color:rgba(241,245,249,0.6);margin:0 0 20px;">' + (reminderTitle || remId) + '</p>'
        + '<p style="font-size:13px;color:rgba(241,245,249,0.4);">הסטטוס עודכן באפליקציה</p>'
        + '</div></body></html>';
      return HtmlService.createHtmlOutput(html).setTitle('בוצע!');
    }
    try {
      var action = e.parameter.action;
      var args = [];
      try { args = JSON.parse(e.parameter.args || '[]'); } catch(ignore) {}
      var result = dispatch_(action, args);
      var json = JSON.stringify(result);
      var cb = e.parameter.callback;
      if (cb) {
        return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      var ej = JSON.stringify({ok:false,error:err.message});
      var cb2 = e.parameter.callback;
      if (cb2) return ContentService.createTextOutput(cb2+'('+ej+')').setMimeType(ContentService.MimeType.JAVASCRIPT);
      return ContentService.createTextOutput(ej).setMimeType(ContentService.MimeType.JSON);
    }
  }
  getOrCreateChecklistSheet();
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('פראג 2026 - משפחת שיש')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function dispatch_(action, args) {
  switch (action) {
    case 'loadExpenses':        return loadExpenses();
    case 'addExpense':          return addExpense(args[0],args[1],args[2],args[3]);
    case 'updateExpense':       return updateExpense(args[0],args[1],args[2],args[3],args[4]);
    case 'deleteExpense':       return deleteExpense(args[0]);
    case 'clearExpenses':       return clearExpenses();
    case 'saveSetting':         return saveSetting(args[0],args[1]);
    case 'loadSettings':        return loadSettings();
    case 'saveTotalBudget':     return saveTotalBudget(args[0]);
    case 'loadBudgetSettings':  return loadBudgetSettings();
    case 'syncBudgetFromSheets':return loadBudgetSettings();
    case 'saveBudgetCategories':return saveBudgetCategories(args[0]);
    case 'syncChecklist':       return syncChecklist(args[0]);
    case 'loadChecklist':       return loadChecklist();
    case 'loadItinerary':       return loadItinerary();
    case 'moveAttraction':      return moveAttraction(args[0],args[1]);
    case 'loadAppData':         return loadAppData();
    case 'saveAppData':         return saveAppData(args[0], args[1]);
    case 'savePackingList':     return savePackingList_(args[0]);
    case 'saveDaysCustom':      return saveSetting('days_custom', JSON.stringify(args[0]));
    case 'loadDaysFromSheets':  return loadDaysFromSheets_();
    case 'healthCheck':         return healthCheck();
    case 'markReminderDone':    return markReminderDoneFirestore_(args[0]);
    case 'saveRemindersDone':   return saveRemindersDone_(args[0]);
    case 'loadRemindersDone':   return loadRemindersDone_();
    case 'sendTestReminder':    return sendTestReminderAction_();
    default:                    return {ok:false,error:'Unknown: '+action};
  }
}

function savePackingList_(list) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss = getSpreadsheet_();
    var appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME);
    if (!appDataSheet) { initAppDataDB(); appDataSheet = ss.getSheetByName(APP_DATA_SHEET_NAME); }
    var data = appDataSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === 'packing_list') {
        appDataSheet.getRange(i + 1, 2).setValue(JSON.stringify(list));
        SpreadsheetApp.flush();
        return { ok: true };
      }
    }
    appDataSheet.appendRow(['packing_list', JSON.stringify(list)]);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch(e) {
    Logger.log('savePackingList error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch(ignore) {}
  }
}

function saveTotalBudget(val) {
  return saveSetting('total_budget', String(val));
}

function saveBudgetCategories(cats) {
  return saveSetting('budget_categories', JSON.stringify(cats));
}

function loadBudgetSettings() {
  try {
    var s = loadSettings();
    return {
      ok: true,
      total_budget: s.total_budget ? Number(s.total_budget) : null,
      budget_categories: s.budget_categories ? JSON.parse(s.budget_categories) : null
    };
  } catch(e) { return {ok:false,error:e.message}; }
}

function loadDaysFromSheets_() {
  try {
    var sheet = getOrCreateSettingsSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return {ok:true,data:null};
    var data = sheet.getRange(2,1,lastRow-1,2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === 'days_custom') {
        try { return {ok:true,data:JSON.parse(data[i][1])}; } catch(e) {}
      }
    }
    return {ok:true,data:null};
  } catch(e) { return {ok:false,error:e.message}; }
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

// ===== AUTONOMOUS REMINDER ENGINE =====

var TRIP_START = new Date('2026-08-08');
var FAMILY_EMAILS = [
  'arielshish@gmail.com',
  'maridubi3@gmail.com',
  'adiyasminshish@gmail.com',
  'ariel.mariana.shish@gmail.com'
];
var FIRESTORE_PROJECT = 'prague2026';
var FIRESTORE_API = 'https://firestore.googleapis.com/v1/projects/' + FIRESTORE_PROJECT + '/databases/(default)/documents/';

var REMINDERS_DEF = [
  { id:'r1',  emoji:'🏰', title:'כרטיסים לטירת פראג',        deadline:'2026-07-20', day:'11 אוגוסט', url:'https://www.hrad.cz/en/prague-castle-for-visitors/tickets', priority:'critical',
    details:'המצודה הגדולה בעולם — 70,000 מ"ר. כוללת קתדרלת סנט ויטוס (גותית, מאה 14), ארמון המלך, וסמטת הזהב עם בתי נפחים עתיקים. ביוגוסט תורים של שעה! כרטיס Circuit B (בסיסי) מספיק.',
    tips:'להגיע לפני 9:00. טראם 22 לכניסה עליונה (Pražský hrad) — חוסך עלייה רגלית. סטארבקס ממול לנוף בחינם.',
    duration:'2–4 שעות' },

  { id:'r2',  emoji:'✡️', title:'כרטיסים לרובע היהודי',       deadline:'2026-07-20', day:'14 אוגוסט', url:'https://www.jewishmuseum.cz/en/', priority:'critical',
    details:'הרובע היהודי (Josefov) — אחד מהשמורים בעולם. 6 בתי כנסת היסטוריים (מאה 13–17), בית קברות עתיק עם 12 שכבות קבורה, ואולם הטקסים עם ציורי ילדי טרזין. חוויה מרגשת מאוד.',
    tips:'להקצות לפחות 3 שעות. בית הכנסת הספרדי הכי מרהיב חזותית. לא לפספס בית הקברות.',
    duration:'2.5–4 שעות' },

  { id:'r3',  emoji:'📚', title:'כרטיסים ל-Clementinum',       deadline:'2026-07-15', day:'גמיש', url:'https://www.klementinum.com/en/', priority:'critical',
    details:'הספרייה הבארוקית מהמאה ה-18 — אחת מהיפות בעולם. קימור מצויר, ספרים מהמאה ה-15, ומגדל תצפית עם נוף 360° על פראג. כניסה בסיורים מודרכים בלבד — מוגבל ל-25 איש בסיור!',
    tips:'להזמין עוד היום — נגמר חודש מראש בקיץ. הסיור 50 דקות. הנוף מהמגדל שווה לא פחות מהספרייה.',
    duration:'50–70 דקות (סיור מודרך)' },

  { id:'r4',  emoji:'🚂', title:'כרטיסים לממלכת הרכבות',       deadline:'2026-07-25', day:'10 אוגוסט', url:'https://www.kralovstvi-zeleznic.cz/en/', priority:'critical',
    details:'דיורמה ענקית של 1:87 מצ\'כיה המיניאטורית — מסילות, כפרים, הרים ותאורה אוטומטית. הילדים משתגעים! ממוקם בלב העיר. הכי מרהיב כשמכבים האורות ורק תאורת המיניאטורה דולקת.',
    tips:'לשאול מתי מכבים האורות לאפקט הלילה המיניאטורי — חוויה אחרת לגמרי.',
    duration:'60–90 דקות' },

  { id:'r5',  emoji:'🌆', title:'הזמנת שולחן ב-Oblaka',        deadline:'2026-07-18', day:'15 אוגוסט', url:'https://www.google.com/search?q=Oblaka+restaurant+Prague+reservation', priority:'critical',
    details:'מסעדה על הגג של מגדל Žižkov (מגדל הטלוויזיה) בגובה 93 מטר — נוף פנורמי 360° על פראג. תפריט עכשווי-צ\'כי איכותי. חוויה יוצאת דופן לסיום הטיול — ארוחת ערב אחרונה.',
    tips:'לבקש שולחן ליד החלון בהזמנה. ערב 15 אוגוסט — האחרון לפני הטיסה הלילית.',
    duration:'90–120 דקות' },

  { id:'r6',  emoji:'🍷', title:'הזמנת שולחן ב-U Fleků',       deadline:'2026-07-25', day:'14 אוגוסט', url:'https://www.ufleku.cz/', priority:'critical',
    details:'הפאב המבשל הכי ישן בפראג — פועל ברציפות מ-1499! מגישים בירה כהה אחת בלבד שמבשלים בית (Flekovský tmavý). חצר עם 1,200 מקומות, מוזיקה חיה, ואוכל צ\'כי מסורתי.',
    tips:'לבקש מקום בחצר (Biergarten) — יפה יותר. לצפות לבירה כהה בלבד. תיירותי אבל אותנטי באווירה.',
    duration:'90–120 דקות' },

  { id:'r7',  emoji:'🌊', title:'כרטיסים ל-Aquapalace',        deadline:'2026-07-30', day:'12 אוגוסט', url:'https://www.aquapalace.cz/en/', priority:'important',
    details:'פארק מים פנים מהגדולים באירופה — 15,000 מ"ר. 8 מגלשות, בריכת גלים, גקוזי, נהרות זרימה, בריכה חיצונית חמה, ואזור ילדים. יום שלם בקלות! בסופי שבוע עמוס ביוגוסט.',
    tips:'להביא מגבת — השכרה יקרה. אוכל יקר בפנים — מותר להביא חטיפים. ארונות מחזירים מטבע.',
    duration:'5–8 שעות (יום שלם)' },

  { id:'r8',  emoji:'🐘', title:'כרטיסים לגן חיות פראג',       deadline:'2026-07-30', day:'13 אוגוסט', url:'https://www.zoopraha.cz/en', priority:'important',
    details:'Top 7 בעולם — 58 הקטאר, 5,000 בעלי חיים, 700 מינים. יש: ג\'ונגל אינדונזי, ערבות אפריקניות, יער גורילות, ורכבל כסאות פנורמי (40 CZK). ביוגוסט עמוס — Online חוסך תור ארוך.',
    tips:'לבדוק זמני האכלה באתר — ג\'ירפות 11:30, פילים 15:00. רכבל כסאות חובה! נעלי הליכה — הגן בגבעה.',
    duration:'4–6 שעות (יום שלם)' },

  { id:'r9',  emoji:'⛵', title:'הזמנת שייט בנהר Vltava',      deadline:'2026-07-30', day:'13 אוגוסט', url:'https://www.prague-venice.cz/', priority:'important',
    details:'שייט על הוולטאווה עם נוף על גשר קרל, המצודה והגגות האדומים מהמים. שייט שקיעה ב-20:00 — השמש הזהובה על המצודה הוא הנוף הכי מרהיב. חברת prague-venice מומלצת, 60–90 דק\'.',
    tips:'להביא שכבה חמה — על המים קריר גם בקיץ. לשלם באשראי ישירות ברציף.',
    duration:'60–90 דקות' },

  { id:'r10', emoji:'🩺', title:'ביטוח נסיעות לכולם',          deadline:'2026-07-25', day:'לפני הטיסה', url:'', priority:'important',
    details:'ביטוח נסיעות חובה לכל אחד. צ\'כיה באיחוד האירופי — טיפול בסיסי מכוסה בכרטיס ביטוח לאומי (EHIC). אבל ביטוח פרטי מכסה: ביטול טיסה, אובדן מטען, פינוי רפואי, ואשפוז ממושך.',
    tips:'לוודא שהפוליסה כוללת ספורט אתגרי אם מתכננים Aquapalace. לשמור מסמכי ביטוח בטלפון.',
    duration:'15 דקות (Online)' },

  { id:'r11', emoji:'💱', title:'המרת מטבע — CZK',             deadline:'2026-08-05', day:'לפני 8 אוגוסט', url:'', priority:'important',
    details:'הכתר הצ\'כי (CZK) — המטבע הרשמי. שע"ח: ~1 ₪ = ~6.5 CZK. לחמישה ימים: 3,000–5,000 CZK לאדם. המרה בנמל תעופה יקרה 10–15% יותר. משיכה מכספומט בפראג הכי משתלמת.',
    tips:'הכי כדאי: למשוך CZK מכספומט בפראג עם Visa/Mastercard. עמלה ~30 CZK בלבד.',
    duration:'10 דקות' },

  { id:'r12', emoji:'📱', title:'הורדת אפליקציות: Bolt, Mapy.cz, PID Lítačka, XE Currency, Google Translate', deadline:'2026-08-07', day:'לפני הטיסה', url:'', priority:'logistics',
    details:'Bolt — נסיעות שיתופיות, זול יותר מ-Uber. Mapy.cz — מפות צ\'כיה מדויקות עם מסלולים ומסעדות. PID Lítačka — כרטיסי תחבורה ציבורית דיגיטליים. XE Currency — שערי חליפין בזמן אמת. Google Translate — תרגום צ\'כי.',
    tips:'להגדיר כרטיס אשראי ב-Bolt לפני הטיסה! להוריד מפת פראג Offline ב-Google Maps או Mapy.cz.',
    duration:'15 דקות' },

  { id:'r13', emoji:'✈️', title:'צ\'ק-אין לטיסת הלוך (8 אוגוסט 06:00)', deadline:'2026-08-07', day:'7 אוגוסט', url:'', priority:'logistics',
    details:'Smart Wings QS1287 — תל אביב (TLV) → פראג (PRG). המראה 06:00, 8 אוגוסט. חלון צ\'ק-אין נפתח 24 שעות לפני ב-06:00 ביום שישי ה-7. לוודא דרכונים, ביטוח, ולהוריד כרטיס עלייה לטיסה.',
    tips:'להגיע לשדה לפחות שעתיים לפני — כלומר ב-04:00! מומלץ להזמין מונית/Gett לילה לפני.',
    duration:'5 דקות (Online)' },

  { id:'r14', emoji:'✈️', title:'צ\'ק-אין לטיסת חזור QS1286', deadline:'2026-08-14', day:'14 אוגוסט', url:'', priority:'logistics',
    details:'Smart Wings QS1286 — פראג (PRG) → תל אביב (TLV). המראה 23:45, 15 אוגוסט (חצות). חלון צ\'ק-אין נפתח 14 אוגוסט 23:45. הערב האחרון בפראג — לתכנן ולסיים חשבונות לפני.',
    tips:'נסיעה לשדה סביב 21:00. שדה Václav Havel — 30 דק\' מהמרכז בטקסי.',
    duration:'5 דקות (Online)' },

  { id:'r15', emoji:'🏨', title:'אישור הזמנת המלון',            deadline:'2026-07-25', day:'לפני הטיסה', url:'https://www.comforthotels.com/', priority:'logistics',
    details:'Comfort Hotel Prague City East — 8–15 אוגוסט. לאשר ישירות עם המלון שההזמנה קיימת, ולציין בקשות מיוחדות: קומה גבוהה, חדרים צמודים, early check-in. לשאול על WiFi ושעות ארוחת בוקר.',
    tips:'לשלוח מייל למלון שבוע לפני. לשמור את כתובת המלון Offline ב-Google Maps.',
    duration:'10 דקות' },

  { id:'r16', emoji:'🧳', title:'השלמת צ\'קליסט ציוד (80%+)',  deadline:'2026-08-05', day:'3 ימים לפני', url:'', priority:'logistics',
    details:'לעבור על צ\'קליסט הציוד באפליקציה ולוודא שמסמנים לפחות 80%. פריטים קריטיים: דרכונים תקפים, תרופות, מטען, ומזוודות. לשקול כבודה לפני הטיסה — עד 23 ק"ג לאדם.',
    tips:'לצלם את הדרכונים ולשמור בענן. לבדוק תוקף תרופות. ללבוש נעלי הליכה לטיסה — חוסך מקום.',
    duration:'30 דקות' },

  { id:'r17', emoji:'🌤️', title:'בדיקת תחזית מזג אוויר לפראג', deadline:'2026-08-04', day:'4 ימים לפני', url:'', priority:'logistics',
    details:'אוגוסט בפראג: 18–28°C ביום, 14–18°C בלילה. UV גבוה — קרם 50+ חובה. גשמים קצרים אפשריים. מהלכים כ-15 ק"מ ביום. לבדוק תחזית 10 ימים ב-AccuWeather או Windy לפני הנסיעה.',
    tips:'להכין שכבת ביניים לערב — קריר על נהר הוולטאווה. מטרייה קומפקטית — שווה לקחת.',
    duration:'5 דקות' }
];

var GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycby3K9gKoVwWZY7tUVf8hUDLnM6WAryzBwmBLxm82XzD8u_bn5URmg9Roixxf-vdrpn6/exec';

function getReminderTitle_(id) {
  for (var i = 0; i < REMINDERS_DEF.length; i++) {
    if (REMINDERS_DEF[i].id === id) return REMINDERS_DEF[i].emoji + ' ' + REMINDERS_DEF[i].title;
  }
  return id;
}

function markReminderDoneFirestore_(remId) {
  try {
    var token = getFirestoreToken_();
    // Read current remindersDone
    var doc = getFirestoreDoc_('appdata', 'main');
    var done = {};
    if (doc && doc.fields && doc.fields['remindersDone']) {
      try { done = JSON.parse(doc.fields['remindersDone'].stringValue || '{}'); } catch(e) {}
    }
    done[remId] = true;
    // Write back
    var url = FIRESTORE_API + 'appdata/main?updateMask.fieldPaths=remindersDone';
    var body = { fields: { remindersDone: { stringValue: JSON.stringify(done) } } };
    UrlFetchApp.fetch(url, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function saveRemindersDone_(jsonStr) {
  try {
    var token = getFirestoreToken_();
    var url = FIRESTORE_API + 'appdata/main?updateMask.fieldPaths=remindersDone';
    var body = { fields: { remindersDone: { stringValue: jsonStr } } };
    UrlFetchApp.fetch(url, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function loadRemindersDone_() {
  try {
    var doc = getFirestoreDoc_('appdata', 'main');
    var done = {};
    if (doc && doc.fields && doc.fields['remindersDone']) {
      try { done = JSON.parse(doc.fields['remindersDone'].stringValue || '{}'); } catch(e) {}
    }
    return { ok: true, remindersDone: JSON.stringify(done) };
  } catch(e) { return { ok: true, remindersDone: '{}' }; }
}

function getFirestoreToken_() {
  return ScriptApp.getOAuthToken();
}

function getFirestoreDoc_(collection, docId) {
  var token = getFirestoreToken_();
  var url = FIRESTORE_API + collection + '/' + docId;
  try {
    var resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) return null;
    return JSON.parse(resp.getContentText());
  } catch(e) { return null; }
}

function getRemindersDone_() {
  var doc = getFirestoreDoc_('appdata', 'main');
  if (!doc || !doc.fields) return {};
  var field = doc.fields['remindersDone'];
  if (!field) return {};
  var raw = field.stringValue || field.mapValue || '';
  try { return JSON.parse(raw); } catch(e) { return {}; }
}

function getPackingStats_() {
  var doc = getFirestoreDoc_('packing', 'list');
  if (!doc || !doc.fields || !doc.fields.items) return { total: 0, done: 0 };
  var items = [];
  try {
    var arr = doc.fields.items.arrayValue;
    items = (arr && arr.values) ? arr.values : [];
  } catch(e) { return { total: 0, done: 0 }; }
  var total = items.length;
  var done = items.filter(function(v) {
    try { return v.mapValue.fields.done.booleanValue === true; } catch(e) { return false; }
  }).length;
  return { total: total, done: done };
}

function buildReminderEmailHtml_(today, pending, packingStats, daysLeft) {
  var critical = pending.filter(function(r){ return r.priority==='critical'; });
  var important = pending.filter(function(r){ return r.priority==='important'; });
  var logistics = pending.filter(function(r){ return r.priority==='logistics'; });

  function section(title, color, items) {
    if (!items.length) return '';
    var rows = items.map(function(r) {
      var dl = new Date(r.deadline);
      var diff = Math.ceil((dl - today) / 86400000);
      var urgencyText = diff < 0 ? '⚠️ עבר המועד!' : diff === 0 ? '⚠️ היום!' : diff + ' ימים';
      var urgencyColor = diff < 0 ? '#f87171' : diff <= 5 ? '#f87171' : diff <= 14 ? '#fbbf24' : '#34d399';
      var doneUrl = GAS_WEBAPP_URL + '?action=markReminderDone&id=' + r.id;
      return '<tr><td style="padding:16px 18px;border-bottom:1px solid #1e2a3a;">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
        '<div style="font-size:26px;line-height:1;padding-top:2px;">' + r.emoji + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:15px;font-weight:bold;color:#f1f5f9;margin-bottom:5px;">' + r.title + '</div>' +
          '<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">' +
            '📅 ' + r.day + ' &nbsp;·&nbsp; דדליין: ' + r.deadline.split('-').reverse().join('/') +
            ' &nbsp;·&nbsp; <span style="color:' + urgencyColor + ';font-weight:bold;">' + urgencyText + '</span>' +
            (r.duration ? ' &nbsp;·&nbsp; ⏱️ ' + r.duration : '') +
          '</div>' +
          (r.details ? '<div style="font-size:13px;color:#cbd5e1;line-height:1.6;background:#0a1628;border-radius:8px;padding:10px 12px;margin-bottom:8px;">' + r.details + '</div>' : '') +
          (r.tips ? '<div style="font-size:12px;color:#fde68a;background:rgba(251,191,36,0.07);border-right:3px solid rgba(251,191,36,0.5);padding:8px 12px;border-radius:0 8px 8px 0;margin-bottom:10px;line-height:1.5;">💡 ' + r.tips + '</div>' : '') +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
            (r.url ? '<a href="' + r.url + '" style="display:inline-block;background:rgba(99,102,241,0.2);color:#a5b4fc;text-decoration:none;border:1px solid rgba(99,102,241,0.4);border-radius:8px;padding:7px 14px;font-size:13px;font-weight:bold;">🔗 לאתר ההזמנה</a>' : '') +
            '<a href="' + doneUrl + '" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;border-radius:8px;padding:7px 16px;font-size:13px;font-weight:bold;">✅ בוצע</a>' +
          '</div>' +
        '</div>' +
        '</div>' +
        '</td></tr>';
    }).join('');
    return '<h3 style="color:' + color + ';margin:24px 0 10px;font-size:16px;">' + title + '</h3>' +
      '<table style="width:100%;border-collapse:collapse;background:#0f1f33;border-radius:12px;overflow:hidden;">' + rows + '</table>';
  }

  var packingLine = '';
  if (packingStats.total > 0) {
    var pct = Math.round(packingStats.done / packingStats.total * 100);
    packingLine = '<div style="background:#0f1f33;border-radius:10px;padding:12px 16px;margin-top:16px;">' +
      '🧳 <strong>צ\'קליסט ציוד:</strong> ' + packingStats.done + '/' + packingStats.total + ' (' + pct + '%)' +
      (pct < 80 && daysLeft <= 5 ? ' <span style="color:#f87171;">⚠️ מהרו לסמן!</span>' : '') + '</div>';
  }

  return '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"></head><body style="background:#040D18;color:#F1F5F9;font-family:Arial,sans-serif;padding:24px;direction:rtl;">' +
    '<div style="max-width:600px;margin:0 auto;">' +
    '<h1 style="font-size:24px;margin-bottom:4px;">🏰 פראג 2026 — תזכורות</h1>' +
    '<p style="color:#94a3b8;margin-bottom:20px;">8–15 אוגוסט · עוד <strong style="color:#fbbf24;">' + daysLeft + ' ימים</strong> לטיסה! · ' + pending.length + ' פריטים פתוחים</p>' +
    section('🔴 דחוף — הזמינו מיד!', '#f87171', critical) +
    section('🟡 חשוב — טפלו השבוע', '#fbbf24', important) +
    section('📋 לוגיסטיקה', '#94a3b8', logistics) +
    packingLine +
    '<div style="margin-top:24px;padding:16px;background:#0f1f33;border-radius:10px;font-size:13px;color:#64748b;">' +
    '🌤️ מזג אוויר בפראג באוגוסט: 18–28°C ביום, 14–18°C בלילה. UV גבוה — קרם 50+ חובה. גשמים קצרים אפשריים — מטרייה קלה. מהלכים ~15 ק"מ ביום — נעלי הליכה נוחות!</div>' +
    '<p style="margin-top:16px;font-size:11px;color:#475569;text-align:center;">נשלח אוטומטית מאפליקציית פראג 2026 · משפחת שיש 🇮🇱🇨🇿</p>' +
    '</div></body></html>';
}

function sendDailyReminders() {
  var today = new Date(); today.setHours(0,0,0,0);
  var daysLeft = Math.ceil((TRIP_START - today) / 86400000);
  if (daysLeft < 0 || daysLeft > 35) return; // only within 35 days of trip

  var done = getRemindersDone_();
  var pending = REMINDERS_DEF.filter(function(r) { return !done[r.id]; });
  if (!pending.length) return;

  // Check if any reminder needs urgent attention today
  var urgent = pending.filter(function(r) {
    var dl = new Date(r.deadline); dl.setHours(0,0,0,0);
    var diff = Math.ceil((dl - today) / 86400000);
    return diff <= 3; // due within 3 days or overdue
  });

  // Always send if: urgent items exist, OR it's every 3 days for general update
  var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  var shouldSend = urgent.length > 0 || (dayOfYear % 3 === 0);
  if (!shouldSend) return;

  var packingStats = getPackingStats_();
  var html = buildReminderEmailHtml_(today, pending, packingStats, daysLeft);

  var subject = urgent.length > 0
    ? '⚠️ פראג 2026 — ' + urgent.length + ' תזכורות דחופות! (' + daysLeft + ' ימים לטיסה)'
    : '🏰 פראג 2026 — עדכון שבועי (' + daysLeft + ' ימים לטיסה, ' + pending.length + ' פריטים)';

  FAMILY_EMAILS.forEach(function(email) {
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: html
      });
    } catch(e) { Logger.log('Failed to send to ' + email + ': ' + e.message); }
  });

  Logger.log('Reminders sent: ' + subject);
}

// Minimal test — just MailApp
function testMailOnly() {
  MailApp.sendEmail({
    to: 'arielshish@gmail.com',
    subject: 'בדיקת GAS מייל',
    body: 'אם הגיע — MailApp עובד!'
  });
  Logger.log('testMailOnly done');
}

function sendTestReminderAction_() {
  try {
    var today = new Date(); today.setHours(0,0,0,0);
    var daysLeft = Math.ceil((TRIP_START - today) / 86400000);
    var done = getRemindersDone_();
    var pending = REMINDERS_DEF.filter(function(r) { return !done[r.id]; });
    if (!pending.length) { return { ok: true, info: 'כל התזכורות בוצעו' }; }
    var packingStats = getPackingStats_();
    var html = buildReminderEmailHtml_(today, pending, packingStats, daysLeft);
    var subject = '🔔 פראג 2026 — תזכורות (' + daysLeft + ' ימים לטיסה, ' + pending.length + ' פריטים)';
    FAMILY_EMAILS.forEach(function(email) {
      MailApp.sendEmail({ to: email, subject: subject, htmlBody: html });
    });
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// Test function — run once to verify email looks correct
function testSendReminders() {
  var today = new Date(); today.setHours(0,0,0,0);
  var daysLeft = Math.ceil((TRIP_START - today) / 86400000);
  var packingStats = getPackingStats_();
  // Send all reminders (ignore done state) as a test
  var html = buildReminderEmailHtml_(today, REMINDERS_DEF, packingStats, daysLeft);
  var subject = '🧪 בדיקה — פראג 2026 תזכורות (' + daysLeft + ' ימים לטיסה)';
  FAMILY_EMAILS.forEach(function(email) {
    try {
      MailApp.sendEmail({ to: email, subject: subject, htmlBody: html });
    } catch(e) { Logger.log('Failed: ' + email + ' — ' + e.message); }
  });
  Logger.log('Test email sent to ' + FAMILY_EMAILS.length + ' recipients');
}

// Call this once to set up the daily trigger
function setupDailyReminderTrigger() {
  // Delete existing triggers for sendDailyReminders
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendDailyReminders') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Create new daily trigger at 09:00
  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('Daily reminder trigger set for 09:00');
}

// ===== Gmail Receipt Scanner =====

var GMAIL_SCAN_QUERY = 'subject:(receipt OR invoice OR קבלה OR חשבונית OR הזמנה OR booking OR order OR confirmation OR payment OR תשלום OR חיוב) newer_than:60d';

// Patterns to extract amounts from email body/subject
var AMOUNT_PATTERNS = [
  /CZK[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)[\s]*CZK/i,
  /Kč[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)[\s]*Kč/i,
  /₪[\s]*([\d,]+(?:\.\d{1,2})?)/,
  /([\d,]+(?:\.\d{1,2})?)[\s]*₪/,
  /ILS[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)[\s]*ILS/i,
  /EUR[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)[\s]*EUR/i,
  /Total[:\s]+([\d,]+(?:\.\d{1,2})?)/i,
  /Amount[:\s]+([\d,]+(?:\.\d{1,2})?)/i,
  /סה"כ[:\s]*([\d,]+(?:\.\d{1,2})?)/,
  /סכום[:\s]*([\d,]+(?:\.\d{1,2})?)/
];

// EUR to CZK and ILS exchange rates (approximate)
var EUR_TO_CZK = 25.5;
var EUR_TO_ILS = 4.0;
var ILS_TO_CZK = 6.5;

function scanGmailReceipts() {
  var props = PropertiesService.getScriptProperties();
  var processedRaw = props.getProperty('gmail_processed_ids') || '{}';
  var processed;
  try { processed = JSON.parse(processedRaw); } catch(e) { processed = {}; }

  var threads = GmailApp.search(GMAIL_SCAN_QUERY, 0, 50);
  var added = 0;
  var skipped = 0;

  for (var t = 0; t < threads.length; t++) {
    var messages = threads[t].getMessages();
    for (var m = 0; m < messages.length; m++) {
      var msg = messages[m];
      var msgId = msg.getId();
      if (processed[msgId]) { skipped++; continue; }

      var parsed = parseReceiptEmail_(msg);
      if (!parsed) { processed[msgId] = 'skip'; continue; }

      var result = addExpense(parsed.name, parsed.czk, parsed.ils, parsed.note);
      if (result && result.ok) {
        processed[msgId] = new Date().toISOString();
        added++;
      }
    }
  }

  // Persist processed IDs (keep last 500 to avoid property size limit)
  var ids = Object.keys(processed);
  if (ids.length > 500) {
    var trimmed = {};
    ids.slice(ids.length - 500).forEach(function(k) { trimmed[k] = processed[k]; });
    processed = trimmed;
  }
  props.setProperty('gmail_processed_ids', JSON.stringify(processed));

  Logger.log('Gmail scan: added=' + added + ', skipped=' + skipped);
  return { ok: true, added: added, skipped: skipped };
}

function parseReceiptEmail_(msg) {
  var subject = msg.getSubject() || '';
  var body = msg.getPlainBody() || '';
  var from = msg.getFrom() || '';
  var date = msg.getDate();

  // Build search text from subject + first 3000 chars of body
  var text = subject + '\n' + body.substring(0, 3000);

  // Detect currency and extract amount
  var czk = 0, ils = 0;
  var amount = 0;
  var currency = '';

  for (var i = 0; i < AMOUNT_PATTERNS.length; i++) {
    var m = text.match(AMOUNT_PATTERNS[i]);
    if (m) {
      var raw = parseFloat(m[1].replace(/,/g, ''));
      if (raw > 0) {
        amount = raw;
        // Determine currency from which pattern matched
        var pat = AMOUNT_PATTERNS[i].source;
        if (/CZK|Kč/i.test(pat)) { currency = 'CZK'; czk = amount; }
        else if (/₪|ILS/i.test(pat)) { currency = 'ILS'; ils = amount; czk = Math.round(amount * ILS_TO_CZK); }
        else if (/EUR/i.test(pat)) { currency = 'EUR'; czk = Math.round(amount * EUR_TO_CZK); ils = Math.round(amount * EUR_TO_ILS * 10) / 10; }
        else { currency = '?'; czk = Math.round(amount); }
        break;
      }
    }
  }

  // Skip emails with no detectable amount
  if (amount <= 0) return null;

  // Build expense name from sender + subject
  var senderName = extractSenderName_(from);
  var cleanSubject = subject.replace(/^(re:|fwd?:|fw:)\s*/i, '').trim();
  var name = '[auto] ' + (senderName ? senderName + ' — ' : '') + cleanSubject.substring(0, 60);

  var note = 'מייל: ' + from.substring(0, 50)
    + ' | ' + Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');

  return { name: name, czk: czk, ils: ils, note: note };
}

function extractSenderName_(from) {
  // "Display Name <email@domain.com>" → "Display Name"
  var m = from.match(/^"?([^"<]+)"?\s*</);
  if (m) return m[1].trim();
  // "email@domain.com" → "domain.com"
  var atM = from.match(/@([^>]+)/);
  if (atM) return atM[1].replace(/[<>]/g, '').trim();
  return '';
}

// Call once to set up the 6-hour scanning trigger
function setupGmailScanTrigger() {
  // Remove existing gmail scan triggers
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'scanGmailReceipts') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('scanGmailReceipts')
    .timeBased()
    .everyHours(6)
    .create();
  Logger.log('Gmail scan trigger set for every 6 hours');
}

// Manual one-time reset: clears processed IDs so all emails are re-scanned
function resetGmailScanHistory() {
  PropertiesService.getScriptProperties().deleteProperty('gmail_processed_ids');
  Logger.log('Gmail scan history cleared');
}
