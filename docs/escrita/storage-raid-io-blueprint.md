# Blueprint: Storage, RAID e I/O

## Fio condutor (1 frase)
A loja online precisa guardar a foto gato.jpg e o banco pedidos.db: primeiro se escolhe onde cada dado mora e como ele é organizado (aulas 1 a 7), depois se juntam discos para que um disco que queima não leve o pedidos.db junto (aulas 8 a 13).

## Exemplo e personagens canônicos
- **A loja online**, sem nome próprio. A "Camisaria da Lia", a camisa-azul e o bucket lojadalia-fotos saem: as figuras 3D nunca usaram esses nomes.
- **Aulas 1 a 7 (tipos de storage, figura storage-3d):** a foto **gato.jpg**, 2 457 600 bytes (2,4 MB), caminho `produtos/gatos/gato.jpg`. Servidores **A, B e C** da loja. SSD NVMe de 1 TB no A (`/data`), NAS `nas.loja` (10.0.0.50, `/export/fotos`, montado em `/mnt/nas`), volume de blocos de 100 GB (`/dados`, LBA 2048 a 2647, 600 blocos de 4 KB, inode 1311), EFS em `/mnt/efs`, bucket `loja-fotos`.
- **Aulas 8 a 13 (RAID, figura raid-3d):** o arquivo **pedidos.db**, cortado em blocos A1, A2, A3…; discos nomeados **D1, D2…**; o **D2** é sempre o disco que queima; controladora RAID.
- **Padrão de discos (decisão):** discos de **1 TB**, como na figura. RAID 0, 5 e 10 com **4 discos**; RAID 1 com **2**; RAID 6 com **5** (a figura usa 5 para mostrar 3 blocos de dados + P + Q por faixa). As aulas usavam 5 x 10 TB (e 4 x 10 TB no RAID 0 e no 10). Os 10 TB só voltam como "e se os discos fossem grandes?" nas contas de rebuild e URE, onde o tamanho é o argumento.
- **Números das figuras conferidos e mantidos:** raid-3d (4 TB / 1 TB / 3 TB / 3 TB / 2 TB úteis; escrita pequena 1 / 2 / 4 / 6 / 2 I/Os; bits A1=1011, A2=0110, A3=0101, P1=1000) e storage-3d (gato.jpg = 600 blocos; NVMe ~0,1 ms por leitura de 4 KB; NAS ~1 ms; objeto em dezenas de ms; NFS WRITE de até 1 MB).

## Aula por aula

### 1. Storage em System Design
- **Tese:** cada tipo de dado da loja pede um tipo de disco diferente.
- **Problema que abre:** a loja vai guardar pedidos, fotos e backups, e um disco só não serve para os três.
- **Pergunta que deixa:** como medir o que cada dado pede? (IOPS, throughput, banda)

### 2. Throughput, bandwidth, IOPS
- **Tese:** throughput = IOPS x tamanho do bloco, limitado pela banda; o menor dos dois manda.
- **Problema que abre:** "latência baixa" e "muito espaço" ainda são palavras; falta uma conta.
- **Pergunta que deixa:** com a conta pronta, onde o disco deve ficar? No próprio servidor? (DAS)

### 3. DAS
- **Tese:** disco ligado direto no servidor é o caminho mais curto e rápido, mas só aquele servidor o enxerga.
- **Problema que abre:** gato.jpg precisa ser gravada com o menor caminho possível.
- **Pergunta que deixa:** e quando o servidor B precisar da mesma foto? (NAS)

### 4. NAS
- **Tese:** o NAS põe a pasta na rede, e A, B e C enxergam a mesma foto, ao custo da rede.
- **Problema que abre:** B procura gato.jpg e não acha; a cópia manual deixa duas fotos.
- **Pergunta que deixa:** o NAS entrega pastas prontas; e o banco, que quer o disco cru e a menor latência? (block)

### 5. Block storage
- **Tese:** block entrega blocos numerados (LBA), sem nome, pasta nem dono; quem usa decide o que gravar.
- **Problema que abre:** o pedidos.db precisa regravar 4 KB no meio de um arquivo, sem rede de arquivos no caminho.
- **Pergunta que deixa:** se o volume não sabe que é uma foto, quem dá nome e pasta aos blocos? (file)

### 6. File storage
- **Tese:** o sistema de arquivos liga nomes e pastas aos blocos (inode), e vários clientes compartilham a árvore.
- **Problema que abre:** 600 blocos soltos não são um gato.jpg; falta um mapa.
- **Pergunta que deixa:** e quando a árvore tiver milhões de fotos e a pasta não escalar? (object)

