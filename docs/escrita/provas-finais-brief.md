# Módulo 29: Provas Finais (brief canônico)

Fonte principal: **não há artigo-base.** O módulo é a **revisão final do estudo**: refazer a loja da Lena **do zero**, na ordem, passando pelos 28 capítulos. A fonte são **os próprios briefs** (`docs/escrita/<modulo>-brief.md`, um por módulo) e a **história-mestre** (`docs/escrita/historia-mestre.md`: espinha, elenco, pedidos e constantes). Cada número e cada nome deste módulo **já existe** num módulo anterior; **nada é inventado aqui** (as únicas coisas novas são a ordem de montagem, os 7 blocos, o quiz geral e a figura-mapa). Se um número mudar num módulo, **muda aqui junto** (PREMISSAS 8).
Lab público: github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design (conferido com `gh api`): a pasta `cases/` tem **casos de desenho** (enunciado, requisitos, diagrama), e eles servem **depois** deste módulo, para repetir o método **com outro sistema**: `BASICO_CHECKOUT_LIVRARIA.md`, `INTERMEDIARIO_ESTOQUE.md`, `INTERMEDIARIO_SAGA.md` e `AVANCADO_RESERVA_ONLINE.md` (os quatro abrem, 200). O "lab" do módulo é **só o quiz e o mapa**. Não citar curso, **não reproduzir exame nem certificado**: aqui a "prova" é a **autoavaliação** (o quiz geral e o "tire uma peça"), sem nota oficial.
Siga PREMISSAS.md e ESCRITA.md. Slug: `provas-finais`. Coleção `src/content/provas-finais/`, página `src/pages/labs/provas-finais/`. Título do módulo: "Provas Finais". **Figuras: 1** (`loja-3d`, o mapa da loja inteira). **Quiz: 1**, geral, de **80 perguntas** (a seção "Prova final" no fim do módulo, no mesmo padrão `public/labs/provas-finais/quiz/`, mas com a **identificação do módulo de origem** em cada pergunta e a nota **por bloco**).

## Onde a história parou e o novo problema
O módulo 28 fechou com a pergunta: **se alguém apagasse o desenho, você refaria a loja do zero, na ordem, sabendo o porquê de cada peça?** A loja que vende o gato de pelúcia tem hoje **28 capítulos de problema e peça**, e ninguém precisa **decorar** nenhum deles: precisa conseguir **reconstruir** a ordem em que cada um se tornou necessário. Este módulo faz isso em **7 aulas**, uma por **bloco de módulos** (a ordem real da história), e cada aula tem o mesmo molde: **o problema** que a loja tinha quando o bloco começou → **as peças**, na ordem, cada uma com o **porquê** (o incidente que a pediu) e o **número** que o resolveu → **"tire uma peça"** (o que quebra sem ela: o "e se der errado" olhado ao contrário) → **"Você consegue?"** (5 itens para desenhar de memória) → **"Falta saber…"** que liga ao bloco seguinte. No fim, o **quiz geral** (80 perguntas que **misturam** módulos) e a **figura-mapa**, que acende a loja **bloco a bloco** e deixa **derrubar** qualquer peça.

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
### O pedido que atravessa o mapa: o 1060 (Lena) — **sem pedido novo**
O módulo **não cria número**: reusa o **pedido 1060** do módulo 26 (**Lena, `celula-recife`, 20:25:00.000: 2 gatos de pelúcia 159,80 + frete Recife 15,00 = 174,80**, gato 19 → 17), porque é o pedido que **passa por mais peças** da loja. Os 14 saltos do 1060, na ordem (cada um aponta o módulo que o criou):
1. O app da Lena (Recife) resolve `loja.com.br` (**DNS**, 1) e abre a conexão (**TCP + TLS**, 1; RTT de 80 ms até SP, que a **célula de Recife** tira do caminho, 26).
2. O `edge-loja` (26) lê o **`cliente_id` do JWT** (8) e olha o **mapa** (150 MB) → `celula-recife`.
3. Dentro da célula: o `gw-loja` (8) valida o token e aplica **rate limit**; o `lb` (7) escolhe um `bff-app` (9).
4. O `bff-app` chama o `pedidos` com **prazo** (21) pela **malha** (10: mTLS, retry com regra) e, com **`Idempotency-Key`** (21), o `POST /pedidos` não duplica.
5. O `pedidos` reserva o **estoque** (11: o *lock* na linha do gato; **alocação por célula**, 26: `REC-1` tem 2 → 0).
6. O `pagamentos` cobra no PSP-A (12: REST/Pix; **breaker** e PSP-B de reserva, 21; **pool de 50** com *bulkhead* 50/30/20, 21 e 25).
7. O `pedidos` grava no **PostgreSQL da célula** (4), com **índice B-Tree**, e o evento `PedidoCriado` vai ao **outbox** (18).
8. O *relay* (CDC) publica no **Kafka** da célula (13), chave `pedido_id`, e os grupos `estoque`, `entregas` e `notificacoes` consomem.
9. A **saga** (19) segue: pagou → reservou → agendou entrega; se falhar, **compensa** (estorno).
10. Os eventos formam o **stream** `pedido-1060` (20, *event sourcing*) e o projetor atualiza `meus_pedidos:lena-77` (18, **CQRS**).
11. A tela "meus pedidos" da Lena lê **a projeção** (18) **da própria célula**: com o primário em Recife (26) não existe mais a réplica 800 ms atrás do módulo 17, e o **1055** da Lena (o pedido que ela não via) **não se repete**.
12. O banco da célula replica para a **célula passiva** em SP (17 e 26; **lag 800 ms**; RPO esperado 3,6 × 0,8 = **2,88**).
13. Cada salto deixa **log, métrica e trace** com o mesmo `trace_id` (28); o **SLI** do checkout (2xx e ≤ 800 ms) conta mais um "bom" (28).
14. Se o veneno do `mkt-01` chegasse **no mesmo instante** (26), a Lena **não notaria**: a `celula-mkt` cai sozinha.
**O 1060 está certo se você consegue dizer, de cada salto, qual problema resolveu e o que o faria falhar.**

