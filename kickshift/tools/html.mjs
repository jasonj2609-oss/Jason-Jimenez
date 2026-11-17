// Assemble the deck: inline the bundled CSS into the template and write
// deck/index.html (double-click to open), deck/web.html (artifact page) and ../docs (GitHub Pages).
import fs from 'fs';
const tpl = fs.readFileSync('src/template.html', 'utf8');
const css = fs.readFileSync('deck/deck.css', 'utf8');
const body = tpl.replace('/*__LIB_CSS__*/', () => css);
const doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${body.replace(/<\/style>\n/, '</style>\n</head>\n<body>\n')}\n</body>\n</html>\n`;
fs.writeFileSync('deck/index.html', doc);
fs.writeFileSync('deck/web.html', body);
fs.mkdirSync('../docs', { recursive: true });
fs.writeFileSync('../docs/index.html', doc);
fs.copyFileSync('deck/deck.js', '../docs/deck.js');
fs.writeFileSync('../docs/.nojekyll', '');
console.log('html ok', (doc.length / 1024).toFixed(0) + 'KB');
