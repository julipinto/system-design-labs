/* CQRS quiz question bank (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction to CQRS" },
    t2: { topic: "aula-2-modelos-de-dominio-no-contexto-do-cqrs", name: "Domain models in the context of CQRS" },
    t3: { topic: "aula-3-views-materializadas", name: "Materialized views" },
    t4: { topic: "aula-4-read-replicas", name: "Read replicas" },
    t5: { topic: "aula-5-consistencia-eventual", name: "Eventual consistency" },
    t6: { topic: "aula-6-combinacao-de-sql-e-nosql", name: "Combining SQL and NoSQL" },
    t7: { topic: "aula-7-modelos-distribuidos", name: "Distributed models" },
    t8: { topic: "aula-8-dual-write-pattern", name: "Dual-write pattern" },
    t9: { topic: "aula-9-change-data-capture-cdc", name: "Change Data Capture (CDC)" },
    t10: { topic: "aula-10-transactional-outbox", name: "Transactional Outbox" }
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

  /* ---------- 1. Introduction to CQRS ---------- */
  choice("t1", 1, 1, "What does CQRS separate?", [
    "The database into several servers, one per customer.",
    "Whoever changes the state (commands) from whoever reads it (queries), into different models.",
    "The front end from the back end.",
    "Paid orders from cancelled orders."
  ], 1, "Splitting the database by customer is the sharding from module 16. CQRS separates the write and read models, each sized for its own job.");
  choice("t1", 2, 2, "Which of these is a command and which is a query, in the store?", [
    "CriarPedido is a query; my orders is a command.",
    "CriarPedido is a command; my orders is a query.",
    "Both are commands.",
    "Both are queries."
  ], 1, "The CriarPedido command changes state (and can fail on a rule). The query 'the last 10 orders of lena-77' only returns data.");
  tf("t1", 3, 2, "CQRS requires two databases.", false, "It requires two models. They can be separate classes, a view in the same database or a separate database fed by events.");
  choice("t1", 4, 3, "The screen's query costs 0.23 to 0.31 ms on the normalized model, with an index. What is the right reading for the store?", [
    "Separate the models just because of that query, to gain speed.",
    "The JOIN by customer is not the problem: separating just for that would be complexity with no gain; the real problems are joining services and the report.",
    "Replace PostgreSQL with a NoSQL database.",
    "Ignore the 23:00 report."
  ], 1, "At 0.3 ms, the screen does not need CQRS. Fowler's warning applies: for most systems, it adds risky complexity.");
  choice("t1", 5, 2, "Is CQRS the same thing as event sourcing?", [
    "Yes: both store events.",
    "No: event sourcing stores the events as the source of truth (module 20); CQRS only separates the models.",
    "Yes, but only on PostgreSQL.",
    "No: event sourcing splits the database into shards."
  ], 1, "A system can have CQRS without event sourcing, and the other way around. The READMEs of the author's lab use 'event sourcing' for what is CQRS with events.");

  /* ---------- 2. Domain models ---------- */
  choice("t2", 1, 1, "What is the shape of each model?", [
    "Write denormalized and read normalized.",
    "Write normalized and rich in rules; read denormalized and shaped like the answer.",
    "Both normalized.",
    "Both denormalized."
  ], 1, "The write side protects the data (normalized, rules, transaction). The read side repeats the data where the screen needs it and has no rules.");
  choice("t2", 2, 2, "Which validations does the CriarPedido of 1056 make before writing?", [
    "None: it writes and the rule comes later.",
    "Customer, active product 42, current price (79.90), stock and Recife shipping (15.00).",
    "Only the shipping.",
    "Only the payment."
  ], 1, "Only after these validations does the command write pedidos and itens_pedido in one transaction, and the stock drops to 19 (cat) and 35 (mug).");
  tf("t2", 3, 2, "The read model needs to repeat the command's rules so it does not show wrong data.", false, "The rules were already applied before the data got in. Repeating them creates a second copy of the rule, which one day diverges.");
  choice("t2", 4, 3, "Someone puts 'cancelled order does not appear' in the read model too. Months later the command changes the rule and nobody remembers the other side. What happens?", [
    "Nothing: the read model updates itself.",
    "The two sides diverge, and Lena sees an order the checkout already refused: the rule lives only in the command.",
    "The database refuses the write.",
    "The screen gets faster."
  ], 1, "It is the duplicated rule. The query shows what reached it; the command decides.");
  choice("t2", 5, 2, "Why does the read model not need to listen to the catalogo?", [
    "Because the catalog never changes.",
    "Because the event carries the name and price of the items at the time: the order keeps what was paid, not today's price.",
    "Because the catalog is on the same server.",
    "Because the screen does not show the product name."
  ], 1, "PedidoCriado brings the name and price at the time of purchase. The document keeps that, and Lena sees what she paid.");

  /* ---------- 3. Materialized views ---------- */
  choice("t3", 1, 1, "What is a PostgreSQL materialized view?", [
    "A query that runs again on every read.",
    "The result of a query stored in a table, which only updates with REFRESH.",
    "A replica of the database on another server.",
    "An index over several tables."
  ], 1, "A regular view recomputes on every read. The materialized one stores the result and only knows what it knew at the last REFRESH.");
  choice("t3", 2, 2, "On the test database, the report took ~235 ms and reading the view, 0.021 ms. What is the approximate ratio?", [
    "10×.",
    "100×.",
    "About 11,000×.",
    "1,000,000×."
  ], 2, "235 ÷ 0.021 ≈ 11,190: the view reads 5 ready rows instead of scanning 300 thousand.");
  choice("t3", 3, 3, "A reader arrives while a plain REFRESH runs. What did the test measure?", [
    "The reader read the old version without waiting.",
    "The reader waited 2,285 ms at wait_event_type = Lock; with CONCURRENTLY, it waited 12 ms.",
    "The reader got an error right away.",
    "The reader waited 12 ms in both cases."
  ], 1, "The plain REFRESH locks the view and blocks whoever reads. CONCURRENTLY builds the new version alongside and requires a unique index.");
  tf("t3", 4, 2, "The article's vw_prescricoes_medicamentos_detalhadas table is a PostgreSQL materialized view.", false, "It is a denormalized table loaded with INSERT … SELECT. The PostgreSQL materialized view is rebuilt in full with REFRESH.");
  choice("t3", 5, 3, "The view's REFRESH runs at 23:00. Lena places 1056 at 20:12. How long does the order stay out of the view?", [
    "74 ms.",
    "2 h 48 min.",
    "10 min.",
    "It never gets in."
  ], 1, "The view only knows what it knew at the last REFRESH: from 1056 at 20:12 to 23:00 is 2 h 48 min. That is why it suits the report, not Lena's screen.");

  /* ---------- 4. Read replicas ---------- */
  choice("t4", 1, 1, "What does the read replica give and what does it not give?", [
    "It gives screen shape; it does not give capacity.",
    "It gives capacity and proximity; it does not give screen shape or isolation of heavy queries.",
    "It gives all of that plus strong consistency.",
    "It gives nothing, it only copies the data."
  ], 1, "The replica copies the same schema: the JOIN stays, just on another server, close to whoever reads.");
  choice("t4", 2, 2, "Which error does the long query get when it is cancelled on the replica?", [
    "deadlock detected.",
    "canceling statement due to conflict with recovery.",
    "connection refused.",
    "out of memory."
  ], 1, "The primary cleaned up rows the query still needed to see, and the replica cancelled it after max_standby_streaming_delay.");
  choice("t4", 3, 3, "In the test with max_standby_streaming_delay = 1s, the 6 s query died at 3.16 s. The default is 30 s. What happens to the store's ~40 s report?", [
    "It finishes normally.",
    "It is cancelled: it goes past the 30 s tolerance.",
    "It gets 10× faster.",
    "It is redirected to the primary."
  ], 1, "40 s is more than the 30 s default, so the report would be cancelled on the replica.");
  choice("t4", 4, 3, "What is the cost of hot_standby_feedback as a fix for the cancellation?", [
    "The replica stops accepting reads.",
    "The primary does not clean the old rows the replica still reads: the table bloats.",
    "The query gets slower than the report.",
    "No cost."
  ], 1, "The other fix, raising max_standby_streaming_delay, leaves the replica further behind the primary.");
  tf("t4", 5, 2, "The replica solves the problem of Lena not seeing her own order.", false, "The delay from module 17 (800 ms in Recife) is back: the replica has not applied 1056 yet.");

  /* ---------- 5. Eventual consistency ---------- */
  choice("t5", 1, 1, "How long does it take, on a normal day, from the commit of 1056 to the read model?", [
    "~4 ms.",
    "~74 ms.",
    "~2 s.",
    "~74 s."
  ], 1, "Commit 4 ms, CDC +30 ms, Kafka +10 ms, consumer +20 ms and upsert +10 ms: ~74 ms. The lab's relay, with a 2 s poll, adds 1 s on average.");
  choice("t5", 2, 2, "Which of these is NOT a way for Lena to see her own order?", [
    "The command's response carries the order (201 with the document).",
    "A version token (GET /meus-pedidos?min_versao=8).",
    "The screen shows the order as 'processing' until the model catches up.",
    "Delete the read model and read only from the cache."
  ], 3, "Deleting the read model solves nothing. The three ways are: command response, version token and 'processing'.");
  choice("t5", 3, 3, "Black Friday generates 120 events/s, and each projector instance does 100/s. With 1 instance, what is the delay in 10 minutes?", [
    "None.",
    "12,000 events, or 120 s, and it only grows.",
    "2 s.",
    "24,000 events."
  ], 1, "A deficit of 20/s × 600 s = 12,000 events; 12,000 ÷ 100/s = 120 s. With 3 instances the capacity is 300/s and the usage, 40%.");
  choice("t5", 4, 3, "One of the 3 instances goes down for 10 min (40 events/s per partition). How long does it take to drain when it returns?", [
    "60 s.",
    "400 s (6 min 40 s).",
    "10 min.",
    "It never drains."
  ], 1, "It accumulated 40 × 600 = 24,000 events; it drains at 100 − 40 = 60/s: 24,000 ÷ 60 = 400 s. Only the customers of that partition see the delayed screen.");
  choice("t5", 5, 3, "The lab's handler does an INSERT into the view without ON CONFLICT. What happens if the message is redelivered?", [
    "The row is ignored.",
    "The row is duplicated: 1056 would show up twice.",
    "The database kills the handler.",
    "Kafka discards the message."
  ], 1, "The fix is idempotency: apply only if the versao is greater, or store the evento_id of those already applied.");

  /* ---------- 6. Combining SQL and NoSQL ---------- */
  choice("t6", 1, 1, "Why can reads live in a NoSQL storage?", [
    "Because NoSQL is always faster.",
    "Because reads need neither a transaction nor a JOIN: one document per customer is one read by key.",
    "Because NoSQL stores business rules.",
    "Because SQL does not accept JSON."
  ], 1, "The rules and the transaction stay in the write model. Reads only need the exact shape of the answer.");
  choice("t6", 2, 2, "How much does Lena's document weigh with the 8 orders, and how much does 1056 alone weigh?", [
    "187 B and 25 B.",
    "1,787 B and 253 B.",
    "17,870 B and 2,530 B.",
    "1,787 B and 1,787 B."
  ], 1, "The average is 223 B per order; 1056, with payment and tracking null, is 253 B.");
  choice("t6", 3, 2, "How much storage does the read model take for 1.5 million customers, 10 orders each and 223 B per order?", [
    "335 MB.",
    "3.35 GB.",
    "33.5 GB.",
    "335 GB."
  ], 1, "1.5 M × 10 × 223 B ≈ 3.35 GB, against 100 GB + 40% indexes for the 50-million-row pedidos table.");
  choice("t6", 4, 3, "PedidoEnviado (tracking) arrives before PedidoCriado. What does the projector need to do?", [
    "Discard the event.",
    "Do a partial upsert and control concurrency (if_seq_no and if_primary_term).",
    "Wait until the next day.",
    "Recreate the index."
  ], 1, "An update on a document that does not exist fails. The partial upsert creates the document with only what the event knows and completes it later.");
  tf("t6", 5, 3, "If the mapping of an already created field needs to change type, it is enough to change the field in the same index.", false, "You have to create a new index and reindex everything from the source.");

  /* ---------- 7. Distributed models ---------- */
  choice("t7", 1, 1, "What is the availability of a screen composed from 4 services at 99.9% each?", [
    "99.9%.",
    "99.6006%.",
    "99.0%.",
    "99.99%."
  ], 1, "0.999⁴ = 99.6006%, or 172.5 min/month offline. A single storage at 99.9% gives 43.2 min/month.");
  choice("t7", 2, 2, "The pagamentos service goes down. What does the read model screen show?", [
    "A 500 error.",
    "The last status it knows, instead of 'unavailable'.",
    "Nothing: the screen goes blank.",
    "Yesterday's orders."
  ], 1, "The document already has the last status. The composed screen fails or shows 'status unavailable'.");
  choice("t7", 3, 2, "Which events build the document of order 1056?", [
    "PedidoCriado, PedidoPago and PedidoEnviado, from pedidos, pagamentos and entregas.",
    "Only PedidoCriado.",
    "EstoqueReservado and PedidoEnviado.",
    "The catalogo's events."
  ], 0, "Three topics, one projector, one storage. The catalogo does not join in: the event already carries the name and price at the time.");
  choice("t7", 4, 3, "The 1056 document has payment and tracking, but no items. What is the problem and the defense?", [
    "Ghost order: PedidoCriado got lost; a checker calls GET /pedidos/1056 to complete it.",
    "Duplicate order; delete one of them.",
    "Cancelled order; ignore it.",
    "Order paid twice; refund it."
  ], 0, "The checker reconciles the documents without items for more than 5 min.");
  tf("t7", 5, 2, "The event-based model has multiplied eventual consistency: each source has its own delay.", true, "That is why the projector stores the versao per source and does a partial upsert by pedido_id.");

  /* ---------- 8. Dual-write pattern ---------- */
  choice("t8", 1, 1, "Why is the dual write (database + broker) not atomic?", [
    "Because the database does not accept transactions.",
    "Because they are two writes in two systems: the database transaction does not cover the broker.",
    "Because Kafka is slow.",
    "Because the JSON is big."
  ], 1, "Either one can fail without the other. A truly atomic write would require two-phase commit, which Kafka does not offer.");
  choice("t8", 2, 2, "The database writes 1056 and the broker is down. What happens?", [
    "1056 shows up twice.",
    "The order exists, the event never goes out, and 1056 does not reach 'my orders'.",
    "The database undoes the order by itself.",
    "The broker keeps the event until it comes back."
  ], 1, "It is Failure 1. Module 17 already showed the same with 1055: the mug's stock stayed at 37 instead of 36.");
  choice("t8", 3, 2, "With a 0.1% failure on publishing and 30 orders/s, how many orders per hour stay in the database without an event?", [
    "3.",
    "108.",
    "1,080.",
    "10,800."
  ], 1, "30 × 3,600 × 0.001 = 108 orders per hour, and they never reach the read model.");
  choice("t8", 4, 3, "The lab's handler.go (hospital-cqrs-sql) publishes after the commit. If the publish fails, what does it do?", [
    "Undoes the order and returns an error.",
    "Only logs 'AVISO' (a warning) and returns success, without republishing.",
    "Retries 5 times.",
    "Writes the event to an error queue."
  ], 1, "Read in the code: the comment says the event 'can be republished later', but nothing does it.");
  tf("t8", 5, 3, "The article's 'Dual-Write pattern', with BEGIN … publish … COMMIT and rollback, makes the two writes atomic.", false, "The database rollback does not take back an event already published, and the open transaction holds locks. It is the problem, not the solution.");

  /* ---------- 9. CDC ---------- */
  choice("t9", 1, 1, "How does CDC solve the dual write?", [
    "The application publishes twice.",
    "The event comes from the database log, which only has what was confirmed; the application publishes nothing.",
    "Kafka becomes the main database.",
    "CDC writes to the database and to Kafka at the same time."
  ], 1, "There is no more order without an event or event without an order. And, if Kafka goes down, the application keeps working.");
  choice("t9", 2, 2, "In CDC with Debezium, what does the op = u field mean?", [
    "The row was created.",
    "The row was updated.",
    "The row was deleted.",
    "Read from the initial snapshot."
  ], 1, "c = created, u = updated, d = deleted, r = read from the initial snapshot.");
  choice("t9", 3, 3, "The lab's handler processes only c and r. What happens when 1056 goes from criado to pago?", [
    "The screen updates.",
    "The event (op = u) is ignored, and the screen stays on criado forever.",
    "Debezium resends it as c.",
    "The database refuses the UPDATE."
  ], 1, "Read in the code: for any op other than c or r, the handler only logs 'Ignorando operação' (ignoring operation) and returns.");
  choice("t9", 4, 3, "The lab's handler queries the write database (getMedico, getPaciente…) to complete the row. What is the problem?", [
    "It is slower just once.",
    "The read side goes back to depending on the write side, which CQRS wanted to separate.",
    "The write database does not allow reads.",
    "None: it is the right way."
  ], 1, "Each event costs more queries to the write database, and if it goes down, reads stop.");
  tf("t9", 5, 2, "CDC delivers a ready-made business event (PedidoCriado).", false, "It delivers a technical event: a row changed. The business PedidoCriado, with items and price at the time, comes from the outbox.");

  /* ---------- 10. Transactional Outbox ---------- */
  choice("t10", 1, 1, "What does the transactional outbox do?", [
    "Publishes to Kafka and then writes to the database.",
    "Writes the event to a table in the same database, in the same transaction as the order: either both go in or neither does.",
    "Deletes the events after 7 days.",
    "Replaces Kafka with a queue in the database."
  ], 1, "Proven with test_decoding: a single transaction (BEGIN 832 … COMMIT 832), and the ROLLBACK left nothing.");
  choice("t10", 2, 2, "What are the two ways to take the outbox to the broker?", [
    "Relay (2 s poll in the lab) or CDC reading the outbox table itself (Outbox Event Router).",
    "Only the relay.",
    "Only CDC.",
    "Manual copy every night."
  ], 0, "CDC reading the outbox removes the poll: latency drops from up to 2 s to milliseconds.");
  choice("t10", 3, 3, "The relay publishes PedidoCriado and dies before marking it as processed. What happens when it returns?", [
    "The event is lost.",
    "The event is published again: at-least-once delivery; the consumer has to be idempotent.",
    "The relay discards the event.",
    "The database undoes the order."
  ], 1, "In the lab, processarEvento publishes (line 138) and only then calls marcarProcessado (line 154). The lab's handler is not idempotent.");
  choice("t10", 4, 3, "By how much does the outbox increase the WAL per order, measured?", [
    "Almost nothing.",
    "From 5.3× (relay deletes) to 7.6× (relay marks with UPDATE): from 359.6 B to 1,916.8 B or 2,735.8 B.",
    "About 100×.",
    "It cuts the WAL in half."
  ], 1, "At 30 orders/s that is 57.5 KB/s (deleting) or 82.1 KB/s (UPDATE): 207 to 295.5 MB per hour.");
  order("t10", 5, 3, "Put in order what happens with the outbox and the relay, from the order to the read model:", [
    "The command writes the order and the event in the same transaction (COMMIT).",
    "The relay (or CDC) reads the outbox.",
    "The event is published to Kafka, with the pedido_id as the key.",
    "The projector applies the event to the document, if the versao is greater."
  ], "It is the lesson's chain: a single transaction, reading the outbox, publishing ordered by the key and idempotent application.");

  window.QUIZ = out;
})();
