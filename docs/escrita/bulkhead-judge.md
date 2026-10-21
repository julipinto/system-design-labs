# Judge: módulo 25, Bulkhead Pattern

Revisão feita depois do Carpenter (as 5 aulas escritas seguindo o blueprint): leitura das aberturas e dos fechos, busca por vícios de voz de IA, conferência de números entre aulas, widgets, quiz e glossário, e os widgets rodados no navegador (390 px, claro e escuro).

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "não é só/apenas", "robusto", "é importante" e travessão: **nenhuma ocorrência** nas aulas, no glossário, no quiz e nos widgets (os únicos travessões são o "—" de célula vazia nas tabelas dos widgets).
- Corrigido: os widgets citavam "Brief:" nas notas; passou para "Números do módulo:".
- Corrigido: o passo "Combinados" da aula 5 ficou como o último da lista, ligado ao anterior (hashing → tenants → combinação).
- Mantido de propósito: "A parede não impede o furo: impede o naufrágio" (a definição do artigo, aula 1) e a repetição de "compartimento", "pool" e "raio" em vez de sinônimos.
- Corrigido: os fechos das aulas 2, 3, 4 e 5 começavam todos com "A loja agora…"/"Agora a loja…"; foram reescritos com aberturas diferentes ("O que dividir e quanto custa já está na conta", "O raio já tem conta", "Dois cortes e uma regra…", "Com isso a loja tem…").

## Passe 2: encadeamento
Lendo só a primeira e a última frase de cada aula, a história se conta: o relatório derruba o checkout (módulo 24) → quais recursos dividir → quanto estrago sobra → por qual critério dividir → como os seis desenhos se combinam → e a pilha inteira? (módulo 26). Cada aula abre com ponte e fecha com "Falta saber…".

## Passe 3: consistência de números (aulas × widgets × quiz × glossário)
Conferido contra o brief e, nos widgets, rodando-os no navegador:
- **k6 real:** 66,8% (83 × 503 em 250), 89,9% (101 em ~1.000), 47,2% (132 em 250, p95 12,0 s) no pool único; 100%, 100% e 14,0% (215 em 250, p95 7,4 s) no 16 + 4; p95 de 66, 15 e 54 ms; o texto, o widget e o quiz usam os mesmos.
- **Little:** 0,2 + 0,2 + 40 = 40,4 de 20; 4 + 4 = 8 (as outras 12 voltam ao `max_connections`); 4 ÷ 4 s = 1/s e 10 → 100 min (23:00 → 00:40).
- **Erlang C (recalculado em Python e batido com o widget):** 12 workers a 70% e S = 50 ms: 18,4% e 2,6 ms; 3 × 4: 42,9% e 17,9 ms; a 80%: 36,9% e 7,7 ms contra 59,6% e 37,3 ms; 5 por pool = 19,0% (4,3 ms; 15 workers, +25%) e 6 por pool = 7,5% (1,2 ms; 18, +50%).
- **Blast radius:** 100/50/33,3/20/10/5/2/1%; 60% e 40% (20·20·60 e 20·20·20·40); 1 − 0,999^N = 0,10, 0,30, 1,00, 4,88 e 9,52%; 10⁻⁹ com N = 3; C(10, 2) = 45 e 1 ÷ 45 = 2,2%; grupos fixos de 2 em 10 = 20%.
- **Aula 4:** 50.000 ÷ 120 = 417 s; lanes 12 · 6 · 2. **Aula 5:** 500 req/s → 50% da frota; teto 100 → 400 × 429 e 900 garantidos; 3 × 4 = 12 compartimentos × 2 pods = 24 contra 10.
- **Divergências notadas e resolvidas:** (a) o modelo do navegador dá 50% de sucesso no checkout e 64% no status no pool único (k6: 66,8% e 89,9%), porque o k6 chega em intervalos regulares e os dois disputam a mesma vaga; o widget e a aula 1 avisam. (b) O brief diz que 5 workers por pool "igualam" 18,4% (dá 19,0%); o widget usa tolerância de 5%. (c) "O mkt-01 a 40%" é a fração do tráfego do tenant; no shard junto com os outros 20% o raio é 60%.

## Passe 4: o que o brief não confirma
- O vazamento de memória do `relatorios` e a evicção do kubelet (aula 2) são descrição qualitativa; nada foi rodado em Kubernetes.
- Hystrix e Resilience4j: só a documentação foi lida; não foi rodado.
- A demanda de 8 · 4 · 2 workers nas lanes do widget (regime normal) é um modelo didático para mostrar o surto; o brief só fixa a divisão 12 · 6 · 2.
- Nygard (*Release It!*) não entra como link (sem URL verificável).

## Pendências para o maestro
- Marcadores `{/* FIG:anteparas mode=… */}` (um por aula: `pool`, `fisico`, `raio`, `funcional`, `referencia`) ainda não trocados por `<Figure3D>`; o import de `Figure3D` ainda **não** está nos MDX.
- Poster `labs/bulkhead/anteparas-3d-previa.webp` (a home aponta para ele) e a figura `anteparas-3d` (modes `casco`, `pool`, `fisico`, `raio`, `funcional`, `operacional`, `referencia`).
- Alinhar os nomes dos botões nos "Faça agora" (aula 1: `pool` e `casco`; aula 2: `fisico` e `pool`; aula 4: `funcional` e `operacional`).
- `build:3d` no `package.json` (não editei) e a linha "Em breve" da home (não mexi).
