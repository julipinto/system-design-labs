# Judge: módulo 23, Capacity Planning

Passes feitos sobre as 9 aulas (leitura do texto, `grep` e conferência com o brief e os widgets).

## 1. Voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "ademais", "não é só/apenas": **0 ocorrências**.
- Travessões: só como célula vazia de tabela. Sem resumo no fim de seção; as listas "Por que importa" têm 3 itens.
- Corrigido na revisão: "a utilização que o plano chama de joelho" (aula 2, usava o termo antes de ele existir) e o gancho da aula 4, que repetia "Falta saber" duas vezes.

## 2. Encadeamento
- Toda aula abre com uma ponte (`p.ponte`) que retoma a pergunta deixada pela anterior e fecha com um gancho (`p.gancho`) em forma de "Falta saber…".
- Lendo só a primeira e a última frase: o comercial pergunta (1) → por que a fila espera (2) → quanto cabe dentro (3) → onde dispara (4) → quanta carga (5) → quando chega (6) → quanto cresce (7) → o que a cadeia aguenta (8) → plano e custo (9) → módulo 24.
- A aula 1 liga com o fim do módulo 22 (publicar sem derrubar a loja; falta saber quanto ela aguenta na Black Friday de 2027).

## 3. Consistência de números (texto × widgets × quiz × glossário × brief)
Conferidos: tabela de ρ (100 · 125 · 167 · 200 · 250 · 333 · 500 · 1.000 · 5.000 ms), P–K (150 · 175 · 250 · 550), Little (75 · 127,5 · 150 · +100%), L(alvo) 4 e pool 50 → 150 (36 · 144 · 0,75 s · 0,25 s), custo do ponto, mix (13,5 ms · 74,1 · 19 · 24), rajada (64 · 640 ms), banda (105 · 156 · 171 Mbit/s), perfis (81,5 · 1,15 · 1,45 · 58 · 7,9× · 11×), projeção (113 · 28,7% · 750 · 824 · 950 · 1.140 · 75% · 95% · 53,6% · 67,9% · 81,4%), cenários 45 · 200 · 300, cadeia (40 · 90 · 250 · 300; 120/150 = 80%; 26,7%), lag (1.152.000 · 10.017 s ≈ 2,8 h), plano (17 · 41 · 9 vCPU; 984 × 344 = 35%; 980 · 210; 1.867 · 2.333). O widget da cadeia reproduz 40 → 90 → 250 → 300 e o lag; o de projeção, 750 · 824 · 950 · 1.140 e o 44,5 ≈ 45.

## 4. Pontos que ficaram para o maestro
- Os "Faça agora" usam nomes de cenário genéricos ("Fila", "Little", "Joelho", "Carga", "Perfis", "Projeção", "Cadeia", "Plano"); alinhar com os botões reais.
- Aula 5 usa a figura `bf` no mode `perfis`, onde o brief também cita o mix de 5% e a rajada de 10 ms; se o mode não mostrar o mix, o "Faça agora" precisa mudar.
