# Judge do módulo 20: Event Sourcing

Passes feitos sobre as 11 aulas, os 7 widgets, o glossário (37 fichas) e o quiz (50 perguntas), seguindo ESCRITA.md, PREMISSAS.md e a skill writing-prose-like-a-human. Blueprint em `event-sourcing-blueprint.md`.

## 1. Voz de IA
- Busca por "crucial", "vale ressaltar", "além disso", "em suma", "fundamental", "robusto", "poderoso", "essencial" e "não é só X, é Y": sem ocorrência no texto próprio (a palavra "fundamental" aparece só como citação do artigo, na correção da aula 10). Sem travessões longos nas aulas. Sem resumo no fim das seções.
- "Por que importa" com 4 itens, cada um com um fato do brief; listas de "Como funciona" com no máximo 5 passos.

## 2. Cadência e encadeamento
- Cada aula abre com ponte pelo problema aberto na anterior (a 1 liga com o log de saga do módulo 19 e o 1047 do módulo 6) e fecha com "Falta saber…" (a 11 puxa o módulo 21, Resiliência). Lendo só pontes e ganchos a história se conta (ver o blueprint).
- Termos repetidos de propósito: "stream", "versão esperada", "dobrar", "rehidratar", "modelo de leitura", "pelo menos uma vez", "idempotente".

## 3. Números contra o brief
Conferidos entre aulas, widgets, quiz, glossário e flashcards: stream `pedido-1047` (v1 `e-501`, v2 `e-502`, v3 `e-504`, v4 `e-505` em 19/06 10:40), `estoque-GATO-042` (v1 +3, v2 `e-503`, 3 → 2), 263 B por evento e 263 MB por milhão, 52,6 GB × 140 GB, 1.935 · 1.801 · 1.770 ms (~555 mil/s), 13,1 · 19,6 · 12,1 ms (~140×, 1.000× menos eventos), 2 h 47 min (10.000 s), 6 eventos/s, 86.400 em 4 h, 1,9 dia, erros `Concurrency conflict: expected version 2, but current is 4`, `eventos_evento_id_key` e `eventos_stream_versao` (`Key (stream_id, versao)=(estoque-GATO-042, 3)`), `Lock / transactionid`, 3 → 2 → 1. Contas refeitas: 200 M ÷ 555 mil/s ≈ 6 min; 120 eventos/s ≈ 10,4 M/dia e 72,6 M em 7 dias (pior caso, marcado como estimativa); 1,8 s ÷ ~13 ms = ~138× (arredondado para ~140×).
- **Divergência do brief, corrigida:** a chegada `e-501, e-504, e-502, e-502, e-505` faria o "último a chegar vence" terminar em `entregue`. As aulas, o widget e o quiz usam `e-501, e-504, e-505, e-502, e-502` (resultado `pago`, v2, como no brief). A figura `replay versao` deve usar a mesma ordem.

## 4. Exatidão técnica: lido × medido × estimativa
- Laboratório do autor: tudo marcado "lido, não executado"; os trechos de `CodeLab` são os arquivos originais, e as linhas citadas no texto foram conferidas contra eles.
- Achados extras de leitura, avisados como tais (aulas 4 e 7): `isVersionConflict` compara a mensagem por igualdade exata; filtro de data do `rehydratate` que exclui o `ContaCriada` faz o laço pular as movimentações.
- Estimativas marcadas: o widget de conflito (1 − e^(−λt)), o tempo com snapshot fora do caso medido (~11 ms fixos + cauda), o storage escalado de forma linear, as fotos por política. Dado pessoal: só aviso, sem fonte.

## 5. Verificação técnica
`npm run build` sem erros (21 páginas); 390 px sem scroll lateral, console limpo, 7 widgets montam e respondem (cliques conferidos com `drive.mjs`); links das Fontes: 18 de 18 com 200.
