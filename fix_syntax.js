const fs = require('fs');
let html = fs.readFileSync('gas_project/index.html', 'utf8');

// Fix unescaped single quote in PACKING_LIST
html = html.replace("'בגדים חמים לערב (ז'קט/עליונית)'", `"בגדים חמים לערב (ז'קט/עליונית)"`);

fs.writeFileSync('gas_project/index.html', html, 'utf8');
