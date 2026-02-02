const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');
let open = 0, close = 0;
let inString = false, stringChar = '';
let inComment = false, commentType = ''; // 'single' or 'multi'

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inComment) {
        if (commentType === 'single' && char === '\n') inComment = false;
        else if (commentType === 'multi' && char === '*' && next === '/') {
            inComment = false; i++;
        }
        continue;
    }

    if (inString) {
        if (char === stringChar && content[i - 1] !== '\\') inString = false;
        continue;
    }

    if (char === '/' && next === '/') { inComment = true; commentType = 'single'; i++; continue; }
    if (char === '/' && next === '*') { inComment = true; commentType = 'multi'; i++; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; continue; }

    if (char === '(') open++;
    if (char === ')') {
        close++;
        if (close > open) {
            // Find line number
            const lineNum = content.slice(0, i).split('\n').length;
            const lineContent = content.split('\n')[lineNum - 1];
            console.log(`Mismatch at line ${lineNum}: open=${open}, close=${close}`);
            console.log(`Line content: ${lineContent}`);
            process.exit(1);
        }
    }
}
console.log(`Final total: open=${open}, close=${close}`);
if (open !== close) console.log("MISMATCH FOUND AT END");
else console.log("Balanced!");
