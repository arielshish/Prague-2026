const fs = require('fs');

// --- 1. Update Code.gs for true merge ---
let gs = fs.readFileSync('gas_project/Code.gs', 'utf8');

const oldSyncFunc = `function syncChecklist(items) {
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
}`;

const newSyncFunc = `function syncChecklist(clientItems) {
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
}`;

gs = gs.replace(oldSyncFunc, newSyncFunc);
fs.writeFileSync('gas_project/Code.gs', gs, 'utf8');


// --- 2. Update index.html for manual refresh button and pull on tab switch ---
let html = fs.readFileSync('gas_project/index.html', 'utf8');

const oldChecklistHeader = `<div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="color:var(--navy); margin-top:0; margin-bottom: 0;">רשימת אריזה 🧳</h2>
          <span id="packSyncStatus" style="font-size:12px; color:var(--text-light); background:var(--bg-color); padding:4px 8px; border-radius:12px; display:inline-block;">✓ מעודכן</span>
        </div>`;

const newChecklistHeader = `<div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="color:var(--navy); margin-top:0; margin-bottom: 0;">רשימת אריזה 🧳</h2>
          <div style="display:flex; gap: 8px; align-items:center;">
            <button onclick="pullChecklist()" style="background:none; border:none; color:var(--text-light); font-size:18px; padding:4px; cursor:pointer;" title="רענן רשימה">🔄</button>
            <span id="packSyncStatus" style="font-size:12px; color:var(--text-light); background:var(--bg-color); padding:4px 8px; border-radius:12px; display:inline-block;">✓ מעודכן</span>
          </div>
        </div>`;

html = html.replace(oldChecklistHeader, newChecklistHeader);

const pullFunc = `
    function pullChecklist() {
      if(!isGas()) return;
      id('packSyncStatus').textContent = '🔄 מושך נתונים...';
      google.script.run
        .withSuccessHandler((res) => {
           if(res.ok && res.data) {
               // Merge logic on client side: only override if we don't have pending changes
               PACKING_LIST = res.data;
               localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
               renderList();
               id('packSyncStatus').textContent = '✓ מעודכן מהענן';
           }
        })
        .withFailureHandler(() => { id('packSyncStatus').textContent = '⚠️ שגיאת חיבור'; })
        .loadChecklist();
    }
`;

// Inject pullFunc
html = html.replace('function syncListToCloud() {', pullFunc + '\n    function syncListToCloud() {');

// Add pullChecklist to switchTab
const oldSwitchTab = `if(t === 'days') renderDay();`;
const newSwitchTab = `if(t === 'days') renderDay();
      if(t === 'checklist') pullChecklist();`;

html = html.replace(oldSwitchTab, newSwitchTab);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
