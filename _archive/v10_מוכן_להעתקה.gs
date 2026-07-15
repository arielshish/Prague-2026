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

function doGet() {
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
