# Fontes: Microsserviços, Monolitos e Domínios

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Microsserviços, Monolitos e Domínios, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/monolitos-microservicos/), citada nas aulas 1 a 8.

**Aulas:** 1 Introdução · 2 Monolitos · 3 Microsserviços · 4 Domain-Driven Design · 5 DDD: conceitos e componentes · 6 Lei de Conway · 7 Case da loja: domínios e entidades · 8 Case da loja: serviços e eventos

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`, mais WebFetch onde o curl foi bloqueado): 33 links testados na pesquisa (os 13 das Referências, 6 do corpo do artigo e 14 de DDD e microsserviços) e, depois, todos os 22 links citados nas aulas, rechecados pelo curl: **todos dão 200**.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [System Design - Microsserviços, Monolitos e Domínios, Matheus Fidelis](https://fidelissauro.dev/monolitos-microservicos/) | artigo base | Monolito, microsserviços, DDD e Lei de Conway; a história de Conway (com imprecisões, ver correções). | 1 a 8 | 200 |
| [Martin Fowler: Microservices](https://martinfowler.com/articles/microservices.html) | fonte primária | Define microsserviços e compara com o monolito ("In a monolith, the components are executing in-process"). | 1, 3 | 200 |
| [Martin Fowler: Monolith First](https://martinfowler.com/bliki/MonolithFirst.html) | fonte primária | "Almost all the successful microservice stories have started with a monolith that got too big and was broken up". | 2 | 200 |
| [Martin Fowler: Microservice Prerequisites](https://martinfowler.com/bliki/MicroservicePrerequisites.html) | fonte primária | O que o time precisa ter antes de partir (provisionar rápido, monitorar, automatizar deploy). | 3 | 200 |
| [microservices.io: Monolithic Architecture](https://microservices.io/patterns/monolithic.html) | padrão | "structures an application as a single deployable/executable component"; ganhos e perdas. | 1, 2 | 200 |
| [microservices.io: Database per Service](https://microservices.io/patterns/data/database-per-service.html) | padrão | Cada serviço com o seu banco; benefícios e desvantagens. | 3, 8 | 200 |
| [microservices.io: Saga](https://microservices.io/patterns/data/saga.html) | padrão | Sequência de transações locais com compensação (só como gancho). | 3, 8 | 200 |
| [microservices.io: Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) | padrão | O consumidor guarda os ids das mensagens processadas e ignora repetidas. | 8 | 200 |
| [Shopify: The State of Shopify's Monolith](https://shopify.engineering/shopify-monolith) | caso real | Monolito modular em andamento: "almost no component has a complete, strong boundary yet". | 2, 4 | 200 |
| [Istio: istiod (blog oficial, 2020)](https://istio.io/latest/blog/2020/istiod/) | caso real | O plano de controle (Pilot, Galley, Citadel, Mixer) foi unido num binário, o istiod, no Istio 1.5. | 2 | 200 |
| [Martin Fowler: Conway's Law](https://martinfowler.com/bliki/ConwaysLaw.html) | fonte primária | "It was later dubbed 'Conway's Law' by Fred Brooks"; Inverse Conway Maneuver. | 6 | 200 |
| [Melvin Conway: How Do Committees Invent?](https://www.melconway.com/Home/Committees_Paper.html) | fonte primária | Texto original, Datamation, abril de 1968: "a design whose structure is a copy of the organization's communication structure". | 6 | 200 |
| [Melvin Conway: Conway's Law](https://www.melconway.com/Home/Conways_Law.html) | fonte primária | "HBR rejected it on the grounds that I had not proved my thesis"; Datamation publicou em abril de 1968. | 6 | 200 |
| [Martin Fowler: Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) | fonte primária | Padrão central do DDD; cada contexto tem o seu modelo e o mesmo termo muda de sentido. | 4 | 200 |
| [Martin Fowler: Ubiquitous Language](https://martinfowler.com/bliki/UbiquitousLanguage.html) | fonte primária | Termo de Evans: vocabulário comum a especialistas e desenvolvedores. | 4 | 200 |
| [Microsoft Learn: análise de domínio](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis) | documentação | "the same word (like account) has different meanings in different contexts"; desenho estratégico e tático. | 4, 7 | 200 |
| [Martin Fowler: DDD Aggregate](https://martinfowler.com/bliki/DDD_Aggregate.html) | fonte primária | Raiz do agregado; referências de fora só vão à raiz; transações não cruzam agregados. | 5, 7 | 200 |
| [Martin Fowler: Value Object](https://martinfowler.com/bliki/ValueObject.html) | fonte primária | Pontos, dinheiro e intervalos como exemplos; definido pelos atributos. | 5, 7 | 200 |
| [Martin Fowler: Evans Classification](https://martinfowler.com/bliki/EvansClassification.html) | fonte primária | Entidade, value object e serviço, na classificação de Evans. | 5 | 200 |
| [Martin Fowler: Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html) | fonte primária | Objetos com dados e sem comportamento; aparenta ser o modelo de verdade. | 5 | 200 |
| [Martin Fowler: Domain Event](https://martinfowler.com/eaaDev/DomainEvent.html) | fonte primária | Evento de domínio captura algo que aconteceu no sistema. | 5, 8 | 200 |
| [Event Storming (Alberto Brandolini)](https://www.eventstorming.com/) | fonte primária | Página oficial da técnica; lida só a página inicial. | 7 | 200 |

**Não abertos (não citados):** Medium "Domain-Driven Design, do início ao código" (403); Netflix "Seamlessly swapping the API backend" (403); Twitter "Observability at Twitter" (301 → blog.x.com, 403); DDD Reference de Evans em domainlanguage.com (403 para robôs); IEEE 9520758 (202, página vazia); Uber "uP" (406 para curl; lido por WebFetch, não citado nas aulas); podcast do Facebook (403 para curl; lido por WebFetch, não citado); `martinfowler.com/bliki/DomainEvent.html` (404; o certo é `eaaDev/DomainEvent.html`).

**Abertos e não citados:** AWS (monolito x microsserviços), Viceri, Wikipedia (Domain-driven design), Amazon (livro de Evans), Supero, TechTarget (Conway e microsserviços), microservices.io Microservice Architecture.

## Por aula
1. Introdução: fidelissauro.dev, Fowler Microservices, microservices.io Monolithic.
2. Monolitos: fidelissauro.dev, microservices.io Monolithic, Fowler MonolithFirst, Shopify, Istio.
3. Microsserviços: fidelissauro.dev, Fowler Microservices, Database per Service, Saga, Microservice Prerequisites.
4. DDD: fidelissauro.dev, Microsoft domain analysis, Fowler Bounded Context, Ubiquitous Language, Shopify.
5. DDD conceitos: fidelissauro.dev, Fowler Aggregate, Value Object, Evans Classification, Domain Event, Anemic Domain Model.
6. Lei de Conway: fidelissauro.dev, Committees Paper, Conway's Law (melconway), Fowler Conway's Law.
7. Case, domínios e entidades: fidelissauro.dev, Event Storming, Microsoft domain analysis, Fowler Aggregate, Value Object.
8. Case, serviços e eventos: fidelissauro.dev, Database per Service, Idempotent Consumer, Domain Event, Saga.

## Correções ao artigo-base (também em `docs/escrita/microsservicos-blueprint.md`)
1. **Conway (aula 6):** o artigo diz "rejeitado por Harvard em 1967". Conway escreve que submeteu à **Harvard Business Review**, que rejeitou por ele não ter provado a tese; a Datamation publicou em **abril de 1968**. O nome "Conway's Law" foi dado por Fred Brooks (Fowler). O título original, "How Do Committees Invent?", fica melhor como "Como os comitês inventam?".
2. **Facebook, Twitter, Uber e Netflix (aula 2):** o artigo diz que mantiveram o monolito em grande escala. O Facebook confirma (escalou o monolito em PHP). O post do Uber diz que "eventually Uber transitioned to a microservice architecture". Twitter e Netflix não abriram para conferência.
3. **Istio (aula 2):** o artigo diz que a ferramenta mudou de microsserviços para um monolito por ser mais simples. O post oficial diz que foi o plano de controle, unido no binário istiod (1.5); o motivo "mais simples" não consta do post. O IEEE 9520758 não abre.
4. **Shopify (aula 2):** o artigo trata o monolito modular como resultado. A Shopify diz que o trabalho está em andamento.
5. **DDD e microsserviços (aula 4):** o artigo junta DDD, modelo rico e microsserviços num pacote; o DDD é de 2003, e o modelo rico decorre do desenho tático.
6. **Monolito como estágio inicial (aula 2):** confirmado por Fowler (MonolithFirst). Sem correção.
