/* Banco de perguntas do quiz de Patterns de Resiliência.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-resiliencia-em-arquitetura", name: "Resiliência em arquitetura" },
    t2: { topic: "aula-2-metricas-de-disponibilidade", name: "Métricas de disponibilidade" },
    t3: { topic: "aula-3-blast-radius", name: "Blast radius" },
    t4: { topic: "aula-4-replicacao-balanceamento-e-healthchecks", name: "Replicação, balanceamento e healthchecks" },
    t5: { topic: "aula-5-idempotencia", name: "Idempotência" },
    t6: { topic: "aula-6-timeouts", name: "Timeouts" },
    t7: { topic: "aula-7-estrategias-de-retry", name: "Estratégias de retry" },
    t8: { topic: "aula-8-circuit-breakers", name: "Circuit breakers" },
    t9: { topic: "aula-9-fallbacks", name: "Fallbacks" },
    t10: { topic: "aula-10-graceful-degradation", name: "Graceful degradation" },
    t11: { topic: "aula-11-backpressure-emergencial", name: "Backpressure emergencial" },
    t12: { topic: "aula-12-resiliencia-na-camada-de-dados", name: "Resiliência na camada de dados" },
    t13: { topic: "aula-13-sharding-e-bulkheads", name: "Sharding e bulkheads" }
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

  /* ---------- 1. Resiliência em arquitetura ---------- */
  choice("t1", 1, 1, "O que é resiliência?", [
    "Nunca ter falhas.",
    "Continuar funcionando, total ou parcialmente, quando uma peça falha.",
    "Ter mais servidores que o necessário.",
    "Medir quanto tempo o sistema ficou no ar."
  ], 1, "Resiliência é o conjunto de estratégias que mantém o sistema de pé quando algo falha. Medir o tempo no ar é a disponibilidade.");
  choice("t1", 2, 2, "O que muda no incidente das 20:20 de Black Friday?", [
    "O PSP-A sai do ar por 90 s.",
    "O PSP-A passa de p50 180 ms para 8 s e fica assim por 90 s.",
    "O pagamentos perde uma réplica.",
    "O banco de SP cai por 35 s."
  ], 1, "O PSP-A responde, mas devagar: de 20:20:00 a 20:21:30. É pior que cair, porque cada chamada ocupa uma conexão por 8 s.");
  choice("t1", 3, 3, "Sem nenhuma defesa, o pool de 50 do pagamentos esgota em quanto tempo, com o PSP-A a 8 s e 30 pedidos/s?", [
    "8 s.",
    "50 ÷ 30 = 1,67 s.",
    "90 s.",
    "Nunca esgota."
  ], 1, "Entram 30 conexões por segundo e nenhuma sai por 8 s. O pool de 50 acaba em 1,67 s e derruba o checkout todo.");
  choice("t1", 4, 2, "Qual dos fios soltos do curso é o 'evento duplicado'?", [
    "O fallback sem recomendações do módulo 9.",
    "O PedidoPago e-502 entregue duas vezes no módulo 6: o estoque foi de 3 para 2 e para 1.",
    "As 27 chamadas por clique do módulo 10.",
    "O timeout de 2 s do módulo 12."
  ], 1, "Os quatro fios: e-502 duplicado (aula 5), 27 chamadas (aula 7), fallback sem recomendações (aulas 9 e 10) e o timeout com a c-7731 já cobrada (aulas 5 e 6).");
  tf("t1", 5, 1, "A resiliência e a disponibilidade são a mesma coisa.", false, "A disponibilidade mede (respostas boas, tempo no ar). A resiliência é o conjunto de estratégias que a mantém.");

  /* ---------- 2. Métricas de disponibilidade ---------- */
  choice("t2", 1, 1, "40 erros em 1.000 requisições. Qual é a disponibilidade por uso?", [
    "4%.", "40%.", "96%.", "99,6%."
  ], 2, "A taxa de erro é 4% e a disponibilidade é 100% − 4% = 96%.");
  choice("t2", 2, 2, "Quanto 99,9% por mês deixa fora do ar (30 dias)?", [
    "432 min.", "43,2 min (2.592 s).", "4,32 min.", "25,9 s."
  ], 1, "43.200 min × 0,1% = 43,2 min. 99% são 432 min, 99,99% são 4,32 min e 99,999%, 25,9 s.");
  choice("t2", 3, 2, "Quatro saltos em série a 99,9% cada. Qual é a disponibilidade da cadeia?", [
    "99,9%.", "99,6006% (172,5 min por mês).", "99,99%.", "100% − 4 × 99,9%."
  ], 1, "Em série multiplica: 0,999⁴ = 0,996006. Cada salto a mais custa um pedaço do mês.");
  choice("t2", 4, 3, "Dois PSPs a 99,5% cada, independentes, em paralelo. Qual é a disponibilidade?", [
    "99,5%.", "99%.", "99,9975% (1 − 0,005²).", "199%."
  ], 2, "Em paralelo só falha quando os dois caem: 0,005 × 0,005 = 0,000025. O mês cai de 216 min para 1,08 min.");
  choice("t2", 5, 3, "O incidente de 90 s deu 2.700 falhas em 12.960.000 tentativas do mês. Qual é o número por uso?", [
    "99,9965%.", "99,979%.", "97,3%.", "99,9%."
  ], 1, "1 − 2.700 ÷ 12.960.000 = 99,979%. Por tempo, o mesmo incidente dá 99,9965% (1,5 min de 43.200).");
  tf("t2", 6, 3, "Uma resposta 200 em 8 s conta como sucesso para o SLI sem limite de latência, e como falha para o cliente.", true, "Por isso o SLI precisa de um limite, como 'respondeu em até 1 s'. Contar só 5xx esconde os timeouts do cliente.");
  choice("t2", 7, 3, "Com SLO de 99,9% por uso, quantas falhas o mês permite, e quanto o incidente de 90 s queimou?", [
    "1.296 falhas; 208%.", "12.960 falhas; 2.700 delas, ou 20,8%.", "129.600 falhas; 2,1%.", "2.700 falhas; 100%."
  ], 1, "0,1% de 12.960.000 = 12.960. As 2.700 do incidente são 20,8%; um incidente de 5 min sem proteção (9.000) queimaria 69,4%.");

  /* ---------- 3. Blast radius ---------- */
  choice("t3", 1, 1, "O que é o blast radius?", [
    "O número de réplicas do serviço.",
    "O tanto da loja que para quando um componente falha.",
    "O tempo para recuperar o serviço.",
    "A taxa de erro por minuto."
  ], 1, "É o tamanho do estrago. Projetar é fazê-lo pequeno e conhecido.");
  choice("t3", 2, 2, "Com carga uniforme, quanto afeta uma falha em 1 de 10 compartimentos?", [
    "1%.", "10%.", "33,3%.", "50%."
  ], 1, "1/N: N = 3 dá 33,3%, 10 dá 10%, 100 dá 1% e 1.000 dá 0,1%.");
  choice("t3", 3, 3, "O mkt-01 tem 40% das linhas e mora no shard-2 (de 3). Quanto das linhas some se o shard-2 cai?", [
    "33,3%.", "40%.", "60%.", "20%."
  ], 2, "0,4 + 0,6 ÷ 3 = 60%. Os shards 0 e 1 levam 20% cada. A conta de 1/N só vale com carga uniforme.");
  choice("t3", 4, 2, "Se o pagamentos cai, qual é o raio?", [
    "Só a seção de recomendações.",
    "Todo checkout para; a navegação segue.",
    "A loja inteira sai do ar.",
    "Só 10% da capacidade."
  ], 1, "O pagamentos é caminho obrigatório do checkout. Quem só navega continua vendo o catálogo.");
  tf("t3", 5, 3, "O catálogo, usado pelo bff-app e pelo bff-web, é uma dependência escondida: sua queda apaga os dois canais.", true, "Duas peças que parecem separadas dividem o mesmo raio. Dependência escondida soma raios.");

  /* ---------- 4. Replicação, balanceamento e healthchecks ---------- */
  choice("t4", 1, 1, "Healthcheck de 5 s com 3 falhas seguidas. Em quanto tempo uma réplica travada sai do pool?", [
    "5 s.", "8 s.", "15 s.", "60 s."
  ], 2, "5 s × 3 = 15 s. Nesse tempo a réplica ainda recebe tráfego.");
  choice("t4", 2, 2, "Uma das 10 réplicas do catálogo trava a 640 req/s. Quantas requisições se perdem em 15 s?", [
    "225.", "640.", "960.", "9.600."
  ], 2, "Cada réplica recebia 64 req/s: 64 × 15 = 960. No pagamentos (2 réplicas, 30/s) são 15 × 15 = 225.");
  choice("t4", 3, 2, "O que distingue o healthcheck profundo do raso?", [
    "O profundo é mais rápido.",
    "O profundo confere dependências (como o PSP); o raso confere que o processo responde.",
    "O raso só roda de madrugada.",
    "Não há diferença."
  ], 1, "O profundo parece mais honesto, mas ejeta a réplica por um problema que não é dela.");
  choice("t4", 4, 3, "O healthcheck do pagamentos consulta o PSP, que está a 8 s. O que acontece?", [
    "Só uma réplica sai do pool.",
    "As duas réplicas ficam doentes juntas e saem; abaixo de 50% o Envoy entra em pânico e manda para todas.",
    "O PSP é reiniciado.",
    "Nada: o healthcheck ignora a dependência."
  ], 1, "Ejetar quem não tem culpa não ajuda. A dependência ruim se trata com breaker e fallback.");
  tf("t4", 5, 3, "O healthcheck que tira a réplica do pool deve conferir só o que a réplica controla.", true, "Memória, fila e processo vivo, sim. PSP, não: a dependência é compartilhada e trata-se com breaker e fallback.");

  /* ---------- 5. Idempotência ---------- */
  choice("t5", 1, 1, "O que é idempotência?", [
    "Responder em menos de 1 s.",
    "Repetir a operação e obter o mesmo resultado.",
    "Cifrar o corpo da requisição.",
    "Guardar o evento para sempre."
  ], 1, "É o que torna seguro repetir, e por isso vem antes do timeout e do retry.");
  choice("t5", 2, 2, "A chave do Caio chega pela 2ª vez à tabela idempotencia. O que o INSERT … ON CONFLICT DO NOTHING devolve?", [
    "1 linha (INSERT 0 1).",
    "0 linhas (INSERT 0 0) e a resposta guardada volta.",
    "Erro de sintaxe.",
    "A linha duplicada."
  ], 1, "A 1ª chegada devolve 1 linha e executa. A repetição devolve 0 e usa a resposta de antes: o mesmo pedido 1058.");
  choice("t5", 3, 2, "Mesma Idempotency-Key, corpo diferente. Qual é a resposta?", [
    "201, como a primeira.", "422: o hash do corpo não bate.", "200 com o corpo novo.", "500."
  ], 1, "A mesma chave com outro corpo não é repetição, é erro do cliente.");
  choice("t5", 4, 3, "O app gera um UUID novo a cada tentativa. O que acontece?", [
    "A chave funciona normalmente.",
    "Cada tentativa vira uma intenção nova: dois pedidos e duas cobranças.",
    "O servidor recusa com 422.",
    "O banco trava."
  ], 1, "A chave nasce uma vez por intenção, antes da primeira chamada, e se repete nas seguintes.");
  choice("t5", 5, 2, "Quanto a Idempotency-Key acrescenta à requisição?", [
    "5 B.", "57 B.", "157 B.", "267 B."
  ], 1, "O cabeçalho Idempotency-Key: \"3f9a2c7e-…\"\\r\\n tem 57 bytes: a requisição de 210 B vira 267 B.");

  /* ---------- 6. Timeouts ---------- */
  choice("t6", 1, 1, "Para o PSP-A (p50 180 ms, p99 400 ms, p99,9 700 ms), qual é o timeout certo?", [
    "180 ms.", "400 ms.", "1 s (o p99,9 com folga).", "8 s."
  ], 2, "A AWS manda escolher o percentil de um % aceitável de falsos timeouts. Com 0,1%, é o p99,9 mais folga: 1 s.");
  choice("t6", 2, 2, "Pool de 50, 30 req/s, timeout de 2 s. Quantas chamadas ficam em voo?", [
    "30.", "50.", "60: satura.", "240."
  ], 2, "Little: em voo = taxa × tempo = 30 × 2 = 60, mais que as 50 conexões.");
  choice("t6", 3, 2, "Qual é o timeout crítico do pagamentos?", [
    "50 × 30 = 1.500 s.", "50 ÷ 30 = 1,67 s.", "30 ÷ 50 = 0,6 s.", "8 s."
  ], 1, "Pool ÷ taxa. Acima de 1,67 s o pool satura.");
  choice("t6", 4, 3, "Por que o timeout de 2 s do módulo 10 foi trocado por 1 s?", [
    "Porque o PSP ficou mais rápido.",
    "Porque 2 s mantém 60 chamadas em voo num pool de 50 a 30/s: satura.",
    "Porque 1 s é o padrão da AWS.",
    "Porque o gw-loja pediu."
  ], 1, "O 2 s foi escolhido sem a conta de capacidade. O 1 s vem do p99,9 e mantém 30 em voo.");
  choice("t6", 5, 3, "Três tentativas de 1 s mais as esperas de 0,1 s e 0,2 s somam 3,3 s. O gw-loja espera 3 s. O que acontece?", [
    "Nada: o gw-loja espera.",
    "O gw-loja desiste e o pagamentos segue trabalhando para ninguém (trabalho órfão).",
    "O PSP cancela a cobrança.",
    "O breaker abre."
  ], 1, "O de fora desiste antes de o de dentro terminar. A saída é a 2ª tentativa receber só o que sobra: 2,0 − 1,0 − 0,1 = 0,9 s.");
  tf("t6", 6, 2, "Depois de um timeout, é seguro assumir que a operação não aconteceu.", false, "O timeout só diz 'parei de esperar'. A cobrança c-7731 já existia no PSP.");

  /* ---------- 7. Estratégias de retry ---------- */
  choice("t7", 1, 1, "Quais são as esperas do backoff exponencial da loja (base 100 ms)?", [
    "100, 100, 100, 100 ms.", "100, 200, 400, 800, 1.600 ms.", "1, 2, 4, 8, 16 s.", "0 a 4 s, 2 a 6 s, 6 a 10 s."
  ], 1, "A espera dobra a cada falha, com teto de 2 s. O artigo usa 1, 2, 4, 8, 16 s e um 'jitter incremental' que não é nenhum dos três da AWS.");
  choice("t7", 2, 3, "Mil clientes, PSP fora por 2 s. O que mostra a simulação do backoff exponencial sem jitter?", [
    "Pico de 84 por 100 ms e 1.000 concluídos.",
    "Ondas sincronizadas de 1.000 e só 40 clientes (4%) concluem no prazo.",
    "45.500 chamadas.",
    "Nenhuma chamada."
  ], 1, "Sem jitter todos esperam o mesmo tempo e voltam juntos. Com full jitter o pico cai para 84 e concluem 1.000.");
  choice("t7", 3, 2, "O que o intervalo fixo de 100 ms faz com 1.000 clientes?", [
    "Poucas chamadas.", "45.500 chamadas (45,5 por cliente), 24.500 recusadas com o PSP de pé.", "Pico de 84.", "Conclui só 4%."
  ], 1, "Fecha todo mundo, mas na força bruta. É a tempestade.");
  choice("t7", 4, 3, "3 camadas repetem 3 vezes cada. Quantas chamadas chegam ao pagamentos por clique, e quanto é isso a 30 pedidos/s?", [
    "9; 270/s.", "27; 810/s sobre 40/s.", "81; 2.430/s.", "3; 90/s."
  ], 1, "3 × 3 × 3 = 27. 30 × 27 = 810/s, ou 20,2 vezes a capacidade de 40/s.");
  order("t7", 5, 3, "Coloque na ordem as defesas contra a amplificação de retries:", [
    "Repetir só em uma camada (a de fora).",
    "Limitar com um orçamento de retry (10% das chamadas).",
    "Repetir só se sobrar prazo.",
    "Repetir só o que é idempotente (com Idempotency-Key)."
  ], "As quatro defesas da aula. A ordem é a de leitura: onde repetir, quanto, até quando e o quê.");
  tf("t7", 6, 2, "O retry imediato 'resolve a maior parte dos casos' também na falha de uma dependência.", false, "Na falha da dependência ele é a causa da tempestade. Faltam amplificação, orçamento, prazo e só idempotente.");

  /* ---------- 8. Circuit breakers ---------- */
  choice("t8", 1, 1, "Quais são os três estados do circuit breaker?", [
    "Ligado, desligado e quebrado.", "Fechado, aberto e meio-aberto.", "Leve, médio e pesado.", "Passa, bloqueia e dorme."
  ], 1, "Fechado passa e conta; aberto falha rápido; meio-aberto deixa passar 5 sondas.");
  choice("t8", 2, 2, "O breaker do pagamentos (janela 20, mínimo 10, 50%). Em que instante ele abre com o PSP-A a 8 s e timeout de 1 s?", [
    "0 s.", "1,3 s.", "30 s.", "90 s."
  ], 1, "As 10 primeiras chamadas falham por timeout entre 1,0 e 1,3 s: mínimo de 10 atingido, 100% de falha.");
  choice("t8", 3, 3, "Quantas chamadas o PSP-A recebe em 100 s, com e sem breaker?", [
    "237 com, 3.000 sem.", "3.000 com, 237 sem.", "30 com, 300 sem.", "2.763 com, 237 sem."
  ], 0, "Sem breaker, as 3.000 chamadas, 2.700 inúteis. Com breaker, 237; as outras 2.763 são falhas rápidas.");
  choice("t8", 4, 3, "Por que a chamada lenta (mais de 1 s) conta como falha?", [
    "Porque 1 s é a regra do HTTP.",
    "Porque senão o PSP responde em 8 s 'com sucesso' e o breaker nunca abre.",
    "Porque economiza chamadas.",
    "Porque o breaker não mede tempo."
  ], 1, "A lentidão esgota o pool igual a um erro. Um breaker que só conta erro não protege contra isso.");
  choice("t8", 5, 3, "Com timeout de 2 s em vez de 1 s, o breaker abre quando?", [
    "Em 1,3 s.", "Em 2,3 s, e 11 chamadas ainda são recusadas pelo pool.", "Nunca.", "Em 8 s."
  ], 1, "O timeout longo atrasa o breaker: as primeiras chamadas só falham depois dos 2 s.");
  tf("t8", 6, 2, "O PSP-A e o PSP-B devem compartilhar o mesmo circuit breaker.", false, "Um breaker por dependência. O estado do breaker do PSP-A é o que dispara o fallback para o PSP-B.");

  /* ---------- 9. Fallbacks ---------- */
  choice("t9", 1, 1, "O que é um fallback?", [
    "Um backup do banco de dados.",
    "Um caminho alternativo para o mesmo objetivo, que sacrifica algo.",
    "Outro nome do retry.",
    "Desligar a funcionalidade."
  ], 1, "O fallback troca o caminho (a degradação reduz a funcionalidade). Sempre sacrifica custo, precisão ou consistência.");
  choice("t9", 2, 2, "Qual é o frete de tabela de Recife, SP e Rio, usado se a cotação da transportadora falha?", [
    "9,00 · 15,00 · 12,00.", "15,00 · 9,00 · 12,00.", "12,00 · 12,00 · 12,00.", "0,00 para todos."
  ], 1, "Recife 15,00, SP 9,00 e Rio 12,00. O 1058 do Caio, no Rio, paga 12,00.");
  choice("t9", 3, 3, "Parceiro A a R$ 0,03 e B a R$ 0,10 por consulta, a 30/s em 10 min. Qual é o custo extra do B?", [
    "R$ 540.", "R$ 1.260.", "R$ 1.800.", "R$ 18.000."
  ], 1, "18.000 consultas: R$ 540 (A) contra R$ 1.800 (B): +R$ 1.260.");
  choice("t9", 4, 2, "Quanto tráfego trafega no fallback proativo de 1%, a 30 pedidos/s?", [
    "30/s.", "3/s.", "0,3/s: 18 por minuto.", "1.800/min."
  ], 2, "30 × 1% = 0,3/s, ou 18 por minuto no PSP-B. Mantém o fallback aquecido e testado.");
  choice("t9", 5, 3, "O PSP-B está com a credencial vencida e ninguém sabia. Quando se descobre?", [
    "Num teste de domingo.",
    "Às 20:20, com 100% do tráfego em cima dele.",
    "Nunca.",
    "No próximo deploy."
  ], 1, "O fallback raramente usado tem defeito latente. A AWS prefere caminhos exercitados continuamente: o proativo.");
  tf("t9", 6, 3, "Mandar todo o tráfego ao fallback é sempre seguro, porque ele é o plano B.", false, "Com capacidade menor, o fallback cai também. Limite-o com um breaker próprio e uma fila.");

  /* ---------- 10. Graceful degradation ---------- */
  choice("t10", 1, 1, "O que é degradar com elegância?", [
    "Reiniciar o serviço.",
    "Desligar de propósito o que não é essencial para proteger o essencial, antes de cair.",
    "Trocar de PSP.",
    "Responder mais devagar."
  ], 1, "A degradação reduz a funcionalidade; o fallback troca o caminho.");
  choice("t10", 2, 2, "O catálogo aguenta 1.000 req/s (10 réplicas × 100). A demanda é 1.300. Qual nível mínimo segura?", [
    "0.", "1 (sem recomendações: 1.333).", "2 (1.667).", "3 (só a CDN)."
  ], 1, "Nível 1: 7,5 ms por página, 133 req/s por réplica, 1.333 no total. Já fecha a conta.");
  choice("t10", 3, 3, "Os 1.300 req/s são o pico sustentado da Black Friday?", [
    "Sim: o módulo 14 mediu 1.300.",
    "Não: é uma rajada de poucos segundos (newsletter); o pico medido é 640 e o projetado 950.",
    "Sim, mas só no Rio.",
    "Não: é a média do mês."
  ], 1, "O HPA leva minutos para ir de 10 para 14 réplicas (1.400 req/s). A degradação compra esse tempo.");
  order("t10", 4, 2, "Em que ordem se desliga? (do primeiro a desligar ao último)", [
    "Relatórios (SHEDDABLE).",
    "Recomendações e 'meus pedidos' (SHEDDABLE_PLUS).",
    "Catálogo (CRITICAL).",
    "Checkout (CRITICAL_PLUS)."
  ], "O checkout é o último a sair. A ordem é decisão de produto, escrita antes do incidente.");
  choice("t10", 5, 3, "A toggle fica no nível 2 depois do pico e a loja vende sem avaliações por semanas. O que faltou?", [
    "Mais réplicas.", "Histerese e um dono para a volta.", "Um segundo PSP.", "Nada: é esperado."
  ], 1, "Todo desligamento precisa de volta: um tempo abaixo do limite e alguém responsável.");

  /* ---------- 11. Backpressure emergencial ---------- */
  choice("t11", 1, 1, "O que é backpressure?", [
    "O consumidor avisar o produtor para desacelerar.",
    "Aumentar a pressão do banco.",
    "Enfileirar tudo em memória.",
    "Repetir a chamada."
  ], 0, "Exige fila limitada e um sinal (429, pausa, request(n)).");
  choice("t11", 2, 2, "Chegam 120 eventos/s e saem 100. Em quanto tempo uma fila limitada de 5.000 enche?", [
    "50 s.", "250 s (4 min 10 s).", "600 s.", "Nunca."
  ], 1, "O déficit é 20/s: 5.000 ÷ 20 = 250 s.");
  choice("t11", 3, 3, "Com a fila ilimitada, qual é o atraso depois de 10 min, e quanto leva para drenar (chegada cai a 20/s)?", [
    "12 s; 12 s.", "120 s e crescendo; 150 s.", "250 s; 250 s.", "0; 0."
  ], 1, "12.000 eventos ÷ 100/s = 120 s. Drenar: 12.000 ÷ (100 − 20) = 150 s.");
  choice("t11", 4, 2, "O que significa descartar por prioridade (load shedding)?", [
    "Apagar a fila inteira.",
    "Sob sobrecarga, recusar cedo o SHEDDABLE (marketing, relatório) em vez de atrasar tudo.",
    "Recusar o cliente mais antigo.",
    "Dobrar a capacidade."
  ], 1, "Recusar o que menos importa mantém o pedido pago a salvo.");
  tf("t11", 5, 3, "'Enfileirar em memória' sem limite é uma forma de backpressure.", false, "Fila ilimitada esconde a sobrecarga: o atraso cresce, a memória enche e o processo morre com a fila dentro.");

  /* ---------- 12. Resiliência na camada de dados ---------- */
  choice("t12", 1, 1, "Qual é o RTO e o RPO da promoção do primário de SP?", [
    "RTO de 35 s; RPO de 9 (Rio) ou 24 (Recife) pedidos.", "RTO de 9 s; RPO de 35 pedidos.", "RTO de 24 s; RPO de 9 s.", "RTO e RPO de zero."
  ], 0, "RTO é o tempo até voltar; RPO é o dado perdido. A 30 pedidos/s, 35 s deixam 1.050 tentativas sem primário.");
  choice("t12", 2, 2, "O catálogo recebe 640 req/s com 80% de acerto. Quanto chega à origem?", [
    "64 req/s.", "128 req/s.", "512 req/s.", "640 req/s."
  ], 1, "640 × 20% = 128. Se o cache esfria, os 640 caem de uma vez.");
  choice("t12", 3, 2, "O que o stale-if-error (RFC 5861) permite?", [
    "Que o cache sirva o conteúdo velho por um prazo quando a origem falha.",
    "Que o cache nunca expire.",
    "Que a CDN apague o conteúdo.",
    "Que o banco volte mais rápido."
  ], 0, "O cache sobrevive à origem. Servir o preço velho por 10 min é aceitável porque o comando revalida o preço vigente.");
  choice("t12", 4, 3, "O banco volta depois de 5 min e todas as chaves expiraram juntas. O que acontece?", [
    "Nada.", "Estouro de cache: 640 req/s caem na origem de uma vez.", "O cache fica mais rápido.", "O primário muda."
  ], 1, "O conserto: TTL com jitter e stale-while-revalidate.");
  tf("t12", 5, 2, "Servir o preço de 79,90 do cache por 10 min é seguro porque o comando do pedido revalida o preço vigente.", true, "A leitura pode atrasar; o dinheiro, não (módulo 18).");

  /* ---------- 13. Sharding e bulkheads ---------- */
  choice("t13", 1, 1, "Qual é a diferença entre sharding e bulkhead?", [
    "São a mesma coisa.",
    "Sharding isola dados e clientes; bulkhead isola recursos (pools, filas) e dependências.",
    "Sharding é do Kafka e bulkhead é do banco.",
    "Bulkhead é mais antigo."
  ], 1, "São eixos diferentes. O shuffle sharding é o que liga os dois.");
  choice("t13", 2, 3, "Pool compartilhado de 100, PSP a 8 s, 30 pedidos/s. Em quanto o pool esgota e quem fica de fora?", [
    "3,33 s; o PSP, a cotação de frete e o e-mail.", "1,67 s; só o PSP.", "8 s; ninguém.", "100 s; só o PSP."
  ], 0, "100 ÷ 30 = 3,33 s. A cotação e o e-mail, que são rápidos, também não passam.");
  choice("t13", 3, 3, "Com bulkheads de 50/30/20, o que muda?", [
    "Nada.", "Só o pool do PSP esgota, em 1,67 s; frete e e-mail seguem.", "Todos esgotam em 1,67 s.", "O PSP volta mais rápido."
  ], 1, "50 ÷ 30 = 1,67 s. As paredes limitam o raio ao PSP.");
  choice("t13", 4, 2, "Quantos pares existem no shuffle sharding de 2 réplicas em 10?", [
    "10.", "20.", "45.", "90."
  ], 2, "C(10, 2) = 45. O cliente barulhento derruba só quem tem o mesmo par.");
  choice("t13", 5, 3, "Qual destes é um jeito de o bulkhead falhar?", [
    "Ter um pool por dependência.",
    "Um bulkhead pequeno demais (30 conexões para um pico de 40 em voo) recusa tráfego legítimo.",
    "Dividir por prioridade.",
    "Usar um breaker."
  ], 1, "Outros jeitos: o isolamento furado (dois pools dependendo do mesmo banco) e a carga desigual (o mkt-01).");
  tf("t13", 6, 2, "Um lease é uma concessão com prazo que o cliente precisa renovar.", true, "Se não renova, o recurso volta ao pool: a conexão com heartbeat, a partição do consumidor Kafka.");

  window.QUIZ = out;
})();
