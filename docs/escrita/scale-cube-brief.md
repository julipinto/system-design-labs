# Módulo 15: Scale Cube (brief canônico)

Fonte principal: https://fidelissauro.dev/cubo-escalabilidade/ (texto em docs/escrita/cubo-escalabilidade-artigo.txt, 29/10/2024; **curto**: 4 links nas Referências: Wikipédia "Scale cube", microservices.io "The Scale Cube", um artigo do Medium e o blog da AKF). O artigo apresenta os três eixos (X horizontal, Y funcional, Z dados) em um parágrafo cada e fecha dizendo que o cubo é só um mapa mental. Este brief **completa** com as fontes primárias: Abbott e Fisher, *The Art of Scalability* (Addison-Wesley; 2ª edição, 2015) e *Scalability Rules*; as páginas da AKF Partners (que criou o modelo em 2007 e o publicou primeiro no blog, depois nos livros); e Chris Richardson em microservices.io (o artigo que o próprio texto lista).
Lab público: github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design, pasta `exemplos/` (conferido com `gh api`): **não há lab do Scale Cube**. O que existe e entra como ponte: `exemplos/load-balancing/algoritmos/round-robin/main.go` (a distribuição entre `host1..3`, já usada no módulo 7) para o eixo X, e `exemplos/sharding/` e `exemplos/partitioning/` (módulo 16) para o eixo Z. O "Eixo X: Exemplo" (aula 3) é um **lab do SDLabs**: três manifestos Kubernetes (abaixo) com a imagem de teste `agnhost` do próprio Kubernetes (a mesma do tutorial "Hello Minikube"; o endpoint `/hostname` devolve o nome do pod). Sintaxe dos YAMLs conferida com um parser; **não foram aplicados num cluster** nesta sessão (sem `kubectl`): rodar em `kind` ou `minikube` antes de publicar a aula 3 e trocar a saída ilustrativa pela real. Não citar curso (o link do repositório entra como "repositório público do autor").
Siga PREMISSAS.md e ESCRITA.md. Slug: `scale-cube`. Coleção `src/content/scale-cube/`, página `src/pages/labs/scale-cube/`. Título do módulo: "Scale Cube". **Figura: 1 (`cubo-3d`).**

## Onde a história parou e o novo problema
O módulo 14 mediu a Black Friday e deixou um padrão feio: cada gargalo resolvido **mudou de lugar**. A página do catálogo (CPU a 99% numa réplica, p99 de 2.000 ms) se resolveu **clonando** (10 → 14 réplicas, fórmula do HPA). Em seguida o elo mais fraco do checkout foi `pagamentos` (40 pedidos/s), que também se resolve clonando (2 → 4). Depois de `pedidos` e `pagamentos`, o teto é o **banco do `pedidos`: 150 pedidos/s**, e clonar serviço **não o move**. O módulo fecha com "falta um mapa para decidir por onde crescer". O módulo 15 é esse mapa. A loja **já andou** em dois eixos sem ter o nome (módulo 6 separou por função, módulo 7 clonou); falta o terceiro, que o módulo 16 detalha. Problema do módulo: **dado um sintoma, qual eixo atacar, em que ordem, e o que cada eixo custa**.

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
### O modelo (as definições das fontes, em palavras próprias)
- **Eixo X, clonar** ("horizontal duplication and cloning"): N cópias **idênticas** do serviço atrás de um balanceador; cada cópia atende **1/N** da carga (Richardson). Escala transações; é o mais fácil. Custos (AKF e Richardson): a cópia **acessa todos os dados**, então caches precisam de mais memória e o conjunto de dados é replicado **inteiro** (na camada de dados, o X é a **réplica**: módulo 17); **estado de sessão** pesado atrapalha; **não resolve** a complexidade do código nem a organizacional.
- **Eixo Y, separar por função** ("functional decomposition"): dividir **o que é diferente**: por **verbo** (um caso de uso, como `checkout`) ou por **substantivo** (uma entidade, como `clientes`). Cada serviço com **seus próprios dados** (isolamento de falha e disponibilidade). É a decomposição em microsserviços. Único eixo que aumenta a **escalabilidade organizacional** (times donos de código e dados).
- **Eixo Z, separar por dados** ("data partitioning", "pods/shards"): dividir **o que é igual, mas grande demais**: cada servidor roda o **mesmo código**, mas atende só um subconjunto dos dados (por módulo do `customer_id`, por região, por SKU, por tipo de cliente). Alguém **roteia** cada requisição pelo atributo escolhido. Melhora cache, I/O e **isolamento de falha** (se o shard cai, parte dos dados some, não todos). Custo: o esquema de partição é difícil, **principalmente quando for preciso repartir**; e **não** resolve complexidade de código (para isso, Y). O Z também vale para a **aplicação**, não só para o banco (o exemplo de Richardson: um serviço de busca com partições e um agregador que pergunta a todas e junta as respostas).
- **É um mapa mental, não uma regra** (o artigo, e a AKF diz o mesmo: "linguagem comum" para discutir escala). Origem: a AKF Partners criou o cubo em **2007**.

