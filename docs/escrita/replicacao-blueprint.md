# Blueprint do módulo 17: Replicação de Dados

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim. Brief: `docs/escrita/replicacao-brief.md`.

## Fio condutor do módulo
Cada shard da loja é um servidor só; o módulo copia o mesmo dado para SP, Rio e Recife e mostra o preço de cada jeito de copiar (atraso, perda, conflito), até a tela "meus pedidos" da Lena precisar de uma cópia montada só para leitura.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução à replicação de dados | Replicar é ter o mesmo dado em mais de um lugar para continuar de pé, ler perto (2 ms contra 80 ms) e sobreviver a uma perda; o preço é o atraso e o conflito, e réplica não é backup. | Quem recebe as escritas? |
| 2 | Modelos: Primary/Replica e Primary/Primary | Um escritor é simples e o primário é ponto único de falha até a eleição (RTO 35 s, 1.050 tentativas, perda de 9 ou 24 pedidos); vários escritores trocam isso por conflito (LWW com relógio de 120 ms, o 1056, o −1). | Quando o primário diz "pronto"? |
| 3 | Síncrona, assíncrona, semi-síncrona e por logs | O momento do commit decide o que se perde e quanto se espera (2, 12 e 82 ms); a Lena não vê o 1055 e há três consertos (primário, token de LSN, `remote_apply`); a réplica recebe o log, na ordem. | E quando só um serviço precisa de um pedaço do dado de outro? |
| 4 | Event-Carried State Transfer | Publicar o estado inteiro (202 B) permite a cada serviço ter a sua cópia e deixar de chamar o dono; o custo é espaço (3,0 GB), atraso e ordem (v9 antes da v8). | E se o dono não quiser, nem souber, publicar eventos? |
| 5 | CDC: Change Data Capture | O log do banco já é a lista do que mudou; o CDC o lê sem mexer na aplicação, o outbox fecha a escrita dupla e o slot esquecido enche o disco em 23 dias. | E quando dois primários aceitam escrita e as cópias precisam convergir sem ninguém decidir? |
| 6 | CRDTs | Um CRDT é uma estrutura cuja junção é comutativa, associativa e idempotente (273, `{gato}`, 120 permutações), e garante convergência, não invariante (estoque −1). | Como separar o modelo de escrita do de leitura? (CQRS, módulo 18) |

## Decisões
1. **Uma figura por aula, no máximo.** A1 `replicas primary-replica`; A2 `replicas queda` (o "Faça agora" manda apertar o botão do `multi`); A3 `replicas lag` (manda apertar os botões de `assincrona`, `semi` e `sincrona`); A4 `fluxo ecst`; A5 `fluxo cdc` (manda apertar `outbox` e `slot`); A6 `fluxo crdt-contador` (manda apertar `crdt-limite`: o brief citava o limite no "Faça agora", mas a aula abre pelo contador). Os nomes de botão são genéricos e o maestro os alinha.
2. **Widgets:** `quorum` (aula 1), `failover` e `conflito` (aula 2), `commit` e `lena` (aula 3), `ecst` (aula 4) e `crdt` (aula 6). A aula 5 não tem widget (tem a figura, a saída do `test_decoding` e o conector do Debezium em `CodeLab`).
3. **Código real:** `src/lab-code/replicacao/replicacao-lab.sh` (aula 2) e `postgres-connector.json` (aula 5, cópia exata do arquivo público do autor), ambos com `CodeLab` e números de linha citados no texto. Os imports ficam juntos no topo.
4. **Blocos de saída real** (`pg_stat_replication`, LSN, `test_decoding`, o JSON de 202 B) em `<pre>` depois da lista, nunca dentro de um `<li>`: o MDX não aceita `<li>` de várias linhas com `<pre>` dentro.
5. **Analogia das chaves** (artigo) uma vez só, na aula 1. **Pedido 1055** abre na aula 1 e é o fio das aulas 3 e 5; o **endereço da Lena** liga as aulas 2, 4 e 6.
6. **Correções ao artigo** ficam no Aprofundar da aula a que pertencem e na lista de `docs/fontes/replicacao.md` (11 itens).
7. **Widget `commit` com dois atrasos** (Rio e Recife): o brief pede um "lag", mas os 9 e 24 pedidos só aparecem juntos com um atraso por réplica; os padrões são 300 e 800 ms.
8. **`remote_apply` no widget `lena`:** o brief dá 82 ms por commit; com a réplica 800 ms atrás o commit espera o atraso inteiro (aviso da documentação sobre "atrasos de commit muito maiores"), e o widget mostra os dois casos.
9. **`FIRST 1` × `FIRST 2`:** o laboratório rodou `FIRST 1 (rio, recife)`, que é a semi-síncrona; para esperar as duas réplicas a configuração é `FIRST 2 (rio, recife)`, e o texto avisa que essa não foi rodada.
10. **Vocabulário fixo do brief:** replicação, cópia (nunca "clone"), primário e réplica, atraso (lag), síncrona, assíncrona, semi-síncrona, commit, ack, WAL, LSN, linha do tempo, promoção, eleição de líder, quórum, split brain, fencing, RPO e RTO, *read-your-writes*, consistência eventual, ECST (a sigla só depois do nome), CDC, slot de replicação, outbox, escrita dupla, CRDT, G-Counter, PN-Counter, OR-Set, LWW, vetor de versão, junção.
