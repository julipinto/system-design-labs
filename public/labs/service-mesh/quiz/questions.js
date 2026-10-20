/* Banco de perguntas do quiz de Service Mesh.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introdução ao service mesh" },
    t2: { topic: "aula-2-features-agregadas", name: "Features agregadas da malha" },
    t3: { topic: "aula-3-control-plane-e-data-plane", name: "Control plane e data plane" },
    t4: { topic: "aula-4-modelos-sdk-sidecar-e-proxyless", name: "Modelos: SDK, sidecar e proxyless" },
    t5: { topic: "aula-5-modelos-ebpf-e-ztunnel", name: "Modelos: eBPF e ztunnel (ambient)" },
    t6: { topic: "aula-6-casos-de-uso-e-alternativas", name: "Casos de uso e alternativas" }
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


  /* ---------- 1. Introdução ao service mesh ---------- */
  choice("t1", 1, 1, "O que é um service mesh, numa frase?", [
    "Um banco de dados distribuído para os serviços da loja.",
    "Uma camada de rede que cuida da conversa entre os serviços com um proxy ao lado de cada um, no lugar de retry, timeout e TLS escritos em cada código.",
    "Um balanceador de carga que fica na frente da loja inteira.",
    "Uma biblioteca de log que todo serviço precisa importar."
  ], 1, "A malha move para a rede o que cada time escrevia no código. O proxy fica ao lado de cada serviço e o app continua chamando http://pagamentos:8080/cobrancas como antes.");
  choice("t1", 2, 1, "Qual era o problema da loja antes da malha?", [
    "Os serviços eram lentos demais para o Kubernetes.",
    "Cada time escreveu retry, timeout, TLS e métrica do seu jeito: o pedidos tenta 5 vezes sem esperar, o estoque não cifra, o catalogo não mede nada.",
    "Só havia um serviço, e ele não escalava.",
    "O banco de dados não aceitava mais conexões."
  ], 1, "Eram 6 serviços em 3 linguagens, e cada um resolvia a rede por conta própria. A regra existia, mas diferente em cada código.");
  tf("t1", 3, 1, "Para usar a malha, o pedidos precisa mudar a chamada que faz ao pagamentos.", false,
    "A chamada de saída continua a mesma. O proxy ao lado do pedidos a intercepta e aplica as regras. A malha não é invisível, mas o código da chamada não muda.");
  choice("t1", 4, 2, "O pedidos tenta 5 vezes, sem espera, quando o pagamentos responde 503. Quantas chamadas o pagamentos recebe por cobrança?", [
    "5.",
    "6.",
    "10.",
    "25."
  ], 1, "A original mais 5 repetições: 6 chamadas, todas coladas. É o 'e se der errado' da aula: o retry sem espera piora uma falha que já existe.");
  choice("t1", 5, 2, "Entre as 'primeiras malhas' da história estão Finagle, Stubby e Hystrix. O que elas têm em comum?", [
    "Eram proxies que rodavam ao lado de cada pod.",
    "Eram bibliotecas dentro do código, que cada serviço precisava importar.",
    "Eram componentes do kernel do Linux.",
    "Eram o control plane de um sistema de certificados."
  ], 1, "A malha moderna move a mesma função de bibliotecas dentro do código para proxies fora dele.");
  choice("t1", 6, 3, "Três linguagens (Go, Node.js e Java) e uma regra de retry nova. Sem malha, o que é preciso fazer?", [
    "Mudar a regra em um lugar só, no control plane.",
    "Reescrever a regra nas 3 bibliotecas de rede e reimplantar os serviços.",
    "Reiniciar o Kubernetes.",
    "Nada, as linguagens já compartilham o retry."
  ], 1, "Cada linguagem tem a sua biblioteca. Com a malha, a regra é escrita uma vez e vale para todas.");

  /* ---------- 2. Features agregadas ---------- */
  choice("t2", 1, 1, "Que regra de retry a loja usa na malha para o pagamentos?", [
    "Até 5 tentativas, sem espera, para qualquer erro.",
    "Até 2 tentativas, com 25 ms entre elas, só para 503 e só em operações idempotentes.",
    "Uma tentativa a cada segundo, para sempre.",
    "Nenhuma: a malha não faz retry."
  ], 1, "A regra tem limite, espera, tipo de erro e só vale se a operação puder se repetir. É o contrário do retry cru de cada código.");
  choice("t2", 2, 1, "Qual é o timeout da loja para o pagamentos, e o que o proxy responde quando passa dele?", [
    "200 ms, e responde 429.",
    "2 s, e responde 504.",
    "30 s, e responde 500.",
    "2 s, e responde 403."
  ], 1, "Passou de 2 s, o proxy cancela a chamada e devolve 504 (upstream request timeout). O app do pedidos só vê o resultado final.");
  choice("t2", 3, 2, "O que o mTLS acrescenta ao TLS do módulo 1?", [
    "Troca o TLS por uma conexão sem cifra, mais rápida.",
    "Os dois lados apresentam certificado: cada serviço prova quem é.",
    "O certificado passa a ser emitido por cada time.",
    "Só serve para chamadas vindas da internet."
  ], 1, "No TLS comum só o servidor se identifica. No mTLS o pedidos também mostra um certificado, com a identidade spiffe://loja.local/ns/loja/sa/pedidos.");
  choice("t2", 4, 2, "O catalogo tenta POST /cobrancas no pagamentos. Com a política de autorização da loja, o que acontece?", [
    "200, mas sem gravar nada.",
    "403 com o corpo RBAC: access denied, sem nenhuma linha de código no pagamentos.",
    "O pagamentos recebe a chamada e decide sozinho.",
    "A chamada fica presa até o timeout."
  ], 1, "O proxy do pagamentos confere a identidade do certificado e barra. A decisão é da malha, não do código.");
  choice("t2", 5, 3, "Um clique da Lena passa por 3 saltos (app → bff-app → pedidos → pagamentos), cada um com 3 tentativas. Quantas chamadas chegam ao pagamentos?", [
    "9.",
    "12.",
    "27.",
    "81."
  ], 2, "3 × 3 × 3 = 27: cada tentativa de cima dispara 3 de baixo. É a tempestade de retries. Retry em um nível só e orçamento de retry evitam.");
  order("t2", 6, 2, "Ordene o que acontece com a chamada do pedido 1048 dentro da malha.", [
    "Os dois proxies fazem o handshake de mTLS e provam quem são",
    "O proxy do pagamentos confere a política de autorização",
    "O pagamentos responde 503 e o proxy do pedidos repete a chamada, até 2 vezes",
    "Cada proxy anota latência, erro e um span de tracing"
  ], "Primeiro a identidade (mTLS), depois a autorização, o retry quando algo falha e a telemetria registra tudo.");
  tf("t2", 7, 2, "O retry do POST /cobrancas é seguro porque a malha sabe quais operações podem se repetir.", false,
    "A malha não sabe. Quem sabe é o time do serviço: por isso o pedidos manda Idempotency-Key: pedido-1048 e o pagamentos cobra uma vez por chave.");
  choice("t2", 8, 3, "Para testar o fallback do bff-app, a loja injeta 10% de 503 no recomendacoes. Onde a falha é inventada?", [
    "No código do recomendacoes, que precisa ser alterado.",
    "No proxy de quem chama, e o recomendacoes nem recebe a chamada.",
    "No banco de dados do recomendacoes.",
    "No control plane, que derruba o pod."
  ], 1, "O Envoy de quem chama devolve o 503 de mentira (fault injection). O recomendacoes não foi tocado, e o fallback do bff-app (módulo 9) pode ser testado.");

  /* ---------- 3. Control plane e data plane ---------- */
  choice("t3", 1, 1, "O que faz o control plane, e o que faz o data plane?", [
    "O control plane executa as chamadas; o data plane guarda as regras.",
    "O control plane guarda as regras e os certificados e os empurra aos proxies; o data plane são os proxies que executam as regras em cada chamada.",
    "Os dois fazem o mesmo trabalho, em lugares diferentes.",
    "O control plane é o banco; o data plane é o cache."
  ], 1, "Quem decide é separado de quem faz. No Istio, o control plane é o istiod e o data plane são os Envoys.");
  choice("t3", 2, 1, "Que protocolo o control plane usa para entregar configuração ao Envoy?", [
    "SMTP.",
    "xDS.",
    "DHCP.",
    "FTP."
  ], 1, "A API xDS (LDS, RDS, CDS, EDS, SDS) entrega listeners, rotas, clusters, endpoints e segredos aos proxies.");
  tf("t3", 3, 2, "A chamada do pedido 1048 passa pelo istiod no caminho até o pagamentos.", false,
    "Ela corre direto entre os proxies do data plane. O istiod só empurra regras e certificados; nunca está no caminho de uma chamada.");
  choice("t3", 4, 3, "O istiod cai. O que acontece com a chamada do pedido 1048?", [
    "Todas as chamadas falham na hora.",
    "Ela continua, com a última configuração recebida; o que para é regra nova e a renovação de certificados.",
    "Os pods reiniciam sozinhos.",
    "Os proxies passam a aceitar qualquer chamada sem mTLS."
  ], 1, "Os proxies guardam a última configuração. Mas regra nova não chega, e os certificados de 24 h vencem sem troca.");
  choice("t3", 5, 2, "Quem emite os certificados do mTLS, e de quanto em quanto tempo eles são trocados no exemplo da loja?", [
    "Cada time, uma vez por ano.",
    "O control plane (como autoridade certificadora), antes de vencerem as 24 h de validade.",
    "O Kubernetes, sem relação com a malha.",
    "O navegador da Lena."
  ], 1, "O istiod assina um certificado por serviço, com a identidade SPIFFE, e o troca antes de vencer.");
  choice("t3", 6, 3, "Uma regra de retry mudou no YAML. O que é preciso reiniciar para ela valer?", [
    "Os 30 pods da loja.",
    "Apenas os pods do pedidos.",
    "Nada: o control plane empurra a regra aos proxies, que a aplicam sem reiniciar.",
    "O cluster inteiro."
  ], 2, "As regras mudam sem reinício. Já pôr o sidecar num pod ou trocar a versão do Envoy exige recriar o pod (aula 4).");

  /* ---------- 4. Modelos: SDK, sidecar e proxyless ---------- */
  choice("t4", 1, 1, "Onde mora o proxy no modelo sidecar?", [
    "Dentro do código do app, como biblioteca.",
    "Num container ao lado do app, no mesmo pod; o tráfego passa por ele via iptables.",
    "Num servidor central único para a loja toda.",
    "No kernel do nó."
  ], 1, "Um Envoy em cada pod. Toda chamada que entra ou sai do pod passa por ele, sem o app saber.");
  choice("t4", 2, 2, "Quanto custam os sidecars da loja nos números de exemplo?", [
    "0,1 vCPU e 50 MB no total.",
    "30 × 0,1 = 3 vCPU e 30 × 50 MB = 1,5 GB.",
    "10 vCPU e 10 GB.",
    "Nada: o sidecar usa os recursos do app."
  ], 1, "São 30 pods, e cada um tem um Envoy de 0,1 vCPU e 50 MB. O custo cresce com o número de pods.");
  choice("t4", 3, 2, "Por quantos proxies passa a chamada do pedido 1048 no modelo sidecar, e quanto custa no tempo (no exemplo)?", [
    "1 proxy, sem custo.",
    "2 proxies (o de saída do pedidos e o de entrada do pagamentos), cerca de 1 ms.",
    "3 proxies, cerca de 50 ms.",
    "Nenhum: o proxy fica fora do caminho."
  ], 1, "Um Envoy de cada lado. A chamada de 80 ms passa a 81 ms no exemplo.");
  choice("t4", 4, 3, "Sai uma versão nova do Envoy. O que a loja precisa fazer no modelo sidecar?", [
    "Atualizar um único componente central.",
    "Reiniciar os 30 pods, porque o proxy mora dentro de cada um.",
    "Nada: o Envoy se atualiza sozinho.",
    "Reescrever as bibliotecas de rede nas 3 linguagens."
  ], 1, "É o 'e se der errado' da aula: o proxy só troca de versão quando o pod é recriado.");
  choice("t4", 5, 2, "O que o modelo proxyless exige do serviço?", [
    "Que rode dentro de um sidecar Envoy.",
    "Que fale gRPC e use uma biblioteca com suporte a xDS, que faz o papel do proxy.",
    "Que seja escrito em Java.",
    "Que esteja no mesmo nó do control plane."
  ], 1, "O app abre xds:///pagamentos, e a biblioteca gRPC fala xDS direto com o control plane. Não funciona para quem não usa gRPC.");
  choice("t4", 6, 3, "Qual é o preço do modelo SDK (biblioteca dentro do app) frente ao sidecar?", [
    "Um proxy a mais por pod.",
    "A malha fica acoplada ao código: uma biblioteca por linguagem (3 para a loja), e a regra muda reimplantando os serviços.",
    "Exige um kernel mais novo.",
    "Não cifra nada."
  ], 1, "O SDK tira o proxy do pod, mas devolve a regra ao código de cada linguagem, que era o problema original.");

  /* ---------- 5. Modelos: eBPF e ztunnel ---------- */
  choice("t5", 1, 1, "O que o ztunnel faz?", [
    "Lê o cabeçalho HTTP e faz retry e canary.",
    "Cuida do L4 por nó: mTLS, identidade e política por identidade, sem ler HTTP.",
    "Guarda as regras e emite os certificados.",
    "Substitui o Kubernetes."
  ], 1, "O ztunnel é um agente por nó, em Rust, só de L4. O túnel entre ztunnels é o HBONE, na porta 15008.");
  choice("t5", 2, 2, "Quando entra o waypoint no Istio ambient?", [
    "Em todo pod, sempre.",
    "Só quando o serviço precisa de L7: retry, canary por peso ou cabeçalho, política por método e caminho.",
    "Só quando o control plane cai.",
    "Nunca: o ztunnel já faz tudo."
  ], 1, "O waypoint é um Envoy por namespace ou serviço, fora dos pods. Quem não precisa de L7 não passa por ele.");
  choice("t5", 3, 2, "Com 3 nós e 1 waypoint, quantos proxies a loja tem no ambient, contra o sidecar?", [
    "30 contra 30.",
    "3 ztunnels e 1 waypoint, contra 30 sidecars.",
    "1 contra 30.",
    "6 contra 30."
  ], 1, "No exemplo, 4 proxies × 0,1 vCPU e 50 MB = 0,4 vCPU e 200 MB, contra 3 vCPU e 1,5 GB dos sidecars.");
  choice("t5", 4, 2, "O que o eBPF faz numa malha como a do Cilium, e onde ele para?", [
    "Faz todo o L7 dentro do kernel.",
    "Programas no kernel do nó cuidam do L4 sem proxy por pod; para L7 ainda se precisa de um Envoy, um por nó.",
    "Substitui os certificados por senhas.",
    "Só serve para medir a CPU."
  ], 1, "O eBPF tira o proxy do pod para o L4, mas HTTP e gRPC ainda pedem um Envoy, e esse é por nó.");
  choice("t5", 5, 3, "Uma política 'só POST /cobrancas' fica valendo no ztunnel, sem waypoint. O que acontece?", [
    "Funciona normalmente.",
    "O ztunnel não lê método nem caminho e a trata como negar tudo (falha para o lado seguro): a conexão do pedidos é recusada (o ztunnel não fala HTTP, então nem há 403).",
    "O ztunnel a ignora e libera tudo.",
    "O waypoint é criado sozinho."
  ], 1, "A política de L7 precisa estar presa ao waypoint (com targetRefs) e o waypoint precisa existir.");
  tf("t5", 6, 3, "No ambient, a chamada pedidos → pagamentos deixa de passar por proxies.", false,
    "Ainda passa por 2 ztunnels, e por 3 proxies quando há waypoint. O custo de CPU e memória diminui, mas a chamada não fica sem proxy.");

  /* ---------- 6. Casos de uso e alternativas ---------- */
  choice("t6", 1, 1, "Qual situação pede uma malha?", [
    "3 serviços, 1 linguagem e 1 time, sem exigência de mTLS.",
    "Muitos serviços, várias linguagens, mTLS exigido em tudo e um time de plataforma para operá-la.",
    "Um site estático com uma página só.",
    "Um serviço que não chama nenhum outro."
  ], 1, "A malha compensa quando a regra de rede começa a divergir entre serviços e times e há alguém para operar o control plane.");
  choice("t6", 2, 2, "Numa loja de 3 serviços e 1 time, o que costuma bastar no lugar da malha?", [
    "Um control plane com certificados de 24 h.",
    "Uma biblioteca de retry e timeout mais um bom gateway.",
    "Um sidecar em cada pod, sem control plane.",
    "Trocar de linguagem."
  ], 1, "Custa menos que operar um control plane e um proxy por pod. A malha pode esperar o dia em que a regra começar a divergir.");
  choice("t6", 3, 3, "Qual é o maior custo de adotar uma malha?", [
    "Os 3 vCPU dos sidecars.",
    "Operá-la: manter o control plane, trocar o Envoy, escrever e depurar o YAML.",
    "O preço do certificado.",
    "Não existe custo."
  ], 1, "Os 3 vCPU e 1,5 GB são o menor preço. O maior é ter um sistema a mais para manter.");
  choice("t6", 4, 3, "Um time aplica PeerAuthentication STRICT no namespace loja. Um pod que subiu sem sidecar continua mandando texto aberto. O que acontece com as chamadas dele?", [
    "Passam normalmente.",
    "São recusadas: no modo STRICT, o pod só aceita chamada com mTLS.",
    "O control plane instala o sidecar na hora.",
    "Viram chamadas L7."
  ], 1, "É o 'e se der errado' da aula: a malha vale para todos, e o erro dela também.");
  choice("t6", 5, 2, "Qual destas malhas usa um proxy próprio, escrito em Rust, em vez do Envoy?", [
    "Istio.",
    "Linkerd (linkerd2-proxy).",
    "Consul.",
    "Kuma."
  ], 1, "Istio, Consul e Kuma usam Envoy. O Linkerd tem o seu próprio proxy, escrito em Rust.");
  tf("t6", 6, 2, "O AWS App Mesh continua sendo uma boa opção para quem está escolhendo uma malha agora.", false,
    "A AWS anunciou o fim do suporte para 30 de setembro de 2026, depois do qual o console e os recursos deixam de ser acessíveis.");

  window.QUIZ = out;
})();
