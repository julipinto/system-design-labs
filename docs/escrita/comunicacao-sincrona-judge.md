# Judge: Comunicação Síncrona

Passes feitos nas 8 aulas (`src/content/comunicacao-sincrona/`), seguindo ESCRITA.md e o blueprint.

## 1. Fio e encadeamento
- Primeira e última frase de cada aula contam a história: 1 (cobrança que ninguém sabe se foi criada) → 2 (bytes e métodos; POST repetido) → 3 (como a tela sabe do Pix) → 4 (chamar função remota) → 5 (contrato, Protobuf, gRPC) → 6 (servidor empurra) → 7 (cliente escolhe os campos) → 8 (qual protocolo onde) → módulo 13. Cada ponte retoma o problema aberto na aula anterior e cada "Falta saber…" aponta a pergunta da seguinte.
- A ponte da aula 1 usa o gancho do brief do módulo 11 (pedido 1049, "cobre 94.90").
- Listas de "Como funciona" e de "E se der errado" seguem a ordem em que as coisas acontecem.

## 2. Voz de IA
- Busca por "além disso", "crucial", "vale ressaltar", "em suma", "fundamental", "ademais", "não é só X, é Y": nenhuma ocorrência.
- Travessões: só as setas de `PSP —webhook→` e `—long polling→` na aula 3 (2 usos).
- Corrigido durante a revisão: "Standard Webhooks … recomendam" ficou como "as especificações abertas recomendam um carimbo de tempo mais o HMAC"; "O Go acaba parando" virou "pode parar" (o `concurrent map writes` é probabilístico); `Standard Webhooks` e SSE aparecem só no Aprofundar.
- "WhyItMatters" da aula 1 tinha uma frase longa com cinco protocolos: mantida porque é a lista do módulo.

## 3. Consistência de números (aulas, widgets, glossário, quiz, brief)
| Número | Valor | Conferido |
|---|---|---|
| Pedido 1050 | 19.90 + 9.00 = 28.90 (2890 centavos), Pix, `c-7731` | aulas, widget, quiz |
| Cadeia | 5 + 20 + 5 + 180 = 210 ms | aula 1, quiz |
| Série | 99,70% e 129 min; 4 saltos 99,60% e 173 min | aula 1, widget (`pct`), quiz |
| REST | 157 + 53 = 210 B; 106 + 44 = 150 B; 360 B | aula 2, 5, widget, quiz (contados por script) |
| Short polling | 12 requisições, 11 inúteis, 0,6 s; 2.500 req/s, 5 vCPU | aula 3, widget, quiz |
| Long polling | 500 req/s, ~50 ms, 5.000 conexões, corte aos 15 s | aula 3, widget, quiz |
| Webhook | 112 B, HMAC `068149…e13a` (recalculado), 200 em ~30 ms, janela 5 min | aula 3, widget |
| Protobuf | 11 B contra 53 B (4,8×); resposta 18 B contra 44 B | aula 5, widget, quiz |
| gRPC medido | 229 B e 103 B; 360 ÷ 103 = 3,5× | aula 5, widget, glossário, quiz, brief |
| WebSocket | 56 + 2 = 58 B; 62 B; 317 B; ~11,6 KB/s contra ~63 KB/s; 33 reconexões/s | aula 6, quiz |
| GraphQL | 131 B (contado); 21 → 2; 100.000 nós | aula 7, widget, quiz |

## 4. Exatidão técnica (pontos que exigiram cuidado)
- Os 204/95 B do brief estavam errados; a medição com grpc-go v1.62.1 deu 229/103 B. Registrado no brief, na aula 5, em `docs/fontes/comunicacao-sincrona.md` e no código em `docs/escrita/comunicacao-sincrona-medida-grpc/`.
- Brief diz `grpc-timeout: 1S`; o real é microssegundos restantes (`996250u`).
- Linhas de código citadas (`rpc-server.go` 27, 29 e 41; `books-handlers.go` 126; `chat-server.go` 12, 17, 40, 44, 49, 58, 73 a 75; `grpc-server.go` 39; `grpc-client.go` 21) conferidas contra os arquivos copiados.
- Dois links (Waldo e Birrell/Nelson) davam 403 e 404; as aulas citam cópias do Internet Archive (200).
- Claim não verificada por execução: o fatal `concurrent map writes` do chat e o 500 do POST com ISBN repetido vêm da leitura do código (chave `UNIQUE` em `database.go`, `err != nil` → 500), sem rodar o lab.

## 5. Pendências de escrita
- Conferir a ponte da aula 1 com o texto final do módulo 11.
- "Faça agora" genéricos até as figuras `chamada-3d` e `espera-3d` existirem; reler contra os passos reais delas.
