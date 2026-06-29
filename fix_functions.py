import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the TWO buildPoisFromDays with a single correct one
single_build_pois = """
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
"""
html = re.sub(r'    function buildPoisFromDays\(\) \{.*?(?=    function handleMoveDay|    function setupExpenseDropdown|    function initSortable)', single_build_pois, html, flags=re.DOTALL)

# Fix setupExpenseDropdown to use poi.title for display, and poi.id for value.
new_setup_expense = """
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
"""
html = re.sub(r'    function setupExpenseDropdown\(\) \{.*?    \}', new_setup_expense.strip(), html, flags=re.DOTALL)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
