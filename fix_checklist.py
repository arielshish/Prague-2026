import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the old pullChecklist block
html = re.sub(r'    function pullChecklist\(\) \{[\s\S]*?loadChecklist\(\);\n    \}', '', html)

# Remove the old syncListToCloud block
html = re.sub(r'    function syncListToCloud\(\) \{[\s\S]*?syncChecklist\(PACKING_LIST\);\n    \}', '', html)

# Remove the old renderList block
html = re.sub(r'    function renderList\(\) \{[\s\S]*?join\(\'\'\);\n    \}', '', html)

# Remove the old toggleCheckItem block
html = re.sub(r'    function toggleCheckItem\(i\) \{[\s\S]*?syncListToCloud\(\);\n    \}', '', html)

# Fix deleteCheckItem to use renderChecklist and syncAppData
html = re.sub(r'    function deleteCheckItem\(i\) \{[\s\S]*?syncListToCloud\(\);\n      \}\n    \}', 
"""    function deleteCheckItem(i) {
      if(confirm('למחוק פריט זה?')) {
        PACKING_LIST.splice(i, 1);
        renderChecklist();
        syncAppData();
      }
    }""", html)

# Fix addChecklistItem to use renderChecklist and syncAppData
html = re.sub(r'    function addChecklistItem\(\) \{[\s\S]*?syncListToCloud\(\);\n      \}\n    \}',
"""    function addChecklistItem() {
      const el = id('newChecklistItem');
      if(!el) return;
      const t = el.value.trim();
      if(t) {
        PACKING_LIST.push({ id: 'id_' + Date.now(), text: t, category: 'כללי', done: false });
        el.value = '';
        renderChecklist();
        syncAppData();
      }
    }""", html)

# Also fix the duplicate Checklist rendering (we have renderChecklist later on)
# Make sure toggleCheck is there
with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
