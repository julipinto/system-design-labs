/* Banco de perguntas do quiz de Saga Pattern.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-motivacoes", name: "Introdução e motivações" },
    t2: { topic: "aula-2-o-problema-das-transacoes-longas-e-distribuidas", name: "Transações longas e distribuídas" },
    t3: { topic: "aula-3-a-proposta-arquitetural-do-saga", name: "A proposta arquitetural do Saga" },
    t4: { topic: "aula-4-saga-coreografado", name: "Saga coreografado" },
    t5: { topic: "aula-5-saga-orquestrado", name: "Saga orquestrado" },
    t6: { topic: "aula-6-state-machines", name: "State machines" },
    t7: { topic: "aula-7-fluxos-de-compensacao", name: "Fluxos de compensação" },
    t8: { topic: "aula-8-logs-de-saga", name: "Logs de saga" },
    t9: { topic: "aula-9-dual-write", name: "Dual write" },
    t10: { topic: "aula-10-exemplo-de-sistema-de-pedidos-distribuido", name: "Exemplo de sistema de pedidos distribuído" }
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

  /* ---------- Introdução e motivações ---------- */
  choice("t1", 1, 1, "O que a Saga garante?", ["Que uma operação que atravessa serviços termine inteira ou seja desfeita, por passos locais e compensações.", "Que cada passo seja mais rápido que uma transação ACID.", "Que todos os serviços usem o mesmo banco.", "Que nenhum passo jamais falhe."], 0, "A Saga troca a atomicidade de uma transação por passos locais e compensações. O artigo avisa: garante consistência e controle, não desempenho.");
  choice("t1", 2, 2, "Quanto tempo o pedido 1057 levou do pedido ao CANCELADO, e quanto disso foi espera do Davi?", ["41,2 s, dos quais 44,95 s de espera.", "3,7 s, todos de espera.", "44,95 s, dos quais 3,7 s de espera.", "44,95 s, dos quais 41,2 s de espera."], 3, "20:15:00.000 → 20:15:44.950 são 44,95 s; o Davi pagou às 20:15:41.200 (41,2 s). A compensação inteira levou 3,7 s.");
  tf("t1", 3, 2, "Sem saga, o 1057 fica pago e sem estoque, e só a conciliação das 23:00 acharia o caso, 2 h 44 min depois do pagamento.", true, "Sem dono do fluxo, ninguém desfaz nada. A conciliação das 23:00 (módulo 6) é o único que olharia, 2 h 44 min depois das 20:15:41.");
  choice("t1", 4, 1, "De onde vem a ideia da Saga?", ["Do Google, em 2015, para microsserviços.", "Do artigo SAGAS, de Garcia-Molina e Salem (SIGMOD, 1987), para transações longas dentro de um banco.", "De um RFC da IETF sobre HTTP.", "Do paper do Dynamo, sobre replicação."], 1, "O artigo de 1987 tratava de transações longas dentro de um banco. Microsserviços não existiam; o padrão voltou quando cada serviço ganhou o seu banco.");
  choice("t1", 5, 3, "O pagamento do 1057 passou e o estoque falhou. Por que um ROLLBACK não desfaz isso?", ["Cada serviço fez o COMMIT no seu banco, e nenhum banco enxerga a transação do outro.", "Porque o PostgreSQL não tem ROLLBACK.", "Porque o PSP bloqueia o rollback.", "Porque o rollback só funciona com cartão."], 0, "pedidos, pagamentos, estoque e entregas têm bancos próprios. O ROLLBACK só alcança a transação de um banco; por isso alguém precisa compensar.");

  /* ---------- Transações longas e distribuídas ---------- */
  choice("t2", 1, 2, "A 30 pedidos por segundo e uma espera de 41,2 s pelo Pix, quantas transações ficariam abertas se o estoque segurasse a trava?", ["30", "1.236", "412", "12.360"], 1, "30 × 41,2 = 1.236 transações abertas ao mesmo tempo, cada uma com conexão e trava.");
  choice("t2", 2, 1, "Como funciona o two-phase commit?", ["Um coordenador pede 'prepara' a todos e, quando todos dizem 'pronto', manda 'efetiva'.", "Cada serviço faz o commit e depois compensa.", "Os bancos replicam o dado em duas cópias.", "A mensagem é duplicada para dois tópicos."], 0, "São duas fases: preparar e efetivar (Fowler). Entre elas as travas ficam abertas.");
  choice("t2", 3, 2, "Por que o 2PC não serve com o PSP do Pix?", ["O PSP é lento demais.", "O PSP não aceita HTTPS.", "O 2PC só funciona com Kafka.", "Não existe 'prepara o Pix': a cobrança já saiu, e o PSP só conhece cobrar e estornar."], 3, "O 2PC exige que cada participante saiba preparar. O PSP externo e o Kafka não participam, e a cobrança c-7732 já saiu quando o Davi aprovou.");
  tf("t2", 4, 2, "O timeout do PSP é uma falha de negócio e pede compensação.", false, "Timeout e 503 são falhas técnicas: pedem retry (módulo 21). Só a falha de negócio, como EstoqueIndisponivel, pede compensação.");
  choice("t2", 5, 3, "O estoque respondeu EstoqueIndisponivel e o PSP respondeu 503 ao estorno. Qual é qual?", ["Os dois são falhas de negócio.", "EstoqueIndisponivel é falha de negócio (compensa); o 503 é técnica (repete).", "Os dois são falhas técnicas.", "EstoqueIndisponivel é técnica e o 503 é de negócio."], 1, "A resposta 'não tem estoque' é válida e pede compensação. O 503 é o serviço que não respondeu e pede repetição com backoff.");

  /* ---------- A proposta arquitetural do Saga ---------- */
  choice("t3", 1, 1, "O que é uma compensação na Saga?", ["Um ROLLBACK que o banco faz sozinho.", "Uma cópia do banco em outra região.", "Uma transação nova que desfaz o efeito de negócio de um passo já feito.", "O ato de repetir o mesmo passo."], 2, "O estorno é um lançamento a mais, não um apagamento. A compensação pode até não devolver tudo (a taxa do PSP).");
  tf("t3", 2, 2, "Reservar antes de cobrar segue a regra de que o passo difícil de desfazer vai por último.", true, "Liberar uma reserva é barato; estornar um pagamento custa dinheiro, tempo e taxa. Por isso o laboratório do autor reserva antes de cobrar.");
  choice("t3", 3, 2, "Qual é o passo pivô da saga da loja?", ["O caminhão que sai: o ponto sem volta.", "Cobrar o Pix.", "Reservar o estoque.", "Criar o pedido."], 0, "Passos compensáveis (cobrar, reservar) têm desfazer. O pivô é o ponto sem volta, e depois dele só há passos repetíveis.");
  choice("t3", 4, 3, "O 1057 está em RESERVANDO e a saga vai falhar. O que outro cliente vê no estoque?", ["Nada: a Saga isola as sagas entre si.", "O pedido do Davi cancelado.", "Um erro 500.", "'Esgotado' por alguns segundos, porque a Saga não tem isolamento."], 3, "A Saga é ACD sem o I: os estados do meio ficam visíveis. A reserva do 1057 aparece como 'esgotado' até ser liberada.");
  choice("t3", 5, 2, "Qual destas é uma contramedida à falta de isolamento?", ["Trocar o Kafka por RabbitMQ.", "Aumentar o prazo do Pix.", "Bloqueio semântico: um estado como RESERVA_PENDENTE fica visível.", "Usar o two-phase commit."], 2, "Também servem atualizações comutativas e reler o valor antes de mudar (microservices.io).");

  /* ---------- Saga coreografado ---------- */
  choice("t4", 1, 1, "Quantos eventos a coreografia gasta no sucesso e na falha do estoque do 1057?", ["6 e 8", "3 e 4", "5 e 4", "4 e 5"], 3, "Sucesso: PedidoCriado, PedidoPago, EstoqueReservado, EntregaAgendada. Falha: PedidoCriado, PedidoPago, EstoqueIndisponivel, PagamentoEstornado, PedidoCancelado.");
  choice("t4", 2, 2, "Na coreografia da loja, quem escuta o EstoqueIndisponivel para estornar?", ["O serviço pedidos.", "O serviço entregas.", "O serviço pagamentos.", "Um orquestrador."], 2, "O pagamentos passa a escutar o estoque, e publica PagamentoEstornado, que o pedidos escuta para cancelar.");
  tf("t4", 3, 2, "Na coreografia de verdade, o serviço que termina chama diretamente o próximo serviço.", false, "Ele publica o fato e não sabe quem escuta. Chamar o próximo direto é uma cadeia ponto a ponto, não coreografia (microservices.io).");
  choice("t4", 4, 3, "O EstoqueIndisponivel do 1057 se perde na coreografia. O que acontece?", ["O 1057 fica pago para sempre: ninguém compensa, e não há dono da saga para perceber.", "A saga estorna sozinha depois de um tempo.", "O estoque repete a mensagem sozinho.", "O Kafka estorna o pagamento."], 0, "Cada serviço fez a sua parte, e nenhum é responsável pelo conjunto. Só uma vigia (aula 6) acharia a saga parada.");
  choice("t4", 5, 2, "Qual é a dependência circular da coreografia da loja?", ["O pedidos chama o próprio pedidos.", "O Kafka escuta o PSP.", "O estoque escuta o Davi.", "O pagamentos passa a escutar o estoque, que já escutava o pagamentos."], 3, "É um custo da coreografia: o fluxo está espalhado, e serviços anteriores precisam escutar as falhas dos seguintes.");

  /* ---------- Saga orquestrado ---------- */
  choice("t5", 1, 1, "Quantas mensagens a orquestração gasta na falha do estoque do 1057, fora a de início?", ["8", "6", "5", "4"], 0, "Cobrar e resposta, reservar e resposta de falha, estornar e resposta, cancelar e resposta: 4 comandos e 4 respostas. No sucesso são 6.");
  choice("t5", 2, 2, "O que o orquestrador faz que a coreografia não faz?", ["Executa uma transação ACID entre os bancos.", "Substitui o banco de cada serviço.", "Cobra o Pix no lugar do PSP.", "Guarda o mapa da saga e manda compensar."], 3, "O orquestrador manda comandos, espera respostas e decide quando compensar. O fluxo fica num lugar só.");
  tf("t5", 3, 2, "No laboratório do autor, os comandos vão para <serviço>-commands e as respostas voltam em <serviço>-reply.", true, "Por exemplo, pagamentos-commands e pagamentos-reply. O orquestrador escreve nos primeiros e lê dos segundos.");
  choice("t5", 4, 3, "O orquestrador cai com 200 sagas no ar e o estado só estava na memória. O que acontece?", ["Elas continuam sozinhas, pelos serviços.", "As sagas se perdem: os serviços fizeram os passos e ninguém sabe em qual passo cada pedido está.", "O Kafka as retoma do zero.", "Os serviços compensam todas automaticamente."], 1, "Por isso o estado mora em banco: ao voltar, o orquestrador lê a tabela e continua do último passo.");
  choice("t5", 5, 2, "Qual é o custo da orquestração?", ["Um componente a mais que todo pedido atravessa, e a tentação de pôr regra de negócio nele.", "Nenhum: é sempre mais barata.", "Os serviços passam a se conhecer.", "Não há tópicos de resposta."], 0, "Gasta também mais mensagens (6 e 8 contra 4 e 5). Em troca, o fluxo está num lugar só.");

  /* ---------- State machines ---------- */
  order("t6", 1, 2, "Ponha em ordem os estados da saga do 1057, que falhou no estoque.", ["NOVO", "COBRANDO", "PAGO", "RESERVANDO", "COMPENSANDO", "ESTORNANDO", "CANCELADO"], "São as 7 transições do log: 20:15:00.000 NOVO, .050 COBRANDO, 41.200 PAGO, 41.220 RESERVANDO, 41.260 COMPENSANDO, 41.300 ESTORNANDO, 44.950 CANCELADO.");
  choice("t6", 2, 2, "transitar('s-1057','COBRANDO','PAGO',…) devolveu f. O que isso quer dizer?", ["A saga já não estava em COBRANDO: nada mudou e nada foi para o log (era a duplicata do PedidoPago).", "O banco caiu durante a transição.", "A saga terminou com sucesso.", "O pagamento falhou."], 0, "O UPDATE … WHERE estado = de afetou 0 linhas. A duplicata do e-1902 às 20:15:41.210 foi ignorada sem código especial.");
  choice("t6", 3, 1, "Qual estado final da saga da loja chama gente?", ["CANCELADO", "FINALIZADO", "COMPENSANDO", "INTERVENCAO"], 3, "FINALIZADO e CANCELADO terminam sozinhos. INTERVENCAO é o único que chama uma pessoa: a compensação não passou.");
  choice("t6", 4, 3, "O PSP nunca avisa o Pix e a saga fica parada em COBRANDO. Qual é a saída?", ["Esperar o Davi pagar, por mais tempo que seja.", "Trocar a orquestração pela coreografia.", "Um prazo por estado e uma vigia que expira a saga e dispara a compensação.", "Apagar a linha da saga do banco."], 2, "A vigia procura sagas fora de FINALIZADO e CANCELADO paradas além do prazo. Rodada em 20/10/2026, achou a s-teste parada em COBRANDO desde 19:20.");
  tf("t6", 5, 2, "O orquestrador do laboratório do autor confere o estado atual antes de avançar numa resposta de sucesso.", false, "Lido no código: o processReply avança pelo tópico da resposta e só usa o estado atual quando a resposta é de falha.");

  /* ---------- Fluxos de compensação ---------- */
  order("t7", 1, 3, "No laboratório do autor (estoque, pagamento, entrega), a entrega falha. Ponha as compensações na ordem em que a saga as dispara.", ["CANCEL_PAYMENT (estornar)", "RELEASE_STOCK (liberar o estoque)", "CANCEL_ORDER (cancelar o pedido)"], "É a ordem inversa do que foi feito: o pagamento foi o último passo concluído, depois a reserva, e por fim o pedido.");
  choice("t7", 2, 2, "O que faz o estorno do 1057 ser idempotente?", ["O tópico pagamentos-reply.", "A chave estorno-c-7732: repetir o comando estorna uma vez só.", "O fato de o PSP ser externo.", "O ROLLBACK do banco."], 1, "Sem a chave, repetir o estorno por segurança devolveria R$ 116,00 ao Davi em vez de R$ 58,00.");
  choice("t7", 3, 2, "O estorno falha com 503 e a saga repete com backoff de 1, 2, 4, 8 e 16 s. Quanto isso soma até chamar gente?", ["31 s", "16 s", "32 s", "15 s"], 0, "1 + 2 + 4 + 8 + 16 = 31 s, em 5 repetições. Depois disso a saga vai para INTERVENCAO.");
  choice("t7", 4, 3, "No laboratório (lido), depois de a saga virar FAILED, o CANCEL_ORDER responde com sucesso em pedidos-reply. O que o orquestrador faz?", ["Nada, porque FAILED é um estado final.", "Leva a saga para INTERVENCAO.", "Apaga o pedido.", "Manda RESERVE_STOCK de novo: a saga cancelada pode ressuscitar."], 3, "A resposta de uma compensação é lida como avanço. O conserto é a resposta trazer o command_type e o orquestrador só avançar do estado esperado.");
  tf("t7", 5, 1, "A compensação sempre devolve tudo, inclusive a taxa que o PSP cobrou.", false, "A Microsoft avisa: cancelar uma reserva pode não dar direito a um reembolso integral. Compensar desfaz o efeito de negócio, não apaga a história.");

  /* ---------- Logs de saga ---------- */
  choice("t8", 1, 1, "Quantas linhas tem o log da saga do 1057?", ["5", "4", "11", "7"], 3, "De NOVO (20:15:00) a CANCELADO (20:15:44.95), sete transições; a tabela saga termina com versao = 7.");
  choice("t8", 2, 2, "Como se descobre o estado atual de uma saga no log?", ["Pela primeira linha.", "Somando todas as versões.", "Pela última linha.", "Não dá: o log não guarda estados."], 2, "O estado é a última linha (getCurrentState faz ORDER BY created_at DESC LIMIT 1).");
  choice("t8", 3, 3, "30 pedidos/s, 7 linhas por saga e 90 dias de retenção: quantas linhas o log acumula?", ["163.296.000", "1.632.960.000", "16.329.600.000", "1.632.960"], 1, "30 × 86.400 × 90 × 7 = 1.632.960.000, cerca de 1,6 bilhão (uns 300 GB a 200 B por linha). Por isso se arquivam as sagas finais.");
  tf("t8", 4, 2, "O log do laboratório do autor é event sourcing.", false, "É um log de transições: o estado é a última linha. Vira event sourcing só quando o estado é derivado do log (módulo 20).");
  choice("t8", 5, 2, "Para que serve o log da saga?", ["Só para cache.", "Para criptografar os comandos.", "Para balancear carga entre orquestradores.", "Rastreio, retomada e auditoria."], 3, "Onde está o 1057, de onde continuar depois de uma queda e a prova do que aconteceu (o estorno e-1904, 58,00).");

  /* ---------- Dual write ---------- */
  choice("t9", 1, 1, "O que é a escrita dupla (dual write) numa saga?", ["Gravar o estado no banco e mandar a mensagem: duas escritas que não são atômicas.", "Gravar em dois bancos com 2PC.", "Escrever duas vezes o mesmo log.", "Responder duas vezes ao cliente."], 0, "Se o processo cai entre as duas, ou o passo foi feito e ninguém soube, ou o comando sai duas vezes.");
  choice("t9", 2, 3, "O orquestrador manda ReservarEstoque e cai antes de gravar RESERVANDO. Ao voltar, o que acontece?", ["Nada: o Kafka avisa que já mandou.", "Estorna o pagamento.", "Pula o passo de reservar.", "Lê PAGO e manda ReservarEstoque de novo: o estoque reserva duas vezes se não for idempotente."], 3, "É o que o laboratório do autor faz: envia o comando (linha 346) antes de gravar o estado (linha 391).");
  choice("t9", 3, 2, "Como a outbox resolve a escrita dupla da saga?", ["Troca o banco por outro mais rápido.", "Usa 2PC entre o banco e o Kafka.", "Grava o passo e a mensagem na mesma transação do banco, e um relay envia depois.", "Apaga as mensagens duplicadas."], 2, "Ou os dois entram, ou nenhum. O CDC faz o mesmo lendo o log do banco.");
  tf("t9", 4, 2, "Executar a publicação do evento dentro de uma transaction e só dar commit depois de a comunicação terminar é atômico.", false, "O COMMIT pode falhar depois do publish, e a transação aberta segura travas. A solução é outbox ou CDC.");
  choice("t9", 5, 2, "Mesmo com outbox, por que o serviço que recebe o comando precisa ser idempotente?", ["O relay pode publicar e cair antes de marcar, e o comando sai duas vezes.", "Porque o Kafka não guarda mensagens.", "Para economizar espaço no banco.", "Porque o relay é lento."], 0, "A entrega é pelo menos uma vez. O command_id evita o efeito duplo: o estoque responde o que já respondeu.");

  /* ---------- Exemplo de sistema de pedidos distribuído ---------- */
  choice("t10", 1, 2, "No laboratório do autor, com 10% de falha no estoque e 5% no pagamento, qual é a taxa de sucesso?", ["95%", "85,5%", "90%", "81%"], 1, "0,9 × 0,95 = 0,855: 17,1 de 20 pedidos.");
  choice("t10", 2, 2, "Em 20 pedidos no laboratório, quantos falham no pagamento em média?", ["0,9", "1,0", "2,0", "4,5"], 0, "(1 − 0,10) × 0,05 = 4,5%, e 4,5% de 20 são 0,9. Nesses casos é preciso liberar o estoque.");
  choice("t10", 3, 3, "30 pedidos/s, 20% desistem do Pix e a reserva dura 10 min. Quantas unidades ficam presas?", ["360", "36.000", "600", "3.600"], 3, "30 × 0,2 × 600 s = 3.600. Por isso a reserva tem prazo e a expiração é uma compensação.");
  choice("t10", 4, 2, "O 1057 com falta de estoque: o que muda entre cobrar antes (a loja) e reservar antes (o laboratório)?", ["Cobrar antes é mais rápido e sem estorno.", "São idênticos.", "Cobrar antes leva 44,95 s e estorna R$ 58,00; reservar antes leva cerca de 100 ms, sem estorno, mas prende a reserva.", "Reservar antes também estorna o Davi."], 2, "Reservar antes troca o estorno por reserva presa enquanto o cliente decide pagar.");
  tf("t10", 5, 1, "O laboratório do autor tem uma versão coreografada além da orquestrada.", false, "Só existe a pasta orquestrado/: Go, Kafka, 5 bancos PostgreSQL, 5 serviços e um simulador.");

  window.QUIZ = out;
})();
