# Judge do módulo 18: CQRS

Passes feitos sobre as 10 aulas, os 7 widgets, o glossário (34 fichas) e o quiz (50 perguntas), seguindo ESCRITA.md, PREMISSAS.md e a skill writing-prose-like-a-human. O blueprint está em `cqrs-blueprint.md`.

## 1. Voz de IA
- Busca por "crucial", "vale ressaltar", "além disso", "em suma", "fundamental", "não é só X, é Y", "robusto", "poderoso", "essencial" e travessões: **1 ocorrência** de "Além disso" (um flashcard da aula 8), trocada por "E a transação aberta segura locks". Os `–` que restam são faixas numéricas ("1–4", "5–8").
- **Corrigido:** "Na próxima aula veremos como isso acontece" (aula 7) virou "A aula 8 mostra como isso acontece. Suponha que…", porque ESCRITA.md manda usar "Falta saber…" e não anunciar a aula.
- Sem resumo no fim da seção, sem lista de três itens forçada, sem rótulo em negrito repetido. Os "Por que importa" têm 4 itens, cada um com um fato (números do brief).

## 2. Cadência e encadeamento (checklist de ESCRITA.md)
- **Primeira e última frase.** Cada aula abre com ponte pelo problema aberto na anterior e fecha com "Falta saber…"; a aula 1 liga com o fim do módulo 17 (a tela "meus pedidos" lendo da mesma tabela, o 1055 sumindo por 800 ms) e a 10 puxa o módulo 19 (Saga, a compensação deixada em aberto no módulo 6). Lendo só pontes e ganchos a história se conta (ver o blueprint).
- **Corrigido:** o gancho da aula 7 dizia "a aula acabou de mostrar o que acontece quando o evento se perde", o que repetia a aula 8; agora diz que o verificador "existe porque às vezes ele não sai".
- Passos de "Como funciona" com no máximo 5 itens, na ordem em que acontecem e referindo-se uns aos outros ("Falha 1… Falha 2… A conta…"); a palavra técnica entra depois do problema (a "escrita dupla" só depois de o comando fazer as duas coisas).
- Termos repetidos de propósito, sem sinônimos: "modelo de leitura", "modelo de escrita", "projetor", "escrita dupla", "pelo menos uma vez".

## 3. Termos e números contra o brief
Conferidos (aulas, widgets, quiz, glossário e flashcards dizem o mesmo): pedido 1056 (114,80; gato 20 → 19, caneca 36 → 35; `e-1801` a `e-1805`; `LA123456791BR`), `PedidoCriado` 336 B (*notification* 72 B), documento da Lena 1.787 B (223 B por pedido, 253 B o 1056, 3,35 GB), consulta da tela 0,23 a 0,31 ms, relatório ~235 ms (238,8 · 240,7 · 227,6), *view* 0,021 ms (~11.000×), `REFRESH` 401 ms e `CONCURRENTLY` 340 ms, bloqueio 2.285 ms × 12 ms, réplica cancelada aos 3,16 s (padrão de 30 s), ~74 ms de atraso, 120 eventos/s × 100/s (12.000 eventos = 120 s; 3 instâncias a 40%), parada de 24.000 eventos drenando em 400 s, 200 milhões de eventos em 2 h 47 min, 99,6006% × 99,9% (172,5 × 43,2 min/mês), 108 pedidos por hora a 0,1% × 30/s, WAL 359,6 · 1.232,7 · 2.735,8 · 1.916,8 B (7,6× e 5,3×; 10,8 KB/s, 82,1 KB/s e 57,5 KB/s; 38,8, 295,5 e 207 MB/h), `SKIP LOCKED` 1–4 e 5–8, poll de 2 s, lote de 100 e 5 tentativas.
- Os tamanhos de JSON foram recontados em Python (compacto, UTF-8): 336 B, 72 B, 253 B e 1.787 B batem exatamente. O documento de 8 pedidos do widget foi montado até fechar em 1.787 B; só os itens e totais de 1042 a 1055 vêm da história (o 1044 é inventado), e o widget avisa.
- Cálculos derivados que o brief não traz, marcados como estimativa: 340 ms × 166,7 ≈ 57 s (`CONCURRENTLY` em 50 milhões), a taxa de 37,0 KB/s com 2 `INSERT`, 1.232,7 ÷ 359,6 = 3,4×, e o WAL por evento para 1, 3 e 4 eventos no widget da outbox (linear por evento; só 2 eventos foram medidos).

## 4. Exatidão técnica e o que é lido × medido × exemplo
- Tudo o que se diz do laboratório do autor está marcado como **lido no código, não executado** (aulas 5, 8, 9 e 10). Os trechos importados (`CodeLab`) são os arquivos originais sem alteração, com os números de linha do original; as linhas citadas no texto (51, 78, 79, 81, 85; 66 a 72 e 109 a 123; 99 a 107, 138 e 154) foram conferidas contra o arquivo.
- **Achado extra, lido no código:** o `SELECT` do relay do laboratório (`outbox_relay.go`, linhas 99 a 107) **não** usa `FOR UPDATE SKIP LOCKED`; dois relays pegariam os mesmos eventos. O brief usa o `SKIP LOCKED` como o conserto medido (1–4 e 5–8); a aula 10 diz as duas coisas.
- Os tempos do CDC e do Kafka (30, 10, 20 e 10 ms), a taxa de 0,1% e o mapping do Elasticsearch estão rotulados como exemplo.
- As 10 correções ao artigo estão em `docs/fontes/cqrs.md` e avisadas em cada aula, no "Correção ao artigo-base" do Aprofundar.

## 5. Pendências para o maestro
- Figuras `cqrs-3d` e `escrita-evento-3d`: os marcadores `{/* FIG:cqrs mode=… */}` (aulas 1 a 7: `dois-modelos`, `dois-modelos`, `view`, `replica`, `eventual`, `documento`, `distribuido`) e `{/* FIG:escrita mode=… */}` (aulas 8 a 10: `dual-write`, `cdc`, `outbox`) estão no lugar do `<Figure3D>`; a import do `Figure3D` já está em cada MDX. Os modes `falha-dual` e `relay-duplicado` ficam no "Faça agora" das aulas 8 e 10 como o botão a apertar.
- Alinhar os nomes dos botões do "Faça agora" (Dois modelos, View, Réplica, Eventual, Documento, Distribuído, Dual-write, Falha do dual-write, CDC, Outbox, Relay duplicado) com os do painel das figuras.
- Poster da home: `labs/cqrs/cqrs-3d-previa.webp` ainda não existe (o card mostra imagem quebrada até a figura entrar).
- Texto do card da home diz "quiz de 50 perguntas": bate com `questions.js` (50).
