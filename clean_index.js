const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf-8');

html = html.replace(/    function editBudget\(\) \{\s+const newBudget[\s\S]*?renderExpenses\(\); \/\/ to update rings\s+\}\s+\}\s+\}/g, "    function editBudget() {\n      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);\n      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {\n        TARGET_BUDGET = Number(newBudget);\n        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');\n        syncAppData();\n        renderExpenses(); // to update rings\n      }\n    }");
html = html.replace(/    function editBudget\(\) \{\s+const newBudget[\s\S]*?renderExpenses\(\); \/\/ to update rings\s+\}\s+\}/g, "    function editBudget() {\n      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);\n      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {\n        TARGET_BUDGET = Number(newBudget);\n        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');\n        syncAppData();\n        renderExpenses(); // to update rings\n      }\n    }");

fs.writeFileSync('gas_project/index.html', html);
