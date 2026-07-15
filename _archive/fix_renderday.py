import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

render_day_code = """
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
"""

html = html.replace('    function renderDaysNav() {', render_day_code + '\n    function renderDaysNav() {')

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