### Onde a loja está no cubo (coordenadas; sempre estes números)
Ponto = (réplicas X, funções Y, partições Z).
- **Módulo 5 (fim):** monolito `loja`, 8 vCPU, um banco: **(1, 1, 1)**.
- **Módulo 6 (Y):** o programa se parte em **7 serviços** com um banco cada (`catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas`, `relatorios`). Na Black Friday: catálogo 10 × 1 vCPU, carrinho 3 × 1, pedidos 3 × 1, pagamentos 2 × 1, estoque 2 × 1, entregas 1 × 1, relatórios 1 × 4 = **25 vCPU** (contra **80** vCPU de 10 cópias do monolito de 8 vCPU: 55 vCPU a menos, **69%**). Quem fez o quê: Vitrine (catálogo), Checkout (carrinho, pedidos, pagamentos), Logística (estoque, entregas).
- **Módulo 7 (X):** o `lb-loja` na frente de `catalogo-1…10`.
- **Módulos 8 e 9:** o gateway e os 2 BFFs viram **9 deployments** e, no módulo 10, **30 pods** (catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4, bff-web 4).
- **Hoje:** X = até 10 (catálogo), Y = **9**, Z = **1** em tudo. O Z é o eixo que **a loja ainda não usou**.
- **Módulo 16 (Z):** `pedidos` em **3 shards** por `cliente_id`.

| serviço | Y (separado no módulo) | X (réplicas na Black Friday) | Z (partições) |
|---|---|---|---|
| `catalogo` | 6 | 10 | 1 |
| `carrinho` | 6 | 3 | 1 |
| `pedidos` | 6 | 3 | 1 → **3** (módulo 16) |
| `pagamentos` | 6 | 2 | 1 |
| `estoque` | 6 | 2 | 1 |
| `entregas` | 6 | 1 | 1 |
| `relatorios` | 6 | 1 (4 vCPU) | 1 |
| `bff-app` / `bff-web` | 9 | 4 / 4 | 1 |

### Sintoma → eixo (a tabela de diagnóstico; os sintomas são os da própria loja)
| sintoma da loja | de onde veio | eixo |
|---|---|---|
| `catalogo` com CPU a 99%, p99 de 2.000 ms; dobra o pico de CPU | módulo 14 | **X** (clonar: 10 → 14) |
| fechamento das 23:00 derruba o checkout (página 120 ms → 2,4 s) | módulo 6 | **Y** (`relatorios` num serviço só dele) |
| deploy de 40 min, três times esperando um ao outro | módulo 8 | **Y** |
| `pagamentos` capacidade 40/s, `estoque` 1.000/s parado | módulo 14 | **X no elo certo** (e só nele) |
| banco do `pedidos` no teto de 150 pedidos/s; 50 milhões de linhas | módulos 14 e 16 | **Z** |
| um cliente (`mkt-01`, o marketplace do módulo 8) com 40% dos pedidos | módulo 16 | **Z por tipo de cliente** (shard dedicado) |
| a região de SP cai e leva tudo | módulo 27 | **Z por região** (pods) + X dentro de cada pod |
| a busca de 900 ms por requisição | módulo 7 | **nenhum eixo**: índice (módulo 4) ou cache (módulo 5). Escala não conserta código lento |

