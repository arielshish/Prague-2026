import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Home Tab to Dashboard UI
old_home = re.search(r'<!-- HOME TAB -->(.*?)<!-- DAYS \(STORIES\) TAB -->', html, re.DOTALL).group(1)

new_home = """
      <div id="tab-home" class="tab active">
        <!-- Boarding Pass -->
        <div class="boarding-pass" style="margin-bottom: 20px;">
          <div class="bp-header">
            <span>FLIGHT: LY2521</span>
            <span>DATE: 08 AUG 26</span>
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

        <!-- DASHBOARD GRID -->
        <h2 style="font-size: 20px; margin: 0 0 16px; color: var(--navy);">לאן ננווט? ✨</h2>
        <div class="dash-grid">
          <div class="dash-card dash-days" onclick="switchTab('days')">
            <div class="dash-overlay"></div>
            <div class="dash-content">
              <span class="dash-icon">🗺️</span>
              <h3 class="dash-title">המסלול שלנו</h3>
              <p class="dash-sub">כל האטרקציות לפי ימים</p>
            </div>
          </div>
          <div class="dash-card dash-expenses" onclick="switchTab('expenses')">
            <div class="dash-overlay"></div>
            <div class="dash-content">
              <span class="dash-icon">💳</span>
              <h3 class="dash-title">הוצאות</h3>
              <p class="dash-sub"><span id="dashSpent">₪0</span> / ₪15000</p>
            </div>
          </div>
          <div class="dash-card dash-checklist" onclick="switchTab('checklist')">
            <div class="dash-overlay"></div>
            <div class="dash-content">
              <span class="dash-icon">🧳</span>
              <h3 class="dash-title">מזוודה</h3>
              <p class="dash-sub">רשימת אריזה משותפת</p>
            </div>
          </div>
          <div class="dash-card dash-food" onclick="switchTab('food')">
            <div class="dash-overlay"></div>
            <div class="dash-content">
              <span class="dash-icon">🍽️</span>
              <h3 class="dash-title">המלצות</h3>
              <p class="dash-sub">מסעדות וקניות</p>
            </div>
          </div>
        </div>
      </div>
"""
html = html.replace(old_home, new_home)

# 2. Add Dashboard CSS
css_insert = """
    /* DASHBOARD UI */
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .dash-card { 
      position: relative; height: 160px; border-radius: 28px; overflow: hidden; cursor: pointer; 
      box-shadow: 0 10px 25px rgba(15,23,42,0.15); transition: transform 0.3s, box-shadow 0.3s;
      display: flex; flex-direction: column; justify-content: flex-end; padding: 16px;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .dash-card:active { transform: scale(0.95); }
    .dash-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.2) 100%); z-index: 1; }
    .dash-content { position: relative; z-index: 2; color: white; }
    .dash-icon { font-size: 32px; margin-bottom: 8px; display: block; filter: drop-shadow(0 2px 8px rgba(245,158,11,0.5)); }
    .dash-title { margin: 0; font-size: 18px; font-weight: 800; }
    .dash-sub { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
    
    .dash-days { background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg') center/cover; }
    .dash-expenses { background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Restaurant_v_Praze.jpg/800px-Restaurant_v_Praze.jpg') center/cover; }
    .dash-checklist { background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg/800px-Leti%C5%A1t%C4%9B_V%C3%A1clava_Havla_Praha_-_leti%C5%A1tn%C3%AD_v%C4%9B%C5%BE_%282019%29.jpg') center/cover; }
    .dash-food { background: url('https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Palladium_Prague.jpg/800px-Palladium_Prague.jpg') center/cover; }
    
    .header-nav { display: flex; align-items: center; gap: 12px; }
    .back-home-btn { background: var(--surface); color: var(--navy); border: 1px solid var(--line); border-radius: 20px; padding: 8px 16px; font-weight: bold; cursor: pointer; box-shadow: var(--shadow-sm); display: none; }
"""
html = html.replace('/* Fairy Tale CSS Enhancements */', css_insert + '\n    /* Fairy Tale CSS Enhancements */')

# 3. Add Back Home button to Header and remove bottom nav
html = html.replace('<div class="greeting">', '<div class="header-nav">\n        <button id="backBtn" class="back-home-btn" onclick="switchTab(\'home\')">🏠 ראשי</button>\n      </div>\n      <div class="greeting" id="greetingHeader">')
# Hide old bottom nav entirely
html = html.replace('<nav class="nav-bar">', '<nav class="nav-bar" style="display:none;">')

# 4. Modify logic: JS initialization and Dynamic POIS
# Remove static DAYS and POIS
js_remove = re.search(r'// Days Data.*?(?=function init\(\))', html, re.DOTALL).group(0)
html = html.replace(js_remove, """
    // Dynamic Data from Backend
    var DAYS = [];
    var POIS = {}; // Will be built dynamically
    var currentPoiId = null; // For moving attractions
""")

