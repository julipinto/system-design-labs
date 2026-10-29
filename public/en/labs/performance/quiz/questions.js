/* Question bank for the Performance, Capacity and Scalability quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-definindo-e-metrificando-performance", name: "Defining and measuring performance" },
    t2: { topic: "aula-2-metricas-de-performance", name: "Performance metrics" },
    t3: { topic: "aula-3-entendendo-a-capacidade-em-sistemas", name: "Understanding capacity in systems" },
    t4: { topic: "aula-4-escalabilidade-vertical-e-horizontal", name: "Vertical and horizontal scalability" },
    t5: { topic: "aula-5-formula-de-capacity-hpa", name: "Capacity formula and HPA" },
    t6: { topic: "aula-6-conclusao", name: "Conclusion" }
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


  /* ---------- 1. Defining and measuring performance ---------- */
  choice("t1", 1, 1, "What is response time made of, according to the article?", [
    "Only the processing time on the server.",
    "Network latency plus processing time.",
    "Only the network RTT.",
    "The average CPU of the replicas."
  ], 1, "The client waits for the network and the server. Dashboards sometimes call the total \"latency\", and the module says so when that is the case.");
  choice("t1", 2, 2, "On a normal day Lena, in Recife, has an 80 ms RTT and the server spends 20 ms. What does her browser read?", [
    "20 ms.",
    "80 ms.",
    "100 ms.",
    "160 ms."
  ], 2, "80 + 20 = 100 ms in the browser, against 20 ms on the server dashboard.");
  choice("t1", 3, 3, "At 20:03:07 the cat page takes 2.08 s in Lena's browser and 2,000 ms at lb-loja and at the replica. Where is the degradation?", [
    "On the network between Recife and the store.",
    "Inside catalogo-3: the 80 ms of difference is the network, which did not change.",
    "In Lena's browser.",
    "At the load balancer."
  ], 1, "The load balancer and the replica read the same time, so the delay happens at the replica. The network only adds the usual 80 ms.");
  tf("t1", 4, 1, "A goal like \"p95 under 300 ms and errors under 0.1%\" comes from the system's non-functional requirements.", true, "Without a goal, \"slow\" is an opinion. The goal says what counts as a problem for that system.");
  choice("t1", 5, 2, "What is the catalog's traffic at the 20:03 peak?", [
    "40 req/s.",
    "400 req/s.",
    "640 req/s.",
    "1,000 req/s."
  ], 2, "40 req/s is the ordinary day and 400 req/s is the Black Friday average. The 20:03 peak is 640 req/s, 64 per replica.");
  choice("t1", 6, 3, "The dashboard reads a 135 ms average, green, and the goal is 300 ms. What did Lena go through in the same minute?", [
    "A page in 135 ms.",
    "A page in 2 s, and Davi got a 2.1 s 504.",
    "A 500 error on every page.",
    "Nothing out of the ordinary."
  ], 1, "The average mixes nine fast replicas with catalogo-3. Whoever landed on it waited 2 s.");
  order("t1", 7, 2, "Put in order the three questions that break down \"the store is slow\".", [
    "What: which request is slow",
    "Where: at which point of the trip",
    "How much: which number, against which goal"
  ], "First the request, then the measuring point (client, load balancer, replica) and finally the number against the goal.");

  /* ---------- 2. Performance metrics ---------- */
  choice("t2", 1, 1, "What are the four signals in Google's SRE book?", [
    "CPU, memory, disk and network.",
    "Response time, traffic, errors and saturation.",
    "p50, p95, p99 and maximum.",
    "Availability, consistency, partition and delay."
  ], 1, "Each one answers a question: is it slow, is a lot arriving, is it failing, or is it full?");
  choice("t2", 2, 2, "The store received 38,400 requests in 60 s. What is the throughput?", [
    "64 req/s.",
    "384 req/s.",
    "640 req/s.",
    "2,304 req/s."
  ], 2, "38,400 ÷ 60 = 640 req/s.");
  choice("t2", 3, 2, "In the sample of 100 requests, 1 goes past 2,000 ms and becomes a 504. What is the error rate?", [
    "0.1%.",
    "1%.",
    "10%.",
    "0.01%."
  ], 1, "1 ÷ 100 × 100 = 1%, ten times the 0.1% goal.");
  choice("t2", 4, 2, "In the 20:03 sample, what is the p95 by the nearest-rank method?", [
    "135 ms.",
    "74 ms.",
    "800 ms.",
    "2,000 ms."
  ], 2, "The p95 is the value at position 95 of the sorted sample: 800 ms. The average is 135, the p90 is 74 and the p99 is 2,000.");
  choice("t2", 5, 3, "The dashboard shows the average of the per-replica p99s: (4 × 55 + 5 × 74 + 2,100) ÷ 10 = 269 ms. What is the fleet's true p99?", [
    "269 ms.",
    "74 ms.",
    "2,000 ms.",
    "135 ms."
  ], 2, "You do not add percentiles or average them. Over the 100 requests together the p99 is 2,000 ms; the right way is to merge histograms.");
  choice("t2", 6, 2, "What is saturation, according to the USE method and the SRE book?", [
    "Utilization near 100%.",
    "Work waiting: a queue, a full connection pool, high load average.",
    "Memory above 80%.",
    "Errors above 1%."
  ], 1, "A resource at 100% with nobody waiting is not saturated, and the response can get worse before 100%.");
  tf("t2", 7, 3, "With 100 samples, the p99 is already a stable estimate.", false, "It is just the 99th value, and one slow request moves it. It only settles with a thousand samples or more.");

  /* ---------- 3. Understanding capacity in systems ---------- */
  choice("t3", 1, 2, "Each request uses 10 ms of CPU and 10 ms waiting for cache and DB. What is the capacity of a 1 vCPU replica?", [
    "50 req/s.",
    "100 req/s.",
    "200 req/s.",
    "1,000 req/s."
  ], 1, "CPU is what limits: 1 s ÷ 10 ms = 100 req/s. The waiting does not occupy the CPU.");
  choice("t3", 2, 2, "By the model R(ρ) = 10 + 10 ÷ (1 − ρ), what is the response at 70% utilization?", [
    "20 ms.",
    "43.3 ms.",
    "110 ms.",
    "1,010 ms."
  ], 1, "10 + 10 ÷ 0.3 = 43.3 ms. At 90% it is 110 ms and at 99% it is 1,010 ms.");
  choice("t3", 3, 2, "By Little's law, how many requests are in flight at 640 req/s with an average response of 0.135 s?", [
    "64.",
    "86.4.",
    "135.",
    "640."
  ], 1, "L = λ × W = 640 × 0.135 = 86.4.");
  choice("t3", 4, 3, "At 60 orders/s, pagamentos (40/s) is the weakest link. How much does checkout back up per second?", [
    "0.",
    "20.",
    "40.",
    "60."
  ], 1, "60 come in and 40 go out: 20 per second back up, 1,200 in 60 s.");
  choice("t3", 5, 3, "To fix the slow checkout, someone scales estoque from 2 to 4 replicas. What happens to the output?", [
    "It rises to 60 orders/s.",
    "It stays at 40 orders/s, and the CPU bill doubles.",
    "It drops by half.",
    "It rises to 2,000 orders/s."
  ], 1, "The output is worth the capacity of the weakest link, pagamentos. estoque was at 4% and stays that way.");
  choice("t3", 6, 2, "A fixed fleet of 10 replicas for 24 h against an elastic fleet (10 replicas for 4 h and 2 for the other 20 h). How many replica-hours does each one use?", [
    "240 and 80.",
    "240 and 120.",
    "120 and 80.",
    "80 and 240."
  ], 0, "10 × 24 = 240. 10 × 4 + 2 × 20 = 80, a third of the fixed one.");
  tf("t3", 7, 3, "When you fix a bottleneck, the load on the following links goes up and one of them can become the next bottleneck.", true, "With pagamentos at 4 replicas (80/s), the next link at 100 orders/s is pedidos (90/s). The bottleneck moves.");

  /* ---------- 4. Vertical and horizontal scalability ---------- */
  choice("t4", 1, 1, "What is the difference between scaling vertically and horizontally?", [
    "Vertical changes the number of units and horizontal changes the size.",
    "Vertical changes the size of one unit and horizontal changes the number of units.",
    "Vertical is automatic and horizontal is manual.",
    "None: they are synonyms."
  ], 1, "Scale up/down changes the size (1 to 8 vCPU). Scale out/in changes the number (10 replicas of 1 vCPU).");
  choice("t4", 2, 3, "With 1/21 of the work serial, how much do 8 vCPU on a single replica yield, by Amdahl's law?", [
    "8×, or 800 req/s.",
    "6.0×, or 600 req/s.",
    "4×, or 400 req/s.",
    "21×, or 2,100 req/s."
  ], 1, "1 ÷ (1/21 + (20/21) ÷ 8) = 6.0. That is 600 req/s, 75 per vCPU against 100 on horizontal.");
  choice("t4", 3, 2, "At 640 req/s, 3 of the 10 replicas of 100 req/s go down. What is the utilization of the remaining 7?", [
    "64%.",
    "80%.",
    "91.4%.",
    "106.7%."
  ], 2, "640 ÷ 700 = 91.4%, with a response of 126.7 ms. With 4 down, it is 106.7% and it saturates.");
  choice("t4", 4, 3, "4 of the 10 replicas go down at 640 req/s. What happens?", [
    "Nothing: 6 replicas are enough.",
    "The capacity of 600 falls below the 640: the queue grows 40 req/s, 2,400 per minute.",
    "The fleet goes to 64%.",
    "The HPA adds 4 replicas in 1 s."
  ], 1, "640 − 600 = 40 req/s over capacity, 2,400 per minute, and the responses go past the 2 s timeout.");
  choice("t4", 5, 2, "What does horizontal scaling require from the service?", [
    "State outside the process (the session in Redis) and a load balancer.",
    "A bigger machine.",
    "Restarting the pod.",
    "Swapping the database."
  ], 0, "If each replica kept the session in memory, the load balancer would send Lena to a replica that does not know her.");
  tf("t4", 6, 3, "When it goes down, the single 8 vCPU replica takes 100% of the capacity, while one replica out of 10 takes 10%.", true, "It is the concentrated risk of vertical. N+k headroom only exists on horizontal.");
  choice("t4", 7, 2, "According to the module, what is elasticity?", [
    "Scaling horizontally by hand.",
    "Adjusting capacity automatically to demand, up and down.",
    "Buying a bigger machine.",
    "Keeping spare replicas all year."
  ], 1, "It can be vertical or horizontal; the HPA is a horizontal elasticity mechanism.");

  /* ---------- 5. Capacity formula and HPA ---------- */
  choice("t5", 1, 1, "What is the HPA formula?", [
    "desired = current ÷ ratio.",
    "desired = ⌈ current × current value ÷ desired value ⌉.",
    "desired = current + 4.",
    "desired = ⌊ current × target ⌋."
  ], 1, "The ceiling rounds up and the ratio is the current metric divided by the target.");
  choice("t5", 2, 2, "950 req/s peak: 10 replicas at 95% CPU, target 70%. How many replicas does the HPA want?", [
    "10.",
    "13.",
    "14.",
    "16."
  ], 2, "⌈ 10 × 95 ÷ 70 ⌉ = ⌈13.57⌉ = 14. Afterward, 950 ÷ 1,400 = 67.9% CPU.");
  choice("t5", 3, 3, "The fleet's average CPU is 67.5% (catalogo-3 is at 99%). What does the HPA do with a 70% target?", [
    "Goes up to 14 replicas.",
    "Nothing: 0.964 is within the 10% tolerance.",
    "Removes a replica.",
    "Restarts catalogo-3."
  ], 1, "The ratio 67.5 ÷ 70 = 0.964 is within 10% of 1.0. catalogo-3 stays at 99%.");
  choice("t5", 4, 3, "With the same 67.5% average and an 80% target, what does the HPA do?", [
    "Nothing.",
    "Goes up to 12 replicas.",
    "Goes down to 9 replicas, removing one at the worst moment.",
    "Goes down to 5 replicas."
  ], 2, "⌈ 10 × 0.844 ⌉ = 9. The 300 s stabilization window delays the scale-down, but it comes.");
  choice("t5", 5, 3, "Demand jumps to 1,100 req/s (capacity 1,000) and the HPA takes about 60 s to react. How many requests end up rejected or delayed?", [
    "600.",
    "1,100.",
    "6,000.",
    "66,000."
  ], 2, "100 req/s over capacity × 60 s = 6,000, 9.1% of the 66,000 in the minute.");
  choice("t5", 6, 2, "The article computes 6 replicas with 27.78 req/s each and a capacity of 15, and arrives at 11. What does the HPA do?", [
    "11, same as the article.",
    "12, because it uses ceil: 6 × 27.78 ÷ 15 = 11.11.",
    "10, rounding down.",
    "15."
  ], 1, "With 11 replicas each one would receive 15.15 req/s, above the capacity of 15.");
  tf("t5", 7, 2, "The HPA computes CPU utilization as the percentage of the pod's requests, averaged across pods.", true, "That is why the requests must be set. Pods that are not ready yet count as 0% on scale-up.");

  /* ---------- 6. Conclusion ---------- */
  choice("t6", 1, 1, "What are the module's three moments?", [
    "Measure, limit and grow.",
    "Plan, test and publish.",
    "Cache, queue and database.",
    "Read, write and delete."
  ], 0, "Measure says what is felt, limit says what the system can take and grow says how to add capacity.");
  choice("t6", 2, 2, "What is the catalog's capacity and how far is it safe?", [
    "1,000 req/s and 700 req/s (70%).",
    "640 req/s and 400 req/s.",
    "100 req/s and 70 req/s.",
    "1,000 req/s and 1,000 req/s."
  ], 0, "10 replicas × 100 req/s, with a safe limit of 70% CPU.");
  choice("t6", 3, 3, "After scaling pedidos and pagamentos, what is checkout's weakest link?", [
    "estoque (1,000/s).",
    "The pedidos DB (150/s).",
    "lb-loja.",
    "None."
  ], 1, "Writes still go to a single primary: service replicas do not scale it. That is the hook to module 15.");
  choice("t6", 4, 2, "Which of these actions raises capacity per vCPU before buying another machine?", [
    "Cutting the CPU spent per request with an algorithm, an index or a cache.",
    "Raising the load balancer's timeout.",
    "Raising the HPA target.",
    "Renaming the service."
  ], 0, "If the request spends half the CPU, the same replica gives double the req/s.");
  tf("t6", 5, 2, "Module 23 (Capacity Planning) starts from this module's table of measured numbers.", true, "640 req/s, p95 of 800 ms, a catalog of 1,000 req/s, checkout at 30 orders/s and a DB at 150/s.");
  choice("t6", 6, 3, "What is the store's next problem after this module?", [
    "Sending email faster.",
    "The pedidos DB does not grow by replicas or by services: the map of ways to grow is missing, the Scale Cube.",
    "Swapping the HPA for another tool.",
    "Choosing a CDN."
  ], 1, "The store has grown sideways (replicas, module 7) and by function (services, module 6). Module 15 shows the shape that is missing.");

  window.QUIZ = out;
})();
