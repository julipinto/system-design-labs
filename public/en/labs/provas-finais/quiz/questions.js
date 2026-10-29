/* Question bank for the final exam (80 multiple-choice questions). English version of public/labs/provas-finais/quiz/questions.js.
   Each question carries its source module (in the explain text and in `mods`) and the block (b1..b7; i = integrative).
   The numbers are the ones published in modules 1 to 28 (docs/escrita/provas-finais-brief.md): if a number changes there, it changes here.
   `answer` is always the index of the right option; the quiz shuffles the options on each question. */
(function () {
  var MOD = {
    1: ["protocolos-de-rede", "Network Protocols"], 2: ["storage-raid-io", "Storage, RAID and I/O"], 3: ["cap-acid-base", "CAP Theorem, ACID and BASE"],
    4: ["databases", "Databases, Data Models and Indexing"], 5: ["cache", "Cache Strategies"], 6: ["microsservicos", "Microservices, Monoliths and Domains"],
    7: ["load-balancers", "Load Balancers and Reverse Proxies"], 8: ["api-gateways", "API Gateways"], 9: ["bff", "Backend for Frontends (BFF)"], 10: ["service-mesh", "Service Mesh"],
    11: ["concorrencia", "Concurrency and Parallelism"], 12: ["comunicacao-sincrona", "Synchronous Communication"], 13: ["comunicacao-assincrona", "Asynchronous Communication: Messaging, Events and Streaming"],
    14: ["performance", "Performance, Capacity and Scalability"], 15: ["scale-cube", "Scale Cube"], 16: ["sharding", "Sharding and Partitioning"], 17: ["replicacao", "Data Replication"],
    18: ["cqrs", "CQRS"], 19: ["saga", "Saga Pattern"], 20: ["event-sourcing", "Event Sourcing"], 21: ["resiliencia", "Resilience Patterns"],
    22: ["deployment", "Deployment Models"], 23: ["capacity-planning", "Capacity Planning"], 24: ["testes-de-carga", "Load and Stress Testing"], 25: ["bulkhead", "Bulkhead Pattern"],
    26: ["cell-based", "Cell-Based Architecture"], 27: ["disaster-recovery", "Single Point of Failure and Disaster Recovery"], 28: ["observabilidade", "Observability and Monitoring"]
  };
  var BLOCKS = {
    b1: { name: "Block 1 · A one-server store", range: "modules 1 to 5" },
    b2: { name: "Block 2 · Split and connect", range: "modules 6 to 10" },
    b3: { name: "Block 3 · Talk and compete", range: "modules 11 to 13" },
    b4: { name: "Block 4 · Grow and spread", range: "modules 14 to 17" },
    b5: { name: "Block 5 · Consistency and resilience", range: "modules 18 to 21" },
    b6: { name: "Block 6 · Change, plan, test, isolate", range: "modules 22 to 25" },
    b7: { name: "Block 7 · Cells, disaster and signals", range: "modules 26 to 28" },
    i: { name: "Integrative", range: "several modules" }
  };
  var out = [];
  var seq = 0;
  function from(mods) {
    if (mods.length === 1) return "Module " + mods[0] + " (" + MOD[mods[0]][1] + "). ";
    return "Modules " + mods.join(", ").replace(/, (\d+)$/, " and $1") + ". ";
  }
  function q(block, mods, prompt, right, wrongs, explain) {
    seq++;
    var b = BLOCKS[block];
    out.push({
      id: "p" + (seq < 10 ? "0" : "") + seq,
      group: block,
      topic: MOD[mods[0]][0],
      topicName: b.name,
      mods: mods,
      modSlugs: mods.map(function (n) { return MOD[n][0]; }),
      type: "choice",
      level: 2,
      prompt: prompt,
      options: [right].concat(wrongs),
      answer: 0,
      explain: from(mods) + explain
    });
  }

  /* ---------- Block 1: modules 1 to 5 ---------- */
  q("b1", [1], "The 313 KB photo, in segments of up to 1,460 B, becomes how many slices?", "215", ["150", "313", "1,460"],
    "313 KB ÷ 1,460 B gives ~214.4, and the last segment is incomplete: 215 slices.");
  q("b1", [1], "How much does each Recife–SP round trip cost in the story?", "80 ms", ["8 ms", "800 ms", "10 ms"],
    "The RTT from Recife to SP is 80 ms (SP–Rio is 10 ms). The Recife cell from module 26 takes this trip out of the path.");
  q("b1", [2], "D2 burns out on a 4-disk RAID 0. What happens to pedidos.db?", "Everything is lost: with no redundancy, each block exists on only one disk", ["Only a quarter is lost, and the rest keeps working", "It recovers from parity", "The mirror covers the disk that burned"],
    "RAID 0 only splits (stripes), so every file has blocks on D2. That is why pedidos.db went to RAID 10.");
  q("b1", [2], "How many I/Os does a small write cost on RAID 5?", "4", ["1", "2", "6"],
    "RAID 0, 1, 5, 6 and 10 cost 1, 2, 4, 6 and 2 I/Os: on RAID 5 you read the data and the parity and write both.");
  q("b1", [2], "What does RAID 6 have that RAID 5 does not, and what does it pay?", "A second parity (Q): tolerates 2 disks, small write of 6 I/Os", ["A mirror: tolerates 2 disks with 2 I/Os", "A second copy at another site, at no cost", "More read speed, with the same 4-I/O write"],
    "The Q parity lets the set survive 2 burned disks, and the small write goes from 4 to 6 I/Os.");
  q("b1", [3], "The three databases (SP, Rio, Recife) lose the network between them. CAP forces a choice between…", "Consistency and availability (during the partition)", ["Consistency and partition", "Latency and cost", "Availability and partition, only in a disaster"],
    "The partition happens: the choice is to refuse (C) or accept and diverge (A). Outside the partition, PACELC talks about latency × consistency.");
  q("b1", [3], "With 3 sites, what is the majority (quorum)?", "2", ["3", "1", "4"],
    "The majority of 3 is 2 of 3: two sites agreeing is enough, and two groups that cannot see each other cannot both have a majority.");
  q("b1", [4], "Why does the B-Tree tie with the scan at 6 rows and win at 1 million?", "It finds the row in a few page reads; with 6 rows everything fits in one page", ["It is always faster, whatever the size", "It only works for text columns", "With 6 rows the index does not exist"],
    "The cost is the number of page reads. With 6 rows the whole table is one page, and with 1 million the index avoids reading almost all of them.");
  q("b1", [5], "90% hit rate, 1 ms cache and 41 ms database: what is the average time?", "5 ms", ["41 ms", "1 ms", "20 ms"],
    "0.9 × 1 + 0.1 × 41 = 5 ms. Without the cache it would be 41 ms.");
  q("b1", [5], "Three catalog replicas, three hashmaps, three different prices. What fixes it?", "A shared cache (Redis) or invalidation by TTL", ["More replicas", "More RAM on each replica", "A faster balancer"],
    "The problem is each replica having its own copy. Redis brings the copies into one place, and the TTL limits how long an old copy lives.");

  /* ---------- Block 2: modules 6 to 10 ---------- */
  q("b2", [6], "The 180 ms checkout, with 4 hops of 5 ms between services, now takes…", "200 ms", ["185 ms", "380 ms", "20 ms"],
    "4 hops × 5 ms = 20 ms more: 180 → 200 ms. It is the price of the network when you split.");
  q("b2", [6], "On Black Friday, 10 copies of the monolith (8 vCPU) against the microservices that are heavy, in vCPU:", "80 × 25", ["8 × 10", "25 × 80", "10 × 10"],
    "10 copies × 8 vCPU = 80 vCPU; scaling only the heavy services is 25 vCPU.");
  q("b2", [7], "Round robin, 3 replicas, and 3 searches of 900 ms that land on P2, P5 and P8. What happens?", "They all land on the same replica (2.7 s of work)", ["One on each replica", "300 ms on each one", "The balancer refuses two"],
    "Order by order, round robin is fair; in work it is not: 3 × 900 ms = 2.7 s on a single replica.");
  q("b2", [7], "A healthcheck every 5 s, with 3 failures in a row to remove the replica, removes it in…", "15 s", ["5 s", "3 s", "30 s"],
    "5 s × 3 failures = 15 s until the replica leaves the balancing.");
  q("b2", [8], "With no token, and with a valid token but without the scope: which statuses?", "401 and 403", ["403 and 401", "400 and 404", "401 and 401"],
    "401 says it does not know who you are; 403 says it knows, but you cannot.");
  q("b2", [8], "After validating the JWT, the gateway forwards to the service…", "X-Cliente-Id: lena-77", ["Lena's password", "The whole token, without validating again", "The app's IP"],
    "The service receives only the already validated cliente_id. Lena's order 1048 goes through this way.");
  q("b2", [9], "The app's home screen, without a BFF, makes 4 calls of 120 ms. What are the total and the weight?", "480 ms and 180 KB", ["120 ms and 12 KB", "150 ms and 12 KB", "480 ms and 12 KB"],
    "4 × 120 ms = 480 ms in series and 180 KB. With the BFF in parallel: 150 ms and 12 KB.");
  q("b2", [9], "recomendacoes goes down. bff-app waits 100 ms and…", "Responds without the section ('recomendado': [])", ["Returns 500 to the app", "Waits 8 s for the PSP", "Retries forever"],
    "The fallback lets the screen go on without the section; the rest of the screen does not depend on it.");
  q("b2", [10], "3 layers, 3 attempts each: how many calls to pagamentos per click?", "27", ["9", "6", "3"],
    "3 × 3 × 3 = 27. Retry in layers multiplies, which is why the mesh centralizes the rule.");
  q("b2", [10], "30 sidecars at 0.1 vCPU and 50 MB each add up to…", "3 vCPU and 1.5 GB", ["0.1 vCPU and 50 MB", "30 vCPU and 1.5 GB", "3 vCPU and 50 MB"],
    "30 × 0.1 = 3 vCPU and 30 × 50 MB = 1.5 GB: the price of the mesh.");

  /* ---------- Block 3: modules 11 to 13 ---------- */
  q("b3", [11], "estoque spends 2 ms of CPU and 18 ms of waiting. How many orders at a time, and what is the ceiling?", "50/s and 500/s", ["500/s and 50/s", "20/s and 20/s", "1,000/s and 50/s"],
    "2 + 18 = 20 ms gives 1,000 ÷ 20 = 50/s at a time; with the wait overlapped, only the CPU limits: 1,000 ÷ 2 = 500/s.");
  q("b3", [11], "Bia and Caio want the last cat. Who gets it, and what does the other one receive?", "Whoever takes the lock first (Bia, 1049); the other receives 409", ["Both get it, and stock goes to −1", "Nobody gets it", "Caio gets it and Bia receives 404"],
    "The lock decides. 1049 is Bia's, and Caio receives 409 and does not consume a number.");
  q("b3", [11], "With 2 replicas of estoque, is the local mutex enough?", "No: that is 2 processes and 2 memories, and it needs a distributed lock", ["Yes, the mutex covers the whole store", "Only if each replica has 1 vCPU", "Yes, as long as it uses threads"],
    "The mutex lives in one process's memory. Two replicas need a lock both of them can see, like the one on Redis.");
  q("b3", [12], "Order 1050 in Protobuf (without the gRPC header) is how many bytes?", "11", ["53", "210", "5"],
    "The 11 was measured on a proxy that reads the HTTP/2 frames. The 210 ms is the PSP's time, not bytes.");
  q("b3", [12], "How does the PSP say Davi's Pix went through without the store asking?", "Webhook", ["Short polling", "WebSocket", "Long polling"],
    "The webhook is the PSP calling the store. Polling is the store asking.");
  q("b3", [13], "Which partition does order 1049 land on (3 partitions, key pedido_id)?", "p0", ["p1", "p2", "All three"],
    "The key decides the partition: 1049 lands on p0, and order only holds inside one partition.");
  q("b3", [13], "On Black Friday: how many events per second on the topic and per partition?", "120/s and 40/s", ["30/s and 10/s", "4/s and 1/s", "40/s and 120/s"],
    "30 orders/s × 4 events = 120/s; split across 3 partitions, 40/s each.");
  q("b3", [13], "What is the DLQ for?", "Holding the message that cannot be processed, so the consumer can move on", ["Speeding up consumption", "Encrypting the messages", "Guaranteeing order across partitions"],
    "Without the DLQ, one bad message blocks the whole partition.");

  /* ---------- Block 4: modules 14 to 17 ---------- */
  q("b4", [14], "Average of 135 ms and p95 of 800 ms: which number misleads?", "The average", ["The p95", "The p99", "Neither"],
    "The average (135) hides the tail: p50 32, p95 800 and p99 2,000 ms.");
  q("b4", [14], "Why is the fleet at 67.5% and one replica at 99%?", "(9 × 64 + 99) ÷ 10 = 67.5: the average hides the hot one", ["The fleet is wrong", "The replica at 99% is a measurement error", "The balancer favors it on purpose"],
    "Nine replicas at 64% and catalogo-3 at 99% give a 67.5% average and one replica at the limit.");
  q("b4", [14], "What is the checkout's weakest link, and the final ceiling?", "pagamentos (40/s) and the pedidos database (150/s)", ["estoque (1,000/s)", "The catalog (100 req/s per replica)", "pedidos (90/s) and the database (150/s)"],
    "The weakest link rules: pagamentos does 40/s and the pedidos database, 150/s; estoque does 1,000/s.");
  q("b4", [15], "On the cube, X, Y and Z are…", "Clone (replicas), split by function (services) and split by data/customer", ["CPU, RAM and disk", "Read, write and cache", "Region, zone and node"],
    "X clones, Y splits by function and Z splits by data. The store went from (10, 9, 1) to (10, 9, 3).");
  q("b4", [16], "murmur3('lena-77') mod 3 takes Lena to…", "shard-1", ["shard-0", "shard-2", "mkt-01's shard"],
    "Lena's order 1054 lands on shard-1.");
  q("b4", [16], "mkt-01, with 40% of the rows: what is the hot shard's fraction, and the efficiency?", "60% and 55.6%", ["40% and 100%", "33% and 66%", "100% and 33%"],
    "mkt-01 puts 60% of the table on shard-2 (the others split the rest), and the cluster's efficiency drops to 55.6%.");
  q("b4", [16], "From 3 to 4 shards, mod and the ring (consistent hash) move…", "~75% × ~25%", ["~25% × ~75%", "100% × 0%", "~50% × ~50%"],
    "mod: 75.2% of the data changes place; the ring moves only ~25.7%.");
  q("b4", [17], "Commit latency, asynchronous, semi and synchronous (SP–Rio–Recife):", "2, 12 and 82 ms", ["2, 10 and 80 ms", "12, 82 and 2 ms", "2, 12 and 800 ms"],
    "2 ms local; 12 = 2 + 10 (Rio's RTT); 82 = 2 + 80 (Recife's RTT).");
  q("b4", [17], "Lag of 800 ms in Recife, at 30 orders/s: how many orders are at risk in the failover?", "24", ["9", "800", "0.8"],
    "30 orders/s × 0.8 s = 24 orders. With Rio's 300 ms lag it would be 9.");
  q("b4", [17], "Why does Lena not see 1055 in 'my orders'?", "She reads the Recife replica, 800 ms behind", ["The order failed", "The cache expired", "The gateway blocked the read"],
    "The order was written, but the Recife replica has not received it yet. Module 26 puts the primary in Recife.");

  /* ---------- Block 5: modules 18 to 21 ---------- */
  q("b5", [18], "In CQRS, where does the 'my orders' screen read from?", "From the read model (meus-pedidos)", ["From the write PostgreSQL", "Straight from Kafka", "From the gateway's cache"],
    "The read comes from a model built for reading, updated by the projector. The report goes from 235 ms to 0.021 ms.");
  q("b5", [18], "What is the outbox for?", "Writing the event in the same transaction as the order", ["Speeding up reads", "Encrypting the events", "Replacing Kafka"],
    "Without the outbox, the order is written and the event may never leave: two writes, two systems.");
  q("b5", [19], "Payment approved and stock fails: the saga…", "Compensates (refunds the payment)", ["Does a global ROLLBACK", "Ignores the failure", "Charges again"],
    "Without a global transaction, you compensate: estorno-c-7732, in the case of 1057.");
  q("b5", [19], "Orchestrated × choreographed saga:", "A conductor decides × each service reacts to events", ["Synchronous × asynchronous", "With a database × without a database", "With compensation × without compensation"],
    "The difference is who knows the flow: the orchestrator, or nobody and everybody at the same time.");
  q("b5", [19], "10% failure on stock and 5% on payment: what is the chance of success?", "85.5%", ["85%", "95%", "90%"],
    "0.9 × 0.95 = 0.855. Probabilities multiply, they do not add.");
  q("b5", [20], "In event sourcing, the state of order 1047 is…", "The result of replaying the events of the pedido-1047 stream", ["The last row of the pedidos table", "The last event, alone", "A copy on Redis"],
    "The state is the sum of the facts. The pedido-1047 stream has events e-501, e-502, e-504 and e-505.");
  q("b5", [20], "With a snapshot every 1,000 events, the rehydration of ~1,800 ms goes to…", "~13 ms", ["1,800 ms", "0 ms", "~900 ms"],
    "The snapshot avoids rereading the whole history: ~13 ms. The module's full replay takes 2 h 47 min.");
  q("b5", [21], "Pool of 50 connections at 30 req/s: what is the critical timeout?", "50 ÷ 30 = 1.67 s", ["2 s", "8 s", "30 s"],
    "Above 1.67 s the pool fills up before the first slot comes back. That is why the PSP timeout dropped to 1 s.");
  q("b5", [21], "Exponential retry without jitter, 1,000 clients:", "Synchronized waves (only 4% finish in time)", ["Spreads the load over time", "Cuts the attempts in half", "Raises the cache hit rate"],
    "Without jitter they all wait the same time and come back together. Immediate retry is the cause of the storm.");
  q("b5", [21], "PSP-A's breaker at 8 s opens after how long?", "1.3 s", ["30 s", "90 s", "8 s"],
    "The breaker opens in 1.3 s and stays open 30 s before the probes. The 90 s is the duration of the incident.");

  /* ---------- Block 6: modules 22 to 25 ---------- */
  q("b6", [22], "2.5.0 returns 201 with shipping 0.00 in Recife. What catches it?", "A business metric (frete_zero by city)", ["The healthcheck", "The 5xx rate", "The pod's readiness"],
    "The version is healthy and error-free. Only a business metric by city sees the defect.");
  q("b6", [22], "The loss of rolling against that of a 10% canary:", "R$ 54,000 × R$ 450", ["R$ 0 × R$ 54,000", "R$ 450 × R$ 54,000", "R$ 9,600 × R$ 54,000"],
    "The radius is fraction × time × cost: rolling reaches 100% in 90 s; the canary stops at 10%.");
  q("b6", [22], "Does the rollback undo the orders already written with shipping 0.00?", "No: it swaps the code, not the data", ["Yes, everything goes back to the previous state", "Only with blue/green", "Yes, if there is a flag"],
    "The rollback does not touch the written data: the orders with shipping 0.00 are still there.");
  q("b6", [23], "The 2027 plan for catalogo, pedidos, pagamentos and estoque:", "14 · 10 · 15 · 2 = 41 vCPU", ["10 · 3 · 2 · 2 = 17 vCPU", "14 · 10 · 15 · 2 = 4,200 vCPU", "8 · 8 · 8 · 8 = 32 vCPU"],
    "The sum 14 + 10 + 15 + 2 gives 41 vCPU, for Black Friday on November 26, 2027.");
  q("b6", [23], "Little's Law: L =", "λ × W", ["λ ÷ W", "W ÷ λ", "λ + W"],
    "What is in use is the arrival rate times the time each one takes. That is how the pool of 20 was counted.");
  q("b6", [23], "Why is the target ρ 70% and not 100%?", "Near the knee the wait explodes", ["It costs more", "Because 100% does not exist on a CPU", "The PSP does not accept more"],
    "Near 100% utilization the queue grows without limit; at 70% there is still room for variation.");
  q("b6", [24], "In k6, where does the store 'today' break, and the plan?", "36/s and ~250/s", ["250/s and 36/s", "40/s and 150/s", "36/s and 200/s"],
    "Today the store breaks at 36/s; the plan reaches ~250/s, with p95 ≤ 800 ms and errors ≤ 0.1%.");
  q("b6", [24], "The mixed k6 scenario found…", "The 23:00 report fighting for the pool", ["Shipping 0.00", "The mkt-01 poison pill", "The retry storm"],
    "Only the test with normal traffic and the report together revealed the fight for the 20-connection pool.");
  q("b6", [25], "Pool of 20, with the report (40.4 requested). With 16 + 4, the customer gets…", "0% of 503 (the batch is the one that waits)", ["33% of 503", "10% of 503", "100% of 503"],
    "The bulkhead chose who waits: the customer goes to 0% of 503, and the report ends up with 14% success.");
  q("b6", [25], "The hot shard's radius is 60%. With a shard dedicated to mkt-01, it becomes…", "40%", ["20%", "33.3%", "60%"],
    "With non-uniform traffic the radius is the largest fraction, not 1 ÷ N: from 60% to 40%.");

  /* ---------- Block 7: modules 26 to 28 ---------- */
  q("b7", [26], "Shard, bulkhead and cell divide, respectively…", "The data, the resources and the whole stack", ["Only CPU, RAM and disk", "The network, the disk and the region", "The data, the network and the code"],
    "The shard divides the data; the bulkhead, the resources inside the stack; the cell, the whole stack with its data.");
  q("b7", [26], "The mkt-01 poison pill in 4 min: lost attempts, single stack against cells?", "7,200 × 2,880", ["2,880 × 7,200", "7,200 × 7,200", "150 × 3"],
    "In the single stack the poison pill takes everything down (7,200); in cells only celula-mkt goes down (2,880).");
  q("b7", [26], "The 2027 plan in 4 cells costs…", "53 vCPU (+12; +29.3%)", ["41 vCPU", "164 vCPU", "12 vCPU"],
    "The whole stack in each cell and the passive ones raise 41 vCPU to 53 (+12; +29.3%).");
  q("b7", [26], "From 4 to 5 cells, hash mod N moves…", "~80% (the ring ~20%; the table only whoever has to move)", ["~20%", "~50%", "0%"],
    "mod changes almost everything (~80%); the ring moves ~20%, and the mapping table only moves whoever has to move.");
  q("b7", [26], "Shuffle of 2 in 10 cells: a whole downed pair hits…", "1 ÷ 45 = 2.2% of customers", ["20%", "10%", "1 ÷ 10 = 10%"],
    "C(10, 2) = 45 possible pairs; a customer sits on only one pair, so a downed pair takes 1 ÷ 45.");
  q("b7", [27], "SP outage: MTTD of 30 s and MTTR of 35 s. The RTO is…", "65 s (counted from the interruption)", ["35 s", "30 s", "5 s"],
    "The RTO counts from the interruption and includes detection: 30 + 35 = 65 s.");
  q("b7", [27], "Expected RPO of celula-sp (9.9 orders/s, lag of 300 ms):", "2.97 orders", ["0 orders", "9.9 orders", "300 orders"],
    "9.9 × 0.3 = 2.97 orders at risk, on average.");
  q("b7", [27], "Why did number 1061 show up on two orders?", "The promoted database's sequence reused the last replicated value", ["A PSP bug", "Retry without idempotency", "Kafka duplicated the event"],
    "The promoted replica did not have the latest sequence values and reused a number already given.");
  q("b7", [28], "A 99.9% SLO over 30 days gives how many minutes of budget?", "43.2", ["4.32", "432", "0.432"],
    "0.1% × 43,200 min = 43.2 min (or 12,960 bad requests).");
  q("b7", [28], "A burn rate of 14.4× in 1 h consumes…", "2% of the budget", ["14.4% of the budget", "100% of the budget", "0.2% of the budget"],
    "14.4 × (1 h ÷ 720 h) = 2%. It is the paging rule of the short window.");
  q("b7", [28], "USE, RED and the four signals look at, respectively…", "The resource, the service and what the user feels", ["The service, the resource and what the user feels", "The user, the resource and the service", "Only the resource, in all three"],
    "USE (utilization, saturation, errors) looks at the resource; RED (rate, errors, duration), at the service; the four signals, at health for the user.");
  q("b7", [28], "With 30% fast failure (2 ms) and 70% at 275 ms, the average latency falls to…", "~193 ms (that is why you separate success and error)", ["275 ms", "2 ms", "~140 ms"],
    "0.3 × 2 + 0.7 × 275 ≈ 193 ms: the average improves while the store gets worse. Latency has to separate success and error.");

  /* ---------- Integrative ---------- */
  q("i", [8, 16, 26], "Lena's 1060 does not feel the mkt-01 poison pill. Why?", "The router reads the cliente_id and each cell is its own stack", ["The gateway filters the poison pill", "shard-2 isolates mkt-01", "The pool's bulkhead holds it"],
    "edge-loja sends mkt-01 to celula-mkt and Lena to celula-recife. The gateway only validates the token.");
  q("i", [2, 17, 27], "RAID, replica and passive cell protect, in order, against the loss of…", "A disk, a server and a region", ["A region, a server and a disk", "Only the data", "A cell, a shard and a replica"],
    "Each piece covers a size of failure: RAID, the disk; the replica, the server; the passive cell in another region, the region.");
  q("i", [6, 24, 25], "Why does the 23:00 report show up three times in the story?", "It is the noisy neighbor: it took the monolith down (6), the mixed test found it (24) and the bulkhead isolated it (25)", ["It is a report bug that was never fixed", "It is the store's only scheduled job", "The PSP only answers at that hour"],
    "The same problem comes back at different scales: the single program, the 20-connection pool and the test that found it.");
  q("i", [17, 26], "The semi-synchronous commit (12 ms) and the SP + Rio 2PC (24 ms) come from…", "The 10 ms RTT (2 + 10 = 12 and 2 × 10 + 2 × 2 = 24)", ["The disk", "Recife's 80 ms RTT", "The 300 ms lag"],
    "The math uses the SP–Rio RTT of 10 ms and the local commit of 2 ms.");
  q("i", [5, 21], "The catalog at 640 req/s, with an 80% hit rate, sends to the origin…", "128 req/s (without the cache it would be 640)", ["512 req/s", "0 req/s", "640 req/s"],
    "20% misses × 640 = 128 req/s. Without the cache, the origin would receive all 640.");
  q("i", [21, 28], "90 s of a slow PSP with no protection burn how much of the 12,960 budget?", "2,700 = 20.8%", ["90 = 0.7%", "2.7%", "12,960 = 100%"],
    "90 s × 30 req/s = 2,700 bad requests; 2,700 ÷ 12,960 = 20.8% of the budget.");
  q("i", [7, 21, 25, 26, 27], "Match the failure to the defense: stuck pod · slow PSP · report · poison pill · region", "Healthcheck · breaker and fallback · bulkhead · cell · DR", ["Breaker and fallback · healthcheck · bulkhead · cell · DR", "Bulkhead · breaker and fallback · healthcheck · DR · cell", "Cell · bulkhead · breaker and fallback · healthcheck · DR"],
    "Each defense covers a radius: the healthcheck, the pod; the breaker, the slow dependency; the bulkhead, the resource; the cell, the poison pill; DR, the region.");
  q("i", [14, 23], "On Black Friday 2027, what do you scale first (from 30 to 200 orders/s)?", "pagamentos and the database (the weakest links)", ["The catalog", "estoque", "The BFF"],
    "The weakest link rules: pagamentos (40/s) and the pedidos database (150/s) limit before the catalog and estoque.");
  q("i", [27, 28], "RPO and RTO are… And MTTD, MTTR and MTBF are…", "Objectives (contractual) · measurements", ["Measurements · objectives", "Both, objectives", "Both, measurements"],
    "RPO and RTO are targets you promise; MTTD, MTTR and MTBF are what you measure after the incident.");
  q("i", [6, 28], "What does the trace_id of 1047 link, and why does it not become a metric label?", "Logs and traces of 5 services; it has unbounded cardinality (33.3 billion series with cliente_id)", ["Metrics of 5 services; it is too small", "Only the gateway's logs; it is secret", "The databases of 5 services; it has low cardinality"],
    "The trace_id stitches logs and traces. As a metric label, every order would create a new series.");

  window.QUIZ = out;
  window.QUIZ_BLOCKS = BLOCKS;
})();
