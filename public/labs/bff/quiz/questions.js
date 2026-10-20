/* Banco de perguntas do quiz de Backend for Frontends (BFF).
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-responsabilidades", name: "Introdução e responsabilidades" },
    t2: { topic: "aula-2-api-composition", name: "API composition" },
    t3: { topic: "aula-3-canais-e-dispositivos", name: "Canais e dispositivos" },
    t4: { topic: "aula-4-microfrontends-e-bffs", name: "Microfrontends e BFFs" },
    t5: { topic: "aula-5-versionamento-e-deployment", name: "Versionamento e deployment" },
    t6: { topic: "aula-6-resiliencia-e-blast-radius", name: "Resiliência e blast radius" },
    t7: { topic: "aula-7-metricas-e-experiencia", name: "Métricas e experiência de uso" },
    t8: { topic: "aula-8-consideracoes-finais", name: "Considerações finais" }
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

  choice("t1", 1, 1, "O que é um BFF, numa frase?", ["Um balanceador de carga para o app.", "Um backend feito sob medida para um frontend, que faz as chamadas que a tela precisa e devolve só o que ela usa.", "Um banco de dados para o celular.", "Outro nome do API Gateway."], 1, "BFF é Backend for Frontend: um backend por frontend, escrito para a tela que ele atende.");
  choice("t1", 2, 2, "Sem BFF, o app da Lena faz 4 chamadas em fila no 4G, de 120 ms cada. Quanto leva só a rede?", ["120 ms.", "240 ms.", "480 ms.", "1,2 s."], 2, "4 × 120 ms = 480 ms, antes de a tela ficar inteira.");
  tf("t1", 3, 1, "O campo custo_fornecedor chegar ao celular da Lena é aceitável, porque o app não o mostra.", false, "Um campo interno nunca devia sair da rede da loja. Quem filtra o que passa é o BFF.");
  choice("t1", 4, 2, "Qual destas coisas um BFF costuma assumir?", ["Guardar o banco de dados da loja.", "Compor payloads, adaptar contratos e acionar fallbacks.", "Substituir o balanceador de carga.", "Decidir o preço do frete."], 1, "Composição, adaptação de contrato, filtros, cache e fallback são trabalho de BFF. O frete é regra de negócio e fica no serviço.");
  choice("t1", 5, 2, "O módulo 8 deixou o gw-loja na frente de tudo. Por que isso não bastou para a tela do app?", ["O gateway não confere o JWT.", "O gateway é genérico: não monta a tela, e o app continua fazendo 4 chamadas e recebendo JSON feito para o site.", "O gateway só aceita o site.", "O gateway não aceita HTTPS."], 1, "O gateway cuida da porta de entrada. Quem monta a resposta de uma tela é o BFF.");
  tf("t1", 6, 2, "O BFF é um componente de infraestrutura, como o gateway e o balanceador.", false, "O BFF é uma aplicação com código de produto, escala própria e dono. Fica atrás do gateway.");
  choice("t2", 1, 1, "O que é API composition num BFF?", ["Compactar a resposta em gzip.", "Uma chamada do cliente vira várias chamadas entre serviços, feitas pelo BFF, que junta as respostas numa só.", "Dividir uma API em várias.", "Guardar as respostas no Redis."], 1, "O cliente faz uma chamada; o BFF faz as outras e compõe a resposta.");
  choice("t2", 2, 2, "O bff-app chama 4 serviços em paralelo e o mais lento leva 25 ms. Com 120 ms de rede e ~5 ms de montagem, qual o tempo total?", ["~25 ms.", "~100 ms.", "~150 ms.", "~480 ms."], 2, "120 + 25 + 5 = 150 ms: uma viagem de rede e só o serviço mais lento.");
  choice("t2", 3, 2, "Por que o BFF espera só 25 ms se chama quatro serviços?", ["Porque os serviços são mais rápidos que o normal.", "Porque chama os quatro ao mesmo tempo e espera só o mais lento.", "Porque guarda tudo em cache.", "Porque o app já tinha metade dos dados."], 1, "Em paralelo, o total é o tempo da chamada mais lenta, não a soma.");
  choice("t2", 4, 2, "De quanto para quanto a resposta da home do app encolhe com o BFF?", ["De 180 KB para 12 KB.", "De 12 KB para 180 KB.", "De 480 KB para 120 KB.", "Não muda."], 0, "Sem as 8 fotos em alta, a descrição longa e os campos internos.");
  order("t2", 5, 2, "Ordene o caminho do GET /app/home.", ["O app faz uma chamada pelo 4G", "O gw-loja confere o JWT e passa o pedido ao bff-app", "O bff-app chama os 4 serviços ao mesmo tempo", "O bff-app monta o JSON de 12 KB e responde"], "Uma viagem do celular, o gateway na porta, a composição em paralelo e só então a resposta montada.");
  choice("t2", 6, 3, "Cada serviço responde bem em 99,9% das vezes e a tela precisa dos quatro. Qual a disponibilidade da tela, sem fallback?", ["99,9%.", "Cerca de 99,6%.", "Cerca de 96%.", "100%."], 1, "0,999 elevado a 4 é ≈ 0,996. Quem compõe depende de todos.");
  tf("t2", 7, 2, "Se a chamada 2 depende do resultado da 1, o BFF ainda ganha: cada espera custa os ms da rede interna, não os 120 ms do 4G.", true, "A dependência obriga a esperar, mas a espera é dentro da rede da loja.");
  choice("t3", 1, 1, "O que é um canal?", ["Um tipo de banco de dados.", "Um jeito de o usuário falar com a loja: app, site, voz.", "Uma fila de mensagens.", "Uma rota do gateway."], 1, "App, site e voz são canais; cada um ganha o seu BFF.");
  choice("t3", 2, 2, "Qual BFF renderiza a página no servidor (SSR) e guarda a sessão no Redis?", ["bff-app.", "bff-voz.", "bff-web.", "marketplace-xyz."], 2, "O bff-web serve o site, com fotos grandes e sessão no cache central.");
  choice("t3", 3, 2, "O que o bff-voz responde a \"cadê meu pedido?\"", ["Um JSON de 12 KB.", "Uma página HTML.", "Uma frase curta: \"Seu pedido 1048 está a caminho e chega quinta.\"", "Uma foto do gato."], 2, "Voz não tem tela: a resposta é texto curto, sem foto.");
  choice("t3", 4, 3, "Por que o marketplace-xyz não ganha um BFF?", ["Porque é lento.", "Porque BFF é para frontend próprio; o parceiro usa a API pública genérica no gateway.", "Porque não tem JWT.", "Porque só aceita XML."], 1, "Um parceiro externo não é frontend da loja. O contrato dele é genérico e estável.");
  choice("t3", 5, 3, "Sem um BFF por canal, o que costuma acontecer no backend único?", ["Nada.", "Um if por canal que cresce a cada endpoint.", "O banco fica mais rápido.", "O gateway deixa de funcionar."], 1, "Um if (canal == app) ... else if (canal == web) ... em cada endpoint, e mexer no app pode quebrar a voz.");
  tf("t3", 6, 2, "O mesmo dado (o status do pedido 1048) chega em formatos diferentes a cada canal, mas vem do mesmo serviço pedidos.", true, "O dado é um só; o BFF de cada canal só muda a forma.");
  choice("t4", 1, 1, "O que é um microfrontend?", ["Um frontend sem JavaScript.", "Um pedaço da tela, de um time só, publicado sem esperar os outros.", "Um app muito pequeno.", "Um tipo de cache."], 1, "Cada time é dono de um pedaço da tela e do BFF que o alimenta.");
  choice("t4", 2, 2, "Quais são os três BFFs do site da loja?", ["bff-app, bff-web e bff-voz.", "bff-vitrine, bff-checkout e bff-rastreio.", "bff-v3, bff-v4 e bff-v5.", "bff-gato, bff-caneca e bff-pedido."], 1, "Um para cada time do módulo 6: Vitrine, Checkout e Logística.");
  choice("t4", 3, 3, "Três BFFs calculam o frete de três jeitos e a Lena vê dois valores na mesma compra. Qual a regra para evitar?", ["Juntar os três BFFs num só.", "A regra de negócio fica no serviço dono dela; o BFF só compõe e adapta.", "Cada BFF arredonda para cima.", "Desligar o checkout."], 1, "Se muda o resultado, é do serviço. Se muda só o formato, é do BFF.");
  choice("t4", 4, 2, "Qual destas mudanças é do BFF, e não do serviço?", ["O valor do frete.", "Quem tem desconto.", "Renomear um campo e cortar a foto grande.", "Se o pedido pode ser cancelado."], 2, "Formato é do BFF. Resultado e regra são do serviço.");
  choice("t4", 5, 2, "Qual a relação com a Lei de Conway?", ["Nenhuma.", "O sistema acaba com a forma da organização: três times, três pedaços de tela, três BFFs.", "Ela proíbe microfrontends.", "Ela exige um BFF só."], 1, "Dividir a tela como os times estão divididos é Conway em prática.");
  tf("t4", 6, 2, "Cada time pode publicar o seu microfrontend e o seu BFF sem esperar os outros.", true, "É o ganho de autonomia: deploy independente.");
  choice("t5", 1, 1, "Por que o bff-app-v3 e o bff-app-v4 rodam juntos?", ["Por economia.", "O v3 ainda está em 30% dos celulares e o contrato do v4 é diferente.", "O v4 não funciona sozinho.", "O gateway exige dois."], 1, "O que está no celular não se atualiza quando a loja quer.");
  order("t5", 2, 2, "Ordene o rollout da tela nova.", ["nova_home liga para 10% dos usuários do v4", "sobe para 50%", "sobe para 100%", "desliga o bff-app-v3 quando o uso do v3 cair abaixo de 1%"], "Aos poucos, e o v3 só sai quando o dado do próprio BFF mostra que quase ninguém o usa.");
  choice("t5", 3, 2, "Quando se deve desligar o bff-app-v3?", ["Assim que o v4 sair.", "Quando o uso do v3, medido no próprio BFF, cair abaixo de 1%.", "Nunca.", "Quando a toggle chegar a 10%."], 1, "Desligar cedo deixaria quem ainda usa o v3 sem tela.");
  choice("t5", 4, 3, "Qual a diferença entre a toggle nova_home e um canary?", ["Nenhuma.", "A toggle muda o que o usuário vê; o canary testa uma versão nova do BFF em pouco tráfego.", "O canary é para o app e a toggle para o site.", "A toggle exige novo deploy."], 1, "Toggle: quem vê. Canary: onde roda o código novo.");
  choice("t5", 5, 2, "Como o gateway escolhe entre v3 e v4?", ["Pelo horário.", "Por um cabeçalho com a versão do app, como X-App-Version, numa regra de rota.", "Pela cor do app.", "Sorteando."], 1, "O app informa a versão e a rota do gateway aponta para o BFF certo.");
  tf("t5", 6, 2, "Para voltar atrás na tela nova, basta desligar a toggle, sem novo deploy.", true, "É a vantagem da toggle: o código já está no ar.");
  choice("t6", 1, 1, "O que o bff-app faz quando o recomendacoes demora mais de 100 ms?", ["Espera até 30 s.", "Desiste daquela chamada e responde a tela sem a seção, com recomendado vazio.", "Derruba a tela.", "Chama o catalogo."], 1, "Timeout e fallback: a Lena nem percebe.");
  choice("t6", 2, 3, "Sem timeout, o recomendacoes fica 30 s sem responder. O que acontece com o bff-app?", ["Nada.", "As conexões se acumulam até ele cair, e a tela inicial inteira some.", "Só a seção some.", "O gateway responde no lugar."], 1, "Cada tela fica presa na espera, e um serviço que só enfeita derruba o app.");
  choice("t6", 3, 2, "O que o app mostra se o serviço pedidos cai?", ["A tela inteira em erro.", "A tela com a seção do pedido dizendo \"status indisponível agora\".", "Nada.", "O pedido de outra pessoa."], 1, "Falha pequena, tela inteira.");
  choice("t6", 4, 2, "O que é raio de explosão (blast radius)?", ["O tamanho do servidor.", "O alcance de uma falha: quantos canais e usuários a sentem.", "O número de réplicas.", "O tempo de deploy."], 1, "Se o catalogo cai, bff-app e bff-web sentem juntos.");
  tf("t6", 5, 3, "Separar um BFF por canal já separa as dependências compartilhadas.", false, "Os BFFs continuam chamando os mesmos serviços. Isolar as chamadas é assunto de bulkhead.");
  choice("t6", 6, 3, "Canary e blue-green reduzem qual tipo de falha?", ["A de um serviço que cai.", "A de uma versão ruim do BFF, validada antes de chegar a todos.", "A de rede do 4G.", "Nenhuma."], 1, "Para um serviço que cai, valem timeout, fallback, circuit breaker e bulkhead.");
  choice("t7", 1, 2, "Quais são as métricas do bff-app e do bff-web?", ["p95 150 ms e 2% de erros no app; p95 300 ms e 0,1% no web.", "p95 300 ms e 2% no app; p95 150 ms e 0,1% no web.", "Iguais.", "Não existem."], 0, "Cada canal mede o seu.");
  choice("t7", 2, 3, "De onde vêm os 2% de erros do app?", ["De todos os celulares.", "Só do v3 em Android antigo.", "Do site.", "Do gateway."], 1, "O corte por versão e sistema mostra a origem.");
  choice("t7", 3, 3, "Num backend único, por que o problema do app passaria despercebido?", ["Porque o app não gera erros.", "Porque os 2% se diluiriam num total de ~0,6%, junto com o site.", "Porque o Prometheus não funciona.", "Porque o v3 seria desligado."], 1, "O total esconde o canal pequeno.");
  choice("t7", 4, 1, "O que significa p95?", ["A média dos pedidos.", "95 de cada 100 pedidos foram mais rápidos que esse tempo.", "95% de erros.", "95 ms."], 1, "Mostra o lado lento que a média esconde.");
  choice("t7", 5, 2, "Como uma consulta de Prometheus separa os canais?", ["Não separa.", "Com um rótulo (canal, versão) na métrica e um sum by nesse rótulo.", "Só com logs.", "Trocando o gateway."], 1, "O corte por canal é um rótulo.");
  choice("t8", 1, 1, "Qual a diferença entre BFF e API Gateway?", ["Nenhuma.", "O gateway é infraestrutura genérica (rota, auth, limite); o BFF é código de produto, do time do frontend.", "O BFF só funciona no app.", "O gateway compõe telas."], 1, "O gateway olha a porta de entrada; o BFF olha a tela.");
  choice("t8", 2, 2, "Qual o caminho completo de uma chamada do app?", ["app → serviços → gw-loja", "app → gw-loja → bff-app → serviços", "gw-loja → app → serviços", "app → bff-app → banco"], 1, "O gateway na porta, o BFF montando a tela, os serviços atrás.");
  choice("t8", 3, 3, "Quando NÃO vale a pena usar BFF?", ["Com canais muito diferentes.", "Com um canal só e um time só, onde um gateway com composição simples resolve.", "Com vários times.", "Quando a tela junta muitos serviços."], 1, "O BFF seria só mais um salto para manter.");
  choice("t8", 4, 2, "O que sobra para o módulo 10 (Service Mesh)?", ["Desenhar a tela.", "Timeout, retry, criptografia e métrica entre os serviços, na rede, uma vez só.", "Escolher o frontend.", "Criar o JWT."], 1, "Cada time estava escrevendo isso do seu jeito, em cada linguagem.");

  window.QUIZ = out;
})();
