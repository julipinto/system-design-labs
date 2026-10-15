---
type: judge-report
module: cap-acid-base
---
# Relatório do Judge: módulo 3, CAP, ACID e BASE

## Passes feitos
1. **Voz de IA (português).** Busca por: crucial, fundamental, essencial, vale ressaltar, além disso/ademais em sequência, em suma, "não é apenas X, é Y", travessões. Nenhuma ocorrência. Cortei duas construções de contraste ("Eventual não é 'qualquer coisa'", "Quorum é uma ferramenta, não uma garantia mágica") e as reescrevi como afirmação direta.
2. **Strunk & White adaptado.** Frases terminam no fato; verbos simples; "Se o estoque acabar, cancelar um pedido, pedir desculpa, dar um cupom" (fragmento, aula 5) virou frase completa; repetição da palavra certa ("réplica", "partição", "quórum") em vez de sinônimos.
3. **Resumos no fim de seção.** Nenhum adicionado. O "Resumo rápido: CAP, PACELC, ACID e BASE" (Aprofundar da aula 7) foi mantido: é material de consulta, está recolhido e é o único ponto do módulo que junta os quatro conceitos.
4. **Consistência com as figuras** (cap-3d e acid-3d, só leitura).

## Corrigido
- "Lição" -> "aula" (aulas 1, 2, 5) e "quorum" -> "quórum" em texto, tabela e um flashcard (grafia igual à da figura).
- Vector clock (aula 3): `{SP:2, REC:1}` / `{SP:1, REC:2}` não batia com os pedidos da cena. Agora SP `{SP:2, REC:0}` (#101, #102) e Recife `{SP:1, REC:1}` (#101, #103), concorrentes, coerentes com o CRDT do mesmo quadro.
- "Último gato do estoque" (tabela da aula 5, DoIt e itens da aula 6): a figura tem estoque 5 e real 2 no fim. Troquei por "estoque do gato de pelúcia". A conta de compensação da aula 6 virou condicional ("se a #102 e a #103 disputassem a última unidade").
- DoIt da aula 6 mandava ver o "carrinho" numa figura que não tem carrinho. Agora pede para olhar a #101 sem partição, cortar o cabo, trocar para CP e perguntar se a mesma regra serviria ao carrinho.
- "C do ACID x C do CAP" aparecia com o mesmo texto nas aulas 2 e 4. A aula 4 agora retoma a aula 2 em vez de repetir.
- Aula 6: frase "mesmo bancos" da primeira versão da ponte, corrigida antes do commit.

## Consistência verificada (ok)
- Personagens: Lena (SP) e irmão (Recife) em todas as aulas e figuras.
- Números: estoque 5 -> 4 (#101, v2) -> 3 (#102 / #103, v3a/v3b) -> real 2 (v4); R$ 150/20 -> 50/120, total 170; aluguel R$ 40, certo = R$ 10; ~5 ms (EL), ~80 ms (EC), 300 ms (rede lenta), timeout 3.000 ms, quórum 2 de 3.
- Nós A/B/C da figura BASE = SP/Rio/Recife no texto da aula 3.

## Pendências (decisão da Juliana)
1. Aula 1 cita "~12 ms" para a #101 no modo CP/AP (como na figura) e a aula 7 cita ~5 ms e ~80 ms para a mesma venda nos modos EL e EC. Vem das figuras; os números são de cenários diferentes, mas pode parecer contradição. Sugestão: uma frase na aula 7 dizendo "12 ms é a venda do modo CP/AP da aula 1".
2. A aula 3 usa "~5 ms" para o app responder; a figura BASE não mostra milissegundos. Mantido porque bate com o EL da figura cap-3d.
3. As aulas 2 e 3 usam a figura acid-3d, cujo poster/alt ainda descreve "transação desfeita com ROLLBACK" também no modo BASE (alt de Figure3D, fora do escopo).
4. A palavra "carrinho" aparece nas aulas 5, 6 e 7 como exemplo de AP, mas nenhuma figura a mostra. Se virar figura, o texto já está pronto para ela.
5. `min` (tempo de leitura) mantido: o texto cresceu ~40 palavras por aula, dentro da margem.

## Checklist do ESCRITA.md (primeira e última frase de cada aula)
1. "A Lena compra um gato de pelúcia em São Paulo. [...]" / "[...] Falta saber o que um banco promete, dentro de uma transação, para nunca deixar a conta da Lena pela metade. É o ACID."
2. "Na aula passada, o banco de Recife recusou o pedido do irmão [...]" / "[...] Falta saber o que o BASE promete no lugar do ACID."
3. "O ACID faz a Lena esperar [...]" / "[...] Falta saber o que essas palavras [...] querem dizer com exatidão no CAP."
4. "Nas aulas 1 e 3 a gente falou de bancos 'consistentes' e 'disponíveis' por intuição [...]" / "[...] falta ver como os sistemas reais juntam essas escolhas."
5. "Com C, A e P bem definidos, dá para montar as combinações [...]" / "[...] Falta saber o que as críticas modernas ao CAP dizem sobre ela."
6. "A aula passada terminou com um aviso: os rótulos CP e AP são aproximações [...]" / "[...] É a pergunta do PACELC."
7. "A aula passada deixou uma lacuna: o CAP não diz nada sobre latência [...]" / "[...] responde isso operação por operação, antes da falha."

Lidas em sequência, as 14 frases contam a história: replicar obriga a escolher; o ACID mostra o que um banco único promete; o BASE mostra o que se abandona; o CAP precisa de definições exatas; as combinações são aproximações; a crítica mostra que a escolha é por operação; o PACELC acrescenta a latência quando a rede está boa. Resultado: passa.
