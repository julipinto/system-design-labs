/* Banco de perguntas do quiz de Single Point of Failure e Disaster Recovery.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-single-point-of-failure", name: "Single Point of Failure" },
    t2: { topic: "aula-2-identificando-spofs", name: "Identificando SPoFs" },
    t3: { topic: "aula-3-redundancia-e-failover", name: "Redundância e failover" },
    t4: { topic: "aula-4-disaster-recovery", name: "Disaster Recovery" },
    t5: { topic: "aula-5-metricas-e-kpis-de-recuperacao", name: "Métricas e KPIs de recuperação" }
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

  /* ---------- 1. Single Point of Failure ---------- */
  choice("t1", 1, 1, "O que é um ponto único de falha (SPoF)?", [
    "Qualquer componente muito lento.", "Um componente cuja falha derruba tudo ou parte do sistema sem caminho alternativo.", "Um servidor com pouca memória.", "O banco de dados principal, sempre."
  ], 1, "Pode ser banco, balanceador, gateway, broker, outro serviço ou um fornecedor. O que define é a ausência de caminho alternativo.");
  choice("t1", 2, 1, "O que acontece com a loja quando o PSP-A cai e não existe PSP-B?", [
    "Nada: o pedido fecha por outro caminho.", "Modo degradado: o catálogo abre, mas o pedido não fecha.", "Parada total: nada abre.", "Só o relatório para."
  ], 1, "O pedido da Lena chega ao pagamentos e não consegue fechar. É modo degradado, com a loja de vitrine.");
  choice("t1", 3, 2, "Por que o PSP-B resolveu o PSP-A sem duplicar a loja?", [
    "Porque o PSP-B é mais rápido.", "Porque duplicou só o ponto onde a falha doía: o pagamentos troca de provedor.", "Porque o PSP-B é gratuito.", "Porque a loja ficou stateless."
  ], 1, "O objetivo não é duplicar tudo, e sim reduzir o raio, a surpresa e o tempo de volta.");
  choice("t1", 4, 2, "Qual falha causa mais estrago, na tabela da aula?", [
    "Um pod do pedidos (de 3).", "O PSP-A com o PSP-B ligado.", "O edge-loja inteiro fora.", "Um broker do Kafka."
  ], 2, "O edge-loja está no caminho de todos os pedidos: nada chega às células, é parada total.");
  tf("t1", 5, 1, "O SPoF derruba um componente ou serviço; o desastre ultrapassa o que a aplicação absorve e o DR opera no nível do produto.", true, "Um SPoF pode derrubar um serviço. Um desastre compromete uma região, um provedor ou vários serviços de uma vez.");
  choice("t1", 6, 3, "O edge-loja tem 3 instâncias, a 99,9% cada. Por que a conta de paralelo (99,9999999%) não vale?", [
    "Porque 3 instâncias são poucas.", "Porque as três rodam o mesmo código e o mesmo mapa: uma falha de modo comum derruba as três.", "Porque o paralelo só vale com 2 cópias.", "Porque o DNS é lento."
  ], 1, "A disponibilidade real do conjunto é a de uma instância: 99,9%. Duplicar uma coisa com o mesmo defeito não ajuda.");
  choice("t1", 7, 3, "Qual destas é uma redundância independente de verdade?", [
    "Três pods do mesmo deploy, com a mesma configuração ruim.", "O PSP-A e o PSP-B, dois provedores diferentes.", "Três instâncias do edge-loja com o mesmo mapa.", "Duas cópias do mesmo binário com o mesmo bug."
  ], 1, "Dois provedores não compartilham a causa. O paralelo só ajuda quando as falhas são independentes.");

  /* ---------- 2. Identificando SPoFs ---------- */
  choice("t2", 1, 1, "Qual é a pergunta que se faz a cada elo na auditoria?", [
    "Quanto custa?", "Quem assume se você sumir, e em quanto tempo?", "Quem escreveu você?", "Qual é a sua latência média?"
  ], 1, "A auditoria desenha o fluxo feliz, lista todos os atores (fornecedor, certificado, pessoa) e faz essa pergunta a cada um.");
  choice("t2", 2, 2, "Quantos elos do caminho da Lena entram como SPoF, e quais?", [
    "3: lb, gw e bff.", "5: DNS, certificado, edge-loja, identidade e o mapa.", "12: todos.", "1: só o banco."
  ], 1, "Os elos 1, 2, 3, 4 e 12. O banco é parcial: a passiva assume em 35 s, com 0,3 s de dados a menos.");
  choice("t2", 3, 2, "Quanto dá a disponibilidade dos 12 elos a 99,9% em série, e quantos minutos por mês?", [
    "99,9%, 43,2 min.", "98,8066%, 515,6 min.", "99,5003%, 215,9 min.", "99,9988%, 0,52 min."
  ], 1, "0,999^12 = 98,8066%. Com os 5 SPoFs sobrando e o resto duplicado são 99,5003% (215,9 min); tudo duplicado, 99,9988%.");
  choice("t2", 4, 2, "Dos 215,9 min por mês que sobram com os 5 SPoFs, quantos vêm deles?", [
    "Uns 20.", "215,6.", "100.", "Nenhum."
  ], 1, "Os sete elos duplicados valem 0,3 min: o resto é dos cinco SPoFs, e cada um consertado devolve ~43,2 min.");
  choice("t2", 5, 3, "Por que o plano de controle (o mapa, elo 12) pesa menos do que parece?", [
    "Porque nunca falha.", "Porque está fora do caminho do pedido: as bordas guardam o último mapa (estabilidade estática).", "Porque tem 3 cópias.", "Porque é gratuito."
  ], 1, "Estabilidade estática: o que está no caminho do pedido não depende de algo que só serve para mudar a configuração.");
  tf("t2", 6, 2, "O certificado TLS renovado à mão uma vez por ano é um SPoF organizacional.", true, "No dia em que o prazo vence e ninguém lembra, o HTTPS cai para todos. O conserto é a renovação automática e um alerta de 30 dias.");
  choice("t2", 7, 3, "Por que a auditoria 'envelhece'?", [
    "Porque os números mudam todo mês.", "Porque o fluxo muda: as células do módulo 26 criaram o edge-loja e o mapa, que não estavam na lista antiga.", "Porque os fornecedores mudam de nome.", "Porque o k6 mudou."
  ], 1, "É uma revisão contínua, refeita a cada mudança no caminho do pedido, não um projeto com data de fim.");

  /* ---------- 3. Redundância e failover ---------- */
  choice("t3", 1, 1, "O que o stateless faz com o risco?", [
    "Elimina.", "Move para a camada de dados: o PostgreSQL e o Redis passam a concentrar o que era dos pods.", "Dobra.", "Move para o DNS."
  ], 1, "Qualquer pod atende qualquer pedido, mas o estado e o risco vão para o banco e o cache.");
  choice("t3", 2, 1, "Qual é a diferença entre redundância ativa e passiva?", [
    "A ativa é mais barata.", "Na ativa todas as cópias servem; na passiva uma serve e a outra espera, e o tempo de volta depende de detectar e promover.", "A passiva divide a carga.", "Não há diferença."
  ], 1, "Balanceador e consumidores do tópico são ativos; a réplica do banco é passiva.");
  order("t3", 3, 2, "Coloque as etapas do failover automático na ordem:", [
    "Detectar", "Decidir (por quórum)", "Trocar (promover e virar o mapa)"
  ], "Cada etapa tem relógio: sonda de 10 s × 3 = 30 s, quórum 2 em 3, banco em 35 s e mapa em 5 s.");
  choice("t3", 4, 2, "Quanto leva a sonda de região (10 s, 3 falhas seguidas)?", [
    "10 s.", "15 s.", "30 s.", "35 s."
  ], 2, "10 × 3 = 30 s, o MTTD da queda de SP. O pod sai do balanceador em 15 s (5 s × 3) e o banco promove em 35 s.");
  choice("t3", 5, 3, "A rede entre SP e Rio parte, mas SP não caiu. O que acontece?", [
    "Nada: o Patroni cuida.", "O Rio promove a réplica e SP continua aceitando pedidos: dois primários (split brain).", "SP desliga sozinha.", "O DNS resolve."
  ], 1, "Sem fencing, o primário antigo segue escrevendo. O conserto é o líder renovar a chave (ou se rebaixar) e o quórum decidir.");
  choice("t3", 6, 3, "Com 9,9 pedidos/s e 30 s até o fencing, quantos pedidos o pg_rewind descarta? E em 5 min?", [
    "30 e 300.", "297 e 2.970.", "99 e 990.", "2.970 e 29.700."
  ], 1, "9,9 × 30 = 297 e 9,9 × 300 = 2.970: pedidos confirmados em SP que o Rio nunca viu.");
  tf("t3", 7, 2, "O circuit breaker e a feature flag decidem a queda de uma região, como o roteador faz.", false, "O breaker decide por chamada, no cliente. O failover regional decide por sonda, por quórum e pelo roteador.");

  /* ---------- 4. Disaster Recovery ---------- */
  choice("t4", 1, 1, "Qual é o RTO medido na queda de SP com o warm standby, e como se compõe?", [
    "35 s: só o MTTR.", "65 s: MTTD 30 s + MTTR 35 s, contado da interrupção.", "30 s: só a detecção.", "5 min."
  ], 1, "A região caiu às 20:40:00.150 e o mapa virou às 20:41:05: 65 s.");
  order("t4", 2, 2, "Coloque a linha do tempo da queda de SP na ordem:", [
    "A região cai (20:40:00.150)", "Três sondas falham: MTTD de 30 s", "A réplica do Rio é promovida (35 s)", "Os pods da passiva ficam prontos (60 s)", "O mapa vira: RTO de 65 s"
  ], "Detecção em 30 s, promoção em 35 s, pods em 60 s e mapa em 65 s.");
  choice("t4", 3, 2, "Quanto a carga do Rio muda quando a celula-sp cai?", [
    "De 4,5 para 9 pedidos/s.", "De 4,5 para 14,4 pedidos/s (3,2×).", "De 9,9 para 14,4.", "Não muda."
  ], 1, "4,5 + 9,9 = 14,4. Por isso a passiva roda warm a 30% e escala em 30 s por pod.");
  choice("t4", 4, 2, "Qual é a ordem dos RTOs, do pior ao melhor?", [
    "Ativo-ativo, warm standby, pilot light, backup.", "Backup (~48 min), pilot light (12 min), warm standby (65 s), ativo-ativo (35 s).", "Pilot light, backup, warm standby, ativo-ativo.", "Todos iguais."
  ], 1, "Sobe a escada: cada degrau custa mais e volta mais rápido.");
  choice("t4", 5, 2, "Quanto se perde em reais com o pilot light na queda de SP (9,9/s, R$ 80)?", [
    "R$ 27.720.", "R$ 51.480.", "R$ 570.240.", "R$ 2.276.208."
  ], 2, "R$ 792 por segundo × 720 s = R$ 570.240. O warm standby são R$ 51.480 e o backup, R$ 2.276.208.");
  choice("t4", 6, 3, "Com o checkout em RTO 5 min, quais estratégias cumprem?", [
    "Todas.", "Só o warm standby e o ativo-ativo.", "Só o ativo-ativo.", "O pilot light e o backup."
  ], 1, "Warm standby (65 s) e ativo-ativo (35 s). O pilot light (12 min) cumpre o catálogo e os relatórios; o backup, só os relatórios.");
  choice("t4", 7, 3, "O que é o hub, e por que importa?", [
    "O balanceador central.", "SP guarda as passivas de 3 células: com SP fora, elas rodam sem cópia e uma segunda falha perde dados.", "O painel de DNS.", "O Kafka."
  ], 1, "É o SPoF do próprio plano de DR, e a auditoria da aula 2 não o achou. O game day (derrubar SP de propósito) é o que mostra.");

  /* ---------- 5. Métricas e KPIs de recuperação ---------- */
  choice("t5", 1, 1, "Quais são medidas e quais são objetivos contratuais?", [
    "RTO e RPO são medidas; MTTD, MTTR e MTBF são objetivos.", "MTTD, MTTR e MTBF são medidas; RTO e RPO são objetivos.", "Todas são medidas.", "Todas são objetivos."
  ], 1, "Medidas descrevem o que aconteceu; RTO e RPO são o que se promete.");
  choice("t5", 2, 2, "Quanto dão as médias do MTTD, do MTTR e do MTBF das tabelas do artigo?", [
    "34 · 108,4 · 204,5 min.", "30 · 35 · 65 s.", "60 · 90 · 116 min.", "170 · 542 · 818 min."
  ], 0, "170 ÷ 5 = 34, 542 ÷ 5 = 108,4 e 818 ÷ 4 = 204,5. Os somatórios é que são 170, 542 e 818.");
  choice("t5", 3, 2, "Com MTBF de 204,5 min e MTTR de 108,4 min, qual é a disponibilidade?", [
    "99,9%.", "65,4%.", "99,7506%.", "99,9975%."
  ], 1, "204,5 ÷ (204,5 + 108,4) = 65,4%: os números do artigo são didáticos, e as três tabelas não descrevem os mesmos incidentes.");
  choice("t5", 4, 2, "Por que o RTO da loja é 65 s, e não 35 s?", [
    "Porque 35 s é o MTBF.", "Porque o RTO conta da interrupção e inclui o MTTD: 30 + 35.", "Porque o artigo manda.", "Porque o PSP demora."
  ], 1, "O artigo define o RTO 'após a detecção'; a AWS define entre a interrupção e a restauração. A loja usa a da AWS.");
  choice("t5", 5, 2, "Quantos pedidos o RPO deixa perder na celula-mkt (12/s, lag de 0,8 s)?", [
    "2,97.", "2,88.", "9,6.", "0,8."
  ], 2, "RPO em pedidos = taxa × lag: 12 × 0,8 = 9,6. A celula-sp perde 2,97 e a celula-recife, 2,88.");
  choice("t5", 6, 3, "O que RPO zero custa?", [
    "Nada.", "A rede: replicação síncrona soma 10 ms (Rio) ou 80 ms (Recife) ao commit de 2 ms.", "Um disco novo.", "Um segundo primário."
  ], 1, "O commit vira 12 ms com o Rio e 82 ms com Recife.");
  choice("t5", 7, 3, "O 1061 da Bia foi perdido e o Davi recebeu o mesmo número. Qual é o conserto de longo prazo?", [
    "Reiniciar o banco.", "Id por célula (rec-1061) ou UUIDv7, ou pular a sequência (+1.000) na promoção.", "Aumentar o lag.", "Apagar o pedido do Davi."
  ], 1, "A sequência vinha de um banco só e, depois da promoção, reutiliza o último valor replicado. O disco de SP voltou às 23:40 e o pedido da Bia virou o 1062.");

  window.QUIZ = out;
})();
