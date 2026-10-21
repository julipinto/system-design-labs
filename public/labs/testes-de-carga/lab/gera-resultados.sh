#!/bin/bash
cd "$(dirname "$0")"
for f in bp-hoje-full bp-plano bp-plano2 pre1 pre2 pre3 spike-hoje estresse-plano2 pool-shared pool-bulkhead; do gunzip -kf $f.csv.gz; done
{
echo "# Janelas de 10 s dos testes k6 (analisa3.py/analisa.py/analisa2.py; taxa oferecida = a da rampa no meio da janela)"
for spec in "bp-hoje-full 60 180" "bp-plano 360 240" "bp-plano2 360 240" "pre1 38 120" "pre2 76 120" "pre3 114 120"; do
  set -- $spec; echo; echo "## $1 (rampa até $2/s em $3 s)"; python3 analisa3.py $1.csv $2 $3
done
for f in spike-hoje estresse-plano2; do echo; echo "## $f (janelas de 10 s; req/s = respostas por janela)"; python3 analisa.py $f.csv 10; done
for m in shared bulkhead; do echo; echo "## pool-$m (janelas antes 5-20 s, durante 25-50 s, depois 55-80 s)"; python3 analisa2.py pool-$m.csv; done
} > resultados-k6.txt
rm -f bp-hoje-full.csv bp-plano.csv bp-plano2.csv pre1.csv pre2.csv pre3.csv spike-hoje.csv estresse-plano2.csv pool-shared.csv pool-bulkhead.csv