### O pedido-estrela: 1053 (Caio, Rio)
**1 caneca azul** (19,90) + frete Rio **12,00** (constante nova) = **31,90**; estoque da caneca **38 → 37** (o 1051 do módulo 13 deixou 38). Caio é o cliente que perdeu o último gato no 1049 (módulo 11). O 1053 atravessa os três eixos e a figura o segue: **X** (o `lb-loja` escolhe uma das 3 réplicas de `pedidos`), **Y** (passa por `carrinho → pedidos → pagamentos → estoque → entregas`, cinco serviços, quatro saltos de 5 ms = +20 ms, módulo 6) e **Z** (`caio-58` → shard 2, ver módulo 16; **mostrar como "o que vai existir"**, porque o Z só nasce no módulo 16).

### Conta por eixo (aula 1 e aula 6): `pedidos` com a demanda de 200 pedidos/s (a Black Friday do ano que vem, hook do módulo 23)
Cada réplica de `pedidos` dá **30 pedidos/s** (33 ms de CPU por pedido, a conta do módulo 14); o banco de **um** primário dá **150/s**.

| estado | pods de `pedidos` | capacidade do serviço | capacidade do banco | **saída** (de 200/s) |
|---|---|---|---|---|
| hoje (3, 1, 1) | 3 | 90/s | 150/s | **90/s** (45%) |
| só X, 7 réplicas (7, 1, 1) | 7 | 210/s | 150/s | **150/s** (75%): o banco para o X |
| X + Z, 3 shards × 3 réplicas (3, 1, 3) | 9 | 270/s | 3 × 150 = 450/s | **200/s** (100%), cada banco a 44% |

- **Com o `mkt-01` (60% dos pedidos num shard, módulo 16):** o shard quente recebe 120/s de 150/s (**80%**, no joelho do módulo 14), os outros dois 40/s cada. O Z resolve a demanda de 200/s, mas **não** a de 250/s (o shard quente chega a 150/s com 250 no total, **55,6%** do nominal de 450).
- **Total de pods** do `pedidos` e vizinhos: 30 pods hoje; com Z na linha de cima, **30 − 3 + 9 = 36**.
- **Z não é grátis em conexões:** cada réplica do `pedidos` mantém um pool de 10 conexões **por shard** que ela atende; se todas as réplicas falam com **todos** os shards, cada banco continua vendo (nº de réplicas × 10) conexões; só o modelo de **pods por shard** (a AKF chama de *pod*) faz cada banco ver só as réplicas dele (3 × 10 = 30). Limite padrão do PostgreSQL: `max_connections` = **100** (módulos 11 e 14).

