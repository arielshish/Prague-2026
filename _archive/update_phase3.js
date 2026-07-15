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
      --green: #10B981;
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
    .boarding-pass { background: #0F172A; border-radius: 24px; padding: 24px; color: white; position: relative; overflow: hidden; box-shadow: 0 24px 30px -10px rgba(15,23,42,0.4); margin-bottom: 24px; border: 2px solid var(--gold); }
    .boarding-pass::before, .boarding-pass::after { content: ''; position: absolute; top: 50%; width: 30px; height: 30px; background: var(--bg); border-radius: 50%; transform: translateY(-50%); border: 2px solid var(--gold); }
    .boarding-pass::before { left: -16px; border-right: none; } .boarding-pass::after { right: -16px; border-left: none; }
    .bp-header { display: flex; justify-content: space-between; font-family: var(--font-en); font-size: 13px; font-weight: 700; color: var(--gold); letter-spacing: 2px; margin-bottom: 16px; opacity: 1; }
    .bp-route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .bp-city { font-size: 40px; font-weight: 800; font-family: var(--font-en); color: #FFFFFF; }
    .bp-icon { font-size: 28px; animation: fly 4s infinite linear; }
    .bp-footer { border-top: 1px dashed var(--gold); padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .bp-label { font-size: 12px; font-weight: 700; color: var(--gold); margin-bottom: 4px; opacity: 1; }
    .bp-val { font-size: 20px; font-weight: 800; color: #FFFFFF; }
    .countdown-big { font-size: 34px; font-weight: 800; color: var(--accent); font-family: var(--font-en); text-shadow: 0 2px 10px rgba(244,63,94,0.5); }

    /* Progress Ring Widget */
    .ring-widget { background: var(--surface); border-radius: 24px; padding: 20px; display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm); margin-bottom: 24px; border: 1px solid var(--line); }
    .ring-container { position: relative; width: 80px; height: 80px; }
    .ring-svg { width: 80px; height: 80px; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--line); stroke-width: 8; }
    .ring-fill { fill: none; stroke: var(--accent); stroke-width: 8; stroke-linecap: round; stroke-dasharray: 219; stroke-dashoffset: 219; transition: stroke-dashoffset 1.5s ease-out; }
    .ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-en); font-size: 18px; color: var(--navy); }
    .ring-info { flex: 1; }
    .ring-info-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .ring-info-top h3 { margin: 0; color: var(--navy); font-size: 16px; display: flex; align-items: center; gap: 6px; }
    .ring-info p { margin: 0; color: var(--text-light); font-size: 13px; }
    .edit-btn { background: none; border: none; font-size: 16px; cursor: pointer; padding: 4px; border-radius: 50%; background: var(--line); color: var(--text); }

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
    .checklist-header { display: flex; gap: 8px; margin-bottom: 16px; }
    .checklist-header input { flex: 1; padding: 12px 16px; border-radius: 16px; border: 1px solid var(--line); background: var(--surface); color: var(--text); font-family: var(--font-he); font-size: 15px; }
    .checklist-header input:focus { outline: none; border-color: var(--accent); }
    .checklist-header button { padding: 12px 20px; border-radius: 16px; background: var(--navy); color: white; border: none; font-weight: bold; cursor: pointer; font-family: var(--font-he); }
    .check-item { display: flex; align-items: center; gap: 12px; background: var(--surface); padding: 16px; border-radius: 16px; margin-bottom: 8px; border: 1px solid var(--line); }
    .check-item-content { display: flex; align-items: center; gap: 12px; flex: 1; cursor: pointer; }
    .checkbox { width: 24px; height: 24px; border-radius: 8px; border: 2px solid var(--line); display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s; flex-shrink: 0; }
    .check-item.done .checkbox { background: var(--green); border-color: var(--green); }
    .check-item.done .checkbox::after { content: '✓'; }
    .check-item.done span { text-decoration: line-through; opacity: 0.5; }
    .del-btn { background: none; border: none; font-size: 18px; color: var(--text-light); cursor: pointer; padding: 4px; border-radius: 8px; }
    .del-btn:hover { background: rgba(244,63,94,0.1); color: var(--accent); }

    /* Recommendations Section */
    .rec-card { background: var(--surface); border-radius: 20px; padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--line); }
    .rec-card h3 { margin: 0 0 12px; color: var(--navy); font-size: 18px; display: flex; align-items: center; gap: 8px; }
    .rec-item { padding: 12px 0; border-bottom: 1px solid var(--line); }
    .rec-item:last-child { border-bottom: none; padding-bottom: 0; }
    .rec-item h4 { margin: 0 0 4px; color: var(--accent); font-size: 15px; }
    .rec-item p { margin: 0; font-size: 13px; color: var(--text-light); }

    /* Floating Nav Bar */
    .nav-bar { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); width: calc(min(480px, 100%) - 48px); height: 72px; background: var(--surface-dim); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 36px; display: flex; justify-content: space-around; align-items: center; box-shadow: var(--shadow-lg); border: 1px solid rgba(255,255,255,0.4); z-index: 50; padding: 0 12px; }
    .dark-mode .nav-bar { border-color: rgba(255,255,255,0.05); }
    .nav-btn { background: none; border: none; font-size: 24px; color: var(--text-light); cursor: pointer; width: 48px; height: 48px; border-radius: 24px; transition: all 0.3s; display: flex; align-items: center; justify-content: center; position: relative; }
    .nav-btn.active { color: var(--accent); background: rgba(244,63,94,0.1); }
    
    /* Floating Action Button (Moved to Side) */
    .fab { position: fixed; bottom: 110px; right: 24px; width: 64px; height: 64px; border-radius: 32px; background: linear-gradient(135deg, var(--accent), #E11D48); color: white; border: none; box-shadow: 0 12px 24px var(--accent-glow); font-size: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 60; transition: transform 0.2s; }
    .fab:active { transform: scale(0.9); }

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
    select.input { appearance: none; background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="%23334155"><path d="M1 3l5 5 5-5"/></svg>'); background-repeat: no-repeat; background-position: left 16px center; padding-left: 40px; }

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
            <div class="ring-info-top">
              <h3>תקציב יעד: <span id="budgetDisplay">₪15000</span> <button class="edit-btn" onclick="editBudget()">✏️</button></h3>
            </div>
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
          <!-- Fixed href issue by using div instead of a -->
          <div class="quick-card" onclick="switchTab('checklist')">
            <div class="quick-icon">🧳</div>
            <h4>רשימת אריזה</h4>
            <span style="font-size:12px; color:var(--text-light);">אל תשכחו כלום</span>
          </div>
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

      <!-- CHECKLIST TAB (Separated) -->
      <div id="tab-checklist" class="tab">
        <h2 style="font-size: 24px; margin: 0 0 16px;">צ'ק ליסט מזוודות 🧳</h2>
        
        <!-- Add Item -->
        <div class="checklist-header">
          <input type="text" id="newChecklistItem" placeholder="הוסף פריט חדש...">
          <button onclick="addChecklistItem()">הוסף ➕</button>
        </div>
        
        <div id="checklistContainer" style="margin-bottom: 32px;"></div>
      </div>

      <!-- FOOD & RECOMMENDATIONS TAB (Separated) -->
      <div id="tab-food" class="tab">
        <h2 style="font-size: 24px; margin: 0 0 16px;">מסעדות וקניות 🥩🛍️</h2>
        
        <div class="rec-card">
          <h3>🍽️ מסעדות בשרים שוות (צ'כיות ומודרניות)</h3>
          <div class="rec-item">
            <h4>Kantýna (קנטינה)</h4>
            <p>חוויית בשרים אולטימטיבית! בוחרים נתחים טריים מהקצב במקום ויושבים באולם מרשים. אל תפספסו את הקרפצ'יו והסטייקים. אווירה רועשת ושמחה.</p>
          </div>
          <div class="rec-item">
            <h4>V Kolkovně</h4>
            <p>מסעדה צ'כית קלאסית בעיר העתיקה (רשת פילזנר אורקוול). ברווז צלוי מעולה, גולאש אותנטי, ומנות ילדים נוחות. כדאי להזמין מקום מראש!</p>
          </div>
          <div class="rec-item">
            <h4>Naše maso</h4>
            <p>קצביית בוטיק שמכינה צ'יזבורגרים פסיכיים ונקניקיות פרימיום. המקום קטן מאוד (לרוב אוכלים בעמידה), אבל שווה כל ביס!</p>
          </div>
        </div>

        <div class="rec-card">
          <h3>🛍️ שופינג נבחר</h3>
          <div class="rec-item">
            <h4>Primark Wenceslas Square</h4>
            <p>הסניף הענק והחדש (נפתח ב-2021). 3 קומות של ביגוד, הנעלה ומוצרי בית במחירים זולים במיוחד. טיפ: תגיעו מיד עם הפתיחה (09:00) כי התורים לקופות ולתאי המדידה הופכים לבלתי נסבלים בצהריים.</p>
          </div>
          <div class="rec-item">
            <h4>Palladium (פלדיום)</h4>
            <p>הקניון הכי גדול ויפה במרכז העיר. למעלה מ-170 חנויות מותגים, קומת אוכל גדולה למעלה. בניין היסטורי שהפך לפנינת קניות ממוזגת!</p>
          </div>
          <div class="rec-item">
            <h4>Fashion Arena Prague Outlet</h4>
            <p>לאוהבי מותגים במבצעים - אאוטלט ענק בצורת מעגל בפאתי העיר. יש שאטלים ממרכז העיר או נסיעה במטרו A ל-Depo Hostivař ומשם אוטובוס חינם.</p>
          </div>
        </div>
      </div>

    </main>

    <!-- Side Floating Action Button -->
    <button class="fab" onclick="openExpenseModal()">➕</button>

    <!-- 5 Item Bottom Nav Bar -->
    <nav class="nav-bar">
      <button class="nav-btn active" id="nav-home" onclick="switchTab('home')">🏠</button>
      <button class="nav-btn" id="nav-days" onclick="switchTab('days')">🗺️</button>
      <button class="nav-btn" id="nav-expenses" onclick="switchTab('expenses')">💳</button>
      <button class="nav-btn" id="nav-checklist" onclick="switchTab('checklist')">🧳</button>
      <button class="nav-btn" id="nav-food" onclick="switchTab('food')">🍽️</button>
    </nav>
  </div>

  <!-- MODALS -->
  <!-- Expense Modal (With Dropdown) -->
  <div class="modal-overlay" id="expenseModal">
    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-content">
        <h2 style="margin: 0 0 24px; font-size:22px;">הוספת הוצאה</h2>
        
        <div class="input-group">
          <label>אטרקציה / תיאור</label>
          <select class="input" id="expSelect" onchange="toggleManualExpense()">
            <!-- Options generated by JS -->
          </select>
        </div>
        
        <!-- Hidden by default, shown if "אחר..." is selected -->
        <div class="input-group" id="manualExpGroup" style="display:none; margin-top:-8px;">
          <input type="text" class="input" id="expNameManual" placeholder="למשל: ארוחת צהריים, זארה...">
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
    var PACKING_LIST = [];
    
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
      'Comfort Hotel Prague City East': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'מלון משפחתי נעים במזרח העיר. קרוב לתחנת המטרו Strašnická (קו ירוק A). ארוחת בוקר בסיסית אך טובה.', tip: 'בדקו איפה הסופרמרקט הקרוב למלון (יש Albert או Billa) כדי לקנות מים ונשנושים לילדים.' },
      'ארוחת ערב רגועה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Czech_cuisine_-_Smazak.jpg/800px-Czech_cuisine_-_Smazak.jpg', desc: 'התאקלמות רגועה במסעדה אותנטית.', tip: 'נסו את ה-Smažený sýr (גבינה מטוגנת צ\\'כית) - הילדים יעופו על זה!' },
      'נסיעה במטרו למרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg/800px-Prague_Metro_A_train_at_Depo_Hostiva%C5%99.jpg', desc: 'הליכה קצרה לתחנת Strašnická ומשם ישר לתחנת Staroměstská (כ-10 דק\\' נסיעה). המטרו פועל בתדירות גבוהה.', tip: 'ילדים צעירים נוסעים בחינם או בהנחה, בדקו בגילאי הילדים שלכם. קנו כרטיסים יומיים למבוגרים.' },
      'Old Town Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg', desc: 'כיכר העיר העתיקה, הלב הפועם של פראג. מוקפת כנסיות גותיות, ארמונות בארוק ודוכני אוכל רחוב.', tip: 'מקום מושלם להצטלם עם בועות הסבון הענקיות! היזהרו מכייסים באזור זה.' },
      'Astronomical Clock': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Prague_Astronomical_Clock_%2848386348421%29.jpg/800px-Prague_Astronomical_Clock_%2848386348421%29.jpg', desc: 'השעון האסטרונומי המפורסם והפעיל העתיק בעולם, מראה תנועות שמש, ירח ומזלות.', tip: 'הגיעו כ-10 דקות לפני שעה עגולה לתפוס מקום טוב למופע הבובות.' },
      'Charles Bridge': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Charles_Bridge_in_Prague_at_sunset.jpg/800px-Charles_Bridge_in_Prague_at_sunset.jpg', desc: 'גשר אבן עתיק מעל נהר הוולטאבה. נופים מדהימים של הטירה מעבר לנהר, ציירי דיוקנאות ואמני רחוב.', tip: 'מגע בלוחית הנחושת בתחתית פסלו של יאן נפומוק מביא מזל טוב ומשאלה שתחזרו לפראג.' },
      'חשמלית לטירת פראג': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg/800px-Prague_tram_15T_in_Karmelitsk%C3%A1_street.jpg', desc: 'רדו בתחנת Malostranská ועלו בחשמלית 22 או 23 לתחנת Pražský hrad כדי לחסוך עליות קשות ברגל עם הילדים.', tip: 'החשמלית הזו נחשבת לאחת היפות בפראג - שבו ליד החלון!' },
      'Prague Castle': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg', desc: 'מתחם הטירה הגדול בעולם (גינס). קתדרלת ויטוס הקדוש מרהיבה עם חלונות הויטראז\\' המדהימים שלה.', tip: 'טקס חילופי משמרות חגיגי מתקיים בשעה 12:00 בחצר הראשונה עם תזמורת!' },
      'Golden Lane': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Golden_Lane.jpg/800px-Golden_Lane.jpg', desc: 'סמטת הזהב הקסומה. רחוב של בתים זעירים וצבעוניים ששימשו בעבר שומרים, צורפים וגם את פרנץ קפקא.', tip: 'תנו לילדים לחפש את השריונות הישנים וכלי הנשק בנשקייה שבקומה השנייה.' },
      'תצפית שקיעה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Prague_at_sunset_%283088924151%29.jpg/800px-Prague_at_sunset_%283088924151%29.jpg', desc: 'נוף פנורמי מרהיב של כל פראג של מטה, עם אלפי גגות רעפים אדומים מנצנצים בשקיעה.', tip: 'רדו בחזרה לעיר ברגל דרך המדרגות הישנות (Staré zámecké schody) - נוף מטריף וקליל לירידה.' },
      'Kingdom of Railways': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg/800px-Kr%C3%A1lovstv%C3%AD_%C5%BEeleznic_%281%29.jpg', desc: 'ממלכת הרכבות המיניאטוריות הגדולה בצ\\'כיה. רכבות נוסעות בין ערים זעירות, פראג מיניאטורית והכל מחליף יום ולילה!', tip: 'מעולה לילדים ומבוגרים! תנו להם "לנהוג" בסימולטורים של חשמליות אמיתיות שמוצבות שם.' },
      'Hamleys': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Hamleys_Prague_2.jpg/800px-Hamleys_Prague_2.jpg', desc: 'חנות הצעצועים העצומה במרכז העיר. זה יותר מלונה פארק מחנות - יש קרוסלה, מתחם מציאות מדומה ותצוגות ענק.', tip: 'אל תפספסו את מגלשת הענק המפותלת בתוך החנות בחינם! אפשר להעביר כאן שעות.' },
      'קינוח טרדלניק במרכז': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Trdeln%C3%ADk_on_a_spit.jpg/800px-Trdeln%C3%ADk_on_a_spit.jpg', desc: 'הקינוח הלאומי-תיירותי - מאפה שמרים מסובב על אש פתוחה, מצופה סוכר וקינמון (קיורטוש). ריח משגע ברחוב.', tip: 'הגרסה המושחתת ביותר לילדים מגיעה במילוי גלידה רכה, נוטלה, תותים וקצפת.' },
      'נסיעה ל-Aquapalace': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Opatov_metro_station_in_Prague_%281%29.jpg/800px-Opatov_metro_station_in_Prague_%281%29.jpg', desc: 'מטרו קו C עד תחנת Opatov ומשם קו אוטובוס ייעודי לפארק המים (Aquabus).', tip: 'הנסיעה לוקחת כ-30-40 דקות. קחו את זה באיזי והכינו חטיפים לילדים.' },
      'Aquapalace Prague': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aquapalace_Praha_-_tobog%C3%A1ny.jpg/800px-Aquapalace_Praha_-_tobog%C3%A1ny.jpg', desc: 'פארק המים המקורה הגדול ביותר במרכז אירופה! מגלשות אקסטרים, נהר זורם, גלים וספינת פיראטים מדהימה לקטנים.', tip: 'תביאו מגבות מהמלון כדי לחסוך עמלות השכרה. המקום חם ומושלם לימים גשומים או חמים.' },
      'ארוחת ערב בקניון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chodov_shopping_center_interior.jpg/800px-Chodov_shopping_center_interior.jpg', desc: 'אפשר לחזור למרכז דרך קניון Westfield Chodov (תחנת Chodov במסלול המטרו). קניון עצום ומודרני.', tip: 'במתחם המזון הגדול למעלה תמצאו הכל: סושי, המבורגרים, פסטות - פתרון נוח בטירוף למשפחות!' },
      'נסיעה לגן החיות': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg/800px-N%C3%A1dra%C5%BE%C3%AD_Hole%C5%A1ovice_%28n%C3%A1stupi%C5%A1t%C4%9B_metro_C%29.jpg', desc: 'מטרו C לתחנת Nádraží Holešovice ומשם אוטובוס 112 מגיע ישר לשער.', tip: 'לאטרקציה מיוחדת (בימים יפים): אפשר להגיע לגן החיות בשייט פסטורלי על נהר הוולטאבה!' },
      'Prague Zoo': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Zoo_Praha_-_hlavn%C3%AD_vchod.jpg/800px-Zoo_Praha_-_hlavn%C3%AD_vchod.jpg', desc: 'מדורג באופן קבוע כאחד מ-5 גני החיות הטובים בעולם. שטח ענק עם תצוגות פתוחות, מתחם פילים, גורילות וג\\'ונגל אינדונזי.', tip: 'גן החיות יושב על צלע הר. מומלץ לעלות ברכבל הכיסאות לחלק העליון ולרדת לאט ברגל כדי למנוע התעייפות.' },
      'פארק Stromovka': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Stromovka_%28Prague%29.jpg/800px-Stromovka_%28Prague%29.jpg', desc: 'הסנטרל פארק של פראג! פארק מוריק ומהמם, עם אגמים קטנים, ברבורים ושבילים רחבים.', tip: 'נמצא ממש ליד גן החיות, מושלם לפרוש שמיכה, לאכול גלידה ולתת לילדים להוציא מרץ בדשא.' },
      'Primark Wenceslas Square': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Wenceslas_Square_-_Primark_Prague.jpg/800px-Wenceslas_Square_-_Primark_Prague.jpg', desc: 'חנות האופנה הענקית בלב כיכר ואצלב. 3 קומות של ביגוד גברים, נשים, ילדים ואביזרי בית במחירי רצפה.', tip: 'הגיעו ממש על שעת הפתיחה (09:00)! בצהריים התורים למדידה ולקופה הופכים בלתי נסבלים.' },
      'הליכה דרך כיכר ואצלב': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Wenceslas_Square_from_NM.jpg/800px-Wenceslas_Square_from_NM.jpg', desc: 'השדרה המרכזית וההומה של פראג (בצורת מלבן ארוך). מלאה בחנויות רשת, בתי קפה, רוקחים ואווירת כרך שוקקת.', tip: 'אל תפספסו את ארכיטקטורת הבניינים המעוטרת שמעל קומת החנויות - פשוט תרימו את הראש.' },
      'Palladium': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg', desc: 'קניון הפרימיום של פראג, שוכן במבנה היסטורי משופץ (לשעבר קסרקטין). 200 חנויות עם מיטב המותגים העולמיים.', tip: 'מתחם האוכל הענק בקומה העליונה מצוין להפסקת צהריים לכל המשפחה בלי להתווכח על סוג האוכל.' },
      'ארוחת סיום': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Restaurant_v_Praze.jpg/800px-Restaurant_v_Praze.jpg', desc: 'ארוחה חגיגית לסיום הטיול המוצלח.', tip: 'הרימו כוס בירה צ\\'כית (וקופולה לילדים) ב-Kantyna או מסעדה טובה באזור כיכר הרפובליקה!' },
      'צ׳ק-אאוט מהמלון': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Praha_Stra%C5%A1nice_Solidarita.jpg/800px-Praha_Stra%C5%A1nice_Solidarita.jpg', desc: 'אריזות אחרונות, פינוי החדר ופרידה מצוות המלון.', tip: 'אם טיסת הערב, תשאירו מזוודות בשמירת חפצים ותקפצו לעיר לעוד סיבוב קניות או עוגה טובה.' },
      'נסיעה לשדה התעופה': { img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg', desc: 'חזרה לנמל התעופה PRG. מטרו A לתחנת Veleslavín ומשם אוטובוס 119.', tip: 'הגיעו כשלוש שעות לפני הטיסה, התורים לבידוק בטחוני לטיסות לארץ לוקחים זמן.' }
    };

    var DEFAULT_PACKING = [
      { text: 'דרכונים (בתוקף!)', done: false },
      { text: 'ביטוח נסיעות וטפסים', done: false },
      { text: 'כסף מזומן (יורו/CZK) + אשראי', done: false },
      { text: 'בגדים חמים לערב (ז\\'קט)', done: false },
      { text: 'בגדי ים (לאקוופאלאס)', done: false },
      { text: 'נעלי הליכה נוחות', done: false },
      { text: 'תרופות ועזרה ראשונה', done: false },
      { text: 'משחקים לטיסה', done: false }
    ];

    function id(el) { return document.getElementById(el); }
    
    // --- INITIALIZATION ---
    function init() {
      // Load Budget
      const savedBudget = localStorage.getItem('prague_budget_v12');
      if(savedBudget) TARGET_BUDGET = Number(savedBudget);
      id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');

      setupDateAndCountdown();
      renderStories();
      loadChecklist();
      setupExpenseDropdown();
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

    // --- CHECKLIST LOGIC ---
    function loadChecklist() {
      try {
        const saved = localStorage.getItem('prague_checklist_items_v12');
        if(saved) PACKING_LIST = JSON.parse(saved);
        else PACKING_LIST = [...DEFAULT_PACKING];
      } catch(e){ PACKING_LIST = [...DEFAULT_PACKING]; }
      renderChecklist();
    }

    function renderChecklist() {
      if(PACKING_LIST.length === 0) {
        id('checklistContainer').innerHTML = '<p style="text-align:center; color:var(--text-light);">הרשימה ריקה. הוסיפו פריטים למעלה.</p>';
        return;
      }
      id('checklistContainer').innerHTML = PACKING_LIST.map((item, i) => {
        const isDone = item.done ? 'done' : '';
        return \`<div class="check-item \${isDone}">
                  <div class="check-item-content" onclick="toggleCheck(\${i})">
                    <div class="checkbox"></div>
                    <span>\${item.text}</span>
                  </div>
                  <button class="del-btn" onclick="deleteCheckItem(\${i})">🗑️</button>
                </div>\`;
      }).join('');
    }

    function toggleCheck(idx) {
      PACKING_LIST[idx].done = !PACKING_LIST[idx].done;
      saveChecklist();
      renderChecklist();
    }
    
    function deleteCheckItem(idx) {
      if(confirm('למחוק פריט זה?')) {
        PACKING_LIST.splice(idx, 1);
        saveChecklist();
        renderChecklist();
      }
    }

    function addChecklistItem() {
      const input = id('newChecklistItem');
      const val = input.value.trim();
      if(val) {
        PACKING_LIST.unshift({text: val, done: false});
        input.value = '';
        saveChecklist();
        renderChecklist();
      }
    }

    function saveChecklist() {
      localStorage.setItem('prague_checklist_items_v12', JSON.stringify(PACKING_LIST));
    }

    // --- BUDGET LOGIC ---
    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        localStorage.setItem('prague_budget_v12', TARGET_BUDGET);
        id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        renderExpenses(); // Recalculate rings
      }
    }

    // --- EXPENSES LOGIC & MODALS ---
    function setupExpenseDropdown() {
      const select = id('expSelect');
      let optionsHtml = '<option value="">-- בחר אטרקציה/מסעדה --</option>';
      const allPois = Object.keys(POIS);
      allPois.forEach(name => {
        optionsHtml += \`<option value="\${name.replace(/"/g, '&quot;')}">\${name}</option>\`;
      });
      optionsHtml += '<option value="other">אחר... (הזנה ידנית)</option>';
      select.innerHTML = optionsHtml;
    }

    function toggleManualExpense() {
      const selectVal = id('expSelect').value;
      if (selectVal === 'other') {
        id('manualExpGroup').style.display = 'block';
        id('expNameManual').focus();
      } else {
        id('manualExpGroup').style.display = 'none';
        id('expNameManual').value = '';
      }
    }

    function openExpenseModal() {
      id('expSelect').value = '';
      id('expNameManual').value = '';
      toggleManualExpense();
      id('expCzk').value = ''; 
      id('expIls').value = ''; 
      id('expNote').value = '';
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
      let name = id('expSelect').value;
      if (name === 'other') {
        name = id('expNameManual').value.trim();
      }
      
      const czk = Number(id('expCzk').value||0);
      const ils = Number(id('expIls').value||0);
      const note = id('expNote').value.trim();
      
      if (!name) return alert('נא להזין תיאור הוצאה או לבחור מהרשימה');
      
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
          .withFailureHandler(() => { alert('שגיאה בשמירה'); id('saveExpBtn').textContent = 'שמור הוצאה 💸'; id('saveExpBtn').style.opacity = '1'; })
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
