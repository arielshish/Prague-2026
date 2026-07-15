with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re

# Add SortableJS to <head>
if "Sortable.min.js" not in html:
    html = html.replace("</head>", '  <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>\n</head>')

# Define the new tab-days HTML structure
new_tab_days = """
      <div id="tab-days" class="tab">
        <div class="day-hero" id="dayHero"></div>
        <div class="days-nav" id="daysNav"></div>
        <div class="day-content" style="padding:20px 18px 80px;">
          <h2 id="dayTitle">טוען...</h2>
          <p id="dayDesc" style="color:var(--muted); font-size:15px; margin-top:4px;">אנא המתן.</p>
          
          <h3 style="margin-top: 24px; color: var(--navy); border-bottom: 2px solid var(--accent); display: inline-block; padding-bottom: 4px;">המסלול להיום</h3>
          <div class="timeline" id="timelineList" style="min-height: 80px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 12px; margin-top: 10px;">
             <!-- Day attractions go here -->
          </div>
          
          <h3 style="margin-top: 32px; color: var(--navy); border-bottom: 2px solid var(--gold); display: inline-block; padding-bottom: 4px;">בנק מקומות (גרור ושחרר)</h3>
          <p style="font-size: 13px; color: var(--muted); margin-bottom: 12px;">גרור פריטים מפה לתוך מסלול היום כדי לשבץ אותם.</p>
          <div class="bank-list" id="bankList" style="min-height: 120px; padding: 10px; background: rgba(214, 165, 74, 0.1); border: 2px dashed var(--gold); border-radius: 12px; display: flex; flex-direction: column; gap: 8px;">
             <!-- Bank items go here -->
          </div>
        </div>
      </div>
"""

# Replace the existing tab-days
html = re.sub(r'      <div id="tab-days" class="tab">.*?</div>\n      </div>', new_tab_days, html, flags=re.DOTALL)

# Remove the Guide tab from HTML (if it exists)
html = re.sub(r'      <!-- TAB: Guide -->.*?</div>\n      </div>', '', html, flags=re.DOTALL)

# Update nav menu - remove Guide button
html = re.sub(r'<button class="nav-btn" onclick="switchTab\(\'guide\'\)">.*?</button>', '', html, flags=re.DOTALL)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
