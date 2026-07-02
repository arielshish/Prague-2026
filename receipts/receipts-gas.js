// ═══════════════════════════════════════════════════════════════
//  📊 RECEIPTS DASHBOARD — Google Apps Script
//  מחבר ג'ימייל → Google Sheets אוטומטית
//  Version 1.0 | arielshish@gmail.com
// ═══════════════════════════════════════════════════════════════

// ─── הגדרות ───────────────────────────────────────────────────
var CONFIG = {
  SHEET_RAW:     'חשבוניות',      // גיליון נתונים גולמיים
  SHEET_SUMMARY: 'סיכום',         // גיליון סיכום וגרפים
  SHEET_SUBS:    'מינויים',       // גיליון מינויים חוזרים
  SEARCH_DAYS:   730,             // 2 שנות חיפוש לאחור
  MAX_THREADS:   500,             // מקסימום שרשורים לסריקה
};

// ─── מיפוי ספקים → קטגוריה + סכום ידוע ──────────────────────
var VENDORS = [
  // { match: טקסט לחפש בנושא/שולח, cat, name, monthlyAmount, type }
  { match: /apple/i,             name:'Apple',               cat:'🍎 Apple',         type:'מינוי',  monthly:0  },
  { match: /icloud/i,            name:'iCloud+',             cat:'🍎 Apple',         type:'מינוי',  monthly:39.90 },
  { match: /chatgpt/i,           name:'ChatGPT Plus',        cat:'🤖 AI',            type:'מינוי',  monthly:69.90 },
  { match: /anthropic/i,         name:'Anthropic Claude',    cat:'🤖 AI',            type:'מינוי',  monthly:0  },
  { match: /google.?play/i,      name:'Google Play',         cat:'🎬 דיגיטל',        type:'מינוי',  monthly:25 },
  { match: /רמי.?לוי/i,          name:'רמי לוי תקשורת',     cat:'📱 תקשורת',        type:'מינוי',  monthly:80 },
  { match: /rami.?levy/i,        name:'רמי לוי תקשורת',     cat:'📱 תקשורת',        type:'מינוי',  monthly:80 },
  { match: /we.?com/i,           name:'we-com',              cat:'📱 תקשורת',        type:'מינוי',  monthly:50 },
  { match: /xphone|אקספון/i,     name:'אקספון',              cat:'📱 תקשורת',        type:'מינוי',  monthly:50 },
  { match: /strauss|שטראוס|tami4|תמי.?4/i, name:'שטראוס מים תמי4', cat:'💧 בית',   type:'מינוי',  monthly:60 },
  { match: /איתוראן/i,           name:'איתוראן',             cat:'🚗 רכב',           type:'מינוי',  monthly:50 },
  { match: /דני.?חזן/i,          name:'אקדמיה דני חזן',     cat:'🏃 ספורט וחינוך', type:'מינוי',  monthly:450},
  { match: /קרקס.?יער/i,         name:'קרקס יער',            cat:'🏃 ספורט וחינוך', type:'מינוי',  monthly:90 },
  { match: /גום.?וואלנס/i,       name:'גום וואלנס',          cat:'🏃 ספורט וחינוך', type:'מינוי',  monthly:0  },
  { match: /ksp/i,               name:'KSP',                 cat:'🛍️ קניות',        type:'חד פעמי',monthly:0  },
  { match: /תנאור/i,             name:'תנאור תכשיטים',       cat:'🛍️ קניות',        type:'חד פעמי',monthly:0  },
  { match: /bgood|ביגוד/i,       name:'BGOOD',               cat:'🛍️ קניות',        type:'חד פעמי',monthly:0  },
  { match: /idgu/i,              name:'idgu',                cat:'🛍️ קניות',        type:'חד פעמי',monthly:0  },
  { match: /paypal/i,            name:'PayPal',              cat:'💳 תשלומים',       type:'חד פעמי',monthly:0  },
  { match: /wizzair|wizz.?air/i, name:'Wizz Air',            cat:'✈️ נסיעות',        type:'חד פעמי',monthly:0  },
  { match: /issta|איסתא/i,       name:'ISSTA',               cat:'✈️ נסיעות',        type:'חד פעמי',monthly:0  },
  { match: /holidayfinder/i,     name:'holidayfinder',       cat:'✈️ נסיעות',        type:'חד פעמי',monthly:0  },
  { match: /ypay/i,              name:'YPAY קבלה',           cat:'💳 תשלומים',       type:'חד פעמי',monthly:0  },
  { match: /ירושלים|jerusalem/i, name:'עיריית ירושלים',      cat:'🏛️ עיריות',        type:'חד פעמי',monthly:0  },
  { match: /קרית.?שמונה|metropolis/i, name:'עיריית ק.שמונה', cat:'🏛️ עיריות',       type:'מינוי',  monthly:0  },
  { match: /submission|סאבמישיין|מכבי.*אם/i, name:'BJJ Submission', cat:'🏃 ספורט וחינוך', type:'חד פעמי', monthly:0 },
  { match: /פטלי/i,              name:'פטלי',                cat:'🍽️ אוכל',          type:'חד פעמי',monthly:0  },
  { match: /planet|פלאנט/i,      name:'פלאנט קולנוע',        cat:'🎭 בידור',         type:'חד פעמי',monthly:0  },
  { match: /מובילנד/i,           name:'מובילנד קולנוע',      cat:'🎭 בידור',         type:'חד פעמי',monthly:0  },
  { match: /יעקב.?נוי/i,         name:'יעקב נוי אחזקות',    cat:'🔧 תחזוקה',        type:'חד פעמי',monthly:0  },
  { match: /פרינטדיו/i,          name:'פרינטדיו',            cat:'🖨️ שירותים',       type:'חד פעמי',monthly:0  },
  { match: /פרלשטיין/i,          name:'ד״ר פרלשטיין',        cat:'🏥 בריאות',        type:'חד פעמי',monthly:0  },
  { match: /שיער|ולסקז/i,        name:'משמחת שיער',          cat:'💈 טיפוח',         type:'חד פעמי',monthly:0  },
];

