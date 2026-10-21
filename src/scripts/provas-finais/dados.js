/* SDLabs · Provas Finais: os dados canônicos do módulo (docs/escrita/provas-finais-brief.md).
   Nada aqui é novo: cada número e cada nome já existe num módulo de 1 a 28. Se um número mudar lá, muda aqui,
   nas aulas, no quiz (public/labs/provas-finais/quiz/questions.js) e no glossário. */

export const BLOCOS = [
  { n: 1, nome: 'A loja de um servidor', de: 1, ate: 5 },
  { n: 2, nome: 'Partir e ligar', de: 6, ate: 10 },
  { n: 3, nome: 'Conversar e disputar', de: 11, ate: 13 },
  { n: 4, nome: 'Crescer e espalhar', de: 14, ate: 17 },
  { n: 5, nome: 'Consistência e resiliência', de: 18, ate: 21 },
  { n: 6, nome: 'Mudar, planejar, testar, isolar', de: 22, ate: 25 },
  { n: 7, nome: 'Células, desastre e sinais', de: 26, ate: 28 },
];

/* n, slug (labs/<slug>/), nome, problema que resolveu, o número que fica, o que ele significa */
export const MODULOS = [
  { n: 1, slug: 'protocolos-de-rede', nome: 'Protocolos de Rede', problema: 'O dado precisa viajar de Recife até SP.', numero: '215 fatias · RTT 80 ms', sig: 'A foto vira segmentos de até 1.460 B (313 KB); cada ida e volta custa 80 ms.' },
  { n: 2, slug: 'storage-raid-io', nome: 'Storage, RAID e I/O', problema: 'O disco queima e leva o pedidos.db junto.', numero: '1 · 2 · 4 · 6 · 2 I/Os', sig: 'Escrita pequena em RAID 0 · 1 · 5 · 6 · 10: o preço de cada nível de proteção.' },
  { n: 3, nome: 'CAP, ACID e BASE', slug: 'cap-acid-base', problema: 'Os três bancos (SP, Rio, Recife) perdem a rede entre si.', numero: 'quórum 2 em 3 · ~80 ms', sig: 'Na partição, recusar (C) ou aceitar (A); a escrita síncrona até Recife custa ~80 ms.' },
  { n: 4, nome: 'Databases e Indexação', slug: 'databases', problema: 'Achar o pedido de uma cliente entre milhões de linhas.', numero: 'pedido 1042 · B-Tree', sig: 'O índice acha uma linha em poucas leituras de página.' },
  { n: 5, nome: 'Estratégias de Cache', slug: 'cache', problema: 'A página do gato de pelúcia é lenta.', numero: 'h = 90% → 5 ms · 89,90 → 79,90', sig: 'Tempo médio = h × 1 + (1 − h) × 41: o hit rate vira conta.' },
  { n: 6, nome: 'Microsserviços', slug: 'microsservicos', problema: 'O programa único (8 vCPU) cai inteiro às 23:00.', numero: '180 → 200 ms · 80 × 25 vCPU', sig: 'Partir isola e escala só o que pesa, e cobra a rede (4 saltos de 5 ms). Pedido 1047.' },
  { n: 7, nome: 'Load Balancers', slug: 'load-balancers', problema: 'Como repartir as chamadas entre as réplicas.', numero: '2,7 s · 5 s × 3 = 15 s', sig: '"Justo" no número de pedidos não é justo no trabalho; o healthcheck tira a réplica em 15 s.' },
  { n: 8, nome: 'API Gateways', slug: 'api-gateways', problema: 'O app conhece 6 endereços e cada serviço faz o seu login.', numero: '401 × 403 · JWT · token bucket', sig: 'Uma porta, uma regra. Pedido 1048.' },
  { n: 9, nome: 'BFF', slug: 'bff', problema: 'A tela inicial do app faz 4 chamadas, 480 ms e 180 KB.', numero: '480 ms · 180 KB → 150 ms · 12 KB', sig: 'Um BFF por canal, com as chamadas em paralelo e um fallback.' },
  { n: 10, nome: 'Service Mesh', slug: 'service-mesh', problema: 'Retry, timeout e mTLS repetidos em cada serviço.', numero: '27 chamadas · sidecar 3 vCPU · 1,5 GB', sig: 'Retry em camadas multiplica: 3 × 3 × 3.' },
  { n: 11, nome: 'Concorrência e Paralelismo', slug: 'concorrencia', problema: 'Duas pessoas querem o último gato.', numero: '2 ms + 18 ms → 50/s · teto 500/s · 409', sig: 'O lock decide quem leva; o outro recebe 409.' },
  { n: 12, nome: 'Comunicação Síncrona', slug: 'comunicacao-sincrona', problema: 'Os serviços esperam uns pelos outros (REST, gRPC, webhook).', numero: '11 bytes · 210 ms', sig: 'O formato e o salto têm custo: o 1050 em Protobuf; o PSP responde em 210 ms.' },
  { n: 13, nome: 'Comunicação Assíncrona', slug: 'comunicacao-assincrona', problema: 'O evento que se perde e a espera que trava.', numero: '4 eventos · 120/s · 40/s por partição · 1049 → p0', sig: 'A chave decide a partição, e a ordem só vale dentro dela.' },
  { n: 14, nome: 'Performance', slug: 'performance', problema: 'A Black Friday das 20:03: a média esconde a réplica quente.', numero: 'média 135 · p50 32 · p95 800 · p99 2.000 ms', sig: 'A média esconde; o elo mais fraco manda (pagamentos 40/s, banco 150/s; frota 99% × 67,5%).' },
  { n: 15, nome: 'Scale Cube', slug: 'scale-cube', problema: 'Em que eixo a loja cresce.', numero: '(10, 9, 1) → (10, 9, 3) · 90 → 150 → 200', sig: 'X clona, Y parte por função, Z parte por dado. Saída em pedidos/s.' },
  { n: 16, nome: 'Sharding', slug: 'sharding', problema: '50 milhões de linhas num banco só.', numero: '40% → 55,6% · 75,2% × 25,7% · 45 pares', sig: 'A chave decide o que esquenta: o mkt-01 aquece o shard-2; mod × anel; shuffle.' },
  { n: 17, nome: 'Replicação', slug: 'replicacao', problema: 'Um disco ou um servidor cai e leva o dado.', numero: '2 · 12 · 82 ms · lag 300/800 ms · RPO 9/24 · RTO 35 s', sig: 'Cada cópia custa ou latência ou dado.' },
  { n: 18, nome: 'CQRS', slug: 'cqrs', problema: 'A tela lê o passado e o relatório pesa no banco de escrita.', numero: '1.787 B · 235 ms × 0,021 ms', sig: 'Ler de um modelo feito para ler (o outbox leva o evento até lá).' },
  { n: 19, nome: 'Saga Pattern', slug: 'saga', problema: 'Pagamento aprovado e estoque zerado, sem ROLLBACK global.', numero: '85,5% · 1 · 2 · 4 · 8 · 16 s · estorno-c-7732', sig: 'Sem transação global, compensa-se.' },
  { n: 20, nome: 'Event Sourcing', slug: 'event-sourcing', problema: 'Guardar o que aconteceu, e não só o estado de agora.', numero: '1.800 ms × 13 ms · 2 h 47 min', sig: 'O estado é a soma dos fatos; o snapshot encurta o replay.' },
  { n: 21, nome: 'Patterns de Resiliência', slug: 'resiliencia', problema: 'O PSP-A responde em 8 s e enche o pool.', numero: '1,67 s · 27 · 12.960 · 90 s · 1,3 s', sig: 'Falhar pequeno e rápido: timeout, retry com jitter, breaker, fallback, idempotência.' },
  { n: 22, nome: 'Modelos de Deployment', slug: 'deployment', problema: 'A versão 2.5.0 sai com defeito (frete 0,00).', numero: 'R$ 54.000 × R$ 450 · 40 s × 90 s · flag ≤ 30 s', sig: 'O raio de um deploy = fração × tempo × custo.' },
  { n: 23, nome: 'Capacity Planning', slug: 'capacity-planning', problema: 'A Black Friday de 2027 aguenta?', numero: '14 · 10 · 15 · 2 = 41 vCPU · 950 req/s · 200 pedidos/s', sig: 'Planejar antes do pico, com Little e ρ alvo de 70%.' },
  { n: 24, nome: 'Testes de Carga', slug: 'testes-de-carga', problema: 'O plano é só uma hipótese.', numero: '36/s × ~250/s · p95 ≤ 800 ms · erros ≤ 0,1%', sig: 'Plano sem teste é hipótese; o cenário misto acha o relatório das 23:00.' },
  { n: 25, nome: 'Bulkhead Pattern', slug: 'bulkhead', problema: 'O relatório das 23:00 ocupa o pool do checkout.', numero: 'pool 20 → 16 + 4 · 33% e 10% de 503 · 60% → 40%', sig: 'O bulkhead escolhe quem espera.' },
  { n: 26, nome: 'Cell-Based Architecture', slug: 'cell-based', problema: 'O veneno do mkt-01 derruba a pilha inteira.', numero: '4 células · 7.200 × 2.880 · 41 → 53 vCPU', sig: 'A pilha inteira como compartimento.' },
  { n: 27, nome: 'SPoF e Disaster Recovery', slug: 'disaster-recovery', problema: 'A região de SP cai.', numero: 'RTO 65 s (30 + 35) · RPO 2,97 · o 1061', sig: 'O desastre é de região, e RPO é conta.' },
  { n: 28, nome: 'Observabilidade', slug: 'observabilidade', problema: 'Como saber o que acontece com o pedido da Lena.', numero: '43,2 min · 14,4× · 1,9 s × 275 ms', sig: 'Ver por pedido e decidir por orçamento de erro.' },
];

