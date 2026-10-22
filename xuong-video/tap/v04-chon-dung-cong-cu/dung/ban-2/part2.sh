#!/bin/bash
# usage: part2.sh N a b
N=$1; A=$2; B=$3
cd $HOME/work/b4 && python3 build_v05.py >/dev/null && python3 window.py $A $B w$N >/dev/null || exit 1
cd $HOME/work/w$N && rm -rf work-* .p* snapshots
HYPERFRAMES_BROWSER_PATH=$HOME/tmp/chromium timeout 168 npx -y hyperframes@0.8.147 render -o $HOME/work/parts2/r$N.mp4 -q standard -w 2 > render.log 2>&1
grep -o "Capturing frame [0-9/]*" render.log | tail -1; grep "tween vắt" render.log | head -3
ls -la $HOME/work/parts2/r$N.mp4 2>&1 | awk '{print $5}'
