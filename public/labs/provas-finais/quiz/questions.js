/* Banco de perguntas da prova final (80 perguntas de múltipla escolha).
   Cada pergunta traz o módulo de origem (no explain e em `mods`) e o bloco (b1..b7; i = integradora).
   Os números são os publicados nos módulos 1 a 28 (docs/escrita/provas-finais-brief.md): se um número mudar lá, muda aqui.
   `answer` é sempre o índice da certa; o quiz embaralha as opções a cada pergunta. */
(function () {
  var MOD = {
    1: ["protocolos-de-rede", "Protocolos de Rede"], 2: ["storage-raid-io", "Storage, RAID e I/O"], 3: ["cap-acid-base", "CAP, ACID e BASE"],
    4: ["databases", "Databases e Indexação"], 5: ["cache", "Estratégias de Cache"], 6: ["microsservicos", "Microsserviços"],
    7: ["load-balancers", "Load Balancers"], 8: ["api-gateways", "API Gateways"], 9: ["bff", "BFF"], 10: ["service-mesh", "Service Mesh"],
    11: ["concorrencia", "Concorrência e Paralelismo"], 12: ["comunicacao-sincrona", "Comunicação Síncrona"], 13: ["comunicacao-assincrona", "Comunicação Assíncrona"],
    14: ["performance", "Performance"], 15: ["scale-cube", "Scale Cube"], 16: ["sharding", "Sharding"], 17: ["replicacao", "Replicação de Dados"],
    18: ["cqrs", "CQRS"], 19: ["saga", "Saga Pattern"], 20: ["event-sourcing", "Event Sourcing"], 21: ["resiliencia", "Patterns de Resiliência"],
    22: ["deployment", "Modelos de Deployment"], 23: ["capacity-planning", "Capacity Planning"], 24: ["testes-de-carga", "Testes de Carga"], 25: ["bulkhead", "Bulkhead Pattern"],
    26: ["cell-based", "Cell-Based Architecture"], 27: ["disaster-recovery", "SPoF e Disaster Recovery"], 28: ["observabilidade", "Observabilidade"]
  };
  var BLOCKS = {
    b1: { name: "Bloco 1 · A loja de um servidor", range: "módulos 1 a 5" },
    b2: { name: "Bloco 2 · Partir e ligar", range: "módulos 6 a 10" },
    b3: { name: "Bloco 3 · Conversar e disputar", range: "módulos 11 a 13" },
    b4: { name: "Bloco 4 · Crescer e espalhar", range: "módulos 14 a 17" },
    b5: { name: "Bloco 5 · Consistência e resiliência", range: "módulos 18 a 21" },
    b6: { name: "Bloco 6 · Mudar, planejar, testar, isolar", range: "módulos 22 a 25" },
    b7: { name: "Bloco 7 · Células, desastre e sinais", range: "módulos 26 a 28" },
    i: { name: "Integradoras", range: "vários módulos" }
  };
  var out = [];
  var seq = 0;
  function from(mods) {
    if (mods.length === 1) return "Módulo " + mods[0] + " (" + MOD[mods[0]][1] + "). ";
    return "Módulos " + mods.join(", ").replace(/, (\d+)$/, " e $1") + ". ";
  }
  function q(block, mods, prompt, right, wrongs, explain) {
    seq++;
    var b = BLOCKS[block];
    out.push({
      id: "p" + (seq < 10 ? "0" : "") + seq,
      group: block,
      topic: MOD[mods[0]][0],
      topicName: b.name,
      mods: mods,
      modSlugs: mods.map(function (n) { return MOD[n][0]; }),
      type: "choice",
      level: 2,
      prompt: prompt,
      options: [right].concat(wrongs),
      answer: 0,
      explain: from(mods) + explain
    });
  }

  /* ---------- Bloco 1: módulos 1 a 5 ---------- */
  q("b1", [1], "A foto de 313 KB, em segmentos de até 1.460 B, vira quantas fatias?", "215", ["150", "313", "1.460"],
    "313 KB ÷ 1.460 B dá ~214,4, e o último segmento fica incompleto: 215 fatias.");
  q("b1", [1], "Quanto custa cada ida e volta Recife–SP na história?", "80 ms", ["8 ms", "800 ms", "10 ms"],
    "O RTT de Recife até SP é de 80 ms (SP–Rio é 10 ms). A célula de Recife do módulo 26 tira essa viagem do caminho.");
  q("b1", [2], "O D2 queima num RAID 0 de 4 discos. O que acontece com o pedidos.db?", "Perde-se tudo: sem redundância, cada bloco só existe num disco", ["Perde-se só um quarto, e o resto continua", "Recupera pela paridade", "O espelho cobre o disco que queimou"],
    "O RAID 0 só divide (stripe), então todo arquivo tem blocos no D2. Por isso o pedidos.db foi para o RAID 10.");
  q("b1", [2], "Quantos I/Os custa uma escrita pequena no RAID 5?", "4", ["1", "2", "6"],
    "RAID 0, 1, 5, 6 e 10 custam 1, 2, 4, 6 e 2 I/Os: no RAID 5 lê-se o dado e a paridade e gravam-se os dois.");
  q("b1", [2], "O que o RAID 6 tem a mais que o RAID 5, e o que paga?", "Segunda paridade (Q): tolera 2 discos, escrita pequena de 6 I/Os", ["Um espelho: tolera 2 discos com 2 I/Os", "Uma segunda cópia em outro site, sem custo", "Mais velocidade de leitura, com a mesma escrita de 4 I/Os"],
    "A paridade Q deixa o conjunto sobreviver a 2 discos queimados, e a escrita pequena sobe de 4 para 6 I/Os.");
  q("b1", [3], "Os três bancos (SP, Rio, Recife) perdem a rede entre si. O CAP obriga a escolher entre…", "Consistência e disponibilidade (durante a partição)", ["Consistência e partição", "Latência e custo", "Disponibilidade e partição, só no desastre"],
    "A partição acontece: a escolha é recusar (C) ou aceitar e divergir (A). Fora da partição, o PACELC fala de latência × consistência.");
  q("b1", [3], "Com 3 sites, qual é a maioria (quórum)?", "2", ["3", "1", "4"],
    "A maioria de 3 é 2 em 3: dois sites concordando bastam, e dois grupos sem se ver não conseguem ambos ter maioria.");
  q("b1", [4], "Por que a B-Tree empata com a varredura em 6 linhas e ganha em 1 milhão?", "Acha a linha em poucas leituras de página; com 6 linhas tudo cabe numa página", ["É sempre mais rápida, qualquer que seja o tamanho", "Só vale para colunas de texto", "Com 6 linhas o índice não existe"],
    "O custo é o número de leituras de página. Com 6 linhas a tabela inteira é uma página, e com 1 milhão o índice evita ler quase todas.");
  q("b1", [5], "Hit rate de 90%, cache de 1 ms e banco de 41 ms: qual é o tempo médio?", "5 ms", ["41 ms", "1 ms", "20 ms"],
    "0,9 × 1 + 0,1 × 41 = 5 ms. Sem o cache seriam 41 ms.");
  q("b1", [5], "Três réplicas do catálogo, três hashmaps, três preços diferentes. O que resolve?", "Um cache compartilhado (Redis) ou a invalidação por TTL", ["Mais réplicas", "Mais RAM em cada réplica", "Um balanceador mais rápido"],
    "O problema é cada réplica ter a sua cópia. O Redis junta as cópias num lugar só, e o TTL limita quanto tempo uma cópia velha vive.");

  /* ---------- Bloco 2: módulos 6 a 10 ---------- */
  q("b2", [6], "O checkout de 180 ms, com 4 saltos de 5 ms entre serviços, passa a levar…", "200 ms", ["185 ms", "380 ms", "20 ms"],
    "4 saltos × 5 ms = 20 ms a mais: 180 → 200 ms. É o preço da rede ao partir.");
  q("b2", [6], "Na Black Friday, 10 cópias do monolito (8 vCPU) contra os microsserviços que pesam, em vCPU:", "80 × 25", ["8 × 10", "25 × 80", "10 × 10"],
    "10 cópias × 8 vCPU = 80 vCPU; escalando só os serviços que pesam são 25 vCPU.");
  q("b2", [7], "Round robin, 3 réplicas, e 3 buscas de 900 ms que caem em P2, P5 e P8. O que acontece?", "Todas caem na mesma réplica (2,7 s de trabalho)", ["Uma em cada réplica", "Ficam 300 ms em cada uma", "O balanceador recusa duas"],
    "Pedido a pedido, o round robin é justo; no trabalho não: 3 × 900 ms = 2,7 s numa réplica só.");
  q("b2", [7], "Healthcheck a cada 5 s, com 3 falhas seguidas para tirar a réplica, a tira em…", "15 s", ["5 s", "3 s", "30 s"],
    "5 s × 3 falhas = 15 s até a réplica sair do balanceamento.");
  q("b2", [8], "Sem token e com token válido, mas sem o escopo: quais são os status?", "401 e 403", ["403 e 401", "400 e 404", "401 e 401"],
    "401 diz que não sabe quem é; 403 diz que sabe, mas não pode.");
  q("b2", [8], "Depois de validar o JWT, o gateway repassa ao serviço…", "X-Cliente-Id: lena-77", ["A senha da Lena", "O token inteiro, sem validar de novo", "O IP do app"],
    "O serviço recebe só o cliente_id já validado. O pedido 1048 da Lena passa assim.");
  q("b2", [9], "A tela inicial do app, sem BFF, faz 4 chamadas de 120 ms. Qual é o total e o peso?", "480 ms e 180 KB", ["120 ms e 12 KB", "150 ms e 12 KB", "480 ms e 12 KB"],
    "4 × 120 ms = 480 ms em série e 180 KB. Com o BFF em paralelo: 150 ms e 12 KB.");
  q("b2", [9], "O recomendacoes cai. O bff-app espera 100 ms e…", "Responde sem a seção ('recomendado': [])", ["Devolve 500 para o app", "Espera 8 s pelo PSP", "Tenta de novo para sempre"],
    "O fallback faz a tela seguir sem a seção; o resto da tela não depende dela.");
  q("b2", [10], "3 camadas, 3 tentativas cada: quantas chamadas ao pagamentos por clique?", "27", ["9", "6", "3"],
    "3 × 3 × 3 = 27. Retry em camadas multiplica, e por isso a malha centraliza a regra.");
  q("b2", [10], "30 sidecars a 0,1 vCPU e 50 MB cada somam…", "3 vCPU e 1,5 GB", ["0,1 vCPU e 50 MB", "30 vCPU e 1,5 GB", "3 vCPU e 50 MB"],
    "30 × 0,1 = 3 vCPU e 30 × 50 MB = 1,5 GB: o preço da malha.");

  /* ---------- Bloco 3: módulos 11 a 13 ---------- */
  q("b3", [11], "O estoque gasta 2 ms de CPU e 18 ms de espera. Quantos pedidos por vez, e qual é o teto?", "50/s e 500/s", ["500/s e 50/s", "20/s e 20/s", "1.000/s e 50/s"],
    "2 + 18 = 20 ms dão 1.000 ÷ 20 = 50/s por vez; com a espera sobreposta, só a CPU limita: 1.000 ÷ 2 = 500/s.");
  q("b3", [11], "Bia e Caio querem o último gato. Quem leva, e o que o outro recebe?", "Quem pegar o lock primeiro (a Bia, o 1049); o outro recebe 409", ["Os dois levam, e o estoque vai a −1", "Ninguém leva", "O Caio leva e a Bia recebe 404"],
    "O lock decide. O 1049 é da Bia, e o Caio recebe 409 e não consome número.");
  q("b3", [11], "Com 2 réplicas do estoque, o mutex local basta?", "Não: são 2 processos e 2 memórias, e precisa de lock distribuído", ["Sim, o mutex vale para a loja toda", "Só se cada réplica tiver 1 vCPU", "Sim, desde que use thread"],
    "O mutex vive na memória de um processo. Duas réplicas precisam de um lock que as duas enxerguem, como o do Redis.");
  q("b3", [12], "O pedido 1050 em Protobuf (sem o cabeçalho gRPC) tem quantos bytes?", "11", ["53", "210", "5"],
    "O 11 foi medido num proxy que lê os quadros HTTP/2. Os 210 ms são o tempo do PSP, não bytes.");
  q("b3", [12], "Como o PSP avisa que o Pix do Davi caiu sem a loja perguntar?", "Webhook", ["Short polling", "WebSocket", "Long polling"],
    "O webhook é o PSP chamando a loja. Os polling são a loja perguntando.");
  q("b3", [13], "Em qual partição cai o pedido 1049 (3 partições, chave pedido_id)?", "p0", ["p1", "p2", "Nas três"],
    "A chave decide a partição: o 1049 cai em p0, e a ordem só vale dentro de uma partição.");
  q("b3", [13], "Na Black Friday: quantos eventos por segundo no tópico e por partição?", "120/s e 40/s", ["30/s e 10/s", "4/s e 1/s", "40/s e 120/s"],
    "30 pedidos/s × 4 eventos = 120/s; divididos em 3 partições, 40/s cada.");
  q("b3", [13], "Para que serve a DLQ?", "Guardar a mensagem que não se consegue processar, para o consumidor seguir", ["Acelerar o consumo", "Criptografar as mensagens", "Garantir a ordem entre partições"],
    "Sem a DLQ, uma mensagem ruim trava a partição inteira.");

  /* ---------- Bloco 4: módulos 14 a 17 ---------- */
  q("b4", [14], "Média de 135 ms e p95 de 800 ms: qual número engana?", "A média", ["O p95", "O p99", "Nenhum dos dois"],
    "A média (135) esconde a cauda: p50 32, p95 800 e p99 2.000 ms.");
  q("b4", [14], "Por que a frota está a 67,5% e uma réplica a 99%?", "(9 × 64 + 99) ÷ 10 = 67,5: a média esconde a quente", ["A frota está errada", "A réplica a 99% é um erro de medição", "O balanceador a favorece de propósito"],
    "Nove réplicas a 64% e a catalogo-3 a 99% dão 67,5% de média e uma réplica no limite.");
  q("b4", [14], "Qual é o elo mais fraco do checkout, e o teto final?", "pagamentos (40/s) e o banco do pedidos (150/s)", ["estoque (1.000/s)", "O catálogo (100 req/s por réplica)", "pedidos (90/s) e o banco (150/s)"],
    "O elo mais fraco manda: o pagamentos faz 40/s e o banco do pedidos, 150/s; o estoque faz 1.000/s.");
  q("b4", [15], "No cubo, X, Y e Z são…", "Clonar (réplicas), partir por função (serviços) e partir por dado/cliente", ["CPU, RAM e disco", "Leitura, escrita e cache", "Região, zona e nó"],
    "X clona, Y parte por função e Z parte por dado. A loja foi de (10, 9, 1) a (10, 9, 3).");
  q("b4", [16], "murmur3('lena-77') mod 3 leva a Lena para…", "shard-1", ["shard-0", "shard-2", "O shard do mkt-01"],
    "O pedido 1054 da Lena cai no shard-1.");
  q("b4", [16], "O mkt-01, com 40% das linhas: qual é a fração do shard quente, e a eficiência?", "60% e 55,6%", ["40% e 100%", "33% e 66%", "100% e 33%"],
    "O mkt-01 coloca 60% da tabela no shard-2 (os outros dividem o resto), e a eficiência do cluster cai a 55,6%.");
  q("b4", [16], "De 3 para 4 shards, o mod e o anel (hash consistente) movem…", "~75% × ~25%", ["~25% × ~75%", "100% × 0%", "~50% × ~50%"],
    "mod: 75,2% dos dados mudam de lugar; o anel move só ~25,7%.");
  q("b4", [17], "Latência de commit assíncrona, semi e síncrona (SP–Rio–Recife):", "2, 12 e 82 ms", ["2, 10 e 80 ms", "12, 82 e 2 ms", "2, 12 e 800 ms"],
    "2 ms local; 12 = 2 + 10 (RTT do Rio); 82 = 2 + 80 (RTT de Recife).");
  q("b4", [17], "Lag de 800 ms em Recife, a 30 pedidos/s: quantos pedidos ficam em risco no failover?", "24", ["9", "800", "0,8"],
    "30 pedidos/s × 0,8 s = 24 pedidos. Com o lag de 300 ms do Rio seriam 9.");
  q("b4", [17], "Por que a Lena não vê o 1055 em 'meus pedidos'?", "Ela lê a réplica de Recife, 800 ms atrás", ["O pedido falhou", "O cache expirou", "O gateway bloqueou a leitura"],
    "O pedido foi gravado, mas a réplica de Recife ainda não o recebeu. O módulo 26 põe o primário em Recife.");

  /* ---------- Bloco 5: módulos 18 a 21 ---------- */
  q("b5", [18], "Em CQRS, de onde a tela 'meus pedidos' lê?", "Do modelo de leitura (meus-pedidos)", ["Do PostgreSQL de escrita", "Direto do Kafka", "Do cache do gateway"],
    "A leitura vem de um modelo feito para ler, atualizado pelo projetor. O relatório vai de 235 ms a 0,021 ms.");
  q("b5", [18], "Para que serve o outbox?", "Gravar o evento na mesma transação do pedido", ["Acelerar a leitura", "Criptografar os eventos", "Substituir o Kafka"],
    "Sem o outbox, o pedido é gravado e o evento pode nunca sair: duas escritas, dois sistemas.");
  q("b5", [19], "Pagamento aprovado e o estoque falha: a saga faz…", "Compensa (estorno do pagamento)", ["ROLLBACK global", "Ignora a falha", "Cobra de novo"],
    "Sem transação global, compensa-se: estorno-c-7732, no caso do 1057.");
  q("b5", [19], "Saga orquestrada × coreografada:", "Um maestro decide × cada serviço reage a eventos", ["Síncrona × assíncrona", "Com banco × sem banco", "Com compensação × sem compensação"],
    "A diferença é quem conhece o fluxo: o orquestrador, ou ninguém e todos ao mesmo tempo.");
  q("b5", [19], "10% de falha no estoque e 5% no pagamento: qual é a chance de sucesso?", "85,5%", ["85%", "95%", "90%"],
    "0,9 × 0,95 = 0,855. As probabilidades se multiplicam, não se somam.");
  q("b5", [20], "Em event sourcing, o estado do pedido 1047 é…", "O resultado de reaplicar os eventos do stream pedido-1047", ["A última linha da tabela pedidos", "O último evento, sozinho", "Uma cópia no Redis"],
    "O estado é a soma dos fatos. O stream pedido-1047 tem os eventos e-501, e-502, e-504 e e-505.");
  q("b5", [20], "Com snapshot a cada 1.000 eventos, a rehidratação de ~1.800 ms vai a…", "~13 ms", ["1.800 ms", "0 ms", "~900 ms"],
    "O snapshot evita reler a história inteira: ~13 ms. O replay completo do módulo leva 2 h 47 min.");
  q("b5", [21], "Pool de 50 conexões a 30 req/s: qual é o timeout crítico?", "50 ÷ 30 = 1,67 s", ["2 s", "8 s", "30 s"],
    "Acima de 1,67 s o pool enche antes de a primeira vaga voltar. Por isso o timeout do PSP caiu para 1 s.");
  q("b5", [21], "Retry exponencial sem jitter, 1.000 clientes:", "Ondas sincronizadas (só 4% concluem no prazo)", ["Espalha a carga ao longo do tempo", "Reduz as tentativas pela metade", "Aumenta o hit rate do cache"],
    "Sem jitter todos esperam o mesmo tempo e voltam juntos. O retry imediato é a causa da tempestade.");
  q("b5", [21], "O breaker do PSP-A a 8 s abre depois de quanto tempo?", "1,3 s", ["30 s", "90 s", "8 s"],
    "O breaker abre em 1,3 s e fica aberto 30 s antes das sondas. Os 90 s são a duração do incidente.");

  /* ---------- Bloco 6: módulos 22 a 25 ---------- */
  q("b6", [22], "A 2.5.0 devolve 201 com frete 0,00 em Recife. O que pega?", "Uma métrica de negócio (frete_zero por cidade)", ["O healthcheck", "A taxa de 5xx", "O readiness do pod"],
    "A versão está saudável e sem erro. Só uma métrica de negócio por cidade enxerga o defeito.");
  q("b6", [22], "A perda do rolling contra a do canary de 10%:", "R$ 54.000 × R$ 450", ["R$ 0 × R$ 54.000", "R$ 450 × R$ 54.000", "R$ 9.600 × R$ 54.000"],
    "O raio é fração × tempo × custo: o rolling chega a 100% em 90 s; o canary para em 10%.");
  q("b6", [22], "O rollback devolve os pedidos já gravados com frete 0,00?", "Não: troca o código, não o dado", ["Sim, volta tudo ao estado anterior", "Só se for blue/green", "Sim, se houver flag"],
    "O rollback não mexe nos dados gravados: os pedidos com frete 0,00 continuam lá.");
  q("b6", [23], "O plano de 2027 para catalogo, pedidos, pagamentos e estoque:", "14 · 10 · 15 · 2 = 41 vCPU", ["10 · 3 · 2 · 2 = 17 vCPU", "14 · 10 · 15 · 2 = 4.200 vCPU", "8 · 8 · 8 · 8 = 32 vCPU"],
    "A soma 14 + 10 + 15 + 2 dá 41 vCPU, para a Black Friday de 26/11/2027.");
  q("b6", [23], "Lei de Little: L =", "λ × W", ["λ ÷ W", "W ÷ λ", "λ + W"],
    "O que está em uso é a taxa de chegada vezes o tempo de cada um. Foi assim que o pool de 20 foi contado.");
  q("b6", [23], "Por que o ρ alvo é 70% e não 100%?", "Perto do joelho a espera explode", ["Custa mais", "Porque 100% não existe em CPU", "O PSP não aceita mais"],
    "Perto de 100% de utilização a fila cresce sem limite; a 70% ainda há folga para a variação.");
  q("b6", [24], "No k6, a loja 'hoje' quebra em quanto, e o plano?", "36/s e ~250/s", ["250/s e 36/s", "40/s e 150/s", "36/s e 200/s"],
    "Hoje a loja quebra em 36/s; o plano chega a ~250/s, com p95 ≤ 800 ms e erros ≤ 0,1%.");
  q("b6", [24], "O cenário misto do k6 achou…", "O relatório das 23:00 disputando o pool", ["O frete 0,00", "O veneno do mkt-01", "A tempestade de retry"],
    "Só o teste com tráfego normal e o relatório juntos revelou a disputa pelo pool de 20 conexões.");
  q("b6", [25], "Pool de 20, com o relatório (40,4 pedidas). Com 16 + 4, o cliente fica com…", "0% de 503 (o batch é quem espera)", ["33% de 503", "10% de 503", "100% de 503"],
    "O bulkhead escolheu quem espera: o cliente passa a 0% de 503, e o relatório fica com 14% de sucesso.");
  q("b6", [25], "O raio do shard quente é 60%. Com o shard dedicado ao mkt-01, passa a…", "40%", ["20%", "33,3%", "60%"],
    "Com tráfego não uniforme o raio é a maior fração, e não 1 ÷ N: de 60% a 40%.");

  /* ---------- Bloco 7: módulos 26 a 28 ---------- */
  q("b7", [26], "Shard, bulkhead e célula dividem, respectivamente…", "O dado, os recursos e a pilha inteira", ["Só CPU, RAM e disco", "A rede, o disco e a região", "O dado, a rede e o código"],
    "O shard divide o dado; o bulkhead, os recursos dentro da pilha; a célula, a pilha inteira com o seu dado.");
  q("b7", [26], "O veneno do mkt-01 em 4 min: tentativas perdidas, pilha única contra células?", "7.200 × 2.880", ["2.880 × 7.200", "7.200 × 7.200", "150 × 3"],
    "Na pilha única o veneno derruba tudo (7.200); nas células só a celula-mkt cai (2.880).");
  q("b7", [26], "O plano de 2027 em 4 células custa…", "53 vCPU (+12; +29,3%)", ["41 vCPU", "164 vCPU", "12 vCPU"],
    "A pilha inteira em cada célula e as passivas sobem 41 vCPU para 53 (+12; +29,3%).");
  q("b7", [26], "De 4 para 5 células, o hash mod N move…", "~80% (o anel ~20%; a tabela só quem se mover)", ["~20%", "~50%", "0%"],
    "O mod muda quase tudo (~80%); o anel move ~20%, e a tabela de mapeamento só move quem se mover.");
  q("b7", [26], "Shuffle de 2 em 10 células: um par inteiro caído atinge…", "1 ÷ 45 = 2,2% dos clientes", ["20%", "10%", "1 ÷ 10 = 10%"],
    "C(10, 2) = 45 pares possíveis; um cliente fica num par só, então um par caído leva 1 ÷ 45.");
  q("b7", [27], "Queda de SP: MTTD de 30 s e MTTR de 35 s. O RTO é…", "65 s (conta da interrupção)", ["35 s", "30 s", "5 s"],
    "O RTO conta da interrupção e inclui a detecção: 30 + 35 = 65 s.");
  q("b7", [27], "RPO esperado da celula-sp (9,9 pedidos/s, lag de 300 ms):", "2,97 pedidos", ["0 pedidos", "9,9 pedidos", "300 pedidos"],
    "9,9 × 0,3 = 2,97 pedidos em risco, em média.");
  q("b7", [27], "Por que o número 1061 apareceu em dois pedidos?", "A sequência do banco promovido reusou o último valor replicado", ["Bug do PSP", "Retry sem idempotência", "O Kafka duplicou o evento"],
    "A réplica promovida não tinha os últimos valores da sequência e reutilizou um número já dado.");
  q("b7", [28], "SLO de 99,9% em 30 dias dá quantos minutos de orçamento?", "43,2", ["4,32", "432", "0,432"],
    "0,1% × 43.200 min = 43,2 min (ou 12.960 requisições ruins).");
  q("b7", [28], "Um burn rate de 14,4× em 1 h consome…", "2% do orçamento", ["14,4% do orçamento", "100% do orçamento", "0,2% do orçamento"],
    "14,4 × (1 h ÷ 720 h) = 2%. É a regra de página da janela curta.");
  q("b7", [28], "USE, RED e os quatro sinais olham, respectivamente…", "O recurso, o serviço e o que o usuário sente", ["O serviço, o recurso e o que o usuário sente", "O usuário, o recurso e o serviço", "Só o recurso, nos três"],
    "USE (utilização, saturação, erros) olha o recurso; RED (rate, errors, duration), o serviço; os quatro sinais, a saúde para o usuário.");
  q("b7", [28], "Com 30% de falha rápida (2 ms) e 70% a 275 ms, a latência média cai a…", "~193 ms (por isso separar sucesso e erro)", ["275 ms", "2 ms", "~140 ms"],
    "0,3 × 2 + 0,7 × 275 ≈ 193 ms: a média melhora enquanto a loja piora. A latência precisa separar sucesso e erro.");

  /* ---------- Integradoras ---------- */
  q("i", [8, 16, 26], "O 1060 da Lena não sente o veneno do mkt-01. Por quê?", "O roteador lê o cliente_id e cada célula é uma pilha própria", ["O gateway filtra o veneno", "O shard-2 isola o mkt-01", "O bulkhead do pool segura"],
    "O edge-loja manda o mkt-01 para a celula-mkt e a Lena para a celula-recife. O gateway só valida o token.");
  q("i", [2, 17, 27], "RAID, réplica e célula passiva protegem, na ordem, contra a queda de…", "Um disco, um servidor e uma região", ["Uma região, um servidor e um disco", "Só do dado", "Uma célula, um shard e uma réplica"],
    "Cada peça cobre um tamanho de falha: o RAID, o disco; a réplica, o servidor; a célula passiva em outra região, a região.");
  q("i", [6, 24, 25], "Por que o relatório das 23:00 aparece três vezes na história?", "É o vizinho barulhento: derrubou o monolito (6), o teste misto o achou (24) e o bulkhead o isolou (25)", ["É um bug do relatório que nunca foi corrigido", "É o único job agendado da loja", "O PSP só responde nesse horário"],
    "O mesmo problema volta em escalas diferentes: o programa único, o pool de 20 conexões e o teste que o achou.");
  q("i", [17, 26], "O commit semi-síncrono (12 ms) e o 2PC SP + Rio (24 ms) vêm de…", "O RTT de 10 ms (2 + 10 = 12 e 2 × 10 + 2 × 2 = 24)", ["Do disco", "Do RTT de 80 ms de Recife", "Do lag de 300 ms"],
    "A conta usa o RTT SP–Rio de 10 ms e o commit local de 2 ms.");
  q("i", [5, 21], "O catálogo a 640 req/s, com 80% de acerto, manda à origem…", "128 req/s (sem cache seriam 640)", ["512 req/s", "0 req/s", "640 req/s"],
    "20% de erro × 640 = 128 req/s. Sem o cache, a origem receberia todos os 640.");
  q("i", [21, 28], "90 s de PSP lento sem proteção queimam quanto do orçamento de 12.960?", "2.700 = 20,8%", ["90 = 0,7%", "2,7%", "12.960 = 100%"],
    "90 s × 30 req/s = 2.700 requisições ruins; 2.700 ÷ 12.960 = 20,8% do orçamento.");
  q("i", [7, 21, 25, 26, 27], "Ligue a falha à defesa: pod travado · PSP lento · relatório · veneno · região", "Healthcheck · breaker e fallback · bulkhead · célula · DR", ["Breaker e fallback · healthcheck · bulkhead · célula · DR", "Bulkhead · breaker e fallback · healthcheck · DR · célula", "Célula · bulkhead · breaker e fallback · healthcheck · DR"],
    "Cada defesa cobre um raio: o healthcheck, o pod; o breaker, a dependência lenta; o bulkhead, o recurso; a célula, o veneno; o DR, a região.");
  q("i", [14, 23], "Na Black Friday de 2027, o que escalar primeiro (de 30 para 200 pedidos/s)?", "pagamentos e o banco (os elos mais fracos)", ["O catálogo", "O estoque", "O BFF"],
    "O elo mais fraco manda: pagamentos (40/s) e o banco do pedidos (150/s) limitam antes do catálogo e do estoque.");
  q("i", [27, 28], "RPO e RTO são… E MTTD, MTTR e MTBF são…", "Objetivos (contratuais) · medidas", ["Medidas · objetivos", "Os dois, objetivos", "Os dois, medidas"],
    "RPO e RTO são metas que se prometem; MTTD, MTTR e MTBF são o que se mede depois do incidente.");
  q("i", [6, 28], "O trace_id do 1047 liga o quê, e por que não vira rótulo de métrica?", "Logs e traces de 5 serviços; é de cardinalidade ilimitada (33,3 bilhões de séries com cliente_id)", ["Métricas de 5 serviços; é pequeno demais", "Só os logs do gateway; é secreto", "Os bancos de 5 serviços; é de cardinalidade baixa"],
    "O trace_id costura logs e traces. Como rótulo de métrica, cada pedido criaria uma série nova.");

  window.QUIZ = out;
  window.QUIZ_BLOCKS = BLOCKS;
})();
