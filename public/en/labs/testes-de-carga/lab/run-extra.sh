#!/bin/bash
cd "$(dirname "$0")"; source env.sh
rodar() { # $1=name $2=cfg $3...=k6 env
  local nome=$1 cfg=$2; shift 2
  CFG="$(cat cfg-$cfg.json)" node loja-sim.js > sim-$nome.log 2>&1 &
  local SP=$!
  sleep 1
  env "$@" $K6 run --quiet --no-color --out csv=$nome.csv checkout.js > $nome.txt 2>&1
  echo "exit=$?" >> $nome.txt
  kill $SP; sleep 2
}
rodar spike-hoje hoje TIPO=spike RATE=60
rodar fechado20-hoje hoje TIPO=fechado VUS=20
rodar fechado60-hoje hoje TIPO=fechado VUS=60
for n in 1 2 3; do rodar pre$n pre$n TIPO=breakpoint TOPO=$((n*38)) DUR=2m ABORT=0; done
rodar estresse-plano2 plano2 TIPO=estresse
rodar media-plano plano TIPO=media RATE=125
for m in shared bulkhead; do
  MODE=$m node loja-pool.js > sim-pool-$m.log 2>&1 &
  SP=$!
  sleep 1
  $K6 run --quiet --no-color --out csv=pool-$m.csv pool.js > pool-$m.txt 2>&1
  kill $SP; sleep 2
done
echo done > extra.done