### A ordem de montagem (os 7 blocos; o que a loja era no começo de cada um)
| bloco | módulos | a loja no começo | o problema | as peças (em ordem) |
|---|---|---|---|---|
| **1. A loja de um servidor** | 1 a 5 | um programa e um disco | o dado viaja, o disco queima, os bancos discordam, a página do gato é lenta | rede (DNS, TCP, TLS, HTTP) → RAID e *storage* → CAP, ACID e BASE → bancos e índices → cache e CDN |
| **2. Partir e ligar** | 6 a 10 | o programa único (8 vCPU) que cai inteiro às 23:00 | o vizinho barulhento e o raio de explosão | microsserviços (7) → balanceador → gateway → BFF → malha |
| **3. Conversar e disputar** | 11 a 13 | 7 serviços que se chamam e mexem na mesma linha | o último gato, a espera, o evento que se perde | concorrência e locks → síncrona (REST, gRPC, webhook) → assíncrona (Kafka, DLQ) |
| **4. Crescer e espalhar** | 14 a 17 | a loja rápida em dia comum | a Black Friday das 20:03 | medir (percentis, joelho) → o cubo → *shards* → réplicas |
| **5. Consistência e resiliência** | 18 a 21 | dados espalhados e dependências lentas | a tela que lê o passado, o estorno, o PSP de 8 s | CQRS → saga → *event sourcing* → resiliência |
| **6. Mudar, planejar, testar, isolar** | 22 a 25 | uma loja que aguenta, mas muda sem rede | a versão com defeito, a Black Friday de 2027, o relatório das 23:00 | deploy → capacidade → testes → *bulkheads* |
| **7. Células, desastre e sinais** | 26 a 28 | uma pilha com compartimentos | o veneno, a região de SP, o "como saber" | células → SPoF e DR → observabilidade |

### Os 28 números (a "cola" do módulo: 1 por capítulo; os flashcards)
| # | módulo | o número que fica | o que ele significa |
|---|---|---|---|
| 1 | Protocolos de Rede | **215 fatias** de até 1.460 B (313 KB); RTT **80 ms** | a foto vira segmentos; cada ida e volta custa 80 ms |
| 2 | Storage, RAID e I/O | escrita pequena: **1 · 2 · 4 · 6 · 2** I/Os (RAID 0 · 1 · 5 · 6 · 10) | o preço de cada nível de proteção |
| 3 | CAP, ACID e BASE | quórum **2 em 3**; **~80 ms** síncrona | na partição, recusar (C) ou aceitar (A) |
| 4 | Databases | o pedido **1042** (Lena, gato, 89,90); B-Tree | o índice acha uma linha em poucas leituras |
| 5 | Cache | tempo médio = h × 1 + (1 − h) × 41 (h = 90% → **5 ms**); preço **89,90 → 79,90** | o hit rate vira conta |
| 6 | Microsserviços | **180 → 200 ms** (4 saltos de 5 ms); **80 × 25 vCPU**; pedido **1047** | partir isola e escala só o que pesa, e cobra a rede |
| 7 | Load Balancers | 3 buscas de 900 ms caem todas na mesma réplica (**2,7 s**); *healthcheck* **5 s × 3 = 15 s** | "justo" no número de pedidos não é justo no trabalho |
| 8 | API Gateways | **401 × 403**; JWT; *token bucket*; pedido **1048** | uma porta, uma regra |
| 9 | BFF | **480 ms · 180 KB → 150 ms · 12 KB** | um BFF por canal, chamadas em paralelo |
| 10 | Service Mesh | **27** chamadas (3 × 3 × 3); sidecar **3 vCPU · 1,5 GB** | retry em camadas multiplica |
| 11 | Concorrência | **2 ms + 18 ms** → 50/s, teto **500/s**; o último gato; `409` | o lock decide quem leva |
| 12 | Comunicação Síncrona | **11 bytes** (o 1050 em Protobuf); **210 ms** com o PSP | o formato e o salto têm custo |
| 13 | Comunicação Assíncrona | **4** eventos por pedido; **120/s** na BF, **40/s por partição**; o 1049 → `p0` | a chave decide a partição |
| 14 | Performance | média **135** · p50 **32** · p95 **800** · p99 **2.000** ms; **99% × 67,5%**; `pagamentos` **40/s**, banco **150/s** | a média esconde; o elo mais fraco manda |
| 15 | Scale Cube | **(10, 9, 1) → (10, 9, 3)**; saída **90 → 150 → 200** pedidos/s | X clona, Y parte por função, Z por dado |
| 16 | Sharding | **50 M** linhas; o `mkt-01` a **40%** → **55,6%**; `mod` **75,2%** × anel **25,7%**; **45** pares | a chave decide o que esquenta |
| 17 | Replicação | commit **2 · 12 · 82 ms**; lag **300/800 ms**; RPO **9/24**; RTO **35 s** | cada cópia custa ou latência ou dado |
| 18 | CQRS | documento da Lena **1.787 B**; relatório **235 ms × 0,021 ms** | ler de um modelo feito para ler |
| 19 | Saga | **85,5%** de sucesso; *backoff* **1 · 2 · 4 · 8 · 16 s**; `estorno-c-7732` | sem `ROLLBACK` global, compensa-se |
| 20 | Event Sourcing | **1.800 ms × 13 ms** (snapshot); **2 h 47 min** de *replay* | o estado é a soma dos fatos |
| 21 | Resiliência | **1,67 s** (50 ÷ 30); **27**; **12.960** ruins/mês; **90 s**; *breaker* abre em **1,3 s** | falhar pequeno e rápido |
| 22 | Deployment | **R$ 54.000 × R$ 450**; **40 s × 90 s**; *flag* **≤ 30 s** | o raio = fração × tempo × custo |
| 23 | Capacity Planning | **14 · 10 · 15 · 2**; **41 vCPU**; **950** req/s; **200** pedidos/s | planejar antes do pico |
| 24 | Testes de Carga | **36/s** (hoje) × **~250/s** (plano); p95 ≤ **800 ms**, erros ≤ **0,1%** | plano sem teste é hipótese |
| 25 | Bulkhead | pool **20 → 16 + 4**; **33% e 10%** de `503`; raio **60% → 40%** | o bulkhead escolhe quem espera |
| 26 | Cell-Based | **4** células; veneno **7.200 × 2.880**; **41 → 53 vCPU** | a pilha inteira como compartimento |
| 27 | SPoF e DR | RTO **65 s** (30 + 35); RPO esperado **2,97**; o **1061** | o desastre é de região, e RPO é conta |
| 28 | Observabilidade | **43,2 min** (SLO 99,9%); **14,4×**; **1,9 s × 275 ms** | ver por pedido e decidir por orçamento |

