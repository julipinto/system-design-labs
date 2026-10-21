# Fontes: Cell-Based Architecture

Registro dos links de fonte do módulo 26, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Cell-Based Architecture, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/cell-based/), publicado em 02/03/2026 e citado nas aulas 1 a 4.

**Aulas:** 1 Introdução ao Cell-Based · 2 Estrutura celular · 3 Roteamento celular · 4 Replicação celular

**Código:** não há lab de células no repositório público do autor (conferido com `gh api` em 21/10/2026). O mais próximo é a pasta [`exemplos/sharding`](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/sharding) (o roteamento por chave, módulo 16), citada na aula 3. O estudo `AVANCADO_PLATAFORMA_MULTIREGIAO_AWS.md`, em `cases/`, fica para o módulo 27. O "lab" do módulo são os widgets e as contas.

**Números "medidos":** todos calculados em Python em 21/10/2026 (`c26.py`) e repetidos no JavaScript dos widgets: blast radius desigual, custo do piso (41 × 53 vCPU; 9 × 32), folga 1 ÷ (N − 1), 2PC (24 e 164 ms; 0,999^k), *shuffle* exato × aproximado (190 · 1.140 · 15.504 pares), *rehash* (100.000 chaves com SHA-256: 3 → 4 = 75,0%; 4 → 5 = 80,1%; o widget usa `murmur3` e dá 74,8% e 80,1%, anel de 100 pontos por célula 19,7%), RPO por célula e as contas do veneno (7.200 × 2.880; 24.000 × 9.600; 14.400). **Não foram rodados:** um sistema com células de verdade, um 2PC no PostgreSQL (os tempos são **modelo** de rodadas de rede, avisado como exemplo nas aulas), o Kafka com o veneno (a descrição é qualitativa; os eventos presos são taxa × tempo) e o `mod N` com `murmur3` da loja em 100.000 chaves reais (o módulo 16 mediu 75,2%).

