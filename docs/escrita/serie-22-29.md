# Série, faixa 22-29: o que mudou na narrativa

Temporada 2 ("o depois"). Mudanças cirúrgicas em PT (`src/content/<slug>/`) e EN (`src/content/_en/<slug>/`, mesmas frases). Nenhum número técnico, ID, horário, valor de pedido ou conta mudou. Só os anos dos módulos 26 a 28 mudaram, como a bíblia manda (`serie.md`).

## 22 · deployment
- `aula-1-deploy-e-rollback`, ponte: fecha a Black Friday de 2026 (breaker do Júlio, "sobrevivemos; o ano que vem é maior"), põe o time do Júlio soltando a `pedidos` 2.5.0 na ter 01/12/2026, a Lena em Recife como quem percebe (1059) e a Iara como dona da decisão.
- `aula-3-rolling-updates`, ponte: "dá para trocar pod por pod" passa a "o Júlio pode trocar".
- `aula-6-canary-releases`, ponte: a pergunta do canary é da Iara.
- `aula-10-shadow-traffic-exemplo`, gancho: o botão de liberar é para o Téo.
- `aula-12-sharding-bulkheads-e-ring-deployments`, gancho: preço da decisão da Iara (a espera dos anéis, deploy deixa de ser um clique) e gancho para o 23 (a Marta pede o plano da BF 2027, o Téo prometeu 200 pedidos/s).

## 23 · capacity-planning
- `aula-1`, ponte: a Marta pede o plano, o Téo já prometeu 200/s, a Iara decide medir antes de prometer. Item "O custo da meta": a decisão é do Téo e da Marta.
- `aula-9`, gancho: preço da promessa do Téo (41 vCPU contra 17 em 2026) antes do gancho para o k6.
- Quiz (`public/labs/capacity-planning/quiz/questions.js`): "O time dimensiona…" virou "Um plano dimensiona…" e "O time escala o estoque…" virou "Alguém escala o estoque…".

## 24 · testes-de-carga
- `aula-1`, ponte: a promessa do Téo só vale depois de um teste; a Iara escolhe o k6.
- `aula-11`, gancho: preço de testar antes ("hoje" quebra em 36/s, número que já estava na aula 10), o relatório das 23:00 do Raí contra o checkout do Júlio, gancho para o 25.
- Mantidas as datas reais de execução do k6 (20–21/10/2026): são metadado da medição, não data da história.

## 25 · bulkhead
- `aula-1`, ponte: o Júlio culpa o relatório do Raí e o Raí culpa o checkout do Júlio. Gancho: a briga acaba quando os dois dividem o pool em 16 + 4; o preço é do Raí (job das 23:00 de 10 para 100 min).
- `aula-5`, gancho: "a gente dividir" virou "a Iara dividir" a loja inteira (ponte para as células).

## 26 · cell-based (BF 2027, sex 26/11/2027)
- `aula-1`, ponte: a Iara decidiu as células, prontas uma semana antes da Noite da BF 2027, com a Marta no painel.
- `aula-1`, cena do 1060: a Lena aparece "em Recife"; as "sobrinhas" saíram (a Lena é irmã do Téo e a bíblia não lhe dá sobrinhas), o presente virou "para a sala de aula dela" (professora de ciências). Nota sobre numeração: o 1060 é da BF de 2027 e o 1059 é da terça depois da BF de 2026.
- `aula-1`: o parceiro `mkt-01` aparece como MegaMercado (`mkt-01`) no passo das 20:25 e na tabela das células.
- `aula-2`, item do piso: "a Iara aceita a conta" (41 → 53 vCPU).
- `aula-4`, gancho: preço da Iara (+29,3% de vCPU) e ligação com o 27 (20:40, quinze minutos depois do veneno, cai SP).

## 27 · disaster-recovery (BF 2027, 20:40)
- `aula-1`, ponte: 20:25, a Iara respira, faltam 15 minutos para a queda de SP.
- `aula-4`, ponte: "Noite da Black Friday de 2027", a Iara e a Marta diante do painel. Gancho: o preço da escolha da Iara pela replicação assíncrona caiu sobre a Bia (1061).
- `aula-5`: "No dia seguinte a Iara liga para a Bia" antes das três saídas do pedido perdido. Gancho: liga com o 28 (a Lena receberá a caneca em dobro, uma semana depois, com os painéis verdes).

## 28 · observabilidade (qui 02/12/2027)
- `aula-1`, ponte: a Iara decide juntar tudo numa disciplina.
- `aula-2`: data do incidente 03/12/2026 → **02/12/2027** (EN: 12/03/2026 → 12/02/2027); "uma semana depois da Black Friday de 2027"; a newsletter das 15:30 foi agendada pelo Téo.
- `aula-4`: cinco timestamps dos logs do 1063, `2026-12-03T…` → `2027-12-02T…` (PT e EN).
- `aula-7`: o SLO é meta da Iara; o SLA de 99,5% com o `mkt-01` foi assinado pelo Téo.
- `aula-10`, gancho: preço (logs, até 255 GB/dia com DEBUG) e ligação com o 29 (a Iara pergunta isso aos novos contratados com o 1060 na mão).
- Datas de pesquisa ("conferido em 21/10/2026", "c28.py") ficaram: são data de trabalho, não da história.

## 29 · provas-finais (dez/2027)
- `aula-1`, ponte: a prova é a que a Iara aplica em dezembro de 2027 aos novos contratados, seguindo o pedido 1060 da Lena; a história começa "na garagem do Téo e da Iara".
- `aula-6`, item "Planejar o pico": o Téo já tinha prometido 200 pedidos/s e a Iara mediu antes de aceitar.
- `aula-7`, gancho (fim da série): a Iara fecha a apresentação e a Lena, em Recife, segue comprando.

## Glossários e widgets
Nada precisou mudar: a Lena é sempre cliente de Recife, nenhum glossário (PT e EN) nem script de widget cita irmão, cidade errada ou papel errado. Os anos 2026/2027 que aparecem lá são da série de capacidade (BF 2026 medida, BF 2027 planejada), corretos.

## Frases de figura (`src/figures/`, não editadas) que contradizem a bíblia ou este registro
- `src/figures/celulas-3d/fig3d.js:320` e `fig3d.en.js:320`: "presente para as duas sobrinhas" / "a gift for her two nieces". Trocar por algo como "para a sala de aula dela" / "for her classroom" (ou, se a Juliana preferir manter o presente, reverter também o `aula-1` de cell-based).
- `src/figures/sinais-3d/fig3d*.js`: já estão em 02/12/2027 (conferido; nada a fazer).

## Pendências para o maestro
- `docs/escrita/historia-mestre.md` (linha do pedido 1063 e capítulos 22, 23, 26 a 28) ainda diz "quinta 03/12/2026"; deve virar qui 02/12/2027 (BF 2027 nas linhas 26 e 27).
- A cena do 1060 ficou sem presente para sobrinha (ver acima). Confirmar se a Juliana quer outra coisa.
- Nenhum build rodado, nenhum commit feito.
