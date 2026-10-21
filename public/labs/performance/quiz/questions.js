/* Banco de perguntas do quiz de Performance, Capacidade e Escalabilidade.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (não usado neste módulo), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-definindo-e-metrificando-performance", name: "Definindo e metrificando performance" },
    t2: { topic: "aula-2-metricas-de-performance", name: "Métricas de performance" },
    t3: { topic: "aula-3-entendendo-a-capacidade-em-sistemas", name: "Entendendo a capacidade em sistemas" },
    t4: { topic: "aula-4-escalabilidade-vertical-e-horizontal", name: "Escalabilidade vertical e horizontal" },
    t5: { topic: "aula-5-formula-de-capacity-hpa", name: "Fórmula de capacity e HPA" },
    t6: { topic: "aula-6-conclusao", name: "Conclusão" }
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


  /* ---------- 1. Definindo e metrificando performance ---------- */
  choice("t1", 1, 1, "Do que é feito o tempo de resposta, segundo o artigo?", [
    "Só do tempo de processamento no servidor.",
    "Da latência de rede mais o tempo de processamento.",
    "Só do RTT da rede.",
    "Da média de CPU das réplicas."
  ], 1, "O cliente espera a rede e o servidor. Painéis às vezes chamam o total de \"latência\", e o módulo avisa quando é o caso.");
  choice("t1", 2, 2, "Num dia normal a Lena, em Recife, tem 80 ms de RTT e o servidor gasta 20 ms. Quanto marca o navegador dela?", [
    "20 ms.",
    "80 ms.",
    "100 ms.",
    "160 ms."
  ], 2, "80 + 20 = 100 ms no navegador, contra 20 ms no painel do servidor.");
  choice("t1", 3, 3, "Às 20:03:07 a página do gato leva 2,08 s no navegador da Lena e 2.000 ms no lb-loja e na réplica. Onde está a degradação?", [
    "Na rede entre Recife e a loja.",
    "Dentro da catalogo-3: os 80 ms de diferença são a rede, que não mudou.",
    "No navegador da Lena.",
    "No balanceador."
  ], 1, "O balanceador e a réplica marcam o mesmo tempo, então o atraso acontece na réplica. A rede só soma os 80 ms de sempre.");
  tf("t1", 4, 1, "Uma meta como \"p95 até 300 ms e erros até 0,1%\" vem dos requisitos não funcionais do sistema.", true, "Sem meta, \"lento\" é opinião. A meta diz o que é problema para aquele sistema.");
  choice("t1", 5, 2, "Qual é o tráfego do catálogo no pico das 20:03?", [
    "40 req/s.",
    "400 req/s.",
    "640 req/s.",
    "1.000 req/s."
  ], 2, "40 req/s é o dia comum e 400 req/s é a média da Black Friday. O pico das 20:03 é 640 req/s, 64 por réplica.");
  choice("t1", 6, 3, "O painel marca a média de 135 ms, verde, e a meta é 300 ms. O que a Lena viveu no mesmo minuto?", [
    "Uma página em 135 ms.",
    "Uma página em 2 s, e o Davi levou um 504 de 2,1 s.",
    "Um erro 500 em todas as páginas.",
    "Nada fora do normal."
  ], 1, "A média mistura nove réplicas rápidas com a catalogo-3. Quem caiu nela esperou 2 s.");
  order("t1", 7, 2, "Ponha na ordem as três perguntas que desfazem \"a loja está lenta\".", [
    "O quê: qual requisição está lenta",
    "Onde: em que ponto da viagem",
    "Quanto: qual número, contra qual meta"
  ], "Primeiro a requisição, depois o ponto de medida (cliente, balanceador, réplica) e, por fim, o número contra a meta.");

  /* ---------- 2. Métricas de performance ---------- */
  choice("t2", 1, 1, "Quais são os quatro sinais do livro de SRE do Google?", [
    "CPU, memória, disco e rede.",
    "Tempo de resposta, tráfego, erros e saturação.",
    "p50, p95, p99 e máximo.",
    "Disponibilidade, consistência, partição e atraso."
  ], 1, "Cada um responde a uma pergunta: está lento, chegando muito, falhando ou cheio?");
  choice("t2", 2, 2, "A loja recebeu 38.400 requisições em 60 s. Qual é a vazão?", [
    "64 req/s.",
    "384 req/s.",
    "640 req/s.",
    "2.304 req/s."
  ], 2, "38.400 ÷ 60 = 640 req/s.");
  choice("t2", 3, 2, "Na amostra de 100 requisições, 1 passa de 2.000 ms e vira 504. Qual é a taxa de erros?", [
    "0,1%.",
    "1%.",
    "10%.",
    "0,01%."
  ], 1, "1 ÷ 100 × 100 = 1%, dez vezes a meta de 0,1%.");
  choice("t2", 4, 2, "Na amostra das 20:03, qual é o p95 pelo método do posto mais próximo?", [
    "135 ms.",
    "74 ms.",
    "800 ms.",
    "2.000 ms."
  ], 2, "O p95 é o valor na posição 95 da amostra ordenada: 800 ms. A média é 135, o p90 é 74 e o p99 é 2.000.");
  choice("t2", 5, 3, "O painel mostra a média dos p99 por réplica: (4 × 55 + 5 × 74 + 2.100) ÷ 10 = 269 ms. Qual é o p99 verdadeiro da frota?", [
    "269 ms.",
    "74 ms.",
    "2.000 ms.",
    "135 ms."
  ], 2, "Percentil não se soma nem se tira média. Sobre as 100 requisições juntas o p99 é 2.000 ms; o certo é juntar histogramas.");
  choice("t2", 6, 2, "O que é saturação, de acordo com o método USE e o livro de SRE?", [
    "Utilização perto de 100%.",
    "Trabalho esperando: fila, pool de conexões cheio, load average alto.",
    "Memória acima de 80%.",
    "Erros acima de 1%."
  ], 1, "Um recurso a 100% sem ninguém esperando não está saturado, e a resposta pode piorar antes de 100%.");
  tf("t2", 7, 3, "Com 100 amostras, o p99 já é uma estimativa estável.", false, "É só o 99º valor, e uma requisição lenta o move. Só se estabiliza com mil amostras ou mais.");

  /* ---------- 3. Entendendo a capacidade em sistemas ---------- */
  choice("t3", 1, 2, "Cada requisição usa 10 ms de CPU e 10 ms esperando cache e banco. Qual é a capacidade de uma réplica de 1 vCPU?", [
    "50 req/s.",
    "100 req/s.",
    "200 req/s.",
    "1.000 req/s."
  ], 1, "A CPU é o que limita: 1 s ÷ 10 ms = 100 req/s. A espera não ocupa a CPU.");
  choice("t3", 2, 2, "Pelo modelo R(ρ) = 10 + 10 ÷ (1 − ρ), quanto vale a resposta a 70% de utilização?", [
    "20 ms.",
    "43,3 ms.",
    "110 ms.",
    "1.010 ms."
  ], 1, "10 + 10 ÷ 0,3 = 43,3 ms. A 90% são 110 ms e a 99% são 1.010 ms.");
  choice("t3", 3, 2, "Pela lei de Little, quantas requisições estão em andamento a 640 req/s com resposta média de 0,135 s?", [
    "64.",
    "86,4.",
    "135.",
    "640."
  ], 1, "L = λ × W = 640 × 0,135 = 86,4.");
  choice("t3", 4, 3, "A 60 pedidos/s, o pagamentos (40/s) é o elo mais fraco. Quanto o checkout represa por segundo?", [
    "0.",
    "20.",
    "40.",
    "60."
  ], 1, "Entram 60 e saem 40: 20 por segundo ficam represados, 1.200 em 60 s.");
  choice("t3", 5, 3, "Para resolver o checkout lento, alguém escala o estoque de 2 para 4 réplicas. O que acontece com a saída?", [
    "Sobe para 60 pedidos/s.",
    "Continua em 40 pedidos/s, e a conta de CPU dobra.",
    "Cai pela metade.",
    "Sobe para 2.000 pedidos/s."
  ], 1, "A saída vale a capacidade do elo mais fraco, o pagamentos. O estoque estava a 4% e continua assim.");
  choice("t3", 6, 2, "Frota fixa de 10 réplicas por 24 h contra frota elástica (10 réplicas por 4 h e 2 nas outras 20 h). Quantas réplica-horas cada uma?", [
    "240 e 80.",
    "240 e 120.",
    "120 e 80.",
    "80 e 240."
  ], 0, "10 × 24 = 240. 10 × 4 + 2 × 20 = 80, um terço do fixo.");
  tf("t3", 7, 3, "Quando se resolve um gargalo, a carga sobre os elos seguintes aumenta e um deles pode virar o próximo gargalo.", true, "Com pagamentos em 4 réplicas (80/s), o próximo elo a 100 pedidos/s é o pedidos (90/s). O gargalo anda.");

  /* ---------- 4. Escalabilidade vertical e horizontal ---------- */
  choice("t4", 1, 1, "Qual é a diferença entre escalar na vertical e na horizontal?", [
    "A vertical muda o número de unidades e a horizontal, o tamanho.",
    "A vertical muda o tamanho de uma unidade e a horizontal, o número de unidades.",
    "A vertical é automática e a horizontal é manual.",
    "Nenhuma: são sinônimos."
  ], 1, "Scale up/down muda o tamanho (1 para 8 vCPU). Scale out/in muda o número (10 réplicas de 1 vCPU).");
  choice("t4", 2, 3, "Com 1/21 do trabalho serial, quanto rendem 8 vCPU numa réplica só, pela lei de Amdahl?", [
    "8×, ou 800 req/s.",
    "6,0×, ou 600 req/s.",
    "4×, ou 400 req/s.",
    "21×, ou 2.100 req/s."
  ], 1, "1 ÷ (1/21 + (20/21) ÷ 8) = 6,0. São 600 req/s, 75 por vCPU contra 100 na horizontal.");
  choice("t4", 3, 2, "A 640 req/s, caem 3 das 10 réplicas de 100 req/s. Qual é a utilização das 7 restantes?", [
    "64%.",
    "80%.",
    "91,4%.",
    "106,7%."
  ], 2, "640 ÷ 700 = 91,4%, com resposta de 126,7 ms. Caindo 4, são 106,7% e satura.");
  choice("t4", 4, 3, "Caem 4 das 10 réplicas a 640 req/s. O que acontece?", [
    "Nada: 6 réplicas bastam.",
    "A capacidade de 600 fica abaixo dos 640: a fila cresce 40 req/s, 2.400 por minuto.",
    "A frota passa a 64%.",
    "O HPA sobe 4 réplicas em 1 s."
  ], 1, "640 − 600 = 40 req/s a mais que a capacidade, 2.400 por minuto, e as respostas passam do timeout de 2 s.");
  choice("t4", 5, 2, "O que a escalabilidade horizontal exige do serviço?", [
    "Estado fora do processo (a sessão no Redis) e um balanceador.",
    "Uma máquina maior.",
    "Reiniciar o pod.",
    "Trocar o banco de dados."
  ], 0, "Se cada réplica guardasse a sessão na memória, o balanceador mandaria a Lena para uma réplica que não a conhece.");
  tf("t4", 6, 3, "Ao cair, a réplica única de 8 vCPU leva 100% da capacidade, enquanto uma réplica das 10 leva 10%.", true, "É o risco concentrado da vertical. A folga N+k só existe na horizontal.");
  choice("t4", 7, 2, "Segundo o módulo, o que é elasticidade?", [
    "Escalar na horizontal na mão.",
    "Ajustar a capacidade automaticamente à demanda, para cima e para baixo.",
    "Comprar uma máquina maior.",
    "Ter réplicas de sobra o ano todo."
  ], 1, "Pode ser vertical ou horizontal; o HPA é um mecanismo de elasticidade horizontal.");

  /* ---------- 5. Fórmula de capacity e HPA ---------- */
  choice("t5", 1, 1, "Qual é a fórmula do HPA?", [
    "desejadas = atuais ÷ razão.",
    "desejadas = ⌈ atuais × valor atual ÷ valor desejado ⌉.",
    "desejadas = atuais + 4.",
    "desejadas = ⌊ atuais × alvo ⌋."
  ], 1, "O teto arredonda para cima e a razão é a métrica atual dividida pelo alvo.");
  choice("t5", 2, 2, "Pico de 950 req/s: 10 réplicas a 95% de CPU, alvo de 70%. Quantas réplicas o HPA quer?", [
    "10.",
    "13.",
    "14.",
    "16."
  ], 2, "⌈ 10 × 95 ÷ 70 ⌉ = ⌈13,57⌉ = 14. Depois, 950 ÷ 1.400 = 67,9% de CPU.");
  choice("t5", 3, 3, "A média de CPU da frota é 67,5% (a catalogo-3 está a 99%). O que o HPA faz com alvo de 70%?", [
    "Sobe para 14 réplicas.",
    "Nada: 0,964 está dentro da tolerância de 10%.",
    "Tira uma réplica.",
    "Reinicia a catalogo-3."
  ], 1, "A razão 67,5 ÷ 70 = 0,964 está a menos de 10% de 1,0. A catalogo-3 continua a 99%.");
  choice("t5", 4, 3, "Com a mesma média de 67,5% e alvo de 80%, o que o HPA faz?", [
    "Nada.",
    "Sobe para 12 réplicas.",
    "Desce para 9 réplicas, tirando uma no pior momento.",
    "Desce para 5 réplicas."
  ], 2, "⌈ 10 × 0,844 ⌉ = 9. A janela de estabilização de 300 s atrasa a descida, mas ela vem.");
  choice("t5", 5, 3, "A demanda salta para 1.100 req/s (capacidade 1.000) e o HPA leva cerca de 60 s para reagir. Quantas requisições ficam recusadas ou atrasadas?", [
    "600.",
    "1.100.",
    "6.000.",
    "66.000."
  ], 2, "100 req/s a mais que a capacidade × 60 s = 6.000, 9,1% das 66.000 do minuto.");
  choice("t5", 6, 2, "O artigo calcula 6 réplicas com 27,78 req/s cada e 15 de capacidade e chega a 11. O que o HPA faz?", [
    "11, igual ao artigo.",
    "12, porque usa ceil: 6 × 27,78 ÷ 15 = 11,11.",
    "10, arredondando para baixo.",
    "15."
  ], 1, "Com 11 réplicas cada uma receberia 15,15 req/s, acima dos 15 de capacidade.");
  tf("t5", 7, 2, "O HPA calcula a utilização de CPU como a porcentagem dos requests do pod, em média entre os pods.", true, "Por isso os requests precisam estar definidos. Pods ainda não prontos entram como 0% na subida.");

  /* ---------- 6. Conclusão ---------- */
  choice("t6", 1, 1, "Quais são os três momentos do módulo?", [
    "Medir, limitar e crescer.",
    "Planejar, testar e publicar.",
    "Cache, fila e banco.",
    "Ler, escrever e apagar."
  ], 0, "Medir diz o que se sente, limitar diz o que o sistema aguenta e crescer diz como adicionar capacidade.");
  choice("t6", 2, 2, "Qual é a capacidade do catálogo e até onde ela é segura?", [
    "1.000 req/s e 700 req/s (70%).",
    "640 req/s e 400 req/s.",
    "100 req/s e 70 req/s.",
    "1.000 req/s e 1.000 req/s."
  ], 0, "10 réplicas × 100 req/s, com limite seguro de 70% de CPU.");
  choice("t6", 3, 3, "Depois de escalar pedidos e pagamentos, qual é o elo mais fraco do checkout?", [
    "O estoque (1.000/s).",
    "O banco do pedidos (150/s).",
    "O lb-loja.",
    "Nenhum."
  ], 1, "As escritas continuam num primário só: réplicas de serviço não o escalam. É o gancho do módulo 15.");
  choice("t6", 4, 2, "Qual destas ações aumenta a capacidade por vCPU antes de comprar outra máquina?", [
    "Cortar a CPU gasta por requisição com algoritmo, índice ou cache.",
    "Aumentar o timeout do balanceador.",
    "Subir o alvo do HPA.",
    "Trocar o nome do serviço."
  ], 0, "Se a requisição gasta metade da CPU, a mesma réplica dá o dobro de req/s.");
  tf("t6", 5, 2, "O módulo 23 (Capacity Planning) parte da tabela de números medidos deste módulo.", true, "640 req/s, p95 de 800 ms, catálogo de 1.000 req/s, checkout de 30 pedidos/s e banco de 150/s.");
  choice("t6", 6, 3, "Qual é o próximo problema da loja, depois deste módulo?", [
    "Mandar e-mail mais rápido.",
    "O banco do pedidos não cresce por réplicas nem por serviços: falta o mapa das formas de crescer, o Scale Cube.",
    "Trocar o HPA por outra ferramenta.",
    "Escolher um CDN."
  ], 1, "A loja cresceu para os lados (réplicas, módulo 7) e por função (serviços, módulo 6). O módulo 15 mostra a forma que falta.");

  window.QUIZ = out;
})();
