# Labs executados de verdade (21/10/2026)

Cinco laboratórios do repositório público de exemplos do autor foram rodados em Docker 29.9.1 (WSL2), um de cada vez, com `docker compose down -v` e `docker ps` limpo ao fim de cada um. O clone ficou em `/tmp/claude-labs/repo`, fora do worktree. A saída completa de cada um está em `public/labs/<slug>/lab/<lab>-saida.txt`.

Ajustes comuns, todos só no clone:
- Go não está instalado no WSL. Os programas foram compilados com a imagem `golang` (1.21-alpine; 1.25-alpine para o `partition_key`) e rodados numa imagem `alpine` na rede do compose, com o endereço do broker trocado de `localhost` para o nome do serviço.
- Outros containers da máquina (adminer, https-portal) já ocupavam as portas 80 e 8080.

## 1. envoy-patterns → módulo 7, aula 10

Subiu. Ajustes no clone: `80:80` → `8088:80` (porta 80 ocupada) e sub-rede `172.20.0.0/16` → `172.29.77.0/24` (erro real: `Pool overlaps with other one on this address space`). Para a queda do proxy-2, o `max_tokens` do `local_ratelimit` foi elevado, para o 429 não se misturar com as falhas.

Comandos: `docker compose up --build -d`; 6 × `curl -si http://localhost:8088/ | grep -iE '^(HTTP|x-proxy-server)'`; `printf '7\n\n8\n' | bash test-patterns.sh` (porta ajustada); `curl localhost:9900/clusters`; `docker compose stop reverse-proxy-2` com um curl a cada 0,2 s.

Saída que importa:
```
6 curls logo após o up:  1, 1, 1, 2, 2, 2
6 curls um minuto depois: 2, 1, 3, 1, 3, 3
12 curls (stack de pé há 95 s): proxy-1 = 3, proxy-2 = 6, proxy-3 = 3
queda do proxy-2, 200 pedidos: 8 ficaram pendurados (curl --max-time 5) + 1 resposta 503 (UF) em t = 46,9 s; depois, nenhum falhou
segunda queda, 170 pedidos: 1 pendurado
flags do proxy-2: /pending_dynamic_removal em ~6–12 s; /failed_active_hc/... em ~27 s; fora de /clusters em ~34 s
docker compose start reverse-proxy-2 → healthy em 4,6 s
```

Confirmou: o `test-patterns.sh` procura `x-proxy-server` no corpo e conta "Erro ao obter proxy" nas 12 requisições; o `check_services` marca "Reverse Proxy 2: Offline" (porta 9902 × 9901); o `/clusters` mostra os três hosts `healthy`.

Contrariou o texto (corrigido na aula):
- A divisão de 6 curls em 2 / 2 / 2 na ordem 1, 2, 3, 1, 2, 3. Saiu 1,1,1,2,2,2 e depois 2,1,3,1,3,3; 12 curls deram 3 / 6 / 3 (round robin por worker e slow start).
- "1 de cada 3 pedidos volta 503": os pedidos para o proxy parado ficam pendurados, e o 503 UF aparece só depois de alguns segundos.
- "Em até 30 s o proxy sai do pool": levou de uns 27–34 s a uns 47 s (a remoção pelo DNS do Docker, `pending_dynamic_removal`, entra antes do health check).
- "O `reverse-proxy-2` aparece como unhealthy no `docker compose ps`": os **sete** containers aparecem `(unhealthy)`, porque o healthcheck do compose chama `curl` e as imagens não têm `curl`.
- "Depois de uns 30 pedidos no total vê 429": em 45 curls seguidos, o 1º 429 veio no 17º pedido e passaram 21 (24 recusados).

Arquivos: `src/content/load-balancers/aula-10-laboratorio-envoy.mdx` (passos 3 a 5 do "Como funciona", seção "O que saiu quando rodei", bullets do "Como rodar" e das correções, 3 flashcards), `public/labs/load-balancers/quiz/questions.js` (t10 perguntas 2, 3 e 4), `public/labs/load-balancers/lab/envoy-patterns-saida.txt`. A figura 3D `camadas-3d` segue como caso ideal (1,2,3,1,2,3 e 503 rápido); a aula avisa no `DoIt`.

