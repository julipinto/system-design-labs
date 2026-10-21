/* Banco de perguntas do quiz de Comunicação Assíncrona.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução" },
    t2: { topic: "aula-2-mensagens-eventos-comandos-e-documentos", name: "Mensagens, eventos, comandos e documentos" },
    t3: { topic: "aula-3-conceitos-de-mensageria-fifo-lifo-dlqs-e-batches", name: "Conceitos de mensageria: FIFO, LIFO, DLQs e batches" },
    t4: { topic: "aula-4-streaming-de-dados", name: "Streaming de dados" },
    t5: { topic: "aula-5-kafka-e-event-driven-produtores-consumidores-topicos-particoes-e-replicacao", name: "Kafka e event-driven" },
    t6: { topic: "aula-6-kafka-exemplo", name: "Kafka: exemplo" },
    t7: { topic: "aula-7-mqtt", name: "MQTT" },
    t8: { topic: "aula-8-mqtt-exemplo", name: "MQTT: exemplo" },
    t9: { topic: "aula-9-amqp", name: "AMQP" },
    t10: { topic: "aula-10-amqp-exemplo", name: "AMQP: exemplo" }
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


  /* ---------- 1. Introdução ---------- */
  choice("t1", 1, 2, "O pedidos chama o estoque (20 ms), as entregas (100 ms) e as notificações (10 ms) em fila. Quanto isso acrescenta à resposta?", [
    "20 ms.",
    "100 ms.",
    "130 ms.",
    "10 ms."
  ], 2, "As chamadas são em fila, então os tempos se somam: 20 + 100 + 10 = 130 ms.");
  choice("t1", 2, 3, "Na cadeia síncrona, as entregas saem do ar depois de o pagamento acontecer. O que acontece com o pedido?", [
    "Nada: o pedido segue e as entregas leem depois.",
    "O pedido falha, embora o pagamento já tenha acontecido.",
    "O estoque é reservado em dobro.",
    "O pedido é cancelado e o dinheiro, devolvido sozinho."
  ], 1, "A chamada síncrona prende o tempo de quem chama ao tempo de quem responde: se a chamada às entregas falha, o pedido falha junto.");
  choice("t1", 3, 1, "Quantos destinos o pedidos conhece com eventos no Kafka?", [
    "3 serviços.",
    "Nenhum.",
    "1 tópico.",
    "4 serviços, com o antifraude."
  ], 2, "Sem eventos, o pedidos conhece 3 destinos. Com eventos, conhece 1 tópico, e um quarto interessado lê o tópico sem mexer nele.");
  choice("t1", 4, 2, "Quanto leva, em média, o pedidos para publicar o evento e responder, com acks=all?", [
    "Cerca de 10 ms, até o broker confirmar a gravação.",
    "130 ms, como na cadeia síncrona.",
    "Cerca de 1 s.",
    "O tempo de o último consumidor terminar."
  ], 0, "O pedidos só espera a confirmação do broker. Os consumidores leem depois, quando quiserem.");
  tf("t1", 5, 2, "No desenho assíncrono, a resposta à Lena já diz se o estoque foi reservado.", false, "A reserva acontece depois, quando o estoque lê o PedidoPago. A tela mostra \"pago\" e o resto chega em seguida: é o custo do assíncrono.");

  /* ---------- 2. Mensagens, eventos, comandos e documentos ---------- */
  choice("t2", 1, 1, "Qual destes nomes é um comando?", [
    "PedidoPago.",
    "CobrarPedido.",
    "EstoqueReservado.",
    "ResumoDoDia."
  ], 1, "O imperativo (\"cobre\") indica comando. PedidoPago e EstoqueReservado estão no passado: são eventos.");
  choice("t2", 2, 1, "O que é um evento?", [
    "Uma ordem para um serviço conhecido.",
    "Um pacote de dados sem fato nem ordem.",
    "Um fato no passado: o produtor não sabe quem escuta.",
    "Uma resposta síncrona."
  ], 2, "O evento conta o que aconteceu. Quem reage decide o que fazer, e o produtor não espera nada de volta.");
  choice("t2", 3, 2, "Um quarto consumidor, o antifraude, passa a ouvir o PedidoPago. O que muda no pedidos?", [
    "Ele precisa mandar uma mensagem a mais.",
    "Ele precisa conhecer o endereço do antifraude.",
    "Nada: o antifraude lê o mesmo tópico.",
    "Ele precisa de um novo tópico."
  ], 2, "É a pergunta que revela o tipo: num evento, um novo interessado não muda o produtor. Num comando, mudaria.");
  choice("t2", 4, 3, "O time publica ReservarEstoque (comando) no tópico pedidos, com os grupos estoque e estoque-bi. O estoque da caneca era 40. Como fica?", [
    "38, com uma baixa.",
    "36, com duas baixas.",
    "40, nenhum grupo age.",
    "42, as baixas se anulam."
  ], 1, "Todo grupo recebe todas as mensagens do tópico. Um comando manda fazer, então os dois grupos baixam: 40 → 38 → 36.");
  choice("t2", 5, 2, "Qual é a diferença entre event notification e state transfer?", [
    "Notification leva só o aviso e o consumidor pergunta o resto; state transfer leva os dados que ele precisa.",
    "Notification é um comando e state transfer é um documento.",
    "State transfer não usa broker.",
    "Notification é sempre síncrona e state transfer é assíncrona."
  ], 0, "Notification custa uma chamada síncrona a mais. State transfer custa bytes e o risco de o dado já estar velho.");
  tf("t2", 6, 2, "Eventos só podem viajar em tópicos, e comandos só em filas.", false, "Isso mistura o tipo da mensagem com o transporte. Dá para mandar evento por fila (fanout no RabbitMQ) e comando por tópico, com os riscos da aula.");

  /* ---------- 3. Conceitos de mensageria ---------- */
  choice("t3", 1, 1, "Os e-mails 1049, 1050 e 1051 entram nessa ordem numa fila FIFO. Em que ordem saem?", [
    "1051, 1050, 1049.",
    "1049, 1050, 1051.",
    "A ordem é aleatória.",
    "1050, 1049, 1051."
  ], 1, "Enqueue põe no fim e Dequeue tira do começo: sai o primeiro que entrou.");
  order("t3", 2, 3, "O desfazer do pedido 1051 usa uma pilha (LIFO). Ponha na ordem em que as ações são desfeitas.", [
    "Cancelar a remessa",
    "Devolver o estoque",
    "Estornar o pagamento"
  ], "Empilhou-se pagar, reservar estoque e criar remessa. O desfazer sai na ordem inversa.");
  choice("t3", 3, 2, "O e-mail do pedido 1051 falha com 550 endereço inválido. O que a DLQ faz?", [
    "Reenvia para sempre até dar certo.",
    "Apaga a mensagem sem avisar.",
    "Depois de 3 tentativas, guarda a mensagem com o motivo, e a fila principal segue.",
    "Trava a fila até alguém corrigir."
  ], 2, "A DLQ tira a mensagem ruim do caminho e deixa o motivo anexado. Ela é monitorada: alerta se passar de 0.");
  choice("t3", 4, 3, "Sem DLQ, uma mensagem ruim trava a p0, que recebe 40 eventos por segundo. Quantos eventos se acumulam atrás dela em 1 minuto?", [
    "400.",
    "1.200.",
    "4.000.",
    "2.400."
  ], 3, "40 eventos por segundo × 60 s = 2.400 por minuto.");
  choice("t3", 5, 2, "Com linger.ms = 200 e 40 eventos por segundo em cada partição, quantos eventos tem cada lote?", [
    "8.",
    "40.",
    "1.",
    "200."
  ], 0, "40 por segundo × 0,2 s = 8 eventos por lote: 5 envios por segundo em vez de 40.");
  tf("t3", 6, 2, "Brokers de mensagem costumam oferecer filas LIFO.", false, "A pilha é uma estrutura de dados. Os brokers são FIFO ou não garantem ordem, e a ordem do Kafka só vale dentro da partição.");

  /* ---------- 4. Streaming de dados ---------- */
  choice("t4", 1, 1, "Qual é a principal diferença entre uma fila e um log?", [
    "A fila guarda por 7 dias e o log apaga.",
    "A fila apaga a mensagem quando alguém confirma; o log guarda e permite reler.",
    "O log não tem ordem.",
    "Não há diferença."
  ], 1, "O log guarda os eventos pela retenção (7 dias), e cada grupo anota o seu offset.");
  choice("t4", 2, 2, "O grupo novo antifraude quer processar os cerca de 48 mil eventos do dia. O que ele faz?", [
    "Espera os próximos eventos chegarem.",
    "Pede ao pedidos que reenvie os eventos.",
    "Relê o tópico desde o offset 0.",
    "Lê só o último evento."
  ], 2, "Como o log guarda, um grupo novo pode reler do começo: OffsetOldest no laboratório, auto.offset.reset: earliest no exemplo do artigo.");
  choice("t4", 3, 3, "O PedidoPago do 1051 aconteceu às 14:20:03, mas chegou ao tópico às 14:21:05. Em qual janela de 1 minuto ele entra se a janela usa o tempo do evento?", [
    "A de 14:20.",
    "A de 14:21.",
    "A de 14:22.",
    "Em nenhuma."
  ], 0, "O tempo do evento é o de 14:20:03. Por isso a janela precisa de tolerância a atraso: ela só fecha 2 minutos depois.");
  choice("t4", 4, 2, "Qual é o preço de uma janela com tolerância a atraso de 2 minutos?", [
    "O total fica errado para sempre.",
    "O consumidor precisa de mais partições.",
    "O número final demora mais para ficar pronto.",
    "O evento é duplicado."
  ], 2, "Esperar mais corrige o total, e o número final chega depois: é a troca entre rapidez e certeza.");
  tf("t4", 5, 1, "No streaming, o faturamento do dia só é calculado às 23:00.", false, "Esse é o batch. No streaming, cada PedidoPago atualiza o total assim que acontece, com atraso de cerca de 1 s.");

  /* ---------- 5. Kafka e event-driven ---------- */
  choice("t5", 1, 1, "O que é o offset?", [
    "O número da partição.",
    "A posição de um evento dentro da partição.",
    "O nome do grupo de consumo.",
    "O tempo de retenção."
  ], 1, "Cada partição é um log numerado: o PedidoPago do 1051 está na p0 @ 48213.");
  choice("t5", 2, 2, "Com 3 partições e a chave pedido_id, para onde vão os 4 eventos do pedido 1051?", [
    "Cada um para uma partição.",
    "Todos para a p0, em ordem.",
    "Todos para a p2.",
    "Para a partição com menos eventos."
  ], 1, "murmur2(chave) mod 3 dá p0 para a chave 1051, sempre. Por isso os eventos do pedido ficam em ordem."); 
  choice("t5", 3, 2, "Para onde vai a chave 1051 se o tópico passar de 3 para 6 partições?", [
    "Continua na p0.",
    "Vai para a p3.",
    "Vai para a p2.",
    "Vai para a p5."
  ], 1, "murmur2 mod 6 dá p3 para a chave 1051 (e também para a 1049). Durante a transição, o mesmo pedido fica em duas partições e perde a ordem.");
  choice("t5", 4, 2, "O grupo entregas tem 5 réplicas e o tópico tem 3 partições. Quantas réplicas ficam paradas?", [
    "0.",
    "1.",
    "3.",
    "2."
  ], 3, "O máximo de consumidores úteis é o número de partições: 3 trabalham e 2 ficam paradas.");
  choice("t5", 5, 3, "Num instante, o LOG-END-OFFSET da p0 é 48220. O grupo entregas está no offset 48210. Qual é o lag?", [
    "10.",
    "48.210.",
    "0.",
    "48.220."
  ], 0, "Lag = último offset menos o offset do grupo: 48220 − 48210 = 10. Cada grupo tem o seu.");
  choice("t5", 6, 3, "Com acks=1, o líder da p0 confirma o PedidoPago e cai 5 ms depois, antes de o seguidor copiar (cerca de 10 ms). O que acontece?", [
    "O produtor repete e o evento entra.",
    "O novo líder não tem o evento, e o produtor acha que enviou.",
    "O Kafka devolve o evento do disco do líder.",
    "O produtor recebe NotEnoughReplicas."
  ], 1, "Com acks=1 só o líder confirmou. Com acks=all e min.insync.replicas = 2, o líder não teria confirmado antes de a cópia chegar.");
  choice("t5", 7, 3, "Com acks=all, min.insync.replicas = 2 e dois brokers caídos (ISR = 1), o que o produtor recebe?", [
    "A confirmação normal.",
    "Uma duplicata do evento.",
    "NotEnoughReplicas: a partição para de aceitar eventos.",
    "Um evento perdido sem aviso."
  ], 2, "O Kafka perde disponibilidade para não perder dado, a escolha do CAP do módulo 3.");
  choice("t5", 8, 2, "O entregas processa um evento em 100 ms e recebe 30 eventos por segundo, com 3 consumidores em 3 partições. Como está o grupo?", [
    "Com folga grande.",
    "Exatamente no limite: 10 por segundo por consumidor.",
    "Com lag crescendo.",
    "Com 2 consumidores parados."
  ], 1, "30 ÷ 3 = 10 por segundo por consumidor, e 1000 ÷ 100 = 10 por segundo de capacidade. Qualquer rajada vira lag.");
  tf("t5", 9, 1, "A ordem dos eventos no Kafka vale entre todas as partições do tópico.", false, "A ordem só vale dentro da partição. Por isso a chave importa: ela mantém os eventos de um pedido na mesma partição.");
  tf("t5", 10, 2, "O Kafka tem uma DLQ nativa para consumidores.", false, "Não tem: o time cria um tópico como pedidos.dlq e a lógica de mandar para lá.");

  /* ---------- 6. Kafka: exemplo ---------- */
  choice("t6", 1, 1, "O que o laboratório do Kafka não demonstra?", [
    "A chave do produtor.",
    "Os offsets de cada grupo.",
    "O lag.",
    "A replicação."
  ], 3, "O cluster tem 1 broker e fator de replicação 1: o líder, os seguidores e a ISR só existem na história.");
  choice("t6", 2, 2, "Qual é a chave do partition_key do laboratório?", [
    "O pedido.ID.",
    "O cliente_id.",
    "O timestamp.",
    "Não há chave."
  ], 1, "Com cliente_id como chave, a sequência de cada cliente sai em ordem. Na loja, a chave é o pedido_id.");
  choice("t6", 3, 3, "Para onde vai a chave 1051 com 3 partições no sarama (Go) e no cliente Java?", [
    "p2 no sarama e p0 no Java.",
    "p0 nos dois.",
    "p0 no sarama e p2 no Java.",
    "p1 nos dois."
  ], 0, "O sarama usa FNV-1a e o Java usa murmur2. Misturar clientes quebra a ordem de um pedido sem erro nenhum.");
  choice("t6", 4, 3, "O faturamento processa 100 ms por evento e cai antes do auto-commit de 1 s. Quantos eventos aproximadamente são reprocessados?", [
    "Cerca de 10.",
    "Cerca de 1.000.",
    "Nenhum.",
    "Cerca de 100."
  ], 0, "1 s ÷ 100 ms = 10 eventos. Conserto: idempotência pelo evento_id ou commit manual depois de gravar.");
  choice("t6", 5, 2, "Por que o tópico pedidos do laboratório tem 1 partição?", [
    "O setup.sh o cria com 1 partição.",
    "O Kafka limita a 1 partição por tópico.",
    "Ele é criado automaticamente e o num.partitions padrão é 1.",
    "O produtor usa 1 partição."
  ], 2, "Para ver partições, o laboratório usa o pedidos-particionados, criado com 3 pelo setup.sh.");
  tf("t6", 6, 2, "O laço do partition_key para em 50 mensagens, como diz o comentário.", false, "O comentário diz 50, mas o laço só para em 15.000.");

  /* ---------- 7. MQTT ---------- */
  choice("t7", 1, 1, "O que o + e o # fazem num filtro MQTT?", [
    "+ vale um nível e # vale vários níveis.",
    "+ vale vários níveis e # vale um nível.",
    "Os dois valem um nível.",
    "Servem para autenticar."
  ], 0, "loja/entregas/+/posicao pega um nível no meio; loja/entregas/# pega tudo abaixo.");
  choice("t7", 2, 2, "Quantos bytes tem o PUBLISH de QoS 1 da posição do caminhão (tópico de 33 B, payload de 38 B)?", [
    "38.",
    "71.",
    "77.",
    "234."
  ], 2, "1 de tipo + 1 de tamanho + 2 do tamanho do tópico + 33 + 2 do identificador + 38 do payload = 77 bytes.");
  choice("t7", 3, 1, "Qual QoS do MQTT garante exatamente uma entrega, com 4 pacotes?", [
    "QoS 0.",
    "QoS 1.",
    "QoS 2.",
    "Nenhum."
  ], 2, "PUBLISH, PUBREC, PUBREL e PUBCOMP. O QoS 1 é pelo menos uma vez e pode duplicar.");
  choice("t7", 4, 3, "O caminhão fica 3 minutos sem sinal e publica a cada 5 s. Quantas posições o rastreador gerou nesse tempo?", [
    "18.",
    "36.",
    "60.",
    "180."
  ], 1, "3 × 60 ÷ 5 = 36. Com QoS 0 elas se perdem; com QoS 1 quem guarda e reenvia é o cliente do caminhão.");
  choice("t7", 5, 2, "As 2 réplicas do rastreio assinam o mesmo filtro, sem $share. O que acontece?", [
    "As duas recebem todas as posições.",
    "Elas dividem as posições.",
    "Só a primeira recebe.",
    "O broker recusa a segunda assinatura."
  ], 0, "É a assinatura padrão. Com $share (MQTT 5.0), as duas dividem as mensagens: 40 por segundo viram 20 em cada.");
  choice("t7", 6, 2, "O que é o Last Will?", [
    "A última posição retida do tópico.",
    "Uma mensagem que o broker publica se o cliente some sem se despedir.",
    "O QoS padrão do cliente.",
    "O limite de mensagens por cliente."
  ], 1, "O broker publica loja/entregas/caminhao-17/status = offline depois de 1,5 × keep-alive (90 s).");
  tf("t7", 7, 2, "O tópico MQTT guarda o histórico das mensagens para quem assinar depois.", false, "O tópico não guarda: só a última retida e as mensagens das sessões persistentes.");

  /* ---------- 8. MQTT: exemplo ---------- */
  choice("t8", 1, 1, "Com que QoS o produtor do laboratório publica?", [
    "QoS 0.",
    "QoS 1.",
    "QoS 2.",
    "Sem QoS."
  ], 1, "O Publish usa QoS 1: o código espera o token, que é o PUBACK.");
  choice("t8", 2, 2, "O consumidor usa CleanSession(true) e sobe depois do produtor. O que acontece com as mensagens do período em que estava fora?", [
    "O broker as entrega ao subir.",
    "Elas se perdem.",
    "O produtor as reenvia.",
    "Elas vão para uma DLQ."
  ], 1, "Sessão limpa quer dizer que o broker esquece a assinatura e as mensagens pendentes.");
  choice("t8", 3, 3, "Com sessão persistente, 1 msg/s e max_queued_messages = 1.000, o consumidor fica fora 20 minutos. O que acontece?", [
    "Todas as 1.200 são guardadas.",
    "Nenhuma é guardada.",
    "Só as 600 primeiras são guardadas.",
    "Ficam 1.000 e as 200 excedentes são descartadas."
  ], 3, "20 min × 60 s = 1.200 mensagens, para uma fila de 1.000 por cliente. Sessão persistente é uma fila curta, e não um log.");
  choice("t8", 4, 2, "Por que o laboratório não dá para retomar uma sessão persistente?", [
    "O Mosquitto não suporta.",
    "O clientID usa time.Now().Unix() e muda a cada execução.",
    "O QoS é 0.",
    "A porta 9001 está fechada."
  ], 1, "Sessão persistente pede clientID fixo.");
  tf("t8", 5, 2, "O paho.mqtt.golang v1.4.3 do laboratório suporta a assinatura compartilhada ($share).", false, "Ele fala MQTT 3.1.1. O $share é do MQTT 5.0 e pede o cliente eclipse/paho.golang.");

  /* ---------- 9. AMQP ---------- */
  choice("t9", 1, 2, "50.000 e-mails promocionais estão na frente, e o provedor aceita 100 por segundo. Quanto espera o e-mail da Lena numa fila única?", [
    "50 s.",
    "5 min.",
    "500 s, ou 8 min 20 s.",
    "50.000 s."
  ], 2, "50.000 ÷ 100 = 500 s. Com filas separadas, ele sai em menos de 1 s.");
  choice("t9", 2, 1, "No AMQP, quem escolhe a fila de destino?", [
    "O produtor.",
    "O broker, pela exchange e pelos bindings.",
    "O consumidor.",
    "O DNS."
  ], 1, "O produtor publica numa exchange com uma routing key. É a diferença para o Kafka.");
  choice("t9", 3, 2, "Para quais filas vai a chave email.pedido.confirmacao na exchange emails?", [
    "Só transacionais.",
    "Promocionais e auditoria.",
    "Todas as três.",
    "Transacionais e auditoria."
  ], 3, "Casa com email.pedido.* e com email.#. Não casa com email.promo.#.");
  choice("t9", 4, 3, "Com as filas ligadas por email.pedido.* e email.#, o produtor passa a publicar emails.pedido.confirmacao (plural, erro de digitação). O que acontece?", [
    "A exchange descarta a mensagem em silêncio.",
    "O RabbitMQ corrige a chave.",
    "O produtor recebe um erro na hora.",
    "A mensagem vai para a DLQ."
  ], 0, "Sem fila casada, a mensagem é descartada. Remédios: mandatory = true, alternate exchange e alerta.");
  choice("t9", 5, 2, "Qual tipo de exchange copia a mensagem para todas as filas ligadas, ignorando a chave?", [
    "direct.",
    "topic.",
    "fanout.",
    "headers."
  ], 2, "A fanout é o 1 para N. A direct casa a chave inteira; a topic, padrões com * e #.");
  tf("t9", 6, 2, "No AMQP 0-9-1, cada canal é uma conexão TCP independente.", false, "Os canais são virtuais e dividem uma conexão TCP. É por isso que são baratos.");
  tf("t9", 7, 2, "O AMQP 1.0 é o mesmo protocolo que o 0-9-1, com exchanges.", false, "O AMQP 1.0 (OASIS, ISO/IEC 19464) é outro protocolo, sem exchanges.");

  /* ---------- 10. AMQP: exemplo ---------- */
  choice("t10", 1, 2, "No laboratório topic, qual binding faz o datalake receber todas as mensagens?", [
    "faturamento.prioridade.alta.",
    "faturamento.prioridade.default.",
    "#.",
    "faturamento.prioridade.*."
  ], 3, "O * casa com uma palavra, então as chaves default e alta casam. O datalake recebe as 20 mensagens.");
  choice("t10", 2, 3, "A mensagem do laboratório sobrevive a um reinício do broker?", [
    "Sim, porque a fila é durável.",
    "Não: a fila é durável, mas a mensagem não tem DeliveryMode: Persistent.",
    "Sim, por causa do auto-ack.",
    "Não, porque o RabbitMQ não grava em disco."
  ], 1, "Fila durável e mensagem persistente são duas coisas. As mensagens do laboratório são text/plain, sem persistência.");
  choice("t10", 3, 2, "O que o d.Ack(true) faz?", [
    "Confirma só a mensagem atual.",
    "Rejeita a mensagem.",
    "Confirma todas as pendentes até a atual (multiple = true).",
    "Reenvia a mensagem."
  ], 2, "Com processamento concorrente, isso pode confirmar mensagens ainda em andamento, que podem se perder.");
  choice("t10", 4, 3, "O consumidor de e-mail cai depois de enviar o e-mail e antes do ack. O que a Lena recebe?", [
    "Nada: a mensagem foi apagada.",
    "O e-mail duplicado, porque o RabbitMQ reentrega com redelivered = true.",
    "Um e-mail de erro.",
    "O e-mail na DLQ."
  ], 1, "Conserto: um message_id por e-mail e idempotência no consumidor.");
  choice("t10", 5, 2, "Qual é o substituto do streadway/amqp, que está arquivado?", [
    "rabbitmq/amqp091-go.",
    "IBM/sarama.",
    "eclipse/paho.golang.",
    "gorilla/websocket."
  ], 0, "O amqp091-go é o cliente Go mantido pela equipe do RabbitMQ.");
  tf("t10", 6, 3, "Sem prefetch, o RabbitMQ empurra todas as mensagens para o primeiro consumidor que conectar.", true, "Nenhum consumidor do laboratório chama ch.Qos(...), então não há limite de mensagens soltas.");

  window.QUIZ = out;
})();
