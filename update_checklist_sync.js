const fs = require('fs');

// --- 1. Update Code.gs ---
let gs = fs.readFileSync('gas_project/Code.gs', 'utf8');

const checklistFuncs = `
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

function syncChecklist(items) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = getOrCreateChecklistSheet();
    
    // Clear everything except header
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 4).clearContent();
    }
    
    if (!items || items.length === 0) {
      return { ok: true };
    }
    
    // Rebuild array for google sheets
    var values = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      values.push([item.id || ('id_' + i), item.category || '', item.text || '', item.done ? true : false]);
    }
    
    sheet.getRange(2, 1, values.length, 4).setValues(values);
    SpreadsheetApp.flush();
    return { ok: true };
  } catch (e) {
    Logger.log('syncChecklist error: ' + e.stack);
    return { ok: false, error: e.message };
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
`;

gs += '\n' + checklistFuncs;
fs.writeFileSync('gas_project/Code.gs', gs, 'utf8');


// --- 2. Update index.html ---
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// A. Add the sync indicator to the Checklist tab header
const oldTabChecklistHeader = `<h2 style="color:var(--navy); margin-top:0;">רשימת אריזה 🧳</h2>`;
const newTabChecklistHeader = `<div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="color:var(--navy); margin-top:0; margin-bottom: 0;">רשימת אריזה 🧳</h2>
          <span id="packSyncStatus" style="font-size:12px; color:var(--text-light); background:var(--bg-color); padding:4px 8px; border-radius:12px; display:inline-block;">✓ מעודכן</span>
        </div>`;
html = html.replace(oldTabChecklistHeader, newTabChecklistHeader);

// B. Update load/save logic for PACKING_LIST
const oldSaveList = `    function saveList() {
      localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
      renderList();
    }`;

const newSaveList = `    function saveList() {
      localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
      renderList();
      syncListToCloud();
    }
    
    let syncTimeout = null;
    function syncListToCloud() {
      if(!isGas()) return;
      
      id('packSyncStatus').textContent = '🔄 מסנכרן...';
      
      // Debounce saving to avoid hitting quota
      if(syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        google.script.run
          .withSuccessHandler(() => { id('packSyncStatus').textContent = '✓ שותף בענן'; })
          .withFailureHandler(() => { id('packSyncStatus').textContent = '⚠️ שגיאה בענן'; })
          .syncChecklist(PACKING_LIST);
      }, 1000);
    }`;

html = html.replace(oldSaveList, newSaveList);


// C. Hook into initialization
// We need to call google.script.run.loadChecklist during init.
const oldInit = `      let savedPack = localStorage.getItem('prague_pack_v2');
      if(savedPack) {
        try { PACKING_LIST = JSON.parse(savedPack); }catch(e){}
      }
      renderList();`;

const newInit = `      let savedPack = localStorage.getItem('prague_pack_v2');
      if(savedPack) {
        try { PACKING_LIST = JSON.parse(savedPack); }catch(e){}
      }
      renderList();
      
      if(isGas()) {
        id('packSyncStatus').textContent = '🔄 מוריד מהענן...';
        google.script.run
          .withSuccessHandler((res) => {
             if(res.ok && res.data && res.data.length > 0) {
                 PACKING_LIST = res.data;
                 localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
                 renderList();
                 id('packSyncStatus').textContent = '✓ מסונכרן לענן';
             } else {
                 id('packSyncStatus').textContent = '✓ מעודכן';
                 syncListToCloud(); // If empty on cloud but exists locally, push it
             }
          })
          .loadChecklist();
      }`;

html = html.replace(oldInit, newInit);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
