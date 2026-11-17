#!/bin/sh
set -e
cd "$(dirname "$0")"
L="--loader:.glb=binary --loader:.wasm=binary --loader:.txt=text --loader:.png=dataurl --loader:.woff2=dataurl --loader:.woff=empty --loader:.ttf=empty"
npx esbuild src/main.js --bundle --minify $L --outfile=deck/deck.js --log-level=warning
node tools/html.mjs
