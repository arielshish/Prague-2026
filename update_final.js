const fs = require('fs');

const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Prague 2026 - Premium App</title>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;800&family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #0F172A; --navy2: #1E293B; --accent: #F43F5E; --accent-glow: rgba(244,63,94,0.4);
      --gold: #F59E0B; --bg: #F8FAFC; --surface: #FFFFFF; --surface-dim: rgba(255,255,255,0.7);
      --text: #334155; --text-light: #64748B; --line: #E2E8F0;
      --shadow-sm: 0 4px 6px -1px rgba(0,0,0,0.05);
      --shadow-lg: 0 20px 40px -5px rgba(15,23,42,0.1);
      --font-he: 'Heebo', sans-serif; --font-en: 'Outfit', sans-serif;
    }
    
    .dark-mode {
      --navy: #FFFFFF; --navy2: #E2E8F0; --bg: #0F172A; --surface: #1E293B; --surface-dim: rgba(30,41,59,0.7);
      --text: #CBD5E1; --text-light: #94A3B8; --line: #334155;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; font-family: var(--font-he); background: var(--bg); color: var(--text); overflow: hidden; transition: background 0.4s ease; }
    
    .app-container {
      width: min(480px, 100%); height: 100%; margin: 0 auto; position: relative;
      display: flex; flex-direction: column; background: var(--bg);
      box-shadow: 0 0 40px rgba(0,0,0,0.05);
    }

    /* Top Header */
    .header { padding: 48px 24px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 10; }
    .greeting h1 { margin: 0; font-size: 28px; font-weight: 800; color: var(--navy); }
    .greeting p { margin: 4px 0 0; font-size: 14px; color: var(--text-light); }
    .theme-toggle { width: 44px; height: 44px; border-radius: 22px; background: var(--surface); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; font-size: 20px; border: 1px solid var(--line); cursor: pointer; transition: transform 0.2s; }
    .theme-toggle:active { transform: scale(0.9); }

    /* Main Content Area */
    .main-area { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 24px 120px; position: relative; }
    .main-area::-webkit-scrollbar { display: none; }
    
    /* Tab Transitions */
    .tab { position: absolute; top: 0; left: 0; width: 100%; padding: 0 24px 120px; opacity: 0; transform: translateX(30px); pointer-events: none; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .tab.active { opacity: 1; transform: translateX(0); pointer-events: auto; position: relative; padding: 0 0 120px; }

    /* Home - Boarding Pass Widget */
    .boarding-pass { background: linear-gradient(135deg, var(--navy), var(--navy2)); border-radius: 24px; padding: 24px; color: white; position: relative; overflow: hidden; box-shadow: 0 24px 30px -10px rgba(15,23,42,0.3); margin-bottom: 24px; }
    .boarding-pass::before, .boarding-pass::after { content: ''; position: absolute; top: 50%; width: 30px; height: 30px; background: var(--bg); border-radius: 50%; transform: translateY(-50%); }
    .boarding-pass::before { left: -15px; } .boarding-pass::after { right: -15px; }
    .bp-header { display: flex; justify-content: space-between; font-family: var(--font-en); font-size: 12px; letter-spacing: 2px; opacity: 0.7; margin-bottom: 16px; }
    .bp-route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .bp-city { font-size: 36px; font-weight: 800; font-family: var(--font-en); }
    .bp-icon { font-size: 24px; animation: fly 4s infinite linear; }
    .bp-footer { border-top: 1px dashed rgba(255,255,255,0.3); padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .bp-label { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
    .bp-val { font-size: 18px; font-weight: 700; }
    .countdown-big { font-size: 32px; font-weight: 800; color: var(--gold); font-family: var(--font-en); }

    /* Progress Ring Widget */
    .ring-widget { background: var(--surface); border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm); margin-bottom: 24px; border: 1px solid var(--line); }
    .ring-container { position: relative; width: 80px; height: 80px; }
    .ring-svg { width: 80px; height: 80px; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--line); stroke-width: 8; }
    .ring-fill { fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 219; stroke-dashoffset: 219; transition: stroke-dashoffset 1.5s ease-out; }
    .ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-en); font-size: 18px; color: var(--navy); }
    .ring-info h3 { margin: 0 0 4px; color: var(--navy); font-size: 16px; }
    .ring-info p { margin: 0; color: var(--text-light); font-size: 13px; }

    /* Quick Actions */
    .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .quick-card { background: var(--surface); border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--line); cursor: pointer; transition: transform 0.2s; text-decoration: none; color: inherit; }
    .quick-card:active { transform: scale(0.95); }
    .quick-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(244,63,94,0.1); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .quick-card h4 { margin: 0; font-size: 15px; color: var(--navy); }
    
    /* Stories (Days) Tab */
    .stories-wrapper { display: flex; gap: 16px; overflow-x: auto; padding: 4px 0 20px; scroll-snap-type: x mandatory; }
    .stories-wrapper::-webkit-scrollbar { display: none; }
    .story-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; scroll-snap-align: start; }
    .story-ring { width: 68px; height: 68px; border-radius: 34px; background: linear-gradient(45deg, var(--gold), var(--accent)); padding: 3px; transition: transform 0.2s; }
    .story-inner { width: 100%; height: 100%; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 24px; border: 2px solid var(--surface); }
    .story-item.active .story-ring { transform: scale(1.1); box-shadow: 0 10px 20px var(--accent-glow); }
    .story-label { font-size: 12px; font-weight: 600; color: var(--text); }
    
    .timeline { margin-top: 10px; position: relative; padding-right: 20px; }
    .timeline::before { content: ''; position: absolute; right: 8px; top: 10px; bottom: 20px; width: 2px; background: var(--line); border-radius: 2px; }
    .stop-card { background: var(--surface); border-radius: 20px; padding: 16px; margin-bottom: 16px; position: relative; box-shadow: var(--shadow-sm); border: 1px solid var(--line); cursor: pointer; animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; display: flex; gap: 16px; align-items: center; }
    .stop-card::before { content: ''; position: absolute; right: -17px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 50%; background: var(--surface); border: 3px solid var(--accent); box-shadow: 0 0 0 4px var(--bg); }
    .stop-img { width: 64px; height: 64px; border-radius: 12px; background-size: cover; background-position: center; flex-shrink: 0; }
    .stop-info h4 { margin: 0 0 4px; color: var(--navy); font-size: 16px; }
    .stop-info p { margin: 0; color: var(--text-light); font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    /* Expenses List */
    .expense-row { display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 16px; border-radius: 20px; margin-bottom: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--line); animation: slideUp 0.4s both; }
    .expense-title { font-weight: 700; color: var(--navy); font-size: 16px; margin-bottom: 4px; }
    .expense-date { font-size: 12px; color: var(--text-light); }
    .expense-amounts { text-align: left; }
    .exp-ils { font-weight: 800; color: var(--accent); font-size: 16px; }
    .exp-czk { font-size: 12px; color: var(--text-light); }
    
    /* Checklist */
    .check-item { display: flex; align-items: center; gap: 12px; background: var(--surface); padding: 16px; border-radius: 16px; margin-bottom: 8px; border: 1px solid var(--line); cursor: pointer; }
    .checkbox { width: 24px; height: 24px; border-radius: 8px; border: 2px solid var(--line); display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s; }
    .check-item.done .checkbox { background: var(--green); border-color: var(--green); }
    .check-item.done .checkbox::after { content: '✓'; }
    .check-item.done span { text-decoration: line-through; opacity: 0.5; }

    /* Floating Nav Bar */
    .nav-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); width: calc(min(480px, 100%) - 48px); height: 72px; background: var(--surface-dim); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 36px; display: flex; justify-content: space-around; align-items: center; box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.4); z-index: 50; padding: 0 12px; }
    .dark-mode .nav-bar { border-color: rgba(255,255,255,0.05); }
    .nav-btn { background: none; border: none; font-size: 24px; color: var(--text-light); cursor: pointer; width: 48px; height: 48px; border-radius: 24px; transition: all 0.3s; display: flex; align-items: center; justify-content: center; position: relative; }
    .nav-btn.active { color: var(--accent); background: rgba(244,63,94,0.1); }
    
    /* FAB (Floating Action Button) */
    .fab { width: 56px; height: 56px; border-radius: 28px; background: linear-gradient(135deg, var(--accent), #E11D48); color: white; border: none; box-shadow: 0 12px 24px var(--accent-glow); font-size: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: translateY(-20px); transition: transform 0.2s; }
    .fab:active { transform: translateY(-16px) scale(0.95); }

    /* Modern Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 100; opacity: 0; pointer-events: none; transition: opacity 0.3s; display: flex; align-items: flex-end; justify-content: center; }
    .modal-overlay.show { opacity: 1; pointer-events: auto; }
    .bottom-sheet { width: min(480px, 100%); background: var(--bg); border-radius: 32px 32px 0 0; padding: 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); max-height: 90vh; overflow-y: auto; overflow-x: hidden; }
    .modal-overlay.show .bottom-sheet { transform: translateY(0); }
    .sheet-handle { width: 40px; height: 5px; background: var(--line); border-radius: 3px; margin: 12px auto 20px; }
    .sheet-content { padding: 0 24px 32px; }

    /* POI Specifics in Modal */
    .poi-hero { height: 260px; background-size: cover; background-position: center; position: relative; margin: -20px 0 24px; border-radius: 32px 32px 0 0; }
    .poi-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, var(--bg) 0%, transparent 50%); }
    .poi-title { font-size: 28px; font-weight: 800; color: var(--navy); margin: 0 0 12px; }
    .poi-desc { color: var(--text); font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .tip-box { background: rgba(245,158,11,0.1); border-right: 4px solid var(--gold); padding: 16px; border-radius: 16px 0 0 16px; margin-bottom: 24px; display: flex; gap: 12px; }
    .tip-box span { font-size: 24px; }
    .tip-text { color: #B45309; font-size: 14px; font-weight: 600; line-height: 1.5; margin: 0; }
    
    /* Buttons & Inputs */
    .btn { width: 100%; padding: 16px; border-radius: 16px; background: var(--navy); color: white; border: none; font-size: 16px; font-weight: 700; font-family: var(--font-he); cursor: pointer; transition: transform 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
    .btn:active { transform: scale(0.97); }
    .btn-accent { background: var(--accent); box-shadow: 0 8px 20px var(--accent-glow); }
    .btn-outline { background: transparent; border: 2px solid var(--line); color: var(--text); box-shadow: none; }
    .input-group { margin-bottom: 16px; }
    .input-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-light); margin-bottom: 8px; }
    .input { width: 100%; padding: 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--surface); color: var(--text); font-size: 16px; font-family: var(--font-he); transition: border-color 0.2s; }
    .input:focus { outline: none; border-color: var(--accent); }
    .split-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    /* Animations */
    @keyframes fly { 0% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(5px, -5px) rotate(5deg); } 75% { transform: translate(-5px, 5px) rotate(-5deg); } 100% { transform: translate(0, 0) rotate(0deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    /* Confetti Canvas */
    #confetti { position: fixed; inset: 0; pointer-events: none; z-index: 9999; }
    .sync-badge { font-size: 10px; background: var(--line); color: var(--text); padding: 4px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="app-container">
    <canvas id="confetti"></canvas>
    
    <!-- Top Header -->
    <header class="header">
      <div class="greeting">
        <p id="currentDate">--</p>
        <h1 id="greetingText">שלום, משפחת שיש!</h1>
      </div>
      <button class="theme-toggle" onclick="toggleTheme()">🌙</button>
    </header>

    <!-- Main Content -->
    <main class="main-area">
      
      <!-- HOME TAB -->
      <div id="tab-home" class="tab active">
        <!-- Boarding Pass -->
        <div class="boarding-pass">
          <div class="bp-header">
            <span>FLIGHT: LY2521</span>
            <span>DATE: 10 AUG 26</span>
          </div>
          <div class="bp-route">
            <div>
              <div class="bp-label">FROM</div>
              <div class="bp-city">TLV</div>
            </div>
            <div class="bp-icon">✈️</div>
            <div style="text-align: left;">
              <div class="bp-label">TO</div>
              <div class="bp-city">PRG</div>
            </div>
          </div>
          <div class="bp-footer">
            <div>
              <div class="bp-label">PASSENGER</div>
              <div class="bp-val">SHISH FAMILY</div>
            </div>
            <div style="text-align: left;">
              <div class="bp-label">DAYS LEFT</div>
              <div class="countdown-big" id="daysLeft">--</div>
            </div>
          </div>
        </div>

        <!-- Budget Ring -->
        <div class="ring-widget">
          <div class="ring-container">
            <svg class="ring-svg">
              <circle class="ring-bg" cx="40" cy="40" r="35"></circle>
              <circle class="ring-fill" id="budgetRing" cx="40" cy="40" r="35"></circle>
            </svg>
            <div class="ring-text" id="budgetPercent">0%</div>
          </div>
          <div class="ring-info">
            <h3>תקציב יעד: 15,000 ₪</h3>
            <p>הוצאתם עד כה: <strong id="homeSpent" style="color:var(--accent);">₪0</strong></p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-grid">
          <a class="quick-card" target="_blank" href="https://www.google.com/maps/search/Comfort+Hotel+Prague+City+East">
            <div class="quick-icon">🏨</div>
            <h4>נווט למלון</h4>
            <span style="font-size:12px; color:var(--text-light);">Comfort City East</span>
          </a>
          <a class="quick-card" href="#" onclick="switchTab('info')">
            <div class="quick-icon">🧳</div>
            <h4>רשימת אריזה</h4>
            <span style="font-size:12px; color:var(--text-light);">אל תשכחו כלום</span>
          </a>
        </div>
      </div>

      <!-- DAYS (STORIES) TAB -->
      <div id="tab-days" class="tab">
        <h2 style="font-size: 24px; margin: 0 0 16px;">מסלול יומי</h2>
        
        <!-- Story Avatars -->
        <div class="stories-wrapper" id="storyWrapper"></div>
        
        <div style="background:var(--surface); border-radius:24px; padding:20px; box-shadow:var(--shadow-sm); border:1px solid var(--line);">
          <h3 id="dayTitle" style="margin:0 0 8px; font-size:20px; color:var(--navy);"></h3>
          <p id="dayDesc" style="margin:0 0 16px; color:var(--text-light); font-size:14px;"></p>
          <div class="timeline" id="dayTimeline"></div>
        </div>
      </div>

      <!-- EXPENSES TAB -->
      <div id="tab-expenses" class="tab">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; margin: 0;">הוצאות <span class="sync-badge" id="syncStatus">🔄 מסנכרן</span></h2>
          <button class="theme-toggle" style="width:36px;height:36px;" onclick="loadExpenses()">🔄</button>
        </div>
        
        <div style="text-align:center; padding:32px 0; background:var(--surface); border-radius:24px; box-shadow:var(--shadow-sm); border:1px solid var(--line); margin-bottom:24px;">
          <div style="font-size:14px; color:var(--text-light); font-weight:600;">סה"כ הוצאות</div>
          <div style="font-size:42px; font-weight:800; color:var(--accent); font-family:var(--font-en);" id="totalIls">₪0</div>
          <div style="font-size:16px; color:var(--text-light); font-family:var(--font-en);" id="totalCzk">0 CZK</div>
        </div>
        
        <div id="expenseList">
          <p style="text-align:center; color:var(--text-light);">טוען נתונים מהענן...</p>
        </div>
      </div>

      <!-- PACKING LIST TAB -->
      <div id="tab-info" class="tab">
        <h2 style="font-size: 24px; margin: 0 0 16px;">צ'ק ליסט מזוודות</h2>
        <div id="checklistContainer"></div>
      </div>

    </main>

    <!-- Floating Nav Bar -->
    <nav class="nav-bar">
      <button class="nav-btn active" id="nav-home" onclick="switchTab('home')">🏠</button>
      <button class="nav-btn" id="nav-days" onclick="switchTab('days')">🗺️</button>
      <button class="fab" onclick="openExpenseModal()">➕</button>
      <button class="nav-btn" id="nav-expenses" onclick="switchTab('expenses')">💳</button>
      <button class="nav-btn" id="nav-info" onclick="switchTab('info')">🧳</button>
    </nav>
  </div>

  <!-- MODALS -->
  <!-- Expense Modal -->
  <div class="modal-overlay" id="expenseModal">
    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-content">
        <h2 style="margin: 0 0 24px; font-size:22px;">הוספת הוצאה</h2>
        <div class="input-group">
          <label>תיאור הקנייה</label>
          <input type="text" class="input" id="expName" placeholder="למשל: ארוחת צהריים, זארה...">
        </div>
        <div class="split-row">
          <div class="input-group">
            <label>סכום (קרונות - CZK)</label>
            <input type="number" class="input" id="expCzk" placeholder="0" oninput="calcIls()">
          </div>
          <div class="input-group">
            <label>סכום (שקלים - ILS)</label>
            <input type="number" class="input" id="expIls" placeholder="0" oninput="calcCzk()">
          </div>
        </div>
        <div class="input-group">
          <label>הערות (אופציונלי)</label>
          <input type="text" class="input" id="expNote" placeholder="למשל: שילמנו באשראי">
        </div>
        <div class="split-row" style="margin-top:24px;">
          <button class="btn btn-outline" onclick="closeModals()">ביטול</button>
          <button class="btn btn-accent" id="saveExpBtn" onclick="saveExpense()">שמור הוצאה 💸</button>
        </div>
      </div>
    </div>
  </div>

  <!-- POI Details Modal -->
  <div class="modal-overlay" id="poiModal">
    <div class="bottom-sheet">
      <div class="poi-hero" id="poiImage"></div>
      <div class="sheet-content">
        <h2 class="poi-title" id="poiTitle">שם המקום</h2>
        <p class="poi-desc" id="poiDesc">תיאור</p>
        <div class="tip-box">
          <span>💡</span>
          <p class="tip-text" id="poiTip">טיפ</p>
        </div>
        <div class="split-row">
          <button class="btn btn-outline" onclick="closeModals()">סגור</button>
          <a class="btn btn-accent" id="poiMapBtn" href="#" target="_blank">🗺️ נווט לכאן</a>
        </div>
      </div>
    </div>
  </div>

  <script>
    // --- APP DATA & LOGIC ---
    var RATE = 6.4; 
    var TARGET_BUDGET = 15000;
    var EXPENSES = [];
    
    // Days Data
    var DAYS = [
      { e: '🛬', t: 'נחיתה והגעה', s: 'נחיתה בפראג, נסיעה ל-Comfort Hotel East והתארגנות קלילה בעיר.', st: ['נחיתה בפראג', 'Comfort Hotel Prague City East', 'ארוחת ערב רגועה'] },
      { e: '🏰', t: 'העיר העתיקה', s: 'סיור במרכז ההיסטורי, השעון האסטרונומי וגשר קארל.', st: ['נסיעה במטרו למרכז', 'Old Town Square', 'Astronomical Clock', 'Charles Bridge'] },
      { e: '👑', t: 'טירת פראג', s: 'עלייה לטירה, סמטת הזהב ותצפית שקיעה מטורפת.', st: ['חשמלית לטירת פראג', 'Prague Castle', 'Golden Lane', 'תצפית שקיעה'] },
      { e: '🧸', t: 'ילדים וכייף', s: 'ממלכת הרכבות המדהימה וחנות הצעצועים Hamleys.', st: ['Kingdom of Railways', 'Hamleys', 'קינוח טרדלניק במרכז'] },
      { e: '💦', t: 'פארק מים', s: 'יום פינוק ב-Aquapalace - הפארק המקורה הענק.', st: ['נסיעה ל-Aquapalace', 'Aquapalace Prague', 'ארוחת ערב בקניון'] },
      { e: '🐘', t: 'גן חיות וטבע', s: 'גן החיות העצום של פראג ומנוחה בפארק ליד.', st: ['נסיעה לגן החיות', 'Prague Zoo', 'פארק Stromovka'] },
      { e: '🛍️', t: 'יום קניות', s: 'השלמת מתנות ופינוקים בפריימארק ופלדיום.', st: ['Primark Wenceslas Square', 'הליכה דרך כיכר ואצלב', 'Palladium', 'ארוחת סיום'] },
      { e: '🛫', t: 'חוזרים הביתה', s: 'אריזות, פרידה מהמלון ונסיעה לשדה.', st: ['צ׳ק-אאוט מהמלון', 'נסיעה לשדה התעופה'] }
    ];

    var POIS = {
      'נחיתה בפראג': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_Termin%C3%A1l_1_%282019%29.jpg', desc: 'ברוכים הבאים לנמל התעופה ואצלב האוול!', tip: 'מומלץ למשוך קצת מזומן בכספומט רגיל (לא של Euronet) להוצאות קטנות ראשוניות.' },
      'Comfort Hotel Prague City East': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'מלון משפחתי נעים במזרח העיר. קרוב לתחנת המטרו Strašnická (קו ירוק A).', tip: 'בדקו איפה הסופרמרקט הקרוב למלון (יש Albert או Billa) כדי לקנות מים ונשנושים לילדים.' },
      'ארוחת ערב רגועה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Czech_cuisine_-_Smazak.jpg/800px-Czech_cuisine_-_Smazak.jpg', desc: 'התאקלמות רגועה במסעדה אותנטית.', tip: 'נסו את ה-Smažený sýr (גבינה מטוגנת צ\\'כית) - הילדים יעופו על זה!' },
      'נסיעה במטרו למרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg/800px-Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg', desc: 'הליכה קצרה לתחנת Strašnická ומשם ישר לתחנת Staroměstská.', tip: 'ילדים צעירים נוסעים בחינם או בהנחה, בדקו בגילאי הילדים שלכם.' },
      'Old Town Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg', desc: 'כיכר העיר העתיקה, הלב הפועם של פראג עם מבנים צבעוניים.', tip: 'מקום מושלם להצטלם עם בועות הסבון הענקיות!' },
      'Astronomical Clock': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Prague_Astronomical_Clock_%2848386348421%29.jpg/800px-Prague_Astronomical_Clock_%2848386348421%29.jpg', desc: 'השעון האסטרונומי המפורסם משנת 1410.', tip: 'הגיעו כ-10 דקות לפני שעה עגולה למופע הבובות.' },
      'Charles Bridge': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Charles_Bridge_in_Prague_at_sunset.jpg/800px-Charles_Bridge_in_Prague_at_sunset.jpg', desc: 'גשר אבן עתיק מעל נהר הוולטאבה.', tip: 'מגע בלוחית הנחושת בתחתית פסלו של יאן נפומוק מביאה מזל!' },
      'חשמלית לטירת פראג': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg/800px-Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg', desc: 'עולים בחשמלית 22 או 23 כדי לחסוך עליות קשות ברגל.', tip: 'החשמלית נחשבת לאחת היפות בפראג!' },
      'Prague Castle': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg', desc: 'מתחם הטירה הגדול בעולם וקתדרלת ויטוס הקדוש.', tip: 'טקס חילופי משמרות מרשים מתקיים בשעה 12:00 בחצר הראשונה.' },
      'Golden Lane': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Golden_Lane.jpg/800px-Golden_Lane.jpg', desc: 'סמטת הזהב הקסומה בתוך מתחם הטירה.', tip: 'תנו לילדים לחפש את השריונות הישנים בנשקייה.' },
      'תצפית שקיעה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Prague_at_sunset_%283088924151%29.jpg/800px-Prague_at_sunset_%283088924151%29.jpg', desc: 'נוף פנורמי מרהיב של כל פראג של מטה.', tip: 'רדו בחזרה לעיר ברגל דרך המדרגות הישנות - נוף מטריף.' },
      'Kingdom of Railways': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg', desc: 'ממלכת הרכבות המיניאטוריות הגדולה בצ\\'כיה.', tip: 'מעולה לילדים ומבוגרים כאחד! כולל סימולטורים לנהיגה.' },
      'Hamleys': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Hamleys_Prague_2.jpg/800px-Hamleys_Prague_2.jpg', desc: 'חנות הצעצועים העצומה במרכז העיר.', tip: 'אל תפספסו את מגלשת הענק המפותלת בתוך החנות בחינם!' },
      'קינוח טרדלניק במרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Trdeln%C3%ADk_on_a_spit.jpg/800px-Trdeln%C3%ADk_on_a_spit.jpg', desc: 'הקינוח הלאומי - מאפה שמרים מצופה סוכר וקינמון (קיורטוש).', tip: 'הגרסה לילדים מגיעה במילוי גלידה, קצפת ונוטלה.' },
      'נסיעה ל-Aquapalace': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Opatov_metro_station_in_Prague_%281%29.jpg/800px-Opatov_metro_station_in_Prague_%281%29.jpg', desc: 'מטרו קו C עד Opatov ומשם אוטובוס ייעודי לפארק.', tip: 'הנסיעה לוקחת זמן - הכינו חטיפים לילדים.' },
      'Aquapalace Prague': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg', desc: 'פארק המים המקורה הגדול ביותר במרכז אירופה.', tip: 'הביאו מגבות מהמלון כדי לחסוך עמלות. יש מתחם פיראטים מדהים!' },
      'ארוחת ערב בקניון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chodov_shopping_center_interior.jpg/800px-Chodov_shopping_center_interior.jpg', desc: 'חזרה דרך קניון Westfield Chodov לארוחת ערב.', tip: 'מתחם המזון העצום מציע הכל: מהמבורגרים עד סושי.' },
      'נסיעה לגן החיות': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg/800px-N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg', desc: 'מטרו C לתחנת Nádraží Holešovice ומשם אוטובוס 112.', tip: 'לאטרקציה מיוחדת: אפשר להגיע לגן החיות גם בשייט על הנהר.' },
      'Prague Zoo': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg', desc: 'אחד מגני החיות היפים בעולם, ממוקם על צלע הר.', tip: 'עלו ברכבל הכיסאות הקטן לחלק העליון ורדו ברגל - קל יותר עם ילדים.' },
      'פארק Stromovka': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Stromovka_%28Prague%29.jpg/800px-Stromovka_%28Prague%29.jpg', desc: 'הסנטרל פארק של פראג! פארק ענק ושקט.', tip: 'מושלם למנוחה על הדשא אחרי ההליכה בגן החיות.' },
      'Primark Wenceslas Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Wenceslas_Square_-_Primark_Prague.jpg/800px-Wenceslas_Square_-_Primark_Prague.jpg', desc: '3 קומות של אופנה במחירים נוחים בכיכר ואצלב.', tip: 'הגיעו בשעת הפתיחה (09:00) כדי לחמוק מתורי ענק למדידות.' },
      'הליכה דרך כיכר ואצלב': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Wenceslas_Square_from_NM.jpg/800px-Wenceslas_Square_from_NM.jpg', desc: 'השדרה המרכזית וההומה של פראג.', tip: 'שימו לב לחזיתות הבניינים המעוטרות מעל החנויות המודרניות.' },
      'Palladium': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg', desc: 'קניון ענק ויפהפה במבנה היסטורי מרשים.', tip: 'מתחם האוכל למעלה מעולה לארוחת צהריים לכולם יחד.' },
      'ארוחת סיום': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Restaurant_v_Praze.jpg/800px-Restaurant_v_Praze.jpg', desc: 'מסעדה טובה לסיום הטיול באזור המרכז.', tip: 'הרימו כוס בירה צ\\'כית (וקופולה לילדים) לכבוד הטיול המוצלח!' },
      'צ׳ק-אאוט מהמלון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'אריזות אחרונות ב-Comfort Hotel.', tip: 'אפשר להשאיר מזוודות בשמירת חפצים אם הטיסה בערב.' },
      'נסיעה לשדה התעופה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg', desc: 'מטרו A ל-Veleslavín ומשם אוטובוס 119 לשדה.', tip: 'הגיעו כשלוש שעות לפני הטיסה, יש תורים בבידוק.' }
    };

    var PACKING_LIST = [
      'דרכונים (בתוקף!)', 'ביטוח נסיעות', 'כרטיסי טיסה', 'כסף מזומן (יורו/CZK) + אשראי',
      'בגדים חמים לערב (ז'קט/עליונית)', 'בגדי ים (לאקוופאלאס)', 'נעלי הליכה נוחות',
      'תרופות וערכת עזרה ראשונה קטנה', 'מטען וכבלים', 'משחקים/טאבלט לטיסה'
    ];

    function id(el) { return document.getElementById(el); }
    
    // --- INITIALIZATION ---
    function init() {
      setupDateAndCountdown();
      renderStories();
      renderChecklist();
      selectDay(0); // Load day 1
      loadExpenses(); // Start syncing immediately
      
      // Check system theme
      if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
      }
    }

    // --- UI LOGIC ---
    function switchTab(tabId) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      id('tab-' + tabId).classList.add('active');
      id('nav-' + tabId).classList.add('active');
    }

    function toggleTheme() {
      document.body.classList.toggle('dark-mode');
    }

    function setupDateAndCountdown() {
      const now = new Date();
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      id('currentDate').textContent = now.toLocaleDateString('he-IL', options);
      
      const target = new Date('2026-08-10T00:00:00');
      const diff = Math.ceil((target - now) / 86400000);
      id('daysLeft').textContent = diff > 0 ? diff : '0';
    }

    function renderStories() {
      let html = '';
      DAYS.forEach((d, i) => {
        html += \`
          <div class="story-item" onclick="selectDay(\${i})">
            <div class="story-ring"><div class="story-inner">\${d.e}</div></div>
            <span class="story-label">יום \${i+1}</span>
          </div>
        \`;
      });
      id('storyWrapper').innerHTML = html;
    }

    function selectDay(index) {
      document.querySelectorAll('.story-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      
      const day = DAYS[index];
      id('dayTitle').textContent = day.t;
      id('dayDesc').textContent = day.s;
      
      id('dayTimeline').innerHTML = day.st.map((stopName, idx) => {
        const poi = POIS[stopName] || { img: '', desc: 'נקודת ציון מרכזית במסלול.', tip: 'תיהנו מהחוויה!' };
        const delay = idx * 0.1;
        return \`
          <div class="stop-card" style="animation-delay:\${delay}s" onclick="openPoi('\${stopName.replace(/'/g,"\\\\'")}')">
            <div class="stop-img" style="background-image:url('\${poi.img}')"></div>
            <div class="stop-info">
              <h4>📍 \${stopName}</h4>
              <p>\${poi.desc}</p>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderChecklist() {
      let saved = [];
      try { saved = JSON.parse(localStorage.getItem('prague_checklist_v11')) || []; } catch(e){}
      
      id('checklistContainer').innerHTML = PACKING_LIST.map((item, i) => {
        const isDone = saved.includes(i) ? 'done' : '';
        return \`<div class="check-item \${isDone}" onclick="toggleCheck(\${i}, this)">
                  <div class="checkbox"></div>
                  <span>\${item}</span>
                </div>\`;
      }).join('');
    }

    function toggleCheck(idx, el) {
      el.classList.toggle('done');
      let saved = [];
      document.querySelectorAll('.check-item').forEach((item, i) => {
        if (item.classList.contains('done')) saved.push(i);
      });
      localStorage.setItem('prague_checklist_v11', JSON.stringify(saved));
    }

    // --- MODALS ---
    function openExpenseModal() {
      id('expName').value = ''; id('expCzk').value = ''; id('expIls').value = ''; id('expNote').value = '';
      id('expenseModal').classList.add('show');
    }
    
    function openPoi(stopName) {
      const poi = POIS[stopName];
      if (!poi) return;
      
      id('poiTitle').textContent = stopName;
      id('poiDesc').textContent = poi.desc;
      id('poiTip').textContent = poi.tip;
      id('poiImage').style.backgroundImage = \`url('\${poi.img}')\`;
      id('poiMapBtn').href = 'https://www.google.com/maps/search/' + encodeURIComponent(stopName + ' Prague');
      
      id('poiModal').classList.add('show');
    }

    function closeModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    }

    // --- EXPENSES LOGIC ---
    function calcIls() { const c = Number(id('expCzk').value||0); if(c>0) id('expIls').value = Math.round(c/RATE); }
    function calcCzk() { const i = Number(id('expIls').value||0); if(i>0) id('expCzk').value = Math.round(i*RATE); }

    function isGas() { return typeof google !== 'undefined' && google.script && google.script.run; }

    function loadExpenses() {
      id('syncStatus').textContent = '🔄 טוען...';
      if (isGas()) {
        google.script.run
          .withSuccessHandler(function(rows) {
            EXPENSES = rows || [];
            id('syncStatus').textContent = '✅ מעודכן';
            renderExpenses();
          })
          .withFailureHandler(function(e) {
            id('syncStatus').textContent = '⚠️ שגיאה';
            loadLocalExpenses();
          }).loadExpenses();
      } else {
        loadLocalExpenses();
      }
    }

    function loadLocalExpenses() {
      try { EXPENSES = JSON.parse(localStorage.getItem('prague_exp_v11') || '[]'); } catch(e){ EXPENSES=[]; }
      id('syncStatus').textContent = '📱 מצב מקומי';
      renderExpenses();
    }

    function renderExpenses() {
      let tC = 0, tI = 0;
      EXPENSES.forEach(e => { tC += Number(e.czk)||0; tI += Number(e.ils)||0; });
      
      id('totalIls').textContent = '₪' + tI.toLocaleString('he-IL');
      id('homeSpent').textContent = '₪' + tI.toLocaleString('he-IL');
      id('totalCzk').textContent = tC.toLocaleString('he-IL') + ' CZK';
      
      // Update Budget Ring
      const percent = Math.min(Math.round((tI / TARGET_BUDGET) * 100), 100);
      const dashoffset = 219 - (219 * percent / 100);
      id('budgetRing').style.strokeDashoffset = dashoffset;
      id('budgetPercent').textContent = percent + '%';

      if (!EXPENSES.length) {
        id('expenseList').innerHTML = '<p style="text-align:center; color:var(--text-light);">עדיין אין הוצאות 💸</p>';
        return;
      }

      id('expenseList').innerHTML = EXPENSES.map((e, idx) => \`
        <div class="expense-row" style="animation-delay:\${idx*0.05}s">
          <div>
            <div class="expense-title">\${e.name}</div>
            <div class="expense-date">\${e.date || 'היום'} • \${e.note || ''}</div>
          </div>
          <div class="expense-amounts">
            <div class="exp-ils">₪\${Number(e.ils||0).toLocaleString('he-IL')}</div>
            <div class="exp-czk">\${Number(e.czk||0).toLocaleString('he-IL')} CZK</div>
          </div>
        </div>
      \`).join('');
    }

    function saveExpense() {
      const name = id('expName').value.trim();
      const czk = Number(id('expCzk').value||0);
      const ils = Number(id('expIls').value||0);
      const note = id('expNote').value.trim();
      
      if (!name) return alert('נא להזין תיאור הוצאה');
      
      id('saveExpBtn').textContent = 'שומר...';
      id('saveExpBtn').style.opacity = '0.7';

      const finishSave = () => {
        closeModals();
        id('saveExpBtn').textContent = 'שמור הוצאה 💸';
        id('saveExpBtn').style.opacity = '1';
        fireConfetti();
        loadExpenses();
      };

      if (isGas()) {
        google.script.run
          .withSuccessHandler(finishSave)
          .withFailureHandler(() => { alert('שגיאה בשמירה'); id('saveExpBtn').textContent = 'שמור הוצאה 💸'; })
          .addExpense(name, czk, ils, note);
      } else {
        EXPENSES.unshift({ id: Date.now(), date: new Date().toLocaleString('he-IL'), name, czk, ils, note });
        localStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
        finishSave();
      }
    }

    // --- CONFETTI ANIMATION ---
    function fireConfetti() {
      const canvas = id('confetti');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const pieces = [];
      const colors = ['#F43F5E', '#F59E0B', '#3B82F6', '#10B981'];
      for(let i=0; i<50; i++) {
        pieces.push({
          x: canvas.width/2, y: canvas.height/2 + 100,
          vx: (Math.random()-0.5)*20, vy: (Math.random()-1)*20 - 5,
          size: Math.random()*10+5, color: colors[Math.floor(Math.random()*colors.length)],
          rot: Math.random()*360, rotSpeed: (Math.random()-0.5)*10
        });
      }
      
      let req;
      function render() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let active = false;
        pieces.forEach(p => {
          p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.rot += p.rotSpeed;
          if (p.y < canvas.height) active = true;
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI/180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
          ctx.restore();
        });
        if(active) req = requestAnimationFrame(render);
        else ctx.clearRect(0,0,canvas.width,canvas.height);
      }
      render();
    }

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;

fs.writeFileSync('gas_project/index.html', fullHtml, 'utf8');
