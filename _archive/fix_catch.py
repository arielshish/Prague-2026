import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the orphan catch block
html = re.sub(r' catch\(e\)\{ PACKING_LIST = \[\.\.\.DEFAULT_PACKING\]; \}\n      renderChecklist\(\);\n    \}', '', html)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
