/* Banco de perguntas do quiz de Comunicação Síncrona.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução: chamar e esperar" },
    t2: { topic: "aula-2-http-e-rest", name: "HTTP e REST" },
    t3: { topic: "aula-3-webhooks-short-polling-e-long-polling", name: "Webhooks, short polling e long polling" },
    t4: { topic: "aula-4-rpc", name: "RPC" },
    t5: { topic: "aula-5-grpc-e-protobufs", name: "gRPC e Protobufs" },
    t6: { topic: "aula-6-websockets", name: "WebSockets" },
    t7: { topic: "aula-7-graphql", name: "GraphQL" },
    t8: { topic: "aula-8-convergencias-arquiteturais", name: "Convergências arquiteturais" }
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


  choice("t1", 1, 1, "O que é uma chamada síncrona?", ["Uma chamada que acontece sempre no mesmo horário.", "Uma chamada em que quem chama espera a resposta antes de seguir.", "Uma chamada que nunca passa pela rede.", "Uma chamada que o servidor responde sem ler o pedido."], 1, "Síncrono é chamar e esperar. O erro volta na hora, mas a latência e a disponibilidade de quem chama passam a depender de todos os de trás.");
  choice("t1", 2, 2, "Pedidos, pagamentos e PSP têm 99,9% cada e estão em série. Qual a disponibilidade da cadeia?", ["99,9%", "99,70%", "99,0%", "99,97%"], 1, "0,999 × 0,999 × 0,999 = 0,997, ou 99,70%. São 129 minutos por mês fora do ar, contra 43 de um serviço só.");
  tf("t1", 3, 2, "Com 4 saltos de 99,9% (bff → pedidos → pagamentos → PSP), a cadeia fica fora do ar por cerca de 173 minutos por mês.", true, "0,999⁴ = 99,60%, e 0,4% de 43.200 minutos dá cerca de 173 minutos.");
  choice("t1", 4, 2, "Quanto tempo leva a cadeia do pedido 1050 no exemplo da aula?", ["20 ms", "185 ms", "210 ms", "410 ms"], 2, "5 ms (gateway → pedidos) + 20 ms (reserva de estoque) + 5 ms (pedidos → pagamentos) + 180 ms (pagamentos → PSP) = 210 ms.");
  choice("t1", 5, 3, "O PSP demora 8 s e o timeout de 2 s do pagamentos estoura. O que pode ter acontecido do lado do PSP?", ["Nada: se o timeout estourou, a cobrança não foi criada.", "A cobrança c-7731 já foi criada, e o Davi ainda pode pagar o Pix de um pedido que a loja deu como falho.", "O PSP cancela sozinho a cobrança quando o cliente desiste.", "A loja recebe um 409 do PSP."], 1, "Timeout só diz que a resposta não chegou a tempo. A outra ponta pode ter feito tudo, e quem chamou não sabe.");
  order("t1", 6, 3, "Ordene a cadeia síncrona do pedido 1050, do começo ao fim.", ["app do Davi", "gw-loja", "pedidos", "pagamentos", "PSP externo"], "O app chama o gw-loja (REST), que chama o pedidos, que chama o pagamentos, que chama o PSP pela internet.");
  choice("t2", 1, 1, "Quais métodos HTTP são seguros, segundo a RFC 9110?", ["GET e HEAD", "GET e POST", "PUT e DELETE", "POST e PATCH"], 0, "Seguros são os que não mudam nada no servidor: GET e HEAD. PUT e DELETE são idempotentes, mas não seguros.");
  choice("t2", 2, 2, "Qual destes métodos NÃO é idempotente?", ["PUT", "DELETE", "POST", "GET"], 2, "Repetir um POST pode criar outro recurso. PUT, DELETE e GET podem ser repetidos com o mesmo resultado final.");
  choice("t2", 3, 2, "Quantos bytes tem a chamada POST /cobrancas do pedido 1050 em REST, ida e volta?", ["150 bytes", "210 bytes", "360 bytes", "53 bytes"], 2, "Requisição de 210 B (157 de cabeçalhos + 53 de corpo) e resposta de 150 B (106 + 44): 360 B por chamada, com os cabeçalhos repetidos a cada vez.");
  choice("t2", 4, 1, "O que significa a resposta 304 Not Modified?", ["O recurso foi apagado.", "A cópia em cache ainda vale, e a resposta vai sem corpo.", "O servidor mudou de endereço.", "O método não é permitido."], 1, "O cliente manda If-None-Match com o ETag. Se não mudou, o servidor responde 304, sem repetir o corpo.");
  choice("t2", 5, 2, "O app do Davi tentou o POST de novo depois de um timeout. O que acontece sem nenhum cuidado?", ["Nada, o servidor reconhece a chamada repetida.", "Nascem 2 pedidos e 2 cobranças de 28.90.", "O gateway devolve 304.", "O PSP cancela a primeira cobrança."], 1, "POST não é idempotente. O conserto é o cabeçalho Idempotency-Key ou um PUT com id gerado pelo cliente.");
  choice("t2", 6, 2, "No lab Books API, o que o POST devolve quando o ISBN já existe, e o que seria o correto?", ["500, e o correto seria 409.", "404, e o correto seria 200.", "201, e o correto seria 409.", "409, e o correto seria 500."], 0, "A violação da chave única cai no 'Erro ao criar livro' e vira 500. Seria um 409, erro do cliente.");
  tf("t2", 7, 3, "No lab, o DELETE devolve 204 mesmo quando o id não existe, porque o RowsAffected é lido e ignorado.", true, "O código chama result.RowsAffected() e descarta o número. O estado final é o mesmo, por isso o DELETE segue idempotente, mas o cliente não sabe se apagou algo.");
  choice("t3", 1, 1, "Quantas requisições o short polling de 2 s faz até a tela saber do Pix das 14:05:23.4?", ["2", "6", "12", "24"], 2, "A pergunta de 24 s é a 12ª: foram 12 requisições, 11 inúteis, e a tela atualiza 0,6 s depois do pagamento.");
  choice("t3", 2, 2, "5.000 telas em short polling a cada 2 s geram quantas requisições por segundo?", ["500", "1.000", "2.500", "5.000"], 2, "5.000 ÷ 2 s = 2.500 req/s. A 2 ms de CPU cada, são 5 vCPU, e o pedidos tem 3.");
  choice("t3", 3, 2, "Qual o pior caso do long polling com 5.000 telas e timeout de 10 s?", ["500 req/s", "2.500 req/s", "50 req/s", "5.000 req/s"], 0, "5.000 ÷ 10 s = 500 req/s, cinco vezes menos. O custo vira 5.000 conexões abertas.");
  choice("t3", 4, 2, "O gw-loja corta requisições paradas por 15 s e a tela segura 25 s. O que acontece?", ["Tudo funciona, o gateway espera.", "Todo cliente recebe 504 aos 15 s.", "A tela recebe 200 aos 15 s.", "O PSP reenvia o webhook."], 1, "O tempo que o servidor segura (10 s) precisa ser menor que o timeout de todo intermediário.");
  choice("t3", 5, 2, "Quem é o servidor que recebe o webhook do Pix?", ["O navegador do Davi.", "O servidor da loja (o pagamentos).", "O banco do Davi.", "O celular do Davi."], 1, "O webhook chega ao servidor da loja, nunca ao navegador. Para a tela ver, o webhook alimenta o long polling ou o WebSocket.");
  choice("t3", 6, 3, "Como o pagamentos confere que o webhook veio do PSP?", ["Pelo endereço IP, que nunca muda.", "Refaz o HMAC-SHA256 de t + \".\" + corpo com o segredo e compara com o v1.", "Pergunta ao Davi.", "Consulta o DNS do PSP."], 1, "A assinatura prova que o corpo não foi mexido e que quem chamou tem o segredo. O t também precisa ter menos de 5 minutos.");
  choice("t3", 7, 3, "O pagamentos leva 12 s para responder e o PSP espera 5 s. Qual a consequência?", ["O PSP reenvia e o ev-8812 chega duas vezes.", "O PSP cancela a cobrança.", "O webhook é entregue ao navegador.", "O PSP troca o segredo."], 0, "O PSP dá o envio como falho e reenvia. A loja precisa ser idempotente por evento_id e responder 200 logo, processando depois.");
  tf("t3", 8, 2, "Uma chamada de webhook com assinatura certa mas com t de 6 minutos atrás é aceita.", false, "A janela é de 5 minutos. O HMAC bate, mas a chamada é recusada como expirada, porque pode ser uma gravação reenviada.");
  choice("t4", 1, 1, "Qual a ideia do RPC?", ["Chamar uma função de outro programa como se fosse local.", "Guardar respostas em cache.", "Cifrar a conexão.", "Distribuir carga entre servidores."], 0, "O stub parece a função e cuida da rede, e o skeleton do outro lado chama a função de verdade.");
  choice("t4", 2, 1, "O que o stub faz?", ["Roda a função no servidor.", "Serializa os argumentos no cliente e manda pela rede.", "Balanceia as chamadas.", "Guarda o histórico de chamadas."], 1, "O stub fica no cliente. O skeleton, no servidor, desserializa e chama a função.");
  choice("t4", 3, 2, "REST e RPC diferem no que nomeiam. Qual é a relação certa?", ["REST nomeia ações e RPC nomeia coisas.", "REST nomeia coisas (/pedidos/1050) e RPC nomeia ações (Frete.Calcular).", "Os dois nomeiam só coisas.", "Os dois nomeiam só ações."], 1, "O método HTTP diz a ação no REST. No RPC, o nome do procedimento é a ação.");
  choice("t4", 4, 2, "Por que o net/rpc do Go só fala com clientes Go?", ["Porque usa o formato gob, do próprio Go.", "Porque só aceita a porta 1234.", "Porque exige HTTP/2.", "Porque o gRPC o bloqueia."], 0, "O net/rpc usa o tipo Go e o formato gob. O pacote também está congelado.");
  choice("t4", 5, 3, "O cliente do lab chama client.Call sem timeout e o servidor trava num deadlock. O que acontece?", ["O Call retorna um erro depois de 30 s.", "O cliente fica pendurado para sempre.", "O servidor reinicia sozinho.", "O Call devolve zero."], 1, "Sem deadline, a chamada espera para sempre. É o motivo de toda chamada precisar de prazo, e o gRPC o exige no context.");
  tf("t4", 6, 2, "RPC é um protocolo específico, como o HTTP.", false, "RPC é um modelo, com vários protocolos que o implementam: JSON-RPC, SOAP, Thrift, gRPC.");
  choice("t5", 1, 1, "Quantos bytes tem o pedido 1050 em Protobuf, e quantos em JSON?", ["11 e 53", "53 e 11", "18 e 44", "16 e 53"], 0, "08 9a 08 10 ca 16 1a 03 70 69 78 são 11 bytes. O JSON tem 53. Os nomes dos campos não viajam.");
  choice("t5", 2, 2, "No Protobuf, o 1050 vira 9a 08. Por quê?", ["É a tabela ASCII.", "É varint: 1050 = 8 × 128 + 26, e o byte baixo (0x1a) ganha o bit alto: 0x9a, depois 0x08.", "É o número em decimal.", "É o CRC do valor."], 1, "O varint usa 7 bits por byte e o bit alto diz se vem mais. 0x1a | 0x80 = 0x9a.");
  choice("t5", 3, 2, "O que viaja no lugar dos nomes dos campos?", ["Nada, os nomes viajam em texto.", "O número do campo, na etiqueta.", "Um hash do nome.", "O nome em base64."], 1, "A etiqueta junta o número do campo e o tipo: 08 é o campo 1, varint. Por isso o número nunca pode ser reusado.");
  choice("t5", 4, 2, "Quantos bytes uma chamada gRPC gasta, medidos, na 1ª e na 2ª chamada em diante?", ["204 B e 95 B", "229 B e 103 B", "360 B e 360 B", "128 B e 42 B"], 1, "Medido com grpc-go v1.62.1 em loopback: 229 B na 1ª chamada e 103 B da 2ª em diante, contando 9 B de cabeçalho por quadro.");
  choice("t5", 5, 2, "Quantas vezes o REST gasta mais bytes que o gRPC da 2ª chamada em diante (360 B contra 103 B)?", ["Cerca de 3,5 vezes", "Cerca de 10 vezes", "Cerca de 1,2 vez", "Cerca de 100 vezes"], 0, "360 ÷ 103 = 3,5. Para uma chamada interna a diferença em bytes é pequena; o ganho maior é o contrato, a multiplexação e o streaming.");
  choice("t5", 6, 2, "Por que a 2ª chamada gRPC gasta bem menos bytes de cabeçalho que a 1ª?", ["Porque o gRPC compacta o corpo.", "Porque a tabela dinâmica do HPACK já guarda os cabeçalhos da 1ª chamada.", "Porque o servidor guarda a resposta anterior.", "Porque o cliente usa UDP."], 1, "O HPACK (RFC 7541) manda um índice no lugar do cabeçalho repetido: o HEADERS do cliente cai de 102 para 15 bytes de payload.");
  choice("t5", 7, 3, "O pedidos tem 3 réplicas, cada uma com uma conexão HTTP/2 para o pagamentos, atrás de um LB de camada 4. Qual o risco?", ["As 3 conexões podem cair todas no pagamentos-1 e o pagamentos-2 fica a 0%.", "As chamadas ficam em texto.", "O deadline deixa de funcionar.", "O Protobuf para de compilar."], 0, "O LB de camada 4 distribui conexões, não chamadas. O conserto é balancear por chamada (L7, malha ou cliente).");
  choice("t5", 8, 3, "Alguém troca int64 valor_centavos = 2 por double valor = 2. O que acontece com os clientes antigos?", ["Nada, o Protobuf converte o tipo.", "Quebram sem erro visível: o valor chega como campo desconhecido e a cobrança sai com valor 0.", "O servidor se recusa a subir.", "Recebem 404."], 1, "Nunca reuse o número de um campo. Marque o que saiu com reserved.");
  tf("t5", 9, 2, "No gRPC, um deadline de 1 s é parte da chamada: viaja no cabeçalho grpc-timeout, e DEADLINE_EXCEEDED é o código 4.", true, "O grpc-timeout leva o prazo restante em microssegundos (por exemplo 996250u). Os códigos de status do gRPC não são os do HTTP.");
  choice("t6", 1, 1, "O que o servidor responde para aceitar a troca para WebSocket?", ["200 OK", "101 Switching Protocols", "301 Moved Permanently", "202 Accepted"], 1, "Depois do 101, a mesma conexão TCP passa a carregar quadros nos dois sentidos.");
  choice("t6", 2, 2, "Quantos bytes tem o quadro com a posição do pedido 1048, do servidor para o cliente?", ["56", "58", "62", "317"], 1, "São 56 B de texto mais 2 B de cabeçalho do quadro. Do cliente ao servidor, a máscara de 4 B leva a 62.");
  choice("t6", 3, 2, "Com 1.000 pedidos a caminho, o que o WebSocket economiza sobre o polling a cada 5 s?", ["Nada, o custo é o mesmo.", "~11,6 KB/s contra ~63 KB/s, e as 200 autenticações por segundo no gateway.", "Só o tempo de CPU.", "Só a conexão TCP."], 1, "200 mensagens/s × 58 B contra 200 req/s × 317 B. O WebSocket autentica uma vez na abertura.");
  choice("t6", 4, 3, "Qual destes é um problema real do servidor de chat do lab?", ["O mapa clients é lido e escrito por várias goroutines sem mutex.", "A porta 8080 é reservada.", "O JSON não tem o campo username.", "O gorilla não aceita texto."], 0, "O mutex só protege messages. O Go pode parar o programa com fatal error: concurrent map writes.");
  choice("t6", 5, 3, "O celular da Lena troca de 4G para Wi-Fi e a conexão morre sem aviso. Qual conserto está certo?", ["Esperar o TCP retransmitir para sempre.", "Ping e pong com prazo, reconexão com backoff e jitter e retomada pelo ultimo_seq.", "Trocar o WebSocket por short polling de 1 s.", "Fechar a conexão com código 1000."], 1, "Sem FIN, o app não sabe que perdeu a conexão. O prazo do pong detecta, e o ultimo_seq recupera só o que foi perdido.");
  tf("t6", 6, 2, "Segundo a correção ao artigo, o HTTP/1.1 ainda abre uma nova conexão TCP para cada requisição.", false, "Só o HTTP/1.0 era assim. O HTTP/1.1 reaproveita a conexão (keep-alive) e o HTTP/2 multiplexa. O WebSocket traz o servidor poder enviar sem ser perguntado.");
  choice("t7", 1, 1, "Quem decide a forma da resposta no GraphQL?", ["O cliente, escolhendo os campos na consulta.", "O servidor, no código do BFF.", "O gateway.", "O banco de dados."], 0, "No GraphQL o cliente escreve os campos, e o mesmo schema serve app, site e voz.");
  choice("t7", 2, 2, "Quantas chamadas ao estoque uma lista de 20 produtos faz com um resolver ingênuo?", ["2", "20", "21", "40"], 2, "1 chamada para a lista e 20 ao estoque, uma por produto: 1 + 20 = 21. É o N+1.");
  choice("t7", 3, 2, "E com DataLoader?", ["2: a lista e uma chamada em lote ao estoque.", "1", "20", "0"], 0, "O DataLoader junta as chaves do mesmo tick e chama a fonte uma vez com a lista.");
  choice("t7", 4, 3, "Por que o gateway não vê um erro de GraphQL como falha?", ["Porque o erro volta com status 200 e um errors[] no corpo.", "Porque o GraphQL não gera erros.", "Porque usa WebSocket.", "Porque o gateway é cego a JSON."], 0, "O gateway e os painéis contam status 5xx, e a falha parcial do GraphQL vem com 200.");
  choice("t7", 5, 3, "Por que o cache HTTP e a CDN ajudam pouco no GraphQL?", ["Porque há uma rota só (POST /graphql) e o corpo muda a cada consulta.", "Porque o GraphQL não usa HTTP.", "Porque o GraphQL não tem ETag em nenhum caso.", "Porque a CDN só guarda Protobuf."], 0, "Sem URL por recurso e com POST, o cache do módulo 5 não funciona sem trabalho extra.");
  choice("t8", 1, 1, "Qual é a regra resumida do artigo para a convergência?", ["REST na porta de fora, gRPC por dentro e GraphQL quando o cliente precisa de formas diferentes.", "gRPC em tudo, inclusive no navegador.", "REST só por dentro e GraphQL por fora.", "WebSocket para tudo."], 0, "REST tem contrato simples de entender, gRPC é forte e leve entre serviços, e o GraphQL serve a clientes com necessidades diferentes.");
  choice("t8", 2, 2, "O que o gateway faz quando transcodifica?", ["Cifra o corpo.", "Traduz o POST /api/v1/pedidos do app em Pedidos.Criar, uma chamada gRPC por dentro.", "Troca o JWT.", "Guarda a resposta em cache."], 1, "É o gRPC-JSON transcoder do Envoy, por exemplo. O navegador, por sua vez, precisa do gRPC-Web.");
  choice("t8", 3, 3, "Distribuir o .proto por e-mail e mudar um campo no pagamentos v2 causa o quê?", ["Os 3 clientes quebram em dias diferentes.", "Nada, o Protobuf é compatível sempre.", "O pagamentos para de subir.", "O gateway devolve 404."], 0, "O conserto é de processo: repositório único de contratos, versão no pacote (v1, v2) e checagem de compatibilidade no CI.");
  choice("t8", 4, 3, "Por que fazer 3 chamadas síncronas em fila para avisar o PedidoPago a estoque, entregas e notificacoes é ruim?", ["Deixa o pagamento do Davi 3 respostas mais lento e, se as entregas estiverem fora, a falha volta para ele.", "Porque o gRPC não aceita 3 chamadas.", "Porque o PSP proíbe.", "Porque o estoque não aceita eventos."], 0, "É a pergunta do módulo 13 (Comunicação Assíncrona): avisar sem esperar e sem perder o aviso.");

  window.QUIZ = out;
})();
