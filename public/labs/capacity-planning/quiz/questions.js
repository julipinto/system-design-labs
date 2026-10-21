/* Banco de perguntas do quiz de Capacity Planning.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-capacity-planning", name: "Introdução ao capacity planning" },
    t2: { topic: "aula-2-teoria-das-filas", name: "Teoria das filas" },
    t3: { topic: "aula-3-lei-de-little-e-o-ponto-saudavel", name: "Lei de Little e o ponto saudável" },
    t4: { topic: "aula-4-curva-do-joelho", name: "A curva do joelho" },
    t5: { topic: "aula-5-modelagem-de-carga", name: "Modelagem de carga" },
    t6: { topic: "aula-6-perfis-de-trafego", name: "Perfis de tráfego" },
    t7: { topic: "aula-7-projecao-de-crescimento", name: "Projeção de crescimento" },
    t8: { topic: "aula-8-capacidade-end-to-end", name: "Capacidade end to end" },
    t9: { topic: "aula-9-planejamento-de-capacidade", name: "Planejamento de capacidade" }
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

  /* ---------- 1. Introdução ao capacity planning ---------- */
  choice("t1", 1, 1, "O que é capacity planning?", [
    "Prever com precisão o tráfego do próximo ano.",
    "Transformar o que foi medido em limites e em um plano, antes do incidente.",
    "Comprar servidores o mais rápido possível.",
    "Medir o tempo de resposta durante o incidente."
  ], 1, "Capacity planning não prevê: calcula quanto cada serviço precisa ter, em que ordem os elos quebram e quanto custa carregar cada cenário.");
  choice("t1", 2, 2, "Quais são os cenários de 2027 para o catálogo (req/s)?", [
    "640 · 950 · 1.300.",
    "750 · 950 · 1.140.",
    "300 · 640 · 950.",
    "824 · 950 · 1.400."
  ], 1, "750 é a tendência linear, 950 inclui o evento da nova tela (+15%) e 1.140 é 950 × 1,2, a margem de erro.");
  choice("t1", 3, 2, "De onde vêm os 155 pedidos/s entre a tendência (45) e a meta (200)?", [
    "Do crescimento orgânico dos clientes pessoa física.",
    "De mais retries no checkout.",
    "De parceiros pela API, que vendem sem navegar no catálogo.",
    "Do cache, que reduz o custo por pedido."
  ], 2, "A tendência dos clientes dá 45. A meta de 200 só existe com parceiros pela API (o mkt-01 e outros 3), e por isso o catálogo continua em 950.");
  choice("t1", 4, 3, "O time dimensiona o catálogo para o que já aconteceu: 640 req/s com 10 réplicas. Em 2027 a demanda é 950. O que acontece?", [
    "Nada: 10 réplicas aguentam 1.000 req/s.",
    "As réplicas ficam a 95% e a resposta média vai a 210 ms.",
    "O HPA sobe réplicas antes de a demanda chegar.",
    "O catálogo cai por falta de memória."
  ], 1, "950 ÷ 1.000 = 95% de uso. Com R(ρ) = 10 ms + 10 ms ÷ (1 − ρ), a média é 210 ms. Na capacidade 'nominal' parece caber, mas é o joelho.");
  order("t1", 5, 2, "Ponha em ordem os passos do roteiro de capacity planning.", [
    "Delimitar o fluxo",
    "Estimar a carga",
    "Medir o throughput individual",
    "Derivar o throughput sistêmico",
    "Projetar o crescimento",
    "Avaliar custo e margens",
    "Definir os limites operacionais",
    "Testar com carga"
  ], "O roteiro de 8 passos: fluxo, carga, individual, sistêmico, projeção, custo e margens, limites e testes de carga (módulo 24).");

  /* ---------- 2. Teoria das filas ---------- */
  choice("t2", 1, 1, "Um pod do pagamentos gasta 50 ms por pedido. Qual é a taxa de atendimento (μ)?", [
    "5 pedidos/s.", "20 pedidos/s.", "50 pedidos/s.", "200 pedidos/s."
  ], 1, "μ = 1 ÷ 0,05 s = 20 pedidos/s. A utilização é ρ = λ ÷ μ.");
  choice("t2", 2, 2, "No M/M/1, qual é o tempo de resposta do pod do pagamentos (S = 50 ms) a 75% de utilização?", [
    "50 ms.", "100 ms.", "200 ms.", "500 ms."
  ], 2, "W = S ÷ (1 − ρ) = 50 ÷ 0,25 = 200 ms. É a Black Friday de 2026: 30 pedidos/s em 2 pods, 15/s cada.");
  choice("t2", 3, 2, "Com S = 50 ms e ρ = 80%, qual é o tempo médio com CV = 2 (pedidos leves e pesados misturados)?", [
    "150 ms.", "250 ms.", "550 ms.", "1.000 ms."
  ], 2, "Pollaczek–Khinchine: 50 + 4 × (1 + 4) ÷ 2 × 50 = 550 ms. Com CV = 0 são 150 ms e com CV = 1, 250 ms: 3,7× entre os extremos.");
  tf("t2", 4, 2, "O M/M/1 é pessimista para a loja porque o lb-loja usa round robin, que deixa as chegadas mais regulares que um sorteio.", true, "Planejar com o M/M/1 sobra folga. No k6 do módulo 24, 30 pedidos/s deram média de 157 ms, abaixo dos ~259 ms do modelo.");
  choice("t2", 5, 3, "O painel mostra o pagamentos a 80% de CPU e o p95 muito alto. O que a teoria das filas sugere procurar?", [
    "Um defeito de memória.",
    "Variabilidade alta no tempo de serviço (leves e pesados misturados).",
    "Falta de réplicas no estoque.",
    "Um ρ abaixo de 50%."
  ], 1, "Mesma utilização, outra espera: CV 2 a 80% dá 550 ms. A utilização parece saudável, mas a variabilidade empurra a curva.");

  /* ---------- 3. Lei de Little e o ponto saudável ---------- */
  choice("t3", 1, 1, "O que diz a Lei de Little?", [
    "ρ = λ ÷ μ.",
    "O tempo de resposta é sempre 1 ÷ μ.",
    "O trabalho em voo é a taxa de chegada vezes o tempo no sistema (L = λ × W).",
    "A fila cresce de forma linear."
  ], 2, "L = λ × W vale para qualquer fila estável. 1.500 msg/s × 0,050 s = 75 em voo.");
  choice("t3", 2, 2, "Uma API tem L(alvo) = 150. A 1.000 req/s, qual é o W(alvo)?", [
    "15 ms.", "150 ms.", "300 ms.", "1.500 ms."
  ], 1, "W(alvo) = L ÷ λ = 150 ÷ 1.000 = 0,15 s = 150 ms.");
  choice("t3", 3, 2, "O artigo diz que reduzir W de 300 para 150 ms faz o sistema processar 50% mais requisições. Qual é a correção?", [
    "Processa o dobro (+100%): de 500 para 1.000 req/s com o mesmo L.",
    "Processa 25% mais.",
    "O artigo está certo.",
    "Processa o triplo."
  ], 0, "Com a mesma concorrência L, metade do W sustenta o dobro de λ: 500 × 0,3 = 150 e 1.000 × 0,15 = 150.");
  choice("t3", 4, 3, "A 200 pedidos/s, o PSP responde em 0,5 s e o pool do pagamentos tem 50 conexões. O que acontece?", [
    "L = 100 em voo contra 50 conexões: o pagamentos satura com a CPU a 33% (100 cobranças/s × 50 ms ÷ 15 vCPU).",
    "Nada: 50 conexões bastam.",
    "L = 10 e sobra pool.",
    "O PSP rejeita os pedidos."
  ], 0, "L = 200 × 0,5 = 100. Metade do tráfego espera por conexão. A CPU não vê o problema; a concorrência (L) vê.");
  choice("t3", 5, 3, "Qual pool de conexões ao PSP o plano propõe para 200 pedidos/s, com 0,18 s normal e folga de 4?", [
    "50.", "100.", "150.", "300."
  ], 2, "36 em voo (200 × 0,18) × 4 = 144, arredondado para 150. Tolera W do PSP até 150 ÷ 200 = 0,75 s.");

  /* ---------- 4. A curva do joelho ---------- */
  choice("t4", 1, 1, "No M/M/1, o que é o 'joelho'?", [
    "Uma quina em que a curva muda de forma.",
    "Onde o custo de mais 1 ponto de utilização passa do que o time aceita, numa curva suave.",
    "O ponto em que o servidor desliga.",
    "A utilização de 50%."
  ], 1, "No M/M/1 não há quina: W = S ÷ (1 − ρ) é suave. O joelho é uma escolha de limite sobre ela.");
  choice("t4", 2, 2, "Quanto custa mais 1 ponto de utilização no pagamentos (S = 50 ms) a 90%?", [
    "2 ms.", "5,6 ms.", "12,5 ms.", "50 ms."
  ], 3, "S ÷ (1 − ρ)² × 1% = 50 ÷ 0,01 × 0,01 = 50 ms. A 70% custa 5,6 ms; a 95%, 200 ms.");
  choice("t4", 3, 2, "O artigo põe o joelho em 80–85% e o módulo 14 em 70%. Como reconciliar?", [
    "Um dos dois está errado.",
    "O joelho é onde a resposta sai do aceitável; 70% é o alvo operacional, com margem para variabilidade.",
    "Os dois são o mesmo número em escalas diferentes.",
    "O joelho depende do número de réplicas."
  ], 1, "O alvo operacional (70%) fica antes do joelho (80–85%) para absorver rajada e variabilidade.");
  tf("t4", 4, 2, "Em termos normais, a latência de uma fila cresce de forma linear com a utilização.", false, "A curva é convexa desde o início (S ÷ (1 − ρ)); só parece linear até uns 50%.");
  choice("t4", 5, 3, "'Ainda não deu erro, vamos operar o pagamentos a 95%.' Qual é o problema?", [
    "Nenhum: erro zero é o que importa.",
    "W = 1 s (20× o serviço); uma rajada leva o p95 a ~3 s e o timeout de 2 s do lb-loja vira 504.",
    "A CPU a 95% desliga o pod.",
    "O HPA sobe réplicas demais."
  ], 1, "Cada ponto custa 200 ms a 95%. A newsletter das 20:00 basta para o p95 passar do timeout.");

  /* ---------- 5. Modelagem de carga ---------- */
  choice("t5", 1, 1, "Quais são as três dimensões da carga?", [
    "CPU, memória e disco.",
    "TPS, concorrência e payload.",
    "Latência, erros e saturação.",
    "Leitura, escrita e cache."
  ], 1, "TPS (trabalho ÷ segundos), concorrência (L = λ × W) e payload (bytes por transação). A banda é TPS × payload.");
  choice("t5", 2, 2, "O GET /produtos/42 leva 20 KB por transação. A 950 req/s, qual é a banda?", [
    "~19,5 MB/s = 156 Mbit/s.",
    "~2 MB/s.",
    "~950 Mbit/s.",
    "~19 KB/s."
  ], 0, "950 × 20 KB = 19,5 MB/s, ou 156 Mbit/s (a 640 req/s eram 105 Mbit/s; com 10% de retries, 171).");
  choice("t5", 3, 3, "Com 5% de buscas de 80 ms e 95% de páginas de 10 ms, quantas réplicas o catálogo precisa para 950 req/s a 70%?", [
    "14.", "16.", "19.", "24."
  ], 2, "CPU médio 13,5 ms, 74,1 req/s por réplica: 950 ÷ (0,7 × 74,1) = 18,3, arredondado para 19. Com 10% de busca seriam 24.");
  choice("t5", 4, 3, "Os 640 req/s chegam numa rajada de 10 ms (64 por réplica, 10 ms cada). Quanto espera a última requisição?", [
    "10 ms.", "64 ms.", "640 ms.", "6,4 s."
  ], 2, "64 × 10 ms = 640 ms (a média, ~320 ms). Espalhado pelo segundo, a resposta é 37,8 ms: o mesmo TPS, outra experiência.");
  tf("t5", 5, 2, "'Nenhuma métrica é mais importante que o TPS' é uma regra suficiente para dimensionar o catálogo.", false, "O TPS sozinho não dimensiona: o mix de requisições e a rajada dominam a conta.");

  /* ---------- 6. Perfis de tráfego ---------- */
  choice("t6", 1, 1, "Qual é o pico do dia comum do catálogo (exemplo) e a que hora?", [
    "40 req/s às 12h.",
    "81,5 req/s às 21h.",
    "640 req/s às 20:03.",
    "4,1 req/s às 2h."
  ], 1, "O pico é 81,5 às 21h, 2,04 × a média de 40. O mínimo é 4,1 às 2h.");
  choice("t6", 2, 2, "Qual é a média de req/s do catálogo em novembro (índice 1,45 sobre 40)?", [
    "40.", "46.", "58.", "81,5."
  ], 2, "1,45 × 40 = 58 req/s. A Black Friday (640 no minuto) é 11× essa média.");
  choice("t6", 3, 2, "Quanto o pico de 640 req/s da Black Friday passa do pico de um dia comum (81,5)?", [
    "~2×.", "~4×.", "~7,9×.", "~16×."
  ], 2, "640 ÷ 81,5 ≈ 7,9. A média do dia foi 400 req/s, 10× a média anual.");
  tf("t6", 4, 2, "A rajada de 1.300 req/s do módulo 21 é um pico sustentado, por isso o pico do plano deveria ser 1.300.", false, "É uma rajada de segundos: na janela de 1 minuto a mesma noite aparece como ~650. O plano usa o pico de 1 minuto.");
  choice("t6", 5, 3, "O plano usa a média de novembro (58 req/s) como carga da Black Friday. Qual é o erro?", [
    "Nenhum: 58 é a média do ano.",
    "A média do mês esconde o dia e o dia esconde o minuto: o pico de 640 é 11× maior.",
    "Novembro tem menos acessos que dezembro.",
    "58 é maior que o necessário."
  ], 1, "Quanto maior a janela, menor o pico. O que se planeja é o pico da janela que importa (o minuto das 20:03).");

  /* ---------- 7. Projeção de crescimento ---------- */
  choice("t7", 1, 1, "Qual é a projeção linear do pico do catálogo para 2027 (300 · 410 · 520 · 640)?", [
    "640.", "750.", "824.", "950."
  ], 1, "A reta de mínimos quadrados cresce 113 por ano e dá 750.");
  choice("t7", 2, 2, "Qual é a taxa de crescimento composta e a projeção de 2027?", [
    "13% ao ano: 724.",
    "28,7% ao ano: 824.",
    "28,7% ao ano: 950.",
    "37% ao ano: 877."
  ], 1, "(640 ÷ 300)^(1/3) = 1,287. Os saltos reais (1,37 · 1,27 · 1,23) estão caindo, e a composta ainda dá 824.");
  choice("t7", 3, 2, "Como a nova tela (+15%) chega a 950?", [
    "750 × 1,15 = 862.",
    "824 × 1,15 = 947,5, arredondado para 950.",
    "640 × 1,15 = 736.",
    "950 é a meta do comercial."
  ], 1, "O evento de negócio multiplica a composta. A faixa de planejamento é 750 – 950 – 1.140 (950 × 1,2).");
  choice("t7", 4, 3, "Com 14 réplicas (1.400 req/s), qual é a utilização com 1.140 req/s?", [
    "53,6%.", "67,9%.", "81,4%.", "95%."
  ], 2, "1.140 ÷ 1.400 = 81,4%, no joelho. Com 750 seriam 53,6%, com 950, 67,9%.");
  choice("t7", 5, 3, "Se o plano usa a reta (750) e chega o evento (950), o que acontece com 10 réplicas?", [
    "Ficam a 75%.",
    "Ficam a 95% e o p95 volta a 800 ms.",
    "O HPA cobre sem problema.",
    "Ficam a 50%."
  ], 1, "950 ÷ 1.000 = 95%. É o cenário do módulo 14. O crescimento não linear não planejado é o mais perigoso.");

  /* ---------- 8. Capacidade end to end ---------- */
  choice("t8", 1, 1, "Qual é a capacidade sistêmica da cadeia do checkout hoje?", [
    "90/s.", "40/s.", "250/s.", "1.000/s."
  ], 1, "É o mínimo entre os elos: pagamentos 40, pedidos 90, banco 250 e estoque 1.000.");
  order("t8", 2, 2, "Ponha em ordem os valores do mínimo da cadeia, do primeiro ao último passo do plano.", [
    "40/s (pagamentos)",
    "90/s (pedidos)",
    "250/s (banco)",
    "300/s (pedidos e pagamentos)"
  ], "O gargalo anda: 40 → 90 (pagamentos de 2 para 15 pods) → 250 (pedidos de 3 para 10) → 300 (shard dedicado 2× para o mkt-01).");
  choice("t8", 3, 2, "Com a meta de 200 pedidos/s e 60% no shard-2 (150/s), qual é a utilização do shard quente?", [
    "26,7%.", "60%.", "80%.", "133%."
  ], 2, "120 ÷ 150 = 80%: o joelho. Com o shard dedicado 2× (capacidade 300) fica em 26,7%.");
  choice("t8", 4, 3, "O entregas tem 3 partições de 40 eventos/s e recebe 200/s por 4 h. Qual é o lag ao fim do pico?", [
    "0 eventos.", "288.000 eventos.", "1.152.000 eventos.", "2.880.000 eventos."
  ], 2, "(200 − 120) × 14.400 s = 1.152.000. Com 8 partições (320/s) não há lag.");
  choice("t8", 5, 3, "O time escala o estoque de 2 para 4 pods porque 'estoque é crítico'. O que muda na saída da cadeia?", [
    "Dobra.",
    "Nada: o gargalo é o pagamentos (40/s).",
    "Cai pela metade.",
    "Passa a 1.000/s."
  ], 1, "O estoque vai a 2.000/s, mas a saída é o mínimo. O gargalo é o elo mais fraco, não o mais caro.");

  /* ---------- 9. Planejamento de capacidade ---------- */
  choice("t9", 1, 1, "Quantos vCPU tem o plano de 2027 (catálogo 14, pedidos 10, pagamentos 15, estoque 2)?", [
    "17.", "30.", "41.", "984."
  ], 2, "14 + 10 + 15 + 2 = 41 vCPU, contra 17 na Black Friday de 2026 (+24) e 9 em dia comum.");
  choice("t9", 2, 2, "Quantas réplica-horas por dia custa a frota elástica (41 nas 4 h de pico e 9 no resto)?", [
    "984.", "344.", "164.", "216."
  ], 1, "4 × 41 + 20 × 9 = 344, 35% das 984 da frota fixa (24 × 41).");
  choice("t9", 3, 2, "Por que pré-escalar às 19:50?", [
    "Porque a newsletter das 20:00 é conhecida e o HPA reage em ~60 s.",
    "Porque às 19:50 o tráfego é o menor do dia.",
    "Porque o HPA não funciona de noite.",
    "Para reduzir o custo."
  ], 0, "O evento tem hora marcada, então a escala pode ser agendada em vez de esperar a métrica subir.");
  choice("t9", 4, 2, "O que a ficha de limites do checkout contém?", [
    "Apenas o número 300.",
    "Sustentável 210 pedidos/s, p95 ≤ 800 ms, erros ≤ 0,1%, L(alvo) 4, pool 150 e gatilhos de reavaliação.",
    "O custo em dólares.",
    "A lista de pods."
  ], 1, "A ficha é o entregável: limites, metas, dependências e gatilhos, não 'um número'.");
  choice("t9", 5, 3, "O plano diz 300/s, mas ninguém mediu o pool de conexões, a fila do Kafka nem o limite do PSP. O que ele é?", [
    "Uma garantia.",
    "Uma hipótese de capacidade nominal; o teste de breakpoint pode achar o limite antes de 300.",
    "Pessimista demais.",
    "Um SLA."
  ], 1, "Um plano sem teste é um modelo. O módulo 24 mede a capacidade operacional com o k6.");

  window.QUIZ = out;
})();
