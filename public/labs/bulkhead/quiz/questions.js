/* Banco de perguntas do quiz de Bulkhead Pattern.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-bulkhead", name: "Introdução ao Bulkhead" },
    t2: { topic: "aula-2-bulkheads-logicos-e-fisicos", name: "Bulkheads lógicos e físicos" },
    t3: { topic: "aula-3-bulkheads-e-blast-radius", name: "Bulkheads e blast radius" },
    t4: { topic: "aula-4-bulkhead-e-sharding-funcional-e-operacional", name: "Sharding funcional e operacional" },
    t5: { topic: "aula-5-arquiteturas-de-referencia", name: "Arquiteturas de referência" }
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

  /* ---------- 1. Introdução ao Bulkhead ---------- */
  choice("t1", 1, 1, "O que o bulkhead faz?", [
    "Impede que as falhas aconteçam.",
    "Limita até onde a falha chega, dividindo um recurso em compartimentos.",
    "Repete a chamada que falhou.",
    "Corta a chamada depois de um tempo."
  ], 1, "O bulkhead não evita a falha: um furo alaga só o seu compartimento. Repetir é o retry e cortar por tempo é o timeout.");
  choice("t1", 2, 2, "Quantas conexões o relatório das 23:00 pede ao pool de 20 (10 consultas/s de 4 s)?", [
    "0,2.", "4.", "40.", "20."
  ], 2, "Little: 10 × 4 = 40 conexões em uso. O cliente pede só 0,2 + 0,2. O relatório sozinho pede o dobro do pool.");
  choice("t1", 3, 2, "No k6 com o pool único, qual fração dos pedidos do checkout recebeu 503 na janela do relatório?", [
    "Nenhum.", "10%: 101 de ~1.000.", "33%: 83 de 250.", "86%: 215 de 250."
  ], 2, "83 de 250 pedidos do checkout (33%) e 101 de ~1.000 consultas de status (10%). Os 86% são o relatório no pool 16 + 4.");
  choice("t1", 4, 2, "No pool 16 + 4, quem paga pela divisão?", [
    "O checkout, com 503.",
    "O status do pedido, que fica mais lento.",
    "O relatório: 215 das 250 consultas dele recebem 503.",
    "Ninguém."
  ], 2, "O bulkhead não criou capacidade: escolheu quem espera. O cliente ficou com 0% de 503 e o batch, com 14% de sucesso.");
  tf("t1", 5, 2, "Com 4 conexões, o relatório atende 1 consulta por segundo e o job de 6.000 consultas leva 100 min em vez de 10.", true, "4 conexões ÷ 4 s = 1 consulta/s. 6.000 ÷ 1 = 6.000 s = 100 min, de 23:00 a 00:40.");
  choice("t1", 6, 3, "Por que o checkout perdeu 33% e o status só 10% no k6, se disputam as mesmas vagas?", [
    "O checkout é mais lento por natureza.",
    "O k6 chega em intervalos regulares: o POST e o relatório chegam a cada 100 ms, nos mesmos instantes.",
    "O status tem prioridade no servidor.",
    "O pool tem vagas separadas para GET."
  ], 1, "Com chegadas de Poisson as duas taxas seriam iguais. A coincidência dos instantes é um efeito do gerador.");
  choice("t1", 7, 3, "O timeout de 1 s e 20 POST/s por pod (Black Friday de 2027) tornam o pior caso de workers presos igual a:", [
    "1.", "20 × 1 = 20: o pool inteiro.", "400.", "Zero, o timeout resolve."
  ], 1, "O timeout limita W; só um teto por compartimento limita L. Sem ele, o pior caso consome todo o pool.");

  /* ---------- 2. Bulkheads lógicos e físicos ---------- */
  choice("t2", 1, 1, "Qual destes é um bulkhead físico?", [
    "Um pool de threads por dependência.",
    "Um semáforo de 4 chamadas.",
    "Um pool de nós reservado ao checkout, com taints e tolerations.",
    "Uma fila por domínio."
  ], 2, "Os outros três são lógicos: dividem recursos de execução. O pool de nós divide máquinas.");
  choice("t2", 2, 2, "Qual é a diferença entre semáforo e pool de threads?", [
    "O semáforo usa mais threads.",
    "O semáforo conta chamadas simultâneas, sem fila; o pool isola o bloqueio, com fila e troca de contexto.",
    "O pool de threads só existe no Hystrix.",
    "São o mesmo mecanismo."
  ], 1, "Com I/O assíncrono o semáforo basta; com uma biblioteca legada que bloqueia, o pool dedicado impede o travamento.");
  choice("t2", 3, 2, "Pela conta de Little, qual é o tamanho do pool dividido (interativo + batch)?", [
    "16 + 4 = 20.", "4 + 4 = 8.", "10 + 10 = 20.", "0,4 + 40."
  ], 1, "O interativo usa 0,4 e com folga de 10× bastam 4; o batch recebe um teto de 4. As outras 12 conexões voltam ao max_connections.");
  choice("t2", 4, 2, "12 workers em 1 pool a 70% de carga: a chance de esperar é 18,4%. E em 3 pools de 4?", [
    "6,1%.", "18,4%.", "42,9%.", "100%."
  ], 2, "Dividir perde multiplexação estatística: a espera média sobe de 2,6 ms para 17,9 ms (S = 50 ms).");
  choice("t2", 5, 3, "Quantos workers por pool igualam a chance de esperar do pool único (≈ 18,4%)?", [
    "4, sem custo.", "5 por pool: 15 no total, +25%.", "8 por pool: 24 no total.", "Nenhum número iguala."
  ], 1, "Com 5 por pool a chance é 19,0%. Para igualar o tempo médio de espera são 6 por pool (18, +50%).");
  choice("t2", 6, 3, "O relatorios, sem limites de memória, vaza no nó onde rodam 3 pods do pedidos. O que falha?", [
    "O pool de threads do pedidos.",
    "A memória do nó: evicção e OOM atingem os vizinhos (shared fate).",
    "O pool de conexões do banco.",
    "Nada: o bulkhead lógico segura."
  ], 1, "A memória do nó não é um pool. O conserto físico completa o lógico: requests e limits, e um pool de nós para checkout e outro para batch.");
  tf("t2", 7, 1, "O max_connections do PostgreSQL vale 100, com 3 reservadas ao superusuário.", true, "Sobram 97 para os demais. Dividir o pool pode devolver conexões a esse limite.");

  /* ---------- 3. Bulkheads e blast radius ---------- */
  choice("t3", 1, 1, "Com 5 compartimentos e tráfego uniforme, qual é o raio de um incidente?", [
    "50%.", "33%.", "20%.", "5%."
  ], 2, "1 ÷ 5 = 20%, e a disponibilidade durante o incidente é 80%.");
  choice("t3", 2, 2, "Com 3 shards a 20% · 20% · 60%, qual é o pior caso?", [
    "33,3%.", "20%.", "60%.", "40%."
  ], 2, "A média dos três é 33,3%, mas o raio do shard do mkt-01 é 60%. A tabela 1 ÷ N só vale com tráfego uniforme.");
  choice("t3", 3, 2, "Com o shard dedicado ao mkt-01 (20% · 20% · 20% · 40%), o pior caso passa a:", [
    "60%.", "40%.", "25%.", "20%."
  ], 1, "O dedicado leva o pior caso de 60% para 40%. Não chega a 25% porque o mkt-01 continua a pesar 40%.");
  choice("t3", 4, 2, "Quantos pares existem no shuffle sharding de 2 réplicas em 10, e qual é o pior caso?", [
    "10 pares, 10%.", "20 pares, 5%.", "45 pares, 2,2%.", "90 pares, 1,1%."
  ], 2, "C(10, 2) = 45. O pior caso derruba 1 ÷ 45 = 2,2% dos clientes, contra 20% em grupos fixos de 2 em 10.");
  choice("t3", 5, 3, "Cada compartimento fica fora 0,1% do tempo. A chance de algum de 50 estar fora é:", [
    "0,1%.", "0,30%.", "4,88%.", "50%."
  ], 2, "1 − 0,999^50 = 4,88%. O raio por incidente cai, o número de incidentes sobe. A chance de todos fora, p^N, desaparece (10^-9 com 3).");
  tf("t3", 6, 2, "Bulkhead melhora o tempo médio de falha de cada cliente.", false, "Para um cliente que depende de um compartimento a indisponibilidade continua 0,1%. O bulkhead reduz o tamanho do incidente e elimina a parada total.");
  choice("t3", 7, 3, "Os 3 shards do pedidos chamam o mesmo estoque. Se o estoque cai, o raio é:", [
    "33,3%.", "60%.", "100%.", "20%."
  ], 2, "É um canal oculto: uma dependência global anula a divisão em shards. O raio do estoque é de 100%.");

  /* ---------- 4. Sharding funcional e operacional ---------- */
  choice("t4", 1, 1, "O bulkhead funcional divide por:", [
    "Cliente.", "Região.", "Função: o que o sistema faz (eixo Y).", "Volume de dados."
  ], 2, "Funcional é eixo Y (módulo 15): pedidos, relatorios, entregas. Operacional é eixo Z (módulo 16): por volume ou cliente.");
  choice("t4", 2, 2, "Qual destes é um exemplo de bulkhead operacional?", [
    "O relatorios lendo da réplica do Rio.",
    "O entregas em Kafka.",
    "Os 3 shards do pedidos por cliente_id e o shard dedicado do mkt-01.",
    "Pools de threads por dependência."
  ], 2, "Operacional divide por quanto e de quem. O relatório na réplica e o entregas são divisões por função.");
  choice("t4", 3, 2, "A newsletter de 50.000 e-mails no mesmo tópico do pedidos, com 3 consumidores a 40 eventos/s cada, atrasa os eventos de pedido em cerca de:", [
    "0 s.", "50 s.", "417 s (≈ 7 min).", "50.000 s."
  ], 2, "50.000 ÷ 120 = 417 s. Em fila separada (RabbitMQ), o atraso dos pedidos é 0.");
  choice("t4", 4, 2, "20 workers em lanes de 12 · 6 · 2. Um surto de reprocessamento (baixa) consegue usar:", [
    "Todos os 20.", "12 workers.", "No máximo 2 workers.", "6 workers."
  ], 2, "A lane baixa tem teto de 2. O checkout continua com as 12 vagas da lane alta.");
  tf("t4", 5, 2, "O relatório das 23:00 lendo da réplica do Rio usa 0% da capacidade de escrita do primário.", true, "O lag de 300 ms na Black Friday não importa para um relatório, e a consulta pesada não toca o primário.");
  choice("t4", 6, 3, "O shard dedicado do mkt-01 tem banco próprio, mas usa o mesmo estoque e a mesma configuração global. O que isso é?", [
    "Reserva com empréstimo.", "Um canal oculto: o isolamento tem um buraco.", "Hashing consistente.", "Um bulkhead físico completo."
  ], 1, "Sem separar todo o caminho (balanceador, aplicação, banco, fila), as caixas isoladas têm um destino só.");
  choice("t4", 7, 3, "Sobre o hashing consistente, qual afirmação é correta?", [
    "O hash isola os recursos.",
    "O hash roteia; o isolamento vem de os recursos serem separados por shard. Ao mudar N, 25% das chaves migram.",
    "Ele elimina a necessidade de shards.",
    "Ele só funciona com round robin."
  ], 1, "O artigo chama o hash de determinístico, mas o isolamento depende de cada shard ter seus próprios recursos.");

  /* ---------- 5. Arquiteturas de referência ---------- */
  choice("t5", 1, 1, "Qual desenho responde à pergunta 'o que não pode falhar'?", [
    "Prioridade.", "Criticidade.", "Tipo de uso.", "Segmento."
  ], 1, "Prioridade é o que se atende primeiro. Criticidade é o que não pode falhar: o pagamentos, com escopo de cartão, em pool de nós próprio.");
  choice("t5", 2, 2, "Qual é o preço do desenho por tipo de uso (interativo × batch)?", [
    "Capacidade ociosa nas lanes quietas.",
    "Resharding.",
    "Duas esteiras para operar.",
    "Limites a manter."
  ], 2, "O batch ganha fila, workers e até pipeline próprios, e pode atrasar ou pausar sem tocar o p95 do checkout.");
  choice("t5", 3, 2, "O robô do mkt-01 (500 req/s) contra o catalogo (1.000 req/s) sem teto consome:", [
    "10%.", "25%.", "50%.", "100%."
  ], 2, "500 de 1.000 req/s: metade da frota. Com o teto de 100, os outros 900 req/s ficam garantidos.");
  choice("t5", 4, 2, "Com o teto de 100 req/s, o que acontece com os 400 req/s excedentes do robô?", [
    "Atrasam os outros clientes.", "Recebem 429 no compartimento dele.", "Vão para o shard dedicado.", "São enfileirados para sempre."
  ], 1, "O 429 acontece no compartimento do tenant. É falhar rápido, sem tirar vaga de ninguém.");
  tf("t5", 5, 2, "Um rate limit por cliente com reserva garantida para os outros é uma forma de bulkhead operacional.", true, "A regra é o escopo: o limite global protege o total; o teto por tenant com reserva protege cada fluxo dos outros.");
  choice("t5", 6, 3, "3 lanes × 4 shards, com N+1 pods em cada compartimento, dão quantos pods onde 10 bastavam?", [
    "12.", "13.", "24.", "30."
  ], 2, "12 compartimentos × 2 pods (1 de trabalho e 1 de reserva) = 24 pods. Bulkhead demais é capacidade ociosa e mais coisa para operar.");
  choice("t5", 7, 3, "Qual é a pergunta certa antes de criar mais um compartimento?", [
    "Quantos servidores sobram?",
    "Qual incidente real este compartimento evita, e quanto ele custa?",
    "Qual o maior N possível?",
    "Qual a tabela do artigo diz?"
  ], 1, "Cada divisão reduz o raio e aumenta a conta: pods ociosos, saturação a medir por compartimento e mais coisa para operar.");

  window.QUIZ = out;
})();
