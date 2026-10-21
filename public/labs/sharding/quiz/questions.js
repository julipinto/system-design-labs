/* Banco de perguntas do quiz de Sharding e Particionamento.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-topologia-de-sharding", name: "Introdução e topologia de sharding" },
    t2: { topic: "aula-2-escalabilidade-e-performance", name: "Escalabilidade e performance" },
    t3: { topic: "aula-3-sharding-keys-e-hot-partitions", name: "Sharding keys e hot partitions" },
    t4: { topic: "aula-4-sharding-de-tabelas", name: "Sharding de tabelas" },
    t5: { topic: "aula-5-ranges-comuns-datas-e-tiers", name: "Ranges comuns: datas e tiers" },
    t6: { topic: "aula-6-hashing", name: "Hashing" },
    t7: { topic: "aula-7-hashing-consistente", name: "Hashing consistente" },
    t8: { topic: "aula-8-gestao-de-chaves", name: "Gestão de chaves" },
    t9: { topic: "aula-9-shuffle-sharding", name: "Shuffle sharding" },
    t10: { topic: "aula-10-exemplo", name: "Exemplo" }
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


  /* ---------- 1. Introdução e topologia de sharding ---------- */
  choice("t1", 1, 2, "A tabela pedidos cresce 5 pedidos/s × 86.400 s, com 2 KB por linha e 40% a mais de índices. Os 60 GB livres duram cerca de quanto tempo?", [
    "5 dias.",
    "50 dias.",
    "500 dias.",
    "1 dia."
  ], 1, "432.000 pedidos/dia × 2 KB × 1,4 = 1,21 GB por dia. 60 ÷ 1,21 dá cerca de 50 dias.");
  choice("t1", 2, 1, "Qual frase descreve o particionamento de uma tabela, e não o sharding?", [
    "Cada pedaço fica num servidor diferente.",
    "A tabela é dividida em pedaços dentro da mesma instância.",
    "O código do serviço é copiado em mais réplicas.",
    "A leitura é espalhada por réplicas de leitura."
  ], 1, "Particionar é dividir dentro de uma instância (poda e retenção, sem capacidade nova). Shard é cada pedaço num servidor diferente.");
  choice("t1", 3, 2, "Quanto leva o backup completo de 140 GB a 50 MB/s no servidor único?", [
    "Cerca de 47 minutos.",
    "Cerca de 5 minutos.",
    "Cerca de 4 horas.",
    "Cerca de 15 minutos."
  ], 0, "140.000 MB ÷ 50 MB/s = 2.800 s, ou 47 minutos.");
  tf("t1", 4, 2, "50 milhões de linhas não cabem num PostgreSQL, e é por isso que a loja precisa de sharding.", false, "Ainda cabem. Os gatilhos da loja são o disco (140 GB em 200 GB), o backup e o teto de escrita de 150 pedidos/s.");
  order("t1", 5, 2, "Ponha a escada de remédios na ordem, do mais barato ao mais caro.", [
    "Índice",
    "Cache",
    "Réplicas de leitura",
    "Partitioning na mesma instância",
    "Sharding"
  ], "Cada degrau resolve um sintoma e custa mais que o anterior. O sharding é o único que também multiplica a escrita e o espaço.");

  /* ---------- 2. Escalabilidade e performance ---------- */
  choice("t2", 1, 2, "Cada shard aguenta 150 pedidos/s. Quanto 3 shards oferecem, no papel?", [
    "150 pedidos/s.",
    "300 pedidos/s.",
    "450 pedidos/s.",
    "600 pedidos/s."
  ], 2, "3 × 150 = 450, se a carga se espalhar por igual. A aula 3 mostra quando ela não espalha.");
  choice("t2", 2, 2, "Qual é o tempo do backup dos 140 GB com 3 shards, em paralelo e a 50 MB/s?", [
    "47 minutos.",
    "15 min 33 s.",
    "2 min.",
    "93 min."
  ], 1, "140 GB ÷ 3 = 46,7 GB por shard; 46.667 MB ÷ 50 = 933 s, ou 15 min 33 s.");
  choice("t2", 3, 2, "Uma consulta sem a chave espera 50 shards. Qual a chance de pelo menos um responder acima do seu p99?", [
    "1%.",
    "9,56%.",
    "39,5%.",
    "63,4%."
  ], 2, "1 − 0,99^50 = 39,5%. Com 3 shards são 2,97%, com 10 são 9,56% e com 100 são 63,4%.");
  choice("t2", 4, 2, "Com cada shard a 99,9%, qual a chance de algum dos 3 shards estar fora?", [
    "0,10%.",
    "0,2997%.",
    "0,9955%.",
    "4,88%."
  ], 1, "1 − 0,999^3 = 0,2997%. Para um cliente, a chance continua 0,1%; é a equipe que vê mais incidentes.");
  tf("t2", 5, 2, "Uma consulta com a chave de sharding lê só 1 shard; sem a chave, o roteador pergunta a todos.", true, "Com a chave, o roteador calcula o shard. Sem ela, faz scatter-gather e espera o mais lento.");

  /* ---------- 3. Sharding keys e hot partitions ---------- */
  choice("t3", 1, 2, "O mkt-01 tem 40% das linhas e cai no shard-2 (3 shards, chave cliente_id). Qual é a eficiência do cluster?", [
    "33,3%.",
    "55,6%.",
    "60,6%.",
    "100%."
  ], 1, "O shard-2 fica com 60% das linhas: 1 ÷ (3 × 0,60) = 55,6%.");
  choice("t3", 2, 2, "Com o mkt-01 no shard-2, a partir de quantos pedidos/s esse shard satura (teto de 150/s)?", [
    "450 pedidos/s.",
    "250 pedidos/s.",
    "150 pedidos/s.",
    "750 pedidos/s."
  ], 1, "0,60 × T = 150, então T = 250. A loja paga 3 servidores e aproveita 1,67.");
  choice("t3", 3, 2, "Por que cidade é uma chave ruim para a tabela pedidos?", [
    "Porque cidade é um texto.",
    "Porque tem só 3 valores: o teto é 3 shards e SP leva 55%.",
    "Porque o hash não funciona com texto.",
    "Porque cidade muda a cada pedido."
  ], 1, "Baixa cardinalidade limita o cluster. Com 3 shards, a eficiência é 1 ÷ (3 × 0,55) = 60,6%.");
  tf("t3", 4, 2, "Usar hash da chave evita hot partitions, porque o hash espalha a carga.", false, "O hash espalha chaves diferentes, não carga. Uma chave quente, como o mkt-01, cai inteira num shard.");
  choice("t3", 5, 3, "A loja dá ao mkt-01 um shard dedicado numa máquina de 2× (300/s) e mantém 3 shards normais. Quanto passa a aguentar?", [
    "250 pedidos/s.",
    "450 pedidos/s.",
    "600 pedidos/s.",
    "750 pedidos/s."
  ], 3, "Os 4 shards saturam juntos em T = 750: 0,4 × 750 = 300 e 0,2 × 750 = 150.");
  choice("t3", 6, 2, "Qual é o custo de dividir o mkt-01 em 8 sub-chaves (mkt-01#0 a #7)?", [
    "A eficiência cai a 55,6%.",
    "Os pedidos do parceiro não podem mais ser gravados.",
    "Consultar todos os pedidos do parceiro vira scatter-gather.",
    "O hash deixa de funcionar."
  ], 2, "O sal espalha o parceiro pelos 3 shards (eficiência perto de 100%), mas as linhas dele deixam de morar juntas.");

  /* ---------- 4. Sharding de tabelas ---------- */
  choice("t4", 1, 2, "O PRIMARY KEY (id) de uma tabela PARTITION BY RANGE (sale_date) dá qual erro?", [
    "no partition of relation found for row.",
    "A coluna sale_date não existe.",
    "A chave única deve incluir todas as colunas de partição.",
    "A tabela já existe."
  ], 2, "unique constraint on partitioned table must include all partitioning columns. O conserto é PRIMARY KEY (id, sale_date).");
  choice("t4", 2, 2, "Como o plano trata WHERE id = 1042 numa tabela pedidos partida por ano (3 partições)?", [
    "Lê só a partição de 2026.",
    "Append com um Index Scan em cada uma das 3 partições.",
    "Falha com erro de partição.",
    "Usa um índice global."
  ], 1, "Sem a chave de partição o planejador não sabe o ano. Com id e criado_em, volta a ser uma partição só.");
  choice("t4", 3, 2, "Qual erro aparece ao inserir um pedido com criado_em de 2027 sem a partição de 2027?", [
    "unique violation.",
    "no partition of relation \"pedidos\" found for row.",
    "relation \"pedidos_2027\" is locked.",
    "syntax error."
  ], 1, "O DETAIL mostra a chave da linha. O job que cria a partição do próximo período evita o erro.");
  choice("t4", 4, 2, "Na amostra de 14 linhas, PARTITION BY HASH (cliente_id) com MODULUS 3 deixa quantas linhas em cada partição?", [
    "5 / 5 / 4.",
    "11 / 3 / 0.",
    "3 / 9 / 2.",
    "14 / 0 / 0."
  ], 1, "pedidos_h0 fica com lena-77, bia-31 e caio-58 (11), pedidos_h1 com davi-12 (3) e pedidos_h2 vazia. O PostgreSQL usa a função hash própria dele.");
  tf("t4", 5, 2, "Particionar a tabela pedidos por ano na mesma instância aumenta o teto de 150 pedidos/s.", false, "Todas as partições moram no mesmo servidor. Particionar dá poda e retenção, não capacidade.");
  choice("t4", 6, 2, "Qual comando de retenção deixa linhas mortas para o VACUUM?", [
    "DETACH PARTITION.",
    "DROP TABLE pedidos_2024.",
    "DELETE FROM pedidos WHERE criado_em < '2025-01-01'.",
    "Nenhum."
  ], 2, "O DELETE (62,9 ms nas 105.407 linhas) varre linhas e deixa tuplas mortas; DROP (7,5 ms) e DETACH (1,1 ms) não.");

  /* ---------- 5. Ranges comuns: datas e tiers ---------- */
  choice("t5", 1, 2, "Com 6 faixas de inicial (A–E · F–J · K–N · O–R · S–V · W–Z) e a amostra da loja, quantas faixas recebem linhas?", [
    "1.",
    "2.",
    "4.",
    "6."
  ], 1, "A–E (Bia, Caio e Davi: 8 linhas) e K–N (Lena: 6 linhas). As outras quatro ficam vazias.");
  choice("t5", 2, 2, "O que acontece com as escritas novas quando os 50 milhões de ids são divididos em 3 faixas e o id é sequencial?", [
    "Vão por igual às 3 faixas.",
    "100% vão para a última faixa.",
    "Vão só para a primeira faixa.",
    "Falham até o banco ser particionado."
  ], 1, "Todo id novo é maior que os antigos: cai na última faixa, e as duas primeiras ficam cheias e paradas (33,3% de eficiência).");
  choice("t5", 3, 2, "Qual partição é o tier cold da loja?", [
    "pedidos_2026 (25 milhões, 50 GB).",
    "pedidos_2025 (17 milhões, 34 GB).",
    "pedidos_2024 (8 milhões, 16 GB).",
    "Todas elas."
  ], 2, "2024 é pouco lida e vai para armazenamento barato e lento. 2026 é hot (SSD) e 2025 é warm.");
  choice("t5", 4, 3, "É 01/01/2027 e o primeiro pedido do ano falha. O que a loja deveria ter feito antes?", [
    "Trocado a chave para cliente_id.",
    "Um job que cria a partição do próximo período antes de ela ser necessária.",
    "Apagado a partição de 2024.",
    "Mudado a PK para (id)."
  ], 1, "O erro era previsível. Uma partição DEFAULT segura as linhas, mas esconde o problema e cresce sem ninguém olhar.");
  tf("t5", 5, 2, "Aposentar a partição de 2024 com DROP varre as 8 milhões de linhas e deixa linhas mortas.", false, "DROP e DETACH não varrem linhas nem deixam trabalho para o VACUUM. É por isso que a retenção por partição é barata.");

  /* ---------- 6. Hashing ---------- */
  choice("t6", 1, 2, "Para onde vai o pedido 1054 da Lena, com murmur3(\"lena-77\") = 0x8fd9d9d8 e mod 3?", [
    "shard-0.",
    "shard-1.",
    "shard-2.",
    "shard-3."
  ], 1, "0x8fd9d9d8 = 2.413.418.968, e o resto da divisão por 3 é 1.");
  choice("t6", 2, 2, "Ao passar de 3 para 4 shards com hash mod N, que fração das chaves muda de shard?", [
    "25%.",
    "50%.",
    "75,2%.",
    "100%."
  ], 2, "N ÷ (N + 1) = 3 ÷ 4: 75,2% medido nas 100 mil chaves. Cerca de 37,5 milhões de linhas, 75 GB, 25 minutos.");
  choice("t6", 3, 2, "E ao dobrar de 3 para 6 shards com mod?", [
    "49,9%.",
    "75,2%.",
    "66,7%.",
    "100%."
  ], 0, "Dobrar é o caso favorável do mod: cerca de 50% das chaves se mexem (25 milhões de linhas, 50 GB).");
  choice("t6", 4, 3, "No lab de 41 entradas e 5 shards, o FNV-1a deu 14 num shard (o ideal é 8,2). O que se conclui?", [
    "Que o FNV-1a é pior que o SHA-256.",
    "Que o murmur3 é melhor.",
    "Nada: o desvio esperado é 2,56, e com 25 contagens um 14 é esperado por sorte.",
    "Que o lab tem um bug."
  ], 2, "Com 100 mil chaves todas as funções ficam a menos de 2% do ideal. O balanceamento não decide a função.");
  tf("t6", 5, 2, "A \"soma dos caracteres\" é boa função de hash porque dá o melhor número do teste, 1,000.", false, "Anagramas colidem (lena-77 e 77-anel caem no mesmo shard) e ids vizinhos caem em shards vizinhos.");
  choice("t6", 6, 3, "No deploy, a v1 do roteador usa mod 3 e a v2 usa mod 4. A Lena grava o 1054 pela v2. O que acontece no \"meus pedidos\" pela v1?", [
    "Mostra o pedido normalmente.",
    "Dá erro 500.",
    "Não mostra: a v2 gravou no shard-0 (mod 4 = 0) e a v1 procura no shard-1.",
    "Mostra o pedido duplicado."
  ], 2, "Dois roteadores com N diferente enxergam bancos diferentes. Não há erro, só um pedido que sumiu da tela.");

  /* ---------- 7. Hashing consistente ---------- */
  choice("t7", 1, 1, "No anel, a quem pertence uma chave?", [
    "Ao shard de maior hash.",
    "Ao primeiro shard que se encontra no sentido horário a partir da chave.",
    "Ao shard de menor número.",
    "A todos os shards."
  ], 1, "Shards e chaves moram no mesmo círculo. Passando do fim, a busca volta ao primeiro ponto.");
  choice("t7", 2, 2, "No anel de 200 pontos por shard, ao passar de 3 para 4 shards, o que muda?", [
    "75,2% das chaves, entre todos os shards.",
    "25,7% das chaves, todas para o shard novo.",
    "Nada muda.",
    "50% das chaves."
  ], 1, "O ideal é 25%. São 12,5 milhões de linhas, 25 GB, 8 min 20 s a 50 MB/s, contra 25 min do mod.");
  choice("t7", 3, 2, "Quais dos 5 clientes mudam no anel ao entrar o shard-3?", [
    "lena-77 e bia-31.",
    "caio-58 e davi-12, ambos para o shard-3.",
    "Todos, menos o davi-12.",
    "Só o mkt-01."
  ], 1, "No mod 4, 4 dos 5 mudam e vários vão entre shards antigos. No anel só esses dois mudam, e para o shard novo.");
  choice("t7", 4, 2, "Com 1 ponto por shard, como ficam as fatias de 3 shards, e qual a razão máx. ÷ média?", [
    "33 / 33 / 33 e razão 1,00.",
    "70,2 / 8,8 / 21,0 e razão 2,11.",
    "59,0 / 17,7 / 23,3 e razão 1,77.",
    "50 / 30 / 20 e razão 1,50."
  ], 1, "Com 3 pontos (o lab) é 59,0 / 17,7 / 23,3 e 1,77; com 200 pontos, 35,5 / 32,2 / 32,3 e 1,07.");
  choice("t7", 5, 3, "O shard maior (70,2%) sai de um anel de 1 ponto por shard. O que acontece?", [
    "As chaves se dividem entre os dois vizinhos.",
    "Todas vão para um vizinho, que passa a ter 91,2%: o efeito dominó.",
    "O anel para de funcionar.",
    "Nada, porque o anel guarda cópia."
  ], 1, "Com 200 pontos, o shard-1 fica com 53,1% e o shard-2 com 46,9%: os pontos virtuais espalham o impacto de uma saída.");
  tf("t7", 6, 2, "O hashing consistente do anel usa o resto da divisão (mod) do hash pelo número de shards.", false, "O anel usa posições ordenadas num círculo e uma busca pelo primeiro ponto, sem módulo.");

  /* ---------- 8. Gestão de chaves ---------- */
  choice("t8", 1, 2, "Quantos slots o shard-3 recebe ao passar de 3 para 4 shards (1.024 slots)?", [
    "128 (12,5%).",
    "256 (25%).",
    "341 (33%).",
    "512 (50%)."
  ], 1, "86 + 85 + 85 = 256 slots: os últimos dos shards 0, 1 e 2 (slots 768, 769 e 770 em diante), exatamente 25%.");
  choice("t8", 2, 2, "Ao mover os 256 slots para o shard-3, qual dos 5 clientes muda de shard?", [
    "lena-77.",
    "bia-31 (slot 827, do shard-2 para o shard-3).",
    "caio-58.",
    "Nenhum."
  ], 1, "Os slots dos outros (472, 749, 432 e 597) ficam abaixo do corte. O hash do cliente não muda; só o mapa.");
  choice("t8", 3, 2, "Quanto leva mover o mkt-01 (20 milhões de linhas de 2 KB) para um shard dedicado, a 50 MB/s?", [
    "Cerca de 80 s.",
    "13 min 20 s (40 GB).",
    "47 min.",
    "Cerca de 4 h."
  ], 1, "40.000 MB ÷ 50 = 800 s. E é preciso aplicar as mudanças que chegam durante a cópia (CDC) antes de trocar o diretório.");
  choice("t8", 4, 3, "Um roteador guardou em cache a rota antiga do mkt-01 depois do corte. Qual a defesa?", [
    "O shard antigo aceita e grava, e o dado é movido depois.",
    "O shard recusa chaves que não são mais dele (como o -MOVED do Redis) e o mapa tem uma época.",
    "Reiniciar o banco.",
    "Desligar o cache e perder o desempenho."
  ], 1, "Sem a recusa, o dado vai para o lugar errado sem ninguém notar. A época diz ao roteador que o mapa dele está velho.");
  choice("t8", 5, 2, "Em quantos dos 5 clientes murmur2 mod 3 (Kafka) e murmur3 mod 3 (roteador do banco) dão o mesmo número?", [
    "Em todos.",
    "Em 2 de 5 (lena-77 e caio-58).",
    "Em nenhum.",
    "Em 4 de 5."
  ], 1, "Para o consumidor da partição p escrever só no shard p, a função e a chave têm de ser as mesmas.");
  tf("t8", 6, 1, "O Redis Cluster usa 16.384 slots e CRC16(chave) mod 16384.", true, "É o modelo de slots fixos: mover shard é mover slots, e o -MOVED diz ao cliente para onde ir.");

  /* ---------- 9. Shuffle sharding ---------- */
  choice("t9", 1, 2, "Com 10 réplicas em 5 grupos fixos de 2, o mkt-01 e a bia-31 caem no mesmo grupo. Que fração dos clientes fica sem serviço quando o grupo trava?", [
    "2,2%.",
    "10%.",
    "20%.",
    "50%."
  ], 2, "1 grupo de 5 = 20%, a Bia incluída. Com shuffle sharding de 2 em 10, só quem tem o mesmo par cai (1 em 45).");
  choice("t9", 2, 2, "Quantos pares diferentes existem em subconjuntos de 2 entre 10 réplicas?", [
    "20.",
    "45.",
    "90.",
    "100."
  ], 1, "C(10, 2) = 45. Com 4 em 10 são 210 conjuntos.");
  choice("t9", 3, 2, "O mkt-01 recebe as réplicas 8 e 9 e as duas travam. Quem não percebe nada?", [
    "A lena-77 e o davi-12.",
    "A bia-31 e o caio-58.",
    "Todos os clientes.",
    "Ninguém."
  ], 1, "Bia (réplicas 4 e 6) e Caio (1 e 4) não dividem réplica com o parceiro. Lena (6 e 8) e Davi (1 e 9) perdem uma réplica cada.");
  choice("t9", 4, 3, "A lena-77 tem as réplicas 6 e 8, e a 8 está travada. O app dela não repete a chamada se a primeira falha. O que ela vê?", [
    "Nada: a 6 atende tudo.",
    "Cerca de metade das chamadas falha.",
    "Todas as chamadas falham.",
    "O pedido é duplicado."
  ], 1, "O shuffle sharding exige que o cliente tente todas as réplicas do seu subconjunto. Sem o retry, o isolamento existe só no desenho.");
  tf("t9", 5, 2, "Shuffle sharding é um jeito de replicar os dados do shard em outros servidores.", false, "É isolamento de requisição e computação: cada cliente usa um subconjunto de réplicas. Replicar dados é uma decisão separada (módulo 17).");
  choice("t9", 6, 2, "O Route 53 usa 2.048 servidores virtuais e dá 4 a cada domínio. Quantas combinações existem?", [
    "Cerca de 8 mil.",
    "Cerca de 730 bilhões.",
    "Cerca de 2 milhões.",
    "Exatamente 2.048."
  ], 1, "C(2048, 4) = 730.862.190.080. Dois domínios com o mesmo conjunto são raríssimos.");

  /* ---------- 10. Exemplo ---------- */
  choice("t10", 1, 2, "Qual a contagem do hashing/ do autor (10 tenants, SHA-256, 3 shards)?", [
    "3 / 3 / 4.",
    "2 / 4 / 4.",
    "5 / 3 / 2.",
    "10 / 0 / 0."
  ], 1, "Com 4 shards, 7 dos 10 tenants mudam. A distribuição de 10 entradas é só ruído.");
  choice("t10", 2, 2, "No lab do anel (3 pontos, 4 shards, 10 tenants), quantos tenants mudam ao remover o Shard-02?", [
    "1 de 10.",
    "3 de 10, todos para o Shard-00.",
    "7 de 10.",
    "Todos."
  ], 1, "Adicionar o Shard-04 muda 1 de 10 (Hortifruti-Oba, do Shard-01 para o Shard-04).");
  choice("t10", 3, 3, "Por que o Shard-00 do lab nasce com 0 tenants?", [
    "Porque o hash falhou.",
    "Porque 3 pontos por shard são poucos: a fatia dele pode não conter nenhum tenant.",
    "Porque ele foi removido.",
    "Porque o nome é inválido."
  ], 1, "Na prática são dezenas a centenas de pontos: com 200, as fatias ficam em torno de 25% cada.");
  tf("t10", 4, 2, "O partitioning/table.sql do autor roda como está e já cria as partições.", false, "PRIMARY KEY (id) não cria a tabela, e, corrigido, o arquivo não cria nenhuma partição. O \\c ecommerce; só roda com psql -f.");
  choice("t10", 5, 2, "O que acontece com GetTenantNode num anel vazio?", [
    "Devolve uma string vazia.",
    "Panic: o índice 0 num slice sem elementos.",
    "Devolve o primeiro shard.",
    "Cria um shard novo."
  ], 1, "O código volta ao índice 0 se passar do fim, mas num slice vazio não há índice 0.");
  choice("t10", 6, 1, "Depois do sharding, que problema da loja continua em aberto e leva ao módulo 17?", [
    "A tabela voltou a crescer.",
    "Cada shard é um servidor só: se o shard-1 cai, a Lena e a Bia ficam sem pedidos.",
    "O hash está lento.",
    "O mkt-01 saiu da loja."
  ], 1, "O sharding não copia nada. Falta copiar cada shard: primário em SP, réplicas no Rio e em Recife.");

  window.QUIZ = out;
})();
