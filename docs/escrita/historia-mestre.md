# História-mestre do SDLabs (a loja da Lena, do módulo 1 ao 29)

Cada módulo é um capítulo do mesmo problema: **a loja que vende o gato de pelúcia cresce, e cada crescimento quebra alguma coisa**. Este arquivo é a espinha. Todo brief novo parte daqui e, quando um módulo muda um número que outro usa, este arquivo é atualizado junto (PREMISSAS 8 e 15b).

## Elenco e constantes
- **Lena** (Recife), a cliente-estrela; **Bia** (SP), **Caio** (Rio), **Davi** (SP), outros clientes; cidades SP, Rio, Recife.
- **A loja**: `loja.com.br`. Produto-estrela: **gato de pelúcia, produto 42** (preço 89.90 até o módulo 5; **79.90** a partir da promoção do módulo 5). Caneca azul é o produto 7 (19.90).
- Banco: PostgreSQL `loja` (módulo 4), tabela `pedidos`. Redis (módulo 5). CDN com edge em Recife (módulo 5).
- Times (módulo 6): **Vitrine** (catálogo, busca), **Checkout** (carrinho, pedidos, pagamentos), **Logística** (estoque, entregas).
- Serviços (módulo 6): `catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas`, `relatorios` (+ `recomendacoes`, `clientes`, BFFs a partir dos módulos 8–9).
- Porta de entrada (módulos 7–8): `lb-loja` (203.0.113.10), `gw-loja` (`api.loja.com.br`).
- Frete padrão para Recife: **15.00**. Frete SP **9.00** (módulo 11). Frete Rio **12.00** (módulo 15).
- Clientes (`cliente_id`): `lena-77` (módulo 8), `davi-12` (módulo 8), `bia-31`, `caio-58` e `mkt-01` (o marketplace parceiro do módulo 8; 40% da tabela `pedidos`) a partir dos módulos 15–16.
- Números de capacidade (módulos 14–16): catálogo **100 req/s por réplica** (10 ms de CPU + 10 ms de espera); checkout em pedidos/s: `pedidos` 90, `pagamentos` 40, `estoque` 1.000, banco do `pedidos` **150**; Black Friday dia comum 5 pedidos/s e pico 30/s; pico do catálogo **640 req/s**; meta p95 ≤ 300 ms.
- Rede entre sites (módulos 14 e 17): RTT SP–Rio **10 ms**, SP–Recife **80 ms** (o "~80 ms síncrona" do módulo 3); commit local **2 ms**; servidores `pg-sp`, `pg-rio`, `pg-recife`.
- A tabela `pedidos` do módulo 16: **50 milhões de linhas** (2 KB cada), 3 shards por `cliente_id` com murmur3 (`shard-0..2`).

## Numeração de pedidos (não repetir)
| Pedido | Módulo | O quê |
|---|---|---|
| 1041–1046 | 4 | tabela de exemplo (1042 = Lena, gato, 89.90) |
| 1047 | 6 | Lena, gato 79.90 + frete 15.00 = 94.90 (estoque do gato 3 → 2) |
| 1048 | 8–10 | Lena pelo app, mesmo valor 94.90 (estoque 2 → 1) |
| 1049 | 11 | Bia × Caio disputando o último gato (estoque 1 → 0); Bia leva: gato 79.90 + frete SP 9.00 = 88.90; o Caio recebe `409` e não consome número |
| 1050 | 12 | Davi (caneca azul 19.90 + frete SP 9.00 = 28.90) paga com Pix por PSP externo (webhook, cobrança `c-7731`) |
| 1051 | 13 | Lena, 2 canecas azuis 39.80 + frete 15.00 = 54.80; eventos `e-901` a `e-904` no tópico `pedidos` do Kafka (estoque da caneca 40 → 38) |
| 1052 | 14 | Davi, Black Friday 20:03:30: 3 camisetas pretas 147.00 + frete SP 9.00 = 156.00 (a 1ª tentativa deu `504` de 2,1 s e não consumiu número) |
| 1053 | 15 | Caio, 20:05: 1 caneca azul 19.90 + frete Rio **12.00** = 31.90 (estoque da caneca 38 → 37); atravessa os 3 eixos do cubo |
| 1054 | 16 | Lena, 20:08: 1 camiseta preta 49.00 + frete Recife 15.00 = 64.00; `murmur3('lena-77') mod 3 = 1` → `shard-1` |
| 1055 | 17 | Lena, 20:10:00.000: 1 caneca azul 19.90 + frete Recife 15.00 = 34.90 (estoque 37 → 36); a réplica de Recife, 800 ms atrás, não mostra o pedido |
| 1056 | 18 | Lena, Black Friday 20:12:00.000: 1 gato 79.90 + 1 caneca azul 19.90 + frete Recife 15.00 = **114.80** (estoque do gato 20 → 19, reposição de Black Friday; caneca 36 → 35); eventos `e-1801`…`e-1805`; a tela "meus pedidos" lê do modelo de leitura (o 1056 do módulo 17 era só uma colisão hipotética) |
| 1057 | 19 | Davi, 20:15:00.000: 1 camiseta preta 49.00 (produto 15, `CAMISETA-015`) + frete SP 9.00 = **58.00**, Pix (cobrança `c-7732`); a Logística zera o estoque por avaria às 20:15:10; pago às 20:15:41.2; saga cancelada e estornada em 44,95 s; eventos `e-1901`…`e-1905` |
| (1047) | 20 | o módulo 20 **reusa o 1047** do módulo 6 como streams `pedido-1047` (`e-501`, `e-502`, `e-504`, `e-505`) e `estoque-GATO-042` (`e-503`); **não consome número** |
| 1058 | 21 | Caio, 20:20:04: 3 canecas azuis 59.70 + frete Rio 12.00 = **71.70**, cartão (estoque da caneca 35 → 32); o PSP-A responde em 8 s das 20:20:00 às 20:21:30; eventos `e-2101`…`e-2103` (`e-2102` duplicado) |
| 1059+ | 22 em diante | um novo por módulo, registrado aqui (o "1059" do módulo 21, aula 5, é só o pedido **hipotético** criado por um retry sem chave de idempotência; não é pedido da história) |

