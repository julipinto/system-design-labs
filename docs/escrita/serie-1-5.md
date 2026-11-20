# Faixa 1-5: a garagem (episódios 1 a 5)

Mudanças de narrativa em PT (`src/content/<slug>/`) e EN (`src/content/_en/<slug>/`), sempre nos dois idiomas. Nenhum número técnico, ID, horário ou valor mudou.

## 1. protocolos-de-rede (jan/2026)
- aula 1: ponte nova abre o episódio. A Lena em Recife fotografa o gato numa feira e manda ao irmão Téo, em Tóquio; a resposta dele ("isso vende no Brasil inteiro se tiver uma loja boa") é a ideia da loja.
- aula 2: Lena em Recife (não SP); "irmão" vira "Téo" (aula e DoIt).
- aula 7: o café fica perto da escola, em Recife, e ela vai abrir a primeira página do Téo.
- aula 8: a página é a primeira versão que o Téo publicou num servidor alugado.
- aula 9: ponte diz que o Téo publicou "do jeito que deu"; o gancho traz o preço (a página demorou para a Lena) e puxa o episódio 2 (onde guardar pedidos e fotos).
- Quiz, glossário (PT/EN) e widgets: sem mudança (nada citava personagem ou cidade errada).

## 2. storage-raid-io (fev/2026)
- aula 1: abertura do episódio: o Téo chama a Iara (CTO, colega de faculdade da Lena); primeira tarefa dela é decidir onde moram os dados.
- aula 6: "o time edita" vira "o Téo edita" (ainda não há time).
- aula 8 (RAID 0): o Téo pede RAID 0 para economizar ("juntando os discos, a loja ganha velocidade"), a Iara cede; no D2 queimado, o `pedidos.db` some "com os primeiros pedidos da Lena".
- aula 9: "No RAID 0 do Téo… A Iara refaz a conta".
- aula 12: "A Iara quer o melhor para o pedidos.db".
- aula 13: a Iara escolhe o RAID 10; o gancho fecha o preço (metade do espaço × o `pedidos.db` inteiro do RAID 0) e puxa o episódio 3 ("com servidores em mais de uma cidade, falta saber quem tem a verdade").
- Quiz, glossário e widgets: sem mudança.

## 3. cap-acid-base (mar/2026)
- Decisão de design: o último gato é disputado pela **Bia (SP)**, pedido #102, e pela **Lena (Recife)**, pedido #103. O irmão saiu.
- aula 1: abertura do episódio (servidores em SP, Rio e Recife; decisão da Iara); Recife recusa a Lena (503 em 3.000 ms); "a Iara responde" no porquê de decidir antes; gancho com o preço e o ACID.
- aula 2: a transferência é **crédito da carteira da loja** da Lena para a Bia, de presente (150 → 50, 20 → 120). Saiu o débito automático do aluguel: T2 é "uma compra de R$ 40 paga com o mesmo saldo" (aula, widget de isolamento PT/EN, quiz). `CHECK saldo`, SQL e tabela `conta` ficam.
- aula 3: a Iara pergunta se o app pode responder na hora; a transferência cai no **nó de Recife** (onde a Lena está) e a **Bia lê em São Paulo** `R$ 20, v1`; LWW com #102 da Bia e #103 da Lena.
- aula 5: CP faz a Lena esperar; LWW perde a #102 da Bia; "a Iara escolhe".
- aula 6: carteira no lugar de conta.
- aula 7: a venda #101 é da Bia, que espera ~80 ms; a Lena lê em Recife. O fecho traz a decisão da Iara e o gancho "que banco guarda tudo isso?".
- Quiz (`questions.js`): 12 perguntas ajustadas (irmão, aluguel, quem espera os 80 ms/5 ms, nó de Recife). Glossário e widgets EN: só o texto de T2/aluguel.

## 4. databases (abr/2026)
- aula 1: abertura do episódio: os pedidos ainda moram num arquivo; a Iara precisa escolher um banco e o teste é achar o pedido 1042 da Lena sem varrer tudo.
- aula 15: o relacional com B-Tree é a decisão da Iara (PostgreSQL); o gancho traz o preço (um servidor só) e puxa o episódio 5 ("a página do gato quando todo mundo abrir").
- Aulas 2 a 14: sem mudança (Lena em Recife e Bia em SP já estavam certas; a explicação técnica é impessoal).
- Quiz, glossário, widgets: sem mudança.

## 5. cache (mai/2026)
- aula 1: abertura: a influenciadora posta o gato e a página (produto 42) fica lenta; a Iara deixou a loja bem guardada no PostgreSQL.
- aula 2: o Téo baixa o preço para 79.90 na promoção (no lugar de "o dono da loja").
- aula 4: o Téo, que paga o servidor, pergunta quanto o cache ajuda.
- aula 5: o Redis compartilhado é o que a Iara escolhe.
- aula 6: "o Téo acha que o preço da promoção mudou"; a CDN com edge em Recife entra na conta da Iara.
- aula 7: o Téo troca a foto na origem; o gancho traz o preço (preço velho por até 60 s, aceito de propósito pela Iara) e puxa o episódio 6 ("a loja ainda é um programa só"; tirei "três times", que só existem no ep. 6).
- Quiz: "O dono da loja troca o gato.jpg" vira "O Téo troca". Glossário e widgets: sem mudança.

## Figuras (fora do meu escopo, `src/figures/`): frases que contradizem a bíblia
Todas existem em `fig3d.js` (PT) e `fig3d.en.js` (EN).
- **osi/osi-figure.mjs, osi/osi-data.js, osi-3d/fig3d.js**: "Lena · São Paulo", "Irmão · Tóquio", "celular do irmão", "conversa com o irmão, que mora em Tóquio" e o cenário de vídeo com o irmão. Deve ser Lena · Recife e Téo · Tóquio.
- **tcp-3d/fig3d.js** (linhas ~151, 195, 201, 217): "ao irmão, em Tóquio", "o irmão veria o gato", "ligação de vídeo com o irmão" → Téo.
- **cap-3d/fig3d.js** (linhas ~2, 344–392, 423–425): "a Lena fica em SP e o irmão em Recife", "Lena (SP) e o irmão (Recife)", "celular do irmão", "Irmão tenta de novo", pedido #101 da Lena. Deve ser Bia em SP (#102) e Lena em Recife (#103); #101 também é da Bia.
- **acid-3d/fig3d.js** (~54 ocorrências de "irmão", `irmao`, "saldo do irmão", "BROTHER · bank app"; 15 de aluguel/"imobiliária", T2 "aluguel", "app do banco"): transferência para a **Bia**, "carteira da loja", T2 = compra de R$ 40; no BASE o pedido cai no nó de **Recife** e a **Bia lê em SP** (hoje a figura é SP → Recife).
- **latencia-3d/fig3d.js**: já está em Recife (ok). **cdn-3d**: origem em SP (fábrica), ok.
- indices-3d (linha 21: 1042 Lena/Recife, 1043 Bia/SP) e raid-3d/storage-3d: sem conflito.

## Pendências e dúvidas
- A bíblia diz que o Téo pede RAID 0 com "dois discos"; a aula usa 4 discos (D1 a D4). Escrevi a fala do Téo sem número de discos.
- A bíblia (ep. 1) cita a Iara como colega de faculdade da Lena; só entra no módulo 2, aula 1.
- Não rodei build nem Chrome (como pedido); conferir MDX/JS no build do maestro. `node --check` passou nos JS editados.
