const fullHtml = require('fs').readFileSync('gas_project/index.html', 'utf8');
const scriptMatch = fullHtml.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    console.log("Syntax is valid.");
  } catch (e) {
    console.error("Syntax Error:", e);
  }
}
