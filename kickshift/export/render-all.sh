#!/bin/bash
# Render every slide for Canva at 60 fps (smooth pans). 3D scenes in two queues, 2D at lower priority.
cd "$(dirname "$0")/.."
( node tools/export.mjs 4 60 > export/logs/r-arena.log 2>&1; node tools/export.mjs 16 60 > export/logs/r-outro.log 2>&1; node tools/export.mjs 10 60 > export/logs/r-hitbox.log 2>&1 ) &
( node tools/export.mjs 3 60 > export/logs/r-feat.log 2>&1; node tools/export.mjs 0 60 > export/logs/r-intro.log 2>&1 ) &
( nice -n 15 node tools/export.mjs 1,2,5,6,7,8,9,11,12,13,14,15 60 2 > export/logs/r-2d.log 2>&1 ) &
wait
grep -h "DONE\|ERR" export/logs/r-*.log
