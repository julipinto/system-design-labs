/* Banco de perguntas do quiz de Concorrência e Paralelismo.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-processos-threads-e-multithreading", name: "Introdução: processos, threads e multithreading" },
    t2: { topic: "aula-2-concorrencia", name: "Concorrência" },
    t3: { topic: "aula-3-paralelismo", name: "Paralelismo" },
    t4: { topic: "aula-4-paralelismo-interno-e-externo", name: "Paralelismo interno e externo" },
    t5: { topic: "aula-5-concorrencia-vs-paralelismo", name: "Concorrência vs paralelismo" },
    t6: { topic: "aula-6-problemas-classicos-deadlocks-starvation-e-race-conditions", name: "Problemas clássicos: deadlock, starvation e race conditions" },
    t7: { topic: "aula-7-mutex", name: "Mutex" },
    t8: { topic: "aula-8-mutex-distribuido-locks-distribuidos", name: "Mutex distribuído: locks distribuídos" },
    t9: { topic: "aula-9-spinlocks", name: "Spinlocks" },
    t10: { topic: "aula-10-semaforos-e-thread-pools", name: "Semáforos e thread pools" }
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


  /* ---------- 1. Introdução: processos, threads e multithreading ---------- */
  choice("t1", 1, 1, "Qual é a diferença entre um processo e uma thread?", [
    "O processo roda no kernel e a thread roda no disco.",
    "Processo e thread são o mesmo nome em linguagens diferentes.",
    "O processo é um programa em execução com memória própria; as threads vivem dentro dele e dividem essa memória.",
    "A thread tem memória própria e o processo divide a memória com os outros."
  ], 2, "A estoque-1 é um processo, isolado da estoque-2. As threads (ou goroutines) de dentro da estoque-1 enxergam a mesma memória.");
  choice("t1", 2, 1, "Quanto de pilha uma thread de sistema reserva por padrão, e com quanto começa uma goroutine?", [
    "8 MB virtuais (ulimit -s) contra cerca de 2 KB.",
    "2 KB contra 8 MB.",
    "1 GB contra 1 MB.",
    "As duas começam com 4 KB."
  ], 0, "Por isso o Go pode ter uma goroutine por pedido sem pensar duas vezes. Os 8 MB da thread são endereço virtual, não memória gasta.");
  choice("t1", 3, 2, "O estoque recebe 200 pedidos ao mesmo tempo. Quanto de pilha inicial cada modelo reserva?", [
    "200 threads: 400 KB; 200 goroutines: 1,6 GB.",
    "As duas opções reservam 1,6 GB.",
    "As duas opções reservam 400 KB.",
    "200 threads: 1,6 GB (200 × 8 MB); 200 goroutines: 400 KB (200 × 2 KB)."
  ], 3, "A diferença de 1,6 GB para 400 KB é o que torna goroutines baratas. Quem encaixa as goroutines em poucas threads é o runtime do Go.");
  tf("t1", 4, 2, "Um panic sem recover numa goroutine derruba só aquela goroutine, e as outras 199 continuam atendendo.", false,
    "O Go encerra o programa inteiro, com código de saída 2. Todas as goroutines e os pedidos em andamento morrem: a fronteira de falha é o processo.");
  choice("t1", 5, 3, "Quem pode ter um recover útil contra o panic de uma goroutine filha?", [
    "Um recover na main, que pega o panic de qualquer goroutine.",
    "Um recover num defer dentro da própria goroutine que entrou em pânico.",
    "Um recover no pod vizinho.",
    "Não existe: o panic não pode ser tratado em Go."
  ], 1, "O recover só funciona num defer da mesma goroutine. Por isso cada goroutine que o código inicia precisa do seu.");

  /* ---------- 2. Concorrência ---------- */
  choice("t2", 1, 1, "Um pedido reservar custa 2 ms de CPU e 18 ms esperando o banco. Quantos pedidos por segundo o estoque-1 atende um de cada vez?", [
    "500.",
    "100.",
    "50.",
    "20."
  ], 2, "20 ms por pedido: 1 s ÷ 20 ms = 50 por segundo. A CPU fica parada 18 dos 20 ms.");
  choice("t2", 2, 2, "Com N pedidos em andamento no estoque-1 (1 vCPU), qual é a vazão?", [
    "N × 500 pedidos por segundo, sem limite.",
    "min(N × 50, 500) pedidos por segundo.",
    "Sempre 50 pedidos por segundo.",
    "N ÷ 20 pedidos por segundo."
  ], 1, "Cada pedido adiciona 50/s até a CPU encher. O teto de 500/s é 1 s ÷ 2 ms de CPU.");
  choice("t2", 3, 2, "Com quantos pedidos em andamento a CPU do estoque-1 fecha cheia?", [
    "2.",
    "5.",
    "10.",
    "100."
  ], 2, "10 × 50 = 500: cada pedido usa a CPU 10% do tempo (2 ms de 20), e dez somam 100%.");
  choice("t2", 4, 3, "O pedido passa a gastar 20 ms de CPU (em vez de 2). O que acontece com o teto de vazão?", [
    "Sobe para 5.000 por segundo.",
    "Continua 500 por segundo.",
    "Cai para 50 por segundo, e mais concorrência não ajuda.",
    "Cai para 5 por segundo."
  ], 2, "1 s ÷ 20 ms = 50/s. Concorrência só rende para quem espera; quando o gargalo é a CPU, falta núcleo.");
  tf("t2", 5, 2, "Num único núcleo, a concorrência executa dois pedidos no mesmo instante.", false,
    "O núcleo executa um de cada vez. A concorrência intercala: enquanto um pedido espera o banco, outro usa a CPU.");

  /* ---------- 3. Paralelismo ---------- */
  choice("t3", 1, 1, "O fechamento das 23:00 do relatorios gasta 40 s de CPU em um núcleo e 2 s para somar e gravar. Quanto leva sequencial?", [
    "40 s.",
    "42 s.",
    "20 s.",
    "12 s."
  ], 1, "40 s + 2 s = 42 s. Em 4 fatias de 100 mil linhas, 10 s + 2 s = 12 s.");
  choice("t3", 2, 2, "Em 4 fatias de 100 mil linhas, em 4 núcleos, o fechamento leva 12 s. Qual é a aceleração?", [
    "4×.",
    "3,5×.",
    "2×.",
    "10×."
  ], 1, "42 ÷ 12 = 3,5×. Os 2 s de somar e gravar não dividem.");
  choice("t3", 3, 3, "Por que a aceleração é 3,5× e não 4×?", [
    "Porque um núcleo fica de reserva.",
    "Porque a rede é lenta.",
    "Porque o Go perde 12% em cada fatia.",
    "Porque a parte serial (2 s de 42, ou 4,8%) não encolhe com mais núcleos: é a lei de Amdahl."
  ], 3, "A conta é 1 ÷ (0,048 + 0,952 ÷ N). Com 4 núcleos dá 3,5; com 8, 6,0; o teto é 21×.");
  choice("t3", 4, 2, "Segundo a mesma conta, quanto o relatório acelera com 8 núcleos?", [
    "8×.",
    "7×.",
    "6,0×.",
    "3,5×."
  ], 2, "40 ÷ 8 = 5 s, mais 2 s serial = 7 s. 42 ÷ 7 = 6,0×, e não 8×.");
  tf("t3", 5, 2, "O churrasco paralelo do laboratório demonstra paralelismo de CPU.", false,
    "As tarefas usam time.Sleep, que não gasta CPU. O mesmo programa levaria os mesmos 12 s num único núcleo: é espera sobreposta.");
  choice("t3", 6, 3, "Num pod de 1 vCPU, num nó de 16 núcleos, o que runtime.NumCPU() devolve?", [
    "1, o limite do pod.",
    "16, as CPUs da máquina.",
    "0.",
    "O número de goroutines ativas."
  ], 1, "NumCPU lê as CPUs da máquina, não o limite do container. O GOMAXPROCS padrão passou a respeitar o cgroup no Go 1.25, mas NumCPU continua devolvendo 16.");

  /* ---------- 4. Paralelismo interno e externo ---------- */
  choice("t4", 1, 1, "Qual destes é paralelismo interno?", [
    "A estoque-1 e a estoque-2 atrás do balanceador.",
    "Dois consumidores de uma fila em máquinas diferentes.",
    "As 4 fatias do relatorios rodando em 4 threads do mesmo pod.",
    "Um CronJob que dispara um Job."
  ], 2, "Interno é paralelismo dentro de um processo, criado pelo código, com threads que dividem a memória.");
  choice("t4", 2, 1, "O que caracteriza o paralelismo externo?", [
    "Threads que dividem a mesma memória.",
    "Processos, pods ou máquinas, cada um com a sua memória, criados pela infraestrutura.",
    "Uma goroutine por pedido.",
    "Uma única thread e muitos núcleos."
  ], 1, "A estoque-1 e a estoque-2 são dois processos em dois pods, com duas memórias.");
  choice("t4", 3, 3, "O relatorios ganha uma segunda réplica e o agendador roda nas duas às 23:00. O que acontece?", [
    "O fechamento roda duas vezes e o resumo do dia é gravado duas vezes.",
    "O Kubernetes cancela uma das execuções sozinho.",
    "O fechamento fica 2× mais rápido e correto.",
    "O banco recusa a segunda gravação por padrão."
  ], 0, "Faltou coordenação entre processos. Cada réplica faz o certo; juntas, duplicam a receita do dia.");
  tf("t4", 4, 2, "Um sync.Mutex em memória, em cada réplica, evita o fechamento duplicado entre as duas réplicas.", false,
    "Cada réplica tem o seu mutex, na sua memória. Entre processos é preciso uma trava que as duas enxerguem, como a do Redis.");

  /* ---------- 5. Concorrência vs paralelismo ---------- */
  choice("t5", 1, 1, "Qual é a diferença entre concorrência e paralelismo, segundo Rob Pike?", [
    "Concorrência é execução e paralelismo é estrutura.",
    "Concorrência é estrutura (partir o problema em partes independentes) e paralelismo é execução (rodar partes ao mesmo tempo).",
    "São a mesma coisa com nomes diferentes.",
    "Paralelismo só existe em Go."
  ], 1, "Dá para ter uma sem a outra: um programa bem estruturado roda intercalado em 1 núcleo e em paralelo em 4.");
  choice("t5", 2, 2, "A estoque-1, com 1 vCPU e muitos pedidos, tem o quê?", [
    "Paralelismo, sem concorrência.",
    "Concorrência e paralelismo.",
    "Nenhum dos dois.",
    "Concorrência, sem paralelismo."
  ], 3, "Há várias partes independentes (os pedidos), mas só um núcleo. O relatorios, com 4 fatias em 4 vCPU, tem os dois.");
  tf("t5", 3, 3, "Todo paralelismo envolve concorrência.", false,
    "Uma instrução SIMD faz a mesma conta em vários dados ao mesmo tempo, num único fluxo: há paralelismo, sem partes independentes intercaladas.");
  choice("t5", 4, 3, "Alguém sobe 4 threads de cálculo (10 s de CPU cada) num pod de 1 vCPU. Quanto leva?", [
    "10 s.",
    "20 s.",
    "Cerca de 40 s, ou mais, pelas trocas de contexto.",
    "2,5 s."
  ], 2, "Não há 4 núcleos, só 1: 4 × 10 s = 40 s de CPU. Mais threads que núcleos não aceleram cálculo.");
  choice("t5", 5, 2, "Como saber se o problema pede concorrência ou paralelismo?", [
    "Se o pedido espera mais do que calcula, concorrência; se calcula o tempo todo, paralelismo.",
    "Sempre os dois juntos.",
    "Depende só da linguagem escolhida.",
    "Se o pedido é rápido, paralelismo; se é lento, concorrência."
  ], 0, "O estoque gasta 18 de 20 ms esperando; o relatorios gasta quase tudo em CPU.");

  /* ---------- 6. Problemas clássicos ---------- */
  order("t6", 1, 2, "Ordene a corrida da Bia e do Caio pelo último gato.", [
    "A Bia lê quantidade = 1 (SELECT, t = 0)",
    "O Caio lê quantidade = 1, porque o UPDATE da Bia ainda não confirmou (t = 2)",
    "O UPDATE da Bia confirma: quantidade = 0 (t = 4)",
    "O UPDATE do Caio confirma: quantidade = −1 (t = 6)"
  ], "Os dois leem 1 antes de qualquer baixa. A janela é a de checar e baixar: 2 ms.");
  choice("t6", 2, 1, "Qual é o nome do defeito em que a decisão se apoia numa leitura que pode ter ficado velha?", [
    "Deadlock.",
    "Check-then-act (uma condição de corrida).",
    "Starvation.",
    "Fencing."
  ], 1, "Checar e baixar são dois passos, e o mundo muda entre eles.");
  choice("t6", 3, 2, "Das 6 ordens possíveis de 2 passos (checar e baixar) de cada um, quantas deixam o estoque em −1?", [
    "6.",
    "2.",
    "3.",
    "4."
  ], 3, "Só as 2 em que um pedido inteiro termina antes do outro começar (B1 B2 C1 C2 e C1 C2 B1 B2) dão certo.");
  choice("t6", 4, 1, "Quais são as 4 condições de Coffman para um deadlock?", [
    "Exclusão mútua, segura-e-espera, sem preempção e espera circular.",
    "Leitura, escrita, commit e rollback.",
    "Atomicidade, consistência, isolamento e durabilidade.",
    "Starvation, timeout, retry e fallback."
  ], 0, "As quatro precisam valer juntas. Tirar qualquer uma desfaz o deadlock.");
  choice("t6", 5, 3, "reservar trava estoque e depois pedido; cancelar trava pedido e depois estoque. Depois do timeout de 2 s do cliente, o que continua acontecendo?", [
    "As duas goroutines continuam presas segurando as travas, e toda reserva futura do gato fica pendurada.",
    "O Go solta as travas sozinho.",
    "Só a reserva da Bia falha, e o resto segue normal.",
    "O cliente repete e o deadlock se desfaz."
  ], 0, "O timeout atende o cliente, mas não solta as travas. O conserto é a ordem global das travas, um TryLock com tempo limite ou uma trava só.");
  choice("t6", 6, 2, "Como o PostgreSQL trata dois processos num deadlock?", [
    "Deixa os dois esperarem para sempre.",
    "Reinicia o servidor.",
    "Depois do deadlock_timeout (1 s por padrão), aborta uma transação com 'deadlock detected' (40P01) e a outra segue.",
    "Executa as duas ao mesmo tempo."
  ], 2, "O detector procura o ciclo, aborta uma das transações e deixa a outra continuar.");
  choice("t6", 7, 2, "O marketplace-xyz chama reservar em laço, sem pausa. O Caio tenta pegar a trava a cada 50 ms, sempre encontra ocupada e desiste aos 10 s. Como se chama isso?", [
    "Deadlock.",
    "Race condition.",
    "Starvation.",
    "Fencing."
  ], 2, "Ninguém travou: ele só nunca é servido, porque a trava não tem fila. O sync.Mutex evita isso com o modo de starvation, a partir de 1 ms de espera.");
  choice("t6", 8, 3, "PedidoPago (versão 2) chegou antes de PagamentoPendente (versão 1) do pedido 1049. O que faz UPDATE ... SET status = 'aguardando_pagamento', event_version = 1 WHERE id = 1049 AND event_version < 1?", [
    "Atualiza 1 linha e o pedido volta para aguardando.",
    "Atualiza 0 linhas: a versão gravada (2) não é menor que 1, e o evento velho é ignorado.",
    "Apaga o pedido.",
    "Dá deadlock com o evento de versão 2."
  ], 1, "O guarda de versão impede o pedido de regredir de pago para aguardando.");
  tf("t6", 9, 3, "O exemplo do artigo com event_version < N é um last-write-wins de verdade.", false,
    "É um guarda de versão monótona. O LWW de verdade decide pelo timestamp do relógio e perde escritas quando os relógios divergem.");

  /* ---------- 7. Mutex ---------- */
  choice("t7", 1, 1, "O que um mutex garante?", [
    "Que várias goroutines entrem juntas na seção crítica.",
    "Que só uma goroutine por vez entre na seção crítica.",
    "Que a goroutine rode mais rápido.",
    "Que o banco aceite mais conexões."
  ], 1, "Lock antes de ler e baixar, Unlock depois. As outras esperam.");
  choice("t7", 2, 2, "Com o mutex, o Caio chega em t = 2 e a Bia sai em t = 4. O que acontece com ele?", [
    "Compra o gato e o estoque vai a −1.",
    "Espera 2 ms, lê 0 em t = 6 e recebe 409 sem estoque.",
    "Recebe 409 imediatamente, em t = 2.",
    "Fica esperando para sempre."
  ], 1, "O 409 sai 4 ms depois de ele chegar. A janela de 2 ms foi fechada.");
  choice("t7", 3, 2, "Com a seção crítica de 4 ms (SELECT e UPDATE), qual é o máximo de reservas por segundo do mesmo SKU numa réplica?", [
    "500.",
    "166.",
    "250.",
    "50."
  ], 2, "1 s ÷ 4 ms = 250. Encolher a seção sobe o teto.");
  choice("t7", 4, 3, "O Unlock foi escrito só no fim da função, e o if q < 1 { return ErrSemEstoque } vem antes dele. O que acontece quando o Caio recebe o 409?", [
    "A trava solta sozinha ao sair da função.",
    "A trava fica presa, e toda reserva futura do gato espera para sempre.",
    "O Go avisa com um erro de compilação.",
    "Só o Caio fica sem resposta."
  ], 1, "Por isso o defer mu.Unlock() vem logo depois do Lock.");
  choice("t7", 5, 3, "O mutex/main.go do laboratório dorme 100 ms com o mutex travado. Quanto levam 100 itens?", [
    "Cerca de 100 ms.",
    "10 s, porque ficam em série.",
    "1 s.",
    "100 s."
  ], 1, "100 × 100 ms = 10 s. Com o Sleep fora da trava, cairia para cerca de 100 ms. Trave só o que precisa.");
  choice("t7", 6, 2, "UPDATE estoque SET quantidade = quantidade - 1 WHERE sku = 'GATO-042' AND quantidade > 0 resolve a corrida de qual forma?", [
    "Lock pessimista, travando a linha antes de ler.",
    "Lock otimista: age e confere no fim. A Bia afeta 1 linha, o Caio 0 linhas e leva 409.",
    "Com um mutex em memória.",
    "Com um fencing token."
  ], 1, "Sem trava em memória e sem Redis, funciona com qualquer número de réplicas.");
  tf("t7", 7, 3, "No Go, o sync.Mutex impede que uma goroutine destrave uma trava de outra.", false,
    "A documentação diz que é permitido. A regra de que quem trava destrava é disciplina do código, não imposição da linguagem.");

  /* ---------- 8. Mutex distribuído ---------- */
  choice("t8", 1, 2, "Com 2 réplicas, por que o sync.Mutex não basta para o último gato?", [
    "Porque o sync.Mutex só funciona com uma goroutine.",
    "Porque cada réplica tem o seu mutex, em memórias diferentes: os dois leem 1 e o estoque vai a −1.",
    "Porque o Redis é mais rápido.",
    "Porque o PostgreSQL ignora o mutex."
  ], 1, "O mutex local só protege dentro do processo.");
  choice("t8", 2, 1, "O que faz SET lock:estoque:GATO-042 <token> NX PX 5000?", [
    "Cria a chave só se não existir e já com TTL de 5 s, num comando atômico.",
    "Apaga a chave depois de 5 s, sempre.",
    "Lê a chave e a recria.",
    "Cria a chave 5 vezes."
  ], 0, "O NX cria só se não existir; o PX 5000 dá o TTL. Por ser um comando só, dois pedidos não passam juntos.");
  choice("t8", 3, 2, "O ciclo da trava no Redis tem 6 ms (1 de SET + 4 de trabalho + 1 de DEL). Qual o máximo por SKU?", [
    "250 reservas por segundo.",
    "500 reservas por segundo.",
    "166 reservas por segundo.",
    "60 reservas por segundo."
  ], 2, "1 s ÷ 6 ms ≈ 166, menos que os 250 do mutex local: a ida e volta ao Redis tem custo.");
  order("t8", 4, 3, "Ordene o lock no Redis entre a Bia e o Caio, com o Caio tentando a cada 50 ms.", [
    "Bia: SET NX → OK (t = 1 ms)",
    "Caio: SET NX → nil, a chave existe (t = 3 ms)",
    "Bia solta a trava (t = 6 ms)",
    "Caio tenta de novo e pega a trava (t = 53 ms)",
    "Caio lê 0 e recebe 409 (t ≈ 56 ms)"
  ], "O Caio não é servido na hora: ele espera a próxima tentativa, 50 ms depois da anterior.");
  choice("t8", 5, 3, "A Bia pega a trava (TTL 5 s) e pausa por 6 s antes do UPDATE. O Caio pega a trava depois do vencimento e compra. O que acontece quando a Bia acorda?", [
    "O banco descobre que a trava vencera e cancela o UPDATE.",
    "Ela percebe que perdeu a trava e para.",
    "O UPDATE dela leva o estoque a −1: ela ainda acha que tem a trava.",
    "O Redis devolve a trava para ela."
  ], 2, "A trava venceu em 5,001 s e o Caio a pegou em 5,003 s. Sem fencing nem checagem no banco, o −1 passa.");
  choice("t8", 6, 2, "Como o fencing token impede o UPDATE atrasado da Bia?", [
    "O serviço de lock devolve um número crescente (33 para a Bia, 34 para o Caio), e o banco recusa escrita com número menor que o maior já visto.",
    "O Redis apaga o UPDATE da Bia.",
    "O TTL é aumentado para 10 s.",
    "A Bia recebe um novo token com o mesmo número."
  ], 0, "O UPDATE da Bia chega com o 33 e o banco já viu o 34.");
  choice("t8", 7, 3, "Qual dos remédios para o TTL vencido não depende de relógio nenhum?", [
    "Aumentar o TTL.",
    "O token por dono com compara-e-apaga.",
    "O UPDATE ... AND quantidade > 0, em que o banco decide.",
    "Reiniciar a réplica."
  ], 2, "Quem decide é o banco, no momento da escrita. Para o último gato, ele resolve sem lock distribuído.");
  choice("t8", 8, 2, "Segundo Kleppmann, qual é a diferença entre lock de eficiência e lock de correção?", [
    "Eficiência é o do ZooKeeper e correção é o do Redis.",
    "Eficiência evita trabalho repetido (falhar custa pouco); correção protege o dado (falhar vende o gato duas vezes e exige fencing ou checagem no banco).",
    "Não há diferença.",
    "Eficiência usa TTL e correção não."
  ], 1, "O Redis simples serve ao primeiro. O segundo precisa de mais que o lock.");
  tf("t8", 9, 3, "O SET NX do Redis entrega um fencing token, como o ZooKeeper.", false,
    "O ZooKeeper dá um número crescente (sequência ou zxid). O SET NX do Redis só diz se criou ou não: não gera número.");
  choice("t8", 10, 2, "Na receita oficial do ZooKeeper, como o lock é guardado?", [
    "Com um nó fixo e permanente.",
    "Com nós efêmeros e sequenciais: o menor número tem a trava e os demais observam só o anterior.",
    "Com um script Lua.",
    "Com um arquivo no disco."
  ], 1, "É uma fila justa, sem a manada de todo mundo acordando quando a trava solta.");

  /* ---------- 9. Spinlocks ---------- */
  choice("t9", 1, 1, "O que o spinlock faz no lugar de dormir?", [
    "Cria uma nova goroutine.",
    "Fica girando num laço, repetindo um compare-and-swap até conseguir a trava.",
    "Pede ao Redis a trava.",
    "Aumenta o TTL."
  ], 1, "A operação atômica compara e troca num passo: ninguém se mete entre os dois.");
  choice("t9", 2, 2, "Quando um spinlock compensa?", [
    "Quando a seção crítica é maior que um segundo.",
    "Quando há uma chamada ao banco dentro da trava.",
    "Quando a seção crítica é menor que o custo de dormir e acordar, como incrementar um contador (cerca de 20 ns).",
    "Sempre."
  ], 2, "Girar um instante é mais barato que dormir. Para milissegundos, queima CPU à toa.");
  choice("t9", 3, 3, "Um spinlock cobre 5 ms de banco num nó de 8 núcleos: 1 goroutine segura e 7 giram. Quanto da CPU do nó se queima esperando?", [
    "12,5%.",
    "50%.",
    "100%.",
    "87,5%."
  ], 3, "7 de 8 núcleos: 87,5%. Num pod de 1 vCPU é pior: quem gira ocupa o único núcleo.");
  tf("t9", 4, 2, "O spinlock do laboratório é um spinlock puro.", false,
    "O laço chama runtime.Gosched() a cada volta, cedendo a vez. É mais um lock que cede, e o Gosched não está no Unlock, como diz o comentário.");

  /* ---------- 10. Semáforos e thread pools ---------- */
  choice("t10", 1, 1, "O que é um semáforo contador?", [
    "Uma trava com N vagas: quem chega com todas ocupadas espera uma ser liberada.",
    "Um mutex com dono.",
    "Um contador de requisições por minuto.",
    "Uma fila de mensagens."
  ], 0, "O pool de 10 conexões do estoque é um semáforo de 10 vagas na frente do PostgreSQL.");
  choice("t10", 2, 2, "Pela lei de Little, quantas conexões a carga pede com 500 pedidos por segundo e 20 ms por consulta?", [
    "100.",
    "1.",
    "50.",
    "10."
  ], 3, "Conexões = vazão × tempo = 500/s × 0,020 s = 10.");
  choice("t10", 3, 3, "200 pedidos simultâneos, pool de 10 e 20 ms por consulta. Quando termina o último?", [
    "20 ms.",
    "400 ms, no 20º lote (20 × 20 ms).",
    "200 ms.",
    "4 s."
  ], 1, "A média é 210 ms e a vazão é 500/s. Sem pool, 200 conexões passariam do limite de 100.");
  choice("t10", 4, 3, "O autoscaling sobe o estoque para 12 réplicas, cada uma com pool de 10. Qual é o problema?", [
    "Cada réplica fica lenta demais.",
    "12 × 10 = 120 conexões passam do max_connections de 100: o banco recusa com 'too many clients already'.",
    "O pool deixa de funcionar.",
    "Nenhum: o banco aceita conexões ilimitadas."
  ], 1, "Escalar réplicas tem teto no banco. Remédios: PgBouncer, 12 × 8 = 96 por réplica ou subir o max_connections.");
  choice("t10", 5, 2, "Qual é a diferença entre semáforo e worker pool?", [
    "São o mesmo mecanismo.",
    "O semáforo limita quantas execuções rodam ao mesmo tempo (uma goroutine por tarefa); o worker pool tem um número fixo de workers lendo de uma fila.",
    "O worker pool só existe em Java.",
    "O semáforo só vale para o banco de dados."
  ], 1, "O laboratório cria uma goroutine por tarefa e só limita quantas rodam: é um semáforo, não um worker pool.");
  choice("t10", 6, 2, "Qual é a diferença entre um mutex e um semáforo binário?", [
    "O mutex tem 2 vagas.",
    "O mutex tem dono (quem travou destrava); o semáforo binário não tem dono.",
    "O semáforo binário é mais rápido.",
    "Nenhuma."
  ], 1, "A diferença não é a contagem, e sim a posse.");
  choice("t10", 7, 3, "No laboratório do semáforo (capacidade 3, 10 alimentos, 2 s cada), quanto tempo leva tudo?", [
    "2 s.",
    "20 s.",
    "6 s.",
    "8 s: ⌈10 ÷ 3⌉ = 4 ondas de 2 s."
  ], 3, "Saem 3, 3, 3 e 1: quatro ondas de 2 s, e o log do artigo bate com isso.");

  window.QUIZ = out;
})();
