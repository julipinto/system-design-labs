# Judge: Storage, RAID e I/O

## Corrigido
**Voz de IA (pt-BR).** Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "não é apenas X, é Y", "ademais" e travessões: 0 ocorrências nas 13 aulas. Resumos no fim de seção: nenhum; o fim de cada aula é um gancho, não um resumo. O gancho de 12 aulas seguia a mesma fórmula ("Falta saber… É o X."); variei o fecho em 8 delas para a cadência não virar tique.

**Strunk & White adaptado.** Cortei "Mais discos, mais chance" onde repetia o item vizinho, tirei "qualquer que seja o número" ambíguo da aula 10 e troquei o fecho genérico "Para isso, as próximas aulas" (aula 8) por um fato concreto (a próxima aula copia cada bloco). Frases em voz ativa, verbos simples.

**Consistência de termos, números e personagens.**
- Personagem: a Camisaria da Lia, camisa-azul e `lojadalia-fotos` viraram "a loja", gato.jpg e `loja-fotos`, como nas figuras.
- Foto: 4 MB (1.024 blocos) virou gato.jpg de 2,4 MB (600 blocos, LBA 2048 a 2647, inode 1311), como na storage-3d. Aula 1: 500 mil fotos, ~1,2 TB (antes ~2 TB).
- Discos: 5 x 10 TB e 4 x 10 TB viraram o padrão da figura raid-3d (1 TB; 4 discos em RAID 0, 5 e 10; 2 no RAID 1; 5 no RAID 6). Contas refeitas: RAID 5 = 3 TB, escrita aleatória 150 IOPS (antes 187); RAID 6 = 3 TB, 125 IOPS; RAID 10 = 300 IOPS; RAID 0 = 4 TB. Rebuild e URE seguem em "e se fossem 10 TB", com a conta de 1 TB ao lado.
- XOR da aula 10: A1=1011, A2=0110, A3=0101, P1=1000, como na figura (conferi: 1011^0110^0101=1000 e 1011^0101^1000=0110).
- Latência: NVMe ~0,1 ms, SSD SATA ~0,2 ms, NAS ~1 ms, como na storage-3d (antes 0,02 ms e 0,1 ms nas aulas 1 e 4).
- Discos agora D1 a D4 (a aula 8 usava A, B, C, D, que colidiam com os blocos A1, A2).
- DoIt das aulas 11 e 12 pedia "dois discos falhando", mas a figura só queima o D2. A ação agora é a que a figura faz.
- RAID passou a ser definido (Redundant Array of Independent Disks, controladora) na aula 8; antes nunca era explicado.

## Pendências (fora do meu escopo)
1. **Quiz** (`public/labs/storage-raid-io/quiz/questions.js`): ainda usa a Lia, camisa-azul, discos de 10 TB (RAID 0 = 40 TB, RAID 1 = 10 TB, RAID 5 com 5 x 10 TB…), foto de 4 MB. As respostas ficam erradas diante das aulas novas.
2. **Glossário** (`src/data/glossary-storage-raid-io.js`): conferir exemplos com Lia, 10 TB e NVMe 0,02 ms.
3. **Alt das figuras** nas aulas 3 a 7 e 8 a 12: todas repetem o alt de uma única cena ("volume de blocos…" em todos os modos da storage-3d; "RAID… XOR da paridade" em todos os modos da raid-3d). Não é fato errado, mas o alt de DAS, NAS, file e object descreve block, e o de RAID 0, 1, 6 e 10 descreve RAID 5. Fica no frontmatter do componente `<Figure3D>`, que não mexi.
4. **Figura raid-3d no RAID 6 e no RAID 10** só mostra uma falha (D2). A segunda falha só existe no texto. Se a Juliana quiser ver, é trabalho de figura.
5. **Widget de RAID** (aula 13): o padrão inicial pode ainda ser 5 x 10 TB; o DoIt já manda escolher 4 discos de 1 TB.

## Checklist final (primeira e última frase de cada aula)
1. Uma loja online acabou de abrir… / "Falta saber como medir o que cada dado pede."
2. Na aula passada o banco pediu "latência baixa"… / "…onde o disco deve ficar? O caminho mais curto é espetá-lo no servidor."
3. Com IOPS e latência na mão, a loja precisa gravar o gato.jpg… / "Falta saber como A, B e C enxergam a mesma pasta."
4. O servidor B procurou o gato.jpg e não achou… / "Falta saber como é um disco que entrega só blocos."
5. O NAS resolveu o compartilhamento, mas… / "Falta saber como o nome gato.jpg chega aos blocos."
6. O volume guarda 600 blocos e nenhum nome… / "Falta saber como guardar milhões de arquivos sem árvore."
7. A loja guarda 500 mil fotos… / "Sobra o pedidos.db num disco só. Falta saber como juntar discos."
8. Fotos e backups já têm casa; o pedidos.db não… / "Falta saber o que muda se cada bloco existir em dois discos."
9. No RAID 0, o D2 queimou e levou o pedidos.db… / "Falta saber se dá para proteger vários discos gastando só um."
10. O espelho salvou o pedidos.db, mas gastou metade dos discos… / "Falta saber como aguentar dois discos de uma vez."
11. O rebuild do RAID 5 deixa a loja sem margem… / "Falta saber se existe nível que una velocidade e proteção sem paridade."
12. O pedidos.db escreve muito… / "Falta saber qual nível vai em cada dado da loja."
13. Agora existem cinco níveis… / "O pedidos.db está no RAID 10, mas a máquina inteira ainda pode cair."

Resultado: a história se conta só com as pontas. Sim.
