# Conciliação dos módulos 9–27

Conferência da história entre BFF (9) e SPoF/Disaster Recovery (27), contra `historia-mestre.md`, os briefs e `conciliacao-6-9.md`. Correções pequenas, direto nos arquivos; `src/figures/` não foi tocado. `npm run build` passa. Sem commit.

## 1. Pontes
Lidas só as primeiras frases da aula 1 e os "Falta saber…" finais, a história se conta: 8 → 9 (porta única, mas a tela pede 4 coisas) → 10 (BFF com timeout e fallback, falta a rede cuidar disso) → 11 (a malha não vê dentro do `estoque`) → 12 (o último gato, a Bia leva o 1049, falta cobrar 88.90) → 13 (o `PedidoPago` do 1050 precisa chegar a 3 lugares) → 14 (o catálogo em 2 s, ninguém mede) → 15 (o banco do `pedidos` a 150/s) → 16 (o Z, 50 milhões de linhas) → 17 (cada shard é um servidor só) → 18 (a tela "meus pedidos") → 19 (a compensação do módulo 6) → 20 (o log da saga já é metade de event sourcing) → 21 (o PSP em 8 s) → 22 (a mudança como incidente) → 23 (quanto aguenta a Black Friday de 2027) → 24 (300/s nominais, ninguém mediu) → 25 (o relatório derruba o checkout) → 26 (a pilha única) → 27 (a região de SP inteira). Todos os 19 elos fecham (primeira frase da aula 1 retoma o gancho do anterior, e o gancho final puxa o próximo de verdade).

Um erro de referência dentro de um gancho:
- **21 → 22:** `resiliencia/aula-13` dizia "rolling, blue/green, canary e feature toggle (módulos 8, 9 e 10), que o módulo 22 reúne". Os módulos 8, 9 e 10 da loja são Gateway, BFF e Mesh (a numeração era a do curso do artigo). Tirei o parêntese: "…feature toggle, que o módulo 22, Deployment, reúne."

## 2. Números herdados

| Onde | O que mudou | Por quê |
|---|---|---|
| `deployment/aula-8` (passo "E se der errado", flashcard) e `public/labs/deployment/quiz/questions.js` (t8) | "os 6 pedidos da Lena (1042, 1044, 1047, 1048, 1051, 1054)" → "os 8 pedidos dela até aqui (…, 1055 e 1056)" | O módulo 18 (`cqrs/aula-6`) conta 8 pedidos da Lena no documento `meus_pedidos` (1042, 1044, 1047, 1048, 1051, 1054, 1055, 1056), todos no `shard-1`. O módulo 22 vem depois e omitia o 1055 e o 1056. |
| `cqrs/aula-8` (Falha 1) e `public/labs/cqrs/quiz/questions.js` (t8) | "o módulo 17 já mostrou o estoque ficando em 36 em vez de 35" → "…o mesmo com a caneca do 1055: 37 em vez de 36" | No módulo 17 (`replicacao/aula-5`) o 1055 deixa a caneca em 37 quando deveria ser 36; o 36 → 35 é do 1056, deste módulo. A figura `escrita-3d` tem a frase "a caneca fica em 36 em vez de 35, como o módulo 17 já tinha mostrado", que descreve o 1056 e fala do mecanismo, então bate com o texto novo (ver "Figura × texto"). |
| `src/scripts/cqrs/widgets.js` (documento `meus_pedidos:lena-77`) | Datas de exemplo: 1047 `2026-11-05T09:40` → `2026-06-18T14:02:10`; 1051 `2026-11-20T19:40` → `2026-11-20T14:19:00`; 1044 `2026-10-18` → `2026-04-18`; 1042 `2026-10-02` → `2026-03-02` | O 1047 nasce em 18/06/2026 (módulo 20, `e-501` a 14:02:10) e o 1051 é pago às 14:20:03 (módulo 13). Os pedidos têm de crescer em data com o número. Mesmo comprimento de string: os 1.787 B e 223 B por pedido não mudam. O widget já avisa que as datas são de exemplo. |
| `testes-de-carga/aula-1` (checklist e flashcard) e `public/labs/testes-de-carga/quiz` (t1) | "metas p95 ≤ 800 ms e erros ≤ 0,1%, as do módulo 14" → "as do checkout no módulo 23 (o p95 de 300 ms do módulo 14 era a meta do catálogo)" | O módulo 14 fixa p95 ≤ 300 ms; o 800 ms do checkout vem da ficha do módulo 23 (`capacity-planning/aula-9`: 300 ms catálogo, 800 ms checkout). |
| `deployment/aula-4` | "Pela Lei de Little (módulo 23)" → "(módulo 14)" | A lei é ensinada no módulo 14 (`performance/aula-3`, 640 × 0,135 = 86,4) e só retomada no 23; o 22 vem antes dele. |
| `scale-cube/aula-1` e `aula-6` | "o gateway e 2 BFFs (9 deployments)" → "o gateway e os BFFs (com `bff-app` e `bff-web`, 7 + 2 = 9 deployments)" | A conta de 9 é 7 serviços + `bff-app` + `bff-web` (brief do cubo e do mesh: 30 pods = 10+3+3+2+2+1+1+4+4); "gateway e 2 BFFs" soma 10. |
| `cell-based/aula-1` (após o 1060) | Frase nova: "Os números de pedido da história são didáticos: o 1060 é da noite da Black Friday, e o 1059 do módulo 22 é de uma terça depois dela." | O 1058 e o 1060 são da noite de 27/11/2026 (20:20 e 20:25), mas o 1059 do módulo 22 é uma terça depois da Black Friday. A convenção estava só na `historia-mestre.md`; o leitor via os números fora de ordem. |

