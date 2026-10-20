/* Banco de perguntas do quiz de API Gateways.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-problemas-operacionais", name: "Introdução e problemas operacionais" },
    t2: { topic: "aula-2-monolitos-e-microsservicos", name: "Monolitos e microsserviços" },
    t3: { topic: "aula-3-api-gateway-vs-load-balancer", name: "API Gateway vs Load Balancer" },
    t4: { topic: "aula-4-roteamento-autenticacao-e-autorizacao", name: "Roteamento, autenticação e autorização" },
    t5: { topic: "aula-5-rate-limiting-throttling-token-bucket-e-leaky-bucket", name: "Rate limiting, throttling, token bucket e leaky bucket" },
    t6: { topic: "aula-6-versionamento-de-apis", name: "Versionamento de APIs" },
    t7: { topic: "aula-7-laboratorio-kong", name: "Laboratório Kong" }
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

  /* ---------- 1. Introdução e problemas operacionais ---------- */
  choice("t1", 1, 1, "O que é um API Gateway, numa frase?", [
    "Um banco de dados que guarda as respostas da API.",
    "A porta única da arquitetura: recebe todo pedido de fora, aplica as regras comuns e entrega ao serviço certo.",
    "Um programa que divide o monolito em microsserviços.",
    "Um tipo de certificado TLS para APIs."
  ], 1, "O gateway é um padrão: um ponto de entrada único com as regras comuns (rota, identidade, limite, versão) aplicadas uma vez.");
  choice("t1", 2, 2, "Sem gateway, quantos endereços o app da Lena precisa conhecer na loja do módulo?", [
    "1, o do load balancer.",
    "2, um para leitura e outro para escrita.",
    "6, um por serviço.",
    "12, um por réplica."
  ], 2, "Cada serviço do módulo 6 tem o seu endereço (catalogo, carrinho, pedidos, pagamentos, estoque, entregas), e o cliente passa a conhecer todos.");
  tf("t1", 3, 1, "Sem gateway, cada serviço pode conferir o login de um jeito diferente.", true,
    "No módulo, o catalogo aceita qualquer um, o pedidos confere um token e o pagamentos confere outro. Nada garante que o modo é o mesmo.");
  choice("t1", 4, 2, "O catálogo aguenta 100 pedidos por segundo, e o robô do concorrente pede 500. Qual é o problema de não ter gateway?", [
    "O robô precisa ser barrado serviço por serviço, em vários lugares.",
    "O robô fica mais rápido sem gateway.",
    "O catálogo deixa de aguentar 100 por segundo.",
    "O app da Lena para de funcionar."
  ], 0, "Sem uma porta única, o bloqueio, o certificado e o log existem em seis lugares, e cada um precisa ser configurado.");
  choice("t1", 5, 3, "Qual é o caminho de um pedido na loja com gateway e load balancer?", [
    "app → catalogo-1 → gw-loja → lb-catalogo",
    "app → lb-catalogo → gw-loja → catalogo-1/2/3",
    "app → gw-loja → lb-catalogo → catalogo-1/2/3",
    "app → gw-loja → catalogo-1 → lb-catalogo"
  ], 2, "O gateway recebe primeiro e escolhe o serviço; o load balancer do serviço escolhe a réplica.");
  tf("t1", 6, 2, "Com um gateway, a loja pode trocar o que está atrás da porta sem o parceiro mudar de URL, desde que o contrato continue o mesmo.", true,
    "A URL pública fica no gateway. O que muda é a configuração da rota, e o parceiro nem fica sabendo.");

  /* ---------- 2. Monolitos e microsserviços ---------- */
  choice("t2", 1, 1, "Por que o monolito não tinha o problema das 6 URLs?", [
    "Porque era mais rápido.",
    "Porque já era uma porta única: o cliente chamava um endereço, e a divisão em módulos ficava dentro do processo.",
    "Porque não tinha login.",
    "Porque usava HTTP/3."
  ], 1, "Catálogo, carrinho e pedidos conversavam por chamada de função. Só quem mexia no código via a divisão.");
  choice("t2", 2, 2, "O gateway recebe GET /api/v1/produtos/42. O que ele entrega ao catálogo com strip_path ligado?", [
    "/api/v1/produtos/42",
    "/produtos/42",
    "/42",
    "/api/v1"
  ], 1, "O gateway tira o prefixo da rota (/api/v1/produtos) e junta com o caminho-base do serviço (/produtos): o catálogo recebe /produtos/42.");
  order("t2", 3, 2, "Ordene o que acontece quando a loja troca o serviço pedidos por um novo, com o mesmo contrato.", [
    "O time de pedidos publica o serviço novo, em outro endereço interno",
    "A loja muda a rota /api/v1/pedidos no gateway para apontar ao serviço novo",
    "O app da Lena continua chamando /api/v1/pedidos",
    "O pedido chega ao serviço novo, e ninguém de fora precisou mudar nada"
  ], "A troca acontece num lugar só, a configuração do gateway. A URL pública não muda.");
  choice("t2", 4, 3, "O serviço novo de pedidos devolve o total como objeto { valor, moeda }, e o antigo devolvia um número. O gateway já aponta para o novo. O que acontece com o app antigo?", [
    "Nada: o gateway traduz a resposta sozinho.",
    "O app quebra ao ler o total, porque o gateway esconde o endereço, não o contrato.",
    "O gateway responde 429.",
    "O app passa a usar a v2 automaticamente."
  ], 1, "A URL é a mesma e o gateway funcionou, mas o formato mudou. Mudança que quebra o contrato precisa de outra rota ou versão (aula 6).");
  tf("t2", 5, 1, "No monolito, o cliente via uma URL só. Nos microsserviços sem gateway, ele passa a ver a divisão interna da loja.", true,
    "Cada serviço ganhou o seu endereço, e a lista de URLs virou o organograma da loja.");

  /* ---------- 3. API Gateway vs Load Balancer ---------- */
  choice("t3", 1, 1, "Qual pergunta o load balancer responde?", [
    "Qual réplica atende este pedido.",
    "Esta pessoa pode chamar esta rota?",
    "Em qual versão da API este pedido deve ser tratado?",
    "Quantos pedidos este cliente já fez?"
  ], 0, "O balanceador escolhe entre N réplicas da mesma coisa. As outras três perguntas são do gateway.");
  choice("t3", 2, 1, "Qual pergunta só o gateway responde?", [
    "Qual das três réplicas do catálogo está livre.",
    "Qual réplica passou no health check.",
    "Este cliente passou do limite de 10 pedidos por segundo?",
    "Qual o IP da réplica catalogo-2."
  ], 2, "Limite por cliente, login e versão são governança de API, e o balanceador não conhece nada disso.");
  tf("t3", 3, 2, "O gateway deve apontar diretamente para os IPs das três réplicas do catálogo, sem o lb-catalogo.", false,
    "O health check e a distribuição já são do balanceador. Apontar para os IPs obrigaria o gateway a refazer isso.");
  choice("t3", 4, 3, "A loja tem um único gw-loja, que trava às 20:00. Todos os serviços atrás dele estão saudáveis. O que os clientes veem?", [
    "Só o catálogo fica fora do ar.",
    "A loja inteira fica fora do ar para quem chama de fora.",
    "O app continua funcionando pelas réplicas.",
    "Os pedidos passam a ir direto aos serviços."
  ], 1, "O gateway é a porta de todos. Ele também precisa de réplicas e de um balanceador na frente.");
  tf("t3", 5, 2, "O Envoy e o NGINX podem fazer tanto o papel de load balancer quanto o de gateway.", true,
    "A diferença está no papel que o componente tem na arquitetura, e não no programa que roda.");
  choice("t3", 6, 3, "Num cenário com 3 réplicas do gw-loja, qual problema do módulo 5 reaparece quando cada réplica conta os pedidos na própria memória?", [
    "Cache stampede.",
    "Dado velho por TTL longo demais.",
    "Cada réplica tem a sua cópia da verdade, e a soma passa do limite.",
    "Evicção da chave errada."
  ], 2, "É o problema do cache local: contadores separados somam mais do que o limite (aula 5).");

  /* ---------- 4. Roteamento, autenticação e autorização ---------- */
  choice("t4", 1, 1, "Qual a diferença entre autenticação e autorização?", [
    "Autenticação diz o que você pode fazer, e autorização diz quem você é.",
    "Autenticação diz quem você é, e autorização diz o que você pode fazer.",
    "As duas são a mesma coisa, com nomes diferentes.",
    "Autenticação é do cliente, e autorização é do banco."
  ], 1, "Primeiro o gateway descobre quem chama (token), depois confere o que essa pessoa pode (escopos).");
  choice("t4", 2, 2, "A chamada chega sem token a uma rota que exige login. O que o gateway responde?", [
    "200 OK",
    "401 Unauthorized",
    "403 Forbidden",
    "404 Not Found"
  ], 1, "Sem credencial, o gateway ainda não sabe quem chama. Uma credencial vencida também dá 401.");
  choice("t4", 3, 2, "O parceiro, com só o escopo produtos:ler, tenta POST /api/v1/pedidos. O que o gateway responde?", [
    "401 Unauthorized",
    "403 Forbidden",
    "429 Too Many Requests",
    "200 OK"
  ], 1, "O gateway sabe quem é o parceiro, e a rota pede pedidos:criar. Quem é conhecido e não tem o escopo recebe 403.");
  choice("t4", 4, 1, "O que o gateway confere num JWT da Lena?", [
    "Só se o texto é um JSON.",
    "A assinatura (feita com a chave da loja) e o prazo exp.",
    "Se a Lena já comprou o gato.",
    "O endereço IP da Lena."
  ], 1, "Com a assinatura conferida e o token dentro do prazo, o gateway confia no sub e repassa o X-Cliente-Id.");
  tf("t4", 5, 2, "O payload de um JWT é cifrado, por isso pode guardar a senha do cliente.", false,
    "O payload é só JSON codificado em base64url: qualquer pessoa o lê. A assinatura garante que ninguém o alterou, mas não esconde nada.");
  choice("t4", 6, 3, "O gateway confere o escopo pedidos:ler da Lena em GET /api/v1/pedidos/1048. Quem confere se o 1048 é dela?", [
    "O gateway, pelo token.",
    "O serviço pedidos, comparando o X-Cliente-Id com o dono do pedido.",
    "O load balancer.",
    "Ninguém: o escopo basta."
  ], 1, "O gateway só vê o token e a URL. O dono do pedido está nos dados do serviço pedidos.");
  choice("t4", 7, 3, "O serviço pedidos aceita qualquer X-Cliente-Id porque 'o gateway já conferiu'. O que acontece se alguém alcançar a rede interna e chamar o pedidos direto?", [
    "O serviço recusa, porque a chamada não passou pelo gateway.",
    "A pessoa escreve X-Cliente-Id: lena-77 à mão e lê o pedido da Lena.",
    "O gateway bloqueia a chamada.",
    "O serviço responde 429."
  ], 1, "O serviço confia no cabeçalho. Conserto: rede interna fechada e o serviço também conferindo o token.");
  order("t4", 8, 2, "Ordene o que o gateway faz com o POST /api/v1/pedidos da Lena.", [
    "Casa a rota: método POST e caminho /api/v1/pedidos vão para o serviço pedidos",
    "Confere a assinatura e o exp do JWT",
    "Confere se o token tem o escopo pedidos:criar",
    "Repassa ao serviço com X-Cliente-Id: lena-77"
  ], "Rota, depois autenticação, depois autorização, e só então a chamada segue para o serviço.");

  /* ---------- 5. Rate limiting, throttling, token bucket e leaky bucket ---------- */
  choice("t5", 1, 1, "O que o gateway responde a um cliente que passou do limite de 10 pedidos por segundo?", [
    "401 Unauthorized",
    "403 Forbidden",
    "429 Too Many Requests, com Retry-After",
    "503 Service Unavailable, sempre"
  ], 2, "A RFC 6585 define o 429 para 'muitos pedidos num dado tempo'. O Retry-After diz quanto esperar: 1 segundo no exemplo.");
  choice("t5", 2, 2, "Um token bucket tem 200 tokens e repõe 100 por segundo. Um cliente manda 200 pedidos de uma vez, e logo depois mais 200. O que acontece?", [
    "Os 400 passam.",
    "Os primeiros 200 passam; dos seguintes só passa o que o balde repôs, e o resto leva 429.",
    "Nenhum passa, porque 200 de uma vez é rajada.",
    "Os 200 primeiros levam 429."
  ], 1, "A rajada gasta os tokens acumulados. Depois disso, passa só o que o balde repõe, 100 por segundo.");
  choice("t5", 3, 2, "A Lena abre o app e dispara 12 pedidos de uma vez, com um balde de 20 tokens e reposição de 10 por segundo. Quantos passam?", [
    "10",
    "12",
    "20",
    "Nenhum"
  ], 1, "Os 12 passam, e sobram 8 tokens. É por isso que rajadas curtas de gente de verdade não levam 429.");
  choice("t5", 4, 2, "O robô manda 500 pedidos por segundo contra o mesmo balde de 20 tokens e 10 por segundo. Quantos passam no primeiro segundo, aproximadamente?", [
    "Cerca de 30: os 20 do balde mais uns 10 repostos.",
    "500",
    "Cerca de 250",
    "Nenhum"
  ], 0, "O balde esvazia em menos de 1 segundo. Dos 500 pedidos, cerca de 30 passam e 470 levam 429.");
  choice("t5", 5, 1, "O que define um leaky bucket?", [
    "Um balde que ganha tokens e deixa passar rajada.",
    "Uma fila de tamanho fixo que vaza em ritmo constante, com descarte quando enche.",
    "Um contador que zera a cada minuto.",
    "Um limite que só vale para IPs de fora do Brasil."
  ], 1, "A saída é constante, e a rajada espera na fila. O artigo descreve o balde 'do tamanho da taxa'; o que define o leaky bucket é a saída constante a partir de uma fila.");
  tf("t5", 6, 2, "No leaky bucket de fila de 50 e saída de 50 por segundo, uma rajada de 12 pedidos é recusada na hora.", false,
    "A rajada entra na fila e sai aos poucos. A recusa só acontece quando a fila está cheia.");
  choice("t5", 7, 2, "O catálogo começou a responder em 2 segundos, e o gateway baixou o limite global de 100 para 50 por segundo. Como se chama isso?", [
    "Rate limiting por cliente.",
    "Throttling, uma reação ao que acontece agora.",
    "Canary.",
    "Strip path."
  ], 1, "O rate limiting é a regra escrita antes, e o throttling é a reação do gateway à saúde do serviço.");
  choice("t5", 8, 3, "A loja tem 3 réplicas do gateway, cada uma com contador local de 10 por segundo. O robô tem uma chave só. Quanto ele consegue por segundo, repartido em partes iguais?", [
    "10",
    "30",
    "100",
    "500"
  ], 1, "Cada réplica vê um terço dos pedidos e libera até 10. A soma é 3 × 10 = 30, o triplo do limite.");
  choice("t5", 9, 3, "Qual é o conserto para o contador local de várias réplicas, e qual o seu custo?", [
    "Reiniciar as réplicas de hora em hora; o custo é perder o log.",
    "Um contador compartilhado no Redis; o custo é uma ida ao Redis por pedido e consistência eventual (alguns a mais podem passar).",
    "Aumentar o limite de cada réplica; o custo é nenhum.",
    "Desligar o rate limiting nas réplicas."
  ], 1, "O contador compartilhado devolve o limite de 10, mas o artigo avisa que a consistência não é forte.");

  /* ---------- 6. Versionamento de APIs ---------- */
  choice("t6", 1, 1, "Por que a loja criou uma v2 de pedidos em vez de mudar a v1?", [
    "Porque a v1 era lenta.",
    "Porque o campo total mudou de forma (número para objeto), o que quebra o contrato do app antigo.",
    "Porque o gateway exige duas versões.",
    "Porque o parceiro pediu um 429."
  ], 1, "O app antigo lê um número. Se o total virasse um objeto na mesma rota, ele quebraria.");
  choice("t6", 2, 2, "O gateway recebe GET /api/v2/pedidos/1048. O que o pedidos-v2 recebe?", [
    "/api/v2/pedidos/1048",
    "/pedidos/1048",
    "/v2/1048",
    "/1048"
  ], 1, "O gateway tira o prefixo da rota e junta com o caminho-base do serviço, /pedidos. O serviço novo não sabe que existe v2 na URL.");
  order("t6", 3, 2, "Ordene o canary da loja para uma implementação nova do v1, com o mesmo contrato.", [
    "10% do tráfego da v1 vai para a implementação nova",
    "Se os erros não aumentam, sobe para 50%",
    "Se continuam estáveis, sobe para 100%",
    "A implementação antiga é aposentada"
  ], "Cada passo é pequeno e reversível. Se os erros aumentam em qualquer degrau, o gateway volta o tráfego.");
  tf("t6", 4, 3, "O canary funciona mesmo quando a implementação nova devolve um formato de resposta diferente.", false,
    "O canary só vale se as duas implementações respeitam o mesmo contrato. Formato diferente é caso para uma nova versão.");
  choice("t6", 5, 3, "O time desliga a rota /api/v1/pedidos e o marketplace-xyz ainda a usava. O que o parceiro recebe?", [
    "200 com a resposta da v2.",
    "404, e os pedidos do marketplace param de entrar.",
    "429 por tentar demais.",
    "401, porque a chave venceu."
  ], 1, "Sem rota, o gateway responde 404. Conserto: avisar com prazo (Deprecation e Sunset) e medir quem ainda chama a v1.");
  choice("t6", 6, 1, "Para que servem os cabeçalhos Deprecation e Sunset?", [
    "Para esconder a versão antiga do cliente.",
    "Para avisar que a API está descontinuada e quando vai parar de responder.",
    "Para aumentar o limite do cliente.",
    "Para trocar o token do cliente."
  ], 1, "São a forma de dar prazo ao parceiro antes de desligar a versão, junto com a medição de quem ainda a chama.");

  /* ---------- 7. Laboratório Kong ---------- */
  choice("t7", 1, 1, "No kong.yml do laboratório, o que faz strip_path: true?", [
    "Mostra o caminho completo no log.",
    "Tira da URL o prefixo da rota (/api/v1/products) antes de entregar ao serviço.",
    "Bloqueia caminhos com barra no fim.",
    "Cria um caminho novo para o serviço."
  ], 1, "Com strip_path, o prefixo da rota some, e o que sobra é somado ao caminho do service.");
  choice("t7", 2, 2, "O service do laboratório é url: http://products-service:8082/products e a rota é /api/v1/products. Para onde vai curl localhost:8000/api/v1/products/42?", [
    "GET /api/v1/products/42 no products-service.",
    "GET /products/42 no products-service.",
    "GET /42 no products-service.",
    "GET /products no orders-service."
  ], 1, "O prefixo é removido (sobra /42) e somado ao caminho do service (/products). O mesmo vale para /api/v1/products sem sobra: GET /products.");
  choice("t7", 3, 2, "Como a loja do módulo mapeia os serviços do laboratório (users, products, orders)?", [
    "clientes, catálogo e pedidos.",
    "pagamentos, estoque e entregas.",
    "carrinho, catálogo e frete.",
    "parceiros, robôs e clientes."
  ], 0, "users é clientes, products é o catálogo (produtos) e orders é pedidos. O orders-service-v2 é o pedidos-v2.");
  choice("t7", 4, 2, "O Kong do laboratório roda com KONG_DATABASE: off e KONG_DECLARATIVE_CONFIG. O que isso significa?", [
    "Sem banco de dados: a configuração vem do arquivo kong.yml, lido na partida.",
    "Sem rede: o Kong só responde localmente.",
    "Sem plugins: nenhuma função extra pode ser ligada.",
    "Sem logs."
  ], 0, "É o modo DB-less. Cada nó lê o arquivo e não conhece os outros nós, e a Admin API fica só de leitura.");
  choice("t7", 5, 3, "Duas réplicas do Kong com o plugin rate-limiting em config.second: 10 e policy: local. Um cliente faz 30 pedidos por segundo, repartidos em partes iguais. Quantos passam?", [
    "10",
    "20",
    "30",
    "0"
  ], 1, "Cada nó recebe 15 e libera 10. Passam 20, o dobro do limite. Com policy: redis, o contador é um só.");
  tf("t7", 6, 3, "O plugin rate-limiting do Kong implementa um token bucket com rajada.", false,
    "A documentação o descreve como limite de pedidos por período (segundo, minuto, hora…). Não é um balde de tokens com capacidade de rajada.");
  window.QUIZ = out;
})();
