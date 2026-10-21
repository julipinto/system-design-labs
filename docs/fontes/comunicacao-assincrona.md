# Fontes: Comunicação Assíncrona: Mensageria, Eventos e Streaming

Registro dos links de fonte do módulo 13, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Mensageria, Eventos, Streaming e Arquitetura Assincrona, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/mensageria-eventos-streaming/), publicado em 06/05/2024 e citado nas aulas 1 a 10.

**Aulas:** 1 Introdução · 2 Mensagens, eventos, comandos e documentos · 3 Conceitos de mensageria: FIFO, LIFO, DLQs e batches · 4 Streaming de dados · 5 Kafka e event-driven: produtores, consumidores, tópicos, partições e replicação · 6 Kafka: exemplo · 7 MQTT · 8 MQTT: exemplo · 9 AMQP · 10 AMQP: exemplo

**Código dos laboratórios:** os programas em Go (`queue/main.go`, `stack/main.go`, `kafka/producer`, `kafka/consumer_estoque`, `kafka/consumer_faturamento`, `kafka/partition_key`, `messages/mqtt/default`, `messages/rabbit-mq/default`, `topic` e `fanout`) foram lidos com `gh api` no repositório público de exemplos do autor, pasta `exemplos/protocolos-assincronos/`, e entram sem alteração, com os números de linha do arquivo, nas seções "Aprofundar" das aulas 3, 6, 8 e 10. O link citado ao leitor é o do repositório de código de exemplo do próprio artigo (`system-design-examples`), que não leva o nome de nenhum curso.

**Conferência feita em 2026-10-20** (curl com `-L` e `User-Agent: Mozilla/5.0`): os 31 links distintos citados nas aulas (nas Fontes e no texto da aula 5) deram 200; o do RabbitMQ Release Information e o KIP-679 também. Conferidos na própria documentação: `broker.session.timeout.ms` = 9000, `broker.heartbeat.interval.ms` = 2000, `replica.lag.time.max.ms` = 30000, `controller.quorum.election.timeout.ms` = 1000, `controller.quorum.fetch.timeout.ms` = 2000, `num.partitions` = 1 e `unclean.leader.election.enable` = false (documentação de configuração do broker, série 4.0); `acks`, `batch.size` (bytes, 16384), `linger.ms` (5 desde o 4.0) e `delivery.timeout.ms` (120000) no produtor; `max_queued_messages` = 1000 no Mosquitto; a série 3.13 do RabbitMQ com fim do suporte da comunidade em 30/09/2024 e a série atual 4.4 (página Release Information).

