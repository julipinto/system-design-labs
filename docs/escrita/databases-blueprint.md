---
type: blueprint
module: databases
version: 1
---
# Blueprint: módulo 4, Databases, Modelos de Dados e Indexação

Aprovado pelo próprio agente, seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois). Dados canônicos: `docs/escrita/databases-brief.md`.

## Fio condutor (1 frase)
Todo banco é uma aposta sobre quais perguntas vão chegar ao dado: o modelo decide como o pedido 1042 fica guardado e o índice decide quantas páginas o disco lê para achá-lo.

## Exemplo e personagens canônicos
- A **loja** do módulo 2 e a **Lena** dos módulos 1 e 3. A Lena compra um gato de pelúcia: **pedido 1042** (Lena, gato de pelúcia, qtd 1, R$ 89,90, Recife).
- Tabela `pedidos` (6 linhas, sempre as mesmas): 1041 Caio, 1042 Lena, 1043 Bia, 1044 Lena, 1045 Davi, 1046 Bia. `SELECT SUM(valor) FROM pedidos` = **R$ 406,40**.
- Página de **8 KB** (PostgreSQL; InnoDB usa 16 KB). Na figura cada linha ocupa ~2 KB: 4 linhas por página, 6 linhas = 2 páginas (com 16 KB, 8 linhas por página: 1 página).
- Documento da Lena (pedidos 1042 e 1044 aninhados), coluna larga (`cliente=Lena`, colunas `pedido:1042` e `pedido:1044`), chave-valor (`carrinho:lena` e `sessao:lena`), grafo (Lena e Bia ligadas ao gato de pelúcia por COMPROU).
- Índices: B-Tree (raiz [1043], folhas [1041, 1042] e [1043 a 1046]; achar o 1042 = 2 páginas), hash (`1042 % 4 = balde 2`), invertido (`pelúcia` → [1042, 1043]; `caneca` → [1041, 1044, 1046]), LSM (memtable de 4 entradas, WAL, SSTable).
- Vocabulário fixo: "aula", "página", "linha", "varredura" (full scan), "memtable", "SSTable", "páginas lidas".

## Correções ao artigo-base (avisadas no texto, nos Aprofundar e em docs/fontes/databases.md)
1. ACID: o artigo escreve "Integridade"; o I é **Isolamento** (aula 2).
2. Consistência forte = **linearizabilidade**; sequential consistency é um modelo mais fraco. E "todas as réplicas sempre retornam o mesmo dado" vira "toda leitura vê a última escrita confirmada" (aula 3).
3. "Consistência forte = CA": CA só vale sem rede entre nós. Um banco distribuído e forte escolhe **CP** na partição (aula 3).
4. "Tudo o que não é forte é eventual": existe uma escada entre os dois (causal, ler o que você escreveu). Quórum de maioria na escrita **e** na leitura segue forte (aula 3).
5. NoSQL "sem relacionamentos": o modelo de grafos existe para relacionamentos (aulas 2 e 9).
6. Documento com "indexação invertida": bancos de documentos usam B-Tree nos campos; o índice invertido é do motor de busca (aulas 5 e 14).
7. Wide-column é outra coisa que colunar, apesar do nome parecido (aula 7).
8. LSM como trilha de auditoria "que guarda todas as versões": a compactação descarta versões antigas e tombstones; auditoria pede uma tabela só de inserção feita de propósito (aula 11).
9. "DynamoDB e InfluxDB usam LSM": o artigo do DynamoDB (USENIX 2022) descreve B-tree e log de replicação nos nós de armazenamento; o InfluxDB usa uma variante chamada TSM (aulas 11 e 15).
10. B-Tree x B+Tree: os bancos usam B+Tree (dados nas folhas, folhas encadeadas) (aula 12).
11. Hash "instantâneo": é O(1) em média, com colisões, e serve só para igualdade (aula 13).
12. Banco de séries temporais "sem garantia de ler o que escreveu": é escolha de cada produto, não do tipo (aula 2).
13. Tamanho de página "configurável": no PostgreSQL é fixado na compilação e no SQL Server é sempre 8 KB; só o InnoDB muda em runtime na criação da instância (aula 10).
14. O artigo cita 21 links nas Referências (o brief dizia 37); os 21 foram abertos.

## Estrutura por aula
Ordem: 1 o que é um banco → 2 tipos → 3 consistência → 4 a 9 os seis modelos de dados (linha, documento, coluna, coluna larga, chave-valor, grafo) → 10 como o disco guarda (páginas e formato colunar) → 11 a 14 os índices (LSM, B-Tree, hash, invertido) → 15 como escolher.

