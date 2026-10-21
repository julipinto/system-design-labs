# Blueprint: módulo 24, Testes de Carga e Estresse

**Fio condutor (1 frase):** o plano de 300 pedidos por segundo é uma hipótese, e só vira conhecimento quando um teste com pergunta, meta e gerador honesto o refuta: do smoke ao breakpoint, do pré-teste ao relatório, até achar o que o teste não via.

Personagens e números: o `mkt-01` (40% do mix, shard quente), os pedidos sintéticos do k6, "hoje" (36/s), plano (~250/s) e plano 2 (~260/s). Tudo vem do brief; nada foi acrescentado.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Importância dos testes de carga** · plano sem teste é hipótese; simulador, metas, script, smoke. Ponte: módulo 23. *Deixa:* testar o esperado é testar o estresse?
2. **Testes de carga vs. estresse** · esperado × adverso; aberto × fechado (20 VUs 0% × 54/s 52%); Little. *Deixa:* a menor carga que prova que o teste roda?
3. **Smoke tests** · 61 requisições, código 99, cliente único engana. *Deixa:* e a carga esperada, por horas?
4. **Teste de média** · 157,5 ms × M/M/1 259; 125/s passa e o pico é outro. *Deixa:* e acima do esperado?
5. **Teste de estresse** · escada até 300/s; recuperação; goodput cai. *Deixa:* e se a carga sobe de uma vez?
6. **Teste de spike** · 47–65% de erros; HPA 1.200 pedidos; recuperação que é erro. *Deixa:* quanto cabe antes de quebrar?
7. **Teste de breakpoint** · três pontos; tabelas; rampa × degrau; abort acumulado; gerador e ambiente elástico. *Deixa:* o que perguntar antes de rodar?
8. **Respondendo a perguntas-chave** · nove perguntas, 680 VUs, mix, 14 → 19. *Deixa:* como saber que passou?
9. **Métricas e service levels** · p95, janela × acumulado, "400 não é < 400". *Deixa:* medir cada peça sozinha?
10. **Estratégias de pré-teste** · 1, 2, 3 pods; o elo muda; assíncrono. *Deixa:* juntar num documento?
11. **Assessment de performance** · relatório, cinco conclusões, cenário misto do pool. *Deixa:* módulo 25, Bulkhead.

## Decisões do Architect
- **Uma figura por aula** (`carga`, modes perfis, modelo, smoke, media, estresse, spike, breakpoint, jornada, breakpoint, pre, relatorio). Os "Faça agora" são genéricos; o maestro alinha os nomes dos botões. Aula 6 pede a pré-escala ligada; aula 9 pede janela × acumulado no mode `breakpoint`.
- **Widgets:** 2 tipos e modelo · 7 rampa · 8 little e jornada · 9 leitor · 10 pre. Aulas 1, 3, 4, 5, 6 e 11 só com a figura.
- **Código em `<pre>`:** `loja-sim.js` e `checkout.js` (aula 1) e `pool.js` (aula 11) por `?raw` de `public/labs/testes-de-carga/lab/`, imports juntos no topo.
- **Correções ao artigo** em cada Deep e juntas em `docs/fontes/testes-de-carga.md`.
- **Aproximações assumidas nos widgets** (avisadas na nota de cada um): modelo fechado por Little calibrado em 20 e 60 VUs; atraso da rampa de ~6,5 s calibrado nas duas rampas medidas.
