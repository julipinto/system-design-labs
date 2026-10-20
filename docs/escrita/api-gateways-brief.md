# Módulo 8: API Gateways (brief canônico)

Fonte principal: https://fidelissauro.dev/api-gateway/ (texto em docs/escrita/api-gateway-artigo.txt; 10 links nas Referências: NGINX "What is an API gateway", jwt.io, microservices.io API Gateway pattern etc.).
Lab público: github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design, pasta `exemplos/api-gateway/`: Kong em modo declarativo (`kong.yml`, `_format_version: "3.0"`), 4 apps Go (`users-service:8081/users`, `products-service:8082/products`, `orders-service:8083/orders`, `orders-service-v2:8084/orders`), rotas `/api/v1/users`, `/api/v1/products`, `/api/v1/orders`, `/api/v2/orders` com `strip_path: true`; `setup-kong.sh`, `test-kong.sh`, `docker-compose.yml`. Usar o código real em <pre> na aula 7. Não citar curso (o link entra como "repositório público do autor").
Fontes primárias: Kong docs (rate-limiting plugin, jwt plugin, key-auth, declarative config), RFC 7519 (JWT), RFC 6749 (OAuth 2.0), RFC 6585 (429 Too Many Requests) e `Retry-After` (RFC 9110), microservices.io API Gateway, Envoy/NGINX docs de rate limit, Wikipedia/Tanenbaum para token bucket e leaky bucket (definição clássica de redes).
Siga PREMISSAS.md e ESCRITA.md. Slug: `api-gateways`. Coleção `src/content/api-gateways/`, página `src/pages/labs/api-gateways/`. Título do módulo: "API Gateways".

## Onde a história parou e o novo problema
Módulo 7 terminou com o `lb-loja` distribuindo o catálogo entre as réplicas e roteando por caminho em L7. Agora a loja abriu um **app de celular** e uma **API para parceiros** (um marketplace que revende o gato). Cada serviço do módulo 6 tem o seu endereço e confere o login do seu jeito: `catalogo` aceita qualquer um, `pedidos` confere um token, `pagamentos` confere outro. O parceiro precisa conhecer 6 URLs. E na Black Friday um robô de um concorrente pede o preço do gato **500 vezes por segundo**. Problema do módulo: **uma porta só, com as regras comuns aplicadas uma vez**.

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
### O cenário
- Porta única: `api.loja.com.br` → **API Gateway** `gw-loja`. Atrás dele, os **load balancers** de cada serviço (módulo 7) e as réplicas.
- Rotas (versão 1): `/api/v1/produtos` → `catalogo`, `/api/v1/carrinho` → `carrinho`, `/api/v1/pedidos` → `pedidos`, `/api/v1/clientes` → `clientes`. `strip_path`: o gateway recebe `/api/v1/produtos/42` e entrega `/produtos/42` ao catálogo.
- Clientes do gateway: **app da loja** (a Lena compra pelo celular, em Recife), **site**, e o **parceiro** `marketplace-xyz` (chave de API `key=mk_live_…`, exemplo).
- O pedido-estrela: a Lena, pelo app, `POST /api/v1/pedidos` com `{ "produto": 42, "qtd": 1 }` → pedido **1048** (o 1047 é do módulo 6), total **94.90** (79.90 + frete 15.00).

### Sem gateway (aula 1–2)
- O app conhece 6 endereços (`catalogo.loja.com.br`, `pedidos.loja.com.br`, …); cada serviço faz login do seu jeito; trocar o `pedidos` por um novo obriga app e parceiro a mudar de URL. Problemas operacionais: 6 certificados, 6 lugares para bloquear um robô, 6 logs diferentes.
- Com monolito era uma URL só; com microsserviços (módulo 6) o cliente passou a ver a divisão interna. O gateway esconde de novo.

