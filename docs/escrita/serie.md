# A série: a loja do Téo (bíblia da história do SDLabs)

O SDLabs conta a história de uma startup em duas temporadas. Cada módulo é um **episódio**: a loja cresce, alguém do time precisa tomar **uma decisão difícil**, e a decisão cobra **um preço** que puxa o episódio seguinte. Os números técnicos das aulas não mudam; este arquivo diz **quem vive cada cena e por quê**. A tabela de pedidos e as constantes continuam em `historia-mestre.md`.

Tom: série de TV sobre startup (pessoas com pressa, prazos, brigas honestas, erros que custam caro), contada em terceira pessoa. O "Faça agora" continua falando com quem estuda ("você").

## Elenco

**Lena** (Recife). Irmã do Téo, professora de ciências, fã de pelúcia. É a **cliente zero**: comprou na loja antes de ela existir direito, compra em quase todo episódio e diz sem filtro o que sentiu ("a página demorou", "meu pedido sumiu", "o frete veio zerado?"). Ela é o termômetro: toda decisão do time chega até ela. `cliente_id = lena-77`. Mora em Recife do começo ao fim.

**Téo** (Tóquio, depois Recife). Irmão da Lena. No módulo 1 trabalha em Tóquio numa loja online de brinquedos japonesa e vê a febre das pelúcias. A foto que a Lena manda (um gato de pelúcia de uma fábrica pequena de SP, comprado numa feira em Recife) vira a ideia: "isso vende no Brasil inteiro se tiver uma loja boa". Funda a loja, cuida do negócio (fornecedor, promoções, parceiros, investidora) e volta para Recife no episódio 6. Defeito: promete prazo e meta antes de perguntar ao time.

**Iara** (Recife). CTO e cofundadora. Engenheira, colega de faculdade da Lena (foi a Lena que apresentou os dois). É quem toma as decisões técnicas de cada episódio e quem paga por elas quando algo cai. Qualidade: mede antes de decidir. Defeito: segura demais quando dá para arriscar.

**O time** (contratado no episódio 6, quando entra o dinheiro da investidora):
- **Bruna**, líder do time **Vitrine** (catálogo, busca, app, BFF). Quer lançar rápido; acha que performance é "depois".
- **Júlio**, líder do time **Checkout** (carrinho, pedidos, pagamentos). Cauteloso, odeia perder dinheiro; desconfia de toda mudança no fluxo de pagamento.
- **Raí**, líder do time **Logística** (estoque, entregas, relatórios). Pragmático; dono do relatório das 23:00 e do relacionamento com a fábrica em SP.

**Marta**, a investidora (fundo que entra no episódio 6). Cobra crescimento, olha o painel na Black Friday e pede o plano da BF 2027.

**Clientes fixos**: **Bia** (SP, compra para presentear os sobrinhos), **Caio** (Rio, colecionador, sempre atrás do último exemplar), **Davi** (SP, paga tudo no Pix, impaciente).

**MegaMercado** (`mkt-01`; nos módulos 8 a 10 aparece como `marketplace-xyz`, que é o mesmo parceiro). Marketplace grande que revende os produtos da loja a partir do episódio 8. Traz 40% do tráfego e boa parte dos sustos. Negociado pelo Téo.

**A fábrica** (SP). Fábrica pequena de brinquedos que produz o **gato de pelúcia (produto 42)**, o campeão de vendas. Por isso o estoque físico e o primeiro data center ficam em SP.

**A loja**: `loja.com.br`, loja online de brinquedos fundada em Recife, vende para o Brasil inteiro (SP, Rio, Recife são as cidades da história). Produtos: gato de pelúcia (42), caneca azul (7), camiseta preta (15).

## Linha do tempo

| Quando | Episódios | Fase |
|---|---|---|
| jan–mai/2026 | 1–5 | Temporada 1, parte 1: **a garagem** (Téo e Iara, um servidor, a Lena como primeira cliente) |
| jun–nov/2026 | 6–13 | Temporada 1, parte 2: **a empresa** (Marta investe, o time chega, a loja vira serviços, entra o MegaMercado) |
| sex 27/11/2026, 20:00–20:21 | 14–21 | **Final da temporada 1: a Noite da Black Friday 2026**. Cada episódio é um trecho da mesma noite. |
| dez/2026–nov/2027 | 22–25 | Temporada 2: **o depois** (post-mortem, deploy seguro, plano para a BF 2027, testes, anteparas) |
| sex 26/11/2027, 20:25–20:41 | 26–27 | **A Noite da Black Friday 2027**: as defesas construídas na temporada são testadas |
| qui 02/12/2027 | 28 | o bug quieto da semana seguinte |
| dez/2027 | 29 | final da série: a Iara apresenta a loja inteira para quem chega |

## Episódios (decisão → preço → gancho)

Formato: **quem decide**, **a decisão**, **o preço**, **quem sente**. Os incidentes e números são os que as aulas já têm.

