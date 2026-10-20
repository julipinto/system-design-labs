# Blueprint: API Gateways (módulo 8)

**Fio condutor:** a loja abriu um app e uma API de parceiros e passou a ter seis portas e um robô de 500 pedidos por segundo; uma porta só, com as regras comuns aplicadas uma vez, resolve rota, identidade, limite e versão.

Elenco: Lena (app, Recife), `marketplace-xyz` (parceiro), o robô do concorrente, `gw-loja`. Pedido-estrela: `POST /api/v1/pedidos`, pedido 1048, total 94.90.

| Aula | Tese | Pergunta que deixa para a próxima |
|---|---|---|
| 1 Introdução | Um gateway é a porta única: seis endereços, seis logins e seis lugares para barrar um robô viram um. | Por que a loja só precisou dele depois de partir o programa? |
| 2 Monolitos e microsserviços | O monolito já era uma porta única; o módulo 6 expôs a divisão interna na URL, e o gateway a esconde de novo. | O gateway substitui o `lb-loja`? |
| 3 Gateway vs LB | O LB escolhe a réplica, o gateway escolhe a API e as regras; ficam um atrás do outro. | O que o gateway faz com a requisição inteira? |
| 4 Roteamento, auth | Rota por método e caminho, JWT confere quem é (401), escopos decidem o que pode (403); a rede interna precisa estar fechada. | Como segurar quem pede demais, mesmo autenticado? |
| 5 Limite | Rate limiting barra com 429; token bucket aceita rajada, leaky bucket alisa a saída, throttling reage; o contador precisa ser de todas as réplicas. | Como mudar a API sem quebrar o app antigo? |
| 6 Versionamento | v1 e v2 no ar ao mesmo tempo, reescrita de caminho, canary e aviso de descontinuação. | Como isso aparece num gateway de verdade? |
| 7 Laboratório Kong | O `kong.yml` de 39 linhas é service + route + `strip_path`; o limite é um plugin e a `policy` decide onde mora o contador. | Um gateway único serve a todos os clientes? (módulo 9, BFF) |

**Decisões**
- Cada aula abre com ponte (classe `ponte`) e fecha com "Falta saber…" (classe `gancho`); lendo só a primeira e a última frase a história se conta.
- Aula 7 usa o código real, sem alteração além de espaços no fim das linhas, e separa o que é do repositório do que é exemplo próprio (plugin).
- Correções ao artigo registradas em Aprofundar e em `docs/fontes/api-gateways.md`: leaky bucket, plugin do Kong não é token bucket.
- Números da figura, quiz, glossário e widgets coincidem com o brief (200/100 por s, 20/10 por chave, fila 50/50, 100 → 50 por s, 3 réplicas = 30).
- "Faça agora" usa os nomes reais dos botões (Sem, Rota, Auth, LB, Versão; Token, Leaky, Throttle, Réplicas) e dos passos das figuras.
