# Fontes: Performance, Capacidade e Escalabilidade

Registro dos links de fonte do módulo 14, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Performance, Capacidade e Escalabilidade, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/performance-capacidade-escalabilidade/), publicado em 29/01/2024 e citado nas aulas 1 a 6.

**Aulas:** 1 Definindo e metrificando performance · 2 Métricas de performance · 3 Entendendo a capacidade em sistemas · 4 Escalabilidade vertical e horizontal · 5 Fórmula de capacity e HPA · 6 Conclusão

**Código:** não há lab de código para este tema no repositório público do autor (pasta `exemplos/`, conferida com `gh api`). O mais próximo é `exemplos/load-test/README.md`, um modelo de relatório de teste de performance, citado nas aulas 3 e 6. As contas do módulo (percentis pelo posto mais próximo, curva R(ρ), cadeia, HPA, queda de réplicas, Amdahl e Little) foram refeitas em Python e batem com os widgets.

**Conferência feita em 2026-10-20** (curl com `-L` e `User-Agent` de navegador): os 16 links distintos citados nas aulas deram 200. O da Universal Scalability Law (perfdynamics.com) dá 403 com um User-Agent mínimo e 200 com um de navegador completo, então entra em https. Sem link verificável: Nygard, *Release It!* (o link do artigo é da Amazon), e Little (1961) e Amdahl (1967) como artigos originais.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/performance-capacidade-escalabilidade/) | artigo base | Quatro sinais, utilização, vazão, tempo de resposta, erros, percentis, gargalo, custo por transação, vertical e horizontal, fórmula do HPA. As 6 aulas seguem a ordem dele, com 12 correções registradas abaixo. | 1–6 | 200 |
| [Livro de SRE do Google: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) | fonte primária | Os quatro sinais; "latency" como tempo de atender, separando sucesso de falha. | 1, 2 | 200 |
| [Livro de SRE do Google: sumário](https://sre.google/sre-book/table-of-contents/) | fonte primária | Referência do artigo para o livro. | 6 | 200 |
| [Brendan Gregg: método USE](https://www.brendangregg.com/usemethod.html) | fonte primária | Utilização, saturação e erros; saturação como trabalho esperando. | 2 | 200 |
| [Prometheus: histogramas e sumários](https://prometheus.io/docs/practices/histograms/) | documentação | Por que percentis não se agregam e o caminho dos histogramas. | 2 | 200 |
| [Gil Tene: How NOT to measure latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU) | palestra | Média, percentis e o que um painel esconde. | 1, 2 | 200 |
| [Lei de Little (Wikipédia)](https://en.wikipedia.org/wiki/Little%27s_law) | enciclopédia | L = λ × W. O artigo original (Little, 1961) não tem link. | 3 | 200 |
| [Fila M/M/1 (Wikipédia)](https://en.wikipedia.org/wiki/M/M/1_queue) | enciclopédia | A base do modelo de brinquedo R(ρ). | 3 | 200 |
| [Lei de Amdahl (Wikipédia)](https://pt.wikipedia.org/wiki/Lei_de_Amdahl) | referência do artigo | 1 ÷ (s + (1 − s) ÷ n). | 3, 4 | 200 |
| [Repositório do autor: exemplos/load-test](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-test) | código público | Modelo de relatório de teste de performance (metas, pré-teste de uma réplica, autoscaling). | 3, 6 | 200 |
| [Kubernetes: redimensionamento de contêiner no lugar](https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/) | documentação | Scale up sem recriar o pod. | 4 | 200 |
| [Kubernetes: Vertical Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/vertical-pod-autoscale/) | documentação | Elasticidade vertical. | 4 | 200 |
| [Universal Scalability Law (Gunther)](https://www.perfdynamics.com/Manifesto/USLscalability.html) | fonte primária | O custo de coerência além de Amdahl. | 4 | 200 |
| [Kubernetes: Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | documentação | `ceil[atuais × atual ÷ desejado]`, tolerância 0,1, período de 15 s, estabilização de descida de 300 s, subida de 4 pods ou 100% a cada 15 s, % dos requests, pods não prontos como 0%. | 5 | 200 |
| [Kubernetes: tutorial do HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) | documentação | O HPA em funcionamento. | 5 | 200 |
| [learnk8s: Kubernetes instance calculator](https://learnk8s.io/kubernetes-instance-calculator) | referência do artigo | Calculadora de instâncias. | 5 | 200 |

## Referências do artigo que não entraram
"Test of the New Infortrend CS Scale-Out NAS Cluster" (armazenamento, sem relação com o texto), "Stupid Simple Scalability" e os slides do Nomad Autoscaler ficam de fora. Os artigos sobre percentis (AppDynamics, Dynatrace, Ombulabs), os dos quatro sinais (Site24x7, Sysdig), o de backpressure no Medium e o da Wikipédia sobre contrapressão não foram citados nas aulas: a documentação do Prometheus e o livro de SRE cobrem o conteúdo.

## Correções ao artigo (avisadas nas aulas)
1. **Exemplo de CPU (aula 5).** 6 réplicas de 200m têm 1.200m disponíveis, e não 600m; com 1.200m usados a utilização é 100% e a fórmula dá ⌈6 × 100 ÷ 80⌉ = 8, e não 15. O 15 só fecha com 2.400m usados (200%).
2. **Exemplo de vazão (aula 5).** 6 × 27,78 ÷ 15 = 11,11; o HPA usa ceil e dá 12, e não 11. Com 11 réplicas cada uma recebe 15,15 req/s, acima dos 15 declarados.
3. **Utilização × saturação (aula 2).** Saturação é trabalho esperando (método USE, livro de SRE), e não "perto de 100% de uso".
4. **Latência × tempo de resposta (aula 1).** O artigo usa latência para a rede; o livro de SRE usa para o tempo de atender e separa erros rápidos. O módulo usa tempo de resposta.
5. **Percentis (aula 2).** Não se agregam (média dos p99 = 269 ms contra 2.000 ms) e p99 com 100 amostras é só o 99º valor.
6. **Backpressure (aula 3).** O exemplo do artigo é de gargalo e represamento; o mecanismo fica para o módulo 21. O excedente vira fila ou é descartado.
7. **Elasticidade (aula 4).** É ajustar automaticamente, nos dois sentidos, e pode ser vertical ou horizontal; "escalabilidade" em Nygard tem duas leituras.
8. **Vertical e algoritmo (aula 4).** Otimizar código aumenta a capacidade por recurso e é outra alavanca (aula 6).
9. **Horizontal não é linear (aula 4).** Com recurso compartilhado o ganho para (Amdahl; USL de Gunther).
10. **Base de requisições (aulas 3 e 6).** Depende do mix de requisições; medir por tipo com teste de carga.
11. **HPA real (aula 5).** Faltavam ceil, tolerância de 10%, janela de 300 s, políticas de subida, pods não prontos e os requests.
12. **Referências (aula 5).** As três referências sem relação ou sem uso não ficam; o learnk8s entra como leitura extra.
