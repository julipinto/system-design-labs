# Fontes: Backend for Frontends (BFF)

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Backend for Frontend (BFF), por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/bffs/), publicado em 15/06/2025, citado nas aulas 1 a 5, 6, 7 e 8.

**Aulas:** 1 Introdução e responsabilidades · 2 API composition · 3 Canais e dispositivos · 4 Microfrontends e BFFs · 5 Versionamento e deployment · 6 Resiliência e blast radius · 7 Métricas e experiência de uso · 8 Considerações finais

Conferência feita em 2026-10-20 (`curl -sL` com `User-Agent: Mozilla/5.0`): os 19 links citados nas aulas abrem com **200**. Não há repositório público de laboratório para este dia, então não há aula de código lido: onde ajudou, as aulas mostram configuração real (Envoy, Unleash, Resilience4j, PromQL, cabeçalhos HTTP) com as fontes oficiais ao lado, e deixam claro quando o código foi escrito para a aula.

**Sobre as Referências do artigo:** são 4. Duas são do Medium e respondem **403** para robôs (não foi possível ler e não são citadas). A de Sam Newman e a do GeeksforGeeks abrem (a segunda redireciona para `geeksforgeeks.org/system-design/backend-for-frontend-pattern/` e não entra nas aulas: é introdutória e não é fonte primária). As fontes primárias do brief (Phil Calçado, microservices.io, Cam Jackson) foram abertas e usadas.

