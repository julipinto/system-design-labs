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
| 1059 | 22 | Lena, terça 14:00 (dia comum, 5 ped/s): 1 camiseta preta 49.00 + frete Recife 15.00 = 64.00 na `pedidos` 2.4.0; 49.00 na 2.5.0 com o defeito de CEP (frete 0,00); 201, erros 0% (o "1059" hipotético do módulo 21, aula 5, não é pedido da história) |
| (nenhum) | 23 | planejamento, sem pedido |
| (nenhum) | 24 | pedidos do k6 são sintéticos, não consomem número |
| (nenhum) | 25 | reusa o 1054 (status da Lena) |
| 1060 | 26 | Lena, 20:25:00.000, na `celula-recife`: 2 gatos 159.80 + frete Recife 15.00 = **174.80** (gato 19 → 17; a alocação da célula `REC-1` vai de 2 a 0); a *poison pill* do `mkt-01` derruba só a `celula-mkt` |
| 1061 | 27 | **Bia**, SP, 20:39:59.950: 1 gato 79.90 + 1 caneca azul 19.90 + frete SP 9.00 = **108.80**, Pix `c-7733` (gato 17 → 16, caneca 32 → 31); **perdido no RPO** (a região de SP cai às 20:40:00.150); o número **1061 é reutilizado** pelo Davi às 20:41:10 (2 canecas azuis 39.80 + frete SP 9.00 = **48.80**, Pix `c-7734`) |
| 1062 | 27 | o **mesmo** pedido da Bia, recuperado do disco de SP às 23:40 e **renumerado** (o 1061 fica com o Davi) |
| 1063 | 28 | Lena, quinta 03/12/2026, 15:30:07.412 ("caneca em dobro"): 3 canecas azuis 59.70 + frete Recife 15.00 = **74.70** (caneca 29 → 26); **1,9 s** (normal 275 ms) por uma espera de *lock* de 1.620 ms no `estoque`; `trace_id` `9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52` |
| (1060) | 29 | o módulo 29 **reusa o 1060** (os 14 saltos pelo mapa); **não consome número** |
| 1064+ | depois do 29 | um novo por módulo, registrado aqui |

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
22. **Deployment**: `pedidos` 2.4.0 → 2.5.0 com defeito de frete em Recife (frete 0,00, erros 0%: só a métrica de negócio pega); recreate (40 s), rolling (90 s), blue/green, canary 10→50→100%, migrations expandir/contrair, shadow, feature flag `frete_v2`, anéis por shard 20/20/60. Pedido 1059.
23. **Capacity Planning**: BF 26/11/2027; catálogo 640 → 950 req/s e checkout 30 → 200 pedidos/s (meta do comercial); plano 14/10/15/2 réplicas + 4 shards + 8 partições; 41 vCPU; Little, filas, joelho.
24. **Testes de Carga e Estresse**: k6 no checkout; "hoje" quebra em 36/s, "plano" em ~250/s (shard quente), "plano 2" ~260/s; o cenário misto acha o relatório das 23:00.
25. **Bulkhead**: pool de 20 conexões do banco do `pedidos` (checkout, status, relatório das 23:00); 16+4; raio 60% → 40%; lógico × físico.
26. **Cell-Based**: 4 células (`celula-sp` 33%, `celula-rio` 15%, `celula-recife` 12%, `celula-mkt` 40%), cada uma com a pilha inteira; roteador e mapa; o veneno do `mkt-01` (7.200 × 2.880); 41 → 53 vCPU; *shuffle* (liga com 16 e 25). Pedido 1060 (Lena).
27. **SPoF e Disaster Recovery**: auditoria de 12 elos (5 SPoFs); a região de SP cai às 20:40:00.150 (MTTD 30 s + MTTR 35 s = **RTO 65 s**; RPO esperado 2,97); ativo-ativo, ativo-passivo, *pilot light*, backup; o 1061 (Bia) perdido e o número reutilizado.
28. **Observabilidade**: logs, métricas e traces do pedido 1063 (o `trace_id` do módulo 6, agora de 32 hex), alertas, SLI/SLO/SLA e orçamento de erro, USE, RED e quatro sinais.
29. **Provas finais**: desenhar a loja inteira de novo, do zero, em 7 blocos de módulos (os 14 saltos do pedido 1060, os 28 números, "tire uma peça"), com a figura-mapa `loja-3d` e um quiz geral de 80 perguntas.

