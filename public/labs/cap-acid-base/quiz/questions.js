/* Banco de perguntas do quiz de Teorema CAP, ACID e BASE.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (answer = "cp", "ap" ou "ca"), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-teorema-cap", name: "Teorema CAP" },
    t2: { topic: "aula-2-modelo-acid", name: "Modelo ACID" },
    t3: { topic: "aula-3-modelo-base", name: "Modelo BASE" },
    t4: { topic: "aula-4-componentes-do-cap", name: "Componentes do CAP" },
    t5: { topic: "aula-5-combinacoes-do-cap", name: "Combinações CP, AP e CA" },
    t6: { topic: "aula-6-criticas-modernas", name: "Críticas modernas ao CAP" },
    t7: { topic: "aula-7-teorema-pacelc", name: "Teorema PACELC" }
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

  /* ---------- 1. Teorema CAP ---------- */
  choice("t1", 1, 1, "O que o teorema CAP diz sobre uma partição de rede num sistema replicado?", [
    "Dá para ter consistência e disponibilidade juntas, desde que o hardware seja bom.",
    "É preciso escolher entre consistência e disponibilidade enquanto durar a partição.",
    "O sistema precisa parar por completo até a rede voltar.",
    "As réplicas passam a ser consistentes automaticamente."
  ], 1, "Durante a partição, um sistema replicado não consegue ao mesmo tempo responder a todo pedido e garantir o dado mais novo.");
  choice("t1", 2, 1, "Quem propôs a ideia do CAP, e em que ano?", [
    "Daniel Abadi, em 2010.",
    "Martin Kleppmann, em 2015.",
    "Eric Brewer, em 2000.",
    "Edgar Codd, em 1970."
  ], 2, "Brewer apresentou a ideia em 2000. Gilbert e Lynch a provaram formalmente em 2002. Abadi propôs o PACELC em 2010.");
  tf("t1", 3, 1, "Numa partição de rede, os servidores do outro lado estão desligados.", false,
    "Partição é quando os nós estão vivos mas não conseguem trocar mensagens. Cada lado acha que o outro sumiu.");
  choice("t1", 4, 2, "O cabo de Dublin cai. Um cliente de lá pede o último par de tênis e o sistema devolve erro 503 após 3.000 ms, enquanto São Paulo segue vendendo. O que o sistema escolheu?", [
    "Consistência, abrindo mão da disponibilidade em Dublin.",
    "Disponibilidade, abrindo mão da consistência.",
    "As duas, porque São Paulo respondeu.",
    "Nenhuma: o CAP não se aplica quando há erro."
  ], 0, "Recusar em Dublin evita vender duas vezes o mesmo par, mas o cliente de Dublin ficou sem resposta útil.");
  choice("t1", 5, 3, "Com a rede cortada, Dublin e São Paulo aceitam, cada um, a compra do último par (estoque 1, versão 7). Qual o risco?", [
    "Nenhum: as réplicas se corrigem sozinhas na hora.",
    "Os dois gravam estoque 0, versão 8: o mesmo par é vendido duas vezes.",
    "O estoque vai para 2.",
    "O banco de São Paulo apaga o de Dublin."
  ], 1, "Sem se falar, cada lado acha que tem o último par. A divergência só aparece quando a rede volta.");
  order("t1", 6, 2, "Coloque em ordem o que acontece na cena do último par.", [
    "O cabo cai e Dublin fica isolado.",
    "Chega um pedido do último par em Dublin.",
    "O sistema escolhe: recusar o pedido ou aceitá-lo.",
    "A rede volta e as réplicas se reconciliam."
  ], "Primeiro vem a partição, depois o pedido, depois a escolha do sistema e, no fim, a conciliação quando a rede volta.");
  tf("t1", 7, 2, "Sem partição de rede, o teorema CAP proíbe o sistema de ser consistente e disponível ao mesmo tempo.", false,
    "O trade-off do CAP vale durante a partição. Sem ela, nada impede de ter as duas coisas.");

  /* ---------- 2. Modelo ACID ---------- */
  choice("t2", 1, 2, "A Lia paga R$ 300 à fornecedora: débito na conta dela (1.000 para 700) e crédito na da fornecedora (500 para 800). O servidor cai entre os dois passos. O que a atomicidade garante?", [
    "O débito fica e o crédito se perde, para registrar o erro.",
    "As duas contas voltam ao estado inicial: 1.000 e 500, via rollback.",
    "O banco tenta o crédito para sempre, sem desfazer o débito.",
    "O saldo da fornecedora vira zero."
  ], 1, "Atomicidade é tudo ou nada: uma transação incompleta é desfeita por inteiro.");
  tf("t2", 2, 1, "O C do ACID e o C do CAP significam a mesma coisa.", false,
    "No ACID, consistência é respeitar as regras de integridade do banco. No CAP, é linearizabilidade: as réplicas parecem uma cópia só.");
  choice("t2", 3, 2, "T1 diminui o saldo de 1.000 para 700 mas não confirma. T2 lê 700. Depois T1 dá rollback e o saldo volta a 1.000. Que anomalia foi essa?", [
    "Dirty read.",
    "Non-repeatable read.",
    "Phantom.",
    "Lost update."
  ], 0, "T2 leu um valor não confirmado. Esse valor nunca existiu de verdade.");
  choice("t2", 4, 2, "T1 lê 1.000, T2 confirma 700 e T1 lê de novo, na mesma transação, e vê 700. Que anomalia é essa?", [
    "Dirty read.",
    "Non-repeatable read.",
    "Phantom.",
    "Lost update."
  ], 1, "A mesma linha deu valores diferentes dentro da mesma transação. É non-repeatable read. Phantom é quando aparecem linhas novas.");
  choice("t2", 5, 2, "T1 e T2 leem o saldo 1.000. T1 soma 200 e grava 1.200; T2 subtrai 300 e grava 700. Qual seria o saldo certo e qual anomalia ocorreu?", [
    "900, com lost update.",
    "700, sem anomalia.",
    "1.200, com dirty read.",
    "900, com phantom."
  ], 0, "1.000 + 200 - 300 = 900. O crédito de 200 de T1 foi sobrescrito: é lost update.");
  choice("t2", 6, 1, "O que garante a durabilidade depois de um COMMIT?", [
    "O banco anota a mudança no WAL, em disco, antes de confirmar.",
    "Guardar o dado só na memória, que é mais rápida.",
    "Repetir a consulta até dar certo.",
    "Pedir ao cliente para guardar uma cópia."
  ], 0, "O WAL é o diário do banco. Se a energia cair, ele relê o WAL ao ligar e recupera tudo o que foi confirmado.");
  choice("t2", 7, 2, "A mesma consulta (SOMA de lançamentos de hoje) devolve 2 linhas (R$ 300) e, minutos depois na mesma transação, 3 linhas (R$ 450) porque T2 inseriu um lançamento. Que anomalia é essa?", [
    "Dirty read.",
    "Lost update.",
    "Phantom.",
    "Atomicidade quebrada."
  ], 2, "O valor de uma linha não mudou: o conjunto de linhas ganhou uma linha nova. Isso é phantom.");
  order("t2", 8, 2, "Ordene os níveis de isolamento do menos para o mais rígido.", [
    "Read Uncommitted",
    "Read Committed",
    "Repeatable Read",
    "Serializable"
  ], "Quanto mais à direita, menos anomalias e mais custo. Serializable equivale a rodar as transações uma por vez.");

  /* ---------- 3. Modelo BASE ---------- */
  choice("t3", 1, 1, "O que significa BASE?", [
    "Basically Available, Soft state, Eventual consistency.",
    "Basic Atomicity, Safe state, Eventual commit.",
    "Backup, Availability, Storage, Encryption.",
    "Balanced, Atomic, Serializable, Eventual."
  ], 0, "BASE é o contraponto ao ACID: prefere ficar no ar e convergir depois a garantir sempre o mesmo dado.");
  choice("t3", 2, 1, "O que é soft state?", [
    "Um banco que nunca grava em disco.",
    "O estado pode mudar com o tempo sem nenhuma escrita nova, como réplicas convergindo ou um cache expirando.",
    "Um estado que nunca muda.",
    "Um banco com transações brandas."
  ], 1, "Soft state é estado em movimento: o valor pode ser ajustado sozinho enquanto as cópias se acertam.");
  choice("t3", 3, 2, "SP grava estoque 9, v8 em 2 ms. Dublin só recebe a cópia aos 190 ms. Um cliente lê o estoque em Dublin aos 50 ms. O que ele vê?", [
    "9, v8.",
    "Um erro, porque o dado ainda não chegou.",
    "10, v7: um stale read.",
    "0, v0."
  ], 2, "A réplica ainda não recebeu a escrita nova e devolve o valor antigo. Isso é um stale read.");
  tf("t3", 4, 2, "Consistência eventual garante que todas as réplicas convergem em no máximo 1 segundo.", false,
    "Ela só promete que, se as escritas pararem, as cópias acabam iguais. Não define o tempo, que pode crescer com falhas.");
  choice("t3", 5, 3, "SP e Dublin leem estoque 10 e vendem um par cada, e cada um grava 9. Com last-write-wins, o estoque fica 9. O que se perdeu?", [
    "Nada: o estoque certo é 9.",
    "Uma das duas vendas: o certo era 8.",
    "As duas vendas.",
    "O timestamp."
  ], 1, "Foram duas vendas, então o certo era 10 - 2 = 8. O LWW mantém só uma escrita e descarta a outra.");
  choice("t3", 6, 3, "As versões {SP:2, DUB:1} e {SP:1, DUB:2} de um vector clock estão em que relação?", [
    "A primeira é mais nova.",
    "A segunda é mais nova.",
    "São iguais.",
    "São concorrentes: nenhuma veio depois da outra, e há um conflito."
  ], 3, "Cada uma tem um contador maior em um nó diferente. O vector clock mostra que as escritas foram independentes.");
  choice("t3", 7, 3, "Estoque inicial 10. Num contador CRDT, SP registra 1 venda e Dublin registra 1 venda, offline. Ao juntar, qual o estoque?", [
    "9",
    "8",
    "10",
    "Depende de quem juntar primeiro."
  ], 1, "Cada nó conta só as próprias vendas e a junção soma: 2 vendas. 10 - 2 = 8, em qualquer ordem de junção.");

  /* ---------- 4. Componentes do CAP ---------- */
  choice("t4", 1, 1, "O que é consistência no CAP?", [
    "Respeitar as chaves estrangeiras do banco.",
    "Linearizabilidade: depois da escrita, toda leitura vê o valor novo, como se houvesse uma cópia só.",
    "Todos os servidores terem o mesmo hardware.",
    "Os dados ficarem sempre no disco."
  ], 1, "O C do CAP é sobre réplicas parecerem uma só. O C do ACID é sobre regras de integridade.");
  choice("t4", 2, 1, "O que é disponibilidade no CAP?", [
    "O servidor ter 99,9% de uptime no mês.",
    "Todo pedido a um nó que está de pé recebe uma resposta que não é erro.",
    "O banco ter backup.",
    "A resposta chegar em menos de 100 ms."
  ], 1, "A definição é sobre todo pedido a todo nó vivo. Não é uma meta de uptime e não fala de latência.");
  tf("t4", 3, 2, "Um erro 503 ou um timeout conta como resposta para a disponibilidade do CAP.", false,
    "A definição exige uma resposta que não seja erro. Recusar o pedido sacrifica a disponibilidade.");
  choice("t4", 4, 1, "O que é uma partição de rede?", [
    "Dividir uma tabela em pedaços (sharding).",
    "Nós vivos que não conseguem trocar mensagens, por perda ou atraso na rede.",
    "Um disco que falha.",
    "Um servidor que precisa de manutenção."
  ], 1, "Particionar dados (sharding) é outra coisa. Aqui a partição é da rede, não da tabela.");
  choice("t4", 5, 2, "Com N = 3 réplicas, qual combinação garante que a leitura cruza com pelo menos uma cópia que tem a escrita mais nova?", [
    "W = 1 e R = 1",
    "W = 1 e R = 2",
    "W = 2 e R = 2",
    "W = 0 e R = 1"
  ], 2, "A regra é R + W > N: 2 + 2 = 4 > 3. Com W = 1 e R = 2 a soma é 3, que não passa de 3.");
  choice("t4", 6, 3, "Com quorum W = 2 e R = 2, uma leitura toca a Virgínia (estoque 8, v9) e Dublin (estoque 9, v8). O que o sistema devolve?", [
    "9, v8, porque é o maior valor.",
    "8, v9, a versão mais nova.",
    "Os dois valores sem decidir.",
    "Um erro de conflito."
  ], 1, "A leitura por quorum escolhe a maior versão. Aqui é v9, com estoque 8.");
  tf("t4", 7, 1, "Na prática, tolerar partição (P) é uma escolha opcional de design em sistemas distribuídos.", false,
    "A rede falha, então a partição vai acontecer. O que se escolhe é o que fazer durante ela: recusar (C) ou responder (A).");
  tf("t4", 8, 2, "Um banco pode respeitar o C do ACID e ainda assim ter réplicas que discordam entre si.", true,
    "São propriedades diferentes. O C do ACID fala de regras de integridade, o C do CAP de as réplicas parecerem uma cópia só.");

  /* ---------- 5. Combinações do CAP ---------- */
  layer("t5", 1, 2, "Saldo da conta e transferências da Lia: o que a loja prefere na partição?", "cp",
    "Saldo errado é pior que um erro temporário. Prefere-se recusar (CP).");
  layer("t5", 2, 2, "Adicionar um item ao carrinho de compras durante uma partição: o que a loja prefere?", "ap",
    "Aceitar o item e conciliar depois custa pouco. Recusar derrubaria a venda (AP).");
  layer("t5", 3, 2, "Um único PostgreSQL com a loja inteira, num servidor só: qual combinação descreve?", "ca",
    "Sem outra réplica e sem rede entre nós, não há partição: consistência e disponibilidade juntas (CA). Se o servidor cai, tudo cai.");
  choice("t5", 4, 1, "Numa partição, o que faz o lado sem quorum de um sistema CP?", [
    "Aceita escritas e concilia depois.",
    "Recusa pedidos, devolvendo erro ou timeout.",
    "Desliga os outros nós.",
    "Passa a ignorar as regras de integridade."
  ], 1, "CP escolhe consistência: sem maioria, não responde, para não arriscar divergência.");
  tf("t5", 5, 2, "CA completo é uma opção realista para um sistema distribuído em várias regiões.", false,
    "A rede entre regiões falha. CA só vale sem rede entre nós, como num servidor único.");
  choice("t5", 6, 3, "Por que as listas de bancos CP e AP às vezes se contradizem, como o Cassandra aparecer nas duas?", [
    "Porque os autores erraram a conta.",
    "Porque o comportamento muda com a configuração (R e W) e o rótulo é só uma aproximação.",
    "Porque o Cassandra muda de versão a cada hora.",
    "Porque CP e AP são a mesma coisa."
  ], 1, "Muitos bancos permitem escolher quantas réplicas confirmam escrita e leitura. O rótulo depende dessa escolha.");
  layer("t5", 7, 3, "Reservar o último par de tênis sem nunca vender duas vezes, mesmo que isso recuse alguns pedidos na falha: qual combinação?", "cp",
    "A regra a proteger é não vender duas vezes. Aceita-se perder disponibilidade em troca (CP).");

  /* ---------- 6. Críticas modernas ---------- */
  choice("t6", 1, 2, "Por que \"escolha 2 de 3\" é considerado enganoso?", [
    "Porque dá para escolher as 3 sempre.",
    "Porque P não é opcional, partições são raras, e C e A são graus e não botões liga/desliga.",
    "Porque o teorema foi refutado.",
    "Porque só vale para bancos SQL."
  ], 1, "O CAP só restringe o comportamento durante a partição, e as duas propriedades têm meios-termos.");
  order("t6", 2, 2, "Coloque em ordem os três tempos de lidar com uma partição, segundo Brewer (2012).", [
    "Detectar a partição.",
    "Entrar em modo partição, limitando operações arriscadas.",
    "Recuperar: juntar as versões e corrigir erros."
  ], "Primeiro se detecta, depois se limita o que é arriscado, e só então se recupera quando a comunicação volta.");
  tf("t6", 3, 2, "Segundo a crítica de Kleppmann, o CAP não diz nada sobre latência: um sistema muito lento ainda pode ser \"disponível\" pela definição.", true,
    "Essa é uma das críticas: um sistema que responde em dois minutos cumpre a definição de disponibilidade do CAP.");
  choice("t6", 4, 1, "Quem escreveu \"CAP Twelve Years Later\", e em que ano?", [
    "Eric Brewer, em 2012.",
    "Daniel Abadi, em 2010.",
    "Gilbert e Lynch, em 2002.",
    "Haerder e Reuter, em 1983."
  ], 0, "O próprio Brewer revisitou a ideia 12 anos depois, em 2012.");
  choice("t6", 5, 3, "Qual desenho segue a ideia de escolher por operação?", [
    "Toda a loja é CP, sem exceção.",
    "Toda a loja é AP, inclusive os pagamentos.",
    "Pagamento recusa na partição; carrinho aceita sempre; vitrine pode estar velha.",
    "A loja decide só depois da primeira falha."
  ], 2, "Cada operação tem sua invariante: o saldo é protegido sempre, o carrinho tolera conciliar depois.");
  tf("t6", 6, 1, "Partições são relativamente raras, e sem partição um sistema pode entregar consistência e disponibilidade juntas.", true,
    "É um dos argumentos de Brewer (2012): o trade-off só pesa durante a falha.");
  choice("t6", 7, 3, "Depois da partição, dois pedidos venderam o mesmo último par. Qual é um exemplo de compensação?", [
    "Apagar o banco e recomeçar.",
    "Cancelar um dos pedidos e dar um cupom ao cliente.",
    "Ignorar o problema.",
    "Cobrar o cartão duas vezes."
  ], 1, "Compensar é corrigir o erro no negócio depois de detectá-lo: cancelar, reembolsar, pedir desculpas.");

  /* ---------- 7. Teorema PACELC ---------- */
  choice("t7", 1, 1, "O que significa PACELC?", [
    "Se há Partição: Availability ou Consistency. Senão (Else): Latency ou Consistency.",
    "Partition, Atomicity, Consistency, Eventual, Latency, Cache.",
    "Se há Partição: Latency ou Consistency. Senão: Availability ou Consistency.",
    "Performance, Availability, Cost, Elasticity, Latency, Capacity."
  ], 0, "O P-A-C vale na partição e o E-L-C vale no \"senão\", quando a rede está boa.");
  choice("t7", 2, 1, "Quem propôs o PACELC e quando?", [
    "Eric Brewer, em 2000.",
    "Daniel Abadi, em 2010.",
    "Martin Kleppmann, em 2015.",
    "Jim Gray, em 1981."
  ], 1, "Abadi propôs em 2010, porque o CAP não olha para latência.");
  choice("t7", 3, 1, "O que o PACELC acrescenta ao CAP?", [
    "Um jeito de fugir da partição.",
    "O comportamento sem partição: o trade-off entre latência e consistência.",
    "Uma quarta letra para durabilidade.",
    "A prova formal do CAP."
  ], 1, "Sem partição, o dilema é entre responder rápido (L) e esperar as réplicas para ter consistência (C).");
  choice("t7", 4, 3, "SP só responde \"ok\" depois que a Virgínia confirma. A escrita local leva 2 ms e a ida e volta SP a Virgínia leva 120 ms. Quanto leva a escrita, aproximadamente?", [
    "2 ms",
    "60 ms",
    "122 ms",
    "240 ms"
  ], 2, "2 ms de gravação local + 120 ms de espera pela confirmação da Virgínia = ~122 ms. Esse é o preço de EC.");
  choice("t7", 5, 2, "O que descreve um sistema PA/EL?", [
    "Consistência na partição e latência baixa sem partição.",
    "Disponibilidade na partição e latência baixa sem partição, aceitando consistência eventual.",
    "Consistência nas duas situações.",
    "Disponibilidade nas duas situações, sem pensar em latência."
  ], 1, "PA/EL prioriza disponibilidade e velocidade. O artigo-base classifica DynamoDB e Cassandra assim.");
  choice("t7", 6, 2, "Qual dupla o artigo-base classifica como PC/EC?", [
    "DynamoDB e Cassandra.",
    "etcd e Google Spanner.",
    "Memcached e Redis em cluster.",
    "CouchDB e SimpleDB."
  ], 1, "PC/EC é consistência nos dois casos, ao custo de latência. etcd, ZooKeeper, Spanner e CockroachDB entram aqui.");
  tf("t7", 7, 2, "O PACELC substitui o CAP e prova que o CAP está errado.", false,
    "Os dois se complementam: o CAP trata a partição e o PACELC acrescenta o que acontece sem ela.");
  choice("t7", 8, 3, "Na loja da Lia, qual mapa de escolhas faz sentido?", [
    "Carrinho em PC/EC e saldo em PA/EL.",
    "Carrinho em PA/EL e saldo/transferência em PC/EC.",
    "Tudo em PA/EL, inclusive o saldo.",
    "Tudo em PC/EC, inclusive a vitrine."
  ], 1, "O carrinho aceita um pouco de atraso e quer velocidade. Saldo e transferências pedem o valor certo, mesmo que mais lento.");

  window.QUIZ = out;
})();
