/* Banco de perguntas do quiz de Microsserviços, Monolitos e Domínios.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução aos microsserviços" },
    t2: { topic: "aula-2-monolitos", name: "Monolitos" },
    t3: { topic: "aula-3-microsservicos", name: "Microsserviços" },
    t4: { topic: "aula-4-domain-driven-design", name: "Domain-Driven Design" },
    t5: { topic: "aula-5-ddd-conceitos-e-componentes", name: "DDD: conceitos e componentes" },
    t6: { topic: "aula-6-lei-de-conway", name: "Lei de Conway" },
    t7: { topic: "aula-7-case-da-loja-dominios-e-entidades", name: "Case da loja: domínios e entidades" },
    t8: { topic: "aula-8-case-da-loja-servicos-e-eventos", name: "Case da loja: serviços e eventos" }
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

  /* ---------- 1. Introdução aos microsserviços ---------- */
  choice("t1", 1, 1, "Como a loja está no começo do módulo?", [
    "Seis serviços, cada um com o seu banco.",
    "Um programa só, o processo loja, com 7 módulos e o banco loja, num servidor de 8 vCPU.",
    "Sete programas, que conversam por fila.",
    "Um programa por time, todos no mesmo banco."
  ], 1, "Catálogo, Carrinho, Pedidos, Pagamentos, Estoque, Entregas e Relatórios moram no mesmo processo. Partir isso é o assunto do módulo.");
  choice("t1", 2, 1, "O que é um vCPU?", [
    "Uma cópia do programa rodando em paralelo.",
    "Um servidor inteiro, com disco e memória.",
    "Um núcleo virtual de processamento, a unidade em que a conta de capacidade é feita.",
    "O tempo que o processador leva para responder."
  ], 2, "O servidor da loja tem 8 vCPU. É nessa unidade que se compara 80 vCPU do monolito com 25 vCPU dos serviços.");
  choice("t1", 3, 2, "Três times mexem no mesmo código da loja e o deploy leva 40 min. Qual problema isso mostra?", [
    "O banco está lento.",
    "O cache está frio.",
    "A rede entre os serviços está cara.",
    "Os times esperam um ao outro: rebase, fila de deploy, um binário só."
  ], 3, "É um problema de organização, não de velocidade do código. Ele pesa tanto quanto os problemas de runtime.");
  tf("t1", 4, 1, "O módulo defende que toda loja deve virar microsserviços o quanto antes.", false,
    "O módulo é sobre quando e como partir, e sobre onde cortar. Partir cedo demais custa caro, como a aula 3 mostra.");

  /* ---------- 2. Monolitos ---------- */
  choice("t2", 1, 1, "O que é um monolito?", [
    "Um programa com todos os módulos num processo só, geralmente com um banco só e um deploy só.",
    "Um programa escrito numa linguagem só.",
    "Um servidor grande demais para escalar.",
    "Um programa sem módulos, tudo num arquivo."
  ], 0, "A loja tem 7 módulos, mas eles rodam no mesmo processo. Ter módulos não faz dela um conjunto de microsserviços.");
  choice("t2", 2, 2, "No monolito, o checkout do pedido 1047 falha no pagamento depois de reservar o estoque. O que acontece?", [
    "O estoque fica reservado até alguém corrigir à mão.",
    "O ROLLBACK da transação desfaz tudo, inclusive a reserva de estoque.",
    "O pedido é cobrado duas vezes.",
    "O processo reinicia e o pedido é refeito."
  ], 1, "Tudo roda em uma transação só (BEGIN … COMMIT). A consistência vem de graça, e é a maior vantagem do monolito no começo.");
  choice("t2", 3, 1, "No monolito, o checkout leva 180 ms. Por que a conta de rede não entra nele?", [
    "Porque o banco fica na memória.",
    "Porque Carrinho, Pedidos, Pagamentos, Estoque e Entregas se chamam por chamada de função no mesmo processo, em cerca de 0,01 ms.",
    "Porque o checkout usa UDP.",
    "Porque a rede interna do servidor é infinitamente rápida."
  ], 1, "Chamada de função não sai do processo. Os 180 ms são trabalho, não viagem.");
  choice("t2", 4, 3, "Às 23:00 o módulo Relatórios usa 7 dos 8 vCPU por 15 min. A página do gato vai de 120 ms para 2,4 s e o checkout da Lena estoura o limite de 2 s. Ninguém mexeu no checkout. O que explica isso?", [
    "O banco perdeu uma réplica.",
    "Um vizinho barulhento: os módulos dividem os mesmos 8 vCPU, e Relatórios comeu quase tudo.",
    "O cache expirou todo ao mesmo tempo.",
    "A Lena está longe do servidor."
  ], 1, "Quando os módulos dividem o mesmo processo e a mesma máquina, o que um consome falta para os outros.");
  choice("t2", 5, 3, "Um bug no cálculo de frete (Entregas) estoura a memória e o processo cai. O que sai do ar?", [
    "Só a tela de frete.",
    "Só o módulo Entregas.",
    "A loja inteira: vitrine, carrinho e pagamento.",
    "Só o que depende de Entregas, como o Estoque."
  ], 2, "É o raio de explosão do monolito: um módulo derrubou os sete, porque o processo é um só.");
  choice("t2", 6, 2, "Black Friday: a vitrine recebe 10 vezes o tráfego e a loja é um monolito de 8 vCPU. Qual é a conta?", [
    "10 cópias de 8 vCPU, 80 vCPU, com Relatórios e Pagamentos copiados sem precisar.",
    "Só a vitrine é copiada: 10 vCPU.",
    "Um servidor de 80 vCPU, com um processo só.",
    "25 vCPU, como nos serviços."
  ], 0, "No monolito só dá para copiar o programa inteiro. Os 25 vCPU são a conta dos microsserviços, não a do monolito.");
  tf("t2", 7, 2, "Para um time pequeno e uma loja nova, um monolito costuma ser a escolha certa.", true,
    "Um deploy, um banco, um teste de ponta a ponta e consistência de graça. Os problemas do monolito só pesam quando a loja e os times crescem.");

  /* ---------- 3. Microsserviços ---------- */
  choice("t3", 1, 1, "O que é um microsserviço, na loja?", [
    "Um módulo com menos de 100 linhas.",
    "Um serviço pequeno, com um processo próprio, o seu banco e deploy independente, que conversa com os outros pela rede.",
    "Uma função chamada pela rede, sem estado.",
    "Uma réplica do monolito."
  ], 1, "Tamanho não define. O que define é a fronteira: processo, banco e deploy próprios.");
  choice("t3", 2, 2, "A regra do banco por serviço diz que...", [
    "cada serviço pode ler as tabelas dos outros, para ir mais rápido.",
    "todos os serviços usam o mesmo tipo de banco.",
    "cada tabela tem um dono, e quem precisa do dado pergunta pela API ou escuta o evento.",
    "só o serviço de Pedidos tem banco."
  ], 2, "Se dois serviços leem a mesma tabela, voltam a ser um monolito disfarçado: qualquer mudança no esquema quebra os dois.");
  choice("t3", 3, 2, "O checkout do monolito leva 180 ms. Em microsserviços, com 4 saltos de rede de 5 ms, síncronos, quanto leva?", [
    "184 ms.",
    "200 ms.",
    "360 ms.",
    "900 ms."
  ], 1, "180 + 4 × 5 = 200 ms. A rede entrou na conta.");
  choice("t3", 4, 2, "Black Friday com 10 vezes o tráfego na vitrine. Qual é a conta em microsserviços, e por que é menor?", [
    "80 vCPU, igual ao monolito.",
    "25 vCPU, porque só o Catálogo ganha 10 réplicas e o resto fica pequeno.",
    "10 vCPU, porque a rede divide a carga.",
    "40 vCPU, porque cada serviço dobra."
  ], 1, "Catálogo 10×1, carrinho 3×1, pedidos 3×1, pagamentos 2×1, estoque 2×1, entregas 1×1 e relatórios 1×4: 25 vCPU contra 80.");
  choice("t3", 5, 3, "Em microsserviços, o relatório das 23:00 roda no serviço relatorios. O que acontece com a página do gato?", [
    "Continua em 120 ms: o ruído ficou dentro do serviço de Relatórios.",
    "Vai a 2,4 s, como antes.",
    "Fica em 60 ms.",
    "Cai, porque o Catálogo depende de Relatórios."
  ], 0, "O vizinho barulhento sumiu porque o relatório não divide mais processo nem vCPU com o Catálogo.");
  choice("t3", 6, 3, "O serviço entregas cai. O que acontece com o pedido que acabou de ser pago?", [
    "A loja inteira cai junto.",
    "O pagamento é desfeito.",
    "O evento PedidoPago espera na fila e é entregue quando entregas voltar. A loja continua vendendo.",
    "O pedido é perdido."
  ], 2, "É o isolamento de falha: o raio de explosão é um serviço, não a loja. A fila segura o evento.");
  choice("t3", 7, 3, "O pagamento foi aprovado, mas a reserva de estoque falha porque o estoque já está em 0. Não existe ROLLBACK que cubra os dois serviços. O que fazer?", [
    "Apagar o pedido do banco de Pedidos e torcer.",
    "Compensar: estornar o pagamento. Esse é o gancho para o padrão Saga.",
    "Tentar a reserva para sempre, em loop.",
    "Voltar para o monolito."
  ], 1, "Cada serviço tem o seu banco, então não há transação única. Desfazer vira uma ação nova, a compensação.");
  tf("t3", 8, 2, "Microsserviços são melhores que o monolito em tudo, porque escalam e isolam falhas.", false,
    "Eles trocam consistência fácil por escala independente e isolamento de falha. Em troca vêm a rede, os testes, a observabilidade e a compensação.");

  order("t3", 9, 2, "Ordene os saltos do checkout do pedido 1047 pela rede (5 ms cada).", [
    "carrinho chama pedidos",
    "pedidos chama pagamentos",
    "pagamentos chama estoque",
    "estoque chama entregas"
  ], "São 4 saltos entre 5 serviços: 4 × 5 = 20 ms a mais, ou 180 + 20 = 200 ms no total.");

  /* ---------- 4. Domain-Driven Design ---------- */
  choice("t4", 1, 1, "O que é o domínio de uma loja?", [
    "O endereço do site.",
    "O assunto do negócio que o software resolve: vender, cobrar, separar, entregar.",
    "O conjunto de tabelas do banco.",
    "O nome do time mais antigo."
  ], 1, "Domínio é o problema do negócio, não a tecnologia. O DDD parte dele para decidir o desenho.");
  choice("t4", 2, 2, "O que é linguagem ubíqua?", [
    "Um vocabulário só, usado igual por quem fala de negócio e por quem escreve código, dentro de um contexto.",
    "Um idioma de programação usado em toda a empresa.",
    "A tradução do sistema para vários idiomas.",
    "Um dicionário de termos técnicos em inglês."
  ], 0, "Se o negócio fala pedido e o código chama de order_tx_row, alguém traduz toda hora, e os erros nascem na tradução.");
  choice("t4", 3, 2, "O mesmo gato é produto 42 no Catálogo, SKU GATO-042 no Estoque e volume de 0,4 kg em Entregas. O que isso mostra?", [
    "Um erro: o gato deveria ter um modelo único em toda a loja.",
    "Que três contextos delimitados modelam o mesmo gato do jeito que cada um precisa, e cada forma está certa no seu contexto.",
    "Que o banco está duplicado.",
    "Que o Estoque deveria ler a tabela do Catálogo."
  ], 1, "Um modelo único para tudo cresce até ninguém entender. Cada contexto delimitado guarda só o que importa para ele.");
  tf("t4", 4, 2, "O Pagamentos precisa saber o que é um gato de pelúcia para cobrar o pedido 1047.", false,
    "O Pagamentos só enxerga { pedido_id: 1047, valor: 94.90 }. Ele não sabe o que é gato, e é bom que não saiba.");
  choice("t4", 5, 3, "A loja ainda é um processo só, mas o time quer preparar o corte. Qual é o caminho mais barato?", [
    "Escrever o monolito de novo em microsserviços.",
    "Trocar o banco primeiro.",
    "Monolito modular: os mesmos limites viram pastas e módulos com fronteira, antes de virar serviços.",
    "Esperar o próximo trimestre."
  ], 2, "Se a fronteira não aguenta dentro do processo, não vai aguentar na rede. O monolito modular é o ensaio, e às vezes basta.");
  choice("t4", 6, 1, "Para que serve um contexto delimitado?", [
    "Para marcar até onde um modelo e uma palavra valem. Fora da fronteira, o sentido pode mudar.",
    "Para limitar a memória de cada serviço.",
    "Para impedir que o time use bibliotecas novas.",
    "Para guardar o log de cada pedido."
  ], 0, "Produto, no Catálogo, tem foto e descrição. No Estoque, é uma quantidade num depósito.");

  /* ---------- 5. DDD: conceitos e componentes ---------- */
  choice("t5", 1, 1, "Qual a diferença entre entidade e value object?", [
    "Entidade tem identidade e continua a mesma ao mudar. Value object é igual se os valores são iguais, e se troca inteiro.",
    "Entidade vai para o banco e value object nunca.",
    "Entidade é mais lento que value object.",
    "Não há diferença, só o nome."
  ], 0, "O pedido 1047 continua sendo o 1047 se o endereço mudar. Dois Dinheiro(94.90, \"BRL\") são o mesmo dinheiro.");
  choice("t5", 2, 2, "Qual destes é um value object na loja?", [
    "O pedido 1047.",
    "A cliente Lena.",
    "O volume do gato, com número de rastreio.",
    "O endereço { rua: \"Rua da Aurora, 100\", cidade: \"Recife\", cep: \"50050-000\" }."
  ], 3, "O endereço não tem identidade própria: dois com os mesmos valores são o mesmo. Para mudar, troca-se por outro inteiro.");
  choice("t5", 3, 2, "O que é o agregado Pedido?", [
    "Uma tabela do banco.",
    "O conjunto dos pedidos de uma cliente.",
    "Um grupo de objetos que é tratado como um bloco, com uma raiz (Pedido) pela qual tudo passa e que protege as invariantes.",
    "Um serviço à parte."
  ], 2, "ItemDoPedido só muda passando pela raiz do agregado. Assim a regra não pode ser burlada de fora.");
  choice("t5", 4, 3, "O pedido 1047 tem 1 item de 79.90 e frete de 15.00. Qual é o total que a invariante exige?", [
    "79.90.",
    "94.90.",
    "64.90.",
    "Qualquer valor, desde que o cliente aprove."
  ], 1, "total = soma dos itens + frete, ou 79.90 + 15.00 = 94.90. A raiz recusa qualquer mudança que quebre isso.");
  choice("t5", 5, 2, "pedido.status = \"cancelado\", escrito de fora por qualquer um, é um exemplo de...", [
    "modelo rico.",
    "evento de domínio.",
    "modelo anêmico: os dados ficam no objeto, e a regra, espalhada por quem usa.",
    "repositório."
  ], 2, "No modelo rico, pedido.cancelar() mora no próprio pedido e recusa se o status for enviado.");
  choice("t5", 6, 2, "Para que serve o repositório?", [
    "Para o domínio salvar e buscar pedidos (salvar, buscar(1047)) sem falar SQL.",
    "Para guardar o código-fonte.",
    "Para copiar os dados entre serviços.",
    "Para guardar o log dos eventos."
  ], 0, "O PedidoRepository esconde o banco. Trocar PostgreSQL por outro não mexe nas regras do pedido.");
  choice("t5", 7, 1, "Qual destes é um evento de domínio bem nomeado?", [
    "AtualizarPedido.",
    "PedidoPago, um fato no passado, no idioma do negócio.",
    "pedido_update_row.",
    "ProcessarPagamento."
  ], 1, "Evento é o que já aconteceu: PedidoCriado, PedidoPago, EstoqueReservado, PedidoEnviado. Comando está no imperativo.");
  choice("t5", 8, 3, "Na loja, qual classificação dos subdomínios está certa?", [
    "Núcleo: Catálogo e Pedidos. Suporte: Estoque e Entregas. Genérico: Pagamentos via gateway, Notificações e Login.",
    "Núcleo: Pagamentos. Suporte: Catálogo. Genérico: Entregas.",
    "Todos são núcleo.",
    "Núcleo: Login e Notificações. Genérico: Pedidos."
  ], 0, "O núcleo é o que faz a loja vender e a diferencia. Genérico é o que qualquer loja precisa e dá para comprar pronto.");

  /* ---------- 6. Lei de Conway ---------- */
  choice("t6", 1, 1, "O que diz a Lei de Conway?", [
    "Quanto mais serviços, mais rápido o sistema.",
    "A estrutura do sistema copia a estrutura de comunicação da organização que o desenhou.",
    "Todo sistema vira um monolito com o tempo.",
    "Times pequenos escrevem código melhor."
  ], 1, "Se três times conversam pouco, o sistema sai em três pedaços com pouca conversa entre eles.");
  choice("t6", 2, 2, "A loja tem 3 times por camada: frontend, backend e DBA. O que se espera ver?", [
    "Serviços por domínio.",
    "Uma loja em 3 camadas, em que toda mudança atravessa os 3 times.",
    "Um serviço por time, com banco próprio.",
    "Nenhum efeito."
  ], 1, "Mudar o preço do frete mexe na tela, na regra e na tabela. Cada passo é uma fila de espera entre times.");
  choice("t6", 3, 2, "O que é a manobra inversa de Conway?", [
    "Desfazer os serviços e voltar ao monolito.",
    "Contratar mais gente para o time mais lento.",
    "Desenhar os times no formato da arquitetura que se quer, para o sistema sair assim.",
    "Escrever o código antes de formar os times."
  ], 2, "Se a organização define o sistema, mudar os times é um jeito de mudar o sistema.");
  choice("t6", 4, 3, "Qual formação de times combina com 3 ilhas de serviços?", [
    "Frontend, backend e DBA.",
    "Um time por serviço, com um líder por time.",
    "Vitrine (Catálogo, busca), Checkout (Carrinho, Pedidos, Pagamentos) e Logística (Estoque, Entregas).",
    "Um time só, com todos juntos."
  ], 2, "Cada time dono de um domínio inteiro, da tela ao banco. O desenho dos serviços passa a espelhar os 3 times.");
  tf("t6", 5, 2, "Conway fala só de software: o tamanho do time não importa.", false,
    "Fala justamente de pessoas. A forma como elas se comunicam aparece na forma do sistema.");

  /* ---------- 7. Case da loja: domínios e entidades ---------- */
  order("t7", 1, 2, "Ordene os eventos da compra do pedido 1047.", [
    "ProdutoVisto",
    "ItemAdicionadoAoCarrinho",
    "PedidoCriado",
    "PedidoPago",
    "EstoqueReservado",
    "PedidoEnviado",
    "PedidoEntregue"
  ], "Estilo event storming: a linha do tempo dos fatos, do primeiro olhar da Lena até a entrega em Recife.");
  choice("t7", 2, 2, "O que é event storming?", [
    "Um teste de carga que dispara muitos eventos.",
    "Uma oficina em que o time cola, em ordem, os fatos do negócio no passado, e depois agrupa em contextos.",
    "Uma ferramenta de monitoramento de filas.",
    "Um padrão de código para tratar erros."
  ], 1, "É um jeito barato de achar contextos, entidades e agregados antes de escrever código.");
  choice("t7", 3, 2, "Na compra da Lena, quais destes são entidades?", [
    "Pedido, Cliente, Produto e Volume.",
    "Endereço e Dinheiro.",
    "Só o Pedido.",
    "PedidoCriado e PedidoPago."
  ], 0, "Todas têm identidade (1047, Lena, 42, o volume). Endereço e Dinheiro são value objects, e os eventos são fatos.");
  choice("t7", 4, 3, "Os eventos foram agrupados em contextos. PedidoEnviado e PedidoEntregue ficam em qual?", [
    "Catálogo.",
    "Pagamentos.",
    "Entregas, no time da Logística.",
    "Carrinho."
  ], 2, "Eles falam de remessa e rastreio, o assunto de Entregas. EstoqueReservado também é da Logística, no Estoque.");
  tf("t7", 5, 2, "Se a Lena mudar o endereço do pedido 1047, ele passa a ser outro pedido.", false,
    "O pedido é entidade: a identidade é o 1047. O endereço é value object e se troca inteiro.");
  choice("t7", 6, 3, "No mapa do case, onde fica a raiz do agregado que contém os itens e o frete?", [
    "No ItemDoPedido, que guarda o preço.",
    "No Endereço.",
    "No Pedido, porque só passando por ele se muda um item e o total continua sendo 94.90.",
    "No Cliente."
  ], 2, "A raiz é a porta única do agregado. Quem protege a invariante precisa ser quem recebe as mudanças.");

  /* ---------- 8. Case da loja: serviços e eventos ---------- */
  choice("t8", 1, 2, "Quem é dono de cada tabela do banco loja ao segregar os serviços?", [
    "O serviço de Pedidos é dono de todas.",
    "produtos é do catálogo; pedidos e itens_pedido, de pedidos; estoque, do estoque; pagamentos, de pagamentos; remessas, de entregas.",
    "Todas ficam compartilhadas, com leitura liberada.",
    "O time de DBA fica com todas."
  ], 1, "Cada tabela tem um dono. Ninguém lê a tabela do outro: pergunta pela API ou escuta o evento.");
  order("t8", 2, 3, "Ordene a linha do tempo dos eventos do pedido 1047.", [
    "e-501 PedidoCriado, 14:02:10",
    "e-502 PedidoPago, 14:02:11",
    "e-503 EstoqueReservado, 14:02:11",
    "e-504 PedidoEnviado, 14:30:00"
  ], "O estoque só é reservado depois do pagamento, e o envio chega meia hora depois. No e-503, o estoque vai de 3 para 2.");
  choice("t8", 3, 3, "O PedidoPago e-502 chega duas vezes ao Estoque, sem nenhuma proteção. Qual é o estoque final do gato?", [
    "2, porque o segundo é ignorado.",
    "3, porque os dois se cancelam.",
    "0.",
    "1, errado: o estoque foi de 3 para 2 e depois para 1."
  ], 3, "Cada entrega baixa uma unidade. Com a mensagem repetida, o gato sai duas vezes do estoque.");
  choice("t8", 4, 3, "Qual é o conserto para o evento duplicado?", [
    "Idempotência: o estoque guarda os evento_id já processados e ignora o repetido.",
    "Desligar a fila.",
    "Mandar cada evento só por e-mail.",
    "Apagar o evento depois de lido, sem registro."
  ], 0, "Com o e-502 já registrado, a segunda cópia é ignorada e o estoque fica em 2.");
  tf("t8", 5, 2, "No payload de PedidoCriado, o evento_id é um campo opcional.", false,
    "É ele que permite reconhecer o repetido. Sem evento_id (e-501, e-502…) a idempotência não tem como funcionar.");
  choice("t8", 6, 2, "Depois do corte, o Estoque precisa do preço do gato. O que ele faz?", [
    "Lê a tabela produtos do catálogo.",
    "Guarda uma cópia do preço, sem avisar ninguém.",
    "Pergunta ao catálogo pela API ou escuta um evento. Não lê a tabela do outro.",
    "Pede ao DBA a senha do outro banco."
  ], 2, "Ler a tabela do vizinho cria acoplamento escondido. API e evento são os dois caminhos combinados.");

  window.QUIZ = out;
})();
