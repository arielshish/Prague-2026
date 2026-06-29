    // --- APP DATA & LOGIC ---
    var RATE = 6.4; 
    var TARGET_BUDGET = 15000;
    var EXPENSES = [];
    var PACKING_LIST = [];
    
    
    // Dynamic Data from Backend
    var DAYS = [];
    var BANK = [];
    var sortableTimeline = null;
    var sortableBank = null;
    var POIS = {}; // Will be built dynamically
    var currentPoiId = null; // For moving attractions



    function id(x) { return document.getElementById(x); }

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

    
    function updateCountdown() {
      const target = new Date('2026-08-08T05:35:00').getTime();
      const now = new Date().getTime();
      const d = Math.max(0, Math.floor((target - now) / (1000 * 60 * 60 * 24)));
      if (id('daysLeft')) id('daysLeft').textContent = d;
      if (id('currentDate')) id('currentDate').textContent = new Date().toLocaleDateString('he-IL');
    }

    function pullChecklist() {
      if(!isGas()) return;
      if (id('packSyncStatus')) id('packSyncStatus').textContent = '🔄 מושך נתונים...';
      google.script.run
        .withSuccessHandler((res) => {
           if(res.ok && res.data) {
               PACKING_LIST = res.data;
               safeStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
               renderList();
               if (id('packSyncStatus')) id('packSyncStatus').textContent = '✓ מעודכן מהענן';
           }
        })
        .withFailureHandler(() => { if (id('packSyncStatus')) id('packSyncStatus').textContent = '⚠️ שגיאת חיבור'; })
        .loadChecklist();
    }

    function syncListToCloud() {
      if(!isGas()) return;
      if (id('packSyncStatus')) id('packSyncStatus').textContent = '🔄 מסנכרן...';
      google.script.run
        .withSuccessHandler((res) => {
           if(res.ok) { if (id('packSyncStatus')) id('packSyncStatus').textContent = '✓ מעודכן'; }
           else { if (id('packSyncStatus')) id('packSyncStatus').textContent = '⚠️ שגיאה'; }
        })
        .withFailureHandler(() => { if (id('packSyncStatus')) id('packSyncStatus').textContent = '⚠️ שגיאה'; })
        .syncChecklist(PACKING_LIST);
    }

    function renderList() {
      const c = id('checklistContainer');
      if (!c) return;
      c.innerHTML = PACKING_LIST.map((item, i) => `
        <div class="check-item ${item.done ? 'done' : ''}">
          <div class="check-item-content" onclick="toggleCheckItem(${i})">
            <div class="checkbox"></div>
            <span>${item.text}</span>
          </div>
          <button class="del-btn" onclick="deleteCheckItem(${i})">🗑️</button>
        </div>
      `).join('');
    }

    function toggleCheckItem(i) {
      PACKING_LIST[i].done = !PACKING_LIST[i].done;
      safeStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
      renderList();
      syncListToCloud();
    }

    function deleteCheckItem(i) {
      if(confirm('למחוק פריט זה?')) {
        PACKING_LIST.splice(i, 1);
        safeStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
        renderList();
        syncListToCloud();
      }
    }

    function addChecklistItem() {
      const el = id('newChecklistItem');
      if(!el) return;
      const t = el.value.trim();
      if(t) {
        PACKING_LIST.push({ id: 'id_' + Date.now(), text: t, category: 'כללי', done: false });
        el.value = '';
        safeStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
        renderList();
        syncListToCloud();
      }
    }
    

    function renderDay() {
      const d = DAYS[currentDayIndex];
      const tl = id('timelineList');
      const bl = id('bankList');
      if (!tl || !bl) return;
      
      tl.innerHTML = '';
      if(d && d.attractions) {
         d.attractions.forEach(a => {
            tl.innerHTML += `
            <div class="poi-card" data-id="${a.id}">
               <div class="drag-handle">☰</div>
               <div style="flex-grow:1;" onclick="openMoveModal('${a.id}')">
                  <div class="poi-title">${a.title}</div>
                  <div class="poi-desc">${a.desc}</div>
               </div>
            </div>`;
         });
      }
      
      bl.innerHTML = '';
      if(BANK) {
         BANK.forEach(a => {
            bl.innerHTML += `
            <div class="poi-card" data-id="${a.id}" style="background: white;">
               <div class="drag-handle">☰</div>
               <div style="flex-grow:1;" onclick="openMoveModal('${a.id}')">
                  <div class="poi-title">${a.title}</div>
                  <div class="poi-desc">${a.desc}</div>
               </div>
            </div>`;
         });
      }
      
      initSortable();
    }

    function renderDaysNav() {
      const w = id('storyWrapper');
      if (!w) return;
      w.innerHTML = DAYS.map((d, i) => `
        <div class="story-item ${i===currentDayIndex ? 'active' : ''}" onclick="selectDay(${i})" id="story-${i}">
          <div class="story-ring">
            <div class="story-inner">${d.e}</div>
          </div>
          <div class="story-label">יום ${d.index + 1}</div>
        </div>
      `).join('');
    }
    
    var currentDayIndex = 0;
    function selectDay(idx) {
      currentDayIndex = idx;
      renderDaysNav();
      const d = DAYS[idx];
      if(d) {
        if(id('dayTitle')) id('dayTitle').textContent = d.t;
        if(id('dayDesc')) id('dayDesc').textContent = d.s;
        if(id('dayHero')) id('dayHero').style.backgroundImage = `url('${d.hero}')`;
      }
      renderDay();
    }
    

    function syncAppData() {
      if(isGas()) {
         google.script.run
           .withFailureHandler((e) => console.error("Sync Error: ", e))
           .saveAppData(TARGET_BUDGET, PACKING_LIST);
      }
    }

    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        syncAppData();
        renderExpenses(); // to update rings
      }
    }
    

    

    function buildPoisFromDays() {
      POIS = {};
      DAYS.forEach(d => {
         if(d.attractions) {
            d.attractions.forEach(a => {
               POIS[a.id] = { ...a, img: d.hero, dayIdx: d.index };
            });
         }
      });
      if (BANK) {
          BANK.forEach(a => {
              POIS[a.id] = { ...a, img: '', dayIdx: -1 };
          });
      }
      
      const sel = id('moveDaySelect');
      if (sel) {
        let opts = '<option value="">⇆ העבר יום...</option>';
        DAYS.forEach(d => {
           opts += `<option value="${d.index}">יום ${d.index + 1} - ${d.t}</option>`;
        });
        opts += `<option value="-1">בנק מקומות (ללא שיבוץ)</option>`;
        sel.innerHTML = opts;
      }
    }
    function initSortable() {
      if (typeof Sortable === 'undefined') return;
      
      if (sortableTimeline) sortableTimeline.destroy();
      if (sortableBank) sortableBank.destroy();
      
      const tl = id('timelineList');
      const bl = id('bankList');
      
      const onEndDrag = function (evt) {
          const itemEl = evt.item;
          const itemId = itemEl.getAttribute('data-id');
          const toList = evt.to.id; // 'timelineList' or 'bankList'
          
          let targetDayIdx = -1; // bank
          if (toList === 'timelineList') {
              targetDayIdx = currentDayIndex;
          }
          
          // Show updating state
          id('dayTitle').textContent = '🔄 מעדכן מסד נתונים...';
          
          if (isGas()) {
              google.script.run
                 .withSuccessHandler((res) => {
                     // Reload data fully from DB to ensure sync
                     google.script.run
                      .withSuccessHandler((res2) => {
                         if(res2.ok && res2.data) {
                             DAYS = res2.data;
                             BANK = res2.bank || [];
                             buildPoisFromDays();
                             selectDay(currentDayIndex);
                         }
                      }).loadItinerary();
                 })
                 .withFailureHandler(() => { alert('שגיאה בעדכון המסד!'); selectDay(currentDayIndex); })
                 .moveAttraction(itemId, targetDayIdx);
          }
      };

      sortableTimeline = new Sortable(tl, {
          group: 'shared',
          animation: 150,
          handle: '.drag-handle',
          onEnd: onEndDrag
      });
      
      sortableBank = new Sortable(bl, {
          group: 'shared',
          animation: 150,
          handle: '.drag-handle',
          onEnd: onEndDrag
      });
    }


    function buildPoisFromDays() {
      POIS = {};
      DAYS.forEach(d => {
         if(d.attractions) {
            d.attractions.forEach(a => {
               POIS[a.id] = { ...a, img: d.hero, dayIdx: d.index };
            });
         }
      });
      if (BANK) {
          BANK.forEach(a => {
              POIS[a.id] = { ...a, img: '', dayIdx: -1 };
          });
      }
      
      const sel = id('moveDaySelect');
      if (sel) {
        let opts = '<option value="">⇆ העבר יום...</option>';
        DAYS.forEach(d => {
           opts += `<option value="${d.index}">יום ${d.index + 1} - ${d.t}</option>`;
        });
        opts += `<option value="-1">בנק מקומות (ללא שיבוץ)</option>`;
        sel.innerHTML = opts;
      }
    }
    function handleMoveDay() {
       const newIdx = id('moveDaySelect').value;
       if(newIdx === "" || !currentPoiId || !isGas()) return;
       
       id('poiTitle').textContent = 'מעביר...';
       google.script.run
         .withSuccessHandler((res) => {
             closeModals();
             id('dayTitle').textContent = '🔄 מרענן...';
             google.script.run
              .withSuccessHandler((res) => {
                 if(res.ok && res.data) {
                     DAYS = res.data;
                 BANK = res.bank || [];
                     buildPoisFromDays();
                     selectDay(currentDayIndex);
                 }
              }).loadItinerary();
         })
         .withFailureHandler(() => { alert('שגיאה בהעברת האטרקציה'); })
         .moveAttraction(currentPoiId, newIdx);
    }