## Capítulos
1. **Protocolos de Rede**: a Lena manda a foto do gato ao irmão; a viagem do dado pela rede (OSI, TCP/UDP, TLS, DNS, DHCP, HTTP).
2. **Storage, RAID e I/O**: a loja guarda `pedidos.db` e as fotos de produto; disco que queima.
3. **CAP, ACID, BASE**: a loja em SP/Rio/Recife; partição de rede; a compra do gato precisa ser atômica.
4. **Databases**: a tabela `pedidos`, modelos de dados e índices; achar o pedido 1042.
5. **Cache**: a página do gato fica lenta; Redis, TTL, CDN; preço vira 79.90.
6. **Microsserviços, Monolitos e Domínios**: o programa único quebra (relatório das 23:00, Entregas derruba tudo); partir por domínio; pedido 1047; eventos `PedidoCriado`…
7. **Load Balancers**: 3 réplicas do catálogo; quem atende a Lena; algoritmos; healthcheck; Envoy.
8. **API Gateways**: app e parceiro; porta única; JWT; robô de 500/s; token bucket; v1/v2; Kong; pedido 1048.
9. **BFF**: a tela inicial do app junta 4 serviços; `bff-app`, `bff-web`, `bff-voz`.
10. **Service Mesh**: 6 serviços com retry/TLS/métrica cada um do seu jeito; sidecar, mTLS, ambient.
11. **Concorrência e Paralelismo**: resta **1** gato; Bia e Caio clicam "comprar" no mesmo instante → race condition (estoque −1). Mutex no processo; com 2 réplicas do `estoque`, mutex local não basta → lock distribuído no Redis. Deadlock (reserva × estorno), starvation, spinlock, semáforo e thread pool (o pool de conexões do PostgreSQL). Analogia do churrasco do artigo pode ficar, com a loja como caso principal.
12. **Comunicação Síncrona**: `pedidos → pagamentos` em REST/JSON vs gRPC/Protobuf (bytes reais); o PSP avisa o pagamento do pedido 1050 do Davi por webhook; o app consulta o status por short polling vs long polling; rastreio ao vivo por WebSocket; GraphQL como alternativa ao BFF.
13. **Comunicação Assíncrona**: os eventos do módulo 6 passam a viajar num Kafka (tópico `pedidos`, 3 partições, chave `pedido_id`, grupos de consumo `estoque`, `entregas`, `notificacoes`; DLQ); MQTT no rastreador do caminhão de entrega a caminho de Recife; AMQP (RabbitMQ) para os e-mails.
14. **Performance, Capacidade e Escalabilidade**: medir a Black Friday das 20:03 (100 requisições: média 135 ms, p50 32, p95 800, p99 2.000; a réplica `catalogo-3` a 99% e a frota a 67,5%); a curva do joelho; a cadeia do checkout (o elo mais fraco é `pagamentos`, 40/s; o teto final é o banco, 150/s); vertical × horizontal; a fórmula do HPA (10 → 14 réplicas). Pedido 1052 (Davi).
15. **Scale Cube**: X = réplicas (módulo 7), Y = serviços (módulo 6), Z = partir por cliente/região (prepara o 16). Coordenadas da loja (10, 9, 1) → (10, 9, 3 só em `pedidos`); tabela de 200 pedidos/s (saída 90 → 150 → 200). Pedido 1053 (Caio).
16. **Sharding e Particionamento**: `pedidos` com 50 milhões de linhas; shard por `cliente_id`; shard quente (`mkt-01` com 40%: eficiência 55,6%); `mod 3 → 4` mexe 75%, anel 25%; slots, shuffle sharding (liga com os módulos 7 e 13). Pedido 1054 (Lena).
17. **Replicação**: primário em SP, réplicas no Rio e em Recife; lag de 800 ms na Black Friday (a Lena não vê o pedido 1055); síncrona (82 ms) × semi (12) × assíncrona (2); eleição de líder e RPO (liga com CAP); ECST, CDC e CRDTs.
18. **CQRS**: escrita no PostgreSQL; a tela "meus pedidos" lê de uma projeção.
19. **Saga**: a compensação deixada em aberto no módulo 6 (pagamento aprovado, estoque falhou → estorno); orquestrada vs coreografada.
20. **Event Sourcing**: o pedido 1047 como sequência de eventos; replay e snapshot.
21. **Resiliência**: idempotência (o evento duplicado do módulo 6), retry com backoff e jitter (a tempestade do módulo 10), circuit breaker no `pagamentos`, fallback (módulo 9), timeouts.
22. **Deployment**: rolling, blue/green, canary (módulos 8 e 10), feature toggles (módulo 9).
23. **Capacity Planning**: prever a Black Friday seguinte com os números do 14.
24. **Testes de Carga e Estresse**: k6 no checkout; achar o ponto de quebra.
25. **Bulkhead**: pools separados por dependência (o raio de explosão do módulo 9).
26. **Cell-Based**: células por região (SP, Rio, Recife), cada uma com a pilha inteira.
27. **SPoF e Disaster Recovery**: a região de SP cai; RPO/RTO; multi-região.
28. **Observabilidade**: logs, métricas e traces do pedido (o `trace_id` do módulo 6), alertas.
29. **Provas finais**: desenhar a loja inteira de novo, do zero, com tudo o que foi visto (revisão e quiz geral).

