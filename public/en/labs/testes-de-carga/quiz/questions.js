/* Question bank for the Load and Stress Testing quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-importancia-dos-testes-de-carga", name: "Why load tests matter" },
    t2: { topic: "aula-2-testes-de-carga-vs-estresse", name: "Load vs. stress tests" },
    t3: { topic: "aula-3-smoke-tests", name: "Smoke tests" },
    t4: { topic: "aula-4-teste-de-media-average-load", name: "Average load test" },
    t5: { topic: "aula-5-teste-de-estresse", name: "Stress test" },
    t6: { topic: "aula-6-teste-de-spike", name: "Spike test" },
    t7: { topic: "aula-7-teste-de-breakpoint", name: "Breakpoint test" },
    t8: { topic: "aula-8-respondendo-a-perguntas-chave", name: "Answering the key questions" },
    t9: { topic: "aula-9-metricas-e-service-levels", name: "Metrics and service levels" },
    t10: { topic: "aula-10-estrategias-de-pre-teste", name: "Pre-test strategies" },
    t11: { topic: "aula-11-assessment-de-performance", name: "Performance assessment" }
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

  /* ---------- 1. Why load tests matter ---------- */
  choice("t1", 1, 1, "What is a plan without a test, in this lesson?", [
    "A guarantee.", "A hypothesis.", "A target.", "A report."
  ], 1, "Module 23's plan (300/s nominal, 210 sustainable) is a calculation. A load test is how you refute it with a number.");
  choice("t1", 2, 1, "What are the checkout's targets in this module?", [
    "p95 ≤ 300 ms and errors ≤ 1%.", "p95 ≤ 800 ms and errors ≤ 0.1%.", "Average ≤ 800 ms and errors ≤ 0%.", "p99 ≤ 2 s and errors ≤ 5%."
  ], 1, "They are the checkout's from module 23, written as k6 thresholds: http_req_duration p(95)<800 and http_req_failed rate<0.001.");
  choice("t1", 3, 2, "What is the system tested in this module?", [
    "The production store.", "A pre-production with 1 pod per service.", "A checkout queueing simulator, in Node.", "A PostgreSQL database."
  ], 2, "k6 and the outputs are real; the system is a model: each pod is a FIFO queue with exponential time.");
  choice("t1", 4, 2, "What do the chain's service times add up to, with no queueing?", [
    "33 ms.", "91.7 ms.", "259 ms.", "800 ms."
  ], 1, "33 (pedidos) + 50 (pagamentos) + 2 (estoque) + 6.67 (DB) = 91.7 ms.");
  choice("t1", 5, 3, "Why does extrapolating from 1 pod per service to 10 pods mislead?", [
    "Because k6 doesn't count pods.", "It gives ~300/s, but the hot mkt-01 shard caps the plan at ~250/s.", "Because pedidos doesn't scale.", "Because the smoke fails."
  ], 1, "One pedidos pod does 30/s and 10 pods would do ~300/s. shard-2 gets 60% of the traffic and handles 150/s: 150 ÷ 0.6 = 250/s.");

  /* ---------- 2. Load vs. stress tests ---------- */
  choice("t2", 1, 1, "What is the difference between load and stress?", [
    "Load is the expected; stress is the adverse.", "Load is longer; stress is shorter.", "Load uses k6; stress uses another tool.", "There is no difference."
  ], 0, "Load measures the target at the expected load. Stress goes above it, in peaks, to see what degrades and how it comes back.");
  choice("t2", 2, 2, "What is the formula that links VUs to rate?", [
    "VUs = rate ÷ response.", "VUs = rate × (response + pause).", "VUs = rate + pause.", "VUs = response × pause."
  ], 1, "It is Little's Law. For 200 orders/s with 0.4 s of response and a 3 s pause: 680 VUs.");
  choice("t2", 3, 2, "What did 20 VUs in the closed model give, on 'today'?", [
    "54/s and 52% errors.", "38.1/s and 0% errors.", "60/s and 8.35% errors.", "20/s and 0% errors."
  ], 1, "With 20 VUs: 38.1 req/s, average of 520 ms, p95 of 1.07 s and 0% errors. Little checks out: 20 = 38.07 × 0.520.");
  choice("t2", 4, 3, "Why does the closed test 'pass' while the open one at 54/s breaks?", [
    "Because the closed one uses more CPU.", "Because each VU waits for the response and the generator regulates itself (coordinated omission).", "Because the open one has a bug.", "Because the closed one has a longer timeout."
  ], 1, "The closed model sends less when the system slows down and omits the requests it should make. The open one keeps the rate.");
  tf("t2", 5, 2, "800 users for 600 TPS imply a 1.33 s cycle per user.", true, "800 ÷ 600 = 1.33 s. The report doesn't say how much is response and how much is pause.");

  /* ---------- 3. Smoke tests ---------- */
  choice("t3", 1, 1, "What does the smoke answer?", [
    "What the breaking point is.", "Whether the checkout works at minimal load and the test runs.", "Whether Black Friday fits.", "What the p99 is."
  ], 1, "It is a minimal load: 2 orders/s for 30 s. It doesn't measure capacity.");
  choice("t3", 2, 2, "How many requests did the 2/s smoke over 30 s make, and with which p95?", [
    "30 and 80 ms.", "61 and 155.6 ms.", "600 and 381 ms.", "3,601 and 381 ms."
  ], 1, "61 requests, average of 81.9 ms, p95 of 155.6 ms and 0% errors.");
  choice("t3", 3, 2, "Which exit code does k6 return when a threshold fails?", [
    "0.", "1.", "99.", "255."
  ], 2, "The 99 is what the pipeline reads. The 0 is for when everything passed.");
  choice("t3", 4, 3, "Why does a smoke with a single customer (lena-77) mislead?", [
    "Because k6 refuses a single customer.", "It always lands on shard-1 and never exercises mkt-01's shard-2.", "Because murmur3 fails.", "Because the rate stays low."
  ], 1, "murmur3(lena-77) mod 3 = 1. shard-2, where the plan breaks, is never touched.");
  tf("t3", 5, 2, "Checking only the 201 status catches an error in the shipping calculation.", false, "A wrong shipping value returns 201 all the same. The check has to look at the response content.");

  /* ---------- 4. Average load test ---------- */
  choice("t4", 1, 1, "What does average load check?", [
    "The breaking point.", "The target at the expected load, for long enough.", "The recovery from a burst.", "The minimum that works."
  ], 1, "It answers about the normal store. The article says to run it for hours or days to find leaks.");
  choice("t4", 2, 2, "What were the average and p95 of 30 orders/s over 2 min on 'today'?", [
    "81.9 ms and 155.6 ms.", "157.5 ms and 381.3 ms.", "419 ms and 1.48 s.", "259 ms and 800 ms."
  ], 1, "3,601 requests, average 157.5 ms, p95 381.3 ms, p99 498.6 ms and 0% errors.");
  choice("t4", 3, 2, "Why did k6 measure 157 ms against M/M/1's ~259 ms?", [
    "k6 measures wrong.", "Round robin makes arrivals more regular than a random draw.", "The simulator has no queue.", "M/M/1 ignores pagamentos."
  ], 1, "Regular arrivals wait less. Module 23's model is conservative, and measuring tells you by how much.");
  choice("t4", 4, 2, "What is the Black Friday 2027 average, in orders per second?", [
    "45.", "125.", "200.", "300."
  ], 1, "200 × 400 ÷ 640 = 125 orders/s. On the plan, p95 of 247 ms and 0% errors.");
  tf("t4", 5, 3, "Passing the average test at 125/s proves the plan handles the 200/s peak.", false, "The same environment's breakpoint breaks at ~250/s. The average answers 'is the normal store doing fine?', not 'does Black Friday fit?'.");

  /* ---------- 5. Stress test ---------- */
  choice("t5", 1, 1, "What does stress observe besides the size of the load?", [
    "The color of the dashboard.", "What degrades first and how it recovers.", "The number of VUs.", "The cloud bill."
  ], 1, "It takes the load above the expected, in steps, and measures the degradation and the recovery.");
  order("t5", 2, 2, "Put plan 2's staircase in the order of the levels (rate in orders/s):", [
    "100", "200", "250", "300"
  ], "The staircase is 100 → 200 → 250 → 300 → 100, with 20 s climbs and 45 s levels.");
  choice("t5", 3, 2, "Up to how much did the target (p95 ≤ 800 ms) hold on plan 2's staircase?", [
    "Up to 100/s.", "Up to 200/s.", "Up to 250/s (worst window, 738 ms).", "Up to 300/s."
  ], 2, "At 300/s the p95 was 1.5 to 2 s and errors were between 0.7% and 5.1%.");
  choice("t5", 4, 3, "Why is the recovery after stress fast?", [
    "Because the HPA scales.", "Because the bottleneck discards what already expired (2 s) and the queue empties.", "Because k6 lowers the load by itself.", "Because the dedicated shard absorbs it."
  ], 1, "On the return to 100/s the p95 fell to ~244 ms in one to two windows (10 to 20 s).");
  tf("t5", 5, 3, "Above the ceiling, more load produces more completed orders.", false, "The goodput of 'today' drops from ~40 to ~26/s: pagamentos spends capacity on those who already gave up.");

  /* ---------- 6. Spike test ---------- */
  choice("t6", 1, 1, "What does the spike test?", [
    "The worst case for CPU.", "A sudden jump in load that comes back: does it absorb and recover?", "A whole day's load.", "Just the smoke twice."
  ], 1, "It asks whether the system absorbs the burst, whether it recovers and how long that takes.");
  choice("t6", 2, 2, "At the top of the spike (60/s offered), what was the error range on 'today'?", [
    "0% to 1%.", "5% to 10%.", "47% to 65%.", "100%."
  ], 2, "The goodput was between 21 and 30/s, less than the ~40/s of capacity. The p95 at the jump was 1.05 s.");
  choice("t6", 3, 2, "How many orders go unserved while the HPA (60 s) reacts?", [
    "200.", "600.", "1,200.", "3,600."
  ], 2, "20 orders/s above capacity × 60 s = 1,200 orders refused or delayed.");
  choice("t6", 4, 2, "What is the fix for a known burst like the 8 PM newsletter?", [
    "Turn off k6.", "Pre-scale beforehand, like at 7:50 PM.", "Raise the timeout.", "Switch models."
  ], 1, "The HPA reacts in ~60 s. Module 23's plan says to pre-scale at 7:50 PM.");
  tf("t6", 5, 3, "The p95 recovering to 168 ms in one window shows the system got fast.", false, "The simulator discards what goes past 2 s: the queue turned into 504. The quick recovery is, in part, error.");

  /* ---------- 7. Breakpoint test ---------- */
  choice("t7", 1, 1, "What are the three 'breaking' points?", [
    "CPU, memory and network.", "Target (p95), errors and collapse (goodput drops).", "Smoke, average and spike.", "Start, middle and end of the ramp."
  ], 1, "The target falls with p95 > 800 ms, errors go past 0.1% and the collapse is when the goodput drops.");
  choice("t7", 2, 2, "Where does the plan (without a dedicated shard) break, and why?", [
    "300/s, because of pagamentos.", "~250/s, because of mkt-01's hot shard (60% × 250 = 150/s).", "~36/s, because of pedidos.", "~500/s, because of estoque."
  ], 1, "The shard's ceiling is 150/s and shard-2 gets 60% of the traffic: 150 ÷ 0.6 = 250/s.");
  choice("t7", 3, 2, "Where does the target fall on 'today', in steady state (2 min step)?", [
    "33/s.", "36/s (p95 798 ms).", "42/s.", "60/s."
  ], 1, "The ramp said 35 to 39; the 36/s step gave a p95 of 798 ms and the 33/s one, 431 ms. Errors come at ~42/s.");
  choice("t7", 4, 3, "Why does k6's abortOnFail come late?", [
    "Because it evaluates the cumulative p95, not the window.", "Because it only looks at errors.", "Because k6 ignores thresholds.", "Because it runs at the end."
  ], 0, "It stopped at 128 s with a cumulative 894 ms, when the 100–110 s window had already crossed 800 ms.");
  choice("t7", 5, 3, "What is the risk of a breakpoint in an elastic environment?", [
    "k6 hangs.", "The HPA hides the limit and the test finds the limit of the cloud bill.", "The p95 goes negative.", "The database goes read-only."
  ], 1, "k6 says to turn elasticity off to find the system's limit and test autoscaling separately.");
  tf("t7", 6, 2, "A short ramp gives an optimistic point because the queue is still filling.", true, "The ramp locates (~4% optimistic); the 2 min step confirms.");

  /* ---------- 8. Answering the key questions ---------- */
  choice("t8", 1, 1, "What should a test have before injecting load?", [
    "More VUs.", "A question to answer.", "A bigger server.", "A pretty dashboard."
  ], 1, "Without the question, the test becomes 'injecting load for its own sake' and decides nothing.");
  choice("t8", 2, 2, "How many VUs does 200 orders/s need with 0.4 s of response and a 3 s pause?", [
    "80.", "200.", "680.", "1,200."
  ], 2, "(0.4 + 3) × 200 = 680 VUs.");
  choice("t8", 3, 2, "What is the store's journey in place of the article's mix?", [
    "Card 50 · instant 30 · boleto 15 · refund 5.", "Card 60 · Pix 35 · refund 5.", "Card only.", "Pix 100."
  ], 1, "It is a declared example. At 200 orders/s: 120, 70 and 10 per second.");
  choice("t8", 4, 3, "With 5% search (80 ms) and 95% page (10 ms), what is the capacity per replica and how many replicas does the catalog need?", [
    "100 req/s and 14.", "74 req/s and 19.", "50 req/s and 28.", "200 req/s and 7."
  ], 1, "Average cost of 13.5 ms: 74 req/s per replica. 950 ÷ (74 × 0.7) = 18.3: 19 replicas.");
  tf("t8", 5, 3, "Testing only GET /produtos/42 sizes the catalog correctly for the real journey.", false, "It gives 100 req/s per replica and 14 replicas, where the real journey handles 74 and needs 19.");

  /* ---------- 9. Metrics and service levels ---------- */
  choice("t9", 1, 1, "What is the target's latency metric?", [
    "The average.", "The p95.", "The minimum.", "The maximum."
  ], 1, "The target is p95 ≤ 800 ms. The average hides the tail: a 157 ms average had a p99 of 499 ms.");
  choice("t9", 2, 2, "What is the difference between p95 per window and cumulative?", [
    "None.", "The cumulative weighs the whole test and lags; the window locates the break.", "The cumulative is more precise.", "The window only exists in Prometheus."
  ], 1, "The abort at 128 s (894 ms cumulative) came after the 100–110 s window (820 ms).");
  choice("t9", 3, 2, "A result of 400 ms against an expectation of '< 400 ms': did it pass?", [
    "Passed.", "Failed: 400 is not less than 400.", "Depends on the p99.", "Passed, if errors are 0%."
  ], 1, "The author's report says 'came close to the limit', but by its own target the result doesn't pass.");
  choice("t9", 4, 2, "What does the article lack besides average and p95?", [
    "The chart color.", "The p99, the goodput and dropped_iterations.", "The customer's name.", "The payload size."
  ], 1, "Goodput is what completed; dropped_iterations shows the generator out of breath.");
  tf("t9", 5, 2, "The chain's p95 is the sum of each service's p95.", false, "Percentiles don't add up: the chain's p95 is the percentile of the complete responses (module 14).");

  /* ---------- 10. Pre-test strategies ---------- */
  choice("t10", 1, 1, "What does the pre-test measure?", [
    "The whole store.", "One unit (1 replica), then N, until the link changes.", "Just the database.", "The deploy time."
  ], 1, "It gives the capacity per replica for the plan and shows where the bottleneck moves to another piece.");
  choice("t10", 2, 2, "At which rates did the target fall with 1, 2 and 3 pedidos pods (pagamentos unlimited)?", [
    "~10, ~20, ~30/s.", "~35, ~62 and ~88/s.", "~100, ~200 and ~300/s.", "~250, ~260 and ~300/s."
  ], 1, "Linear capacity, ~30/s per pod, and the target falls close to the nominal (30, 60 and 90).");
  choice("t10", 3, 3, "Why does 'today' (3 pods) break at 36/s and not at ~88/s?", [
    "k6 is wrong.", "pagamentos, with 2 pods of 20/s, is the link: the link changes.", "estoque is slow.", "The dedicated shard is missing."
  ], 1, "With pagamentos 'infinite' 3 pods would go past 85/s. With 2 pods, the chain is limited to ~40/s nominal.");
  choice("t10", 4, 2, "How do you do the async unit validation?", [
    "Turn off the queue.", "Dam up a large queue, turn on one replica and see whether it holds up without dying.", "Double the timeout.", "Use only the smoke."
  ], 1, "In the store, entregas processes 40 events/s per partition (module 23).");
  tf("t10", 5, 3, "A pre-test with unlimited dependencies holds for production.", false, "The result only holds for the measured configuration: with pagamentos infinite, 3 pods go past 80/s and the real 'today' breaks at 36.");

  /* ---------- 11. Performance assessment ---------- */
  choice("t11", 1, 1, "What goes in an assessment?", [
    "Only charts.", "Goals, scenarios, results and backlog.", "Only the k6 script.", "The source code."
  ], 1, "It is the report for engineering and product, in the mold of the author's README, filled in with the real tests.");
  choice("t11", 2, 2, "What is the conclusion about the plan?", [
    "It breaks at 300/s.", "It breaks at ~250/s (hot shard); with the dedicated shard, ~260/s.", "It breaks at 36/s.", "It doesn't break."
  ], 1, "The 200/s plan has ~30% headroom up to the breaking point (260 ÷ 200).");
  choice("t11", 3, 2, "What happens to module 23's sheet (sustainable 210/s)?", [
    "Wrong: it goes away.", "Conservative by ~24% (260 ÷ 210); 210 still holds as the ρ ≤ 70% policy.", "Exact.", "Optimistic."
  ], 1, "The target only falls at ~260/s in steady state. The distance to 210 is the plan's margin.");
  choice("t11", 4, 3, "What did the mixed scenario (single pool of 20 connections) show?", [
    "Nothing new.", "33% of checkout orders and 10% of status queries got a 503.", "The database went down.", "k6 hung."
  ], 1, "The 11 PM report consumed the other flows' pool. Outside the window, 0%.");
  choice("t11", 5, 3, "Why would checkout.js never see the pool problem?", [
    "Because it doesn't use HTTP.", "Because it measures one flow at a time.", "Because the pool belongs to k6.", "Because the checkout is slow."
  ], 1, "Only the mixed scenario found one flow knocking over another by sharing the pool: that is module 25, Bulkhead Pattern.");

  window.QUIZ = out;
})();