// ─── חילוץ סכום מטקסט ─────────────────────────────────────────
function extractAmount(text) {
  if (!text) return '';
  // מחפש: ₪69.90 / 69.90 ₪ / סכום: 450.00 / Amount: 39.90
  var patterns = [
    /₪\s*([\d,]+\.?\d*)/,
    /([\d,]+\.?\d*)\s*₪/,
    /סכום[:\s]*([\d,]+\.?\d*)/,
    /amount[:\s]*([\d,]+\.?\d*)/i,
    /total[:\s]*([\d,]+\.?\d*)/i,
    /charged[:\s\w]*?([\d,]+\.?\d*)/i,
  ];
  for (var i = 0; i < patterns.length; i++) {
    var m = text.match(patterns[i]);
    if (m) {
      var val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 0 && val < 100000) return val;
    }
  }
  return '';
}

// ─── זיהוי ספק ────────────────────────────────────────────────
function matchVendor(subject, sender) {
  var hay = (subject + ' ' + sender).toLowerCase();
  for (var i = 0; i < VENDORS.length; i++) {
    if (VENDORS[i].match.test(hay)) return VENDORS[i];
  }
  return { name: sender.split('@')[0], cat: '❓ אחר', type: 'חד פעמי', monthly: 0 };
}

// ─── סריקת ג'ימייל ─────────────────────────────────────────────
function syncReceipts() {
  var ss = SpreadsheetApp.openById('13s1Sr3fWICwSDYF1XjAyZuYEvr5tpADL262L87k3-8w');

  // יצירת/קבלת גיליון גולמי
  var rawSheet = ss.getSheetByName(CONFIG.SHEET_RAW) || ss.insertSheet(CONFIG.SHEET_RAW);
  rawSheet.clearContents();

  // כותרות
  var headers = ['תאריך','ספק','נושא','קטגוריה','סוג','סכום (₪)','שולח','מזהה'];
  rawSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  rawSheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1e293b').setFontColor('#94a3b8')
    .setFontWeight('bold').setFontSize(11);
  rawSheet.setFrozenRows(1);

  // בניית שאילתת חיפוש
  var after = new Date();
  after.setDate(after.getDate() - CONFIG.SEARCH_DAYS);
  var dateStr = Utilities.formatDate(after, 'Asia/Jerusalem', 'yyyy/MM/dd');
  var query = 'subject:(חשבונית OR קבלה OR receipt OR invoice OR הזמנה OR payment OR קבלה) after:' + dateStr;

  var threads = GmailApp.search(query, 0, CONFIG.MAX_THREADS);
  var rows = [];
  var seen = {};

  threads.forEach(function(thread) {
    var msgs = thread.getMessages();
    msgs.forEach(function(msg) {
      var id = msg.getId();
      if (seen[id]) return;
      seen[id] = true;

      var subject = msg.getSubject() || '';
      var sender  = msg.getFrom() || '';
      var date    = msg.getDate();
      var body    = (msg.getPlainBody() || '').substring(0, 800);
      var combined = subject + ' ' + body;

      var vendor  = matchVendor(subject, sender);
      var amount  = extractAmount(combined);

      rows.push([
        Utilities.formatDate(date, 'Asia/Jerusalem', 'dd/MM/yyyy'),
        vendor.name,
        subject.substring(0, 80),
        vendor.cat,
        vendor.type,
        amount,
        sender.replace(/<.*>/,'').trim(),
        id
      ]);
    });
  });

  // מיון לפי תאריך (חדש → ישן)
  rows.sort(function(a,b){ return new Date(b[0].split('/').reverse().join('-')) - new Date(a[0].split('/').reverse().join('-')); });

  if (rows.length > 0) {
    rawSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    // עיצוב עמודת סכום
    rawSheet.getRange(2, 6, rows.length, 1).setNumberFormat('₪#,##0.00');
    // עיצוב שורות לסירוגין
    for (var r = 0; r < rows.length; r++) {
      var bg = r % 2 === 0 ? '#0f172a' : '#1e293b';
      rawSheet.getRange(r+2, 1, 1, headers.length).setBackground(bg).setFontColor('#f1f5f9');
    }
  }

  // רוחב עמודות אוטומטי
  rawSheet.autoResizeColumns(1, headers.length);

  // בניית גיליונות סיכום
  buildSummary(ss, rows);
  buildSubscriptions(ss);

  // הוסף timestamp
  var ui = null; try { ui = SpreadsheetApp.getUi(); } catch(e) {}
  var ts = 'עודכן: ' + Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm');
  rawSheet.getRange(1, headers.length + 2).setValue(ts).setFontColor('#64748b').setFontSize(9);

  Logger.log('סונכרן: ' + rows.length + ' רשומות');
  if (ui) ui.alert('✅ עודכן בהצלחה!\n\n' + rows.length + ' רשומות נסרקו.');
}

