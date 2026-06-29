import re
with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace any occurrence of the double brace pattern
html = re.sub(r'    function editBudget\(\) \{[\s\S]*?    \}\n    \}', r'''    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        syncAppData();
        renderExpenses(); // to update rings
      }
    }''', html)

# If there are still duplicates of editBudget, we only need one!
# Actually, the replacement above will fix the syntax. Let's see if there are still two.

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
