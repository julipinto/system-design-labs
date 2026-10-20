/* Banco de perguntas do quiz de Load Balancers e Proxies Reversos.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-balanceadores-escalabilidade-e-healthchecks", name: "Balanceadores, escalabilidade e healthchecks" },
    t2: { topic: "aula-2-load-balancer-vs-proxy-reverso", name: "Load balancer vs proxy reverso" },
    t3: { topic: "aula-3-round-robin", name: "Round robin" },
    t4: { topic: "aula-4-least-request", name: "Least request" },
    t5: { topic: "aula-5-least-connection", name: "Least connection" },
    t6: { topic: "aula-6-least-outstanding-requests", name: "Least outstanding requests" },
    t7: { topic: "aula-7-ip-hash-maglev-e-random", name: "IP hash, Maglev e random" },
    t8: { topic: "aula-8-camadas-4-e-7", name: "Camadas 4 e 7" },
    t9: { topic: "aula-9-tecnologias-de-mercado", name: "Tecnologias de mercado" },
    t10: { topic: "aula-10-laboratorio-envoy", name: "Laboratório com Envoy" }
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

  /* ---------- 1. Balanceadores, escalabilidade e healthchecks ---------- */
  choice("t1", 1, 1, "O que um balanceador de carga faz?", [
    "Guarda cópias das páginas para responder mais rápido.",
    "Recebe todos os pedidos num endereço só e escolhe, pedido a pedido, qual réplica responde.",
    "Cria réplicas novas quando a loja cresce.",
    "Troca o IP das réplicas a cada pedido."
  ], 1, "O balanceador é o ponto único de entrada. Guardar cópias é papel do cache, e criar réplicas é papel de quem escala a loja.");
  choice("t1", 2, 2, "Sem balanceador, os 9 primeiros pedidos chegam todos ao catalogo-1. Qual é o resultado?", [
    "Os três servidores dividem o trabalho em partes iguais.",
    "O catalogo-1 vai a 100% de CPU, as outras duas ficam em 0%, e a página do gato vai de 20 ms para 1,8 s.",
    "O DNS troca de IP sozinho e redistribui os pedidos.",
    "Os pedidos extras são descartados em silêncio."
  ], 1, "O DNS devolveu um IP só, o do catalogo-1. É a fila do mercadinho com um caixa só.");
  choice("t1", 3, 1, "Qual é o healthcheck da loja?", [
    "GET /health a cada 5 s, com timeout de 1 s; 3 falhas seguidas tiram a réplica e 2 sucessos a devolvem.",
    "Um ping por minuto; uma falha tira a réplica para sempre.",
    "GET /produtos/42 a cada pedido real da Lena.",
    "Uma pessoa confere os servidores a cada hora."
  ], 0, "São 5 s de intervalo, 1 s de timeout, 3 falhas para sair e 2 sucessos para voltar.");
  choice("t1", 4, 2, "A catalogo-2 trava às 20:00:00. Quando ela sai do pool e quantos pedidos falham até lá?", [
    "Às 20:00:05; nenhum falha.",
    "Às 20:00:15; 1 de cada 3 pedidos cai nela e falha (502 ou 504).",
    "Às 20:01:00; todos falham.",
    "Às 20:00:15; 1 de cada 10 pedidos falha."
  ], 1, "Os checks falham às 20:00:05, :10 e :15 (5 s × 3 = 15 s). Com 3 réplicas no pool, 1 de cada 3 pedidos cai na que travou.");
  order("t1", 5, 2, "Ordene o que acontece com a catalogo-2, da queda à volta ao pool.", [
    "20:00:00: a catalogo-2 trava",
    "20:00:15: o terceiro check falha e ela sai do pool",
    "20:05:00: ela volta a responder",
    "20:05:10: o segundo check bom a devolve ao pool"
  ], "Para sair, 3 falhas seguidas (5 s cada). Para voltar, 2 sucessos seguidos: os checks das 20:05:05 e 20:05:10.");
  choice("t1", 6, 3, "A loja escala e sobe a catalogo-4 (10.0.1.14). O que acontece com os pedidos?", [
    "A Lena precisa trocar o endereço que digita.",
    "O balanceador precisa ser reiniciado.",
    "Assim que o primeiro healthcheck dela passa, o balanceador já manda pedidos para ela, sem ninguém avisar a Lena.",
    "Os pedidos só chegam a ela na próxima Black Friday."
  ], 2, "O pool é do balanceador. Quem está de fora só vê o endereço do lb-loja, 203.0.113.10.");

  /* ---------- 2. Load balancer vs proxy reverso ---------- */
  choice("t2", 1, 1, "Qual é a diferença entre proxy reverso e load balancer?", [
    "O proxy reverso fica na frente de um servidor (1:1) e o load balancer na frente de vários (1:N).",
    "O proxy reverso só funciona na internet e o load balancer só na rede interna.",
    "O proxy reverso lê HTTP e o load balancer nunca lê.",
    "São a mesma coisa com nomes de empresas diferentes."
  ], 0, "São dois padrões de uso. O que muda é quantos servidores existem atrás e o que se pede ao aparelho.");
  tf("t2", 2, 1, "Envoy, NGINX e HAProxy são balanceadores e não podem ser proxies reversos.", false,
    "São ferramentas que implementam os dois padrões. O padrão depende de como se usa.");
  choice("t2", 3, 2, "O NGINX na frente do pagamentos (um host só) faz qual destes trabalhos?", [
    "Escolher entre três réplicas do pagamentos.",
    "Termina o TLS, limita upload a 1 MB, esconde o IP interno e guarda cache.",
    "Tirar réplicas do pool quando travam.",
    "Trocar o algoritmo de balanceamento."
  ], 1, "Com um servidor só não há o que escolher. O valor do proxy está em tudo o que faz pelo host atrás dele.");
  choice("t2", 4, 2, "A Lena fala com o NGINX na frente do pagamentos. Ela chega a falar com o próprio pagamentos?", [
    "Sim, o NGINX só passa o IP dele para ela.",
    "Sim, depois do primeiro pedido.",
    "Não: ela fala com o proxy, nunca com o pagamentos, e o IP interno fica escondido.",
    "Só se o upload for maior que 1 MB."
  ], 2, "Esconder a infraestrutura é um dos papéis do proxy reverso.");
  choice("t2", 5, 3, "Qual pergunta ajuda a escolher entre os dois padrões?", [
    "Qual é a marca da ferramenta?",
    "Quantos servidores existem atrás e o que eu preciso dele: só cuidar de um, ou escolher entre vários e tirar do pool o que parou?",
    "Quantos clientes a loja tem?",
    "O servidor está na nuvem ou no escritório?"
  ], 1, "O padrão é decidido pelo desenho, não pelo nome do programa.");

  /* ---------- 3. Round robin ---------- */
  choice("t3", 1, 1, "Como o round robin escolhe a réplica?", [
    "Pela que respondeu mais rápido da última vez.",
    "Por um sorteio.",
    "Guarda um índice e o avança a cada pedido, em círculo: 1, 2, 3, 1, 2, 3.",
    "Pelo IP do cliente."
  ], 2, "Ele só guarda a vez. Não olha o pedido nem a réplica.");
  choice("t3", 2, 2, "Na fila de 9 pedidos (as buscas são P2, P5 e P8), onde caem as buscas no round robin?", [
    "Uma em cada réplica.",
    "As três na catalogo-1.",
    "As três na catalogo-3.",
    "As três na catalogo-2."
  ], 3, "O índice 1, 2, 3 dá os pedidos 2, 5 e 8 sempre à catalogo-2.");
  choice("t3", 3, 3, "Quanto trabalho cada réplica acumula no round robin da fila de 9?", [
    "940 ms em cada uma.",
    "2,7 s na catalogo-2 e 60 ms nas outras duas.",
    "1,8 s na catalogo-1 e nada nas outras.",
    "300 ms em cada uma."
  ], 1, "3 buscas × 900 ms = 2,7 s, contra 3 gatos × 20 ms = 60 ms. Cada uma recebeu 3 pedidos, e a conta parece justa.");
  choice("t3", 4, 2, "Com quantum de 300 ms e um pedido a cada 200 ms, quantos pedidos seguidos cada réplica recebe?", [
    "1",
    "2",
    "3",
    "9"
  ], 1, "Ela só troca depois do quantum. Os pedidos de 0 e de 200 ms chegam dentro dos 300 ms; o de 400 ms já cai na réplica seguinte.");
  choice("t3", 5, 2, "A catalogo-3 tem o dobro de CPU e ganha peso 2. Como fica a volta do round robin?", [
    "1, 2, 3, 3.",
    "1, 1, 2, 3.",
    "3, 3, 3, 3.",
    "1, 2, 3, 4."
  ], 0, "Ela entra duas vezes por volta. O peso cuida da diferença entre máquinas.");
  tf("t3", 6, 3, "O peso do round robin compensa o fato de uma busca custar 45 vezes mais que um gato.", false,
    "O peso compensa máquinas diferentes, não pedidos diferentes. A ordem da fila pode até ajudar, mas outra ordem traz o problema de volta.");

  /* ---------- 4. Least request ---------- */
  choice("t4", 1, 1, "O que o least request do artigo conta?", [
    "Quantas conexões a réplica tem abertas agora.",
    "Quantos pedidos a réplica já atendeu até agora.",
    "Quanto de CPU a réplica usa.",
    "O tempo de resposta médio."
  ], 1, "É um contador por réplica. O próximo pedido vai para a de menor número.");
  tf("t4", 2, 2, "Na fila de 9 pedidos, com as 3 réplicas juntas desde o início, o least request dá o mesmo resultado do round robin.", true,
    "Todos os contadores sobem juntos, e o empate vai para a primeira. A ordem sai 1, 2, 3, 1, 2, 3, 1, 2, 3, e as buscas caem outra vez na catalogo-2.");
  choice("t4", 3, 3, "Entra a catalogo-4 com contador 0, enquanto as outras estão em 3.000. O que acontece?", [
    "O balanceador a ignora até o contador chegar a 3.000.",
    "Os pedidos se dividem em quatro partes iguais.",
    "Os próximos 3.000 pedidos vão todos para a catalogo-4, uma negação de serviço involuntária.",
    "A catalogo-4 nunca recebe pedidos."
  ], 2, "Pela regra, o menor contador sempre ganha. O host novo apanha de tudo justo quando acabou de subir.");
  choice("t4", 4, 2, "Como evitar que o host novo seja inundado no least request com contador?", [
    "Trocar o algoritmo por random.",
    "Zerar os contadores, ou usar uma janela de tempo.",
    "Subir o host em silêncio, sem healthcheck.",
    "Dar peso 0 ao host novo para sempre."
  ], 1, "Contador acumulado carrega o passado. Zerar ou janelar faz o host novo entrar em pé de igualdade.");
  choice("t4", 5, 3, "O LEAST_REQUEST do Envoy escolhe, entre réplicas sorteadas, a que tem menos o quê?", [
    "Pedidos já atendidos desde o início.",
    "Pedidos ativos, isto é, em andamento.",
    "Conexões ociosas.",
    "Bytes enviados."
  ], 1, "Diferente do artigo, o Envoy olha os pedidos ativos. Perto do LOR da aula 6.");

  /* ---------- 5. Least connection ---------- */
  choice("t5", 1, 1, "O que o least connection mede?", [
    "Quantos pedidos a réplica já atendeu.",
    "Quantas conexões a réplica tem abertas neste instante.",
    "Quanto a réplica demora para responder.",
    "A distância até o cliente."
  ], 1, "Olha o presente: as conexões abertas agora.");
  choice("t5", 2, 1, "O que é keep-alive?", [
    "Um tipo de healthcheck.",
    "Manter a conexão aberta depois da resposta, para o próximo pedido sair mais rápido.",
    "Reenviar o pedido se der erro.",
    "Um limite de pedidos por minuto."
  ], 1, "Ajuda a velocidade, mas cria conexões paradas, que o least connection conta.");
  choice("t5", 3, 3, "O pool tem 5 · 3 · 4 conexões (catalogo-1, 2, 3). A catalogo-1 só tem conexões ociosas; a 2 está com 3 buscas de 900 ms. Para onde vai o P9?", [
    "Para a catalogo-1.",
    "Para a catalogo-3.",
    "Para a catalogo-2, a de menor número, que é justamente a mais ocupada.",
    "Para a catalogo-4."
  ], 2, "O least connection compara 5, 3 e 4 e escolhe a 2. Conexão aberta não é trabalho.");
  choice("t5", 4, 2, "Em que caso o least connection funciona bem?", [
    "Em pedidos curtos, com muito keep-alive parado.",
    "Em conexões de vida longa e parecidas, como WebSocket e gRPC.",
    "Quando só existe uma réplica.",
    "Quando o healthcheck está desligado."
  ], 1, "Aí cada conexão é uma carga de verdade, e contar conexões é contar trabalho.");
  tf("t5", 5, 2, "Uma réplica com 5 conexões abertas está necessariamente mais ocupada que uma com 3.", false,
    "As 5 podem ser navegadores ociosos, e as 3 podem estar fazendo buscas pesadas.");

  /* ---------- 6. Least outstanding requests ---------- */
  choice("t6", 1, 1, "O que é um pedido pendente?", [
    "Um pedido que o balanceador já repassou e ainda não recebeu a resposta.",
    "Uma conexão aberta e ociosa.",
    "Um pedido que falhou.",
    "Um pedido que chegou ao balanceador há mais de 1 s."
  ], 0, "Uma conexão ociosa não tem nenhum; uma com uma busca de 900 ms no meio tem um.");
  choice("t6", 2, 3, "Mesmo instante da aula passada: pendentes 0 · 3 · 1 (catalogo-1, 2, 3). Para onde o LOR manda o P9?", [
    "Para a catalogo-1, a única livre de verdade.",
    "Para a catalogo-2.",
    "Para a catalogo-3.",
    "Para a que tiver menos conexões."
  ], 0, "O LOR compara 0, 3 e 1 e escolhe a 1. O least connection tinha escolhido a 2 no mesmo cenário.");
  choice("t6", 3, 2, "Qual é a diferença entre least connection e LOR?", [
    "Nenhuma: são nomes diferentes da mesma regra.",
    "O least connection conta conexões abertas; o LOR conta pedidos ainda sendo processados.",
    "O LOR só funciona em camada 4.",
    "O least connection olha o IP e o LOR olha o cookie."
  ], 1, "As 5 conexões ociosas da catalogo-1 pesam no least connection e não pesam no LOR.");
  choice("t6", 4, 1, "Como o ALB da AWS chama o algoritmo LOR?", [
    "least_outstanding_requests.",
    "least_connections.",
    "leastconn.",
    "LEAST_REQUEST."
  ], 0, "O ALB oferece round_robin (padrão), least_outstanding_requests e weighted_random.");
  choice("t6", 5, 3, "A catalogo-3 perde a conexão com o banco e passa a responder 500 em 1 ms. O que o LOR faz?", [
    "Tira a catalogo-3 do pool na hora.",
    "Manda para ela quase todo pedido novo, porque ela responde na hora e fica sempre com 0 pendentes.",
    "Divide os pedidos por igual.",
    "Espera 30 s antes de decidir."
  ], 1, "Responder rápido não é responder certo. O LOR precisa de healthcheck, ou de detecção de outliers, ao lado.");

  /* ---------- 7. IP hash, Maglev e random ---------- */
  choice("t7", 1, 1, "Como o IP hash escolhe a réplica?", [
    "Sorteia a cada pedido.",
    "Transforma o IP do cliente num número e usa o resto da divisão pelo tamanho do pool.",
    "Escolhe a réplica com menos conexões.",
    "Lê o cookie de sessão."
  ], 1, "hash(IP) % 3 com 3 réplicas. O mesmo IP cai sempre na mesma réplica.");
  choice("t7", 2, 2, "Com o hash de exemplo, a Lena (177.38.20.5) dá h = 20 × 256 + 5 = 5.125. Qual é a réplica?", [
    "catalogo-1.",
    "catalogo-2.",
    "catalogo-3.",
    "Varia a cada pedido."
  ], 1, "5.125 % 3 = 1, a segunda posição de uma lista que começa em 0: a catalogo-2, em todos os pedidos dela.");
  choice("t7", 3, 3, "Um escritório em SP tem 500 pessoas atrás de um IP (NAT). O que o IP hash faz?", [
    "Espalha as 500 pessoas pelas três réplicas.",
    "Manda as 500 para a mesma réplica, porque para o hash é um cliente só.",
    "Recusa os pedidos do escritório.",
    "Usa o cookie de cada pessoa."
  ], 1, "O hash só enxerga o IP. A réplica recebe 500 vezes a carga de uma pessoa sozinha.");
  choice("t7", 4, 3, "Sai a catalogo-3 e o balanceador troca % 3 por % 2. Quantos clientes trocam de réplica?", [
    "Quase nenhum.",
    "Cerca de 1/3.",
    "Cerca de 2/3.",
    "Todos, sem exceção."
  ], 2, "Só fica onde estava quem tem h % 6 em {0, 1}. Cada um que troca perde a sessão e o cache local.");
  choice("t7", 5, 2, "Com hashing consistente (ou Maglev), quando a catalogo-3 sai, quem troca de réplica?", [
    "Só os clientes que estavam na catalogo-3, cerca de 1/3.",
    "Todos os clientes.",
    "Só os clientes da catalogo-1.",
    "Metade, escolhida ao acaso."
  ], 0, "Cada réplica é dona de pedaços de uma tabela que não depende só de N. Só os pedaços da que saiu são redistribuídos.");
  choice("t7", 6, 1, "O que é o Maglev?", [
    "Um tipo de healthcheck do Envoy.",
    "Um balanceador de camada 4 do Google que usa uma variante do hashing consistente.",
    "Um algoritmo que sorteia a réplica.",
    "Um certificado TLS."
  ], 1, "O paper do Maglev é da equipe do Google (NSDI 2016). O Envoy tem uma política MAGLEV.");
  choice("t7", 7, 2, "Um sorteio de 10 pedidos (random) pode dar 2 · 5 · 3. E com 10.000?", [
    "Continua desigual, como 2.000 · 5.000 · 3.000.",
    "Tende a um terço para cada réplica.",
    "Dá sempre exatamente 3.333 para cada.",
    "Vai tudo para a catalogo-1."
  ], 1, "Com pouco tráfego o sorteio sai desigual. Com muito, cada réplica chega perto de 1/3.");
  tf("t7", 8, 3, "O ip_hash do NGINX usa só os três primeiros octetos do IPv4 como chave, então uma faixa /24 inteira cai junta.", true,
    "É o que a documentação do NGINX diz. O exemplo da aula usa os dois últimos números só para a conta caber na tela.");

  /* ---------- 8. Camadas 4 e 7 ---------- */
  choice("t8", 1, 1, "O que um balanceador de camada 4 enxerga do pedido da Lena?", [
    "O caminho /produtos/42 e o cookie.",
    "Só IP e porta: TCP 177.38.20.5:51514 → 203.0.113.10:443.",
    "Nada: o pedido chega vazio.",
    "O corpo da resposta."
  ], 1, "Ele repassa a conexão inteira sem abrir o conteúdo, que continua cifrado.");
  choice("t8", 2, 2, "Para onde um balanceador de camada 7 manda GET /carrinho/9?", [
    "Para o catalogo.",
    "Para o serviço carrinho.",
    "Para os pedidos.",
    "Para a réplica com menos conexões, qualquer que seja."
  ], 1, "Roteamento por caminho: /produtos/* vai para o catalogo, /carrinho/* para o carrinho, /pedidos/* para os pedidos.");
  choice("t8", 3, 2, "O que o balanceador precisa fazer para ler o HTTP de um pedido HTTPS?", [
    "Terminar o TLS: o certificado de loja.com.br fica nele.",
    "Pedir a chave privada ao cliente.",
    "Usar a camada 4.",
    "Trocar a porta 443 por 80 na Lena."
  ], 0, "É o preço de abrir o envelope. Depois ele conversa em HTTP simples, ou numa nova conexão cifrada, com a réplica.");
  tf("t8", 4, 1, "Um balanceador de camada 4 consegue rotear pelo cookie de sessão.", false,
    "O cookie é um cabeçalho HTTP, dentro do TLS. Quem não abre o pedido não o enxerga.");
  choice("t8", 5, 2, "No exemplo da loja, qual é o custo de cada camada por pedido?", [
    "L4: +1 ms; L7: +0,1 ms.",
    "L7: cerca de +1 ms e mais CPU; L4: cerca de +0,1 ms.",
    "Os dois custam 0,1 ms.",
    "Os dois custam 1 ms."
  ], 1, "São números de exemplo, mas a proporção é a ideia: ler custa.");
  choice("t8", 6, 1, "Qual destes balanceadores gerenciados da AWS trabalha na camada 4?", [
    "ALB.",
    "NLB.",
    "Os dois.",
    "Nenhum."
  ], 1, "O NLB é L4; o ALB é L7.");

  /* ---------- 9. Tecnologias de mercado ---------- */
  choice("t9", 1, 2, "Quando o NGINX foi lançado ao público?", [
    "Em 4 de outubro de 2004 (versão 0.1.0); o artigo diz 2002, quando o desenvolvimento começou.",
    "Em 1995.",
    "Em 2016, junto com o Envoy.",
    "Em 2018, na CNCF."
  ], 0, "O registro de mudanças em nginx.org dá a data da primeira versão pública.");
  choice("t9", 2, 1, "Qual ferramenta nasceu na Lyft e é a base do Istio e do Contour?", [
    "HAProxy.",
    "NGINX.",
    "Envoy.",
    "Traefik."
  ], 2, "O Envoy faz L4 e L7 e hoje é um projeto da CNCF.");
  choice("t9", 3, 2, "Como a regra do round robin se chama em cada ferramenta?", [
    "ROUND_ROBIN no Envoy e roundrobin no HAProxy.",
    "least_conn no NGINX e leastconn no HAProxy.",
    "ip_hash no Envoy e source no NGINX.",
    "weighted_random em todas."
  ], 0, "Os nomes mudam de ferramenta para ferramenta, mas as regras são as das aulas.");
  choice("t9", 4, 3, "A loja não quer operar nenhum balanceador. O que ela escolhe, sabendo do limite?", [
    "Escrever o balanceador em Go.",
    "O ALB ou o NLB, aceitando só os algoritmos e ajustes que a AWS oferece.",
    "Um Envoy por réplica.",
    "Voltar ao DNS com um IP só."
  ], 1, "Gerenciado troca controle por menos trabalho de operação.");

  /* ---------- 10. Laboratório com Envoy ---------- */
  choice("t10", 1, 1, "Qual é o papel de cada Envoy no laboratório?", [
    "Os sete são balanceadores em round robin.",
    "O load-balancer (porta 80) é o balanceador 1:N; os três reverse-proxy-N são proxies reversos 1:1, cada um na frente da sua backend-app-N.",
    "Um é balanceador e os outros seis são apenas cache.",
    "O load-balancer é o app Node.js."
  ], 1, "São os dois padrões da aula 2 rodando com a mesma ferramenta. Os sete containers são 3 apps, 3 proxies e 1 balanceador.");
  choice("t10", 2, 2, "Seis curls em http://localhost/, com os três pesos iguais a 1. Como se dividem pelos proxies?", [
    "Todos no reverse-proxy-1.",
    "2 / 2 / 2, por igual.",
    "4 / 1 / 1.",
    "Aleatoriamente, sem relação com o peso."
  ], 1, "lb_policy: ROUND_ROBIN com load_balancing_weight: 1 nos três. A ordem pode começar em outro proxy, mas a divisão fica por igual.");
  choice("t10", 3, 3, "Você roda docker compose stop reverse-proxy-2. Antes de o healthcheck perceber, o que acontece?", [
    "Nenhum pedido falha.",
    "1 de cada 3 pedidos cai no proxy parado e volta com 503.",
    "Todos os pedidos falham.",
    "O balanceador para de responder."
  ], 1, "O balanceador ainda considera o host do pool e segue a vez, então 1 em cada 3 cai nele.");
  choice("t10", 4, 2, "O health_checks do load-balancer.yaml tem interval: 10s, timeout: 1s e unhealthy_threshold: 3. Em quanto tempo o proxy parado sai do pool?", [
    "Em até 30 s.",
    "Em 1 s.",
    "Só quando alguém reinicia o balanceador.",
    "Em 5 minutos."
  ], 0, "3 falhas seguidas, uma a cada 10 s. Na loja, com 5 s, eram 15 s.");
  choice("t10", 5, 3, "Para que serve o slow_start_window: 60s no cluster?", [
    "Para o balanceador começar devagar quando é ligado.",
    "Para um host recém-adicionado ao pool receber uma parte crescente dos pedidos durante 60 s, em vez de tudo de uma vez.",
    "Para limitar cada cliente a 60 pedidos.",
    "Para esperar 60 s antes de cada healthcheck."
  ], 1, "É a resposta do Envoy ao problema do host novo inundado que vimos no least request.");
  tf("t10", 6, 2, "No Envoy, load_balancing_weight é a mesma coisa que o quantum do round robin da aula 3.", false,
    "Peso decide quantos pedidos por volta; o quantum decide por quanto tempo ficar numa réplica. O Envoy só tem o peso.");

  window.QUIZ = out;
})();
