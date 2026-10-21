/* Banco de perguntas do quiz de Scale Cube.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-modelo-conceitual", name: "Introdução ao modelo conceitual" },
    t2: { topic: "aula-2-eixo-x-escalabilidade-horizontal", name: "Eixo X: escalabilidade horizontal" },
    t3: { topic: "aula-3-eixo-x-exemplo", name: "Eixo X: exemplo" },
    t4: { topic: "aula-4-eixo-y-quebra-de-funcionalidade", name: "Eixo Y: quebra de funcionalidade" },
    t5: { topic: "aula-5-eixo-z-sharding-e-particionamento-de-dados", name: "Eixo Z: sharding e particionamento de dados" },
    t6: { topic: "aula-6-conversao-dos-eixos", name: "Conversão dos eixos" }
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



  /* ---------- 1. Introdução ao modelo conceitual ---------- */
  choice("t1", 1, 1, "Qual pergunta define o eixo Y do Scale Cube?", [
    "Copio o serviço?",
    "Separo o que é diferente?",
    "Separo o que é igual, mas grande demais?",
    "Troco o banco por um mais rápido?"
  ], 1, "X copia (clona), Y separa o que é diferente (por função) e Z separa o que é igual, mas grande demais (por dados).");
  choice("t1", 2, 1, "Em que ano a AKF Partners criou o Scale Cube?", [
    "1999.",
    "2007.",
    "2015.",
    "2024."
  ], 1, "2007, publicado primeiro no blog e depois nos livros de Abbott e Fisher. 2015 é a 2ª edição de The Art of Scalability e 2024 é o ano do artigo-base.");
  choice("t1", 3, 1, "Qual é a coordenada (X, Y, Z) da loja hoje?", [
    "(1, 1, 1).",
    "(10, 9, 1).",
    "(10, 9, 3).",
    "(30, 9, 1)."
  ], 1, "Até 10 réplicas (o catálogo), 9 deployments e 1 partição. O (10, 9, 3) só existe depois do Z do pedidos, no módulo 16.");
  choice("t1", 4, 2, "O banco do pedidos está no teto de 150 pedidos/s, com 50 milhões de linhas. Qual eixo ataca esse sintoma?", [
    "X: mais réplicas do pedidos.",
    "Y: dividir o pedidos em mais serviços.",
    "Z: partir o banco por uma chave.",
    "Nenhum: é código lento."
  ], 2, "O teto é do banco de um primário. Clonar o serviço não o move; partir os dados, sim: 3 shards dão 3 × 150 = 450/s.");
  choice("t1", 5, 3, "A busca leva 900 ms por requisição. O que acontece ao clonar de 10 para 20 réplicas?", [
    "Cada busca cai para 450 ms.",
    "Cada busca continua com 900 ms; só a fila diminui.",
    "As buscas passam a levar 90 ms.",
    "O índice é criado sozinho."
  ], 1, "O tempo de uma requisição vem do código. O X só põe mais atendentes. A saída é um índice (módulo 4) ou um cache (módulo 5).");
  tf("t1", 6, 2, "O artigo-base e as fontes primárias concordam que o Scale Cube é um modelo só de microsserviços.", false, "Só o eixo Y é microsserviços. X e Z valem também para um monolito, e a AKF aplica o cubo a produtos, não só a serviços.");
  order("t1", 7, 2, "Ponha a trajetória da loja pelo cubo na ordem em que aconteceu.", [
    "(1, 1, 1): o monolito",
    "(1, 9, 1): 9 deployments",
    "(10, 9, 1): o catálogo com 10 réplicas",
    "(10, 9, 3): o pedidos em 3 shards"
  ], "Primeiro o Y (módulos 6, 8 e 9), depois o X (módulos 7 e 14) e por último o Z, que o módulo 16 constrói.");

  /* ---------- 2. Eixo X: escalabilidade horizontal ---------- */
  choice("t2", 1, 1, "Com 640 req/s e 10 réplicas do catálogo, quantos req/s cada réplica recebe?", [
    "10.",
    "64.",
    "640.",
    "6,4."
  ], 1, "640 ÷ 10 = 64: cada cópia atende 1/N da carga.");
  choice("t2", 2, 2, "Qual destes NÃO é condição para o X funcionar bem?", [
    "Serviço sem estado.",
    "Balanceador na frente.",
    "Banco particionado por cliente.",
    "Alguém que ajuste o número de cópias (HPA)."
  ], 2, "Particionar o banco é o Z. O X precisa de cópias intercambiáveis, balanceador e um ajuste do número de cópias.");
  choice("t2", 3, 3, "A Lena põe o gato no carrinho na réplica 1, e a página cai na réplica 2, que mostra o carrinho vazio. Qual conserto não quebra com o NAT de 500 pessoas?", [
    "Sticky por IP.",
    "Estado do carrinho no Redis.",
    "Mais uma réplica.",
    "Trocar o balanceador."
  ], 1, "Com o estado fora do processo, qualquer réplica lê o mesmo carrinho. O sticky por IP junta as 500 pessoas na mesma réplica.");
  choice("t2", 4, 2, "O pedidos faz 30 pedidos/s por réplica e o banco, 150/s. A partir de quantas réplicas o serviço deixa de ser o limite?", [
    "4.",
    "5.",
    "6.",
    "7."
  ], 1, "5 × 30 = 150, igual ao banco. A sexta réplica (180/s) não acrescenta nada.");
  tf("t2", 5, 2, "A sexta réplica do pedidos aumenta a saída de 150 para 180 pedidos/s.", false, "O banco para em 150/s. O gargalo saiu do serviço e ficou no banco.");
  choice("t2", 6, 1, "Qual custo do X a AKF aponta?", [
    "Divide os dados entre as cópias.",
    "Cada cópia acessa todos os dados.",
    "Separa os times por serviço.",
    "Elimina o balanceador."
  ], 1, "Por isso o cache por cópia guarda os mesmos itens dez vezes e, na camada de dados, o X vira a réplica: o conjunto inteiro, duplicado.");

  /* ---------- 3. Eixo X: exemplo ---------- */
  choice("t3", 1, 1, "Qual endereço do agnhost (netexec) devolve o nome do pod?", [
    "/pods.",
    "/hostname.",
    "/healthz.",
    "/metrics."
  ], 1, "O netexec expõe /hostname. A contagem das 100 respostas por nome mostra a divisão entre os pods.");
  choice("t3", 2, 2, "Por que o kubectl port-forward service/catalogo não serve para ver o balanceamento?", [
    "Ele encaminha para um pod só.",
    "Ele só funciona com HPA.",
    "Ele cria 10 pods.",
    "Ele bloqueia o /hostname."
  ], 0, "O port-forward escolhe um pod e fica nele. Para ver a divisão, é preciso chamar o Service de dentro do cluster.");
  choice("t3", 3, 2, "Com o HPA de minReplicas 10 aplicado, o que acontece com kubectl scale --replicas=3?", [
    "Fica em 3 para sempre.",
    "O HPA refaz o número, dentro do intervalo de 10 a 20.",
    "O Deployment é apagado.",
    "O Service para de funcionar."
  ], 1, "O HPA vigia o Deployment e mantém as réplicas entre minReplicas e maxReplicas.");
  choice("t3", 4, 3, "Um pod é apagado no meio de requisições, sem readinessProbe e sem encerramento gracioso. O que acontece?", [
    "Nada: o Service tira o pod na hora.",
    "Requisições falham por alguns segundos, porque o Service ainda manda conexões ao pod.",
    "O Deployment para de criar pods.",
    "O HPA sobe mais 10 réplicas."
  ], 1, "Clonar é um comando; tirar uma cópia sem derrubar ninguém exige prontidão e encerramento gracioso (módulo 22).");
  tf("t3", 5, 2, "A saída com nomes como catalogo-7d9c6b6c5f-x2k4q é real, medida num cluster.", false, "Os nomes e a contagem são ilustrativos. Os manifestos tiveram a sintaxe conferida, mas não foram aplicados num cluster.");

  /* ---------- 4. Eixo Y: quebra de funcionalidade ---------- */
  choice("t4", 1, 1, "Qual é a diferença entre cortar por verbo e por substantivo?", [
    "Verbo é uma entidade; substantivo é um caso de uso.",
    "Verbo é um caso de uso (checkout); substantivo é uma entidade (catalogo).",
    "Verbo é o dado; substantivo é o código.",
    "Não há diferença."
  ], 1, "Richardson dá os dois nomes: o checkout atravessa carrinho, pedidos, pagamentos, estoque e entregas; o catálogo é uma coisa.");
  choice("t4", 2, 2, "Quantos serviços o pedido 1053 atravessa no checkout e quanto de rede isso soma?", [
    "3 serviços, +10 ms.",
    "5 serviços, +20 ms (quatro saltos de 5 ms).",
    "5 serviços, +25 ms.",
    "7 serviços, +30 ms."
  ], 1, "carrinho, pedidos, pagamentos, estoque e entregas: cinco serviços, quatro saltos de 5 ms.");
  choice("t4", 3, 1, "Quantos vCPU custam 10 cópias do monolito de 8 vCPU e os 7 serviços da Black Friday?", [
    "80 e 25.",
    "80 e 55.",
    "25 e 80.",
    "80 e 8."
  ], 0, "10 × 8 = 80. Serviços: catálogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1 e relatórios 4 = 25.");
  choice("t4", 4, 2, "Quanto o Y economiza nessa conta de vCPU?", [
    "31%.",
    "55%.",
    "69%.",
    "25%."
  ], 2, "80 − 25 = 55 vCPU, 55 ÷ 80 = 68,75%, cerca de 69%.");
  choice("t4", 5, 3, "A tela \"meus pedidos\" (20 pedidos) passa a buscar itens_pedido num serviço separado, a 5 ms por chamada. Quanto de rede?", [
    "20 × 5 = 100 ms.",
    "21 × 5 = 105 ms.",
    "2 ms.",
    "1 × 5 = 5 ms."
  ], 1, "Uma chamada de lista mais 20 de itens: 21 × 5 = 105 ms, contra um JOIN de uns 2 ms. E a transação única se perde.");
  tf("t4", 6, 2, "O Y é o único eixo que aumenta a escalabilidade organizacional.", true, "Cada serviço tem dono de código e dados e entrega sozinho: o deploy de 40 minutos vira deploys independentes.");

  /* ---------- 5. Eixo Z: sharding e particionamento de dados ---------- */
  choice("t5", 1, 1, "O que o eixo Z separa?", [
    "O que é diferente.",
    "O que é igual, mas grande demais.",
    "Só o que está na memória.",
    "Os times."
  ], 1, "Mesmo código, cada instância com um pedaço dos dados, e um roteador que olha uma chave.");
  choice("t5", 2, 2, "Com 3 shards, para onde vai o caio-58 (murmur3 mod 3)?", [
    "Shard 0.",
    "Shard 1.",
    "Shard 2.",
    "Para todos."
  ], 2, "lena-77 e bia-31 vão ao shard 1, caio-58 ao 2 e davi-12 ao 0.");
  choice("t5", 3, 2, "Com (3, 1, 3), quanto sai de 200 pedidos/s do pedidos?", [
    "90.",
    "150.",
    "200.",
    "450."
  ], 2, "9 pods dão 270/s de serviço e 3 bancos dão 450/s: sai a demanda inteira, 200/s, com cada banco a 44%.");
  choice("t5", 4, 3, "9 réplicas do pedidos com pool de 10 conexões por shard falam com todos os 3 shards. Quantas conexões cada banco vê?", [
    "30.",
    "90.",
    "10.",
    "270."
  ], 1, "9 × 10 = 90, perto do max_connections de 100. No modelo de pods por shard, cada banco vê só 3 × 10 = 30.");
  choice("t5", 5, 3, "WHERE id = 1042, sem a chave, numa tabela particionada por cliente_id. O que o plano do PostgreSQL mostra?", [
    "Um Index Scan em uma partição.",
    "Um Append sobre as 3 partições.",
    "Um Seq Scan na tabela de clientes.",
    "Um erro de partição."
  ], 1, "Sem a chave, não há poda: a consulta lê todos os shards (scatter-gather) e junta as respostas.");
  tf("t5", 6, 2, "O Z vale só para o banco de dados; a aplicação não pode ser particionada.", false, "A AKF e Richardson aplicam o Z também à aplicação: um serviço de busca com partições e um agregador, ou pods inteiros por cliente ou região.");
  choice("t5", 7, 3, "Com o mkt-01, um shard recebe 60% dos 200 pedidos/s. Quanto recebe e quanto isso é do teto de 150?", [
    "120/s, 80%.",
    "60/s, 40%.",
    "150/s, 100%.",
    "200/s, 133%."
  ], 0, "60% de 200 = 120/s, 80% de 150, no joelho do módulo 14. Os outros dois shards recebem 40/s cada.");

  /* ---------- 6. Conversão dos eixos ---------- */
  choice("t6", 1, 2, "Quantos pods a loja tem hoje e depois do Z do pedidos (3 shards × 3 réplicas)?", [
    "30 e 33.",
    "30 e 36.",
    "27 e 36.",
    "30 e 90."
  ], 1, "30 − 3 + 9 = 36: soma por serviço de réplicas × partições.");
  choice("t6", 2, 1, "Em que ordem a loja deve andar pelos eixos?", [
    "Sempre X, Y, Z.",
    "A ordem do gargalo, não a do desenho.",
    "Sempre Z primeiro.",
    "Em ordem alfabética."
  ], 1, "A loja fez Y (módulo 6), X (módulo 7) e só agora vai para o Z, porque cada passo foi o que doía.");
  choice("t6", 3, 2, "Quanto sai do pedidos com 200/s em (3, 1, 1), (7, 1, 1) e (3, 1, 3)?", [
    "90, 150 e 200.",
    "90, 210 e 270.",
    "45, 75 e 100.",
    "90, 150 e 150."
  ], 0, "O banco para o X em 150; o Z abre 450/s de banco e a demanda inteira passa.");
  choice("t6", 4, 3, "Um catálogo com 10 réplicas (X), 4 microsserviços de busca (Y) e 3 partições (Z). Quantos pods?", [
    "13.",
    "17.",
    "120.",
    "30."
  ], 2, "10 × 4 × 3 = 120 pods para um serviço que dava 100 req/s por réplica. Os eixos se multiplicam.");
  choice("t6", 5, 2, "Com 200 pedidos/s e 30 por pod, quantos pods de pedidos o X pediria só pelo serviço, e o banco deixa passar?", [
    "7 pods; não, o banco para em 150.",
    "7 pods; sim, passam os 200.",
    "6 pods; sim.",
    "5 pods; sim."
  ], 0, "⌈200 ÷ 30⌉ = 7 pods (210/s), mas o banco de um primário para em 150/s.");
  tf("t6", 6, 2, "\"Pod\" no sentido da AKF é o mesmo que o pod do Kubernetes.", false, "Na AKF, pod é o conjunto de aplicação e dados de uma partição do Z, com o X dentro. O nome coincide, o conceito não.");

  window.QUIZ = out;
})();