### 7. Object storage
- **Tese:** objeto = conteúdo + metadados + chave num bucket plano, acessado por HTTP; escala quase sem limite, mas troca o objeto inteiro.
- **Problema que abre:** milhões de fotos e backups não cabem numa árvore de pastas.
- **Pergunta que deixa:** fotos e backups têm casa; o pedidos.db continua num disco só, e disco queima. Como juntar discos? (RAID 0)

### 8. RAID 0
- **Tese:** fatiar o arquivo entre discos soma a velocidade, mas um disco que queima derruba o arquivo inteiro.
- **Problema que abre:** um disco só é lento e é ponto único de falha; a loja junta 4 discos de 1 TB.
- **Pergunta que deixa:** e se cada bloco existisse em dois discos? (RAID 1)

### 9. RAID 1
- **Tese:** espelhar cada bloco em dois discos sobrevive à perda de um, por metade do espaço.
- **Problema que abre:** o D2 queimou e levou o pedidos.db no RAID 0.
- **Pergunta que deixa:** metade do espaço é caro; dá para proteger vários discos gastando só um? (RAID 5)

### 10. RAID 5
- **Tese:** uma paridade (XOR) que gira entre os discos refaz o bloco perdido, gastando só um disco; a escrita pequena custa 4 I/Os e o rebuild é arriscado.
- **Problema que abre:** o espelho desperdiça 50%.
- **Pergunta que deixa:** e se um segundo disco falhar durante o rebuild? (RAID 6)

### 11. RAID 6
- **Tese:** duas paridades (P e Q) toleram dois discos, por mais um disco de espaço e escrita pequena de 6 I/Os.
- **Problema que abre:** o rebuild do RAID 5 deixa a loja sem margem.
- **Pergunta que deixa:** o pedidos.db é um banco com muita escrita, e 6 I/Os por escrita pesa. Existe nível que une velocidade e proteção sem paridade? (RAID 10)

### 12. RAID 10
- **Tese:** pares espelhados com os dados fatiados entre eles: escrita barata (2 I/Os), rebuild simples, metade do espaço.
- **Problema que abre:** o banco pede escrita rápida e rebuild leve.
- **Pergunta que deixa:** são cinco níveis; qual vai em cada dado da loja? (resumo)

### 13. Resumo e comparativos
- **Tese:** cada nível troca espaço, velocidade e segurança de um jeito, e nenhum é backup.
- **Problema que abre:** escolher o nível certo para cada dado.
- **Gancho final:** falta saber o que fazer quando a máquina inteira cai (réplica e sharding).

## Pontos que hoje quebram o fio (e a decisão)
1. **Exemplo trocado entre os blocos:** a Camisaria da Lia, camisa-azul e `lojadalia-fotos` nas aulas; gato.jpg e `loja-fotos` nas figuras. Decisão: tudo vira "a loja" e gato.jpg.
2. **Foto de 4 MB (1.024 blocos) na aula 5, gato.jpg de 2,4 MB (600 blocos) na figura.** Decisão: vale a figura. Fotos da aula 1 passam a ~2,4 MB (500 mil arquivos, ~1,2 TB).
3. **Discos 5 x 10 TB nas aulas, 4 x 1 TB na figura.** Decisão acima. A conta de IOPS muda: RAID 5 com 4 discos de 150 IOPS = 150 IOPS de escrita aleatória (antes 187); RAID 10 = 300 (o dobro do RAID 5 com os mesmos 4 discos).
4. **Latência do NVMe:** 0,02 ms nas aulas 1 e 4, ~0,1 ms (leitura de 4 KB) na figura. Decisão: ~0,1 ms; SSD SATA ~0,2 ms; NAS ~1 ms.
5. **Exemplo de XOR da aula 10 (A=1010, B=0110…)** diferente do da figura (1011, 0110, 0101, P=1000). Decisão: o da figura.
6. **Aulas 11 e 12 mandam "fazer dois discos falharem"**, mas a figura só queima o D2. Decisão: a ação passa a ser a que existe (D2 falha) e a segunda falha vira pergunta no texto.
7. **RAID nunca era definido** antes da aula 8 (controladora, "array de discos"). Decisão: definir na aula 8, depois de criar a necessidade.
8. **Discos chamados A, B, C, D (aula 8) colidem com os blocos A1, A2.** Decisão: discos D1 a D4.
9. **Faltavam ligações:** cada aula abria com a definição, sem dizer o que a anterior deixou em aberto; só o gancho de "Aulas 3 a 7" no mapa da aula 1 ligava o módulo. Decisão: ponte na abertura e gancho no fim de cada aula.
