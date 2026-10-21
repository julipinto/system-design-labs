# Blueprint do módulo 13: Comunicação Assíncrona: Mensageria, Eventos e Streaming

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim. Brief: `docs/escrita/comunicacao-assincrona-brief.md`.

## Fio condutor do módulo
O `PedidoPago` do Davi precisa chegar a três serviços sem atrasar o pagamento nem cair com eles; para avisar sem esperar, sem perder o aviso e sem o produtor saber quem escuta, o módulo vai do que viaja (comando, evento, documento) até o protocolo certo de cada trecho: Kafka entre serviços, MQTT para o caminhão e AMQP para os e-mails.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução | Três chamadas em fila custam +130 ms e derrubam o pedido se as `entregas` caírem; publicar 1 evento custa cerca de 10 ms e o aviso espera no broker. | O que viaja no tópico: ordem, fato ou dados? |
| 2 | Mensagens, eventos, comandos e documentos | Comando manda fazer (imperativo, 1 destinatário), evento conta um fato (passado, ninguém é obrigado a ouvir), documento entrega dados; comando em tópico com vários grupos duplica a ação (40 → 38 → 36). | Como essas mensagens esperam: fila, pilha, cópia, DLQ? |
| 3 | Conceitos de mensageria | FIFO entrega 1049, 1050, 1051 na ordem, LIFO serve ao desfazer, fanout copia e a DLQ tira a mensagem ruim do caminho; lote no envio troca atraso por vazão (8 eventos, 8× menos requisições). | E se a mensagem não for apagada na leitura, e o `antifraude` quiser os eventos do dia? |
| 4 | Streaming de dados | O stream é um log que guarda (7 dias): grupo novo relê do offset 0, o total do dia fica vivo, e a janela tem de usar o tempo do evento, com tolerância a atraso. | Como o Kafka divide e protege esse log para vários grupos? |
| 5 | Kafka e event-driven | A chave decide a partição (1051 → p0, em ordem), cada grupo tem o seu offset, o máximo de consumidores é o de partições, `acks=1` perde o `PedidoPago` em 5 ms e 3 → 6 partições quebra a ordem. | O que acontece quando se sobe o Kafka de verdade? |
| 6 | Kafka: exemplo | O laboratório prova a chave, os grupos e o lag, e não a replicação (1 broker, fator 1); FNV-1a e murmur2 mandam o 1051 para partições diferentes; o auto-commit repete cerca de 10 eventos. | Que protocolo serve a um dispositivo pequeno numa rede ruim? |
| 7 | MQTT | O `caminhao-17` publica 77 B por 4G; QoS 0, 1 e 2 pagam garantias diferentes, a retida e o Last Will cobrem o que o tópico não guarda, e 3 minutos sem sinal são 36 posições. | O que o laboratório faz com as mensagens quando o consumidor sobe depois? |
| 8 | MQTT: exemplo | A sessão limpa do laboratório esquece o que passou com o consumidor fora; a persistente pede `clientID` fixo e tem fila de 1.000. | Como separar o e-mail urgente do volume, e quem decide a fila? |
| 9 | AMQP | O broker roteia por exchange e binding, e filas separadas tiram o e-mail da Lena de 8 min 20 s para menos de 1 s; um binding com erro de digitação descarta em silêncio. | O que os laboratórios do autor deixam de fazer? |
| 10 | AMQP: exemplo | Os três laboratórios mostram direct, topic e fanout, mas sem mensagem persistente, `prefetch` nem confirms; o consumidor que cai antes do ack duplica o e-mail. | Quanto tempo leva de verdade, para quantos, e onde está o gargalo? (módulo 14) |

## Decisões
1. **Uma figura por aula, no máximo.** A1 `kafka mode=topico` (o brief manda reaproveitar), A2 sem figura, A3 `fila mode=fifo` (o "Faça agora" manda apertar o botão da `dlq`), A4 `kafka mode=topico`, A5 `kafka mode=chave` (o "Faça agora" manda usar os botões `grupos`, `replicas` e `particoes`), A6 `kafka mode=lab`, A7 `fila mode=mqtt`, A8 `fila mode=mqtt` (com os dados do lab), A9 `fila mode=exchange`, A10 `fila mode=lab-amqp`. Os marcadores são `{/* FIG:<nome> mode=<x> */}`; os nomes dos botões nos "Faça agora" são genéricos e o maestro os alinha com a figura.
2. **O 1051 é o caso principal; o 1050 só abre a aula 1 e o 1048 volta no caminhão (aulas 7 e 8).** Os eventos e-901 a e-904 e os offsets 48210, 48213, 48217 e 48301 aparecem nas aulas 4 e 5.
3. **O webhook atrasado da aula 4 é uma variação.** A tabela do brief usa o tempo do evento; a chegada às 14:21:05 é apresentada como "num dia em que o webhook atrasou", para não contradizer o `EstoqueReservado` das 14:20:03.040.
4. **Código real só nas aulas 3, 6, 8 e 10**, em `<pre>` dentro do Aprofundar, com os números das linhas do arquivo; nas aulas 6 e 10 são trechos. As divergências do laboratório ficam em listas numeradas no corpo da aula (6, 6 e 9 itens), porque são o que a Juliana precisa saber antes de rodar.
5. **Widgets onde o brief manda:** `particao`, `acks` e `lag` na aula 5 (cada um junto da seção que ele ilustra), `qos` na aula 7 e `emails` na aula 9.
6. **Correções ao artigo** ficam no Aprofundar da aula a que pertencem e no resumo de `docs/fontes/comunicacao-assincrona.md`; as correções ao próprio brief (fanout de 1.000 mensagens, 400 B dos eventos, exchange repetida) ficam só no registro de fontes e no relatório.
7. **Eleição de líder:** a aula 5 diz "até cerca de 9 s" como conta de exemplo com os padrões da série 4.0 (`broker.session.timeout.ms` = 9000), avisando que o número real depende do cluster.
8. **Vocabulário fixo** do brief: mensagem, comando, evento, documento, fila, tópico, FIFO, LIFO, DLQ, lote, streaming, log, offset, partição, chave, grupo de consumo, lag, broker, líder, ISR, `acks`, QoS, retida, Last Will, exchange, binding, routing key, ack. Nenhuma marca de provedor.