### Gateway vs load balancer (aula 3)
- LB distribui **N réplicas da mesma coisa** (qualquer protocolo, L4 ou L7). Gateway expõe **várias APIs diferentes** com regras de governança (quem pode chamar o quê, quanto, em qual versão). Juntos: `app → gw-loja → lb-catalogo → catalogo-1/2/3`.

### Roteamento, autenticação e autorização (aula 4)
- Roteamento granular por método + caminho: `GET /api/v1/produtos/*` → catálogo (público, sem login); `POST /api/v1/pedidos` → pedidos (precisa login); `GET /api/v1/pedidos/1048` → pedidos (precisa login **e** ser a dona do pedido).
- Autenticação (quem é você) com **JWT**: o app manda `Authorization: Bearer eyJ…`; o gateway confere a assinatura e a validade (`exp`) e repassa ao serviço o cabeçalho `X-Cliente-Id: lena-77`. Payload de exemplo: `{ "sub": "lena-77", "nome": "Lena", "escopos": ["pedidos:ler", "pedidos:criar"], "exp": 1792000000 }`.
- Autorização (o que você pode): o parceiro tem só `produtos:ler`; tenta `POST /api/v1/pedidos` → **403 Forbidden**. Sem token → **401 Unauthorized**. Token vencido → 401.
- **E se der errado:** o serviço `pedidos` aceita qualquer `X-Cliente-Id` porque "o gateway já conferiu", e alguém chama o `pedidos` direto pela rede interna, sem passar pelo gateway → lê o pedido da Lena. Conserto: rede interna fechada (só o gateway alcança os serviços) e/ou o serviço também confere o token.

### Rate limiting, throttling, token bucket e leaky bucket (aula 5)
- O robô do concorrente: **500 pedidos/s** em `GET /api/v1/produtos/42`. O catálogo aguenta **100 pedidos/s** sem degradar.
- Rate limit por cliente: **10 pedidos/s por chave**; acima → **429 Too Many Requests** com `Retry-After: 1` e cabeçalhos `RateLimit-Limit: 10`, `RateLimit-Remaining: 0`.
- **Token bucket** (o exemplo do artigo, mantido): balde de **200 tokens**, reposição **100 tokens/s**. Rajada de 200 de uma vez passa; depois só 100/s. A Lena abre o app e dispara 12 pedidos de uma vez (lista, fotos, preço): com um balde de 20 tokens e reposição de 10/s ela passa inteira; o robô com 500/s esgota o balde em menos de 1 s e recebe 429.
- **Leaky bucket** (definição clássica): uma **fila** de tamanho fixo que **vaza em ritmo constante** (ex.: fila de 50, saída 50/s). Rajada entra na fila e sai aos poucos; se a fila enche, o excedente é descartado. Saída lisa, sem rajada. **Correção ao artigo:** o artigo descreve o leaky bucket como "balde do tamanho da taxa de reposição"; o que define o leaky bucket é a saída constante a partir de uma fila (registrar em docs/fontes).
- **Throttling** (reativo): o catálogo começou a responder em 2 s; o gateway reduz o limite global de 100/s para **50/s** até o tempo voltar ao normal.
- **E se der errado:** 3 réplicas do gateway, cada uma com seu contador local de 10/s → o robô consegue **30/s** (o mesmo problema do cache local do módulo 5). Conserto: contador compartilhado no **Redis**, com consistência eventual (pode deixar passar alguns a mais).

### Versionamento (aula 6)
- `/api/v1/pedidos` → `pedidos` (v1, resposta `{ "id": 1048, "total": 94.90 }`); `/api/v2/pedidos` → `pedidos-v2` (resposta `{ "id": 1048, "total": { "valor": 94.90, "moeda": "BRL" } }`, um campo mudou de forma = quebra contrato). O app antigo continua no v1; o app novo usa v2.
- Reescrita: o gateway recebe `/api/v2/pedidos/1048` e entrega `/pedidos/1048` ao `pedidos-v2`.
- Canary pelo gateway: **10%** do tráfego do v1 vai para a nova implementação com o mesmo contrato; sobe para 50% e 100% se os erros não aumentarem.
- **E se der errado:** desligar o v1 enquanto o parceiro ainda usa → 404 para o parceiro. Conserto: aviso com prazo (cabeçalho `Deprecation`/`Sunset`) e medir no gateway quem ainda chama o v1.

