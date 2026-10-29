/* Question bank for the Cell-Based Architecture quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-cell-based", name: "Introduction to Cell-Based" },
    t2: { topic: "aula-2-estrutura-celular", name: "Cell structure" },
    t3: { topic: "aula-3-roteamento-celular", name: "Cell routing" },
    t4: { topic: "aula-4-replicacao-celular", name: "Cell replication" }
  };

  var out = [];
  function add(k, n, type, level, prompt, options, answer, explain) {
    var t = T[k];
    out.push({
      id: k + "-" + (n < 10 ? "0" : "") + n,
      topic: t.topic,
      group: t.group || t.topic,
      topicName: t.name,
      type: type,
      level: level,
      prompt: prompt,
      options: options,
      answer: answer,
      explain: explain
    });
  }
  function choice(k, n, level, prompt, options, answer, explain) { add(k, n, "choice", level, prompt, options, answer, explain); }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. Introduction to Cell-Based ---------- */
  choice("t1", 1, 1, "What does the cell divide that the bulkhead and the shard do not?", [
    "Only the data, by key.",
    "Only the resources, like pools and lanes.",
    "The whole stack: lb, gateway, services, database, Redis and topic.",
    "Only the network between services."
  ], 2, "The shard divides the data, the bulkhead divides the resources and the cell divides the whole stack, with its own queue, database and cache.");
  choice("t1", 2, 2, "Why did the quantity 2147483648 take down the 3 pedidos pods in ~150 ms?", [
    "It overflowed the int32 and gw-loja retried up to 3 times; each attempt took down a pod (3 × ~50 ms).",
    "It exhausted Redis memory.",
    "The database refused the connection.",
    "The balancer sent everything to a single pod."
  ], 0, "pedidos 2.6.0 panics when adding up the total. The Idempotency-Key does not help, because the crash comes before any deduplication.");
  choice("t1", 3, 2, "How many attempts fail in the single stack and how many with 4 cells, in 4 min at 30 orders/s?", [
    "7,200 against 2,880.",
    "7,200 against 7,200.",
    "2,880 against 7,200.",
    "2,880 against 0."
  ], 0, "30 × 240 = 7,200 (100% of the traffic). With cells, only celula-mkt goes down: 12 × 240 = 2,880 (40%), all from the partner.");
  choice("t1", 4, 2, "What are the traffic shares of the store's four cells?", [
    "25% each.",
    "celula-mkt 40%, celula-sp 33%, celula-rio 15% and celula-recife 12%.",
    "celula-sp 55%, celula-rio 25% and celula-recife 20%.",
    "celula-mkt 10% and the other three 30%."
  ], 1, "The 55 · 25 · 20% from module 22 apply to the 60% that is not mkt-01; the partner takes the other 40%.");
  tf("t1", 5, 2, "With the four cells, the worst-case blast radius is 25% (1 ÷ N).", false, "The radius is each cell's share. The worst case is 40% (celula-mkt), the average is 25% and the efficiency is 62.5%.");
  choice("t1", 6, 3, "Four cells connected to the same stock and the same Redis. What happens to the radius?", [
    "It stays at 40% in the worst case.",
    "It drops to 25%.",
    "It goes back to 100%: it is the hidden channel, and the isolation becomes decoration.",
    "It goes to 0% for the individual customer."
  ], 2, "If a shared part fails, the four cells stop together. The cell only isolates what it divides.");
  tf("t1", 7, 2, "For WSO2, a \"cell\" is the copy of the stack per share of customers, as in AWS.", false, "WSO2 uses cell for a team's bounded context (\"no cells inside cells\"). They are two patterns with the same name; the module uses the AWS one.");

  /* ---------- 2. Cell structure ---------- */
  choice("t2", 1, 1, "What are the five dimensions along which the cell isolates?", [
    "CPU, memory, disk, network and power.",
    "Execution, persistence, observability, deploy and failure.",
    "Read, write, cache, queue and log.",
    "Dev, test, staging, production and DR."
  ], 1, "If one is missing, the design is only a shard (data) or only a bulkhead (resources).");
  tf("t2", 2, 1, "Inside a cell, a service can call the neighboring cell's stock when its own is slow.", false, "The internal components only know the ones in their own cell. All outside communication goes through the gateway.");
  choice("t2", 3, 2, "How much does the floor cost in the 2027 plan?", [
    "41 vCPU in the single stack against 53 in the 4 cells (+12, +29.3%).",
    "41 against 41, because the load is the same.",
    "41 against 164.",
    "9 against 8."
  ], 0, "estoque goes from 2 to 8 replicas (the floor), pedidos and pagamentos pay the rounding per cell and the catalog reserves 2 for the mkt-01 cap.");
  choice("t2", 4, 2, "On a regular day (5 orders/s) how much do the single stack and the 4 cells at the floor cost?", [
    "9 and 32 vCPU: 3.6×.",
    "9 and 18 vCPU: 2×.",
    "32 and 9 vCPU.",
    "5 and 20 vCPU."
  ], 0, "Single stack: 2 + 3 + 2 + 2 = 9. Four cells, 4 services × 2 replicas × 4 cells = 32. It is the loss of statistical multiplexing (Erlang C, module 25).");
  choice("t2", 5, 2, "How are the 19 cats split across the cells, in proportion to demand?", [
    "5 · 5 · 5 · 4.",
    "sp 6 · rio 3 · recife 2 · mkt 8.",
    "sp 10 · rio 5 · recife 4 · mkt 0.",
    "All in celula-mkt."
  ], 1, "33 · 15 · 12 · 40% of 19 give 6.3 · 2.9 · 2.3 · 7.6; rounded, 6 · 3 · 2 · 8 (sum 19).");
  choice("t2", 6, 3, "Order 1060 takes the 2 cats from celula-recife. What does the next Recife customer see?", [
    "The cat available, coming from SP in seconds.",
    "\"Sold out\", with 17 cats in the network; the control plane can rebalance.",
    "A 500 error.",
    "The price doubled."
  ], 1, "The cell's allocation hit zero. The ways out: accept the local sold out, rebalance (async, the one adopted) or reserve across cells with a saga (couples two cells).");
  order("t2", 7, 2, "Put the per-cell deploy rings in order.", [
    "Cell zero (0%)",
    "celula-recife (12%)",
    "celula-rio (27%)",
    "celula-sp (60%)",
    "celula-mkt (100%)"
  ], "Each ring adds to the previous one. Cell zero, with the synthetic customers sint-01…03, finds the defect before any real customer.");
  choice("t2", 8, 3, "Version 2.5.0 from module 22 (shipping 0.00 in Recife) is released by celula-recife first. Why does that not protect you?", [
    "Because the regional cell is not representative of the regional defect: 100% of the Recife customers would be affected.",
    "Because Recife has no customers.",
    "Because shipping does not use the database.",
    "Because cell zero is the last one."
  ], 0, "The protection comes from cell zero with a Recife ZIP code: it finds the frete_zero with 1 synthetic order and a loss of R$ 0.");

  /* ---------- 3. Cell routing ---------- */
  choice("t3", 1, 1, "Which three qualities does the router need?", [
    "Smart, with business logic and its own cache.",
    "Thin, deterministic and more available than the cells.",
    "Fast, cheap and colorful.",
    "Stateful, unique and manual."
  ], 1, "AWS asks for the thinnest possible layer, with no business logic, simple enough to test in full. The article asks for \"smart\": here AWS wins.");
  choice("t3", 2, 2, "From 4 to 5 cells, how much does each mapping method move?", [
    "mod N 80.1% · ring ~20% · table 0.",
    "mod N 20% · ring 80% · table 0.",
    "All 20%.",
    "mod N 0 · ring 0 · table 80%."
  ], 0, "The registry table only moves the ones you move; mod N reshuffles almost everything (rehash storm); the ring moves about 1 ÷ (N + 1).");
  choice("t3", 3, 2, "How big is the cliente_id → cell map and where does it live?", [
    "150 MB (1.5 million × ~100 B), in memory at the edge.",
    "150 GB, in a central database.",
    "150 KB, in the JWT.",
    "1.5 GB, in each cell's Redis."
  ], 0, "It is small enough to live in the memory of edge-loja, which keeps routing with the last map if the control plane goes down (static stability).");
  choice("t3", 4, 2, "The router has 99.99% and the cell has 99.9%. What is the availability of the chain?", [
    "99.99%.",
    "99.89%.",
    "99.9%.",
    "100%."
  ], 1, "In series it multiplies: 0.9999 × 0.999 = 0.9989. The router is the ceiling for all the cells.");
  choice("t3", 5, 2, "On the shared pedidos topic, the consumer crashes when deserializing the poison. How many events get stuck in 10 min?", [
    "24,000, of which 14,400 are from individual customers.",
    "9,600, all from the partner.",
    "600.",
    "None: the DLQ solves it."
  ], 0, "The failure happens before the DLQ policy. 40 events/s on the partition × 600 s = 24,000; 60% are from individual customers (Lena's PedidoPago, delayed).");
  tf("t3", 6, 2, "With per-cell topics, the mkt-01 poison traps 9,600 events and the other three cells keep a lag of 0.", true, "pedidos.mkt receives 12 × 4 ÷ 3 = 16 events/s per partition: 16 × 600 = 9,600, all from the partner.");
  choice("t3", 7, 3, "mapa-v43 ships with bia-31 → celula-xx and is published to all the edges at once. What is the fix?", [
    "Restart Kafka.",
    "Validate the map first, publish per edge (rings) and keep the last good map.",
    "Swap hash mod N for the ring.",
    "Raise the floor."
  ], 1, "The config is shared, and the radius is back to 100%. Static stability protects against the control plane going down, not against a bad map it published itself.");

  /* ---------- 4. Cell replication ---------- */
  choice("t4", 1, 1, "What is the expected loss of asynchronous replication between cells?", [
    "Rate × lag.",
    "Lag ÷ rate.",
    "Always zero.",
    "RTT × 2."
  ], 0, "Orders that were in flight in the lag window when the active went down: celula-sp 9.9 × 0.3 = 2.97; celula-mkt 12 × 0.8 = 9.6.");
  choice("t4", 2, 2, "The cell reduces the loss in orders because it…", [
    "reduces the rate per primary, not the lag.",
    "zeroes the lag.",
    "uses 2PC.",
    "deletes the old orders."
  ], 0, "Before, with a single primary at 30/s: Rio lost 9 and Recife 24. With cells each primary's rate is lower.");
  choice("t4", 3, 2, "What is the modeled 2PC commit latency between SP and Rio, and between SP, Rio and Recife (RTTs 10 and 80 ms, local commit 2 ms)?", [
    "24 ms and 164 ms.",
    "10 ms and 80 ms.",
    "2 ms and 2 ms.",
    "12 ms and 82 ms."
  ], 0, "2 rounds (prepare and commit) × the slowest participant + 2 × 2 ms: 2 × 10 + 4 = 24; 2 × 80 + 4 = 164. It is a model of rounds, not a measurement. The 12 and 82 ms are from the synchronous replication of a single database (module 17).");
  choice("t4", 4, 2, "With 2PC, how many reservations per second fit on a hot row (the cat's stock)?", [
    "500 (async), 41.7 (SP + Rio) and 6.1 (SP + Rio + Recife).",
    "500 in all of them.",
    "24 and 164.",
    "1,000, 500 and 250."
  ], 0, "The lock is held during the rounds: 1 ÷ 2 ms, 1 ÷ 24 ms, 1 ÷ 164 ms.");
  choice("t4", 5, 2, "With N equal cells and a target ρ of 70%, what is the maximum normal occupancy to survive one outage with N = 2 and with N = 20?", [
    "35% and 66.5%.",
    "70% in both.",
    "50% and 95%.",
    "66.5% and 35%."
  ], 0, "70% × (N − 1) ÷ N. Active-passive pairs force you to run at 35%; many small cells run close to the target.");
  choice("t4", 6, 3, "celula-sp (33%) goes down and only Rio's passive takes it over. What happens to Rio?", [
    "It goes from 15% to 48% of the traffic (4.5 → 14.4 orders/s, 3.2×), not +33%.",
    "It goes up 33%.",
    "It drops to 0%.",
    "Nothing: the passive has infinite capacity."
  ], 0, "Unequal cells make the headroom worse. Ways out: run at 35%, have many small cells or degrade by priority (the 12 · 6 · 2 lanes from module 25).");
  choice("t4", 7, 2, "What is the exact probability that a customer has all its k cells among the f that went down, with N = 20 and f = k = 2?", [
    "1% (the article's formula).",
    "0.526% (1 ÷ 190).",
    "5%.",
    "0.009%."
  ], 1, "(f/N)^k is an approximation (drawing with replacement). The exact one is C(f,k) ÷ C(N,k). With N = 10 it is 2.22%; with N = 4, 16.7%.");
  choice("t4", 8, 3, "In shuffle with 10 cells, the mkt-01 poison ({8, 9}) takes down cells 8 and 9. Who loses service completely?", [
    "Bia {4, 6} and Caio {1, 4}.",
    "Lena {6, 8} and Davi {1, 9}.",
    "Only whoever has exactly {8, 9}, 1 in 45 (2.2%): mkt-01 itself.",
    "Everyone."
  ], 2, "Bia and Caio do not even notice; Lena and Davi lose one cell and keep the other. The 8 survivors take on +25% (2 ÷ 8) each.");

  window.QUIZ = out;
})();
