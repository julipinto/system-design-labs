# Módulo 6: Microsserviços, Monolitos e Domínios (brief canônico)

Fonte principal: https://fidelissauro.dev/monolitos-microservicos/ (texto em docs/escrita/microsservicos-artigo.txt; 13 links nas Referências: Fowler Microservices, Anemic Domain Model, Conway's Law, melconway.com Committees Paper, microservices.io Monolithic, Shopify modular monolith, Istio monolito IEEE 9520758 etc.).
Fontes primárias para DDD (o artigo é raso em conceitos e componentes): Eric Evans, *Domain-Driven Design* (2003) e a "DDD Reference" pública (domainlanguage.com/ddd/reference), Fowler bliki: BoundedContext, UbiquitousLanguage, DDD_Aggregate, ValueObject, DomainEvent (martinfowler.com/bliki/...), e "Event Storming" (Alberto Brandolini).
O repositório público de labs não tem exemplo deste dia. O curso usa um case de core banking nos 2 últimos vídeos; aqui o case é **a própria loja** (história contínua, PREMISSAS 15b). Não citar curso nem core banking.
Siga PREMISSAS.md e ESCRITA.md. Slug: `microsservicos`. Coleção `src/content/microsservicos/`, página `src/pages/labs/microsservicos/`. Título do módulo: "Microsserviços, Monolitos e Domínios".

## Onde a história parou e o novo problema
Módulo 5 terminou com a loja rápida: o gato de pelúcia (produto 42) está no Redis, a foto na CDN de Recife, e o preço baixou para **79.90**. Só que a loja inteira ainda é **um programa só**: o processo `loja`, num servidor de **8 vCPU**, com o banco `loja` (o PostgreSQL do módulo 4). Dentro dele moram 7 módulos: **Catálogo, Carrinho, Pedidos, Pagamentos, Estoque, Entregas e Relatórios**. A loja cresceu, três times mexem no mesmo código, e duas coisas começaram a dar errado (abaixo). O módulo é a história de **quando e como partir esse programa**, e de **onde cortar** (domínios).

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
### O pedido-estrela: 1047
A Lena (Recife) compra **outro gato de pelúcia** (presente para o irmão) a **79.90**. Pedido **1047** (o 1042 dela é do módulo 4; os pedidos do módulo 4 vão até 1046).
- Itens: produto 42, qtd 1, 79.90. Frete **15.00**. Total **94.90**.
- Endereço (value object): `{ rua: "Rua da Aurora, 100", cidade: "Recife", cep: "50050-000" }`.
- Estoque do gato: **3 → 2** quando o pedido é pago.

### No monolito (aulas 1–3)
- Caminho do checkout: Carrinho → Pedidos → Pagamentos → Estoque → Entregas, **chamadas de função no mesmo processo** (~0,01 ms cada), tudo numa transação só (`BEGIN … COMMIT`, ACID do módulo 3). Checkout inteiro: **180 ms**.
- Vantagens que a figura mostra: um deploy, um banco, um teste de ponta a ponta, consistência de graça (se o pagamento falha, o `ROLLBACK` devolve o estoque).
- **E se der errado 1 (vizinho barulhento):** às **23:00** o módulo Relatórios roda o fechamento de caixa e usa **7 dos 8 vCPU** por 15 min. A página do gato vai de **120 ms para 2,4 s** e o checkout da Lena passa do limite de **2 s** (timeout). Ninguém mexeu no checkout.
- **E se der errado 2 (raio de explosão):** um bug no cálculo de frete (Entregas) estoura a memória e **o processo cai**. A loja inteira sai do ar: vitrine, carrinho, pagamento. Um módulo derrubou os sete.
- **Escala na Black Friday:** a vitrine (Catálogo) recebe **10×** o tráfego. No monolito só dá para copiar o programa inteiro: **10 cópias × 8 vCPU = 80 vCPU**, com Relatórios e Pagamentos copiados junto sem precisar.
- Deploy: 3 times, 1 binário, **deploy de 40 min**; um time espera o outro (rebase, fila de deploy).

