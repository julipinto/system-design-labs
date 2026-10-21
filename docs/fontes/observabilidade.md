# Fontes: Observabilidade e Monitoramento

Registro dos links de fonte do módulo 28, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Observabilidade e Monitoramento, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/observabilidade/), publicado em 19/03/2026 e citado nas aulas 1 a 10. O artigo se apresenta como um *recap* dos capítulos anteriores.

**Aulas:** 1 Confiabilidade · 2 Observabilidade × monitoramento · 3 Métricas · 4 Logs · 5 Traces · 6 Alertas e APM · 7 Service levels (SLI, SLO, SLA e orçamento de erro) · 8 USE · 9 RED · 10 Os quatro sinais de ouro

**Código:** o repositório público do autor **não tem lab de observabilidade** (conferido com `gh api` em 21/10/2026). O link entra só como "repositório público do autor", na aula 4. O "lab" do módulo é **só conta**: o script `c28.py` (Python, 21/10/2026) calcula a árvore de *spans*, o histograma e a interpolação dos percentis, a cardinalidade, o volume de log e de *trace*, o tempo de disparo de cada alerta e os *burn rates*. Não há código de lab nos MDX.

**Números "medidos":** **nenhum**. Não foi rodado um OpenTelemetry, um Prometheus nem um Grafana (as consultas aparecem como exemplo de forma, sem saída "real"). O histograma é uma **janela definida** no brief (1.000 requisições; contagens acumuladas 400 · 975 · 992 · 992 · 1.000); a interpolação segue a do `histogram_quantile` do Prometheus, conferida na documentação. As durações dos *spans* (4 · 6 · 14 · 12 · 20/1.640 · 210 · 6 · 3), a tarefa `contagem-estoque` e os bytes por linha de log (300 B; 250 B no catálogo) e por *span* (400 B) são **exemplo**, avisado nas aulas. As contas foram refeitas ao escrever: p50 0,2935 · p95 0,4891 · p99 0,7647 · p99,9 2,3125 s; 2.016 · 22.176 · 33,3 bilhões; 2,81 · 25,5 · 255 GB/dia (765 GB em 30 dias); 4,8 KB por *trace*, 12,4 GB × 124 MB/dia e 1 − 0,99⁸ = 7,7%; 51,84 s, 1.000×, 1,44% · 0,036% · 0,43% (14,4× · 0,36× · 4,3×); 12.960 requisições (43,2 min), 5.184 · 4.276,8 · 1.944 · 1.555,2, 20,8% · 4,97% · 0,06%; 2% · 5% · 10%; média 193,1 ms. Os widgets repetem as contas no navegador (o alerta A, B e D em faixas, porque a fase da avaliação é desconhecida).

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 34 links distintos desta lista deram **200**. Conferido no texto: o SRE book (*Monitoring Distributed Systems*: "página para sintomas", distinguir a latência dos sucessos e dos erros), o SRE Workbook (*Alerting on SLOs*: 14,4× na janela de 1 h e de 5 min = 2% do orçamento), o W3C (formato `traceparent`) e o Prometheus (quantis não se agregam; alertar por sintomas). **Não usados:** o ACM Queue (https://queue.acm.org/detail.cfm?id=2413037, 403 a robôs: o método está em `brendangregg.com`) e o Nanoshots (429 em 21/10/2026). **Sem link verificável:** nenhum livro citado.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/observabilidade/) | artigo base | Confiabilidade, observabilidade × monitoramento, os três pilares, níveis de log, alerting e APM, SLI/SLO/SLA e orçamento de erro, USE, RED e os quatro sinais. As 10 aulas seguem a ordem dele, com 9 correções abaixo. | 1–10 | 200 |
| [Repositório público do autor](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design) | repositório | Não há lab de observabilidade (conferido em 21/10/2026). | 4 | 200 |
| [Google SRE book: Embracing Risk](https://sre.google/sre-book/embracing-risk/) | fonte primária | Confiabilidade como meta com custo; 100% não é a meta certa. | 1 | 200 |
| [Google SRE book: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | fonte primária | Os quatro sinais; alertar por sintoma e usar a causa para depurar; distinguir a latência dos sucessos da dos erros. | 3, 6, 10 | 200 |
| [Google SRE book: Practical Alerting](https://sre.google/sre-book/practical-alerting/) | fonte primária | Alertas a partir de séries temporais. | 6 | 200 |
| [Google SRE book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) | fonte primária | SLI, SLO e SLA; escolher o que medir; metas. | 7 | 200 |
| [Google SRE Workbook: Implementing SLOs](https://sre.google/workbook/implementing-slos/) | fonte primária | Como definir bons eventos e válidos; o orçamento como guia de decisão. | 7 | 200 |
| [Google SRE Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/) | fonte primária | *Burn rate*: 2% em 1 h = 14,4×, 5% em 6 h = 6×, 10% em 3 dias = 1×; janela longa e curta. | 6, 7 | 200 |
| [Red Hat: What is observability?](https://www.redhat.com/en/topics/devops/what-is-observability) | referência do artigo | Visão geral de observabilidade e dos três sinais. | 1 | 200 |
| [OpenTelemetry: Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/) | fonte primária | Observabilidade como propriedade; sinais e correlação. | 2 | 200 |
| [OpenTelemetry: Signals](https://opentelemetry.io/docs/concepts/signals/) | fonte primária | A lista de sinais (traces, métricas, logs, *baggage*, outros em desenvolvimento). | 2, 4 | 200 |
| [Wikipédia: Observability](https://en.wikipedia.org/wiki/Observability) | enciclopédia | A origem na teoria de controle (Kalman). | 2 | 200 |
| [Lamport: Time, Clocks, and the Ordering of Events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) | referência do artigo | Só em "Aprofundar": os relógios e a ordem dos eventos, que explicam por que se correlaciona por id. | 2 | 200 |
| [Prometheus: tipos de métrica](https://prometheus.io/docs/concepts/metric_types/) | fonte primária | Contador, *gauge*, histograma e *summary*. | 3 | 200 |
| [Prometheus: histogramas e summaries](https://prometheus.io/docs/practices/histograms/) | fonte primária | Os quantis não se agregam; a precisão depende dos *buckets*. | 3 | 200 |
| [Prometheus: nomes de métricas e rótulos](https://prometheus.io/docs/practices/naming/) | fonte primária | Rótulos com valores demais explodem as séries. | 3 | 200 |
| [Prometheus: funções de consulta](https://prometheus.io/docs/prometheus/latest/querying/functions/) | fonte primária | `histogram_quantile` (interpolação linear dentro do *bucket*) e `rate()`. Conferência, sem citar nas aulas. | 3 | 200 |
| [Grafana Loki: cardinalidade](https://grafana.com/docs/loki/latest/get-started/labels/cardinality/) | documentação | Rótulos de valor quase único estragam o índice; o texto fica comprimido. | 4 | 200 |
| [W3C: Trace Context](https://www.w3.org/TR/trace-context/) | padrão | O cabeçalho `traceparent`: `versão-trace-id-parent-id-flags`. | 5 | 200 |
| [OpenTelemetry: Sampling](https://opentelemetry.io/docs/concepts/sampling/) | fonte primária | Amostragem *head* e *tail*. | 5 | 200 |
| [Google: Dapper](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/) | artigo científico | A origem do *tracing* distribuído em larga escala. | 5 | 200 |
| [Conceitos OpenTelemetry, por Ezzio Moreira (dev.to)](https://dev.to/ezziomoreira/conceitos-opentelemetry-9k0) | referência do artigo | Só em "Aprofundar". | 5 | 200 |
| [Elastic: What is OpenTelemetry?](https://www.elastic.co/what-is/opentelemetry) | referência do artigo | Só em "Aprofundar" (não entra nos blocos de fonte). | — | 200 |
| [Prometheus: Alerting](https://prometheus.io/docs/practices/alerting/) | fonte primária | Alertar por sintomas, e não por causas. | 6 | 200 |
| [Splunk: What Are Feedback Loops?](https://www.splunk.com/en_us/blog/learn/feedback-loops.html) | referência do artigo | Alertas como acelerador de *feedback*. | 6 | 200 |
| [New Relic: What are SLOs, SLIs, and SLAs?](https://newrelic.com/blog/observability/what-are-slos-slis-slas) | referência do artigo | As três siglas em linguagem simples. | 7 | 200 |
| [Grafana: SLOs, a guide](https://grafana.com/blog/slos-a-guide-to-setting-and-benefiting-from-service-level-objectives/) | referência do artigo | Como definir e usar SLOs. | 7 | 200 |
| [Wikipédia: Service-level objective](https://en.wikipedia.org/wiki/Service-level_objective) | enciclopédia | Conferência dos termos. Sem citar nas aulas. | — | 200 |
| [Brendan Gregg: The USE Method](https://www.brendangregg.com/usemethod.html) | fonte primária | O método (utilização, saturação, erros) e as listas por recurso. | 8 | 200 |
| [PagerTree: USE and RED](https://pagertree.com/learn/devops/what-is-observability/use-and-red-method) | referência do artigo | USE para recurso, RED para serviço. | 8, 9 | 200 |
| [The New Stack: Monitoring Methodologies, RED and USE](https://thenewstack.io/monitoring-methodologies-red-and-use/) | referência do artigo | As duas lentes lado a lado. | 8 | 200 |
| [Grafana: The RED Method](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/) | fonte primária | Rate, Errors e Duration (Tom Wilkie). | 9 | 200 |
| [SolarWinds: Monitoring and Observability with USE and RED](https://www.solarwinds.com/blog/monitoring-and-observability-with-use-and-red) | referência do artigo | Quando usar cada um. | 9 | 200 |
| [FireHydrant: 4 SRE Golden Signals](https://firehydrant.com/blog/4-sre-golden-signals-what-they-are-and-why-they-matter/) | referência do artigo | Os quatro sinais explicados. | 10 | 200 |
| Módulos 6, 8, 11, 12, 13, 14, 21, 22, 23, 24, 25, 26 e 27 do SDLabs | interno | Os números de partida (o `7f3a…` do 1047, o 409 e o 429, o 269 × 2.000, a `catalogo-3` a 99%, o incidente de 90 s, o frete 0,00 e o canary, o mix de Recife, as células, o MTTD de 30 s). Sem link. | 1–10 | — |

## Correções ao artigo

1. **Latência nos quatro sinais (aula 10).** O artigo diz que a latência "inclui tanto respostas bem-sucedidas quanto com erro". O **SRE book** diz o **contrário**: é preciso **distinguir** a latência dos sucessos da dos erros, porque um `500` rápido (perda da conexão com o banco) **puxa a média para baixo** ("misleading calculations"), e "um erro **lento** é pior que um erro rápido". Na loja: 275 → 193 ms com 30% de falha rápida (0,3 × 2 + 0,7 × 275 = 193,1).
2. **"Tempos de resposta" como *gauge* (aula 3).** É o exemplo errado: tempo de resposta é **histograma** (distribuição, percentil, agregável pelos *buckets*). O artigo acerta ao falar de histogramas e percentis; falta dizer que o **percentil não se agrega** (o Prometheus: "não se agregam quantis") e que a precisão depende dos **buckets** (p99,9 = 2,3125 s para um valor de ~1,9 s).
3. **"Três pilares" como definição (aula 2).** O próprio artigo diz que observabilidade é **propriedade**, não ferramenta; os pilares são **sinais** (a OpenTelemetry lista traces, métricas, logs e *baggage*, com outros em desenvolvimento). Ter os três não é ter observabilidade: é preciso **correlação** (o `trace_id` em tudo).
4. **SLI como "o que materializa o SLA e o SLO" (aula 7).** O SLI é a **medida** (uma razão **bons ÷ válidos**, com o que conta como "bom" definido), o SLO é a **meta** sobre ele, o SLA é o **contrato**. "A longo prazo, o SLO deve virar o SLA" confunde: o SLO deve ficar **mais exigente** que o SLA para blindá-lo (99,9% × 99,5%).
5. **Orçamento de erro (aula 7).** O exemplo do artigo (SLO 99,95%, SLI 99,98%: "0,03% de margem") está certo; falta a **conta** (43,2 min para 99,9%; 12.960 requisições a 5/s; a margem de 0,03% de 30 dias = 12,96 min) e o ***burn rate*** (2% em 1 h = 14,4×; 5% em 6 h = 6×; 10% em 3 dias = 1×), que liga o orçamento ao **alerta**.
6. **Alertas (aula 6).** O artigo diz que reduzem o MTTD; falta o que **evita** o ruído: **alertar por sintoma**, **página × ticket**, `for` e a **janela dupla** (SRE Workbook). Um alerta de 5 min **nunca** pega um incidente de 90 s.
7. **Faltam no artigo (aulas 3, 5, 2).** **Cardinalidade** das métricas, **amostragem** de traces (*head* × *tail*), **propagação de contexto** (`traceparent`, W3C), **custo** (GB/dia), **OpenTelemetry** como padrão (só nas referências) e **a observabilidade por célula** (o rótulo `celula`; o módulo 26 já pedia observabilidade segmentada).
8. **USE (aula 8).** A lista de "erros" por recurso mistura **erros do recurso** (I/O errors, OOMKills) com **erros do software** (`thread pool exhausted`); no método original os **erros** são eventos do recurso, e os do serviço ficam no RED. O link do artigo da ACM Queue responde **403** a robôs; o método está em `brendangregg.com`.
9. **Referências.** O **ACM Queue** (403) e o **Nanoshots** (429 em 21/10/2026) não entram; o *Time, Clocks…* de Lamport abre (200) e entra só como "Aprofundar" (a ordem dos eventos e os relógios, que explicam por que se correlaciona por **id** e não por horário). O artigo lista o texto da Grafana sobre RED **duas vezes**; aqui entra uma.
