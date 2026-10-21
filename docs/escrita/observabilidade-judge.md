# Judge: módulo 28, Observabilidade e Monitoramento

Revisão feita depois do Carpenter (as 10 aulas escritas seguindo o blueprint): leitura das aberturas e dos fechos, busca por vícios de voz de IA, conferência de números entre aulas, widgets, quiz e glossário, e os widgets rodados no navegador (360, 390 e 1280 px, claro e escuro; console sem erros; sem scroll lateral na página).

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "robusto", "é importante", "não é só/apenas" e travessão: **nenhuma ocorrência** ao final (os únicos "—" são células vazias nas tabelas dos widgets; "–" só em faixas como 60–75 s).
- Corrigido: "é importante distinguir" (aula 10) virou "é preciso distinguir"; "Em resumo, …" (aula 9) virou "Como diz o artigo, …".
- Corrigido: sete aberturas começavam com "Na aula passada…"; ficaram só na aula 3, e as outras retomam o problema pelo fato (as cinco linhas do 1063, a métrica/trace/log, o alerta por sintoma, a meta e o orçamento, os recursos, o RED).
- Corrigido: o fecho da aula 8 não dizia "Falta saber"; agora diz. Os fechos das aulas 6 e 7 começavam parecido ("A loja agora sabe…" e "Agora a loja tem…"); o da 7 foi reescrito.
- Mantido de propósito: a repetição de "sinal", "*trace*", "orçamento" e "*burn rate*" em vez de sinônimos.

## Passe 2: encadeamento
Lendo só a primeira e a última frase de cada aula, a história se conta: o MTTD de 30 s e o frete de 60 min → o painel verde e a pergunta nova da Lena → a métrica diz que → o log diz por quê → o *trace* diz onde → quando chamar alguém → quanto erro é aceitável → onde olhar nos recursos → no serviço → no que o usuário sente → "dá para refazer a loja do zero?" (módulo 29).

## Passe 3: consistência de números (aulas × widgets × quiz × glossário)
Conferido contra o brief, refazendo as contas em Python e rodando os widgets no navegador:
- **Histograma:** 400 · 975 · 992 · 992 · 1.000; p50 0,2935 · p95 0,4891 · p99 0,7647 · p99,9 2,3125 s; com o *bucket* em 2,0 o p99,9 vai a 1,875 s (valor real da janela 1,895 s); 269 × 2.000 do módulo 14.
- **Cardinalidade e log:** 2.016 · 22.176 · 33,3 bilhões; 4,5 KB por pedido, 32,5 KB/s → 2,81 GB/dia; 295 KB/s → 25,49 GB/dia (765 GB em 30 dias); ×10 → 254,9 GB/dia.
- **Trace:** 275 e 1.895 ms (soma das 8 durações); 1.640 ÷ 1.895 = 86,5%; 12,44 GB/dia e 124 MB; 1 − 0,99⁸ = 7,7%.
- **Alertas:** o widget dá A nunca · B 60 a 75 s · C 30 s · D 52 a 67 s (51,84 s de erro); com *breaker*, ~39 de 2.700, 14,4× · 0,36× · 4,3×, nenhum dispara e o `breaker_state` vira *ticket*.
- **Orçamento:** 12.960.000 · 12.960 · 43,2 min; 5.184 · 4.276,8 · 1.944 · 1.555,2; 20,83% · 4,97% · 0,06% (o texto arredonda 20,8%); 2% · 5% · 10%; os noves 432 · 216 · 43,2 · 21,6 · 4,32.
- **USE, RED e quatro sinais:** 67,5% = (9 × 64 + 99) ÷ 10; 64,6 de 86,4; Rate 9,9 · 4,5 · 3,6 · 12,0; 0,3 × 2 + 0,7 × 275 = 193,1.
- **Divergências notadas e resolvidas:** (a) o brief diz que o MTTD do alerta B é "60 a 75 s" e o do D "~52 a 67 s": o widget calcula as faixas varrendo a fase da avaliação (passos de 0,25 s), e mostra 60 a 75 e 52 a 67; a sonda (30 s) é fixa, alinhada ao início. (b) A conta da queda de SP (643,5 = 4,97%) mistura 9,9 pedidos/s da célula com um orçamento a 5/s de média; a aula 7 avisa que é simplificada. (c) A 20% de Recife (mix do módulo 22) é usado no frete 0,00, e a `celula-recife` tem 12% na Black Friday (módulo 26): cada aula diz de qual mix fala. (d) Corrigido na revisão: uma frase da aula 7 dizia que dois incidentes de 20,8% levariam à faixa de cautela; são três (62,4% queimados).

## Passe 4: o que o brief não confirma
- **Nenhum** Prometheus, OpenTelemetry ou Grafana foi rodado; as consultas são de forma. O histograma é uma janela definida; as durações dos *spans*, a `contagem-estoque` e os bytes por linha são exemplo (cada aula avisa).
- O brief pede "saídas reais de PostgreSQL registradas no brief": o brief **não registra nenhuma**, e o módulo não usa PostgreSQL. As contas vêm do `c28.py`.
- O `trace_id` do consumidor órfão no widget da cascata (`4b7d02c9…`) é inventado e rotulado "id de exemplo".
- O tempo da sonda sintética e o critério "a sonda falha se o erro é ≥ 50%" são do modelo do widget.

## Pendências para o maestro
- Marcadores `{/* FIG:… */}` (um por aula, 2 a 10): `sinais pilares`, `metricas`, `logs`, `traces`, `alerta`; `contrato orcamento`, `use`, `red`, `golden`. Nenhum `Figure3D` importado nos MDX; a aula 1 não tem figura. Os *modes* `sinais correlacao` e `contrato slo`/`burn` não têm marcador (os "Faça agora" das aulas 2, 5 e 7 mandam trocar de cenário na mesma figura; o `burn` ficou sem lugar).
- Figuras `sinais-3d` e `contrato-3d`, os pôsteres (a home aponta para `labs/observabilidade/sinais-3d-previa.webp`) e as linhas no `build:3d` do `package.json` (não editei).
- Alinhar os nomes dos botões nos "Faça agora" (genéricos: "cenário dos logs", "cenário do orçamento", "cenário do USE" etc.).
- Na tabela do alerta (aula 6) as colunas rolam dentro da caixa a 390 px (a página não rola).
