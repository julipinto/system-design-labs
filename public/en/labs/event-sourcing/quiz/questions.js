/* Question bank for the Event Sourcing quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction to Event Sourcing" },
    t2: { topic: "aula-2-persistencia-tradicional-vs-event-sourcing", name: "Traditional persistence × Event Sourcing" },
    t3: { topic: "aula-3-agregados", name: "Aggregates" },
    t4: { topic: "aula-4-event-store", name: "Event Store" },
    t5: { topic: "aula-5-event-bus-e-publishers", name: "Event Bus and publishers" },
    t6: { topic: "aula-6-projections-e-read-models", name: "Projections and read models" },
    t7: { topic: "aula-7-rehidratacao", name: "Rehydration" },
    t8: { topic: "aula-8-snapshotting", name: "Snapshotting" },
    t9: { topic: "aula-9-ordenacao-versionamento-e-last-write-wins", name: "Order, versioning and last-write-wins" },
    t10: { topic: "aula-10-idempotencia", name: "Idempotency" },
    t11: { topic: "aula-11-consideracoes-finais", name: "Final thoughts" }
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

  /* ---------- 1. Introduction ---------- */
  choice("t1", 1, 1, "What does Event Sourcing keep as the source of truth?", [
    "The last state of each row, with a backup per day.",
    "Each change as an immutable fact; the state is derived from the events.",
    "Only the events that failed.",
    "A copy of the database on another server."
  ], 1, "The current state is a consequence: folding the events in order gets you there. The source of truth is the list of events.");
  choice("t1", 2, 2, "After three UPDATEs on order 1047 (pago, enviado, entregue), what does the pedidos table keep?", [
    "All four states, each with its time.",
    "Only the last one: entregue. The others were overwritten.",
    "The first and the last states.",
    "Nothing, because UPDATE does not write."
  ], 1, "This is the loss the module fixes: the path stayed in events e-501 to e-505, which Kafka deletes after 7 days.");
  tf("t1", 3, 2, "e-503 (EstoqueReservado) is part of the pedido-1047 stream.", false, "It is a stock fact and lives in the estoque-GATO-042 stream, version 2. Order 1047 has 4 events in its stream: e-501, e-502, e-504 and e-505.");
  choice("t1", 4, 2, "Event Sourcing, CQRS, event notification and event-carried state transfer are, according to Fowler:", [
    "The same pattern with four names.",
    "Four independent patterns that tend to show up together.",
    "Four versions of the Saga pattern.",
    "Variations of CQRS."
  ], 1, "Event Sourcing does not require CQRS or a bus, and the reverse also holds. The source article blurs the two and the lesson corrects it.");
  choice("t1", 5, 3, "An address book screen changes twice a year and nobody audits the history. Event Sourcing there is:", [
    "Mandatory, because every modern system uses it.",
    "A good idea: events are always cheaper.",
    "A fad: it pays for events, versions and projections with nobody using the history.",
    "Needed only if there is Kafka."
  ], 2, "The gain from the pattern is answering 'how did we get here?' and rebuilding what got broken. Without that question, only the complexity is left.");

  /* ---------- 2. Traditional persistence × Event Sourcing ---------- */
  choice("t2", 1, 1, "What is the central difference between the two persistence models?", [
    "The traditional one only appends; Event Sourcing replaces.",
    "The traditional one replaces the state on each operation; Event Sourcing only appends events.",
    "The traditional one uses SQL and Event Sourcing uses NoSQL.",
    "There is no difference, only the name."
  ], 1, "INSERT, UPDATE and DELETE replace; in Event Sourcing every operation is an insert, and the current state comes from adding up the events.");
  choice("t2", 2, 2, "Which question only the events answer about 1047?", [
    "Which orders are enviado right now?",
    "What was the status of 1047 at 14:15? (pago, version 2)",
    "What is the total number of orders?",
    "What is the table's index?"
  ], 1, "The table overwrote that value. 'Which orders are enviado right now?' is the one the table answers better, with an index on status.");
  choice("t2", 3, 3, "4 events per order × 50 million orders × ~263 B per event give about:", [
    "5.26 GB, and the pedidos table can be deleted.",
    "52.6 GB, which adds to the 140 GB of the pedidos table, which becomes a read model.",
    "526 GB.",
    "140 GB, the same as the table."
  ], 1, "It is an estimate with a small payload (263 B measured per event). Event Sourcing does not save space: the table stays as a projection.");
  choice("t2", 4, 3, "A PedidoPago was recorded with the wrong amount. How do you fix it?", [
    "UPDATE the event.",
    "Write a correction event (PagamentoCorrigido), and the projections have to handle it.",
    "Delete the event and write another with the same version.",
    "Restart the stream."
  ], 1, "The event is immutable: it happened, and the history records it that way. The fix is another event, and whoever reads sees the mistake and the correction.");

  /* ---------- 3. Aggregates ---------- */
  choice("t3", 1, 1, "What does the aggregate do?", [
    "It only stores the events in a file.",
    "It decides, validates and orders the events of one subject: a stream, a consistency boundary.",
    "It publishes the events to Kafka.",
    "It builds the read model."
  ], 1, "The Store stores, the publisher publishes and the projection builds the model. The aggregate protects the truth of the log.");
  tf("t3", 2, 1, "A command refused by the aggregate's rule leaves an event in the stream.", false, "A command is imperative and can be refused; only the accepted one becomes a fact. An Enviar with the order in criado writes nothing.");
  choice("t3", 3, 2, "Which of these is the command and which is the event?", [
    "PedidoEnviado is a command; Enviar is an event.",
    "Enviar is a command (imperative, can fail); PedidoEnviado is an event (past tense, always true).",
    "Both are events.",
    "Both are commands."
  ], 1, "The command says what you want; the event says what happened. The aggregate's rule sits between the two.");
  choice("t3", 4, 3, "A single stream with all of the store's stock would receive 30 commands/s on Black Friday. What is the fix?", [
    "More memory on the Kafka server.",
    "One stream per SKU: the cat and the mug stop fighting for the same version.",
    "Delete the old events.",
    "Switch PostgreSQL."
  ], 1, "An aggregate that is too big becomes a queue of version conflicts. The aggregate should be small: one order, one SKU.");
  choice("t3", 5, 2, "Where does order 1047's EstoqueReservado (e-503) live?", [
    "In the pedido-1047 stream, version 3.",
    "In the estoque-GATO-042 stream, version 2 (version 1 is the initial balance, +3).",
    "In the estoque-CANECA-007 stream.",
    "Nowhere: it is just a message."
  ], 1, "It is a stock fact (balance 3 → 2). The evento_id e-503 is global; version 2 belongs to the stock stream.");

  /* ---------- 4. Event Store ---------- */
  choice("t4", 1, 1, "What does the Event Store guarantee?", [
    "Global order across all streams.",
    "Order within the stream and that two events do not take the same version.",
    "That no consumer receives duplicates.",
    "That events expire in 7 days."
  ], 1, "Global order is neither required nor cheap: the bigserial id is only insertion order. The guarantee is per stream, by version.");
  choice("t4", 2, 2, "What is the expected version for in append_evento?", [
    "To order the SELECT.",
    "For optimistic concurrency: 'I read up to 2, write 3'; the Store refuses if the stream already went past 2.",
    "To compress the event.",
    "To encrypt the data."
  ], 1, "Measured: with the stream at v4, append_evento(…, 2) returns 'Concurrency conflict: expected version 2, but current is 4'.");
  choice("t4", 3, 3, "Two Reservar commands commands reach estoque-GATO-042 at the same time, both with expected version 2. Who blocks the second one?", [
    "The function's MAX(versao) check, which reads 3.",
    "The UNIQUE (stream_id, versao): session B waits on Lock/transactionid and fails on eventos_stream_versao.",
    "Kafka.",
    "Nothing: both go in as version 3."
  ], 1, "Both read 2 and pass the check. B waits for A to commit and then the constraint refuses. The retry (re-read and decide again) belongs to the caller.");
  tf("t4", 4, 3, "The append_evento function's MAX(versao) check, alone, prevents the race between two sessions.", false, "Both sessions read 2 before any commit. What prevents it is the UNIQUE (stream_id, versao); without it the stream would have two version 3s.");
  choice("t4", 5, 2, "The same e-502 reaches the Store again, with the right expected version. What happens?", [
    "It is written as version 5.",
    "It fails on eventos_evento_id_key: the UNIQUE (evento_id) blocks the duplicate.",
    "It is silently ignored.",
    "It deletes the original e-502."
  ], 1, "Measured: 'duplicate key value violates unique constraint \"eventos_evento_id_key\"', detail 'Key (evento_id)=(e-502) already exists'.");
  order("t4", 6, 3, "Put the real race between sessions A and B in order (PostgreSQL 14):", [
    "A and B read MAX(versao) = 2 and pass the check.",
    "A inserts version 3 and sleeps for 2 s; B waits on Lock / transactionid.",
    "A commits; B fails on eventos_stream_versao.",
    "B re-reads the stream (now at v3) and decides again."
  ], "The check does not prevent the race; the UNIQUE constraint does, and the retry belongs to the caller: re-read, recompute, write again with the new expected version.");

  /* ---------- 5. Event Bus and publishers ---------- */
  choice("t5", 1, 1, "What is the difference between Event Store and Event Bus?", [
    "They are the same component.",
    "The Store is the source of truth; the bus carries the consequences of the events to other services.",
    "The bus is the source of truth and the Store is a copy.",
    "The Store only exists when there is Kafka."
  ], 1, "The bus is not mandatory: Event Sourcing exists without it. The article says so in one sentence and blurs it in the others.");
  choice("t5", 2, 2, "The author's lab publishes to Kafka after the commit. What is the risk window?", [
    "None: the commit guarantees the publication.",
    "If the process crashes between the commit and the publication, the event exists in the Store and never reaches the read models.",
    "The event is always published twice.",
    "Kafka deletes the event at commit."
  ], 1, "It is the dual write from module 18. The lab's rehydratate recovers by republishing, but by hand.");
  choice("t5", 3, 3, "The process crashed after the PedidoEnviado commit and before the publish. What is the defense?", [
    "Restart Kafka.",
    "The publisher reads the Store itself, by the position of the last published event, and publishes what was left behind.",
    "Delete the event.",
    "Ask the customer to repeat the purchase."
  ], 1, "It goes out at least once, and the idempotent consumer absorbs the duplicate. Outbox and CDC (module 18) make the write and the publication atomic.");
  choice("t5", 4, 2, "Why does Kafka serve as the bus and is weak as an Event Store for aggregates?", [
    "Because it is too slow.",
    "It does not append only if the version matches, it does not read one aggregate without scanning the partition, and retention (7 days) deletes what the Store cannot delete.",
    "Because it does not accept JSON.",
    "Because it only stores numbers."
  ], 1, "The Store needs append-by-version and reading a whole stream. Kafka delivers order per key and is great for carrying the events.");

  /* ---------- 6. Projections and read models ---------- */
  choice("t6", 1, 1, "Why should the projection be a pure function of the events?", [
    "To run faster.",
    "Same sequence, same result, no now() and no external call: the model is disposable and can be rebuilt.",
    "To not need a database.",
    "To avoid Kafka."
  ], 1, "The projection is deterministic with respect to the sequence of events (the article says 'to the current state', a phrase the lesson corrects).");
  choice("t6", 2, 2, "What is good and bad about the transactional projection?", [
    "Good: no lag between write and read. Bad: it weighs on the Store and becomes a bottleneck at volume.",
    "Good: it decouples everything. Bad: eventual consistency.",
    "Good: it writes faster. Bad: it loses events.",
    "Good: it does without the Store. Bad: it requires Kafka."
  ], 0, "The projection goes in the same transaction as the event. The other two ways (semi-synchronous and asynchronous) trade that cost for lag.");
  choice("t6", 3, 3, "How long does it take to rebuild a model from 200 million events at 20,000 per second?", [
    "About 3 minutes.",
    "10,000 s, or 2 h 47 min.",
    "About 20 hours.",
    "Instant, because the Store is fast."
  ], 1, "200,000,000 ÷ 20,000 = 10,000 s. The Store reads ~555 thousand/s: the bottleneck is writing to the model, not reading.");
  tf("t6", 4, 3, "Without the Event Store, with only the 7-day Kafka topic, you can still rebuild a corrupted model.", false, "Retention deleted the old events. That is why the Store keeps everything: without it there is nowhere to rebuild from.");

  /* ---------- 7. Rehydration ---------- */
  choice("t7", 1, 1, "What is rehydrating?", [
    "Copying the Store to another server.",
    "Rebuilding an aggregate's state by folding its events in order.",
    "Deleting old events.",
    "Restarting the consumer."
  ], 1, "It happens on every command (loading the aggregate before deciding) and on every reprocessing.");
  choice("t7", 2, 2, "What does the rehydration of pedido-1047 return?", [
    "{status: criado, versao: 1}.",
    "{pedido_id: 1047, status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}.",
    "{status: pago, versao: 2}.",
    "Empty, because the table was overwritten."
  ], 1, "Stopping at version 2 (14:02:11) the state would be pago, which is also the state at 14:15, because e-504 only happens at 14:30.");
  choice("t7", 3, 3, "How much does it cost to rehydrate estoque-CANECA-007, with 1,000,000 events, without a snapshot?", [
    "About 18 ms.",
    "About 1,800 ms (1,935 · 1,801 · 1,770 ms), ~555 thousand events per second.",
    "About 18 s.",
    "Zero: it is a cache."
  ], 1, "The cost is linear in the size of the stream. That is why the aggregate should be small and a long stream calls for a snapshot.");
  choice("t7", 4, 3, "The old PedidoCriado had frete as a number and the new code expects frete_centavos. What is the solution?", [
    "Edit the old events.",
    "Upcasting: convert the old event to the new format on read, before folding.",
    "Delete the stream.",
    "Ignore the field."
  ], 1, "The event is immutable. Axon describes upcasting; the schema version goes in the event.");
  choice("t7", 5, 3, "The recovery republishes 1047's events to stock, which applies −1 on each PedidoPago. What happens?", [
    "Nothing: stock ignores what it has already seen.",
    "The balance goes down again, as if the order had been placed once more: the consumer has to be idempotent.",
    "The Store refuses the republication.",
    "Kafka merges the duplicates."
  ], 1, "Rehydration is only safe if every consumer can take the same event twice (lesson 10).");

  /* ---------- 8. Snapshotting ---------- */
  choice("t8", 1, 2, "With a snapshot at version 999,000, rehydrating the million took ~13 ms. Against ~1,800 ms without a snapshot, that is:", [
    "About 14× faster.",
    "About 140× faster, reading 1,000 events instead of 1,000,000.",
    "The same: the snapshot does not help.",
    "Slower because of the photo."
  ], 1, "Measured: 13.1 · 19.6 · 12.1 ms (includes starting psql twice). The balance on both paths is 10,000.");
  tf("t8", 2, 2, "Deleting all the snapshots loses data.", false, "The snapshot is derived and disposable: it only makes reads slower. The Store is still the source of truth.");
  choice("t8", 3, 3, "What does the author's lab do with the snapshots table?", [
    "It generates a snapshot every 1,000 events.",
    "It creates the table and does not use it: no .go file mentions it, and rehydration reads all the events.",
    "It reads the snapshot and ignores the events.",
    "It deletes the table on startup."
  ], 1, "It was read in the code (62 .go and .sql files checked), not executed.");
  choice("t8", 4, 3, "A snapshot generated with a bug stores the wrong balance. What happens?", [
    "The error goes away on the next rehydration.",
    "Every command starts from the wrong photo and the error propagates forever, until someone regenerates the snapshot.",
    "The Store fixes it on its own.",
    "It only affects the first command."
  ], 1, "The defense is to sample the photo against the full rehydration and to keep the version of the code that generated it.");

  /* ---------- 9. Order, versioning and last-write-wins ---------- */
  tf("t9", 1, 1, "The Event Store guarantees that whoever consumes over the bus receives the events in version order.", false, "The Store guarantees order within the stream. Partitions, retries and parallel consumers shuffle the arrival.");
  choice("t9", 2, 2, "e-501 (v1), e-504 (v3), e-505 (v4), e-502 (v2) and e-502 again arrive. Where does 'last to arrive wins' end?", [
    "At entregue, version 4.",
    "At pago, version 2: wrong, the order was already delivered.",
    "At criado, version 1.",
    "At enviado, version 3."
  ], 1, "The late e-502 takes the model back. If e-505 had arrived last, the rule would get it right by luck.");
  choice("t9", 3, 2, "And with the 'apply only if the version is higher' rule?", [
    "It ends at pago, version 2.",
    "It applies e-501, e-504 and e-505, discards both e-502s and ends at entregue, version 4.",
    "It discards all of them.",
    "It applies all of them in arrival order."
  ], 1, "In SQL: UPDATE … WHERE pedido_id = … AND versao < $v. In the lab's ScyllaDB: UPDATE … IF version < ?.");
  choice("t9", 4, 3, "Why version and not timestamp to decide who wins?", [
    "Because the timestamp is bigger than the version.",
    "The timestamp depends on a clock (the 120 ms skew from module 17); the version is assigned by the Store, with no clock.",
    "Because the timestamp does not exist in the Store.",
    "Because the version is always even."
  ], 1, "The Store never does LWW: it only appends. The 'highest wins' rule holds in the consumer, with the version.");
  choice("t9", 5, 3, "The rule of discarding the lower version fails in which kind of model?", [
    "In a last-state model, like the status.",
    "In a model that adds up, like the stock balance: discarding the late v2 event loses the deduction.",
    "In none.",
    "Only in NoSQL databases."
  ], 1, "There the defense is idempotency by evento_id (lesson 10) and commutative operations, the idea behind the CRDTs of module 17.");
  choice("t9", 6, 3, "The consumer received v1 and v3 of the order; v2 never arrived. What does the 'higher version only' rule do, and what should the consumer do?", [
    "It applies v3 without a problem; there is nothing to do.",
    "It applies v3 and leaves a gap; the right thing is to detect versao ≠ last + 1 and wait or ask the Store for v2.",
    "It discards v1.",
    "It deletes the order."
  ], 1, "It is the widget's third rule: higher version and wait for the missing one, with a timeout.");

  /* ---------- 10. Idempotency ---------- */
  choice("t10", 1, 2, "The PedidoPago e-502 arrives twice at a consumer that adds up and has no protection. The cat's balance goes:", [
    "3 → 2.",
    "3 → 2 → 1.",
    "3 → 4.",
    "3 → 0."
  ], 1, "It is the module 6 case. With the processed events table, the balance stays at 2.");
  choice("t10", 2, 3, "Where should the processed evento_id be written, in a consumer that adds up?", [
    "In a separate log file.",
    "In an eventos_processados table, in the same transaction that applies the effect: either both go in or neither does.",
    "Only in the consumer's memory.",
    "In the Kafka topic."
  ], 1, "If the consumer crashed between the effect and the record, the retry would apply it again.");
  choice("t10", 3, 3, "How does the lab's statement (MongoDB) become idempotent?", [
    "With a processed table.",
    "It uses movimentacao_id as the _id; the duplicate refused with error 11000 is ignored.",
    "With LWT, like the balance.",
    "It does not: it duplicates the statement."
  ], 1, "It is the natural-key way: the key belongs to the fact, not to the bus event. Read in the code, not executed.");
  choice("t10", 4, 3, "Why does reprocessing the whole period require all consumers to be idempotent?", [
    "Because replay is slower.",
    "Because replay sends the same events again to all of them; it takes just one that does not protect itself to turn into mass duplication.",
    "Because the Store deletes the original.",
    "Because Kafka requires it."
  ], 1, "It is rehydration as recovery (lesson 7) meeting idempotency (lesson 10).");
  choice("t10", 5, 2, "The processed events table grows forever. What is the way out?", [
    "Ignore it: disk is cheap.",
    "A window (7 days, like the topic retention); outside it, the version decides.",
    "Swap it for a bigger table.",
    "Delete the table on every event."
  ], 1, "At 30 orders/s and 4 events per order, the worst case is ~72.6 million rows in 7 days, and the index weighs.");

  /* ---------- 11. Final thoughts ---------- */
  choice("t11", 1, 2, "Is Event Sourcing required to use CQRS or Saga?", [
    "Yes, the three always go together.",
    "No: they are independent patterns that combine (saga with the log as its source; CQRS with the Store on the command side).",
    "Only for Saga.",
    "Only for CQRS."
  ], 1, "Fowler lists the patterns as independent. Each one answers a different question.");
  choice("t11", 2, 3, "In which of these domains does Event Sourcing pay off most?", [
    "A simple record (CRUD) that rarely changes.",
    "Payments, balances or orders with auditing: where the history is the product.",
    "A list of theme preferences.",
    "Any form screen."
  ], 1, "The pattern charges complexity (versioned events, projections, idempotency). It only pays off where the history is used.");

  window.QUIZ = out;
})();
