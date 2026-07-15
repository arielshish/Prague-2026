import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update countdown
html = html.replace("const target = new Date('2026-08-08T00:00:00').getTime();", "const target = new Date('2026-08-08T05:35:00').getTime();")

# 2. Add Flights CSS
flights_css = """
    /* FLIGHTS TAB */
    .flight-board { margin: 20px 0; padding-bottom: 80px; }
    .boarding-pass {
      background: white; border-radius: 20px; overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 25px;
      position: relative;
    }
    .dark-mode .boarding-pass { background: #1a2942; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .bp-header {
      background: linear-gradient(135deg, #f4634a, #d6a54a); padding: 15px 20px;
      color: white; display: flex; justify-content: space-between; align-items: center;
    }
    .bp-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
    .bp-header .airline { font-size: 14px; opacity: 0.9; }
    .bp-body { padding: 25px 20px; position: relative; }
    .bp-body::before, .bp-body::after {
      content: ''; position: absolute; top: -10px; width: 20px; height: 20px;
      background: #eef3f8; border-radius: 50%;
    }
    .dark-mode .bp-body::before, .dark-mode .bp-body::after { background: #071a33; }
    .bp-body::before { left: -10px; }
    .bp-body::after { right: -10px; }
    .bp-route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
    .bp-city { text-align: center; width: 30%; }
    .bp-city .code { font-size: 32px; font-weight: 800; color: var(--navy); line-height: 1; }
    .dark-mode .bp-city .code { color: white; }
    .bp-city .time { font-size: 18px; font-weight: 600; color: var(--accent); margin-top: 5px; }
    .bp-city .name { font-size: 12px; color: var(--muted); margin-top: 2px; }
    .bp-plane { flex-grow: 1; text-align: center; position: relative; padding: 0 15px; }
    .bp-plane::before {
      content: ''; position: absolute; top: 50%; left: 10%; right: 10%;
      border-top: 2px dashed #cbd5e1; transform: translateY(-50%); z-index: 1;
    }
    .dark-mode .bp-plane::before { border-color: #334155; }
    .bp-plane i { font-size: 24px; color: var(--gold); position: relative; z-index: 2; background: white; padding: 0 10px; }
    .dark-mode .bp-plane i { background: #1a2942; }
    .bp-duration { position: absolute; bottom: -20px; left: 0; right: 0; font-size: 11px; color: var(--muted); text-align: center; }
    
    .bp-details { display: flex; flex-wrap: wrap; gap: 15px; border-top: 1px dashed var(--line); padding-top: 15px; margin-top: 15px; }
    .bp-detail { flex: 1 1 45%; }
    .bp-detail label { display: block; font-size: 11px; color: var(--muted); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
    .bp-detail span { display: block; font-size: 14px; font-weight: 600; color: var(--text); }
    .bp-passengers { border-top: 1px dashed var(--line); padding-top: 15px; margin-top: 15px; }
    .bp-passengers ul { list-style: none; padding: 0; margin: 0; }
    .bp-passengers li { font-size: 14px; font-weight: 600; padding: 8px 0; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 10px; }
    .bp-passengers li:last-child { border: none; }
    .bp-passengers li span { color: var(--muted); font-size: 12px; font-weight: 400; }
    .bp-footer { background: #f8fafc; padding: 15px 20px; text-align: center; border-top: 2px dashed var(--line); }
    .dark-mode .bp-footer { background: #0f172a; }
    .bp-footer p { margin: 0; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--navy); }
    .dark-mode .bp-footer p { color: white; }
    .bp-footer p span { color: var(--accent); }
    
    .flight-notice { background: rgba(244, 99, 74, 0.1); border-right: 4px solid var(--accent); padding: 15px; border-radius: 8px; margin-bottom: 25px; }
    .flight-notice h4 { margin: 0 0 5px; color: var(--accent); font-size: 15px; }
    .flight-notice p { margin: 0; font-size: 13px; color: var(--text); line-height: 1.5; }
"""
html = html.replace('/* EXPENSES */', flights_css + '\n    /* EXPENSES */')

# 3. Add Tab Button
tab_button = """      <button class="tab-btn" data-tab="tab-pack">🧳<br><span>ציוד</span></button>
      <button class="tab-btn" data-tab="tab-flights">✈️<br><span>טיסות</span></button>"""
html = html.replace('      <button class="tab-btn" data-tab="tab-pack">🧳<br><span>ציוד</span></button>', tab_button)

