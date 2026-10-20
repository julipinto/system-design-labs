---
type: blueprint
module: bff
version: 1
---
# Blueprint: módulo 9, Backend for Frontends (BFF)

Aprovado pelo próprio agente, seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois). Dados canônicos: `docs/escrita/bff-brief.md`.

## Fio condutor (1 frase)
A tela da Lena pedia quatro coisas a quatro serviços e recebia JSON feito para o site; um backend sob medida para cada frontend (o BFF) faz as chamadas no lugar do celular, monta só o que a tela usa e responde nesse formato, e cada decisão do módulo (canal, microfrontend, versão, timeout, métrica) é uma consequência de ter um BFF por frontend.

## Exemplo e personagens canônicos
- A **loja** do módulo 8 (`gw-loja`, `api.loja.com.br`) e a **Lena**, em Recife, no 4G. A Bia aparece como quem abre o site.
- Serviços: `catalogo` (gato, produto 42, 79.90), `carrinho` (1 item), `recomendacoes` (caneca azul, id 7, 19.90), `pedidos` (pedido **1048**, "a caminho").
- Sem BFF: 4 chamadas em fila × **120 ms** = **480 ms**, **180 KB**. Com `bff-app`: 1 chamada (120 ms) + **25 ms** (o mais lento, em paralelo) + ~5 ms de montagem = **~150 ms**, **12 KB**. Os ~5 ms de montagem são a conta que fecha o "~150 ms" do brief.
- Canais: `bff-app`, `bff-web` (SSR, sessão no Redis do módulo 5), `bff-voz` ("Seu pedido 1048 está a caminho e chega quinta."). `marketplace-xyz` fica no gateway.
- Microfrontends: Vitrine, Checkout e Logística (módulo 6) com `bff-vitrine`, `bff-checkout` e `bff-rastreio`.
- Versões: app v3 (30% dos celulares) e v4; `bff-app-v3` e `bff-app-v4`; toggle `nova_home` 10% → 50% → 100%; v3 sai abaixo de 1% de uso.
- Falha: `recomendacoes` com timeout de **100 ms** e fallback `"recomendado": []`; sem timeout, 30 s e o BFF cai; `catalogo` compartilhado atinge os dois canais.
- Métricas: `bff-app` p95 **150 ms**, erros **2%** (só v3 em Android antigo); `bff-web` p95 **300 ms**, erros **0,1%**; backend único: **0,6%**.
- Vocabulário fixo: "BFF", "canal", "frontend", "API composition", "composição", "microfrontend", "feature toggle", "fallback", "timeout", "raio de explosão", "p95", "payload".

## Números derivados que não estão no brief (avisados como exemplo no texto)
1. **~5 ms de montagem**: fecha 120 + 25 + 5 = 150 ms (aula 2, widgets, quiz).
2. **26 pedidos do app a cada 100**: faz 0,26 × 2% + 0,74 × 0,1% ≈ 0,6% (aula 7). A figura de métricas precisa usar a mesma proporção ou dizer outra; é pendência de integração.
3. **0,999⁴ ≈ 99,6%**: disponibilidade de uma tela que depende de 4 serviços de 99,9% (aula 2, Aprofundar).
4. **100 telas/s × 30 s = 3.000 conexões presas** contra ~10 com timeout de 100 ms (aula 6, Aprofundar, "conta de exemplo").
5. Widget da aula 2: aberturas do app por dia (padrão 10) para a conta de dados por mês (180 KB → ~53 MB; 12 KB → ~3,5 MB); é controle do widget, não da história.

## Correções ao artigo-base (avisadas nos Aprofundar e em docs/fontes/bff.md)
1. O artigo não conta a origem (SoundCloud, Calçado, Newman). O termo foi cunhado por Nick Fisher (aula 1).
2. Newman prefere um BFF por tipo de cliente; a loja junta iOS e Android no `bff-app` por escolha do exemplo (aula 1).
3. Memcached no artigo; Redis na loja (aula 3). MQTT e WebSockets do artigo ficam fora da voz da loja (aula 3).
4. Toggles versus BFF por versão: papéis separados (aula 5).
5. Canary e blue-green reduzem o raio de uma versão ruim do BFF, não o de um serviço que cai (aula 6).
6. API Composition tem desvantagens que o artigo omite (aula 2).

## Estrutura por aula (tese → pergunta que deixa)
1. **Introdução e responsabilidades.** Tese: sem BFF, o app da Lena paga 4 viagens e recebe 180 KB que não usa; o BFF assume as chamadas, o corte e o filtro. → Quem faz as 4 chamadas no lugar do celular e como as junta?
2. **API composition.** Tese: o BFF chama os 4 serviços em paralelo dentro da rede e responde em 12 KB e ~150 ms; o preço é depender dos 4. → O site e a voz pedem o mesmo dado em outro formato: um backend dá conta?
3. **Canais e dispositivos.** Tese: cada canal tem o seu BFF, e o mesmo status do 1048 vira miniatura, página ou frase. → E quando a tela do site é dividida entre três times?
4. **Microfrontends e BFFs.** Tese: um BFF por microfrontend dá autonomia de deploy; regra de negócio fica no serviço. → Como lançar a tela nova sem quebrar o app v3?
5. **Versionamento e deployment.** Tese: um BFF por versão e uma toggle liberam a tela nova aos poucos e aposentam o v3 com dado. → E se um serviço cair no meio disso?
6. **Resiliência e blast radius.** Tese: timeout de 100 ms e fallback seguram a tela; o catálogo compartilhado ainda atinge os dois canais. → Como saber se cada canal está bem?
7. **Métricas e experiência.** Tese: métricas por canal revelam os 2% do v3 Android que o 0,6% total esconderia. → Quando tudo isso vale a pena?
8. **Considerações finais.** Tese: BFF vale com canais diferentes e times por canal; BFF não é gateway. → Entre os serviços, timeout, retry, criptografia e métrica podem ir para a rede? (módulo 10)

## Decisões da fase Architect/Carpenter
- Cada aula abre com `p.ponte` ligada ao problema aberto na anterior e fecha com `p.gancho` ("Falta saber…"); lendo só essas duas frases, a história se conta.
- Aula 4 e aula 8 sem figura (brief): tabela simples e tabela de decisão.
- "Faça agora" genéricos para a figura (sem nome de botão); o maestro alinha na integração.
- A seção de resumo no fim da aula 8 foi removida (premissa 15: sem resumo no fim da seção).
- Código escrito para a aula (Go, HTML, JSON de exemplo) está rotulado como "exemplo escrito para a aula"; configuração de Envoy, Unleash, Resilience4j e PromQL segue a documentação oficial (ver docs/fontes/bff.md).
