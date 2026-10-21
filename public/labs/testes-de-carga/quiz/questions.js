/* Banco de perguntas do quiz de Testes de Carga e Estresse.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-importancia-dos-testes-de-carga", name: "Importância dos testes de carga" },
    t2: { topic: "aula-2-testes-de-carga-vs-estresse", name: "Testes de carga vs. estresse" },
    t3: { topic: "aula-3-smoke-tests", name: "Smoke tests" },
    t4: { topic: "aula-4-teste-de-media-average-load", name: "Teste de média (average load)" },
    t5: { topic: "aula-5-teste-de-estresse", name: "Teste de estresse" },
    t6: { topic: "aula-6-teste-de-spike", name: "Teste de spike" },
    t7: { topic: "aula-7-teste-de-breakpoint", name: "Teste de breakpoint" },
    t8: { topic: "aula-8-respondendo-a-perguntas-chave", name: "Respondendo a perguntas-chave" },
    t9: { topic: "aula-9-metricas-e-service-levels", name: "Métricas e service levels" },
    t10: { topic: "aula-10-estrategias-de-pre-teste", name: "Estratégias de pré-teste" },
    t11: { topic: "aula-11-assessment-de-performance", name: "Assessment de performance" }
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

  /* ---------- 1. Importância dos testes de carga ---------- */
  choice("t1", 1, 1, "O que um plano sem teste é, nesta aula?", [
    "Uma garantia.", "Uma hipótese.", "Uma meta.", "Um relatório."
  ], 1, "O plano do módulo 23 (300/s nominais, 210 sustentáveis) é uma conta. O teste de carga é o jeito de refutá-la com número.");
  choice("t1", 2, 1, "Quais são as metas do checkout neste módulo?", [
    "p95 ≤ 300 ms e erros ≤ 1%.", "p95 ≤ 800 ms e erros ≤ 0,1%.", "Média ≤ 800 ms e erros ≤ 0%.", "p99 ≤ 2 s e erros ≤ 5%."
  ], 1, "São as do checkout no módulo 23, escritas como thresholds do k6: http_req_duration p(95)<800 e http_req_failed rate<0.001.");
  choice("t1", 3, 2, "O que é o sistema testado neste módulo?", [
    "A loja de produção.", "Uma pré-produção com 1 pod por serviço.", "Um simulador de filas do checkout, em Node.", "Um banco PostgreSQL."
  ], 2, "O k6 e as saídas são reais; o sistema é um modelo: cada pod é uma fila FIFO com tempo exponencial.");
  choice("t1", 4, 2, "Quanto dá a soma dos tempos de serviço da cadeia, sem fila?", [
    "33 ms.", "91,7 ms.", "259 ms.", "800 ms."
  ], 1, "33 (pedidos) + 50 (pagamentos) + 2 (estoque) + 6,67 (banco) = 91,7 ms.");
  choice("t1", 5, 3, "Por que extrapolar de 1 pod por serviço para 10 pods engana?", [
    "Porque o k6 não conta pods.", "Dá ~300/s, mas o shard quente do mkt-01 limita o plano em ~250/s.", "Porque o pedidos não escala.", "Porque o smoke falha."
  ], 1, "Um pod do pedidos faz 30/s e 10 pods fariam ~300/s. O shard-2 recebe 60% do tráfego e aguenta 150/s: 150 ÷ 0,6 = 250/s.");

  /* ---------- 2. Testes de carga vs. estresse ---------- */
  choice("t2", 1, 1, "Qual é a diferença entre carga e estresse?", [
    "Carga é o esperado; estresse é o adverso.", "Carga é mais longa; estresse é mais curta.", "Carga usa o k6; estresse usa outra ferramenta.", "Não há diferença."
  ], 0, "Carga mede a meta na carga esperada. Estresse leva acima, em picos, para ver o que degrada e como volta.");
  choice("t2", 2, 2, "Qual é a conta que liga VUs à taxa?", [
    "VUs = taxa ÷ resposta.", "VUs = taxa × (resposta + pausa).", "VUs = taxa + pausa.", "VUs = resposta × pausa."
  ], 1, "É a Lei de Little. Para 200 pedidos/s com 0,4 s de resposta e 3 s de pausa: 680 VUs.");
  choice("t2", 3, 2, "20 VUs no modelo fechado deram quanto, no 'hoje'?", [
    "54/s e 52% de erros.", "38,1/s e 0% de erros.", "60/s e 8,35% de erros.", "20/s e 0% de erros."
  ], 1, "Com 20 VUs: 38,1 req/s, média de 520 ms, p95 de 1,07 s e 0% de erros. Little fecha: 20 = 38,07 × 0,520.");
  choice("t2", 4, 3, "Por que o teste fechado 'passa' enquanto o aberto a 54/s quebra?", [
    "Porque o fechado usa mais CPU.", "Porque cada VU espera a resposta e o gerador se regula (coordinated omission).", "Porque o aberto tem bug.", "Porque o fechado tem timeout maior."
  ], 1, "O fechado manda menos quando o sistema atrasa e omite as requisições que deveria fazer. O aberto mantém a taxa.");
  tf("t2", 5, 2, "800 usuários para 600 TPS implicam um ciclo de 1,33 s por usuário.", true, "800 ÷ 600 = 1,33 s. O relatório não diz quanto é resposta e quanto é pausa.");

  /* ---------- 3. Smoke tests ---------- */
  choice("t3", 1, 1, "O que o smoke responde?", [
    "Qual é o ponto de quebra.", "Se o checkout funciona com carga mínima e o teste roda.", "Se a Black Friday cabe.", "Qual é o p99."
  ], 1, "É uma carga mínima: 2 pedidos/s por 30 s. Não mede capacidade.");
  choice("t3", 2, 2, "Quantas requisições o smoke de 2/s por 30 s fez, e com qual p95?", [
    "30 e 80 ms.", "61 e 155,6 ms.", "600 e 381 ms.", "3.601 e 381 ms."
  ], 1, "61 requisições, média de 81,9 ms, p95 de 155,6 ms e 0% de erros.");
  choice("t3", 3, 2, "Qual código de saída o k6 devolve quando uma threshold falha?", [
    "0.", "1.", "99.", "255."
  ], 2, "O 99 é o que o pipeline lê. O 0 é para quando tudo passou.");
  choice("t3", 4, 3, "Por que o smoke com um cliente só (lena-77) engana?", [
    "Porque o k6 recusa um cliente.", "Ele cai sempre no shard-1 e nunca exercita o shard-2 do mkt-01.", "Porque o murmur3 falha.", "Porque a taxa fica baixa."
  ], 1, "murmur3(lena-77) mod 3 = 1. O shard-2, onde o plano quebra, nunca é tocado.");
  tf("t3", 5, 2, "Conferir só o status 201 pega um erro no cálculo do frete.", false, "Um frete errado devolve 201 do mesmo jeito. O check precisa olhar o conteúdo da resposta.");

  /* ---------- 4. Teste de média (average load) ---------- */
  choice("t4", 1, 1, "O que o average load verifica?", [
    "O ponto de quebra.", "A meta na carga esperada, por tempo bastante.", "A recuperação de uma rajada.", "O mínimo que funciona."
  ], 1, "Ele responde sobre a loja normal. O artigo manda rodar por horas ou dias para achar vazamentos.");
  choice("t4", 2, 2, "Qual foi a média e o p95 de 30 pedidos/s por 2 min no 'hoje'?", [
    "81,9 ms e 155,6 ms.", "157,5 ms e 381,3 ms.", "419 ms e 1,48 s.", "259 ms e 800 ms."
  ], 1, "3.601 requisições, média 157,5 ms, p95 381,3 ms, p99 498,6 ms e 0% de erros.");
  choice("t4", 3, 2, "Por que o k6 mediu 157 ms contra ~259 ms do M/M/1?", [
    "O k6 mede errado.", "O round robin deixa as chegadas mais regulares que um sorteio.", "O simulador não tem fila.", "O M/M/1 ignora o pagamentos."
  ], 1, "Chegada regular espera menos. O modelo do módulo 23 é conservador, e medir diz quanto.");
  choice("t4", 4, 2, "Qual é a média da Black Friday de 2027, em pedidos por segundo?", [
    "45.", "125.", "200.", "300."
  ], 1, "200 × 400 ÷ 640 = 125 pedidos/s. No plano, p95 de 247 ms e 0% de erros.");
  tf("t4", 5, 3, "Passar o teste de média a 125/s prova que o plano aguenta o pico de 200/s.", false, "O breakpoint do mesmo ambiente quebra em ~250/s. A média responde 'a loja normal vai bem?', e não 'a Black Friday cabe?'.");

  /* ---------- 5. Teste de estresse ---------- */
  choice("t5", 1, 1, "O que o estresse observa além do tamanho da carga?", [
    "A cor do dashboard.", "O que degrada primeiro e como se recupera.", "O número de VUs.", "O custo da nuvem."
  ], 1, "Ele leva a carga acima do esperado, em degraus, e mede a degradação e a recuperação.");
  order("t5", 2, 2, "Coloque a escada do plano 2 na ordem dos patamares (taxa em pedidos/s):", [
    "100", "200", "250", "300"
  ], "A escada é 100 → 200 → 250 → 300 → 100, com 20 s de subida e 45 s de patamar.");
  choice("t5", 3, 2, "Até quanto a meta (p95 ≤ 800 ms) se sustentou na escada do plano 2?", [
    "Até 100/s.", "Até 200/s.", "Até 250/s (pior janela, 738 ms).", "Até 300/s."
  ], 2, "A 300/s o p95 foi de 1,5 a 2 s e os erros ficaram entre 0,7% e 5,1%.");
  choice("t5", 4, 3, "Por que a recuperação depois do estresse é rápida?", [
    "Porque o HPA escala.", "Porque o gargalo descarta o que já expirou (2 s) e a fila esvazia.", "Porque o k6 reduz a carga sozinho.", "Porque o shard dedicado absorve."
  ], 1, "Na volta a 100/s o p95 caiu a ~244 ms em uma a duas janelas (10 a 20 s).");
  tf("t5", 5, 3, "Acima do teto, mais carga gera mais pedidos concluídos.", false, "O goodput do 'hoje' cai de ~40 para ~26/s: o pagamentos gasta capacidade em quem já desistiu.");

  /* ---------- 6. Teste de spike ---------- */
  choice("t6", 1, 1, "O que o spike testa?", [
    "O pior caso de CPU.", "Um salto súbito de carga que volta: absorve e se recupera?", "A carga de um dia inteiro.", "Só o smoke em dobro."
  ], 1, "Ele pergunta se o sistema absorve a rajada, se se recupera e quanto tempo leva.");
  choice("t6", 2, 2, "No topo do spike (60/s oferecidos), qual foi a faixa de erros no 'hoje'?", [
    "0% a 1%.", "5% a 10%.", "47% a 65%.", "100%."
  ], 2, "O goodput ficou entre 21 e 30/s, menos que os ~40/s de capacidade. O p95 do salto foi 1,05 s.");
  choice("t6", 3, 2, "Quantos pedidos ficam sem atendimento enquanto o HPA (60 s) reage?", [
    "200.", "600.", "1.200.", "3.600."
  ], 2, "20 pedidos/s acima da capacidade × 60 s = 1.200 pedidos recusados ou atrasados.");
  choice("t6", 4, 2, "Qual é o conserto para uma rajada conhecida como a newsletter das 20:00?", [
    "Desligar o k6.", "Pré-escalar antes, como às 19:50.", "Aumentar o timeout.", "Trocar de modelo."
  ], 1, "O HPA reage em ~60 s. O plano do módulo 23 manda pré-escalar às 19:50.");
  tf("t6", 5, 3, "A recuperação do p95 para 168 ms em uma janela mostra que o sistema ficou rápido.", false, "O simulador descarta o que passa de 2 s: a fila virou 504. A recuperação rápida é, em parte, erro.");

  /* ---------- 7. Teste de breakpoint ---------- */
  choice("t7", 1, 1, "Quais são os três pontos de 'quebra'?", [
    "CPU, memória e rede.", "Meta (p95), erros e colapso (goodput cai).", "Smoke, média e spike.", "Início, meio e fim da rampa."
  ], 1, "A meta cai com p95 > 800 ms, os erros passam de 0,1% e o colapso é quando o goodput cai.");
  choice("t7", 2, 2, "Onde o plano (sem shard dedicado) quebra, e por quê?", [
    "300/s, pelo pagamentos.", "~250/s, pelo shard quente do mkt-01 (60% × 250 = 150/s).", "~36/s, pelo pedidos.", "~500/s, pelo estoque."
  ], 1, "O teto do shard é 150/s e o shard-2 recebe 60% do tráfego: 150 ÷ 0,6 = 250/s.");
  choice("t7", 3, 2, "Onde a meta cai no 'hoje', em regime permanente (degrau de 2 min)?", [
    "33/s.", "36/s (p95 798 ms).", "42/s.", "60/s."
  ], 1, "A rampa dizia 35 a 39; o degrau de 36/s deu p95 de 798 ms e o de 33/s, 431 ms. Os erros vêm em ~42/s.");
  choice("t7", 4, 3, "Por que o abortOnFail do k6 chega tarde?", [
    "Porque avalia o p95 acumulado, não a janela.", "Porque só olha os erros.", "Porque o k6 ignora thresholds.", "Porque roda no fim."
  ], 0, "Parou aos 128 s com 894 ms acumulados, quando a janela de 100–110 s já tinha cruzado 800 ms.");
  choice("t7", 5, 3, "Qual é o risco de um breakpoint em ambiente elástico?", [
    "O k6 trava.", "O HPA esconde o limite e o teste acha o limite da conta da nuvem.", "O p95 fica negativo.", "O banco fica read-only."
  ], 1, "O k6 manda desligar a elasticidade para achar o limite do sistema e testar o autoscaling à parte.");
  tf("t7", 6, 2, "Uma rampa curta dá um ponto otimista porque a fila ainda está enchendo.", true, "A rampa localiza (~4% otimista); o degrau de 2 min confirma.");

  /* ---------- 8. Respondendo a perguntas-chave ---------- */
  choice("t8", 1, 1, "O que um teste deve ter antes de injetar carga?", [
    "Mais VUs.", "Uma pergunta a responder.", "Um servidor maior.", "Um dashboard bonito."
  ], 1, "Sem a pergunta, o teste vira 'injetar carga por injetar' e não decide nada.");
  choice("t8", 2, 2, "Quantos VUs pedem 200 pedidos/s com 0,4 s de resposta e 3 s de pausa?", [
    "80.", "200.", "680.", "1.200."
  ], 2, "(0,4 + 3) × 200 = 680 VUs.");
  choice("t8", 3, 2, "Qual é a jornada da loja no lugar do mix do artigo?", [
    "Cartão 50 · instantâneo 30 · boleto 15 · estorno 5.", "Cartão 60 · Pix 35 · estorno 5.", "Só cartão.", "Pix 100."
  ], 1, "É um exemplo declarado. A 200 pedidos/s: 120, 70 e 10 por segundo.");
  choice("t8", 4, 3, "Com 5% de busca (80 ms) e 95% de página (10 ms), qual é a capacidade por réplica e quantas réplicas o catálogo pede?", [
    "100 req/s e 14.", "74 req/s e 19.", "50 req/s e 28.", "200 req/s e 7."
  ], 1, "Custo médio de 13,5 ms: 74 req/s por réplica. 950 ÷ (74 × 0,7) = 18,3: 19 réplicas.");
  tf("t8", 5, 3, "Testar só GET /produtos/42 dimensiona o catálogo corretamente para a jornada real.", false, "Dá 100 req/s por réplica e 14 réplicas, onde a jornada real aguenta 74 e pede 19.");

  /* ---------- 9. Métricas e service levels ---------- */
  choice("t9", 1, 1, "Qual é a métrica de latência da meta?", [
    "A média.", "O p95.", "O mínimo.", "O máximo."
  ], 1, "A meta é p95 ≤ 800 ms. A média esconde a cauda: 157 ms de média tinham p99 de 499 ms.");
  choice("t9", 2, 2, "Qual é a diferença entre p95 por janela e acumulado?", [
    "Nenhuma.", "O acumulado pesa o teste inteiro e atrasa; a janela localiza a quebra.", "O acumulado é mais preciso.", "A janela só existe no Prometheus."
  ], 1, "O abort aos 128 s (894 ms acumulados) veio depois da janela de 100–110 s (820 ms).");
  choice("t9", 3, 2, "Resultado de 400 ms para uma expectativa de '< 400 ms': passou?", [
    "Passou.", "Reprovou: 400 não é menor que 400.", "Depende do p99.", "Passou, se os erros forem 0%."
  ], 1, "O relatório do autor diz 'se aproximou do limite', mas pela própria meta o resultado não passa.");
  choice("t9", 4, 2, "O que falta ao artigo além de média e p95?", [
    "A cor do gráfico.", "O p99, o goodput e o dropped_iterations.", "O nome do cliente.", "O tamanho do payload."
  ], 1, "O goodput é o que concluiu; o dropped_iterations mostra o gerador sem fôlego.");
  tf("t9", 5, 2, "O p95 da cadeia é a soma dos p95 de cada serviço.", false, "Percentis não se somam: o p95 da cadeia é o percentil das respostas completas (módulo 14).");

  /* ---------- 10. Estratégias de pré-teste ---------- */
  choice("t10", 1, 1, "O que o pré-teste mede?", [
    "A loja inteira.", "Uma unidade (1 réplica), depois N, até o elo mudar.", "Só o banco.", "O tempo de deploy."
  ], 1, "Ele dá a capacidade por réplica para o plano e mostra onde o gargalo muda de peça.");
  choice("t10", 2, 2, "Em quais taxas a meta caiu com 1, 2 e 3 pods do pedidos (pagamentos sem limite)?", [
    "~10, ~20, ~30/s.", "~35, ~62 e ~88/s.", "~100, ~200 e ~300/s.", "~250, ~260 e ~300/s."
  ], 1, "Capacidade linear, ~30/s por pod, e a meta cai perto do nominal (30, 60 e 90).");
  choice("t10", 3, 3, "Por que o 'hoje' (3 pods) quebra em 36/s e não em ~88/s?", [
    "O k6 erra.", "O pagamentos, de 2 pods de 20/s, é o elo: o elo muda.", "O estoque é lento.", "O shard dedicado falta."
  ], 1, "Com o pagamentos 'infinito' 3 pods passariam de 85/s. Com 2 pods, a cadeia limita em ~40/s nominais.");
  choice("t10", 4, 2, "Como se faz a validação de unidade assíncrona?", [
    "Desliga-se a fila.", "Represa-se uma fila grande, liga-se uma réplica e vê-se se ela se segura sem morrer.", "Dobra-se o timeout.", "Usa-se só o smoke."
  ], 1, "Na loja, o entregas processa 40 eventos/s por partição (módulo 23).");
  tf("t10", 5, 3, "Um pré-teste com dependências sem limite vale para a produção.", false, "O resultado só vale para a configuração medida: com o pagamentos infinito, 3 pods passam de 80/s e o 'hoje' real quebra em 36.");

  /* ---------- 11. Assessment de performance ---------- */
  choice("t11", 1, 1, "O que tem num assessment?", [
    "Só gráficos.", "Objetivos, cenários, resultados e backlog.", "Só o script do k6.", "O código-fonte."
  ], 1, "É o relatório para engenharia e produto, no molde do README do autor, preenchido com os testes reais.");
  choice("t11", 2, 2, "Qual é a conclusão sobre o plano?", [
    "Quebra em 300/s.", "Quebra em ~250/s (shard quente); com o shard dedicado, ~260/s.", "Quebra em 36/s.", "Não quebra."
  ], 1, "O plano de 200/s tem ~30% de folga até o ponto de quebra (260 ÷ 200).");
  choice("t11", 3, 2, "Como fica a ficha do módulo 23 (sustentável de 210/s)?", [
    "Errada: some.", "Conservadora em ~24% (260 ÷ 210); 210 segue como política de ρ ≤ 70%.", "Exata.", "Otimista."
  ], 1, "A meta só cai em ~260/s em regime permanente. A distância até 210 é a margem do plano.");
  choice("t11", 4, 3, "O que o cenário misto (pool único de 20 conexões) mostrou?", [
    "Nada de novo.", "33% dos pedidos do checkout e 10% das consultas de status receberam 503.", "O banco caiu.", "O k6 travou."
  ], 1, "O relatório das 23:00 consumiu o pool dos outros fluxos. Fora da janela, 0%.");
  choice("t11", 5, 3, "Por que o checkout.js nunca veria o problema do pool?", [
    "Porque não usa HTTP.", "Porque mede um fluxo por vez.", "Porque o pool é do k6.", "Porque o checkout é lento."
  ], 1, "Só o cenário misto achou um fluxo derrubando outro por dividirem o pool: é o módulo 25, Bulkhead Pattern.");

  window.QUIZ = out;
})();
