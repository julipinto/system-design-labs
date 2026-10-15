---
type: blueprint
module: cap-acid-base
version: 1
---
# Blueprint: módulo 3, CAP, ACID e BASE

Aprovado pelo próprio agente, seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois).

## Fio condutor (1 frase)
Quando o mesmo dado vive em mais de um lugar, cada garantia custa alguma coisa (recusar pedidos na falha, esperar no dia a dia ou conciliar depois), e a decisão certa é tomada por operação, antes da falha.

## Exemplo e personagens canônicos
- **Lena** e o **irmão** dela. Lena em São Paulo, irmão em Recife.
- **Gato de pelúcia**: estoque 5 em 3 bancos (SP, Rio, Recife). Pedidos #101 (5 → 4), #102 da Lena (SP) e #103 do irmão (Recife). Estoque real no fim: 2. Versões v1, v2, v3a/v3b, v4.
- **Transferência de R$ 100**: Lena 150 → 50, irmão 20 → 120, total R$ 170. Aluguel automático de R$ 40 (lost update: certo é R$ 10).
- Números do exemplo (sempre avisados como exemplo): ~5 ms (resposta assíncrona), ~80 ms (síncrona), 300 ms (rede lenta), timeout de 3.000 ms, quórum 2 de 3.
- Vocabulário fixo: "aula" (não "lição"), "quórum", "partição de rede", "réplica", "leitura velha (stale read)", "cabo entre Rio e Recife".

## Estrutura por aula
Ordem do módulo: 1 CAP (o problema) → 2 ACID (o que um banco único promete) → 3 BASE (o que se promete ao abrir mão disso) → 4 definições exatas do CAP → 5 combinações CP/AP/CA → 6 críticas → 7 PACELC.

### Aula 1, Teorema CAP
- **Tese:** durante uma partição, um sistema replicado só consegue ou recusar (consistente) ou responder (disponível).
- **Problema que abre:** Lena e o irmão compram o gato ao mesmo tempo e o cabo para Recife cai. (Primeira aula: abre pelo problema concreto, sem ponte.)
- **Pergunta que deixa:** recusar para não errar é uma promessa de banco; que promessas um banco faz dentro de uma transação? → ACID.

### Aula 2, ACID
- **Tese:** ACID é a promessa de que uma transação (a transferência de R$ 100) fica inteira, válida, isolada e durável.
- **Problema que abre:** a recusa do Recife, na aula 1, só vale se o banco souber desfazer; o que um banco único já promete?
- **Pergunta que deixa:** essas garantias custam espera e trava; e se a loja preferir responder logo e acertar depois? → BASE.

### Aula 3, BASE
- **Tese:** BASE troca a certeza imediata por velocidade e disponibilidade, e exige uma regra para conflitos.
- **Problema que abre:** o ACID faz a Lena esperar; a mesma transferência, agora respondida na hora por um nó.
- **Pergunta que deixa:** "consistente" e "disponível" foram usados no sentido do dia a dia; o que elas querem dizer com exatidão? → aula 4.

### Aula 4, Componentes do CAP
- **Tese:** C, A e P têm definições estreitas e só com elas o teorema vale; o quórum é a ferramenta do C.
- **Problema que abre:** as aulas 1 e 3 usaram C e A por intuição.
- **Pergunta que deixa:** com as letras definidas, como os sistemas reais combinam as escolhas? → CP, AP, CA.

### Aula 5, Combinações CP, AP, CA
- **Tese:** CP recusa, AP responde e concilia, CA só existe sem rede; a escolha real é CP x AP, por operação.
- **Problema que abre:** qual combinação serve ao estoque, ao saldo e ao carrinho?
- **Pergunta que deixa:** rótulos são aproximados; a ideia de "escolha 2 de 3" aguenta? → críticas.

### Aula 6, Críticas modernas
- **Tese:** "escolha 2 de 3" simplifica demais: partição é rara, C e A são graus, e a escolha é por operação (com plano de recuperação).
- **Problema que abre:** os rótulos da aula 5 já se contradiziam; as críticas explicam por quê.
- **Pergunta que deixa:** a rede passa quase todo o tempo boa e o CAP não diz nada sobre latência; o que se sacrifica então? → PACELC.

### Aula 7, PACELC
- **Tese:** sem partição, a escolha é latência x consistência; com partição, disponibilidade x consistência.
- **Problema que abre:** a lacuna de latência deixada pela aula 6.
- **Fecho do módulo:** a pergunta é a mesma com a rede cortada ou boa (esperar ou arriscar), respondida por operação.

## Pontos que hoje quebram o fio
1. Nenhuma aula abre com ponte nem fecha com gancho: cada uma recomeça do zero.
2. A aula 2 (ACID) entra sem dizer por que interrompe o CAP; a aula 3 repete o salto.
3. A aula 4 re-define C, A e P como se fossem novidade, depois de a aula 1 já tê-los usado.
4. O "C do ACID x C do CAP" aparece em duas aulas, com o mesmo texto.
5. "Último gato do estoque" (aulas 5 e 6, DoIt da 6) não bate com a figura (estoque 5, real 2 no fim); a aula 6 manda "ver o carrinho" numa figura que não tem carrinho.
6. Vector clock da aula 3 ({SP:2, REC:1} / {SP:1, REC:2}) não bate com os pedidos da cena.
7. "Lição" e "aula" misturados; "quorum" e "quórum" misturados.
8. Itens de lista que não conversam (aula 2: níveis de isolamento sem ligar ao aluguel da cena).

## Decisões
- Ponte de abertura em `<p>` simples logo antes do "Em uma frase" (sem componente novo, sem CSS novo). Gancho em `<p>` simples antes dos flashcards, depois do bloco "Aprofundar".
- Fatos e números mantidos. Mudanças factuais só para alinhar com a figura (vector clock, "último gato").
- Flashcards intactos.