## Constantes novas dos módulos 18–21
- **18 (CQRS):** serviço `meus-pedidos` (query service) e documento `meus_pedidos:<cliente_id>` (Lena: **1.787 B**, 223 B por pedido, 3,35 GB para 1,5 M clientes); `PedidoCriado` e-1801 de **336 B** (notification 72 B); projetor **100 eventos/s por instância**, 120 eventos/s na Black Friday, atraso ~74 ms; tópicos `loja.public.pedidos` e `loja.public.itens_pedido`; tabela `outbox`; WAL por pedido **359,6 → 1.232,7 → 2.735,8 B** (sem outbox → com 2 inserts → com `UPDATE` do relay); relatório de faturamento **~235 ms** (300 mil linhas) × view **0,021 ms**; consulta da tela **0,23–0,31 ms**. Estoque do gato na Black Friday: **20** antes do 1056.
- **19 (Saga):** saga `s-1057`; estados `NOVO, COBRANDO, PAGO, RESERVANDO, RESERVADO, AGENDANDO, FINALIZADO, COMPENSANDO, ESTORNANDO, CANCELADO, INTERVENCAO`; produto 15 / `CAMISETA-015` (estoque 1 → 0); chave de compensação `estorno-c-7732`; *backoff* 1, 2, 4, 8, 16 s (31 s); lab do autor: 10% falha no estoque, 5% no pagamento (85,5% de sucesso); reserva presa 3.600 unidades (30/s × 20% × 10 min).
- **20 (Event Sourcing):** streams `pedido-1047` e `estoque-GATO-042`; `e-505` (`PedidoEntregue`, 19/06 10:40); data de exemplo do 1047: **18/06/2026**; `estoque-CANECA-007` com 1.000.000 de eventos (263 MB; ~263 B/evento); rehidratação **~1.800 ms** × snapshot (a cada 1.000) **~13 ms**; reconstruir modelo: 200 milhões de eventos a 20.000/s = **2 h 47 min**.
- **21 (Resiliência):** incidente **20:20:00–20:21:30** (PSP-A em 8 s); PSP-B (p50 300 ms); pool de **50** conexões do `pagamentos` ao PSP; `pagamentos` com **2 réplicas** de 20/s; PSP-A p50 180 / p99 400 / p99,9 700 ms; **timeout do PSP revisto para 1 s** (o 2 s do módulo 10 satura o pool: timeout crítico 50 ÷ 30 = 1,67 s); prazos 5 / 3 / 2,8 / 2,5 / 2,0 / 1,0 s; retry 3 tentativas, base 100 ms, full jitter, teto 2 s, orçamento 10%; *breaker* janela 20, mínimo 10, 50%, aberto 30 s, 5 sondas; 237 × 3.000 chamadas ao PSP; fallback proativo 1%; demanda do catálogo 1.300 req/s (níveis 1.000 / 1.333 / 1.667); fila do projetor 5.000; *bulkheads* 50/30/20; `Idempotency-Key` +57 B; ids de evento `e-18xx`, `e-19xx`, `e-21xx`.
