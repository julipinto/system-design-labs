/* Question bank for the Saga Pattern quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-motivacoes", name: "Introduction and motivations" },
    t2: { topic: "aula-2-o-problema-das-transacoes-longas-e-distribuidas", name: "Long and distributed transactions" },
    t3: { topic: "aula-3-a-proposta-arquitetural-do-saga", name: "The Saga's architectural proposal" },
    t4: { topic: "aula-4-saga-coreografado", name: "Choreographed saga" },
    t5: { topic: "aula-5-saga-orquestrado", name: "Orchestrated saga" },
    t6: { topic: "aula-6-state-machines", name: "State machines" },
    t7: { topic: "aula-7-fluxos-de-compensacao", name: "Compensation flows" },
    t8: { topic: "aula-8-logs-de-saga", name: "Saga logs" },
    t9: { topic: "aula-9-dual-write", name: "Dual write" },
    t10: { topic: "aula-10-exemplo-de-sistema-de-pedidos-distribuido", name: "Example of a distributed order system" }
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

  /* ---------- Introduction and motivations ---------- */
  choice("t1", 1, 1, "What does the Saga guarantee?", ["That an operation crossing services finishes whole or gets undone, through local steps and compensations.", "That each step is faster than an ACID transaction.", "That all services use the same database.", "That no step ever fails."], 0, "The Saga trades the atomicity of one transaction for local steps and compensations. The article warns: it guarantees consistency and control, not performance.");
  choice("t1", 2, 2, "How long did order 1057 take from creation to CANCELADO, and how much of that was Davi's wait?", ["41.2 s, of which 44.95 s of waiting.", "3.7 s, all of it waiting.", "44.95 s, of which 3.7 s of waiting.", "44.95 s, of which 41.2 s of waiting."], 3, "20:15:00.000 → 20:15:44.950 is 44.95 s; Davi paid at 20:15:41.200 (41.2 s). The whole compensation took 3.7 s.");
  tf("t1", 3, 2, "Without a saga, 1057 stays paid and with no stock, and only the 23:00 reconciliation would catch it, 2 h 44 min after the payment.", true, "With nobody owning the flow, nobody undoes anything. The 23:00 reconciliation (module 6) is the only thing that would look, 2 h 44 min after 20:15:41.");
  choice("t1", 4, 1, "Where does the Saga idea come from?", ["From Google, in 2015, for microservices.", "From the SAGAS paper by Garcia-Molina and Salem (SIGMOD, 1987), for long transactions inside one database.", "From an IETF RFC about HTTP.", "From the Dynamo paper, about replication."], 1, "The 1987 paper dealt with long transactions inside one database. Microservices didn't exist; the pattern came back when each service got its own database.");
  choice("t1", 5, 3, "1057's payment went through and the stock failed. Why doesn't a ROLLBACK undo that?", ["Each service did its COMMIT in its own database, and no database sees the other's transaction.", "Because PostgreSQL has no ROLLBACK.", "Because the PSP blocks the rollback.", "Because rollback only works with cards."], 0, "pedidos, pagamentos, estoque and entregas have their own databases. A ROLLBACK only reaches one database's transaction; that's why someone has to compensate.");

  /* ---------- Long and distributed transactions ---------- */
  choice("t2", 1, 2, "At 30 orders per second and a 41.2 s wait for the Pix, how many transactions would stay open if stock held the lock?", ["30", "1,236", "412", "12,360"], 1, "30 × 41.2 = 1,236 transactions open at the same time, each with a connection and a lock.");
  choice("t2", 2, 1, "How does two-phase commit work?", ["A coordinator asks everyone to 'prepare' and, when all say 'ready', sends 'commit'.", "Each service commits and then compensates.", "The databases replicate the data in two copies.", "The message is duplicated to two topics."], 0, "There are two phases: prepare and commit (Fowler). Between them the locks stay open.");
  choice("t2", 3, 2, "Why doesn't 2PC work with the Pix PSP?", ["The PSP is too slow.", "The PSP doesn't accept HTTPS.", "2PC only works with Kafka.", "There is no 'prepare the Pix': the charge already went out, and the PSP only knows charge and refund."], 3, "2PC requires each participant to know how to prepare. The external PSP and Kafka don't take part, and charge c-7732 had already gone out when Davi approved it.");
  tf("t2", 4, 2, "A PSP timeout is a business failure and calls for compensation.", false, "Timeout and 503 are technical failures: they call for retry (module 21). Only a business failure, like EstoqueIndisponivel, calls for compensation.");
  choice("t2", 5, 3, "Stock answered EstoqueIndisponivel and the PSP answered 503 to the refund. Which is which?", ["Both are business failures.", "EstoqueIndisponivel is a business failure (compensate); the 503 is technical (retry).", "Both are technical failures.", "EstoqueIndisponivel is technical and the 503 is business."], 1, "The answer 'there is no stock' is valid and calls for compensation. The 503 is a service that didn't answer and calls for a retry with backoff.");

  /* ---------- The Saga's architectural proposal ---------- */
  choice("t3", 1, 1, "What is a compensation in the Saga?", ["A ROLLBACK that the database does on its own.", "A copy of the database in another region.", "A new transaction that undoes the business effect of a step already done.", "The act of repeating the same step."], 2, "The refund is one more entry, not an erasure. The compensation may even not give everything back (the PSP fee).");
  tf("t3", 2, 2, "Reserving before charging follows the rule that the step that's hard to undo goes last.", true, "Releasing a reservation is cheap; refunding a payment costs money, time and a fee. That's why the author's lab reserves before charging.");
  choice("t3", 3, 2, "Which is the store saga's pivot step?", ["The truck leaving: the point of no return.", "Charging the Pix.", "Reserving the stock.", "Creating the order."], 0, "Compensable steps (charge, reserve) have an undo. The pivot is the point of no return, and after it there are only retryable steps.");
  choice("t3", 4, 3, "1057 is in RESERVANDO and the saga is going to fail. What does another customer see in the stock?", ["Nothing: the Saga isolates sagas from each other.", "Davi's canceled order.", "A 500 error.", "'Sold out' for a few seconds, because the Saga has no isolation."], 3, "The Saga is ACD without the I: the in-between states are visible. 1057's reservation shows up as 'sold out' until it's released.");
  choice("t3", 5, 2, "Which of these is a countermeasure for the lack of isolation?", ["Swapping Kafka for RabbitMQ.", "Increasing the Pix deadline.", "Semantic lock: a state like RESERVA_PENDENTE stays visible.", "Using two-phase commit."], 2, "Commutative updates and rereading the value before changing it also work (microservices.io).");

  /* ---------- Choreographed saga ---------- */
  choice("t4", 1, 1, "How many events does choreography use on success and on 1057's stock failure?", ["6 and 8", "3 and 4", "5 and 4", "4 and 5"], 3, "Success: PedidoCriado, PedidoPago, EstoqueReservado, EntregaAgendada. Failure: PedidoCriado, PedidoPago, EstoqueIndisponivel, PagamentoEstornado, PedidoCancelado.");
  choice("t4", 2, 2, "In the store's choreography, who listens to EstoqueIndisponivel to refund?", ["The pedidos service.", "The entregas service.", "The pagamentos service.", "An orchestrator."], 2, "pagamentos starts listening to stock, and publishes PagamentoEstornado, which pedidos listens to in order to cancel.");
  tf("t4", 3, 2, "In real choreography, the service that finishes calls the next service directly.", false, "It publishes the fact and doesn't know who listens. Calling the next one directly is a point-to-point chain, not choreography (microservices.io).");
  choice("t4", 4, 3, "1057's EstoqueIndisponivel gets lost in choreography. What happens?", ["1057 stays paid forever: nobody compensates, and there is no saga owner to notice.", "The saga refunds on its own after a while.", "Stock repeats the message on its own.", "Kafka refunds the payment."], 0, "Each service did its part, and none is responsible for the whole. Only a watchdog (lesson 6) would find the stalled saga.");
  choice("t4", 5, 2, "What is the circular dependency in the store's choreography?", ["pedidos calls pedidos itself.", "Kafka listens to the PSP.", "Stock listens to Davi.", "pagamentos starts listening to stock, which already listened to pagamentos."], 3, "It's a cost of choreography: the flow is spread out, and earlier services need to listen to the failures of later ones.");

  /* ---------- Orchestrated saga ---------- */
  choice("t5", 1, 1, "How many messages does orchestration use on 1057's stock failure, not counting the start one?", ["8", "6", "5", "4"], 0, "Charge and reply, reserve and failure reply, refund and reply, cancel and reply: 4 commands and 4 replies. On success it's 6.");
  choice("t5", 2, 2, "What does the orchestrator do that choreography doesn't?", ["Runs an ACID transaction across the databases.", "Replaces each service's database.", "Charges the Pix in place of the PSP.", "Holds the saga's map and orders compensation."], 3, "The orchestrator sends commands, waits for replies and decides when to compensate. The flow lives in one place.");
  tf("t5", 3, 2, "In the author's lab, commands go to <service>-commands and replies come back on <service>-reply.", true, "For example, pagamentos-commands and pagamentos-reply. The orchestrator writes to the first and reads from the second.");
  choice("t5", 4, 3, "The orchestrator goes down with 200 sagas in flight and the state was only in memory. What happens?", ["They carry on by themselves, through the services.", "The sagas are lost: the services did the steps and nobody knows which step each order is at.", "Kafka restarts them from scratch.", "The services compensate all of them automatically."], 1, "That's why the state lives in a database: when it comes back, the orchestrator reads the table and carries on from the last step.");
  choice("t5", 5, 2, "What is the cost of orchestration?", ["An extra component that every order goes through, and the temptation to put business rules in it.", "None: it's always cheaper.", "The services start to know each other.", "There are no reply topics."], 0, "It also uses more messages (6 and 8 against 4 and 5). In return, the flow is in one place.");

  /* ---------- State machines ---------- */
  order("t6", 1, 2, "Put the states of 1057's saga, which failed on stock, in order.", ["NOVO", "COBRANDO", "PAGO", "RESERVANDO", "COMPENSANDO", "ESTORNANDO", "CANCELADO"], "These are the log's 7 transitions: 20:15:00.000 NOVO, .050 COBRANDO, 41.200 PAGO, 41.220 RESERVANDO, 41.260 COMPENSANDO, 41.300 ESTORNANDO, 44.950 CANCELADO.");
  choice("t6", 2, 2, "transitar('s-1057','COBRANDO','PAGO',…) returned f. What does that mean?", ["The saga was no longer in COBRANDO: nothing changed and nothing went to the log (it was the PedidoPago duplicate).", "The database went down during the transition.", "The saga finished successfully.", "The payment failed."], 0, "The UPDATE … WHERE estado = de affected 0 rows. The duplicate of e-1902 at 20:15:41.210 was ignored without special code.");
  choice("t6", 3, 1, "Which final state of the store's saga calls a person?", ["CANCELADO", "FINALIZADO", "COMPENSANDO", "INTERVENCAO"], 3, "FINALIZADO and CANCELADO end on their own. INTERVENCAO is the only one that calls a person: the compensation didn't go through.");
  choice("t6", 4, 3, "The PSP never reports the Pix and the saga stays stalled in COBRANDO. What's the way out?", ["Wait for Davi to pay, however long it takes.", "Swap orchestration for choreography.", "A deadline per state and a watchdog that expires the saga and triggers the compensation.", "Delete the saga's row from the database."], 2, "The watchdog looks for sagas outside FINALIZADO and CANCELADO stalled past the deadline. Run on Oct 20, 2026, it found s-teste stalled in COBRANDO since 19:20.");
  tf("t6", 5, 2, "The author's lab orchestrator checks the current state before advancing on a success reply.", false, "Read in the code: processReply advances by the reply's topic and only uses the current state when the reply is a failure.");

  /* ---------- Compensation flows ---------- */
  order("t7", 1, 3, "In the author's lab (stock, payment, delivery), delivery fails. Put the compensations in the order the saga fires them.", ["CANCEL_PAYMENT (refund)", "RELEASE_STOCK (release the stock)", "CANCEL_ORDER (cancel the order)"], "It's the reverse order of what was done: payment was the last step completed, then the reservation, and finally the order.");
  choice("t7", 2, 2, "What makes 1057's refund idempotent?", ["The pagamentos-reply topic.", "The key estorno-c-7732: repeating the command refunds only once.", "The fact that the PSP is external.", "The database ROLLBACK."], 1, "Without the key, repeating the refund to be safe would give Davi back R$ 116.00 instead of R$ 58.00.");
  choice("t7", 3, 2, "The refund fails with 503 and the saga retries with backoff of 1, 2, 4, 8 and 16 s. How much does that add up to before calling a person?", ["31 s", "16 s", "32 s", "15 s"], 0, "1 + 2 + 4 + 8 + 16 = 31 s, in 5 retries. After that the saga goes to INTERVENCAO.");
  choice("t7", 4, 3, "In the lab (read), after the saga becomes FAILED, CANCEL_ORDER answers with success on pedidos-reply. What does the orchestrator do?", ["Nothing, because FAILED is a final state.", "Takes the saga to INTERVENCAO.", "Deletes the order.", "Sends RESERVE_STOCK again: the canceled saga can come back to life."], 3, "A compensation's reply is read as an advance. The fix is for the reply to carry command_type and the orchestrator to only advance from the expected state.");
  tf("t7", 5, 1, "The compensation always gives everything back, including the fee the PSP charged.", false, "Microsoft warns: canceling a reservation may not entitle the customer to a full refund. Compensating undoes the business effect, it doesn't erase history.");

  /* ---------- Saga logs ---------- */
  choice("t8", 1, 1, "How many rows does 1057's saga log have?", ["5", "4", "11", "7"], 3, "From NOVO (20:15:00) to CANCELADO (20:15:44.95), seven transitions; the saga table ends with versao = 7.");
  choice("t8", 2, 2, "How do you find out a saga's current state in the log?", ["From the first row.", "By summing all the versions.", "From the last row.", "You can't: the log doesn't keep states."], 2, "The state is the last row (getCurrentState does ORDER BY created_at DESC LIMIT 1).");
  choice("t8", 3, 3, "30 orders/s, 7 rows per saga and 90 days of retention: how many rows does the log accumulate?", ["163,296,000", "1,632,960,000", "16,329,600,000", "1,632,960"], 1, "30 × 86,400 × 90 × 7 = 1,632,960,000, about 1.6 billion (roughly 300 GB at 200 B per row). That's why the final sagas are archived.");
  tf("t8", 4, 2, "The author's lab log is event sourcing.", false, "It's a transition log: the state is the last row. It becomes event sourcing only when the state is derived from the log (module 20).");
  choice("t8", 5, 2, "What is the saga log for?", ["Only for caching.", "For encrypting the commands.", "For balancing load between orchestrators.", "Tracing, resumption and audit."], 3, "Where 1057 is, where to carry on after a crash and proof of what happened (the refund e-1904, 58.00).");

  /* ---------- Dual write ---------- */
  choice("t9", 1, 1, "What is dual write in a saga?", ["Saving the state in the database and sending the message: two writes that aren't atomic.", "Writing to two databases with 2PC.", "Writing the same log twice.", "Answering the customer twice."], 0, "If the process dies between the two, either the step was done and nobody knew, or the command goes out twice.");
  choice("t9", 2, 3, "The orchestrator sends ReservarEstoque and goes down before saving RESERVANDO. What happens when it comes back?", ["Nothing: Kafka says it already sent it.", "It refunds the payment.", "It skips the reserve step.", "It reads PAGO and sends ReservarEstoque again: stock reserves twice if it isn't idempotent."], 3, "That is what the author's lab does: it sends the command (line 346) before saving the state (line 391).");
  choice("t9", 3, 2, "How does the outbox solve the saga's dual write?", ["It swaps the database for a faster one.", "It uses 2PC between the database and Kafka.", "It saves the step and the message in the same database transaction, and a relay sends later.", "It deletes the duplicate messages."], 2, "Either both go in, or neither. CDC does the same by reading the database log.");
  tf("t9", 4, 2, "Running the event publishing inside a transaction and only committing after the communication finishes is atomic.", false, "The COMMIT can fail after the publish, and the open transaction holds locks. The solution is outbox or CDC.");
  choice("t9", 5, 2, "Even with an outbox, why does the service that receives the command need to be idempotent?", ["The relay can publish and go down before marking, and the command goes out twice.", "Because Kafka doesn't store messages.", "To save space in the database.", "Because the relay is slow."], 0, "Delivery is at least once. The command_id avoids the double effect: stock answers what it already answered.");

  /* ---------- Example of a distributed order system ---------- */
  choice("t10", 1, 2, "In the author's lab, with 10% stock failure and 5% payment failure, what is the success rate?", ["95%", "85.5%", "90%", "81%"], 1, "0.9 × 0.95 = 0.855: 17.1 out of 20 orders.");
  choice("t10", 2, 2, "In 20 orders in the lab, how many fail on payment on average?", ["0.9", "1.0", "2.0", "4.5"], 0, "(1 − 0.10) × 0.05 = 4.5%, and 4.5% of 20 is 0.9. In those cases the stock has to be released.");
  choice("t10", 3, 3, "30 orders/s, 20% drop off the Pix and the reservation lasts 10 min. How many units get stuck?", ["360", "36,000", "600", "3,600"], 3, "30 × 0.2 × 600 s = 3,600. That's why the reservation has a deadline and the expiry is a compensation.");
  choice("t10", 4, 2, "1057 with the stock shortage: what changes between charging first (the store) and reserving first (the lab)?", ["Charging first is faster and has no refund.", "They are identical.", "Charging first takes 44.95 s and refunds R$ 58.00; reserving first takes about 100 ms, no refund, but holds the reservation.", "Reserving first also refunds Davi."], 2, "Reserving first swaps the refund for a stuck reservation while the customer decides to pay.");
  tf("t10", 5, 1, "The author's lab has a choreographed version in addition to the orchestrated one.", false, "Only the orquestrado/ folder exists: Go, Kafka, 5 PostgreSQL databases, 5 services and a simulator.");

  window.QUIZ = out;
})();
