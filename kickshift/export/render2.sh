#!/bin/bash
# Continue the 60 fps render after the hitbox slide was removed (16 slides).
cd "$(dirname "$0")/.."
ARENA=$(pgrep -f "node tools/export.mjs 4 60"); OLD2D=$(pgrep -f "node tools/export.mjs 1,2,5,6,7,8,9,11,12,13,14,15 60 2")
( while kill -0 $ARENA 2>/dev/null; do sleep 20; done; node tools/export.mjs 15 60 > export/logs/r2-outro.log 2>&1 ) &
( node tools/export.mjs 3 60 > export/logs/r2-feat.log 2>&1; node tools/export.mjs 0 60 > export/logs/r2-intro.log 2>&1 ) &
( until grep -q "DONE 10-tactic" export/logs/r-2d.log || ! kill -0 $OLD2D 2>/dev/null; do sleep 15; done; kill $OLD2D 2>/dev/null; sleep 3
  nice -n 15 node tools/export.mjs 10,11,12,13,14 60 2 > export/logs/r2-2d.log 2>&1 ) &
wait
