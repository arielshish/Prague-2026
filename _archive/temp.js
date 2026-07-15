
    // ============================================================
    // APP STATE
    // ============================================================
    var RATE = 6.4;
    var TARGET_BUDGET = 15000;
    var EXPENSES = [];
    var PACKING_LIST = [];
    var DAYS = [];
    var BANK = [];
    var POIS = {};
    var currentPoiId = null;
    var currentDayIndex = 0;
    var sortableTimeline = null;
    var sortableBank = null;

    var DEFAULT_PACKING = [
      {id:'dp1', text:'דרכונים (לוודא תוקף 6 חודשים!)', category:'מסמכים', done:false},
      {id:'dp2', text:'ביטוח נסיעות לחו"ל', category:'מסמכים', done:false},
      {id:'dp3', text:'כסף זר (קורונות + קצת יורו)', category:'כספים', done:false},
      {id:'dp4', text:'תרופות קבועות + משככי כאבים', category:'בריאות', done:false},
      {id:'dp5', text:'בגדים נוחים + לבוש ערב קל', category:'ביגוד', done:false},
      {id:'dp6', text:'נעלי הליכה נוחות', category:'ביגוד', done:false},
      {id:'dp7', text:'מטענים, כבלים וסוללת גיבוי', category:'אלקטרוניקה', done:false}
    ];

    var safeStorage = (function() {
      try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }
      catch(e) {
        var mem = {};
        return { getItem: function(k){return mem[k]||null;}, setItem: function(k,v){mem[k]=String(v);}, removeItem: function(k){delete mem[k];} };
      }
    })();



    // ============================================================
    // HELPERS
    // ============================================================
    function id(x) { return document.getElementById(x); }
    function isGas() { return typeof google !== 'undefined' && google.script && google.script.run; }

    // ============================================================
    // NAVIGATION
    // ============================================================
    function switchTab(tabId) {
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
      const tabEl = id('tab-' + tabId);
      if(tabEl) tabEl.classList.add('active');
      const navEl = id('nav-' + tabId);
      if(navEl) navEl.classList.add('active');
      const fab = id('fab');
      if(fab) fab.style.display = (tabId === 'expenses') ? 'flex' : 'none';
      const backBtn = id('backBtn');
      if(backBtn) backBtn.style.display = (tabId === 'home') ? 'none' : 'flex';
      window.scrollTo(0,0);
    }

    // ============================================================
    // HOME / COUNTDOWN
    // ============================================================
    function setupDateAndCountdown() {
      const target = new Date('2026-08-08T05:35:00').getTime();
      const now = new Date().getTime();
      const d = Math.max(0, Math.floor((target - now) / (1000 * 60 * 60 * 24)));
      if (id('daysLeft')) id('daysLeft').textContent = d;
      if (id('currentDate')) id('currentDate').textContent = new Date().toLocaleDateString('he-IL');
    }

    // renderStories renders the days navigation circles (called at init)
    function renderStories() {
      // Days nav is rendered via renderDaysNav once DAYS loads; just a stub here
    }

    // ============================================================
    // ITINERARY / DAYS
    // ============================================================
    function buildPoisFromDays() {
      POIS = {};
      DAYS.forEach(d => {
        if(d.attractions) {
          d.attractions.forEach(a => { POIS[a.id] = { ...a, img: d.hero, dayIdx: d.index }; });
        }
      });
      if (BANK) {
        BANK.forEach(a => { POIS[a.id] = { ...a, img: '', dayIdx: -1 }; });
      }
      const sel = id('moveDaySelect');
      if (sel) {
        let opts = '<option value="">⇆ העבר יום...</option>';
        DAYS.forEach(d => { opts += `<option value="${d.index}">יום ${d.index + 1} - ${d.t}</option>`; });
        opts += `<option value="-1">בנק מקומות (ללא שיבוץ)</option>`;
        sel.innerHTML = opts;
      }
    }

    function renderDaysNav() {
      const w = id('storyWrapper');
      if (!w) return;
      w.innerHTML = DAYS.map((d, i) => `
        <div class="story-item ${i===currentDayIndex ? 'active' : ''}" onclick="selectDay(${i})" id="story-${i}">
          <div class="story-ring"><div class="story-inner">${d.e}</div></div>
          <div class="story-label">יום ${d.index + 1}</div>
        </div>
      `).join('');
    }

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

    function typeIcon(type) {
      switch(type) {
        case 'attraction': return '🏛️';
        case 'restaurant': return '🍽️';
        case 'shopping':   return '🛍️';
        case 'hotel':      return '🏨';
        case 'travel':     return '✈️';
        case 'tip':        return '💡';
        default:           return '📍';
      }
    }

    function buildPoiCard(a, inDay) {
      const icon = typeIcon(a.type);
      const meta = [
        a.hours    ? `⏰ ${a.hours}` : null,
        a.price    ? `💰 ${a.price}` : null,
        a.duration ? `⏱️ ${a.duration}` : null,
      ].filter(Boolean).join(' &nbsp;·&nbsp; ');
      return `<div class="poi-card" data-id="${a.id}" style="${inDay ? '' : 'opacity:0.9;'}">
        <div class="drag-handle">☰</div>
        <div style="flex:1; min-width:0;" onclick="openMoveModal('${a.id}')">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:18px;">${icon}</span>
            <strong style="font-size:15px; color:var(--navy); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.title}</strong>
          </div>
          ${meta ? `<div style="font-size:11px; color:var(--text-light); margin-bottom:4px;">${meta}</div>` : ''}
          ${a.tip ? `<div style="font-size:12px; color:#d97706; background:rgba(245,158,11,0.08); border-radius:8px; padding:4px 8px; margin-top:2px;">💡 ${a.tip}</div>` : ''}
        </div>
        <button onclick="quickAddToDay('${a.id}',${inDay ? -1 : currentDayIndex})" style="flex-shrink:0; background:${inDay ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.12)'}; border:none; border-radius:10px; padding:6px 10px; font-size:13px; cursor:pointer; color:${inDay ? 'var(--accent)' : 'var(--green)'}; font-weight:700;" title="${inDay ? 'הסר מהיום' : 'הוסף ליום זה'}">${inDay ? '✕' : '+'}</button>
      </div>`;
    }

    function quickAddToDay(poiId, targetDay) {
      if (!isGas()) return;
      const btn = event.currentTarget;
      btn.textContent = '⏳';
      btn.disabled = true;
      google.script.run
        .withSuccessHandler(() => {
          google.script.run
            .withSuccessHandler((res) => {
              if(res.ok && res.data) {
                DAYS = res.data; BANK = res.bank || [];
                buildPoisFromDays(); setupExpenseDropdown(); selectDay(currentDayIndex);
              }
            }).loadItinerary();
        })
        .withFailureHandler(() => { btn.textContent = '⚠️'; setTimeout(() => { btn.disabled=false; renderDay(); }, 1500); })
        .moveAttraction(poiId, targetDay);
    }

    function renderDay() {
      const d = DAYS[currentDayIndex];
      const tl = id('timelineList');
      const bl = id('bankList');
      if (!tl || !bl) return;

      // Timeline
      if(d && d.attractions && d.attractions.length) {
        tl.innerHTML = d.attractions.map(a => buildPoiCard(a, true)).join('');
      } else {
        tl.innerHTML = '<p style="text-align:center; color:var(--text-light); padding:16px 0;">אין אטרקציות ביום זה עדיין.<br>גרור מהבנק למטה או לחץ + !</p>';
      }

      // Bank
      if(BANK && BANK.length) {
        bl.innerHTML = '<div style="font-size:13px; font-weight:700; color:var(--text-light); margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--line);">🗂️ בנק אטרקציות ומסעדות</div>'
          + BANK.map(a => buildPoiCard(a, false)).join('');
      } else {
        bl.innerHTML = '<p style="text-align:center; color:var(--text-light); padding:8px 0;">הבנק ריק</p>';
      }

      initSortable();
    }

    function initSortable() {
      if (typeof Sortable === 'undefined') return;
      if (sortableTimeline) sortableTimeline.destroy();
      if (sortableBank) sortableBank.destroy();
      const tl = id('timelineList');
      const bl = id('bankList');
      const onEndDrag = function (evt) {
        const itemId = evt.item.getAttribute('data-id');
        const targetDayIdx = (evt.to.id === 'timelineList') ? currentDayIndex : -1;
        id('dayTitle').textContent = '🔄 מעדכן...';
        if (isGas()) {
          google.script.run
            .withSuccessHandler(() => {
              google.script.run
                .withSuccessHandler((res2) => {
                  if(res2.ok && res2.data) { DAYS = res2.data; BANK = res2.bank || []; buildPoisFromDays(); selectDay(currentDayIndex); }
                }).loadItinerary();
            })
            .withFailureHandler(() => { alert('שגיאה בעדכון!'); selectDay(currentDayIndex); })
            .moveAttraction(itemId, targetDayIdx);
        }
      };
      sortableTimeline = new Sortable(tl, { group:'shared', animation:150, handle:'.drag-handle', onEnd:onEndDrag });
      sortableBank = new Sortable(bl, { group:'shared', animation:150, handle:'.drag-handle', onEnd:onEndDrag });
    }

    // Open POI modal (attraction detail / move)
    function openMoveModal(poiId) {
      currentPoiId = poiId;
      const poi = POIS[poiId];
      if (!poi) return;

      if(id('poiTitle')) id('poiTitle').textContent = poi.title;
      if(id('poiDesc')) id('poiDesc').textContent = poi.desc || '';
      if(id('poiHero')) id('poiHero').style.backgroundImage = poi.img ? `url('${poi.img}')` : 'none';

      // Rich metadata pills
      const metaEl = id('poiMeta');
      if(metaEl) {
        const pills = [
          poi.hours    ? { icon:'⏰', label: poi.hours }    : null,
          poi.price    ? { icon:'💰', label: poi.price }    : null,
          poi.duration ? { icon:'⏱️', label: poi.duration } : null,
        ].filter(Boolean);
        metaEl.innerHTML = pills.map(p =>
          `<span style="background:var(--line); border-radius:12px; padding:5px 12px; font-size:12px; font-weight:600; color:var(--text);">${p.icon} ${p.label}</span>`
        ).join('');
      }

      // Tip box
      const tipBox = id('poiTipBox');
      const tipEl  = id('poiTip');
      if(tipBox && tipEl) {
        if(poi.tip && poi.tip.trim() && poi.tip !== 'undefined') {
          tipEl.textContent = poi.tip;
          tipBox.style.display = 'flex';
          tipBox.style.gap = '12px';
          tipBox.style.alignItems = 'flex-start';
        } else {
          tipBox.style.display = 'none';
        }
      }

      // Navigate / Ticket buttons
      const mapBtn = id('poiMapBtn');
      if(mapBtn) {
        const mapQuery = encodeURIComponent(poi.title + ' Prague');
        mapBtn.href = poi.link || `https://maps.google.com/?q=${mapQuery}`;
      }
      const ticketBtn = id('poiTicketBtn');
      if(ticketBtn) {
        if(poi.link && (poi.link.includes('hrad') || poi.link.includes('aqua') || poi.link.includes('zoo') || poi.link.includes('klementinum') || poi.link.includes('jewishmuseum'))) {
          ticketBtn.href = poi.link;
          ticketBtn.style.display = 'flex';
        } else {
          ticketBtn.style.display = 'none';
        }
      }

      buildPoisFromDays(); // refresh day dropdown
      const modal = id('poiModal');
      if(modal) modal.classList.add('show');
    }

    function handleMoveDay() {
      const newIdx = id('moveDaySelect').value;
      if(newIdx === '' || !currentPoiId || !isGas()) return;
      if(id('poiTitle')) id('poiTitle').textContent = 'מעביר...';
      google.script.run
        .withSuccessHandler(() => {
          closeModals();
          id('dayTitle').textContent = '🔄 מרענן...';
          google.script.run
            .withSuccessHandler((res) => {
              if(res.ok && res.data) { DAYS = res.data; BANK = res.bank || []; buildPoisFromDays(); selectDay(currentDayIndex); }
            }).loadItinerary();
        })
        .withFailureHandler(() => { alert('שגיאה בהעברת האטרקציה'); })
        .moveAttraction(currentPoiId, newIdx);
    }

    // ============================================================
    // CHECKLIST
    // ============================================================
    function setChecklistStatus(msg) {
      const el = id('checklistSyncStatus');
      if(el) el.textContent = msg;
    }

    function renderChecklist() {
      const c = id('checklistContainer');
      if(!c) return;
      if(PACKING_LIST.length === 0) {
        c.innerHTML = '<p style="text-align:center; color:var(--text-light);">הרשימה ריקה. הוסיפו פריטים למעלה.</p>';
        return;
      }
      const done = PACKING_LIST.filter(i => i.done).length;
      c.innerHTML = `
        <div style="text-align:center; margin-bottom:12px; font-size:13px; color:var(--text-light);">
          ✅ ${done} מתוך ${PACKING_LIST.length} פריטים נארזו
          <div style="margin:8px auto; width:80%; height:6px; background:var(--line); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${PACKING_LIST.length ? Math.round(done/PACKING_LIST.length*100) : 0}%; background:var(--green); transition:width 0.4s;"></div>
          </div>
        </div>
      ` + PACKING_LIST.map((item, i) => {
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

    function pullChecklistFromCloud() {
      if (!isGas()) { setChecklistStatus('📱 מקומי'); return; }
      setChecklistStatus('🔄 טוען...');
      google.script.run
        .withSuccessHandler((res) => {
          if(res && res.ok && res.data) {
            if (res.data.budget) TARGET_BUDGET = res.data.budget;
            if (res.data.packing_list && res.data.packing_list.length) {
              PACKING_LIST = res.data.packing_list;
            }
            if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
            renderChecklist();
            setChecklistStatus('✅ מעודכן');
            setTimeout(() => setChecklistStatus('☁️ מסנכרן'), 2000);
          } else {
            setChecklistStatus('⚠️ אין נתונים בענן');
          }
        })
        .withFailureHandler(() => { setChecklistStatus('❌ שגיאת חיבור'); })
        .loadAppData();
    }

    function toggleCheck(idx) {
      PACKING_LIST[idx].done = !PACKING_LIST[idx].done;
      renderChecklist();
      syncAppData();
    }

    function addChecklistItem() {
      const el = id('newChecklistItem');
      if(!el) return;
      const t = el.value.trim();
      if(t) {
        PACKING_LIST.push({ id: 'id_' + Date.now(), text: t, category: 'כללי', done: false });
        el.value = '';
        renderChecklist();
        syncAppData();
      }
    }

    function deleteCheckItem(i) {
      if(confirm('למחוק פריט זה?')) {
        PACKING_LIST.splice(i, 1);
        renderChecklist();
        syncAppData();
      }
    }

    // ============================================================
    // BUDGET & APP DATA SYNC (bi-directional)
    // ============================================================
    function syncAppData() {
      if(!isGas()) return;
      setChecklistStatus('🔄 שומר...');
      google.script.run
        .withSuccessHandler((res) => {
          if(res && res.ok) {
            setChecklistStatus('✅ נשמר');
            setTimeout(() => setChecklistStatus('☁️ מסנכרן'), 2000);
          } else {
            setChecklistStatus('⚠️ שגיאה בשמירה');
          }
        })
        .withFailureHandler((e) => {
          setChecklistStatus('❌ שגיאת חיבור');
          console.error('syncAppData error:', e);
        })
        .saveAppData(TARGET_BUDGET, PACKING_LIST);
    }

    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        syncAppData();
        renderExpenses();
      }
    }

    // ============================================================
    // EXPENSES
    // ============================================================
    function setupExpenseDropdown() {
      const datalist = id('expOptions');
      if (!datalist) return;
      let opts = '';
      if(BANK) BANK.forEach(a => { opts += `<option value="${a.title}"></option>`; });
      if(DAYS) DAYS.forEach(d => {
        if(d.attractions) d.attractions.forEach(a => { opts += `<option value="${a.title}"></option>`; });
      });
      datalist.innerHTML = opts;
    }

    function openExpenseModal() {
      if(id('expSelect')) id('expSelect').value = '';
      if(id('expCzk')) id('expCzk').value = '';
      if(id('expIls')) id('expIls').value = '';
      if(id('expNote')) id('expNote').value = '';
      const modal = id('expenseModal');
      if(modal) modal.classList.add('show');
    }

    function closeModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show'));
    }

    function calcIls() { const c = Number(id('expCzk').value||0); if(c>0) id('expIls').value = Math.round(c/RATE); }
    function calcCzk() { const i = Number(id('expIls').value||0); if(i>0) id('expCzk').value = Math.round(i*RATE); }

    function loadExpenses() {
      if(id('syncStatus')) id('syncStatus').textContent = '🔄 טוען...';
      if (isGas()) {
        google.script.run
          .withSuccessHandler(function(rows) {
            EXPENSES = rows || [];
            // Mirror to local cache
            try { safeStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES)); } catch(e){}
            if(id('syncStatus')) id('syncStatus').textContent = '✅ ' + EXPENSES.length + ' הוצאות';
            renderExpenses();
          })
          .withFailureHandler(function(err) {
            console.error('loadExpenses error:', err);
            if(id('syncStatus')) id('syncStatus').textContent = '⚠️ שגיאה – מציג cache';
            loadLocalExpenses();
          }).loadExpenses();
      } else {
        loadLocalExpenses();
      }
    }

    function loadLocalExpenses() {
      try { EXPENSES = JSON.parse(safeStorage.getItem('prague_exp_v11') || '[]'); } catch(e){ EXPENSES=[]; }
      if(id('syncStatus')) id('syncStatus').textContent = '📱 ' + EXPENSES.length + ' הוצאות (cache)';
      renderExpenses();
    }

    function renderExpenses() {
      let tC = 0, tI = 0;
      EXPENSES.forEach(e => { tC += Number(e.czk)||0; tI += Number(e.ils)||0; });
      if(id('totalIls')) id('totalIls').textContent = '₪' + tI.toLocaleString('he-IL');
      if(id('dashSpent')) id('dashSpent').textContent = '₪' + tI.toLocaleString('he-IL');
      if(id('totalCzk')) id('totalCzk').textContent = tC.toLocaleString('he-IL') + ' CZK';
      const percent = Math.min(Math.round((tI / TARGET_BUDGET) * 100), 100);
      if(id('budgetRing')) id('budgetRing').style.width = percent + '%';
      if(id('budgetPercent')) id('budgetPercent').textContent = percent + '%';
      if (!EXPENSES.length) {
        if(id('expenseList')) id('expenseList').innerHTML = '<p style="text-align:center; color:var(--text-light);">עדיין אין הוצאות 💸</p>';
        return;
      }
      if(id('expenseList')) id('expenseList').innerHTML = EXPENSES.map((e, idx) => `
        <div class="expense-row" style="animation-delay:${idx*0.05}s">
          <div>
            <div class="expense-title">${e.name}</div>
            <div class="expense-date">${e.date || 'היום'} • ${e.note || ''}</div>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div>
              <div class="exp-ils">₪${Number(e.ils||0).toLocaleString('he-IL')}</div>
              <div class="exp-czk">${Number(e.czk||0).toLocaleString('he-IL')} CZK</div>
            </div>
            <button class="del-btn" onclick="deleteExp(${e.id||0}, ${idx})">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    function deleteExp(expenseId, idx) {
      if(!confirm('למחוק הוצאה זו?')) return;
      if(id('syncStatus')) id('syncStatus').textContent = '🗑️ מוחק...';
      if (isGas() && expenseId > 0) {
        google.script.run
          .withSuccessHandler(function() { loadExpenses(); })
          .withFailureHandler(function() { alert('שגיאה במחיקה בענן'); loadExpenses(); })
          .deleteExpense(expenseId);
      } else {
        EXPENSES.splice(idx, 1);
        safeStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
        renderExpenses();
        if(id('syncStatus')) id('syncStatus').textContent = '📱 נמחק מקומית';
      }
    }

    function saveExpense() {
      const name = (id('expSelect') ? id('expSelect').value.trim() : '');
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
          .withFailureHandler(() => { alert('שגיאה בשמירה'); id('saveExpBtn').textContent = 'שמור הוצאה 💸'; id('saveExpBtn').style.opacity = '1'; })
          .addExpense(name, czk, ils, note);
      } else {
        EXPENSES.unshift({ id: Date.now(), date: new Date().toLocaleString('he-IL'), name, czk, ils, note });
        safeStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
        finishSave();
      }
    }

    // ============================================================
    // CONFETTI
    // ============================================================
    function fireConfetti() {
      const canvas = id('confetti');
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const pieces = [];
      const colors = ['#F43F5E','#F59E0B','#3B82F6','#10B981'];
      for(let i=0;i<50;i++) pieces.push({
        x:canvas.width/2,y:canvas.height/2+100,
        vx:(Math.random()-0.5)*20,vy:(Math.random()-1)*20-5,
        size:Math.random()*10+5,color:colors[Math.floor(Math.random()*4)],
        rot:Math.random()*360,rotSpeed:(Math.random()-0.5)*10
      });
      function render() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let active=false;
        pieces.forEach(p=>{
          p.x+=p.vx;p.y+=p.vy;p.vy+=0.5;p.rot+=p.rotSpeed;
          if(p.y<canvas.height) active=true;
          ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
          ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();
        });
        if(active) requestAnimationFrame(render);
        else ctx.clearRect(0,0,canvas.width,canvas.height);
      }
      render();
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
      setupDateAndCountdown();
      renderStories();

      if (isGas()) {
        if(id('dayTitle')) id('dayTitle').textContent = '🔄 נטען מהענן...';
        setChecklistStatus('🔄 טוען...');

        // STEP 1: Load budget + checklist from AppData sheet
        google.script.run
          .withSuccessHandler((resData) => {
            if(resData && resData.ok && resData.data) {
              if (resData.data.budget) TARGET_BUDGET = resData.data.budget;
              PACKING_LIST = (resData.data.packing_list && resData.data.packing_list.length)
                ? resData.data.packing_list : [...DEFAULT_PACKING];
              setChecklistStatus('✅ נטען מהענן');
            } else {
              // Cloud has no data yet – use defaults and push them up
              PACKING_LIST = [...DEFAULT_PACKING];
              setChecklistStatus('☁️ ברירת מחדל');
              syncAppData(); // first-time write
            }
            if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
            renderChecklist();
            setTimeout(() => setChecklistStatus('☁️ מסנכרן'), 2500);

            // STEP 2: Load itinerary
            google.script.run
              .withSuccessHandler((resItin) => {
                if(resItin && resItin.ok && resItin.data) {
                  DAYS = resItin.data;
                  BANK = resItin.bank || [];
                  buildPoisFromDays();
                  setupExpenseDropdown();
                  selectDay(0);
                } else {
                  if(id('dayTitle')) id('dayTitle').textContent = '⚠️ שגיאה בטעינת מסלול';
                }
              })
              .withFailureHandler(() => {
                if(id('dayTitle')) id('dayTitle').textContent = '⚠️ שגיאת תקשורת (מסלול)';
              })
              .loadItinerary();
          })
          .withFailureHandler(() => {
            // Fallback: load from local cache
            PACKING_LIST = [...DEFAULT_PACKING];
            renderChecklist();
            setChecklistStatus('❌ שגיאת חיבור');
            if(id('dayTitle')) id('dayTitle').textContent = '⚠️ שגיאת תקשורת (הגדרות)';
          })
          .loadAppData();

      } else {
        // Running locally (dev mode) – use defaults
        PACKING_LIST = [...DEFAULT_PACKING];
        renderChecklist();
        setChecklistStatus('📱 מצב מקומי');
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
      }

      // STEP 3: Load expenses independently (parallel)
      loadExpenses();

      if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
      }
    }

    document.addEventListener('DOMContentLoaded', init);
  