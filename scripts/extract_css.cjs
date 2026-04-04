const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf-8');

const styleRegex = /<style>([\s\S]*?)<\/style>/;
const match = html.match(styleRegex);

if (!match) {
    console.error('No style tag found');
    process.exit(1);
}

let cssContent = match[1];

// we want to put this in globals.css. We will concatenate.
let globalsCss = fs.readFileSync('app/globals.css', 'utf-8');

// The Next.js globals.css has tailwind directives probably
// We'll just replace the whole file since we want the EXACT color scheme and everything from index.html
// However, tailwind directives are:
// @import "tailwindcss"; (in v4)
// We will keep standard Next.js v4 structure:

let newCss = `@import "tailwindcss";\n` + cssContent;
fs.writeFileSync('app/globals.css', newCss);
console.log('Successfully wrote to app/globals.css');
