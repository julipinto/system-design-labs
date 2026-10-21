# Judge: módulo 24, Testes de Carga e Estresse

Revisão depois do Carpenter (11 aulas seguindo o blueprint), com leitura das aberturas e dos fechos, busca por vícios de voz de IA e conferência de números entre aulas, widgets, quiz e glossário.

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "não é só/apenas", "robusto" e travessão: **nenhuma ocorrência** nas aulas, no quiz e no glossário (o "—" do widget é o marcador de célula sem dado).
- Corrigido: "a média fica baixa durante a rampa" (aula 9) não batia com a tabela (a janela de 42/s já tinha p50 de 1,1 s); reescrito.
- Corrigido: "capacidade que bate com o pod de 30/s" (aula 10) misturava 30 em voo com 30/s; reescrito.
- Mantido de propósito: repetir "janela", "elo", "goodput" e "taxa" em vez de sinônimos.

## Passe 2: encadeamento
Primeira e última frase de cada aula contam a história: o plano é hipótese → carga × estresse → smoke → média → estresse → spike → breakpoint → perguntas → metas → pré-teste → relatório → módulo 25. Todo fecho tem "Falta saber…"; toda abertura retoma o problema deixado.

## Passe 3: consistência de números (aulas × widgets × quiz × glossário)
Conferidos contra o brief: 61 requisições / 155,6 ms; 3.601 / 157,5 / 381,3 / 498,6; 15.001 / 247,2; tabelas do breakpoint ("hoje", plano, plano 2); 128 s × 100–110 s; degraus 33, 36, 250, 265; pré-teste 35 · 62 · 88; estresse 59.567 e 738 ms; fechado 38,1 e 41,1; 680 VUs; 14 → 19 réplicas; cenário misto 33% / 10% / 53%.
- Widgets rodados no navegador (sem erro de console): rampa dá ~38 (hoje) e ~270 (plano 2); pré-teste dá 36 para 3 pods + pagamentos de 2; jornada dá 14 e 19.
- **Aproximações assumidas:** o modelo fechado fora de 20/60 VUs e o atraso da rampa (~6,5 s) são calibrações, avisadas na nota do widget. O ponto 54/s do modelo aberto é o do texto (52%); a tabela de janelas tem 51,8 → 42% e 55,1 → 52,2%.

## Passe 4: o que o brief não confirma
- O p95 do fechado a 60 VUs ("2 s") e o p95 "2 s" do aberto são o teto de 2 s do `lb-loja`; a "mediana 2 s" do aberto é a p50 da janela de 55,1/s.
- A estimativa "~90% do nominal" no widget de pré-teste, fora das combinações medidas, é a distância observada (36 de 40; 260 de 300).
- O código de saída `99` do fechado a 20 VUs vem do arquivo de saída (p95 acima de 800 ms com 0% de erros).

## Pendências para o maestro
- Marcadores `{/* FIG:carga mode=… */}` ainda não trocados por `<Figure3D>` (11 aulas) e o import de `Figure3D` precisa entrar nos MDX.
- Figura `carga-3d` e prévia `public/labs/testes-de-carga/carga-3d-previa.webp` (a home aponta para ela).
- `build:3d` no `package.json` (não editei).
- Alinhar os nomes dos botões nos "Faça agora".