### Em microsserviços (aula 3; aulas 7–8 refinam)
- 6 serviços + Relatórios à parte: `catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas` (+ `relatorios`). **Cada um com seu banco**: catálogo em documentos (módulo 4), carrinho no Redis (módulo 5), pagamentos e pedidos em PostgreSQL (precisam de ACID), estoque em PostgreSQL.
- Mesmo checkout pela rede: cada salto custa ~**5 ms**. Síncrono: 180 + 4 × 5 = **200 ms**. A rede entrou na conta.
- Black Friday: catálogo **10 réplicas × 1 vCPU**, carrinho 3×1, pedidos 3×1, pagamentos 2×1, estoque 2×1, entregas 1×1, relatórios 1×4 → **25 vCPU** (contra 80).
- Relatório às 23:00 roda no seu próprio serviço: a página do gato continua em **120 ms**.
- Entregas cai: a loja continua vendendo; o evento `PedidoPago` espera na fila e é entregue quando `entregas` volta.
- **E se der errado (o preço dos microsserviços):** o pagamento é aprovado, mas a reserva de estoque falha (estoque já em 0). Não há mais um `ROLLBACK` que desfaz tudo: alguém precisa **compensar** (estornar o pagamento). Gancho para Saga (fica para depois, sem aprofundar). E observar tudo fica mais difícil: o pedido 1047 passa por 5 serviços e 5 logs (um `trace_id` liga os pedaços: `trace_id=7f3a…`).

### Domínios e DDD (aulas 4–5)
- **Linguagem ubíqua e contextos delimitados:** o mesmo gato tem três formas, cada uma certa no seu contexto:
  - Catálogo: `produto 42` `{ nome: "gato de pelúcia", preco: 79.90, fotos: ["gato.jpg"], descricao: "…" }`
  - Estoque: `SKU GATO-042` `{ quantidade: 3, deposito: "SP-1" }`
  - Entregas: `volume` `{ peso: 0.4 kg, dimensoes: "30×20×15 cm", destino: "Recife" }`
  - Pagamentos não sabe o que é gato: só `{ pedido_id: 1047, valor: 94.90 }`.
- **Entidade:** o pedido 1047 (tem identidade; continua o mesmo pedido mesmo se o endereço mudar).
- **Value object:** o endereço da Lena e `Dinheiro(94.90, "BRL")` (iguais se os valores são iguais; troca-se inteiro, não se edita).
- **Agregado:** `Pedido` é a raiz; `ItemDoPedido` só muda passando por ele. Invariante: `total = soma dos itens + frete` (79.90 + 15.00 = 94.90) e "não dá para cancelar pedido já enviado".
- **Modelo anêmico vs rico:** anêmico = `pedido.status = "cancelado"` escrito de fora por qualquer um; rico = `pedido.cancelar()` que recusa se `status == "enviado"`.
- **Repositório:** `PedidoRepository.salvar(pedido)` / `buscar(1047)`: o domínio não fala SQL.
- **Evento de domínio:** fato no passado, no idioma do negócio: `PedidoCriado`, `PedidoPago`, `EstoqueReservado`, `PedidoEnviado`.
- **Subdomínios:** núcleo (o que faz a loja vender: Catálogo e Pedidos), suporte (Estoque, Entregas), genérico (Pagamentos via gateway terceirizado, Notificações por e-mail, Login).
- DDD também serve **dentro do monolito** (monolito modular): os mesmos limites viram pastas/módulos com fronteiras, antes de virar serviços.

### Lei de Conway (aula 6)
- Antes: times por camada (**frontend, backend, DBA**) → a loja saiu em 3 camadas, e toda mudança atravessa os 3 times.
- Depois: 3 times por domínio: **Vitrine** (Catálogo, busca), **Checkout** (Carrinho, Pedidos, Pagamentos) e **Logística** (Estoque, Entregas). O desenho dos serviços passa a espelhar esses 3 times.
- Manobra inversa de Conway: desenhar os times no formato da arquitetura que se quer.
- Conway (1967/1968, Datamation, "How Do Committees Invent?"): o artigo diz "rejeitado por Harvard"; conferir em melconway.com e corrigir se preciso (PREMISSAS 25).

### O case da loja (aulas 7–8)
- **Aula 7, domínios e entidades:** mapear a compra do pedido 1047 como eventos em ordem (estilo event storming): `ProdutoVisto` → `ItemAdicionadoAoCarrinho` → `PedidoCriado` → `PedidoPago` → `EstoqueReservado` → `PedidoEnviado` → `PedidoEntregue`. Agrupar os eventos em contextos; achar entidades (Pedido, Cliente, Produto, Volume), value objects (Endereço, Dinheiro) e agregados.
- **Aula 8, segregação de serviços e eventos de domínio:** cada tabela do banco `loja` ganha **um dono** (`produtos` → catálogo, `pedidos`+`itens_pedido` → pedidos, `estoque` → estoque, `pagamentos` → pagamentos, `remessas` → entregas). Ninguém lê a tabela do outro: pergunta pela API ou escuta o evento. Linha do tempo do 1047:
  - 14:02:10 `PedidoCriado { evento_id: "e-501", pedido_id: 1047, cliente: "Lena", itens: [{ produto: 42, qtd: 1, preco: 79.90 }], frete: 15.00, total: 94.90 }`
  - 14:02:11 `PedidoPago { evento_id: "e-502", pedido_id: 1047, valor: 94.90 }`
  - 14:02:11 `EstoqueReservado { evento_id: "e-503", sku: "GATO-042", antes: 3, depois: 2 }`
  - 14:30:00 `PedidoEnviado { evento_id: "e-504", pedido_id: 1047, rastreio: "LA123456789BR" }`
  - **E se der errado:** o `PedidoPago` (e-502) chega **duas vezes** → o estoque vai 3 → 2 → **1** (errado). Conserto: o estoque guarda os `evento_id` já processados e ignora o repetido (idempotência; aprofunda em módulo futuro).

