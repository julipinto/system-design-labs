---
type: blueprint
module: cache
version: 1
---
# Blueprint: módulo 5, Estratégias de Cache

Aprovado pelo próprio agente, seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois). Dados canônicos: `docs/escrita/cache-brief.md`.

## Fio condutor (1 frase)
Cache troca frescor por velocidade: a cópia guardada perto responde em 1 ms em vez de 40 ms, e cada regra do cache (TTL, evicção, invalidação, estratégia de escrita) decide quanto desse frescor a loja aceita perder.

## Exemplo e personagens canônicos
- A **loja** dos módulos 2 e 4. A página do **gato de pelúcia** (produto 42) é a mais vista; a **Lena**, em Recife, abre essa página.
- Chave `produto:42` → `{ "nome": "gato de pelúcia", "preco": 89.90, "estoque": 3 }`.
- Leitura: banco (PostgreSQL do módulo 4) **40 ms**, Redis **1 ms**, hashmap no app **0,05 ms**. TTL **60 s**.
- Hit rate: 10 pedidos, **8 hits e 2 misses = 80%**; tempo médio = 0,8 × 1 + 0,2 × (1 + 40) = **9 ms** (sem cache: 40 ms). Ponto de equilíbrio da conta: **2,5%** (1/40). Derivados, avisados como exemplo: 50% → 21 ms, 90% → 5 ms, 0% → 41 ms (pior que sem cache).
- Preço muda no banco para **79.90**; o cache segue dizendo **89.90** até o TTL vencer ou alguém apagar `produto:42`. Relógio: cache gravado em t = 0, mudança em t = 20 s, velho até t = 60 s (40 s de dado velho).
- Evicção: **3 vagas**; acessos `produto:42, produto:7, produto:42, produto:13, produto:99`. LRU tira o 7, FIFO tira o 42, LFU tira o 7 (empate 7 x 13 desfeito pelo mais antigo). Próximo acesso ao 42: LRU e LFU dão hit, FIFO dá miss.
- Três réplicas do app com hashmap cada uma (A, B, C): A guardou em t = 0, B em t = 10, C em t = 30; o preço mudou em t = 20. A e B dizem 89.90, C diz 79.90. Com 10 pedidos em rodízio: 3 misses e 7 hits (70%) contra 1 miss e 9 hits (90%) no Redis compartilhado.
- Write-through: grava no banco e no cache na mesma operação (escrita 40 + 1 = 41 ms, conta de exemplo). Write-behind: grava no cache (1 ms), a fila escreve no banco depois; Redis cai antes de a fila esvaziar = o 79.90 se perde.
- CDN: `gato.jpg` de **120 KB**, origem em **São Paulo**, edge em **Recife**. 1º acesso `X-Cache: MISS` (edge busca na origem, ~50 ms de ida e volta, e guarda); 2º acesso `X-Cache: HIT`, ~5 ms, `Age: 12`. Origem manda `Cache-Control: public, max-age=3600`. Vencido: revalida com `If-None-Match` e recebe `304 Not Modified`.
- Lab (aula 7): `cdn/main.go` do repositório público; chave = sha1("GET" + "/gato.jpg" + "") = `f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa`.
- Vocabulário fixo: "cache", "chave", "hit", "miss", "hit rate", "TTL", "evicção", "invalidar", "dado velho", "origem", "edge".

## Correções ao artigo-base (avisadas no texto, nos Aprofundar e em docs/fontes/cache.md)
1. Hashmap em memória "tem escopo limitado a uma execução, thread ou processo": as threads (goroutines) de um mesmo processo **compartilham** o mapa, é para isso que serve o `sync.RWMutex`. O limite é o **processo** (aula 5).
2. Exemplo cache-aside: `err == rdb.Nil` não compila (`rdb` é o cliente); o certo é `redis.Nil`. E o `Set` com TTL `0` guarda para sempre, o oposto do que o próprio artigo defende sobre TTL (aulas 2 e 6).
3. Exemplo write-through: grava `"pedido:"+pedidoID` na coluna `id` do banco, mas lê com `pedidoID` puro. A chave do cache e a chave do banco não são a mesma coisa (aula 6).
4. "Redis garante a consistência em todo o sistema" entre nós: a replicação do Redis é assíncrona; uma escrita confirmada pode se perder numa troca de primário (aula 5).
5. "Cache de conteúdo": a chave do proxy é derivada da **requisição** (URL), não do conteúdo. Conteúdo endereçado por hash é outra técnica (aula 7).
6. Código do artigo hasheia só o `Path`; o do repositório hasheia método + path + query, mas busca na origem só pelo path. A query entra na chave e some do pedido (aula 7).
7. Complemento (aula 4): o artigo diz que uma taxa de acerto baixa pode justificar remover o cache; com 1 ms de cache e 40 ms de banco a conta fecha acima de 1 ÷ 40 = 2,5%.
8. O artigo cita 9 links nas Referências (8 distintos); o brief dizia 29. Os 9 foram abertos (8 dão 200, o Medium dá 403 para robôs). Registrado só em docs/fontes/cache.md.
9. `ioutil` (usado nos exemplos) está deprecado desde o Go 1.16; o equivalente é `os.ReadFile` / `os.WriteFile` (aula 7).