### "Tire uma peça": o que quebra (a figura `falha`; os "e se der errado" ao contrário)
| se você tira… | o que quebra (com o número) | quem avisou |
|---|---|---|
| o **cache** (5) | o tempo médio vai de **5 ms** (h = 90%) a **41 ms** (8,2×) e o catálogo manda **640 req/s** à origem em vez de 128 | 5 e 21 |
| o **balanceador** (7) | os 9 primeiros pedidos vão a `catalogo-1`: CPU 100% e **20 ms → 1,8 s** | 7 |
| o **gateway** (8) | o app conhece 6 endereços; cada serviço faz login e *rate limit* do seu jeito; o robô de 500/s chega direto | 8 |
| o **lock distribuído** (11) | duas réplicas do `estoque` vendem o último gato duas vezes (estoque **−1**) | 11 |
| a **idempotência** (21) | o retry do `POST` cria **dois pedidos** e duas cobranças | 21 |
| as **réplicas** (17) | o `shard-1` cai e a Lena e a Bia **ficam sem pedidos**; um disco queimado leva o dado | 16 e 17 |
| o **outbox** (18) | o pedido é gravado e o evento **nunca sai** (dois sistemas, uma gravação) | 18 |
| o **breaker** e o *fallback* (21) | o PSP a 8 s enche o pool em **1,67 s** e leva o frete e o e-mail junto | 21 |
| o **canary** e a métrica de negócio (22) | o frete 0,00 dura **60 min**: **R$ 54.000** (e **R$ 486.000** se só o relatório das 23:00 achar) | 22 |
| o **bulkhead** do pool (25) | o relatório das 23:00 deixa **33%** do checkout e **10%** do status com `503` | 25 |
| o **roteador por célula** (26) | o veneno do `mkt-01` derruba os **3 pods** do `pedidos` em 150 ms: **7.200** tentativas, 100% | 26 |
| a **passiva** e o **DR** (27) | SP cai: com a passiva *warm* o RTO é **65 s** (**643,5** tentativas falham); **só com backup** o RTO é **~48 min** e custa R$ **2,28 mi** | 27 |
| a **observabilidade** (28) | o MTTD volta de **30 s** para **60 min**; a Lena espera **1,9 s** e ninguém sabe onde | 28 |

### O que o curso **corrigiu** nos textos-fonte (o recap das correções; usar em "Aprofundar")
1. **Módulo 5:** o exemplo de cache-aside do artigo usa `err == rdb.Nil` (não compila; é `redis.Nil`) e um `Set` com TTL `0`, que **guarda para sempre**, o oposto do que o próprio artigo defende sobre TTL.
2. **Módulo 12:** os bytes por chamada (REST × gRPC) deixaram de ser conta de biblioteca (204/95 B) e passaram a ser **medidos** num proxy que lê os quadros HTTP/2.
3. **Módulo 16:** o trecho do MurmurHash impresso no artigo lista 12 nomes e **não conta**; o resultado (7, 8, 9, 8, 7 = 39) é do repositório.
4. **Módulo 21:** o "jitter incremental" do artigo não é nenhum dos três algoritmos da AWS (*full*, *equal*, *decorrelated*); e o retry imediato é a **causa** da tempestade (45.500 chamadas para 1.000 clientes).
5. **Módulo 22:** o *Recreate* não é mais "a única saída" para consumidores Kafka (o *rebalance* cooperativo, KIP-429).
6. **Módulo 25:** a tabela de blast radius (1 ÷ N) vale só com tráfego **uniforme**; com o `mkt-01` o raio é a **maior fração** (60% → 40%).
7. **Módulo 26:** `(f/N)^k` é aproximação (a conta exata é **1 ÷ C(N,k)**) e a 3ª linha da tabela do artigo está **errada por 10×**.
8. **Módulo 27:** o RTO **conta da interrupção** (inclui o MTTD), e não "após a detecção".
9. **Módulo 28:** a latência dos quatro sinais **separa** sucesso e erro (o artigo as juntava).

