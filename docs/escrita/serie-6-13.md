# Faixa 6-13: o que mudou no texto (Temporada 1, parte 2: a empresa)

Mudanças cirúrgicas em PT (`src/content/<slug>/`) e EN (`src/content/_en/<slug>/`), sempre nas mesmas frases. Números, IDs, horários e contas ficaram como estavam. Quiz, glossário e widgets: nenhum citava irmão, cidade ou papel errado; só o glossário de api-gateways ganhou o MegaMercado.

## 6. microsservicos
- aula 1 (abertura): Marta investe, chegam Bruna, Júlio e Raí, Téo volta de Tóquio; a Iara decide se parte o programa. Passo 1: o 1047 é presente de boas-vindas para o irmão, o Téo.
- aula 2: Relatórios das 23:00 é "do Raí"; a Iara quer ver o que o monolito faz bem.
- aula 3: "a cura que a Iara escolhe".
- aula 6 (Conway): times por camada viram cenário hipotético ("se os três times novos fossem por camada"); a Iara forma Vitrine (Bruna), Checkout (Júlio) e Logística (Raí).
- aula 7: a Iara começa o case pelo que acontece.
- aula 8 (fecho): preço aceito pela Iara (rede e compensação na conta; o relatório do Raí já não derruba o checkout) e gancho para o LB.

## 7. load-balancers
- aula 1: promoção do Téo em julho; a Bruna precisa pôr alguém na frente do catálogo.
- aula 3: round robin é a escolha da Bruna "porque é o padrão"; "O problema" vira o preço da escolha dela.
- aula 10 (fecho): preço (buscas pesadas numa réplica, healthcheck tira a `catalogo-2`) e gancho: app da Bruna e parceiro do Téo vão chamar a loja direto.

## 8. api-gateways
- aula 1: Téo fecha com o MegaMercado (dito uma vez: aparece nas aulas como `marketplace-xyz`) e Bruna lança o app; a Iara decide a porta única.
- aula 6: "o time do Júlio, dono do `pedidos`".
- aula 7 (fecho): a Iara pôs a porta única; preço (robô limitado, MegaMercado com 403); gancho para o app da Bruna.
- glossário PT e EN: "Parceiro" cita o MegaMercado.

## 9. bff
- aula 1: Bruna decide um backend por canal.
- aula 6: preço do desenho da Bruna (sem timeout, o canal cai).
- aula 8: BFF é da Vitrine da Bruna; gancho abre com a Bruna e o preço.

## 10. service-mesh
- aula 1: Júlio e Raí brigam (5 retries sem esperar derrubam o `pagamentos`); a Iara decide tirar retry, timeout e mTLS do código. "o time do Júlio" no passo do `pedidos`.
- aula 6 (fecho): preço da decisão da Iara (proxy a mais, alguém para operar).

## 11. concorrencia
- aula 1: fábrica atrasa a remessa, Raí vê o estoque secar; o problema é dele.
- aula 6: "o Raí põe uma trava"; `marketplace-xyz` = MegaMercado.
- aula 8: "o Raí sabe que não basta".
- aula 10 (fecho): trava no Redis do Raí e o preço (deadlock reserva × estorno).

## 12. comunicacao-sincrona
- aula 1: pedido 1050; o Júlio decide como as chamadas viajam.
- aula 8: quem decide é o Júlio; fecho com o preço (webhook falso, polling que satura).

## 13. comunicacao-assincrona
- aula 1: o Raí decide o Kafka.
- aula 10 (fecho): desenho do Raí, preço (resposta à Lena não diz mais se reservou) e gancho: Téo agenda a newsletter da BF para as 20:00. Removida a frase "a Black Friday mostrou... 2 s", que antecipava o módulo 14.

## Frases de figura a corrigir (src/figures/, não editado)
- `monolito-3d/fig3d.js:211` e `fig3d.en.js:211`: "compra outro gato de pelúcia para o irmão" / "for her brother" → presente de boas-vindas para o Téo.
- `gateway-3d/fig3d.js:242` e `fig3d.en.js:242`: "A loja abriu uma API para o marketplace-xyz" → dizer que é o MegaMercado (opcional; os rótulos `marketplace-xyz` batem com as aulas).
