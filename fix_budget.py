import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace("id('budgetDisplay').textContent =", "if(id('budgetDisplay')) id('budgetDisplay').textContent =")

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