## 2. api-gateway (Kong) → módulo 8, aula 7

Subiu sem ajustes. Comandos: `docker compose up -d --build`; curls nas 4 rotas e em `/api/v1/products/42`; `curl localhost:8001/routes`; plugin `rate-limiting` (`second: 10`, `limit_by: ip`, `policy: local`) acrescentado ao `kong.yml` do clone, `docker compose restart kong`; 15 pedidos seguidos e 15 em paralelo (`xargs -P 15`).

Saída que importa:
```
v1/users, v1/products, v1/orders, v2/orders → 200, cada um no app certo (8081, 8082, 8083, 8084)
v1/products/42 → 404 text/plain do app Go (o strip_path funcionou)
/routes: strip_path true nas quatro; path_handling v1, v1, v1 e v0 (a v2)
15 pedidos seguidos: 200 × 10, 429 × 5
429: Retry-After: 1, X-RateLimit-Limit-Second: 10, X-RateLimit-Remaining-Second: 0,
     RateLimit-Limit: 10, RateLimit-Remaining: 0, RateLimit-Reset: 1; corpo JSON {"message":"API rate limit exceeded"}
15 em paralelo (4 rodadas): 10/5, 11/4, 11/4, 11/4
users-service: (unhealthy), "wget: server returned error: HTTP/1.1 404 Not Found"
```

Confirmou: tudo que o texto previa (10 passam, o 11º volta 429, `Retry-After: 1`, cabeçalhos `RateLimit-*` e `X-RateLimit-*`, o 404 do `/products/42`, o `users-service` unhealthy). Contrariou: o corpo é JSON (`{"message":"API rate limit exceeded"}`), não texto puro, e com pedidos em paralelo que atravessam a virada do segundo passa 1 a mais. Pedidos isolados às vezes levaram 2 a 4 s (causa não achada).

Arquivos: `src/content/api-gateways/aula-7-laboratorio-kong.mdx` (saídas reais das rotas, do 429 e do paralelo; ponta solta do healthcheck), `public/labs/api-gateways/lab/api-gateway-saida.txt`. O quiz não mudou.

## 3. Kafka → módulo 13, aula 6

Subiu (só o serviço `kafka`; o `kafka-ui` disputa a porta 8080). Comandos: `docker compose up -d kafka`; `bash partition_key/setup.sh`; `kafka-topics --create/--describe`; produtor, `consumer_estoque`, `consumer_faturamento` e `partition_key` compilados e rodados; `kafka-consumer-groups --describe`; `kafka-get-offsets`; `kafka-console-producer` com chaves; programa Go com `NewHashPartitioner`; `docker kill` no faturamento.

Saída que importa:
```
setup.sh → "Error response from daemon: No such container: kafka" (o container é kafka-kraft) e ainda imprime "Setup completo!"
pedidos: PartitionCount 1, ReplicationFactor 1; pedidos-particionados: 3 / 1, Isr de um nó só
produtor: 6.917 eventos em 8 s (~860/s)
grupos a ~16 s: estoque lag 849; faturamento CURRENT-OFFSET 97, lag 17.673 (depois: 122 / 17.827)
partition_key (~5.500 msgs): Renan p0, Tarsila p1, Pedro e Matheus p2; nenhum salto de sequência
chaves 1048..1052: Java p2,p0,p2,p0,p2 | sarama NewHashPartitioner p1,p2,p0,p2,p1
sarama não tem NewMurmur2Partitioner (v1.42.1 e v1.46.3): "undefined: sarama.NewMurmur2Partitioner"
SIGKILL no faturamento: último processado 135, confirmado 130, ao voltar (8 s depois) recomeçou no 130 → 6 reprocessados
```

Confirmou: 1 partição em `pedidos`; fator 1; lag crescendo só no faturamento; 1051 → p2 (sarama) e p0 (Java), 1049 → p2/p0 e 1050 → p0/p2; a janela do auto-commit (até ~10 duplicados).

Contrariou o texto (corrigido na aula e na figura): "O sarama tem o `NewMurmur2Partitioner`" (não tem; o `NewReferenceHashPartitioner` também é FNV-1a); "dois deslizes" no código viraram três (o `setup.sh` quebra no nome do container).

