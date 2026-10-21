# Blueprint do módulo 18: CQRS

Fluxo: Architect (este arquivo) → Carpenter (as aulas, escritas já com ponte, frase-tópico, transição e gancho) → Judge (`cqrs-judge.md`). Como a Juliana revisa depois, o próprio agente aprova o blueprint seguindo PREMISSAS.md e ESCRITA.md; as decisões estão no fim.

## Fio condutor (1 frase)
A "meus pedidos" da Lena lê da tabela em que o checkout escreve e junta quatro serviços para aparecer; separar o modelo de **escrever** do de **ler** resolve isso, e o que se paga é manter os dois em sincronia sem perder pedido nem mostrar fantasma.

## Aulas: tese e a pergunta que deixa
| # | Aula | Tese (1 frase) | Pergunta que deixa (o "Falta saber…") |
|---|---|---|---|
| 1 | Introdução ao CQRS | CQRS separa comandos de consultas em modelos diferentes, cada um do tamanho do seu trabalho; o preço são duas coisas para manter em sincronia, e só vale onde as leituras e as escritas têm formas e escalas diferentes (consulta da tela: 0,23 a 0,31 ms). | Como é cada um dos dois modelos por dentro? |
| 2 | Modelos de domínio | O comando é rico em regras e normalizado; a consulta é "burra", desnormalizada e do formato da resposta, e a regra mora só no comando. | Como montar o modelo de leitura sem mudar de banco? |
| 3 | Views materializadas | O modelo de leitura mais simples é uma tabela pré-calculada no mesmo SQL: 0,021 ms contra ~235 ms, pago em atraso (`REFRESH` bloqueia, refaz tudo, envelhece). | E se a leitura precisar de mais capacidade, e não de mais velocidade? |
| 4 | Read replicas | A réplica é o modelo de leitura mais barato (capacidade e proximidade) e não muda o modelo: o `JOIN` continua, a consulta longa é cancelada, o atraso volta. | Como aceitar o atraso de propósito, com um modelo que se atualiza por eventos? |
| 5 | Consistência eventual | Separar troca "leio o que escrevi" por "leio em breve", e o desenho tem de prever o intervalo (~74 ms), dar três jeitos de a Lena ver o próprio pedido e medir o atraso (120 s, 400 s). | E se o modelo de leitura for outro banco, de outro tipo? |
| 6 | Combinação de SQL e NoSQL | A leitura não precisa de transação nem de `JOIN`: um documento por cliente (1.787 B, 3,35 GB) é uma leitura por chave, e o projetor passa a falar dois dialetos. | E quando os dados da tela estão em vários serviços? |
| 7 | Modelos distribuídos | O modelo de leitura montado por eventos de vários donos tira a tela do raio de explosão (99,9% contra 99,60%), ao custo de consistência eventual multiplicada. | Como o `pedidos` garante que o evento sai quando o pedido entra? |
| 8 | Dual-write pattern | Gravar no banco e publicar no broker são duas escritas não atômicas: 108 pedidos por hora sem evento a 0,1% de falha; o "rollback" do artigo não resolve. | Como ler o que o banco já gravou, e só isso, para virar evento? |
| 9 | CDC | O log do banco só tem o que foi confirmado e vira evento sem a aplicação publicar nada, mas o evento é técnico e o handler do laboratório erra (`u`, `d`, banco de escrita). | E se o evento tiver de ser um fato de negócio, gravado junto com o pedido? |
| 10 | Transactional Outbox | O evento como linha na mesma transação do pedido: ou os dois entram, ou nenhum; o relay (ou o CDC) leva ao broker, pelo menos uma vez, com 5,3× a 7,6× o WAL. | E quando um pedido atravessa vários serviços e um falha no meio? (módulo 19, Saga) |

Lendo só a ponte e o gancho de cada aula, a história se conta: a tela lê onde se escreve → separar → o comando e a consulta por dentro → a *view* no mesmo banco → a réplica → o atraso previsto → outro banco → vários serviços → a escrita dupla falha → o log do banco → a outbox na mesma transação → a compensação (Saga).

## Estrutura fixa de cada aula
ponte (problema que a anterior deixou) → **Em uma frase** → **Faça agora** (ação que a figura mostra; marcador `{/* FIG:… */}`, uma por aula) → **Como funciona** (passos numerados, no máximo 5, cada um chama o seguinte) → widget (aulas 3, 5, 6, 7, 8 e 10) → "E se der errado" (a conta que fecha e a que não fecha) → **Por que importa** → **Aprofundar** (tabela dos números, "Correção ao artigo-base", Fontes) → gancho "Falta saber…" → flashcards.

## Decisões do Architect
1. **Uma figura por aula.** O brief cita dois modes nas aulas 8 e 10; fica `dual-write` e `outbox` no marcador, e o "Faça agora" manda apertar o botão **Falha do dual-write** e **Relay duplicado** para o outro. Os nomes dos botões são genéricos e o maestro os alinha.
2. **Vocabulário fixo do brief:** "projetor" (e não *event handler*, que é o termo do artigo), "view materializada" só para a do PostgreSQL ("tabela desnormalizada" para a do artigo), "escrita dupla", "pelo menos uma vez", "evento técnico × de negócio". "Event sourcing" nunca para CQRS.
3. **Código do laboratório só onde ensina o defeito** (aulas 5, 8, 9 e 10), via `CodeLab` com os números de linha do original, sem alteração, e sempre dizendo que foi **lido, não executado**.
4. **Medido × estimado × exemplo.** Cada número diz de onde vem: PostgreSQL 14.24 local (medido), estimativa linear (50 milhões) ou exemplo (os tempos do CDC e do Kafka, a taxa de 0,1%).
5. **Widgets só os 7 do brief**; as aulas 1, 2, 4 e 9 ficam sem widget (a figura faz o trabalho).
6. **O documento da Lena** foi reconstruído até fechar nos números do brief (1.787 B, 253 B o 1056, 223 B de média); os pedidos 1042 a 1055 têm os itens e totais da história-mestre, e datas, forma de pagamento e rastreio são de exemplo, avisados no widget.
