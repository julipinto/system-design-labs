/* Question bank for the Single Point of Failure and Disaster Recovery quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-single-point-of-failure", name: "Single Point of Failure" },
    t2: { topic: "aula-2-identificando-spofs", name: "Finding SPoFs" },
    t3: { topic: "aula-3-redundancia-e-failover", name: "Redundancy and failover" },
    t4: { topic: "aula-4-disaster-recovery", name: "Disaster Recovery" },
    t5: { topic: "aula-5-metricas-e-kpis-de-recuperacao", name: "Recovery metrics and KPIs" }
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

  /* ---------- 1. Single Point of Failure ---------- */
  choice("t1", 1, 1, "What is a single point of failure (SPoF)?", [
    "Any component that is very slow.", "A component whose failure takes down all or part of the system with no alternative path.", "A server with little memory.", "The main database, always."
  ], 1, "It can be a database, load balancer, gateway, broker, another service or a vendor. What defines it is the lack of an alternative path.");
  choice("t1", 2, 1, "What happens to the store when PSP-A goes down and there is no PSP-B?", [
    "Nothing: the order closes through another path.", "Degraded mode: the catalog opens, but the order does not close.", "Total outage: nothing opens.", "Only the report stops."
  ], 1, "Lena's order reaches pagamentos and cannot close. It is degraded mode, with the store as a shop window.");
  choice("t1", 3, 2, "Why did PSP-B solve PSP-A without duplicating the store?", [
    "Because PSP-B is faster.", "Because it duplicated only the point where the failure hurt: pagamentos switches provider.", "Because PSP-B is free.", "Because the store became stateless."
  ], 1, "The goal is not to duplicate everything, but to shrink the radius, the surprise and the time to recover.");
  choice("t1", 4, 2, "Which failure does the most damage, in the lesson's table?", [
    "One pedidos pod (out of 3).", "PSP-A with PSP-B turned on.", "The whole edge-loja down.", "One Kafka broker."
  ], 2, "edge-loja is on the path of every order: nothing reaches the cells, it is a total outage.");
  tf("t1", 5, 1, "A SPoF takes down a component or service; a disaster goes beyond what the application absorbs and DR works at the product level.", true, "A SPoF can take down one service. A disaster compromises a region, a provider or several services at once.");
  choice("t1", 6, 3, "edge-loja has 3 instances, at 99.9% each. Why does the parallel math (99.9999999%) not hold?", [
    "Because 3 instances are too few.", "Because all three run the same code and the same map: a common-mode failure takes down all three.", "Because parallel only works with 2 copies.", "Because the DNS is slow."
  ], 1, "The real availability of the set is that of one instance: 99.9%. Duplicating something with the same defect does not help.");
  choice("t1", 7, 3, "Which of these is truly independent redundancy?", [
    "Three pods from the same deploy, with the same bad configuration.", "PSP-A and PSP-B, two different providers.", "Three edge-loja instances with the same map.", "Two copies of the same binary with the same bug."
  ], 1, "Two providers do not share the cause. Parallel only helps when the failures are independent.");

  /* ---------- 2. Finding SPoFs ---------- */
  choice("t2", 1, 1, "What question do you ask each link in the audit?", [
    "How much does it cost?", "Who takes over if you disappear, and how fast?", "Who wrote you?", "What is your average latency?"
  ], 1, "The audit draws the happy path, lists every actor (vendor, certificate, person) and asks each one this question.");
  choice("t2", 2, 2, "How many links of Lena's path count as SPoF, and which ones?", [
    "3: lb, gw and bff.", "5: DNS, certificate, edge-loja, identity and the map.", "12: all of them.", "1: only the database."
  ], 1, "Links 1, 2, 3, 4 and 12. The database is partial: the passive takes over in 35 s, with 0.3 s of data missing.");
  choice("t2", 3, 2, "What is the availability of the 12 links at 99.9% in series, and how many minutes per month?", [
    "99.9%, 43.2 min.", "98.8066%, 515.6 min.", "99.5003%, 215.9 min.", "99.9988%, 0.52 min."
  ], 1, "0.999^12 = 98.8066%. With the 5 SPoFs left and the rest duplicated it is 99.5003% (215.9 min); with everything duplicated, 99.9988%.");
  choice("t2", 4, 2, "Of the 215.9 min per month left with the 5 SPoFs, how many come from them?", [
    "About 20.", "215.6.", "100.", "None."
  ], 1, "The seven duplicated links are worth 0.3 min: the rest belongs to the five SPoFs, and each one fixed gives back ~43.2 min.");
  choice("t2", 5, 3, "Why does the control plane (the map, link 12) weigh less than it seems?", [
    "Because it never fails.", "Because it is off the order path: the edges keep the last map (static stability).", "Because it has 3 copies.", "Because it is free."
  ], 1, "Static stability: what sits on the order path does not depend on something that only exists to change the configuration.");
  tf("t2", 6, 2, "A TLS certificate renewed by hand once a year is an organizational SPoF.", true, "On the day the deadline passes and nobody remembers, HTTPS goes down for everyone. The fix is automatic renewal and a 30-day alert.");
  choice("t2", 7, 3, "Why does the audit 'age'?", [
    "Because the numbers change every month.", "Because the flow changes: the cells from module 26 created edge-loja and the map, which were not on the old list.", "Because vendors change their names.", "Because k6 changed."
  ], 1, "It is a continuous review, redone at every change to the order path, not a project with an end date.");

  /* ---------- 3. Redundancy and failover ---------- */
  choice("t3", 1, 1, "What does stateless do to the risk?", [
    "Removes it.", "Moves it to the data layer: PostgreSQL and Redis now concentrate what used to belong to the pods.", "Doubles it.", "Moves it to the DNS."
  ], 1, "Any pod serves any request, but the state and the risk go to the database and the cache.");
  choice("t3", 2, 1, "What is the difference between active and passive redundancy?", [
    "Active is cheaper.", "In active all copies serve; in passive one serves and the other waits, and the time to recover depends on detecting and promoting.", "Passive splits the load.", "There is no difference."
  ], 1, "The load balancer and the topic consumers are active; the database replica is passive.");
  order("t3", 3, 2, "Put the steps of automatic failover in order:", [
    "Detect", "Decide (by quorum)", "Switch (promote and flip the map)"
  ], "Each step has a clock: 10 s × 3 probe = 30 s, quorum 2 of 3, database in 35 s and map in 5 s.");
  choice("t3", 4, 2, "How long does the region probe (10 s, 3 failures in a row) take?", [
    "10 s.", "15 s.", "30 s.", "35 s."
  ], 2, "10 × 3 = 30 s, the MTTD of the SP outage. A pod leaves the load balancer in 15 s (5 s × 3) and the database promotes in 35 s.");
  choice("t3", 5, 3, "The network between SP and Rio splits, but SP did not fall. What happens?", [
    "Nothing: Patroni takes care of it.", "Rio promotes the replica and SP keeps accepting orders: two primaries (split brain).", "SP shuts itself down.", "The DNS fixes it."
  ], 1, "Without fencing, the old primary keeps writing. The fix is for the leader to renew the key (or demote itself) and for the quorum to decide.");
  choice("t3", 6, 3, "With 9.9 orders/s and 30 s until fencing, how many orders does pg_rewind discard? And in 5 min?", [
    "30 and 300.", "297 and 2,970.", "99 and 990.", "2,970 and 29,700."
  ], 1, "9.9 × 30 = 297 and 9.9 × 300 = 2,970: orders confirmed in SP that Rio never saw.");
  tf("t3", 7, 2, "The circuit breaker and the feature flag decide a region outage, the way the router does.", false, "The breaker decides per call, on the client. Regional failover decides by probe, by quorum and through the router.");

  /* ---------- 4. Disaster Recovery ---------- */
  choice("t4", 1, 1, "What is the measured RTO in the SP outage with warm standby, and how is it made up?", [
    "35 s: only the MTTR.", "65 s: MTTD 30 s + MTTR 35 s, counted from the interruption.", "30 s: only detection.", "5 min."
  ], 1, "The region fell at 20:40:00.150 and the map flipped at 20:41:05: 65 s.");
  order("t4", 2, 2, "Put the SP outage timeline in order:", [
    "The region goes down (20:40:00.150)", "Three probes fail: 30 s MTTD", "The Rio replica is promoted (35 s)", "The passive's pods are ready (60 s)", "The map flips: 65 s RTO"
  ], "Detection at 30 s, promotion at 35 s, pods at 60 s and map at 65 s.");
  choice("t4", 3, 2, "How much does Rio's load change when celula-sp goes down?", [
    "From 4.5 to 9 orders/s.", "From 4.5 to 14.4 orders/s (3.2×).", "From 9.9 to 14.4.", "It does not change."
  ], 1, "4.5 + 9.9 = 14.4. That is why the passive runs warm at 30% and scales in 30 s per pod.");
  choice("t4", 4, 2, "What is the order of the RTOs, from worst to best?", [
    "Active-active, warm standby, pilot light, backup.", "Backup (~48 min), pilot light (12 min), warm standby (65 s), active-active (35 s).", "Pilot light, backup, warm standby, active-active.", "All the same."
  ], 1, "Climbing the ladder: each step costs more and comes back faster.");
  choice("t4", 5, 2, "How much is lost in reais with pilot light in the SP outage (9.9/s, R$ 80)?", [
    "R$ 27,720.", "R$ 51,480.", "R$ 570,240.", "R$ 2,276,208."
  ], 2, "R$ 792 per second × 720 s = R$ 570,240. Warm standby is R$ 51,480 and backup is R$ 2,276,208.");
  choice("t4", 6, 3, "With the checkout at RTO 5 min, which strategies meet it?", [
    "All of them.", "Only warm standby and active-active.", "Only active-active.", "Pilot light and backup."
  ], 1, "Warm standby (65 s) and active-active (35 s). Pilot light (12 min) meets the catalog and reports; backup meets only reports.");
  choice("t4", 7, 3, "What is the hub, and why does it matter?", [
    "The central load balancer.", "SP holds the passives of 3 cells: with SP out, they run with no copy and a second failure loses data.", "The DNS panel.", "Kafka."
  ], 1, "It is the SPoF of the DR plan itself, and the audit from lesson 2 did not find it. The game day (taking SP down on purpose) is what shows it.");

  /* ---------- 5. Recovery metrics and KPIs ---------- */
  choice("t5", 1, 1, "Which are measurements and which are contractual objectives?", [
    "RTO and RPO are measurements; MTTD, MTTR and MTBF are objectives.", "MTTD, MTTR and MTBF are measurements; RTO and RPO are objectives.", "All are measurements.", "All are objectives."
  ], 1, "Measurements describe what happened; RTO and RPO are what you promise.");
  choice("t5", 2, 2, "What are the averages of MTTD, MTTR and MTBF from the article's tables?", [
    "34 · 108.4 · 204.5 min.", "30 · 35 · 65 s.", "60 · 90 · 116 min.", "170 · 542 · 818 min."
  ], 0, "170 ÷ 5 = 34, 542 ÷ 5 = 108.4 and 818 ÷ 4 = 204.5. It is the sums that are 170, 542 and 818.");
  choice("t5", 3, 2, "With an MTBF of 204.5 min and an MTTR of 108.4 min, what is the availability?", [
    "99.9%.", "65.4%.", "99.7506%.", "99.9975%."
  ], 1, "204.5 ÷ (204.5 + 108.4) = 65.4%: the article's numbers are didactic, and the three tables do not describe the same incidents.");
  choice("t5", 4, 2, "Why is the store's RTO 65 s, and not 35 s?", [
    "Because 35 s is the MTBF.", "Because RTO counts from the interruption and includes the MTTD: 30 + 35.", "Because the article says so.", "Because the PSP is slow."
  ], 1, "The article defines RTO 'after detection'; AWS defines it between the interruption and the restoration. The store uses AWS's.");
  choice("t5", 5, 2, "How many orders does the RPO let you lose in celula-mkt (12/s, 0.8 s lag)?", [
    "2.97.", "2.88.", "9.6.", "0.8."
  ], 2, "RPO in orders = rate × lag: 12 × 0.8 = 9.6. celula-sp loses 2.97 and celula-recife, 2.88.");
  choice("t5", 6, 3, "What does zero RPO cost?", [
    "Nothing.", "Network: synchronous replication adds 10 ms (Rio) or 80 ms (Recife) to the 2 ms commit.", "A new disk.", "A second primary."
  ], 1, "The commit becomes 12 ms with Rio and 82 ms with Recife.");
  choice("t5", 7, 3, "Bia's 1061 was lost and Davi got the same number. What is the long-term fix?", [
    "Restart the database.", "An id per cell (rec-1061) or UUIDv7, or skipping the sequence ahead (+1,000) on promotion.", "Increase the lag.", "Delete Davi's order."
  ], 1, "The sequence came from a single database and, after the promotion, it reuses the last replicated value. SP's disk came back at 23:40 and Bia's order became 1062.");

  window.QUIZ = out;
})();
