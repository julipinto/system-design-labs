# Lab for modules 24 and 25 (generated on 10/20-21/2026)
Code: `checkout.js` (k6), `loja-sim.js` + `murmur3.js` (checkout queue simulator), `loja-pool.js` + `pool.js` (connection pool, module 25), `cfg-*.json` ("hoje" [today], "plano" [plan], "plano2" [plan 2], `pre1..3` environments), `analisa*.py` (10 s windows from the k6 CSV), `run-*.sh` (the runs).
Outputs: `*.txt` (k6 final summary, with `exit=`) and `resultados-k6.txt` (per-window tables). The k6 CSVs (~420 MB) stayed in the session folder (compressed): `/tmp/claude-1000/-home-juli-personal-system-design-sdlabs/8331eb1d-5ce9-4165-b4b9-f19b78967ea3/scratchpad/k6lab/*.csv.gz`.
k6 v2.3.0 downloaded from github.com/grafana/k6/releases (sha256 checked). To repeat: `node loja-sim.js` with `CFG="$(cat cfg-hoje.json)"` and `TIPO=breakpoint TOPO=60 DUR=3m ABORT=0 k6 run --out csv=bp.csv checkout.js`.
When integrating, the suggested destination is `public/labs/testes-de-carga/` (24) and `public/labs/bulkhead/` (25).
