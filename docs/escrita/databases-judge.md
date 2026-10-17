---
type: judge-report
module: databases
---
# Relatório do Judge: módulo 4, Databases, Modelos de Dados e Indexação

## Passes feitos
1. **Voz de IA (português).** Busca automática por: crucial, fundamental, essencial, vale ressaltar, além disso, ademais, em suma, "não é apenas/só X", travessões, "robusto", "poderoso". Nenhuma ocorrência (o único "além disso" achado era "Nada além disso" num flashcard, uso literal).
2. **Strunk & White adaptado.** Frases terminam no fato, verbos simples, uma ideia por parágrafo. A palavra certa se repete ("página", "linha", "memtable", "SSTable", "varredura") em vez de sinônimos.
3. **Ponte e gancho.** As 15 aulas abrem retomando o problema deixado pela anterior (a 1 faz a ponte com o módulo 3) e fecham com "Falta saber…" (checado por busca: uma ocorrência por aula).
4. **Encadeamento das listas** de "Como funciona": cada item se refere ao vizinho (WAL → memtable → SSTable → versão nova → leitura → compactação; raiz → folha → empate → 1 milhão → divisão de folha).
5. **Consistência de números** entre texto, widgets, quiz e glossário: tabela de 6 pedidos, SUM = R$ 406,40, 8 KB e 16 KB, linha de 2 KB (4 e 8 por página), 6 linhas = 2 páginas (8 KB) ou 1 (16 KB), B-Tree raiz [1043] e 2 leituras (a varredura também lê 2), 1 milhão de linhas = 250.000 páginas contra 4, hash 1042 % 4 = balde 2 (1046 colide; 1041 e 1045 no balde 1), pelúcia → [1042, 1043], caneca → [1041, 1044, 1046], memtable de 4 entradas, Lena com R$ 109,80.

## Corrigido durante a escrita
- Aula 5: bloco de código dentro de `<li>` quebrava o MDX; o JSON da Lena passou para antes da lista.
- Aula 2: o exercício dizia "confira no fim da aula" mas a resposta fica no quadro antes de "Por que importa"; ajustado.
- O blueprint dizia que a correção "ACID é Isolamento" estava na aula 2, mas o texto não a trazia. Incluída no passo 1 e no Aprofundar da aula 2, com uma questão no quiz (agora 61).
- Honestidade de números: com 6 linhas a B-Tree empata com a varredura (2 e 2). O texto, o widget e o brief da figura dizem isso e só então escalam para 1 milhão de linhas.

## Pendências (decisão da Juliana ou da integração das figuras)
1. DoIts das aulas 4 a 14 descrevem botões das figuras ("modo linha", "modo hash", "sem índice"). Os rótulos reais dependem das figuras 3D em construção; conferir na integração.
2. A aula 10 tem dois marcadores (`page` e `column`); a figura precisa dos dois modos ou um dos marcadores sai.
3. A aula 12 pede "procure sem índice (a varredura)" dentro do modo B-Tree; se a figura só trocar de modo, o DoIt deve mandar abrir `scan`.
4. A aula 15 não tem figura 3D (usa o escolhedor 2D).
5. `min` (tempo de leitura) estimado, não medido.
6. Frase sobre ScyllaDB e LSM ficou fora dos textos porque a documentação própria dela não foi conferida (ver docs/fontes/databases.md).

## Checklist do ESCRITA.md (primeira e última frase de cada aula)
1. "No módulo 3 a loja copiou o estoque […]" / "[…] Falta saber que tipos de banco existem e o que cada um troca para ganhar velocidade ou escala."
2. "Na aula passada a loja tinha um banco com a tabela pedidos […]" / "[…] Falta saber o que cada nível dessa promessa quer dizer quando a Lena grava o pedido 1042 e a Bia lê de outro servidor."
3. "Na aula passada cada tipo de banco prometeu uma 'consistência' diferente […]" / "[…] Falta saber como o pedido 1042 vive no disco do modelo mais tradicional, a linha de uma tabela."
4. "A aula passada terminou numa pergunta: como o pedido 1042 […] fica guardado por dentro?" / "[…] Falta saber como seria guardar a Lena e os pedidos dela como um objeto só."
5. "Na aula passada a Lena apareceu em duas linhas soltas […]" / "[…] Falta saber o que acontece quando a pergunta é 'qual o total de todos os valores' […]."
6. "A aula passada terminou numa soma […]" / "[…] Falta saber como organizar os dados quando cada cliente tem seu próprio conjunto de colunas […]."
7. "O colunar da aula passada pede que toda linha tenha as mesmas colunas […]" / "[…] Falta saber qual é o modelo mais simples de todos […]."
8. "A aula passada ainda tinha partições, famílias e colunas […]" / "[…] Falta saber como guardar as ligações entre a Lena, o gato de pelúcia e a Bia […]."
9. "Na aula passada cada par chave e valor vivia sozinho […]" / "[…] Falta saber como o banco divide tudo isso em páginas de tamanho fixo […]."
10. "Nos seis modelos a gente falou em 'ler uma linha' […]" / "[…] Falta saber como uma estrutura que só acrescenta ao fim, a LSM-Tree, faz isso […]."
11. "Na aula passada vimos que o banco lê e grava páginas […]" / "[…] Falta saber qual estrutura faz o oposto […], a B-Tree."
12. "A LSM deixou a leitura espalhada por vários arquivos […]" / "[…] Falta saber se existe um atalho ainda mais direto, e é o hashing."
13. "A aula passada terminou numa pergunta […] a B-Tree ainda precisa descer da raiz […]" / "[…] Falta saber como achar os pedidos que mencionam 'pelúcia' […] índice invertido."
14. "O hash da aula passada acha um pedido pelo id […]" / "[…] Falta saber como escolher entre eles […]."
15. "Na aula passada ficou a pergunta de como escolher […]" / "[…] Falta saber como dividir os dados entre vários servidores (sharding) e como copiá-los (replicação) […]."

Lidas em sequência, as 30 frases contam a história: um banco guarda e acha dados; há tipos com apostas diferentes; a consistência é uma escada; o pedido 1042 pode viver em seis formas, cada uma boa para uma pergunta; o disco lê páginas; a LSM favorece a escrita, a B-Tree a leitura ordenada, o hash a igualdade e o invertido o texto; a escolha parte da pergunta mais frequente, e o próximo passo é dividir e copiar os dados. Resultado: passa.
