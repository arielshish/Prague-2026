// ===== Prague Storybook 2026 - משפחת שיש =====
// Apps Script Backend - Code.gs  v2.2 - compatible with animated August HTML
// שינויים: הוסף getStopInfo(), batch import שיפורים, error logging

var SPREADSHEET_ID = '10YqbLWnbwlVWtl_czqlIk4T_ksi9HcY4kIiLASKGBFE';
var SHEET_NAME = 'הוצאות';
var SETTINGS_SHEET_NAME = 'הגדרות';

// ─── STOP INFO DATA (for popup enrichment from server if needed) ─────────────
var STOP_CATALOG = {
  'כיכר העיר העתיקה': { mapUrl: 'https://www.google.com/maps/place/Old+Town+Square,+Prague', type: 'attraction' },
  'גשר קארל': { mapUrl: 'https://www.google.com/maps/place/Charles+Bridge,+Prague', type: 'attraction' },
  'Prague Zoo': { mapUrl: 'https://www.google.com/maps/place/Prague+Zoo', type: 'attraction' },
  'Aquapalace Prague': { mapUrl: 'https://www.google.com/maps/place/Aquapalace+Prague', type: 'activity' },
  'טירת פראג': { mapUrl: 'https://www.google.com/maps/place/Prague+Castle', type: 'attraction' }
};

// ─── doGet ───────────────────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('פראג 2026 - משפחת שיש')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────
function getOrCreateSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['תאריך', 'שם', 'CZK', 'שח', 'הערה']);
  } else {
    var headers = sheet.getRange(1, 1, 1, 5).getValues()[0];
    if (headers[0] !== 'תאריך' || headers[1] !== 'שם') {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, 5).setValues([['תאריך', 'שם', 'CZK', 'שח', 'הערה']]);
    }
  }

  sheet.getRange(1, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#071a33')
    .setFontColor('#ffffff');
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 220);
  sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  sheet.getRange('C:D').setNumberFormat('#,##0');

  return sheet;
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

// ─── CRUD: loadExpenses ───────────────────────────────────────────────────────
function loadExpenses() {
  try {
    var sheet = getOrCreateSheet();
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      var hasData = r[1] !== '' || r[2] !== '' || r[3] !== '' || r[4] !== '';
      if (hasData) {
        rows.push({
          id: i + 1,
          date: formatExpenseDate_(r[0]),
          name: String(r[1] || ''),
          czk: Number(r[2] || 0),
          ils: Number(r[3] || 0),
          note: String(r[4] || '')
        });
      }
    }
    return rows;
  } catch (e) {
    Logger.log('loadExpenses error: ' + e.message);
    return [];
  }
}

// ─── CRUD: addExpense ─────────────────────────────────────────────────────────
function addExpense(name, czk, ils, note) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!name || String(name).trim() === '') {
      return { error: 'שם קטגוריה לא יכול להיות ריק' };
    }
    var sheet = getOrCreateSheet();
    sheet.appendRow([new Date(), String(name).trim(), Number(czk || 0), Number(ils || 0), String(note || '')]);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('addExpense error: ' + e.message);
    return { error: e.message };
  }
}

// ─── CRUD: updateExpense ──────────────────────────────────────────────────────
function updateExpense(rowIndex, name, czk, ils, note) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    rowIndex = Number(rowIndex);
    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { error: 'Invalid row index: ' + rowIndex };
    }
    sheet.getRange(rowIndex, 2, 1, 4).setValues([
      [String(name || ''), Number(czk || 0), Number(ils || 0), String(note || '')]
    ]);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('updateExpense error: ' + e.message);
    return { error: e.message };
  }
}

// ─── CRUD: deleteExpense ──────────────────────────────────────────────────────
function deleteExpense(rowIndex) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    rowIndex = Number(rowIndex);
    if (!rowIndex || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
      return { error: 'Invalid row index: ' + rowIndex };
    }
    sheet.deleteRow(rowIndex);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('deleteExpense error: ' + e.message);
    return { error: e.message };
  }
}

// ─── CRUD: clearExpenses ──────────────────────────────────────────────────────
function clearExpenses() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('clearExpenses error: ' + e.message);
    return { error: e.message };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function getOrCreateSettingsSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['מפתח', 'ערך', 'עדכון אחרון']]);
    sheet.getRange(1, 1, 1, 3)
      .setFontWeight('bold')
      .setBackground('#071a33')
      .setFontColor('#ffffff');
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 160);
  }
  return sheet;
}

function saveSetting(key, value) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSettingsSheet();
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(key)) {
        sheet.getRange(i + 1, 2, 1, 2).setValues([[String(value), new Date()]]);
        SpreadsheetApp.flush();
        return { ok: true };
      }
    }
    sheet.appendRow([String(key), String(value), new Date()]);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('saveSetting error: ' + e.message);
    return { error: e.message };
  }
}

function loadSettings() {
  try {
    var sheet = getOrCreateSettingsSheet();
    var data = sheet.getDataRange().getValues();
    var settings = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== '') {
        settings[String(data[i][0])] = String(data[i][1] || '');
      }
    }
    return settings;
  } catch (e) {
    Logger.log('loadSettings error: ' + e.message);
    return {};
  }
}

// ─── importExpenses (batch) ───────────────────────────────────────────────────
function importExpenses(rows) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateSheet();

    // Clear existing data rows
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      SpreadsheetApp.flush();
      return { ok: true, imported: 0 };
    }

    // Validate and build values
    var values = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      values.push([
        new Date(),
        String(r.name || '').trim(),
        Number(r.czk || 0),
        Number(r.ils || 0),
        String(r.note || '')
      ]);
    }

    sheet.getRange(2, 1, values.length, 5).setValues(values);
    SpreadsheetApp.flush();
    return { ok: true, imported: values.length };
  } catch (e) {
    Logger.log('importExpenses error: ' + e.message);
    return { error: e.message };
  }
}

// ─── NEW: getStopInfo ─────────────────────────────────────────────────────────
// Returns enriched stop data from server-side catalog (future extensibility)
function getStopInfo(stopName) {
  try {
    var info = STOP_CATALOG[stopName];
    return info ? { ok: true, data: info } : { ok: false };
  } catch (e) {
    Logger.log('getStopInfo error: ' + e.message);
    return { ok: false, error: e.message };
  }
}

// ─── NEW: getSummary ──────────────────────────────────────────────────────────
// Returns expense summary for BI dashboard
function getSummary() {
  try {
    var expenses = loadExpenses();
    var totalCzk = 0, totalIls = 0;
    var byCategory = {};

    expenses.forEach(function(e) {
      totalCzk += e.czk;
      totalIls += e.ils;
      if (!byCategory[e.name]) byCategory[e.name] = { czk: 0, ils: 0, count: 0 };
      byCategory[e.name].czk += e.czk;
      byCategory[e.name].ils += e.ils;
      byCategory[e.name].count++;
    });

    return {
      ok: true,
      totalCzk: totalCzk,
      totalIls: totalIls,
      count: expenses.length,
      byCategory: byCategory
    };
  } catch (e) {
    Logger.log('getSummary error: ' + e.message);
    return { ok: false, error: e.message };
  }
}