// ─── גיליון סיכום ─────────────────────────────────────────────
function buildSummary(ss, rows) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_SUMMARY) || ss.insertSheet(CONFIG.SHEET_SUMMARY);
  sheet.clearContents();
  sheet.setTabColor('#6366f1');

  // ספירה לפי קטגוריה
  var catMap = {};
  rows.forEach(function(r) {
    var cat = r[3], amt = parseFloat(r[5]) || 0;
    if (!catMap[cat]) catMap[cat] = { count:0, total:0 };
    catMap[cat].count++;
    catMap[cat].total += amt;
  });

  // כותרת
  sheet.getRange('A1').setValue('📊 סיכום הוצאות לפי קטגוריה')
    .setFontSize(14).setFontWeight('bold').setFontColor('#f1f5f9');
  sheet.getRange('A1:D1').setBackground('#1e293b').merge();

  var headers = ['קטגוריה', 'מספר קבלות', 'סכום מזוהה (₪)', 'הערה'];
  sheet.getRange(2, 1, 1, 4).setValues([headers])
    .setBackground('#334155').setFontColor('#94a3b8').setFontWeight('bold');

  var cats = Object.keys(catMap).sort(function(a,b){return catMap[b].total - catMap[a].total;});
  var summaryRows = cats.map(function(cat) {
    return [cat, catMap[cat].count, catMap[cat].total || '', catMap[cat].total < 1 ? '* סכום לא זוהה בנושא' : ''];
  });

  if (summaryRows.length > 0) {
    sheet.getRange(3, 1, summaryRows.length, 4).setValues(summaryRows);
    sheet.getRange(3, 3, summaryRows.length, 1).setNumberFormat('₪#,##0.00');
    // צבעים לסירוגין
    for (var i=0; i<summaryRows.length; i++) {
      sheet.getRange(i+3,1,1,4).setBackground(i%2===0?'#0f172a':'#1e293b').setFontColor('#f1f5f9');
    }
  }

  // סיכום כולל
  var totalRow = summaryRows.length + 4;
  sheet.getRange(totalRow, 1).setValue('סה״כ').setFontWeight('bold').setFontColor('#6ee7b7');
  sheet.getRange(totalRow, 2).setValue(rows.length).setFontColor('#6ee7b7');
  sheet.getRange(totalRow, 3).setFormula('=SUM(C3:C' + (summaryRows.length+2) + ')')
    .setNumberFormat('₪#,##0.00').setFontColor('#6ee7b7').setFontWeight('bold');
  sheet.getRange(totalRow, 1, 1, 4).setBackground('#0f172a');

  // גרף עוגה
  if (summaryRows.length > 1) {
    var chartRange = sheet.getRange(2, 1, summaryRows.length + 1, 2);
    var chart = sheet.newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(chartRange)
      .setPosition(3, 6, 0, 0)
      .setOption('title', 'הוצאות לפי קטגוריה')
      .setOption('backgroundColor', '#0f172a')
      .setOption('titleTextStyle', {color:'#f1f5f9', fontSize:12})
      .setOption('legend', {textStyle:{color:'#94a3b8'}})
      .setOption('pieSliceBorderColor', '#0f172a')
      .setOption('width', 420).setOption('height', 320)
      .build();
    sheet.insertChart(chart);
  }

  sheet.autoResizeColumns(1, 4);
}

