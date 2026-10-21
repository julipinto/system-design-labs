# Blueprint: módulo 23, Capacity Planning

**Fio condutor (1 frase):** o comercial pergunta se a Black Friday de 2027 aguenta, e a resposta é um plano que cresce na ordem em que a dúvida aparece: por que a fila espera, quanto trabalho cabe dentro, onde a resposta dispara, quanta carga há, quando ela chega, quanto vai crescer, o que a cadeia inteira aguenta e o que isso custa.

Personagens e números: o comercial (a pergunta), o `pagamentos` (S = 50 ms, 20/s por pod), o `mkt-01` (o shard quente), a série 300 · 410 · 520 · 640, os cenários 750 · 950 · 1.140 e 45 · 200 · 300, o plano de 41 vCPU. Tudo vem do brief; nada foi acrescentado, exceto os rótulos dos widgets.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Introdução ao capacity planning** · capacity planning transforma o medido em limites e em plano; tabela herdada, 3 cenários, 8 passos. *Deixa:* por que 70% é saudável e 95% não?
2. **Teoria das filas** · λ, μ, ρ e variabilidade; a espera depende de ρ e do CV (100 · 200 · 500 ms; 150 · 550 ms). *Deixa:* quanto trabalho há dentro do sistema?
3. **Lei de Little e o ponto saudável** · L = λ × W e o L(alvo) = 4; pool 50 → 150. *Deixa:* onde a resposta dispara?
4. **A curva do joelho** · o custo do ponto (2 · 5,6 · 12,5 · 50 · 200 ms); o joelho é escolha de limite. *Deixa:* quanta carga há de verdade?
5. **Modelagem de carga** · TPS, concorrência, payload; a média esconde mix, rajada e cauda (14 → 19; 640 ms). *Deixa:* como a carga se distribui no tempo?
6. **Perfis de tráfego** · dia, semana, ano e a janela de agregação (640 · 400 · 58). *Deixa:* e ano que vem?
7. **Projeção de crescimento** · história (750 · 824) e evento (950); faixa e custo do erro. *Deixa:* quanto o fluxo inteiro aguenta?
8. **Capacidade end to end** · o mínimo da cadeia e o gargalo que anda (40 → 90 → 250 → 300); o lag do `entregas`. *Deixa:* juntar tudo num plano com custo.
9. **Planejamento de capacidade** · os 8 passos, a ficha de limites, 41 vCPU e 344 × 984 réplica-horas. *Deixa:* quanto aguenta de verdade? Módulo 24.

## Decisões do Architect
- **Uma figura por aula.** Marcadores `{/* FIG:ponto mode=fila|little|joelho */}` (aulas 1 a 4; 1 e 2 usam `fila`) e `{/* FIG:bf mode=perfis|projecao|cadeia|plano */}` (5 a 9; 5 e 6 usam `perfis`). Os "Faça agora" são genéricos (nomes de cenário); o maestro alinha os botões.
- **Widgets:** 2 fila · 3 little · 4 joelho · 5 mix (mix, rajada e banda) · 6 perfis · 7 projecao · 8 cadeia · 9 custo (a "cadeia e custo" do brief, dividida em dois). A aula 1 fica só com tabelas.
- **Agregação do widget de perfis:** três janelas (1 minuto 640 · 1 dia 400 · 1 mês 58), as únicas que o brief dá para a Black Friday; a de 1 h do brief ficou de fora porque não há número canônico.
- **Custo do ponto:** a derivada (S ÷ (1 − ρ)² × 1%), como no brief (5,6 ms a 70%), não a diferença discreta (5,7).
- **Evento arredondado:** 824 × 1,15 = 947,5 vira 950 (múltiplo de 10), e a margem 1.140.
- **Rajada de 1.300 req/s** (módulo 21) tratada como rajada de segundos na aula 6.
- **"E se der errado" em toda aula** e as correções ao artigo dentro dos Deep ("Correção ao artigo-base") e em `docs/fontes/capacity-planning.md`.
- **Link do Gunther:** perfdynamics.com deu 403 em 21/10/2026; entra a Wikipédia (Neil J. Gunther).
