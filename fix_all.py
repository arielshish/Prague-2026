import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Restore Budget Ring & Edit Button in Expenses Tab
old_expenses_html = """        <div style="text-align:center; padding:32px 0; background:var(--surface); border-radius:24px; box-shadow:var(--shadow-sm); border:1px solid var(--line); margin-bottom:24px;">
          <div style="font-size:14px; color:var(--text-light); font-weight:600;">סה"כ הוצאות</div>
          <div style="font-size:42px; font-weight:800; color:var(--accent); font-family:var(--font-en);" id="totalIls">₪0</div>
          <div style="font-size:16px; color:var(--text-light); font-family:var(--font-en);" id="totalCzk">0 CZK</div>
        </div>"""

new_expenses_html = """        <div style="text-align:center; padding:32px 0; background:var(--surface); border-radius:24px; box-shadow:var(--shadow-sm); border:1px solid var(--line); margin-bottom:24px; position:relative;">
          
          <button onclick="editBudget()" style="position:absolute; top: 16px; right: 16px; background: none; border: none; font-size: 20px; cursor: pointer;">✏️</button>
          
          <div style="font-size:14px; color:var(--text-light); font-weight:600;">סה"כ הוצאות מתקציב של <span id="budgetDisplay">₪15,000</span></div>
          <div style="font-size:42px; font-weight:800; color:var(--accent); font-family:var(--font-en);" id="totalIls">₪0</div>
          <div style="font-size:16px; color:var(--text-light); font-family:var(--font-en);" id="totalCzk">0 CZK</div>
          
          <!-- Simple Progress Bar for Budget -->
          <div style="margin: 20px auto 0; width: 80%; height: 12px; background: var(--line); border-radius: 6px; overflow: hidden; position: relative;">
            <div id="budgetRing" style="height: 100%; width: 0%; background: linear-gradient(90deg, var(--accent), #f9a8d4); transition: width 0.5s ease;"></div>
          </div>
          <div id="budgetPercent" style="font-size:12px; color:var(--muted); margin-top: 6px;">0%</div>
        </div>"""

html = html.replace(old_expenses_html, new_expenses_html)

# Also fix the JS for the progress bar (it used to be an SVG dashoffset, now it's a width %)
js_old_progress = """      // Update Budget Ring
      const percent = Math.min(Math.round((tI / TARGET_BUDGET) * 100), 100);
      const dashoffset = 219 - (219 * percent / 100);
      id('budgetRing').style.strokeDashoffset = dashoffset;
      id('budgetPercent').textContent = percent + '%';"""

js_new_progress = """      // Update Budget Bar
      const percent = Math.min(Math.round((tI / TARGET_BUDGET) * 100), 100);
      id('budgetRing').style.width = percent + '%';
      id('budgetPercent').textContent = percent + '%';"""
html = html.replace(js_old_progress, js_new_progress)


# 2. Add Flights Tab (since it was missing)
flights_html = """
      <!-- FLIGHTS TAB -->
      <div id="tab-flights" class="tab">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
          <h2 style="font-size: 24px; margin: 0;">כרטיסי טיסה ✈️</h2>
          <button class="btn btn-outline" style="width:auto; padding:8px 16px; border-radius:20px; font-size:14px;" onclick="switchTab('home')">🏠 חזור לדאשבורד</button>
        </div>
        
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
"""

# Let's check if it exists first
if 'id="tab-flights"' not in html:
    # insert before CHECKLIST TAB
    html = html.replace('      <!-- CHECKLIST TAB (Separated) -->', flights_html + '\n      <!-- CHECKLIST TAB (Separated) -->')


with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
