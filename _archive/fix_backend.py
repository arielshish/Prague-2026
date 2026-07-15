import re

with open('gas_project/Code.gs', 'r', encoding='utf-8') as f:
    code = f.read()

# Add APP_DATA_SHEET_NAME
code = code.replace("const PLACES_SHEET_NAME = 'PlacesBank';", "const PLACES_SHEET_NAME = 'PlacesBank';\nconst APP_DATA_SHEET_NAME = 'AppData';")

# Append new functions at the bottom
new_funcs = """
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
"""

with open('gas_project/Code.gs', 'a', encoding='utf-8') as f:
    f.write("\n" + new_funcs)
