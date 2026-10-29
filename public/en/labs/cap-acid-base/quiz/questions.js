/* Question bank for the CAP Theorem, ACID and BASE quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (answer = "cp", "ap" or "ca"), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-teorema-cap", name: "The CAP theorem" },
    t2: { topic: "aula-2-modelo-acid", name: "The ACID model" },
    t3: { topic: "aula-3-modelo-base", name: "The BASE model" },
    t4: { topic: "aula-4-componentes-do-cap", name: "Components of CAP" },
    t5: { topic: "aula-5-combinacoes-do-cap", name: "CP, AP and CA combinations" },
    t6: { topic: "aula-6-criticas-modernas", name: "Modern critiques of CAP" },
    t7: { topic: "aula-7-teorema-pacelc", name: "The PACELC theorem" }
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
  function layer(k, n, level, prompt, answer, explain) { add(k, n, "layer", level, prompt, null, answer, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. The CAP theorem ---------- */
  choice("t1", 1, 1, "What does the CAP theorem say about a network partition in a replicated system?", [
    "You can have consistency and availability together, as long as the hardware is good.",
    "You have to choose between consistency and availability for as long as the partition lasts.",
    "The system has to stop completely until the network is back.",
    "The replicas automatically become consistent."
  ], 1, "During the partition, a replicated system can't both answer every request and guarantee the newest data.");
  choice("t1", 2, 1, "Who proposed the CAP idea, and in what year?", [
    "Daniel Abadi, in 2010.",
    "Martin Kleppmann, in 2015.",
    "Eric Brewer, in 2000.",
    "Edgar Codd, in 1970."
  ], 2, "Brewer presented the idea in 2000. Gilbert and Lynch formally proved it in 2002. Abadi proposed PACELC in 2010.");
  tf("t1", 3, 1, "In a network partition, the servers on the other side are turned off.", false,
    "A partition is when the nodes are alive but can't exchange messages. Each side thinks the other has vanished.");
  choice("t1", 4, 2, "The cable between Rio and Recife goes down. Lena's brother, in Recife, tries to buy the last plush cat and the system returns a 503 error after 3,000 ms, while São Paulo and Rio keep selling. What did the system choose?", [
    "Consistency, giving up availability in Recife.",
    "Availability, giving up consistency.",
    "Both, because São Paulo answered.",
    "Neither: CAP doesn't apply when there's an error."
  ], 0, "Refusing in Recife keeps the copies from diverging, but Lena's brother got no useful answer.");
  choice("t1", 5, 3, "With the Rio–Recife cable cut, SP (Lena's order #102) and Recife (her brother's order #103) each accept a plush cat purchase (stock 4, v2). What's the result?", [
    "None: the replicas fix themselves right away.",
    "Both write stock 3: the nodes show 3, but the real stock is 2.",
    "The stock goes to 2 on both sides right away.",
    "The São Paulo database erases Recife's."
  ], 1, "Without talking to each other, each side only subtracts its own sale: 5 - 3 orders = 2, but each node says 3. The divergence only shows up when the network is back.");
  order("t1", 6, 2, "Put in order what happens in the plush cat scene.", [
    "The cable between Rio and Recife goes down and Recife is isolated.",
    "Two purchases arrive at the same time, one in SP and one in Recife.",
    "The system chooses: refuse the request or accept it.",
    "The network is back and the replicas reconcile."
  ], "First comes the partition, then the orders, then the system's choice and, in the end, the reconciliation when the network is back.");
  tf("t1", 7, 2, "Without a network partition, the CAP theorem forbids the system from being consistent and available at the same time.", false,
    "CAP's trade-off holds during the partition. Without one, nothing stops you from having both.");

  /* ---------- 2. The ACID model ---------- */
  choice("t2", 1, 2, "Lena transfers R$ 100 to her brother: a debit on her account (150 to 50) and a credit on his (20 to 120). The server crashes between the two steps. What does atomicity guarantee?", [
    "The debit stays and the credit is lost, to record the error.",
    "Both accounts go back to the initial state: 150 and 20, via rollback.",
    "The database retries the credit forever, without undoing the debit.",
    "The brother's balance becomes zero."
  ], 1, "Atomicity is all or nothing: an incomplete transaction is undone entirely.");
  tf("t2", 2, 1, "The C in ACID and the C in CAP mean the same thing.", false,
    "In ACID, consistency means respecting the database's integrity rules. In CAP, it's linearizability: the replicas look like a single copy.");
  choice("t2", 3, 2, "T1 (the transfer) lowers Lena's balance from 150 to 50 but doesn't commit. T2 reads 50. Then T1 rolls back and the balance returns to 150. Which anomaly was this?", [
    "Dirty read.",
    "Non-repeatable read.",
    "Phantom.",
    "Lost update."
  ], 0, "T2 read an uncommitted value. That value never really existed.");
  choice("t2", 4, 2, "T1 reads 150, T2 (the rent) commits 110, and T1 reads again, in the same transaction, and sees 110. Which anomaly is this?", [
    "Dirty read.",
    "Non-repeatable read.",
    "Phantom.",
    "Lost update."
  ], 1, "The same row gave different values within the same transaction. That's a non-repeatable read. A phantom is when new rows appear.");
  choice("t2", 5, 2, "T1 and T2 read the balance 150. T1 (transfer) calculates 150 - 100 and writes 50; T2 (rent) calculates 150 - 40 and writes 110. What would the right balance be and which anomaly occurred?", [
    "10, with a lost update.",
    "110, with no anomaly.",
    "50, with a dirty read.",
    "10, with a phantom."
  ], 0, "150 - 100 - 40 = 10. T1's debit of 100 was overwritten: that's a lost update.");
  choice("t2", 6, 1, "What guarantees durability after a COMMIT?", [
    "The database writes the change to the WAL, on disk, before confirming.",
    "Keeping the data only in memory, which is faster.",
    "Repeating the query until it works.",
    "Asking the client to keep a copy."
  ], 0, "The WAL is the database's journal. If the power goes out, it rereads the WAL on startup and recovers everything that was committed.");
  choice("t2", 7, 2, "The same query (SUM of today's entries) returns 2 rows (R$ 60) and, minutes later in the same transaction, 3 rows (R$ 100) because T2 inserted the rent entry. Which anomaly is this?", [
    "Dirty read.",
    "Lost update.",
    "Phantom.",
    "Broken atomicity."
  ], 2, "A row's value didn't change: the set of rows gained a new row. That's a phantom.");
  order("t2", 8, 2, "Order the isolation levels from least to most strict.", [
    "Read Uncommitted",
    "Read Committed",
    "Repeatable Read",
    "Serializable"
  ], "The further right, the fewer anomalies and the higher the cost. Serializable is equivalent to running the transactions one at a time.");

  /* ---------- 3. The BASE model ---------- */
  choice("t3", 1, 1, "What does BASE stand for?", [
    "Basically Available, Soft state, Eventual consistency.",
    "Basic Atomicity, Safe state, Eventual commit.",
    "Backup, Availability, Storage, Encryption.",
    "Balanced, Atomic, Serializable, Eventual."
  ], 0, "BASE is the counterpoint to ACID: it prefers staying up and converging later over always guaranteeing the same data.");
  choice("t3", 2, 1, "What is soft state?", [
    "A database that never writes to disk.",
    "The state can change over time with no new write, like replicas converging or a cache expiring.",
    "A state that never changes.",
    "A database with mild transactions."
  ], 1, "Soft state is state in motion: the value can adjust by itself while the copies sort themselves out.");
  choice("t3", 3, 2, "SP writes Lena's transfer (Lena 50, irmão 120, v2) and answers in ~5 ms. Recife only gets the copy later. The brother reads his own balance in Recife right after. What does he see?", [
    "R$ 120, v2.",
    "An error, because the data hasn't arrived yet.",
    "R$ 20, v1: a stale read.",
    "R$ 0, v0."
  ], 2, "The replica hasn't received the new write yet and returns the old value. That's a stale read.");
  tf("t3", 4, 2, "Eventual consistency guarantees that all replicas converge in at most 1 second.", false,
    "It only promises that, if the writes stop, the copies end up equal. It doesn't set a time, which can grow with failures.");
  choice("t3", 5, 3, "During the partition, SP sells #102 and Recife sells #103, and each writes stock 3. With last-write-wins, the stock ends at 3. What was lost?", [
    "Nothing: the right stock is 3.",
    "One of the two sales: the right value was 2.",
    "Both sales.",
    "The timestamp."
  ], 1, "There were two sales after stock 4, so the right value was 4 - 2 = 2 (5 - 3 orders). LWW keeps only one write and discards the other.");
  choice("t3", 6, 3, "The versions {SP:2, REC:1} and {SP:1, REC:2} of a vector clock are in what relationship?", [
    "The first is newer.",
    "The second is newer.",
    "They are equal.",
    "They are concurrent: neither came after the other, and there is a conflict."
  ], 3, "Each has a higher counter on a different node. The vector clock shows the writes were independent.");
  choice("t3", 7, 3, "Starting stock 5. In a CRDT counter, SP records 2 sales (#101 and #102) and Recife records 1 (#103), isolated. After merging, what is the stock?", [
    "3",
    "2",
    "5",
    "It depends on who merges first."
  ], 1, "Each node counts only its own sales and the merge adds them up: 3 sales. 5 - 3 = 2, in any merge order.");

  /* ---------- 4. Components of CAP ---------- */
  choice("t4", 1, 1, "What is consistency in CAP?", [
    "Respecting the database's foreign keys.",
    "Linearizability: after the write, every read sees the new value, as if there were a single copy.",
    "All servers having the same hardware.",
    "The data always being on disk."
  ], 1, "The C in CAP is about replicas looking like one. The C in ACID is about integrity rules.");
  choice("t4", 2, 1, "What is availability in CAP?", [
    "The server having 99.9% uptime in the month.",
    "Every request to a live node gets an answer that is not an error.",
    "The database having a backup.",
    "The answer arriving in under 100 ms."
  ], 1, "The definition is about every request to every live node. It isn't an uptime goal and says nothing about latency.");
  tf("t4", 3, 2, "A 503 error or a timeout counts as an answer for CAP's availability.", false,
    "The definition requires an answer that is not an error. Refusing the request sacrifices availability.");
  choice("t4", 4, 1, "What is a network partition?", [
    "Splitting a table into pieces (sharding).",
    "Live nodes that can't exchange messages, because of loss or delay on the network.",
    "A disk that fails.",
    "A server that needs maintenance."
  ], 1, "Partitioning data (sharding) is something else. Here the partition is of the network, not of the table.");
  choice("t4", 5, 2, "With N = 3 replicas, which combination guarantees that the read overlaps with at least one copy that has the newest write?", [
    "W = 1 and R = 1",
    "W = 1 and R = 2",
    "W = 2 and R = 2",
    "W = 0 and R = 1"
  ], 2, "The rule is R + W > N: 2 + 2 = 4 > 3. With W = 1 and R = 2 the sum is 3, which doesn't exceed 3.");
  choice("t4", 6, 3, "With quorum W = 2 and R = 2, a read touches Rio (stock 3, v3) and Recife (stock 4, v2). What does the system return?", [
    "4, v2, because it's the highest value.",
    "3, v3, the newest version.",
    "Both values without deciding.",
    "A conflict error."
  ], 1, "A quorum read picks the highest version. Here it's v3, with stock 3.");
  tf("t4", 7, 1, "In practice, tolerating partitions (P) is an optional design choice in distributed systems.", false,
    "The network fails, so the partition will happen. What you choose is what to do during it: refuse (C) or answer (A).");
  tf("t4", 8, 2, "A database can respect the C in ACID and still have replicas that disagree with each other.", true,
    "They are different properties. The C in ACID is about integrity rules, the C in CAP is about replicas looking like a single copy.");

  /* ---------- 5. CAP combinations ---------- */
  layer("t5", 1, 2, "Lena's account balance and transfers: what does the system prefer in a partition?", "cp",
    "A wrong balance is worse than a temporary error. Refusing is preferred (CP).");
  layer("t5", 2, 2, "Adding an item to the shopping cart during a partition: what does the store prefer?", "ap",
    "Accepting the item and reconciling later costs little. Refusing would kill the sale (AP).");
  layer("t5", 3, 2, "A single PostgreSQL with the whole store, on one server: which combination describes it?", "ca",
    "With no other replica and no network between nodes, there is no partition: consistency and availability together (CA). If the server goes down, everything goes down.");
  choice("t5", 4, 1, "In a partition, what does the side without a quorum of a CP system do?", [
    "Accepts writes and reconciles later.",
    "Refuses requests, returning an error or timeout.",
    "Shuts down the other nodes.",
    "Starts ignoring the integrity rules."
  ], 1, "CP chooses consistency: without a majority, it doesn't answer, to avoid risking divergence.");
  tf("t5", 5, 2, "Full CA is a realistic option for a system distributed across several regions.", false,
    "The network between regions fails. CA only holds without a network between nodes, like a single server.");
  choice("t5", 6, 3, "Why do lists of CP and AP databases sometimes contradict each other, like Cassandra appearing in both?", [
    "Because the authors got the math wrong.",
    "Because the behavior changes with the configuration (R and W) and the label is only an approximation.",
    "Because Cassandra changes version every hour.",
    "Because CP and AP are the same thing."
  ], 1, "Many databases let you choose how many replicas confirm the write and the read. The label depends on that choice.");
  layer("t5", 7, 3, "Reserving the last plush cat without the stock ever diverging, even if that refuses some requests during a failure: which combination?", "cp",
    "The rule to protect is that the stock must not diverge. Losing availability in exchange is accepted (CP).");

  /* ---------- 6. Modern critiques ---------- */
  choice("t6", 1, 2, "Why is \"pick 2 of 3\" considered misleading?", [
    "Because you can always pick all 3.",
    "Because P isn't optional, partitions are rare, and C and A are degrees and not on/off switches.",
    "Because the theorem was refuted.",
    "Because it only holds for SQL databases."
  ], 1, "CAP only restricts behavior during the partition, and both properties have middle grounds.");
  order("t6", 2, 2, "Put in order the three phases of dealing with a partition, according to Brewer (2012).", [
    "Detect the partition.",
    "Enter partition mode, limiting risky operations.",
    "Recover: merge the versions and fix errors."
  ], "First you detect, then you limit what's risky, and only then do you recover when communication is back.");
  tf("t6", 3, 2, "According to Kleppmann's critique, CAP says nothing about latency: a very slow system can still be \"available\" by the definition.", true,
    "That's one of the critiques: a system that answers in two minutes meets CAP's definition of availability.");
  choice("t6", 4, 1, "Who wrote \"CAP Twelve Years Later\", and in what year?", [
    "Eric Brewer, in 2012.",
    "Daniel Abadi, in 2010.",
    "Gilbert and Lynch, in 2002.",
    "Haerder and Reuter, in 1983."
  ], 0, "Brewer himself revisited the idea 12 years later, in 2012.");
  choice("t6", 5, 3, "Which design follows the idea of choosing per operation?", [
    "The whole store is CP, no exceptions.",
    "The whole store is AP, including payments.",
    "Payment refuses in a partition; cart always accepts; storefront can be stale.",
    "The store decides only after the first failure."
  ], 2, "Each operation has its own invariant: the balance is always protected, the cart tolerates reconciling later.");
  tf("t6", 6, 1, "Partitions are relatively rare, and without a partition a system can deliver consistency and availability together.", true,
    "It's one of Brewer's arguments (2012): the trade-off only bites during the failure.");
  choice("t6", 7, 3, "After the partition, two orders (#102 and #103) were accepted for the same plush cat unit. Which is an example of compensation?", [
    "Erasing the database and starting over.",
    "Canceling one of the orders and giving the customer a coupon.",
    "Ignoring the problem.",
    "Charging the card twice."
  ], 1, "Compensating is fixing the error in the business after detecting it: cancel, refund, apologize.");

  /* ---------- 7. The PACELC theorem ---------- */
  choice("t7", 1, 1, "What does PACELC stand for?", [
    "If Partition: Availability or Consistency. Else: Latency or Consistency.",
    "Partition, Atomicity, Consistency, Eventual, Latency, Cache.",
    "If Partition: Latency or Consistency. Else: Availability or Consistency.",
    "Performance, Availability, Cost, Elasticity, Latency, Capacity."
  ], 0, "P-A-C applies in a partition and E-L-C applies in the \"else\", when the network is healthy.");
  choice("t7", 2, 1, "Who proposed PACELC and when?", [
    "Eric Brewer, in 2000.",
    "Daniel Abadi, in 2010.",
    "Martin Kleppmann, in 2015.",
    "Jim Gray, in 1981."
  ], 1, "Abadi proposed it in 2010, because CAP doesn't look at latency.");
  choice("t7", 3, 1, "What does PACELC add to CAP?", [
    "A way to escape the partition.",
    "The behavior without a partition: the trade-off between latency and consistency.",
    "A fourth letter for durability.",
    "The formal proof of CAP."
  ], 1, "Without a partition, the dilemma is between answering fast (L) and waiting for the replicas to get consistency (C).");
  choice("t7", 4, 3, "SP only answers \"ok\" after Rio and Recife confirm, and that takes ~80 ms with a healthy network. If the network between the cities gets slow (300 ms), roughly how long does Lena wait?", [
    "5 ms",
    "80 ms",
    "300 ms",
    "3,000 ms"
  ], 2, "With synchronous replication, each write is as slow as the slowest link: ~300 ms. That's the price of EC; with EL, Lena would wait only ~5 ms.");
  choice("t7", 5, 2, "What describes a PA/EL system?", [
    "Consistency in a partition and low latency without one.",
    "Availability in a partition and low latency without one, accepting eventual consistency.",
    "Consistency in both situations.",
    "Availability in both situations, without thinking about latency."
  ], 1, "PA/EL prioritizes availability and speed. The source article classifies DynamoDB and Cassandra this way.");
  choice("t7", 6, 2, "Which pair does the source article classify as PC/EC?", [
    "DynamoDB and Cassandra.",
    "etcd and Google Spanner.",
    "Memcached and clustered Redis.",
    "CouchDB and SimpleDB."
  ], 1, "PC/EC is consistency in both cases, at the cost of latency. etcd, ZooKeeper, Spanner and CockroachDB go here.");
  tf("t7", 7, 2, "PACELC replaces CAP and proves that CAP is wrong.", false,
    "The two complement each other: CAP covers the partition and PACELC adds what happens without one.");
  choice("t7", 8, 3, "At the plush cat store, which map of choices makes sense?", [
    "Cart in PC/EC and balance in PA/EL.",
    "Cart in PA/EL and balance/transfer in PC/EC.",
    "Everything in PA/EL, including the balance.",
    "Everything in PC/EC, including the storefront."
  ], 1, "The cart tolerates a little delay and wants speed. Balance and transfers need the right value, even if slower.");

  window.QUIZ = out;
})();