## Aulas (7): uma por bloco; arquivos `aula-N-<slug>.mdx`
Cada aula abre com a ponte do problema anterior, segue o molde (**problema → peças em ordem com o porquê e o número → "tire uma peça" → "Você consegue?" → "Falta saber…"**) e **linka de volta** para cada módulo do bloco (o link interno, com `withBase('labs/<slug>/')`; sem repetir a aula, só a **frase-resumo** e o número). Texto **curto**: o módulo é revisão, não aula nova.
1. **a-loja-de-um-servidor** (módulos 1 a 5; links: `protocolos-de-rede`, `storage-raid-io`, `cap-acid-base`, `databases`, `cache`) — *Tese:* uma loja de um servidor só precisa de **cinco coisas** antes de pensar em escala: o dado **chegar**, o dado **ficar**, os bancos **concordarem**, o dado ser **achado** e a página ser **rápida**. *Peças:* a Lena abre o app (DNS → TCP → TLS → HTTP; 215 fatias; 80 ms de RTT), o `pedidos.db` num **RAID 10** (escrita de 2 I/Os) e as fotos em *object storage*, os 3 sites e o **quórum 2 em 3** (recusar ou aceitar), a tabela `pedidos` com o **1042** e o **índice B-Tree**, o **Redis** (h = 90% → 5 ms) e a **CDN** em Recife (89,90 → 79,90). *Tire uma peça:* o cache (5 → 41 ms). *Você consegue?* (1) desenhar a viagem da foto em 5 protocolos e dizer o que cada ida e volta custa; (2) escolher o RAID e justificar com os I/Os; (3) dizer o que o CAP obriga **na partição**; (4) dizer por que o índice ganha de 1 milhão de linhas e empata com 6; (5) calcular o tempo médio com o hit rate. *Falta saber:* a loja roda num programa só (8 vCPU) e às 23:00 o relatório **derruba tudo**: como partir sem quebrar? **Faça agora:** na figura `loja fundacoes`, desligue o cache e leia o tempo médio.
2. **partir-e-ligar** (6 a 10; `microsservicos`, `load-balancers`, `api-gateways`, `bff`, `service-mesh`) — *Tese:* partir o programa isola e escala só o que pesa, e **cada peça nova resolve o problema que a anterior criou** (a rede, o endereço, a porta, a tela, o padrão). *Peças:* 7 serviços (`catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas`, `relatorios`) cada um com o **seu banco** (180 → 200 ms; 25 × 80 vCPU; o **1047** e o `trace_id`), o **`lb-loja`** (203.0.113.10; algoritmos; *healthcheck* 15 s), o **`gw-loja`** (JWT, `401 × 403`, *rate limit*, `/v1` e `/v2`, o **1048**), os **BFFs** (480 → 150 ms; 180 → 12 KB; *fallback*), a **malha** (sidecar, mTLS, retry com regra; **27** chamadas se não houver). *Tire uma peça:* o gateway. *Você consegue?* (1) dizer onde cortar e quem decide; (2) por que o round robin "justo" cai em 2,7 s; (3) a diferença entre `401` e `403`; (4) por que a tela do app precisa de um BFF e o que ele faz quando o `recomendacoes` cai; (5) o que a malha resolve e o que não. *Falta saber:* sete serviços se chamam e mexem na **mesma linha**: quem leva o último gato? **Faça agora:** na figura `loja partir`, derrube o `relatorios` e depois o `entregas` e veja o que continua vendendo.
3. **conversar-e-disputar** (11 a 13; `concorrencia`, `comunicacao-sincrona`, `comunicacao-assincrona`) — *Tese:* quando os serviços conversam, há **dois problemas diferentes**: **disputar** o mesmo recurso (concorrência) e **esperar** a resposta (síncrono) ou **não esperar** (assíncrono), e cada escolha troca latência por acoplamento. *Peças:* o **último gato** (Bia × Caio, o **1049**; estoque −1; *mutex* no processo; **lock distribuído** no Redis; *deadlock*, *starvation*; 2 ms + 18 ms = 50/s; teto 500/s), a **síncrona** (REST/JSON × gRPC/Protobuf: **11 bytes**; o **webhook** do PSP no **1050**; *short* × *long polling*; WebSocket; GraphQL), a **assíncrona** (**Kafka**: `pedidos`, 3 partições, chave `pedido_id`, 4 eventos por pedido, 120/s na BF, o 1049 → `p0`; grupos `estoque`, `entregas` e `notificacoes`; **DLQ**; MQTT no caminhão; AMQP nos e-mails). *Tire uma peça:* o lock distribuído (−1). *Você consegue?* (1) dizer por que o mutex local não basta com 2 réplicas; (2) escolher entre REST e gRPC e dizer o que custa; (3) dizer quando o webhook vence o *polling*; (4) dizer o que decide a partição e por que a ordem só vale dentro dela; (5) dizer para que serve a DLQ. *Falta saber:* a loja funciona em dia comum; o que a **Black Friday** faz com ela? **Faça agora:** na figura `loja conversar`, mande Bia e Caio ao mesmo tempo, com e sem o lock.
4. **crescer-e-espalhar** (14 a 17; `performance`, `scale-cube`, `sharding`, `replicacao`) — *Tese:* crescer é **medir** (percentil, joelho, o elo mais fraco), **escolher o eixo** (X, Y ou Z), **partir por uma chave** (e ver onde esquenta) e **copiar** (e pagar latência ou dado). *Peças:* as 20:03 (média 135 e p95 800; a `catalogo-3` a 99% e a frota a 67,5%; o elo `pagamentos` 40/s; o banco 150/s; o **1052**), o **cubo** ((10, 9, 1) → (10, 9, 3); 90 → 150 → 200; o **1053**), os **3 *shards*** por `cliente_id` com `murmur3` (50 M linhas; o `mkt-01` a 40% → 60% no `shard-2` → 55,6%; `mod` 75,2% × anel 25,7%; *shuffle* 45 pares; o **1054** → `shard-1`), a **réplica** (SP primário; Rio e Recife; 2 · 12 · 82 ms; lag 300/800 ms; RPO 9/24; RTO 35 s; o **1055** que a Lena não vê). *Tire uma peça:* as réplicas. *Você consegue?* (1) dizer por que o painel de média engana e o que olhar; (2) ler o cubo e dizer em que eixo estamos; (3) escolher a chave do *shard* e dizer onde esquenta; (4) dizer o que o `mod 3 → 4` move; (5) escolher entre 2, 12 e 82 ms e dizer o que se paga em dado. *Falta saber:* a tela lê o **passado**, o pagamento aprovado não achou estoque e o PSP responde em 8 s: como o dado fica **certo sem uma transação só**? **Faça agora:** na figura `loja crescer`, ligue o `mkt-01` e leia a eficiência do cluster.
5. **consistencia-e-resiliencia** (18 a 21; `cqrs`, `saga`, `event-sourcing`, `resiliencia`) — *Tese:* sem uma transação global, a consistência vem de **três jeitos** (ler de outro modelo, compensar, guardar os fatos) e a loja continua de pé por **camadas** (idempotência, timeout, retry, *breaker*, *fallback*, degradação, *bulkhead* de saída). *Peças:* **CQRS** (`meus-pedidos`, o **outbox**, o projetor a 100 ev/s; 235 ms × 0,021 ms; o **1056**), a **saga** (`s-1057`; pagamento aprovado e estoque zerado → `estorno-c-7732`; orquestrada × coreografada; 85,5%; *backoff* 1-2-4-8-16 s; o **1057**), **Event Sourcing** (o stream `pedido-1047`; *replay*; *snapshot* 1.800 → 13 ms; 2 h 47 min), **Resiliência** (o PSP-A a 8 s; timeout **1 s** e o crítico de 1,67 s; retry com *full jitter*; 27 chamadas; *breaker* em 1,3 s; PSP-B; *bulkheads* 50/30/20; `Idempotency-Key`; o **1058**). *Tire uma peça:* a idempotência (dois pedidos). *Você consegue?* (1) explicar o outbox em uma frase; (2) dizer o que a saga faz quando o estoque falha depois do pagamento; (3) dizer a diferença entre o estado e o fato; (4) montar a cadeia de prazos (5 → 3 → 2,8 → 2,5 → 2,0 → 1,0 s) e dizer por quê; (5) dizer por que retry **sem** jitter piora. *Falta saber:* a loja aguenta o dia a dia; **publicar** uma versão nova é o maior risco que ela corre. **Faça agora:** na figura `loja consistencia`, derrube o PSP-A com e sem o *breaker*.
6. **mudar-planejar-testar-isolar** (22 a 25; `deployment`, `capacity-planning`, `testes-de-carga`, `bulkhead`) — *Tese:* a causa mais comum de incidente é a **mudança**, e as quatro peças deste bloco **antecipam** o incidente (publicar com raio pequeno, planejar o pico, **testar o plano**, e dividir o que é compartilhado). *Peças:* **deploy** (`pedidos` 2.4.0 → 2.5.0; frete 0,00 em Recife; *recreate* 40 s, *rolling* 90 s, *blue/green*, *canary* 10 → 50 → 100%; R$ 54.000 × 450; *shadow*, *flag* `frete_v2`, anéis; o **1059**), **capacidade** (BF de 26/11/2027; 14 · 10 · 15 · 2 = 41 vCPU; Little; ρ alvo 70%), **testes de carga** (k6; "hoje" 36/s, "plano" ~250/s; metas p95 ≤ 800 ms e erros ≤ 0,1%; o cenário misto acha o relatório das 23:00), **bulkhead** (pool 20 → 16 + 4; 33% e 10% de `503`; raio 60% → 40%; lanes 12 · 6 · 2; o teto de 100 req/s do `mkt-01`). *Tire uma peça:* o teste misto (o relatório só aparece em produção). *Você consegue?* (1) dizer o raio de um deploy (fração × tempo × custo); (2) calcular réplicas com Little e o ρ alvo; (3) desenhar um teste de carga e dizer o que ele **não** prova; (4) dividir um pool e dizer o que o batch perde; (5) dizer por que a tabela 1 ÷ N engana. *Falta saber:* um bulkhead separa recursos **dentro** de uma pilha; e se a pilha inteira fosse dividida? **Faça agora:** na figura `loja operar`, publique a 2.5.0 por *canary* e por *rolling* e compare as perdas.
7. **celulas-desastre-e-sinais** (26 a 28; `cell-based`, `disaster-recovery`, `observabilidade`) — *Tese:* o último bloco **não adiciona uma funcionalidade**: ele diz **onde a falha pode chegar** (células), **como se volta** quando uma região cai (DR) e **como se sabe** (observabilidade). *Peças:* **4 células** (`celula-sp` 33%, `celula-rio` 15%, `celula-recife` 12%, `celula-mkt` 40%; roteador e mapa; o veneno 7.200 × 2.880; 41 → 53 vCPU; passivas; *shuffle* 2 de 10; o **1060**), **SPoF e DR** (a auditoria de 12 elos e 5 SPoFs; a queda de SP: MTTD 30 s + MTTR 35 s = **RTO 65 s**; RPO 2,97; ativo-ativo, ativo-passivo, *pilot light*, backup; R$ 2,28 mi × 28 mil; o **1061** perdido e reutilizado), **observabilidade** (os três sinais; o **1063** de 1,9 s; histograma; `traceparent`; alertas; SLI → SLO 99,9% → SLA 99,5%; 43,2 min; 14,4×; USE, RED e quatro sinais). *Tire uma peça:* a observabilidade (MTTD de 30 s a 60 min). *Você consegue?* (1) desenhar uma célula e dizer o que ela **não** pode compartilhar; (2) dizer o que o RTO inclui e o que o RPO mede; (3) escolher a estratégia de DR com o custo da falha; (4) dizer a ordem *que → onde → por quê* (métrica → trace → log); (5) calcular um orçamento de erro. ***Falta saber (fim do módulo):*** a loja **não tem** (de propósito) **segurança** além do JWT (segredos, identidade, LGPD), **custo** (o *FinOps* da conta de 53 vCPU), **dados analíticos e busca** (*data lake*, índice de texto) nem **aprendizado de máquina** (as recomendações). Cada um é um capítulo novo. **Agora é com você:** pegue um dos `cases/` do repositório do autor (`BASICO_CHECKOUT_LIVRARIA` ou `INTERMEDIARIO_ESTOQUE`) e **desenhe do zero**, na ordem, com o mesmo molde. **Faça agora:** na figura `loja tudo`, acenda os 7 blocos e derrube uma peça por bloco.

