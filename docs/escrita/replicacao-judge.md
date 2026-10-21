# Judge: Replicação de Dados (módulo 17)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com quiz, glossário, widgets e brief), seguindo ESCRITA.md e a skill writing-prose-like-a-human. As figuras `replicas-3d` e `fluxo-dados-3d` ainda não existem: a conferência com elas fica para a integração (dados do brief, abaixo).

## Voz de IA
- Busca em MDX, glossário, quiz e widgets por "crucial", "fundamental", "vale ressaltar", "vale lembrar", "além disso", "ademais", "em suma", "nesse sentido", "robusto", "alavancar", "ecossistema", "vale destacar", "é importante": zero ocorrências depois da revisão.
- "Não é só X, é Y" e "não apenas": uma ocorrência (aula 3, replicação por logs: "O ganho principal não é só o tamanho: …"), reescrita para "O ganho principal é a ordem: …".
- Travessões e meias-riscas: zero em todos os arquivos do módulo (os sinais de menos de "−1" são U+2212, e o intervalo "150 a 300 ms" é escrito por extenso).
- Nenhuma seção termina resumindo o que acabou de ser dito. Os "E se der errado" terminam no dado (1.050 tentativas, 82 ms, 37 em vez de 36, 23 dias, −1).

## Encadeamento
- Todas as aulas abrem com `p.ponte` e fecham com `p.gancho` contendo "Falta saber…": 16→1 (cada shard é um servidor só), 1→2 (quem recebe as escritas), 2→3 (quando o primário diz "pronto"), 3→4 (só um serviço precisa de um pedaço do dado de outro), 4→5 (o dono não quer, nem sabe, publicar), 5→6 (dois primários e cópias que precisam convergir), 6→módulo 18 (separar o modelo de escrita do de leitura: CQRS).
- A aula 1 liga com o gancho do módulo 16 (`sdlabs-m16/src/content/sharding/aula-10-exemplo.mdx`): "cada shard é um servidor só… primário em SP, réplicas no Rio e em Recife. É o módulo 17".
- Lendo só a primeira e a última frase de cada aula, a história se conta: o shard sem cópia, quem escreve, quando confirmar, copiar entre serviços, copiar sem mexer na aplicação, juntar sem conflito, ler de uma cópia só de leitura.

## Listas e formato
- "Como funciona" com 5 itens (aulas 1, 3, 4, 5 e 6) ou 2 mais listas curtas de 3 a 4 itens depois do código (aulas 2 e 5); "Por que importa" com 4; 3 a 6 links por aula nas Fontes (todos 200 em 20/10/2026); 5 ou 6 flashcards por aula.
- O "Faça agora" é genérico: aponta o cenário e os botões da figura sem citar rótulos finais, para o maestro alinhar. Marcador `{/* FIG:… */}` uma vez por aula (aula 1 `replicas mode=primary-replica`, 2 `replicas mode=queda`, 3 `replicas mode=lag`, 4 `fluxo mode=ecst`, 5 `fluxo mode=cdc`, 6 `fluxo mode=crdt-contador`).

## Consistência de números (texto, quiz, glossário, widgets; a figura segue o brief)
- **Topologia e distâncias:** `pg-sp`, `pg-rio`, `pg-recife`; RTT 10 ms (Rio) e 80 ms (Recife); commit local 2 ms; leitura local ~2 ms.
- **Commit:** 2 / 12 / 82 ms e 500 / 83 / 12 commits/s (o widget `commit` calcula 1.000 ÷ latência e confere); 8,1 ms medido sem rede.
- **Atraso e perda:** dia comum 15 e 60 ms; Black Friday 300 e 800 ms; 30 × 0,3 = 9 e 30 × 0,8 = 24; dia comum 5 × 0,06 ≈ 0,3. O widget `failover` e o `commit` abrem nesses valores.
- **Failover:** ttl 30 s + 5 s = 35 s; 30 × 35 = 1.050; quórum 2 de 3; o Rio vence o Recife; Raft 150 a 300 ms.
- **Pedido 1055:** 1 caneca azul 19,90 + frete Recife 15,00 = 34,90 às 20:10:00.000; estoque 37 → 36; commit às .002; a Lena toca às .300 e vê o 1054; aparece às 20:10:00.802. O widget `lena` abre em 800 ms de atraso e tela às .300.
- **PostgreSQL 14:** `0/8004430` (token), `0/8000060` (aplicado), `f`; `rio | sync | 1`, `recife | potential | 2`; `SyncRep`; timeline 1 → 2; 335 B de WAL por pedido (6.709.592 ÷ 20.000), 10 KB/s, 36 MB/h, 108 MB/h, 555 h ≈ 23 dias; 6.552 kB retidos.
- **ECST:** 202 B e 56 B (conferidos em Python); 750 MB, 3,0 GB, 450 MB e 75 s; v8 "Rua da Aurora, 100" e v9 "Rua do Sol, 200". O widget `ecst` mostra o endereço final com e sem a regra.
- **CRDT:** 250 → 135 + 80 + 58 = 273; LWW sobre o total daria 265 ou 258; `{caneca}` → `{gato}`; "add vence"; PN-Counter −1; 120 permutações. O widget `crdt` tem o "Cenário do texto" e dá 273, `{gato}` e −1.
- **Endereço da Lena (aulas 2 e 6):** SP "Rua do Sol, 200" carimbo .100; Recife "Rua da Aurora, 100" real .150, carimbo .030 (relógio −120 ms); vetores `{SP:2, Rec:0}` × `{SP:1, Rec:1}`. O widget `conflito` abre em −120 ms e LWW.
- **Quiz:** 41 perguntas (6, 8, 8, 6, 7 e 6 por aula), com as contas conferidas contra o texto.

## Pontos em que o texto decide além do brief
- **Dois atrasos no widget `commit`** (Rio e Recife) e **`remote_apply` com atraso alto** (o commit espera o atraso inteiro): ver decisões 7 e 8 do blueprint.
- **`FIRST 2 (rio, recife)`** para esperar as duas réplicas: citado como configuração, sem saída rodada.
- **Endereço do ECST (aula 4)** é de "mais tarde", para não se confundir com o conflito da aula 2: o brief usa os mesmos dois endereços nos dois casos.
- **Campos achatados pelo `unwrap`** (`__op` e similares) não são citados: o brief só confirma o nome do tópico, o `before` com a chave e o `op`.
- **Quórum no PostgreSQL (widget `quorum`):** o texto avisa que o streaming não vota a cada leitura e que a conta é a do módulo 3.

## Pendências
- Figuras `replicas-3d` e `fluxo-dados-3d` (marcadores no MDX): alinhar os rótulos dos botões nos "Faça agora" e trocar os marcadores `FIG:` por `<Figure3D>` (com o import no topo de cada MDX, junto dos outros).
- Pôster da home: o card aponta para `labs/replicacao/replicas-3d-previa.webp`, que a figura ainda vai gerar. `package.json` (`build:3d`) precisa ganhar as duas figuras.
- Constantes novas (brief) ainda não registradas em `historia-mestre.md`.
- Teste de tela em 360 px (página e widgets) e screenshots em 1280 px e no tema claro; do quiz só foi conferido o carregamento do banco.
