# Fontes: Estratégias de Cache

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Cache, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/caching/), citada nas aulas 1 a 7.

**Aulas:** 1 Introdução ao cache · 2 Consistência e TTL · 3 Evicção e invalidação · 4 Hit, miss e hit rate · 5 Memória e distribuído · 6 Cache-aside, write-through, write-behind e CDN · 7 Criando uma CDN

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`, segunda tentativa com tempo maior): 37 links testados (o artigo, os 9 da seção "Referências", o repositório de exemplos e 26 candidatos de fonte primária e documentação). Os 26 links citados nas aulas abrem com 200.

**Sobre a contagem:** o brief falava em 29 links nas Referências. O artigo tem **9** (8 distintos: "Caching patterns", da AWS, aparece duas vezes). Os demais links da página são rodapé, compartilhamento e artigos vizinhos do próprio blog. Os 9 foram abertos: 8 dão 200 e o Medium dá **403** para robôs (não foi possível ler nem pelo `curl`; não é citado nas aulas).

**Duas observações:** `redis.com/blog/cache-eviction-strategies/` e `hostinger.com.br/tutoriais/cache-miss` redirecionam para `redis.io/blog/...` e `hostinger.com/br/...`; as aulas citam o endereço final. A página `redis.io/docs/latest/develop/use/client-side-caching/` é só um redirecionamento (meta refresh) para `.../develop/reference/client-side-caching/`, que é a citada.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [System Design - Cache, Matheus Fidelis](https://fidelissauro.dev/caching/) | artigo base | Base do módulo: definição, princípios (consistência, TTL, evicção, invalidação, hit e miss), hashmap, Redis, cache-aside, write-through, write-behind e CDN, com os exemplos em Go. As 7 aulas seguem a ordem dele. | 1 a 7 | 200 |
| [Perfil público de Matheus Fidelis no GitHub (código de exemplo da CDN)](https://github.com/msfidelis) | outro (código público) | `cdn/main.go` (o proxy da aula 7, lido linha a linha), `app/cache-memory/main.go` (o hashmap da aula 5) e `app/cache-app`. O endereço do repositório contém o nome de um curso; o texto das aulas não cita o curso nem reproduz material pago, só o código público. | 5, 7 | 200 |
| [AWS: Caching patterns (database caching strategies using Redis)](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html) | referência do artigo | Lazy loading (cache-aside) guarda só o que foi lido; write-through atualiza o cache logo depois do banco e quase sempre vem junto com lazy loading. A página está marcada como referência histórica. | 6 | 200 |
| [Microsoft Azure: padrão cache-aside](https://learn.microsoft.com/pt-br/azure/architecture/patterns/cache-aside) | referência do artigo | O app lê do cache, cai no banco no miss e popula; a expiração tem que casar com o padrão de acesso e um TTL curto demais força recargas. | 2, 6 | 200 |
| [Prisma Data Guide: introdução ao cache de banco de dados](https://www.prisma.io/dataguide/managing-databases/introduction-database-caching) | referência do artigo | Cache-aside e read-through; se o cache cai, o app ainda vai direto ao banco; a janela de inconsistência. | 1 | 200 |
| [Redis blog: estratégias de evicção de cache](https://redis.io/blog/cache-eviction-strategies/) | referência do artigo | Por que um cache cheio precisa de política e as políticas do Redis. | 4 | 200 |
| [Hostinger: cache hit e cache miss](https://www.hostinger.com/br/tutoriais/cache-miss/) | referência do artigo | Definição de hit e miss, taxa de hits e penalidade do miss, tipos de miss. | 4 | 200 |
| [GeeksforGeeks: write-through e write-back](https://www.geeksforgeeks.org/write-through-and-write-back-in-cache/) | referência do artigo | Write-back grava só no cache e adia o destino; o dado modificado se perde se o cache falhar. A única fonte lida com o risco dito às claras. | 6 | 200 |
| [ByteByteGo: Top caching strategies](https://blog.bytebytego.com/p/top-caching-strategies) | referência do artigo | Lista cache-aside, read-through, write-around, write-back e write-through. Lida; as definições de read-through e write-around do Aprofundar da aula 6 se apoiam nela, mas ela não está em "Fontes" (limite de 6 por aula). | (6) | 200 |
| [Medium: Cache Strategies (mmoshikoo)](https://medium.com/@mmoshikoo/cache-strategies-996e91c80303) | referência do artigo | Não foi possível abrir: o Medium bloqueia o acesso automatizado. | nenhuma | 403 |
| [RFC 9111: HTTP Caching](https://datatracker.ietf.org/doc/html/rfc9111) | fonte primária (RFC) | `max-age` (resposta fica stale quando o Age passa do valor), `Age` ("estimativa de segundos desde que a origem gerou ou validou a resposta"), revalidação (304 permite reusar a resposta guardada) e definição de resposta stale. | 2, 6, 7 | 200 |
| [MDN: Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) | documentação | `public` (a resposta pode ir para um cache compartilhado), `max-age` e as outras diretivas. | 6 | 200 |
| [MDN: 304 Not Modified](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304) | documentação | O 304 não tem corpo, responde a uma requisição condicional (If-None-Match) e deve trazer os cabeçalhos de cache. | 7 | 200 |
| [Cloudflare: cf-cache-status e respostas do cache](https://developers.cloudflare.com/cache/concepts/cache-responses/) | documentação | `cf-cache-status`: HIT, MISS, EXPIRED, REVALIDATED, BYPASS. Prova de que `X-Cache` é convenção, e não padrão. | 6 | 200 |
| [Redis: comando EXPIRE](https://redis.io/docs/latest/commands/expire/) | documentação | Expiração passiva (ao acessar) e ativa (amostra periódica das chaves com TTL). | 2, 3 | 200 |
| [Redis: políticas de evicção](https://redis.io/docs/latest/develop/reference/eviction/) | documentação | `maxmemory-policy`, as políticas `allkeys-*`, `volatile-*`, `noeviction` (devolve erro) e a aproximação do LRU e do LFU por amostragem. A página não diz qual é a política padrão, e a aula não afirma. | 3 | 200 |
| [Redis: comando INFO](https://redis.io/docs/latest/commands/info/) | documentação | `keyspace_hits` e `keyspace_misses` (a conta do hit rate em produção). | 4 | 200 |
| [Redis: escalar com Redis Cluster](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/) | documentação | "Redis Cluster does not guarantee strong consistency"; pode perder escritas já confirmadas, por usar replicação assíncrona. Base da correção da aula 5. | 5 | 200 |
| [Redis: replicação](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) | documentação | "Redis uses by default asynchronous replication". | 5 | 200 |
| [Redis: client-side caching](https://redis.io/docs/latest/develop/reference/client-side-caching/) | documentação | O problema de invalidar a cópia local e o aviso do servidor para o cliente. | 5 | 200 |
| [Memcached](https://memcached.org/) | outro | Cache distribuído em memória, só chave-valor. | 5 | 200 |
| [Go: sync.RWMutex](https://pkg.go.dev/sync#RWMutex) | documentação | O mutex de leitura e escrita do hashmap. | 5 | 200 |
| [Go: net/http](https://pkg.go.dev/net/http) | documentação | `http.Get` não devolve erro para respostas que não são 2xx ("A non-2xx response doesn't cause an error"). Base do "e se der errado" 404 da aula 7. | 7 | 200 |
| [Go: crypto/sha1](https://pkg.go.dev/crypto/sha1) | documentação | SHA-1 usado por `generateHash`. | 7 | 200 |
| [Go: io/ioutil](https://pkg.go.dev/io/ioutil) | documentação | "Deprecated: As of Go 1.16, the same functionality is now provided by package io or package os." Citada só no Aprofundar da aula 7, em texto (sem link). | 7 | 200 |
| [Wikipedia: cache (computação)](https://en.wikipedia.org/wiki/Cache_(computing)) | outro | Write-through x write-back; o write-back exige marcar o bloco como modificado (dirty). | 1 | 200 |
| [Wikipedia: localidade de referência](https://en.wikipedia.org/wiki/Locality_of_reference) | outro | Localidade temporal e espacial. | 1 | 200 |
| [Wikipedia: políticas de substituição de cache](https://en.wikipedia.org/wiki/Cache_replacement_policies) | outro | FIFO, LRU, LFU e variações. | 3 | 200 |
| [Wikipedia: cache stampede](https://en.wikipedia.org/wiki/Cache_stampede) | outro | Onda de misses quando chaves vencem juntas ou o cache é esvaziado. | 2 | 200 |

Candidatos abertos e **não** citados (200, mas sem acrescentar ao texto): MDN HTTP Caching, MDN Age, MDN ETag, Wikipedia Content delivery network, AWS CloudFront Expiration (TTL mínimo, padrão e máximo).

## Correções ao artigo-base (também no `docs/escrita/cache-blueprint.md`)
1. **Escopo do hashmap** (aula 5): o artigo diz "uma execução, thread ou processo"; as threads de um processo compartilham o mapa (por isso o `RWMutex`). O limite é o processo.
2. **Exemplo de cache-aside** (aulas 2 e 6): `err == rdb.Nil` não compila (`rdb` é o cliente; é `redis.Nil`) e `Set(..., 0)` guarda sem validade, contra o que o artigo defende sobre TTL.
3. **Exemplo de write-through** (aula 6): grava `"pedido:"+pedidoID` na coluna `id` do banco, mas lê com `pedidoID` puro. O prefixo vale só no cache. O texto fala de o banco falhar depois do cache, mas o código grava o banco primeiro (a ordem segura).
4. **Consistência do Redis distribuído** (aula 5): o artigo fala de manter a consistência em todo o sistema; a documentação do Redis diz que o cluster não garante consistência forte e que a replicação é assíncrona.
5. **"Cache baseado em conteúdo"** (aula 7): a chave do proxy vem da requisição (URL), e não do conteúdo.
6. **Chave do proxy** (aula 7): o código do artigo hasheia só o `Path`; o do repositório hasheia método + path + query, mas pede à origem só o `Path` (a query entra na chave e some do pedido).
7. **`ioutil`** (aula 7): deprecado desde o Go 1.16 (`os.ReadFile` e `os.WriteFile`).
8. **Contagem de links**: o brief dizia 29 nas Referências; o artigo tem 9 (8 distintos).
9. **Limiar do hit rate** (aula 4, complemento): o artigo diz que uma taxa baixa pode justificar remover o cache; com 1 ms de cache e 40 ms de banco a conta fecha acima de 1 ÷ 40 = 2,5%.

## Fatos conferidos nas fontes primárias
- Redis: LRU e LFU são aproximados por amostragem (doc de evicção); expiração passiva e ativa (EXPIRE); replicação assíncrona por padrão e cluster sem consistência forte (replicação e scaling); `keyspace_hits` e `keyspace_misses` (INFO).
- RFC 9111: `max-age`, `Age`, resposta stale e 304 reaproveitando a resposta guardada. O texto de `If-None-Match` está na RFC 9110, que não foi aberta; a aula só descreve o uso.
- Go: `http.Get` não dá erro em 404 e 500; `io/ioutil` deprecado desde o Go 1.16.
- SHA-1 de `GET/gato.jpg` = `f34b98978ea8b0b6b5e489a03cd1f067ec7a3ffa`; de `GET/gato.jpgv=2` (RawQuery não traz o "?") = `442f2a6a3690de956c20bdcc83335b9701616d53`; de `POST/gato.jpg` = `98650421bf200a2150065647b3f3c2baca612cc2` (calculados com `sha1sum` e conferidos no widget).
- Sem fonte conferida, por isso **não afirmado como fato** nas aulas: qual a política de evicção padrão do Redis; detalhes de negative caching de CDNs. O custo do write-through de encher o cache com o que ninguém pede é raciocínio próprio (a página da AWS não o diz).
