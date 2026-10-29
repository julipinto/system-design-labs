/* Question bank for the Observability and Monitoring quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-confiabilidade", name: "Reliability" },
    t2: { topic: "aula-2-observabilidade-vs-monitoramento", name: "Observability × monitoring" },
    t3: { topic: "aula-3-metricas", name: "Metrics" },
    t4: { topic: "aula-4-logs", name: "Logs" },
    t5: { topic: "aula-5-traces", name: "Traces" },
    t6: { topic: "aula-6-alerting-e-apm", name: "Alerts and APM" },
    t7: { topic: "aula-7-service-levels", name: "Service levels" },
    t8: { topic: "aula-8-use-method", name: "USE" },
    t9: { topic: "aula-9-red-method", name: "RED" },
    t10: { topic: "aula-10-four-golden-signals", name: "The four golden signals" }
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
  /* Fixed swap: moves the right answer to a position that varies from question to question (no randomness, so the quiz is reproducible). */
  function choice(k, n, level, prompt, options, answer, explain) {
    var opts = options.slice(), tgt = (parseInt(k.slice(1), 10) * 2 + n * 3) % opts.length, tmp = opts[tgt];
    opts[tgt] = opts[answer]; opts[answer] = tmp;
    add(k, n, "choice", level, prompt, opts, tgt, explain);
  }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. Reliability ---------- */
  choice("t1", 1, 1, "How does the article define reliability?", [
    "Keeping the server up for as long as possible.",
    "Delivering correct behavior over time: continuity, integrity and predictability.",
    "Having the lowest average latency in the region.",
    "Having more than one replica of each service."
  ], 1, "Availability is only one piece: a store can be up and answer with wrong data, or with unpredictable latency.");
  choice("t1", 2, 2, "2.5.0 returns 201, the healthcheck answers 200, errors stay at 0% and latency is the same. Which dashboard reports the 0.00 shipping?", [
    "The pedidos CPU one.",
    "The 5xx rate one.",
    "The business one: pedidos_frete_zero_total{cidade=\"recife\"}.",
    "The healthcheck one."
  ], 2, "Only a metric that knows the domain rule sees a shipping cost of zero. Every technical panel stays green.");
  choice("t1", 3, 2, "How much did the 0.00 shipping cost in 60 min, at 1 Recife order per second and R$ 15.00 less on each?", [
    "R$ 450.", "R$ 3,240.", "R$ 54,000.", "R$ 900,000."
  ], 2, "3,600 s × 1 order/s × R$ 15.00 = R$ 54,000. With a probe that saw it in 30 s, it would be R$ 450.");
  tf("t1", 4, 2, "If a probe saw the 0.00 shipping in 30 s, the loss would be R$ 450.", true, "30 × 1 × R$ 15.00 = R$ 450. The 120-fold difference is in the time to notice, not in the time to fix.");
  choice("t1", 5, 3, "Why does the article say reliability is an 'operational contract' and not a 'desirable attribute'?", [
    "Because it requires a customer's signature.",
    "Because it is an architecture constraint, with a measure and an owner, that guides redundancy, resilience and incident response.",
    "Because it only applies to paid systems.",
    "Because it replaces the SLA."
  ], 1, "Everything the course did since module 21 follows from it: reduce the chance and impact of the error, the time to detect and recover and the blast radius of the failure.");

  /* ---------- 2. Observability × monitoring ---------- */
  choice("t2", 1, 1, "Which of these is a monitoring question?", [
    "Why was this request from Lena slow?",
    "Did the error rate go above 5%?",
    "What path did order 1063 take through the store?",
    "What changed in estoque at 15:30?"
  ], 1, "Monitoring follows the known, with a threshold already chosen. The others are new questions, which call for observability.");
  choice("t2", 2, 1, "Where does the word observability come from?", [
    "Network engineering, 1990s.",
    "Control theory (Kalman, 1960s): the internal state is inferred from the outputs.",
    "Google's SRE book, in 2016.",
    "OpenTelemetry, in 2019."
  ], 1, "A system is observable if you can infer its internal state just from what it emits. In software, the outputs are the signals.");
  choice("t2", 3, 2, "In order 1063, what says where the time was spent?", [
    "The metric estoque_reservar_duracao_segundos.",
    "The trace: 1,640 of the 1,895 ms in estoque.",
    "The estoque WARN log.",
    "The healthcheck."
  ], 1, "The metric says what (8 orders above 1 s), the trace says where (86.5% in estoque) and the log says why (the holder is contagem-estoque).");
  tf("t2", 4, 2, "Having metrics, logs and traces installed is already having observability.", false, "The article itself says observability is a property, not a tool. Without correlation (the trace_id on everything), each signal is an island.");
  order("t2", 5, 2, "Put the path of an investigation in order, from cheapest to most expensive.", [
    "Alert: something changed",
    "Metric: what and how much",
    "Trace: where",
    "Log: why"
  ], "The alert says it, the metric shows the size, the order's trace shows where and the log with the same trace_id shows why. What you find becomes a new alert.");
  choice("t2", 6, 3, "Which of these is a symptom of 'expensive tool without observability'?", [
    "Logs without trace_id, metrics without the celula label and a Kafka consumer that does not pass on the traceparent.",
    "A dashboard with few charts.",
    "A service with no logs at all.",
    "A metric with few labels."
  ], 0, "Each tool works, but nothing links the signals: the estoque line exists and nobody finds it, and the trace breaks in half.");

  /* ---------- 3. Metrics ---------- */
  choice("t3", 1, 1, "Which is the right metric type for response time?", [
    "Counter.", "Gauge.", "Histogram.", "Log."
  ], 2, "The article cites 'response times' as an example of a gauge, but a gauge keeps only the last value and loses the distribution. The histogram allows percentiles.");
  choice("t3", 2, 2, "In the 1063 histogram (400 · 975 · 992 · 992 · 1,000 cumulative), what does p95 give by interpolation?", [
    "0.293 s.", "0.489 s.", "0.765 s.", "2.3125 s."
  ], 1, "The 950th request falls in the 0.25 to 0.5 bucket: 0.25 + (950 − 400) ÷ 575 × 0.25 = 0.489 s.");
  choice("t3", 3, 2, "Why does the 1063 p99 (0.765 s) not show the episode of 8 slow orders?", [
    "Because p99 only counts Recife requests.",
    "Because 8 in 1,000 is 0.8%, and p99 discards exactly the 10 slowest.",
    "Because the histogram lost the data.",
    "Because the SLO is 2 s."
  ], 1, "p99.9 already sees the 8, but gives 2.3125 s for a value of about 1.9 s: the 1 to 2.5 bucket is wide.");
  choice("t3", 4, 2, "How many series do the labels servico (7) × rota (12) × status (6) × celula (4) generate in a histogram with 11 series per combination?", [
    "2,016.", "22,176.", "264.", "33.3 billion."
  ], 1, "7 × 12 × 6 × 4 = 2,016 combinations × 11 = 22,176. With cliente_id (1.5 million) it would be 33.3 billion.");
  tf("t3", 5, 2, "The average of each replica's p99 gives the fleet p99.", false, "Percentiles cannot be added or averaged: in module 14 the average gave 269 ms and the true p99 was 2,000 ms. You sum the buckets and compute again.");
  choice("t3", 6, 3, "Where should cliente_id, pedido_id and trace_id go?", [
    "As metric labels.",
    "In the log and the trace, not in the metric.",
    "Only in the alert.",
    "Nowhere."
  ], 1, "They are almost-unique values: as a label, they generate one series per value and take down the metrics server.");

  /* ---------- 4. Logs ---------- */
  choice("t4", 1, 1, "Which log level does the article describe as a 'triage log'?", [
    "TRACE.", "WARN.", "ERROR.", "FATAL."
  ], 2, "ERROR should say what failed, why, where and how to correlate it with the rest of the flow.");
  choice("t4", 2, 2, "How much log does the store generate per day, on a normal day (5 orders/s and 40 req/s on the catalog)?", [
    "0.28 GB.", "2.81 GB.", "25.5 GB.", "255 GB."
  ], 1, "4.5 KB per order × 5/s = 22.5 KB/s, plus 40 × 250 B = 10 KB/s: 32.5 KB/s, or 2.81 GB per day.");
  choice("t4", 3, 2, "With DEBUG on (about 10 times more) and the Black Friday peak all day, the volume is about:", [
    "25.5 GB/day.", "255 GB/day.", "2.55 TB/day.", "765 GB/day."
  ], 1, "The peak gives 25.5 GB/day (765 GB over 30 days of retention); DEBUG takes it to 255 GB/day.");
  tf("t4", 4, 2, "The cliente_id may go in the log, but CPF and token must be masked at the source.", true, "The cliente_id is enough to find the order. Personal data and secrets stay indexed and retained for weeks in a place many people query.");
  choice("t4", 5, 3, "In the estoque WARN line, which field points to the cause of the delay?", [
    "versao.", "celula.", "holder: contagem-estoque (holder_pid 4412).", "level."
  ], 2, "The 1,620 ms lock wait was caused by the contagem-estoque job, which held the CANECA-007 row.");
  choice("t4", 6, 3, "Why structure the log as JSON with fixed fields?", [
    "To make the file smaller on disk, with no other effect.",
    "Because it lets you index only some fields (trace_id, level) and correlate, instead of indexing the whole text.",
    "Because JSON is faster to write.",
    "Because it makes the trace_id unnecessary."
  ], 1, "Cost is the biggest challenge of logs; fixed fields let you index what you search for and compress the rest.");

  /* ---------- 5. Traces ---------- */
  choice("t5", 1, 1, "What is a span?", [
    "A set of logs from one service.",
    "A unit of work in the trace, with a start, a duration, a parent and attributes.",
    "A type of metric.",
    "An alert rule."
  ], 1, "The trace is the tree of spans of a request, end to end, linked by a trace_id.");
  choice("t5", 2, 2, "What is the shape of the W3C traceparent header?", [
    "trace_id-span_id",
    "version-trace_id-parent_id-flags (for example, 00-9c1e5a7b…-a3c4d5e6f7a8b9c0-01)",
    "flags-version-trace_id",
    "trace_id:parent_id:level"
  ], 1, "The trace_id (32 hex) stays the same for the whole trip; the parent_id (16 hex) changes at each hop.");
  choice("t5", 3, 2, "What share of the 1063 time (1,895 ms) did estoque take?", [
    "21%.", "50%.", "86.5%.", "99%."
  ], 2, "1,640 ÷ 1,895 = 86.5%: 20 ms of work and 1,620 ms of lock wait. The other 7 spans did not change.");
  choice("t5", 4, 3, "With 1% head sampling, what is the chance of keeping at least one of the 8 slow traces?", [
    "1%.", "7.7%.", "50%.", "100%."
  ], 1, "1 − 0.99^8 = 7.7%. Tail sampling, which decides after seeing the trace, keeps all 8.");
  choice("t5", 5, 3, "The Kafka consumer does not pass on the traceparent. What happens to the trace of order 1063?", [
    "Nothing: Kafka keeps the context on its own.",
    "It breaks in half, and PedidoCriado becomes an orphan trace with another trace_id.",
    "The trace gets faster.",
    "The order is refused."
  ], 1, "Context propagation has to go through the message headers; losing one hop breaks the tree.");
  tf("t5", 6, 2, "Tail sampling decides whether to keep the trace before seeing the request.", false, "It is head that decides at the start. Tail waits for the whole trace and keeps every 5xx, everything above 800 ms and 1% of the rest, at the cost of holding the spans in a collector.");

  /* ---------- 6. Alerts and APM ---------- */
  choice("t6", 1, 1, "Which of the four alerts never fires in the 90 s PSP-A incident?", [
    "A: error > 5% for 5 min (for: 5m).",
    "B: error > 5% for 1 min.",
    "C: synthetic probe (10 s × 3).",
    "D: burn rate of 14.4× in 1 h and 5 min."
  ], 0, "The incident lasts 90 s and the 5 min window never closes. B catches it in 60 to 75 s, C in 30 s and D in ~52 s.");
  choice("t6", 2, 2, "What is the MTTD of the synthetic probe (every 10 s, 3 failures in a row)?", [
    "10 s.", "30 s.", "60 s.", "It never fires."
  ], 1, "Three probes failing in sequence take 30 s: it is the MTTD from module 27.");
  choice("t6", 3, 2, "With a 99.9% SLO and 100% errors, after how many seconds of failure is the 14.4× burn rate (1 h window) reached?", [
    "5.2 s.", "30 s.", "51.84 s.", "3,600 s."
  ], 2, "14.4 × 0.001 × 3,600 = 51.84 s. The burn rate of 100% errors is 1,000× (1 ÷ 0.001).");
  choice("t6", 4, 3, "With the module 21 defenses, the breaker opens in 1.3 s and ~39 of 2,700 orders fail. Why does no page alert fire?", [
    "Because the alert is turned off.",
    "Because in 1 h the burn rate is 0.36× and in 5 min 4.3×, below 14.4×: the customer barely felt it.",
    "Because the synthetic probe does not work.",
    "Because the burn rate only applies without a breaker."
  ], 1, "Alert D requires both windows above 14.4×. The open breaker_state is the cause and becomes a ticket.");
  tf("t6", 5, 2, "An open breaker_state at 3 a.m. should wake someone.", false, "It is a cause, not a symptom: it becomes a ticket. Page for a symptom (the customer felt it), cause for debugging. Waking people for a cause creates alert fatigue.");
  choice("t6", 6, 3, "What does APM add to the three signals?", [
    "A fourth, cheaper signal.",
    "A view that organizes metrics, traces and logs around the experience: operations, routes, dependencies and regressions per version.",
    "A replacement for the alert.",
    "An SLA guarantee."
  ], 1, "APM answers 'which operations regressed after the deploy?'. It is not another signal: it is a view of the same three.");

  /* ---------- 7. Service levels ---------- */
  choice("t7", 1, 1, "What is the SLI, according to the lesson?", [
    "The team's internal target.",
    "The contract with the customer.",
    "The measure: a good ÷ valid ratio, with what counts as good defined.",
    "What remains between the target and 100%."
  ], 2, "SLI measures, SLO aims and SLA promises. The error budget is what remains between the SLO and 100%.");
  choice("t7", 2, 2, "What is the month's error budget at 5 orders/s and a 99.9% SLO?", [
    "1,296 bad requests.", "12,960 bad requests (43.2 min).", "129,600 bad requests.", "2,700 bad requests."
  ], 1, "5 × 2,592,000 = 12,960,000 requests; 0.1% = 12,960. In time, 43.2 min of total downtime.");
  choice("t7", 3, 2, "What fraction of the budget would the 90 s PSP-A without protection (2,700 failures) burn?", [
    "0.06%.", "4.97%.", "20.8%.", "100%."
  ], 2, "2,700 ÷ 12,960 = 20.8%. The SP outage burned 4.97% (643.5) and the 1063 episode, 0.06% (8).");
  choice("t7", 4, 3, "Why should the SLO (99.9%) be stricter than the SLA (99.5%)?", [
    "Because the SLA is secret.",
    "Because the SLO shields the contract: the team fires the alert before breaking the SLA.",
    "Because the SLO is measured by another team.",
    "Because the SLA has no number."
  ], 1, "The article says that 'in the long run the SLO should become the SLA', and the lesson corrects it: the SLO should stay stricter, to protect the contract.");
  order("t7", 5, 2, "Put the budget policy in order, from when plenty is left to when it hits zero.", [
    "More than 50% left: ship as normal",
    "Between 50% and 10%: only fixes and a slow canary",
    "Less than 10%: freeze whatever is not a fix",
    "Hit zero: war room"
  ], "The budget is a signal for what the team does: speed while there is plenty, caution afterwards, then a freeze and priority on stability.");
  choice("t7", 6, 3, "2.5.0 returns 201, fast, with shipping 0.00. How does the SLI (2xx and up to 800 ms) treat it?", [
    "As bad: the budget burns.",
    "As good: the budget does not burn while the store loses R$ 15.00 per order in Recife.",
    "As invalid.",
    "It fires the 14.4× burn rate."
  ], 1, "The SLI measured the wrong thing. The way out is a business SLI (pedidos_frete_zero) or a diff SLI against 2.4.0.");
  choice("t7", 7, 2, "How much of the budget does a 14.4× burn rate in 1 h consume (30-day period)?", [
    "0.2%.", "2%.", "5%.", "14.4%."
  ], 1, "consumption = burn × window ÷ period = 14.4 × 1 ÷ 720 = 2%. And 6× in 6 h = 5% and 1× in 3 days = 10%.");

  /* ---------- 8. USE ---------- */
  choice("t8", 1, 1, "What do the letters of USE stand for?", [
    "User, Service and Error.",
    "Utilization, Saturation and Errors, for each resource.",
    "Uptime, SLO and Events.",
    "Usage, Signal and State."
  ], 1, "Brendan Gregg's method looks at resources: CPU, memory, disk, network, pools and queues.");
  choice("t8", 2, 2, "The catalog fleet is at 67.5%. What does the average hide?", [
    "A replica at 99%: catalogo-3, with 64.6 requests in flight.",
    "Nothing: the fleet is healthy.",
    "A DNS error.",
    "A lack of replicas."
  ], 0, "(9 × 64 + 99) ÷ 10 = 67.5%. Saturation (the queue) and the 504s point to the right replica.");
  choice("t8", 3, 2, "In USE, what is the saturation of the 20-connection pool?", [
    "The connections in use ÷ 20.",
    "The wait for a slot (db_pool_waiting).",
    "The 503s returned.",
    "The size of the pool."
  ], 1, "Utilization is the usage (100% with the report), saturation is the queue and errors are the full-pool 503s.");
  tf("t8", 4, 3, "With CPU at 20% and the pool at 10%, USE detects that 2.5.0 returns shipping 0.00.", false, "USE only sees resources: every resource is fine and the defect is in the service. It is the method's limit, and RED covers part of the gap.");
  choice("t8", 5, 3, "Which USE dimension is the Kafka consumer lag?", [
    "Utilization.", "Saturation.", "Errors.", "None: it is not a resource."
  ], 1, "It is the work piling up because the consumer cannot keep up with the topic. It can grow with the CPU low.");

  /* ---------- 9. RED ---------- */
  choice("t9", 1, 1, "What does RED measure for each service?", [
    "Resource, Error and Availability.",
    "Rate, Errors and Duration.",
    "Latency, traffic, errors and saturation.",
    "Utilization, saturation and errors."
  ], 1, "Rate (how many requests), Errors (how many fail, by the semantic definition) and Duration (as a percentile).");
  choice("t9", 2, 2, "Which cell has the highest pedidos Rate on Black Friday (30 orders/s)?", [
    "celula-sp, 9.9.", "celula-rio, 4.5.", "celula-recife, 3.6.", "celula-mkt, 12.0."
  ], 3, "9.9 · 4.5 · 3.6 · 12.0 orders/s, adding up to 30. The mkt-01 cell has 40%.");
  choice("t9", 3, 2, "What does the article say counts as an error?", [
    "Only 5xx.",
    "Anything that violates the expectation: 5xx, timeout, invalid response, duplication, late success (and the 0.00 shipping).",
    "Only timeouts.",
    "Only what the customer complained about."
  ], 1, "The 4xx (409, 422, 429) are observed, but left out of the SLO: not every code enters the SLO.");
  tf("t9", 4, 2, "The 409 for 'sold out' enters the SLO as an error.", false, "It is a legitimate store decision: observed on the dashboard, but outside the SLO (as are the 422 and the tenant's 429).");
  choice("t9", 5, 3, "With error = only 5xx and Duration = only the average, what does the RED dashboard show for 2.5.0?", [
    "Red: errors at 100%.",
    "Green: Rate, Errors and Duration do not change, and the store loses R$ 15.00 per order in Recife.",
    "Yellow, because of latency.",
    "Nothing: RED does not work per version."
  ], 1, "RED only helps if error is defined by the domain and Duration is a percentile. Cutting by version points to the culprit.");

  /* ---------- 10. The four golden signals ---------- */
  choice("t10", 1, 1, "What are the four golden signals?", [
    "CPU, memory, disk and network.",
    "Latency, traffic, errors and saturation.",
    "Rate, Errors, Duration and SLO.",
    "Metrics, logs, traces and alerts."
  ], 1, "They are RED + saturation, at the service level, to describe the health of what the user uses and give the basis of the SLO.");
  choice("t10", 2, 2, "With the breaker open, 30% of the requests fail in 2 ms and 70% answer in 275 ms. What is the average latency?", [
    "275 ms.", "193 ms.", "138 ms.", "2 ms."
  ], 1, "0.3 × 2 + 0.7 × 275 = 193.1 ms: the average fell while the system got worse.");
  choice("t10", 3, 2, "Why separate the success latency from the error latency?", [
    "Because errors never have latency.",
    "Because a fast error pulls the average down and hides the problem; a slow error is worse than a fast one.",
    "Because Prometheus requires it.",
    "Because the SLA forbids it."
  ], 1, "It is the correction to the article, which says latency 'includes both successful and error responses': the SRE book asks you to distinguish.");
  choice("t10", 4, 3, "Which lens looks at what?", [
    "USE, the user; RED, the resource; four signals, the service.",
    "USE, the resource; RED, the service; four signals, the user.",
    "All three look at the resource.",
    "USE, the service; RED, the user; four signals, the resource."
  ], 1, "The three complete each other: a store uses each where it fits.");
  tf("t10", 5, 2, "With 300 dashboards, the team can quickly answer whether the system is healthy from the user's point of view.", false, "It is monitoring by accumulation: without a coherent mental model, nobody answers without opening ten dashboards. Four signals per cell give a place to start.");
  choice("t10", 6, 3, "What is saturation with a forecast?", [
    "Saturation measured every 5 minutes.",
    "The tightest resource and the time left: 'the disk fills in 4 h'.",
    "The saturation of the worst month.",
    "The average saturation of the fleet."
  ], 1, "It is the most useful signal for acting before the problem reaches the user.");

  window.QUIZ = out;
})();
