/* SDLabs · Final Exams (English): the module's canonical data (docs/escrita/provas-finais-brief.md).
   Nothing here is new: every number and name already exists in a module from 1 to 28. If a number changes there, it changes here,
   in the lessons, in the quiz (public/en/labs/provas-finais/quiz/questions.js) and in the glossary. */

export const BLOCOS = [
  { n: 1, nome: 'A one-server store', de: 1, ate: 5 },
  { n: 2, nome: 'Split and connect', de: 6, ate: 10 },
  { n: 3, nome: 'Talk and compete', de: 11, ate: 13 },
  { n: 4, nome: 'Grow and spread', de: 14, ate: 17 },
  { n: 5, nome: 'Consistency and resilience', de: 18, ate: 21 },
  { n: 6, nome: 'Change, plan, test, isolate', de: 22, ate: 25 },
  { n: 7, nome: 'Cells, disaster and signals', de: 26, ate: 28 },
];

/* n, slug (labs/<slug>/), name, problem it solved, the number that stays, what it means */
export const MODULOS = [
  { n: 1, slug: 'protocolos-de-rede', nome: 'Network Protocols', problema: 'The data has to travel from Recife to SP.', numero: '215 slices · RTT 80 ms', sig: 'The photo becomes segments of up to 1,460 B (313 KB); each round trip costs 80 ms.' },
  { n: 2, slug: 'storage-raid-io', nome: 'Storage, RAID and I/O', problema: 'The disk burns and takes pedidos.db with it.', numero: '1 · 2 · 4 · 6 · 2 I/Os', sig: 'Small write on RAID 0 · 1 · 5 · 6 · 10: the price of each level of protection.' },
  { n: 3, nome: 'CAP Theorem, ACID and BASE', slug: 'cap-acid-base', problema: 'The three databases (SP, Rio, Recife) lose the network between them.', numero: '2-of-3 quorum · ~80 ms', sig: 'During the partition, refuse (C) or accept (A); the synchronous write to Recife costs ~80 ms.' },
  { n: 4, nome: 'Databases, Data Models and Indexing', slug: 'databases', problema: "Finding a customer's order among millions of rows.", numero: 'order 1042 · B-Tree', sig: 'The index finds a row in a few page reads.' },
  { n: 5, nome: 'Cache Strategies', slug: 'cache', problema: 'The plush cat page is slow.', numero: 'h = 90% → 5 ms · 89.90 → 79.90', sig: 'Average time = h × 1 + (1 − h) × 41: the hit rate becomes math.' },
  { n: 6, nome: 'Microservices, Monoliths and Domains', slug: 'microsservicos', problema: 'The single program (8 vCPU) goes down whole at 23:00.', numero: '180 → 200 ms · 80 × 25 vCPU', sig: 'Splitting isolates and scales only what is heavy, and charges for the network (4 hops of 5 ms). Order 1047.' },
  { n: 7, nome: 'Load Balancers and Reverse Proxies', slug: 'load-balancers', problema: 'How to distribute the calls among the replicas.', numero: '2.7 s · 5 s × 3 = 15 s', sig: '"Fair" in number of orders is not fair in work; the healthcheck removes the replica in 15 s.' },
  { n: 8, nome: 'API Gateways', slug: 'api-gateways', problema: 'The app knows 6 addresses and each service does its own login.', numero: '401 × 403 · JWT · token bucket', sig: 'One door, one rule. Order 1048.' },
  { n: 9, nome: 'Backend for Frontends (BFF)', slug: 'bff', problema: "The app's home screen makes 4 calls, 480 ms and 180 KB.", numero: '480 ms · 180 KB → 150 ms · 12 KB', sig: 'One BFF per channel, with the calls in parallel and a fallback.' },
  { n: 10, nome: 'Service Mesh', slug: 'service-mesh', problema: 'Retry, timeout and mTLS repeated in every service.', numero: '27 calls · sidecar 3 vCPU · 1.5 GB', sig: 'Retry in layers multiplies: 3 × 3 × 3.' },
  { n: 11, nome: 'Concurrency and Parallelism', slug: 'concorrencia', problema: 'Two people want the last cat.', numero: '2 ms + 18 ms → 50/s · ceiling 500/s · 409', sig: 'The lock decides who wins; the other one receives 409.' },
  { n: 12, nome: 'Synchronous Communication', slug: 'comunicacao-sincrona', problema: 'The services wait for each other (REST, gRPC, webhook).', numero: '11 bytes · 210 ms', sig: 'The format and the hop have a cost: 1050 in Protobuf; the PSP answers in 210 ms.' },
  { n: 13, nome: 'Asynchronous Communication: Messaging, Events and Streaming', slug: 'comunicacao-assincrona', problema: 'The event that gets lost and the wait that blocks.', numero: '4 events · 120/s · 40/s per partition · 1049 → p0', sig: 'The key decides the partition, and order only holds inside it.' },
  { n: 14, nome: 'Performance, Capacity and Scalability', slug: 'performance', problema: 'Black Friday at 20:03: the average hides the hot replica.', numero: 'average 135 · p50 32 · p95 800 · p99 2,000 ms', sig: 'The average hides; the weakest link rules (pagamentos 40/s, database 150/s; fleet 99% × 67.5%).' },
  { n: 15, nome: 'Scale Cube', slug: 'scale-cube', problema: 'On which axis the store grows.', numero: '(10, 9, 1) → (10, 9, 3) · 90 → 150 → 200', sig: 'X clones, Y splits by function, Z splits by data. Output in orders/s.' },
  { n: 16, nome: 'Sharding and Partitioning', slug: 'sharding', problema: '50 million rows in a single database.', numero: '40% → 55.6% · 75.2% × 25.7% · 45 pairs', sig: 'The key decides what heats up: mkt-01 heats shard-2; mod × ring; shuffle.' },
  { n: 17, nome: 'Data Replication', slug: 'replicacao', problema: 'A disk or a server goes down and takes the data.', numero: '2 · 12 · 82 ms · lag 300/800 ms · RPO 9/24 · RTO 35 s', sig: 'Each copy costs either latency or data.' },
  { n: 18, nome: 'CQRS', slug: 'cqrs', problema: 'The screen reads the past and the report weighs on the write database.', numero: '1,787 B · 235 ms × 0.021 ms', sig: 'Read from a model built for reading (the outbox carries the event there).' },
  { n: 19, nome: 'Saga Pattern', slug: 'saga', problema: 'Payment approved and stock at zero, with no global ROLLBACK.', numero: '85.5% · 1 · 2 · 4 · 8 · 16 s · estorno-c-7732', sig: 'Without a global transaction, you compensate.' },
  { n: 20, nome: 'Event Sourcing', slug: 'event-sourcing', problema: 'Store what happened, not only the state of now.', numero: '1,800 ms × 13 ms · 2 h 47 min', sig: 'The state is the sum of the facts; the snapshot shortens the replay.' },
  { n: 21, nome: 'Resilience Patterns', slug: 'resiliencia', problema: 'PSP-A answers in 8 s and fills the pool.', numero: '1.67 s · 27 · 12,960 · 90 s · 1.3 s', sig: 'Fail small and fast: timeout, retry with jitter, breaker, fallback, idempotency.' },
  { n: 22, nome: 'Deployment Models', slug: 'deployment', problema: 'Version 2.5.0 goes out with a defect (shipping 0.00).', numero: 'R$ 54,000 × R$ 450 · 40 s × 90 s · flag ≤ 30 s', sig: "A deploy's radius = fraction × time × cost." },
  { n: 23, nome: 'Capacity Planning', slug: 'capacity-planning', problema: 'Does Black Friday 2027 hold up?', numero: '14 · 10 · 15 · 2 = 41 vCPU · 950 req/s · 200 orders/s', sig: 'Plan before the peak, with Little and a target ρ of 70%.' },
  { n: 24, nome: 'Load and Stress Testing', slug: 'testes-de-carga', problema: 'The plan is only a hypothesis.', numero: '36/s × ~250/s · p95 ≤ 800 ms · errors ≤ 0.1%', sig: 'A plan without a test is a hypothesis; the mixed scenario finds the 23:00 report.' },
  { n: 25, nome: 'Bulkhead Pattern', slug: 'bulkhead', problema: "The 23:00 report takes over the checkout's pool.", numero: 'pool 20 → 16 + 4 · 33% and 10% of 503 · 60% → 40%', sig: 'The bulkhead chooses who waits.' },
  { n: 26, nome: 'Cell-Based Architecture', slug: 'cell-based', problema: "The mkt-01 poison pill takes down the whole stack.", numero: '4 cells · 7,200 × 2,880 · 41 → 53 vCPU', sig: 'The whole stack as a compartment.' },
  { n: 27, nome: 'Single Point of Failure and Disaster Recovery', slug: 'disaster-recovery', problema: 'The SP region goes down.', numero: 'RTO 65 s (30 + 35) · RPO 2.97 · the 1061', sig: 'The disaster is a region, and RPO is math.' },
  { n: 28, nome: 'Observability and Monitoring', slug: 'observabilidade', problema: "How to know what is happening with Lena's order.", numero: '43.2 min · 14.4× · 1.9 s × 275 ms', sig: 'See per order and decide by error budget.' },
];

