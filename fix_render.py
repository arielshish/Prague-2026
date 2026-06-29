with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

funcs = """
    function buildPoisFromDays() {
      POIS = {};
      DAYS.forEach(d => {
         if(d.attractions) {
            d.attractions.forEach(a => {
               POIS[a.title] = {
                  id: a.id,
                  desc: a.desc,
                  link: a.link,
                  img: d.hero,
                  dayIdx: d.index
               };
            });
         }
      });
      
      const sel = id('moveDaySelect');
      if (sel) {
        let opts = '<option value="">⇆ העבר יום...</option>';
        DAYS.forEach(d => {
           opts += `<option value="${d.index}">יום ${d.index + 1} - ${d.t}</option>`;
        });
        sel.innerHTML = opts;
      }
    }

    function renderStories() {
      renderDaysNav();
    }

    function renderDay() {
      const list = id('timelineList');
      if (!list) return;
      
      const d = DAYS[currentDayIndex];
      if(!d || !d.attractions || d.attractions.length === 0) {
         list.innerHTML = '<p style="text-align:center; color:var(--text-light); margin-top:20px;">אין אטרקציות ביום זה.</p>';
         return;
      }
      
      list.innerHTML = d.attractions.map((a, i) => `
        <div class="timeline-item" style="animation-delay: ${i*0.05}s" onclick="openPoi('${a.title.replace(/'/g, "\\'")}')">
          <div class="time-dot"></div>
          <div class="timeline-content">
            <h4 style="margin:0 0 4px; color:var(--text);">${a.title}</h4>
            <p style="margin:0; font-size:13px; color:var(--text-light);">${a.desc}</p>
          </div>
        </div>
      `).join('');
    }

    function openPoi(stopName) {
      const poi = POIS[stopName];
      if (!poi) return;
      
      currentPoiId = poi.id;
      id('poiTitle').textContent = stopName;
      id('poiDesc').textContent = poi.desc;
      id('poiImage').style.backgroundImage = `url('${poi.img}')`;
      
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
      if (mapBtn) mapBtn.href = 'https://www.google.com/maps/search/' + encodeURIComponent(stopName + ' Prague');
      
      if(id('moveDaySelect')) id('moveDaySelect').value = '';
      
      id('poiModal').classList.add('show');
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
                     buildPoisFromDays();
                     selectDay(currentDayIndex);
                 }
              }).loadItinerary();
         })
         .withFailureHandler(() => { alert('שגיאה בהעברת האטרקציה'); })
         .moveAttraction(currentPoiId, newIdx);
    }
"""

html = html.replace("function init() {", funcs + "\n    function init() {")

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
