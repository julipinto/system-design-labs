# Judge: Saga Pattern (módulo 19)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência), seguindo ESCRITA.md e writing-prose-like-a-human. As figuras `saga-3d` e `compensacao-3d` ainda não existem: a conferência com elas fica para a integração (dados do brief).

## Voz de IA
- Busca em MDX, widgets, glossário e quiz por "crucial", "fundamental", "vale ressaltar", "além disso", "ademais", "em suma", "não é só", "não apenas": zero ocorrências. Travessões e meias-riscas: zero.
- Seções terminam no dado (44,95 s, 31 s, 1.632.960.000, 3.600), não em resumo.

## Encadeamento
- Todas as aulas abrem com `p.ponte` e fecham com `p.gancho` ("Falta saber…"). A aula 1 liga com o gancho do módulo 18 (outbox → pedido que atravessa serviços); a 10 puxa o módulo 20 (Event Sourcing).
- Lendo a primeira e a última frase: o 1057 sem saga, por que o ROLLBACK não serve, passos e compensações, quem coordena (sem dono), quem coordena (com dono), onde mora o estado, como desfazer, onde fica a memória, como gravar e mandar, o laboratório junto.

## Formato
- "Como funciona" com 5 itens; "Por que importa" com 4; 3 a 4 links por aula; 5 flashcards. "Faça agora" genérico, sem rótulos finais de botão (o maestro alinha).

## Consistência de números (texto, quiz, glossário, widgets)
- 1057: 49,00 + 9,00 = 58,00; Pix `c-7732`; 20:15:00.000 → 20:15:44.950 = 44,95 s; espera 41,2 s; compensação 3,7 s; e-1901 a e-1905; 7 linhas; versao 7; conciliação 2 h 44 min.
- Mensagens 4/5 × 6/8 (+1); widget `coreo-orq` dá 5 e 8 com 3 passos e falha no 2º.
- Backoff 1+2+4+8+16 = 31 s; widget `compensacao` dá 31 s e 1,56% com p = 50%.
- Laboratório: 85,5% / 17,1 / 2,0 / 0,9; reserva presa 3.600; log 1.632.960.000.
- Widget `simulador` conferido no navegador: 44,95 s com estorno (ordem da loja) e 100 ms sem estorno (reservar antes).
- Quiz: 50 perguntas, 5 por aula.

## Pendências
- Alinhar os nomes dos botões das figuras com os "Faça agora" quando as figuras existirem.