Conferido e sem divergência:
- **Pedidos 1047 a 1062:** dono, produto, valor e frete batem com a tabela da `historia-mestre.md` (script que varre todos os valores com duas casas ao lado de cada número de pedido: nenhum fora do conjunto válido). SP 9,00, Rio 12,00, Recife 15,00 em todas as menções. Datas: Black Friday 27/11/2026 (1054, 1055 e 1056, incluindo a saída do CDC no módulo 17).
- **Estoque:** caneca 40 → 38 (1051) → 37 (1053) → 36 (1055) → 35 (1056) → 32 (1058) → 31 (a Bia, 1061); gato 3 → 2 (1047) → 1 (1048) → 0 (1049) → 20 (reposição) → 19 (1056) → 17 (1060) → 16 (1061). Alocação das células 6·3·2·8 = 19.
- **IPs e nomes:** `lb-loja` 203.0.113.10, réplicas 10.0.1.11–14, IPs dos clientes (só no módulo 7); `gw-loja`, `lb-loja`, `edge-loja`, `bff-app/web/voz`, `pg-sp/rio/recife`, `celula-*`, `PSP-A/B`: nenhuma variante (`lb-catalogo`, `gateway-loja`…) nos módulos 9–27.
- **Timeouts:** 2 s do módulo 10 (malha, `concorrencia/aula-6`, `comunicacao-sincrona/aula-1`) e 1 s do 21 (`resiliencia/aula-6` explica a mudança com Little: 50 ÷ 30 = 1,67 s). Módulos 22–27 só usam 1 s para o PSP. O "2 s do `lb-loja`" (módulos 14, 23) é outro timeout (o do balanceador) e continua certo.
- **Picos:** 640 medido / 950 projetado (módulo 14) / 1.300 de rajada (módulo 21, dito como rajada de segundos nos módulos 21 e 23).
- **Clientes e shards:** `mod 3` com murmur3: davi-12 → 0, lena-77 e bia-31 → 1, caio-58 e mkt-01 → 2 (módulos 15, 16, 22); mapa de células lena → recife, bia e davi → sp, caio → rio, mkt-01 → mkt. Anel de hash e slots do módulo 16 dão atribuições próprias (outro esquema, declarado como tal).
- **Células e DR:** 33/15/12/40%, RPO por célula 2,97 · 1,35 · 2,88 · 9,6; RTO 65 s = MTTD 30 s + MTTR 35 s (o "RTO 35 s" do módulo 17 conta ttl 30 s + 5 s e a aula 5 do módulo 27 explica a diferença); 1061 da Bia perdido, 1061 do Davi, 1062 recuperado; webhook de `c-7733` na quarentena.
- **Referências "módulo N":** todas as menções a módulos futuros nos módulos 9–27 são ganchos intencionais; as menções a módulos anteriores apontam para o assunto certo (exceto as corrigidas acima).