export function blocoDe(n) {
  return BLOCOS.filter(function (b) { return n >= b.de && n <= b.ate; })[0];
}
export function moduloPorN(n) { return MODULOS[n - 1]; }

/* "Take a piece out": the "if it goes wrong" of each module, seen backwards (13 pieces) */
export const PECAS = [
  { peca: 'the cache', mod: 5, avisou: [5, 21], quebra: 'The average time goes from 5 ms (h = 90%) to 41 ms, 8.2 times more, and the catalog sends 640 req/s to the origin instead of 128.', numero: '5 ms → 41 ms · 640 instead of 128 req/s' },
  { peca: 'the load balancer', mod: 7, avisou: [7], quebra: 'The first 9 orders go to catalogo-1: CPU at 100% and 20 ms becomes 1.8 s.', numero: '20 ms → 1.8 s' },
  { peca: 'the gateway', mod: 8, avisou: [8], quebra: 'The app comes to know 6 addresses; each service does its own login and rate limiting; the 500/s bot arrives directly.', numero: '6 addresses · 500/s' },
  { peca: 'the distributed lock', mod: 11, avisou: [11], quebra: 'Two replicas of estoque sell the last cat twice.', numero: 'stock −1' },
  { peca: 'idempotency', mod: 21, avisou: [21], quebra: 'The POST retry creates two orders and two charges.', numero: '2 orders · 2 charges' },
  { peca: 'the replicas', mod: 17, avisou: [16, 17], quebra: 'shard-1 goes down and Lena and Bia are left with no orders; a burned disk takes the data.', numero: 'shard-1 down' },
  { peca: 'the outbox', mod: 18, avisou: [18], quebra: 'The order is written and the event never leaves: two systems, one write.', numero: '1 write, 2 systems' },
  { peca: 'the breaker and the fallback', mod: 21, avisou: [21], quebra: 'The PSP at 8 s fills the pool in 1.67 s and takes shipping and email down with it.', numero: '1.67 s · pool of 50' },
  { peca: 'the canary and the business metric', mod: 22, avisou: [22], quebra: 'Shipping 0.00 lasts 60 min: R$ 54,000 (and R$ 486,000 if only the 23:00 report finds it).', numero: 'R$ 54,000 · R$ 486,000' },
  { peca: "the pool's bulkhead", mod: 25, avisou: [25], quebra: 'The 23:00 report leaves 33% of checkout and 10% of status with 503.', numero: '33% · 10% of 503' },
  { peca: 'the router per cell', mod: 26, avisou: [26], quebra: 'The mkt-01 poison pill takes down the 3 pods of pedidos in 150 ms: 7,200 attempts, 100% of them.', numero: '7,200 attempts · 150 ms' },
  { peca: 'the passive cell and DR', mod: 27, avisou: [27], quebra: 'SP goes down. With a warm passive cell the RTO is 65 s (643.5 attempts fail); with backup only the RTO is ~48 min and costs R$ 2.28 million.', numero: '65 s × ~48 min · R$ 2.28 million' },
  { peca: 'observability', mod: 28, avisou: [28], quebra: 'The MTTD goes back from 30 s to 60 min; Lena waits 1.9 s and nobody knows where.', numero: '30 s → 60 min · 1.9 s' },
];

