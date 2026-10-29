/* Question bank for the API Gateways quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-problemas-operacionais", name: "Introduction and operational problems" },
    t2: { topic: "aula-2-monolitos-e-microsservicos", name: "Monoliths and microservices" },
    t3: { topic: "aula-3-api-gateway-vs-load-balancer", name: "API Gateway vs Load Balancer" },
    t4: { topic: "aula-4-roteamento-autenticacao-e-autorizacao", name: "Routing, authentication and authorization" },
    t5: { topic: "aula-5-rate-limiting-throttling-token-bucket-e-leaky-bucket", name: "Rate limiting, throttling, token bucket and leaky bucket" },
    t6: { topic: "aula-6-versionamento-de-apis", name: "API versioning" },
    t7: { topic: "aula-7-laboratorio-kong", name: "Kong lab" }
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

  /* ---------- 1. Introduction and operational problems ---------- */
  choice("t1", 1, 1, "What is an API Gateway, in one sentence?", [
    "A database that stores the API's responses.",
    "The architecture's single door: it receives every outside request, applies the common rules and hands it to the right service.",
    "A program that splits the monolith into microservices.",
    "A type of TLS certificate for APIs."
  ], 1, "The gateway is a pattern: a single entry point with the common rules (route, identity, limit, version) applied once.");
  choice("t1", 2, 2, "Without a gateway, how many addresses does Lena's app need to know in the module's store?", [
    "1, the load balancer's.",
    "2, one for reads and one for writes.",
    "6, one per service.",
    "12, one per replica."
  ], 2, "Each service from module 6 has its own address (catalogo, carrinho, pedidos, pagamentos, estoque, entregas), and the client ends up knowing all of them.");
  tf("t1", 3, 1, "Without a gateway, each service may check the login in a different way.", true,
    "In the module, catalogo accepts anyone, pedidos checks one token and pagamentos checks another. Nothing guarantees the way is the same.");
  choice("t1", 4, 2, "The catalog handles 100 requests per second, and the competitor's bot asks for 500. What is the problem with having no gateway?", [
    "The bot has to be blocked service by service, in several places.",
    "The bot gets faster without a gateway.",
    "The catalog stops handling 100 per second.",
    "Lena's app stops working."
  ], 0, "Without a single door, blocking, certificates and logs exist in six places, and each one has to be configured.");
  choice("t1", 5, 3, "What is a request's path in the store with a gateway and a load balancer?", [
    "app → catalogo-1 → gw-loja → lb-loja",
    "app → lb-loja → gw-loja → catalogo-1/2/3",
    "app → gw-loja → lb-loja → catalogo-1/2/3",
    "app → gw-loja → catalogo-1 → lb-loja"
  ], 2, "The gateway receives first and chooses the service; the service's load balancer chooses the replica.");
  tf("t1", 6, 2, "With a gateway, the store can swap what is behind the door without the partner changing URL, as long as the contract stays the same.", true,
    "The public URL stays in the gateway. What changes is the route configuration, and the partner never finds out.");

  /* ---------- 2. Monoliths and microservices ---------- */
  choice("t2", 1, 1, "Why didn't the monolith have the 6-URL problem?", [
    "Because it was faster.",
    "Because it was already a single door: the client called one address, and the division into modules stayed inside the process.",
    "Because it had no login.",
    "Because it used HTTP/3."
  ], 1, "Catalog, cart and orders talked through function calls. Only the people working on the code saw the division.");
  choice("t2", 2, 2, "The gateway receives GET /api/v1/produtos/42. What does it hand to the catalog with strip_path on?", [
    "/api/v1/produtos/42",
    "/produtos/42",
    "/42",
    "/api/v1"
  ], 1, "The gateway removes the route prefix (/api/v1/produtos) and joins it with the service's base path (/produtos): the catalog receives /produtos/42.");
  order("t2", 3, 2, "Put in order what happens when the store swaps the pedidos service for a new one, with the same contract.", [
    "The orders team publishes the new service, at another internal address",
    "The store changes the /api/v1/pedidos route in the gateway to point at the new service",
    "Lena's app keeps calling /api/v1/pedidos",
    "The request reaches the new service, and nobody outside had to change anything"
  ], "The swap happens in one place, the gateway configuration. The public URL doesn't change.");
  choice("t2", 4, 3, "The new orders service returns the total as an object { valor, moeda }, and the old one returned a number. The gateway already points at the new one. What happens to the old app?", [
    "Nothing: the gateway translates the response on its own.",
    "The app breaks when reading the total, because the gateway hides the address, not the contract.",
    "The gateway answers 429.",
    "The app starts using v2 automatically."
  ], 1, "The URL is the same and the gateway worked, but the format changed. A change that breaks the contract needs another route or version (lesson 6).");
  tf("t2", 5, 1, "In the monolith, the client saw a single URL. In microservices without a gateway, it starts seeing the store's internal division.", true,
    "Each service got its own address, and the list of URLs became the store's org chart.");

  /* ---------- 3. API Gateway vs Load Balancer ---------- */
  choice("t3", 1, 1, "Which question does the load balancer answer?", [
    "Which replica serves this request.",
    "Can this person call this route?",
    "Which version of the API should handle this request?",
    "How many requests has this client already made?"
  ], 0, "The balancer chooses among N replicas of the same thing. The other three questions belong to the gateway.");
  choice("t3", 2, 1, "Which question only the gateway answers?", [
    "Which of the three catalog replicas is free.",
    "Which replica passed the health check.",
    "Did this client go over the limit of 10 requests per second?",
    "What is the IP of the catalogo-2 replica."
  ], 2, "Per-client limit, login and version are API governance, and the balancer knows nothing about them.");
  tf("t3", 3, 2, "The gateway should point directly at the IPs of the three catalog replicas, without lb-loja.", false,
    "The health check and the distribution already belong to the balancer. Pointing at the IPs would force the gateway to redo them.");
  choice("t3", 4, 3, "The store has a single gw-loja, which hangs at 8:00 PM. All the services behind it are healthy. What do clients see?", [
    "Only the catalog goes down.",
    "The whole store goes down for anyone calling from outside.",
    "The app keeps working through the replicas.",
    "Requests start going straight to the services."
  ], 1, "The gateway is everyone's door. It also needs replicas and a balancer in front.");
  tf("t3", 5, 2, "Envoy and NGINX can play both the load balancer role and the gateway role.", true,
    "The difference is in the role the component has in the architecture, not in the program that runs.");
  choice("t3", 6, 3, "In a scenario with 3 gw-loja replicas, which module 5 problem comes back when each replica counts the requests in its own memory?", [
    "Cache stampede.",
    "Stale data from a TTL that is too long.",
    "Each replica has its own copy of the truth, and the sum goes over the limit.",
    "Eviction of the wrong key."
  ], 2, "It is the local cache problem: separate counters add up to more than the limit (lesson 5).");

  /* ---------- 4. Routing, authentication and authorization ---------- */
  choice("t4", 1, 1, "What is the difference between authentication and authorization?", [
    "Authentication says what you can do, and authorization says who you are.",
    "Authentication says who you are, and authorization says what you can do.",
    "They are the same thing, with different names.",
    "Authentication belongs to the client, and authorization belongs to the database."
  ], 1, "First the gateway finds out who is calling (token), then it checks what that person can do (scopes).");
  choice("t4", 2, 2, "The call arrives with no token at a route that requires login. What does the gateway answer?", [
    "200 OK",
    "401 Unauthorized",
    "403 Forbidden",
    "404 Not Found"
  ], 1, "With no credential, the gateway doesn't yet know who is calling. An expired credential also gets 401.");
  choice("t4", 3, 2, "The partner, with only the produtos:ler scope, tries POST /api/v1/pedidos. What does the gateway answer?", [
    "401 Unauthorized",
    "403 Forbidden",
    "429 Too Many Requests",
    "200 OK"
  ], 1, "The gateway knows who the partner is, and the route asks for pedidos:criar. Someone who is known and lacks the scope gets 403.");
  choice("t4", 4, 1, "What does the gateway check in Lena's JWT?", [
    "Only whether the text is JSON.",
    "The signature (made with the store's key) and the exp deadline.",
    "Whether Lena has already bought the cat.",
    "Lena's IP address."
  ], 1, "With the signature checked and the token within its deadline, the gateway trusts the sub and passes on the X-Cliente-Id.");
  tf("t4", 5, 2, "A JWT's payload is encrypted, so it can hold the customer's password.", false,
    "The payload is just JSON encoded in base64url: anyone can read it. The signature guarantees nobody changed it, but hides nothing.");
  choice("t4", 6, 3, "The gateway checks Lena's pedidos:ler scope on GET /api/v1/pedidos/1048. Who checks whether 1048 is hers?", [
    "The gateway, from the token.",
    "The pedidos service, comparing the X-Cliente-Id with the order's owner.",
    "The load balancer.",
    "Nobody: the scope is enough."
  ], 1, "The gateway only sees the token and the URL. The order's owner is in the pedidos service's data.");
  choice("t4", 7, 3, "The pedidos service accepts any X-Cliente-Id because 'the gateway already checked'. What happens if someone reaches the internal network and calls pedidos directly?", [
    "The service refuses, because the call didn't go through the gateway.",
    "The person writes X-Cliente-Id: lena-77 by hand and reads Lena's order.",
    "The gateway blocks the call.",
    "The service answers 429."
  ], 1, "The service trusts the header. Fix: a closed internal network and the service also checking the token.");
  order("t4", 8, 2, "Put in order what the gateway does with Lena's POST /api/v1/pedidos.", [
    "Matches the route: method POST and path /api/v1/pedidos go to the pedidos service",
    "Checks the JWT's signature and exp",
    "Checks whether the token has the pedidos:criar scope",
    "Passes it to the service with X-Cliente-Id: lena-77"
  ], "Route, then authentication, then authorization, and only then does the call go on to the service.");

  /* ---------- 5. Rate limiting, throttling, token bucket and leaky bucket ---------- */
  choice("t5", 1, 1, "What does the gateway answer to a client that went over the limit of 10 requests per second?", [
    "401 Unauthorized",
    "403 Forbidden",
    "429 Too Many Requests, with Retry-After",
    "503 Service Unavailable, always"
  ], 2, "RFC 6585 defines 429 for 'too many requests in a given amount of time'. Retry-After says how long to wait: 1 second in the example.");
  choice("t5", 2, 2, "A token bucket has 200 tokens and refills 100 per second. A client sends 200 requests at once, and right after that 200 more. What happens?", [
    "All 400 get through.",
    "The first 200 get through; of the next ones only what the bucket refilled gets through, and the rest get a 429.",
    "None get through, because 200 at once is a burst.",
    "The first 200 get a 429."
  ], 1, "The burst spends the accumulated tokens. After that, only what the bucket refills gets through, 100 per second.");
  choice("t5", 3, 2, "Lena opens the app and fires 12 requests at once, with a bucket of 20 tokens refilled at 10 per second. How many get through?", [
    "10",
    "12",
    "20",
    "None"
  ], 1, "All 12 get through, and 8 tokens are left. That's why short bursts from real people don't get a 429.");
  choice("t5", 4, 2, "The bot sends 500 requests per second against the same bucket of 20 tokens and 10 per second. Roughly how many get through in the first second?", [
    "About 30: the 20 in the bucket plus about 10 refilled.",
    "500",
    "About 250",
    "None"
  ], 0, "The bucket empties in under 1 second. Of the 500 requests, about 30 get through and 470 get a 429.");
  choice("t5", 5, 1, "What defines a leaky bucket?", [
    "A bucket that gains tokens and lets a burst through.",
    "A fixed-size queue that leaks at a constant pace, dropping requests when it fills up.",
    "A counter that resets every minute.",
    "A limit that only applies to IPs from outside Brazil."
  ], 1, "The output is constant, and the burst waits in the queue. The article describes a bucket 'the size of the rate'; what defines the leaky bucket is the constant output from a queue.");
  tf("t5", 6, 2, "In a leaky bucket with a queue of 50 and output of 50 per second, a burst of 12 requests is refused on the spot.", false,
    "The burst enters the queue and leaves bit by bit. Refusal only happens when the queue is full.");
  choice("t5", 7, 2, "The catalog started answering in 2 seconds, and the gateway lowered the global limit from 100 to 50 per second. What is this called?", [
    "Per-client rate limiting.",
    "Throttling, a reaction to what is happening now.",
    "Canary.",
    "Strip path."
  ], 1, "Rate limiting is the rule written beforehand, and throttling is the gateway's reaction to the service's health.");
  choice("t5", 8, 3, "The store has 3 gateway replicas, each with a local counter of 10 per second. The bot has a single key. How much does it get per second, split in equal parts?", [
    "10",
    "30",
    "100",
    "500"
  ], 1, "Each replica sees a third of the requests and lets up to 10 through. The sum is 3 × 10 = 30, triple the limit.");
  choice("t5", 9, 3, "What is the fix for the local counter across several replicas, and what does it cost?", [
    "Restart the replicas every hour; the cost is losing the log.",
    "A shared counter in Redis; the cost is a trip to Redis per request and eventual consistency (a few extra may get through).",
    "Raise each replica's limit; the cost is nothing.",
    "Turn off rate limiting on the replicas."
  ], 1, "The shared counter brings the limit of 10 back, but the article warns that the consistency is not strong.");

  /* ---------- 6. API versioning ---------- */
  choice("t6", 1, 1, "Why did the store create a v2 of orders instead of changing v1?", [
    "Because v1 was slow.",
    "Because the total field changed shape (number to object), which breaks the old app's contract.",
    "Because the gateway requires two versions.",
    "Because the partner asked for a 429."
  ], 1, "The old app reads a number. If the total became an object on the same route, it would break.");
  choice("t6", 2, 2, "The gateway receives GET /api/v2/pedidos/1048. What does pedidos-v2 receive?", [
    "/api/v2/pedidos/1048",
    "/pedidos/1048",
    "/v2/1048",
    "/1048"
  ], 1, "The gateway removes the route prefix and joins it with the service's base path, /pedidos. The new service doesn't know v2 exists in the URL.");
  order("t6", 3, 2, "Put in order the store's canary for a new implementation of v1, with the same contract.", [
    "10% of v1's traffic goes to the new implementation",
    "If errors don't rise, it goes up to 50%",
    "If they stay stable, it goes up to 100%",
    "The old implementation is retired"
  ], "Each step is small and reversible. If errors rise at any rung, the gateway sends the traffic back.");
  tf("t6", 4, 3, "A canary works even when the new implementation returns a different response format.", false,
    "A canary only works if both implementations respect the same contract. A different format is a case for a new version.");
  choice("t6", 5, 3, "The team shuts down the /api/v1/pedidos route and marketplace-xyz was still using it. What does the partner receive?", [
    "200 with the v2 response.",
    "404, and the marketplace's orders stop coming in.",
    "429 for trying too much.",
    "401, because the key expired."
  ], 1, "With no route, the gateway answers 404. Fix: warn with a deadline (Deprecation and Sunset) and measure who still calls v1.");
  choice("t6", 6, 1, "What are the Deprecation and Sunset headers for?", [
    "To hide the old version from the client.",
    "To warn that the API is deprecated and when it will stop responding.",
    "To raise the client's limit.",
    "To swap the client's token."
  ], 1, "They are the way to give the partner a deadline before shutting down the version, along with measuring who still calls it.");

  /* ---------- 7. Kong lab ---------- */
  choice("t7", 1, 1, "In the lab's kong.yml, what does strip_path: true do?", [
    "It shows the full path in the log.",
    "It removes the route prefix (/api/v1/products) from the URL before handing it to the service.",
    "It blocks paths with a trailing slash.",
    "It creates a new path for the service."
  ], 1, "With strip_path, the route prefix disappears, and what's left is added to the service path.");
  choice("t7", 2, 2, "The lab's service is url: http://products-service:8082/products and the route is /api/v1/products. Where does curl localhost:8000/api/v1/products/42 go?", [
    "GET /api/v1/products/42 on products-service.",
    "GET /products/42 on products-service.",
    "GET /42 on products-service.",
    "GET /products on orders-service."
  ], 1, "The prefix is removed (leaving /42) and added to the service path (/products). The same goes for /api/v1/products with nothing left: GET /products.");
  choice("t7", 3, 2, "How does the module's store map the lab's services (users, products, orders)?", [
    "clientes, catalog and pedidos.",
    "pagamentos, estoque and entregas.",
    "carrinho, catalog and shipping.",
    "partners, bots and customers."
  ], 0, "users is clientes, products is the catalog (produtos) and orders is pedidos. orders-service-v2 is pedidos-v2.");
  choice("t7", 4, 2, "The lab's Kong runs with KONG_DATABASE: off and KONG_DECLARATIVE_CONFIG. What does that mean?", [
    "No database: the configuration comes from the kong.yml file, read at startup.",
    "No network: Kong only answers locally.",
    "No plugins: no extra function can be turned on.",
    "No logs."
  ], 0, "It is DB-less mode. Each node reads the file and doesn't know the other nodes, and the Admin API is read-only.");
  choice("t7", 5, 3, "Two Kong replicas with the rate-limiting plugin at config.second: 10 and policy: local. A client makes 30 requests per second, split in equal parts. How many get through?", [
    "10",
    "20",
    "30",
    "0"
  ], 1, "Each node receives 15 and lets 10 through. 20 get through, double the limit. With policy: redis, there is a single counter.");
  tf("t7", 6, 3, "Kong's rate-limiting plugin implements a token bucket with bursts.", false,
    "The documentation describes it as a limit of requests per period (second, minute, hour…). It is not a token bucket with burst capacity.");
  window.QUIZ = out;
})();
