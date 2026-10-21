# Judge: Performance, Capacidade e Escalabilidade (módulo 14)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com quiz, glossário, widgets e brief final), seguindo ESCRITA.md e a skill writing-prose-like-a-human. As figuras `latencia-3d` e `capacidade-3d` ainda não existem: a conferência com elas fica para a integração (dados do brief, abaixo).

## Voz de IA
- Busca em MDX, glossário, quiz e widgets por "crucial", "fundamental", "vale ressaltar", "vale lembrar", "além disso", "ademais", "em suma", "nesse sentido", "robusto", "alavancar", "ecossistema": zero ocorrências.
- "Não é só X, é Y" e "não apenas": zero. Os contrastes que sobraram são de fato (vertical contra horizontal, utilização contra saturação, média contra percentil).
- Travessões e meias-riscas: zero em todos os arquivos do módulo.
- Nenhuma seção termina resumindo o que acabou de ser dito. Os "E se der errado" terminam no dado (135 ms verde, 269 contra 2.000, 40/s, 2.400 por minuto, 6.000 requisições).
- Dois pontos corrigidos na leitura: a frase "passou pela fila do tempo de resposta" da aula 1 (confusa) foi reescrita, e "Com 7 réplicas viva" virou "vivas".

## Encadeamento
- Todas as aulas abrem com `p.ponte` e fecham com `p.gancho` contendo "Falta saber…": 13→1 (o 2 s sem número), 1→2 (que números além da média), 2→3 (quanto a frota aguenta), 3→4 (máquina maior ou mais máquinas), 4→5 (quantas e quando), 5→6 (o que as réplicas não resolvem), 6→módulo 15 (a forma de crescer de cada gargalo: Scale Cube).
- A aula 1 liga com o fim do módulo 13 (aula 10): o 2 s do catálogo na Black Friday, a newsletter de 50.000 e-mails a 100/s às 20:00 e os cliques entre 20:01 e 20:09.
- Vocabulário fixo do brief repetido sem sinônimos soltos. "Latência" só aparece como o termo do artigo e do painel; o módulo usa "tempo de resposta". Nenhuma marca de curso; "repositório público do autor" no lugar do nome do curso.

## Listas e formato
- "Como funciona" com 5 itens (4 na aula 6); "Por que importa" com 4; 3 a 5 links por aula nas Fontes (todos 200 em 20/10/2026); 5 flashcards por aula.
- O "Faça agora" é genérico: aponta o cenário e os botões da figura sem citar rótulos finais, para o maestro alinhar. Nas aulas com dois modes no brief, uma figura entra e o outro vira "aperte o botão do cenário…" (aulas 2, 4 e 5); na aula 3 o joelho (figura `latencia`) fica no widget.

## Consistência de números (texto, quiz, glossário, widgets; a figura segue o brief)
- **Amostra das 20:03** (640 req/s, 38.400 por minuto): média 135, p50 32, p90 74, p95 800, p99 2.000, máx. 2.100, 1 `504` (1%); nove réplicas a 64% (média 37,8), `catalogo-3` a 99% (média 1.010), frota a 67,5%; média dos p99 = 269. Depois de corrigir: média 40,8, p50 34, p95 58, p99 73, 0% de erros. O widget `percentis` calcula tudo pelo posto mais próximo e confere os mesmos valores.
- **Curva do joelho:** R(ρ) = 10 + 10 ÷ (1 − ρ): 20, 26,7, 30, 37,8, 40,8, 43,3, 60, 110, 210, 1.010 ms. Little: 86,4 em andamento (`catalogo-3` 64,6; saudável 2,4).
- **Cadeia:** `pedidos` 90, `pagamentos` 40, `estoque` 1.000, banco 150; a 30/s: 33%, 75% (200 ms), 3%; a 60/s: sai 40, represa 20/s, 1.200 em 60 s; `estoque` ×2 não muda; `pagamentos` ×2 dá 80; 240 contra 80 réplica-horas. O widget `cadeia` abre em 60 pedidos/s com as réplicas do brief.
- **Vertical e horizontal:** Amdahl 1/21 e 8 vCPU = 6,0× (600 req/s, 75 por vCPU); queda: 64%, 71,1%, 80%, 91,4%, 106,7% (fila de 40 req/s, 2.400 por minuto). O widget `queda` abre em 640 req/s, 10 réplicas, 8 vCPU e 4,76%.
- **HPA:** 95% → 14 (67,9%, 41,1 ms); vazão 950 ÷ 70 → 14; média 67,5%: alvo 70% = 10, 80% = 9, 60% = 12; pico de 1.100 → 16, 60 s de reação, 6.000 requisições (9,1% de 66.000). Artigo corrigido: 100% → 8, 200% → 15; vazão 11,11 → 12. O widget `hpa` tem presets para todos.
- **Pedido 1052:** 3 camisetas pretas 147,00 + frete SP 9,00 = 156,00 às 20:03:30; a primeira tentativa (20:03:12) deu `504` de 2,1 s.
- **Quiz:** 41 perguntas (7, 7, 7, 7, 7 e 6 por aula), com as contas conferidas contra o texto.

## Pontos em que o texto decide além do brief
- **Ordem do pedido na cadeia** do widget (pedidos → banco → pagamentos → estoque): o brief só dá capacidades; a ordem vem avisada na nota do widget.
- **Capacidade por réplica** dos serviços do checkout (30, 20 e 500 por réplica) derivada de réplicas × CPU por pedido (33, 50 e 2 ms): a conta bate com 90, 40 e 1.000.
- **Retry do Davi na aula 5:** 1% de erros em 640 req/s = 6,4 req/s extras (conta derivada, avisada como pouco).
- **Metade da CPU dobra a capacidade por réplica** (aula 6): conta derivada de 10 ms → 5 ms, citada como exemplo.

## Pendências
- Figuras `latencia-3d` e `capacidade-3d` (marcadores no MDX): alinhar os rótulos dos botões nos "Faça agora" e trocar os marcadores `FIG:` por `<Figure3D>` (com o import no topo de cada MDX).
- Pôster da home: o card aponta para `labs/performance/latencia-3d-previa.webp`, que a figura ainda vai gerar.
- Teste de tela em 390 e 360 px (página e widgets) sem scroll lateral e com console limpo; não foi feito screenshot em 1280 px nem do quiz.
