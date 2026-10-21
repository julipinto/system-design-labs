#!/bin/bash
cd "$(dirname "$0")"; source env.sh
for cfg in plano plano2; do
  CFG="$(cat cfg-$cfg.json)" node loja-sim.js > sim-$cfg.log 2>&1 &
  SP=$!
  sleep 1
  if ! kill -0 $SP 2>/dev/null; then echo "servidor nao subiu ($cfg)" > bp-$cfg.txt; continue; fi
  TIPO=breakpoint TOPO=360 DUR=4m ABORT=0 $K6 run --quiet --no-color --out csv=bp-$cfg.csv checkout.js > bp-$cfg.txt 2>&1
  kill $SP; sleep 2
done
echo done > bp-plano.done
