# Judge: Sharding e Particionamento (módulo 16)

Passes feitos sobre as 10 aulas, o glossário, os widgets e o quiz, na ordem da skill (voz de IA, Strunk & White adaptado, consistência com o brief). Pendente fora do meu alcance: a revisão da Juliana e as figuras 3D (os marcadores `FIG:` ainda não viraram `<Figure3D>`).

## 1. Voz de IA
- Busca por "além disso", "ademais", "vale ressaltar", "em suma", "crucial", "fundamental", "essencial", "não é só X, é Y" e travessões: **0 ocorrências** nas aulas.
- Aberturas: toda aula abre com `<p class="ponte">` que retoma o problema em aberto (não "na aula passada vimos"). Fechos: toda aula termina com `<p class="gancho">` em forma de "Falta saber…" (aulas 1 a 9) e, na 10, com o gancho do módulo 17.
- Ajustes feitos no passe: a ponte da aula 6 tinha "as faixas deixaram faixas vazias" (repetição pesada); virou "deixaram shards vazios e outros sobrecarregados". Na aula 1 saiu o "(o relatório das 23:00 do módulo 6)" da frase do faturamento do dia, porque o brief cita "módulo 11" e as duas referências discordam; ficou sem módulo.
- Listas: no máximo 5 itens em "Como funciona" e em "Por que importa"; itens encadeados em ordem de acontecimento.

## 2. Consistência de números (aulas × quiz × glossário × widgets × brief)
Conferi por busca: 55,6% e T = 250; 75,2% (mod 3 → 4) e 49,9% e 66,7%; 25,7% (anel) e 25% (slots); 8 min 20 s, 13 min 20 s, 15 min 33 s, 16 min 40 s, 25 min; 62,9 / 7,5 / 1,1 ms; 2,97 / 9,56 / 39,5 / 63,4% e 0,10 / 0,2997 / 0,9955 / 4,88%; 91,2 / 74,4 / 53,1 / 46,9%; 45, 210 e 730.862.190.080; 0x8fd9d9d8 = 2.413.418.968. Nenhuma variante divergente (55,5, 75,1, 25,6 etc.).
Os widgets foram executados em Node contra o brief (`murmur3` com os 4 vetores; os 5 clientes: hex, `mod 3`, `mod 4`, slot, anel de 200 pontos antes e depois; a tabela de 1, 3, 10, 100 e 200 pontos; os pares do shuffle; 240 e 3.868 de 10.000; C(10,2), C(10,4), C(2048,4)): **tudo bate**.
Diferença conhecida e aceita: o texto diz "37,5 milhões de linhas" para 3 → 4 (75% teórico, como o brief), e o widget mostra 37,6 M, porque usa os 75,2% medidos.

## 3. Termos e personagens
Vocabulário fixo do brief respeitado: shard, partição (só dentro do servidor), chave de sharding, faixa, tier, poda, anel, ponto virtual, slot, diretório, reshard, scatter-gather, sal, shuffle sharding, subconjunto, raio de explosão. O elenco (Lena 1054, Bia, Caio, Davi, `mkt-01`) é o do brief; o robô de 500/s do módulo 8 volta na aula 9.

## 4. Pontos que a Juliana pode querer decidir
- O brief diz "37,5 milhões" e o widget calcula 37,6 M (acima).
- A aula 10 afirma que o Go **não foi rodado** (as saídas foram reproduzidas em Python), como o brief declara.
- `hashing-distrib/main.go` aparece só como saída (tabela), não como código em `<pre>`, para não repetir cinco funções quase iguais.
- Frases que não estão no brief e que acrescentei por precisão: _hedged requests_ (aula 2, do mesmo artigo de Dean e Barroso); Jump Consistent Hash e rendezvous na aula 7 (as fontes estão no brief); a partição `DEFAULT` na aula 5 (documentação do PostgreSQL).