## 3. Vocabulário
Sem variantes erradas entre briefs: "raio de explosão" / "blast radius", `bulkhead` (com "antepara" só no módulo 25, como imagem do navio), "shard quente" / "hot partition" (termo do artigo, citado), `split brain`, `warm standby`, `pilot light`, "ativo-ativo" / "ativo-passivo", `failover`, DLQ, `circuit breaker` / "disjuntor", "veneno" / *poison pill*, `outbox`, `snapshot`, "modelo de leitura". Nada a corrigir.

## 4. Quiz e glossário
- Os glossários de 9–27 foram varridos com um script: todo número que aparece nos 19 glossários também aparece no texto ou nos widgets do módulo (única exceção, 0,9 e 1,1 da tolerância do HPA, vem da fórmula do artigo, aula 5 de `performance`). Nenhum glossário citava os trechos editados.
- Quizzes ajustados junto com o texto: `cqrs` (t8), `deployment` (t8), `testes-de-carga` (t1). Os demais números dos quizzes que não aparecem no texto são derivados ou alternativas erradas (conferidos por amostragem: saga, cqrs, resiliência).

## Figura × texto
- `src/figures/escrita-3d/fig3d.js:248` diz "a caneca fica em 36 em vez de 35, como o módulo 17 já tinha mostrado". Está certo para o 1056; o texto agora diz que o módulo 17 mostrou o mesmo com o 1055 (37 em vez de 36). Sem conflito; só convém, se a figura for refeita, trocar o fim por "como o módulo 17 já tinha mostrado com o 1055".
- Nenhum outro caso em que figura e texto discordem nos pontos tocados.

## Pendências (decisão da Juliana)
1. **Contagem de pods e deployments.** Os "9 deployments / 30 pods" (módulos 10 e 15) têm só os 7 serviços e `bff-app`/`bff-web`; não contam `recomendacoes`, `clientes`, `gw-loja` nem o `bff-voz`, que o módulo 9 apresenta como "novo canal". Mantive o número porque é o dos briefs 10 e 15 e muda custos e contas do mesh; se o `bff-voz` for um deployment de verdade, o 30 e o 9 sobem.
2. **`e-901`…`e-904`.** A `historia-mestre.md` cita esses eventos do 1051 no tópico `pedidos`; o texto do módulo 13 usa só partições e offsets (`p0 @ 48213`). Não há conflito no texto; o mestre pode ser ajustado.
3. **Versão 2.6.0.** No módulo 22 a `pedidos` 2.6.0 é a versão com a "bomba" `mod 3 → mod 4`; no módulo 26 é a versão que o *poison pill* derruba (`@2.6.0`). Não há contradição (a bomba só vale se a 2.6.0 sair sem o expandir/contrair), mas quem ler os dois pode estranhar.
4. **Figura `gateway-3d`** ainda diz `lb-catalogo` (pendência da conciliação 6–9, fora do escopo desta passada).
5. Verificação visual (390/1280 px, claro/escuro) não foi refeita: as edições são texto curto dentro de itens existentes e três datas num JSON de exemplo.
