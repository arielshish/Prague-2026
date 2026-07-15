const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

const oldRenderExpenses = `      id('expenseList').innerHTML = EXPENSES.map((e, idx) => \\`
        <div class="expense-row" style="animation-delay:\\\${idx*0.05}s">
          <div>
            <div class="expense-title">\\\${e.name}</div>
            <div class="expense-date">\\\${e.date || 'היום'} • \\\${e.note || ''}</div>
          </div>
          <div class="expense-amounts">
            <div class="exp-ils">₪\\\${Number(e.ils||0).toLocaleString('he-IL')}</div>
            <div class="exp-czk">\\\${Number(e.czk||0).toLocaleString('he-IL')} CZK</div>
          </div>
        </div>
      \\`).join('');`;

const newRenderExpenses = `      id('expenseList').innerHTML = EXPENSES.map((e, idx) => \\`
        <div class="expense-row" style="animation-delay:\\\${idx*0.05}s">
          <div>
            <div class="expense-title">\\\${e.name}</div>
            <div class="expense-date">\\\${e.date || 'היום'} • \\\${e.note || ''}</div>
          </div>
          <div class="expense-amounts" style="display:flex; align-items:center; gap: 16px;">
            <div style="text-align:left;">
              <div class="exp-ils">₪\\\${Number(e.ils||0).toLocaleString('he-IL')}</div>
              <div class="exp-czk">\\\${Number(e.czk||0).toLocaleString('he-IL')} CZK</div>
            </div>
            <button class="del-btn" style="padding: 8px; margin: 0; background: rgba(244,63,94,0.05);" onclick="deleteExp(\\\${e.id || 0}, \\\${idx})">🗑️</button>
          </div>
        </div>
      \\`).join('');`;

html = html.replace(oldRenderExpenses, newRenderExpenses);

const newFunction = `
    function deleteExp(expenseId, idx) {
      if(!confirm('למחוק הוצאה זו?')) return;
      
      id('syncStatus').textContent = '🗑️ מוחק...';
      
      if (isGas() && expenseId > 0) {
        google.script.run
          .withSuccessHandler(function() { loadExpenses(); })
          .withFailureHandler(function() { alert('שגיאה במחיקה בענן'); loadExpenses(); })
          .deleteExpense(expenseId);
      } else {
        EXPENSES.splice(idx, 1);
        localStorage.setItem('prague_exp_v11', JSON.stringify(EXPENSES));
        renderExpenses();
        id('syncStatus').textContent = '📱 נמחק';
      }
    }
`;

html = html.replace('function saveExpense() {', newFunction + '\n    function saveExpense() {');

fs.writeFileSync('gas_project/index.html', html, 'utf8');
