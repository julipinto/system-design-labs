/* Question bank for the Data Replication quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction to data replication" },
    t2: { topic: "aula-2-modelos-primary-primary-e-primary-replica", name: "Models: Primary/Replica and Primary/Primary" },
    t3: { topic: "aula-3-sincrona-assincrona-semi-sincrona-e-por-logs", name: "Synchronous, asynchronous, semi-synchronous and log-based" },
    t4: { topic: "aula-4-event-carried-state-transfer", name: "Event-Carried State Transfer" },
    t5: { topic: "aula-5-cdc-change-data-capture", name: "CDC: Change Data Capture" },
    t6: { topic: "aula-6-crdts", name: "CRDTs" }
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

  /* ---------- 1. Introduction to data replication ---------- */
  choice("t1", 1, 1, "What does it mean to replicate data?", [
    "Split the data into parts, one per server.",
    "Keep the same data in more than one place.",
    "Compress the data to use less disk.",
    "Delete the old data."
  ], 1, "Splitting is the sharding from module 16. Replicating is copying: the data exists in more than one place so the store stays up, reads close by and survives a loss.");
  choice("t1", 2, 2, "Lena, in Recife, reads from a replica in Recife. How much does she gain, in the store's example?", [
    "Nothing: the read always goes to the primary.",
    "About 2 ms instead of an 80 ms round trip to SP.",
    "About 10 ms instead of 80 ms.",
    "About 80 ms instead of 2 ms."
  ], 1, "A local read costs about 2 ms. Reaching the primary in SP would be 80 ms of RTT on the network alone.");
  choice("t1", 3, 2, "The store has 140 GB of orders and 3 sites. How much does full replication take and how much does partial take, with 2 of the 3 shards per site?", [
    "420 GB and 280 GB.",
    "140 GB and 93.3 GB.",
    "420 GB and 140 GB.",
    "280 GB and 420 GB."
  ], 0, "Full: 3 × 140 = 420 GB. Partial: (140 ÷ 3) × 2 × 3 = 280 GB, two thirds of full.");
  choice("t1", 4, 2, "How many database servers does the store have with 3 shards and 3 copies of each?", [
    "3.",
    "6.",
    "9.",
    "12."
  ], 2, "The Z axis from module 16 (3 shards) times the X axis for data (3 copies): 9 servers.");
  tf("t1", 5, 3, "A replica works as a backup: if someone deletes orders by mistake, the replicas still have the orders.", false, "The DELETE reaches the replicas in 60 ms, Recife's normal lag: that is three copies of the mistake. Backup and point-in-time recovery (module 27) are still needed.");
  choice("t1", 6, 3, "By the quorum from module 3, with N = 3, which choice guarantees that the read always sees the latest write?", [
    "W = 1 and R = 1.",
    "W = 1 and R = 2.",
    "W = 2 and R = 2.",
    "W = 0 and R = 3."
  ], 2, "The read overlaps with the write when W + R > N: 2 + 2 = 4 > 3. With W = 1 and R = 1 (asynchronous), the read can land on a copy that has not received the order yet.");

  /* ---------- 2. Models: Primary/Replica and Primary/Primary ---------- */
  choice("t2", 1, 1, "What happens to an INSERT on a PostgreSQL replica?", [
    "It writes and passes it on to the primary.",
    "It writes only on the replica.",
    "It fails: cannot execute INSERT in a read-only transaction.",
    "It waits for the primary to come back."
  ], 2, "The replica only reads: transaction_read_only is on and pg_is_in_recovery() returns t.");
  choice("t2", 2, 2, "What does promoting Rio change in PostgreSQL?", [
    "Nothing besides the server name.",
    "The timeline goes from 1 to 2, and the old primary only comes back as a replica after a pg_rewind.",
    "The wal_level becomes logical.",
    "Recife becomes a primary too."
  ], 1, "The timeline marks the promotion (Latest checkpoint's TimeLineID: 2). The old primary needs pg_rewind to come back as a replica.");
  choice("t2", 3, 3, "On Black Friday Rio is 300 ms behind and Recife 800 ms. Which one becomes leader in the election, and how many orders are lost at 30 orders/s with asynchronous replication?", [
    "Recife, 24 orders.",
    "Rio, 9 orders.",
    "Rio, 24 orders.",
    "Recife, 9 orders."
  ], 1, "The replica furthest ahead in the log wins: Rio. The loss is rate × lag: 30 × 0.3 = 9 orders.");
  choice("t2", 4, 2, "What is the store's example RTO, and how many purchase attempts are left without a primary at 30 orders/s?", [
    "5 s and 150.",
    "30 s and 900.",
    "35 s and 1,050.",
    "60 s and 1,800."
  ], 2, "Patroni's 30 s ttl plus about 5 s of promotion make 35 s, and 30 × 35 = 1,050 attempts.");
  choice("t2", 5, 3, "Recife's clock is 120 ms behind. SP writes at 20:20:00.100 and Recife at 20:20:00.150 (timestamp .030). What does LWW do?", [
    "It picks Recife, which is the most recent in reality.",
    "It picks SP, and Lena's write is lost.",
    "It detects that they are concurrent and keeps both.",
    "It adds the two writes."
  ], 1, "It compares the timestamps: .100 > .030. LWW depends on a clock and loses writes. The version vector is what detects the concurrency.");
  tf("t2", 6, 2, "Two version vectors, {SP:2, Rec:0} and {SP:1, Rec:1}, show that the writes were concurrent.", true, "Neither dominates the other in every position: SP is greater in one and Recife in the other, so neither write saw the other.");
  choice("t2", 7, 3, "The SP cable fails, but the primary is still alive and Rio is promoted. What is the problem called, and what is one way to contain it?", [
    "Lag; increase the ttl.",
    "Split brain; fencing or synchronous replication (the isolated primary blocks on SyncRep).",
    "Deadlock; a mutex.",
    "Cache stampede; a longer TTL."
  ], 1, "Two live primaries are split brain. Patroni takes down the leader that does not renew the key within 30 s, and synchronous replication makes the isolated one wait for a confirmation that never comes.");
  order("t2", 8, 2, "Put in order what happens when the SP primary goes down (Patroni).", [
    "The primary stops renewing the key",
    "The 30 s ttl expires",
    "The replica furthest ahead in the log (Rio) is elected with a quorum of 2 out of 3",
    "pg_ctl promote: the timeline goes from 1 to 2",
    "The application reconnects to the new primary (RTO of ~35 s)"
  ], "Without the key being renewed, the ttl expires and failover starts: Rio, furthest ahead in the log, wins the election and is promoted. With 5 s to promote and reconnect, the RTO is 35 s.");

  /* ---------- 3. Synchronous, asynchronous, semi-synchronous and log-based ---------- */
  choice("t3", 1, 2, "With a 2 ms local commit, a 10 ms RTT to Rio and 80 ms to Recife, what is the commit in synchronous mode (Rio and Recife)?", [
    "2 ms.",
    "12 ms.",
    "82 ms.",
    "92 ms."
  ], 2, "2 + max(10, 80) = 82 ms: both waits happen at the same time, and the larger one counts.");
  choice("t3", 2, 2, "And in semi-synchronous mode waiting only for Rio, and how many commits per second does one connection get?", [
    "12 ms and 83 commits/s.",
    "2 ms and 500 commits/s.",
    "82 ms and 12 commits/s.",
    "10 ms and 100 commits/s."
  ], 0, "2 + 10 = 12 ms, 1,000 ÷ 12 = 83 per second. Asynchronous gives 500 and synchronous 12.");
  choice("t3", 3, 3, "Lena closes 1055 at 20:10:00.000, with Recife 800 ms behind, and opens \"my orders\" at 20:10:00.300. What does she see?", [
    "1055, because the primary confirmed at .002.",
    "1054 as the last order: 1055 only reaches Recife at 20:10:00.802.",
    "An error, because the replica does not answer.",
    "Both orders, 1054 and 1055."
  ], 1, "The screen reads from the Recife replica, which has not applied the log of 1055 yet. It is the missing read-your-writes.");
  choice("t3", 4, 2, "Which of these is NOT one of the three fixes for Lena to see her own order?", [
    "Read from the primary for a few seconds after writing.",
    "Carry the token (the commit's LSN) and only read from the replica once the replay_lsn passes it.",
    "Use remote_apply so the commit waits for the replica to apply.",
    "Increase the cache TTL."
  ], 3, "The three are: primary for a while (+80 ms), LSN token and remote_apply. A cache with a longer TTL would only keep the past around longer.");
  choice("t3", 5, 3, "With replay paused in Recife, the primary gave pg_current_wal_lsn() = 0/8004430 and the replica has pg_last_wal_replay_lsn() = 0/8000060. What does replay_lsn >= token return?", [
    "t: the replica already has the order.",
    "f: the application sends the read to the primary.",
    "A syntax error.",
    "NULL, because replay is paused."
  ], 1, "0/8000060 is lower than 0/8004430: the replica received the log but has not applied it yet. The f tells the application to read from the primary.");
  choice("t3", 6, 2, "What gives an up-to-date read in PostgreSQL synchronous replication?", [
    "synchronous_commit = on, the default.",
    "synchronous_commit = off.",
    "synchronous_commit = remote_apply.",
    "None: it never does."
  ], 2, "With the default (on) the replica has only flushed the log to disk. With remote_apply it has already applied it: the data is visible there.");
  choice("t3", 7, 3, "MariaDB semi-synchronous replication receives no ack for more than 10,000 ms. What does the primary do?", [
    "It blocks all commits.",
    "It goes back to asynchronous, with no error.",
    "It drops the replica and promotes another.",
    "It retries the commit until it receives one."
  ], 1, "After the rpl_semi_sync_master_timeout the primary reverts to asynchronous replication and the guarantee disappears. PostgreSQL waits, and the INSERT sits in SyncRep.");
  tf("t3", 8, 2, "The article says synchronous replication is done with two-phase commit, and real databases do it that way.", false, "PostgreSQL waits for the ack of chosen replicas (FIRST n or ANY n). 2PC is something else: coordinating a transaction across several participants.");

  /* ---------- 4. Event-Carried State Transfer ---------- */
  choice("t4", 1, 1, "What does Event-Carried State Transfer do?", [
    "The event carries the entire state, and each service keeps its own copy.",
    "The event carries only the id, and the service fetches the rest.",
    "Each service queries the owner's database.",
    "The services share the same database."
  ], 0, "It is what avoids the call back to the owner. The event with only the id is the notification.");
  choice("t4", 2, 2, "ClienteAtualizado with the entire state has 202 bytes. And the notification (evento_id, cliente_id, versao)?", [
    "56 bytes, plus a GET back to clientes.",
    "202 bytes, plus a GET.",
    "56 bytes and no call.",
    "10 bytes."
  ], 0, "The notification is much smaller, but it forces the consumer to call the owner. The full state is 202 B and needs no call.");
  choice("t4", 3, 2, "What does the compacted topic (cleanup.policy=compact) keep?", [
    "All events forever.",
    "The last value of each key.",
    "Only the last 7 days.",
    "Only the delete events."
  ], 1, "With the cliente_id key, the topic keeps the latest version of each customer. A new consumer reads from the start and builds its copy.");
  choice("t4", 4, 3, "The topic has 1.5 million customers and a new consumer reads 20,000 events per second. How long does it take to build the copy?", [
    "7.5 s.",
    "75 s.",
    "750 s.",
    "20 s."
  ], 1, "1,500,000 ÷ 20,000 = 75 s.");
  choice("t4", 5, 3, "entregas receives v9 (Rua do Sol, 200) and then v8 (Rua da Aurora, 100). Applying blindly, which address stays?", [
    "Rua do Sol, 200 (v9).",
    "Rua da Aurora, 100 (v8): the old one.",
    "Both, together.",
    "Neither."
  ], 1, "The last one to arrive overwrites. With the rule \"apply only if the versao is greater\", v8 would be discarded and v9 would stay.");
  tf("t4", 6, 2, "With 4 copies of 750 MB (the owner and 3 consumers), the cost is 3.0 GB, four times the cost of one copy.", true, "It is the price of the pattern: multiplied storage, eventual consistency and the order of events to take care of.");

  /* ---------- 5. CDC: Change Data Capture ---------- */
  choice("t5", 1, 1, "Which of these is a way to do CDC?", [
    "Trigger, periodic polling or log reading.",
    "Periodic polling only.",
    "Synchronous replication only.",
    "Copying the whole database all the time."
  ], 0, "The three ways from the lesson. Only log reading has all the changes, in order.");
  choice("t5", 2, 3, "Polling runs every 5 s. 1055 gets an INSERT (criado) and, 3 s later, an UPDATE (pago). What does polling see?", [
    "Two records, criado and pago.",
    "Just one: pago.",
    "None.",
    "Only criado."
  ], 1, "Between two queries only the final state exists. Log-based CDC sees the INSERT and the UPDATE.");
  choice("t5", 3, 2, "With REPLICA IDENTITY DEFAULT, what does the DELETE carry in the log?", [
    "The whole row.",
    "Only the key.",
    "Nothing.",
    "Only the new value."
  ], 1, "DEFAULT carries the key; the UPDATE carries only the new value. With REPLICA IDENTITY FULL, the DELETE carries the whole row and the UPDATE carries old-key.");
  choice("t5", 4, 2, "What is the Debezium topic name, and what does op = r mean?", [
    "topic.prefix.schema.table (loja.public.pedidos); r is a snapshot read.",
    "pedidos.loja; r is replication.",
    "loja.pedidos; r is removal.",
    "topic.prefix; r is retry."
  ], 0, "The topic is prefix, schema and table. The rows of the initial snapshot go out with op r; c, u and d are create, update and delete.");
  choice("t5", 5, 3, "pedidos writes 1055 at 20:10:00.000 and crashes at 20:10:00.004, before publishing PedidoCriado. Where does the mug's stock end up?", [
    "36, as it should.",
    "37: nobody decremented the stock.",
    "35.",
    "0."
  ], 1, "It is the dual write. With the outbox, the order and the notice are born in the same transaction and CDC publishes the notice from the log.");
  choice("t5", 6, 3, "A replication slot with no consumer, with 1 KB of WAL per order at 30 orders/s and 60 GB free. How long until the disk runs out?", [
    "About 23 days.",
    "About 23 hours.",
    "About 23 minutes.",
    "Never."
  ], 0, "30 × 1 KB × 3,600 s = 108 MB/h, and 60,000 MB ÷ 108 = 555 h, about 23 days. Monitor pg_replication_slots and limit with max_slot_wal_keep_size.");
  tf("t5", 7, 2, "What was measured in this lesson was 335 bytes of WAL per order (1 INSERT, 1 UPDATE and 1 COMMIT).", true, "6,709,592 bytes ÷ 20,000 orders = 335 B per order; at 30 orders/s that is 10 KB/s, 36 MB/h.");

  /* ---------- 6. CRDTs ---------- */
  choice("t6", 1, 1, "Which properties does a CRDT's merge have?", [
    "Commutative, associative and idempotent.",
    "Only commutative.",
    "Ordered and atomic.",
    "Synchronous and blocking."
  ], 0, "That is why order and repetitions do not change the result: the test with 120 permutations always gave the same state.");
  choice("t6", 2, 3, "The views G-Counter is at {SP: 135, Rio: 80, Recife: 58} after the partition. What is the total after the merge?", [
    "265.",
    "258.",
    "273.",
    "250."
  ], 2, "The merge is the maximum per site: 135 + 80 + 58 = 273. LWW on the total would give 265 or 258.");
  choice("t6", 3, 3, "The {caneca} cart: the phone (Recife) adds the cat and the laptop (SP) removes the mug, in the partition. What is the cart after the merge?", [
    "{caneca}.",
    "{caneca, gato}.",
    "{gato}.",
    "{}."
  ], 2, "Both intentions count: the cat goes in, the mug goes out. If one side removed and the other added the mug at the same time, it would stay (add wins).");
  choice("t6", 4, 3, "The mug stock is 1. SP and Recife sell 1 each in the partition. What does the PN-Counter merge give?", [
    "0.",
    "1.",
    "−1.",
    "An error."
  ], 2, "Each site sees 0 and sells; the merge adds the two sales: −1. It converged and violated \"stock ≥ 0\".");
  tf("t6", 5, 2, "A CRDT guarantees that the result of the merge makes sense for the business.", false, "It guarantees convergence. The stock at −1 is the proof: for the last item, module 11 (a single owner) or module 19 (compensation) applies.");
  choice("t6", 6, 3, "What is the store's next problem after this module?", [
    "Sending emails faster.",
    "The \"my orders\" screen still reads from the same table the checkout writes to: the write model needs to be separated from the read model (CQRS, module 18).",
    "Swapping PostgreSQL for another database.",
    "Choosing a CDN."
  ], 1, "The store copies data in every way. What is left is reading from a copy built only for reading, fed by CDC: that is module 18.");

  window.QUIZ = out;
})();
