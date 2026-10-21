# Blueprint: módulo 27, Single Point of Failure e Disaster Recovery

**Fio condutor (1 frase):** quando a região de São Paulo some às 20:40 da Black Friday, a loja só volta rápido se alguém já achou os pontos únicos de falha, duplicou o que dói, escolheu uma estratégia de DR pela conta (custo da falha × custo da estratégia) e mediu o resultado, sem esquecer que o próprio plano também tem SPoF e que o dado perdido na janela de lag volta a incomodar.

Personagens e números (todos do brief): a Bia (o 1061 perdido), o Davi (o 1061 reutilizado), a Lena (não percebe a queda), o `mkt-01`; queda às 20:40:00.150, MTTD 30 s, RTO 65 s, R$ 2.276.208 · 570.240 · 51.480 · 27.720, 12 elos e 5 SPoFs, 297 e 2.970 do split brain.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Single Point of Failure** · SPoF é componente sem caminho alternativo; reduzir raio, surpresa e tempo de volta; a ponte uma vez; modo degradado × parada total; o PSP-B; modo comum no `edge-loja`. Ponte: fim do módulo 26 (a região de SP inteira). *Deixa:* como achar os que ninguém desenhou?
2. **Identificando SPoFs** · fluxo feliz, 12 elos, 5 SPoFs, série e paralelo (98,8066 · 99,5003 · 99,9988%); estabilidade estática; SPoFs não técnicos; priorização; a auditoria envelhece. *Deixa:* como duplicar sem pagar o que não precisa?
3. **Redundância e failover** · stateless, ativa × passiva, o relógio (15 · 30 · 35 · 5 s), breaker × failover regional, split brain (297 · 2.970), fencing e quórum. *Deixa:* e quando é a região inteira?
4. **Disaster Recovery** · a linha do tempo de 65 s, a passiva que triplica a carga (3,2×), a escada de quatro estratégias, a conta que decide, metas por serviço, o DR que depende de SP (runbook, pipeline, hub) e o game day. *Deixa:* como saber se está melhorando?
5. **Métricas e KPIs de recuperação** · MTTD, MTTR, MTBF, RTO, RPO; as tabelas do artigo conferidas; RTO conta da interrupção; RPO em pedidos; o 1061, o webhook em quarentena, as três saídas e o id por célula. *Deixa:* como ver, em 30 s, o que acontece dentro da loja? → módulo 28.

## Decisões do Architect
- **Uma figura por aula** (o brief citava dois modes nas aulas 3, 4 e 5): aula 1 `spof ponte`, 2 `spof mapa`, 3 `spof failover` (o botão Redundância fica no "Faça agora"), 4 `desastre estrategias` (botão São Paulo cai no "Faça agora"), 5 `desastre rpo` (botão Métricas no "Faça agora"). Os "Faça agora" são genéricos; o maestro alinha os nomes dos botões.
- **Widgets:** aula 2 auditoria · 3 relógio e split brain · 4 passiva, estratégia e restore · 5 MTTD/MTTR/MTBF e RPO e lag. A aula 1 fica só com a figura.
- **Sem código de lab:** não há lab do autor; as contas e a saída do PostgreSQL vêm do brief. Nenhum `<pre>` com import.
- **Correções ao artigo** em cada Deep e juntas em `docs/fontes/disaster-recovery.md`.
- **Decomposição do RTO:** a promoção do banco (ttl + 5 = 35 s) corre desde a falha, em paralelo com detecção + pods; RTO = max(MTTD + pods, promoção) + mapa = 65 s. O widget do relógio usa essa regra.
- **Aproximações dos widgets** (avisadas na nota de cada um): soluço de rede de 20 s, pods por célula (3 pedidos/s por pod) e durações de nós e pods são exemplo.