## Aulas (6): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1. **introducao-ao-modelo-conceitual** — *Tese:* o Scale Cube é um **vocabulário de três perguntas**: copio? separo o que é diferente? separo o que é igual? Ponte do módulo 14 (o gargalo que anda). Origem (AKF, 2007), as três definições, as coordenadas da loja (X até 10, Y = 9, Z = 1), a tabela sintoma → eixo. Mapa mental, não governança. *E se der errado:* **eixo certo para o sintoma errado**: a busca de 900 ms não melhora clonando de 10 para 20 réplicas (cada busca continua levando 900 ms; só cai a fila), e mesmo o catálogo clonado de 10 para 20 dobra a conta de CPU. *Falta saber:* o X, o eixo mais fácil, onde ele para. **Faça agora:** na figura `cubo`, mova o ponto da loja de (1,1,1) até onde ela está hoje.
2. **eixo-x-escalabilidade-horizontal** — *Tese:* o X é copiar o serviço e dividir o tráfego, e funciona **enquanto cada cópia não depender de nada que não é cópia**. 640 req/s ÷ 10 réplicas = 64 por réplica (1/N). Condições: serviço **sem estado** (a sessão no Redis, módulo 5), balanceador (módulo 7), HPA (módulo 14). Custos da AKF: cache por cópia (módulo 5, modo `local`), dados inteiros em cada cópia (réplica de banco, módulo 17). *E se der errado (duas versões):* (a) o `carrinho` guarda o carrinho **na memória**: Lena põe o gato no carrinho na réplica 1, a página do carrinho cai na réplica 2 e aparece **vazio** (consertos: estado no Redis; ou *sticky* por IP, que o módulo 7 mostrou quebrar com NAT de 500 pessoas); (b) a **sexta réplica do `pedidos`** (6 × 30 = 180/s) **não acrescenta nada**: o banco para em 150/s. *Falta saber:* ver o X acontecendo, de verdade, com um comando.
3. **eixo-x-exemplo** — *Tese:* clonar é **um comando**; a prova de que as cópias são idênticas é cada resposta dizer um nome de pod diferente. O lab do SDLabs (YAML abaixo): `kubectl apply`, `kubectl get pods` (3 pods), chamar o Service 100 vezes de dentro do cluster e contar `/hostname` por pod, `kubectl scale deployment catalogo --replicas=10`, apagar um pod (`kubectl delete pod …`; o Deployment cria outro) e ver o HPA (`minReplicas: 10`, alvo 70%). Ponte com o `round-robin/main.go` do autor (o mesmo algoritmo de seleção, agora dentro do Service). *E se der errado:* o pod apagado estava no meio de requisições: sem `readinessProbe` e sem encerramento gracioso, o Service continua mandando conexões para ele por alguns segundos (avisar sem entrar em detalhe; módulo 22). *Falta saber:* o X trata todas as funções como uma só; e se o problema é que as funções são diferentes?
4. **eixo-y-quebra-de-funcionalidade** — *Tese:* o Y separa **o que é diferente** para que cada parte escale do **seu** jeito e tenha dono. Verbo × substantivo (Richardson): `checkout` (verbo: atravessa `carrinho → pedidos → pagamentos → estoque → entregas`) × `catalogo` (substantivo). Perfis diferentes (o artigo: CPU × I/O): catálogo CPU/cache, `estoque` espera banco (20 ms, 2 de CPU: módulo 11), `relatorios` é lote de 4 vCPU. A conta: **25 vCPU contra 80**. Organização: 3 times, deploy de 40 min (módulo 8) → deploys independentes. Cada serviço com **seu** banco. *E se der errado:* **serviço por tabela**: separam `itens_pedido` em serviço próprio; a tela "meus pedidos" (20 pedidos) faz 1 chamada de lista + 20 de itens = **21 × 5 ms = 105 ms** de rede, contra um JOIN de ~2 ms; e perde-se a transação única (o estorno do módulo 6, a saga do módulo 19). *Falta saber:* o Y e o X não dividem os **dados**; um serviço, mesmo clonado, ainda conversa com um banco só.
5. **eixo-z-sharding-e-particionamento-de-dados** — *Tese:* o Z separa **o que é igual, mas grande demais**: o mesmo código, cada instância com um pedaço dos dados, e um **roteador** que olha uma chave. Chave candidata: `cliente_id` (a AKF: módulo do `customer_id`), região (geográfico, "pods" por região), SKU, tipo de cliente. Modelos: Z só do banco (os 3 shards de `pedidos`) e Z da aplicação (o `catalogo` busca em partições com um agregador). O Z melhora cache, I/O e isolamento de falha, e **não** melhora a organização. Mostra a tabela de 200 pedidos/s. *E se der errado:* a consulta **sem a chave**: `WHERE id = 1042` (só o id) vai para **todos** os shards (scatter-gather), e o plano real do PostgreSQL com tabelas particionadas mostra exatamente isso (um `Append` sobre as 3 partições); e o Z por região, com SP concentrando 55% dos pedidos (módulo 16), cria um shard quente. *Falta saber:* juntar os três: em que ordem, e quantas unidades isso dá.
6. **conversao-dos-eixos** — *Tese:* os eixos **se multiplicam e se combinam**, e a ordem é a **do gargalo, não a do desenho**. A loja fez Y (módulo 6), depois X (módulo 7) e **só agora** vai para Z; "pods" = o X dentro de cada Z (cada shard com suas réplicas e as do banco, módulo 17). A conta das unidades de deploy: Σ por serviço de (X × Z): 30 pods hoje, **36** depois do Z do `pedidos`. A tabela por estado: (3,1,1) → (7,1,1) → (3,1,3). **Conversão** nos dois sentidos do texto: da tabela de sintomas para o eixo, e de capacidade (req/s) para número de pods. Mostra o ponto da loja (X, Y, Z) caminhando: (1,1,1) → (1,9,1) → (10,9,1) → (10,9,3, só em `pedidos`). *E se der errado:* **usar os três eixos ao mesmo tempo no mesmo serviço sem precisar**: o catálogo com 10 réplicas (X), em 4 microsserviços de busca (Y) e 3 partições (Z) dá **120 pods** (10 × 4 × 3) para um serviço que dava 100 req/s por réplica; o custo operacional e de rede cresce com o produto dos eixos. **Fecha com "Falta saber…":** o eixo Z é o que a loja nunca fez: `pedidos` tem **50 milhões de linhas**; como escolher a chave, qual função de hash usar e o que fazer quando um shard esquenta? Falta saber como partir a tabela de verdade → módulo 16, Sharding e Particionamento.

