/* Question bank for the Deployment Models quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-deploy-e-rollback", name: "Deploy and rollback" },
    t2: { topic: "aula-2-big-bang-recreate", name: "Big Bang (Recreate)" },
    t3: { topic: "aula-3-rolling-updates", name: "Rolling updates" },
    t4: { topic: "aula-4-blue-green", name: "Blue/Green" },
    t5: { topic: "aula-5-blue-green-exemplo", name: "Blue/Green, the lab example" },
    t6: { topic: "aula-6-canary-releases", name: "Canary releases" },
    t7: { topic: "aula-7-canary-exemplo", name: "Canary, the lab example" },
    t8: { topic: "aula-8-migrations-e-versoes-de-dados", name: "Migrations and data versions" },
    t9: { topic: "aula-9-shadow-traffic", name: "Shadow traffic" },
    t10: { topic: "aula-10-shadow-traffic-exemplo", name: "Shadow traffic, the lab example" },
    t11: { topic: "aula-11-feature-flags", name: "Feature flags" },
    t12: { topic: "aula-12-sharding-bulkheads-e-ring-deployments", name: "Sharding, bulkheads and ring deployments" }
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

  /* ---------- Deploy and rollback ---------- */
  choice("t1", 1, 1, "What is the difference between deploying and releasing?", ["Deploying is putting the version live; releasing is the customer starting to use it.", "They are synonyms.", "Deploying is going back to a version; releasing is shipping the new one.", "Releasing is running the tests; deploying is writing the code."], 0, "With the frete_v2 flag off, 2.5.0 is deployed on every pod and released to nobody.");
  tf("t1", 2, 1, "kubectl rollout undo gives the database back the rows 2.5.0 wrote with frete = 0.00.", false, "The undo brings back the ReplicaSet (the code). The 3,600 orders already saved stay in the table; the fix is a reconciliation UPDATE.");
  choice("t1", 3, 2, "2.5.0 writes frete = 0.00 for Recife (1 order/s) and nobody notices for 60 minutes. What is the loss?", ["R$ 450", "R$ 3,600", "R$ 54,000", "R$ 486,000"], 2, "1 order/s × 3,600 s = 3,600 orders × R$ 15.00 = R$ 54,000. The R$ 486,000 is the 23:00 case, 9 h later.");
  choice("t1", 4, 2, "What happens with revisionHistoryLimit set to 0?", ["The rollout gets faster and nothing changes.", "Kubernetes keeps no old revisions and rollout undo has nowhere to go back to.", "The Deployment does not create ReplicaSets.", "The rollout goes back on its own in case of error."], 1, "The default is 10. With 0 the option to go back with rollout undo disappears.");
  choice("t1", 5, 3, "What is the blast radius formula for a change?", ["Number of pods × version.", "Latency × error rate.", "Fraction of traffic exposed × time until someone notices × cost per wrong order.", "Build time × number of commits."], 2, "The deployment models differ in how they control the first two factors; none of them fixes the third, and what determines the second is what you measure.");

  /* ---------- Big Bang (Recreate) ---------- */
  choice("t2", 1, 1, "What does Recreate do?", ["It swaps one pod at a time.", "It starts a second environment and flips the pointer.", "It shuts down all the old pods before creating the new ones.", "It copies the traffic to the new version."], 2, "It is the only model without two versions at the same time, and the price is downtime.");
  choice("t2", 2, 2, "How long is pedidos offline in a Recreate (30 s pods)?", ["30 s", "40 s", "90 s", "10 s"], 1, "10 s to shut down the 3 old pods and 30 s for the new ones to become ready: 40 s, or 200 orders refused at 5/s.");
  choice("t2", 3, 3, "2.5.0 does not start after a Recreate. How many seconds offline until it is undone?", ["40 s", "80 s", "120 s", "10 s"], 1, "The old ones already died: 40 s from the first Recreate, with no useful pod, and another 40 s from the Recreate back. That is 400 refused at 5/s and 2,400 at 30/s.");
  tf("t2", 4, 2, "Recreate is only viable with asynchronous communication and eventual consistency.", false, "Correction to the article: the criterion is the two versions being unable to coexist (or the transition costing more than the stop). The price is downtime.");
  choice("t2", 5, 3, "In entregas (3 Kafka partitions, 6 s per rebalance), how much does a 3-pod rolling interrupt?", ["6 s", "12 s", "36 s", "3 s"], 2, "3 swaps × 2 rebalances × 6 s = 36 s. Recreate does 1 rebalance of 6 s. Today cooperative rebalance (KIP-429) reduces this: Recreate is not the only way out.");

  /* ---------- Rolling updates ---------- */
  choice("t3", 1, 2, "With 3 replicas and the 25% default, what are maxSurge and maxUnavailable?", ["1 and 0", "0 and 1", "1 and 1", "0 and 0"], 0, "25% of 3 = 0.75: maxSurge rounds up (1) and maxUnavailable rounds down (0).");
  choice("t3", 2, 2, "How long does the 3-pod rolling take with pods ready in 30 s?", ["30 s", "60 s", "90 s", "40 s"], 2, "3 waves of 30 s, with no downtime: 2.5.0 sees 0%, 33%, 67% and 100%.");
  choice("t3", 3, 3, "On catalogo (10 pods, 640 req/s, 100 req/s per pod) with maxUnavailable 3, what is the utilization at the minimum of ready pods?", ["64%", "80%", "71.1%", "91.4%"], 3, "With 3 out, 7 pods remain: 640 ÷ 700 = 91.4%, and R = 126.7 ms. With maxUnavailable 2 there would be 8 ready: 80% and 60 ms.");
  tf("t3", 4, 2, "A rolling update checks that the business result is right before advancing the wave.", false, "It checks readiness (and minReadySeconds): pod health. Zero shipping passes because 2.5.0 answers 201 with 0% errors.");
  choice("t3", 5, 3, "During the rolling, why does everything both versions touch have to work for both?", ["Because Kubernetes restarts the pods twice.", "Because 2.4.0 and 2.5.0 live behind the same balancer for 90 s.", "Because the rolling uses two databases.", "Because 2.5.0 has not finished compiling yet."], 1, "lb-loja splits across the pods of both versions. It is the subject of lesson 8: data and events compatible with N and N−1.");

  /* ---------- Blue/Green ---------- */
  choice("t4", 1, 1, "How does blue/green work?", ["Two versions serve half the traffic each, forever.", "Two identical environments: green is tested without customers and the switch flips a pointer.", "Pods swap one by one in waves.", "A copy of the traffic goes to the new version."], 1, "Blue (2.4.0) serves, green (2.5.0) is validated and, afterwards, the switch is swapping the Service or the route.");
  choice("t4", 2, 2, "How many pods does catalogo use in the Black Friday blue/green?", ["10", "13", "20", "30"], 2, "10 + 10 = 20 pods: 10 extra replica-hours per hour of window.");
  tf("t4", 3, 2, "Going back to blue undoes what green wrote to the database.", false, "Blue and green talk to the same database. Flipping the pointer back does not undo the saved rows.");
  choice("t4", 4, 3, "Why is the \"instant\" switch not instant for the flow?", ["Because the pointer takes 60 s.", "Because Kubernetes recreates the Service.", "Because green has to compile again.", "Because open connections (keep-alive, HTTP/2, gRPC) stay on the old pods and DNS has a TTL."], 3, "The pointer switches in about 1 s; the flow only follows when the old connections close or the DNS TTL expires.");
  choice("t4", 5, 3, "The cold green takes 200 ms per request at 640 req/s, with 10 pods of 10 workers. What happens?", ["128 requests in flight against 100 workers: it forms a queue.", "Nothing: 12.8 in flight fit.", "Kubernetes restarts green.", "CPU drops to 0%."], 0, "Little's Law: 640 × 0.2 s = 128 in flight; 10 pods × 10 workers = 100. The fix is warm-up before the switch.");

  /* ---------- Blue/Green, the lab example ---------- */
  choice("t5", 1, 1, "In Argo Rollouts, which Service receives the new version for testing?", ["activeService", "previewService", "canaryService", "stableService"], 1, "activeService gets the customer (blue); previewService (chip-green in the lab) gets green.");
  choice("t5", 2, 2, "What does autoPromotionEnabled: false do?", ["It turns off blue/green.", "It promotes on its own after 60 s.", "It makes the promotion manual: someone approves green.", "It deletes green."], 2, "The promotion only happens when a person approves it (or the prePromotionAnalysis passes, in automated).");
  choice("t5", 3, 2, "What is the default scaleDownDelaySeconds in Argo Rollouts, and the one in the lab's simple file?", ["30 s and 60 s", "60 s and 30 s", "10 s and 60 s", "0 s and 30 s"], 0, "The default is 30 s and simple sets 60 s. In automated the line is commented out, so the default applies.");
  tf("t5", 4, 3, "The lab's automatic analysis (cassowary and success rate >= 0.95) would catch 2.5.0's zero shipping.", false, "The 201 with frete = 0.00 counts as success, and >= 0.95 still accepts 5% errors. Only a business metric catches the shipping.");
  choice("t5", 5, 3, "The defect shows up 8 min after the switch and blue left at 60 s. What is the design fix?", ["Turn off Prometheus.", "Lower the analysis to 0.5.", "Use fewer replicas.", "Size scaleDownDelaySeconds by the detection time, not the switch time."], 3, "If the store only notices in 8 min, blue has to live 8 min (costing 3 extra pods), or the canary cuts the exposure from the start.");

  /* ---------- Canary releases ---------- */
  choice("t6", 1, 1, "What is a canary?", ["A second environment identical to production.", "A slice of real traffic goes to the new version and only grows if the analysis passes.", "A copy of the traffic whose response is discarded.", "A flag that is off."], 1, "The canary splits the traffic between the stable version and the new one, measuring before it grows.");
  choice("t6", 2, 2, "At the 10% step for 5 min at 5 orders/s, how many Recife orders reach the canary?", ["30", "150", "300", "15"], 0, "5 × 300 × 10% = 150 orders, and 20% of them are from Recife: 30, all with zero shipping (R$ 450).");
  choice("t6", 3, 3, "With a true error rate of 1% and 150 requests on the canary, what is the chance of seeing no error?", ["1%", "22%", "50%", "78%"], 1, "0.99 to the power of 150 = 22%. To see at least one error with 95% confidence you need 298 requests.");
  tf("t6", 4, 2, "Without trafficRouting, Argo Rollouts approximates the canary weight by the number of pods.", true, "With 3 pods the minimum is 1 of 3 = 33%. With the mesh (module 10) the weight is exact, like 10%.");
  choice("t6", 5, 3, "What does the SRE Workbook say to compare the canary with?", ["The day before.", "The month's target.", "The stable control in the same interval.", "The week's average."], 2, "The day before had different traffic. The base article does not say this, and talks about weeks or months; in software it is minutes to hours.");

  /* ---------- Canary, the lab example ---------- */
  choice("t7", 1, 1, "What does pause: { } mean in a step of the lab's canary?", ["A 10 s pause.", "A 1 min pause.", "A pause with no end: someone promotes by hand.", "No pause."], 2, "The promotion is manual (kubectl argo rollouts promote). With duration, the promotion is automatic, by clock.");
  choice("t7", 2, 2, "How long does the lab's time canary take (10 s per step, weights 0, 10, 20, 40, 80, 100)?", ["10 s", "30 s", "50 s", "90 s"], 2, "5 pauses of 10 s: 50 s, faster than the 3-pod rolling. A canary by time without analysis is rolling with more steps.");
  order("t7", 3, 2, "Put the lab's analysis steps in order.", ["setWeight 20", "pause 30s", "first analysis", "setWeight 50", "pause 1m", "second analysis", "setWeight 100"], "These are the steps on lines 43 to 53: 20 → 30 s pause → analysis → 50 → 1 min pause → analysis → 100.");
  choice("t7", 4, 3, "Which of these is NOT one of the five gaps in the lab's analysis?", ["It tolerates 5% of 5xx.", "count: 1 (one measurement).", "It measures the whole service and dilutes the canary.", "It uses Kubernetes."], 3, "The five: 5% tolerance, only sees 5xx, whole service, irate (instead of rate) and count: 1.");
  choice("t7", 5, 3, "Why does measuring the whole service dilute the canary's error?", ["Because Prometheus has little memory.", "Because the canary does not generate metrics.", "Because stable and canary enter the same rate, and the error shows up only by the canary's weight.", "Because the whole service is slower."], 2, "With a 10% canary, its error becomes about a tenth in the rate. You need to filter by subset or by version.");

  /* ---------- Migrations and data versions ---------- */
  order("t8", 1, 2, "Put the shipping plan in order (expand and contract).", ["Expand: ADD COLUMN frete", "Deploy 2.5.0 (writes total and frete)", "Backfill in batches", "Deploy 2.6.0 (reads frete)", "Contract: SET NOT NULL and remove the old code"], "Each step serves version N and N−1. The migration runs before and after the deploy, never inside it.");
  choice("t8", 2, 2, "On 1 million rows, which ADD COLUMN rewrites the whole table?", ["NULL, no default (3.2 ms).", "NOT NULL DEFAULT 'BRL' (1.9 ms).", "NOT NULL DEFAULT random() (7.9 s): volatile default.", "None."], 2, "A constant default stays in the metadata (PostgreSQL 11 or later); a volatile one needs a value per row and rewrites the table.");
  choice("t8", 3, 3, "How much does the 1,975 MB table grow with the single UPDATE and with 100 batches of 10,000 (with VACUUM)?", ["+22% and +100%", "+100% and +22%", "+100% in both", "+0% and +0%"], 1, "The single UPDATE takes it to 3,950 MB (+100%); in batches, 2,407 MB (+22%).");
  choice("t8", 4, 3, "An ALTER TABLE waits for a long transaction and a SELECT arrives later. What happens without lock_timeout?", ["The SELECT jumps ahead.", "The SELECT waits behind the ALTER (4.0 s in the measurement): the queue blocks everyone.", "The ALTER cancels the long transaction.", "PostgreSQL ignores the ALTER."], 1, "With a 1 s lock_timeout the ALTER gives up in 1.0 s (canceling statement due to lock timeout) and the SELECT goes through.");
  choice("t8", 5, 3, "2.6.0 swaps mod 3 for mod 4. What fraction of the keys change shard in the sample, and what does Lena lose sight of?", ["10%: nothing.", "75.2%: 2.6.0 does not find her 8 orders (1042, 1044, 1047, 1048, 1051, 1054, 1055 and 1056).", "100%: the whole store.", "20%: only Davi."], 1, "She is on shard-1 and 2.6.0 looks on shard-0. The routing function is versioned data and changes through expand and contract, reading from both.");

  /* ---------- Shadow traffic ---------- */
  choice("t9", 1, 1, "What does shadow do with the traffic?", ["It splits it between the stable version and the new one.", "It copies a part to the new version and discards the response.", "It turns off the stable version.", "It creates a second database."], 1, "A mirror is duplication, not splitting: the stable one keeps 100% and the customer never sees the shadow.");
  choice("t9", 2, 2, "How much traffic does a 10% mirror of catalogo (640 req/s) send to 1 shadow replica?", ["10 req/s", "64 req/s", "640 req/s", "6.4 req/s"], 1, "64 req/s on 1 replica of 100 req/s: ρ = 64% and R = 37.8 ms (table from module 14).");
  tf("t9", 3, 2, "Without a comparator, shadow teaches the same as with one.", false, "Istio discards the response. The comparator joins the 2.4.0 one and the 2.5.0 one by x-request-id and finds 64.00 against 49.00.");
  choice("t9", 4, 3, "In 5 min the 10% shadow of pedidos copies 150 orders. How many from Recife diverge?", ["150", "0", "30, all with a different total (64.00 × 49.00)", "15"], 2, "20% of 150 = 30, all divergent: the shipping defect made visible, with no real order affected.");
  choice("t9", 5, 3, "The dry-run's tx.Rollback() undoes the INSERT. What keeps happening?", ["Nothing: the dry-run is safe.", "The shadow really called pagamentos and published the event: 150 charges of R$ 64.00 = R$ 9,600.", "Istio charges twice.", "The database locks up."], 1, "The rollback only reaches the database transaction. Fix: a pagamentos stub (or x-shadow refused), a pedidos.shadow topic and idempotency.");

  /* ---------- Shadow traffic, the lab example ---------- */
  choice("t10", 1, 1, "What is the mirror's percent in the author's lab?", ["100", "10", "1", "50"], 2, "percent: 1, to chip.shadow.svc.cluster.local:8080.");
  choice("t10", 2, 2, "How many orders per minute does a 1% mirror copy from 5 orders/s?", ["3", "30", "0.3", "300"], 0, "1% of 5/s = 0.05/s = 3 per minute: a small sample for pedidos.");
  tf("t10", 3, 2, "In the lab, the stable one and the shadow are the same app in the same namespaces.", false, "They are two apps: chip (10 replicas, chip namespace) and chip-shadow (shadow namespace, version v9, 1 replica).");
  choice("t10", 4, 3, "Which of these is NOT missing from the shadow lab?", ["The response comparator.", "The mirror itself (mirror).", "Enough sample for writes.", "Shadow capacity equal to the stable one's."], 1, "The mirror exists and works. Missing are the comparator, the sample, the shadow's capacity and removing the canary steps from an app that is only a shadow.");
  choice("t10", 5, 3, "Mirroring 100% of catalogo (640 req/s) onto 1 replica of 100 req/s causes what utilization?", ["64%", "100%", "320%", "640%"], 3, "640 ÷ 100 = 640%: infinite queue. Nobody sees it, because the response is discarded, and if the shadow shares a database or cache the stable one feels it.");

  /* ---------- Feature flags ---------- */
  choice("t11", 1, 1, "What does a feature flag separate?", ["The database from the cache.", "Blue from green.", "The code from the binary.", "Deploying from releasing."], 3, "The 2.5.0 code goes to 100% of the pods with frete_v2 off; turning the flag on is releasing.");
  choice("t11", 2, 2, "What is lena-77's bucket in frete_v2, and from what percentage is she on?", ["3, at 4%", "19, at 20%", "38, at 39%", "94, at 95%"], 1, "bucket = murmur3('frete_v2:lena-77') mod 100 = 19, and she is on when bucket < percentage: at 20% yes, at 10% no.");
  order("t11", 3, 2, "Put the sample customers in the order the frete_v2 flag turns them on as the percentage rises.", ["caio-58 (3)", "lena-77 (19)", "bia-31 (38)", "mkt-01 (41)", "davi-12 (94)"], "At 10% only Caio (Rio, no defect); at 20% Lena (Recife, it shows); at 50% Bia and mkt-01; at 100% Davi.");
  tf("t11", 4, 2, "The flag calculation is per customer, not per request, so the same person does not see both versions while pods disagree for up to 30 s.", true, "The local cache has a 30 s TTL. The same customer always lands on the same side because the bucket depends on the cliente_id and the flag name.");
  choice("t11", 5, 3, "The flag service goes down and the compiled default is true. What happens when the cache expires?", ["Nothing: the default is only decorative.", "The feature turns on for everyone at once, with no deploy and no canary.", "The feature turns off for everyone.", "The pod restarts."], 1, "That is why the default is the old behavior (false), and the flag is removed from the code when it reaches 100% and stabilizes.");

  /* ---------- Sharding, bulkheads and ring deployments ---------- */
  choice("t12", 1, 1, "What are the store's rings and the accumulated exposure?", ["shard-0 (20%) → shard-1 (20%) → shard-2 (60%): 20% → 40% → 100%.", "shard-2 → shard-1 → shard-0: 60% → 80% → 100%.", "Three rings of 33%.", "A single ring."], 0, "The accumulated exposure is 20%, 40% and 100%, in the order of the shards from module 16.");
  choice("t12", 2, 2, "In which ring does Recife's zero shipping show up, and at what exposure?", ["Ring 0, with 20%.", "Ring 1, with 40% of the traffic already on 2.5.0.", "Ring 2, with 100%.", "It never shows up."], 1, "Ring 0 has davi-12 (SP) and does not exercise Recife; Lena is on shard-1.");
  choice("t12", 3, 2, "How do you catch the defect already in ring 0?", ["Raise ring 0 to 60%.", "Skip ring 0.", "Put in synthetic customers with orders in every city.", "Wait one more day."], 2, "It is the AWS one-box idea: who exercises the code matters more than the size of the ring.");
  tf("t12", 4, 3, "k-means identifies which customers are low risk for the first ring.", false, "Correction to the article: k-means discovers similar groups. The first ring comes from a risk and business criterion (employees, synthetics, small regions).");
  choice("t12", 5, 3, "With Black Friday doubled (60 orders/s), does a 30/s pod handle shard-2 (60%)?", ["Yes: 18/s.", "Yes: exactly 30/s.", "No: 36/s goes over 30, and the hot ring needs more pods.", "Yes, because shard-2 is the last one."], 2, "60 × 60% = 36/s. Rings cost pods per ring and one version per ring to operate.");

  window.QUIZ = out;
})();
