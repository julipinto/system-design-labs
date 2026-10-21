/* Banco de perguntas do quiz de CQRS.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução ao CQRS" },
    t2: { topic: "aula-2-modelos-de-dominio-no-contexto-do-cqrs", name: "Modelos de domínio no contexto do CQRS" },
    t3: { topic: "aula-3-views-materializadas", name: "Views materializadas" },
    t4: { topic: "aula-4-read-replicas", name: "Read replicas" },
    t5: { topic: "aula-5-consistencia-eventual", name: "Consistência eventual" },
    t6: { topic: "aula-6-combinacao-de-sql-e-nosql", name: "Combinação de SQL e NoSQL" },
    t7: { topic: "aula-7-modelos-distribuidos", name: "Modelos distribuídos" },
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

  /* ---------- 1. Introdução ao CQRS ---------- */
  choice("t1", 1, 1, "O que o CQRS separa?", [
    "O banco de dados em vários servidores, um por cliente.",
    "Quem muda o estado (comandos) de quem lê (consultas), em modelos diferentes.",
    "O front-end do back-end.",
    "Os pedidos pagos dos pedidos cancelados."
  ], 1, "Separar o banco por cliente é o sharding do módulo 16. O CQRS separa os modelos de escrita e de leitura, cada um do tamanho do seu trabalho.");
  choice("t1", 2, 2, "Qual destes é um comando e qual é uma consulta, na loja?", [
    "CriarPedido é consulta; meus pedidos é comando.",
    "CriarPedido é comando; meus pedidos é consulta.",
    "Os dois são comandos.",
    "Os dois são consultas."
  ], 1, "O comando CriarPedido muda estado (e pode falhar por regra). A consulta 'os últimos 10 pedidos de lena-77' só devolve dado.");
  tf("t1", 3, 2, "O CQRS exige dois bancos de dados.", false, "Exige dois modelos. Podem ser classes separadas, uma view no mesmo banco ou um banco separado alimentado por eventos.");
  choice("t1", 4, 3, "A consulta da tela custa 0,23 a 0,31 ms no modelo normalizado, com índice. Qual é a leitura certa para a loja?", [
    "Separar os modelos só por causa dessa consulta, para ganhar velocidade.",
    "O JOIN por cliente não é o problema: separar só por isso seria complexidade sem ganho; os problemas reais são juntar serviços e o relatório.",
    "Trocar o PostgreSQL por um banco NoSQL.",
    "Ignorar o relatório das 23:00."
  ], 1, "Com 0,3 ms, a tela não precisa do CQRS. O aviso de Fowler vale: para a maioria dos sistemas, ele acrescenta complexidade arriscada.");
  choice("t1", 5, 2, "CQRS é a mesma coisa que event sourcing?", [
    "Sim: os dois guardam eventos.",
    "Não: event sourcing guarda os eventos como a verdade (módulo 20); CQRS só separa os modelos.",
    "Sim, mas só no PostgreSQL.",
    "Não: event sourcing separa o banco em shards."
  ], 1, "Um sistema pode ter CQRS sem event sourcing, e o contrário. Os READMEs do laboratório do autor usam 'event sourcing' para o que é CQRS com eventos.");

  /* ---------- 2. Modelos de domínio ---------- */
  choice("t2", 1, 1, "Qual é a forma de cada modelo?", [
    "Escrita desnormalizada e leitura normalizada.",
    "Escrita normalizada e rica em regras; leitura desnormalizada e do formato da resposta.",
    "Os dois normalizados.",
    "Os dois desnormalizados."
  ], 1, "A escrita protege o dado (normalizado, regras, transação). A leitura repete o dado onde a tela precisa e não tem regra.");
  choice("t2", 2, 2, "Quais validações o CriarPedido do 1056 faz antes de gravar?", [
    "Nenhuma: grava e a regra vem depois.",
    "Cliente, produto 42 ativo, preço vigente (79,90), estoque e frete de Recife (15,00).",
    "Só o frete.",
    "Só o pagamento."
  ], 1, "Só depois dessas validações o comando grava pedidos e itens_pedido numa transação, e o estoque passa a 19 (gato) e 35 (caneca).");
  tf("t2", 3, 2, "O modelo de leitura precisa repetir as regras do comando para não mostrar dado errado.", false, "As regras já foram aplicadas antes de o dado entrar. Repetir cria uma segunda cópia da regra, que um dia diverge.");
  choice("t2", 4, 3, "Alguém põe 'pedido cancelado não aparece' também no modelo de leitura. Meses depois o comando muda a regra e ninguém lembra do outro lado. O que acontece?", [
    "Nada: o modelo de leitura se atualiza sozinho.",
    "Os dois lados divergem, e a Lena vê um pedido que o checkout já recusou: a regra mora só no comando.",
    "O banco recusa a escrita.",
    "A tela fica mais rápida."
  ], 1, "É a regra duplicada. A consulta mostra o que lhe chegou; quem decide é o comando.");
  choice("t2", 5, 2, "Por que o modelo de leitura não precisa escutar o catalogo?", [
    "Porque o catálogo nunca muda.",
    "Porque o evento leva nome e preço da época dos itens: o pedido guarda o que foi pago, não o preço de hoje.",
    "Porque o catálogo está no mesmo servidor.",
    "Porque a tela não mostra o nome do produto."
  ], 1, "O PedidoCriado traz nome e preço no momento da compra. O documento guarda isso, e a Lena vê o que pagou.");

  /* ---------- 3. Views materializadas ---------- */
  choice("t3", 1, 1, "O que é uma view materializada do PostgreSQL?", [
    "Uma consulta que roda de novo a cada leitura.",
    "O resultado de uma consulta guardado numa tabela, que só se atualiza com REFRESH.",
    "Uma réplica do banco em outro servidor.",
    "Um índice sobre várias tabelas."
  ], 1, "A view comum recalcula a cada leitura. A materializada guarda o resultado e só sabe o que sabia no último REFRESH.");
  choice("t3", 2, 2, "No banco de teste, o relatório levou ~235 ms e a leitura da view, 0,021 ms. Qual é a razão aproximada?", [
    "10×.",
    "100×.",
    "Cerca de 11.000×.",
    "1.000.000×."
  ], 2, "235 ÷ 0,021 ≈ 11.190: a view lê 5 linhas prontas em vez de varrer 300 mil.");
  choice("t3", 3, 3, "Um leitor chega enquanto um REFRESH simples roda. O que mediu o teste?", [
    "O leitor leu a versão antiga sem esperar.",
    "O leitor esperou 2.285 ms em wait_event_type = Lock; com CONCURRENTLY, esperou 12 ms.",
    "O leitor recebeu um erro na hora.",
    "O leitor esperou 12 ms nos dois casos."
  ], 1, "O REFRESH simples tranca a view e bloqueia quem lê. O CONCURRENTLY monta a nova versão ao lado e exige um índice único.");
  tf("t3", 4, 2, "A tabela vw_prescricoes_medicamentos_detalhadas do artigo é uma view materializada do PostgreSQL.", false, "É uma tabela desnormalizada carregada com INSERT … SELECT. A view materializada do PostgreSQL é refeita por inteiro com REFRESH.");
  choice("t3", 5, 3, "O REFRESH da view roda às 23:00. A Lena faz o 1056 às 20:12. Quanto tempo o pedido fica fora da view?", [
    "74 ms.",
    "2 h 48 min.",
    "10 min.",
    "Nunca entra."
  ], 1, "A view só sabe o que sabia no último REFRESH: do 1056, às 20:12, até as 23:00 são 2 h 48 min. Por isso ela serve ao relatório, não à tela da Lena.");

  /* ---------- 4. Read replicas ---------- */
  choice("t4", 1, 1, "O que a réplica de leitura dá e o que ela não dá?", [
    "Dá formato de tela; não dá capacidade.",
    "Dá capacidade e proximidade; não dá formato de tela nem isolamento de consulta pesada.",
    "Dá tudo isso e consistência forte.",
    "Não dá nada, só copia o dado."
  ], 1, "A réplica copia o mesmo esquema: o JOIN continua, só que em outro servidor, perto de quem lê.");
  choice("t4", 2, 2, "Qual erro a consulta longa recebe quando é cancelada na réplica?", [
    "deadlock detected.",
    "canceling statement due to conflict with recovery.",
    "connection refused.",
    "out of memory."
  ], 1, "O primário limpou linhas que a consulta ainda precisava ver, e a réplica a cancelou depois do max_standby_streaming_delay.");
  choice("t4", 3, 3, "No teste com max_standby_streaming_delay = 1s, a consulta de 6 s morreu aos 3,16 s. O padrão é 30 s. O que acontece com o relatório de ~40 s da loja?", [
    "Termina normalmente.",
    "É cancelado: passa dos 30 s de tolerância.",
    "Fica 10× mais rápido.",
    "É redirecionado ao primário."
  ], 1, "40 s é maior que o padrão de 30 s, então o relatório seria cancelado na réplica.");
  choice("t4", 4, 3, "Qual é o custo do hot_standby_feedback como conserto do cancelamento?", [
    "A réplica deixa de aceitar leitura.",
    "O primário não limpa as linhas velhas que a réplica ainda lê: a tabela incha.",
    "A consulta fica mais lenta que o relatório.",
    "Nenhum custo."
  ], 1, "O outro conserto, subir o max_standby_streaming_delay, deixa a réplica mais atrás do primário.");
  tf("t4", 5, 2, "A réplica resolve o problema de a Lena não ver o próprio pedido.", false, "O atraso do módulo 17 (800 ms em Recife) volta: a réplica ainda não aplicou o 1056.");

  /* ---------- 5. Consistência eventual ---------- */
  choice("t5", 1, 1, "Quanto leva, num dia comum, do commit do 1056 ao modelo de leitura?", [
    "~4 ms.",
    "~74 ms.",
    "~2 s.",
    "~74 s."
  ], 1, "Commit 4 ms, CDC +30 ms, Kafka +10 ms, consumidor +20 ms e upsert +10 ms: ~74 ms. O relay do laboratório, com poll de 2 s, soma 1 s em média.");
  choice("t5", 2, 2, "Qual destes NÃO é um jeito de a Lena ver o próprio pedido?", [
    "A resposta do comando traz o pedido (201 com o documento).",
    "Um token de versão (GET /meus-pedidos?min_versao=8).",
    "A tela mostra o pedido como 'processando' até o modelo alcançar.",
    "Apagar o modelo de leitura e ler só do cache."
  ], 3, "Apagar o modelo de leitura não resolve nada. Os três jeitos são: resposta do comando, token de versão e 'processando'.");
  choice("t5", 3, 3, "A Black Friday gera 120 eventos/s, e cada instância do projetor faz 100/s. Com 1 instância, qual é o atraso em 10 minutos?", [
    "Nenhum.",
    "12.000 eventos, ou 120 s, e só cresce.",
    "2 s.",
    "24.000 eventos."
  ], 1, "Déficit de 20/s × 600 s = 12.000 eventos; 12.000 ÷ 100/s = 120 s. Com 3 instâncias a capacidade é 300/s e o uso, 40%.");
  choice("t5", 4, 3, "Uma das 3 instâncias cai por 10 min (40 eventos/s por partição). Quanto leva para drenar ao voltar?", [
    "60 s.",
    "400 s (6 min 40 s).",
    "10 min.",
    "Nunca drena."
  ], 1, "Acumulou 40 × 600 = 24.000 eventos; drena a 100 − 40 = 60/s: 24.000 ÷ 60 = 400 s. Só os clientes daquela partição veem a tela atrasada.");
  choice("t5", 5, 3, "O handler do laboratório faz INSERT na view sem ON CONFLICT. O que acontece se a mensagem for reentregue?", [
    "A linha é ignorada.",
    "A linha é duplicada: o 1056 apareceria duas vezes.",
    "O banco derruba o handler.",
    "O Kafka descarta a mensagem."
  ], 1, "O conserto é a idempotência: aplicar só se a versao for maior, ou guardar o evento_id dos já aplicados.");

  /* ---------- 6. Combinação de SQL e NoSQL ---------- */
  choice("t6", 1, 1, "Por que a leitura pode viver num armazenamento NoSQL?", [
    "Porque o NoSQL é sempre mais rápido.",
    "Porque a leitura não precisa de transação nem de JOIN: um documento por cliente é uma leitura por chave.",
    "Porque o NoSQL guarda regras de negócio.",
    "Porque o SQL não aceita JSON."
  ], 1, "A regra e a transação ficam no modelo de escrita. A leitura só precisa do formato exato da resposta.");
  choice("t6", 2, 2, "Quanto pesa o documento da Lena com os 8 pedidos, e quanto pesa só o 1056?", [
    "187 B e 25 B.",
    "1.787 B e 253 B.",
    "17.870 B e 2.530 B.",
    "1.787 B e 1.787 B."
  ], 1, "A média é 223 B por pedido; o 1056, com pagamento e rastreio nulos, tem 253 B.");
  choice("t6", 3, 2, "Quanto armazenamento o modelo de leitura ocupa para 1,5 milhão de clientes, 10 pedidos cada e 223 B por pedido?", [
    "335 MB.",
    "3,35 GB.",
    "33,5 GB.",
    "335 GB."
  ], 1, "1,5 M × 10 × 223 B ≈ 3,35 GB, contra 100 GB + 40% de índices da tabela pedidos de 50 milhões de linhas.");
  choice("t6", 4, 3, "O PedidoEnviado (rastreio) chega antes do PedidoCriado. O que o projetor precisa fazer?", [
    "Descartar o evento.",
    "Fazer upsert parcial e controlar a concorrência (if_seq_no e if_primary_term).",
    "Esperar o dia seguinte.",
    "Recriar o índice."
  ], 1, "Um update em documento que não existe falha. O upsert parcial cria o documento só com o que o evento sabe e completa depois.");
  tf("t6", 5, 3, "Se o mapping de um campo já criado precisa mudar de tipo, basta alterar o campo no mesmo índice.", false, "É preciso criar um índice novo e reindexar tudo a partir da fonte.");

  /* ---------- 7. Modelos distribuídos ---------- */
  choice("t7", 1, 1, "Qual é a disponibilidade da tela composta por 4 serviços a 99,9% cada?", [
    "99,9%.",
    "99,6006%.",
    "99,0%.",
    "99,99%."
  ], 1, "0,999⁴ = 99,6006%, ou 172,5 min/mês fora. Um armazenamento só a 99,9% dá 43,2 min/mês.");
  choice("t7", 2, 2, "O serviço pagamentos cai. O que mostra a tela do modelo de leitura?", [
    "Um erro 500.",
    "O último status que conhece, em vez de 'indisponível'.",
    "Nada: a tela fica em branco.",
    "Os pedidos de ontem."
  ], 1, "O documento já tem o último status. A tela composta falha ou mostra 'status indisponível'.");
  choice("t7", 3, 2, "Quais eventos montam o documento do pedido 1056?", [
    "PedidoCriado, PedidoPago e PedidoEnviado, de pedidos, pagamentos e entregas.",
    "Só PedidoCriado.",
    "EstoqueReservado e PedidoEnviado.",
    "Os eventos do catalogo."
  ], 0, "Três tópicos, um projetor, um armazenamento. O catalogo não entra: o evento já leva nome e preço da época.");
  choice("t7", 4, 3, "O documento do 1056 tem pagamento e rastreio, mas não tem itens. Qual é o problema e a defesa?", [
    "Pedido fantasma: o PedidoCriado se perdeu; um verificador chama GET /pedidos/1056 para completar.",
    "Pedido duplicado; apagar um deles.",
    "Pedido cancelado; ignorar.",
    "Pedido pago em dobro; estornar."
  ], 0, "O verificador reconcilia os documentos sem itens há mais de 5 min.");
  tf("t7", 5, 2, "O modelo por eventos tem consistência eventual multiplicada: cada fonte tem o seu atraso.", true, "Por isso o projetor guarda a versao por fonte e faz upsert parcial por pedido_id.");

  /* ---------- 8. Dual-write pattern ---------- */
  choice("t8", 1, 1, "Por que a escrita dupla (banco + broker) não é atômica?", [
    "Porque o banco não aceita transação.",
    "Porque são duas escritas em dois sistemas: a transação do banco não cobre o broker.",
    "Porque o Kafka é lento.",
    "Porque o JSON é grande."
  ], 1, "Uma das duas pode falhar sem a outra. Atômico de verdade exigiria two-phase commit, que o Kafka não oferece.");
  choice("t8", 2, 2, "O banco grava o 1056 e o broker está fora. O que acontece?", [
    "O 1056 aparece em dobro.",
    "O pedido existe, o evento nunca sai, e o 1056 não chega a 'meus pedidos'.",
    "O banco desfaz o pedido sozinho.",
    "O broker guarda o evento até voltar."
  ], 1, "É a Falha 1. O módulo 17 já mostrou o estoque ficando em 36 em vez de 35.");
  choice("t8", 3, 2, "Com 0,1% de falha na publicação e 30 pedidos/s, quantos pedidos por hora ficam no banco sem evento?", [
    "3.",
    "108.",
    "1.080.",
    "10.800."
  ], 1, "30 × 3.600 × 0,001 = 108 pedidos por hora, e nunca chegam ao modelo de leitura.");
  choice("t8", 4, 3, "O handler.go do laboratório (hospital-cqrs-sql) publica depois do commit. Se a publicação falha, o que faz?", [
    "Desfaz o pedido e devolve erro.",
    "Só loga 'AVISO' e devolve sucesso, sem republicar.",
    "Tenta de novo 5 vezes.",
    "Grava o evento numa fila de erros."
  ], 1, "Lido no código: o comentário diz que o evento 'poderá ser republicado posteriormente', mas nada o faz.");
  tf("t8", 5, 3, "O 'padrão Dual-Write' do artigo, com BEGIN … publica … COMMIT e rollback, torna as duas escritas atômicas.", false, "O rollback do banco não recolhe o evento já publicado, e a transação aberta segura locks. É o problema, não a solução.");

  /* ---------- 9. CDC ---------- */
  choice("t9", 1, 1, "Como o CDC resolve a escrita dupla?", [
    "A aplicação publica duas vezes.",
    "O evento sai do log do banco, que só tem o que foi confirmado; a aplicação não publica nada.",
    "O Kafka passa a ser o banco principal.",
    "O CDC grava no banco e no Kafka ao mesmo tempo."
  ], 1, "Não há mais pedido sem evento nem evento sem pedido. E, se o Kafka cair, a aplicação continua.");
  choice("t9", 2, 2, "No CDC com Debezium, o que o campo op = u significa?", [
    "A linha foi criada.",
    "A linha foi atualizada.",
    "A linha foi apagada.",
    "Leitura do snapshot inicial."
  ], 1, "c = criou, u = atualizou, d = apagou, r = leitura do snapshot inicial.");
  choice("t9", 3, 3, "O handler do laboratório processa só c e r. O que acontece quando o 1056 passa de criado para pago?", [
    "A tela atualiza.",
    "O evento (op = u) é ignorado, e a tela fica em criado para sempre.",
    "O Debezium reenvia como c.",
    "O banco recusa o UPDATE."
  ], 1, "Lido no código: para qualquer op diferente de c ou r, o handler só loga 'Ignorando operação' e volta.");
  choice("t9", 4, 3, "O handler do laboratório consulta o banco de escrita (getMedico, getPaciente…) para completar a linha. Qual é o problema?", [
    "É mais lento só uma vez.",
    "O lado da leitura volta a depender do lado da escrita, o que o CQRS queria separar.",
    "O banco de escrita não permite leitura.",
    "Nenhum: é o jeito certo."
  ], 1, "Cada evento custa mais consultas ao banco de escrita, e se ele cai a leitura para.");
  tf("t9", 5, 2, "O CDC entrega um evento de negócio (PedidoCriado) já pronto.", false, "Entrega um evento técnico: uma linha mudou. O PedidoCriado de negócio, com itens e preço da época, vem da outbox.");

  /* ---------- 10. Transactional Outbox ---------- */
  choice("t10", 1, 1, "O que a outbox transacional faz?", [
    "Publica no Kafka e depois grava no banco.",
    "Grava o evento numa tabela do mesmo banco, na mesma transação do pedido: ou os dois entram, ou nenhum.",
    "Apaga os eventos depois de 7 dias.",
    "Troca o Kafka por uma fila no banco."
  ], 1, "Provado com test_decoding: uma só transação (BEGIN 832 … COMMIT 832), e o ROLLBACK não deixou nada.");
  choice("t10", 2, 2, "Quais são os dois jeitos de levar a outbox ao broker?", [
    "Relay (poll de 2 s no laboratório) ou CDC lendo a própria tabela outbox (Outbox Event Router).",
    "Só o relay.",
    "Só o CDC.",
    "Cópia manual toda noite."
  ], 0, "O CDC lendo a outbox tira o poll: a latência cai de até 2 s para milissegundos.");
  choice("t10", 3, 3, "O relay publica o PedidoCriado e cai antes de marcá-lo como processado. O que acontece ao voltar?", [
    "O evento se perde.",
    "O evento é publicado de novo: entrega pelo menos uma vez; o consumidor tem de ser idempotente.",
    "O relay descarta o evento.",
    "O banco desfaz o pedido."
  ], 1, "No laboratório, processarEvento publica (linha 138) e só depois chama marcarProcessado (linha 154). O handler do laboratório não é idempotente.");
  choice("t10", 4, 3, "Quanto a outbox aumenta o WAL por pedido, medido?", [
    "Quase nada.",
    "De 5,3× (relay apaga) a 7,6× (relay marca com UPDATE): de 359,6 B para 1.916,8 B ou 2.735,8 B.",
    "Cerca de 100×.",
    "Reduz o WAL pela metade."
  ], 1, "A 30 pedidos/s são 57,5 KB/s (apagando) ou 82,1 KB/s (UPDATE): 207 a 295,5 MB por hora.");
  order("t10", 5, 3, "Coloque na ordem o que acontece com a outbox e o relay, do pedido ao modelo de leitura:", [
    "O comando grava o pedido e o evento na mesma transação (COMMIT).",
    "O relay (ou o CDC) lê a outbox.",
    "O evento é publicado no Kafka, com o pedido_id como chave.",
    "O projetor aplica o evento no documento, se a versao for maior."
  ], "É a cadeia da aula: transação única, leitura da outbox, publicação ordenada pela chave e aplicação idempotente.");

  window.QUIZ = out;
})();
