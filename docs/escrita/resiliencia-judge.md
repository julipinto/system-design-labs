# Judge: módulo 21, Patterns de Resiliência

Revisão feita depois do Carpenter (as 13 aulas escritas seguindo o blueprint), com leitura das aberturas e dos fechos, busca por vícios de voz de IA e conferência de números entre aulas, widgets, quiz e glossário.

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "não é só/apenas", "robusto" e travessão: **nenhuma ocorrência** nas aulas e nos widgets (a única variação é o en dash de intervalo "0–4 s, 2–6 s, 6–10 s" do artigo, na aula 7).
- Corrigido: cinco fechos de aula começavam todos com "A loja agora…". Os das aulas 4 e 12 foram reescritos ("Cópias e um balanceador… resolvem a peça travada", "O dado agora tem cópias…").
- Corrigido: a ponte da aula 4 ("o raio de uma peça só depende de quanta coisa depende dela") ficou mais direta.
- Mantido de propósito: a repetição da palavra técnica (timeout, retry, pool, breaker) em vez de sinônimos, como pede o ESCRITA.md.

## Passe 2: encadeamento
Lendo só a primeira e a última frase de cada aula, a história se conta: o PSP em 8 s → como medir → o raio → réplicas → repetir com segurança → esperar a tempo → repetir com freio → parar de chamar → outro caminho → desligar → desacelerar → o dado → paredes → a mudança (módulo 22). Todo fecho tem "Falta saber…"; toda abertura retoma o problema deixado.

## Passe 3: consistência de números (aulas × widgets × quiz × glossário)
Conferido contra o brief e, nos widgets, rodando-os no navegador:
- **Exatos:** 99,6006% (172,5 min), 99,2018% (344,8), 99,6978% (130,5), 12.960 e 20,8% / 69,4%; Little (30, 60, 240) e 1,67 s; 27 e 810/s (20,2×) e 33/s; fila 250 s, 120 s e 150 s; 3,33 s × 1,67 s; 60% e 20%; **breaker: abre em 1,3 s, meio-aberto em 31,3 s, reabre em 32,43 s, 62,47 → 63,6 s, meio-aberto em 93,6 s, fecha em 93,91 s; 237 chamadas e 2.763 falhas rápidas; pico de 31 em voo; 484, 2.260 e 11 recusadas** (a simulação do brief foi reproduzida em JS com a mesma lógica de empate entre chegada e conclusão).
- **Tempestade:** as duas estratégias sem sorteio batem exatamente (45.500 / 24.500 / 6,9 s; 6.980 / 1.940 / 40). As com jitter dependem do gerador de números (Python, semente 7); no padrão o widget mostra a tabela medida do brief, fora dele simula no navegador (e avisa).
- **Divergência notada e resolvida:** o brief diz "54 durante a falha / 183 depois de ele voltar"; na simulação 54 é o total até o disjuntor **fechar** (as 5 sondas de 93,6 s incluídas) e 183 o que vem depois. As aulas escrevem "54 até fechar e 183 depois".
- **Fila:** com fila limitada de 5.000 o dreno ao fim de 10 min é 5.000 ÷ 80 = 62,5 s (a conta de 150 s é da fila ilimitada); o widget mostra os dois casos separados.

## Passe 4: o que o brief não confirma
- A definição de *throttling* (reduzir o ritmo de quem passou da cota) e de *rate limiting* na aula 11 vêm do módulo 8 e do Microsoft Throttling; o brief só pede "três coisas separadas".
- O RPO de 9 e 24 pedidos é o do módulo 17 (atrasos de 300 e 800 ms a 30/s); a aula repete o número sem recalcular.
- Bronson et al. (HotOS 2021) está citado sem link, como o brief manda.

## Pendências para o maestro
- Marcadores `{/* FIG:… */}` ainda não trocados por `<Figure3D>` (aulas 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13) e o import de `Figure3D` já está nos MDX.
- Prévias `chamadas-3d-previa.webp` e `isolamento-3d-previa.webp` (a home aponta para `labs/resiliencia/chamadas-3d-previa.webp`).
- Alinhar os nomes dos botões das figuras nos "Faça agora".
- `build:3d` no `package.json` (não editei).
