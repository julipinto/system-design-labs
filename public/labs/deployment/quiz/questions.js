/* Banco de perguntas do quiz de Modelos de Deployment.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-deploy-e-rollback", name: "Deploy e rollback" },
    t2: { topic: "aula-2-big-bang-recreate", name: "Big Bang (Recreate)" },
    t3: { topic: "aula-3-rolling-updates", name: "Rolling updates" },
    t4: { topic: "aula-4-blue-green", name: "Blue/Green" },
    t5: { topic: "aula-5-blue-green-exemplo", name: "Blue/Green, o exemplo do laboratório" },
    t6: { topic: "aula-6-canary-releases", name: "Canary releases" },
    t7: { topic: "aula-7-canary-exemplo", name: "Canary, o exemplo do laboratório" },
    t8: { topic: "aula-8-migrations-e-versoes-de-dados", name: "Migrations e versões de dados" },
    t9: { topic: "aula-9-shadow-traffic", name: "Shadow traffic" },
    t10: { topic: "aula-10-shadow-traffic-exemplo", name: "Shadow traffic, o exemplo do laboratório" },
    t11: { topic: "aula-11-feature-flags", name: "Feature flags" },
    t12: { topic: "aula-12-sharding-bulkheads-e-ring-deployments", name: "Sharding, bulkheads e ring deployments" }
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

  /* ---------- Deploy e rollback ---------- */
  choice("t1", 1, 1, "Qual é a diferença entre publicar (deploy) e liberar (release)?", ["Publicar é pôr a versão no ar; liberar é o cliente passar a usá-la.", "São sinônimos.", "Publicar é voltar a versão; liberar é subir a nova.", "Liberar é rodar os testes; publicar é escrever o código."], 0, "Com a flag frete_v2 desligada, a 2.5.0 está publicada em todos os pods e não está liberada para ninguém.");
  tf("t1", 2, 1, "O kubectl rollout undo devolve ao banco as linhas que a 2.5.0 gravou com frete 0,00.", false, "O undo volta o ReplicaSet (o código). Os 3.600 pedidos já gravados ficam na tabela; o conserto é um UPDATE de reconciliação.");
  choice("t1", 3, 2, "A 2.5.0 grava frete 0,00 para Recife (1 pedido/s) e ninguém percebe por 60 minutos. Qual é a perda?", ["R$ 450", "R$ 3.600", "R$ 54.000", "R$ 486.000"], 2, "1 pedido/s × 3.600 s = 3.600 pedidos × R$ 15,00 = R$ 54.000. Os R$ 486.000 são o caso das 23:00, 9 h depois.");
  choice("t1", 4, 2, "O que acontece com revisionHistoryLimit igual a 0?", ["O rollout fica mais rápido e nada muda.", "O Kubernetes não guarda revisões antigas e o rollout undo deixa de ter para onde voltar.", "O Deployment não cria ReplicaSets.", "O rollout volta sozinho em caso de erro."], 1, "O padrão é 10. Com 0 a possibilidade de voltar com rollout undo desaparece.");
  choice("t1", 5, 3, "Qual é a fórmula do raio de explosão de uma mudança?", ["Número de pods × versão.", "Latência × taxa de erros.", "Fração do tráfego exposta × tempo até alguém perceber × custo por pedido errado.", "Tempo de build × número de commits."], 2, "Os modelos de deployment diferem no controle dos dois primeiros fatores; nenhum conserta o terceiro, e o que determina o segundo é o que se mede.");

  /* ---------- Big Bang (Recreate) ---------- */
  choice("t2", 1, 1, "O que o Recreate faz?", ["Troca um pod por vez.", "Sobe um segundo ambiente e vira o ponteiro.", "Encerra todos os pods antigos antes de criar os novos.", "Copia o tráfego para a versão nova."], 2, "É o único modelo sem duas versões ao mesmo tempo, e o preço é o tempo fora do ar.");
  choice("t2", 2, 2, "Quanto tempo o pedidos fica fora do ar num Recreate (pods de 30 s)?", ["30 s", "40 s", "90 s", "10 s"], 1, "10 s para encerrar os 3 pods antigos e 30 s para os novos ficarem prontos: 40 s, ou 200 pedidos recusados a 5/s.");
  choice("t2", 3, 3, "A 2.5.0 não sobe depois de um Recreate. Quantos segundos fora do ar até desfazer?", ["40 s", "80 s", "120 s", "10 s"], 1, "Os antigos já morreram: 40 s do primeiro Recreate, sem nenhum pod útil, e mais 40 s do Recreate de volta. São 400 recusados a 5/s e 2.400 a 30/s.");
  tf("t2", 4, 2, "O Recreate só é viável com comunicação assíncrona e consistência eventual.", false, "Correção ao artigo: o critério é as duas versões não poderem coexistir (ou a transição custar mais que a parada). O preço é o tempo fora do ar.");
  choice("t2", 5, 3, "No entregas (3 partições Kafka, 6 s por rebalance), quanto interrompe um rolling de 3 pods?", ["6 s", "12 s", "36 s", "3 s"], 2, "3 trocas × 2 rebalances × 6 s = 36 s. O Recreate faz 1 rebalance de 6 s. Hoje o rebalance cooperativo (KIP-429) reduz isso: o Recreate não é a única saída.");

  /* ---------- Rolling updates ---------- */
  choice("t3", 1, 2, "Com 3 réplicas e o padrão de 25%, quanto valem maxSurge e maxUnavailable?", ["1 e 0", "0 e 1", "1 e 1", "0 e 0"], 0, "25% de 3 = 0,75: o maxSurge arredonda para cima (1) e o maxUnavailable para baixo (0).");
  choice("t3", 2, 2, "Quanto tempo leva o rolling de 3 pods com pods prontos em 30 s?", ["30 s", "60 s", "90 s", "40 s"], 2, "3 ondas de 30 s, sem downtime: a 2.5.0 vê 0%, 33%, 67% e 100%.");
  choice("t3", 3, 3, "No catalogo (10 pods, 640 req/s, 100 req/s por pod) com maxUnavailable 3, qual é a utilização no mínimo de pods prontos?", ["64%", "80%", "71,1%", "91,4%"], 3, "Com 3 fora restam 7 pods: 640 ÷ 700 = 91,4%, e R = 126,7 ms. Com maxUnavailable 2 seriam 8 prontos: 80% e 60 ms.");
  tf("t3", 4, 2, "O rolling update confere se o resultado de negócio está certo antes de avançar a onda.", false, "Ele confere o readiness (e o minReadySeconds): saúde do pod. O frete zero passa porque a 2.5.0 responde 201 com 0% de erros.");
  choice("t3", 5, 3, "Durante o rolling, por que tudo que as duas versões tocam precisa funcionar para as duas?", ["Porque o Kubernetes reinicia os pods duas vezes.", "Porque a 2.4.0 e a 2.5.0 convivem no mesmo balanceador por 90 s.", "Porque o rolling usa dois bancos.", "Porque a 2.5.0 ainda não terminou de compilar."], 1, "O lb-loja reparte entre os pods das duas versões. É o assunto da aula 8: dados e eventos compatíveis com a N e a N−1.");

  /* ---------- Blue/Green ---------- */
  choice("t4", 1, 1, "Como funciona o blue/green?", ["Duas versões atendem metade do tráfego cada, para sempre.", "Dois ambientes iguais: o green é testado sem cliente e a virada troca um ponteiro.", "Os pods trocam um a um em ondas.", "Uma cópia do tráfego vai para a versão nova."], 1, "O blue (2.4.0) atende, o green (2.5.0) é validado e, depois, a virada é trocar o Service ou a rota.");
  choice("t4", 2, 2, "Quantos pods o catalogo usa no blue/green da Black Friday?", ["10", "13", "20", "30"], 2, "10 + 10 = 20 pods: 10 réplica-horas a mais por hora de janela.");
  tf("t4", 3, 2, "Voltar para o blue desfaz o que o green gravou no banco.", false, "Blue e green falam com o mesmo banco. Voltar o ponteiro não desfaz as linhas gravadas.");
  choice("t4", 4, 3, "Por que a virada \"instantânea\" não é instantânea para o fluxo?", ["Porque o ponteiro demora 60 s.", "Porque o Kubernetes recria o Service.", "Porque o green precisa compilar de novo.", "Porque conexões abertas (keep-alive, HTTP/2, gRPC) continuam nos pods antigos e o DNS tem TTL."], 3, "O ponteiro troca em cerca de 1 s; o fluxo só acompanha quando as conexões antigas fecham ou o TTL do DNS expira.");
  choice("t4", 5, 3, "O green frio leva 200 ms por requisição a 640 req/s, com 10 pods de 10 workers. O que acontece?", ["128 requisições em voo contra 100 workers: forma fila.", "Nada: 12,8 em voo cabem.", "O Kubernetes reinicia o green.", "A CPU cai a 0%."], 0, "Lei de Little: 640 × 0,2 s = 128 em voo; 10 pods × 10 workers = 100. O conserto é o warm-up antes da virada.");

  /* ---------- Blue/Green, o exemplo do laboratório ---------- */
  choice("t5", 1, 1, "No Argo Rollouts, qual Service recebe a versão nova para teste?", ["activeService", "previewService", "canaryService", "stableService"], 1, "O activeService recebe o cliente (o blue); o previewService (chip-green no laboratório) recebe o green.");
  choice("t5", 2, 2, "O que faz autoPromotionEnabled: false?", ["Desliga o blue/green.", "Promove sozinho depois de 60 s.", "Deixa a promoção manual: alguém aprova o green.", "Apaga o green."], 2, "A promoção só acontece quando uma pessoa a aprova (ou o prePromotionAnalysis passa, no automated).");
  choice("t5", 3, 2, "Qual é o scaleDownDelaySeconds padrão do Argo Rollouts, e o do arquivo simple do laboratório?", ["30 s e 60 s", "60 s e 30 s", "10 s e 60 s", "0 s e 30 s"], 0, "O padrão é 30 s e o simple fixa 60 s. No automated a linha está comentada, então vale o padrão.");
  tf("t5", 4, 3, "A análise automática do laboratório (cassowary e taxa de sucesso >= 0.95) pegaria o frete zero da 2.5.0.", false, "O 201 com frete 0,00 conta como sucesso, e >= 0.95 ainda aceita 5% de erro. Só uma métrica de negócio pega o frete.");
  choice("t5", 5, 3, "O defeito aparece 8 min depois da virada e o blue saiu aos 60 s. Qual é o conserto de desenho?", ["Desligar o Prometheus.", "Voltar a análise para 0.5.", "Usar menos réplicas.", "Dimensionar o scaleDownDelaySeconds pelo tempo de detecção, não pelo de virada."], 3, "Se a loja só nota em 8 min, o blue precisa viver 8 min (custando 3 pods a mais), ou o canary reduz a exposição desde o começo.");

  /* ---------- Canary releases ---------- */
  choice("t6", 1, 1, "O que é um canary?", ["Um segundo ambiente igual ao de produção.", "Uma fatia do tráfego real vai para a versão nova e só cresce se a análise passar.", "Uma cópia do tráfego cuja resposta é descartada.", "Uma flag desligada."], 1, "O canary divide o tráfego entre a versão estável e a nova, medindo antes de crescer.");
  choice("t6", 2, 2, "No degrau de 10% por 5 min a 5 pedidos/s, quantos pedidos de Recife chegam ao canary?", ["30", "150", "300", "15"], 0, "5 × 300 × 10% = 150 pedidos, e 20% deles são de Recife: 30, todos com frete zero (R$ 450).");
  choice("t6", 3, 3, "Com erro verdadeiro de 1% e 150 requisições no canary, qual é a chance de não ver nenhum erro?", ["1%", "22%", "50%", "78%"], 1, "0,99 elevado a 150 = 22%. Para ver pelo menos um erro com 95% de confiança são necessárias 298 requisições.");
  tf("t6", 4, 2, "Sem trafficRouting, o Argo Rollouts aproxima o peso do canary pelo número de pods.", true, "Com 3 pods o mínimo é 1 de 3 = 33%. Com a malha (módulo 10) o peso é exato, como 10%.");
  choice("t6", 5, 3, "Com que o SRE Workbook manda comparar o canary?", ["Com o dia anterior.", "Com a meta do mês.", "Com o controle estável no mesmo intervalo.", "Com a média da semana."], 2, "O dia anterior tinha outro tráfego. O artigo-base não diz isso, e fala em semanas ou meses; em software são minutos a horas.");

  /* ---------- Canary, o exemplo do laboratório ---------- */
  choice("t7", 1, 1, "O que significa pause: { } num passo do canary do laboratório?", ["Pausa de 10 s.", "Pausa de 1 min.", "Pausa sem fim: alguém promove à mão.", "Nenhuma pausa."], 2, "A promoção é manual (kubectl argo rollouts promote). Com duration, a promoção é automática, por relógio.");
  choice("t7", 2, 2, "Quanto tempo leva o canary time do laboratório (10 s por degrau, pesos 0, 10, 20, 40, 80, 100)?", ["10 s", "30 s", "50 s", "90 s"], 2, "5 pausas de 10 s: 50 s, mais rápido que o rolling de 3 pods. Canary por tempo sem análise é rolling com mais passos.");
  order("t7", 3, 2, "Ponha em ordem os passos do analysis do laboratório.", ["setWeight 20", "pause 30s", "primeira análise", "setWeight 50", "pause 1m", "segunda análise", "setWeight 100"], "São os passos das linhas 43 a 53: 20 → pausa 30 s → análise → 50 → pausa 1 min → análise → 100.");
  choice("t7", 4, 3, "Qual destas NÃO é uma das cinco lacunas da análise do laboratório?", ["Tolera 5% de 5xx.", "count: 1 (uma medição).", "Mede o serviço inteiro e dilui o canary.", "Usa Kubernetes."], 3, "As cinco: 5% de tolerância, só vê 5xx, serviço inteiro, irate (em vez de rate) e count: 1.");
  choice("t7", 5, 3, "Por que medir o serviço inteiro dilui o erro do canary?", ["Porque o Prometheus tem pouca memória.", "Porque o canary não gera métricas.", "Porque estável e canary entram na mesma taxa, e o erro aparece só pelo peso do canary.", "Porque o serviço inteiro é mais lento."], 2, "Com 10% de canary, o erro dele vira cerca de um décimo na taxa. É preciso filtrar pelo subconjunto ou pela versão.");

  /* ---------- Migrations e versões de dados ---------- */
  order("t8", 1, 2, "Ponha em ordem o plano do frete (expandir e contrair).", ["Expandir: ADD COLUMN frete", "Publicar a 2.5.0 (grava total e frete)", "Backfill em lotes", "Publicar a 2.6.0 (lê frete)", "Contrair: SET NOT NULL e remover o código velho"], "Cada passo serve à versão N e à N−1. A migration roda antes e depois do deploy, nunca dentro dele.");
  choice("t8", 2, 2, "Em 1 milhão de linhas, qual ADD COLUMN reescreve a tabela inteira?", ["NULL, sem padrão (3,2 ms).", "NOT NULL DEFAULT 'BRL' (1,9 ms).", "NOT NULL DEFAULT random() (7,9 s): padrão volátil.", "Nenhum."], 2, "O padrão constante fica nos metadados (PostgreSQL 11 ou mais); o volátil precisa de um valor por linha e reescreve a tabela.");
  choice("t8", 3, 3, "Quanto a tabela de 1.975 MB cresce com o UPDATE único e com 100 lotes de 10.000 (com VACUUM)?", ["+22% e +100%", "+100% e +22%", "+100% nos dois", "+0% e +0%"], 1, "O UPDATE único leva a 3.950 MB (+100%); em lotes, 2.407 MB (+22%).");
  choice("t8", 4, 3, "Um ALTER TABLE espera uma transação longa e um SELECT chega depois. O que acontece sem lock_timeout?", ["O SELECT passa na frente.", "O SELECT espera atrás do ALTER (4,0 s na medição): a fila trava todo mundo.", "O ALTER cancela a transação longa.", "O PostgreSQL ignora o ALTER."], 1, "Com lock_timeout de 1 s o ALTER desiste em 1,0 s (canceling statement due to lock timeout) e o SELECT passa.");
  choice("t8", 5, 3, "A 2.6.0 troca mod 3 por mod 4. Que fração das chaves muda de shard na amostra, e o que a Lena perde de vista?", ["10%: nada.", "75,2%: a 2.6.0 não acha os 6 pedidos dela (1042, 1044, 1047, 1048, 1051, 1054).", "100%: a loja inteira.", "20%: só o Davi."], 1, "Está no shard-1 e a 2.6.0 procura no shard-0. A função de roteamento é dado versionado e muda em expandir e contrair, lendo dos dois.");

  /* ---------- Shadow traffic ---------- */
  choice("t9", 1, 1, "O que o shadow faz com o tráfego?", ["Divide entre a versão estável e a nova.", "Copia uma parte para a versão nova e descarta a resposta.", "Desliga a versão estável.", "Cria um segundo banco."], 1, "O espelho é duplicação, não divisão: o estável continua com 100% e o cliente nunca vê a sombra.");
  choice("t9", 2, 2, "Quanto tráfego um espelho de 10% do catalogo (640 req/s) manda para 1 réplica da sombra?", ["10 req/s", "64 req/s", "640 req/s", "6,4 req/s"], 1, "64 req/s em 1 réplica de 100 req/s: ρ = 64% e R = 37,8 ms (tabela do módulo 14).");
  tf("t9", 3, 2, "Sem um comparador, o shadow ensina o mesmo que com ele.", false, "O Istio descarta a resposta. O comparador junta a da 2.4.0 e a da 2.5.0 pelo x-request-id e acha o 64,00 contra 49,00.");
  choice("t9", 4, 3, "Em 5 min o shadow de 10% do pedidos copia 150 pedidos. Quantos de Recife divergem?", ["150", "0", "30, todos com total diferente (64,00 × 49,00)", "15"], 2, "20% de 150 = 30, todos divergentes: o defeito do frete visível, sem nenhum pedido real afetado.");
  choice("t9", 5, 3, "O tx.Rollback() do dry-run desfaz o INSERT. O que continua acontecendo?", ["Nada: o dry-run é seguro.", "A sombra chamou o pagamentos de verdade e publicou o evento: 150 cobranças de R$ 64,00 = R$ 9.600.", "O Istio cobra duas vezes.", "O banco trava."], 1, "O rollback só alcança a transação do banco. Conserto: stub do pagamentos (ou x-shadow recusado), tópico pedidos.shadow e idempotência.");

  /* ---------- Shadow traffic, o exemplo do laboratório ---------- */
  choice("t10", 1, 1, "Qual é o percent do espelho no laboratório do autor?", ["100", "10", "1", "50"], 2, "percent: 1, para chip.shadow.svc.cluster.local:8080.");
  choice("t10", 2, 2, "Quantos pedidos por minuto o espelho de 1% copia de 5 pedidos/s?", ["3", "30", "0,3", "300"], 0, "1% de 5/s = 0,05/s = 3 por minuto: amostra pequena para o pedidos.");
  tf("t10", 3, 2, "No laboratório, o estável e a sombra são o mesmo app em namespaces iguais.", false, "São dois apps: o chip (10 réplicas, namespace chip) e o chip-shadow (namespace shadow, versão v9, 1 réplica).");
  choice("t10", 4, 3, "Qual destas NÃO falta no laboratório de shadow?", ["O comparador das respostas.", "O espelho em si (mirror).", "Amostra suficiente para escrita.", "Capacidade da sombra igual à do estável."], 1, "O mirror existe e funciona. Faltam comparador, amostra, capacidade da sombra e tirar os passos de canary de um app que é só sombra.");
  choice("t10", 5, 3, "Espelhar 100% do catalogo (640 req/s) para 1 réplica de 100 req/s causa que utilização?", ["64%", "100%", "320%", "640%"], 3, "640 ÷ 100 = 640%: fila infinita. Ninguém vê, porque a resposta é descartada, e se a sombra divide banco ou cache o estável sente.");

  /* ---------- Feature flags ---------- */
  choice("t11", 1, 1, "O que a feature flag separa?", ["O banco do cache.", "O blue do green.", "O código do binário.", "Publicar (deploy) de liberar (release)."], 3, "O código da 2.5.0 vai a 100% dos pods com frete_v2 desligada; ligar a flag é liberar.");
  choice("t11", 2, 2, "Qual é o bucket de lena-77 em frete_v2, e a partir de que percentual ela liga?", ["3, a 4%", "19, a 20%", "38, a 39%", "94, a 95%"], 1, "bucket = murmur3('frete_v2:lena-77') mod 100 = 19, e liga quando bucket < percentual: com 20% sim, com 10% não.");
  order("t11", 3, 2, "Ponha os clientes da amostra na ordem em que a flag frete_v2 os liga, subindo o percentual.", ["caio-58 (3)", "lena-77 (19)", "bia-31 (38)", "mkt-01 (41)", "davi-12 (94)"], "A 10% só o Caio (Rio, sem defeito); a 20% a Lena (Recife, aparece); a 50% Bia e mkt-01; a 100% o Davi.");
  tf("t11", 4, 2, "O cálculo da flag é por cliente, e não por requisição, para a mesma pessoa não ver as duas versões enquanto os pods discordam por até 30 s.", true, "O cache local tem TTL de 30 s. O mesmo cliente cai sempre do mesmo lado porque o bucket depende do cliente_id e do nome da flag.");
  choice("t11", 5, 3, "O serviço de flags cai e o padrão compilado é true. O que acontece quando o cache expira?", ["Nada: o padrão é só decorativo.", "A feature liga para todos de uma vez, sem deploy e sem canary.", "A feature desliga para todos.", "O pod reinicia."], 1, "Por isso o padrão é o comportamento antigo (false), e a flag é removida do código quando chega a 100% e estabiliza.");

  /* ---------- Sharding, bulkheads e ring deployments ---------- */
  choice("t12", 1, 1, "Quais são os anéis da loja e a exposição acumulada?", ["shard-0 (20%) → shard-1 (20%) → shard-2 (60%): 20% → 40% → 100%.", "shard-2 → shard-1 → shard-0: 60% → 80% → 100%.", "Três anéis de 33%.", "Um anel só."], 0, "A exposição acumulada é 20%, 40% e 100%, na ordem dos shards do módulo 16.");
  choice("t12", 2, 2, "Em que anel aparece o frete zero de Recife, e com que exposição?", ["Anel 0, com 20%.", "Anel 1, com 40% do tráfego já na 2.5.0.", "Anel 2, com 100%.", "Nunca aparece."], 1, "O anel 0 tem o davi-12 (SP) e não exercita Recife; a Lena está no shard-1.");
  choice("t12", 3, 2, "Como pegar o defeito já no anel 0?", ["Aumentar o anel 0 para 60%.", "Pular o anel 0.", "Pôr clientes sintéticos com pedidos em todas as cidades.", "Esperar mais um dia."], 2, "É a ideia do one-box da AWS: quem exercita o código importa mais que o tamanho do anel.");
  tf("t12", 4, 3, "O k-means identifica quais clientes são de baixo risco para o primeiro anel.", false, "Correção ao artigo: o k-means descobre grupos parecidos. O primeiro anel sai de critério de risco e de negócio (funcionários, sintéticos, regiões pequenas).");
  choice("t12", 5, 3, "Com a Black Friday dobrada (60 pedidos/s), um pod de 30/s aguenta o shard-2 (60%)?", ["Sim: 18/s.", "Sim: 30/s exato.", "Não: 36/s passa de 30, e o anel quente precisa de mais pods.", "Sim, porque o shard-2 é o último."], 2, "60 × 60% = 36/s. Anéis custam pods por anel e uma versão por anel para operar.");

  window.QUIZ = out;
})();