function init() {
      setupDateAndCountdown();
      renderStories();
      
      if (isGas()) {
        id('dayTitle').textContent = '🔄 נטען מהענן...';
        
        // Load App Data (Budget & Checklist)
        google.script.run
          .withSuccessHandler((resData) => {
             if(resData.ok && resData.data) {
                 if (resData.data.budget) {
                     TARGET_BUDGET = resData.data.budget;
                 }
                 if (resData.data.packing_list) {
                     PACKING_LIST = resData.data.packing_list;
                 } else {
                     PACKING_LIST = [...DEFAULT_PACKING];
                 }
                 if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
                 renderChecklist();
             }
             
             // Now load Itinerary
             google.script.run
               .withSuccessHandler((resItin) => {
                  if(resItin.ok && resItin.data) {
                      DAYS = resItin.data;
                      BANK = resItin.bank || [];
                      buildPoisFromDays();
                      setupExpenseDropdown();
                      selectDay(0);
                  } else {
                      id('dayTitle').textContent = '⚠️ שגיאה בטעינת מסלול';
                  }
               })
               .withFailureHandler(() => { id('dayTitle').textContent = '⚠️ שגיאת תקשורת (מסלול)'; })
               .loadItinerary();
               
          })
          .withFailureHandler(() => { 
             id('dayTitle').textContent = '⚠️ שגיאת תקשורת (הגדרות)'; 
          })
          .loadAppData();
      } else {
         renderChecklist();
         if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
      }
      
      loadExpenses(); // Start syncing immediately
      
      // Check system theme
      if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
      }
    }

    function selectDay(index) {
      document.querySelectorAll('.story-item').forEach((el, i) => {
        el.classList.toggle('active', i === index);
      });
      
      const day = DAYS[index];
      id('dayTitle').textContent = day.t;
      id('dayHero').style.backgroundImage = "url('" + day.hero + "')";
      id('dayDesc').textContent = day.s;
      
      id('dayTimeline').innerHTML = day.st.map((stopName, idx) => {
        const poi = POIS[stopName] || { img: '', desc: 'נקודת ציון מרכזית במסלול.', tip: 'תיהנו מהחוויה!' };
        const delay = idx * 0.1;
        return `
          <div class="stop-card" style="animation-delay:${delay}s" onclick="openPoi('${stopName.replace(/'/g,"\\'")}')">
            <div class="stop-img" style="background-image:url('${poi.img}')"></div>
            <div class="stop-info">
              <h4>📍 ${stopName}</h4>
              <p>${poi.desc}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    // --- CHECKLIST LOGIC ---


    function renderChecklist() {
      if(PACKING_LIST.length === 0) {
        id('checklistContainer').innerHTML = '<p style="text-align:center; color:var(--text-light);">הרשימה ריקה. הוסיפו פריטים למעלה.</p>';
        return;
      }
      id('checklistContainer').innerHTML = PACKING_LIST.map((item, i) => {
        const isDone = item.done ? 'done' : '';
        return `<div class="check-item ${isDone}">
                  <div class="check-item-content" onclick="toggleCheck(${i})">
                    <div class="checkbox"></div>
                    <span>${item.text}</span>
                  </div>
                  <button class="del-btn" onclick="deleteCheckItem(${i})">🗑️</button>
                </div>`;
      }).join('');
    }

function toggleCheck(idx) {
      PACKING_LIST[idx].done = !PACKING_LIST[idx].done;
      syncAppData();
      renderChecklist();
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
      safeStorage.setItem('prague_checklist_items_v12', JSON.stringify(PACKING_LIST));
    }

    // --- BUDGET LOGIC ---

    function syncAppData() {
      if(isGas()) {
         google.script.run
           .withFailureHandler((e) => console.error("Sync Error: ", e))
           .saveAppData(TARGET_BUDGET, PACKING_LIST);
      }
    }

    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        syncAppData();
        renderExpenses(); // to update rings
      }
    }

    // --- EXPENSES LOGIC & MODALS ---
function setupExpenseDropdown() {
      const select = id('expSelect');
      if (!select) return;
      let optionsHtml = '<option value="">-- בחר אטרקציה/מסעדה --</option>';
      const allKeys = Object.keys(POIS);
      allKeys.forEach(key => {
        const poi = POIS[key];
        optionsHtml += `<option value="${poi.title.replace(/"/g, '&quot;')}">${poi.title} (${poi.type})</option>`;
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
      try { EXPENSES = JSON.parse(safeStorage.getItem('prague_exp_v11') || '[]'); } catch(e){ EXPENSES=[]; }
      id('syncStatus').textContent = '📱 מצב מקומי';
      renderExpenses();
    }

    function renderExpenses() {
      let tC = 0, tI = 0;
      EXPENSES.forEach(e => { tC += Number(e.czk)||0; tI += Number(e.ils)||0; });
      
      id('totalIls').textContent = '₪' + tI.toLocaleString('he-IL');
      if(id('dashSpent')) id('dashSpent').textContent = '₪' + tI.toLocaleString('he-IL');
      id('totalCzk').textContent = tC.toLocaleString('he-IL') + ' CZK';
      
      // Update Budget Bar
      const percent = Math.min(Math.round((tI / TARGET_BUDGET) * 100), 100);
      id('budgetRing').style.width = percent + '%';
      id('budgetPercent').textContent = percent + '%';

      if (!EXPENSES.length) {
        id('expenseList').innerHTML = '<p style="text-align:center; color:var(--text-light);">עדיין אין הוצאות 💸</p>';
        return;
      }

      id('expenseList').innerHTML = EXPENSES.map((e, idx) => `
        <div class="expense-row" style="animation-delay:${idx*0.05}s">
          <div>
            <div class="expense-title">${e.name}</div>
            <div class="expense-date">${e.date || 'היום'} • ${e.note || ''}</div>
          </div>
          <div class="expense-amounts" style="display:flex; align-items:center; gap: 16px;">
            <div style="text-align:left;">
              <div class="exp-ils">₪${Number(e.ils||0).toLocaleString('he-IL')}</div>
              <div class="exp-czk">${Number(e.czk||0).toLocaleString('he-IL')} CZK</div>
            </div>
            <button class="del-btn" style="padding: 8px; margin: 0; background: rgba(244,63,94,0.05);" onclick="deleteExp(${e.id || 0}, ${idx})">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    function deleteExp(expenseId, idx) {
      if(!confirm('למחוק הוצאה זו?')) return;
      
      id('syncStatus').textContent = '🗑️ מוחק...';
      
      if (isGas() && expenseId > 0) {
        google.script.run
          .withSuccessHandler(function() { loadExpenses(); })
          .withFailureHandler(function() { alert('שגיאה במחיקה בענן'); loadExpenses(); })
          .deleteExpense(expenseId);
      } else {
        EXPENSES.splice(idx, 1);
        safeStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
        renderExpenses();
        id('syncStatus').textContent = '📱 נמחק מקומית';
      }
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
        safeStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
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
