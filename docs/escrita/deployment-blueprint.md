# Blueprint do módulo 22: Modelos de Deployment

Fase Architect (writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md; o agente aprova o próprio blueprint. Brief: `docs/escrita/deployment-brief.md`.

## Fio condutor
Publicar o `pedidos` 2.5.0 numa terça-feira comum sem a Lena notar, e conseguir voltar: cada modelo de deployment troca uma parte do raio de explosão (fração do tráfego × tempo até perceber × custo por pedido errado), e o que decide é o que se mede, até chegar ao dado que não volta e a quem recebe primeiro.

## Tese de cada aula e a pergunta que deixa

| # | Aula | FIG | Tese | Pergunta que deixa |
|---|---|---|---|---|
| 1 | Deploy e rollback | rollout rollback | Publicar não é liberar, e voltar troca o código, não o dado (3.600 pedidos, R$ 54.000). Ponte: o fim do módulo 21 ("a causa mais comum de incidente é a mudança"). | Qual é o jeito mais simples de publicar? |
| 2 | Big Bang (Recreate) | rollout recreate | Parar tudo é o único modelo sem duas versões juntas e custa 40 s (80 s se não sobe). | Dá para trocar sem parar? |
| 3 | Rolling updates | rollout rolling | Troca pod por pod, nunca sem atender, mas só confere saúde: 90 s e o frete zero passa. | Como testar a versão antes de ela atender? |
| 4 | Blue/Green | rollout bluegreen | Dois ambientes e uma virada: testa sem cliente e volta em ~1 s; green frio forma fila. | O que o laboratório real faz? |
| 5 | Blue/Green, o exemplo | rollout bluegreen | O `blueGreen` do Argo linha a linha; pega 500, não pega 201 com frete 0; blue já saiu aos 60 s. | E se a gente não virar tudo, e sim uma fatia? |
| 6 | Canary releases | rollout canary | Uma fatia medida: o que decide é a métrica de negócio e a amostra (150 pedidos, 22%, 298). | O que o laboratório real faz? |
| 7 | Canary, o exemplo | rollout canary | initial/simple/time/analysis e as cinco lacunas; o `time` é rolling com mais passos (50 s). | E se a coluna mudou? |
| 8 | Migrations e versões de dados | liberacao migracao | O deploy volta, o dado não: expandir, publicar, backfill, ler, contrair; 8 medições de PostgreSQL 14; `mod 3` → `mod 4`. | Como testar a versão com tráfego real sem arriscar o dado? |
| 9 | Shadow traffic | liberacao shadow | A cópia com resposta descartada é o único modelo com 0% de cliente exposto; o comparador ensina; o `Rollback` não desfaz a cobrança (R$ 9.600). | O que o laboratório real faz? |
| 10 | Shadow, o exemplo | liberacao shadow | O `mirror` do laboratório (1%) e o que falta: comparador, amostra, capacidade; 100% em 1 réplica = 640%. | E se o risco é a regra que o cliente vê? |
| 11 | Feature flags | liberacao flag | A flag separa publicar de liberar; bucket por cliente (19 na Lena); padrão errado liga tudo. | Quem recebe primeiro, com clientes tão diferentes? |
| 12 | Sharding, bulkheads e ring deployments | liberacao aneis | Anéis limitam o raio da mudança; quem exercita o código importa mais que o tamanho (20 → 40 → 100%). | Quanto a loja aguenta na Black Friday? → módulo 23 |

## Decisões do Architect
- **Uma figura por aula.** Onde o brief cita dois modos (aulas 4 e 5, 6 e 7, 9 e 10) cada aula usa um marcador do mesmo modo; o "Faça agora" da segunda diz o que ajustar (janela do blue, análise de negócio, espelho a 100%). O maestro alinha os nomes dos botões.
- **Os modelos entram na ordem do raio de explosão:** primeiro o que expõe 100% (recreate, rolling), depois o que testa antes (blue/green), depois o que mede (canary), o que não expõe (shadow), o que separa (flag) e o que escolhe quem (anéis). O dado (aula 8) fica no meio porque os três primeiros modelos assumem que a coluna serve às duas versões.
- **Lab como código real.** As aulas 5, 7 e 10 usam `CodeLab` com os arquivos copiados sem alteração. O brief resume o `automated` como "o mesmo com `prePromotionAnalysis`": o arquivo real filtra pelo `chip-green` e deixa o `scaleDownDelaySeconds` comentado; a aula 5 diz o que o arquivo tem.
- **Widgets:** raio (aula 1, o mapa do módulo), rolling (3), poder estatístico (6), migration com `lock_timeout` (8), bucket (11) e anéis (12), todos com os números do brief.
- **A analogia da padaria** entra uma vez, no "Aprofundar" da aula 1, como ponte para a loja.
- **Correções ao artigo** avisadas nas aulas 2, 3, 4, 6, 8, 9, 11 e 12 e registradas em `docs/fontes/deployment.md`.
