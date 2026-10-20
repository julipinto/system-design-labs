# Judge: módulo 6, Microsserviços, Monolitos e Domínios

Passes feitos sobre as 8 aulas em `src/content/microsservicos/` (2026-10-20).

## 1. Voz de IA
Busca por "crucial, fundamental, vale ressaltar, além disso, em suma, ademais, não é só, robusto, essencial" e por travessão: **0 ocorrências**. Sem resumo no fim de seção; as aulas fecham com o gancho "Falta saber…".

## 2. Ponte e gancho (ESCRITA.md 1 e 2)
- Todas abrem com o problema que a anterior deixou e fecham com "Falta saber…" (a 8 puxa o módulo 7, Load Balancers).
- Lendo só a primeira e a última frase: a loja é um programa só → defeitos do monolito → partir custa rede e consistência → onde cortar → peças do modelo → times moldam o sistema → mapa da compra → serviços com dono e eventos → quem escolhe a réplica.

## 3. Números e nomes contra o brief
Conferidos nas aulas, no quiz (51 perguntas) e nos widgets: pedido 1047 (79.90 + 15.00 = 94.90), estoque 3 → 2 (→ 1 com o duplicado), 180 ms, 200 ms (4 saltos × 5 ms), 8 vCPU, 80 contra 25 vCPU, 23:00 com 7 de 8 vCPU por 15 min, 120 ms → 2,4 s, limite de 2 s, deploy de 40 min, e-501…e-504 com os horários e payloads, `trace_id=7f3a…`. Vocabulário fixo respeitado ("microsserviço", "raio de explosão", "vizinho barulhento", "banco por serviço", "contexto delimitado", "linguagem ubíqua", "raiz do agregado", "monolito modular").

## 4. Problemas achados e corrigidos
- Chaves `{ }` dentro de `<code>` quebravam o MDX na aula 8: agora vão em `{`...`}`.
- Citações da DDD Reference (403) trocadas por Microsoft Learn e Evans Classification; frases de Evans reescritas com as palavras de Fowler.
- A aula 2 afirmava que Uber e Netflix migraram; só o Uber está confirmado, e o texto agora diz isso.
- A aula 2 dizia que o Istio mudou "por ficar mais simples"; o post só confirma a unificação do plano de controle.

## 5. Pendências
- "Faça agora" das aulas 1 a 8 são genéricos sobre a figura (pedido do brief); alinhar com os botões reais na integração.
- Marcadores `{/* FIG:… */}` ainda sem o componente de figura.
- Twitter e Netflix não verificados (403); o texto os trata como não confirmados.
- Gancho do módulo 5 fala de sharding e replicação (ver blueprint).