## A prova final: o quiz geral (80 perguntas; o banco canônico)
**Formato:** 80 perguntas de **múltipla escolha** (4 opções, uma certa; as pegadinhas na coluna), **embaralhadas**, **cada uma marcada com o módulo de origem** (os números); a nota sai **por bloco** (os 7) e **geral**; **abaixo de 70% num bloco** o quiz mostra o link do módulo para **revisar**. Faixas (sem certificado): **≥ 90%** (72 ou mais): "pode explicar a loja sem olhar"; **70% a 89%** (56 a 71): "revise os blocos abaixo de 70%"; **< 70%**: "volte ao bloco mais baixo e refaça o 'Você consegue?'". As perguntas **misturam módulos** (as últimas 10 atravessam vários). Todas as respostas vêm das constantes dos briefs.
| # | bloco · módulos | pergunta | resposta certa | pegadinhas |
|---|---|---|---|---|
| 1 | 1 · M1 | A foto de 313 KB, em segmentos de até 1.460 B, vira quantas fatias? | **215** | 150; 313; 1.460 |
| 2 | 1 · M1 | Quanto custa cada ida e volta Recife–SP na história? | **80 ms** | 8 ms; 800 ms; 10 ms |
| 3 | 1 · M2 | O D2 queima num RAID 0 de 4 discos. O que acontece com o `pedidos.db`? | **perde-se tudo (sem redundância, cada bloco só existe num disco)** | só um quarto; recupera pela paridade |
| 4 | 1 · M2 | Quantos I/Os custa uma escrita pequena no RAID 5? | **4** | 1; 2; 6 |
| 5 | 1 · M2 | O que o RAID 6 tem a mais que o RAID 5, e o que paga? | **segunda paridade (Q): tolera 2 discos, escrita pequena de 6 I/Os** | espelho; 2 I/Os |
| 6 | 1 · M3 | Os três bancos (SP, Rio, Recife) perdem a rede entre si. O CAP obriga a escolher entre… | **consistência e disponibilidade (durante a partição)** | consistência e partição; latência e custo |
| 7 | 1 · M3 | Com 3 sites, qual é a maioria (quórum)? | **2** | 3; 1; 4 |
| 8 | 1 · M4 | Por que a B-Tree empata com a varredura em 6 linhas e ganha em 1 milhão? | **acha a linha em poucas leituras de página; com 6 linhas tudo cabe numa página** | é sempre mais rápida; só vale para texto |
| 9 | 1 · M5 | Hit rate de 90%, cache 1 ms e banco 41 ms: tempo médio? | **5 ms** | 41 ms; 1 ms; 20 ms |
| 10 | 1 · M5 | Três réplicas, três *hashmaps*, três preços. O que resolve? | **cache compartilhado (Redis) ou invalidação por TTL** | mais réplicas; mais RAM |
| 11 | 2 · M6 | O checkout de 180 ms com 4 saltos de 5 ms passa a levar… | **200 ms** | 185 ms; 380 ms; 20 ms |
| 12 | 2 · M6 | Na Black Friday, 10 cópias do monolito (8 vCPU) × os microsserviços: | **80 × 25 vCPU** | 8 × 10; 25 × 80 |
| 13 | 2 · M7 | Round robin, 3 réplicas, 3 buscas de 900 ms em P2, P5 e P8: | **todas caem na mesma réplica (2,7 s de trabalho)** | uma em cada; ficam 300 ms cada |
| 14 | 2 · M7 | *Healthcheck* a cada 5 s com 3 falhas seguidas tira a réplica em… | **15 s** | 5 s; 3 s; 30 s |
| 15 | 2 · M8 | Sem token e token válido sem o escopo: os status? | **401 e 403** | 403 e 401; 400 e 404 |
| 16 | 2 · M8 | Depois de validar o JWT o gateway repassa ao serviço… | **`X-Cliente-Id: lena-77`** | a senha; o token inteiro |
| 17 | 2 · M9 | A tela inicial do app sem BFF: 4 chamadas de 120 ms. Total e peso? | **480 ms e 180 KB** | 120 ms e 12 KB; 150 ms |
| 18 | 2 · M9 | O `recomendacoes` cai. O `bff-app` espera 100 ms e… | **responde sem a seção (`"recomendado": []`)** | devolve 500; espera 8 s |
| 19 | 2 · M10 | 3 camadas, 3 tentativas cada: chamadas ao `pagamentos` por clique? | **27** | 9; 6; 3 |
| 20 | 2 · M10 | 30 sidecars a 0,1 vCPU e 50 MB: | **3 vCPU e 1,5 GB** | 0,1 vCPU; 30 vCPU |
| 21 | 3 · M11 | O `estoque` gasta 2 ms de CPU e 18 ms de espera: um pedido por vez e o teto? | **50/s e 500/s** | 500/s e 50/s; 20/s |
| 22 | 3 · M11 | Bia e Caio querem o último gato. Quem leva e o que o outro recebe? | **quem pegar o lock primeiro (a Bia, o 1049); o outro, `409`** | os dois; ninguém |
| 23 | 3 · M11 | Com 2 réplicas do `estoque`, o *mutex* local basta? | **não: são 2 processos, 2 memórias; precisa de lock distribuído** | sim; só com 1 vCPU |
| 24 | 3 · M12 | O pedido 1050 em Protobuf (sem o cabeçalho gRPC) tem quantos bytes? | **11** | 53; 210; 5 |
| 25 | 3 · M12 | Como o PSP avisa que o Pix do Davi caiu sem a loja perguntar? | **webhook** | *short polling*; WebSocket |
| 26 | 3 · M13 | Em qual partição cai o pedido 1049 (3 partições)? | **`p0`** | `p1`; `p2` |
| 27 | 3 · M13 | Black Friday: eventos por segundo no tópico e por partição? | **120/s e 40/s** | 30/s e 10/s; 4/s |
| 28 | 3 · M13 | Para que serve a DLQ? | **guardar a mensagem que não se consegue processar, para o consumidor seguir** | acelerar o consumo; criptografar |
| 29 | 4 · M14 | Média 135 ms e p95 800 ms: qual número engana? | **a média** | o p95; o p99 |
| 30 | 4 · M14 | Por que a frota está a 67,5% e uma réplica a 99%? | **(9 × 64 + 99) ÷ 10 = 67,5: a média esconde a quente** | a frota está errada |
| 31 | 4 · M14 | Qual é o elo mais fraco do checkout e o teto final? | **`pagamentos` (40/s) e o banco do `pedidos` (150/s)** | `estoque`; o catálogo |
| 32 | 4 · M15 | No cubo, X, Y e Z são… | **clonar (réplicas), partir por função (serviços), partir por dado/cliente** | CPU, RAM e disco |
| 33 | 4 · M16 | `murmur3('lena-77') mod 3` leva a Lena para… | **`shard-1`** | `shard-0`; `shard-2` |
| 34 | 4 · M16 | O `mkt-01` a 40% das linhas: fração do shard quente e eficiência? | **60% e 55,6%** | 40% e 100%; 33% e 66% |
| 35 | 4 · M16 | Passar de 3 para 4 shards: `mod` × anel (hash consistente) movem… | **~75% × ~25%** | 25% × 75%; 100% × 0% |
| 36 | 4 · M17 | Latência de commit assíncrona, semi e síncrona (SP–Rio–Recife)? | **2, 12 e 82 ms** | 2, 10 e 80; 12, 82 e 2 |
| 37 | 4 · M17 | Lag de 800 ms em Recife a 30 pedidos/s: pedidos em risco no failover? | **24** | 9; 800; 0,8 |
| 38 | 4 · M17 | Por que a Lena não vê o 1055 em "meus pedidos"? | **lê a réplica de Recife, 800 ms atrás** | o pedido falhou; o cache expirou |
| 39 | 5 · M18 | Em CQRS, de onde a tela "meus pedidos" lê? | **do modelo de leitura (`meus-pedidos`)** | do PostgreSQL de escrita; do Kafka |
| 40 | 5 · M18 | Para que serve o *outbox*? | **gravar o evento na mesma transação do pedido** | acelerar a leitura; criptografar |
| 41 | 5 · M19 | Pagamento aprovado e o estoque falha: a saga faz… | **compensa (estorno do pagamento)** | `ROLLBACK` global; ignora |
| 42 | 5 · M19 | Orquestrada × coreografada: | **um maestro decide × cada serviço reage a eventos** | síncrona × assíncrona |
| 43 | 5 · M19 | 10% de falha no estoque e 5% no pagamento: chance de sucesso? | **85,5%** | 85%; 95%; 90% |
| 44 | 5 · M20 | Em *event sourcing*, o estado do pedido 1047 é… | **o resultado de reaplicar os eventos do stream `pedido-1047`** | a última linha da tabela |
| 45 | 5 · M20 | Com *snapshot* a cada 1.000 eventos a rehidratação de ~1.800 ms vai a… | **~13 ms** | 1.800 ms; 0 ms |
| 46 | 5 · M21 | Pool de 50 conexões a 30 req/s: o *timeout* crítico? | **50 ÷ 30 = 1,67 s** | 2 s; 8 s; 30 s |
| 47 | 5 · M21 | Retry exponencial **sem** jitter, 1.000 clientes: | **ondas sincronizadas (só 4% concluem no prazo)** | espalha a carga |
| 48 | 5 · M21 | O *breaker* do PSP-A a 8 s abre depois de quanto tempo? | **1,3 s** | 30 s; 90 s |
| 49 | 6 · M22 | A 2.5.0 devolve `201` com frete 0,00 em Recife. O que pega? | **uma métrica de negócio (`frete_zero` por cidade)** | o healthcheck; a taxa de 5xx |
| 50 | 6 · M22 | Perda do *rolling* × a do *canary* 10%: | **R$ 54.000 × R$ 450** | R$ 0 × R$ 54.000 |
| 51 | 6 · M22 | O rollback devolve os pedidos gravados com frete 0,00? | **não: troca o código, não o dado** | sim |
| 52 | 6 · M23 | O plano de 2027 (`catalogo`, `pedidos`, `pagamentos`, `estoque`): | **14 · 10 · 15 · 2 = 41 vCPU** | 10 · 3 · 2 · 2 = 17 |
| 53 | 6 · M23 | Lei de Little: L = | **λ × W** | λ ÷ W; W ÷ λ |
| 54 | 6 · M23 | Por que o ρ alvo é 70% e não 100%? | **perto do joelho a espera explode** | custa mais |
| 55 | 6 · M24 | No k6 a loja "hoje" quebra em quanto, e o plano? | **36/s e ~250/s** | 250/s e 36/s |
| 56 | 6 · M24 | O cenário misto do k6 achou… | **o relatório das 23:00 disputando o pool** | o frete 0,00 |
| 57 | 6 · M25 | Pool de 20 com o relatório (40,4 pedidas): com 16 + 4 o cliente… | **0% de `503` (o batch é quem espera)** | 33% de `503` |
| 58 | 6 · M25 | O raio do shard quente: 60%; com o shard dedicado ao `mkt-01`: | **40%** | 20%; 33,3% |
| 59 | 7 · M26 | Shard × *bulkhead* × célula dividem, respectivamente: | **o dado × os recursos × a pilha inteira** | só CPU, RAM, disco |
| 60 | 7 · M26 | O veneno do `mkt-01` em 4 min: tentativas perdidas, pilha única × células? | **7.200 × 2.880** | 2.880 × 7.200 |
| 61 | 7 · M26 | O plano de 2027 em 4 células custa… | **53 vCPU (+12; +29,3%)** | 41; 164 |
| 62 | 7 · M26 | De 4 para 5 células, o `hash mod N` move… | **~80% (o anel ~20%; a tabela só quem se mover)** | 20% |
| 63 | 7 · M26 | *Shuffle* de 2 em 10 células: um par inteiro caído atinge… | **1 ÷ 45 = 2,2% dos clientes** | 20% |
| 64 | 7 · M27 | A queda de SP: MTTD 30 s e MTTR 35 s. O RTO é… | **65 s (conta da interrupção)** | 35 s; 30 s |
| 65 | 7 · M27 | RPO esperado da `celula-sp` (9,9 pedidos/s, lag 300 ms): | **2,97 pedidos** | 0; 9,9 |
| 66 | 7 · M27 | Por que o número 1061 apareceu em dois pedidos? | **a sequência do banco promovido reusou o último valor replicado** | bug do PSP |
| 67 | 7 · M28 | SLO de 99,9% em 30 dias dá quantos minutos de orçamento? | **43,2** | 4,32; 432 |
| 68 | 7 · M28 | *Burn rate* de 14,4× em 1 h consome… | **2% do orçamento** | 14,4%; 100% |
| 69 | 7 · M28 | USE, RED e os quatro sinais olham, respectivamente: | **o recurso, o serviço e o que o usuário sente** | o oposto |
| 70 | 7 · M28 | Com 30% de falha rápida (2 ms) e 70% a 275 ms, a latência média cai a… | **~193 ms (por isso separar sucesso e erro)** | 275 ms |
| 71 | integr. · M8 M16 M26 | O 1060 da Lena não sente o veneno do `mkt-01`. Por quê? | **o roteador lê o `cliente_id`; cada célula é uma pilha própria** | o gateway filtra |
| 72 | integr. · M2 M17 M27 | RAID, réplica e célula passiva protegem, na ordem, contra a queda de… | **um disco, um servidor e uma região** | só do dado |
| 73 | integr. · M6 M24 M25 | Por que o relatório das 23:00 aparece três vezes na história? | **vizinho barulhento: derrubou o monolito (6), o teste misto o achou (24), o bulkhead o isolou (25)** | é um bug |
| 74 | integr. · M17 M26 | O commit semi-síncrono (12 ms) e o 2PC SP + Rio (24 ms) vêm de… | **o RTT de 10 ms (2 + 10 = 12 e 2 × 10 + 2 × 2 = 24)** | do disco |
| 75 | integr. · M5 M21 | O catálogo a 640 req/s com 80% de acerto manda à origem… | **128 req/s (sem cache seriam 640)** | 512; 0 |
| 76 | integr. · M21 M28 | 90 s de PSP lento sem proteção queimam quanto do orçamento de 12.960? | **2.700 = 20,8%** | 90; 2,7% |
| 77 | integr. · M7 M21 M25 M26 M27 | Ligue a falha à defesa: pod travado · PSP lento · relatório · veneno · região | **healthcheck · breaker e fallback · bulkhead · célula · DR** | a ordem trocada |
| 78 | integr. · M14 M23 | Na Black Friday de 2027, o que escalar primeiro (30 → 200 pedidos/s)? | **`pagamentos` e o banco (os elos mais fracos)** | o catálogo |
| 79 | integr. · M27 M28 | RPO e RTO são… e MTTD, MTTR e MTBF são… | **objetivos (contratuais) · medidas** | o contrário |
| 80 | integr. · M6 M28 | O `trace_id` do 1047 liga o quê, e por que não vira rótulo de métrica? | **logs e traces de 5 serviços; é de cardinalidade ilimitada (33,3 bilhões de séries com `cliente_id`)** | liga métricas |
**Notas do banco:** as perguntas 9, 21, 37, 43, 46, 65, 67, 70 e 76 pedem um cálculo de um passo (a resposta tem que ser **calculável** com os números da história); as pegadinhas são os **erros comuns** de cada módulo. **Uso:** o quiz sorteia **as 80** (ordem aleatória) ou um **modo curto de 20** (as 10 integradoras + 10 do bloco mais fraco). Todas as respostas foram conferidas **contra as constantes dos briefs**; qualquer mudança de número num módulo muda a pergunta aqui.