Arquivos: `src/content/comunicacao-assincrona/aula-6-kafka-exemplo.mdx`, `src/figures/kafka-3d/fig3d.js` (3 trechos que citavam o `NewMurmur2Partitioner`), `public/labs/comunicacao-assincrona/quiz/questions.js` (t6 perguntas 3, 4 e 5), `public/labs/comunicacao-assincrona/lab/kafka-saida.txt`.

## 4. MQTT → módulo 13, aula 8

Subiu (`eclipse-mosquitto:2.0`, `paho.mqtt.golang v1.4.3`). Comandos: `docker compose up -d`; consumidor antes do produtor; produtor com consumidor entrando no meio; `mosquitto_sub -c -i <id> -q 1` e `mosquitto_pub -q 1 -l` com 600 e 1.200 mensagens; `docker logs mqtt-broker | grep listen`; `curl 127.0.0.1:9001`.

Saída que importa:
```
consumidor antes: 5 publicadas, 5 recebidas
consumidor entrando no meio (sessão limpa): perdeu #1 a #6, recebeu a partir da #7
sessão persistente, assinante fora: 600 publicadas → 600 voltam; 1.200 → 1.000 voltam (1 a 1000; as 200 mais novas descartadas)
sessão limpa, 10 publicadas com o assinante fora → 0 voltam
Mosquitto só abre a 1883; curl na 9001 → curl: (56)
```

Confirmou tudo que o texto previa (1 msg/s com PUBACK, sessão limpa perde, teto de 1.000, 9001 sem listener). Acrescentou: os descartados são os mais novos (1001 a 1200). Nada contrariado.

Arquivos: `src/content/comunicacao-assincrona/aula-8-mqtt-exemplo.mdx` (parágrafo do teste de fila, seção "O que saiu quando rodei", 1 flashcard), `public/labs/comunicacao-assincrona/quiz/questions.js` (t8 pergunta 3), `public/labs/comunicacao-assincrona/lab/mqtt-saida.txt`.

## 5. AMQP / RabbitMQ → módulo 13, aula 10

Subiu depois de uma segunda partida: na primeira, o RabbitMQ 3.13.7 caiu com `Error when reading /var/lib/rabbitmq/.erlang.cookie: eacces` (volume `./tmp`; repetido 3 vezes, também com volume nomeado); `docker start` no mesmo container sobe. Causa não investigada. Comandos: `docker compose up -d`; produtor/consumidor `default`, `fanout` e `topic`; `rabbitmqctl list_exchanges/list_queues/list_bindings/list_channels`; `docker restart` com mensagens na fila.

Saída que importa:
```
default: produtor 4 s imprimiu 212.188 "enviada"; fila cobrar tinha 208.902 (sem confirms)
consumidor: prefetch_count = 0, messages_unacknowledged = 467 (no instante da leitura); leu 208.902 em 5 s
fanout/producer.go no mesmo broker: Exception (406) PRECONDITION_FAILED - inequivalent arg 'type' for exchange 'ecommerce.nova.venda' in vhost '/': received 'fanout' but current is 'direct'
cobrar com 119.161 mensagens → docker restart → fila e exchange voltam, 0 mensagens
fanout (broker novo): 1000 publicadas, 1000 em cada uma das 3 filas
topic (3 rodadas de 20): datalake 60, queue.faturamento 56, prioritario 4 (uma rodada saiu com 0 alta)
```

Confirmou tudo que o texto afirmava: o conflito direct × fanout (com a mensagem 406 exata), mensagens não persistentes, sem prefetch, sem publisher confirms, 1.000 no fanout e o datalake com tudo no topic. Acrescentou o problema de subida do compose.

Arquivos: `src/content/comunicacao-assincrona/aula-10-amqp-exemplo.mdx`, `public/labs/comunicacao-assincrona/lab/amqp-saida.txt`. O quiz não mudou.

## Verificação

`npm run build` termina sem erros (31 páginas). Os quatro links `*-saida.txt` aparecem no `dist/`. Nenhum commit foi feito. Ao fim de cada lab, `docker compose down -v` e `docker ps` mostram só os três containers de outros projetos (adminer × 2 e https-portal).
