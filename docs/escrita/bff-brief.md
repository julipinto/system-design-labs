# Módulo 9: Backend for Frontends (brief canônico)

Fonte principal: https://fidelissauro.dev/bffs/ (texto em docs/escrita/bffs-artigo.txt; ver as Referências no fim). Fontes primárias: Sam Newman, "Backends For Frontends" (samnewman.io/patterns/architectural/bff/), Phil Calçado ("The Back-end for Front-end Pattern", SoundCloud, philcalcado.com), microservices.io "API Composition" e "API Gateway / BFF", Martin Fowler / Cam Jackson "Micro Frontends" (martinfowler.com/articles/micro-frontends.html).
O repositório público de labs não tem exemplo deste dia: não há aula de laboratório. Não citar curso.
Siga PREMISSAS.md e ESCRITA.md. Slug: `bff`. Coleção `src/content/bff/`, página `src/pages/labs/bff/`. Título do módulo: "Backend for Frontends (BFF)".
**Uma figura só** neste módulo (é curto e conceitual): `bff-3d`.

## Onde a história parou e o novo problema
Módulo 8 terminou com o `gw-loja` como porta única (`api.loja.com.br`), conferindo JWT, limitando o robô e servindo v1/v2. Só que a tela inicial do **app** da Lena precisa de 4 coisas de 4 serviços, e o **site** precisa das mesmas coisas em outro formato. Cada cliente faz várias chamadas e recebe JSON demais. O problema do módulo: **um backend sob medida para cada frontend**.

## História canônica (texto, figura, quiz, glossário, widgets: OS MESMOS dados)
### A tela inicial do app da Lena (Recife, 4G)
Precisa de: o gato (produto 42, 79.90) do `catalogo`, o carrinho (1 item) do `carrinho`, "quem comprou também comprou" (caneca azul, do grafo do módulo 4) do `recomendacoes`, e o status do pedido **1048** ("a caminho") do `pedidos`.
- **Sem BFF:** o app faz **4 chamadas** ao gateway, uma depois da outra (a segunda depende do id da primeira) → 4 × **120 ms** de ida e volta no 4G = **480 ms**; recebe **180 KB** de JSON feito para o site (descrição longa, 8 fotos em alta, campos internos como `custo_fornecedor`).
- **Com o BFF do app (`bff-app`):** o app faz **1 chamada** `GET /app/home` (120 ms no 4G); o `bff-app`, dentro da rede da loja, chama os 4 serviços **em paralelo** (o mais lento leva **25 ms**) e monta uma resposta de **12 KB** (1 foto em miniatura, só os campos da tela, sem `custo_fornecedor`) → **~150 ms** no total.
- Resposta real do `bff-app` (exemplo): `{ "destaque": { "id": 42, "nome": "gato de pelúcia", "preco": 79.90, "foto": "gato-320.webp" }, "carrinho": { "itens": 1 }, "recomendado": [{ "id": 7, "nome": "caneca azul", "preco": 19.90 }], "pedido": { "id": 1048, "status": "a caminho" } }`.

### Canais (aula 3)
- `bff-app` (iOS/Android): respostas pequenas, miniaturas, paginação curta, token JWT do gateway.
- `bff-web` (site): renderiza no servidor (SSR), sessão em cache central (o Redis do módulo 5), fotos grandes.
- `bff-voz` (assistente de voz, novo canal): a Lena pergunta "cadê meu pedido?" → resposta em texto curto: `"Seu pedido 1048 está a caminho e chega quinta."` Nada de foto.
- O parceiro `marketplace-xyz` continua no gateway (API pública genérica): BFF é para frontend próprio.
- Sem BFF por canal: um backend só com `if (canal == "app") … else if (canal == "web") …` crescendo em cada endpoint.

### Microfrontends (aula 4) — liga com a Lei de Conway (módulo 6)
Os 3 times do módulo 6 (**Vitrine, Checkout, Logística**) dividem também a tela do site: o microfrontend da vitrine, o do carrinho/checkout e o de rastreio, cada um com seu BFF (`bff-vitrine`, `bff-checkout`, `bff-rastreio`). Cada time faz deploy do seu pedaço de tela e do seu BFF sem esperar os outros. **E se der errado:** BFFs demais duplicam a mesma lógica (3 BFFs calculando frete de 3 jeitos) → regra de negócio fica no serviço, BFF só compõe e adapta.