/* The 14 hops of 1060 (Lena, celula-recife, 20:25:00.000: 2 cats 159.80 + Recife shipping 15.00 = 174.80) */
export const SALTOS = [
  { salto: "Lena's app resolves loja.com.br (DNS) and opens the connection (TCP + TLS); the Recife cell takes the 80 ms of RTT to SP out of the path.", mods: [1, 26] },
  { salto: 'edge-loja reads the cliente_id from the JWT and looks at the map (150 MB): celula-recife.', mods: [26, 8] },
  { salto: 'In the cell, gw-loja validates the token and applies rate limiting; lb picks a bff-app.', mods: [8, 7, 9] },
  { salto: 'bff-app calls pedidos with a deadline through the mesh (mTLS, retry with a rule); with the Idempotency-Key, POST /pedidos does not duplicate.', mods: [21, 10] },
  { salto: "pedidos reserves the stock: lock on the cat's row, allocation REC-1 from 2 to 0.", mods: [11, 26] },
  { salto: 'pagamentos charges on PSP-A (REST/Pix) with a breaker, PSP-B as a reserve and a pool of 50 in bulkheads 50/30/20.', mods: [12, 21, 25] },
  { salto: "pedidos writes to the cell's PostgreSQL, with a B-Tree index, and the PedidoCriado event goes to the outbox.", mods: [4, 18] },
  { salto: "The relay (CDC) publishes to the cell's Kafka, key pedido_id; estoque, entregas and notificacoes consume.", mods: [13] },
  { salto: 'The saga goes on: paid, reserved, scheduled delivery; if it fails, it compensates with the refund.', mods: [19] },
  { salto: 'The events form the pedido-1060 stream and the projector updates meus_pedidos:lena-77.', mods: [20, 18] },
  { salto: 'The "my orders" screen reads the projection from its own cell: 1055 (the order she did not see) does not happen again.', mods: [18, 26] },
  { salto: "The cell's database replicates to the passive cell in SP: lag of 800 ms, expected RPO 2.88.", mods: [17, 26] },
  { salto: "Each hop leaves a log, a metric and a trace with the same trace_id; the checkout's SLI counts one more \"good\".", mods: [28] },
  { salto: 'If the mkt-01 poison pill arrived at the same moment, Lena would not notice: celula-mkt goes down alone.', mods: [26] },
];