## Widgets 2D (Sonnet)
- **Monte a loja (a ordem):** os 28 módulos como cartões embaralhados; arrastar para a ordem certa; cada acerto mostra o **problema que o módulo resolveu** e o **número**; no fim o placar de ordem (como o quiz, sem nota oficial).
- **Tire uma peça:** a lista de 13 peças (a tabela "tire uma peça"); escolher uma e ver **o que quebra**, o **número** e **o módulo** que avisou.
- **Os 14 saltos do 1060:** a lista dos saltos, com o módulo que criou cada um; esconder o nome do módulo e **adivinhar**.
- **Cola dos 28 números:** os flashcards (frente: módulo + problema; verso: o número e o que significa), com "sabia / não sabia" e o contador por bloco.
- **Cálculos de relance:** seis contas curtas dos módulos (tempo médio do cache; vazão do `estoque`; timeout crítico; perda por RPO; orçamento de erro; *shuffle* 1 ÷ C(N,k)), cada uma com os números da história pré-preenchidos.
- **Nota por bloco:** o resultado do quiz por bloco (7 barras) e o link do módulo a revisar nos blocos abaixo de 70%.

## Figuras 3D (Opus) e modes
### `loja-3d` (aulas 1 a 7 e a prova final): o mapa da loja inteira
A **loja** como um **mapa isométrico** que cresce por **camadas**, na ordem da história; cada peça tem o **nome real** (`catalogo`, `lb-loja`, `gw-loja`, `bff-app`, `edge-loja`, `celula-recife`…), o **número do módulo** numa etiqueta pequena e a cor **grafite** (apagada) ou **sódio** (a do bloco em foco). A ficha da **Lena** (o 1060) percorre o caminho. Painel com: **o problema do bloco**, **a peça**, **o número** e o link do módulo.
Componentes (todos já existem nas figuras dos módulos):
- **Bloco 1:** o app da Lena e a conexão (DNS, TCP, TLS; 1), o servidor `loja` com o RAID 10 e o *object storage* (2), os 3 sites SP/Rio/Recife (3), o PostgreSQL com `pedidos` (4), o Redis e a CDN de Recife (5).
- **Bloco 2:** os 7 serviços (6), o `lb-loja` com as réplicas (7), o `gw-loja` (8), os 3 BFFs (9), os sidecars e o plano de controle da malha (10).
- **Bloco 3:** o *lock* no `estoque` (11), as setas síncronas, o webhook e o WebSocket (12), o Kafka, a DLQ, o MQTT e o RabbitMQ (13).
- **Bloco 4:** o HPA e as metas (14), os eixos do cubo (15), os 3 *shards* e o dedicado (16), o primário e as réplicas (17).
- **Bloco 5:** o `meus-pedidos`, o outbox e o CDC (18), a saga (19), o *event store* e os snapshots (20), o *breaker*, o PSP-B, a idempotência e os *bulkheads* de saída (21).
- **Bloco 6:** o pipeline com anéis, *canary* e *flags* (22), o plano de 41 vCPU (23), o k6 (24), o pool 16 + 4, as lanes e o teto do `mkt-01` (25).
- **Bloco 7:** o `edge-loja` e as 4 células com as passivas (26), as sondas, a promoção e o runbook (27), os logs, métricas, traces, o SLO e o alerta (28).
modes: `fundacoes` (aula 1), `partir` (2), `conversar` (3), `crescer` (4), `consistencia` (5), `operar` (6), `celulas` (7; as 4 células, a queda de SP e o 1061), `tudo` (todas as camadas acesas e a ficha do 1060 percorrendo os 14 saltos), `falha` (a prova final e as aulas: **clique numa peça para derrubá-la** e ver a mancha, o número e o módulo que previa, a tabela "tire uma peça"; e se der errado: derrubar o **roteador** e o **mapa** ao mesmo tempo mostra que o `edge-loja` é o teto de disponibilidade). Cada modo **acende o bloco** e **mantém os anteriores acesos em grafite**: a loja inteira nunca fica ilegível; no celular, a prévia mostra o modo `tudo`.
Marcadores no MDX: `{/* FIG:loja mode=fundacoes */}` etc. Aula 1: `loja fundacoes`; 2: `loja partir`; 3: `loja conversar`; 4: `loja crescer`; 5: `loja consistencia`; 6: `loja operar`; 7: `loja celulas` e `loja tudo`; Prova final: `loja falha`.