# Update init() to fetch itinerary
old_init = """    function init() {
      // Restore spent cache
      let savedTot = localStorage.getItem('prague_tot_v1');
      if(savedTot) {
        let parts = savedTot.split('|');
        id('homeSpent').textContent = '₪' + Number(parts[0]).toLocaleString('he-IL');
      }
      
      let savedPack = localStorage.getItem('prague_pack_v2');
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
      }

      updateCountdown();
      setInterval(updateCountdown, 60000);
      
      // Load expenses from GAS directly
      if (isGas()) {
        google.script.run.withSuccessHandler(function(res) {
          if (res && res.ok) {
            id('budgetDisplay').textContent = '₪' + Number(res.budget).toLocaleString('he-IL');
            TARGET_BUDGET = Number(res.budget);
          }
          loadExpenses();
        }).getInitialData();
      } else {
        loadExpenses();
      }
      
      renderDaysNav();
      selectDay(0);
    }"""

new_init = """    function init() {
      let savedTot = localStorage.getItem('prague_tot_v1');
      if(savedTot) {
        let parts = savedTot.split('|');
        id('dashSpent').textContent = '₪' + Number(parts[0]).toLocaleString('he-IL');
      }
      
      let savedPack = localStorage.getItem('prague_pack_v2');
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
                 syncListToCloud(); 
             }
          }).loadChecklist();
          
        // Load Itinerary
        id('dayTitle').textContent = '🔄 טוען מסלול מהענן...';
        google.script.run
          .withSuccessHandler((res) => {
             if(res.ok && res.data) {
                 DAYS = res.data;
                 buildPoisFromDays();
                 renderDaysNav();
                 selectDay(0);
                 populateExpenseDropdown();
             }
          }).loadItinerary();
      }

      updateCountdown();
      setInterval(updateCountdown, 60000);
      
      if (isGas()) {
        google.script.run.withSuccessHandler(function(res) {
          if (res && res.ok) {
            TARGET_BUDGET = Number(res.budget);
          }
          loadExpenses();
        }).getInitialData();
      } else {
        loadExpenses();
      }
    }
    
    function buildPoisFromDays() {
      POIS = {};
      DAYS.forEach(day => {
        if(day.attractions) {
          day.attractions.forEach(attr => {
            POIS[attr.id] = {
              title: attr.title,
              desc: attr.desc,
              link: attr.link,
              dayIndex: day.index,
              img: day.hero // Fallback to day hero if no specific image
            };
          });
        }
      });
    }
"""
html = html.replace(old_init, new_init)

# 5. Fix renderExpenses to update dashSpent instead of homeSpent
html = html.replace("id('homeSpent').textContent = '₪'", "if(id('dashSpent')) id('dashSpent').textContent = '₪'")

# 6. Update switchTab logic for back button
old_switchTab = "function switchTab(t) {"
new_switchTab = """function switchTab(t) {
      if (t === 'home') {
        id('backBtn').style.display = 'none';
        id('greetingHeader').style.display = 'block';
      } else {
        id('backBtn').style.display = 'block';
        id('greetingHeader').style.display = 'none';
      }
"""
html = html.replace(old_switchTab, new_switchTab)

# 7. Update renderDay to use the new attractions format
old_renderDay = """    function renderDay() {
      const day = DAYS[currentDayIndex];
      const tl = id('dayTimeline');
      tl.innerHTML = '';
      
      day.st.forEach((stop, i) => {
        let stopHtml = `<div class="stop-card" style="animation-delay:\${i*0.1}s" onclick="openPoiModal('\${stop}')">`;
        let imgHtml = '';
        let descHtml = '';
        
        if (POIS[stop]) {
          imgHtml = `<div class="stop-img" style="background-image:url('\${POIS[stop].img}')"></div>`;
          descHtml = `<p>\${POIS[stop].desc}</p>`;
        }
        
        stopHtml += `
          \${imgHtml}
          <div class="stop-info">
            <h4>\${stop}</h4>
            \${descHtml}
          </div>
        </div>`;
        tl.innerHTML += stopHtml;
      });
    }"""

new_renderDay = """    function renderDay() {
      if(!DAYS || DAYS.length === 0) return;
      const day = DAYS[currentDayIndex];
      const tl = id('dayTimeline');
      tl.innerHTML = '';
      
      if(day.attractions && day.attractions.length > 0) {
        day.attractions.forEach((attr, i) => {
          let stopHtml = `<div class="stop-card" style="animation-delay:\${i*0.1}s" onclick="openPoiModal('\${attr.id}')">`;
          let imgHtml = `<div class="stop-img" style="background-image:url('\${day.hero}')"></div>`;
          let descHtml = `<p>\${attr.desc}</p>`;
          
          stopHtml += `
            \${imgHtml}
            <div class="stop-info">
              <h4>\${attr.title}</h4>
              \${descHtml}
            </div>
          </div>`;
          tl.innerHTML += stopHtml;
        });
      } else {
        tl.innerHTML = '<p style="color:var(--text-light); text-align:center;">אין אטרקציות ביום זה.</p>';
      }
    }"""