export function blocoDe(n) {
  return BLOCOS.filter(function (b) { return n >= b.de && n <= b.ate; })[0];
}
export function moduloPorN(n) { return MODULOS[n - 1]; }

/* "Tire uma peça": o e se der errado olhado ao contrário (13 peças) */
export const PECAS = [
  { peca: 'o cache', mod: 5, avisou: [5, 21], quebra: 'O tempo médio vai de 5 ms (h = 90%) a 41 ms, 8,2 vezes mais, e o catálogo manda 640 req/s à origem em vez de 128.', numero: '5 ms → 41 ms · 640 em vez de 128 req/s' },
  { peca: 'o balanceador', mod: 7, avisou: [7], quebra: 'Os 9 primeiros pedidos vão para o catalogo-1: CPU em 100% e 20 ms viram 1,8 s.', numero: '20 ms → 1,8 s' },
  { peca: 'o gateway', mod: 8, avisou: [8], quebra: 'O app passa a conhecer 6 endereços; cada serviço faz login e rate limit do seu jeito; o robô de 500/s chega direto.', numero: '6 endereços · 500/s' },
  { peca: 'o lock distribuído', mod: 11, avisou: [11], quebra: 'Duas réplicas do estoque vendem o último gato duas vezes.', numero: 'estoque −1' },
  { peca: 'a idempotência', mod: 21, avisou: [21], quebra: 'O retry do POST cria dois pedidos e duas cobranças.', numero: '2 pedidos · 2 cobranças' },
  { peca: 'as réplicas', mod: 17, avisou: [16, 17], quebra: 'O shard-1 cai e a Lena e a Bia ficam sem pedidos; um disco queimado leva o dado.', numero: 'shard-1 fora do ar' },
  { peca: 'o outbox', mod: 18, avisou: [18], quebra: 'O pedido é gravado e o evento nunca sai: dois sistemas, uma gravação só.', numero: '1 gravação, 2 sistemas' },
  { peca: 'o breaker e o fallback', mod: 21, avisou: [21], quebra: 'O PSP a 8 s enche o pool em 1,67 s e leva o frete e o e-mail junto.', numero: '1,67 s · pool de 50' },
  { peca: 'o canary e a métrica de negócio', mod: 22, avisou: [22], quebra: 'O frete 0,00 dura 60 min: R$ 54.000 (e R$ 486.000 se só o relatório das 23:00 achar).', numero: 'R$ 54.000 · R$ 486.000' },
  { peca: 'o bulkhead do pool', mod: 25, avisou: [25], quebra: 'O relatório das 23:00 deixa 33% do checkout e 10% do status com 503.', numero: '33% · 10% de 503' },
  { peca: 'o roteador por célula', mod: 26, avisou: [26], quebra: 'O veneno do mkt-01 derruba os 3 pods do pedidos em 150 ms: 7.200 tentativas, 100% delas.', numero: '7.200 tentativas · 150 ms' },
  { peca: 'a passiva e o DR', mod: 27, avisou: [27], quebra: 'SP cai. Com a passiva warm o RTO é 65 s (643,5 tentativas falham); só com backup o RTO é ~48 min e custa R$ 2,28 mi.', numero: '65 s × ~48 min · R$ 2,28 mi' },
  { peca: 'a observabilidade', mod: 28, avisou: [28], quebra: 'O MTTD volta de 30 s para 60 min; a Lena espera 1,9 s e ninguém sabe onde.', numero: '30 s → 60 min · 1,9 s' },
];