## Aulas (8): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1 introducao (ponte do módulo 5; o problema dos 7 módulos num processo; mapa do módulo) · 2 monolitos (vantagens reais, vizinho barulhento, raio de explosão, escala vertical) · 3 microsservicos (partir, banco por serviço, rede no meio, escala independente, o preço: consistência, testes, observabilidade, resiliência) · 4 domain-driven-design (domínio, linguagem ubíqua, contexto delimitado, monolito modular) · 5 ddd-conceitos-e-componentes (entidade, value object, agregado, repositório, evento de domínio, anêmico vs rico, subdomínios) · 6 lei-de-conway · 7 case-da-loja-dominios-e-entidades · 8 case-da-loja-servicos-e-eventos (fecha com "Falta saber…": com 10 réplicas do catálogo, quem decide qual réplica atende a Lena? → módulo 7, Load Balancers)

## Widgets 2D (Sonnet)
- Aula 2/3: calculadora de vCPU da Black Friday (multiplicador de tráfego da vitrine 1×–20× → monolito vs serviços; com 10× dá 80 vs 25).
- Aula 3: somador de latência do checkout (nº de saltos de rede × 5 ms + 180).
- Aula 5: "anêmico ou rico?" (tentar cancelar o pedido 1047 com status pago / enviado nos dois modelos).
- Aula 7: arrastar/ordenar os 7 eventos e agrupar em contextos (pode ser por botões, celular primeiro).
- Aula 8: replay da fila com o evento duplicado, com e sem idempotência (estoque final 2 vs 1).

## Figuras 3D (Opus) e modes
### `monolito-3d` (aulas 1–3 e 6): a loja como um prédio só, e depois partida
Um bloco único (o processo `loja`) com 7 salas (módulos) e um tanque embaixo (banco `loja`); medidor de vCPU (8) e de ms no painel.
modes: `mono` (o checkout do 1047 atravessa as 7 salas por chamadas locais, 180 ms, BEGIN/COMMIT), `ruido` (23:00, Relatórios acende e come 7 de 8 vCPU; a página do gato 120 ms → 2,4 s; checkout estoura 2 s), `queda` (Entregas estoura memória, o prédio inteiro apaga), `split` (o prédio se separa em 6 serviços + relatórios, cada um com seu tanque; o mesmo checkout agora tem 4 saltos de rede = 200 ms; Entregas cai e o evento espera na fila), `escala` (Black Friday 10×: 10 prédios inteiros = 80 vCPU vs catálogo ×10 e o resto pouco = 25 vCPU), `conway` (3 times — Vitrine, Checkout, Logística — e os serviços se agrupam em 3 ilhas; antes: 3 camadas frontend/backend/DBA).
Painel com contadores reais: "vCPU em uso", "ms do checkout", "serviços no ar".
### `dominio-3d` (aulas 4–5, 7–8): o pedido 1047 por dentro dos domínios
Contextos como ilhas/salas com fronteira visível; o dado muda de forma ao cruzar a fronteira.
modes: `contextos` (o gato vira produto 42 / SKU GATO-042 / volume 0,4 kg / nada para Pagamentos), `agregado` (Pedido 1047 como raiz com ItemDoPedido, Endereço e Dinheiro como value objects; a invariante 79.90 + 15.00 = 94.90; tentar mexer no item por fora é barrado), `eventos` (a linha do tempo e-501…e-504 andando num barramento entre as ilhas, payload JSON real no painel; estoque 3 → 2), `falha` (Entregas cai, PedidoPago espera na fila e é entregue depois; e o e-502 duplicado: sem idempotência estoque 1, com idempotência 2).

Marcadores no MDX: `{/* FIG:monolito mode=mono */}`, `{/* FIG:dominio mode=contextos */}` etc.

## Vocabulário fixo
"monolito", "microsserviço" (não "micro-serviço"/"microserviço"), "serviço", "módulo", "processo", "raio de explosão", "vizinho barulhento", "banco por serviço", "domínio", "contexto delimitado", "linguagem ubíqua", "entidade", "value object", "agregado", "raiz do agregado", "repositório", "evento de domínio", "monolito modular", "Lei de Conway".
