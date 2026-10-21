# Fontes: Scale Cube

Registro dos links de fonte do módulo 15, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Scale Cube, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/cubo-escalabilidade/), publicado em 29/10/2024 e citado nas aulas 1 a 5. O texto é **curto** (um parágrafo por eixo e um de fecho) e tem 4 links nas Referências; as aulas completam com as fontes primárias da AKF e de Richardson. O endereço `/scale-cube/` dá 404: o certo é `/cubo-escalabilidade/`.

**Aulas:** 1 Introdução ao modelo conceitual · 2 Eixo X: escalabilidade horizontal · 3 Eixo X: exemplo · 4 Eixo Y: quebra de funcionalidade · 5 Eixo Z: sharding e particionamento de dados · 6 Conversão dos eixos

**Laboratório:** o repositório público do autor **não tem um laboratório do Scale Cube** (conferido com `gh api` na pasta `exemplos/`). O que existe entra como ponte: `exemplos/load-balancing/algoritmos/round-robin/main.go` (eixo X, aula 3) e `exemplos/sharding/` e `exemplos/partitioning/` (eixo Z, aula 5; módulo 16). O laboratório da aula 3 é **do SDLabs**: três manifestos do Kubernetes (Deployment, Service e HPA) com a imagem de teste `registry.k8s.io/e2e-test-images/agnhost:2.53` e o comando `/agnhost netexec --http-port=8080`, a mesma do tutorial "Hello Minikube"; o endereço `/hostname` devolve o nome do pod (README do agnhost). A sintaxe dos YAMLs foi conferida com um parser; **eles não foram aplicados num cluster** (sem `kubectl` na máquina): rodar em `kind` ou `minikube` e trocar a saída ilustrativa da aula pela real.

**Conferência feita em 2026-10-20** (curl com `-L` e `User-Agent: Mozilla/5.0`): os 19 links distintos citados nas aulas deram 200. Conferido no texto das fontes: AKF (criado em 2007; eixos X, Y e Z; Z por módulo do `customer_id`, geografia, SKU; *pods*; GDPR); Richardson (X = N cópias, cada uma com 1/N; Y = serviços diferentes, por verbo ou substantivo; Z = mesmo código, subconjunto dos dados, roteamento por chave primária ou tipo de cliente; Z também na aplicação, com agregador); Wikipédia (1ª publicação online em 2007; *The Art of Scalability* 2ª ed. 2015; *Scalability Rules* 2011 e 2016).

