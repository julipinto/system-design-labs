#!/bin/bash
cd "$(dirname "$0")"; source env.sh
while [ ! -f extra.done ]; do sleep 5; done
rodar() { local nome=$1 cfg=$2; shift 2
  CFG="$(cat cfg-$cfg.json)" node loja-sim.js > sim-$nome.log 2>&1 &
  local SP=$!; sleep 1
  env "$@" $K6 run --quiet --no-color --out csv=$nome.csv checkout.js > $nome.txt 2>&1
  echo "exit=$?" >> $nome.txt; kill $SP; sleep 2; }
rodar degrau33-hoje hoje TIPO=media RATE=33
rodar degrau36-hoje hoje TIPO=media RATE=36
rodar degrau250-plano2 plano2 TIPO=media RATE=250
rodar degrau265-plano2 plano2 TIPO=media RATE=265
echo done > extra2.done