### Temporada 1, parte 1: a garagem
1. **Protocolos de Rede** (jan/2026). A Lena, em Recife, fotografa o gato de pelúcia e manda para o Téo, em Tóquio (a viagem da foto pela rede: OSI, TCP/UDP, TLS). No café perto da escola, o notebook dela entra no Wi-Fi (DHCP, DNS) e abre a primeira página da loja que o Téo publicou num servidor alugado. *Decisão:* Téo publica a página "do jeito que deu". *Preço:* a página demora para a Lena (tempo de resposta). *Gancho:* onde guardar pedidos e fotos de verdade?
2. **Storage, RAID e I/O** (fev). O Téo chama a Iara para ser CTO. Ela escolhe onde ficam fotos e o `pedidos.db`. *Decisão:* para economizar, o Téo pede RAID 0 ("dois discos, o dobro de velocidade"). *Preço:* o disco D2 queima e o `pedidos.db` some, com os primeiros pedidos da Lena. *Gancho:* com servidores em mais de uma cidade, quem tem a verdade?
3. **CAP, ACID e BASE** (mar). A loja passa a ter servidores em SP (perto da fábrica), Rio e Recife. *Decisão da Iara:* consistência ou disponibilidade quando o cabo Rio–Recife cai? A Lena (Recife) e a Bia (SP) disputam o último gato da remessa. No ACID, a Lena manda R$ 100 de crédito da carteira da loja para a Bia, de presente (saldos 150 → 50 e 20 → 120). *Gancho:* que banco de dados guarda tudo isso?
4. **Databases** (abr). A tabela `pedidos` cresce; a Iara escolhe PostgreSQL e o índice certo para achar o pedido 1042 da Lena. *Gancho:* a página do gato vai ficar lenta quando todo mundo abrir.
5. **Cache** (mai). Uma influenciadora posta o gato; todo mundo abre a página. *Decisão do Téo:* promoção, o preço cai de 89.90 para 79.90. *Decisão da Iara:* Redis e CDN com edge em Recife. *Preço:* o cache mostra o preço velho por até 60 s. *Gancho:* a loja ainda é um programa só.

### Temporada 1, parte 2: a empresa
6. **Microsserviços** (jun). A Marta investe; Bruna, Júlio e Raí chegam e mexem todos no mesmo programa. O Téo volta de Tóquio e abre o escritório em Recife; a Lena compra outro gato (pedido 1047, 18/06) de presente de boas-vindas para ele. *Decisão:* partir o monolito por domínio (Lei de Conway: três times, três ilhas). *Preço:* o relatório das 23:00 do Raí derruba tudo antes da partição; depois dela, a rede e a compensação entram na conta. *Gancho:* com 10 cópias do catálogo, quem escolhe qual atende?
7. **Load Balancers** (jul). Primeira grande promoção do Téo. *Decisão da Bruna:* round robin "porque é o padrão". *Preço:* as buscas pesadas caem todas na mesma réplica; o healthcheck tira o `catalogo-2`. *Gancho:* o app e um parceiro vão chamar a loja direto.
8. **API Gateways** (ago). O Téo fecha com o MegaMercado e a Bruna lança o app. *Decisão:* porta única, `gw-loja`, com JWT e limite por cliente. *Preço:* um robô do concorrente pede o preço do gato 500 vezes por segundo; o parceiro leva 403 no endpoint errado. A Lena compra pelo app (1048). *Gancho:* a tela do app junta quatro serviços.
9. **BFF** (set). *Decisão da Bruna:* um backend por canal (app, site, voz). *Preço:* se o `recomendacoes` cai sem timeout, a tela inteira some. *Gancho:* cada time escreve retry e TLS do seu jeito.
10. **Service Mesh** (out). Júlio e Raí brigam: o `pedidos` repete 5 vezes sem esperar e derruba o `pagamentos`. *Decisão da Iara:* tirar retry, timeout e mTLS do código e pôr na malha. *Gancho:* e quando duas pessoas querem o mesmo último gato?
11. **Concorrência e Paralelismo** (out). A fábrica atrasa a remessa; sobra 1 gato. Bia e Caio clicam juntos. *Decisão do Raí:* trava distribuída no Redis. *Preço:* o deadlock entre reserva e estorno. *Gancho:* como o `pedidos` fala com o pagamento?
12. **Comunicação Síncrona** (nov). O Davi paga no Pix (1050). *Decisão do Júlio:* gRPC por dentro, webhook do PSP por fora. *Preço:* o webhook falso e o polling que satura. *Gancho:* e o que não precisa de resposta na hora?
13. **Comunicação Assíncrona** (nov). A Lena compra duas canecas (1051); os eventos passam a viajar pelo Kafka. *Decisão do Raí:* fila para e-mail, tópico para eventos, MQTT no caminhão. *Gancho:* o Téo agenda a newsletter da Black Friday para as 20:00.

