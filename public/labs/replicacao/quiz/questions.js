/* Banco de perguntas do quiz de Replicação de Dados.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução à replicação de dados" },
    t2: { topic: "aula-2-modelos-primary-primary-e-primary-replica", name: "Modelos: Primary/Replica e Primary/Primary" },
    t3: { topic: "aula-3-sincrona-assincrona-semi-sincrona-e-por-logs", name: "Síncrona, assíncrona, semi-síncrona e por logs" },
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

  /* ---------- 1. Introdução à replicação de dados ---------- */
  choice("t1", 1, 1, "O que é replicar dados?", [
    "Dividir os dados em partes, uma por servidor.",
    "Ter o mesmo dado em mais de um lugar.",
    "Compactar os dados para ocupar menos disco.",
    "Apagar os dados antigos."
  ], 1, "Dividir é o sharding do módulo 16. Replicar é copiar: o dado existe em mais de um lugar para a loja continuar de pé, ler perto e sobreviver a uma perda.");
  choice("t1", 2, 2, "A Lena, em Recife, lê de uma réplica em Recife. Quanto ganha, no exemplo da loja?", [
    "Nada: a leitura sempre vai ao primário.",
    "Cerca de 2 ms em vez de 80 ms de ida e volta até SP.",
    "Cerca de 10 ms em vez de 80 ms.",
    "Cerca de 80 ms em vez de 2 ms."
  ], 1, "A leitura local custa uns 2 ms. Até o primário em SP seriam 80 ms de RTT só na rede.");
  choice("t1", 3, 2, "A loja tem 140 GB de pedidos e 3 sites. Quanto ocupa a replicação total e quanto a parcial, com 2 dos 3 shards por site?", [
    "420 GB e 280 GB.",
    "140 GB e 93,3 GB.",
    "420 GB e 140 GB.",
    "280 GB e 420 GB."
  ], 0, "Total: 3 × 140 = 420 GB. Parcial: (140 ÷ 3) × 2 × 3 = 280 GB, dois terços da total.");
  choice("t1", 4, 2, "Quantos servidores de banco tem a loja com 3 shards e 3 cópias de cada?", [
    "3.",
    "6.",
    "9.",
    "12."
  ], 2, "O eixo Z do módulo 16 (3 shards) vezes o eixo X dos dados (3 cópias): 9 servidores.");
  tf("t1", 5, 3, "Uma réplica serve de backup: se alguém apagar pedidos sem querer, as réplicas ainda têm os pedidos.", false, "O DELETE chega às réplicas em 60 ms, o atraso normal de Recife: são três cópias do erro. Backup e recuperação num ponto no tempo (módulo 27) continuam necessários.");
  choice("t1", 6, 3, "Pelo quórum do módulo 3, com N = 3, qual escolha garante que a leitura sempre vê a última escrita?", [
    "W = 1 e R = 1.",
    "W = 1 e R = 2.",
    "W = 2 e R = 2.",
    "W = 0 e R = 3."
  ], 2, "A leitura cruza com a escrita quando W + R > N: 2 + 2 = 4 > 3. Com W = 1 e R = 1 (assíncrona), a leitura pode cair numa cópia que ainda não recebeu o pedido.");

  /* ---------- 2. Modelos: Primary/Replica e Primary/Primary ---------- */
  choice("t2", 1, 1, "O que acontece com um INSERT numa réplica PostgreSQL?", [
    "Grava e repassa ao primário.",
    "Grava só na réplica.",
    "Falha: cannot execute INSERT in a read-only transaction.",
    "Espera o primário voltar."
  ], 2, "A réplica só lê: transaction_read_only é on e pg_is_in_recovery() devolve t.");
  choice("t2", 2, 2, "O que a promoção do Rio muda no PostgreSQL?", [
    "Nada além do nome do servidor.",
    "A linha do tempo passa de 1 para 2, e o primário antigo só volta como réplica depois de um pg_rewind.",
    "O wal_level vira logical.",
    "O Recife vira primário também."
  ], 1, "A timeline marca a promoção (Latest checkpoint's TimeLineID: 2). O primário antigo precisa do pg_rewind para voltar como réplica.");
  choice("t2", 3, 3, "Na Black Friday o Rio está 300 ms atrás e Recife 800 ms. Qual vira líder na eleição, e quantos pedidos se perdem a 30 pedidos/s com replicação assíncrona?", [
    "Recife, 24 pedidos.",
    "O Rio, 9 pedidos.",
    "O Rio, 24 pedidos.",
    "Recife, 9 pedidos."
  ], 1, "Vence a réplica mais à frente no log: o Rio. A perda é taxa × atraso: 30 × 0,3 = 9 pedidos.");
  choice("t2", 4, 2, "Qual é o RTO de exemplo da loja e quantas tentativas de compra ficam sem primário a 30 pedidos/s?", [
    "5 s e 150.",
    "30 s e 900.",
    "35 s e 1.050.",
    "60 s e 1.800."
  ], 2, "ttl de 30 s do Patroni mais uns 5 s de promoção são 35 s, e 30 × 35 = 1.050 tentativas.");
  choice("t2", 5, 3, "O relógio de Recife está 120 ms atrasado. SP escreve às 20:20:00.100 e Recife às 20:20:00.150 (carimbo .030). O que o LWW faz?", [
    "Escolhe Recife, que é a mais recente de verdade.",
    "Escolhe SP, e a escrita da Lena se perde.",
    "Detecta que são concorrentes e guarda as duas.",
    "Soma as duas escritas."
  ], 1, "Compara os carimbos: .100 > .030. O LWW depende de relógio e perde escritas. Quem detecta a concorrência é o vetor de versão.");
  tf("t2", 6, 2, "Dois vetores de versão, {SP:2, Rec:0} e {SP:1, Rec:1}, mostram que as escritas foram concorrentes.", true, "Nenhum domina o outro em todas as posições: SP é maior num e Recife no outro, então nenhuma escrita viu a outra.");
  choice("t2", 7, 3, "O cabo de SP falha, mas o primário continua vivo e o Rio é promovido. Como se chama o problema e uma contenção?", [
    "Lag; aumentar o ttl.",
    "Split brain; fencing ou replicação síncrona (o primário isolado trava em SyncRep).",
    "Deadlock; um mutex.",
    "Cache stampede; um TTL maior."
  ], 1, "Dois primários vivos são o split brain. O Patroni derruba o líder que não renova a chave em 30 s, e a replicação síncrona faz o isolado esperar confirmação que nunca vem.");
  order("t2", 8, 2, "Ponha na ordem o que acontece quando o primário de SP cai (Patroni).", [
    "O primário para de renovar a chave",
    "O ttl de 30 s expira",
    "A réplica mais à frente no log (o Rio) é eleita com quórum de 2 em 3",
    "pg_ctl promote: a linha do tempo passa de 1 para 2",
    "A aplicação reconecta ao novo primário (RTO de ~35 s)"
  ], "Sem renovar a chave, o ttl expira e começa o failover: o Rio, mais à frente no log, vence a eleição e é promovido. Com 5 s para promover e reconectar, o RTO é de 35 s.");

  /* ---------- 3. Síncrona, assíncrona, semi-síncrona e por logs ---------- */
  choice("t3", 1, 2, "Com commit local de 2 ms, RTT de 10 ms ao Rio e 80 ms a Recife, qual é o commit na síncrona (Rio e Recife)?", [
    "2 ms.",
    "12 ms.",
    "82 ms.",
    "92 ms."
  ], 2, "2 + máx(10, 80) = 82 ms: as duas esperas acontecem ao mesmo tempo, vale a maior.");
  choice("t3", 2, 2, "E na semi-síncrona esperando só o Rio, e quantos commits por segundo dá uma conexão?", [
    "12 ms e 83 commits/s.",
    "2 ms e 500 commits/s.",
    "82 ms e 12 commits/s.",
    "10 ms e 100 commits/s."
  ], 0, "2 + 10 = 12 ms, 1.000 ÷ 12 = 83 por segundo. A assíncrona dá 500 e a síncrona 12.");
  choice("t3", 3, 3, "A Lena fecha o 1055 às 20:10:00.000, com Recife 800 ms atrás, e abre \"meus pedidos\" às 20:10:00.300. O que vê?", [
    "O 1055, porque o primário confirmou às .002.",
    "O 1054 como último pedido: o 1055 só chega a Recife às 20:10:00.802.",
    "Um erro, porque a réplica não responde.",
    "Os dois pedidos, 1054 e 1055."
  ], 1, "A tela lê da réplica de Recife, que ainda não aplicou o log do 1055. É o read-your-writes que falta.");
  choice("t3", 4, 2, "Qual destes NÃO é um dos três consertos para a Lena ver o próprio pedido?", [
    "Ler do primário por alguns segundos depois de escrever.",
    "Levar o token (LSN do commit) e só ler da réplica quando o replay_lsn passar dele.",
    "Usar remote_apply para o commit esperar a réplica aplicar.",
    "Aumentar o TTL do cache."
  ], 3, "Os três são: primário por um tempo (+80 ms), token de LSN e remote_apply. Cache com TTL maior só deixaria o passado por mais tempo.");
  choice("t3", 5, 3, "Com o replay pausado em Recife, o primário deu pg_current_wal_lsn() = 0/8004430 e a réplica tem pg_last_wal_replay_lsn() = 0/8000060. O que devolve replay_lsn >= token?", [
    "t: a réplica já tem o pedido.",
    "f: a aplicação manda a leitura ao primário.",
    "Um erro de sintaxe.",
    "NULL, porque o replay está pausado."
  ], 1, "0/8000060 é menor que 0/8004430: a réplica recebeu o log, mas ainda não o aplicou. O f diz à aplicação para ler do primário.");
  choice("t3", 6, 2, "O que dá a leitura em dia na replicação síncrona do PostgreSQL?", [
    "synchronous_commit = on, o padrão.",
    "synchronous_commit = off.",
    "synchronous_commit = remote_apply.",
    "Nenhum: nunca dá."
  ], 2, "No padrão (on) a réplica só gravou o log em disco. Com remote_apply ela já aplicou: o dado é visível lá.");
  choice("t3", 7, 3, "A semi-síncrona do MariaDB não recebe ack por mais de 10.000 ms. O que o primário faz?", [
    "Trava todos os commits.",
    "Volta a ser assíncrono, sem erro.",
    "Derruba a réplica e promove outra.",
    "Repete o commit até receber."
  ], 1, "Depois do rpl_semi_sync_master_timeout o primário reverte para a replicação assíncrona e a garantia some. O PostgreSQL espera, e o INSERT fica em SyncRep.");
  tf("t3", 8, 2, "O artigo diz que a síncrona se faz com two-phase commit, e os bancos reais a fazem assim.", false, "O PostgreSQL espera o ack de réplicas escolhidas (FIRST n ou ANY n). O 2PC é outra coisa: coordenar uma transação entre vários participantes.");

  /* ---------- 4. Event-Carried State Transfer ---------- */
  choice("t4", 1, 1, "O que faz o Event-Carried State Transfer?", [
    "O evento leva o estado inteiro, e cada serviço guarda a sua cópia.",
    "O evento leva só o id, e o serviço busca o resto.",
    "Cada serviço consulta o banco do dono.",
    "Os serviços compartilham o mesmo banco."
  ], 0, "É o que evita a chamada de volta ao dono. O evento só com o id é o notification.");
  choice("t4", 2, 2, "O ClienteAtualizado com o estado inteiro tem 202 bytes. E o notification (evento_id, cliente_id, versao)?", [
    "56 bytes, mais um GET de volta ao clientes.",
    "202 bytes, mais um GET.",
    "56 bytes e nenhuma chamada.",
    "10 bytes."
  ], 0, "O notification é bem menor, mas obriga o consumidor a chamar o dono. O estado inteiro tem 202 B e dispensa a chamada.");
  choice("t4", 3, 2, "O que o tópico compactado (cleanup.policy=compact) guarda?", [
    "Todos os eventos para sempre.",
    "O último valor de cada chave.",
    "Só os últimos 7 dias.",
    "Só os eventos de apagar."
  ], 1, "Com chave cliente_id, o tópico guarda a última versão de cada cliente. Um consumidor novo lê do início e monta a sua cópia.");
  choice("t4", 4, 3, "O tópico tem 1,5 milhão de clientes e um consumidor novo lê 20.000 eventos por segundo. Quanto leva para montar a cópia?", [
    "7,5 s.",
    "75 s.",
    "750 s.",
    "20 s."
  ], 1, "1.500.000 ÷ 20.000 = 75 s.");
  choice("t4", 5, 3, "O entregas recebe a v9 (Rua do Sol, 200) e depois a v8 (Rua da Aurora, 100). Aplicando às cegas, qual endereço fica?", [
    "Rua do Sol, 200 (v9).",
    "Rua da Aurora, 100 (v8): o velho.",
    "Os dois, juntos.",
    "Nenhum."
  ], 1, "O último a chegar sobrescreve. Com a regra \"aplica só se a versao for maior\", a v8 seria descartada e ficaria a v9.");
  tf("t4", 6, 2, "Com 4 cópias de 750 MB (o dono e 3 consumidores), o custo é de 3,0 GB, quatro vezes o de uma cópia.", true, "É o preço do padrão: armazenamento multiplicado, consistência eventual e a ordem dos eventos para cuidar.");

  /* ---------- 5. CDC: Change Data Capture ---------- */
  choice("t5", 1, 1, "Qual destes é um jeito de fazer CDC?", [
    "Gatilho, consulta periódica ou leitura do log.",
    "Só consulta periódica.",
    "Só replicação síncrona.",
    "Copiar o banco inteiro toda hora."
  ], 0, "Os três jeitos da aula. Só a leitura do log tem todas as mudanças, na ordem.");
  choice("t5", 2, 3, "O polling roda a cada 5 s. O 1055 sofre um INSERT (criado) e, 3 s depois, um UPDATE (pago). O que o polling vê?", [
    "Dois registros, criado e pago.",
    "Um só: o pago.",
    "Nenhum.",
    "O criado, só."
  ], 1, "Entre duas consultas só existe o estado final. O CDC por log vê o INSERT e o UPDATE.");
  choice("t5", 3, 2, "Com REPLICA IDENTITY DEFAULT, o que o DELETE traz no log?", [
    "A linha inteira.",
    "Só a chave.",
    "Nada.",
    "Só o valor novo."
  ], 1, "O DEFAULT leva a chave; o UPDATE traz só o valor novo. Com REPLICA IDENTITY FULL, o DELETE traz a linha inteira e o UPDATE traz old-key.");
  choice("t5", 4, 2, "Qual é o nome do tópico do Debezium, e o que significa op = r?", [
    "topic.prefix.schema.tabela (loja.public.pedidos); r é leitura do snapshot.",
    "pedidos.loja; r é replicação.",
    "loja.pedidos; r é remoção.",
    "topic.prefix; r é retry."
  ], 0, "O tópico é prefixo, esquema e tabela. As linhas do snapshot inicial saem com op r; c, u e d são criar, atualizar e apagar.");
  choice("t5", 5, 3, "O pedidos grava o 1055 às 20:10:00.000 e cai às 20:10:00.004, antes de publicar PedidoCriado. Quanto fica o estoque da caneca?", [
    "36, como deveria.",
    "37: ninguém baixou o estoque.",
    "35.",
    "0."
  ], 1, "É a escrita dupla. Com outbox, o pedido e o aviso nascem na mesma transação e o CDC publica o aviso do log.");
  choice("t5", 6, 3, "Um slot de replicação sem consumidor, com 1 KB de WAL por pedido a 30 pedidos/s e 60 GB livres. Em quanto tempo o disco acaba?", [
    "Cerca de 23 dias.",
    "Cerca de 23 horas.",
    "Cerca de 23 minutos.",
    "Nunca."
  ], 0, "30 × 1 KB × 3.600 s = 108 MB/h, e 60.000 MB ÷ 108 = 555 h, cerca de 23 dias. Monitore pg_replication_slots e limite com max_slot_wal_keep_size.");
  tf("t5", 7, 2, "O medido nesta aula foram 335 bytes de WAL por pedido (1 INSERT, 1 UPDATE e 1 COMMIT).", true, "6.709.592 bytes ÷ 20.000 pedidos = 335 B por pedido; a 30 pedidos/s são 10 KB/s, 36 MB/h.");

  /* ---------- 6. CRDTs ---------- */
  choice("t6", 1, 1, "Que propriedades tem a junção de um CRDT?", [
    "Comutativa, associativa e idempotente.",
    "Só comutativa.",
    "Ordenada e atômica.",
    "Síncrona e bloqueante."
  ], 0, "Por isso a ordem e as repetições não mudam o resultado: o teste com 120 permutações deu sempre o mesmo estado.");
  choice("t6", 2, 3, "O G-Counter das visualizações está em {SP: 135, Rio: 80, Recife: 58} depois da partição. Qual é o total depois da junção?", [
    "265.",
    "258.",
    "273.",
    "250."
  ], 2, "A junção é o máximo por site: 135 + 80 + 58 = 273. O LWW sobre o total daria 265 ou 258.");
  choice("t6", 3, 3, "O carrinho {caneca}: o celular (Recife) adiciona o gato e o notebook (SP) remove a caneca, na partição. Qual é o carrinho depois da junção?", [
    "{caneca}.",
    "{caneca, gato}.",
    "{gato}.",
    "{}."
  ], 2, "As duas intenções valem: gato entra, caneca sai. Se um lado removesse e o outro adicionasse a caneca ao mesmo tempo, ela ficaria (add vence).");
  choice("t6", 4, 3, "O estoque da caneca é 1. SP e Recife vendem 1 cada um na partição. O que a junção do PN-Counter dá?", [
    "0.",
    "1.",
    "−1.",
    "Um erro."
  ], 2, "Cada site vê 0 e vende; a junção soma as duas vendas: −1. Convergiu e violou \"estoque ≥ 0\".");
  tf("t6", 5, 2, "O CRDT garante que o resultado da junção faz sentido para o negócio.", false, "Garante convergência. O estoque −1 é a prova: para o último item vale o módulo 11 (um único dono) ou o módulo 19 (compensação).");
  choice("t6", 6, 3, "Qual é o próximo problema da loja, depois deste módulo?", [
    "Mandar e-mails mais rápido.",
    "A tela \"meus pedidos\" ainda lê da mesma tabela em que o checkout escreve: falta separar o modelo de escrita do de leitura (CQRS, módulo 18).",
    "Trocar o PostgreSQL por outro banco.",
    "Escolher uma CDN."
  ], 1, "A loja copia dado de todos os jeitos. Falta ler de uma cópia montada só para leitura, alimentada por CDC: é o módulo 18.");

  window.QUIZ = out;
})();
