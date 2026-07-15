const fs = require('fs');
let gs = fs.readFileSync('gas_project/Code.gs', 'utf8');
console.log(gs.includes('function loadItinerary()'));
