import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix the broken setupExpenseDropdown chunk
broken_regex = r'    function setupExpenseDropdown\(\) \{.*?    \}\);.*?    \}'
fixed_code = """    function setupExpenseDropdown() {
      const select = id('expSelect');
      if (!select) return;
      let optionsHtml = '<option value="">-- בחר אטרקציה/מסעדה --</option>';
      const allKeys = Object.keys(POIS);
      allKeys.forEach(key => {
        const poi = POIS[key];
        let pType = poi.type || '';
        optionsHtml += `<option value="${poi.title.replace(/"/g, '&quot;')}">${poi.title} ${pType ? '('+pType+')' : ''}</option>`;
      });
      optionsHtml += '<option value="other">אחר... (הזנה ידנית)</option>';
      select.innerHTML = optionsHtml;
    }"""

html = re.sub(broken_regex, fixed_code, html, flags=re.DOTALL)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