### Aula 1, O que é um banco
- **Tese:** um banco é a camada entre o programa e o disco que cuida de estrutura, consulta, alocação e índice.
- **Abre com:** ponte do módulo 3 (a loja copiou o estoque em três bancos sem dizer o que é um banco).
- **Pergunta que deixa:** quais tipos de banco existem e o que cada um aposta? → aula 2.

### Aula 2, Tipos de banco
- **Tese:** SQL, NoSQL, NewSQL, em memória e séries temporais são apostas diferentes entre consistência, escala e simplicidade.
- **Problema que abre:** o banco foi apresentado como uma coisa só, e a loja já tem pedidos, carrinho e métricas.
- **Pergunta que deixa:** "consistência" apareceu em todos; o que cada nível promete? → aula 3.

### Aula 3, Níveis de consistência
- **Tese:** consistência é uma escada (forte, intermediários, eventual) e cada degrau custa latência ou disponibilidade.
- **Problema que abre:** o Recife e o SP lendo o pedido 1042 da Lena em tempos diferentes.
- **Pergunta que deixa:** com a promessa escolhida, como o pedido fica guardado por dentro? → aula 4.

### Aulas 4 a 9, modelos
- **4 Tuplas:** a linha inteira numa página; ótimo para o 1042 e para ler/gravar um pedido. Deixa: e se o pedido for uma árvore (Lena com seus pedidos)? → documentos.
- **5 Documentos:** o 1042 e o 1044 aninhados na Lena, sem join; duplicação é o custo. Deixa: e se a pergunta for a soma de todos os valores? → colunar.
- **6 Colunar:** SUM(valor) lê só uma coluna (e comprime "SP, SP, SP"). Deixa: e se cada cliente tiver colunas diferentes e escrever muito? → coluna larga.
- **7 Coluna larga:** partição `cliente=Lena`, colunas `pedido:...`; não é o colunar. Deixa: e se nem precisar de colunas, só achar pela chave? → chave-valor.
- **8 Chave-valor:** `carrinho:lena`; a simplicidade vira velocidade e escala. Deixa: e "quem comprou o gato também comprou"? → grafos.
- **9 Grafos:** relacionamento como dado de primeira classe. Deixa: os seis modelos são formas de guardar; falta saber como o disco as lê em blocos → página.

### Aula 10, Page size e indexação colunar
- **Tese:** o banco lê e grava em páginas de tamanho fixo; escolher 8 ou 16 KB muda quantas linhas vêm por leitura, e o formato colunar guarda cada coluna em seu segmento.
- **Problema que abre:** os modelos falaram de "ler uma linha" sem dizer o que o disco entrega.
- **Pergunta que deixa:** agora que se sabe o tamanho do bloco, como organizar os blocos para a escrita não esperar o disco? → LSM.

### Aula 11, LSM-Trees
- **Tese:** a LSM transforma toda escrita em acréscimo (WAL + memtable) e paga na leitura e na compactação.
- **Pergunta que deixa:** a leitura precisa conferir vários arquivos; qual estrutura prioriza a leitura? → B-Tree.

### Aula 12, B-Tree
- **Tese:** a B-Tree mantém as chaves ordenadas em páginas e acha uma linha em poucas leituras; com 6 linhas empata com a varredura, com 1 milhão ganha de longe.
- **Pergunta que deixa:** e quando só se pergunta "é igual a 1042", sem ordem? → hash.

### Aula 13, Hashing
- **Tese:** a função hash leva a chave direto ao balde; serve só para igualdade e tem colisão.
- **Pergunta que deixa:** como achar uma palavra dentro do texto dos pedidos? → índice invertido.

### Aula 14, Índices invertidos
- **Tese:** o índice invertido liga cada termo aos documentos em que aparece.
- **Pergunta que deixa:** com as quatro estruturas, como decidir para a loja? → aula 15.

### Aula 15, Escrita e leitura intensivas
- **Tese:** a escolha parte da pergunta que mais chega: transacional (B-Tree, consistência forte), escrita pesada (LSM, eventual), leitura pesada (réplicas, cache, CQRS).
- **Fecha o módulo:** o banco certo é o que casa modelo, índice e consistência com a pergunta mais frequente da loja; falta saber como dividir e copiar os dados entre servidores quando um só não aguenta.

## Pontos de atenção
1. Com 6 linhas, a B-Tree **empata** com a varredura (2 páginas). O texto, o widget e a figura devem dizer isso e então escalar para 1 milhão de linhas (250.000 páginas contra 4 leituras).
2. No PostgreSQL, achar uma linha pelo índice custa uma leitura a mais (a página da tabela); no InnoDB a folha já traz a linha. O brief usa o modelo do InnoDB (2 leituras).
3. Aula 15 não tem figura 3D; usa o escolhedor 2D.