## Fontes citadas nas aulas

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis sobre mensageria, eventos e streaming](https://fidelissauro.dev/mensageria-eventos-streaming/) | artigo base | Base do módulo: mensagens e eventos, FIFO e LIFO, DLQ, batch, streaming, Kafka, MQTT e AMQP. As 10 aulas seguem a ordem dele, com 11 correções registradas abaixo e nos Aprofundar. | 1–10 | 200 |
| [Martin Fowler: What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html) | fonte primária (artigo) | Event notification, event-carried state transfer, event sourcing e CQRS como coisas separadas. | 1, 2 | 200 |
| [Enterprise Integration Patterns: padrões de mensageria](https://www.enterpriseintegrationpatterns.com/patterns/messaging/) | fonte primária (catálogo) | Command Message, Document Message, Event Message. O livro (Hohpe e Woolf, 2003) não tem link; cita-se autor, título e ano. | 1, 2 | 200 |
| [Enterprise Integration Patterns: Dead Letter Channel](https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html) | fonte primária | O padrão da DLQ. | 3 | 200 |
| [Akka: Message Driven vs Event Driven](https://developer.lightbend.com/docs/akka-guide/concepts/message-driven-event-driven.html) | referência do artigo | Mensagem com destinatário contra evento sem destinatário. | 1, 2 | 200 |
| [Documentação do Apache Kafka](https://kafka.apache.org/documentation/) | documentação | Design, replicação, retenção, offsets de consumo, `kafka-topics` e `kafka-consumer-groups`. | 1, 4, 5, 6 | 200 |
| [Apache Kafka 4.0: configurações do produtor](https://kafka.apache.org/40/generated/producer_config.html) | documentação | `acks`, `batch.size` em bytes (16384), `linger.ms` (padrão 5 desde o 4.0), `enable.idempotence`, `delivery.timeout.ms`. | 3, 5 | 200 |
| [Apache Kafka 4.0: configurações do broker](https://kafka.apache.org/40/generated/kafka_config.html) | documentação | `broker.session.timeout.ms` (9000), heartbeat de 2000, `replica.lag.time.max.ms` (30000), eleição do quórum do KRaft, `num.partitions`. Base do "até cerca de 9 s" de eleição de líder (conta de exemplo, e não medição). | 5 | 200 |
| [KIP-480: Sticky Partitioner](https://cwiki.apache.org/confluence/display/KAFKA/KIP-480%3A+Sticky+Partitioner) | fonte primária | Partição sticky sem chave desde o Kafka 2.4. | 5 | 200 |
| [KIP-500: Replace ZooKeeper with a Self-Managed Metadata Quorum](https://cwiki.apache.org/confluence/display/KAFKA/KIP-500%3A+Replace+ZooKeeper+with+a+Self-Managed+Metadata+Quorum) | fonte primária | O KRaft e a remoção do ZooKeeper. | 5 | 200 |
| [KIP-679: Producer will enable the strongest delivery guarantee by default](https://cwiki.apache.org/confluence/display/KAFKA/KIP-679%3A+Producer+will+enable+the+strongest+delivery+guarantee+by+default) | fonte primária | `acks=all` e idempotência por padrão desde o Kafka 3.0 (citado no brief; conferido, não aparece como link nas aulas). | 5 | 200 |
| [Jay Kreps: The Log](https://www.linkedin.com/pulse/log-what-every-software-engineer-should-know-about-real-time-datas-jay-kreps) | fonte primária (artigo, 2013) | O log como abstração central; o endereço antigo em `engineering.linkedin.com` dá 404 e não foi usado. O paper do Kafka (Kreps, Narkhede e Rao, NetDB 2011) não tem link verificável; cita-se autor, título e ano. | 4 | 200 |
| [IBM/sarama](https://pkg.go.dev/github.com/IBM/sarama) | documentação | Cliente Kafka em Go do laboratório. O `NewHashPartitioner` usa FNV-1a (conferido em `partitioner.go`, que o brief aponta). | 6 | 200 |
| [Repositório do autor: exemplos Kafka](https://github.com/msfidelis/system-design-examples/tree/main/kafka) | código público | `producer`, `consumer_estoque`, `consumer_faturamento` e `partition_key`. | 6 | 200 |
| [Repositório do autor: exemplos de mensageria](https://github.com/msfidelis/system-design-examples/tree/main/messages) | código público | Pasta pai de MQTT e RabbitMQ. | 8 | 200 |
| [MQTT 3.1.1 (OASIS)](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) | fonte primária (especificação) | `PUBLISH`, QoS, retain, will, keep alive, sessão limpa e persistente. | 7, 8 | 200 |
| [MQTT 5.0 (OASIS)](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) | fonte primária (especificação) | Assinaturas compartilhadas (`$share/grupo/filtro`). | 7 | 200 |
| [mqtt.org](https://mqtt.org/) | referência do artigo | Visão geral do protocolo. | 7 | 200 |
| [Eclipse Mosquitto: mosquitto.conf](https://mosquitto.org/man/mosquitto-conf-5.html) | documentação | `max_queued_messages` = 1000 por cliente (QoS 1 e 2), `listener`, `allow_anonymous`, `persistence`. | 7, 8 | 200 |
| [Eclipse Paho MQTT Go client](https://pkg.go.dev/github.com/eclipse/paho.mqtt.golang) | referência do artigo | Cliente do laboratório (v1.4.3, MQTT 3.1.1). | 8 | 200 |
| [RabbitMQ: AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts) | fonte primária | Exchange, binding, fila, canais, default exchange. | 9 | 200 |
| [RabbitMQ: confirmações do consumidor e do publicador](https://www.rabbitmq.com/docs/confirms) | documentação | `ack`, `nack`, `prefetch`, publisher confirms. | 9 | 200 |
| [RabbitMQ: Dead Letter Exchanges](https://www.rabbitmq.com/docs/dlx) | documentação | DLX: mensagem rejeitada, vencida ou que estoura o limite. | 3, 9 | 200 |
| [RabbitMQ: Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues) | documentação | Filas replicadas com Raft. | 9 | 200 |
| [RabbitMQ 4.0: AMQP 1.0 nativo](https://www.rabbitmq.com/blog/2024/08/05/native-amqp) | fonte primária (blog) | O AMQP 1.0 é outro protocolo, nativo no 4.0. | 9 | 200 |
| [amqp.org](https://www.amqp.org/) | referência do artigo | Página do protocolo. | 9 | 200 |
| [Repositório do autor: exemplos RabbitMQ](https://github.com/msfidelis/system-design-examples/tree/main/messages/rabbit-mq) | código público | `default`, `topic` e `fanout`. | 10 | 200 |
| [rabbitmq/amqp091-go](https://github.com/rabbitmq/amqp091-go) | documentação | Substituto do `streadway/amqp`, arquivado. | 10 | 200 |
| [RabbitMQ: tutoriais](https://www.rabbitmq.com/tutorials) | documentação | Work queues, publish/subscribe, topics. | 10 | 200 |
| [RabbitMQ: Release Information](https://www.rabbitmq.com/release-information) | documentação | Séries com suporte: a 3.13 acabou a comunidade em 30/09/2024; a atual é a 4.4. | 10 | 200 |
| [RabbitMQ: confiabilidade](https://www.rabbitmq.com/docs/reliability) | documentação | Confirmações, persistência e o que protege de reinício. | 10 | 200 |

## Outras Referências do artigo (testadas, não citadas nas Fontes)

| Fonte | Status | Observação |
|---|---|---|
| [Kafka - Architecture (kafka.apache.org/10/...)](https://kafka.apache.org/10/documentation/streams/architecture) | 200 | É da documentação 1.0 e de Kafka Streams, não do broker. Trocada pela documentação atual. |
| [How Much Data Does Streaming Netflix Use?](https://www.buckeyebroadband.com/support/internet/how-much-data-does-streaming-netflix-use) | 200 | Sem relação técnica com o tema. |
| [O que é MQTT? (AWS)](https://aws.amazon.com/pt/what-is/mqtt/) · [Arquitetura do agente MQTT (Google Cloud)](https://cloud.google.com/architecture/connected-devices/mqtt-broker-architecture?hl=pt-br) | 200 | Introduções ao MQTT; a especificação OASIS cobre o que a aula usa. |
| [Advanced Message Queuing Protocol (Wikipédia)](https://pt.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol) · [What is AMQP (CloudAMQP)](https://www.cloudamqp.com/blog/what-is-amqp-and-why-is-it-used-in-rabbitmq.html) · [RabbitMQ Exchange Type (Hevo)](https://hevodata.com/learn/rabbitmq-exchange-type/) | 200 | Textos de apoio; a aula 9 usa a documentação do RabbitMQ. |
| [Kafka 10 essential terms (Red Hat)](https://www.redhat.com/en/blog/apache-kafka-10-essential-terms-and-concepts-explained) · [linger.ms and batch.size (GeeksforGeeks)](https://www.geeksforgeeks.org/apache-kafka-linger-ms-and-batch-size/) | 200 | Apoio; o `batch.size` em bytes foi conferido na documentação do produtor. |
| [Enqueue and Dequeue (Oracle)](https://docs.oracle.com/cd/E19253-01/820-0446/chp-sched-10/index.html) · [Amazon SQS](https://aws.amazon.com/pt/sqs/getting-started/) · [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) · [R2DBC](https://r2dbc.io/) | 200 | Exemplos periféricos do artigo. |
| Medium (Kafka Basics; Events vs Messages; AMQP Propriedades de Mensagem; R2DBC Oracle) · Baeldung R2DBC | 403 | Bloqueiam acesso automatizado. |
| [Conhecendo o MQTT (Mercato)](https://www.mercatoautomacao.com.br/blogs/novidades/conhecendo-o-mqtt) | 406 | Recusa o acesso automatizado. |
| Livros na Amazon (Criando Microsserviços; Software Architecture: The Hard Parts, edição em inglês e em português) | 200 / 500 / 500 | Dois links da Amazon devolveram 500 para robôs; os livros existem. |

## Correções ao artigo e ao brief

Registradas também no "Aprofundar" de cada aula.

1. **Aula 5. `acks`.** O artigo fala em "volume de ACKs"; no Kafka os valores são `0`, `1` e `all`, e o `all` só protege junto com `min.insync.replicas`. O exemplo dele usa `"acks": "1"` com o comentário "garantir durabilidade": `1` não dá essa garantia (cenário do `acks=1` com o líder que cai em 5 ms).
2. **Aulas 3 e 5. `batch.size`.** É em bytes (padrão 16 KiB no cliente Java; o `librdkafka` tem também `batch.num.messages`); o artigo trata como "1 item por vez" e "batch de 1000 eventos". Para "1 evento por envio" o certo é `linger.ms = 0`.
3. **Aula 5. Balanceador na frente do Kafka.** O cliente conecta direto no líder de cada partição (`advertised.listeners`); um balanceador de camada 4 costuma quebrar isso. O recomendado é uma lista de `bootstrap.servers`. "Todos os brokers recebem qualquer evento" só vale para o primeiro contato.
4. **Aula 5. Partição "aleatória" sem chave.** Desde o Kafka 2.4 (KIP-480) o cliente Java usa partição sticky; no `librdkafka`, o particionador padrão é `consistent_random`.
5. **Aula 5. O que falta no Kafka do artigo.** Offsets e commit, retenção e compactação, ISR e `min.insync.replicas`, rebalance, semântica de entrega, KRaft (ZooKeeper removido no 4.0) e ausência de DLQ nativa; o consumidor do exemplo confirma a cada mensagem e para no primeiro erro.
6. **Aula 7. MQTT.** "Garante a entrega mesmo em redes instáveis" e "sem duplicidade" são do TCP; o MQTT tem QoS 0, 1 e 2 (o 1 pode duplicar). O tópico não guarda mensagens (só a última retida e as sessões persistentes). O artigo não cita `+`, `#`, retida, Last Will, keep-alive nem sessão. A assinatura compartilhada é do MQTT 5.0.
7. **Aula 9. AMQP.** O modelo descrito é o 0-9-1; o AMQP 1.0 é outro protocolo, sem exchanges. Os canais são virtuais e dividem uma conexão TCP. Routing key (do produtor) e binding key (da ligação) são coisas diferentes. Faltam default exchange, publisher confirms, prefetch, DLX e quorum queues.
8. **Aula 2. Eventos × mensagens.** Mistura o tipo da mensagem com o transporte; Fowler separa event notification, event-carried state transfer, event sourcing e CQRS.
9. **Aula 3. LIFO "em mensageria".** Brokers são FIFO ou sem ordem; a pilha é estrutura de dados. A ordem do Kafka é por partição; a do RabbitMQ se perde com vários consumidores; a do SQS padrão não existe.
10. **Referências do artigo.** O link `kafka.apache.org/10/...` é da documentação 1.0 e de Streams; "How Much Data Does Streaming Netflix Use?" não tem relação técnica.
11. **Labs.** Kafka: tópico com 1 partição, fator 1, `setup.sh` com `consumer.go` inexistente, comentário de 50 mensagens com laço de 15.000, FNV-1a contra murmur2. MQTT: README contra código, compose só com o broker, porta 9001 sem listener, cliente em 3.1.1, `clientID` que muda. RabbitMQ: `streadway/amqp` arquivado, laço de 3 bilhões, `Ack(true)`, sem persistência nem prefetch, imagem `3-management` fora do suporte.

### Correções ao brief (conferidas contra o código real do laboratório)

12. **Fanout do RabbitMQ publica 1.000 mensagens, e não 10.** O brief diz "10 mensagens, cada uma das 3 filas recebe as 10"; o `fanout/producer.go` tem `for i := 0; i < 1000; i++`. A aula 10 usa 1.000.
13. **Dois laboratórios com o mesmo nome de exchange e tipos diferentes.** `default/` e `fanout/` declaram `ecommerce.nova.venda` (direct e fanout): rodar os dois no mesmo broker falha na declaração. Divergência nova, que o brief não tinha.
14. **Tamanho dos 4 eventos do 1051.** Com o JSON compacto das aulas (`evento_id`, `tipo` e os campos do brief), os eventos têm 151 + 72 + 89 + 88 = **400 B**, e não ~413 B; o `PedidoPago` bate com os 72 B do brief. A aula 1 e o quiz não citam os 413; a figura deve usar 400 B.
15. **Horários do 1051 e o webhook atrasado.** A tabela de eventos usa o tempo do evento (14:20:03). O "chegou ao tópico às 14:21:05" da aula 4 é apresentado como um dia em que o webhook atrasou, para não contradizer o `EstoqueReservado` das 14:20:03.040.
16. **Eleição de líder do Kafka.** O brief deixava o número pendente. Usado "até cerca de 9 s", calculado de `broker.session.timeout.ms` = 9000 (heartbeat de 2000) da documentação 4.0 e avisado como conta de exemplo; no desligamento controlado a pausa é bem menor.
17. **Laboratório MQTT: o produtor espera 3 s antes de publicar** (`time.Sleep(3 * time.Second)`, linha 39, com o comentário "garantir que o consumer está pronto"). Não está na aula, só no código mostrado.
