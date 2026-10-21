/* Banco de perguntas do quiz de Cell-Based Architecture.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-ao-cell-based", name: "Introdução ao Cell-Based" },
    t2: { topic: "aula-2-estrutura-celular", name: "Estrutura celular" },
    t3: { topic: "aula-3-roteamento-celular", name: "Roteamento celular" },
    t4: { topic: "aula-4-replicacao-celular", name: "Replicação celular" }
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

  /* ---------- 1. Introdução ao Cell-Based ---------- */
  choice("t1", 1, 1, "O que a célula divide que o bulkhead e o shard não dividem?", [
    "Só os dados, por chave.",
    "Só os recursos, como pools e lanes.",
    "A pilha inteira: lb, gateway, serviços, banco, Redis e tópico.",
    "Só a rede entre os serviços."
  ], 2, "O shard divide os dados, o bulkhead divide os recursos e a célula divide a pilha inteira, com a sua fila, o seu banco e o seu cache.");
  choice("t1", 2, 2, "Por que a quantidade 2147483648 derrubou os 3 pods do pedidos em ~150 ms?", [
    "Estourou o int32 e o gw-loja tentou de novo até 3 vezes; cada tentativa derrubou um pod (3 × ~50 ms).",
    "Esgotou a memória do Redis.",
    "O banco recusou a conexão.",
    "O balanceador mandou tudo a um pod só."
  ], 0, "A pedidos 2.6.0 dá panic ao somar o total. O Idempotency-Key não ajuda, porque a queda vem antes de qualquer deduplicação.");
  choice("t1", 3, 2, "Quantas tentativas falham na pilha única e quantas com 4 células, em 4 min a 30 pedidos/s?", [
    "7.200 contra 2.880.",
    "7.200 contra 7.200.",
    "2.880 contra 7.200.",
    "2.880 contra 0."
  ], 0, "30 × 240 = 7.200 (100% do tráfego). Com células, só a celula-mkt cai: 12 × 240 = 2.880 (40%), todas do parceiro.");
  choice("t1", 4, 2, "Quais são as frações de tráfego das quatro células da loja?", [
    "25% cada.",
    "celula-mkt 40%, celula-sp 33%, celula-rio 15% e celula-recife 12%.",
    "celula-sp 55%, celula-rio 25% e celula-recife 20%.",
    "celula-mkt 10% e as outras três 30%."
  ], 1, "Os 55 · 25 · 20% do módulo 22 valem para os 60% que não são do mkt-01; o parceiro fica com os outros 40%.");
  tf("t1", 5, 2, "Com as quatro células, o raio de explosão do pior caso é 25% (1 ÷ N).", false, "O raio é a fração de cada célula. O pior caso é 40% (a celula-mkt), a média é 25% e a eficiência é 62,5%.");
  choice("t1", 6, 3, "Quatro células ligadas ao mesmo estoque e ao mesmo Redis. O que acontece com o raio?", [
    "Continua em 40% no pior caso.",
    "Cai a 25%.",
    "Volta a 100%: é o canal oculto, e o isolamento vira decoração.",
    "Vai a 0% para a pessoa física."
  ], 2, "Se uma peça compartilhada falha, as quatro células param juntas. A célula só isola o que ela divide.");
  tf("t1", 7, 2, "Para a WSO2, “célula” é a cópia da pilha por parcela de clientes, como na AWS.", false, "A WSO2 usa célula para um contexto delimitado de um time (“sem células dentro de células”). São dois padrões com o mesmo nome; o módulo usa o da AWS.");

  /* ---------- 2. Estrutura celular ---------- */
  choice("t2", 1, 1, "Quais são as cinco dimensões em que a célula isola?", [
    "CPU, memória, disco, rede e energia.",
    "Execução, persistência, observabilidade, deploy e falha.",
    "Leitura, escrita, cache, fila e log.",
    "Dev, teste, homologação, produção e DR."
  ], 1, "Faltando uma delas o desenho vira só shard (dados) ou só bulkhead (recursos).");
  tf("t2", 2, 1, "Dentro de uma célula, um serviço pode chamar o estoque da célula vizinha quando o dele estiver lento.", false, "Os componentes internos só conhecem os da própria célula. Toda comunicação externa passa pelo gateway.");
  choice("t2", 3, 2, "Quanto custa o piso no plano de 2027?", [
    "41 vCPU na pilha única contra 53 nas 4 células (+12, +29,3%).",
    "41 contra 41, porque a carga é a mesma.",
    "41 contra 164.",
    "9 contra 8."
  ], 0, "O estoque vai de 2 para 8 réplicas (o piso), o pedidos e o pagamentos pagam o arredondamento por célula e o catálogo reserva 2 para o teto do mkt-01.");
  choice("t2", 4, 2, "No dia comum (5 pedidos/s) quanto custam a pilha única e as 4 células no piso?", [
    "9 e 32 vCPU: 3,6×.",
    "9 e 18 vCPU: 2×.",
    "32 e 9 vCPU.",
    "5 e 20 vCPU."
  ], 0, "Pilha única: 2 + 3 + 2 + 2 = 9. Quatro células, 4 serviços × 2 réplicas × 4 células = 32. É a perda de multiplexação estatística (Erlang C, módulo 25).");
  choice("t2", 5, 2, "Como os 19 gatos se dividem entre as células, proporcionalmente à demanda?", [
    "5 · 5 · 5 · 4.",
    "sp 6 · rio 3 · recife 2 · mkt 8.",
    "sp 10 · rio 5 · recife 4 · mkt 0.",
    "Todos na celula-mkt."
  ], 1, "33 · 15 · 12 · 40% de 19 dão 6,3 · 2,9 · 2,3 · 7,6; arredondado, 6 · 3 · 2 · 8 (soma 19).");
  choice("t2", 6, 3, "O pedido 1060 leva os 2 gatos da celula-recife. O que o próximo cliente de Recife vê?", [
    "O gato disponível, vindo de SP em segundos.",
    "“Esgotado”, com 17 gatos na rede; o plano de controle pode rebalancear.",
    "Um erro 500.",
    "O preço dobrado."
  ], 1, "A alocação da célula zerou. As saídas: aceitar o esgotado local, rebalancear (assíncrono, o adotado) ou reservar entre células por saga (acopla duas células).");
  order("t2", 7, 2, "Ponha na ordem os anéis de deploy por célula.", [
    "Célula zero (0%)",
    "celula-recife (12%)",
    "celula-rio (27%)",
    "celula-sp (60%)",
    "celula-mkt (100%)"
  ], "Cada anel soma ao anterior. A célula zero, com os clientes sintéticos sint-01…03, acha o defeito antes de qualquer cliente real.");
  choice("t2", 8, 3, "A 2.5.0 do módulo 22 (frete 0,00 em Recife) é publicada pelo celula-recife primeiro. Por que isso não protege?", [
    "Porque a célula regional não é representativa do defeito regional: 100% dos clientes de Recife seriam afetados.",
    "Porque Recife não tem clientes.",
    "Porque o frete não usa o banco.",
    "Porque a célula zero é a última."
  ], 0, "A proteção vem da célula zero com CEP de Recife: acha o frete_zero com 1 pedido sintético e perda de R$ 0.");

  /* ---------- 3. Roteamento celular ---------- */
  choice("t3", 1, 1, "Quais três qualidades o roteador precisa ter?", [
    "Inteligente, com lógica de negócio e cache próprio.",
    "Fino, determinístico e mais disponível que as células.",
    "Rápido, barato e colorido.",
    "Stateful, único e manual."
  ], 1, "A AWS pede a camada mais fina possível, sem lógica de negócio, simples o bastante para testar tudo. O artigo pede “inteligente”: aqui vale a AWS.");
  choice("t3", 2, 2, "De 4 para 5 células, quanto de cada método de mapeamento muda de lugar?", [
    "mod N 80,1% · anel ~20% · tabela 0.",
    "mod N 20% · anel 80% · tabela 0.",
    "Todos 20%.",
    "mod N 0 · anel 0 · tabela 80%."
  ], 0, "A tabela cadastral só move quem você mover; o mod N embaralha quase tudo (rehash storm); o anel move cerca de 1 ÷ (N + 1).");
  choice("t3", 3, 2, "Qual o tamanho do mapa cliente_id → célula e onde ele fica?", [
    "150 MB (1,5 milhão × ~100 B), em memória na borda.",
    "150 GB, num banco central.",
    "150 KB, no JWT.",
    "1,5 GB, no Redis de cada célula."
  ], 0, "É pequeno o bastante para viver na memória do edge-loja, que continua roteando com o último mapa se o plano de controle cair (estabilidade estática).");
  choice("t3", 4, 2, "O roteador tem 99,99% e a célula, 99,9%. Qual a disponibilidade da cadeia?", [
    "99,99%.",
    "99,89%.",
    "99,9%.",
    "100%."
  ], 1, "Em série multiplica: 0,9999 × 0,999 = 0,9989. O roteador é o teto de todas as células.");
  choice("t3", 5, 2, "No tópico pedidos compartilhado, o consumidor cai ao desserializar o veneno. Quantos eventos ficam presos em 10 min?", [
    "24.000, sendo 14.400 de pessoa física.",
    "9.600, todos do parceiro.",
    "600.",
    "Nenhum: a DLQ resolve."
  ], 0, "A falha ocorre antes da política de DLQ. 40 eventos/s na partição × 600 s = 24.000; 60% são de pessoa física (o PedidoPago da Lena, atrasado).");
  tf("t3", 6, 2, "Com tópicos por célula, o veneno do mkt-01 prende 9.600 eventos e as outras três células ficam com atraso 0.", true, "O pedidos.mkt recebe 12 × 4 ÷ 3 = 16 eventos/s por partição: 16 × 600 = 9.600, todos do parceiro.");
  choice("t3", 7, 3, "O mapa-v43 sai com bia-31 → celula-xx e é publicado em todas as bordas de uma vez. Qual é o conserto?", [
    "Reiniciar o Kafka.",
    "Validar o mapa antes, publicar por borda (anéis) e guardar o último mapa bom.",
    "Trocar o hash mod N pelo anel.",
    "Aumentar o piso."
  ], 1, "O config é compartilhado, e o raio volta a 100%. A estabilidade estática protege da queda do plano de controle, não de um mapa errado que ele mesmo publicou.");

  /* ---------- 4. Replicação celular ---------- */
  choice("t4", 1, 1, "Qual é a perda esperada da replicação assíncrona entre células?", [
    "Taxa × lag.",
    "Lag ÷ taxa.",
    "Sempre zero.",
    "RTT × 2."
  ], 0, "Pedidos que estavam no ar na janela de lag quando a ativa caiu: celula-sp 9,9 × 0,3 = 2,97; celula-mkt 12 × 0,8 = 9,6.");
  choice("t4", 2, 2, "A célula reduz a perda em pedidos porque…", [
    "reduz a taxa por primário, não o lag.",
    "zera o lag.",
    "usa 2PC.",
    "apaga os pedidos antigos."
  ], 0, "Antes, com primário único a 30/s: Rio perdia 9 e Recife 24. Com células a taxa de cada primário é menor.");
  choice("t4", 3, 2, "Qual é a latência do commit 2PC modelado entre SP e Rio, e entre SP, Rio e Recife (RTTs 10 e 80 ms, commit local 2 ms)?", [
    "24 ms e 164 ms.",
    "10 ms e 80 ms.",
    "2 ms e 2 ms.",
    "12 ms e 82 ms."
  ], 0, "2 rodadas (prepare e commit) × o participante mais lento + 2 × 2 ms: 2 × 10 + 4 = 24; 2 × 80 + 4 = 164. É modelo de rodadas, não medição. Os 12 e 82 ms são da replicação síncrona de um banco só (módulo 17).");
  choice("t4", 4, 2, "Com 2PC, quantas reservas por segundo cabem numa linha quente (o estoque do gato)?", [
    "500 (async), 41,7 (SP + Rio) e 6,1 (SP + Rio + Recife).",
    "500 em todos.",
    "24 e 164.",
    "1.000, 500 e 250."
  ], 0, "O lock fica segurado durante as rodadas: 1 ÷ 2 ms, 1 ÷ 24 ms, 1 ÷ 164 ms.");
  choice("t4", 5, 2, "Com N células iguais e ρ alvo de 70%, qual a ocupação normal máxima para sobreviver a uma queda com N = 2 e com N = 20?", [
    "35% e 66,5%.",
    "70% nos dois.",
    "50% e 95%.",
    "66,5% e 35%."
  ], 0, "70% × (N − 1) ÷ N. Pares ativo-passivo obrigam a rodar a 35%; muitas células pequenas rodam perto do alvo.");
  choice("t4", 6, 3, "A celula-sp (33%) cai e só a passiva do Rio a assume. O que acontece com o Rio?", [
    "Vai de 15% a 48% do tráfego (4,5 → 14,4 pedidos/s, 3,2×), e não +33%.",
    "Sobe 33%.",
    "Cai a 0%.",
    "Nada: a passiva tem capacidade infinita."
  ], 0, "Células desiguais pioram a folga. Saídas: rodar a 35%, ter muitas células pequenas ou degradar por prioridade (lanes 12 · 6 · 2 do módulo 25).");
  choice("t4", 7, 2, "Qual é a probabilidade exata de um cliente ter todas as k células entre as f caídas, com N = 20 e f = k = 2?", [
    "1% (a fórmula do artigo).",
    "0,526% (1 ÷ 190).",
    "5%.",
    "0,009%."
  ], 1, "(f/N)^k é aproximação (sorteio com reposição). A exata é C(f,k) ÷ C(N,k). Com N = 10 são 2,22%; com N = 4, 16,7%.");
  choice("t4", 8, 3, "No shuffle com 10 células, o veneno do mkt-01 ({8, 9}) derruba as células 8 e 9. Quem perde o serviço por completo?", [
    "Bia {4, 6} e Caio {1, 4}.",
    "Lena {6, 8} e Davi {1, 9}.",
    "Só quem tem exatamente {8, 9}, 1 em 45 (2,2%): o próprio mkt-01.",
    "Todos."
  ], 2, "A Bia e o Caio nem notam; a Lena e o Davi perdem uma célula e ficam com a outra. As 8 sobreviventes assumem +25% (2 ÷ 8) cada.");

  window.QUIZ = out;
})();