## Constantes novas (registrar na história-mestre)
**Nenhum pedido novo** (o módulo **reusa o 1060**); **7 blocos** (1–5, 6–10, 11–13, 14–17, 18–21, 22–25, 26–28); **80 perguntas** (70 por bloco, 10 integradoras); faixas **≥ 90% · 70% a 89% · < 70%** (72 · 56 a 71 · < 56 acertos); **os 14 saltos do 1060**; **os 28 números**; **13 peças** em "tire uma peça"; **9 correções** recapituladas. Tudo o mais vem dos módulos 1 a 28.

## Correções ao artigo
Não há artigo-base. **Correções dos módulos anteriores** (recapituladas acima, a título de "Aprofundar"): módulos 5, 12, 16, 21, 22, 25, 26, 27 e 28. Registrar em `docs/fontes/provas-finais.md` **só os links** dos briefs.

## Fontes por aula (2 a 6 links por aula; priorizar o próprio estudo > fonte primária)
- Em **todas as aulas**: os links internos dos módulos do bloco (`withBase('labs/<slug>/')`): 1: `protocolos-de-rede`, `storage-raid-io`, `cap-acid-base`, `databases`, `cache`; 2: `microsservicos`, `load-balancers`, `api-gateways`, `bff`, `service-mesh`; 3: `concorrencia`, `comunicacao-sincrona`, `comunicacao-assincrona`; 4: `performance`, `scale-cube`, `sharding`, `replicacao`; 5: `cqrs`, `saga`, `event-sourcing`, `resiliencia`; 6: `deployment`, `capacity-planning`, `testes-de-carga`, `bulkhead`; 7: `cell-based`, `disaster-recovery`, `observabilidade`.
- Externos (só como "Aprofundar", nas aulas 4 a 7 e na prova final): Google SRE book (sumário) e SRE Workbook (sumário); AWS Builders' Library; AWS Well-Architected; Azure Architecture Center (padrões e *Well-Architected*); Fowler, *Patterns of Distributed Systems*.
- Depois do módulo (aula 7 e prova final): os `cases/` do repositório do autor (`BASICO_CHECKOUT_LIVRARIA`, `INTERMEDIARIO_ESTOQUE`, `INTERMEDIARIO_SAGA`, `AVANCADO_RESERVA_ONLINE`).

