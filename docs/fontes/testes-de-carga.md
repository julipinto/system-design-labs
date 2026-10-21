# Fontes: Testes de Carga e Estresse

Registro dos links de fonte do módulo 24, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Testes de Carga e Estresse, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/load-testing/), publicado em 08/10/2024 e citado nas aulas 1 a 11.

**Aulas:** 1 Importância dos testes de carga · 2 Testes de carga vs. estresse · 3 Smoke tests · 4 Teste de média (average load) · 5 Teste de estresse · 6 Teste de spike · 7 Teste de breakpoint · 8 Respondendo a perguntas-chave · 9 Métricas e service levels · 10 Estratégias de pré-teste · 11 Assessment de performance

**Código:** o repositório público do autor tem em `exemplos/load-test/` só um `README.md` (o modelo de relatório) e cinco imagens; **não há script de teste** (conferido com `gh api`). O lab do módulo é do SDLabs: `public/labs/testes-de-carga/lab/` (k6 v2.3.0 contra um simulador de filas do checkout; `checkout.js`, `loja-sim.js`, `murmur3.js`, `pool.js`, `loja-pool.js`, `cfg-*.json`, `analisa*.py` e as saídas `*.txt`/`resultados-k6.txt`). Os CSV do k6 (~420 MB) não foram versionados.

**Números "medidos":** rodados em 20–21/10/2026, com k6 e simulador na mesma máquina; o simulador é um modelo (exponencial por pod, round robin). Não foram rodados: PSP real, Kafka, catálogo e HPA.

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 27 links distintos desta lista deram 200. `/average-load-testing/` do k6 dá 404; o texto está em `/load-testing/`.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo de Matheus Fidelis](https://fidelissauro.dev/load-testing/) | artigo base | Tipos de teste, perguntas-chave, métricas, service levels, pré-teste, ferramental e modelo de relatório. | 1–11 | 200 |
| [Repositório do autor: load-test](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-test) | repositório | O README (modelo de relatório) e 5 imagens; sem script. | 1, 10, 11 | 200 |
| [Grafana k6: documentação](https://grafana.com/docs/k6/latest/) | documentação | Visão geral. | 1, 11 | 200 |
| [k6: tipos de teste](https://grafana.com/docs/k6/latest/testing-guides/test-types/) | documentação | Os tipos e quando usar. | 2 | 200 |
| [k6: smoke testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/smoke-testing/) | documentação | Poucos VUs; mais de 5 já é mini-carga. | 3 | 200 |
| [k6: average-load testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/load-testing/) | documentação | Carga média e o soak. | 4 | 200 |
| [k6: stress testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/stress-testing/) | documentação | Degraus acima da média. | 5 | 200 |
| [k6: spike testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/spike-testing/) | documentação | Salto súbito e recuperação. | 6 | 200 |
| [Grafana blog: Spike testing](https://grafana.com/blog/2024/01/30/spike-testing/) | blog | Guia do spike. | 6 | 200 |
| [k6: breakpoint testing](https://grafana.com/docs/k6/latest/testing-guides/test-types/breakpoint-testing/) | documentação | `ramping-arrival-rate`, `abortOnFail`, evitar ambiente elástico. | 7 | 200 |
| [Grafana blog: Breakpoint testing](https://grafana.com/blog/2024/01/30/breakpoint-testing/) | blog | Guia do breakpoint. | 7 | 200 |
| [k6: ramping-arrival-rate](https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-arrival-rate/) | documentação | Executor de taxa variável. | 5 | 200 |
| [k6: cenários](https://grafana.com/docs/k6/latest/using-k6/scenarios/) | documentação | Cenários e executores. | 4, 8, 10 | 200 |
| [k6: modelo aberto × fechado](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/) | documentação | *Coordinated omission*. | 2 | 200 |
| [k6: thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) | documentação | `abortOnFail`, `delayAbortEval`, código de saída. | 3, 7, 9 | 200 |
| [Gil Tene: How NOT to measure latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU) | palestra | *Coordinated omission*. | 2, 9 | 200 |
| [Google SRE: Testing for Reliability](https://sre.google/sre-book/testing-reliability/) | fonte primária | Testes de configuração, estresse e canário. | 1, 9 | 200 |
| [Prometheus: histogramas](https://prometheus.io/docs/practices/histograms/) | documentação | Percentis a partir de histogramas. | 8 | 200 |
| [Kubernetes: HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | documentação | Autoscaling e seu atraso. | 6 | 200 |
| Módulos 12, 13, 14, 16, 21, 22 e 23 do SDLabs | interno | Os números de partida (gRPC, Kafka, HPA, shard do mkt-01, PSP, deploy, plano). Sem link. | 1–11 | — |

Responderam 200 mas não entram: Locust, JMeter, Gatling e Oha (só citados como ferramentas do artigo, não rodados), https://grafana.com/load-testing/, o repositório do k6 e a página de soak do k6.

## Correções ao artigo

1. **"Usuários simultâneos" como unidade (aula 2).** Usuários são o modelo fechado; a taxa (TPS) é a entrada do aberto. Little: VUs = taxa × (resposta + pausa); 800 ÷ 600 = 1,33 s. O fechado esconde a quebra (20 VUs: 38,1/s e 0% × 54/s aberto: 52%).
2. **Resultado × expectativa (aulas 9 e 11).** No spike, média de 400 ms para "< 400 ms" não passa; no estresse, "2.000 por 1 hora com aumento de 500 a cada 15 min" não fecha (4 degraus vão de 500 a 2.000 em 1 h).
3. **Breakpoint "10 usuários por minuto até 10.000" (aula 7).** 1.000 min = 16 h 40 min; 3.700 saem em 6 h 10 min. Rampa lenta mede o regime permanente; rampa curta dá ponto otimista (~4%).
4. **"Estresse = carga muito superior" (aula 5).** O que importa é como degrada e se recupera; o goodput cai (40 → ~26/s) acima do teto.
5. **`abortOnFail` (aulas 7 e 9).** Avalia o acumulado: parou aos 128 s (894 ms), enquanto a janela cruzou 800 ms 20 s antes.
6. **Breakpoint em ambiente elástico (aula 7).** O k6 manda desligar a elasticidade e testar o autoscaling à parte.
7. **Só caminho feliz e endpoint barato (aula 8).** O custo de errar o mix: 14 → 19 réplicas com 5% de busca.
8. **Pré-teste com dependências ilimitadas (aula 10).** O elo muda: o `pagamentos` limita o "hoje" a 36/s.
9. **Média × p95 (aula 9).** Faltam p99, goodput e `dropped_iterations`.
10. **Ferramentas (aulas 1 e 11).** O gerador também é um sistema; faltam relógio e teste distribuído.
11. **Referências.** LoadView, Lux Quality e PerfMatrix são blogs de fornecedores; dev.to e IBM são complementares; entram a documentação do k6 e o SRE book.
