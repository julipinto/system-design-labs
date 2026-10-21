# Blueprint: módulo 25, Bulkhead Pattern

**Fio condutor (1 frase):** o relatório das 23:00 e o pedido da Lena dividem um pool de 20 conexões, então a loja só deixa de ser derrubada por quem não tem culpa quando divide o recurso finito em compartimentos, e cada divisão (lógica ou física, por função ou por cliente) troca raio de explosão por capacidade ociosa.

Personagens e números: a Lena (o status do pedido 1054), o relatório das 23:00 (módulo 6), o `mkt-01` (o robô e o tenant), o `pedidos` com o pool de 20 conexões, o `catalogo`, o `estoque` global. Tudo vem do brief; nada foi acrescentado, e **nenhum pedido novo** foi criado.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Introdução ao Bulkhead** · bulkhead não evita a falha, limita até onde ela chega. Ponte do módulo 24 (1 em 3 pedidos e 1 em 10 consultas com `503`). O pool de 20, Little (0,2 + 0,2 + 40), o k6 real (66,8% × 100%) e o que o bulkhead não é. *E se der errado:* o batch paga (1 consulta/s; 10 → 100 min). *Deixa:* quais recursos dividir?
2. **Bulkheads lógicos e físicos** · lógico divide execução (barato), físico divide infraestrutura (forte); dimensionar com Little (4 + 4) e pagar em multiplexação (Erlang C 18,4% → 42,9%; +25%). *E se der errado:* lógico em nó compartilhado (*shared fate*). *Deixa:* quanto estrago cada compartimento deixa passar?
3. **Bulkheads e blast radius** · o raio é a fração do tráfego, 1 ÷ N só vale com tráfego uniforme (60% → 40%; shuffle 2,2%; 10⁻⁹; 0,10% → 4,88%). *E se der errado:* o shard quente e o `estoque` global (100%). *Deixa:* que tipo de divisão é essa?
4. **Bulkhead e sharding funcional e operacional** · funcional por função (eixo Y), operacional por quanto e de quem (eixo Z); isolar o caminho todo. Newsletter no tópico errado (417 s), lanes 12 · 6 · 2. *E se der errado:* o shard "isolado" que divide o `estoque` (canal oculto). *Deixa:* como os seis desenhos se combinam?
5. **Arquiteturas de referência** · seis desenhos respondem a seis perguntas e se combinam; vizinho barulhento (50% × 10%). *E se der errado:* bulkhead demais (12 compartimentos, 24 pods onde 10 bastavam). *Deixa:* e se a divisão fosse a pilha inteira? → módulo 26, Cell-Based.

## Decisões do Architect
- **Uma figura por aula** (`anteparas`, a do Opus). O brief cita dois modes nas aulas 1, 2 e 4: a aula 1 usa `pool` (o "Faça agora" manda trocar para `casco` para ver o navio), a aula 2 usa `fisico` (manda voltar para `pool` para rever o 4 + 4) e a aula 4 usa `funcional` (manda trocar para `operacional`). As aulas 3 e 5 usam `raio` e `referencia`. Os nomes dos botões estão genéricos; o maestro alinha.
- **O navio entra uma vez**, na aula 1 (passo 1 de "Como funciona"), como ponte para o pool.
- **Widgets nas aulas:** 1 pool e Little + compartilhado × separado (k6) · 2 multiplexação (Erlang C) · 3 raio de explosão · 4 lanes de prioridade · 5 vizinho barulhento.
- **O lab real** (`loja-pool.js` e `pool.js`) entra em `<pre>` na aula 1 com `CodeLab` e import `?raw` de `public/labs/bulkhead/lab/` (imports juntos no topo do MDX). O k6 e as saídas são reais; o servidor é um modelo e a aula avisa.
- **O widget do k6** tem as duas colunas, o modelo do navegador e o k6 real, e avisa que a divisão das perdas entre checkout e status difere (o k6 chega em intervalos regulares); a direção é a mesma.
- **"E se der errado" em toda aula**, com o número que não fecha. A aula 2 diz que o vazamento de memória não foi rodado no Kubernetes.
- **Correções ao artigo** dentro de cada Deep e juntas em `docs/fontes/bulkhead.md` (10).
- **Arredondamento:** 33,3% e 66,7% (o artigo escreve 33% e 66%); Erlang C com uma casa (18,4%; 2,6 ms; 17,9 ms); "igualar a chance de esperar" tem tolerância de 5% (5 por pool dão 19,0% contra 18,4%).
