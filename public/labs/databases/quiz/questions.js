/* Banco de perguntas do quiz de Databases, Modelos de Dados e Indexação.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-o-que-sao-bancos", name: "O que é um banco de dados" },
    t2: { topic: "aula-2-tipos-de-bancos", name: "Tipos de bancos de dados" },
    t3: { topic: "aula-3-niveis-de-consistencia", name: "Níveis de consistência" },
    t4: { topic: "aula-4-modelo-de-tuplas", name: "Modelo de tuplas (por linha)" },
    t5: { topic: "aula-5-modelo-de-documentos", name: "Modelo de documentos" },
    t6: { topic: "aula-6-modelo-colunar", name: "Modelo colunar" },
    t7: { topic: "aula-7-coluna-larga", name: "Modelo de coluna larga" },
    t8: { topic: "aula-8-chave-valor", name: "Modelo chave-valor" },
    t9: { topic: "aula-9-grafos", name: "Modelo de grafos" },
    t10: { topic: "aula-10-page-size-e-indexacao-colunar", name: "Page size e indexação colunar" },
    t11: { topic: "aula-11-lsm-trees", name: "LSM-Trees" },
    t12: { topic: "aula-12-b-tree", name: "B-Tree" },
    t13: { topic: "aula-13-hashing", name: "Indexação por hashing" },
    t14: { topic: "aula-14-indices-invertidos", name: "Índices invertidos" },
    t15: { topic: "aula-15-write-e-read-intensive", name: "Escrita intensiva e leitura intensiva" }
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

  /* ---------- 1. O que é um banco de dados ---------- */
  choice("t1", 1, 1, "O que é um banco de dados, numa frase?", [
    "Um arquivo de texto com índice no começo.",
    "A camada entre o programa e o disco: você diz o que quer e ele decide onde guardar, como achar e como proteger.",
    "Um servidor que só guarda dados em memória.",
    "Um programa que desenha tabelas na tela."
  ], 1, "O programa diz o que quer. Alocação em disco, busca e recuperação de falhas ficam com o banco.");
  tf("t1", 2, 1, "No SELECT * FROM pedidos WHERE id = 1042, o programa precisa dizer ao banco se ele deve varrer a tabela ou usar um índice.", false,
    "O programa só diz o que quer. Como achar a linha, varrendo tudo ou seguindo um índice, é decisão do banco.");
  choice("t1", 3, 2, "Com 6 linhas na tabela pedidos, varrer tudo é aceitável. O que muda com 6 milhões de linhas?", [
    "Nada: o banco sempre lê só a linha pedida.",
    "A varredura vira a diferença entre um clique rápido e uma tela travada, e o índice passa a valer a pena.",
    "O banco deixa de aceitar novos pedidos.",
    "O SELECT passa a devolver só metade das linhas."
  ], 1, "Índice é o atalho que o banco mantém para chegar direto à linha, sem ler a tabela inteira.");
  order("t1", 4, 2, "Ordene o caminho do pedido 1042 quando a Lena compra o gato de pelúcia.", [
    "O programa envia INSERT INTO pedidos ...",
    "O banco aloca o espaço e grava no disco",
    "O banco confirma, já com a linha segura",
    "Depois, SELECT ... WHERE id = 1042 acha a linha por varredura ou por índice"
  ], "O programa só pede. Alocar, gravar e confirmar só depois de a linha estar segura é trabalho do banco.");

  /* ---------- 2. Tipos de bancos ---------- */
  choice("t2", 1, 1, "Qual troca define o NewSQL?", [
    "SQL e transações como no relacional, com a escala horizontal do NoSQL, pagando latência de rede em cada commit.",
    "Guardar tudo na RAM e aceitar perder o dado.",
    "Abrir mão do SQL para ganhar escala.",
    "Guardar só dados com carimbo de tempo."
  ], 0, "Para isso ele divide os dados entre servidores e usa consenso (Raft ou Paxos) para confirmar cada escrita.");
  choice("t2", 2, 2, "A loja precisa guardar o tempo de resposta do site a cada segundo, com limpeza automática do que ficou velho. Qual tipo de banco?", [
    "SQL relacional.",
    "Grafo.",
    "Séries temporais.",
    "NewSQL."
  ], 2, "Cada registro leva carimbo de tempo, a gravação só acrescenta ao fim e o dado velho é apagado sozinho.");
  tf("t2", 3, 2, "O artigo-base diz que o NoSQL não tem relacionamentos diretos. Isso vale para todo banco NoSQL, inclusive o de grafos.", false,
    "Vale para chave-valor e documento. O banco de grafos é NoSQL e existe justamente para guardar relacionamentos.");
  choice("t2", 4, 3, "A Lena abre o site e a sessão dela (sessao:lena) vive só na RAM. O servidor reinicia. O que acontece, e por que isso é aceitável?", [
    "O pedido 1042 some, e é inaceitável.",
    "A sessão pode sumir e a Lena entra de novo: em memória só vale para dado que dá para reconstruir.",
    "A sessão volta sozinha, porque a RAM é durável.",
    "O banco relacional apaga os pedidos antigos."
  ], 1, "Alguns bancos em memória gravam um log em disco e recuperam durabilidade, ao custo de parte da velocidade. O pedido confirmado vai para o banco durável.");

  choice("t2", 5, 1, "As quatro letras do ACID, que os bancos SQL costumam trazer, são:", [
    "Atomicidade, Consistência, Integridade e Durabilidade.",
    "Atomicidade, Consistência, Isolamento e Durabilidade.",
    "Disponibilidade, Consistência, Isolamento e Durabilidade.",
    "Atomicidade, Concorrência, Isolamento e Disponibilidade."
  ], 1, "O artigo-base escreve \"Integridade\" no lugar do I. O I é Isolamento: transações simultâneas não enxergam o meio uma da outra.");

  /* ---------- 3. Níveis de consistência ---------- */
  choice("t3", 1, 1, "O que a consistência forte (linearizabilidade) garante?", [
    "Que as cópias convergem depois de um tempo.",
    "Que, depois de a escrita ser confirmada, toda leitura em qualquer servidor vê esse valor.",
    "Que nenhuma réplica fica atrasada por dentro.",
    "Que todas as escritas são gravadas num só servidor."
  ], 1, "Uma réplica pode estar atrasada por dentro, desde que o banco não responda a leitura com ela.");
  tf("t3", 2, 1, "O artigo-base trata linearizabilidade e sequential consistency como sinônimos. Está correto.", false,
    "Sequential consistency só exige que todos vejam as escritas na mesma ordem, sem prender essa ordem ao tempo real. É um modelo mais fraco. Forte é linearizabilidade.");
  choice("t3", 3, 2, "A Lena grava o pedido 1042 em Recife às 10:00:00 e SP só recebe a cópia às 10:00:02. A Bia consulta SP às 10:00:01. O que ela vê?", [
    "Com consistência forte, ou o 1042 ou espera; com a eventual, a lista sem o 1042.",
    "Nos dois casos, a lista sem o 1042.",
    "Nos dois casos, o 1042 na hora.",
    "Com a forte, a lista sem o 1042; com a eventual, o 1042."
  ], 0, "A eventual responde rápido porque não espera ninguém, e converge às 10:00:02. A forte nunca mostra a lista sem a escrita confirmada.");
  choice("t3", 4, 3, "Um banco com 3 réplicas grava e lê sempre com maioria (R + W > N). Alguém diz: \"uma réplica fica desatualizada, então é eventual\". Está certo?", [
    "Sim: qualquer réplica atrasada torna o banco eventual.",
    "Não: a leitura com quórum encontra a escrita nova, então segue forte para quem lê com quórum.",
    "Sim, porque o quórum só vale para escrita.",
    "Não: com quórum o banco passa a ser CA."
  ], 1, "Essa é uma das correções ao artigo. Também não existe \"forte é CA\": um banco distribuído forte, na partição, é CP.");

  /* ---------- 4. Modelo de tuplas ---------- */
  choice("t4", 1, 1, "Como o modelo de tuplas grava um pedido?", [
    "Cada coluna num arquivo próprio.",
    "A linha inteira, com os campos lado a lado, dentro de uma página de tamanho fixo.",
    "Como um documento JSON aninhado.",
    "Como aresta entre dois nós."
  ], 1, "Por isso ler ou gravar um pedido inteiro é barato.");
  choice("t4", 2, 2, "Na figura, cada linha de pedidos ocupa ~2 KB e a página é de 8 KB. Em quais páginas ficam os pedidos 1042 e 1046?", [
    "Os dois na página 1.",
    "1042 na página 1 e 1046 na página 2.",
    "1042 na página 2 e 1046 na página 1.",
    "Os dois na página 2."
  ], 1, "São 4 linhas por página: 1041 a 1044 na página 1, 1045 e 1046 na página 2.");
  choice("t4", 3, 2, "Quantas páginas SELECT SUM(valor) FROM pedidos lê no modelo de tuplas, e quanto dá a soma?", [
    "1 página e R$ 406,40.",
    "2 páginas (16 KB) e R$ 406,40.",
    "6 páginas e R$ 406,40.",
    "2 páginas e R$ 109,80."
  ], 1, "O banco só quer o campo valor, mas ele está dentro de cada linha. Precisa ler as 2 páginas para somar 6 números.");
  tf("t4", 4, 3, "A tela \"Meus pedidos\" que abre um pedido por vez (criar, consultar o 1042, corrigir endereço) é um uso em que o modelo de tuplas vai bem.", true,
    "Operações transacionais sobre um registro por vez são o ponto forte: a linha inteira numa página só.");

  /* ---------- 5. Modelo de documentos ---------- */
  choice("t5", 1, 1, "O que o aninhamento do modelo de documentos elimina?", [
    "O índice.",
    "O JOIN: os pedidos estão dentro do documento do cliente.",
    "A necessidade de schema no programa.",
    "A replicação."
  ], 1, "A Lena fica com os pedidos 1042 e 1044 dentro do documento e uma leitura traz tudo.");
  choice("t5", 2, 2, "No documento da Lena, qual é o total dos pedidos 1042 e 1044?", [
    "R$ 89,90.",
    "R$ 109,80.",
    "R$ 129,70.",
    "R$ 406,40."
  ], 1, "R$ 89,90 + R$ 19,90 = R$ 109,80, saindo do mesmo objeto.");
  choice("t5", 3, 3, "O documento de cada comprador do gato de pelúcia traz o preço R$ 89,90 embutido. O preço muda. O que acontece?", [
    "Muda num lugar só.",
    "É preciso reescrever todos os documentos que carregam o preço.",
    "O banco atualiza sozinho por causa do schema.",
    "Nada, o preço histórico some."
  ], 1, "Embutir lê mais rápido e envelhece o dado. No pedido, guardar o preço pago na hora da compra faz sentido justamente por isso.");
  tf("t5", 4, 3, "Segundo a aula, bancos de documentos como o MongoDB indexam os campos com B-Tree. O índice invertido de verdade, com busca por termos e relevância, é o dos motores de busca.", true,
    "É uma das correções ao artigo-base. Eles têm só um índice de texto básico; Elasticsearch e Solr são os motores de busca.");

  /* ---------- 6. Modelo colunar ---------- */
  choice("t6", 1, 1, "Como o modelo colunar guarda a tabela pedidos?", [
    "Um arquivo por coluna, com todos os valores dela juntos; a posição liga os arquivos.",
    "Um arquivo por cliente.",
    "Uma página por pedido.",
    "Um arquivo só, com as colunas misturadas."
  ], 0, "O pedido 1042 é o segundo valor de cada arquivo.");
  choice("t6", 2, 2, "Quantos arquivos o SUM(valor) abre no modelo colunar, e quantos o pedido 1042 inteiro?", [
    "1 e 6.",
    "6 e 1.",
    "1 e 1.",
    "2 e 6."
  ], 0, "A soma abre só o arquivo valor (R$ 406,40). Montar a linha inteira abre os 6 arquivos.");
  choice("t6", 3, 2, "A coluna cidade tem os valores Rio, Recife e SP. Como o dicionário a comprime?", [
    "Guarda 0, 1, 2, 1, 2, 2 e um dicionário (Rio=0, Recife=1, SP=2).",
    "Remove as cidades repetidas e perde linhas.",
    "Troca cada cidade pelo id do pedido.",
    "Grava só a primeira cidade."
  ], 0, "Com as linhas ordenadas por cidade, ainda vira Rio×1, Recife×2, SP×3 por repetição.");
  tf("t6", 4, 3, "O modelo colunar serve bem para o checkout da loja, que grava um pedido novo a cada compra.", false,
    "Gravar um pedido acrescenta um valor em 6 arquivos. O colunar serve para análise sobre muitas linhas, e raramente para o checkout.");

  /* ---------- 7. Coluna larga ---------- */
  choice("t7", 1, 1, "Qual é o papel da chave de partição na coluna larga?", [
    "Ordenar as colunas alfabeticamente.",
    "Agrupar os dados e decidir em qual servidor a partição mora.",
    "Comprimir cada coluna.",
    "Ligar um nó a outro."
  ], 1, "No exemplo da loja a chave é cliente: tudo da Lena fica junto.");
  choice("t7", 2, 2, "Como a Lena guarda os pedidos na partição cliente=Lena?", [
    "Em colunas dinâmicas pedido:1042 e pedido:1044.",
    "Em seis arquivos, um por coluna da tabela.",
    "Num par carrinho:lena → {1042}.",
    "Num nó ligado ao gato de pelúcia."
  ], 0, "A Bia tem as colunas dela (1043 e 1046), que não existem na linha da Lena.");
  tf("t7", 3, 2, "Colunar e coluna larga são o mesmo modelo com nomes diferentes.", false,
    "O colunar corta a tabela na vertical para somar rápido. Na coluna larga a linha continua existindo, tem chave, e o conjunto de colunas dela é que varia.");
  choice("t7", 4, 3, "Com a chave de partição cliente, qual consulta é barata e qual é cara?", [
    "Barata: pedidos de hoje. Cara: pedidos da Lena.",
    "Barata: pedidos da Lena. Cara: quais clientes compraram gato de pelúcia.",
    "As duas são baratas.",
    "As duas são caras."
  ], 1, "Sem a chave, o banco teria de olhar todas as partições. Em coluna larga, desenha-se a tabela a partir da consulta mais frequente.");

  /* ---------- 8. Chave-valor ---------- */
  choice("t8", 1, 1, "O que significa dizer que o valor é \"opaco\" num banco chave-valor?", [
    "Ele é criptografado.",
    "O banco não olha o que tem dentro do valor.",
    "Ele não pode ser alterado.",
    "Ele só aceita números."
  ], 1, "Filtrar pelo conteúdo é trabalho do programa.");
  choice("t8", 2, 2, "Quais pares a loja guarda para a Lena nesse modelo?", [
    "carrinho:lena → {1042} e sessao:lena → token de login.",
    "pedido:1042 e pedido:1044 numa partição.",
    "Um nó Lena e uma aresta COMPROU.",
    "Um índice invertido com pelúcia → [1042, 1043]."
  ], 0, "A sessão pode ter prazo de validade, e o banco apaga o par sozinho.");
  choice("t8", 3, 3, "A loja pergunta \"quais carrinhos têm o gato de pelúcia?\". O que o banco chave-valor faz?", [
    "Responde direto pela chave.",
    "Não consegue sozinho: o programa teria de ler todos os carrinhos.",
    "Consulta um índice invertido interno.",
    "Faz um JOIN com a tabela pedidos."
  ], 1, "Só a pergunta \"me dá o valor desta chave\" é rápida. O banco não ajuda a procurar, filtrar nem juntar.");
  tf("t8", 4, 2, "Para espalhar as chaves entre servidores, o hash da chave escolhe o servidor, e com hashing consistente só parte das chaves muda de lugar ao crescer.", true,
    "Cada par é independente, por isso é fácil dividir entre servidores.");

  /* ---------- 9. Grafos ---------- */
  choice("t9", 1, 1, "No modelo de grafos, o que são nós e arestas?", [
    "Nós são relacionamentos e arestas são entidades.",
    "Nós são entidades (Lena, gato de pelúcia) e arestas são relacionamentos com direção e nome (COMPROU).",
    "Nós são colunas e arestas são linhas.",
    "Nós são chaves e arestas são valores."
  ], 1, "As duas coisas são dados de primeira classe, e seguir de um nó ao vizinho é uma operação do banco.");
  choice("t9", 2, 2, "Como fica o pedido 1043 da Bia no grafo?", [
    "(Bia)-[COMPROU]->(gato de pelúcia)",
    "(Bia)-[COMPROU]->(caneca azul)",
    "(gato de pelúcia)-[COMPROU]->(Lena)",
    "(Lena)-[COMPROU]->(Bia)"
  ], 0, "O 1042 é (Lena)-[COMPROU]->(gato de pelúcia). A caneca azul recebe as arestas dos pedidos 1044 e 1046.");
  choice("t9", 3, 3, "Quem está olhando o gato de pelúcia. Qual recomendação a travessia devolve?", [
    "Camiseta preta.",
    "Caneca azul: Lena e Bia, que compraram o gato, também compraram a caneca.",
    "Gato de pelúcia de novo.",
    "Nenhuma, porque o grafo só responde por id."
  ], 1, "Do gato, siga COMPROU para trás até Lena e Bia, e de cada uma para frente até os outros produtos. A camiseta é do Davi.");
  tf("t9", 4, 3, "Um produto que milhões de pessoas compraram deixa a travessia mais barata, porque tem mais ligações prontas.", false,
    "O custo depende do grau dos nós. Um nó muito popular é pesado e custa caro em toda travessia que passa por ele.");

  /* ---------- 10. Page size e indexação colunar ---------- */
  choice("t10", 1, 1, "Qual o tamanho de página do PostgreSQL e do InnoDB (MySQL)?", [
    "8 KB e 16 KB.",
    "16 KB e 8 KB.",
    "4 KB nos dois.",
    "8 KB nos dois."
  ], 0, "O SQL Server também usa 8 KB. O valor costuma ser fixado na compilação ou na criação da instância.");
  choice("t10", 2, 2, "Com linhas de ~2 KB, quantas páginas ocupam as 6 linhas de pedidos?", [
    "2 páginas de 8 KB ou 1 de 16 KB.",
    "6 páginas de 8 KB ou 3 de 16 KB.",
    "1 página de 8 KB ou 1 de 16 KB.",
    "3 páginas de 8 KB ou 2 de 16 KB."
  ], 0, "Cabem 4 linhas por página de 8 KB e 8 por página de 16 KB.");
  choice("t10", 3, 2, "Ler o pedido 1042 (~2 KB) numa página de 16 KB. O que o banco lê?", [
    "Só os ~2 KB da linha.",
    "A página inteira, 16 KB.",
    "A tabela inteira.",
    "Duas páginas de 8 KB."
  ], 1, "Toda leitura traz uma página inteira. Página grande ajuda leituras em sequência e traz mais lixo numa busca pontual.");
  tf("t10", 4, 3, "O custo de uma consulta se conta em páginas lidas, e não em linhas.", true,
    "Esse número reaparece em todos os índices das aulas seguintes. No formato colunar, o mínimo e o máximo de cada segmento ainda deixam pular segmentos inteiros.");

  /* ---------- 11. LSM-Trees ---------- */
  order("t11", 1, 2, "Ordene o caminho de uma escrita numa LSM-Tree.", [
    "Anotar no fim do WAL",
    "Colocar na memtable, e o banco já responde \"gravado\"",
    "Memtable cheia: despejar como SSTable imutável",
    "Compactação junta SSTables e descarta versões velhas e tombstones"
  ], "Tudo é acréscimo e sequência. Nenhuma página do meio do disco é tocada na escrita.");
  choice("t11", 2, 2, "Memtable de 4 entradas e pedidos 1041 a 1046 chegando. Qual o estado depois do 1046?", [
    "SSTable 1 com 1041 a 1044; memtable e WAL com 1045 e 1046.",
    "SSTable 1 com 1041 a 1046.",
    "Tudo na memtable.",
    "SSTable 1 com 1045 e 1046; memtable com 1041 a 1044."
  ], 0, "A memtable enche com 4 entradas e vira a SSTable 1. Os dois seguintes ficam na memtable (e no WAL).");
  choice("t11", 3, 3, "A loja apaga o pedido 1044 e atualiza o 1042. O que a LSM faz, e quem limpa depois?", [
    "Reescreve a SSTable antiga no mesmo lugar.",
    "Grava um tombstone para o 1044 e uma versão nova do 1042; a compactação limpa depois.",
    "Apaga o 1044 do arquivo na hora.",
    "Recusa a atualização até a compactação."
  ], 1, "Os arquivos antigos são imutáveis. A leitura procura na memtable e nas SSTables, da mais nova à mais antiga.");
  tf("t11", 4, 3, "Como a LSM guarda todas as versões dos dados, ela serve de trilha de auditoria.", false,
    "A compactação descarta versões antigas e tombstones. Para auditoria, modela-se uma tabela só de inserções (ledger). Também o DynamoDB não entra na lista de LSM: o artigo dele descreve B-tree e log de escrita antecipada.");

  /* ---------- 12. B-Tree ---------- */
  choice("t12", 1, 1, "Como a B-Tree da loja (raiz [1043], folhas [1041, 1042] e [1043 a 1046]) acha o pedido 1042?", [
    "Lê a raiz, vê que 1042 < 1043 e desce para a folha da esquerda: 2 leituras de página.",
    "Lê as duas folhas: 2 leituras.",
    "Lê só a folha da direita: 1 leitura.",
    "Aplica uma função hash."
  ], 0, "A varredura também lê 2 páginas. Com 6 linhas, os dois empatam.");
  choice("t12", 2, 2, "Com 1 milhão de pedidos de 2 KB em páginas de 8 KB, quantas páginas a varredura e a B-Tree leem?", [
    "250.000 e 4.",
    "4 e 250.000.",
    "1.000.000 e 4.",
    "250.000 e 250.000."
  ], 0, "Cada página do nó interno guarda centenas de chaves. A árvore cresce em largura, e não em altura.");
  tf("t12", 3, 2, "Como as chaves ficam ordenadas e as folhas ligadas em sequência, a B-Tree também responde a faixas, como pedidos de 1042 a 1045.", true,
    "A busca acha o 1042 e segue pelas folhas vizinhas. O que os bancos usam de verdade é a B+Tree.");
  choice("t12", 4, 3, "Uma folha enche quando entra um pedido novo. O que a B-Tree faz?", [
    "A folha se divide em duas e a chave do meio sobe para o nó de cima.",
    "Apaga a folha mais antiga.",
    "Passa a varrer a tabela.",
    "Cria um tombstone."
  ], 0, "A árvore continua equilibrada e toda busca custa o mesmo número de níveis. O preço está na escrita: achar a folha e, às vezes, dividir páginas.");

  /* ---------- 13. Hashing ---------- */
  choice("t13", 1, 1, "No exemplo da loja (4 baldes, 1042 % 4), em que balde cai o pedido 1042?", [
    "Balde 0.",
    "Balde 1.",
    "Balde 2.",
    "Balde 3."
  ], 2, "1042 % 4 = 2. Para ler, repete a conta e vai direto ao balde 2.");
  choice("t13", 2, 2, "O pedido 1046 também cai no balde 2. Como se chama isso, e como o banco acha o pedido certo?", [
    "Colisão: o balde guarda uma lista (1042 → 1046) e a busca compara as chaves.",
    "Erro: o banco recusa a gravação.",
    "Tombstone: o 1046 apaga o 1042.",
    "Split: o balde se divide em dois."
  ], 0, "O balde 1 também tem uma lista: 1041 e 1045.");
  choice("t13", 3, 3, "WHERE id BETWEEN 1042 AND 1045 num índice hash. O que acontece?", [
    "Vai direto ao balde 2.",
    "Sem atalho: 1042, 1043, 1044 e 1045 caem nos baldes 2, 3, 0 e 1, então é preciso olhar todos.",
    "Usa a raiz e as folhas.",
    "Consulta o índice invertido."
  ], 1, "O hash espalha as chaves e perde a ordem. Para faixa, a escolha é a B-Tree.");
  tf("t13", 4, 3, "A busca por hash é instantânea: o custo é sempre o mesmo, não importa quantas colisões existam.", false,
    "É custo constante em média. As colisões fazem a lista do balde crescer, e uma tabela cheia demais precisa ser refeita com mais baldes.");

  /* ---------- 14. Índices invertidos ---------- */
  choice("t14", 1, 1, "O que o índice invertido mapeia?", [
    "Cada pedido para as palavras que ele tem.",
    "Cada termo para os documentos em que ele aparece.",
    "Cada chave para um balde.",
    "Cada coluna para um arquivo."
  ], 1, "Em vez de ir do pedido para as palavras, vai da palavra para os pedidos.");
  choice("t14", 2, 2, "Na loja, qual é a entrada de pelúcia e a de caneca no índice?", [
    "pelúcia → [1042, 1043]; caneca → [1041, 1044, 1046].",
    "pelúcia → [1042]; caneca → [1041, 1044].",
    "pelúcia → [1042, 1043, 1044]; caneca → [1041, 1046].",
    "pelúcia → [1041]; caneca → [1042, 1043]."
  ], 0, "As duas entradas respondem sem abrir nenhum dos 6 pedidos.");
  order("t14", 3, 2, "Ordene as etapas para montar o índice do pedido 1042 (gato de pelúcia).", [
    "Normalização: tudo em minúsculas",
    "Tokenização: gato, de, pelúcia",
    "Descartar palavras sem valor, como de",
    "Gravar o 1042 na lista de cada termo"
  ], "O custo vai para a gravação e a leitura fica curta.");
  tf("t14", 4, 3, "O índice invertido é característico dos bancos de documentos como o MongoDB.", false,
    "Ele é o coração dos motores de busca (Elasticsearch, Solr, Lucene). O MongoDB indexa campos com B-Tree. No PostgreSQL, o GIN é um índice invertido.");

  /* ---------- 15. Escrita intensiva e leitura intensiva ---------- */
  choice("t15", 1, 1, "Que combinação a aula indica para um cenário transacional, como a Lena pagando o gato de pelúcia?", [
    "LSM, replicação assíncrona e consistência eventual.",
    "Banco relacional com B-Tree e consistência forte.",
    "Chave-valor em memória sem durabilidade.",
    "Colunar com consistência eventual."
  ], 1, "Pede atomicidade, ACID e leitura imediata da última escrita. O preço é latência no commit.");
  choice("t15", 2, 2, "Milhões de eventos de clique por segundo, e nenhum pode se perder. Qual a escolha?", [
    "Relacional com B-Tree em todos os campos.",
    "NoSQL com LSM (Cassandra, ScyllaDB) e replicação assíncrona.",
    "Índice hash em memória.",
    "Grafo."
  ], 1, "Aceita-se consistência eventual. Mas é tendência, não obrigação: Cassandra e ScyllaDB deixam ajustar o quórum por consulta.");
  choice("t15", 3, 3, "O catálogo é lido mil vezes mais do que gravado, e as telas pedem outro formato. O que a aula sugere?", [
    "Primário consistente com réplicas de leitura, cache em chave-valor e, se preciso, CQRS com um modelo de leitura derivado.",
    "Trocar tudo por LSM.",
    "Remover os índices.",
    "Passar a gravar também nas réplicas de leitura."
  ], 0, "O CQRS protege a fonte de verdade dos picos de leitura. O preço é o dado possivelmente velho.");
  tf("t15", 4, 3, "O DynamoDB serve bem à escrita intensiva por usar LSM.", false,
    "O artigo científico do DynamoDB descreve B-tree e log de escrita antecipada. Ele serve bem por partições, replicação e escala gerenciada.");

  window.QUIZ = out;
})();
