/* Banco de perguntas do quiz de Event Sourcing.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução ao Event Sourcing" },
    t2: { topic: "aula-2-persistencia-tradicional-vs-event-sourcing", name: "Persistência tradicional × Event Sourcing" },
    t3: { topic: "aula-3-agregados", name: "Agregados" },
    t4: { topic: "aula-4-event-store", name: "Event Store" },
    t5: { topic: "aula-5-event-bus-e-publishers", name: "Event Bus e publishers" },
    t6: { topic: "aula-6-projections-e-read-models", name: "Projeções e modelos de leitura" },
    t7: { topic: "aula-7-rehidratacao", name: "Rehidratação" },
    t8: { topic: "aula-8-snapshotting", name: "Snapshotting" },
    t9: { topic: "aula-9-ordenacao-versionamento-e-last-write-wins", name: "Ordem, versão e last-write-wins" },
    t10: { topic: "aula-10-idempotencia", name: "Idempotência" },
    t11: { topic: "aula-11-consideracoes-finais", name: "Considerações finais" }
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

  /* ---------- 1. Introdução ---------- */
  choice("t1", 1, 1, "O que o Event Sourcing guarda como fonte da verdade?", [
    "O último estado de cada linha, com um backup por dia.",
    "Cada mudança como um fato imutável; o estado é derivado dos eventos.",
    "Só os eventos que deram erro.",
    "Uma cópia do banco em outro servidor."
  ], 1, "O estado atual é consequência: dobrando os eventos em ordem se chega a ele. A fonte da verdade é a lista de eventos.");
  choice("t1", 2, 2, "Depois de três UPDATE no pedido 1047 (pago, enviado, entregue), o que a tabela pedidos guarda?", [
    "Os quatro estados, cada um com a sua hora.",
    "Só o último: entregue. Os outros foram sobrescritos.",
    "O primeiro e o último estados.",
    "Nada, porque UPDATE não grava."
  ], 1, "É a perda que o módulo conserta: o caminho ficava nos eventos e-501 a e-505, que o Kafka apaga em 7 dias.");
  tf("t1", 3, 2, "O e-503 (EstoqueReservado) faz parte do stream pedido-1047.", false, "É fato do estoque e mora no stream estoque-GATO-042, versão 2. O pedido 1047 tem 4 eventos no seu stream: e-501, e-502, e-504 e e-505.");
  choice("t1", 4, 2, "Event Sourcing, CQRS, event notification e event-carried state transfer são, segundo Fowler:", [
    "O mesmo padrão com quatro nomes.",
    "Quatro padrões independentes, que costumam aparecer juntos.",
    "Quatro versões do padrão Saga.",
    "Variações do CQRS."
  ], 1, "Event Sourcing não exige CQRS nem um barramento, e o contrário também vale. O artigo-base mistura os dois e a aula corrige.");
  choice("t1", 5, 3, "Uma tela de cadastro de endereços muda duas vezes por ano e ninguém audita o histórico. Event Sourcing ali é:", [
    "Obrigatório, porque todo sistema moderno usa.",
    "Uma boa ideia: eventos são sempre mais baratos.",
    "Modismo: paga eventos, versões e projeções sem ninguém usar o histórico.",
    "Necessário só se houver Kafka."
  ], 2, "O ganho do padrão é responder 'como chegou aqui?' e reconstruir o que se estragou. Sem essa pergunta, só sobra a complexidade.");

  /* ---------- 2. Persistência tradicional × Event Sourcing ---------- */
  choice("t2", 1, 1, "Qual é a diferença central entre os dois modelos de persistência?", [
    "O tradicional só acrescenta; o Event Sourcing substitui.",
    "O tradicional substitui o estado a cada operação; o Event Sourcing só acrescenta eventos.",
    "O tradicional usa SQL e o Event Sourcing usa NoSQL.",
    "Não há diferença, só de nome."
  ], 1, "INSERT, UPDATE e DELETE substituem; no Event Sourcing toda operação é uma inserção, e o estado atual vem de somar os eventos.");
  choice("t2", 2, 2, "Qual pergunta só os eventos respondem sobre o 1047?", [
    "Quais pedidos estão enviado agora?",
    "Qual era o status do 1047 às 14:15? (pago, versão 2)",
    "Qual é o total de pedidos?",
    "Qual é o índice da tabela?"
  ], 1, "A tabela sobrescreveu esse valor. 'Quais pedidos estão enviado agora?' é a que a tabela responde melhor, com índice por status.");
  choice("t2", 3, 3, "4 eventos por pedido × 50 milhões de pedidos × ~263 B por evento dão cerca de:", [
    "5,26 GB, e a tabela pedidos pode ser apagada.",
    "52,6 GB, que se somam aos 140 GB da tabela pedidos, que vira modelo de leitura.",
    "526 GB.",
    "140 GB, o mesmo da tabela."
  ], 1, "É uma estimativa com payload pequeno (263 B medidos por evento). O Event Sourcing não economiza espaço: a tabela continua como projeção.");
  choice("t2", 4, 3, "Um PedidoPago foi gravado com o valor errado. Como corrigir?", [
    "UPDATE no evento.",
    "Gravar um evento de correção (PagamentoCorrigido), e as projeções precisam tratá-lo.",
    "Apagar o evento e gravar outro com a mesma versão.",
    "Reiniciar o stream."
  ], 1, "O evento é imutável: aconteceu, e a história registra assim. O conserto é outro evento, e quem lê vê o erro e a correção.");

  /* ---------- 3. Agregados ---------- */
  choice("t3", 1, 1, "O que o agregado faz?", [
    "Só guarda os eventos num arquivo.",
    "Decide, valida e ordena os eventos de um assunto: um stream, uma fronteira de consistência.",
    "Publica os eventos no Kafka.",
    "Monta o modelo de leitura."
  ], 1, "Quem guarda é o Store, quem publica é o publisher e quem monta o modelo é a projeção. O agregado protege a verdade do log.");
  tf("t3", 2, 1, "Um comando recusado pela regra do agregado deixa um evento no stream.", false, "Comando é imperativo e pode ser recusado; só o aceito vira fato. O Enviar com o pedido em criado não grava nada.");
  choice("t3", 3, 2, "Qual destes é o comando e qual é o evento?", [
    "PedidoEnviado é comando; Enviar é evento.",
    "Enviar é comando (imperativo, pode falhar); PedidoEnviado é evento (passado, sempre verdadeiro).",
    "Os dois são eventos.",
    "Os dois são comandos."
  ], 1, "O comando diz o que se quer; o evento diz o que aconteceu. A regra do agregado fica entre os dois.");
  choice("t3", 4, 3, "Um stream só com todo o estoque da loja receberia 30 comandos/s na Black Friday. Qual o conserto?", [
    "Mais memória no servidor do Kafka.",
    "Um stream por SKU: o gato e a caneca deixam de disputar a mesma versão.",
    "Apagar os eventos antigos.",
    "Trocar o PostgreSQL."
  ], 1, "O agregado grande demais vira fila de conflitos de versão. O agregado deve ser pequeno: um pedido, um SKU.");
  choice("t3", 5, 2, "Onde mora o EstoqueReservado (e-503) do pedido 1047?", [
    "No stream pedido-1047, versão 3.",
    "No stream estoque-GATO-042, versão 2 (a versão 1 é o saldo inicial, +3).",
    "No stream estoque-CANECA-007.",
    "Em lugar nenhum: é só uma mensagem."
  ], 1, "É um fato do estoque (saldo 3 → 2). O evento_id e-503 é global; a versão 2 é do stream do estoque.");

  /* ---------- 4. Event Store ---------- */
  choice("t4", 1, 1, "O que o Event Store garante?", [
    "Ordem global entre todos os streams.",
    "A ordem dentro do stream e que dois eventos não ocupam a mesma versão.",
    "Que nenhum consumidor receba duplicatas.",
    "Que os eventos expiram em 7 dias."
  ], 1, "Ordem global não é exigida nem barata: o id bigserial é só ordem de inserção. A garantia é por stream, pela versão.");
  choice("t4", 2, 2, "Para que serve a versão esperada no append_evento?", [
    "Para ordenar o SELECT.",
    "Para a concorrência otimista: 'li até a 2, grave a 3'; o Store recusa se o stream já passou da 2.",
    "Para comprimir o evento.",
    "Para criptografar os dados."
  ], 1, "Medido: com o stream em v4, append_evento(…, 2) devolve 'Concurrency conflict: expected version 2, but current is 4'.");
  choice("t4", 3, 3, "Dois Reservar chegam ao mesmo tempo ao estoque-GATO-042, ambos com versão esperada 2. Quem barra o segundo?", [
    "A conferência de MAX(versao) da função, que lê 3.",
    "O UNIQUE (stream_id, versao): a sessão B espera em Lock/transactionid e falha em eventos_stream_versao.",
    "O Kafka.",
    "Nada: os dois entram como versão 3."
  ], 1, "As duas leem 2 e passam na conferência. A B espera a A confirmar e então a restrição recusa. O retry (reler e decidir de novo) é do chamador.");
  tf("t4", 4, 3, "A verificação MAX(versao) da função append_evento, sozinha, impede a corrida entre duas sessões.", false, "As duas sessões leem 2 antes de qualquer confirmação. Quem impede é o UNIQUE (stream_id, versao); sem ele o stream teria duas versões 3.");
  choice("t4", 5, 2, "O mesmo e-502 chega ao Store de novo, com a versão esperada certa. O que acontece?", [
    "É gravado como versão 5.",
    "Falha em eventos_evento_id_key: o UNIQUE (evento_id) barra o duplicado.",
    "É ignorado em silêncio.",
    "Apaga o e-502 original."
  ], 1, "Medido: 'duplicate key value violates unique constraint \"eventos_evento_id_key\"', detalhe 'Key (evento_id)=(e-502) already exists'.");
  order("t4", 6, 3, "Coloque na ordem a corrida real entre as sessões A e B (PostgreSQL 14):", [
    "A e B leem MAX(versao) = 2 e passam na conferência.",
    "A insere a versão 3 e dorme 2 s; B espera em Lock / transactionid.",
    "A confirma; B falha em eventos_stream_versao.",
    "B relê o stream (agora na v3) e decide de novo."
  ], "A conferência não impede a corrida; a restrição UNIQUE impede, e o retry é do chamador: reler, recalcular, regravar com a versão esperada nova.");

  /* ---------- 5. Event Bus e publishers ---------- */
  choice("t5", 1, 1, "Qual é a diferença entre Event Store e Event Bus?", [
    "São o mesmo componente.",
    "O Store é a fonte da verdade; o bus leva as consequências dos eventos a outros serviços.",
    "O bus é a fonte da verdade e o Store é uma cópia.",
    "O Store só existe quando há Kafka."
  ], 1, "O bus não é obrigatório: Event Sourcing existe sem ele. O artigo diz isso numa frase e mistura nas outras.");
  choice("t5", 2, 2, "O laboratório do autor publica no Kafka depois do commit. Qual é a janela de risco?", [
    "Nenhuma: o commit garante a publicação.",
    "Se o processo cai entre o commit e a publicação, o evento existe no Store e nunca chega aos modelos de leitura.",
    "O evento é publicado duas vezes sempre.",
    "O Kafka apaga o evento no commit."
  ], 1, "É a escrita dupla do módulo 18. O rehydratate do laboratório recupera republicando, mas à mão.");
  choice("t5", 3, 3, "O processo caiu depois do commit do PedidoEnviado e antes do publish. Qual é a defesa?", [
    "Reiniciar o Kafka.",
    "O publisher ler o próprio Store, pela posição do último evento publicado, e publicar o que ficou para trás.",
    "Apagar o evento.",
    "Pedir ao cliente que repita a compra."
  ], 1, "Sai pelo menos uma vez, e o consumidor idempotente absorve a duplicata. Outbox e CDC (módulo 18) tornam a gravação e a saída atômicas.");
  choice("t5", 4, 2, "Por que o Kafka serve ao bus e é fraco como Event Store de agregados?", [
    "Porque é lento demais.",
    "Não anexa só se a versão bater, não lê um agregado sem varrer a partição, e a retenção (7 dias) apaga o que o Store não pode apagar.",
    "Porque não aceita JSON.",
    "Porque só guarda números."
  ], 1, "O Store precisa de anexar-se-a-versão e ler um stream inteiro. O Kafka entrega ordem por chave e é ótimo para levar os eventos.");

  /* ---------- 6. Projeções e modelos de leitura ---------- */
  choice("t6", 1, 1, "Por que a projeção deve ser uma função pura dos eventos?", [
    "Para rodar mais rápido.",
    "Mesma sequência, mesmo resultado, sem now() nem chamada externa: o modelo é descartável e se reconstrói.",
    "Para não precisar de banco.",
    "Para evitar o Kafka."
  ], 1, "A projeção é determinística em relação à sequência de eventos (o artigo diz 'ao estado atual', frase que a aula corrige).");
  choice("t6", 2, 2, "O que a projeção transacional tem de bom e de ruim?", [
    "Bom: nenhum atraso entre escrita e leitura. Ruim: pesa o Store e vira gargalo com volume.",
    "Bom: desacopla tudo. Ruim: consistência eventual.",
    "Bom: grava mais rápido. Ruim: perde eventos.",
    "Bom: dispensa o Store. Ruim: exige o Kafka."
  ], 0, "A projeção vai na mesma transação do evento. Os outros dois jeitos (semissíncrono e assíncrono) trocam esse custo por atraso.");
  choice("t6", 3, 3, "Quanto leva reconstruir um modelo a partir de 200 milhões de eventos a 20.000 por segundo?", [
    "Cerca de 3 minutos.",
    "10.000 s, ou 2 h 47 min.",
    "Cerca de 20 horas.",
    "Instantâneo, porque o Store é rápido."
  ], 1, "200.000.000 ÷ 20.000 = 10.000 s. O Store lê ~555 mil/s: o gargalo é escrever no modelo, não ler.");
  tf("t6", 4, 3, "Sem o Event Store, só com o tópico do Kafka de 7 dias, ainda dá para reconstruir um modelo estragado.", false, "A retenção apagou os eventos antigos. Por isso o Store guarda tudo: sem ele não há de onde reconstruir.");

  /* ---------- 7. Rehidratação ---------- */
  choice("t7", 1, 1, "O que é rehidratar?", [
    "Copiar o Store para outro servidor.",
    "Reconstruir o estado de um agregado dobrando os seus eventos em ordem.",
    "Apagar eventos antigos.",
    "Reiniciar o consumidor."
  ], 1, "Acontece a cada comando (carregar o agregado antes de decidir) e a cada reprocessamento.");
  choice("t7", 2, 2, "O que a rehidratação do pedido-1047 devolve?", [
    "{status: criado, versao: 1}.",
    "{pedido_id: 1047, status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}.",
    "{status: pago, versao: 2}.",
    "Vazio, porque a tabela foi sobrescrita."
  ], 1, "Parando na versão 2 (14:02:11) o estado seria pago, que é também o das 14:15, porque o e-504 só acontece às 14:30.");
  choice("t7", 3, 3, "Quanto custa rehidratar o estoque-CANECA-007, com 1.000.000 de eventos, sem snapshot?", [
    "Cerca de 18 ms.",
    "Cerca de 1.800 ms (1.935 · 1.801 · 1.770 ms), ~555 mil eventos por segundo.",
    "Cerca de 18 s.",
    "Zero: é um cache."
  ], 1, "O custo é linear no tamanho do stream. Por isso o agregado deve ser pequeno e o stream longo pede snapshot.");
  choice("t7", 4, 3, "O PedidoCriado antigo tinha frete como número e o código novo espera frete_centavos. Qual é a solução?", [
    "Editar os eventos antigos.",
    "Upcasting: converter o evento antigo no formato novo na leitura, antes de dobrar.",
    "Apagar o stream.",
    "Ignorar o campo."
  ], 1, "O evento é imutável. O Axon descreve o upcasting; a versão do esquema vai no evento.");
  choice("t7", 5, 3, "A recuperação republica os eventos do 1047 ao estoque, que aplica −1 a cada PedidoPago. O que acontece?", [
    "Nada: o estoque ignora o que já viu.",
    "O saldo desce de novo, como se o pedido tivesse sido feito outra vez: o consumidor precisa ser idempotente.",
    "O Store recusa a republicação.",
    "O Kafka junta as duplicatas."
  ], 1, "A rehidratação só é segura se todo consumidor aguentar o mesmo evento duas vezes (aula 10).");

  /* ---------- 8. Snapshotting ---------- */
  choice("t8", 1, 2, "Com um snapshot na versão 999.000, a rehidratação do milhão levou ~13 ms. Contra ~1.800 ms sem snapshot, é:", [
    "Cerca de 14× mais rápido.",
    "Cerca de 140× mais rápido, lendo 1.000 eventos em vez de 1.000.000.",
    "Igual: o snapshot não ajuda.",
    "Mais lento por causa da foto."
  ], 1, "Medido: 13,1 · 19,6 · 12,1 ms (inclui subir o psql duas vezes). O saldo dos dois caminhos é 10.000.");
  tf("t8", 2, 2, "Apagar todos os snapshots perde dados.", false, "O snapshot é derivado e descartável: só deixa a leitura mais lenta. O Store continua sendo a fonte da verdade.");
  choice("t8", 3, 3, "O que o laboratório do autor faz com a tabela snapshots?", [
    "Gera um snapshot a cada 1.000 eventos.",
    "Cria a tabela e não a usa: nenhum arquivo .go a menciona, e a rehidratação lê todos os eventos.",
    "Lê o snapshot e ignora os eventos.",
    "Apaga a tabela ao subir."
  ], 1, "Foi lido no código (62 arquivos .go e .sql conferidos), não executado.");
  choice("t8", 4, 3, "Um snapshot gerado com um bug grava o saldo errado. O que acontece?", [
    "O erro desaparece na próxima rehidratação.",
    "Todo comando começa da foto errada e o erro se propaga para sempre, até alguém refazer o snapshot.",
    "O Store corrige sozinho.",
    "Só afeta o primeiro comando."
  ], 1, "A defesa é conferir a foto por amostragem contra a rehidratação completa e guardar a versão do código que a gerou.");

  /* ---------- 9. Ordem, versão e last-write-wins ---------- */
  tf("t9", 1, 1, "O Event Store garante que quem consome pelo bus recebe os eventos na ordem das versões.", false, "O Store garante a ordem dentro do stream. Partições, retentativas e consumidores em paralelo embaralham a chegada.");
  choice("t9", 2, 2, "Chegam e-501 (v1), e-504 (v3), e-505 (v4), e-502 (v2) e o e-502 de novo. Onde termina o 'último a chegar vence'?", [
    "Em entregue, versão 4.",
    "Em pago, versão 2: errado, o pedido já foi entregue.",
    "Em criado, versão 1.",
    "Em enviado, versão 3."
  ], 1, "O e-502 atrasado leva o modelo de volta. Se o e-505 chegasse por último, a regra acertaria por sorte.");
  choice("t9", 3, 2, "E com a regra 'só aplica se a versão for maior'?", [
    "Termina em pago, versão 2.",
    "Aplica e-501, e-504 e e-505, descarta os dois e-502 e termina em entregue, versão 4.",
    "Descarta todos.",
    "Aplica todos na ordem de chegada."
  ], 1, "Em SQL: UPDATE … WHERE pedido_id = … AND versao < $v. No ScyllaDB do laboratório: UPDATE … IF version < ?.");
  choice("t9", 4, 3, "Por que versão e não timestamp para decidir quem vence?", [
    "Porque o timestamp é maior que a versão.",
    "O timestamp depende de relógio (o desvio de 120 ms do módulo 17); a versão é atribuída pelo Store, sem relógio.",
    "Porque o timestamp não existe no Store.",
    "Porque a versão é sempre par."
  ], 1, "O Store nunca faz LWW: só acrescenta. A regra 'o maior vence' vale no consumidor, com a versão.");
  choice("t9", 5, 3, "A regra de descartar versão menor falha em qual tipo de modelo?", [
    "Num modelo de último estado, como o status.",
    "Num modelo que soma, como o saldo do estoque: descartar o evento v2 atrasado perde o desconto.",
    "Em nenhum.",
    "Só em bancos NoSQL."
  ], 1, "Aí a defesa é a idempotência por evento_id (aula 10) e operações comutativas, a ideia dos CRDTs do módulo 17.");
  choice("t9", 6, 3, "O consumidor recebeu a v1 e a v3 do pedido; a v2 nunca chegou. O que a regra 'só versão maior' faz, e o que o consumidor deveria fazer?", [
    "Aplica a v3 sem problema; não há nada a fazer.",
    "Aplica a v3 e deixa um buraco; o certo é detectar versao ≠ última + 1 e esperar ou pedir a v2 ao Store.",
    "Descarta a v1.",
    "Apaga o pedido."
  ], 1, "É a terceira regra do widget: versão maior e espera pela que falta, com tempo-limite.");

  /* ---------- 10. Idempotência ---------- */
  choice("t10", 1, 2, "O PedidoPago e-502 chega duas vezes a um consumidor que soma e não tem proteção. O saldo do gato vai:", [
    "3 → 2.",
    "3 → 2 → 1.",
    "3 → 4.",
    "3 → 0."
  ], 1, "É o caso do módulo 6. Com a tabela de eventos processados, o saldo fica em 2.");
  choice("t10", 2, 3, "Onde o evento_id processado deve ser gravado, num consumidor que soma?", [
    "Num arquivo de log separado.",
    "Numa tabela eventos_processados, na mesma transação que aplica o efeito: ou entram os dois ou nenhum.",
    "Só na memória do consumidor.",
    "No tópico do Kafka."
  ], 1, "Se o consumidor caísse entre o efeito e o registro, a retentativa aplicaria de novo.");
  choice("t10", 3, 3, "Como o extrato do laboratório (MongoDB) fica idempotente?", [
    "Com uma tabela de processados.",
    "Usa o movimentacao_id como _id; a duplicata recusada com o erro 11000 é ignorada.",
    "Com LWT, como o saldo.",
    "Não fica: duplica o extrato."
  ], 1, "É o jeito da chave natural: a chave é do fato, não do evento do bus. Lido no código, não executado.");
  choice("t10", 4, 3, "Por que reprocessar o período todo exige que todos os consumidores sejam idempotentes?", [
    "Porque o replay é mais lento.",
    "Porque o replay manda os mesmos eventos de novo a todos; basta um que não proteja para virar duplicidade em massa.",
    "Porque o Store apaga o original.",
    "Porque o Kafka exige."
  ], 1, "É a rehidratação como recuperação (aula 7) encontrando a idempotência (aula 10).");
  choice("t10", 5, 2, "A tabela de eventos processados cresce para sempre. Qual a saída?", [
    "Ignorar: o disco é barato.",
    "Uma janela (7 dias, como a retenção do tópico); fora dela, a versão decide.",
    "Trocar por uma tabela maior.",
    "Apagar a tabela a cada evento."
  ], 1, "A 30 pedidos/s e 4 eventos por pedido, no pior caso são ~72,6 milhões de linhas em 7 dias, e o índice pesa.");

  /* ---------- 11. Considerações finais ---------- */
  choice("t11", 1, 2, "Event Sourcing é obrigatório para usar CQRS ou Saga?", [
    "Sim, os três andam juntos sempre.",
    "Não: são padrões independentes que combinam (saga com o log como fonte; CQRS com o Store no lado do comando).",
    "Só para Saga.",
    "Só para CQRS."
  ], 1, "Fowler lista os padrões como independentes. Cada um responde a uma pergunta diferente.");
  choice("t11", 2, 3, "Em qual destes domínios o Event Sourcing mais se paga?", [
    "Um cadastro simples (CRUD) que muda pouco.",
    "Pagamento, saldo ou pedido com auditoria: onde o histórico é o produto.",
    "Uma lista de preferências de tema.",
    "Qualquer tela de formulário."
  ], 1, "O padrão cobra complexidade (eventos versionados, projeções, idempotência). Só se paga onde o histórico tem uso.");

  window.QUIZ = out;
})();