**Sem link verificável:** Abbott e Fisher, *The Art of Scalability* (Addison-Wesley; `theartofscalability.com` não respondeu) e *Scalability Rules* (livro). A página do livro na InformIT responde 200 e pode ser citada como "livro". As aulas citam autor, título e edição, sem link.

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis sobre o Scale Cube](https://fidelissauro.dev/cubo-escalabilidade/) | artigo base | Os três eixos e a ideia do mapa mental. As 6 aulas seguem a ordem do vídeo e registram 8 correções abaixo. | 1–5 | 200 |
| [AKF Partners: The Scale Cube](https://akfpartners.com/growth-blog/scale-cube) | fonte primária (blog) | Criado em 2007; eixos X, Y e Z; custo de dados e cache do X; Z por módulo do `customer_id`, geografia e SKU; *pods* e GDPR. | 1, 2, 5 | 200 |
| [AKF Partners: The AKF Scale Cube](https://akfpartners.com/frameworks/the-akf-scale-cube) | fonte primária (framework) | A visão combinada dos três eixos. | 6 | 200 |
| [AKF Partners: Splitting applications or services for scale](https://akfpartners.com/growth-blog/splitting-applications-or-services-for-scale) | fonte primária (post de 2007) | O eixo Y: dividir por função para escalar e dar dono. | 4 | 200 |
| [AKF Partners: Splitting databases for scale](https://akfpartners.com/growth-blog/splitting-databases-for-scale) | fonte primária (post de 2007) | O eixo Z aplicado ao banco. | 5 | 200 |
| [AKF Partners: Availability Cube](https://akfpartners.com/growth-blog/akf-availability-cube) | fonte primária | O cubo irmão, de disponibilidade. Gancho para o módulo 27. | 6 | 200 |
| [Chris Richardson: The Scale Cube (microservices.io)](https://microservices.io/articles/scalecube.html) | fonte primária (artigo; referência do artigo-base) | X = N cópias com 1/N; Y por verbo ou substantivo; Z com roteamento e agregador. | 1, 2, 4, 5, 6 | 200 |
| [microservices.io: Microservice Architecture](https://microservices.io/patterns/microservices.html) | fonte primária (padrão) | O padrão de arquitetura de microsserviços, que é o eixo Y. | 4 | 200 |
| [Wikipédia: Scale cube](https://en.wikipedia.org/wiki/Scale_cube) | referência do artigo-base | História: 2007 e as edições dos livros. | 1, 6 | 200 |
| [The Twelve-Factor App: processos](https://12factor.net/processes) | fonte primária | Processos sem estado e compartilhando nada. | 2 | 200 |
| [The Twelve-Factor App: concorrência](https://12factor.net/concurrency) | fonte primária | Escalar por mais processos: o eixo X. | 2 | 200 |
| [Kubernetes: Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) | documentação | Réplicas, recriação de pods e `kubectl scale`. | 2 | 200 |
| [Kubernetes: Service](https://kubernetes.io/docs/concepts/services-networking/service/) | documentação | O nome estável que distribui as conexões entre os pods. | 3 | 200 |
| [Kubernetes: Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | documentação | `minReplicas`, `maxReplicas` e alvo de utilização. | 3 | 200 |
| [Kubernetes: tutorial Hello Minikube](https://kubernetes.io/docs/tutorials/hello-minikube/) | documentação | Usa `agnhost:2.53` com `netexec --http-port=8080`. | 3 | 200 |
| [Kubernetes: README da imagem agnhost](https://raw.githubusercontent.com/kubernetes/kubernetes/master/test/images/agnhost/README.md) | documentação | `netexec` expõe `/hostname`. | 3 | 200 |
| [Repositório do autor: round-robin](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-balancing/algoritmos/round-robin) | código público | O `main.go` do round robin entre `host1..3` (módulo 7), a ponte do X. | 3 | 200 |
| [Repositório do autor: sharding](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/sharding) | código público | Exemplo de shards; base do módulo 16. | 5 | 200 |
| [Repositório do autor: partitioning](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/partitioning) | código público | Exemplo de partições; base do módulo 16. | 5 | 200 |

## Correções ao artigo-base

1. **"Modelagem de microsserviços"** (aula 1): o artigo apresenta o cubo como modelagem de microsserviços. As fontes (AKF, Richardson) tratam o cubo como modelo para **escalar e segmentar** serviços **e dados**; só o eixo Y é microsserviços. X e Z valem também para um monolito, e a AKF o aplica a "produtos".
2. **"Largura, altura e profundidade"** (aula 1): esses nomes não aparecem nas fontes primárias. A AKF usa duplicação e clonagem (X), decomposição e segmentação funcional (Y) e partição por fronteira de cliente ou de dados (Z); Richardson usa os mesmos. O módulo diz "clonar, separar por função, separar por dados".
3. **Eixo Z só no banco** (aula 5): a AKF e Richardson aplicam o Z também à **aplicação** (shards de um serviço de busca com agregador; *pods* inteiros por cliente ou região, inclusive por lei, como a GDPR), e o Z é um eixo de **isolamento de falha**.
4. **X "a parte mais simples"** (aula 2): é a mais fácil de fazer, mas tem custos omitidos: dados replicados inteiros, caches que degradam, estado de sessão e nenhum ganho organizacional. O texto mistura o eixo (clonar) com a elasticidade (ajustar o número de clones, módulo 14).
5. **Y "grande parte das características dos microsserviços"** (aula 4): o Y sozinho, sem dados próprios nem fronteira, vira um monolito distribuído.
6. **Blue/Green e canário** (aula 6): são consequência do Y (deploy independente) e do Z (um canário por pod), não do cubo; entram como gancho para o módulo 22.
7. **Faltam as desvantagens do Z** (aula 5): repartir é difícil, consulta sem a chave vai a todos os shards, transação entre shards não existe de graça, a chave pode criar um shard quente.
8. **Referências do artigo** (aula 1): o link do Medium ("Achieving Scalability with Scale Cube") não entra; entram a AKF (o artigo e os dois posts de 2007), Richardson e a Wikipédia. O Availability Cube da AKF entra como gancho para o módulo 27.

## Dados da loja que este módulo fixa (para a história-mestre)

Pedido **1053** (Caio, Rio, 20:05: 1 caneca azul 19,90 + frete Rio 12,00 = 31,90; estoque da caneca 38 → 37); coordenadas (10, 9, 1) hoje e (10, 9, 3) com o Z do `pedidos`; 9 deployments e 30 pods; `pedidos` com 30 pedidos/s por réplica e 150/s no banco; demanda de 200 pedidos/s no ano que vem; saída 90, 150 e 200 pedidos/s em (3, 1, 1), (7, 1, 1) e (3, 1, 3); cliente `caio-58`.
