import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add switchTab to the script block
switch_tab_code = """
    function switchTab(tabId) {
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      
      const tabEl = id('tab-' + tabId);
      if(tabEl) tabEl.classList.add('active');
      
      const navEl = id('nav-' + tabId);
      if(navEl) navEl.classList.add('active');
      
      const fab = id('fab');
      if(fab) {
        if (tabId === 'expenses') fab.style.display = 'flex';
        else fab.style.display = 'none';
      }
      
      const backBtn = id('backBtn');
      if(backBtn) {
        if (tabId === 'home') backBtn.style.display = 'none';
        else backBtn.style.display = 'flex';
      }
      
      window.scrollTo(0,0);
    }
"""
html = html.replace('    function id(x) { return document.getElementById(x); }', '    function id(x) { return document.getElementById(x); }\n' + switch_tab_code)


# 2. Add Flights card to Home dashboard
flights_card = """
          <div class="dash-card dash-flights" onclick="switchTab('flights')" style="background: linear-gradient(135deg, #173554, #244b70);">
            <div class="dash-overlay"></div>
            <div class="dash-content">
              <span class="dash-icon" style="color:var(--gold);">✈️</span>
              <h3 class="dash-title">טיסות</h3>
              <p class="dash-sub">פרטי המראה ונחיתה</p>
            </div>
          </div>
"""
html = html.replace('          <div class="dash-card dash-checklist" onclick="switchTab(\'checklist\')">', flights_card + '          <div class="dash-card dash-checklist" onclick="switchTab(\'checklist\')">')


# 3. Add back button to the Flights tab header
flights_header_fix = """<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; margin: 0;">כרטיסי טיסה ✈️</h2>
          <button class="btn btn-outline" style="width:auto; padding:8px 16px; border-radius:20px; font-size:14px;" onclick="switchTab('home')">🏠 חזור לדאשבורד</button>
        </div>"""
html = html.replace('<h2 style="color:var(--navy);margin-bottom:20px;font-weight:800;">כרטיסי טיסה ✈️</h2>', flights_header_fix)

# Remove the broken tab-btn that I injected previously (actually it failed to inject, so there is nothing to remove!)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
