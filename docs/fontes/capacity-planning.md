# Fontes: Capacity Planning

Registro dos links de fonte do módulo 23, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Capacity Planning e a Teoria das Filas, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/capacity-planning/), publicado em 12/01/2026 e citado nas aulas 1 a 9.

**Aulas:** 1 Introdução ao capacity planning · 2 Teoria das filas · 3 Lei de Little e o ponto saudável · 4 A curva do joelho · 5 Modelagem de carga · 6 Perfis de tráfego · 7 Projeção de crescimento · 8 Capacidade end to end · 9 Planejamento de capacidade

**Código:** não há lab de capacity planning no repositório público do autor (conferido com `gh api` em 20/10/2026). O mais próximo é a pasta [`exemplos/load-test`](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-test) (o modelo de relatório do módulo 24), citada como ponte na aula 9. O "lab" do módulo são os widgets e as contas.

**Números "medidos":** todos calculados em Python em 20/10/2026 (M/M/1, Pollaczek–Khinchine, Little, reta de mínimos quadrados e composta, o mix, a banda, a cadeia, as réplica-horas e o lag do `entregas`) e repetidos no JavaScript dos widgets, que batem com o brief. **Não há medição de laboratório neste módulo:** a média de 157 ms em toda a cadeia a 30 pedidos/s vem de uma rodada do k6 contra o simulador de filas do módulo 24, e a série do catálogo (300 · 410 · 520 · 640), os perfis diário, semanal e sazonal, o mix de 5% de buscas (80 ms), o payload de 20 KB e as 40 mensagens/s por partição do `entregas` são **exemplos declarados** como tais nas aulas.

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 17 links citados nas aulas deram 200.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/capacity-planning/) | artigo base | Teoria das filas, Lei de Little, ponto saudável, curva do joelho, modelagem de carga, perfis, projeção, capacidade end to end e o roteiro de 8 passos. As 9 aulas seguem a ordem dele, com 11 correções abaixo. | 1–9 | 200 |
| [Google SRE book: Software Engineering in SRE](https://sre.google/sre-book/software-engineering-in-sre/) | fonte primária | Previsão de demanda e planejamento de capacidade. | 1, 6 | 200 |
| [Google SRE Workbook: Non-Abstract Large System Design](https://sre.google/workbook/non-abstract-design/) | fonte primária | Partir dos números medidos para o projeto de capacidade. | 1, 7 | 200 |
| [Google Cloud: Capacity Planner](https://docs.cloud.google.com/capacity-planner/docs/overview) | documentação | A ferramenta de previsão de capacidade, citada pelo artigo. | 1, 6, 9 | 200 |
| [Wikipédia: M/M/1 queue](https://en.wikipedia.org/wiki/M/M/1_queue) | referência | W = 1 ÷ (μ − λ) e L = ρ ÷ (1 − ρ). | 2 | 200 |
| [Wikipédia: Pollaczek–Khinchine formula](https://en.wikipedia.org/wiki/Pollaczek%E2%80%93Khinchine_formula) | referência | A fila M/G/1 e o efeito da variabilidade. | 2 | 200 |
| [Wikipédia: Kingman's formula](https://en.wikipedia.org/wiki/Kingman%27s_formula) | referência | A espera cresce com ρ e com a variabilidade (G/G/1). | 2 | 200 |
| [Wikipédia: Teoria das filas](https://pt.wikipedia.org/wiki/Teoria_das_filas) | referência (referência do artigo) | Introdução em português a λ, μ e à notação de Kendall. | 2 | 200 |
| [Wikipédia: Little's law](https://en.wikipedia.org/wiki/Little%27s_law) | referência | L = λ × W. A citada pelo artigo chega por `translate.goog`; entra a original. | 3 | 200 |
| [Marc Brooker: Telling Stories About Little's Law](https://brooker.co.za/blog/2018/06/20/littles-law.html) | artigo | A Lei de Little na prática, com sistemas reais. | 3 | 200 |
| [Wikipédia: Knee of a curve](https://en.wikipedia.org/wiki/Knee_of_a_curve) | referência (referência do artigo) | O joelho como escolha de limite sobre uma curva. | 4 | 200 |
| [Brendan Gregg: o método USE](https://www.brendangregg.com/usemethod.html) | fonte primária | Utilização, saturação e erros por recurso. | 4 | 200 |
| [Wikipédia: Erlang (unit)](https://en.wikipedia.org/wiki/Erlang_(unit)) | referência | A unidade de carga (λ × S). | 5 | 200 |
| [Wikipédia: Neil J. Gunther](https://en.wikipedia.org/wiki/Neil_J._Gunther) | referência | Universal Scalability Law. A página do autor (perfdynamics.com) deu 403 em 21/10/2026. | 5 | 200 |
| [Kubernetes: Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | documentação | A fórmula do HPA (módulo 14) e as métricas. | 5, 7 | 200 |
| [Prometheus: histogramas e sumários](https://prometheus.io/docs/practices/histograms/) | documentação | Percentis não se agregam; histogramas, sim. | 8 | 200 |
| [Google SRE book: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/) | fonte primária | Sobrecarga, capacidade e falha em cascata. | 8 | 200 |
| [Repositório público do autor: exemplos/load-test](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-test) | código público | O modelo de relatório de teste de carga, ponte para o módulo 24. | 9 | 200 |

Conferido e **não** citado: [k21: Lei de Little](https://br.k21.global/gestao-de-times-ageis/lei-de-little-littles-law-a-ciencia-por-tras-de-fazer-menos-e-entregar-mais) (200).

**Referências do artigo que não entram (403 a robôs em 21/10/2026):** a ACM Queue ("Improving the performance of complex software is difficult…"), o SciELO ("Elementos das Teorias das Filas"), o Medium ("The Knee in Performance Testing") e o artigo da ACM Digital Library ("A Capacity Planning Process for Performance Assurance of Component-Based Distributed Systems", não conferido). **Sem link verificável:** Little (1961), Kleinrock (*Queueing Systems*), Erlang e Nygard (*Release It!*), citados só por autor, título e ano.

## Correções ao artigo

1. **"Reduzir W de 300 para 150 ms processa 50% mais requisições."** A mesma concorrência L com W pela metade sustenta o **dobro**: 500 → 1.000 req/s (+100%). Aula 3.
2. **"127" em 1.500 × 0,085.** O produto é **127,5** e o aumento é de **52,5**. Aula 3.
3. **"Em termos normais, a latência cresce de forma linear."** Na fila é **convexa desde o início** (W = S ÷ (1 − ρ)); só parece linear até uns 50%. O joelho é uma escolha de limite sobre uma curva suave; no M/M/1 não há quina. Aula 4.
4. **Joelho em 80–85% (artigo) × 70% (módulo 14).** Reconciliados: o joelho é onde a resposta sai do aceitável; 70% é o alvo operacional que deixa margem. Aula 4.
5. **"A teoria das filas propõe CV e desvio padrão em vez de percentis."** A variabilidade é o **fator** (Pollaczek–Khinchine); percentis continuam sendo o que o cliente sente. As duas coisas se somam. Aula 2.
6. **"Quanto menor o L, melhor."** O que importa é o L comparado ao **L(alvo)**; L alto com CPU baixa é sinal de dependência lenta. Aula 3.
7. **O autoscaling "aumenta μ temporariamente".** Ele aumenta a capacidade (servidores) com atraso de ~60 s; a variabilidade de curto prazo não passa por ele. Falta escalar por concorrência (L) ou fila. Aula 2.
8. **"Nenhuma métrica é mais importante que o TPS."** O TPS sozinho não dimensiona: o mix e a rajada dominam. Aula 5.
9. **O M/M/1 do artigo.** O `lb-loja` faz round robin e muitos serviços têm CV < 1; o M/M/1 é conservador. Faltam o M/G/1 (P–K) e o M/M/c (Erlang C). Aula 2.
10. **Faltam no artigo:** o custo da meta, o gatilho de reavaliação, o congelamento pré-evento, a pré-escala agendada e a capacidade nominal × operacional. Aulas 1, 7, 8 e 9.
11. **Referências do artigo:** ACM Queue, SciELO e Medium respondem 403 a robôs; "Little's law" via `translate.goog` é a Wikipédia (cita-se a original). Aula 9.
