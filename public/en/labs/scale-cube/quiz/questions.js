/* Question bank for the Scale Cube quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-modelo-conceitual", name: "Introduction to the conceptual model" },
    t2: { topic: "aula-2-eixo-x-escalabilidade-horizontal", name: "X axis: horizontal scaling" },
    t3: { topic: "aula-3-eixo-x-exemplo", name: "X axis: example" },
    t4: { topic: "aula-4-eixo-y-quebra-de-funcionalidade", name: "Y axis: breaking up functionality" },
    t5: { topic: "aula-5-eixo-z-sharding-e-particionamento-de-dados", name: "Z axis: sharding and data partitioning" },
    t6: { topic: "aula-6-conversao-dos-eixos", name: "Converting the axes" }
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



  /* ---------- 1. Introduction to the conceptual model ---------- */
  choice("t1", 1, 1, "Which question defines the Y axis of the Scale Cube?", [
    "Do I copy the service?",
    "Do I split what is different?",
    "Do I split what is the same but too big?",
    "Do I swap the database for a faster one?"
  ], 1, "X copies (clones), Y splits what is different (by function) and Z splits what is the same but too big (by data).");
  choice("t1", 2, 1, "In what year did AKF Partners create the Scale Cube?", [
    "1999.",
    "2007.",
    "2015.",
    "2024."
  ], 1, "2007, published first on their blog and later in the books by Abbott and Fisher. 2015 is the 2nd edition of The Art of Scalability and 2024 is the year of the source article.");
  choice("t1", 3, 1, "What is the store's (X, Y, Z) coordinate today?", [
    "(1, 1, 1).",
    "(10, 9, 1).",
    "(10, 9, 3).",
    "(30, 9, 1)."
  ], 1, "Up to 10 replicas (the catalog), 9 deployments and 1 partition. (10, 9, 3) only exists after Z on pedidos, in module 16.");
  choice("t1", 4, 2, "The pedidos database is at the 150 orders/s ceiling, with 50 million rows. Which axis attacks this symptom?", [
    "X: more pedidos replicas.",
    "Y: split pedidos into more services.",
    "Z: split the database by a key.",
    "None: it is slow code."
  ], 2, "The ceiling belongs to the single-primary database. Cloning the service does not move it; splitting the data does: 3 shards give 3 × 150 = 450/s.");
  choice("t1", 5, 3, "The search takes 900 ms per request. What happens when you clone from 10 to 20 replicas?", [
    "Each search drops to 450 ms.",
    "Each search still takes 900 ms; only the queue shrinks.",
    "Searches start taking 90 ms.",
    "The index is created by itself."
  ], 1, "The time of one request comes from the code. X only adds more servers. The way out is an index (module 4) or a cache (module 5).");
  tf("t1", 6, 2, "The source article and the primary sources agree that the Scale Cube is a microservices-only model.", false, "Only the Y axis is microservices. X and Z also apply to a monolith, and AKF applies the cube to products, not only to services.");
  order("t1", 7, 2, "Put the store's trajectory through the cube in the order it happened.", [
    "(1, 1, 1): the monolith",
    "(1, 9, 1): 9 deployments",
    "(10, 9, 1): the catalog with 10 replicas",
    "(10, 9, 3): pedidos in 3 shards"
  ], "First Y (modules 6, 8 and 9), then X (modules 7 and 14) and last Z, which module 16 builds.");

  /* ---------- 2. X axis: horizontal scaling ---------- */
  choice("t2", 1, 1, "With 640 req/s and 10 catalog replicas, how many req/s does each replica receive?", [
    "10.",
    "64.",
    "640.",
    "6.4."
  ], 1, "640 ÷ 10 = 64: each copy takes 1/N of the load.");
  choice("t2", 2, 2, "Which of these is NOT a condition for X to work well?", [
    "A stateless service.",
    "A load balancer in front.",
    "A database partitioned by customer.",
    "Something that adjusts the number of copies (HPA)."
  ], 2, "Partitioning the database is Z. X needs interchangeable copies, a load balancer and a way to adjust the number of copies.");
  choice("t2", 3, 3, "Lena puts the cat in the cart on replica 1, and the page lands on replica 2, which shows an empty cart. Which fix does not break with the NAT of 500 people?", [
    "IP sticky.",
    "Cart state in Redis.",
    "One more replica.",
    "Swap the load balancer."
  ], 1, "With the state outside the process, any replica reads the same cart. IP sticky puts the 500 people on the same replica.");
  choice("t2", 4, 2, "pedidos does 30 orders/s per replica and the database, 150/s. From how many replicas on does the service stop being the limit?", [
    "4.",
    "5.",
    "6.",
    "7."
  ], 1, "5 × 30 = 150, equal to the database. The sixth replica (180/s) adds nothing.");
  tf("t2", 5, 2, "The sixth replica of pedidos raises the output from 150 to 180 orders/s.", false, "The database stops at 150/s. The bottleneck left the service and stayed in the database.");
  choice("t2", 6, 1, "Which cost of X does AKF point out?", [
    "It splits the data among the copies.",
    "Each copy accesses all the data.",
    "It separates the teams by service.",
    "It eliminates the load balancer."
  ], 1, "That is why the per-copy cache holds the same items ten times and, at the data layer, X becomes the replica: the whole set, duplicated.");

  /* ---------- 3. X axis: example ---------- */
  choice("t3", 1, 1, "Which agnhost (netexec) path returns the pod name?", [
    "/pods.",
    "/hostname.",
    "/healthz.",
    "/metrics."
  ], 1, "netexec exposes /hostname. Counting the 100 answers by name shows the split among the pods.");
  choice("t3", 2, 2, "Why is kubectl port-forward service/catalogo no good for seeing the balancing?", [
    "It forwards to one pod only.",
    "It only works with an HPA.",
    "It creates 10 pods.",
    "It blocks /hostname."
  ], 0, "port-forward picks one pod and stays on it. To see the split, you need to call the Service from inside the cluster.");
  choice("t3", 3, 2, "With the minReplicas 10 HPA applied, what happens with kubectl scale --replicas=3?", [
    "It stays at 3 forever.",
    "The HPA resets the number, within the range of 10 to 20.",
    "The Deployment is deleted.",
    "The Service stops working."
  ], 1, "The HPA watches the Deployment and keeps the replicas between minReplicas and maxReplicas.");
  choice("t3", 4, 3, "A pod is deleted in the middle of requests, with no readinessProbe and no graceful shutdown. What happens?", [
    "Nothing: the Service removes the pod right away.",
    "Requests fail for a few seconds, because the Service still sends connections to the pod.",
    "The Deployment stops creating pods.",
    "The HPA adds 10 more replicas."
  ], 1, "Cloning is one command; removing a copy without dropping anyone takes readiness and graceful shutdown (module 22).");
  tf("t3", 5, 2, "The output with names like catalogo-7d9c6b6c5f-x2k4q is real, measured on a cluster.", false, "The names and the count are illustrative. The manifests had their syntax checked but were not applied to a cluster.");

  /* ---------- 4. Y axis: breaking up functionality ---------- */
  choice("t4", 1, 1, "What is the difference between cutting by verb and by noun?", [
    "A verb is an entity; a noun is a use case.",
    "A verb is a use case (checkout); a noun is an entity (catalogo).",
    "A verb is the data; a noun is the code.",
    "There is no difference."
  ], 1, "Richardson gives both names: checkout crosses cart, orders, payments, stock and deliveries; the catalog is a thing.");
  choice("t4", 2, 2, "How many services does order 1053 cross in checkout and how much network does that add up to?", [
    "3 services, +10 ms.",
    "5 services, +20 ms (four hops of 5 ms).",
    "5 services, +25 ms.",
    "7 services, +30 ms."
  ], 1, "cart, orders, payments, stock and deliveries: five services, four hops of 5 ms.");
  choice("t4", 3, 1, "How many vCPU do 10 copies of the 8 vCPU monolith and the 7 Black Friday services cost?", [
    "80 and 25.",
    "80 and 55.",
    "25 and 80.",
    "80 and 8."
  ], 0, "10 × 8 = 80. Services: catalog 10, cart 3, orders 3, payments 2, stock 2, deliveries 1 and reports 4 = 25.");
  choice("t4", 4, 2, "How much does Y save in this vCPU math?", [
    "31%.",
    "55%.",
    "69%.",
    "25%."
  ], 2, "80 − 25 = 55 vCPU, 55 ÷ 80 = 68.75%, about 69%.");
  choice("t4", 5, 3, "The \"my orders\" screen (20 orders) starts fetching itens_pedido from a separate service, at 5 ms per call. How much network?", [
    "20 × 5 = 100 ms.",
    "21 × 5 = 105 ms.",
    "2 ms.",
    "1 × 5 = 5 ms."
  ], 1, "One list call plus 20 item calls: 21 × 5 = 105 ms, against a JOIN of about 2 ms. And the single transaction is lost.");
  tf("t4", 6, 2, "Y is the only axis that increases organizational scalability.", true, "Each service has an owner of code and data and ships on its own: the 40-minute deploy becomes independent deploys.");

  /* ---------- 5. Z axis: sharding and data partitioning ---------- */
  choice("t5", 1, 1, "What does the Z axis split?", [
    "What is different.",
    "What is the same but too big.",
    "Only what is in memory.",
    "The teams."
  ], 1, "The same code, each instance with a piece of the data, and a router that looks at a key.");
  choice("t5", 2, 2, "With 3 shards, where does caio-58 go (murmur3 mod 3)?", [
    "Shard 0.",
    "Shard 1.",
    "Shard 2.",
    "To all of them."
  ], 2, "lena-77 and bia-31 go to shard 1, caio-58 to 2 and davi-12 to 0.");
  choice("t5", 3, 2, "With (3, 1, 3), how much of the 200 orders/s comes out of pedidos?", [
    "90.",
    "150.",
    "200.",
    "450."
  ], 2, "9 pods give 270/s of service and 3 databases give 450/s: the whole demand comes out, 200/s, with each database at 44%.");
  choice("t5", 4, 3, "9 replicas of pedidos with a pool of 10 connections per shard talk to all 3 shards. How many connections does each database see?", [
    "30.",
    "90.",
    "10.",
    "270."
  ], 1, "9 × 10 = 90, close to the max_connections of 100. In the pods-per-shard model, each database sees only 3 × 10 = 30.");
  choice("t5", 5, 3, "WHERE id = 1042, without the key, on a table partitioned by cliente_id. What does the PostgreSQL plan show?", [
    "An Index Scan on one partition.",
    "An Append over the 3 partitions.",
    "A Seq Scan on the customers table.",
    "A partition error."
  ], 1, "Without the key there is no pruning: the query reads all the shards (scatter-gather) and merges the answers.");
  tf("t5", 6, 2, "Z applies only to the database; the application cannot be partitioned.", false, "AKF and Richardson also apply Z to the application: a search service with partitions and an aggregator, or whole pods per customer or region.");
  choice("t5", 7, 3, "With mkt-01, one shard receives 60% of the 200 orders/s. How much does it receive and how much is that of the 150 ceiling?", [
    "120/s, 80%.",
    "60/s, 40%.",
    "150/s, 100%.",
    "200/s, 133%."
  ], 0, "60% of 200 = 120/s, 80% of 150, at the knee from module 14. The other two shards receive 40/s each.");

  /* ---------- 6. Converting the axes ---------- */
  choice("t6", 1, 2, "How many pods does the store have today and after Z on pedidos (3 shards × 3 replicas)?", [
    "30 and 33.",
    "30 and 36.",
    "27 and 36.",
    "30 and 90."
  ], 1, "30 − 3 + 9 = 36: per-service sum of replicas × partitions.");
  choice("t6", 2, 1, "In what order should the store move through the axes?", [
    "Always X, Y, Z.",
    "The bottleneck's order, not the drawing's.",
    "Always Z first.",
    "In alphabetical order."
  ], 1, "The store did Y (module 6), X (module 7) and only now goes to Z, because each step was the one that hurt.");
  choice("t6", 3, 2, "What output does pedidos give at 200/s in (3, 1, 1), (7, 1, 1) and (3, 1, 3)?", [
    "90, 150 and 200.",
    "90, 210 and 270.",
    "45, 75 and 100.",
    "90, 150 and 150."
  ], 0, "The database stops X at 150; Z opens up 450/s of database and the whole demand gets through.");
  choice("t6", 4, 3, "A catalog with 10 replicas (X), 4 search microservices (Y) and 3 partitions (Z). How many pods?", [
    "13.",
    "17.",
    "120.",
    "30."
  ], 2, "10 × 4 × 3 = 120 pods for a service that delivered 100 req/s per replica. The axes multiply.");
  choice("t6", 5, 2, "With 200 orders/s and 30 per pod, how many pedidos pods would X ask for on the service alone, and does the database let it through?", [
    "7 pods; no, the database stops at 150.",
    "7 pods; yes, the 200 get through.",
    "6 pods; yes.",
    "5 pods; yes."
  ], 0, "⌈200 ÷ 30⌉ = 7 pods (210/s), but the single-primary database stops at 150/s.");
  tf("t6", 6, 2, "\"Pod\" in AKF's sense is the same as the Kubernetes pod.", false, "In AKF, a pod is the set of application and data of one Z partition, with X inside it. The name coincides, the concept does not.");

  window.QUIZ = out;
})();
