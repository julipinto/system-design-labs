# História-mestre do SDLabs (a loja da Lena, do módulo 1 ao 29)

Cada módulo é um capítulo do mesmo problema: **a loja que vende o gato de pelúcia cresce, e cada crescimento quebra alguma coisa**. Este arquivo é a espinha. Todo brief novo parte daqui e, quando um módulo muda um número que outro usa, este arquivo é atualizado junto (PREMISSAS 8 e 15b).

## Elenco e constantes
- **Lena** (Recife), a cliente-estrela; **Bia** (SP), **Caio** (Rio), **Davi** (SP), outros clientes; cidades SP, Rio, Recife.
- **A loja**: `loja.com.br`. Produto-estrela: **gato de pelúcia, produto 42** (preço 89.90 até o módulo 5; **79.90** a partir da promoção do módulo 5). Caneca azul é o produto 7 (19.90).
- Banco: PostgreSQL `loja` (módulo 4), tabela `pedidos`. Redis (módulo 5). CDN com edge em Recife (módulo 5).
- Times (módulo 6): **Vitrine** (catálogo, busca), **Checkout** (carrinho, pedidos, pagamentos), **Logística** (estoque, entregas).
- Serviços (módulo 6): `catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas`, `relatorios` (+ `recomendacoes`, `clientes`, BFFs a partir dos módulos 8–9).
- Porta de entrada (módulos 7–8): `lb-loja` (203.0.113.10), `gw-loja` (`api.loja.com.br`).
- Frete padrão para Recife: **15.00**.

## Numeração de pedidos (não repetir)
| Pedido | Módulo | O quê |
|---|---|---|
| 1041–1046 | 4 | tabela de exemplo (1042 = Lena, gato, 89.90) |
| 1047 | 6 | Lena, gato 79.90 + frete 15.00 = 94.90 (estoque do gato 3 → 2) |
| 1048 | 8–10 | Lena pelo app, mesmo valor 94.90 (estoque 2 → 1) |
| 1049 | 11 | Bia × Caio disputando o último gato (estoque 1 → 0); Bia leva: gato 79.90 + frete SP 9.00 = 88.90; o Caio recebe `409` e não consome número |
| 1050 | 12 | Davi (caneca azul 19.90 + frete SP 9.00 = 28.90) paga com Pix por PSP externo (webhook, cobrança `c-7731`) |
| 1051 | 13 | Lena, 2 canecas azuis 39.80 + frete 15.00 = 54.80; eventos `e-901` a `e-904` no tópico `pedidos` do Kafka (estoque da caneca 40 → 38) |
| 1052+ | 14 em diante | um novo por módulo, registrado aqui |

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
14. **Performance, Capacidade e Escalabilidade**: medir a Black Friday: latência p50/p95/p99, vazão, saturação; vertical vs horizontal.
15. **Scale Cube**: X = réplicas (módulo 7), Y = serviços (módulo 6), Z = partir por cliente/região (prepara o 16).
16. **Sharding e Particionamento**: `pedidos` com 50 milhões de linhas; shard por `cliente_id`; shard quente; resharding com hashing consistente (liga com o módulo 7).
17. **Replicação**: primário em SP, réplicas no Rio e em Recife; lag (a Lena não vê o próprio pedido); síncrona vs assíncrona; eleição de líder (liga com CAP).
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