# 4. Add Tab HTML
tab_html = """
    <!-- FLIGHTS TAB -->
    <div id="tab-flights" class="tab-content" style="display:none;">
      <div class="wrap">
        <h2 style="color:var(--navy);margin-bottom:20px;font-weight:800;">כרטיסי טיסה ✈️</h2>
        
        <div class="flight-notice">
          <h4>🧳 כבודה מותרת (לכל נוסע)</h4>
          <p>
            <b>טרולי לתא הנוסעים (עד 8 ק"ג)</b><br>
            מידות: 45x55x25 ס"מ. חובה להיכנס בתא האחסון מעל הראש.<br>
            <i>* מותר פריט אחד בלבד לכל נוסע (אין אפשרות גם לתיק קטן נוסף).</i>
          </p>
        </div>

        <div class="flight-board">
          <!-- Outbound Flight -->
          <div class="boarding-pass">
            <div class="bp-header">
              <h3>הלוך לפראג</h3>
              <div class="airline">Smart Wings ✈ QS1287</div>
            </div>
            <div class="bp-body">
              <div class="bp-route">
                <div class="bp-city">
                  <div class="code">TLV</div>
                  <div class="time">05:35</div>
                  <div class="name">נתב"ג, ת"א</div>
                </div>
                <div class="bp-plane">
                  <i>✈️</i>
                  <div class="bp-duration">4h 10m</div>
                </div>
                <div class="bp-city">
                  <div class="code">PRG</div>
                  <div class="time">08:45</div>
                  <div class="name">רוזינה, פראג</div>
                </div>
              </div>
              <div class="bp-details">
                <div class="bp-detail"><label>תאריך המראה</label><span>8 באוגוסט 2026 (שבת)</span></div>
                <div class="bp-detail"><label>מחלקה</label><span>Economy</span></div>
              </div>
              <div class="bp-passengers">
                <label style="font-size:11px;color:var(--muted);text-transform:uppercase;">נוסעים</label>
                <ul>
                  <li>👤 Ariel Shish <span>(מבוגר)</span></li>
                  <li>👤 Mariana Shish <span>(מבוגר)</span></li>
                  <li>👧🏻 Adi Yasmin Shish <span>(ילד)</span></li>
                </ul>
              </div>
            </div>
            <div class="bp-footer">
              <p><span>⚠️</span> מומלץ לוודא מס' טרמינל בנתב"ג לפני ההגעה</p>
            </div>
          </div>

          <!-- Return Flight -->
          <div class="boarding-pass">
            <div class="bp-header" style="background: linear-gradient(135deg, #173554, #244b70);">
              <h3>חזור לתל אביב</h3>
              <div class="airline">Smart Wings ✈ QS1286</div>
            </div>
            <div class="bp-body">
              <div class="bp-route">
                <div class="bp-city">
                  <div class="code">PRG</div>
                  <div class="time">23:45</div>
                  <div class="name">רוזינה, פראג</div>
                </div>
                <div class="bp-plane">
                  <i>✈️</i>
                  <div class="bp-duration">3h 50m</div>
                </div>
                <div class="bp-city">
                  <div class="code">TLV</div>
                  <div class="time" style="color:var(--gold);">04:35<sup style="font-size:10px;">+1</sup></div>
                  <div class="name">נתב"ג, ת"א</div>
                </div>
              </div>
              <div class="bp-details">
                <div class="bp-detail"><label>תאריך המראה</label><span>15 באוגוסט 2026 (שבת)</span></div>
                <div class="bp-detail"><label>תאריך נחיתה</label><span>16 באוגוסט 2026 (ראשון)</span></div>
              </div>
              <div class="bp-passengers">
                <label style="font-size:11px;color:var(--muted);text-transform:uppercase;">נוסעים</label>
                <ul>
                  <li>👤 Ariel Shish <span>(מבוגר)</span></li>
                  <li>👤 Mariana Shish <span>(מבוגר)</span></li>
                  <li>👧🏻 Adi Yasmin Shish <span>(ילד)</span></li>
                </ul>
              </div>
            </div>
            <div class="bp-footer">
              <p><span>💡</span> הגעה לארץ לפנות בוקר</p>
            </div>
          </div>
        </div>
      </div>
    </div>
"""
html = html.replace('    <!-- PACKING TAB -->', tab_html + '\n    <!-- PACKING TAB -->')

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