## Vocabulário fixo
"bloco" (um conjunto de módulos), "peça" (um componente da loja), "o mapa" (a figura-mapa), "tire uma peça" (o exercício), "Você consegue?" (a autoavaliação de 5 itens), "a prova final" (o quiz geral; **não** "exame oficial" nem "certificado"), "integradora" (a pergunta que mistura módulos), "os 28 números" (a cola). Os nomes e termos de cada módulo ficam **como estão no vocabulário** do brief dele (ex.: "raio de explosão", "célula passiva", "RTO", "orçamento de erro"). Personagens: a **Lena** (o 1060), o `mkt-01` (o veneno), a Bia e o Davi (o 1061 e o 1049), o Caio (o último gato). **Não** introduzir peça, número ou personagem que não exista num módulo anterior. **Não** citar curso, aula paga, exame ou certificado de terceiros.

## Links conferidos em 21/10/2026 (HTTP 200; só estes entram no bloco "Fontes")
- Repositório do autor: https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/cases · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/BASICO_CHECKOUT_LIVRARIA.md · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/INTERMEDIARIO_ESTOQUE.md · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/INTERMEDIARIO_SAGA.md · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/blob/main/cases/AVANCADO_RESERVA_ONLINE.md
- Livros e catálogos abertos: https://sre.google/sre-book/table-of-contents/ · https://sre.google/workbook/table-of-contents/ · https://aws.amazon.com/builders-library/ · https://aws.amazon.com/architecture/well-architected/ · https://learn.microsoft.com/en-us/azure/architecture/patterns/ · https://learn.microsoft.com/en-us/azure/well-architected/ · https://martinfowler.com/articles/patterns-of-distributed-systems/
- Os links dos módulos 1 a 28 ficam **nos briefs deles** (cada um tem a sua lista conferida); aqui só entram os acima.
- Sem link verificável: nenhum livro citado.
- Contas: as 80 respostas foram conferidas **contra as constantes dos briefs e da história-mestre** (e as de um passo, recalculadas: 0,9 × 1 + 0,1 × 41 = 5; 50 ÷ 30 = 1,67; 0,9 × 0,95 = 0,855; (9 × 64 + 99) ÷ 10 = 67,5; 9,9 × 0,3 = 2,97; 0,3 × 2 + 0,7 × 275 = 193,1; 2.700 ÷ 12.960 = 20,8%; 1 ÷ 45 = 2,2%; 30 × 0,8 = 24; 0,001 × 43.200 = 43,2; conferidos no Python em 21/10/2026). **Não foram rodados** os quizzes (o banco é **texto**: a implementação, a ordem aleatória e a nota por bloco são do conteúdo).
