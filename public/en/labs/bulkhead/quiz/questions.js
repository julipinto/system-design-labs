/* Question bank for the Bulkhead Pattern quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-bulkhead", name: "Introduction to Bulkhead" },
    t2: { topic: "aula-2-bulkheads-logicos-e-fisicos", name: "Logical and physical bulkheads" },
    t3: { topic: "aula-3-bulkheads-e-blast-radius", name: "Bulkheads and blast radius" },
    t4: { topic: "aula-4-bulkhead-e-sharding-funcional-e-operacional", name: "Functional and operational sharding" },
    t5: { topic: "aula-5-arquiteturas-de-referencia", name: "Reference architectures" }
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

  /* ---------- 1. Introduction to Bulkhead ---------- */
  choice("t1", 1, 1, "What does the bulkhead do?", [
    "It prevents failures from happening.",
    "It limits how far the failure reaches, by splitting a resource into compartments.",
    "It repeats the call that failed.",
    "It cuts the call off after some time."
  ], 1, "The bulkhead does not prevent the failure: a hole floods only its own compartment. Repeating is the retry and cutting off by time is the timeout.");
  choice("t1", 2, 2, "How many connections does the 23:00 report ask of the pool of 20 (10 queries/s of 4 s)?", [
    "0.2.", "4.", "40.", "20."
  ], 2, "Little: 10 × 4 = 40 connections in use. The customer asks for only 0.2 + 0.2. The report alone asks for double the pool.");
  choice("t1", 3, 2, "In k6 with the single pool, what fraction of checkout orders got a 503 in the report window?", [
    "None.", "10%: 101 of ~1,000.", "33%: 83 of 250.", "86%: 215 of 250."
  ], 2, "83 of 250 checkout orders (33%) and 101 of ~1,000 status queries (10%). The 86% is the report in the 16 + 4 pool.");
  choice("t1", 4, 2, "In the 16 + 4 pool, who pays for the split?", [
    "Checkout, with a 503.",
    "Order status, which gets slower.",
    "The report: 215 of its 250 queries get a 503.",
    "Nobody."
  ], 2, "The bulkhead did not create capacity: it chose who waits. The customer ended up with 0% of 503 and the batch with 14% success.");
  tf("t1", 5, 2, "With 4 connections, the report serves 1 query per second and the 6,000-query job takes 100 min instead of 10.", true, "4 connections ÷ 4 s = 1 query/s. 6,000 ÷ 1 = 6,000 s = 100 min, from 23:00 to 00:40.");
  choice("t1", 6, 3, "Why did checkout lose 33% and status only 10% in k6, if they compete for the same slots?", [
    "Checkout is slower by nature.",
    "k6 arrives at regular intervals: the POST and the report arrive every 100 ms, at the same instants.",
    "Status has priority on the server.",
    "The pool has separate slots for GET."
  ], 1, "With Poisson arrivals the two rates would be equal. The coinciding instants are an effect of the generator.");
  choice("t1", 7, 3, "The 1 s timeout and 20 POST/s per pod (Black Friday 2027) make the worst case of stuck workers equal to:", [
    "1.", "20 × 1 = 20: the whole pool.", "400.", "Zero, the timeout solves it."
  ], 1, "The timeout limits W; only a cap per compartment limits L. Without it, the worst case consumes the whole pool.");

  /* ---------- 2. Logical and physical bulkheads ---------- */
  choice("t2", 1, 1, "Which of these is a physical bulkhead?", [
    "A thread pool per dependency.",
    "A semaphore of 4 calls.",
    "A node pool reserved for checkout, with taints and tolerations.",
    "A queue per domain."
  ], 2, "The other three are logical: they split execution resources. The node pool splits machines.");
  choice("t2", 2, 2, "What is the difference between a semaphore and a thread pool?", [
    "The semaphore uses more threads.",
    "The semaphore counts concurrent calls, with no queue; the pool isolates blocking, with a queue and context switching.",
    "The thread pool only exists in Hystrix.",
    "They are the same mechanism."
  ], 1, "With asynchronous I/O the semaphore is enough; with a legacy library that blocks, the dedicated pool prevents the hang.");
  choice("t2", 3, 2, "By Little's math, what is the size of the split pool (interactive + batch)?", [
    "16 + 4 = 20.", "4 + 4 = 8.", "10 + 10 = 20.", "0.4 + 40."
  ], 1, "Interactive uses 0.4 and with 10× headroom 4 is enough; batch gets a cap of 4. The other 12 connections go back to max_connections.");
  choice("t2", 4, 2, "12 workers in 1 pool at 70% load: the chance of waiting is 18.4%. And in 3 pools of 4?", [
    "6.1%.", "18.4%.", "42.9%.", "100%."
  ], 2, "Splitting loses statistical multiplexing: the average wait goes from 2.6 ms to 17.9 ms (S = 50 ms).");
  choice("t2", 5, 3, "How many workers per pool match the single pool's chance of waiting (≈ 18.4%)?", [
    "4, at no cost.", "5 per pool: 15 in total, +25%.", "8 per pool: 24 in total.", "No number matches it."
  ], 1, "With 5 per pool the chance is 19.0%. To match the average wait it takes 6 per pool (18, +50%).");
  choice("t2", 6, 3, "relatorios, with no memory limits, leaks on the node where 3 pedidos pods run. What fails?", [
    "The pedidos thread pool.",
    "The node's memory: eviction and OOM hit the neighbors (shared fate).",
    "The database connection pool.",
    "Nothing: the logical bulkhead holds."
  ], 1, "The node's memory is not a pool. The physical fix completes the logical one: requests and limits, and one node pool for checkout and another for batch.");
  tf("t2", 7, 1, "PostgreSQL's max_connections is 100, with 3 reserved for the superuser.", true, "That leaves 97 for the others. Splitting the pool can give connections back to this limit.");

  /* ---------- 3. Bulkheads and blast radius ---------- */
  choice("t3", 1, 1, "With 5 compartments and uniform traffic, what is the radius of an incident?", [
    "50%.", "33%.", "20%.", "5%."
  ], 2, "1 ÷ 5 = 20%, and availability during the incident is 80%.");
  choice("t3", 2, 2, "With 3 shards at 20% · 20% · 60%, what is the worst case?", [
    "33.3%.", "20%.", "60%.", "40%."
  ], 2, "The average of the three is 33.3%, but the mkt-01 shard's radius is 60%. The 1 ÷ N table only holds with uniform traffic.");
  choice("t3", 3, 2, "With the shard dedicated to mkt-01 (20% · 20% · 20% · 40%), the worst case becomes:", [
    "60%.", "40%.", "25%.", "20%."
  ], 1, "The dedicated shard takes the worst case from 60% to 40%. It does not reach 25% because mkt-01 still weighs 40%.");
  choice("t3", 4, 2, "How many pairs are there in shuffle sharding of 2 replicas out of 10, and what is the worst case?", [
    "10 pairs, 10%.", "20 pairs, 5%.", "45 pairs, 2.2%.", "90 pairs, 1.1%."
  ], 2, "C(10, 2) = 45. The worst case takes down 1 ÷ 45 = 2.2% of customers, against 20% with fixed groups of 2 out of 10.");
  choice("t3", 5, 3, "Each compartment is down 0.1% of the time. The chance that some of 50 are down is:", [
    "0.1%.", "0.30%.", "4.88%.", "50%."
  ], 2, "1 − 0.999^50 = 4.88%. The radius per incident falls, the number of incidents rises. The chance of all being down, p^N, disappears (10^-9 with 3).");
  tf("t3", 6, 2, "Bulkhead improves each customer's mean time to failure.", false, "For a customer who depends on one compartment, unavailability stays at 0.1%. The bulkhead reduces the size of the incident and eliminates the total outage.");
  choice("t3", 7, 3, "The 3 pedidos shards call the same estoque. If estoque goes down, the radius is:", [
    "33.3%.", "60%.", "100%.", "20%."
  ], 2, "It is a hidden channel: a global dependency cancels the split into shards. The estoque radius is 100%.");

  /* ---------- 4. Functional and operational sharding ---------- */
  choice("t4", 1, 1, "The functional bulkhead splits by:", [
    "Customer.", "Region.", "Function: what the system does (Y axis).", "Data volume."
  ], 2, "Functional is the Y axis (module 15): pedidos, relatorios, entregas. Operational is the Z axis (module 16): by volume or customer.");
  choice("t4", 2, 2, "Which of these is an example of an operational bulkhead?", [
    "relatorios reading from the Rio replica.",
    "entregas on Kafka.",
    "The 3 pedidos shards by cliente_id and the dedicated mkt-01 shard.",
    "Thread pools per dependency."
  ], 2, "Operational splits by how much and whose. The report on the replica and entregas are splits by function.");
  choice("t4", 3, 2, "The 50,000-email newsletter on the same topic as pedidos, with 3 consumers at 40 events/s each, delays the order events by about:", [
    "0 s.", "50 s.", "417 s (≈ 7 min).", "50,000 s."
  ], 2, "50,000 ÷ 120 = 417 s. On a separate queue (RabbitMQ), the order delay is 0.");
  choice("t4", 4, 2, "20 workers in lanes of 12 · 6 · 2. A reprocessing burst (low) can use:", [
    "All 20.", "12 workers.", "At most 2 workers.", "6 workers."
  ], 2, "The low lane has a cap of 2. Checkout keeps the 12 slots of the high lane.");
  tf("t4", 5, 2, "The 23:00 report reading from the Rio replica uses 0% of the primary's write capacity.", true, "The 300 ms lag on Black Friday does not matter to a report, and the heavy query does not touch the primary.");
  choice("t4", 6, 3, "The dedicated mkt-01 shard has its own database, but uses the same estoque and the same global configuration. What is this?", [
    "Reservation with borrowing.", "A hidden channel: the isolation has a hole.", "Consistent hashing.", "A complete physical bulkhead."
  ], 1, "Without separating the whole path (load balancer, application, database, queue), the isolated boxes share a single fate.");
  choice("t4", 7, 3, "About consistent hashing, which statement is correct?", [
    "The hash isolates the resources.",
    "The hash routes; the isolation comes from the resources being separate per shard. When N changes, 25% of keys migrate.",
    "It removes the need for shards.",
    "It only works with round robin."
  ], 1, "The article calls the hash deterministic, but the isolation depends on each shard having its own resources.");

  /* ---------- 5. Reference architectures ---------- */
  choice("t5", 1, 1, "Which design answers the question 'what must not fail'?", [
    "Priority.", "Criticality.", "Type of use.", "Segment."
  ], 1, "Priority is what gets served first. Criticality is what must not fail: pagamentos, with card scope, on its own node pool.");
  choice("t5", 2, 2, "What is the price of the design by type of use (interactive × batch)?", [
    "Idle capacity in the quiet lanes.",
    "Resharding.",
    "Two pipelines to operate.",
    "Limits to maintain."
  ], 2, "Batch gets its own queue, workers and even pipeline, and can be delayed or paused without touching checkout's p95.");
  choice("t5", 3, 2, "The mkt-01 bot (500 req/s) against catalogo (1,000 req/s) with no cap consumes:", [
    "10%.", "25%.", "50%.", "100%."
  ], 2, "500 of 1,000 req/s: half the fleet. With the cap of 100, the other 900 req/s are guaranteed.");
  choice("t5", 4, 2, "With the 100 req/s cap, what happens to the bot's 400 excess req/s?", [
    "They delay the other customers.", "They get a 429 in its own compartment.", "They go to the dedicated shard.", "They are queued forever."
  ], 1, "The 429 happens in the tenant's compartment. It is failing fast, without taking a slot from anyone.");
  tf("t5", 5, 2, "A per-customer rate limit with a guaranteed reservation for the others is a form of operational bulkhead.", true, "The rule is the scope: the global limit protects the total; the per-tenant cap with reservation protects each flow from the others.");
  choice("t5", 6, 3, "3 lanes × 4 shards, with N+1 pods in each compartment, give how many pods where 10 were enough?", [
    "12.", "13.", "24.", "30."
  ], 2, "12 compartments × 2 pods (1 working and 1 spare) = 24 pods. Too many bulkheads is idle capacity and more to operate.");
  choice("t5", 7, 3, "What is the right question before creating one more compartment?", [
    "How many servers are left?",
    "Which real incident does this compartment prevent, and what does it cost?",
    "What is the largest possible N?",
    "What does the article's table say?"
  ], 1, "Each split reduces the radius and increases the bill: idle pods, saturation to measure per compartment and more to operate.");

  window.QUIZ = out;
})();
