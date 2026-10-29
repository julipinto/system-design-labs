/* Question bank for the Microservices, Monoliths and Domains quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction to microservices" },
    t2: { topic: "aula-2-monolitos", name: "Monoliths" },
    t3: { topic: "aula-3-microsservicos", name: "Microservices" },
    t4: { topic: "aula-4-domain-driven-design", name: "Domain-Driven Design" },
    t5: { topic: "aula-5-ddd-conceitos-e-componentes", name: "DDD: concepts and building blocks" },
    t6: { topic: "aula-6-lei-de-conway", name: "Conway's Law" },
    t7: { topic: "aula-7-case-da-loja-dominios-e-entidades", name: "Store case: domains and entities" },
    t8: { topic: "aula-8-case-da-loja-servicos-e-eventos", name: "Store case: services and events" }
  };
  var out = [];
  function add(k, n, type, level, prompt, options, answer, explain) {
    var t = T[k];
    out.push({
      id: k + "-" + (n < 10 ? "0" : "") + n,
      topic: t.topic,
      group: t.group || t.topic,
      topicName: t.name,
      type: type,
      level: level,
      prompt: prompt,
      options: options,
      answer: answer,
      explain: explain
    });
  }
  function choice(k, n, level, prompt, options, answer, explain) { add(k, n, "choice", level, prompt, options, answer, explain); }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. Introduction to microservices ---------- */
  choice("t1", 1, 1, "How is the store at the start of the module?", [
    "Six services, each with its own database.",
    "One program, the loja process, with 7 modules and the loja database, on an 8 vCPU server.",
    "Seven programs, talking through a queue.",
    "One program per team, all on the same database."
  ], 1, "Catalog, Cart, Orders, Payments, Stock, Shipping and Reports live in the same process. Splitting that is the subject of the module.");
  choice("t1", 2, 1, "What is a vCPU?", [
    "A copy of the program running in parallel.",
    "A whole server, with disk and memory.",
    "A virtual processing core, the unit the capacity math is done in.",
    "The time the processor takes to respond."
  ], 2, "The store's server has 8 vCPU. That is the unit used to compare the monolith's 80 vCPU with the services' 25 vCPU.");
  choice("t1", 3, 2, "Three teams edit the same store code and the deploy takes 40 min. What problem does this show?", [
    "The database is slow.",
    "The cache is cold.",
    "The network between the services is expensive.",
    "The teams wait for each other: rebase, deploy queue, a single binary."
  ], 3, "It is an organization problem, not a code speed problem. It weighs as much as the runtime problems.");
  tf("t1", 4, 1, "The module argues that every store should become microservices as soon as possible.", false,
    "The module is about when and how to split, and where to cut. Splitting too early is expensive, as lesson 3 shows.");

  /* ---------- 2. Monoliths ---------- */
  choice("t2", 1, 1, "What is a monolith?", [
    "A program with all the modules in a single process, usually with a single database and a single deploy.",
    "A program written in a single language.",
    "A server too big to scale.",
    "A program with no modules, everything in one file."
  ], 0, "The store has 7 modules, but they run in the same process. Having modules does not make it a set of microservices.");
  choice("t2", 2, 2, "In the monolith, the checkout of order 1047 fails at the payment after reserving the stock. What happens?", [
    "The stock stays reserved until someone fixes it by hand.",
    "The transaction's ROLLBACK undoes everything, including the stock reservation.",
    "The order is charged twice.",
    "The process restarts and the order is redone."
  ], 1, "Everything runs in a single transaction (BEGIN … COMMIT). Consistency comes for free, and it is the monolith's biggest advantage at the start.");
  choice("t2", 3, 1, "In the monolith, the checkout takes 180 ms. Why does the network not enter the math?", [
    "Because the database is in memory.",
    "Because Cart, Orders, Payments, Stock and Shipping call each other by function call in the same process, in about 0.01 ms.",
    "Because the checkout uses UDP.",
    "Because the server's internal network is infinitely fast."
  ], 1, "A function call does not leave the process. The 180 ms is work, not travel.");
  choice("t2", 4, 3, "At 23:00 the Reports module uses 7 of the 8 vCPU for 15 min. The cat page goes from 120 ms to 2.4 s and Lena's checkout blows the 2 s limit. Nobody touched the checkout. What explains it?", [
    "The database lost a replica.",
    "A noisy neighbor: the modules share the same 8 vCPU, and Reports ate almost all of them.",
    "The cache expired all at once.",
    "Lena is far from the server."
  ], 1, "When the modules share the same process and the same machine, what one consumes is missing for the others.");
  choice("t2", 5, 3, "A bug in the shipping calculation (Shipping) blows the memory and the process goes down. What goes offline?", [
    "Only the shipping screen.",
    "Only the Shipping module.",
    "The whole store: storefront, cart and payment.",
    "Only what depends on Shipping, like Stock."
  ], 2, "That is the monolith's blast radius: one module took down all seven, because the process is a single one.");
  choice("t2", 6, 2, "Black Friday: the storefront gets 10 times the traffic and the store is an 8 vCPU monolith. What is the math?", [
    "10 copies of 8 vCPU, 80 vCPU, with Reports and Payments copied without needing to be.",
    "Only the storefront is copied: 10 vCPU.",
    "One 80 vCPU server, with a single process.",
    "25 vCPU, like in the services."
  ], 0, "In the monolith you can only copy the whole program. The 25 vCPU is the microservices math, not the monolith's.");
  tf("t2", 7, 2, "For a small team and a new store, a monolith is usually the right choice.", true,
    "One deploy, one database, one end-to-end test and free consistency. The monolith's problems only weigh in when the store and the teams grow.");

  /* ---------- 3. Microservices ---------- */
  choice("t3", 1, 1, "What is a microservice, in the store?", [
    "A module with fewer than 100 lines.",
    "A small service, with its own process, its own database and an independent deploy, that talks to the others over the network.",
    "A function called over the network, with no state.",
    "A replica of the monolith."
  ], 1, "Size does not define it. What defines it is the boundary: its own process, database and deploy.");
  choice("t3", 2, 2, "The database per service rule says that...", [
    "each service may read the other services' tables, to go faster.",
    "all services use the same type of database.",
    "each table has an owner, and whoever needs the data asks through the API or listens to the event.",
    "only the Orders service has a database."
  ], 2, "If two services read the same table, they are a monolith in disguise again: any schema change breaks both.");
  choice("t3", 3, 2, "The monolith's checkout takes 180 ms. In microservices, with 4 synchronous network hops of 5 ms, how long does it take?", [
    "184 ms.",
    "200 ms.",
    "360 ms.",
    "900 ms."
  ], 1, "180 + 4 × 5 = 200 ms. The network entered the math.");
  choice("t3", 4, 2, "Black Friday with 10 times the traffic on the storefront. What is the math in microservices, and why is it smaller?", [
    "80 vCPU, same as the monolith.",
    "25 vCPU, because only Catalog gets 10 replicas and the rest stays small.",
    "10 vCPU, because the network splits the load.",
    "40 vCPU, because each service doubles."
  ], 1, "Catalog 10×1, cart 3×1, orders 3×1, payments 2×1, stock 2×1, shipping 1×1 and reports 1×4: 25 vCPU against 80.");
  choice("t3", 5, 3, "In microservices, the 23:00 report runs in the relatorios service. What happens to the cat page?", [
    "It stays at 120 ms: the noise stayed inside the Reports service.",
    "It goes to 2.4 s, as before.",
    "It drops to 60 ms.",
    "It goes down, because Catalog depends on Reports."
  ], 0, "The noisy neighbor is gone because the report no longer shares a process or vCPU with Catalog.");
  choice("t3", 6, 3, "The entregas service goes down. What happens to the order that was just paid?", [
    "The whole store goes down with it.",
    "The payment is undone.",
    "The PedidoPago event waits in the queue and is delivered when entregas comes back. The store keeps selling.",
    "The order is lost."
  ], 2, "That is failure isolation: the blast radius is one service, not the store. The queue holds the event.");
  choice("t3", 7, 3, "The payment was approved, but the stock reservation fails because the stock is already at 0. There is no ROLLBACK covering both services. What to do?", [
    "Delete the order from the Orders database and hope for the best.",
    "Compensate: refund the payment. This is the hook for the Saga pattern.",
    "Retry the reservation forever, in a loop.",
    "Go back to the monolith."
  ], 1, "Each service has its own database, so there is no single transaction. Undoing becomes a new action, the compensation.");
  tf("t3", 8, 2, "Microservices are better than the monolith at everything, because they scale and isolate failures.", false,
    "They trade easy consistency for independent scaling and failure isolation. In exchange come the network, testing, observability and compensation.");

  order("t3", 9, 2, "Put the network hops of order 1047's checkout in order (5 ms each).", [
    "carrinho calls pedidos",
    "pedidos calls pagamentos",
    "pagamentos calls estoque",
    "estoque calls entregas"
  ], "That is 4 hops between 5 services: 4 × 5 = 20 ms more, or 180 + 20 = 200 ms in total.");

  /* ---------- 4. Domain-Driven Design ---------- */
  choice("t4", 1, 1, "What is a store's domain?", [
    "The site's address.",
    "The business subject the software solves: selling, charging, picking, delivering.",
    "The set of database tables.",
    "The name of the oldest team."
  ], 1, "The domain is the business problem, not the technology. DDD starts from it to decide the design.");
  choice("t4", 2, 2, "What is ubiquitous language?", [
    "A single vocabulary, used the same way by people who talk business and people who write code, inside a context.",
    "A programming language used across the whole company.",
    "The translation of the system into several languages.",
    "A dictionary of technical terms in English."
  ], 0, "If the business says order and the code calls it order_tx_row, someone translates all the time, and bugs are born in the translation.");
  choice("t4", 3, 2, "The same cat is product 42 in Catalog, SKU GATO-042 in Stock and a 0.4 kg parcel in Shipping. What does this show?", [
    "A mistake: the cat should have a single model across the whole store.",
    "That three bounded contexts model the same cat the way each one needs, and each shape is right in its context.",
    "That the database is duplicated.",
    "That Stock should read the Catalog table."
  ], 1, "A single model for everything grows until nobody understands it. Each bounded context keeps only what matters to it.");
  tf("t4", 4, 2, "Payments needs to know what a plush cat is to charge order 1047.", false,
    "Payments only sees { pedido_id: 1047, valor: 94.90 }. It does not know what a cat is, and it is good that it does not.");
  choice("t4", 5, 3, "The store is still a single process, but the team wants to prepare the cut. What is the cheapest path?", [
    "Rewrite the monolith as microservices.",
    "Swap the database first.",
    "Modular monolith: the same limits become folders and modules with a boundary, before becoming services.",
    "Wait for next quarter."
  ], 2, "If the boundary does not hold inside the process, it will not hold on the network. The modular monolith is the rehearsal, and sometimes it is enough.");
  choice("t4", 6, 1, "What is a bounded context for?", [
    "To mark how far a model and a word hold. Outside the boundary, the meaning may change.",
    "To limit each service's memory.",
    "To stop the team from using new libraries.",
    "To keep the log of each order."
  ], 0, "Product, in Catalog, has a photo and a description. In Stock, it is a quantity in a warehouse.");

  /* ---------- 5. DDD: concepts and building blocks ---------- */
  choice("t5", 1, 1, "What is the difference between an entity and a value object?", [
    "An entity has identity and stays the same when it changes. A value object is equal if the values are equal, and is swapped whole.",
    "An entity goes to the database and a value object never does.",
    "An entity is slower than a value object.",
    "There is no difference, just the name."
  ], 0, "Order 1047 is still 1047 if the address changes. Two Dinheiro(94.90, \"BRL\") are the same money.");
  choice("t5", 2, 2, "Which of these is a value object in the store?", [
    "Order 1047.",
    "The customer Lena.",
    "The cat's parcel, with a tracking number.",
    "The address { rua: \"Rua da Aurora, 100\", cidade: \"Recife\", cep: \"50050-000\" }."
  ], 3, "The address has no identity of its own: two with the same values are the same. To change it, you swap it for another whole one.");
  choice("t5", 3, 2, "What is the Order aggregate?", [
    "A database table.",
    "The set of a customer's orders.",
    "A group of objects treated as a block, with a root (Pedido) that everything goes through and that protects the invariants.",
    "A separate service."
  ], 2, "ItemDoPedido only changes by going through the aggregate root. That way the rule cannot be bypassed from outside.");
  choice("t5", 4, 3, "Order 1047 has 1 item of 79.90 and shipping of 15.00. What total does the invariant require?", [
    "79.90.",
    "94.90.",
    "64.90.",
    "Any value, as long as the customer approves."
  ], 1, "total = sum of the items + shipping, or 79.90 + 15.00 = 94.90. The root refuses any change that breaks this.");
  choice("t5", 5, 2, "pedido.status = \"cancelado\", written from outside by anyone, is an example of...", [
    "a rich model.",
    "a domain event.",
    "an anemic model: the data stays in the object, and the rule is scattered across whoever uses it.",
    "a repository."
  ], 2, "In the rich model, pedido.cancelar() lives in the order itself and refuses if the status is enviado.");
  choice("t5", 6, 2, "What is the repository for?", [
    "For the domain to save and fetch orders (salvar, buscar(1047)) without speaking SQL.",
    "To store the source code.",
    "To copy data between services.",
    "To keep the event log."
  ], 0, "The PedidoRepository hides the database. Swapping PostgreSQL for another does not touch the order's rules.");
  choice("t5", 7, 1, "Which of these is a well-named domain event?", [
    "AtualizarPedido.",
    "PedidoPago, a fact in the past, in the language of the business.",
    "pedido_update_row.",
    "ProcessarPagamento."
  ], 1, "An event is what already happened: PedidoCriado, PedidoPago, EstoqueReservado, PedidoEnviado. A command is in the imperative.");
  choice("t5", 8, 3, "In the store, which subdomain classification is right?", [
    "Core: Catalog and Orders. Supporting: Stock and Shipping. Generic: Payments through a gateway, Notifications and Login.",
    "Core: Payments. Supporting: Catalog. Generic: Shipping.",
    "All of them are core.",
    "Core: Login and Notifications. Generic: Orders."
  ], 0, "The core is what makes the store sell and sets it apart. Generic is what any store needs and can buy ready-made.");

  /* ---------- 6. Conway's Law ---------- */
  choice("t6", 1, 1, "What does Conway's Law say?", [
    "The more services, the faster the system.",
    "The structure of the system copies the communication structure of the organization that designed it.",
    "Every system turns into a monolith over time.",
    "Small teams write better code."
  ], 1, "If three teams talk little, the system comes out in three pieces with little conversation between them.");
  choice("t6", 2, 2, "The store has 3 teams by layer: frontend, backend and DBA. What should you expect to see?", [
    "Services by domain.",
    "A store in 3 layers, where every change crosses the 3 teams.",
    "One service per team, with its own database.",
    "No effect."
  ], 1, "Changing the shipping price touches the screen, the rule and the table. Each step is a waiting queue between teams.");
  choice("t6", 3, 2, "What is the inverse Conway maneuver?", [
    "Undoing the services and going back to the monolith.",
    "Hiring more people for the slowest team.",
    "Designing the teams in the shape of the architecture you want, so the system comes out that way.",
    "Writing the code before forming the teams."
  ], 2, "If the organization defines the system, changing the teams is a way to change the system.");
  choice("t6", 4, 3, "Which team formation matches 3 islands of services?", [
    "Frontend, backend and DBA.",
    "One team per service, with a lead per team.",
    "Storefront (Catalog, search), Checkout (Cart, Orders, Payments) and Logistics (Stock, Shipping).",
    "A single team, everyone together."
  ], 2, "Each team owns a whole domain, from the screen to the database. The service design starts mirroring the 3 teams.");
  tf("t6", 5, 2, "Conway talks only about software: the size of the team does not matter.", false,
    "It talks precisely about people. The way they communicate shows up in the shape of the system.");

  /* ---------- 7. Store case: domains and entities ---------- */
  order("t7", 1, 2, "Put the events of order 1047's purchase in order.", [
    "ProdutoVisto",
    "ItemAdicionadoAoCarrinho",
    "PedidoCriado",
    "PedidoPago",
    "EstoqueReservado",
    "PedidoEnviado",
    "PedidoEntregue"
  ], "Event storming style: the timeline of the facts, from Lena's first look to the delivery in Recife.");
  choice("t7", 2, 2, "What is event storming?", [
    "A load test that fires many events.",
    "A workshop where the team sticks the business facts, in the past tense, on a wall in order, and then groups them into contexts.",
    "A queue monitoring tool.",
    "A code pattern for handling errors."
  ], 1, "It is a cheap way to find contexts, entities and aggregates before writing code.");
  choice("t7", 3, 2, "In Lena's purchase, which of these are entities?", [
    "Order, Customer, Product and Parcel.",
    "Address and Money.",
    "Only the Order.",
    "PedidoCriado and PedidoPago."
  ], 0, "All of them have identity (1047, Lena, 42, the parcel). Address and Money are value objects, and the events are facts.");
  choice("t7", 4, 3, "The events were grouped into contexts. Which one do PedidoEnviado and PedidoEntregue go in?", [
    "Catalog.",
    "Payments.",
    "Shipping, on the Logistics team.",
    "Cart."
  ], 2, "They are about shipment and tracking, the subject of Shipping. EstoqueReservado is Logistics too, in Stock.");
  tf("t7", 5, 2, "If Lena changes the address of order 1047, it becomes a different order.", false,
    "The order is an entity: its identity is 1047. The address is a value object and is swapped whole.");
  choice("t7", 6, 3, "On the case map, where is the root of the aggregate that holds the items and the shipping?", [
    "In the ItemDoPedido, which keeps the price.",
    "In the Address.",
    "In the Order, because only by going through it can an item change and the total still be 94.90.",
    "In the Customer."
  ], 2, "The root is the aggregate's single door. Whoever protects the invariant has to be whoever receives the changes.");

  /* ---------- 8. Store case: services and events ---------- */
  choice("t8", 1, 2, "Who owns each table of the loja database when the services are separated?", [
    "The Orders service owns all of them.",
    "produtos belongs to the catalog; pedidos and itens_pedido, to orders; estoque, to stock; pagamentos, to payments; remessas, to shipping.",
    "All of them stay shared, with read access open.",
    "The DBA team keeps all of them."
  ], 1, "Each table has an owner. Nobody reads another's table: they ask through the API or listen to the event.");
  order("t8", 2, 3, "Put the timeline of order 1047's events in order.", [
    "e-501 PedidoCriado, 14:02:10",
    "e-502 PedidoPago, 14:02:11",
    "e-503 EstoqueReservado, 14:02:11",
    "e-504 PedidoEnviado, 14:30:00"
  ], "The stock is only reserved after the payment, and the shipment comes half an hour later. In e-503, the stock goes from 3 to 2.");
  choice("t8", 3, 3, "PedidoPago e-502 reaches Stock twice, with no protection. What is the cat's final stock?", [
    "2, because the second one is ignored.",
    "3, because the two cancel each other.",
    "0.",
    "1, wrong: the stock went from 3 to 2 and then to 1."
  ], 3, "Each delivery deducts one unit. With the message repeated, the cat leaves the stock twice.");
  choice("t8", 4, 3, "What is the fix for the duplicate event?", [
    "Idempotency: stock keeps the evento_id values already processed and ignores the repeated one.",
    "Turn the queue off.",
    "Send each event by email only.",
    "Delete the event after reading it, with no record."
  ], 0, "With e-502 already recorded, the second copy is ignored and the stock stays at 2.");
  tf("t8", 5, 2, "In the PedidoCriado payload, evento_id is an optional field.", false,
    "It is what lets you recognize the duplicate. Without an evento_id (e-501, e-502…) idempotency has no way to work.");
  choice("t8", 6, 2, "After the cut, Stock needs the cat's price. What does it do?", [
    "Reads the catalog's produtos table.",
    "Keeps a copy of the price, without telling anyone.",
    "Asks the catalog through the API or listens to an event. It does not read the other's table.",
    "Asks the DBA for the other database's password."
  ], 2, "Reading the neighbor's table creates hidden coupling. API and event are the two agreed paths.");

  window.QUIZ = out;
})();