// ─── גיליון מינויים ───────────────────────────────────────────
function buildSubscriptions(ss) {
  var sheet = ss.getSheetByName(CONFIG.SHEET_SUBS) || ss.insertSheet(CONFIG.SHEET_SUBS);
  sheet.clearContents();
  sheet.setTabColor('#10b981');

  sheet.getRange('A1').setValue('🔄 מינויים חוזרים חודשיים')
    .setFontSize(14).setFontWeight('bold').setFontColor('#f1f5f9');
  sheet.getRange('A1:E1').setBackground('#1e293b').merge();

  var headers = ['ספק', 'קטגוריה', 'עלות חודשית (₪)', 'עלות שנתית (₪)', 'הערות'];
  sheet.getRange(2,1,1,5).setValues([headers])
    .setBackground('#334155').setFontColor('#94a3b8').setFontWeight('bold');

  var subs = VENDORS.filter(function(v){return v.type==='מינוי' && v.monthly>0;});
  subs.sort(function(a,b){return b.monthly-a.monthly;});

  var subRows = subs.map(function(v){
    return [v.name, v.cat, v.monthly, v.monthly*12, ''];
  });

  if (subRows.length > 0) {
    sheet.getRange(3,1,subRows.length,5).setValues(subRows);
    sheet.getRange(3,3,subRows.length,1).setNumberFormat('₪#,##0.00');
    sheet.getRange(3,4,subRows.length,1).setNumberFormat('₪#,##0.00');
    for(var i=0;i<subRows.length;i++){
      sheet.getRange(i+3,1,1,5).setBackground(i%2===0?'#0f172a':'#1e293b').setFontColor('#f1f5f9');
    }
  }

  // שורת סיכום
  var tot = subRows.length + 4;
  sheet.getRange(tot,1).setValue('סה״כ חודשי').setFontWeight('bold').setFontColor('#6ee7b7');
  sheet.getRange(tot,3).setFormula('=SUM(C3:C'+(subRows.length+2)+')')
    .setNumberFormat('₪#,##0.00').setFontColor('#6ee7b7').setFontWeight('bold');
  sheet.getRange(tot,4).setFormula('=SUM(D3:D'+(subRows.length+2)+')')
    .setNumberFormat('₪#,##0.00').setFontColor('#6ee7b7').setFontWeight('bold');
  sheet.getRange(tot,1,1,5).setBackground('#0f172a');

  sheet.autoResizeColumns(1,5);
}

// ─── טריגר יומי ───────────────────────────────────────────────
function setupDailyTrigger() {
  // מוחק טריגרים קיימים
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'syncReceipts') ScriptApp.deleteTrigger(t);
  });
  // מגדיר טריגר יומי בשעה 07:00
  ScriptApp.newTrigger('syncReceipts')
    .timeBased().everyDays(1).atHour(7).create();
  try { SpreadsheetApp.getUi().alert('✅ טריגר יומי הוגדר!\nהסקריפט ירוץ כל בוקר ב-07:00.'); } catch(e) { Logger.log('טריגר הוגדר'); }
}

// ─── תפריט מותאם ──────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 חשבוניות')
    .addItem('🔄 סנכרן עכשיו מג׳ימייל', 'syncReceipts')
    .addSeparator()
    .addItem('⏰ הגדר עדכון יומי אוטומטי', 'setupDailyTrigger')
    .addToUi();
}