### Lab do SDLabs da aula 3 (manifestos; usar o código real em `<pre>`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalogo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: catalogo
  template:
    metadata:
      labels:
        app: catalogo
    spec:
      containers:
        - name: catalogo
          image: registry.k8s.io/e2e-test-images/agnhost:2.53
          command: ["/agnhost", "netexec", "--http-port=8080"]
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: "1"
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: catalogo
spec:
  selector:
    app: catalogo
  ports:
    - port: 80
      targetPort: 8080
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: catalogo
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: catalogo
  minReplicas: 10
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```
Comandos: `kubectl apply -f catalogo.yaml` · `kubectl get pods -l app=catalogo` · de dentro do cluster (um pod com `curl`): `for i in $(seq 1 100); do curl -s catalogo/hostname; echo; done | sort | uniq -c` · `kubectl scale deployment catalogo --replicas=10` · `kubectl delete pod <nome>`. **Avisos para a aula:** (1) `kubectl port-forward service/…` encaminha para **um** pod só e não serve para ver o balanceamento; (2) o `agnhost` não tem CPU real: o HPA com alvo 70% só age com carga de verdade (módulo 24); (3) com o HPA de `minReplicas: 10`, o `kubectl scale` é refeito pelo HPA; (4) `/hostname` e a saída de exemplo (`catalogo-7d9c6b6c5f-x2k4q`…) são ilustrativos.

## Widgets 2D (Sonnet)
- **Diagnóstico:** lista de 7 sintomas da loja (a tabela acima) + "o que o gargalo disse"; a pessoa escolhe X, Y, Z ou "nenhum" e vê a justificativa com o número (ex.: banco no teto de 150/s → "X não adianta: 7 réplicas dão 150/s").
- **Cubo e pods:** deslizadores X (1–20), Y (monolito ou 9 serviços), Z (1–6) para o `pedidos`; calcula pods (X × Z), capacidade do serviço (30/s por pod), do banco (150/s por shard) e a **saída** com a demanda (1–400 pedidos/s); marca o elo que limita.
- **Quanto cada eixo custa em vCPU:** monolito (8 vCPU × N cópias) × serviços (a tabela de 25 vCPU) com o multiplicador de tráfego da vitrine (1×–20×); com 10× dá 80 × 25.
- **Roteador do Z:** digitar um `cliente_id` e escolher 2 a 6 shards; mostra `murmur3(chave) mod N` (implementação conferida com os vetores `""→0`, `"hello"→0x248bfa47`, `"The quick brown fox jumps over the lazy dog"→0x2e4ff723`) e a partição; lista os 4 clientes (`lena-77`→1, `bia-31`→1, `caio-58`→2, `davi-12`→0 com 3 shards). Aviso: o mesmo widget é o do módulo 16.
- **Scatter-gather:** uma consulta com a chave (1 shard) e sem a chave (todos); mostra quantas partições são lidas.

## Figuras 3D (Opus) e modes
### `cubo-3d` (aulas 1 a 6): o cubo da loja
Um cubo de arestas finas e três eixos graduados: **X** (réplicas, para a direita), **Y** (serviços, para cima), **Z** (partições, para dentro). Dentro dele, a loja como **blocos que acendem**: a coluna de réplicas do catálogo ao longo de X, a pilha de serviços ao longo de Y, as partições de `pedidos` ao longo de Z. O pedido **1053** é uma esfera de luz que atravessa o conjunto. Painel com as coordenadas (X, Y, Z), os pods, os vCPU e o ms do pedido.
modes: `cubo` (os três eixos e as definições; o ponto da loja em (1,1,1) e andando até (10,9,1)), `x` (um serviço vira 10 cópias atrás do `lb-loja`; 640 ÷ 10 = 64 req/s; e se der errado: o `carrinho` em memória e o carrinho vazio na réplica 2), `x-teto` (e se der errado: `pedidos` 3 → 7 réplicas e o banco em 150/s: o gargalo aparece no banco, a saída para em 150), `y` (o monolito de 8 vCPU se parte em 7 serviços; 80 × 25 vCPU; o checkout do 1053 atravessa 5 serviços; e se der errado: o serviço por tabela e as 21 chamadas), `z` (o banco do `pedidos` em 3 shards; o roteador olha `caio-58` → shard 2; `WHERE id = 1042` abre os 3 shards; marcar como "o que o módulo 16 constrói"), `loja` (o ponto (10, 9, 3) com os blocos reais e a tabela de 200 pedidos/s), `conversao` (o ponto andando (1,1,1) → (1,9,1) → (10,9,1) → (10,9,3) com os pods e vCPU em cada passo; e se der errado: 10 × 4 × 3 = 120 pods para um catálogo).

Marcadores no MDX: `{/* FIG:cubo mode=x */}` etc. Aula 1: `cubo cubo`; 2: `cubo x` e `cubo x-teto`; 3: `cubo x` (com o lab ao lado); 4: `cubo y`; 5: `cubo z`; 6: `cubo loja` e `cubo conversao`.

## Constantes novas (registrar na história-mestre)
Pedido **1053** (Caio, Rio: 1 caneca azul 19,90 + frete Rio **12,00** = **31,90**; estoque da caneca 38 → 37); coordenadas (X, Y, Z) = (10, 9, 1) hoje e (10, 9, 3) com o Z do `pedidos`; **9 deployments / 30 pods**; capacidade do `pedidos` **30 pedidos/s por réplica** e **150/s no banco**; demanda do ano que vem de **200 pedidos/s** (hook do 23); tabela (3,1,1) → (7,1,1) → (3,1,3) com saída 90 / 150 / 200; identificadores de cliente novos: `caio-58` (e `bia-31`, `mkt-01` no módulo 16; `lena-77` e `davi-12` já existem nos módulos 8 e 4).

## Correções ao artigo (registrar em docs/fontes/scale-cube.md e avisar na aula)
1. **"Modelagem de microserviços":** o artigo apresenta o cubo como modelagem de microsserviços. As fontes (AKF, Richardson) tratam o cubo como modelo para **escalar e segmentar** serviços **e dados**; só o **eixo Y** é microsserviços. X e Z valem também para um monolito, e a AKF o aplica a "produtos", não só a serviços.
2. **"Largura, altura e profundidade":** não achei esses nomes nas fontes primárias (AKF: X = duplicação e clonagem, Y = decomposição e segmentação funcional, Z = partição por fronteira de cliente/dados; Richardson usa os mesmos). O brief usa "clonar, separar por função, separar por dados".
3. **Eixo Z só no banco:** o artigo restringe o Z a dados e à camada de persistência. A AKF e Richardson aplicam o Z também à **aplicação** (shards de um serviço de busca com agregador; **pods** inteiros por cliente ou região, inclusive por exigência de lei, como a GDPR, o exemplo da AKF), e o Z é um eixo de **isolamento de falha** quando cada pod tem seus próprios dados.
4. **X "é a parte mais simples":** é a mais **fácil de fazer** (a AKF diz "intelectualmente fácil"), mas tem custos que o artigo omite: dados replicados inteiros (custo da camada de persistência), caches que degradam, estado de sessão e **nenhum** ganho organizacional. O X que o artigo descreve ("adicionar e remover réplicas conforme necessário") mistura o **eixo** (clonar) com a **elasticidade** (ajustar o número de clones; módulo 14).
5. **Y e "grande parte das características dos microsserviços":** verdadeiro, mas o Y **sozinho** não é microsserviço bem feito: sem **dados próprios** por serviço e sem fronteira (verbo ou substantivo) ele vira um monolito distribuído. A AKF e Richardson insistem em dados próprios.
6. **Benefício de deployment:** o artigo diz que o cubo facilita Blue/Green e Canary. É consequência de Y (deploy independente por serviço) e de Z (um canário por pod), não do cubo como tal. Entra só como gancho para o módulo 22.
7. **Faltam as desvantagens do Z:** repartir os dados é difícil, consultas sem a chave vão a todos os shards, transações entre shards não existem de graça, e a chave pode criar um shard quente (módulo 16).
8. **Referências do artigo:** o link do Medium ("Achieving Scalability with Scale Cube") não entra; entram a AKF (o artigo "The Scale Cube" e os dois posts originais de 2007 sobre dividir aplicações e bancos), Richardson (microservices.io) e a Wikipédia. A AKF também tem o **Availability Cube** (irmão do Scale Cube), que serve de gancho para o módulo 27.

## Fontes por aula (2 a 6 links por aula; priorizar artigo dele > fonte primária > referências do artigo)
- 1: artigo; AKF, "The Scale Cube"; Richardson, microservices.io; Wikipédia, "Scale cube" (história: 2007, edições do livro).
- 2: artigo; Richardson (X-axis); AKF (X-axis e o custo de dados e cache); 12factor.net (processos sem estado e concorrência por processos); Kubernetes (Deployment).
- 3: artigo; Kubernetes (Service, Deployment, HPA); tutorial "Hello Minikube" do Kubernetes; README da imagem `agnhost` (kubernetes/kubernetes); repositório do autor (`round-robin/main.go`).
- 4: artigo; AKF, "Splitting applications or services for scale"; Richardson (Y-axis, verbo × substantivo); microservices.io, padrão "Microservice Architecture".
- 5: artigo; AKF, "Splitting databases for scale"; Richardson (Z-axis); AKF, "The Scale Cube" (pods e GDPR); repositório do autor (`sharding/`, `partitioning/`).
- 6: AKF (a visão combinada); Richardson; AKF, "Availability Cube"; Wikipédia.

## Vocabulário fixo
"Scale Cube" (cubo da escalabilidade), "eixo X" (clonar, réplica), "eixo Y" (separar por função, serviço), "eixo Z" (separar por dados, shard, partição, pod), "decomposição funcional", "por verbo", "por substantivo", "roteador", "scatter-gather", "pod" (só no sentido da AKF, avisando que não é o pod do Kubernetes), "sem estado", "sticky". Personagens: Caio (1053), Lena e o carrinho vazio. O ônibus do módulo 14 pode voltar **uma vez** (X = mais ônibus, Y = linhas diferentes, Z = linhas por bairro).

## Links conferidos em 20/10/2026 (HTTP 200; só estes entram no bloco "Fontes")
- Artigo e repositório do autor: https://fidelissauro.dev/cubo-escalabilidade/ (o endereço `/scale-cube/` dá 404) · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/sharding · https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/partitioning
- Scale Cube: https://akfpartners.com/growth-blog/scale-cube (conferido: criado em 2007; X, Y, Z; Z inclui módulo do `customer_id`, geografia, SKU; *pods*; GDPR) · https://akfpartners.com/growth-blog/splitting-applications-or-services-for-scale · https://akfpartners.com/growth-blog/splitting-databases-for-scale · https://akfpartners.com/growth-blog/akf-availability-cube · https://akfpartners.com/frameworks/the-akf-scale-cube · https://microservices.io/articles/scalecube.html (conferido: X = N cópias, cada uma 1/N; Y = serviços diferentes, por verbo ou substantivo; Z = mesmo código, subconjunto dos dados, roteamento por chave primária ou tipo de cliente; Z também na aplicação, com agregador) · https://microservices.io/patterns/microservices.html · https://en.wikipedia.org/wiki/Scale_cube (conferido: 1ª publicação online em 2007; *The Art of Scalability* 2ª ed. 2015; *Scalability Rules* 2011 e 2016)
- Kubernetes e 12 fatores: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ · https://kubernetes.io/docs/concepts/services-networking/service/ · https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/ · https://kubernetes.io/docs/tutorials/hello-minikube/ (usa `registry.k8s.io/e2e-test-images/agnhost:2.53` e `/agnhost netexec --http-port=8080`) · https://raw.githubusercontent.com/kubernetes/kubernetes/master/test/images/agnhost/README.md (conferido: `netexec` expõe `/hostname`) · https://kubernetes.io/docs/reference/kubectl/generated/kubectl_scale/ · https://12factor.net/processes · https://12factor.net/concurrency · https://docs.docker.com/reference/cli/docker/compose/up/ (alternativa com `--scale`)
- Sem link verificável: Abbott e Fisher, *The Art of Scalability* (livro; `theartofscalability.com` não respondeu) e *Scalability Rules* (livro). A página do livro na InformIT responde 200: https://www.informit.com/store/art-of-scalability-scalable-web-architecture-processes-9780134032801 (pode entrar como "livro").
