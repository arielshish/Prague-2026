const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('gas_project/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

// If there's any error it should be caught by jsdom
dom.window.addEventListener("error", (event) => {
  console.error("DOM Error:", event.error);
});