html = html.replace(old_renderDay, new_renderDay)

# 8. Update openPoiModal to handle moving and tickets
old_openPoiModal = """    function openPoiModal(name) {
      const poi = POIS[name];
      if(!poi) return;
      
      id('poiImage').style.backgroundImage = `url('\${poi.img}')`;
      id('poiTitle').textContent = name;
      id('poiDesc').textContent = poi.desc;
      id('poiTip').textContent = poi.tip || 'תהנו!';
      
      id('poiMapBtn').href = `https://www.google.com/maps/search/\${encodeURIComponent(name + ' Prague')}`;
      
      id('poiModal').classList.add('show');
    }"""

new_openPoiModal = """    function openPoiModal(idStr) {
      const poi = POIS[idStr];
      if(!poi) return;
      currentPoiId = idStr;
      
      id('poiImage').style.backgroundImage = `url('\${poi.img}')`;
      id('poiTitle').textContent = poi.title;
      id('poiDesc').textContent = poi.desc;
      
      // Setup buttons
      id('poiMapBtn').href = `https://www.google.com/maps/search/\${encodeURIComponent(poi.title + ' Prague')}`;
      
      const tktBtn = id('poiTicketBtn');
      if (poi.link && poi.link.trim() !== '') {
        tktBtn.style.display = 'flex';
        tktBtn.onclick = () => window.open(poi.link, '_blank');
      } else {
        tktBtn.style.display = 'none';
      }
      
      // Generate move options
      const selectMove = id('moveDaySelect');
      selectMove.innerHTML = '<option value="">⇆ העבר ליום אחר...</option>';
      DAYS.forEach(d => {
        if(d.index !== poi.dayIndex) {
          selectMove.innerHTML += `<option value="\${d.index}">יום \${d.index + 1}: \${d.t}</option>`;
        }
      });
      
      id('poiModal').classList.add('show');
    }
    
    function handleMoveDay() {
      const newDayStr = id('moveDaySelect').value;
      if(newDayStr === '') return;
      if(!confirm('להעביר אטרקציה זו?')) {
         id('moveDaySelect').value = '';
         return;
      }
      
      closeModals();
      id('dayTitle').textContent = '🔄 מעדכן...';
      
      google.script.run
        .withSuccessHandler((res) => {
           // Reload itinerary completely
           google.script.run
             .withSuccessHandler((r) => {
                if(r.ok) {
                   DAYS = r.data;
                   buildPoisFromDays();
                   renderDaysNav();
                   selectDay(currentDayIndex);
                }
             }).loadItinerary();
        })
        .withFailureHandler(() => alert('שגיאה בהעברה'))
        .moveAttraction(currentPoiId, newDayStr);
    }
"""
html = html.replace(old_openPoiModal, new_openPoiModal)

# Update the POI modal HTML to include the new buttons and dropdown
old_poi_content = """        <div class="tip-box">
          <span>💡</span>
          <p class="tip-text" id="poiTip">טיפ</p>
        </div>
        <div class="split-row">
          <button class="btn btn-outline" onclick="closeModals()">סגור</button>
          <a class="btn btn-accent" id="poiMapBtn" href="#" target="_blank">🗺️ נווט לכאן</a>
        </div>"""

new_poi_content = """        <div class="split-row" style="margin-bottom:12px;">
          <select id="moveDaySelect" class="input" style="padding:12px; font-size:14px; background-color: var(--line);" onchange="handleMoveDay()">
             <option value="">⇆ העבר יום...</option>
          </select>
          <button class="btn btn-accent" id="poiTicketBtn" style="display:none; padding:12px; font-size:14px;">🎟️ הזמן כרטיסים</button>
        </div>
        <div class="split-row">
          <button class="btn btn-outline" onclick="closeModals()">סגור</button>
          <a class="btn" id="poiMapBtn" href="#" target="_blank" style="background:var(--navy); color:white;">🗺️ נווט לכאן</a>
        </div>"""
html = html.replace(old_poi_content, new_poi_content)

# Update dropdown generation in expenses
old_pop = """    function populateExpenseDropdown() {
      const select = id('expSelect');
      select.innerHTML = '<option value="" disabled selected>בחר מהרשימה...</option>';
      Object.keys(POIS).forEach(name => {
        select.innerHTML += `<option value="${name}">${name}</option>`;
      });
      select.innerHTML += '<option value="other">אחר... (הזנה ידנית)</option>';
    }"""

new_pop = """    function populateExpenseDropdown() {
      const select = id('expSelect');
      select.innerHTML = '<option value="" disabled selected>בחר מהרשימה...</option>';
      Object.keys(POIS).forEach(idKey => {
        let title = POIS[idKey].title;
        select.innerHTML += `<option value="${title}">${title}</option>`;
      });
      select.innerHTML += '<option value="other">אחר... (הזנה ידנית)</option>';
    }"""
html = html.replace(old_pop, new_pop)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
