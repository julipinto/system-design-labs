# Judge: Comunicação Assíncrona (módulo 13)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com quiz, glossário, widgets e brief), seguindo ESCRITA.md e a skill writing-prose-like-a-human. As figuras ainda não existem: a conferência com elas fica para quando o Opus as entregar (dados do brief, abaixo).

## Voz de IA
- Busca em MDX, glossário, quiz e widgets por "crucial", "fundamental", "vale ressaltar", "vale lembrar", "além disso", "ademais", "em suma", "nesse sentido", "robusto", "alavancar", "ecossistema": zero ocorrências.
- "Não é só X, é Y" e "não apenas": zero. Os contrastes que sobraram são de fato (comando contra evento, tipo contra transporte, fila contra log).
- Travessões e meias-riscas: zero em todos os arquivos do módulo (os `—` e `–` do código do laboratório não existem; os trechos entram sem alteração).
- Nenhuma seção termina resumindo o que acabou de ser dito. Os "E se der errado" terminam no dado (2.400 por minuto, 36 posições, 500 s).
- Dois pontos de atenção corrigidos na leitura: "Falta guardar tudo isso" (aula 5) virou "Para os eventos sobreviverem a uma queda"; "tópico com nome de curso" (gancho da aula 7) foi retirado, porque citaria o curso.

## Encadeamento
- Todas as aulas abrem com `p.ponte` e fecham com `p.gancho` contendo "Falta saber…": 1→2 (o que viaja no tópico), 2→3 (como a mensagem espera), 3→4 (a mensagem que fica depois de lida), 4→5 (como o Kafka divide e protege o log), 5→6 (o Kafka de verdade), 6→7 (dispositivo pequeno em rede ruim), 7→8 (o código do MQTT e a sessão), 8→9 (separar o e-mail urgente do volume), 9→10 (o que os laboratórios deixam de fazer), 10→módulo 14 (medir: p50, p95, p99, vazão e saturação).
- A aula 1 liga com o fim do módulo 12 pelo gancho que o brief do módulo 12 descreve: o `PedidoPago` do pedido 1050 do Davi precisa chegar a `estoque`, `entregas` e `notificacoes`, e três chamadas em fila atrasam e fragilizam o pagamento.
- Vocabulário fixo do brief repetido sem sinônimos soltos (mensagem, comando, evento, documento, fila, tópico, partição, grupo de consumo, lag, líder, ISR, `acks`, QoS, retida, Last Will, exchange, binding, routing key, ack). Nenhuma marca de provedor; "repositório público do autor" no lugar do curso.

## Listas e formato
- Listas de "Como funciona" com no máximo 5 itens, encadeadas pela ordem em que as coisas acontecem. As divergências dos laboratórios foram reagrupadas para respeitar o limite: 5 itens na aula 6, 5 na aula 8 e 5 + 4 na aula 10 (duas listas, com uma frase de abertura cada).
- "Por que importa" com 4 itens em todas as aulas; 3 a 6 links por aula nas Fontes (todos 200 em 20/10/2026); 5 flashcards (6 na aula 5).
- O "Faça agora" é genérico: aponta o cenário e os botões da figura sem citar rótulos finais, para o maestro alinhar.

## Consistência de números (texto, quiz, glossário, widgets; a figura segue o brief)
- Pedido **1051** (Lena): 2 canecas 39.80 + frete 15.00 = 54.80; eventos e-901 a e-904 em p0 @ 48210, 48213, 48217 e 48301; estoque da caneca 40 → 38 (e 36 com o comando duplicado).
- Cadeia síncrona **20 + 100 + 10 = 130 ms**; publicação ~10 ms com `acks=all`. Tópico `pedidos`: 3 partições, fator 3, `min.insync.replicas = 2`, retenção 7 dias; brokers `kafka-1..3`.
- `murmur2` calculado e conferido contra os vetores do Kafka: 3 partições: 1047 → p1, 1048 → p2, 1049 → p0, 1050 → p2, 1051 → p0; 6 partições: p4, p2, p3, p2, p3. O widget `particao` usa a mesma função (a tabela da aula 5 repete os valores assinados). FNV-1a do sarama: 1051 → p2, 1049 → p2, 1050 → p0.
- Lag da p0: LOG-END 48220; `estoque` 0, `notificacoes` 1, `entregas` 10. `entregas`: 30 eventos/s ÷ 3 = 10/s = 1000 ÷ 100: o widget `lag` abre com esses valores e responde "no limite".
- `acks`: líder cai em 5 ms, cópia em 10 ms; o widget `acks` abre em `acks=all` com `min.insync.replicas = 2`, ISR 3 e queda em 5 ms (não confirmado, o produtor repete) e dá "evento perdido" com `acks=1` ou `0`.
- Volumes: 20 e 120 eventos/s; 40/s por partição; lote de 8 com `linger.ms = 200` (5 envios/s por partição, 15 contra 120, 8×); 2.400 por minuto de fila atrás da mensagem ruim.
- MQTT: tópico de 33 B, payload de 38 B, `PUBLISH` de 77 B (75 B em QoS 0), `PUBACK` de 4 B, `CONNECT` de 25 B, POST HTTP ~234 B, keep-alive 60 s e 90 s para o Last Will, 36 posições em 3 minutos, 40 mensagens/s (20 por réplica), 600 contra 1.000 e 1.200 mensagens guardadas. O widget `qos` confere os bytes (158 B com o `PUBLISH` perdido em QoS 1; 162 B com o `PUBACK` perdido).
- AMQP: 50.000 ÷ 100 = 500 s = 8 min 20 s contra menos de 1 s; o widget `emails` abre com esses valores.
- Quiz: 63 perguntas (5 a 10 por aula), com contas conferidas uma a uma contra o texto.

## Pontos em que o texto diverge do brief (decididos pelos dados reais)
- **Fanout do RabbitMQ publica 1.000 mensagens** (`i < 1000`); o brief dizia 10. O texto usa 1.000.
- **400 B** em vez de ~413 B para os 4 eventos em JSON compacto; o `PedidoPago` de 72 B bate.
- **Duas divergências a mais** nos laboratórios: exchange `ecommerce.nova.venda` declarada como direct e como fanout em pastas diferentes; produtor MQTT que espera 3 s antes de publicar.
- **Webhook atrasado da aula 4** apresentado como variação (14:21:05), para não contradizer o `EstoqueReservado` das 14:20:03.040.
- **Eleição de líder:** "até cerca de 9 s", conta de exemplo com `broker.session.timeout.ms` = 9000 e heartbeat de 2000 (documentação 4.0), avisada como exemplo.

## Pendências
- Figuras `kafka-3d` e `fila-3d` (marcadores no MDX): alinhar os rótulos dos botões citados nos "Faça agora" e usar 400 B e o fanout de 1.000 mensagens.
- Pôster da home: o card usa provisoriamente a prévia do módulo 11 (`estoque-3d-previa.webp`); trocar quando houver `kafka-3d-previa.webp`.
