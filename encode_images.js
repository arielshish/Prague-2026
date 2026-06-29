const fs = require('fs');

const castle = fs.readFileSync('/Users/arielshish/.gemini/antigravity/brain/902608d0-de97-4426-9332-d9e65827bb13/anime_prague_castle_1782675252675.jpg');
const square = fs.readFileSync('/Users/arielshish/.gemini/antigravity/brain/902608d0-de97-4426-9332-d9e65827bb13/anime_prague_town_square_1782675261724.jpg');

const castle_b64 = 'data:image/jpeg;base64,' + castle.toString('base64');
const square_b64 = 'data:image/jpeg;base64,' + square.toString('base64');

let html = fs.readFileSync('gas_project/index.html', 'utf8');
html = html.replace("url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Prague_Old_Town_Square.jpg/800px-Prague_Old_Town_Square.jpg')", "url('" + square_b64 + "')");

html = html.replace("url('https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Prague_Castle_from_Charles_Bridge.jpg/800px-Prague_Castle_from_Charles_Bridge.jpg')", "url('" + castle_b64 + "')");

fs.writeFileSync('gas_project/index.html', html, 'utf8');
console.log("Injected");
