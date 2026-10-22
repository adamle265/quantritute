#!/bin/bash
cd $HOME/work/q/site
npx wrangler pages dev --port 8788 --ip 127.0.0.1 --persist-to ../.state-v04 --d1 DB=00000000-0000-0000-0000-000000000000 > /tmp/srv.log 2>&1 &
SP=$!
for i in $(seq 1 40); do sleep 1.5; curl -s -m 3 http://127.0.0.1:8788/api/site -o /dev/null && break; done
cd $HOME/work/b4 && timeout 150 python3 rec_v04b.py "$@"
kill $SP 2>/dev/null
