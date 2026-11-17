#!/bin/sh
set -e
cd "$(dirname "$0")"
L="--loader:.glb=binary --loader:.wasm=binary --loader:.txt=text --loader:.png=dataurl"
npx esbuild dev/t3d.js --bundle $L --outfile=dev/t3d.bundle.js --log-level=warning
[ -f src/main.js ] && npx esbuild src/main.js --bundle --minify $L --outfile=deck/deck.js --log-level=warning
true
mkdir -p deck/fonts
for f in bebas-neue/files/bebas-neue-latin-400-normal inter/files/inter-latin-300-normal inter/files/inter-latin-400-normal inter/files/inter-latin-400-italic inter/files/inter-latin-600-normal jetbrains-mono/files/jetbrains-mono-latin-500-normal jetbrains-mono/files/jetbrains-mono-latin-600-normal jetbrains-mono/files/jetbrains-mono-latin-700-normal; do cp node_modules/@fontsource/$f.woff2 deck/fonts/; done
