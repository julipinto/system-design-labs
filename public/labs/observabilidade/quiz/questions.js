/* Banco de perguntas do quiz de Observabilidade e Monitoramento.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-confiabilidade", name: "Confiabilidade" },
    t2: { topic: "aula-2-observabilidade-vs-monitoramento", name: "Observabilidade × monitoramento" },
    t3: { topic: "aula-3-metricas", name: "Métricas" },
    t4: { topic: "aula-4-logs", name: "Logs" },
    t5: { topic: "aula-5-traces", name: "Traces" },
    t6: { topic: "aula-6-alerting-e-apm", name: "Alertas e APM" },
    t7: { topic: "aula-7-service-levels", name: "Service levels" },
    t8: { topic: "aula-8-use-method", name: "USE" },
    t9: { topic: "aula-9-red-method", name: "RED" },
    t10: { topic: "aula-10-four-golden-signals", name: "Quatro sinais de ouro" }
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
  /* Troca fixa de lugar: leva a resposta certa para uma posição que varia de pergunta em pergunta (sem sorteio, o quiz é reprodutível). */
  function choice(k, n, level, prompt, options, answer, explain) {
    var opts = options.slice(), tgt = (parseInt(k.slice(1), 10) * 2 + n * 3) % opts.length, tmp = opts[tgt];
    opts[tgt] = opts[answer]; opts[answer] = tmp;
    add(k, n, "choice", level, prompt, opts, tgt, explain);
  }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. Confiabilidade ---------- */
  choice("t1", 1, 1, "Como o artigo define confiabilidade?", [
    "Manter o servidor ligado o maior tempo possível.",
    "Entregar comportamento correto ao longo do tempo: continuidade, integridade e previsibilidade.",
    "Ter a menor latência média da região.",
    "Ter mais de uma réplica de cada serviço."
  ], 1, "A disponibilidade é só um pedaço: uma loja pode estar no ar e responder com dado errado, ou com latência imprevisível.");
  choice("t1", 2, 2, "A 2.5.0 devolve 201, o healthcheck responde 200, os erros ficam em 0% e a latência é a mesma. Qual painel denuncia o frete 0,00?", [
    "O de CPU do pedidos.",
    "O da taxa de 5xx.",
    "O de negócio: pedidos_frete_zero_total{cidade=\"recife\"}.",
    "O do healthcheck."
  ], 2, "Só uma métrica que conhece a regra do domínio enxerga um frete que vale zero. Todos os painéis técnicos ficam verdes.");
  choice("t1", 3, 2, "Quanto custou o frete 0,00 em 60 min, a 1 pedido por segundo de Recife e R$ 15,00 a menos em cada?", [
    "R$ 450.", "R$ 3.240.", "R$ 54.000.", "R$ 900.000."
  ], 2, "3.600 s × 1 pedido/s × R$ 15,00 = R$ 54.000. Com uma sonda que enxergasse em 30 s, seriam R$ 450.");
  tf("t1", 4, 2, "Se uma sonda enxergasse o frete 0,00 em 30 s, o prejuízo seria de R$ 450.", true, "30 × 1 × R$ 15,00 = R$ 450. A diferença de 120 vezes está no tempo para perceber, e não no tempo para consertar.");
  choice("t1", 5, 3, "Por que o artigo diz que confiabilidade é um 'contrato operacional' e não um 'atributo desejável'?", [
    "Porque exige assinatura de um cliente.",
    "Porque é uma restrição de arquitetura, com medida e dono, que orienta redundância, resiliência e resposta a incidentes.",
    "Porque só vale para sistemas pagos.",
    "Porque substitui o SLA."
  ], 1, "Tudo o que o curso fez desde o módulo 21 é consequência: reduzir a chance e o impacto do erro, o tempo para detectar e voltar e o raio da falha.");

  /* ---------- 2. Observabilidade × monitoramento ---------- */
  choice("t2", 1, 1, "Qual destas é uma pergunta de monitoramento?", [
    "Por que esta requisição da Lena foi lenta?",
    "A taxa de erro passou de 5%?",
    "Que caminho o pedido 1063 fez pela loja?",
    "O que mudou no estoque às 15:30?"
  ], 1, "Monitoramento acompanha o conhecido, com um limite já escolhido. As outras são perguntas novas, que pedem observabilidade.");
  choice("t2", 2, 1, "De onde vem a palavra observabilidade?", [
    "Da engenharia de redes, anos 1990.",
    "Da teoria de controle (Kalman, anos 1960): o estado interno se infere pelas saídas.",
    "Do SRE book do Google, em 2016.",
    "Da OpenTelemetry, em 2019."
  ], 1, "Um sistema é observável se dá para inferir o estado interno apenas pelo que ele emite. No software, as saídas são os sinais.");
  choice("t2", 3, 2, "No pedido 1063, quem diz onde o tempo foi gasto?", [
    "A métrica estoque_reservar_duracao_segundos.",
    "O trace: 1.640 dos 1.895 ms no estoque.",
    "O log WARN do estoque.",
    "O healthcheck."
  ], 1, "A métrica diz que (8 pedidos acima de 1 s), o trace diz onde (86,5% no estoque) e o log diz por quê (o holder é a contagem-estoque).");
  tf("t2", 4, 2, "Ter métricas, logs e traces instalados já é ter observabilidade.", false, "O artigo mesmo diz que observabilidade é propriedade, não ferramenta. Sem correlação (o trace_id em tudo), cada sinal é uma ilha.");
  order("t2", 5, 2, "Ponha na ordem o caminho de uma investigação, do mais barato ao mais caro.", [
    "Alerta: algo mudou",
    "Métrica: que e quanto",
    "Trace: onde",
    "Log: por quê"
  ], "O alerta avisa, a métrica mostra o tamanho, o trace do pedido mostra onde e o log do mesmo trace_id mostra por quê. O que se descobre vira alerta novo.");
  choice("t2", 6, 3, "Qual destes é um sintoma de 'ferramenta cara sem observabilidade'?", [
    "Logs sem trace_id, métricas sem o rótulo celula e um consumidor do Kafka que não repassa o traceparent.",
    "Um painel com poucos gráficos.",
    "Um serviço sem nenhum log.",
    "Uma métrica com poucos rótulos."
  ], 0, "Cada ferramenta funciona, mas nada liga os sinais: a linha do estoque existe e ninguém a acha, e o trace parte ao meio.");

  /* ---------- 3. Métricas ---------- */
  choice("t3", 1, 1, "Qual é o tipo certo de métrica para o tempo de resposta?", [
    "Contador.", "Gauge.", "Histograma.", "Log."
  ], 2, "O artigo cita 'tempos de resposta' como exemplo de gauge, mas o gauge guarda só o último valor e perde a distribuição. O histograma permite percentis.");
  choice("t3", 2, 2, "No histograma do 1063 (400 · 975 · 992 · 992 · 1.000 acumulados), quanto dá o p95 pela interpolação?", [
    "0,293 s.", "0,489 s.", "0,765 s.", "2,3125 s."
  ], 1, "A 950ª requisição cai no bucket de 0,25 a 0,5: 0,25 + (950 − 400) ÷ 575 × 0,25 = 0,489 s.");
  choice("t3", 3, 2, "Por que o p99 do 1063 (0,765 s) não mostra o episódio de 8 pedidos lentos?", [
    "Porque o p99 só conta requisições de Recife.",
    "Porque 8 em 1.000 é 0,8%, e o p99 descarta justamente os 10 mais lentos.",
    "Porque o histograma perdeu os dados.",
    "Porque o SLO é de 2 s."
  ], 1, "O p99,9 já vê os 8, mas dá 2,3125 s para um valor de uns 1,9 s: o bucket de 1 a 2,5 é largo.");
  choice("t3", 4, 2, "Quantas séries geram os rótulos servico (7) × rota (12) × status (6) × celula (4) num histograma de 11 séries por combinação?", [
    "2.016.", "22.176.", "264.", "33,3 bilhões."
  ], 1, "7 × 12 × 6 × 4 = 2.016 combinações × 11 = 22.176. Com o cliente_id (1,5 milhão) seriam 33,3 bilhões.");
  tf("t3", 5, 2, "A média dos p99 de cada réplica dá o p99 da frota.", false, "Percentil não se soma nem se tira a média: no módulo 14 a média deu 269 ms e o p99 verdadeiro era 2.000 ms. Somam-se os buckets e calcula-se de novo.");
  choice("t3", 6, 3, "Onde o cliente_id, o pedido_id e o trace_id devem ir?", [
    "Como rótulos da métrica.",
    "No log e no trace, e não na métrica.",
    "Só no alerta.",
    "Em nenhum lugar."
  ], 1, "São valores quase únicos: como rótulo, geram uma série por valor e derrubam o servidor de métricas.");

  /* ---------- 4. Logs ---------- */
  choice("t4", 1, 1, "Qual nível de log o artigo descreve como 'log de triagem'?", [
    "TRACE.", "WARN.", "ERROR.", "FATAL."
  ], 2, "O ERROR deve dizer o que falhou, por quê, onde e como correlacionar com o resto do fluxo.");
  choice("t4", 2, 2, "Quanto de log a loja gera por dia, num dia comum (5 pedidos/s e 40 req/s no catálogo)?", [
    "0,28 GB.", "2,81 GB.", "25,5 GB.", "255 GB."
  ], 1, "4,5 KB por pedido × 5/s = 22,5 KB/s, mais 40 × 250 B = 10 KB/s: 32,5 KB/s, ou 2,81 GB por dia.");
  choice("t4", 3, 2, "Com o DEBUG ligado (cerca de 10 vezes mais) e o pico da Black Friday o dia todo, o volume é de cerca de:", [
    "25,5 GB/dia.", "255 GB/dia.", "2,55 TB/dia.", "765 GB/dia."
  ], 1, "O pico dá 25,5 GB/dia (765 GB em 30 dias de retenção); o DEBUG leva a 255 GB/dia.");
  tf("t4", 4, 2, "O cliente_id pode ir no log, mas CPF e token devem ser mascarados na origem.", true, "O cliente_id basta para achar o pedido. Dado pessoal e segredo ficam indexados e retidos por semanas em um lugar que muita gente consulta.");
  choice("t4", 5, 3, "Na linha WARN do estoque, qual campo aponta a causa do atraso?", [
    "versao.", "celula.", "holder: contagem-estoque (holder_pid 4412).", "level."
  ], 2, "A espera por lock de 1.620 ms foi causada pela tarefa contagem-estoque, que segurava a linha CANECA-007.");
  choice("t4", 6, 3, "Por que estruturar o log em JSON com campos fixos?", [
    "Para o arquivo ficar menor em disco, sem nenhum outro efeito.",
    "Porque permite indexar só alguns campos (trace_id, level) e correlacionar, em vez de indexar o texto todo.",
    "Porque o JSON é mais rápido de escrever.",
    "Porque dispensa o trace_id."
  ], 1, "O custo é o maior desafio dos logs; campos fixos deixam indexar o que se busca e comprimir o resto.");

  /* ---------- 5. Traces ---------- */
  choice("t5", 1, 1, "O que é um span?", [
    "Um conjunto de logs de um serviço.",
    "Uma unidade de trabalho do trace, com início, duração, pai e atributos.",
    "Um tipo de métrica.",
    "Uma regra de alerta."
  ], 1, "O trace é a árvore de spans de uma requisição, de ponta a ponta, ligada por um trace_id.");
  choice("t5", 2, 2, "Qual é a forma do cabeçalho traceparent do W3C?", [
    "trace_id-span_id",
    "versão-trace_id-parent_id-flags (por exemplo, 00-9c1e5a7b…-a3c4d5e6f7a8b9c0-01)",
    "flags-versão-trace_id",
    "trace_id:parent_id:nível"
  ], 1, "O trace_id (32 hex) fica o mesmo em toda a viagem; o parent_id (16 hex) muda a cada salto.");
  choice("t5", 3, 2, "Que parte do tempo do 1063 (1.895 ms) o estoque ocupou?", [
    "21%.", "50%.", "86,5%.", "99%."
  ], 2, "1.640 ÷ 1.895 = 86,5%: 20 ms de trabalho e 1.620 ms de espera por lock. Os outros 7 spans não mudaram.");
  choice("t5", 4, 3, "Com head sampling de 1%, qual a chance de guardar pelo menos um dos 8 traces lentos?", [
    "1%.", "7,7%.", "50%.", "100%."
  ], 1, "1 − 0,99^8 = 7,7%. O tail sampling, que decide depois de ver o trace, guarda os 8.");
  choice("t5", 5, 3, "O consumidor do Kafka não repassa o traceparent. O que acontece com o trace do pedido 1063?", [
    "Nada: o Kafka guarda o contexto sozinho.",
    "Ele parte ao meio, e o PedidoCriado vira um trace órfão com outro trace_id.",
    "O trace fica mais rápido.",
    "O pedido é recusado."
  ], 1, "A propagação de contexto precisa passar pelos cabeçalhos da mensagem; perder um salto quebra a árvore.");
  tf("t5", 6, 2, "O tail sampling decide guardar o trace antes de ver a requisição.", false, "É o head que decide no começo. O tail espera o trace inteiro e guarda todo 5xx, todo acima de 800 ms e 1% do resto, ao custo de manter os spans num coletor.");

  /* ---------- 6. Alertas e APM ---------- */
  choice("t6", 1, 1, "Qual dos quatro alertas nunca dispara no incidente de 90 s do PSP-A?", [
    "A: erro > 5% por 5 min (for: 5m).",
    "B: erro > 5% por 1 min.",
    "C: sonda sintética (10 s × 3).",
    "D: burn rate de 14,4× em 1 h e 5 min."
  ], 0, "O incidente dura 90 s e a janela de 5 min nunca fecha. B pega em 60 a 75 s, C em 30 s e D em ~52 s.");
  choice("t6", 2, 2, "Qual é o MTTD da sonda sintética (a cada 10 s, 3 falhas seguidas)?", [
    "10 s.", "30 s.", "60 s.", "Nunca dispara."
  ], 1, "Três sondas falhando em sequência levam 30 s: é o MTTD do módulo 27.");
  choice("t6", 3, 2, "Com SLO 99,9% e erro de 100%, em quantos segundos de falha o burn rate de 14,4× (janela de 1 h) é atingido?", [
    "5,2 s.", "30 s.", "51,84 s.", "3.600 s."
  ], 2, "14,4 × 0,001 × 3.600 = 51,84 s. O burn rate de 100% de erro é 1.000× (1 ÷ 0,001).");
  choice("t6", 4, 3, "Com as defesas do módulo 21, o breaker abre em 1,3 s e falham ~39 de 2.700 pedidos. Por que nenhum alerta de página dispara?", [
    "Porque o alerta está desligado.",
    "Porque em 1 h o burn rate é 0,36× e em 5 min 4,3×, abaixo de 14,4×: o cliente quase não sentiu.",
    "Porque a sonda sintética não funciona.",
    "Porque o burn rate só vale sem breaker."
  ], 1, "O alerta D exige as duas janelas acima de 14,4×. O breaker_state aberto é a causa e vira ticket.");
  tf("t6", 5, 2, "O breaker_state aberto às 3 h da manhã deve acordar alguém.", false, "É causa, e não sintoma: vira ticket. Página para sintoma (o cliente sentiu), causa para depurar. Acordar por causa gera fadiga de alertas.");
  choice("t6", 6, 3, "O que o APM acrescenta aos três sinais?", [
    "Um quarto sinal, mais barato.",
    "Uma vista que organiza métricas, traces e logs em torno da experiência: operações, rotas, dependências e regressões por versão.",
    "Um substituto para o alerta.",
    "A garantia de SLA."
  ], 1, "O APM responde a 'quais operações regrediram depois do deploy?'. Não é outro sinal: é uma vista dos mesmos três.");

  /* ---------- 7. Service levels ---------- */
  choice("t7", 1, 1, "O que o SLI é, segundo a aula?", [
    "A meta interna do time.",
    "O contrato com o cliente.",
    "A medida: uma razão bons ÷ válidos, com o que conta como bom definido.",
    "O que sobra entre a meta e 100%."
  ], 2, "SLI mede, SLO mira e SLA promete. O orçamento de erro é o que sobra entre o SLO e 100%.");
  choice("t7", 2, 2, "Qual é o orçamento de erro do mês a 5 pedidos/s e SLO de 99,9%?", [
    "1.296 requisições ruins.", "12.960 requisições ruins (43,2 min).", "129.600 requisições ruins.", "2.700 requisições ruins."
  ], 1, "5 × 2.592.000 = 12.960.000 requisições; 0,1% = 12.960. Em tempo, 43,2 min de indisponibilidade total.");
  choice("t7", 3, 2, "Que fração do orçamento o PSP-A de 90 s sem proteção (2.700 falhas) queimaria?", [
    "0,06%.", "4,97%.", "20,8%.", "100%."
  ], 2, "2.700 ÷ 12.960 = 20,8%. A queda de SP queimou 4,97% (643,5) e o episódio do 1063, 0,06% (8).");
  choice("t7", 4, 3, "Por que o SLO (99,9%) deve ser mais exigente que o SLA (99,5%)?", [
    "Porque o SLA é secreto.",
    "Porque o SLO blinda o contrato: o time dispara o alerta antes de quebrar o SLA.",
    "Porque o SLO é medido por outra equipe.",
    "Porque o SLA não tem número."
  ], 1, "O artigo diz que 'a longo prazo o SLO deve virar o SLA', e a aula corrige: o SLO deve ficar mais restritivo, para proteger o contrato.");
  order("t7", 5, 2, "Ponha a política do orçamento na ordem, de quando sobra muito a quando zera.", [
    "Sobra mais de 50%: publicar normal",
    "Entre 50% e 10%: só correções e canary lento",
    "Menos de 10%: congelar o que não é correção",
    "Zerou: sala de guerra"
  ], "O orçamento é um sinal para o que a equipe faz: velocidade enquanto sobra, cautela depois, congelamento e prioridade de estabilidade.");
  choice("t7", 6, 3, "A 2.5.0 devolve 201, rápido, com frete 0,00. Como o SLI (2xx e até 800 ms) a trata?", [
    "Como ruim: o orçamento queima.",
    "Como bom: o orçamento não queima enquanto a loja perde R$ 15,00 por pedido em Recife.",
    "Como inválido.",
    "Dispara o burn rate de 14,4×."
  ], 1, "O SLI mediu a coisa errada. A saída é um SLI de negócio (pedidos_frete_zero) ou um SLI de diff contra a 2.4.0.");
  choice("t7", 7, 2, "Quanto do orçamento um burn rate de 14,4× em 1 h consome (período de 30 dias)?", [
    "0,2%.", "2%.", "5%.", "14,4%."
  ], 1, "consumo = burn × janela ÷ período = 14,4 × 1 ÷ 720 = 2%. Já 6× em 6 h = 5% e 1× em 3 dias = 10%.");

  /* ---------- 8. USE ---------- */
  choice("t8", 1, 1, "O que significam as letras do USE?", [
    "Usuário, Serviço e Erro.",
    "Utilização, Saturação e Erros, para cada recurso.",
    "Uptime, SLO e Eventos.",
    "Uso, Sinal e Estado."
  ], 1, "O método de Brendan Gregg olha recursos: CPU, memória, disco, rede, pools e filas.");
  choice("t8", 2, 2, "A frota do catálogo está a 67,5%. O que a média esconde?", [
    "Uma réplica a 99%: a catalogo-3, com 64,6 requisições em andamento.",
    "Nada: a frota está saudável.",
    "Um erro de DNS.",
    "A falta de réplicas."
  ], 0, "(9 × 64 + 99) ÷ 10 = 67,5%. A saturação (a fila) e os 504 apontam a réplica certa.");
  choice("t8", 3, 2, "No USE, o que é a saturação do pool de 20 conexões?", [
    "As conexões em uso ÷ 20.",
    "A espera por vaga (db_pool_waiting).",
    "Os 503 devolvidos.",
    "O tamanho do pool."
  ], 1, "Utilização é o uso (100% com o relatório), saturação é a fila e erros são os 503 do pool cheio.");
  tf("t8", 4, 3, "Com CPU a 20% e pool a 10%, o USE detecta que a 2.5.0 devolve frete 0,00.", false, "O USE só vê recurso: todo recurso está bem e o defeito está no serviço. É o limite do método, e o RED cobre parte do buraco.");
  choice("t8", 5, 3, "O lag do consumidor do Kafka é qual dimensão do USE?", [
    "Utilização.", "Saturação.", "Erros.", "Nenhuma: não é recurso."
  ], 1, "É o trabalho acumulado porque o consumidor não acompanha o tópico. Pode crescer com a CPU baixa.");

  /* ---------- 9. RED ---------- */
  choice("t9", 1, 1, "O que o RED mede para cada serviço?", [
    "Recurso, Erro e Disponibilidade.",
    "Rate, Errors e Duration.",
    "Latência, tráfego, erros e saturação.",
    "Utilização, saturação e erros."
  ], 1, "Rate (quantas requisições), Errors (quantas falham, pela definição semântica) e Duration (em percentil).");
  choice("t9", 2, 2, "Qual célula tem o maior Rate do pedidos na Black Friday (30 pedidos/s)?", [
    "celula-sp, 9,9.", "celula-rio, 4,5.", "celula-recife, 3,6.", "celula-mkt, 12,0."
  ], 3, "9,9 · 4,5 · 3,6 · 12,0 pedidos/s, somando 30. A célula do mkt-01 tem 40%.");
  choice("t9", 3, 2, "O que o artigo diz que conta como erro?", [
    "Só o 5xx.",
    "Tudo o que viola a expectativa: 5xx, timeout, resposta inválida, duplicidade, sucesso tardio (e o frete 0,00).",
    "Só os timeouts.",
    "Só o que o cliente reclamou."
  ], 1, "Os 4xx (409, 422, 429) são observados, mas ficam fora do SLO: nem todo código entra no SLO.");
  tf("t9", 4, 2, "O 409 de 'esgotado' entra no SLO como erro.", false, "É uma decisão legítima da loja: observado no painel, mas fora do SLO (assim como o 422 e o 429 do tenant).");
  choice("t9", 5, 3, "Com erro = só 5xx e Duration = só média, o que o painel RED mostra para a 2.5.0?", [
    "Vermelho: erros em 100%.",
    "Verde: Rate, Errors e Duration não mudam, e a loja perde R$ 15,00 por pedido em Recife.",
    "Amarelo, por causa da latência.",
    "Nada: o RED não funciona por versão."
  ], 1, "O RED só ajuda se erro for definido pelo domínio e Duration for percentil. Cortar por versão aponta o culpado.");

  /* ---------- 10. Quatro sinais de ouro ---------- */
  choice("t10", 1, 1, "Quais são os quatro sinais de ouro?", [
    "CPU, memória, disco e rede.",
    "Latência, tráfego, erros e saturação.",
    "Rate, Errors, Duration e SLO.",
    "Métricas, logs, traces e alertas."
  ], 1, "São RED + saturação, no nível do serviço, para descrever a saúde do que o usuário usa e dar a base do SLO.");
  choice("t10", 2, 2, "Com o breaker aberto, 30% das requisições falham em 2 ms e 70% respondem em 275 ms. Qual é a latência média?", [
    "275 ms.", "193 ms.", "138 ms.", "2 ms."
  ], 1, "0,3 × 2 + 0,7 × 275 = 193,1 ms: a média caiu enquanto o sistema piorou.");
  choice("t10", 3, 2, "Por que separar a latência do sucesso da latência do erro?", [
    "Porque erros nunca têm latência.",
    "Porque um erro rápido puxa a média para baixo e esconde o problema; um erro lento é pior que um rápido.",
    "Porque o Prometheus exige.",
    "Porque o SLA proíbe."
  ], 1, "É a correção ao artigo, que diz que a latência 'inclui tanto respostas bem-sucedidas quanto com erro': o SRE book pede para distinguir.");
  choice("t10", 4, 3, "Qual lente olha o quê?", [
    "USE, o usuário; RED, o recurso; quatro sinais, o serviço.",
    "USE, o recurso; RED, o serviço; quatro sinais, o usuário.",
    "As três olham o recurso.",
    "USE, o serviço; RED, o usuário; quatro sinais, o recurso."
  ], 1, "As três se completam: uma loja usa cada uma onde se encaixa.");
  tf("t10", 5, 2, "Com 300 painéis, a equipe consegue responder rápido se o sistema está saudável do ponto de vista do usuário.", false, "É o monitoramento por acúmulo: sem um modelo mental coeso, ninguém responde sem abrir dez painéis. Quatro sinais por célula dão por onde começar.");
  choice("t10", 6, 3, "O que é saturação com previsão?", [
    "A saturação medida a cada 5 minutos.",
    "O recurso mais apertado e o tempo que falta: 'o disco enche em 4 h'.",
    "A saturação do pior mês.",
    "A média da saturação da frota."
  ], 1, "É o sinal mais útil para agir antes de o problema chegar ao usuário.");

  window.QUIZ = out;
})();
