# Módulo 4: Databases, Modelos de Dados e Indexação (brief canônico)

Fonte principal: https://fidelissauro.dev/databases/ (texto extraído em docs/escrita/databases-artigo.txt; 37 links nas Referências).
Siga PREMISSAS.md e ESCRITA.md. Slug do módulo: `databases`. Coleção: `src/content/databases/`. Página: `src/pages/labs/databases/`.

## História canônica (texto, figuras, quiz e glossário usam OS MESMOS dados)
A loja (a mesma do módulo 2) vende para a Lena (a mesma dos módulos 1 e 3). Ela compra um gato de pelúcia.

Tabela `pedidos` (6 linhas, sempre estas):
| id   | cliente | produto          | qtd | valor  | cidade  |
|------|---------|------------------|-----|--------|---------|
| 1041 | Caio    | caneca azul      | 2   | 39.80  | Rio     |
| 1042 | Lena    | gato de pelúcia  | 1   | 89.90  | Recife  |
| 1043 | Bia     | gato de pelúcia  | 1   | 89.90  | SP      |
| 1044 | Lena    | caneca azul      | 1   | 19.90  | Recife  |
| 1045 | Davi    | camiseta preta   | 3   | 147.00 | SP      |
| 1046 | Bia     | caneca azul      | 1   | 19.90  | SP      |

- Linha-estrela: **pedido 1042** (Lena, gato de pelúcia, 89.90, Recife).
- Consulta analítica-estrela: `SELECT SUM(valor) FROM pedidos` = **406.40**.
- Página: **8 KB** (PostgreSQL; InnoDB usa 16 KB). Na figura, cada linha ocupa ~2 KB → 4 linhas por página → 6 linhas = 2 páginas.
- Documento (JSON): cliente Lena com seus pedidos 1042 e 1044 aninhados.
- Wide-column: partição `cliente=Lena`, colunas `pedido:1042`, `pedido:1044`.
- Key-value: `carrinho:lena` → `{1042}`; `sessao:lena` → token.
- Grafo: (Lena)-[COMPROU]->(gato de pelúcia)<-[COMPROU]-(Bia) → "quem comprou também comprou".
- Índice invertido: termo "pelúcia" → [1042, 1043]; termo "caneca" → [1041, 1044, 1046].
- Hash: hash(1042) % 4 = balde 2 → offset no arquivo.
- B-Tree: raiz [1043] → folhas [1041,1042] [1043..1046]; achar 1042 = 2 leituras de página (vs varredura).
- LSM: escrita do 1046 vai pro WAL + memtable; memtable cheia → SSTable no disco; compactação junta SSTables; leitura procura memtable → SSTables mais novas → mais antigas (bloom filter pula as que não têm).

## Aulas (15), arquivos `aula-N-<slug>.mdx`
1 o-que-sao-bancos · 2 tipos-de-bancos · 3 niveis-de-consistencia · 4 modelo-de-tuplas · 5 modelo-de-documentos · 6 modelo-colunar · 7 coluna-larga · 8 chave-valor · 9 grafos · 10 page-size-e-indexacao-colunar · 11 lsm-trees · 12 b-tree · 13 hashing · 14 indices-invertidos · 15 write-e-read-intensive

## Figuras 3D (Opus) e modos
### `modelos-3d` (aulas 4–10): o mesmo pedido 1042 em seis formas
modes: `row` (linhas inteiras lado a lado em páginas de 8 KB; SUM(valor) precisa ler as 2 páginas inteiras), `column` (um arquivo por coluna; SUM lê só a coluna valor; compressão de "SP,SP,SP"), `doc` (documento JSON da Lena com pedidos aninhados), `wide` (partição Lena, colunas dinâmicas), `kv` (chave → blob opaco), `graph` (nós e arestas COMPROU), `page` (página de 8 KB vs 16 KB: quantas linhas cabem; linha grande ocupa 2 páginas).
### `indices-3d` (aulas 11–14): achar o pedido 1042
modes: `scan` (sem índice: lê as 6 linhas), `btree`, `lsm` (passo a passo: WAL → memtable → flush → SSTable → compactação → leitura com bloom), `hash`, `inverted` (busca "pelúcia").
Painel com contador real: "páginas lidas até agora".

Marcadores no MDX: `{/* FIG:modelos mode=row */}`, `{/* FIG:indices mode=lsm */}` etc.
