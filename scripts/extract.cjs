const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf-8');

const startMarker = `// ═══════════════════════════════════════\n// DATA\n// ═══════════════════════════════════════`;
const endMarker = `// ═══════════════════════════════════════\n// STATE`;

let startIdx = html.indexOf(startMarker);
let endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

let dataBlock = html.substring(startIdx + startMarker.length, endIdx);

// Convert `const ` to `export const `
dataBlock = dataBlock.replace(/^const /gm, 'export const ');

fs.writeFileSync('lib/data.ts', dataBlock.trim());
console.log('Successfully extracted data to lib/data.ts');
