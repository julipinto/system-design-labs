# Blueprint: Comunicação Síncrona (Architect)

**Fio condutor (1 frase):** quando um serviço chama outro e espera, a mesma chamada do pedido 1050 do Davi muda de formato e de protocolo (REST, RPC, gRPC, WebSocket, GraphQL), e cada mudança resolve um problema da anterior, até a loja escolher um protocolo por salto.

**Método:** Architect (fio e tese por aula) → Carpenter (ponte na abertura, frase-tópico, gancho no fim) → Judge (`comunicacao-sincrona-judge.md`). Seguiu ESCRITA.md e a skill `writing-prose-like-a-human`; a Juliana revisa depois, então as decisões ficam registradas aqui.

| Aula | Tese (1 frase) | Pergunta que deixa para a próxima |
|---|---|---|
| 1 Introdução | Chamar e esperar é simples, mas a latência soma e a disponibilidade multiplica (0,999³ = 99,70%, 129 min/mês), e um timeout não prova que a outra ponta não fez. | Como é essa chamada em bytes quando é REST sobre HTTP? |
| 2 HTTP e REST | O pedido do Davi são 360 bytes de texto, com método e status que dizem o que cada chamada garante, e o POST repetido duplica o pedido. | Como a tela sabe do Pix sem a loja ter uma conexão esperando? |
| 3 Webhooks, short e long polling | Perguntar custa 2.500 req/s, segurar custa 5.000 conexões e ser avisado custa um contrato (HMAC, 200 rápido, duplicidade, ordem). | Dá para chamar uma função de outra máquina sem escrever verbo, caminho e JSON? |
| 4 RPC | RPC é um modelo (stub e skeleton) que esconde a rede, e o `net/rpc` do lab fica sem contrato e sem prazo. | Como um RPC ganha contrato, bytes enxutos e prazo? |
| 5 gRPC e Protobufs | O `.proto` e o varint trocam 53 B por 11 B, o HTTP/2 divide uma conexão e a medição real dá 229 B e 103 B contra 360 B (3,5×); LB de camada 4 e campo reusado são as falhas. | Como o servidor empurra sem ser perguntado? |
| 6 WebSockets | O `101` vira a conexão em canal nos dois sentidos (58 B por posição), e conexão aberta é estado: mutex, um escritor, reconexão com jitter. | Como o cliente pede só os campos de que precisa numa chamada? |
| 7 GraphQL | O cliente escolhe os campos numa consulta de 131 B, e o servidor passa a se defender de N+1, custo, cache e erro com 200. | Onde pôr cada protocolo na loja inteira? |
| 8 Convergências | REST por fora, gRPC por dentro, WebSocket para rastrear, webhook com o PSP e GraphQL quando o cliente precisa de formas; o contrato precisa de dono. | Como avisar três serviços do PedidoPago sem esperar nenhum? (módulo 13) |

## Decisões
- **Ponte do módulo 11:** o gancho usado é o que o brief do módulo 11 descreve para a última aula ("cobre 94.90 do pedido 1049", por uma conexão, num formato, com um número de bytes), seguido da virada para o Davi e o pedido 1050. O texto do módulo 11 ainda estava em outro worktree; conferir a frase quando ele entrar.
- **Uma figura por aula** (regras.md), mesmo onde o brief lista várias: aula 3 só `espera curto` (os modes `longo`, `webhook` e `comparar` ficam no painel) e aula 5 só `chamada grpc` (o mode `proto` fica no painel).
- **Bytes do gRPC medidos**, não calculados: 229 B (1ª) e 103 B (2ª em diante), 3,5×. Brief, aula, widget, glossário e quiz usam esses números.
- **Código do lab em `<pre>`** via `src/components/CodeLab.astro` e `src/lab-code/comunicacao-sincrona/*` (import `?raw`), com os números de linha do arquivo original, sem alteração. Evita o problema das crases do Go dentro de template literal.
- **Widgets (5):** disponibilidade em série (aula 1), perguntar × segurar × ser avisado e assinatura do webhook (aula 3), bytes do pedido (aula 5) e N+1 (aula 7).
- **Quiz de 51 perguntas** (6, 7, 8, 6, 9, 6, 5 e 4 por aula, na ordem das aulas).
