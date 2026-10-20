# Fontes: API Gateways

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - API Gateway, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/api-gateway/), citada nas aulas 1 a 7. Texto local em `docs/escrita/api-gateway-artigo.txt`.

**Aulas:** 1 Introdução e problemas operacionais · 2 Monolitos e microsserviços · 3 API Gateway vs Load Balancer · 4 Roteamento, autenticação e autorização · 5 Rate limiting, throttling, token bucket e leaky bucket · 6 Versionamento de APIs · 7 Laboratório Kong

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`): os 25 links distintos citados nas aulas abrem com 200.

**Laboratório (aula 7):** o código foi lido por `gh api` em `exemplos/api-gateway/` do repositório público (`kong.yml`, `docker-compose.yml`, `README.md`, `setup-kong.sh`, `test-kong.sh` e os `main.go` dos apps). O Kong não foi executado (sem Docker no ambiente): os caminhos e respostas vêm da leitura do código e da documentação. O esquema do plugin `rate-limiting` na versão 3.4 (a do compose) foi conferido no código-fonte do Kong, tag 3.4.0: `policy` padrão `local` e `redis_host` plano.

## Correções ao artigo-base
- **Leaky bucket (aula 5):** o artigo descreve o balde "do tamanho da taxa de reposição". O que define o leaky bucket é uma fila que vaza em ritmo constante; o tamanho da fila é livre. Fonte: Wikipedia (leaky bucket).
- **Referências sobre throttling (aula 5):** duas das referências do artigo falam de thermal throttling e de WCF, não de gateways. Servem só de analogia.
- **Plugin do Kong (aula 7):** o artigo apresenta rate limiting como token bucket; o plugin `rate-limiting` do Kong é um limite de pedidos por período, não um balde com rajada. Fonte: documentação do plugin.
- **Gateways e REST (aula 1):** o artigo diz que gateways são "primariamente" para REST; os produtos tratam também gRPC, WebSocket e GraphQL.

## Pontas soltas do laboratório (aula 7, Aprofundar)
Scripts com rotas antigas (`/api/users`), apps que só respondem ao caminho exato (`/products/42` dá 404 no app), healthcheck do `users-service` em `/health` quando o app expõe `/users/health`, `make kong-run` sem Makefile na pasta, Admin API publicada na 8001 sem autenticação.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [System Design - API Gateway, Matheus Fidelis](https://fidelissauro.dev/api-gateway/) | artigo base | Base do módulo: problemas operacionais, componentes, autenticação, rate limiting, token e leaky bucket, versionamento e canary. | 1 a 7 | 200 |
| [Repositório público de exemplos, pasta exemplos/api-gateway](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/api-gateway) | outro (código público) | `kong.yml` de 39 linhas, compose com Kong 3.4 em DB-less e 4 apps Go. O endereço contém o nome de um curso; o texto não cita o curso nem reproduz material pago. | 7 | 200 |
| [microservices.io: API Gateway pattern](https://microservices.io/patterns/apigateway.html) | referência do artigo | Definição do padrão e das consequências (ponto único, gargalo). | 1 | 200 |
| [HubSpot: o que é um API Gateway](https://blog.hubspot.com/website/api-gateway) | referência do artigo | Visão geral das funções. | 1 | 200 |
| [Microsoft: Gateway Offloading](https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-offloading) | referência do artigo | Tirar dos serviços funções comuns (TLS, autenticação, limite). | 1 | 200 |
| [Microsoft: Gateway Routing](https://learn.microsoft.com/en-us/azure/architecture/patterns/gateway-routing) | referência do artigo | Um endereço, vários serviços por caminho. | 2 | 200 |
| [GeeksforGeeks: API Gateway](https://www.geeksforgeeks.org/what-is-api-gateway-system-design/) | referência do artigo | Gateway e load balancer. | 3 | 200 |
| [Kong: entidade Upstream](https://developer.konghq.com/gateway/entities/upstream/) | documentação | Alvos, pesos e balanceamento dentro do gateway. | 3 | 200 |
| [jwt.io: introdução](https://jwt.io/introduction) | referência do artigo | Estrutura de um JWT (header, payload, assinatura). | 4 | 200 |
| [RFC 7519: JWT](https://datatracker.ietf.org/doc/html/rfc7519) | fonte primária (RFC) | Claims `sub` e `exp`. | 4 | 200 |
| [RFC 9110: HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) | fonte primária (RFC) | 401 e 403, `Retry-After`. | 4 | 200 |
| [Kong: plugin JWT](https://developer.konghq.com/plugins/jwt/) | documentação | Conferência de assinatura e validade no gateway. | 4 | 200 |
| [OWASP API Security 2023: BOLA](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) | documentação | Por que "ser a dona do pedido" precisa ser conferido. | 4 | 200 |
| [RFC 6585: 429 Too Many Requests](https://datatracker.ietf.org/doc/html/rfc6585) | fonte primária (RFC) | Definição do 429; não define como identificar o cliente. | 5 | 200 |
| [Wikipedia: token bucket](https://en.wikipedia.org/wiki/Token_bucket) | referência | Definição clássica. | 5 | 200 |
| [Wikipedia: leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket) | referência | Duas versões (medidor e fila); base da correção ao artigo. | 5 | 200 |
| [NGINX: limit_req](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html) | documentação | Leaky bucket com `burst`. | 5 | 200 |
| [AWS API Gateway: throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html) | documentação | Token bucket com taxa e burst. | 5 | 200 |
| [RFC 9745: Deprecation](https://datatracker.ietf.org/doc/html/rfc9745) | fonte primária (RFC) | Cabeçalho `Deprecation`. | 6 | 200 |
| [RFC 8594: Sunset](https://datatracker.ietf.org/doc/html/rfc8594) | fonte primária (RFC) | Cabeçalho `Sunset`. | 6 | 200 |
| [Martin Fowler: Canary Release](https://martinfowler.com/bliki/CanaryRelease.html) | referência | Subir o tráfego aos poucos. | 6 | 200 |
| [Kong: entidade Route](https://developer.konghq.com/gateway/entities/route/) | documentação | `paths`, `strip_path`, `path_handling` v0 e v1 com tabela de exemplos; rotas só HTTPS por padrão desde a 3.14. | 2, 6, 7 | 200 |
| [Kong: entidade Gateway Service](https://developer.konghq.com/gateway/entities/service/) | documentação | `url`, host, porta e caminho. | 7 | 200 |
| [Kong: modo DB-less](https://developer.konghq.com/gateway/db-less-mode/) | documentação | Nós independentes e Admin API somente leitura. | 7 | 200 |
| [Kong: plugin Rate Limiting](https://developer.konghq.com/plugins/rate-limiting/) | documentação | `policy` local, cluster e redis; cabeçalhos do 429; `sync_rate: 0` para contagem exata. | 7 | 200 |
