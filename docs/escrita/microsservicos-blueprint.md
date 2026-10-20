# Blueprint: módulo 6, Microsserviços, Monolitos e Domínios

Método: Architect → Carpenter → Judge (ESCRITA.md), aprovado pelo próprio agente seguindo PREMISSAS.md.

**Fio condutor (1 frase):** a loja rápida ainda é um programa só que atrapalha os próprios times, e o módulo mostra quando partir, onde cortar (domínios, times) e o que cada corte custa, até o pedido 1047 passar por serviços com dono e eventos.

| Aula | Tese (1 frase) | Pergunta que deixa para a próxima |
|---|---|---|
| 1 Introdução | A loja é um programa só (8 vCPU, 7 módulos, banco `loja`) e dois problemas apareceram; o módulo é sobre quando partir e onde cortar. | O que o monolito tem de bom e quais são, com números, os dois defeitos? |
| 2 Monolitos | O monolito é o começo certo; falha por vizinho barulhento (23:00, 120 ms → 2,4 s), raio de explosão (frete derruba os 7) e escala que só copia tudo (80 vCPU). | Dá para separar os módulos em programas com banco próprio, e o que se paga por isso? |
| 3 Microsserviços | Partir isola e escala só o que pesa (25 vCPU), mas troca ROLLBACK por compensação, soma 4 saltos (200 ms) e exige observar 5 logs com `trace_id`. | Onde ficam os cortes e quem decide? |
| 4 DDD | Corta-se pelo assunto do negócio: linguagem ubíqua e contexto delimitado (o gato em 4 formas); DDD vale já no monolito modular. | De que são feitos os modelos dentro de um contexto? |
| 5 DDD: conceitos | Entidade, value object, agregado (raiz, invariante 79.90 + 15.00 = 94.90), repositório, evento; modelo rico; subdomínios dizem onde investir. | Quem constrói cada contexto: como a forma dos times molda o sistema? |
| 6 Lei de Conway | O sistema copia a comunicação da organização; times por camada deram 3 camadas, times por domínio (Vitrine, Checkout, Logística) dão ilhas; manobra inversa. | Como mapear uma compra real em eventos, entidades e agregados? |
| 7 Case: domínios e entidades | Eventos primeiro (event storming), depois contextos, entidades (Pedido, Cliente, Produto, Volume), value objects (Endereço, Dinheiro) e o agregado Pedido. | Como os contextos viram serviços sem ler o banco um do outro? |
| 8 Case: serviços e eventos | Um dono por tabela; API pergunta, evento avisa (e-501…e-504); o PedidoPago duplicado leva o estoque a 1 sem idempotência e a 2 com. | Com 10 réplicas do catálogo, quem decide qual atende a Lena? (módulo 7, Load Balancers) |

## Decisões
- Uma figura por aula, no máximo. Marcadores: a1 `monolito mode=mono` · a2 `monolito mode=ruido` · a3 `monolito mode=split` · a4 `dominio mode=contextos` · a5 `dominio mode=agregado` · a6 `monolito mode=conway` · a7 `dominio mode=eventos` · a8 `dominio mode=falha`. Os modes `queda` e `escala` do brief ficam como cenários do painel da aula 2; os "Faça agora" são genéricos sobre a figura e devem ser alinhados aos botões reais.
- Widgets: `vcpu` (a2), `saltos` (a3), `anemico` (a5), `eventos` (a7), `fila` (a8). O `vcpu` entra na aula 2 com a coluna dos serviços como "como ficaria", e a aula 3 explica como se chega lá. Regra de exemplo dos serviços: catálogo N, carrinho e pedidos ⌈N/4⌉, pagamentos e estoque ⌈N/5⌉, entregas 1, relatórios 4 (10× dá 25; 1× dá 10 contra 8 do monolito).
- Honestidade: a aula 3 diz que no dia comum o monolito sai mais barato (8 contra 10 vCPU).
- DDD (aulas 4, 5, 7, 8) completado com Fowler (BoundedContext, UbiquitousLanguage, DDD_Aggregate, ValueObject, EvansClassification, DomainEvent, AnemicDomainModel), Microsoft Learn (análise de domínio) e Brandolini (event storming), em palavras próprias. A DDD Reference de Evans (domainlanguage.com) dá 403 para robôs e não é citada.
- Case sem curso nem core banking: o caso é a própria loja.

## Correções ao artigo-base
1. **Conway (aula 6):** "rejeitado por Harvard" → foi a **Harvard Business Review** (1967), por não ter provado a tese; a Datamation publicou em abril de 1968 (melconway.com). O nome "Lei de Conway" foi dado por Fred Brooks (Fowler). Título: "Como os comitês inventam?".
2. **Facebook, Twitter, Uber, Netflix (aula 2):** "mantiveram o monolito em grande escala" só se confirma para o Facebook; o post do Uber diz que a empresa migrou para microsserviços; Twitter e Netflix não abriram para conferência.
3. **Istio (aula 2):** foi o plano de controle que virou um binário (istiod, 1.5); o motivo "mais simples" não consta do post oficial; o IEEE 9520758 não abre.
4. **Shopify (aula 2):** o monolito modular é trabalho em andamento, e não resultado.
5. **DDD, microsserviços e modelo rico (aula 4):** o artigo trata como um pacote; o DDD é de 2003 e o modelo rico decorre do desenho tático.
6. **Conway e arquitetura (aula 6):** "centralizado → monolito, times autônomos → microsserviços" é tendência, e não regra.

## Ponto de atenção entre módulos
O fim da aula 7 do módulo 5 (cache) promete "sharding e replicação" como próximo assunto; o módulo 6 abre pela ponte "loja rápida, mas um programa só", como no brief. Vale ajustar o gancho do módulo 5 se a Juliana quiser a ponte exata.
