/* Capacity Planning quiz question bank (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-capacity-planning", name: "Introduction to capacity planning" },
    t2: { topic: "aula-2-teoria-das-filas", name: "Queueing theory" },
    t3: { topic: "aula-3-lei-de-little-e-o-ponto-saudavel", name: "Little's Law and the healthy point" },
    t4: { topic: "aula-4-curva-do-joelho", name: "The knee curve" },
    t5: { topic: "aula-5-modelagem-de-carga", name: "Load modeling" },
    t6: { topic: "aula-6-perfis-de-trafego", name: "Traffic profiles" },
    t7: { topic: "aula-7-projecao-de-crescimento", name: "Growth projection" },
    t8: { topic: "aula-8-capacidade-end-to-end", name: "End-to-end capacity" },
    t9: { topic: "aula-9-planejamento-de-capacidade", name: "Capacity planning" }
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

  /* ---------- 1. Introduction to capacity planning ---------- */
  choice("t1", 1, 1, "What is capacity planning?", [
    "Predicting next year's traffic precisely.",
    "Turning what was measured into limits and a plan, before the incident.",
    "Buying servers as fast as possible.",
    "Measuring response time during the incident."
  ], 1, "Capacity planning does not predict: it calculates how much each service needs, in which order the links break and how much it costs to carry each scenario.");
  choice("t1", 2, 2, "What are the 2027 scenarios for the catalog (req/s)?", [
    "640 · 950 · 1,300.",
    "750 · 950 · 1,140.",
    "300 · 640 · 950.",
    "824 · 950 · 1,400."
  ], 1, "750 is the linear trend, 950 includes the new-screen event (+15%) and 1,140 is 950 × 1.2, the error margin.");
  choice("t1", 3, 2, "Where do the 155 orders/s between the trend (45) and the goal (200) come from?", [
    "From the organic growth of individual customers.",
    "From more retries in the checkout.",
    "From partners through the API, who sell without browsing the catalog.",
    "From the cache, which lowers the cost per order."
  ], 2, "The customer trend gives 45. The goal of 200 only exists with partners through the API (mkt-01 and 3 others), which is why the catalog stays at 950.");
  choice("t1", 4, 3, "The team sizes the catalog for what already happened: 640 req/s with 10 replicas. In 2027 demand is 950. What happens?", [
    "Nothing: 10 replicas take 1,000 req/s.",
    "The replicas go to 95% and the average response goes to 210 ms.",
    "The HPA raises replicas before the demand arrives.",
    "The catalog goes down from lack of memory."
  ], 1, "950 ÷ 1,000 = 95% usage. With R(ρ) = 10 ms + 10 ms ÷ (1 − ρ), the average is 210 ms. On 'nominal' capacity it looks like it fits, but it is the knee.");
  order("t1", 5, 2, "Put the steps of the capacity planning route in order.", [
    "Delimit the flow",
    "Estimate the load",
    "Measure the individual throughput",
    "Derive the systemic throughput",
    "Project the growth",
    "Evaluate cost and margins",
    "Define the operating limits",
    "Test with load"
  ], "The 8-step route: flow, load, individual, systemic, projection, cost and margins, limits and load tests (module 24).");

  /* ---------- 2. Queueing theory ---------- */
  choice("t2", 1, 1, "A pagamentos pod spends 50 ms per order. What is the service rate (μ)?", [
    "5 orders/s.", "20 orders/s.", "50 orders/s.", "200 orders/s."
  ], 1, "μ = 1 ÷ 0.05 s = 20 orders/s. The utilization is ρ = λ ÷ μ.");
  choice("t2", 2, 2, "In M/M/1, what is the response time of the pagamentos pod (S = 50 ms) at 75% utilization?", [
    "50 ms.", "100 ms.", "200 ms.", "500 ms."
  ], 2, "W = S ÷ (1 − ρ) = 50 ÷ 0.25 = 200 ms. It is Black Friday 2026: 30 orders/s on 2 pods, 15/s each.");
  choice("t2", 3, 2, "With S = 50 ms and ρ = 80%, what is the average time with CV = 2 (light and heavy orders mixed)?", [
    "150 ms.", "250 ms.", "550 ms.", "1,000 ms."
  ], 2, "Pollaczek–Khinchine: 50 + 4 × (1 + 4) ÷ 2 × 50 = 550 ms. With CV = 0 it is 150 ms and with CV = 1, 250 ms: 3.7× between the extremes.");
  tf("t2", 4, 2, "M/M/1 is pessimistic for the store because lb-loja uses round robin, which makes arrivals more regular than a random draw.", true, "Planning with M/M/1 leaves slack. In module 24's k6, 30 orders/s gave an average of 157 ms, below the model's ~259 ms.");
  choice("t2", 5, 3, "The dashboard shows pagamentos at 80% CPU and a very high p95. What does queueing theory suggest looking for?", [
    "A memory bug.",
    "High variability in the service time (light and heavy mixed).",
    "A lack of replicas on estoque.",
    "A ρ below 50%."
  ], 1, "Same utilization, different wait: CV 2 at 80% gives 550 ms. The utilization looks healthy, but variability pushes the curve.");

  /* ---------- 3. Little's Law and the healthy point ---------- */
  choice("t3", 1, 1, "What does Little's Law say?", [
    "ρ = λ ÷ μ.",
    "Response time is always 1 ÷ μ.",
    "The work in flight is the arrival rate times the time in the system (L = λ × W).",
    "The queue grows linearly."
  ], 2, "L = λ × W holds for any stable queue. 1,500 msg/s × 0.050 s = 75 in flight.");
  choice("t3", 2, 2, "An API has target L = 150. At 1,000 req/s, what is the target W?", [
    "15 ms.", "150 ms.", "300 ms.", "1,500 ms."
  ], 1, "Target W = L ÷ λ = 150 ÷ 1,000 = 0.15 s = 150 ms.");
  choice("t3", 3, 2, "The article says that cutting W from 300 to 150 ms makes the system process 50% more requests. What is the correction?", [
    "It processes double (+100%): from 500 to 1,000 req/s with the same L.",
    "It processes 25% more.",
    "The article is right.",
    "It processes triple."
  ], 0, "With the same concurrency L, half the W sustains double the λ: 500 × 0.3 = 150 and 1,000 × 0.15 = 150.");
  choice("t3", 4, 3, "At 200 orders/s, the PSP answers in 0.5 s and the pagamentos pool has 50 connections. What happens?", [
    "L = 100 in flight against 50 connections: pagamentos saturates with the CPU at 33% (100 charges/s × 50 ms ÷ 15 vCPU).",
    "Nothing: 50 connections are enough.",
    "L = 10 and the pool has spare room.",
    "The PSP rejects the orders."
  ], 0, "L = 200 × 0.5 = 100. Half the traffic waits for a connection. The CPU doesn't see the problem; concurrency (L) does.");
  choice("t3", 5, 3, "What connection pool to the PSP does the plan propose for 200 orders/s, with 0.18 s normal and headroom of 4?", [
    "50.", "100.", "150.", "300."
  ], 2, "36 in flight (200 × 0.18) × 4 = 144, rounded to 150. It tolerates a PSP W of up to 150 ÷ 200 = 0.75 s.");

  /* ---------- 4. The knee curve ---------- */
  choice("t4", 1, 1, "In M/M/1, what is the 'knee'?", [
    "A corner where the curve changes shape.",
    "Where the cost of one more point of utilization passes what the team accepts, on a smooth curve.",
    "The point where the server shuts down.",
    "The 50% utilization."
  ], 1, "In M/M/1 there is no corner: W = S ÷ (1 − ρ) is smooth. The knee is a choice of limit on it.");
  choice("t4", 2, 2, "What does one more point of utilization cost on pagamentos (S = 50 ms) at 90%?", [
    "2 ms.", "5.6 ms.", "12.5 ms.", "50 ms."
  ], 3, "S ÷ (1 − ρ)² × 1% = 50 ÷ 0.01 × 0.01 = 50 ms. At 70% it costs 5.6 ms; at 95%, 200 ms.");
  choice("t4", 3, 2, "The article puts the knee at 80–85% and module 14 at 70%. How do you reconcile them?", [
    "One of the two is wrong.",
    "The knee is where the response leaves the acceptable range; 70% is the operating target, with margin for variability.",
    "They are the same number on different scales.",
    "The knee depends on the number of replicas."
  ], 1, "The operating target (70%) sits before the knee (80–85%) to absorb bursts and variability.");
  tf("t4", 4, 2, "In normal terms, a queue's latency grows linearly with utilization.", false, "The curve is convex from the start (S ÷ (1 − ρ)); it only looks linear up to about 50%.");
  choice("t4", 5, 3, "'No errors yet, let's run pagamentos at 95%.' What is the problem?", [
    "None: zero errors is what matters.",
    "W = 1 s (20× the service); a burst takes the p95 to ~3 s and lb-loja's 2 s timeout turns into a 504.",
    "CPU at 95% shuts the pod down.",
    "The HPA raises too many replicas."
  ], 1, "Each point costs 200 ms at 95%. The 20:00 newsletter is enough for the p95 to pass the timeout.");

  /* ---------- 5. Load modeling ---------- */
  choice("t5", 1, 1, "What are the three dimensions of load?", [
    "CPU, memory and disk.",
    "TPS, concurrency and payload.",
    "Latency, errors and saturation.",
    "Read, write and cache."
  ], 1, "TPS (work ÷ seconds), concurrency (L = λ × W) and payload (bytes per transaction). Bandwidth is TPS × payload.");
  choice("t5", 2, 2, "GET /produtos/42 takes 20 KB per transaction. At 950 req/s, what is the bandwidth?", [
    "~19.5 MB/s = 156 Mbit/s.",
    "~2 MB/s.",
    "~950 Mbit/s.",
    "~19 KB/s."
  ], 0, "950 × 20 KB = 19.5 MB/s, or 156 Mbit/s (at 640 req/s it was 105 Mbit/s; with 10% retries, 171).");
  choice("t5", 3, 3, "With 5% searches of 80 ms and 95% pages of 10 ms, how many replicas does the catalog need for 950 req/s at 70%?", [
    "14.", "16.", "19.", "24."
  ], 2, "Average CPU 13.5 ms, 74.1 req/s per replica: 950 ÷ (0.7 × 74.1) = 18.3, rounded up to 19. With 10% search it would be 24.");
  choice("t5", 4, 3, "The 640 req/s arrive in a 10 ms burst (64 per replica, 10 ms each). How long does the last request wait?", [
    "10 ms.", "64 ms.", "640 ms.", "6.4 s."
  ], 2, "64 × 10 ms = 640 ms (the average, ~320 ms). Spread across the second, the response is 37.8 ms: the same TPS, a different experience.");
  tf("t5", 5, 2, "'No metric is more important than TPS' is a sufficient rule for sizing the catalog.", false, "TPS alone doesn't size anything: the request mix and the burst dominate the math.");

  /* ---------- 6. Traffic profiles ---------- */
  choice("t6", 1, 1, "What is the catalog's ordinary-day peak (example) and at what time?", [
    "40 req/s at 12 pm.",
    "81.5 req/s at 9 pm.",
    "640 req/s at 20:03.",
    "4.1 req/s at 2 am."
  ], 1, "The peak is 81.5 at 9 pm, 2.04 × the average of 40. The minimum is 4.1 at 2 am.");
  choice("t6", 2, 2, "What is the catalog's average req/s in November (index 1.45 over 40)?", [
    "40.", "46.", "58.", "81.5."
  ], 2, "1.45 × 40 = 58 req/s. Black Friday (640 in the minute) is 11× that average.");
  choice("t6", 3, 2, "How far does Black Friday's 640 req/s peak go past an ordinary day's peak (81.5)?", [
    "~2×.", "~4×.", "~7.9×.", "~16×."
  ], 2, "640 ÷ 81.5 ≈ 7.9. The day average was 400 req/s, 10× the annual average.");
  tf("t6", 4, 2, "The 1,300 req/s burst from module 21 is a sustained peak, so the plan's peak should be 1,300.", false, "It is a burst of seconds: in the 1-minute window the same night shows up as ~650. The plan uses the 1-minute peak.");
  choice("t6", 5, 3, "The plan uses November's average (58 req/s) as the Black Friday load. What is the mistake?", [
    "None: 58 is the yearly average.",
    "The month's average hides the day and the day hides the minute: the 640 peak is 11× larger.",
    "November has less traffic than December.",
    "58 is more than needed."
  ], 1, "The larger the window, the smaller the peak. What gets planned is the peak of the window that matters (the 20:03 minute).");

  /* ---------- 7. Growth projection ---------- */
  choice("t7", 1, 1, "What is the linear projection of the catalog peak for 2027 (300 · 410 · 520 · 640)?", [
    "640.", "750.", "824.", "950."
  ], 1, "The least-squares line grows 113 per year and gives 750.");
  choice("t7", 2, 2, "What is the compound growth rate and the 2027 projection?", [
    "13% per year: 724.",
    "28.7% per year: 824.",
    "28.7% per year: 950.",
    "37% per year: 877."
  ], 1, "(640 ÷ 300)^(1/3) = 1.287. The real jumps (1.37 · 1.27 · 1.23) are falling, and the compound still gives 824.");
  choice("t7", 3, 2, "How does the new screen (+15%) reach 950?", [
    "750 × 1.15 = 862.",
    "824 × 1.15 = 947.5, rounded to 950.",
    "640 × 1.15 = 736.",
    "950 is the sales goal."
  ], 1, "The business event multiplies the compound. The planning range is 750 – 950 – 1,140 (950 × 1.2).");
  choice("t7", 4, 3, "With 14 replicas (1,400 req/s), what is the utilization at 1,140 req/s?", [
    "53.6%.", "67.9%.", "81.4%.", "95%."
  ], 2, "1,140 ÷ 1,400 = 81.4%, at the knee. With 750 it would be 53.6%, with 950, 67.9%.");
  choice("t7", 5, 3, "If the plan uses the line (750) and the event (950) arrives, what happens with 10 replicas?", [
    "They sit at 75%.",
    "They sit at 95% and the p95 goes back to 800 ms.",
    "The HPA covers it with no problem.",
    "They sit at 50%."
  ], 1, "950 ÷ 1,000 = 95%. It is the module 14 scenario. Unplanned nonlinear growth is the most dangerous kind.");

  /* ---------- 8. End-to-end capacity ---------- */
  choice("t8", 1, 1, "What is the checkout chain's systemic capacity today?", [
    "90/s.", "40/s.", "250/s.", "1,000/s."
  ], 1, "It is the minimum across the links: pagamentos 40, pedidos 90, DB 250 and estoque 1,000.");
  order("t8", 2, 2, "Put the chain's minimum values in order, from the first to the last step of the plan.", [
    "40/s (pagamentos)",
    "90/s (pedidos)",
    "250/s (DB)",
    "300/s (pedidos and pagamentos)"
  ], "The bottleneck moves: 40 → 90 (pagamentos from 2 to 15 pods) → 250 (pedidos from 3 to 10) → 300 (dedicated 2× shard for mkt-01).");
  choice("t8", 3, 2, "With the 200 orders/s goal and 60% on shard-2 (150/s), what is the hot shard's utilization?", [
    "26.7%.", "60%.", "80%.", "133%."
  ], 2, "120 ÷ 150 = 80%: the knee. With the dedicated 2× shard (capacity 300) it drops to 26.7%.");
  choice("t8", 4, 3, "entregas has 3 partitions of 40 events/s and receives 200/s for 4 h. What is the lag at the end of the peak?", [
    "0 events.", "288,000 events.", "1,152,000 events.", "2,880,000 events."
  ], 2, "(200 − 120) × 14,400 s = 1,152,000. With 8 partitions (320/s) there is no lag.");
  choice("t8", 5, 3, "The team scales estoque from 2 to 4 pods because 'stock is critical'. What changes in the chain's output?", [
    "It doubles.",
    "Nothing: the bottleneck is pagamentos (40/s).",
    "It halves.",
    "It goes to 1,000/s."
  ], 1, "estoque goes to 2,000/s, but the output is the minimum. The bottleneck is the weakest link, not the most expensive one.");

  /* ---------- 9. Capacity planning ---------- */
  choice("t9", 1, 1, "How many vCPU does the 2027 plan have (catalog 14, pedidos 10, pagamentos 15, estoque 2)?", [
    "17.", "30.", "41.", "984."
  ], 2, "14 + 10 + 15 + 2 = 41 vCPU, against 17 on Black Friday 2026 (+24) and 9 on an ordinary day.");
  choice("t9", 2, 2, "How many replica-hours per day does the elastic fleet cost (41 during the 4 peak hours and 9 the rest)?", [
    "984.", "344.", "164.", "216."
  ], 1, "4 × 41 + 20 × 9 = 344, 35% of the fixed fleet's 984 (24 × 41).");
  choice("t9", 3, 2, "Why pre-scale at 19:50?", [
    "Because the 20:00 newsletter is known and the HPA reacts in ~60 s.",
    "Because at 19:50 traffic is the lowest of the day.",
    "Because the HPA doesn't work at night.",
    "To reduce cost."
  ], 0, "The event has a set time, so the scaling can be scheduled instead of waiting for the metric to climb.");
  choice("t9", 4, 2, "What does the checkout limits sheet contain?", [
    "Just the number 300.",
    "Sustainable 210 orders/s, p95 ≤ 800 ms, errors ≤ 0.1%, target L 4, pool 150 and re-evaluation triggers.",
    "The cost in dollars.",
    "The list of pods."
  ], 1, "The sheet is the deliverable: limits, goals, dependencies and triggers, not 'a number'.");
  choice("t9", 5, 3, "The plan says 300/s, but nobody measured the connection pool, the Kafka queue or the PSP limit. What is it?", [
    "A guarantee.",
    "A nominal-capacity hypothesis; the breakpoint test may find the limit before 300.",
    "Too pessimistic.",
    "An SLA."
  ], 1, "A plan without a test is a model. Module 24 measures the operational capacity with k6.");

  window.QUIZ = out;
})();
