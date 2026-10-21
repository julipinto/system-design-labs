# Fontes: Comunicação Síncrona

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [Padrões de Comunicação Síncronos, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/padroes-de-comunicacao-sincronos/), citada nas aulas 1, 3, 5, 7 e 8 (texto em `docs/escrita/padroes-de-comunicacao-sincronos-artigo.txt`).

**Aulas:** 1 Introdução: chamar e esperar · 2 HTTP e REST · 3 Webhooks, short polling e long polling · 4 RPC · 5 gRPC e Protobufs · 6 WebSockets · 7 GraphQL · 8 Convergências arquiteturais

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`): 32 links citados nas aulas, todos com 200. O artigo da Waldo (Harvard) e o de Birrell e Nelson (ACM e Microsoft) devolveram **403** ou **404** para acesso automatizado; as aulas citam cópias no Internet Archive, que abrem.

**Laboratório:** repositório público do autor (`exemplos/protocolos-sincronos/`, tudo em Go: `rest-api/`, `rpc/`, `grpc/`, `websockets/`). Código lido com `gh api`; os trechos mostrados nas aulas estão em `src/lab-code/comunicacao-sincrona/` sem alteração. O lab **não** tem exemplo de webhook, polling nem GraphQL.

## Bytes do gRPC: medidos, não estimados

O brief trazia 204 B (1ª chamada) e 95 B (2ª em diante), calculados só com uma biblioteca HPACK. Foram **medidos** com Go 1.23.4 e grpc-go v1.62.1 (a versão do lab) em loopback: um proxy TCP em Python corta os quadros HTTP/2 e decodifica os cabeçalhos com HPACK (código em `docs/escrita/comunicacao-sincrona-medida-grpc/`).

| | Cliente | Servidor | Total |
|---|---|---|---|
| 1ª chamada | HEADERS 102 + DATA 16 (111 + 25 = 136 B) | HEADERS 19 + DATA 23 + trailers 24 (28 + 32 + 33 = 93 B) | **229 B** |
| 2ª chamada em diante | HEADERS 15 + DATA 16 (24 + 25 = 49 B) | HEADERS 2 + DATA 23 + trailers 2 (11 + 32 + 11 = 54 B) | **103 B** |

REST: 360 B em toda chamada; 360 ÷ 103 = **3,5×** (não 3,8×). A 2ª chamada deu 102 B (o `grpc-timeout` muda de tamanho). Fora da conta: prefácio de 24 B, SETTINGS (42 B), e os `PING`/`WINDOW_UPDATE` do estimador de banda (cerca de 190 B por chamada com chamadas em fila e 108 B com 8 em paralelo, tudo incluído). Diferenças para a conta do brief: `content-type: application/grpc+proto`, `user-agent: grpc-go/1.62.1`, `grpc-timeout` em microssegundos (`996250u`, não `1S`) e `grpc-message` vazio nos trailers. O `:authority` do teste (`127.0.0.1:50072`) tem 15 B; `pagamentos:50051` teria 16 B.

## Correções ao artigo (todas avisadas nas aulas)

1. "gRPC - Google Remote Procedure Call": a sigla oficial é "gRPC Remote Procedure Calls" (FAQ do grpc.io). Aula 5.
2. WebSockets: o HTTP/1.1 reaproveita a conexão e o HTTP/2 multiplexa; só o HTTP/1.0 abria uma conexão por requisição. A retransmissão de mensagens perdidas é do TCP; a aplicação perde as enviadas enquanto estava desconectada. Aula 6.
3. Webhooks "ainda de forma síncrona": a chamada HTTP é síncrona, mas o evento é uma notificação de saída; o que importa é o contrato (2xx rápido, reenvio, assinatura, duplicidade, ordem). Aula 3.
4. Short e long polling não aparecem com nome no artigo; as definições vêm da RFC 6202. Aula 3.
5. REST "é a principal abordagem": HTTP com JSON sem hipermídia é o nível 2 de Richardson; Fielding diz que sem hipermídia não é REST. Aula 2.
6. RPC "é um protocolo": é um modelo; o `net/rpc` está congelado e só fala Go (`gob`). Aula 4.
7. Exemplo gRPC: `grpc.Dial` com `WithInsecure` e `WithBlock` está obsoleto (atual: `grpc.NewClient` com `insecure.NewCredentials()`, grpc-go 1.63 ou mais); `fmt.Sprintf` descartado no artigo; `could not greet` e o comentário "quadrado de um número" são cópia de outros exemplos. Aula 5.
8. gRPC "ideal para microsserviços": faltam balanceamento de camada 4, gRPC-Web e versionamento do `.proto`. Aula 5.
9. GraphQL "desenvolvido pelo Facebook": nasceu lá (2012), hoje é mantido pela GraphQL Foundation; faltam N+1, custo de consulta, cache e erros com status 200. Aula 7.
10. Tabela de idempotência: completar com "seguro" (GET, HEAD) e citar a RFC 9110; `PUT` devolve 201 ou 200/204. Aula 2.
11. Lab: Books API (POST com ISBN repetido devolve 500; DELETE sempre 204), servidor de chat (4 problemas) e ausência de exemplos de webhook, polling e GraphQL. Aulas 2 e 6.
12. Bytes do gRPC do brief (204 B e 95 B): substituídos pelos medidos (229 B e 103 B). Aula 5.

## Referências do artigo (conferência de 2026-10-20)

- 200 — https://aws.amazon.com/pt/compare/the-difference-between-grpc-and-rest/
- 200 — https://datatracker.ietf.org/doc/html/rfc9110
- 200 — https://dev.to/karankumarshreds/go-rpc-implementation-4731
- 404 — https://docs.edgedb.com/database/reference/sdl
- 200 — https://echo.labstack.com/docs/
- 200 — https://github.com/gorilla/websocket/blob/main/examples/chat/client.go
- 200 — https://github.com/grpc/grpc-go
- 200 — https://github.com/msfidelis/nutrition-overengineering
- 200 — https://github.com/msfidelis/system-design-examples/tree/main/sync_protocols/grpc
- 200 — https://github.com/protocolbuffers/protobuf
- 200 — https://graphql.org/learn/schema/
- 200 — https://grpc.io/
- 200 — https://http.cat/
- 200 — https://igluonline.com/qual-diferenca-entre-url-uri-e-urn/
- 200 — https://protobuf.dev/
- 200 — https://restfulapi.net/rest-architectural-constraints/
- 200 — https://woliveiras.com.br/posts/url-uri-qual-diferenca
- 200 — https://www.apollographql.com/blog/using-graphql-with-golang
- 200 — https://www.cncf.io/blog/2022/02/11/integration-challenges-in-microservices-architecture-with-grpc-rest/
- 403 — https://www.gslab.com/blogs/grpc-vs-rest-a-complete-guide/
- sem resposta — https://www.httpstatus.com.br/
- sem resposta — https://www.javatpoint.com/graphql-application-components
- 200 — https://www.redhat.com/pt-br/topics/automation/what-is-a-webhook
- 200 — https://www.resolutesoftware.com/blog/rest-vs-graphql-vs-grpc-vs-websocket/

Dessas, `docs.edgedb.com` (404), `gslab.com` (403), `httpstatus.com.br` e `javatpoint.com` (sem resposta) não abriram e não foram citadas nas aulas.

## Links citados nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [https://fidelissauro.dev/padroes-de-comunicacao-sincronos/](https://fidelissauro.dev/padroes-de-comunicacao-sincronos/) | artigo base | Base do módulo: comunicação síncrona, REST, webhooks, RPC, gRPC, Protobuf, WebSocket, GraphQL e convergência. As aulas seguem a ordem dele, com 11 correções registradas abaixo. | 1, 3, 5, 7, 8 | 200 |
| [https://sre.google/sre-book/addressing-cascading-failures/](https://sre.google/sre-book/addressing-cascading-failures/) | livro | Google SRE Book: falhas em cadeia e sobrecarga entre serviços que dependem uns dos outros. | 1 | 200 |
| [https://web.archive.org/web/2023/https://scholar.harvard.edu/files/waldo/files/waldo-94.pdf](https://web.archive.org/web/2023/https://scholar.harvard.edu/files/waldo/files/waldo-94.pdf) | fonte primária (paper) | Waldo et al., 1994: chamada remota não é chamada local (latência, memória, falha parcial, concorrência). Cópia no Internet Archive (o endereço da Harvard devolve 403 para acesso automatizado). | 1, 4 | 200 |
| [https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) | rascunho IETF | Cabeçalho Idempotency-Key: o servidor guarda a chave e devolve a mesma resposta na repetição. | 2 | 200 |
| [https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) | fonte primária (tese) | Fielding, 2000, cap. 5: as restrições do estilo REST (cliente-servidor, sem estado, cache, camadas, interface uniforme). | 2 | 200 |
| [https://martinfowler.com/articles/richardsonMaturityModel.html](https://martinfowler.com/articles/richardsonMaturityModel.html) | referência | Fowler: os níveis 0 a 3 do modelo de maturidade de Richardson. | 2 | 200 |
| [https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven](https://roy.gbiv.com/untangled/2008/rest-apis-must-be-hypertext-driven) | fonte primária (texto) | Fielding, 2008: sem hipermídia dirigindo o cliente, a API não é REST. Base da correção 5. | 2 | 200 |
| [https://www.rfc-editor.org/rfc/rfc9110.html](https://www.rfc-editor.org/rfc/rfc9110.html) | fonte primária (RFC) | Semântica do HTTP: métodos seguros e idempotentes, status, validadores (ETag, If-None-Match), Location. | 2 | 200 |
| [https://www.rfc-editor.org/rfc/rfc9112.html](https://www.rfc-editor.org/rfc/rfc9112.html) | fonte primária (RFC) | HTTP/1.1: formato da mensagem em texto, Content-Length, conexões persistentes. | 2 | 200 |
| [https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md) | especificação aberta | Standard Webhooks: assinatura com carimbo de tempo, id da mensagem, reenvio e janela de tolerância. | 3 | 200 |
| [https://html.spec.whatwg.org/multipage/server-sent-events.html](https://html.spec.whatwg.org/multipage/server-sent-events.html) | fonte primária (especificação) | Server-Sent Events: um só sentido, texto, reconexão automática com Last-Event-ID. | 3, 6 | 200 |
| [https://www.rfc-editor.org/rfc/rfc2104.html](https://www.rfc-editor.org/rfc/rfc2104.html) | fonte primária (RFC) | HMAC: a assinatura do webhook. | 3 | 200 |
| [https://www.rfc-editor.org/rfc/rfc6202.html](https://www.rfc-editor.org/rfc/rfc6202.html) | fonte primária (RFC) | Long polling e streaming em HTTP: as definições de short e long polling que o artigo não traz. | 3 | 200 |
| [https://pkg.go.dev/net/rpc](https://pkg.go.dev/net/rpc) | documentação | Pacote net/rpc do Go: gob, e o aviso de que está congelado. | 4 | 200 |
| [https://web.archive.org/web/2023/https://birrell.org/andrew/papers/ImplementingRPC.pdf](https://web.archive.org/web/2023/https://birrell.org/andrew/papers/ImplementingRPC.pdf) | fonte primária (paper) | Birrell e Nelson, 1984: a origem do RPC com stub e skeleton. Cópia no Internet Archive (ACM e Microsoft devolvem 403). | 4 | 200 |
| [https://www.jsonrpc.org/specification](https://www.jsonrpc.org/specification) | fonte primária (especificação) | JSON-RPC 2.0: formato de chamada e resposta em JSON. | 4 | 200 |
| [https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md) | fonte primária (protocolo) | O gRPC sobre HTTP/2: prefixo de 5 bytes, cabeçalhos, trailers, grpc-timeout. | 5 | 200 |
| [https://grpc.io/docs/guides/deadlines/](https://grpc.io/docs/guides/deadlines/) | documentação | Deadlines no gRPC: o prazo no contexto e DEADLINE_EXCEEDED. | 5 | 200 |
| [https://grpc.io/docs/what-is-grpc/core-concepts/](https://grpc.io/docs/what-is-grpc/core-concepts/) | documentação | Conceitos do gRPC: tipos de chamada, deadlines, status, metadados. | 5 | 200 |
| [https://protobuf.dev/programming-guides/encoding/](https://protobuf.dev/programming-guides/encoding/) | fonte primária (documentação) | Encoding do Protobuf: etiqueta, tipos de fio, varint. | 5 | 200 |
| [https://www.rfc-editor.org/rfc/rfc7541.html](https://www.rfc-editor.org/rfc/rfc7541.html) | fonte primária (RFC) | HPACK: a tabela dinâmica que encurta os cabeçalhos da 2ª chamada em diante. | 5 | 200 |
| [https://github.com/gorilla/websocket/tree/main/examples/chat](https://github.com/gorilla/websocket/tree/main/examples/chat) | referência (código) | Exemplo de chat do gorilla/websocket, base do servidor do lab. | 6 | 200 |
| [https://pkg.go.dev/github.com/gorilla/websocket](https://pkg.go.dev/github.com/gorilla/websocket) | documentação | gorilla/websocket: um escritor e um leitor por conexão. | 6 | 200 |
| [https://www.rfc-editor.org/rfc/rfc6455.html](https://www.rfc-editor.org/rfc/rfc6455.html) | fonte primária (RFC) | WebSocket: handshake com Sec-WebSocket-Key/Accept, quadros de 2 a 14 bytes de cabeçalho, ping/pong, close. | 6 | 200 |
| [https://github.com/graphql/dataloader](https://github.com/graphql/dataloader) | referência (código) | DataLoader: agrupa e guarda em cache as buscas do mesmo tick. | 7 | 200 |
| [https://graphql.org/learn/best-practices/](https://graphql.org/learn/best-practices/) | documentação | Boas práticas: cache, paginação, N+1. | 7 | 200 |
| [https://graphql.org/learn/schema/](https://graphql.org/learn/schema/) | documentação | Schema e tipos do GraphQL (SDL). | 7 | 200 |
| [https://spec.graphql.org/October2021/](https://spec.graphql.org/October2021/) | fonte primária (especificação) | Especificação do GraphQL, outubro de 2021. | 7 | 200 |
| [https://github.com/grpc-ecosystem/grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) | referência (código) | grpc-gateway: gera um servidor REST a partir do .proto. | 8 | 200 |
| [https://github.com/grpc/grpc-web](https://github.com/grpc/grpc-web) | referência (código) | gRPC-Web: o dialeto que o navegador consegue falar. | 8 | 200 |
| [https://www.cncf.io/blog/2022/02/11/integration-challenges-in-microservices-architecture-with-grpc-rest/](https://www.cncf.io/blog/2022/02/11/integration-challenges-in-microservices-architecture-with-grpc-rest/) | referência do artigo | CNCF: desafios de integrar gRPC e REST em microsserviços. | 8 | 200 |
| [https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_json_transcoder_filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/grpc_json_transcoder_filter) | documentação | Filtro gRPC-JSON transcoder do Envoy: traduz REST para gRPC. | 8 | 200 |