/* Os 14 saltos do 1060 (Lena, celula-recife, 20:25:00.000: 2 gatos 159,80 + frete Recife 15,00 = 174,80) */
export const SALTOS = [
  { salto: 'O app da Lena resolve loja.com.br (DNS) e abre a conexão (TCP + TLS); a célula de Recife tira os 80 ms de RTT até SP do caminho.', mods: [1, 26] },
  { salto: 'O edge-loja lê o cliente_id do JWT e olha o mapa (150 MB): celula-recife.', mods: [26, 8] },
  { salto: 'Na célula, o gw-loja valida o token e aplica o rate limit; o lb escolhe um bff-app.', mods: [8, 7, 9] },
  { salto: 'O bff-app chama o pedidos com prazo pela malha (mTLS, retry com regra); com a Idempotency-Key, o POST /pedidos não duplica.', mods: [21, 10] },
  { salto: 'O pedidos reserva o estoque: lock na linha do gato, alocação REC-1 de 2 para 0.', mods: [11, 26] },
  { salto: 'O pagamentos cobra no PSP-A (REST/Pix) com breaker, PSP-B de reserva e pool de 50 em bulkhead 50/30/20.', mods: [12, 21, 25] },
  { salto: 'O pedidos grava no PostgreSQL da célula, com índice B-Tree, e o evento PedidoCriado vai ao outbox.', mods: [4, 18] },
  { salto: 'O relay (CDC) publica no Kafka da célula, chave pedido_id; estoque, entregas e notificacoes consomem.', mods: [13] },
  { salto: 'A saga segue: pagou, reservou, agendou entrega; se falhar, compensa com o estorno.', mods: [19] },
  { salto: 'Os eventos formam o stream pedido-1060 e o projetor atualiza meus_pedidos:lena-77.', mods: [20, 18] },
  { salto: 'A tela "meus pedidos" lê a projeção da própria célula: o 1055 (o pedido que ela não via) não se repete.', mods: [18, 26] },
  { salto: 'O banco da célula replica para a célula passiva em SP: lag de 800 ms, RPO esperado 2,88.', mods: [17, 26] },
  { salto: 'Cada salto deixa log, métrica e trace com o mesmo trace_id; o SLI do checkout conta mais um "bom".', mods: [28] },
  { salto: 'Se o veneno do mkt-01 chegasse no mesmo instante, a Lena não notaria: a celula-mkt cai sozinha.', mods: [26] },
];
