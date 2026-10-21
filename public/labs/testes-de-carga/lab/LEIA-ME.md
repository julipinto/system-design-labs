# Lab dos módulos 24 e 25 (gerado em 20–21/10/2026)
Código: `checkout.js` (k6), `loja-sim.js` + `murmur3.js` (simulador de filas do checkout), `loja-pool.js` + `pool.js` (pool de conexões, módulo 25), `cfg-*.json` (ambientes "hoje", "plano", "plano2", `pre1..3`), `analisa*.py` (janelas de 10 s a partir do CSV do k6), `run-*.sh` (as rodadas).
Saídas: `*.txt` (resumo final do k6, com `exit=`) e `resultados-k6.txt` (tabelas por janela). Os CSV do k6 (~420 MB) ficaram na pasta da sessão (comprimidos): `/tmp/claude-1000/-home-juli-personal-system-design-sdlabs/8331eb1d-5ce9-4165-b4b9-f19b78967ea3/scratchpad/k6lab/*.csv.gz`.
k6 v2.3.0 baixado de github.com/grafana/k6/releases (sha256 conferido). Para repetir: `node loja-sim.js` com `CFG="$(cat cfg-hoje.json)"` e `TIPO=breakpoint TOPO=60 DUR=3m ABORT=0 k6 run --out csv=bp.csv checkout.js`.
Ao integrar, o destino sugerido é `public/labs/testes-de-carga/` (24) e `public/labs/bulkhead/` (25).