**Observação:** a URL `samnewman.io/blog/2015/07/01/...` retorna 404; a página certa é `samnewman.io/patterns/architectural/bff/`.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [System Design - Backend for Frontend (BFF), Matheus Fidelis](https://fidelissauro.dev/bffs/) | artigo base | Definição, responsabilidades, API composition, segregação de canais, microfrontends, versionamento com toggles, resiliência e blast radius, métricas por canal. As 8 aulas seguem a ordem dele. | 1 a 8 | 200 |
| [Sam Newman: Pattern: Backends For Frontends](https://samnewman.io/patterns/architectural/bff/) | referência do artigo e fonte primária | "Um backend por experiência de usuário", atribui o termo a Phil Calçado e diz preferir um BFF para cada tipo de cliente. | 1, 3, 4, 5, 8 | 200 |
| [Phil Calçado: The Back-end for Front-end Pattern (BFF)](https://philcalcado.com/2015/09/18/the_back_end_for_front_end_pattern_bff.html) | fonte primária | Relato do SoundCloud: a API pública, genérica demais, exigia muitas requisições; o termo foi cunhado por Nick Fisher, tech lead de web. | 1, 2, 3 | 200 |
| [microservices.io: API Gateway / Backends for frontends](https://microservices.io/patterns/apigateway.html) | fonte primária | O gateway como ponto de entrada único que roteia e compõe requisições; variante BFF. | 1, 2, 8 | 200 |
| [microservices.io: API Composition](https://microservices.io/patterns/data/api-composition.html) | fonte primária | Chamar os serviços donos dos dados e juntar em memória; lista as desvantagens (disponibilidade menor, junção em memória). | 2, 4 | 200 |
| [Cam Jackson (martinfowler.com): Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) | fonte primária | Dividir o frontend monolítico em partes de times diferentes; integração por build, iframe, JavaScript ou Web Components; custos (tamanho do payload, complexidade operacional). | 4 | 200 |
| [Matheus Fidelis: API Gateway](https://fidelissauro.dev/api-gateway/) | artigo vizinho | Autenticação, roteamento e limite de taxa no gateway; contraste com o BFF. | 8 | 200 |
| [Matheus Fidelis: Padrões de Resiliência](https://fidelissauro.dev/resiliencia/) | artigo vizinho (link do artigo) | Retry, fallback, circuit breaker e backpressure. | 6 | 200 |
| [Matheus Fidelis: Estratégias de deployment](https://fidelissauro.dev/deployment-strategies/) | artigo vizinho (link do artigo) | Canary, blue-green, rolling e feature flags. | 5 | 200 |
| [RFC 6750, seção 2.1: Authorization: Bearer](https://www.rfc-editor.org/rfc/rfc6750#section-2.1) | fonte primária | Formato `Authorization: Bearer <token>` da requisição. | 2 | 200 |
| [Envoy: route_components (timeout, headers, string_match)](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto) | documentação oficial | `timeout` da rota (padrão 15 s) e o casamento de cabeçalho por `string_match`, base dos exemplos de rota por prefixo e por versão. | 3, 5 | 200 |
| [MDN: Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary) | documentação oficial | `Vary` diz quais cabeçalhos da requisição entram na chave do cache. | 3 | 200 |
| [Unleash: estratégias de ativação](https://docs.getunleash.io/concepts/activation-strategies) | documentação oficial | Rollout gradual por percentual, escolhendo o usuário por hash do id (a mesma pessoa vê sempre a mesma coisa). | 5 | 200 |
| [Unleash (cliente Node): flexible-rollout-strategy.ts](https://github.com/Unleash/unleash-client-node/blob/main/src/strategy/flexible-rollout-strategy.ts) | código oficial | Confirma o nome `flexibleRollout` e os parâmetros `rollout`, `stickiness` e `groupId` usados no exemplo de JSON. | 5 | 200 |
| [Resilience4j: CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker) | documentação oficial | `failureRateThreshold` (padrão 50) e `waitDurationInOpenState`. A propriedade `timelimiter...timeoutDuration` foi conferida na página `getting-started-3` do mesmo site. | 6 | 200 |
| [Polly: estratégia de circuit breaker](https://www.pollydocs.org/strategies/circuit-breaker.html) | documentação oficial | Alternativa em .NET: o circuito abre quando a razão de falhas passa de um limite. | 6 | 200 |
| [MDN: Retry-After](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After) | documentação oficial | Como um serviço avisa quanto esperar antes de tentar de novo (fallback e retry). | 6 | 200 |
| [Prometheus: histogramas e quantis](https://prometheus.io/docs/practices/histograms/) | documentação oficial | Base do p95 por `histogram_quantile`. | 7 | 200 |
| [Prometheus: funções de consulta](https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile) | documentação oficial | Sintaxe de `histogram_quantile` usada na consulta de exemplo. | 7 | 200 |
| [GraphQL: introdução](https://graphql.org/learn/) | documentação oficial | O cliente descreve os campos que quer; alternativa ou complemento ao BFF. | 8 | 200 |

## Correções e observações sobre o artigo-base

1. **Origem do padrão.** O artigo não menciona SoundCloud, Phil Calçado nem Sam Newman. As aulas contam a origem com as duas fontes primárias (Calçado: o termo foi cunhado por Nick Fisher; Newman o atribui a Calçado).
2. **Um BFF por quê.** O artigo fala de BFF por "tipo de frontend". Newman começa com "um backend por experiência de usuário" e diz preferir um BFF para cada tipo de cliente. A loja junta iOS e Android no `bff-app` por mostrarem a mesma tela, e isso aparece como escolha do exemplo (aula 1).
3. **Memcached.** O artigo cita Memcached como cache da sessão do canal web; na loja é o Redis do módulo 5 (aula 3). Não é erro, é adaptação ao elenco da história.
4. **MQTT e WebSockets.** O artigo cita para IoT; a voz da loja é pergunta e resposta em HTTP (aula 3).
5. **Toggles.** O artigo diz que um BFF por versão evita "toggles adicionais" e na mesma seção recomenda toggles. As aulas separam os papéis: BFF por versão para contratos diferentes, toggle para liberar aos poucos (aula 5).
6. **Canary e blue-green contra blast radius.** O artigo os apresenta como forma de reduzir o raio de explosão; eles reduzem o de uma versão ruim do BFF, não o de um serviço que cai (aula 6).
7. **API Composition.** O artigo só apresenta as vantagens. O microservices.io lista as desvantagens, e a aula 2 mostra a conta da disponibilidade (0,999^4 ≈ 99,6%).
8. **Referências.** As duas do Medium dão 403 para robôs e não foram lidas; não são citadas.
