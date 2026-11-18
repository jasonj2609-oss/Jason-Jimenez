// Assemble the deck: inline the bundled CSS into the template and write
// deck/index.html (double-click to open), deck/web.html (artifact page), ../docs (GitHub Pages)
// and KickShift.html: the whole deck in ONE file, to email or put on a USB stick.
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
const js = fs.readFileSync('deck/deck.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const single = doc.replace(/<script src="deck\.js"><\/script>/, () => `<script>${js}</script>`);
if (single === doc) throw new Error('deck.js tag not found');
fs.writeFileSync('KickShift.html', single);
console.log('html ok', (doc.length / 1024).toFixed(0) + 'KB');
