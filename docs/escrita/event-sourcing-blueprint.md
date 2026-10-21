# Blueprint do módulo 20: Event Sourcing

Fluxo: Architect (este arquivo) → Carpenter (as aulas, escritas já com ponte, frase-tópico, transição e gancho) → Judge (`event-sourcing-judge.md`). Como a Juliana revisa depois, o próprio agente aprova o blueprint seguindo PREMISSAS.md e ESCRITA.md; as decisões estão no fim.

## Fio condutor (1 frase)
O pedido 1047 da Lena é `entregue` numa tabela e o caminho até lá some em 7 dias no Kafka; guardar os fatos como verdade e derivar o estado traz histórico e reconstrução, e cobra versão esperada, projeções, ordem por versão e idempotência.

## Aulas: tese e a pergunta que deixa
| # | Aula | Tese (1 frase) | Pergunta que deixa (o "Falta saber…") |
|---|---|---|---|
| 1 | Introdução | Event Sourcing guarda cada mudança como fato imutável e deriva o estado; é um dos quatro padrões de Fowler, não todos. | O que a tabela de hoje esconde? |
| 2 | Persistência tradicional × ES | A tabela substitui, o ES só acrescenta: histórico de graça, leitura mais cara (52,6 GB, e a tabela continua como projeção). | Quem decide se um evento pode acontecer? |
| 3 | Agregados | O agregado decide, valida e ordena: comando recusado não deixa rastro, e agregado pequeno (um SKU) evita fila. | Onde esses eventos moram? |
| 4 | Event Store | Log de só-acréscimo: ordem por versão e trava `UNIQUE (stream_id, versao)`; a conferência `MAX` sozinha deixa a corrida passar (medido). | Como os eventos chegam a quem precisa? |
| 5 | Event Bus e publishers | O Store é a verdade, o bus leva as consequências; publicar depois do commit abre a janela da escrita dupla. | O que quem escuta faz com eles? |
| 6 | Projeções | A projeção é função pura dos eventos, logo o modelo é descartável; reconstruir 200 milhões custa 2 h 47 min e o gargalo é escrever. | E reconstruir um só agregado? |
| 7 | Rehidratação | Dobrar eventos em ordem, a cada comando; custo linear (1.800 ms por milhão); upcasting e replay exigem cuidado. | E com 1 milhão de eventos? |
| 8 | Snapshotting | Foto + cauda: 1.800 ms → ~13 ms (~140×); derivada e descartável; o laboratório tem a tabela e não a usa. | E se os eventos chegarem fora de ordem? |
| 9 | Ordem, versão e LWW | O consumidor usa a versão, não o relógio, para não aplicar o velho sobre o novo; limite nos modelos que somam; o buraco de versão. | E se o mesmo evento chegar duas vezes? |
| 10 | Idempotência | Versão para último estado, `evento_id` na mesma transação para soma, chave natural onde há id do fato; replay exige todos idempotentes. | O que ES custa e quando vale? |
| 11 | Considerações finais | Histórico, auditoria e reconstrução contra complexidade; vale onde o histórico é o produto; dado pessoal em log imutável. | Como a loja continua de pé quando as dependências falham? (módulo 21) |

Lendo só a ponte e o gancho de cada aula, a história se conta: a tabela esconde o caminho → só acrescentar → quem decide → onde moram → como saem → o que se faz com eles → reconstruir um agregado → a foto → a ordem → a duplicata → o custo → a resiliência (módulo 21).

## Estrutura fixa de cada aula
ponte → **Em uma frase** → **Faça agora** (ação que a figura mostra; marcador `{/* FIG:… */}`, uma por aula) → **Como funciona** (≤ 5 passos) → widget (aulas 2, 4, 6, 7, 8, 9, 10) → código do laboratório (aulas 4, 5, 7, 8, 9, 10, lido e não executado) → "E se der errado" → **Por que importa** → **Aprofundar** (tabela, correções ao artigo, Fontes) → gancho "Falta saber…" → flashcards.

## Decisões do Architect
1. **Uma figura por aula**, conforme o brief: eventos (aulas 1 a 5 e 11: `tabela-x-eventos`, `tabela-x-eventos`, `agregado`, `store`, `bus`, `tabela-x-eventos`) e replay (6 a 10: `projecao`, `rehidratacao`, `snapshot`, `versao`, `idempotencia`). O brief não cita dois modes numa aula.
2. **Ordem de chegada da aula 9 corrigida** (`e-501, e-504, e-505, e-502, e-502`): ver correção 13 em `docs/fontes/event-sourcing.md`. A figura `replay mode=versao` precisa usar a mesma ordem.
3. **Vocabulário do brief**: "Event Sourcing" por extenso, evento × comando, agregado, stream, versão (por stream) × `evento_id` (global), "dobrar", "rehidratar", "último estado" × "soma"; "ledger distribuído" nunca como sinônimo de Event Store.
4. **Código do laboratório só onde ensina**, via `CodeLab` com os números de linha originais, sempre avisando "lido, não executado"; imports do MDX juntos no topo.
5. **Dado pessoal (aula 11)**: o brief só avisa; a aula diz que não há fonte verificada.
6. **Nada de pedido novo** (o 1058 fica para o módulo 21).

## Pendências para o maestro
- Figuras `eventos-3d` e `replay-3d`: marcadores no lugar do `<Figure3D>` (a import já está em cada MDX); alinhar os nomes dos botões do "Faça agora" (Tabela × eventos, Agregado, Store, Bus, Projeção, Rehidratação, Snapshot, Versão, Idempotência) e os posters `eventos-3d-previa.webp` (a home já aponta para ele).
