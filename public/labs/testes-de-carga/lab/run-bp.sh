#!/bin/bash
cd "$(dirname "$0")"; source env.sh
# 1) breakpoint com abort (hoje)
TIPO=breakpoint TOPO=60 DUR=3m ABORT=1 $K6 run --quiet --no-color --out csv=bp-hoje-abort.csv checkout.js > bp-hoje-abort.txt 2>&1
# 2) breakpoint sem abort (forma completa da curva)
TIPO=breakpoint TOPO=60 DUR=3m ABORT=0 $K6 run --quiet --no-color --out csv=bp-hoje-full.csv checkout.js > bp-hoje-full.txt 2>&1
echo done > bp-hoje.done
