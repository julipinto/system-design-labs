/* Question bank for the Asynchronous Communication quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction" },
    t2: { topic: "aula-2-mensagens-eventos-comandos-e-documentos", name: "Messages, events, commands and documents" },
    t3: { topic: "aula-3-conceitos-de-mensageria-fifo-lifo-dlqs-e-batches", name: "Messaging concepts: FIFO, LIFO, DLQs and batches" },
    t4: { topic: "aula-4-streaming-de-dados", name: "Data streaming" },
    t5: { topic: "aula-5-kafka-e-event-driven-produtores-consumidores-topicos-particoes-e-replicacao", name: "Kafka and event-driven" },
    t6: { topic: "aula-6-kafka-exemplo", name: "Kafka: example" },
    t7: { topic: "aula-7-mqtt", name: "MQTT" },
    t8: { topic: "aula-8-mqtt-exemplo", name: "MQTT: example" },
    t9: { topic: "aula-9-amqp", name: "AMQP" },
    t10: { topic: "aula-10-amqp-exemplo", name: "AMQP: example" }
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
  choice("t1", 1, 2, "pedidos calls estoque (20 ms), entregas (100 ms) and notificacoes (10 ms) one after another. How much does that add to the response?", [
    "20 ms.",
    "100 ms.",
    "130 ms.",
    "10 ms."
  ], 2, "The calls are in sequence, so the times add up: 20 + 100 + 10 = 130 ms.");
  choice("t1", 2, 3, "In the synchronous chain, entregas goes down after the payment happens. What happens to the order?", [
    "Nothing: the order moves on and entregas reads it later.",
    "The order fails, even though the payment already happened.",
    "The stock is reserved twice.",
    "The order is canceled and the money is refunded on its own."
  ], 1, "A synchronous call ties the caller's time to the time of whoever answers: if the call to entregas fails, the order fails with it.");
  choice("t1", 3, 1, "How many destinations does pedidos know with events in Kafka?", [
    "3 services.",
    "None.",
    "1 topic.",
    "4 services, with antifraude."
  ], 2, "Without events, pedidos knows 3 destinations. With events, it knows 1 topic, and a fourth interested party reads the topic without touching it.");
  choice("t1", 4, 2, "On average, how long does pedidos take to publish the event and respond, with acks=all?", [
    "About 10 ms, until the broker confirms the write.",
    "130 ms, as in the synchronous chain.",
    "About 1 s.",
    "The time for the last consumer to finish."
  ], 0, "pedidos only waits for the broker's confirmation. The consumers read later, whenever they want.");
  tf("t1", 5, 2, "In the asynchronous design, the response to Lena already says whether the stock was reserved.", false, "The reservation happens later, when estoque reads PedidoPago. The screen shows \"paid\" and the rest arrives afterwards: that is the cost of asynchronous.");

  /* ---------- 2. Messages, events, commands and documents ---------- */
  choice("t2", 1, 1, "Which of these names is a command?", [
    "PedidoPago.",
    "CobrarPedido.",
    "EstoqueReservado.",
    "ResumoDoDia."
  ], 1, "The imperative (\"charge\") signals a command. PedidoPago and EstoqueReservado are in the past: they are events.");
  choice("t2", 2, 1, "What is an event?", [
    "An order to a known service.",
    "A bundle of data with no fact and no order.",
    "A fact in the past: the producer does not know who listens.",
    "A synchronous response."
  ], 2, "The event says what happened. Whoever reacts decides what to do, and the producer expects nothing back.");
  choice("t2", 3, 2, "A fourth consumer, antifraude, starts listening to PedidoPago. What changes in pedidos?", [
    "It has to send one more message.",
    "It has to know antifraude's address.",
    "Nothing: antifraude reads the same topic.",
    "It needs a new topic."
  ], 2, "This is the question that reveals the type: with an event, a new interested party does not change the producer. With a command, it would.");
  choice("t2", 4, 3, "The team publishes ReservarEstoque (a command) to the pedidos topic, with the groups estoque and estoque-bi. The blue mug's stock was 40. What is it now?", [
    "38, with one decrement.",
    "36, with two decrements.",
    "40, no group acts.",
    "42, the decrements cancel out."
  ], 1, "Every group receives all the messages in the topic. A command says do this, so both groups decrement: 40 → 38 → 36.");
  choice("t2", 5, 2, "What is the difference between event notification and state transfer?", [
    "Notification carries only the notice and the consumer asks for the rest; state transfer carries the data it needs.",
    "Notification is a command and state transfer is a document.",
    "State transfer does not use a broker.",
    "Notification is always synchronous and state transfer is asynchronous."
  ], 0, "Notification costs one more synchronous call. State transfer costs bytes and the risk of the data already being stale.");
  tf("t2", 6, 2, "Events can only travel in topics, and commands only in queues.", false, "That mixes the message type with the transport. You can send an event through a queue (fanout in RabbitMQ) and a command through a topic, with the risks from the lesson.");

  /* ---------- 3. Messaging concepts ---------- */
  choice("t3", 1, 1, "Emails 1049, 1050 and 1051 enter a FIFO queue in that order. In what order do they leave?", [
    "1051, 1050, 1049.",
    "1049, 1050, 1051.",
    "The order is random.",
    "1050, 1049, 1051."
  ], 1, "Enqueue puts at the end and Dequeue takes from the front: the first one in comes out first.");
  order("t3", 2, 3, "The undo for order 1051 uses a stack (LIFO). Put the actions in the order they are undone.", [
    "Cancel the shipment",
    "Return the stock",
    "Refund the payment"
  ], "Pay, reserve stock and create shipment were pushed. The undo comes out in reverse order.");
  choice("t3", 3, 2, "The email for order 1051 fails with 550 invalid address. What does the DLQ do?", [
    "Resends forever until it works.",
    "Deletes the message without telling anyone.",
    "After 3 attempts, it keeps the message with the reason, and the main queue moves on.",
    "Blocks the queue until someone fixes it."
  ], 2, "The DLQ takes the bad message out of the way and leaves the reason attached. It is monitored: an alert fires if it goes above 0.");
  choice("t3", 4, 3, "Without a DLQ, a bad message blocks p0, which receives 40 events per second. How many events pile up behind it in 1 minute?", [
    "400.",
    "1,200.",
    "4,000.",
    "2,400."
  ], 3, "40 events per second × 60 s = 2,400 per minute.");
  choice("t3", 5, 2, "With linger.ms = 200 and 40 events per second in each partition, how many events does each batch have?", [
    "8.",
    "40.",
    "1.",
    "200."
  ], 0, "40 per second × 0.2 s = 8 events per batch: 5 sends per second instead of 40.");
  tf("t3", 6, 2, "Message brokers usually offer LIFO queues.", false, "The stack is a data structure. Brokers are FIFO or do not guarantee order, and Kafka's order only holds within the partition.");

  /* ---------- 4. Data streaming ---------- */
  choice("t4", 1, 1, "What is the main difference between a queue and a log?", [
    "The queue keeps for 7 days and the log erases.",
    "The queue erases the message when someone acknowledges it; the log keeps it and allows rereading.",
    "The log has no order.",
    "There is no difference."
  ], 1, "The log keeps the events for the retention period (7 days), and each group notes its own offset.");
  choice("t4", 2, 2, "The new antifraude group wants to process the roughly 48 thousand events of the day. What does it do?", [
    "Waits for the next events to arrive.",
    "Asks pedidos to resend the events.",
    "Rereads the topic from offset 0.",
    "Reads only the last event."
  ], 2, "Since the log keeps things, a new group can reread from the beginning: OffsetOldest in the lab, auto.offset.reset: earliest in the article's example.");
  choice("t4", 3, 3, "The PedidoPago for 1051 happened at 14:20:03, but reached the topic at 14:21:05. Which 1-minute window does it go into if the window uses event time?", [
    "The 14:20 one.",
    "The 14:21 one.",
    "The 14:22 one.",
    "None."
  ], 0, "The event time is 14:20:03. That is why the window needs late-arrival tolerance: it only closes 2 minutes later.");
  choice("t4", 4, 2, "What is the price of a window with a 2-minute late-arrival tolerance?", [
    "The total is wrong forever.",
    "The consumer needs more partitions.",
    "The final number takes longer to be ready.",
    "The event is duplicated."
  ], 2, "Waiting longer corrects the total, and the final number arrives later: it is the trade between speed and certainty.");
  tf("t4", 5, 1, "In streaming, the day's revenue is only calculated at 23:00.", false, "That is the batch. In streaming, each PedidoPago updates the total as soon as it happens, with a delay of about 1 s.");

  /* ---------- 5. Kafka and event-driven ---------- */
  choice("t5", 1, 1, "What is the offset?", [
    "The partition number.",
    "The position of an event inside the partition.",
    "The name of the consumer group.",
    "The retention time."
  ], 1, "Each partition is a numbered log: the PedidoPago of 1051 is at p0 @ 48213.");
  choice("t5", 2, 2, "With 3 partitions and the key pedido_id, where do the 4 events of order 1051 go?", [
    "Each one to a different partition.",
    "All to p0, in order.",
    "All to p2.",
    "To the partition with the fewest events."
  ], 1, "murmur2(key) mod 3 gives p0 for key 1051, always. That is why the order's events stay in order.");
  choice("t5", 3, 2, "Where does key 1051 go if the topic goes from 3 to 6 partitions?", [
    "It stays on p0.",
    "It goes to p3.",
    "It goes to p2.",
    "It goes to p5."
  ], 1, "murmur2 mod 6 gives p3 for key 1051 (and also for 1049). During the transition, the same order sits in two partitions and loses its order.");
  choice("t5", 4, 2, "The entregas group has 5 replicas and the topic has 3 partitions. How many replicas sit idle?", [
    "0.",
    "1.",
    "3.",
    "2."
  ], 3, "The maximum number of useful consumers is the number of partitions: 3 work and 2 sit idle.");
  choice("t5", 5, 3, "At one instant, p0's LOG-END-OFFSET is 48220. The entregas group is at offset 48210. What is the lag?", [
    "10.",
    "48,210.",
    "0.",
    "48,220."
  ], 0, "Lag = last offset minus the group's offset: 48220 − 48210 = 10. Each group has its own.");
  choice("t5", 6, 3, "With acks=1, p0's leader confirms the PedidoPago and goes down 5 ms later, before the follower copies (about 10 ms). What happens?", [
    "The producer retries and the event goes in.",
    "The new leader does not have the event, and the producer thinks it sent it.",
    "Kafka returns the event from the leader's disk.",
    "The producer gets NotEnoughReplicas."
  ], 1, "With acks=1 only the leader confirmed. With acks=all and min.insync.replicas = 2, the leader would not have confirmed before the copy arrived.");
  choice("t5", 7, 3, "With acks=all, min.insync.replicas = 2 and two brokers down (ISR = 1), what does the producer get?", [
    "The normal confirmation.",
    "A duplicate of the event.",
    "NotEnoughReplicas: the partition stops accepting events.",
    "A lost event with no warning."
  ], 2, "Kafka loses availability to avoid losing data, the CAP choice from module 3.");
  choice("t5", 8, 2, "entregas processes an event in 100 ms and receives 30 events per second, with 3 consumers on 3 partitions. How is the group doing?", [
    "With plenty of slack.",
    "Exactly at the limit: 10 per second per consumer.",
    "With the lag growing.",
    "With 2 consumers idle."
  ], 1, "30 ÷ 3 = 10 per second per consumer, and 1000 ÷ 100 = 10 per second of capacity. Any burst turns into lag.");
  tf("t5", 9, 1, "Event order in Kafka holds across all the partitions of the topic.", false, "Order only holds within the partition. That is why the key matters: it keeps an order's events on the same partition.");
  tf("t5", 10, 2, "Kafka has a native DLQ for consumers.", false, "It does not: the team creates a topic like pedidos.dlq and the logic to send messages there.");

  /* ---------- 6. Kafka: example ---------- */
  choice("t6", 1, 1, "What does the Kafka lab not demonstrate?", [
    "The producer's key.",
    "Each group's offsets.",
    "The lag.",
    "Replication."
  ], 3, "The cluster has 1 broker and replication factor 1: the leader, the followers and the ISR only exist in the story.");
  choice("t6", 2, 2, "What is the key in the lab's partition_key?", [
    "The pedido.ID.",
    "The cliente_id.",
    "The timestamp.",
    "There is no key."
  ], 1, "With cliente_id as the key, each customer's sequence comes out in order. In the store, the key is pedido_id.");
  choice("t6", 3, 3, "Where does key 1051 go with 3 partitions in sarama (Go) and in the Java client?", [
    "p2 in sarama and p0 in Java.",
    "p0 in both.",
    "p0 in sarama and p2 in Java.",
    "p1 in both."
  ], 0, "sarama uses FNV-1a and Java uses murmur2 (checked by running both). Mixing clients breaks an order's ordering with no error at all.");
  choice("t6", 4, 3, "faturamento processes 100 ms per event and goes down before the 1 s auto-commit. Roughly how many events are reprocessed?", [
    "About 10.",
    "About 1,000.",
    "None.",
    "About 100."
  ], 0, "1 s ÷ 100 ms = 10 events in the worst case (in the SIGKILL test, it was 6). Fix: idempotence by evento_id or a manual commit after writing.");
  choice("t6", 5, 2, "Why does the lab's pedidos topic have 1 partition?", [
    "setup.sh creates it with 1 partition.",
    "Kafka limits a topic to 1 partition.",
    "It is created automatically and the default num.partitions is 1.",
    "The producer uses 1 partition."
  ], 2, "To see partitions, the lab uses pedidos-particionados, which setup.sh should create with 3 (when run, it fails: it calls docker exec kafka and the container is kafka-kraft).");
  tf("t6", 6, 2, "The partition_key loop stops at 50 messages, as the comment says.", false, "The comment says 50, but the loop only stops at 15,000.");

  /* ---------- 7. MQTT ---------- */
  choice("t7", 1, 1, "What do + and # do in an MQTT filter?", [
    "+ matches one level and # matches several levels.",
    "+ matches several levels and # matches one level.",
    "Both match one level.",
    "They are used to authenticate."
  ], 0, "loja/entregas/+/posicao takes one level in the middle; loja/entregas/# takes everything below.");
  choice("t7", 2, 2, "How many bytes is the QoS 1 PUBLISH of the truck's position (33 B topic, 38 B payload)?", [
    "38.",
    "71.",
    "77.",
    "234."
  ], 2, "1 for type + 1 for length + 2 for the topic length + 33 + 2 for the identifier + 38 for the payload = 77 bytes.");
  choice("t7", 3, 1, "Which MQTT QoS guarantees exactly one delivery, with 4 packets?", [
    "QoS 0.",
    "QoS 1.",
    "QoS 2.",
    "None."
  ], 2, "PUBLISH, PUBREC, PUBREL and PUBCOMP. QoS 1 is at least once and can duplicate.");
  choice("t7", 4, 3, "The truck goes 3 minutes without signal and publishes every 5 s. How many positions did the tracker generate in that time?", [
    "18.",
    "36.",
    "60.",
    "180."
  ], 1, "3 × 60 ÷ 5 = 36. With QoS 0 they are lost; with QoS 1 the truck's client is the one that keeps and resends them.");
  choice("t7", 5, 2, "The 2 replicas of rastreio subscribe to the same filter, without $share. What happens?", [
    "Both receive all the positions.",
    "They split the positions.",
    "Only the first one receives.",
    "The broker refuses the second subscription."
  ], 0, "This is the standard subscription. With $share (MQTT 5.0), the two split the messages: 40 per second become 20 on each.");
  choice("t7", 6, 2, "What is the Last Will?", [
    "The topic's last retained position.",
    "A message the broker publishes if the client disappears without saying goodbye.",
    "The client's default QoS.",
    "The limit of messages per client."
  ], 1, "The broker publishes loja/entregas/caminhao-17/status = offline after 1.5 × keep-alive (90 s).");
  tf("t7", 7, 2, "The MQTT topic keeps the message history for whoever subscribes later.", false, "The topic does not keep it: only the last retained message and the messages of persistent sessions.");

  /* ---------- 8. MQTT: example ---------- */
  choice("t8", 1, 1, "With which QoS does the lab's producer publish?", [
    "QoS 0.",
    "QoS 1.",
    "QoS 2.",
    "No QoS."
  ], 1, "The Publish uses QoS 1: the code waits for the token, which is the PUBACK.");
  choice("t8", 2, 2, "The consumer uses CleanSession(true) and starts after the producer. What happens to the messages from the period it was away?", [
    "The broker delivers them when it starts.",
    "They are lost.",
    "The producer resends them.",
    "They go to a DLQ."
  ], 1, "A clean session means the broker forgets the subscription and the pending messages.");
  choice("t8", 3, 3, "With a persistent session, 1 msg/s and max_queued_messages = 1,000, the consumer is away for 20 minutes. What happens?", [
    "All 1,200 are kept.",
    "None is kept.",
    "Only the first 600 are kept.",
    "1,000 stay and the 200 extra are dropped."
  ], 3, "20 min × 60 s = 1,200 messages, for a queue of 1,000 per client. Tested on Mosquitto 2.0: 1,000 came back, those from 1 to 1000, and the 200 newest were dropped. A persistent session is a short queue, not a log.");
  choice("t8", 4, 2, "Why can't the lab resume a persistent session?", [
    "Mosquitto does not support it.",
    "The clientID uses time.Now().Unix() and changes on every run.",
    "The QoS is 0.",
    "Port 9001 is closed."
  ], 1, "A persistent session needs a fixed clientID.");
  tf("t8", 5, 2, "The lab's paho.mqtt.golang v1.4.3 supports shared subscription ($share).", false, "It speaks MQTT 3.1.1. $share is from MQTT 5.0 and needs the eclipse/paho.golang client.");

  /* ---------- 9. AMQP ---------- */
  choice("t9", 1, 2, "50,000 promotional emails are ahead, and the provider accepts 100 per second. How long does Lena's email wait in a single queue?", [
    "50 s.",
    "5 min.",
    "500 s, or 8 min 20 s.",
    "50,000 s."
  ], 2, "50,000 ÷ 100 = 500 s. With separate queues, it goes out in under 1 s.");
  choice("t9", 2, 1, "In AMQP, who chooses the destination queue?", [
    "The producer.",
    "The broker, through the exchange and the bindings.",
    "The consumer.",
    "DNS."
  ], 1, "The producer publishes to an exchange with a routing key. That is the difference from Kafka.");
  choice("t9", 3, 2, "Which queues does the key email.pedido.confirmacao go to in the emails exchange?", [
    "Only transacionais.",
    "Promocionais and auditoria.",
    "All three.",
    "Transacionais and auditoria."
  ], 3, "It matches email.pedido.* and email.#. It does not match email.promo.#.");
  choice("t9", 4, 3, "With the queues bound by email.pedido.* and email.#, the producer starts publishing emails.pedido.confirmacao (plural, a typo). What happens?", [
    "The exchange silently drops the message.",
    "RabbitMQ corrects the key.",
    "The producer gets an error right away.",
    "The message goes to the DLQ."
  ], 0, "With no matching queue, the message is dropped. Remedies: mandatory = true, an alternate exchange and an alert.");
  choice("t9", 5, 2, "Which exchange type copies the message to all bound queues, ignoring the key?", [
    "direct.",
    "topic.",
    "fanout.",
    "headers."
  ], 2, "Fanout is the 1-to-N. Direct matches the whole key; topic, patterns with * and #.");
  tf("t9", 6, 2, "In AMQP 0-9-1, each channel is an independent TCP connection.", false, "Channels are virtual and share one TCP connection. That is why they are cheap.");
  tf("t9", 7, 2, "AMQP 1.0 is the same protocol as 0-9-1, with exchanges.", false, "AMQP 1.0 (OASIS, ISO/IEC 19464) is a different protocol, with no exchanges.");

  /* ---------- 10. AMQP: example ---------- */
  choice("t10", 1, 2, "In the topic lab, which binding makes the datalake receive all the messages?", [
    "faturamento.prioridade.alta.",
    "faturamento.prioridade.default.",
    "#.",
    "faturamento.prioridade.*."
  ], 3, "The * matches one word, so the default and alta keys both match. The datalake receives all 20 messages.");
  choice("t10", 2, 3, "Does the lab's message survive a broker restart?", [
    "Yes, because the queue is durable.",
    "No: the queue is durable, but the message has no DeliveryMode: Persistent.",
    "Yes, because of auto-ack.",
    "No, because RabbitMQ does not write to disk."
  ], 1, "A durable queue and a persistent message are two different things. The lab's messages are text/plain, with no persistence.");
  choice("t10", 3, 2, "What does d.Ack(true) do?", [
    "Acknowledges only the current message.",
    "Rejects the message.",
    "Acknowledges all pending messages up to the current one (multiple = true).",
    "Resends the message."
  ], 2, "With concurrent processing, this can acknowledge messages still in progress, which can be lost.");
  choice("t10", 4, 3, "The email consumer goes down after sending the email and before the ack. What does Lena receive?", [
    "Nothing: the message was erased.",
    "The duplicated email, because RabbitMQ redelivers with redelivered = true.",
    "An error email.",
    "The email in the DLQ."
  ], 1, "Fix: one message_id per email and idempotence in the consumer.");
  choice("t10", 5, 2, "What replaces streadway/amqp, which is archived?", [
    "rabbitmq/amqp091-go.",
    "IBM/sarama.",
    "eclipse/paho.golang.",
    "gorilla/websocket."
  ], 0, "amqp091-go is the Go client maintained by the RabbitMQ team.");
  tf("t10", 6, 3, "Without prefetch, RabbitMQ pushes all the messages to the first consumer that connects.", true, "No consumer in the lab calls ch.Qos(...), so there is no limit on unacknowledged messages.");

  window.QUIZ = out;
})();
