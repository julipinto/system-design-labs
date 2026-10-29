/* Question bank for the Resilience Patterns quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-resiliencia-em-arquitetura", name: "Resilience in architecture" },
    t2: { topic: "aula-2-metricas-de-disponibilidade", name: "Availability metrics" },
    t3: { topic: "aula-3-blast-radius", name: "Blast radius" },
    t4: { topic: "aula-4-replicacao-balanceamento-e-healthchecks", name: "Replication, load balancing and healthchecks" },
    t5: { topic: "aula-5-idempotencia", name: "Idempotency" },
    t6: { topic: "aula-6-timeouts", name: "Timeouts" },
    t7: { topic: "aula-7-estrategias-de-retry", name: "Retry strategies" },
    t8: { topic: "aula-8-circuit-breakers", name: "Circuit breakers" },
    t9: { topic: "aula-9-fallbacks", name: "Fallbacks" },
    t10: { topic: "aula-10-graceful-degradation", name: "Graceful degradation" },
    t11: { topic: "aula-11-backpressure-emergencial", name: "Emergency backpressure" },
    t12: { topic: "aula-12-resiliencia-na-camada-de-dados", name: "Resilience in the data layer" },
    t13: { topic: "aula-13-sharding-e-bulkheads", name: "Sharding and bulkheads" }
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

  /* ---------- 1. Resilience in architecture ---------- */
  choice("t1", 1, 1, "What is resilience?", [
    "Never having failures.",
    "Staying up, fully or partially, when a piece fails.",
    "Having more servers than needed.",
    "Measuring how long the system stayed up."
  ], 1, "Resilience is the set of strategies that keeps the system standing when something fails. Measuring uptime is availability.");
  choice("t1", 2, 2, "What changes in the 20:20 incident on Black Friday?", [
    "PSP-A goes down for 90 s.",
    "PSP-A goes from a p50 of 180 ms to 8 s and stays that way for 90 s.",
    "pagamentos loses a replica.",
    "The SP database goes down for 35 s."
  ], 1, "PSP-A responds, but slowly: from 20:20:00 to 20:21:30. That is worse than going down, because each call holds a connection for 8 s.");
  choice("t1", 3, 3, "With no defense at all, how long does the pagamentos pool of 50 take to run out, with PSP-A at 8 s and 30 orders/s?", [
    "8 s.",
    "50 ÷ 30 = 1.67 s.",
    "90 s.",
    "It never runs out."
  ], 1, "30 connections come in per second and none leave for 8 s. The pool of 50 runs out in 1.67 s and takes the whole checkout down.");
  choice("t1", 4, 2, "Which of the course's loose threads is the 'duplicate event'?", [
    "The fallback without recommendations from module 9.",
    "The PedidoPago e-502 delivered twice in module 6: the stock went from 3 to 2 and then to 1.",
    "The 27 calls per tap from module 10.",
    "The 2 s timeout from module 12."
  ], 1, "The four threads: duplicate e-502 (lesson 5), 27 calls (lesson 7), fallback without recommendations (lessons 9 and 10) and the timeout with c-7731 already charged (lessons 5 and 6).");
  tf("t1", 5, 1, "Resilience and availability are the same thing.", false, "Availability measures (good responses, uptime). Resilience is the set of strategies that keeps it.");

  /* ---------- 2. Availability metrics ---------- */
  choice("t2", 1, 1, "40 errors in 1,000 requests. What is the availability by usage?", [
    "4%.", "40%.", "96%.", "99.6%."
  ], 2, "The error rate is 4% and availability is 100% − 4% = 96%.");
  choice("t2", 2, 2, "How much does 99.9% per month leave down (30 days)?", [
    "432 min.", "43.2 min (2,592 s).", "4.32 min.", "25.9 s."
  ], 1, "43,200 min × 0.1% = 43.2 min. 99% is 432 min, 99.99% is 4.32 min and 99.999% is 25.9 s.");
  choice("t2", 3, 2, "Four hops in series at 99.9% each. What is the chain's availability?", [
    "99.9%.", "99.6006% (172.5 min per month).", "99.99%.", "100% − 4 × 99.9%."
  ], 1, "In series it multiplies: 0.999⁴ = 0.996006. Each extra hop costs a piece of the month.");
  choice("t2", 4, 3, "Two PSPs at 99.5% each, independent, in parallel. What is the availability?", [
    "99.5%.", "99%.", "99.9975% (1 − 0.005²).", "199%."
  ], 2, "In parallel it only fails when both go down: 0.005 × 0.005 = 0.000025. The month drops from 216 min to 1.08 min.");
  choice("t2", 5, 3, "The 90 s incident caused 2,700 failures out of 12,960,000 attempts in the month. What is the number by usage?", [
    "99.9965%.", "99.979%.", "97.3%.", "99.9%."
  ], 1, "1 − 2,700 ÷ 12,960,000 = 99.979%. By time, the same incident gives 99.9965% (1.5 min out of 43,200).");
  tf("t2", 6, 3, "A 200 response in 8 s counts as a success for an SLI with no latency limit, and as a failure for the client.", true, "That is why the SLI needs a limit, like 'answered within 1 s'. Counting only 5xx hides the client timeouts.");
  choice("t2", 7, 3, "With a 99.9% usage-based SLO, how many failures does the month allow, and how much did the 90 s incident burn?", [
    "1,296 failures; 208%.", "12,960 failures; 2,700 of them, or 20.8%.", "129,600 failures; 2.1%.", "2,700 failures; 100%."
  ], 1, "0.1% of 12,960,000 = 12,960. The incident's 2,700 are 20.8%; an unprotected 5 min incident (9,000) would burn 69.4%.");

  /* ---------- 3. Blast radius ---------- */
  choice("t3", 1, 1, "What is the blast radius?", [
    "The number of replicas of the service.",
    "How much of the store stops when one component fails.",
    "The time to recover the service.",
    "The error rate per minute."
  ], 1, "It is the size of the damage. Designing is making it small and known.");
  choice("t3", 2, 2, "With uniform load, how much does a failure in 1 of 10 compartments affect?", [
    "1%.", "10%.", "33.3%.", "50%."
  ], 1, "1/N: N = 3 gives 33.3%, 10 gives 10%, 100 gives 1% and 1,000 gives 0.1%.");
  choice("t3", 3, 3, "mkt-01 has 40% of the rows and lives on shard-2 (of 3). How many rows disappear if shard-2 goes down?", [
    "33.3%.", "40%.", "60%.", "20%."
  ], 2, "0.4 + 0.6 ÷ 3 = 60%. Shards 0 and 1 take 20% each. The 1/N math only holds with uniform load.");
  choice("t3", 4, 2, "If pagamentos goes down, what is the radius?", [
    "Only the recommendations section.",
    "All checkout stops; browsing continues.",
    "The whole store goes down.",
    "Only 10% of the capacity."
  ], 1, "pagamentos is a mandatory path of the checkout. Whoever is only browsing keeps seeing the catalog.");
  tf("t3", 5, 3, "The catalog, used by bff-app and bff-web, is a hidden dependency: its failure wipes out both channels.", true, "Two pieces that look separate share the same radius. A hidden dependency adds radii.");

  /* ---------- 4. Replication, load balancing and healthchecks ---------- */
  choice("t4", 1, 1, "Healthcheck every 5 s with 3 failures in a row. How long until a hung replica leaves the pool?", [
    "5 s.", "8 s.", "15 s.", "60 s."
  ], 2, "5 s × 3 = 15 s. In that time the replica still receives traffic.");
  choice("t4", 2, 2, "One of the catalog's 10 replicas hangs at 640 req/s. How many requests are lost in 15 s?", [
    "225.", "640.", "960.", "9,600."
  ], 2, "Each replica was receiving 64 req/s: 64 × 15 = 960. On pagamentos (2 replicas, 30/s) it is 15 × 15 = 225.");
  choice("t4", 3, 2, "What sets the deep healthcheck apart from the shallow one?", [
    "The deep one is faster.",
    "The deep one checks dependencies (like the PSP); the shallow one checks that the process responds.",
    "The shallow one only runs at night.",
    "There is no difference."
  ], 1, "The deep one looks more honest, but it ejects the replica for a problem that is not its own.");
  choice("t4", 4, 3, "The pagamentos healthcheck queries the PSP, which is at 8 s. What happens?", [
    "Only one replica leaves the pool.",
    "Both replicas get sick together and leave; below 50% Envoy goes into panic and sends traffic to all of them.",
    "The PSP is restarted.",
    "Nothing: the healthcheck ignores the dependency."
  ], 1, "Ejecting the innocent does not help. A bad dependency is handled with a breaker and a fallback.");
  tf("t4", 5, 3, "The healthcheck that removes the replica from the pool should check only what the replica controls.", true, "Memory, queue and live process, yes. PSP, no: the dependency is shared and is handled with a breaker and a fallback.");

  /* ---------- 5. Idempotency ---------- */
  choice("t5", 1, 1, "What is idempotency?", [
    "Responding in under 1 s.",
    "Repeating the operation and getting the same result.",
    "Encrypting the request body.",
    "Keeping the event forever."
  ], 1, "It is what makes repeating safe, which is why it comes before timeout and retry.");
  choice("t5", 2, 2, "Caio's key reaches the idempotencia table for the 2nd time. What does INSERT … ON CONFLICT DO NOTHING return?", [
    "1 row (INSERT 0 1).",
    "0 rows (INSERT 0 0) and the stored response comes back.",
    "A syntax error.",
    "The duplicate row."
  ], 1, "The 1st arrival returns 1 row and executes. The repeat returns 0 and uses the earlier response: the same order 1058.");
  choice("t5", 3, 2, "Same Idempotency-Key, different body. What is the response?", [
    "201, like the first one.", "422: the body hash does not match.", "200 with the new body.", "500."
  ], 1, "The same key with another body is not a repeat, it is a client error.");
  choice("t5", 4, 3, "The app generates a new UUID on every attempt. What happens?", [
    "The key works normally.",
    "Each attempt becomes a new intent: two orders and two charges.",
    "The server refuses with 422.",
    "The database locks up."
  ], 1, "The key is born once per intent, before the first call, and is reused on the next ones.");
  choice("t5", 5, 2, "How much does the Idempotency-Key add to the request?", [
    "5 B.", "57 B.", "157 B.", "267 B."
  ], 1, "The header Idempotency-Key: \"3f9a2c7e-…\"\\r\\n is 57 bytes: the 210 B request becomes 267 B.");

  /* ---------- 6. Timeouts ---------- */
  choice("t6", 1, 1, "For PSP-A (p50 180 ms, p99 400 ms, p99.9 700 ms), what is the right timeout?", [
    "180 ms.", "400 ms.", "1 s (the p99.9 with slack).", "8 s."
  ], 2, "AWS says to pick the percentile for an acceptable % of false timeouts. With 0.1%, it is the p99.9 plus slack: 1 s.");
  choice("t6", 2, 2, "Pool of 50, 30 req/s, 2 s timeout. How many calls are in flight?", [
    "30.", "50.", "60: it saturates.", "240."
  ], 2, "Little: in flight = rate × time = 30 × 2 = 60, more than the 50 connections.");
  choice("t6", 3, 2, "What is the critical timeout of pagamentos?", [
    "50 × 30 = 1,500 s.", "50 ÷ 30 = 1.67 s.", "30 ÷ 50 = 0.6 s.", "8 s."
  ], 1, "Pool ÷ rate. Above 1.67 s the pool saturates.");
  choice("t6", 4, 3, "Why was the 2 s timeout from module 10 replaced by 1 s?", [
    "Because the PSP got faster.",
    "Because 2 s keeps 60 calls in flight in a pool of 50 at 30/s: it saturates.",
    "Because 1 s is the AWS default.",
    "Because gw-loja asked for it."
  ], 1, "The 2 s was chosen without the capacity calculation. The 1 s comes from the p99.9 and keeps 30 in flight.");
  choice("t6", 5, 3, "Three 1 s attempts plus waits of 0.1 s and 0.2 s add up to 3.3 s. gw-loja waits 3 s. What happens?", [
    "Nothing: gw-loja waits.",
    "gw-loja gives up and pagamentos keeps working for nobody (orphaned work).",
    "The PSP cancels the charge.",
    "The breaker opens."
  ], 1, "The outer one gives up before the inner one finishes. The way out is for the 2nd attempt to receive only what is left: 2.0 − 1.0 − 0.1 = 0.9 s.");
  tf("t6", 6, 2, "After a timeout, it is safe to assume the operation did not happen.", false, "The timeout only says 'I stopped waiting'. Charge c-7731 already existed at the PSP.");

  /* ---------- 7. Retry strategies ---------- */
  choice("t7", 1, 1, "What are the waits of the store's exponential backoff (base 100 ms)?", [
    "100, 100, 100, 100 ms.", "100, 200, 400, 800, 1,600 ms.", "1, 2, 4, 8, 16 s.", "0 to 4 s, 2 to 6 s, 6 to 10 s."
  ], 1, "The wait doubles on each failure, with a 2 s cap. The article uses 1, 2, 4, 8, 16 s and an 'incremental jitter' that is none of the three from AWS.");
  choice("t7", 2, 3, "A thousand clients, PSP out for 2 s. What does the simulation of exponential backoff without jitter show?", [
    "A peak of 84 per 100 ms and 1,000 completed.",
    "Synchronized waves of 1,000 and only 40 clients (4%) finish within the deadline.",
    "45,500 calls.",
    "No calls."
  ], 1, "Without jitter everyone waits the same time and comes back together. With full jitter the peak drops to 84 and 1,000 finish.");
  choice("t7", 3, 2, "What does the fixed 100 ms interval do with 1,000 clients?", [
    "Few calls.", "45,500 calls (45.5 per client), 24,500 refused with the PSP up.", "A peak of 84.", "Only 4% finish."
  ], 1, "It gets everyone through, but by brute force. That is the storm.");
  choice("t7", 4, 3, "3 layers retry 3 times each. How many calls reach pagamentos per tap, and how much is that at 30 orders/s?", [
    "9; 270/s.", "27; 810/s against 40/s.", "81; 2,430/s.", "3; 90/s."
  ], 1, "3 × 3 × 3 = 27. 30 × 27 = 810/s, or 20.2 times the capacity of 40/s.");
  order("t7", 5, 3, "Put the defenses against retry amplification in order:", [
    "Retry in one layer only (the outer one).",
    "Limit with a retry budget (10% of the calls).",
    "Retry only if there is deadline left.",
    "Retry only what is idempotent (with Idempotency-Key)."
  ], "The lesson's four defenses. The order is the reading order: where to retry, how much, until when and what.");
  tf("t7", 6, 2, "The immediate retry 'solves most cases' even when a dependency fails.", false, "When the dependency fails it is the cause of the storm. Amplification, budget, deadline and idempotent-only are missing.");

  /* ---------- 8. Circuit breakers ---------- */
  choice("t8", 1, 1, "What are the three states of the circuit breaker?", [
    "On, off and broken.", "Closed, open and half-open.", "Light, medium and heavy.", "Pass, block and sleep."
  ], 1, "Closed lets calls through and counts; open fails fast; half-open lets 5 probes through.");
  choice("t8", 2, 2, "The pagamentos breaker (window 20, minimum 10, 50%). At what moment does it open with PSP-A at 8 s and a 1 s timeout?", [
    "0 s.", "1.3 s.", "30 s.", "90 s."
  ], 1, "The first 10 calls fail by timeout between 1.0 and 1.3 s: minimum of 10 reached, 100% failure.");
  choice("t8", 3, 3, "How many calls does PSP-A receive in 100 s, with and without a breaker?", [
    "237 with, 3,000 without.", "3,000 with, 237 without.", "30 with, 300 without.", "2,763 with, 237 without."
  ], 0, "Without a breaker, all 3,000 calls, 2,700 useless. With a breaker, 237; the other 2,763 are fast fails.");
  choice("t8", 4, 3, "Why does a slow call (over 1 s) count as a failure?", [
    "Because 1 s is the HTTP rule.",
    "Because otherwise the PSP answers in 8 s 'successfully' and the breaker never opens.",
    "Because it saves calls.",
    "Because the breaker does not measure time."
  ], 1, "Slowness exhausts the pool just like an error. A breaker that only counts errors does not protect against that.");
  choice("t8", 5, 3, "With a 2 s timeout instead of 1 s, when does the breaker open?", [
    "At 1.3 s.", "At 2.3 s, and 11 calls are still refused by the pool.", "Never.", "At 8 s."
  ], 1, "The long timeout delays the breaker: the first calls only fail after the 2 s.");
  tf("t8", 6, 2, "PSP-A and PSP-B should share the same circuit breaker.", false, "One breaker per dependency. The state of the PSP-A breaker is what triggers the fallback to PSP-B.");

  /* ---------- 9. Fallbacks ---------- */
  choice("t9", 1, 1, "What is a fallback?", [
    "A database backup.",
    "An alternative path to the same goal, which sacrifices something.",
    "Another name for retry.",
    "Switching off the functionality."
  ], 1, "The fallback swaps the path (degradation reduces the functionality). It always sacrifices cost, accuracy or consistency.");
  choice("t9", 2, 2, "What is the table shipping for Recife, SP and Rio, used if the carrier's quote fails?", [
    "9.00 · 15.00 · 12.00.", "15.00 · 9.00 · 12.00.", "12.00 · 12.00 · 12.00.", "0.00 for all."
  ], 1, "Recife 15.00, SP 9.00 and Rio 12.00. Caio's 1058, in Rio, pays 12.00.");
  choice("t9", 3, 3, "Partner A at R$ 0.03 and B at R$ 0.10 per query, at 30/s for 10 min. What is B's extra cost?", [
    "R$ 540.", "R$ 1,260.", "R$ 1,800.", "R$ 18,000."
  ], 1, "18,000 queries: R$ 540 (A) against R$ 1,800 (B): +R$ 1,260.");
  choice("t9", 4, 2, "How much traffic goes through the 1% proactive fallback, at 30 orders/s?", [
    "30/s.", "3/s.", "0.3/s: 18 per minute.", "1,800/min."
  ], 2, "30 × 1% = 0.3/s, or 18 per minute on PSP-B. It keeps the fallback warm and tested.");
  choice("t9", 5, 3, "PSP-B has an expired credential and nobody knew. When is it discovered?", [
    "In a Sunday test.",
    "At 20:20, with 100% of the traffic on top of it.",
    "Never.",
    "On the next deploy."
  ], 1, "A rarely used fallback has a latent defect. AWS prefers continuously exercised paths: the proactive one.");
  tf("t9", 6, 3, "Sending all the traffic to the fallback is always safe, because it is plan B.", false, "With less capacity, the fallback goes down too. Limit it with its own breaker and a queue.");

  /* ---------- 10. Graceful degradation ---------- */
  choice("t10", 1, 1, "What is graceful degradation?", [
    "Restarting the service.",
    "Switching off on purpose what is not essential to protect what is, before falling over.",
    "Switching PSP.",
    "Responding more slowly."
  ], 1, "Degradation reduces the functionality; the fallback swaps the path.");
  choice("t10", 2, 2, "The catalog handles 1,000 req/s (10 replicas × 100). The demand is 1,300. Which minimum level holds it?", [
    "0.", "1 (no recommendations: 1,333).", "2 (1,667).", "3 (CDN only)."
  ], 1, "Level 1: 7.5 ms per page, 133 req/s per replica, 1,333 in total. That already covers it.");
  choice("t10", 3, 3, "Are the 1,300 req/s the sustained Black Friday peak?", [
    "Yes: module 14 measured 1,300.",
    "No: it is a burst of a few seconds (newsletter); the measured peak is 640 and the projected one 950.",
    "Yes, but only in Rio.",
    "No: it is the monthly average."
  ], 1, "The HPA takes minutes to go from 10 to 14 replicas (1,400 req/s). Degradation buys that time.");
  order("t10", 4, 2, "In what order do you switch off? (from the first to switch off to the last)", [
    "Reports (SHEDDABLE).",
    "Recommendations and 'my orders' (SHEDDABLE_PLUS).",
    "Catalog (CRITICAL).",
    "Checkout (CRITICAL_PLUS)."
  ], "Checkout is the last to go. The order is a product decision, written down before the incident.");
  choice("t10", 5, 3, "The toggle stays at level 2 after the peak and the store sells without reviews for weeks. What was missing?", [
    "More replicas.", "Hysteresis and an owner for the way back.", "A second PSP.", "Nothing: it is expected."
  ], 1, "Every switch-off needs a way back: some time below the limit and someone responsible.");

  /* ---------- 11. Emergency backpressure ---------- */
  choice("t11", 1, 1, "What is backpressure?", [
    "The consumer telling the producer to slow down.",
    "Increasing the database pressure.",
    "Queuing everything in memory.",
    "Repeating the call."
  ], 0, "It needs a bounded queue and a signal (429, pause, request(n)).");
  choice("t11", 2, 2, "120 events/s arrive and 100 leave. How long does a bounded queue of 5,000 take to fill?", [
    "50 s.", "250 s (4 min 10 s).", "600 s.", "Never."
  ], 1, "The deficit is 20/s: 5,000 ÷ 20 = 250 s.");
  choice("t11", 3, 3, "With an unbounded queue, what is the delay after 10 min, and how long does it take to drain (arrivals drop to 20/s)?", [
    "12 s; 12 s.", "120 s and growing; 150 s.", "250 s; 250 s.", "0; 0."
  ], 1, "12,000 events ÷ 100/s = 120 s. Draining: 12,000 ÷ (100 − 20) = 150 s.");
  choice("t11", 4, 2, "What does dropping by priority (load shedding) mean?", [
    "Erasing the whole queue.",
    "Under overload, refusing SHEDDABLE traffic (marketing, reports) early instead of delaying everything.",
    "Refusing the oldest client.",
    "Doubling the capacity."
  ], 1, "Refusing what matters least keeps the paid order safe.");
  tf("t11", 5, 3, "'Queuing in memory' with no limit is a form of backpressure.", false, "An unbounded queue hides the overload: the delay grows, memory fills up and the process dies with the queue inside.");

  /* ---------- 12. Resilience in the data layer ---------- */
  choice("t12", 1, 1, "What are the RTO and RPO of the SP primary promotion?", [
    "RTO of 35 s; RPO of 9 (Rio) or 24 (Recife) orders.", "RTO of 9 s; RPO of 35 orders.", "RTO of 24 s; RPO of 9 s.", "RTO and RPO of zero."
  ], 0, "RTO is the time until it is back; RPO is the data lost. At 30 orders/s, 35 s leave 1,050 attempts with no primary.");
  choice("t12", 2, 2, "The catalog receives 640 req/s at an 80% hit rate. How much reaches the origin?", [
    "64 req/s.", "128 req/s.", "512 req/s.", "640 req/s."
  ], 1, "640 × 20% = 128. If the cache goes cold, all 640 hit at once.");
  choice("t12", 3, 2, "What does stale-if-error (RFC 5861) allow?", [
    "The cache to serve the old content for a while when the origin fails.",
    "The cache to never expire.",
    "The CDN to delete the content.",
    "The database to come back faster."
  ], 0, "The cache outlives the origin. Serving the old price for 10 min is acceptable because the command revalidates the current price.");
  choice("t12", 4, 3, "The database comes back after 5 min and all the keys expired together. What happens?", [
    "Nothing.", "Cache stampede: 640 req/s hit the origin at once.", "The cache gets faster.", "The primary changes."
  ], 1, "The fix: TTL with jitter and stale-while-revalidate.");
  tf("t12", 5, 2, "Serving the price of 79.90 from the cache for 10 min is safe because the order command revalidates the current price.", true, "The read can lag; the money cannot (module 18).");

  /* ---------- 13. Sharding and bulkheads ---------- */
  choice("t13", 1, 1, "What is the difference between sharding and a bulkhead?", [
    "They are the same thing.",
    "Sharding isolates data and customers; a bulkhead isolates resources (pools, queues) and dependencies.",
    "Sharding is from Kafka and a bulkhead is from the database.",
    "A bulkhead is older."
  ], 1, "They are different axes. Shuffle sharding is what ties the two together.");
  choice("t13", 2, 3, "Shared pool of 100, PSP at 8 s, 30 orders/s. How long until the pool runs out and who is left out?", [
    "3.33 s; the PSP, the shipping quote and the email.", "1.67 s; only the PSP.", "8 s; nobody.", "100 s; only the PSP."
  ], 0, "100 ÷ 30 = 3.33 s. The quote and the email, which are fast, also get blocked.");
  choice("t13", 3, 3, "With bulkheads of 50/30/20, what changes?", [
    "Nothing.", "Only the PSP pool runs out, in 1.67 s; shipping and email keep going.", "All of them run out in 1.67 s.", "The PSP comes back faster."
  ], 1, "50 ÷ 30 = 1.67 s. The walls limit the radius to the PSP.");
  choice("t13", 4, 2, "How many pairs exist in shuffle sharding of 2 replicas out of 10?", [
    "10.", "20.", "45.", "90."
  ], 2, "C(10, 2) = 45. The noisy customer only takes down whoever has the same pair.");
  choice("t13", 5, 3, "Which of these is a way for the bulkhead to fail?", [
    "Having one pool per dependency.",
    "A bulkhead that is too small (30 connections for a peak of 40 in flight) refuses legitimate traffic.",
    "Splitting by priority.",
    "Using a breaker."
  ], 1, "Other ways: leaky isolation (two pools depending on the same database) and uneven load (mkt-01).");
  tf("t13", 6, 2, "A lease is a grant with a deadline that the client must renew.", true, "If it does not renew, the resource goes back to the pool: the connection with a heartbeat, the Kafka consumer's partition.");

  window.QUIZ = out;
})();
