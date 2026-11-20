# Faixa 14-21: a Noite da Black Friday 2026 (registro das mudanças)

Reescrita narrativa dos módulos 14 a 21 conforme `serie.md`. Mudanças cirúrgicas, só em PT (`src/content/<slug>/`) e EN (`src/content/_en/<slug>/`), sempre as duas versões equivalentes. Nenhum número, ID, horário ou valor mudou. Quiz e glossário não citavam personagem, cidade do irmão ou papel errado, então não foram tocados.

Nas aulas, "aula N" = arquivo `aula-N-*.mdx`.

## 14 Performance (`performance`)
- Aula 1, ponte: ponte com o módulo 13 (o Téo agenda a newsletter para as 20:00), cena (sex 27/11/2026, time no escritório de Recife, Marta no painel, a Lena entre os que esperam 2 s) e a Iara como quem decide o que medir.
- Aula 1, item da meta: "a Iara escreve a meta do exemplo" (p95 300 ms, erros 0,1%).
- Aula 4: "Se a Iara tivesse feito o scale up" (era "a loja").
- Aula 5, ponte: "A Iara precisa decidir quantas ligar".
- Aula 6, gancho: preço (banco do `pedidos` a 150/s, a Marta pergunta o que vem depois das réplicas) e ponte para as 20:05, a Iara na lousa (módulo 15).

## 15 Scale Cube (`scale-cube`)
- Aula 1, ponte: 20:05, a Iara na lousa organizando o que a loja já fez.
- Aula 1 (linha da tabela), aula 5 e widget `src/scripts/scale-cube/widgets.js` + `.en.js`: `mkt-01` passa a ser dito "MegaMercado, marketplace que o Téo fechou no módulo 8" (a explicação única do módulo 15).
- Aula 4, ponte: "quando a Iara e os três times partiram o monolito".
- Aula 6, gancho: a lousa mostra os 50 milhões de linhas e o MegaMercado com 40%; a Iara escolhe a chave no módulo 16.

## 16 Sharding (`sharding`)
- Aula 1, ponte: 20:08, MegaMercado (que o Téo trouxe) com 40% da tabela, a Lena acabou de comprar o 1054, a Iara decide como partir.
- Aula 3, ponte: "a escolha é da Iara" (chave de sharding).
- Aula 10, gancho: o preço da decisão da Iara (cada shard é um servidor só) e a ponte para a réplica de Recife atrasada (módulo 17).

## 17 Replicação (`replicacao`)
- Aula 1, ponte: 20:10, o preço do sharding da Iara e a Lena prestes a comprar o 1055.
- Aula 2 e aula 3, pontes: "a Iara decidiu" / "a Iara escolheu um primário em SP" (era "a loja").
- Aula 6, gancho: o preço (réplica de Recife 800 ms atrás, a Lena não vê o 1055) e a Bruna como quem vai fazer a tela ler de uma cópia (módulo 18).

## 18 CQRS (`cqrs`)
- Aula 1, ponte: 20:12, a Bruna (dona do app) decide separar leitura e escrita; Júlio (checkout) e Raí (relatório das 23:00) entram como quem disputa o banco; a Lena comprou o 1056.
- Aula 10, gancho: preço (mais um modelo para manter, leitura alguns ms atrás) e ponte para as 20:15 (Raí acha estoque avariado, Pix do Davi já aprovado).

## 19 Saga (`saga`)
- Aula 1, ponte: 20:15, o Davi abre o 1057 para pagar no Pix, a Logística do Raí zera o estoque às 20:15:10, o Pix cai às 20:15:41, o Júlio (dono do `pagamentos`) não quer dinheiro preso.
- Aula 10, gancho: a saga cancela e estorna o 1057 em 45 s; o preço (comandos repetidos, eventos duplicados, serviços lentos) e a pergunta que a Iara faz na madrugada (Event Sourcing).

## 20 Event Sourcing (`event-sourcing`)
- Aula 1, ponte: é madrugada, a Iara quer entender a noite sem depender da memória de ninguém e treina o método no 1047 da Lena (presente de boas-vindas para o Téo, módulo 6).
- Aula 11, gancho: preço (tudo depende de chamadas que demoram, repetem ou falham) e volta ao trecho das 20:20 ainda não contado (módulo 21).

## 21 Resiliência (`resiliencia`)
- Aula 1, ponte: avisa que volta às 20:20 da mesma noite (a madrugada do módulo 20 deixou esse trecho para depois), com a Marta no painel e o Júlio com o disjuntor para testar.
- Aula 2, ponte: "a Marta quer um número para o incidente" (era "o time").
- Aula 8, ponte: o disjuntor é o do Júlio e vai desviar o 1058 do Caio para o PSP-B.
- Aula 13, gancho: a noite fecha sem a loja cair; o preço da decisão do Júlio (1058 pago no PSP-B, p50 300 ms, com o breaker aberto); a Marta: "sobrevivemos; o ano que vem é maior"; ponte para o Deployment (módulo 22).

## Quiz, glossário e widgets
- Nenhuma ocorrência de personagem, cidade do irmão ou papel errado em `public/labs/<slug>/quiz/questions.js`, `src/data/glossary-<slug>.js` ou `src/scripts/<slug>/` (exceto o widget do scale-cube, acima). "Irmão" no glossário do scale-cube é o "cubo irmão" (Availability Cube), sem relação com a história.
- Fora do escopo: o texto "mkt-01 (um cliente de marketplace)" no widget do sharding continua correto.

## Frases de figura (fig3d.js) que contradizem a bíblia (não editadas)
- `src/figures/cubo-3d/cubo-3d/fig3d.js:538` e `fig3d.en.js:538`: "O marketplace mkt-01, parceiro do módulo 8…". Falta dizer MegaMercado.
- `src/figures/isolamento-3d/isolamento-3d/fig3d.js:300` e `fig3d.en.js:300`: "o marketplace parceiro que sozinho tem 40%…". Pode citar o MegaMercado (opcional).
- `src/figures/replicas-3d/replicas-3d/fig3d.en.js:433` e as figuras `cqrs-3d`, `saga-3d`, `compensacao-3d`, `escrita-3d`: sem contradição de personagem. Aparecem datas de laboratório "20/10/2026" (medição real do PostgreSQL, anterior à noite de 27/11/2026): não contradizem, mas o maestro pode querer conferir.
- Nenhuma figura dos módulos 14 a 21 põe a Lena fora de Recife ou chama alguém de dono da loja.