### Laboratório Kong (aula 7)
O `exemplos/api-gateway/` do repositório: explicar `kong.yml` (services, routes, paths, `strip_path`, `path_handling`) linha a linha com o código real; `curl localhost:8000/api/v1/products` → o Kong entrega `/products` ao `products-service`; `/api/v2/orders` → `orders-service-v2`. Mapear para a loja (users=clientes, products=catálogo, orders=pedidos). Mostrar como ligar o plugin `rate-limiting` (`config.second: 10`, `policy: local` vs `redis`) e o 429 resultante. **E se der errado:** `policy: local` com 2 nós do Kong deixa passar o dobro.

## Aulas (7): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1 introducao-e-problemas-operacionais · 2 monolitos-e-microsservicos (o cliente vendo a divisão interna) · 3 api-gateway-vs-load-balancer · 4 roteamento-autenticacao-e-autorizacao · 5 rate-limiting-throttling-token-bucket-e-leaky-bucket · 6 versionamento-de-apis · 7 laboratorio-kong (fecha com "Falta saber…": o app de celular precisa de uma tela que junta catálogo, carrinho e recomendações numa resposta só, e o site precisa de outra forma; um gateway único para todos os clientes vira um gargalo de decisões → módulo 9, Backend for Frontends)

## Widgets 2D (Sonnet)
- Simulador de token bucket vs leaky bucket: capacidade, taxa, rajada de entrada (Lena 12 de uma vez, robô 500/s) → quantos passam, quantos levam 429, gráfico simples de saída.
- "Qual resposta?": montar a chamada (com/sem token, escopo, rota) e ver 200 / 401 / 403 / 429 / 404.
- Reescrita de caminho: digitar `/api/v2/pedidos/1048` e ver para qual serviço e qual caminho vai.
- Calculadora de rate limit com N réplicas do gateway (local vs Redis).

## Figuras 3D (Opus) e modes
### `gateway-3d` (aulas 1–4, 6): a porta única da loja
Clientes à esquerda (app da Lena, site, parceiro, robô), o gateway no meio como um portão com estações (rota, auth, limite, versão), os serviços (com seus LBs) à direita.
modes: `sem` (6 URLs, cada serviço com seu login), `rota` (método + caminho → serviço; strip_path), `auth` (JWT: confere assinatura e exp, repassa X-Cliente-Id; 401 sem token, 403 parceiro sem escopo; e se der errado: chamada direta ao pedidos pela rede interna), `lb` (gw → lb-catalogo → 3 réplicas: quem faz o quê), `versao` (v1/v2 com a resposta real lado a lado, canary 10% → 50% → 100%; e se der errado: v1 desligado cedo, 404 para o parceiro).
### `limite-3d` (aulas 5, 7): os baldes
Um balde de tokens (gotas = tokens repondo em ritmo fixo) e um balde furado (fila que vaza constante), lado a lado, com a mesma rajada entrando.
modes: `token` (200 de capacidade, 100/s; rajada passa, depois ritmo; robô 500/s recebe 429 com cabeçalhos reais), `leaky` (fila 50, saída 50/s; saída lisa, excedente descartado), `throttle` (catálogo lento → limite global cai de 100/s para 50/s e volta), `replicas` (3 gateways com contador local = 30/s; com Redis = 10/s).

Marcadores no MDX: `{/* FIG:gateway mode=auth */}`, `{/* FIG:limite mode=token */}` etc.

## Vocabulário fixo
"API Gateway" (ou "gateway"), "rota", "ponto de entrada único", "autenticação", "autorização", "token", "JWT", "escopo", "rate limiting", "throttling", "token bucket", "leaky bucket", "rajada", "429", "versionamento", "contrato", "canary", "strip_path".