### Final da temporada 1: a Noite da Black Friday 2026 (sex 27/11, 20:00–20:21)
A Marta acompanha o painel ao vivo; o time está todo no escritório de Recife.
14. **Performance** (20:00–20:03). A newsletter sai; a média diz 135 ms e a Lena espera 2 s. *Lição da noite:* média mente; p95 e p99 contam.
15. **Scale Cube** (20:05). A Iara organiza na lousa o que a loja já fez nos três eixos (X réplicas, Y serviços, Z ainda não). O Caio compra (1053).
16. **Sharding** (20:08). A tabela `pedidos` com 50 milhões de linhas; o MegaMercado é 40% de um shard. A Lena compra (1054).
17. **Replicação** (20:10). A Lena compra (1055) e o pedido não aparece em "meus pedidos": a réplica de Recife está 800 ms atrás.
18. **CQRS** (20:12). A Bruna separa leitura e escrita da tela "meus pedidos"; a Lena compra gato e caneca (1056).
19. **Saga** (20:15). O Raí acha estoque avariado; o Pix do Davi (1057) já caiu: a saga cancela e estorna em 45 s.
20. **Event Sourcing** (madrugada, depois da noite). Para entender o que houve, a Iara reconstrói o pedido 1047 da Lena (de junho) como sequência de eventos.
21. **Resiliência** (20:20). O PSP-A responde em 8 s; o breaker do Júlio desvia o pedido 1058 do Caio para o PSP-B. A noite fecha sem a loja cair. *Gancho da temporada:* "sobrevivemos; o ano que vem é maior".

### Temporada 2: o depois
22. **Deployment** (ter 01/12/2026). Na pressa pós-BF, o time do Júlio solta a `pedidos` 2.5.0: frete 0,00 em Recife, com 0% de erro. Quem percebe é a Lena (1059). *Decisão:* canary com métrica de negócio, flags, anéis.
23. **Capacity Planning** (jan–mar/2027). A Marta pede o plano da BF 2027; o Téo promete ao comercial 200 pedidos/s. *Decisão da Iara:* medir antes de prometer (Little, filas, joelho).
24. **Testes de Carga** (mai–jul/2027). O k6 mostra que "hoje" quebra em 36/s; o cenário misto acha o relatório das 23:00 do Raí derrubando o checkout.
25. **Bulkhead** (ago/2027). Raí e Júlio dividem o pool de 20 conexões (16 + 4) depois de uma briga; o status da Lena (1054) para de levar 503.
26. **Cell-Based** (Noite da BF 2027, 20:25). As células ficam prontas uma semana antes. Um pedido envenenado do MegaMercado derruba só a `celula-mkt`; a Lena compra dois gatos (1060) na `celula-recife` sem perceber nada.
27. **SPoF e Disaster Recovery** (BF 2027, 20:40). A região de SP cai. RTO 65 s; o pedido 1061 da Bia se perde e o número é reaproveitado. *Preço:* a Iara liga para a Bia no dia seguinte.
28. **Observabilidade** (qui 02/12/2027). Uma semana depois, a Lena recebe a caneca em dobro (1063); o trace mostra 1,9 s presos num lock do estoque.
29. **Provas Finais** (dez/2027). A Iara apresenta a loja inteira aos novos contratados seguindo o pedido 1060 da Lena pelos 14 saltos. Final da série.

## O que muda no texto atual (para quem reescreve)
- **Módulo 1:** a Lena está em **Recife** (não em SP); o irmão se chama **Téo**, está em **Tóquio**, e a foto é do gato de pelúcia que vira a ideia da loja. O café fica em Recife. A página da loja é a primeira versão do Téo.
- **Módulo 3:** sai o banco e sai o irmão comprador. As duas compradoras do último gato são **Lena (Recife)** e **Bia (SP)**; a transferência ACID é **crédito da carteira da loja** da Lena para a Bia (mesmos saldos e valores).
- **Módulo 6:** o 1047 é presente da Lena para o **Téo**, que acabou de voltar para Recife.
- **marketplace-xyz** (módulos 8–10) é o **MegaMercado**, o mesmo `mkt-01` do módulo 15 em diante: dizer isso uma vez no módulo 8 e no 15.
- **Datas:** módulos 26 e 27 passam a ser a **BF 2027** (sex 26/11/2027); o módulo 28 passa a **qui 02/12/2027**. Os módulos 14–19 e 21 são a BF 2026 (sex 27/11/2026). O módulo 22 é ter 01/12/2026.
- **Ponte e gancho** de cada módulo falam do episódio (quem decidiu o quê e o que custou), não só da técnica.
- As decisões têm dono (Téo, Iara, Bruna, Júlio, Raí): onde o texto diz "o time" ou "você decide", trocar pelo dono certo quando a decisão for de um episódio. O "Faça agora" continua com "você".
- Nada de números novos: pedidos, valores, IDs, horários e contas ficam como estão (exceto os anos acima).
