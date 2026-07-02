// ═══════════════════════════════════════════════════════════════
//  📊 RECEIPTS DASHBOARD — Web App
//  הוסף לפרויקט הקיים ב-Apps Script ופרס כ-Web App
// ═══════════════════════════════════════════════════════════════

var SS_ID = '13s1Sr3fWICwSDYF1XjAyZuYEvr5tpADL262L87k3-8w';

function doGet() {
  var data = getDashboardData();
  var html = buildHtml(data);
  return HtmlService.createHtmlOutput(html)
    .setTitle('חשבוניות ומינויים')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── שליפת נתונים מהשיטס ──────────────────────────────────────
function getDashboardData() {
  var ss = SpreadsheetApp.openById(SS_ID);

  // גיליון חשבוניות
  var raw = ss.getSheetByName('חשבוניות');
  var rows = raw ? raw.getDataRange().getValues() : [];
  var records = rows.slice(1); // בלי כותרת

  // סיכום לפי קטגוריה
  var catMap = {};
  var totalAmount = 0;
  records.forEach(function(r) {
    var cat = r[3] || '❓ אחר';
    var amt = parseFloat(String(r[5]).replace(/[₪,]/g,'')) || 0;
    if (!catMap[cat]) catMap[cat] = { count: 0, total: 0 };
    catMap[cat].count++;
    catMap[cat].total += amt;
    totalAmount += amt;
  });

  var cats = Object.keys(catMap).map(function(k) {
    return { name: k, count: catMap[k].count, total: catMap[k].total };
  }).sort(function(a,b){ return b.count - a.count; });

  // 10 אחרונות
  var recent = records.slice(0, 10).map(function(r) {
    return { date: r[0], vendor: r[1], subject: r[2], cat: r[3], type: r[4], amount: r[5], sender: r[6] };
  });

  // גיליון מינויים
  var subSheet = ss.getSheetByName('מינויים');
  var subRows = subSheet ? subSheet.getDataRange().getValues().slice(2) : [];
  var subs = subRows.filter(function(r){ return r[0] && r[2] > 0; }).map(function(r){
    return { name: r[0], cat: r[1], monthly: r[2] };
  });
  var totalMonthly = subs.reduce(function(s,r){ return s + (parseFloat(r.monthly)||0); }, 0);

  return {
    total: records.length,
    totalAmount: totalAmount,
    totalMonthly: totalMonthly,
    catCount: cats.length,
    cats: cats,
    recent: recent,
    subs: subs,
    updated: Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm')
  };
}

// ─── בניית HTML ───────────────────────────────────────────────
function buildHtml(d) {
  var maxCount = d.cats.length > 0 ? d.cats[0].count : 1;

  var catBars = d.cats.slice(0,10).map(function(c) {
    var pct = Math.round(c.count / maxCount * 100);
    var amtStr = c.total > 0 ? ' · ₪' + c.total.toLocaleString('he-IL', {maximumFractionDigits:0}) : '';
    return '<div class="bar-row"><div class="bar-meta"><span class="bar-name">' + c.name + '</span>' +
           '<span class="bar-nums">' + c.count + ' רשומות' + amtStr + '</span></div>' +
           '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
  }).join('');

  var recentRows = d.recent.map(function(r) {
    var amt = r.amount && String(r.amount).replace(/[₪,\s]/g,'') > 0
      ? '<td class="amt">' + r.amount + '</td>'
      : '<td class="amt-na">לא זוהה</td>';
    return '<tr><td><div class="vname">' + (r.vendor||'') + '</div>' +
           '<div class="vsub">' + (r.subject||'').substring(0,60) + '</div></td>' +
           '<td><span class="pill">' + (r.cat||'') + '</span></td>' + amt +
           '<td class="dcel">' + (r.date||'') + '</td></tr>';
  }).join('');

  var subCards = d.subs.slice(0,8).map(function(s) {
    return '<div class="sub-card"><div class="sub-name">' + s.name + '</div>' +
           '<div class="sub-cat">' + s.cat + '</div>' +
           '<div class="sub-price">₪' + s.monthly + ' <span class="sub-ph">/ חודש</span></div></div>';
  }).join('');

  return '<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>חשבוניות ומינויים</title><style>' +
  '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}' +
  ':root{--bg:#080E1E;--surface:#111827;--card:#1A2744;--border:#243356;--accent:#38BDF8;--money:#FB923C;--green:#4ADE80;--text:#E8EDF5;--muted:#6B7A99;--subtle:#2D3D5C}' +
  'html{direction:rtl;font-size:15px}' +
  'body{background:var(--bg);color:var(--text);font-family:"Rubik","Heebo","Segoe UI",Arial,sans-serif;min-height:100vh}' +
  '.header{background:var(--surface);border-bottom:1px solid var(--border);padding:18px 32px;display:flex;align-items:center;justify-content:space-between}' +
  '.header-left{display:flex;align-items:center;gap:12px}' +
  '.header-icon{width:38px;height:38px;background:linear-gradient(135deg,#38BDF8,#818CF8);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px}' +
  '.header h1{font-size:1.15rem;font-weight:700}' +
  '.header-sub{color:var(--muted);font-size:.73rem;margin-top:2px}' +
  '.badge{background:rgba(74,222,128,.12);color:var(--green);border:1px solid rgba(74,222,128,.25);border-radius:20px;padding:4px 12px;font-size:.73rem;font-weight:600}' +
  '.main{padding:28px 32px;max-width:1100px;margin:0 auto}' +
  '.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px}' +
  '.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px 20px;position:relative;overflow:hidden}' +
  '.stat::before{content:"";position:absolute;top:0;right:0;width:3px;height:100%;border-radius:0 14px 14px 0}' +
  '.s1::before{background:var(--accent)}.s2::before{background:var(--money)}.s3::before{background:var(--green)}.s4::before{background:#A78BFA}' +
  '.stat-label{color:var(--muted);font-size:.7rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px}' +
  '.stat-value{font-size:1.75rem;font-weight:800;letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1}' +
  '.s1 .stat-value{color:var(--accent)}.s2 .stat-value{color:var(--money)}.s3 .stat-value{color:var(--green)}.s4 .stat-value{color:#A78BFA}' +
  '.stat-hint{color:var(--muted);font-size:.7rem;margin-top:6px}' +
  '.grid2{display:grid;grid-template-columns:1fr 1.6fr;gap:18px;margin-bottom:24px}' +
  '.panel{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden}' +
  '.panel-head{padding:15px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}' +
  '.panel-title{font-size:.82rem;font-weight:700}.panel-count{color:var(--muted);font-size:.7rem}' +
  '.panel-body{padding:18px 20px}' +
  '.bar-list{display:flex;flex-direction:column;gap:13px}' +
  '.bar-meta{display:flex;justify-content:space-between;margin-bottom:5px}' +
  '.bar-name{font-size:.8rem;font-weight:600}.bar-nums{font-size:.72rem;color:var(--muted);font-variant-numeric:tabular-nums}' +
  '.bar-track{height:7px;background:var(--subtle);border-radius:4px;overflow:hidden}' +
  '.bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#6366F1,#818CF8)}' +
  '.rtable{width:100%;border-collapse:collapse}' +
  '.rtable th{color:var(--muted);font-size:.67rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:0 12px 10px;text-align:right;border-bottom:1px solid var(--border)}' +
  '.rtable td{padding:10px 12px;font-size:.79rem;border-bottom:1px solid rgba(36,51,86,.5);vertical-align:middle}' +
  '.rtable tr:last-child td{border-bottom:none}.rtable tr:hover td{background:rgba(56,189,248,.04)}' +
  '.vname{font-weight:600}.vsub{color:var(--muted);font-size:.7rem;margin-top:2px;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.amt{font-variant-numeric:tabular-nums;font-weight:700;color:var(--money);white-space:nowrap}' +
  '.amt-na{color:var(--muted);font-weight:400;font-size:.7rem;white-space:nowrap}' +
  '.dcel{color:var(--muted);font-size:.7rem;font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.pill{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:.67rem;font-weight:600;background:rgba(99,102,241,.15);color:#818CF8;white-space:nowrap}' +
  '.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}' +
  '.sec-title{font-size:.88rem;font-weight:700}.sec-total{color:var(--money);font-size:.82rem;font-weight:700;font-variant-numeric:tabular-nums}' +
  '.subs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}' +
  '.sub-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:6px}' +
  '.sub-name{font-size:.8rem;font-weight:700}.sub-cat{color:var(--muted);font-size:.68rem}' +
  '.sub-price{margin-top:6px;font-size:1.1rem;font-weight:800;color:var(--money);font-variant-numeric:tabular-nums}' +
  '.sub-ph{font-size:.68rem;font-weight:400;color:var(--muted)}' +
  '.footer{text-align:center;color:var(--muted);font-size:.7rem;padding:20px 32px;border-top:1px solid var(--border);margin-top:8px}' +
  '@media(max-width:700px){.stats{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}.main{padding:18px 14px}.header{padding:14px 16px}}' +
  '</style></head><body>' +
  '<div class="header"><div class="header-left"><div class="header-icon">📊</div><div>' +
  '<h1>חשבוניות ומינויים</h1><div class="header-sub">סנכרון אחרון: ' + d.updated + ' · arielshish@gmail.com</div></div></div>' +
  '<div class="badge">✓ מסונכרן</div></div>' +
  '<div class="main">' +
  '<div class="stats">' +
  '<div class="stat s1"><div class="stat-label">סה״כ רשומות</div><div class="stat-value">' + d.total + '</div><div class="stat-hint">2 שנים אחרונות</div></div>' +
  '<div class="stat s2"><div class="stat-label">סכום מזוהה</div><div class="stat-value">₪' + Math.round(d.totalAmount).toLocaleString('he-IL') + '</div><div class="stat-hint">מרשומות עם סכום</div></div>' +
  '<div class="stat s3"><div class="stat-label">מינויים / חודש</div><div class="stat-value">₪' + Math.round(d.totalMonthly) + '</div><div class="stat-hint">₪' + Math.round(d.totalMonthly*12).toLocaleString('he-IL') + ' לשנה</div></div>' +
  '<div class="stat s4"><div class="stat-label">קטגוריות</div><div class="stat-value">' + d.catCount + '</div><div class="stat-hint">ספקים מזוהים</div></div>' +
  '</div>' +
  '<div class="grid2">' +
  '<div class="panel"><div class="panel-head"><span class="panel-title">הוצאות לפי קטגוריה</span><span class="panel-count">Top 10</span></div>' +
  '<div class="panel-body"><div class="bar-list">' + catBars + '</div></div></div>' +
  '<div class="panel"><div class="panel-head"><span class="panel-title">רשומות אחרונות</span><span class="panel-count">' + d.total + ' סה״כ</span></div>' +
  '<div style="overflow-x:auto"><table class="rtable"><thead><tr><th>ספק / נושא</th><th>קטגוריה</th><th>סכום</th><th>תאריך</th></tr></thead>' +
  '<tbody>' + recentRows + '</tbody></table></div></div>' +
  '</div>' +
  '<div><div class="sec-head"><span class="sec-title">🔄 מינויים חוזרים חודשיים</span>' +
  '<span class="sec-total">₪' + Math.round(d.totalMonthly) + ' / חודש · ₪' + Math.round(d.totalMonthly*12).toLocaleString('he-IL') + ' / שנה</span></div>' +
  '<div class="subs-grid">' + subCards + '</div></div>' +
  '</div><div class="footer">נתונים מסונכרנים אוטומטית מ-Gmail · עודכן ' + d.updated + '</div>' +
  '</body></html>';
}
