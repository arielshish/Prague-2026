import re

with open('gas_project/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace init function to load AppData
init_code = """
    function init() {
      setupDateAndCountdown();
      renderStories();
      
      if (isGas()) {
        id('dayTitle').textContent = '🔄 נטען מהענן...';
        
        // Load App Data (Budget & Checklist)
        google.script.run
          .withSuccessHandler((resData) => {
             if(resData.ok && resData.data) {
                 if (resData.data.budget) {
                     TARGET_BUDGET = resData.data.budget;
                 }
                 if (resData.data.packing_list) {
                     PACKING_LIST = resData.data.packing_list;
                 } else {
                     PACKING_LIST = [...DEFAULT_PACKING];
                 }
                 if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
                 renderChecklist();
             }
             
             // Now load Itinerary
             google.script.run
               .withSuccessHandler((resItin) => {
                  if(resItin.ok && resItin.data) {
                      DAYS = resItin.data;
                      BANK = resItin.bank || [];
                      buildPoisFromDays();
                      setupExpenseDropdown();
                      selectDay(0);
                  } else {
                      id('dayTitle').textContent = '⚠️ שגיאה בטעינת מסלול';
                  }
               })
               .withFailureHandler(() => { id('dayTitle').textContent = '⚠️ שגיאת תקשורת (מסלול)'; })
               .loadItinerary();
               
          })
          .withFailureHandler(() => { 
             id('dayTitle').textContent = '⚠️ שגיאת תקשורת (הגדרות)'; 
          })
          .loadAppData();
      } else {
         renderChecklist();
         if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
      }
      
      loadExpenses(); // Start syncing immediately
      
      // Check system theme
      if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
      }
    }
"""
html = re.sub(r'    function init\(\) \{.*?(?=    function selectDay)', init_code.strip() + '\n\n', html, flags=re.DOTALL)

# Modify editBudget to sync to GAS instead of localStorage
edit_budget_code = """
    function editBudget() {
      const newBudget = prompt('הכנס תקציב יעד חדש (בשקלים):', TARGET_BUDGET);
      if(newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
        TARGET_BUDGET = Number(newBudget);
        if(id('budgetDisplay')) id('budgetDisplay').textContent = '₪' + TARGET_BUDGET.toLocaleString('he-IL');
        syncAppData();
        renderExpenses(); // to update rings
      }
    }
"""
html = re.sub(r'    function editBudget\(\) \{.*?    \}', edit_budget_code.strip(), html, flags=re.DOTALL)

# Add syncAppData helper
sync_app_data_code = """
    function syncAppData() {
      if(isGas()) {
         google.script.run
           .withFailureHandler((e) => console.error("Sync Error: ", e))
           .saveAppData(TARGET_BUDGET, PACKING_LIST);
      }
    }
"""
html = html.replace('function editBudget() {', sync_app_data_code + '\n    function editBudget() {')

# Fix Checklist functions to use syncAppData
checklist_funcs = """
    function toggleCheck(idx) {
      PACKING_LIST[idx].done = !PACKING_LIST[idx].done;
      syncAppData();
      renderChecklist();
    }
    
    function addCheckItem() {
      const val = id('newCheckItem').value.trim();
      if(val) {
        PACKING_LIST.unshift({text: val, done: false});
        id('newCheckItem').value = '';
        syncAppData();
        renderChecklist();
      }
    }
    
    function deleteCheckItem(idx) {
      PACKING_LIST.splice(idx, 1);
      syncAppData();
      renderChecklist();
    }
"""
html = re.sub(r'    function toggleCheck\(idx\) \{.*?    \}', checklist_funcs.strip(), html, flags=re.DOTALL)
html = re.sub(r'    function addCheckItem\(\) \{.*?    \}', '', html, flags=re.DOTALL)
html = re.sub(r'    function deleteCheckItem\(idx\) \{.*?    \}', '', html, flags=re.DOTALL)

# Delete the safeStorage and loadChecklist that are no longer used
html = re.sub(r'    // Safe LocalStorage Wrapper.*?    };\n', '', html, flags=re.DOTALL)
html = re.sub(r'    function loadChecklist\(\) \{.*?    \}', '', html, flags=re.DOTALL)

with open('gas_project/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