## Estrutura por aula
Ordem: 1 o que é cache → 2 consistência e TTL → 3 evicção e invalidação → 4 hit, miss e hit rate → 5 memória x distribuído → 6 as três estratégias e a CDN → 7 criando uma CDN.

### Aula 1, Introdução ao cache
- **Tese:** cache é uma cópia guardada mais perto de quem pergunta, e só vale a pena para dado muito lido e pouco alterado.
- **Ponte:** módulo 4, aula 15 ("leitura intensiva pede cache"): a página do gato de pelúcia faz o banco ler a mesma linha o dia todo.
- **Pergunta que deixa:** a cópia pode ficar velha. Falta saber por quanto tempo ela pode mentir.
- Figura: `FIG:cache mode=aside`.

### Aula 2, Consistência e TTL
- **Tese:** o cache sempre pode estar desatualizado; o TTL limita por quanto tempo, e a escrita pode encurtar isso apagando a chave.
- **Ponte:** a cópia do 89.90 sobrevive à mudança para 79.90.
- **Pergunta que deixa:** e quando o cache enche antes de o TTL vencer? Falta saber quem sai.
- Figura: `FIG:cache mode=ttl`. Widget: relógio de TTL.

### Aula 3, Evicção e invalidação
- **Tese:** TTL decide por tempo, evicção decide por espaço e invalidação decide por evento; cada política erra num padrão de acesso diferente.
- **Ponte:** o cache de 3 vagas cheio e um 5º produto chegando.
- **Pergunta que deixa:** como saber se o cache está valendo a pena? Falta saber medir.
- Figura: `FIG:cache mode=evict`. Widget: simulador LRU/LFU/FIFO.

### Aula 4, Hit, miss e hit rate
- **Tese:** o hit rate transforma "o cache é rápido" numa conta: tempo médio = h × 1 + (1 − h) × 41.
- **Ponte:** o cache já guarda e já esquece; agora é preciso saber quanto acerta.
- **Pergunta que deixa:** onde mora o cache (dentro do app ou fora)? Falta saber o que muda com 3 réplicas.
- Figura: `FIG:cache mode=aside` (usa os contadores do painel). Widget: calculadora.

### Aula 5, Memória e distribuído
- **Tese:** um hashmap por réplica é o mais rápido e o mais inconsistente; um Redis compartilhado custa 1 ms e mantém uma cópia só.
- **Ponte:** 3 réplicas, 3 hashmaps, 3 preços.
- **Pergunta que deixa:** quem preenche e quem atualiza o cache? Falta saber a estratégia de leitura e de escrita.
- Figura: `FIG:cache mode=local`.

### Aula 6, Cache-aside, write-through, write-behind e CDN
- **Tese:** cada estratégia decide quem fala com o cache e com o banco, e em que ordem; a ordem decide o que se perde quando algo cai.
- **Ponte:** quem preenche o cache de 3 réplicas? O app, sob demanda.
- **Pergunta que deixa:** e o cache que fica na rua, perto da Lena? Falta saber como funciona uma CDN por dentro.
- Figura: `FIG:cache mode=through` (o painel troca para `behind`). CDN em texto, com os números da brief (a figura da CDN fica na aula 7).

### Aula 7, Criando uma CDN
- **Tese:** uma CDN é um proxy com um hashmap em disco; o lab de 85 linhas mostra o mecanismo inteiro e o que falta para ser de verdade (TTL, validação de status, concorrência, limite).
- **Ponte:** a CDN guardou o gato.jpg de 120 KB; como se escreve um desses?
- **Fecho do módulo:** quando uma regra do cache faltar, o cache continua servindo o que tem.
- Figura: `FIG:cdn mode=lab` (o painel troca para `miss`, `hit`, `expire`). Widget: chave do proxy (sha1 de método + path + query).

## Decisões de escrita
- Cada aula abre com ponte e fecha com "Falta saber…" (uma ocorrência por aula).
- "Faça agora" fala da figura de forma genérica (avance os passos, observe X). Os nomes dos botões entram na integração.
- Códigos reais do artigo e do repositório vão em `<pre>` que rola sozinho no celular.

## Widgets 2D (src/scripts/cache/widgets.js)
- `ttl` (aula 2): relógio de TTL com o preço velho; chips de instante da mudança (5, 20, 45, 59 s), apagar ou não a chave, slider de 0 a 120 s.
- `evict` (aula 3): LRU, LFU e FIFO lado a lado, 3 vagas, sequência pronta 42, 7, 42, 13, 99.
- `hitrate` (aula 4): calculadora (hits em 10 ou 1000 pedidos, Redis 1 ms ou hashmap 0,05 ms, banco 40 ou 10 ms).
- `cdnkey` (aula 7): SHA-1 de método + path + query, com os hashes reais do `sha1sum`.