## Constantes novas dos módulos 18–21
- **18 (CQRS):** serviço `meus-pedidos` (query service) e documento `meus_pedidos:<cliente_id>` (Lena: **1.787 B**, 223 B por pedido, 3,35 GB para 1,5 M clientes); `PedidoCriado` e-1801 de **336 B** (notification 72 B); projetor **100 eventos/s por instância**, 120 eventos/s na Black Friday, atraso ~74 ms; tópicos `loja.public.pedidos` e `loja.public.itens_pedido`; tabela `outbox`; WAL por pedido **359,6 → 1.232,7 → 2.735,8 B** (sem outbox → com 2 inserts → com `UPDATE` do relay); relatório de faturamento **~235 ms** (300 mil linhas) × view **0,021 ms**; consulta da tela **0,23–0,31 ms**. Estoque do gato na Black Friday: **20** antes do 1056.
- **19 (Saga):** saga `s-1057`; estados `NOVO, COBRANDO, PAGO, RESERVANDO, RESERVADO, AGENDANDO, FINALIZADO, COMPENSANDO, ESTORNANDO, CANCELADO, INTERVENCAO`; produto 15 / `CAMISETA-015` (estoque 1 → 0); chave de compensação `estorno-c-7732`; *backoff* 1, 2, 4, 8, 16 s (31 s); lab do autor: 10% falha no estoque, 5% no pagamento (85,5% de sucesso); reserva presa 3.600 unidades (30/s × 20% × 10 min).
- **20 (Event Sourcing):** streams `pedido-1047` e `estoque-GATO-042`; `e-505` (`PedidoEntregue`, 19/06 10:40); data de exemplo do 1047: **18/06/2026**; `estoque-CANECA-007` com 1.000.000 de eventos (263 MB; ~263 B/evento); rehidratação **~1.800 ms** × snapshot (a cada 1.000) **~13 ms**; reconstruir modelo: 200 milhões de eventos a 20.000/s = **2 h 47 min**.
- **21 (Resiliência):** incidente **20:20:00–20:21:30** (PSP-A em 8 s); PSP-B (p50 300 ms); pool de **50** conexões do `pagamentos` ao PSP; `pagamentos` com **2 réplicas** de 20/s; PSP-A p50 180 / p99 400 / p99,9 700 ms; **timeout do PSP revisto para 1 s** (o 2 s do módulo 10 satura o pool: timeout crítico 50 ÷ 30 = 1,67 s); prazos 5 / 3 / 2,8 / 2,5 / 2,0 / 1,0 s; retry 3 tentativas, base 100 ms, full jitter, teto 2 s, orçamento 10%; *breaker* janela 20, mínimo 10, 50%, aberto 30 s, 5 sondas; 237 × 3.000 chamadas ao PSP; fallback proativo 1%; demanda do catálogo 1.300 req/s (níveis 1.000 / 1.333 / 1.667); fila do projetor 5.000; *bulkheads* 50/30/20; `Idempotency-Key` +57 B; ids de evento `e-18xx`, `e-19xx`, `e-21xx`.

## Constantes novas dos módulos 22–25
- 22: `pedidos` 2.4.0/2.5.0/2.6.0; CEP Recife 50000–52999; mix SP 55 / Rio 25 / Recife 20; pod pronto em 30 s; perdas R$54.000 / R$450 / R$9.600; buckets `frete_v2` lena 19, bia 38, caio 3, davi 94, mkt-01 41 (`nova_home` 80·2·72·67·87); anéis shard-0/1/2 = 20/20/60%.
- 23: BF 26/11/2027; série do pico 300·410·520·640; projeções 750/824/950/1.140; cenários 45/200/300 pedidos/s; ρ alvo 70%; plano 14/10/15/2, 4 shards, 8 partições, pool PSP 150; 41 vCPU; sustentável 210 pedidos/s e 980 req/s; pré-escalar 19:50.
- 24: metas p95 ≤ 800 ms e erros ≤ 0,1%; "hoje" 36/s; "plano" ~250/s; "plano 2" ~260/s; fechado 20 VUs = 38,1/s; jornada cartão 60 / Pix 35 / estorno 5.
- 25: pool 20 conexões → 16+4; 503 no pool único 33% checkout / 10% status; lanes 12/6/2; raio 60% → 40%; teto do mkt-01 100 req/s no catálogo.
  - 25 (detalhe): k6 v2.3.0 (20–21/10/2026), janela 25–50 s: pool único checkout 66,8% ok (83 × 503), status 89,9% (101), relatório 47,2%; 16+4 → 100%, 100% e 14,0%; Little 0,2+0,2+40 (pede 4+4); job 10 → 100 min; Erlang C 12 workers 18,4% × 42,9%, +25%; lanes 12·6·2; newsletter no tópico errado 417 s; estoque global = raio 100%; nenhum pedido novo.
- O 1.300 req/s do módulo 21 é uma rajada de segundos, não o pico sustentado (14: 640 medido, 950 projetado).

