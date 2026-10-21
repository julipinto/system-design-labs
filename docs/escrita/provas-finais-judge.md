# Judge: módulo 29, Provas Finais

Revisão depois da escrita das 7 aulas: busca por vícios de voz de IA, abertura e fecho de cada aula, números contra os briefs, widgets e quiz rodados no navegador (390, 360 e 1280 px, console limpo, sem scroll lateral).

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "não é só/apenas", "robusto": nenhuma ocorrência nas aulas, no glossário, no quiz e nos widgets.
- Mantido de propósito: a repetição de "peça", "bloco" e "módulo" em vez de sinônimos (vocabulário fixo do brief).
- Aberturas das aulas: cada uma retoma o problema que a anterior deixou (os fechos são perguntas "Falta saber…").

## Passe 2: encadeamento
Primeira e última frase de cada aula contam a história: 1 (apagar o desenho → o programa cai às 23:00), 2 (cai às 23:00 → quem leva o último gato), 3 (último gato → Black Friday), 4 (Black Friday → dado certo sem transação única), 5 (dado certo → publicar é o risco), 6 (risco → e se a pilha inteira fosse dividida), 7 (pilha dividida → o que a loja não tem e o desenho do aluno).

## Passe 3: números
Conferidos contra os briefs e as aulas publicadas (1 a 25 por grep nas aulas; 26 a 28 só pelos briefs, aulas em outros worktrees): 215, 1.460 B, 80 ms; RAID 1·2·4·6·2; quórum 2 em 3; 1042; 5 ms; 180 → 200 ms; 80 × 25 vCPU; 2,7 s e 15 s; 401 e 403; 480 ms e 150 ms; 27; 50/s e 500/s; 11 bytes; p0; 120/s e 40/s; 67,5%; 55,6%; 75,2% × 25,7%; 2·12·82 ms; 85,5%; 1,67 s; R$ 54.000 × 450; 41 vCPU; 36/s × ~250/s; 16 + 4; 7.200 × 2.880; RTO 65 s; 43,2 min. O quiz (80 perguntas) e os widgets usam o mesmo `dados.js`/`questions.js`.
- Ajustado: "Tire uma peça" da aula 6 cobre o teste misto (brief) e também o canary (tabela das 13 peças), porque a aula tem as duas respostas.
- Ajustado: o texto da aula 5 sobre as 27 chamadas deixou explícito que são 3 camadas de 3 tentativas.

## Passe 4: pendências
- Figura `loja-3d` e o poster `public/labs/provas-finais/loja-3d-previa.webp` (o card da home já aponta para ele).
- Os links internos para `cell-based`, `disaster-recovery` e `observabilidade` só abrem depois que os módulos 26 a 28 forem juntados.
