const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
let open = 0;
let close = 0;
const lines = content.split('\n');
lines.forEach((line, i) => {
    const o = (line.match(/\(/g) || []).length;
    const c = (line.match(/\)/g) || []).length;
    open += o;
    close += c;
    if (close > open) {
        console.log(`Error: Running balance is NEGATIVE at line ${i + 1}: open=${open}, close=${close}, diff=${open - close}`);
    }
});
console.log(`Final total: open=${open}, close=${close}, diff=${open - close}`);
