with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

missing_funcs = """
    function id(x) { return document.getElementById(x); }
    
    function updateCountdown() {
      const target = new Date('2026-08-08T00:00:00').getTime();
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
               localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
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
      localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
      renderList();
      syncListToCloud();
    }

    function deleteCheckItem(i) {
      if(confirm('למחוק פריט זה?')) {
        PACKING_LIST.splice(i, 1);
        localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
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
        localStorage.setItem('prague_pack_v2', JSON.stringify(PACKING_LIST));
        renderList();
        syncListToCloud();
      }
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
    
    function editBudget() {
      const b = prompt("הכנס תקציב חדש (בשקלים):", TARGET_BUDGET);
      if(b && !isNaN(b)) {
         TARGET_BUDGET = Number(b);
         if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
         renderExpenses();
         if(isGas()) google.script.run.saveBudget(TARGET_BUDGET);
      }
    }
    
"""

html = html.replace("function init() {", missing_funcs + "\n    function init() {")

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
