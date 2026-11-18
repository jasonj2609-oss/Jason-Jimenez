#!/bin/bash
# Re-render every slide touched by the realism pass, two at a time.
cd "$(dirname "$0")/.."
( node tools/export.mjs 4 > export/logs/r-arena.log 2>&1; node tools/export.mjs 0 > export/logs/r-intro.log 2>&1 ) &
( node tools/export.mjs 3 > export/logs/r-feat.log 2>&1; node tools/export.mjs 16 > export/logs/r-outro.log 2>&1; node tools/export.mjs 10 > export/logs/r-hitbox.log 2>&1; node tools/export.mjs 2,14,15 30 2 > export/logs/r-2d.log 2>&1 ) &
wait
grep -h "DONE\|ERR" export/logs/r-*.log
