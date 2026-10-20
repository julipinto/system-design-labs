/* Banco de perguntas do quiz de Estratégias de Cache.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-cache", name: "Introdução ao cache" },
    t2: { topic: "aula-2-consistencia-e-ttl", name: "Consistência e TTL" },
    t3: { topic: "aula-3-eviccao-e-invalidacao", name: "Evicção e invalidação" },
    t4: { topic: "aula-4-hit-miss-e-hit-rate", name: "Hit, miss e hit rate" },
    t5: { topic: "aula-5-memoria-e-distribuido", name: "Memória e distribuído" },
    t6: { topic: "aula-6-cache-aside-write-through-write-behind-e-cdn", name: "Cache-aside, write-through, write-behind e CDN" },
    t7: { topic: "aula-7-criando-uma-cdn", name: "Criando uma CDN" }
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

  /* ---------- 1. Introdução ao cache ---------- */
  choice("t1", 1, 1, "O que é um cache, numa frase?", [
    "Um banco de dados que não precisa de disco.",
    "Uma cópia do dado guardada num lugar mais rápido ou mais perto de quem pergunta.",
    "Um programa que apaga dados velhos do banco.",
    "Um tipo de índice que só existe no Redis."
  ], 1, "Cache é a ideia de guardar uma cópia perto. Redis, CDN e hashmap só a implementam.");
  tf("t1", 2, 1, "Cache e Redis são a mesma coisa.", false,
    "O Redis é uma das formas de ter um cache. Um map em memória dentro do programa, ou uma CDN, também são caches.");
  choice("t1", 3, 2, "No exemplo da loja, o banco lê o produto:42 em 40 ms e o Redis em 1 ms. Quantas vezes o Redis é mais rápido?", [
    "4 vezes.",
    "10 vezes.",
    "40 vezes.",
    "400 vezes."
  ], 2, "40 ms ÷ 1 ms = 40. O hashmap na memória do app, com 0,05 ms, chega a 800 vezes mais rápido que o banco.");
  choice("t1", 4, 2, "Por que um cache funciona, se ele guarda só uma parte dos dados?", [
    "Porque poucos dados são pedidos muitas vezes, e o que foi lido agora tende a ser lido de novo (localidade).",
    "Porque o cache é sempre maior que o banco.",
    "Porque o banco apaga o que o cache não tem.",
    "Porque cada pedido grava a loja inteira na memória."
  ], 0, "É a localidade: o produto 42 é pedido milhares de vezes e a maioria dos outros quase nunca.");
  order("t1", 5, 2, "Ordene o caminho do primeiro pedido do produto:42 num cache-aside, e o do segundo.", [
    "O app pergunta ao cache e recebe um miss",
    "O app lê o banco (40 ms)",
    "O app guarda a cópia no cache com TTL de 60 s e responde",
    "No pedido seguinte, o cache responde em 1 ms (hit)"
  ], "Primeiro o cache, depois o banco só no miss, e a cópia é guardada antes de responder, para o próximo pedido ser hit.");
  choice("t1", 6, 3, "Qual destes dados menos se beneficia de cache?", [
    "A página do gato de pelúcia, lida milhares de vezes por hora e alterada uma vez por semana.",
    "A foto do gato, que só muda quando a loja troca o produto.",
    "Um valor que muda a cada instante e quase nunca é lido duas vezes seguidas.",
    "A lista de categorias da loja."
  ], 2, "Sem leitura repetida não há hit, e sem hit o cache só acrescenta a viagem a mais. Na aula 4 isso vira conta.");

  /* ---------- 2. Consistência e TTL ---------- */
  choice("t2", 1, 1, "O que é o TTL de uma chave no cache?", [
    "O tamanho máximo da chave.",
    "O prazo de validade: depois dele a cópia some e o próximo pedido é um miss.",
    "O número de réplicas que guardam a chave.",
    "O tempo que o banco leva para responder."
  ], 1, "TTL é time to live. Na loja, 60 s para o produto:42.");
  tf("t2", 2, 1, "Com TTL de 60 s, o cache nunca mostra um preço velho.", false,
    "O TTL só limita por quanto tempo o dado velho dura. Durante os 60 s, o cache pode estar atrás do banco.");
  choice("t2", 3, 2, "O cache foi gravado em t = 0 com 89.90 e TTL de 60 s. O preço muda no banco para 79.90 em t = 20 s, sem apagar a chave. Por quanto tempo o cache mostra o preço velho?", [
    "20 s.",
    "40 s.",
    "60 s.",
    "Até alguém reiniciar o cache."
  ], 1, "De t = 20 s até o TTL vencer em t = 60 s: 40 s.");
  choice("t2", 4, 2, "Qual o pior caso de dado velho com TTL de 60 s?", [
    "Quase os 60 s inteiros: o preço muda logo depois de o cache ser gravado.",
    "Zero: o TTL sempre apaga a chave na hora.",
    "30 s, a metade do TTL.",
    "Infinito, enquanto o produto for pedido."
  ], 0, "Quanto mais cedo a mudança vier depois da gravação, mais tempo a cópia velha dura, até o TTL inteiro.");
  choice("t2", 5, 2, "Como a loja garante zero segundo de dado velho num preço?", [
    "Usando um TTL de 1 hora.",
    "Pedindo à Lena que recarregue a página.",
    "Quem grava o 79.90 no banco também apaga a chave produto:42 do cache.",
    "Trocando o banco por um mais rápido."
  ], 2, "Com a chave apagada, o próximo pedido é um miss e traz o preço novo do banco.");
  choice("t2", 6, 3, "Um usuário foi bloqueado por atividade suspeita. O cadastro dele está no cache com TTL de 60 s. O que fazer?", [
    "Nada: 60 s é pouco.",
    "Reduzir o TTL de todo o cache para 1 s.",
    "Esperar o TTL, mas avisar a equipe.",
    "Apagar a chave do cadastro na mesma operação que bloqueia o usuário."
  ], 3, "Dado que não pode esperar o prazo pede invalidação na hora da escrita, como diz o artigo-base.");
  choice("t2", 7, 3, "Mil produtos foram gravados no cache no mesmo segundo, com 60 s de TTL. O que acontece em t = 60 s, e o que ajuda?", [
    "Os mil vencem juntos e o banco recebe mil misses de uma vez (stampede); variar um pouco o TTL de cada chave ajuda.",
    "Nada: o Redis apaga uma chave por vez.",
    "O cache dobra de tamanho.",
    "O banco ignora os pedidos até o cache voltar."
  ], 0, "Chaves que vencem juntas viram uma onda de misses. Espalhar os vencimentos (TTL com variação) alivia o banco.");

  /* ---------- 3. Evicção e invalidação ---------- */
  choice("t3", 1, 1, "O que é evicção?", [
    "Apagar uma chave por ordem do usuário.",
    "Tirar uma cópia do cache porque ele encheu e chegou uma chave nova.",
    "Copiar o cache para outro servidor.",
    "Fazer o TTL de uma chave voltar a 60 s."
  ], 1, "Evicção é por falta de espaço. A política (LRU, LFU, FIFO) escolhe quem sai.");
  choice("t3", 2, 2, "Cache de 3 vagas. Os acessos foram produto:42, 7, 42 e 13, e o cache ficou com [42, 7, 13]. Chega o produto:99. Quem sai na LRU?", [
    "produto:42.",
    "produto:13.",
    "Ninguém: a LRU aumenta o cache.",
    "produto:7."
  ], 3, "Na LRU sai o que ficou mais tempo sem ser pedido. O 7 foi o último pedido há 3 acessos; o 42 há 2 e o 13 há 1.");
  choice("t3", 3, 2, "Na mesma sequência (42, 7, 42, 13, 99), quem sai na FIFO?", [
    "produto:42, o primeiro a entrar.",
    "produto:7.",
    "produto:13.",
    "produto:99."
  ], 0, "A FIFO só olha a ordem de entrada. Ela tira o produto 42, justamente o mais pedido.");
  choice("t3", 4, 2, "Na mesma sequência, quem sai na LFU, e como é o desempate?", [
    "produto:42, que tem mais pedidos.",
    "produto:13, que é o mais novo.",
    "produto:7: tem 1 pedido, como o 13, e vence o empate por ser o mais antigo.",
    "Sai um sorteado."
  ], 2, "O 42 tem 2 pedidos; o 7 e o 13 têm 1. O empate é desfeito pelo mais antigo, o 7. A regra do desempate varia entre implementações.");
  choice("t3", 5, 3, "Depois da evicção, chega um novo pedido do produto:42. Em qual política ele é miss?", [
    "Na LRU.",
    "Na LFU.",
    "Na FIFO: o 42 foi tirado.",
    "Em nenhuma: o 42 sempre fica."
  ], 2, "A LRU e a LFU mantiveram o 42 e dão hit. A FIFO tirou o 42 e dá miss.");
  tf("t3", 6, 1, "Evicção, TTL e invalidação são três nomes para a mesma coisa.", false,
    "Evicção sai por espaço, TTL por tempo e invalidação por evento (um comando, como DEL, ou uma regra).");
  choice("t3", 7, 3, "O que a política noeviction do Redis faz quando a memória acaba?", [
    "Apaga as chaves mais antigas.",
    "Não tira nada e devolve erro nas gravações.",
    "Aumenta a memória sozinho.",
    "Desliga o servidor."
  ], 1, "Com noeviction nenhuma chave é tirada, e o Redis recusa novas gravações até haver espaço.");

  /* ---------- 4. Hit, miss e hit rate ---------- */
  choice("t4", 1, 1, "Como se calcula o hit rate?", [
    "Misses dividido por hits.",
    "Hits dividido por hits mais misses.",
    "Hits menos misses.",
    "Tempo do cache dividido pelo tempo do banco."
  ], 1, "Hit rate = hits ÷ (hits + misses), normalmente em porcentagem.");
  choice("t4", 2, 2, "Em 10 pedidos da página do gato, o cache respondeu 8 e mandou 2 ao banco. Qual o hit rate?", [
    "20%.",
    "40%.",
    "80%.",
    "8%."
  ], 2, "8 ÷ 10 = 80%.");
  choice("t4", 3, 2, "Hit de 1 ms, banco de 40 ms. Qual o tempo médio com 80% de hit rate?", [
    "9 ms.",
    "8 ms.",
    "16 ms.",
    "32 ms."
  ], 0, "0,8 × 1 + 0,2 × (1 + 40) = 0,8 + 8,2 = 9 ms. Sem cache seriam 40 ms.");
  choice("t4", 4, 2, "Por que um miss custa 41 ms na loja, e não 40?", [
    "Porque o banco é mais lento quando o cache está cheio.",
    "Porque o miss também paga 1 ms para perguntar ao cache antes de ir ao banco.",
    "Porque o Redis cobra pela gravação.",
    "Porque o TTL soma 1 ms."
  ], 1, "O app pergunta ao cache (1 ms), não acha e então lê o banco (40 ms).");
  choice("t4", 5, 3, "Com 0% de hit rate, 1 ms de cache e 40 ms de banco, o que acontece com a página?", [
    "Fica igual a não ter cache.",
    "Fica 4 vezes mais rápida.",
    "Fica um pouco mais lenta: 41 ms contra 40 ms.",
    "O cache esvazia e o banco cai."
  ], 2, "Todo pedido paga a ida ao cache e a ida ao banco. O cache só compensa acima de 1 ÷ 40 = 2,5% de hit rate, nessa conta.");
  choice("t4", 6, 3, "O hit rate sobe de 80% para 90%. O que muda para o banco?", [
    "Ele recebe metade das leituras: de 20% para 10%.",
    "Nada: o banco continua recebendo tudo.",
    "Ele recebe 10% a mais de leituras.",
    "Ele passa a receber só escritas."
  ], 0, "Os misses caem de 20% para 10% dos pedidos. O tempo médio cai de 9 para 5 ms.");
  tf("t4", 7, 2, "800 hits e 200 misses dão o mesmo hit rate que 8 hits e 2 misses.", true,
    "Os dois dão 80%. O hit rate é uma proporção, e não depende do total.");

  /* ---------- 5. Memória e distribuído ---------- */
  choice("t5", 1, 1, "Quanto custa, no exemplo da loja, ler do hashmap na memória do app?", [
    "40 ms.",
    "1 ms.",
    "0,05 ms.",
    "5 ms."
  ], 2, "0,05 ms: não passa pela rede. O Redis custa 1 ms e o banco 40 ms.");
  choice("t5", 2, 2, "O preço muda para 79.90 em t = 20 s. A réplica A guardou o cache em t = 0, a B em t = 10 e a C em t = 30. O que cada uma mostra?", [
    "As três mostram 79.90.",
    "A e B mostram 89.90; C mostra 79.90.",
    "A mostra 89.90; B e C mostram 79.90.",
    "As três mostram 89.90."
  ], 1, "A e B guardaram antes da mudança. C guardou depois e já pegou o preço novo. A Lena recarrega a página e o preço pisca.");
  choice("t5", 3, 2, "Dez pedidos em rodízio entre 3 réplicas, cada uma com o seu hashmap. Qual o hit rate, comparado com um Redis só?", [
    "70% (3 misses) contra 90% (1 miss).",
    "90% contra 70%.",
    "Os dois dão 80%.",
    "Os dois dão 100%."
  ], 0, "Cada réplica faz o seu próprio primeiro miss: 3 misses e 7 hits. Com um cache compartilhado, só o primeiro pedido é miss.");
  tf("t5", 4, 2, "As threads de um mesmo processo compartilham o hashmap, e por isso o código usa um mutex.", true,
    "O escopo do hashmap é o processo, e não a thread. Outra réplica é outro processo e não enxerga o mapa.");
  choice("t5", 5, 3, "Qual dado cabe melhor num hashmap local de cada réplica, e qual pede o Redis compartilhado?", [
    "Preço e estoque no hashmap, lista de categorias no Redis.",
    "Os dois pedem o hashmap.",
    "Lista de categorias no hashmap; preço e estoque no Redis compartilhado.",
    "Os dois pedem o Redis."
  ], 2, "A lista de categorias aguenta alguns segundos de diferença entre réplicas. Preço e estoque pedem uma cópia só.");
  tf("t5", 6, 3, "O Redis Cluster garante consistência forte entre os nós.", false,
    "A replicação é assíncrona: uma escrita confirmada ao cliente pode se perder numa troca de primário. Num cache, o dado perdido volta com um miss.");

  /* ---------- 6. Cache-aside, write-through, write-behind e CDN ---------- */
  choice("t6", 1, 1, "Como funciona o cache-aside?", [
    "O app grava só no cache e a fila grava no banco depois.",
    "O app pergunta ao cache; no miss, lê o banco, guarda a cópia e responde.",
    "O cache lê o banco sozinho e o app nunca o vê.",
    "O banco empurra todo dado novo para o cache."
  ], 1, "No cache-aside quem comanda é o app, e o cache só recebe o que já foi pedido.");
  choice("t6", 2, 2, "No write-through, o banco leva 40 ms e o cache 1 ms. Quanto leva a escrita, no exemplo?", [
    "1 ms.",
    "40 ms.",
    "41 ms.",
    "0,05 ms."
  ], 2, "A escrita grava nos dois, e leva a soma: 40 + 1 = 41 ms. Em troca, a leitura nunca vê o 89.90.");
  choice("t6", 3, 2, "No write-through, qual a ordem segura?", [
    "Gravar o cache primeiro e o banco depois.",
    "Gravar o banco primeiro e o cache depois.",
    "Gravar os dois sem ordem.",
    "Gravar só o cache."
  ], 1, "Se o cache falhar depois do banco, o pior é um dado velho por um tempo. Na ordem contrária, o cache teria um preço que o banco nunca recebeu.");
  choice("t6", 4, 3, "No write-behind, o Redis cai antes de a fila esvaziar. O que o banco diz sobre o preço?", [
    "79.90, porque a fila já foi toda enviada.",
    "89.90: o 79.90 estava só no cache e na fila, e se perdeu.",
    "Nenhum preço: a tabela é apagada.",
    "Os dois preços ao mesmo tempo."
  ], 1, "Write-behind confirma a escrita em 1 ms, mas o dado só chega ao banco depois. É a única das três estratégias em que um dado confirmado se perde.");
  order("t6", 5, 2, "Ordene o write-behind da mudança de preço.", [
    "O app grava o 79.90 só no cache (1 ms)",
    "O app responde que o preço foi gravado",
    "O 79.90 entra numa fila",
    "Um processo à parte grava o 79.90 no banco"
  ], "A resposta sai antes de o banco saber da mudança. Por isso, se o cache cair antes do último passo, a escrita se perde.");
  choice("t6", 6, 2, "O que significa Cache-Control: public, max-age=3600 na resposta da foto?", [
    "Só o navegador pode guardar, por 3600 ms.",
    "Qualquer cache, inclusive a CDN, pode guardar por 3600 s.",
    "A foto vale por 3600 acessos.",
    "A foto foi gerada às 3600 horas."
  ], 1, "public libera os caches compartilhados, como a CDN. max-age=3600 é o prazo, em segundos: 1 hora.");
  tf("t6", 7, 3, "X-Cache: HIT e X-Cache: MISS são cabeçalhos padronizados em todas as CDNs.", false,
    "É uma convenção. Cada CDN dá o seu nome: a Cloudflare usa cf-cache-status, por exemplo.");

  /* ---------- 7. Criando uma CDN ---------- */
  choice("t7", 1, 1, "Como o proxy do laboratório escolhe o nome do arquivo de cache?", [
    "Pelo nome da foto.",
    "Pelo horário do pedido.",
    "Por um número que cresce a cada miss.",
    "Pelo SHA-1 do texto método + caminho + query."
  ], 3, "O hash dá um nome fixo para o mesmo pedido, sem barras no meio.");
  choice("t7", 2, 2, "Para GET /gato.jpg, o texto da chave é GET/gato.jpg. Como é o arquivo em cache/?", [
    "cache/gato.jpg.",
    "cache/GET.",
    "Um nome de 40 caracteres, começando com f34b9897…",
    "cache/1."
  ], 2, "O SHA-1 de GET/gato.jpg é f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa.");
  choice("t7", 3, 3, "O dono da loja troca o gato.jpg na origem, mas a Lena continua vendo a foto velha no proxy do laboratório. Por quê?", [
    "O proxy do laboratório não tem TTL: o arquivo existe, então todo pedido é hit.",
    "A origem esqueceu de salvar a foto nova.",
    "A foto nova ficou pesada demais.",
    "O SHA-1 mudou a cada pedido."
  ], 0, "Sem prazo de validade, a cópia dura até alguém apagar o arquivo à mão.");
  choice("t7", 4, 3, "A origem responde 404 ao proxy do laboratório. O que o proxy faz?", [
    "Responde 404 à Lena e não grava nada.",
    "Tenta de novo a cada segundo.",
    "Avisa o dono da loja.",
    "Grava a página de erro como se fosse a foto e passa a servi-la como hit, com status 200."
  ], 3, "O http.Get não devolve erro para 404 ou 500, e o código não olha o status. A página de erro fica guardada como se fosse a foto.");
  choice("t7", 5, 2, "Numa CDN de verdade, o max-age venceu. Como o edge confere se a foto mudou, sem baixá-la de novo?", [
    "Baixa a foto inteira outra vez.",
    "Apaga a cópia e espera o próximo pedido.",
    "Pergunta com If-None-Match e o ETag; se não mudou, a origem responde 304 Not Modified, sem corpo.",
    "Usa o Age para adivinhar."
  ], 2, "A viagem custa os ~50 ms, mas os 120 KB não voltam a viajar. Se mudou, a origem responde 200 com a foto nova.");
  tf("t7", 6, 3, "No laboratório, GET /gato.jpg?v=2 faz o proxy pedir uma foto diferente à origem.", false,
    "A query entra na chave (cria outro arquivo), mas a URL da origem usa só o Path. Os dois arquivos guardam a mesma resposta.");

  window.QUIZ = out;
})();
