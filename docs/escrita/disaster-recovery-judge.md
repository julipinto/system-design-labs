# Judge: módulo 27, Single Point of Failure e Disaster Recovery

Revisão depois do Carpenter (5 aulas seguindo o blueprint): aberturas e fechos, voz de IA e consistência de números entre aulas, widgets, quiz e glossário.

## Passe 1: voz de IA
Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "não é só/apenas", "robusto" e travessão: **nenhuma ocorrência** nas aulas, no quiz e no glossário.
- Corrigido: "Misturar os dois pareceria que…" (aula 3) virou "dá a impressão de que…".
- Corrigido: a aula 3 somava "30 + 35 = 65 s"; a promoção corre em paralelo, então a soma certa é detecção 30 + pods 30 + mapa 5 (a aula 3 e o widget agora dizem isso).
- Corrigido: a aula 2 afirmava "3 SPoFs antes, 5 depois", número que o brief não traz; reescrito sem ele.
- Mantido de propósito: repetir "elo", "janela", "passiva" e "RTO" em vez de sinônimos.

## Passe 2: encadeamento
Primeira e última frase de cada aula contam a história: fim do módulo 26 → o que é SPoF → como achar → como duplicar e trocar → a região inteira → como medir → módulo 28. Todo fecho tem "Falta saber…" e toda abertura retoma o problema deixado.

## Passe 3: consistência de números
Conferidos contra o brief: 98,8066 · 99,5003 · 99,9988% e 515,6 · 215,9 · 0,52 min; 215,6 dos 215,9; 30 · 35 · 60 · 65 s; 643,5 tentativas e 2,97 pedidos; 4,5 → 14,4 (3,2×); R$ 2.276.208 · 570.240 · 51.480 · 27.720; 2.874 e 720 s; 924 s; 297 e 2.970; 34 · 108,4 · 204,5; 65,4%; 99,9975% e 99,7506%; 2,97 · 2,88 · 9,6; 12 e 82 ms; pedido 1061 (108,80), do Davi (48,80), 1062.
- Widgets rodados no navegador a 390 px (sem erro de console, sem rolagem lateral): auditoria dá 99,5003% e 215,9; relógio dá RTO 65 s; split brain dá 297; passiva dá 3,2×; estratégia dá R$ 570.240 (pilot light); restore dá 2.874 s; tabela do artigo dá 34 · 108,4 · 204,5 (65,4%); RPO dá 2,97.
- O passo mais pesado do restore é a infra por IaC (1.200 s, 42%), não o restore do banco (924 s).

## Passe 4: o que o brief não confirma
- **"~4,97% do orçamento de erro"** das 643,5 tentativas: não reproduzível com os dados do módulo; a aula 4 não cita o percentual (ver `docs/fontes/disaster-recovery.md`).
- A disponibilidade de 99,9975% usa 65 s parados por falha (o RTO), como o brief; com o MTTR de 35 s seria 99,9987%.
- O widget MTTD usa colunas de duração (detecção, reparo, intervalo) e não horários de início, detecção e recuperação: as tabelas do artigo não são os mesmos incidentes e não cabem numa tabela de horários única.

## Pendências para o maestro
- Marcadores `{/* FIG:spof mode=… */}` (aulas 1 a 3) e `{/* FIG:desastre mode=… */}` (4 e 5) sem `<Figure3D>`; falta o import em cada MDX.
- Figuras `spof-3d` e `desastre-3d`, prévias `public/labs/disaster-recovery/*-previa.webp` (a home aponta para `desastre-3d-previa.webp`) e `build:3d` no `package.json`.
- Alinhar os nomes dos botões nos "Faça agora".
- Registrar as constantes novas na história-mestre.
