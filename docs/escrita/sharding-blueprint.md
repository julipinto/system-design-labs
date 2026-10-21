# Blueprint: Sharding e Particionamento (módulo 16)

Método: Architect (fio e teses) → Carpenter (ponte, frase-tópico, gancho) → Judge (`sharding-judge.md`), seguindo ESCRITA.md e PREMISSAS.md. Dados: só os do `sharding-brief.md`.

**Fio condutor (1 frase):** a tabela `pedidos` de 50 milhões de linhas pede para ser partida entre servidores, e cada pergunta que a partição abre (partir por quê, onde cada linha cai, o que esquenta, o que acontece quando N muda, como isolar o cliente que atrapalha) é a aula seguinte, até a loja descobrir que cada shard é um servidor só.

## Aulas: tese e a pergunta que deixa
| # | Ponte (problema que a anterior deixou) | Tese | Pergunta deixada (gancho) |
|---|---|---|---|
| 1 | Módulo 15: o eixo Z nunca usado; módulo 14: banco de 150/s; tabela de 6 para 50 milhões de linhas | Sharding é partir o dado entre **servidores**; duas topologias (dados e computacional); escada de remédios; 140 GB, 50 dias, backup de 47 min | O que a loja ganha por esse custo? |
| 2 | 3 shards no papel e o preço (relatórios em 3 partes) | Compra **capacidade, espaço e isolamento**; cobra consulta sem chave, cauda e mais incidentes | Partir **por quê**: a chave |
| 3 | 450/s só valem se a carga se espalhar | A chave decide o que fica junto e onde esquenta (55,6%, T = 250, 4 mitigações) | Antes de separar servidores, partir **dentro** de um |
| 4 | O `mkt-01` ainda esquenta um shard | **Particionar** dá poda, retenção e manutenção, não capacidade (`table.sql` que não roda, plano com e sem poda) | Quais **faixas**? |
| 5 | A faixa de ano foi uma faixa | Ranges são fáceis e **concentram** (iniciais, ids, datas, tiers; 2027 sem partição) | E o hash, quando N muda? |
| 6 | Faixas deixam shards vazios e outros cheios | `hash mod N` espalha e **quebra quando N muda** (75,2%, 3 / 9 / 2, deploy em duas versões) | Como mover só ~1/N? |
| 7 | 75 GB e 25 min para ganhar 1 servidor | O **anel** mexe só no dado do shard novo (25,7%, pontos virtuais, dominó, lab com 3 pontos) | Quem guarda o mapa e como mover **um** cliente? |
| 8 | O anel não sabe que o `mkt-01` é diferente | A decisão sai do hash e vai para um **mapa** (slots, diretório, id com shard, Kafka com a mesma função) | E se limitar o estrago em vez de mover? |
| 9 | Mover dado não ajuda contra a requisição que trava a réplica | **Shuffle sharding**: subconjunto por cliente; 20% → 2,2%; exige retry | Juntar tudo num exemplo executável |
| 10 | As peças estão prontas | Os 4 programas e a tabela do autor, executados no papel e comparados (6 divergências) | Cada shard é um servidor só: falta **copiar** (módulo 17) |

Lendo só a primeira e a última frase de cada aula, a história se conta: tabela grande → o que ganha → por qual chave → dentro do servidor → faixas → hash → anel → mapa → isolamento → exemplo → cópias.

## Decisões do Architect
1. **Uma figura por aula.** Aula 7 cita três modes no brief (`anel`, `reshard`, `vnodes`): o marcador fica em `reshard` e o "Faça agora" manda trocar para os pontos virtuais. As demais ficam como o brief: 1 `topologia`, 2 `consulta`, 3 `chave`, 4 e 5 `particoes`, 6 `hash`, 8 `slots`, 9 `shuffle`, 10 `lab`.
2. **Elenco fixo.** Lena (1054, `shard-1`), Bia, Caio, Davi, `mkt-01`; o robô de 500/s do módulo 8 volta na aula 9.
3. **Dois lugares para a mesma conta.** O 37,5 milhões de linhas (75% teórico) está no texto e na tabela; o widget mostra 37,6 M porque usa o 75,2% medido. Os dois estão no brief.
4. **Código real em `<pre>`.** `table.sql` (aula 4), `hashing/main.go` (6), `consistent-hashing-remove/main.go` (7), `murmur/main.go` e `go.mod` (10), via `CodeLab` e `?raw` (`src/lab-code/sharding/`), com os números de linha do arquivo. O `hashing-distrib/main.go` não entra como código: só a saída.
5. **Correções ao artigo** nos "Aprofundar" das aulas 1, 2, 3, 4, 6, 7, 8 e 9 e em `docs/fontes/sharding.md`.

## Carpenter: o que foi aplicado
- Ponte na primeira frase de cada aula, sempre com o problema em aberto (não com "na aula passada vimos").
- "Como funciona" em ordem de acontecimento (no máximo 5 itens), cada um puxando o seguinte (ex.: aula 7: círculo → pontos virtuais → entra o shard → clientes → dominó).
- Problema antes do nome: o deploy em duas versões antes de "consistência de roteador"; o `mkt-01` antes de "shard quente".
- Seção "E se der errado" em toda aula, com o erro real quando existe (`no partition of relation … found for row`, `panic` no anel vazio).
- Palavra repetida em vez de sinônimo: "shard" (nunca "nó" para o pedaço), "partição" só dentro do servidor, "faixa", "ponto virtual", "subconjunto".
