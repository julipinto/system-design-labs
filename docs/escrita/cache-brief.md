# Módulo 5: Estratégias de Cache (brief canônico)

Fonte principal: https://fidelissauro.dev/caching/ (texto em docs/escrita/cache-artigo.txt; 29 links nas Referências).
Material de laboratório público: https://github.com/msfidelis
(`cdn/main.go`: proxy que guarda a resposta da origem num arquivo `cache/<sha1(método+path+query)>`; miss busca na origem e grava, hit lê o arquivo; NÃO tem TTL nem invalidação — use isso como o "e se der errado" da aula 7; `app/cache-memory/main.go`: hashmap em memória; `app/cache-app`: app + banco com cache).
Os vídeos do curso são pagos e têm marca d'água: não baixar, não citar o curso. Crédito igual aos outros módulos.
Siga PREMISSAS.md e ESCRITA.md. Slug: `cache`. Coleção `src/content/cache/`, página `src/pages/labs/cache/`.

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
A mesma loja dos módulos 2 e 4. A página do **gato de pelúcia** (produto 42) é a mais vista da loja; a Lena (Recife) abre essa página.
- Chave: `produto:42` → `{ "nome": "gato de pelúcia", "preco": 89.90, "estoque": 3 }`
- Ler do banco (PostgreSQL, a tabela do módulo 4): **40 ms**. Ler do Redis: **1 ms**. Ler do hashmap na memória do app: **0,05 ms**.
- TTL: **60 s**.
- Hit rate: em **10** pedidos da página, **8 hits e 2 misses** → **80%**. Tempo médio = 0,8×1 + 0,2×(1+40) = **9 ms** (sem cache: 40 ms).
- Inconsistência: o preço muda no banco para **79.90**; o cache continua dizendo **89.90** até o TTL vencer ou alguém invalidar `produto:42`.
- Evicção: cache com **3 vagas**; sequência de acessos `produto:42, produto:7, produto:42, produto:13, produto:99` → com **LRU** sai o `produto:7`; com **FIFO** sai o `produto:42`; com **LFU** sai `produto:7` (empate desfeito pelo mais antigo).
- Cache-aside: app pergunta ao cache → miss → lê banco (40 ms) → grava no cache com TTL 60 → responde. Próximo pedido: hit (1 ms).
- Write-through: a mudança para 79.90 grava no cache E no banco na mesma operação (escrita mais lenta, leitura sempre fresca).
- Write-behind: grava só no cache e uma fila escreve no banco depois; e se o Redis cair antes de descarregar a fila → a mudança se perde.
- CDN: a foto `gato.jpg` (**120 KB**). Origem em **São Paulo**; a Lena em **Recife** acessa o edge de Recife. 1º acesso: `X-Cache: MISS`, edge busca na origem (~**50 ms** de ida e volta) e guarda; 2º acesso: `X-Cache: HIT`, **~5 ms**, `Age: 12`. Cabeçalho da origem: `Cache-Control: public, max-age=3600`.

## Aulas (7) — seguem a ordem dos vídeos do curso; arquivos `aula-N-<slug>.mdx`
1 introducao-ao-cache (definição, princípios, localidade) · 2 consistencia-e-ttl · 3 eviccao-e-invalidacao · 4 hit-miss-e-hit-rate · 5 memoria-e-distribuido (hashmap no app vs Redis compartilhado; o que acontece com 3 réplicas do app e cache local) · 6 cache-aside-write-through-write-behind-e-cdn · 7 criando-uma-cdn (o lab do repositório explicado linha a linha, com a falta de TTL como "e se der errado")

## Figuras 3D (Opus) e modes
### `cache-3d` (aulas 1–6): app ↔ cache ↔ banco, o pedido do produto:42
modes: `aside` (miss → banco → set com TTL → hit; contador de ms), `ttl` (preço muda para 79.90, cache serve 89.90 velho até vencer; depois invalidação explícita), `evict` (3 vagas, a sequência acima; troca LRU/LFU/FIFO por `&pol=`), `through` (escrita dupla), `behind` (fila; e se der errado: Redis cai e a fila some), `local` (3 réplicas do app com hashmap cada uma, preços diferentes em cada → vs Redis compartilhado).
Painel com contadores reais: "hits / misses / hit rate" e "ms gastos até agora".
### `cdn-3d` (aulas 6–7): a foto do gato de Recife até São Paulo
modes: `miss` (1º acesso, edge vazio → origem → guarda), `hit` (2º acesso, 5 ms, Age), `expire` (max-age venceu → revalida com If-None-Match → 304 Not Modified), `lab` (o proxy do repositório: sha1 do método+path → arquivo no disco; e se der errado: sem TTL, a foto nova nunca aparece).

Marcadores no MDX: `{/* FIG:cache mode=aside */}`, `{/* FIG:cdn mode=miss */}` etc.
