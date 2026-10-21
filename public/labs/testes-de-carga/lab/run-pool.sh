#!/bin/bash
cd "$(dirname "$0")"; source env.sh
while [ ! -f extra2.done ]; do sleep 5; done
for m in shared bulkhead; do
  MODE=$m node loja-pool.js > sim-pool-$m.log 2>&1 &
  SP=$!; sleep 1
  $K6 run --quiet --no-color --out csv=pool-$m.csv pool.js > pool-$m.txt 2>&1
  echo "exit=$?" >> pool-$m.txt; kill $SP; sleep 2
done
echo done > pool.done