### Versionamento e deployment (aula 5)
O app **v3** (antigo, ainda instalado em 30% dos celulares) e o app **v4** (nova tela inicial). `bff-app-v3` e `bff-app-v4` rodam juntos; uma feature toggle `nova_home` liga a tela nova para 10% → 50% → 100% dos usuários do v4. Desligar o `bff-app-v3` só quando o uso do v3 cair abaixo de 1% (medido no próprio BFF).

### Resiliência e blast radius (aula 6)
- `recomendacoes` cai: o `bff-app` espera no máximo **100 ms** (timeout) e responde a tela **sem** a seção "quem comprou também comprou" (fallback, `"recomendado": []`). A Lena nem percebe.
- `pedidos` cai: a seção do pedido mostra "status indisponível agora" em vez de derrubar a tela.
- **E se der errado:** sem timeout, o `bff-app` espera o `recomendacoes` por 30 s e as conexões se acumulam até o BFF cair → a tela inicial inteira some. E o raio de explosão: `bff-app` e `bff-web` dependem do mesmo `catalogo`; se ele cai, **os dois canais** sentem. Separar BFF por canal não separa as dependências compartilhadas (gancho para bulkheads e resiliência, módulos futuros, sem aprofundar).

### Métricas por canal (aula 7)
Com um BFF por canal, cada um mede o seu: `bff-app` p95 **150 ms**, erros **2%**; `bff-web` p95 **300 ms**, erros **0,1%**. Os 2% de erro do app aparecem só no **v3** em Android antigo — num backend único, esse problema ficaria diluído em 0,6% no total e passaria despercebido.

### Considerações finais (aula 8)
Quando usar (canais com necessidades diferentes, times por canal, tela que junta muitos serviços) e quando não (um canal só, um time só; o gateway com composição simples resolve). BFF ≠ API Gateway: gateway é infraestrutura genérica (rota, auth, limite); BFF é código de produto, do time do frontend. Caminho completo: `app → gw-loja → bff-app → serviços`.

## Aulas (8): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1 introducao-e-responsabilidades · 2 api-composition · 3 canais-e-dispositivos · 4 microfrontends-e-bffs · 5 versionamento-e-deployment · 6 resiliencia-e-blast-radius · 7 metricas-e-experiencia · 8 consideracoes-finais (fecha com "Falta saber…": entre o BFF e os serviços, e entre os serviços, cada chamada precisa de timeout, retry, criptografia e métrica, e cada time está escrevendo isso do seu jeito, em cada linguagem; dá para colocar isso na rede, uma vez só? → módulo 10, Service Mesh)

## Widgets 2D (Sonnet)
- Calculadora de tela inicial: nº de chamadas, RTT do celular (4G 120 ms / Wi-Fi 30 ms), sequencial vs BFF paralelo, KB por resposta → tempo total e dados gastos.
- "Qual BFF?": o mesmo pedido (status do 1048) e o formato que cada canal recebe (app, web, voz).
- Timeout e fallback: o `recomendacoes` demora X ms; com timeout de 100 ms e sem timeout → o que a Lena vê.

## Figura 3D (Opus) e modes
### `bff-3d` (aulas 1–3, 5–7): da tela da Lena até os serviços
Celular da Lena (tela inicial desenhada com as 4 seções), o site num monitor, um alto-falante (voz); o gateway; os BFFs como balcões por canal; os 4 serviços atrás. O JSON real aparece no painel e o tamanho em KB e o relógio de ms andam ao vivo.
modes: `sem` (4 chamadas em série pelo 4G, 480 ms, 180 KB), `compor` (1 chamada, BFF chama 4 em paralelo, 150 ms, 12 KB; a resposta real montada pedaço por pedaço), `canais` (o mesmo status do 1048 vira miniatura no app, página no site, frase na voz), `versao` (v3 e v4 lado a lado; toggle 10/50/100%), `falha` (recomendações cai: timeout 100 ms e fallback; e se der errado: sem timeout, BFF trava e a tela some; catálogo cai e os dois canais sentem), `metricas` (p95 e erros por canal; os 2% do v3 Android).

Marcadores no MDX: `{/* FIG:bff mode=compor */}` etc. Na aula 4 (microfrontends) e 8 não há figura 3D: use widget ou diagrama simples.

## Vocabulário fixo
"BFF" (Backend for Frontend), "canal", "frontend", "API composition", "composição", "microfrontend", "feature toggle", "fallback", "timeout", "raio de explosão", "p95", "payload".
