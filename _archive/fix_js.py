with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Update global vars
if "let BANK = [];" not in html:
    html = html.replace("let DAYS = [];", "let DAYS = [];\n    let BANK = [];\n    let sortableTimeline = null;\n    let sortableBank = null;")

# Rewrite renderDay
render_day_code = """
    function renderDay() {
      const list = id('timelineList');
      const bank = id('bankList');
      if (!list || !bank) return;
      
      const d = DAYS[currentDayIndex];
      
      // Render Timeline
      if(!d || !d.attractions || d.attractions.length === 0) {
         list.innerHTML = '<p class="empty-state" style="text-align:center; color:var(--text-light); margin-top:20px;">גרור פריטים לכאן!</p>';
      } else {
         list.innerHTML = d.attractions.map((a, i) => `
           <div class="timeline-item sortable-item" data-id="${a.id}">
             <div class="time-dot"></div>
             <div class="timeline-content" onclick="openPoi('${a.id}')">
               <h4 style="margin:0 0 4px; color:var(--text);">${a.title} <span style="font-size:11px; padding:2px 6px; background:var(--line); border-radius:8px; float:left;">${a.type}</span></h4>
               <p style="margin:0; font-size:13px; color:var(--text-light);">${a.desc}</p>
             </div>
             <div class="drag-handle" style="padding: 10px; color: var(--muted); font-size: 20px;">☰</div>
           </div>
         `).join('');
      }
      
      // Render Bank
      if(!BANK || BANK.length === 0) {
         bank.innerHTML = '<p style="text-align:center; color:var(--text-light);">אין פריטים בבנק.</p>';
      } else {
         bank.innerHTML = BANK.map((a, i) => `
           <div class="timeline-item sortable-item" data-id="${a.id}" style="background: rgba(255,255,255,0.8); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px;">
             <div class="timeline-content" onclick="openPoi('${a.id}')">
               <h4 style="margin:0 0 4px; color:var(--text);">${a.title} <span style="font-size:11px; padding:2px 6px; background:var(--line); border-radius:8px; float:left;">${a.type}</span></h4>
               <p style="margin:0; font-size:13px; color:var(--text-light);">${a.desc}</p>
             </div>
             <div class="drag-handle" style="padding: 10px; color: var(--muted); font-size: 20px;">☰</div>
           </div>
         `).join('');
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
      BANK.forEach(a => {
          POIS[a.id] = { ...a, img: '', dayIdx: -1 };
      });
    }

    function openPoi(idStr) {
      const poi = POIS[idStr];
      if (!poi) return;
      
      currentPoiId = poi.id;
      id('poiTitle').textContent = poi.title;
      id('poiDesc').textContent = poi.desc;
      id('poiImage').style.backgroundImage = poi.img ? `url('${poi.img}')` : 'none';
      
      const ticketBtn = id('poiTicketBtn');
      if (ticketBtn) {
          if (poi.link) {
              ticketBtn.style.display = 'block';
              ticketBtn.onclick = () => window.open(poi.link, '_blank');
          } else {
              ticketBtn.style.display = 'none';
          }
      }
      
      const mapBtn = id('poiMapBtn');
      if (mapBtn) mapBtn.href = 'https://www.google.com/maps/search/' + encodeURIComponent(poi.title + ' Prague');
      
      id('poiModal').classList.add('show');
    }
"""

html = re.sub(r'function renderDay\(\) \{.*?(?=    function handleMoveDay)', render_day_code, html, flags=re.DOTALL)

# Also handle loadItinerary initialization in html
html = html.replace("DAYS = res.data;", "DAYS = res.data;\n                 BANK = res.bank || [];")

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