## Constantes novas dos módulos 26–29
- **Convenção dos incidentes de 26 e 27:** acontecem na **noite da Black Friday com a carga medida (30 pedidos/s**; módulos 13, 17 e 21), e a conta de **custo** usa o plano de **2027** (200 pedidos/s; módulo 23). Os números de pedido são **didáticos**.
- **26 (Cell-Based):** 4 células `celula-sp` **33%** (9,9 pedidos/s), `celula-rio` **15%** (4,5), `celula-recife` **12%** (3,6), `celula-mkt` **40%** (12,0), versão `@2.6.0`; o `celula-mkt` em Recife (nenhuma região passa de 52%); passivas SP → Rio (lag 300 ms), Rio → SP (300 ms), Recife → SP (800 ms), `mkt` → SP (800 ms); mapa `cliente_id → célula` de **150 MB** (`mapa-v42`; o ruim, `mapa-v43`); roteador `edge-loja` (99,99%); *poison pill* `quantidade: 2147483648` às **20:25:00** (7.200 × 2.880 tentativas em 4 min; 150 ms para derrubar os 3 pods; 24.000 × 9.600 eventos presos em 10 min, 14.400 × 0 de pessoa física); alocação do gato **6 · 3 · 2 · 8** (`SP-1`, `RIO-1`, `REC-1`); custo **41 → 53 vCPU (+29,3%)** e **9 → 32** no dia comum; folga 1 ÷ (N − 1) e ocupação máxima **35 · 46,7 · 52,5 · 63 · 66,5%**; Rio **15% → 48% (3,2×)**; RPO por célula **2,97 · 1,35 · 2,88 · 9,6**; 2PC **24 ms** e **164 ms**, linha quente **500 · 41,7 · 6,1/s**; *shuffle* exato **1 ÷ C(N,k)** (0,526% para N = 20; 2,22% para N = 10; 16,7% para N = 4); pares de N = 10: `mkt-01` {8,9}, `lena-77` {6,8}, `bia-31` {4,6}, `caio-58` {1,4}, `davi-12` {1,9}; *rehash* 4 → 5: 80,1% (`mod`) × ~20% (anel) × 0 (tabela); mover o `mkt-01` 13 min 20 s; anéis de deploy **0 · 12 · 27 · 60 · 100%** com célula zero (`sint-01…03`).
- **27 (SPoF e DR):** queda de SP às **20:40:00.150**; sondas de 10 s (3 falhas = **MTTD 30 s**); promoção do Rio aos 35 s; pods aos 60 s; mapa aos 65 s = **RTO 65 s**, **MTTR 35 s**; passiva *warm* a 30%; **hub**: SP guarda as passivas de `celula-rio`, `celula-recife` e `celula-mkt`; ticket médio **R$ 80** (média dos 13 pedidos: 79,82); R$ perdidos **2.276.208 · 570.240 · 51.480 · 27.720** (backup ~48 min · *pilot light* 12 min · *warm standby* 65 s · ativo-ativo 35 s); metas checkout **5 min/1 s**, catálogo 15 min/1 h, relatórios 24 h/24 h; restore de 46,2 GB a 50 MB/s = 924 s; *split brain* 297 (30 s) e 2.970 (5 min); auditoria: 12 elos, **5 SPoFs**, **98,8066% · 99,5003% · 99,9988%**; as médias do artigo 34 · 108,4 · 204,5 min; o webhook de `c-7733` vai à quarentena às 20:41:25.
- **28 (Observabilidade):** pedido **1063** com *spans* 4 · 6 · 14 · 12 · 20 (1.640 no 1063) · 210 · 6 · 3 = **275 ms (1.895 ms)**; `trace_id` do 1047 completo `7f3a9c0e5b2d4186a9e3c7d1f0b84e26`; a tarefa `contagem-estoque` (a cada 30 min, transação de 1,6 s); histograma `0,25→400 · 0,5→975 · 0,8→992 · 1→992 · 2,5→1.000` (p50 0,293 · p95 0,489 · p99 0,765 · p99,9 2,3125); cardinalidade 2.016 → 22.176 → 33,3 bilhões; logs 2,81 · 25,5 · 255 GB/dia; traces 4,8 KB, 12,4 GB × 124 MB/dia, 7,7% (*head* 1%); alertas nunca · 60–75 s · 30 s · 51,84 s; **SLI** (2xx e ≤ 800 ms ÷ válidos), **SLO 99,9% / 30 d**, **SLA com o `mkt-01` 99,5%**; orçamento **12.960** (43,2 min); *burn rate* **14,4× (1 h, 2%) · 6× (6 h, 5%) · 1× (3 d, 10%)**; a média com falha rápida 275 → 193 ms.
- **29 (Provas Finais):** nenhum pedido novo (reusa o **1060**); **7 blocos** (1–5, 6–10, 11–13, 14–17, 18–21, 22–25, 26–28); **80 perguntas**; os **28 números** e os **14 saltos** do 1060; **13 peças** em "tire uma peça".