**Conferência feita em 2026-10-21** (curl com `-L` e `User-Agent` de navegador): os 21 links deste arquivo (os citados e os conferidos) deram 200.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis](https://fidelissauro.dev/cell-based/) | artigo base | Definição, as cinco segmentações, estrutura, isolamento de estado, roteamento, *edge cells*, células síncronas e assíncronas, replicação, *shuffle sharding* e blast radius. As 4 aulas seguem a ordem dele, com 10 correções abaixo. | 1–4 | 200 |
| [AWS Well-Architected: What is a cell-based architecture?](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/what-is-a-cell-based-architecture.html) | fonte primária | A célula como cópia da pilha por parcela de clientes; "não compartilha estado"; 10 células, 90% não afetados. | 1, 4 | 200 |
| [Microsoft Azure: padrão Bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) | documentação | A frase "também conhecido como arquitetura baseada em células". | 1 | 200 |
| [WSO2: referência de arquitetura baseada em células](https://github.com/wso2/reference-architecture/blob/master/reference-architecture-cell-based.md) | referência (do artigo) | Outro sentido de "célula": contexto delimitado de um time, "sem células dentro de células", lei de Conway, 12 recomendações. Só para o contraste. | 1, 2 | 200 |
| [AWS Well-Architected: Cell sizing](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/cell-sizing.html) | fonte primária | Os três fatores do tamanho (caber a maior carga, testável em escala real, ganho de escala), limite máximo e células do mesmo tamanho. | 2 | 200 |
| [AWS Well-Architected: Cell placement](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/cell-placement.html) | fonte primária | A colocação e a migração de clientes, no plano de controle. | 2 | 200 |
| [Microsoft Azure: padrão Deployment Stamps](https://learn.microsoft.com/en-us/azure/architecture/patterns/deployment-stamp) | documentação | Cópias independentes da pilha, publicadas por etapas. | 2 | 200 |
| [AWS Well-Architected: Cell routing](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/cell-routing.html) | fonte primária | O roteador "na camada mais fina possível", sem lógica de negócio, simples o bastante para testar tudo. | 3 | 200 |
| [AWS Builders' Library: Reliability, constant work, and a good cup of coffee](https://aws.amazon.com/builders-library/reliability-and-constant-work/) | fonte primária | Plano de controle × plano de dados e trabalho constante. | 3 | 200 |
| [AWS Builders' Library: Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/) | fonte primária | Estabilidade estática: seguir com o último estado quando o plano de controle falha. | 3 | 200 |
| [Repositório público do autor: exemplos/sharding](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/sharding) | código público | O roteamento por chave (módulo 16), de onde vêm o hash, o anel e o *rehash*. | 3 | 200 |
| [AWS Builders' Library: Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/) | fonte primária | O *shuffle sharding* e a probabilidade de impacto. | 4 | 200 |
| [AWS Architecture Blog: Shuffle Sharding, Massive and Magical Fault Isolation](https://aws.amazon.com/blogs/architecture/shuffle-sharding-massive-and-magical-fault-isolation/) | artigo | O original do texto que o artigo cita por tradutor. | 4 | 200 |
| [Martin Fowler: Two-Phase Commit](https://martinfowler.com/articles/patterns-of-distributed-systems/two-phase-commit.html) | fonte primária | As duas fases e o bloqueio se o coordenador some depois do *prepare*. | 4 | 200 |

Conferidos e **não** citados nas aulas (respondem 200): [AWS, página-mãe "Reducing the scope of impact with cell-based architecture"](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html), [AWS, guia de soluções "Cell-based architecture on AWS"](https://aws.amazon.com/solutions/guidance/cell-based-architecture-on-aws/) e [AWS Builders' Library: Minimizing correlated failures](https://aws.amazon.com/builders-library/minimizing-correlated-failures-in-distributed-systems/), mais o [whitepaper de fronteiras de isolamento de falhas da AWS](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/abstract-and-introduction.html) (200).

**Referências do artigo que abrem (200) e ficam só como "Aprofundar", sem entrar nas aulas:** [A Crash Course on Cell-based Architecture (ByteByteGo)](https://blog.bytebytego.com/p/a-crash-course-on-cell-based-architecture), [Bulkhead Pattern → Cell based architecture (Wedaa)](https://www.wedaa.tech/docs/blog/2024/05/05/Bulkhead-Pattern) e a palestra do re:Invent 2022 em vídeo, [Camada Zero (PRT268)](https://www.youtube.com/watch?v=7IUgTNcPFlU), **que não foi assistida** para estas aulas.

**Referências que não entram:** o texto da WSO2 em `wso2.com/library/conference/2025/07/mastering-cell-based-architecture-for-modern-enterprises` (403 a robôs) e o artigo do *shuffle sharding* via `translate.goog` (entra o original da AWS). Sem link verificável: nenhum livro citado.

## Correções ao artigo

1. **Dois sentidos de "célula".** O artigo e a AWS tratam a célula como cópia da pilha inteira, uma por parcela dos clientes. A WSO2 usa o termo para um contexto delimitado de um time, falando de domínios e não de clientes. A aula 1 usa o sentido da AWS e avisa o outro (callout).
2. **"Edge cells" inteligentes.** O artigo pede um roteador "inteligente e agnóstico"; a AWS pede a camada mais fina possível, sem lógica de negócio. O estado é o mapa, pequeno, em memória, com estabilidade estática (aula 3).
3. **`(f/N)^k` é aproximação.** A exata é C(f,k) ÷ C(N,k): 0,526% (e não 1%) para N = 20, f = k = 2. A 3ª linha da tabela do artigo está errada: (5 ÷ 20)^5 = 0,0977%, não 0,009% (exata: 0,00645%); a 2ª (0,33%) é a fórmula e a exata é 0,0877% (aula 4).
4. **"1% com 20 células = 100 *bulkheads*".** Compara uma falha com duas. Mesma falha: uma célula caída deixa 0% fora; duas deixam 0,526%, o equivalente a 190 compartimentos (aula 4).
5. **Tabela 1 ÷ N.** Vale só com tráfego uniforme; com o `mkt-01` a 40% as células têm 40 · 33 · 15 · 12% e o raio é a maior fração. A tabela também arredonda 33,3% e 66,7% (aula 1).
6. **"Determinístico" × "amanhã continua na célula X".** Vale para a leitura do mapa; o plano de controle muda o mapa (colocação e migração; 13 min 20 s para o `mkt-01`). Faltam no artigo o tamanho da célula, a colocação, a migração e o plano de controle fora do caminho do pedido (aulas 2 e 3).
7. **Replicação consistente com 2PC.** O 2PC bloqueia, soma latência e disponibilidade, e a AWS diz que a célula não compartilha estado. Para RPO zero onde dói, replicação síncrona de um banco só (módulo 17) ou consenso (aula 4).
8. **Faltam no artigo:** o custo (piso: 41 → 53 vCPU), o estoque (recurso físico global; alocar por célula), as dependências globais (DNS, identidade/JWT, PSP, certificados, o mapa), o deploy como risco principal (célula zero) e testar (matar uma célula em produção: *game day* do módulo 27) (aulas 2 e 3).
9. **"Células eliminam *poison pill*".** Contêm a requisição envenenada; o veneno de dados é replicado para a passiva e derruba as duas (aulas 1 e 4).
10. **Referências.** Ver a seção anterior (WSO2 2025 com 403, tradutor, vídeo não assistido).
