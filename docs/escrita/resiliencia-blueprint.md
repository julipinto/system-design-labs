# Blueprint: módulo 21, Patterns de Resiliência

**Fio condutor (1 frase):** quando o PSP passa de 180 ms para 8 s, a loja só continua vendendo se cada elo do caminho souber o que fazer com um vizinho lento, e as defesas se encadeiam na ordem em que o estrago aparece: medir, limitar o raio, ter cópias, tornar a repetição segura, desistir a tempo, repetir com freio, parar de chamar, trocar de caminho, desligar o que não é essencial, desacelerar quem manda, proteger o dado e isolar.

Personagens e números: Caio e o pedido 1058 (20:20:04, 71,70), PSP-A (8 s por 90 s) e PSP-B (p50 300 ms), o `pagamentos` (2 réplicas, 40/s, pool de 50, 30 pedidos/s). Tudo vem do brief; nada foi acrescentado.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Resiliência em arquitetura** · resiliência é continuar funcionando quando uma peça falha, e o módulo revisita o que o curso já mostrou. Ponte do módulo 20 (tudo supõe dependências que respondem) e os quatro fios soltos. *Deixa:* como dizer "ficamos em 99,9%" e provar?
2. **Métricas de disponibilidade** · por uso × por tempo, noves, série e paralelo, orçamento de erro, SLI com latência. *Deixa:* quanto um componente que cai leva junto?
3. **Blast radius** · o raio é o tanto da loja que para; 1/N só com carga uniforme (`shard-2` = 60%). *Deixa:* a defesa mais simples, ter mais de uma cópia: como elas sabem quem está vivo?
4. **Replicação, balanceamento e healthchecks** · réplicas atrás de um balanceador que sabe quem vive; 15 s, 960 e 225; o profundo ejeta todas. *Deixa:* e se a mesma chamada for repetida?
5. **Idempotência** · repetir só é seguro com chave (fios 1 e 4; tabela `idempotencia`). *Deixa:* por quanto tempo esperar antes de repetir?
6. **Timeouts** · o limite vem de percentil e de Little (1,67 s); prazo em cadeia; o 2 s do módulo 10 vira 1 s. *Deixa:* depois do timeout, vale tentar de novo?
7. **Estratégias de retry** · repetir sem freio vira o incidente (45.500; 27; 810/s); backoff, jitter, orçamento, prazo. *Deixa:* e se o PSP não voltar?
8. **Circuit breakers** · para de chamar, falha rápido e testa (237 × 3.000). *Deixa:* o que a Lena vê com o disjuntor aberto?
9. **Fallbacks** · outro caminho para o mesmo objetivo, que sacrifica algo; o proativo de 1%. *Deixa:* e quando não há fallback bom?
10. **Graceful degradation** · desligar de propósito o que não é essencial (rajada de 1.300 × 1.000; níveis 1.333 e 1.667). *Deixa:* e o excesso que já está dentro das filas?
11. **Backpressure emergencial** · o consumidor avisa o produtor (fila de 5.000 em 250 s; `429`; descartar). *Deixa:* e o banco, onde o excesso custa mais?
12. **Resiliência na camada de dados** · RTO 35 s, RPO 9 e 24, cache que sobrevive à origem, estouro de cache. *Deixa:* e se o dado ruim for só de uma fatia?
13. **Sharding e bulkheads** · isolar limita o raio (3,33 s × 1,67 s); sharding e bulkhead são eixos diferentes; lease como Deep. *Deixa:* a causa mais comum de incidente é a mudança: módulo 22, Deployment.

## Decisões do Architect
- **Uma figura por aula.** Aula 7 usa `chamadas jitter` (o brief cita `retry` e `jitter`; o "Faça agora" manda trocar para o cenário Retry para ver os 27). Aula 13 usa `isolamento bulkhead` (manda trocar para Shuffle). A aula 2 não tem figura (widget).
- **Widgets nas aulas:** 2 disponibilidade · 3 blast · 5 chave de idempotência · 6 Little e prazos · 7 tempestade e amplificação · 8 breaker · 9 fallback · 10 degradação · 11 fila · 13 bulkhead. As aulas 1, 4 e 12 ficam só com a figura.
- **"E se der errado" em toda aula**, com o número que não fecha. A rajada de 1.300 req/s é dita como rajada de segundos em todo lugar (aula 10, quiz, glossário, widget).
- **Correções ao artigo** dentro de cada Deep ("Correção ao artigo-base") e juntas em `docs/fontes/resiliencia.md`.
- **Arredondamento:** o widget mostra 4 casas (99,2018% e 99,6978%) onde o brief escreve 99,202% e 99,698%; o texto usa as 4 casas, para bater com o widget.
