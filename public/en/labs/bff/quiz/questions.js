/* Question bank for the Backend for Frontends (BFF) quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-e-responsabilidades", name: "Introduction and responsibilities" },
    t2: { topic: "aula-2-api-composition", name: "API composition" },
    t3: { topic: "aula-3-canais-e-dispositivos", name: "Channels and devices" },
    t4: { topic: "aula-4-microfrontends-e-bffs", name: "Microfrontends and BFFs" },
    t5: { topic: "aula-5-versionamento-e-deployment", name: "Versioning and deployment" },
    t6: { topic: "aula-6-resiliencia-e-blast-radius", name: "Resilience and blast radius" },
    t7: { topic: "aula-7-metricas-e-experiencia", name: "Metrics and user experience" },
    t8: { topic: "aula-8-consideracoes-finais", name: "Final considerations" }
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

  choice("t1", 1, 1, "What is a BFF, in one sentence?", ["A load balancer for the app.", "A backend tailored to one frontend, which makes the calls the screen needs and returns only what it uses.", "A database for the phone.", "Another name for the API Gateway."], 1, "BFF is Backend for Frontend: one backend per frontend, written for the screen it serves.");
  choice("t1", 2, 2, "With no BFF, Lena's app makes 4 calls in a queue on 4G, 120 ms each. How long does the network alone take?", ["120 ms.", "240 ms.", "480 ms.", "1.2 s."], 2, "4 × 120 ms = 480 ms, before the screen is complete.");
  tf("t1", 3, 1, "It's acceptable for the custo_fornecedor field to reach Lena's phone, because the app doesn't show it.", false, "An internal field should never leave the store's network. The BFF is what filters what gets through.");
  choice("t1", 4, 2, "Which of these does a BFF usually take on?", ["Storing the store's database.", "Composing payloads, adapting contracts and triggering fallbacks.", "Replacing the load balancer.", "Deciding the shipping price."], 1, "Composition, contract adaptation, filters, cache and fallback are BFF work. Shipping is a business rule and stays in the service.");
  choice("t1", 5, 2, "Module 8 left the gw-loja in front of everything. Why wasn't that enough for the app's screen?", ["The gateway doesn't check the JWT.", "The gateway is generic: it doesn't build the screen, and the app still makes 4 calls and receives JSON made for the website.", "The gateway only accepts the website.", "The gateway doesn't accept HTTPS."], 1, "The gateway takes care of the front door. The BFF builds a screen's response.");
  tf("t1", 6, 2, "The BFF is an infrastructure component, like the gateway and the load balancer.", false, "The BFF is an application with product code, its own scaling and an owner. It sits behind the gateway.");
  choice("t2", 1, 1, "What is API composition in a BFF?", ["Compressing the response with gzip.", "One client call turns into several service-to-service calls, made by the BFF, which joins the responses into one.", "Splitting one API into several.", "Storing the responses in Redis."], 1, "The client makes one call; the BFF makes the others and composes the response.");
  choice("t2", 2, 2, "The bff-app calls 4 services in parallel and the slowest takes 25 ms. With 120 ms of network and ~5 ms of assembly, what is the total time?", ["~25 ms.", "~100 ms.", "~150 ms.", "~480 ms."], 2, "120 + 25 + 5 = 150 ms: one network trip and only the slowest service.");
  choice("t2", 3, 2, "Why does the BFF wait only 25 ms if it calls four services?", ["Because the services are faster than normal.", "Because it calls all four at the same time and waits only for the slowest.", "Because it stores everything in cache.", "Because the app already had half the data."], 1, "In parallel, the total is the time of the slowest call, not the sum.");
  choice("t2", 4, 2, "From what to what does the app home's response shrink with the BFF?", ["From 180 KB to 12 KB.", "From 12 KB to 180 KB.", "From 480 KB to 120 KB.", "It doesn't change."], 0, "Without the 8 high-res photos, the long description and the internal fields.");
  order("t2", 5, 2, "Put the path of GET /app/home in order.", ["The app makes one call over 4G", "The gw-loja checks the JWT and passes the request to the bff-app", "The bff-app calls the 4 services at the same time", "The bff-app builds the 12 KB JSON and responds"], "One trip from the phone, the gateway at the door, parallel composition and only then the built response.");
  choice("t2", 6, 3, "Each service answers well 99.9% of the time and the screen needs all four. What is the screen's availability, with no fallback?", ["99.9%.", "About 99.6%.", "About 96%.", "100%."], 1, "0.999 to the power of 4 is ≈ 0.996. Whoever composes depends on everyone.");
  tf("t2", 7, 2, "If call 2 depends on the result of call 1, the BFF still wins: each wait costs the ms of the internal network, not the 120 ms of 4G.", true, "The dependency forces a wait, but the wait is inside the store's network.");
  choice("t3", 1, 1, "What is a channel?", ["A type of database.", "A way for the user to talk to the store: app, website, voice.", "A message queue.", "A gateway route."], 1, "App, website and voice are channels; each one gets its own BFF.");
  choice("t3", 2, 2, "Which BFF renders the page on the server (SSR) and keeps the session in Redis?", ["bff-app.", "bff-voz.", "bff-web.", "marketplace-xyz."], 2, "The bff-web serves the website, with large photos and the session in the central cache.");
  choice("t3", 3, 2, "What does the bff-voz answer to \"where is my order?\"", ["A 12 KB JSON.", "An HTML page.", "A short sentence: \"Your order 1048 is on its way and arrives Thursday.\"", "A photo of the cat."], 2, "Voice has no screen: the answer is short text, no photo.");
  choice("t3", 4, 3, "Why doesn't marketplace-xyz get a BFF?", ["Because it's slow.", "Because a BFF is for your own frontend; the partner uses the generic public API on the gateway.", "Because it has no JWT.", "Because it only accepts XML."], 1, "An external partner isn't a store frontend. Its contract is generic and stable.");
  choice("t3", 5, 3, "Without a BFF per channel, what usually happens in the single backend?", ["Nothing.", "An if per channel that grows with every endpoint.", "The database gets faster.", "The gateway stops working."], 1, "An if (canal == app) ... else if (canal == web) ... in every endpoint, and editing for the app can break voice.");
  tf("t3", 6, 2, "The same data (the status of order 1048) reaches each channel in a different format, but comes from the same pedidos service.", true, "The data is one; each channel's BFF only changes the shape.");
  choice("t4", 1, 1, "What is a microfrontend?", ["A frontend with no JavaScript.", "A piece of the screen, owned by one team, published without waiting for the others.", "A very small app.", "A type of cache."], 1, "Each team owns a piece of the screen and the BFF that feeds it.");
  choice("t4", 2, 2, "What are the three BFFs of the store's website?", ["bff-app, bff-web and bff-voz.", "bff-vitrine, bff-checkout and bff-rastreio.", "bff-v3, bff-v4 and bff-v5.", "bff-gato, bff-caneca and bff-pedido."], 1, "One for each team from module 6: Vitrine, Checkout and Logística.");
  choice("t4", 3, 3, "Three BFFs calculate shipping three different ways and Lena sees two values in the same purchase. What is the rule to avoid it?", ["Merge the three BFFs into one.", "The business rule stays in the service that owns it; the BFF only composes and adapts.", "Each BFF rounds up.", "Turn off checkout."], 1, "If it changes the result, it belongs to the service. If it only changes the format, it belongs to the BFF.");
  choice("t4", 4, 2, "Which of these changes belongs to the BFF, not the service?", ["The shipping price.", "Who gets a discount.", "Renaming a field and cutting the large photo.", "Whether the order can be canceled."], 2, "Format belongs to the BFF. Result and rules belong to the service.");
  choice("t4", 5, 2, "How does this relate to Conway's Law?", ["It doesn't.", "The system ends up with the shape of the organization: three teams, three screen pieces, three BFFs.", "It forbids microfrontends.", "It requires a single BFF."], 1, "Splitting the screen the way the teams are split is Conway in practice.");
  tf("t4", 6, 2, "Each team can publish its microfrontend and its BFF without waiting for the others.", true, "That's the autonomy gain: independent deploy.");
  choice("t5", 1, 1, "Why do bff-app-v3 and bff-app-v4 run together?", ["To save money.", "The v3 is still on 30% of phones and the v4 contract is different.", "The v4 doesn't work alone.", "The gateway requires two."], 1, "What's on the phone doesn't update when the store wants.");
  order("t5", 2, 2, "Put the new screen's rollout in order.", ["nova_home turns on for 10% of v4 users", "goes up to 50%", "goes up to 100%", "turns off bff-app-v3 when v3 usage falls below 1%"], "Gradually, and v3 only goes away when the BFF's own data shows almost nobody uses it.");
  choice("t5", 3, 2, "When should bff-app-v3 be turned off?", ["As soon as v4 is out.", "When v3 usage, measured in the BFF itself, falls below 1%.", "Never.", "When the toggle reaches 10%."], 1, "Turning it off early would leave whoever still uses v3 with no screen.");
  choice("t5", 4, 3, "What is the difference between the nova_home toggle and a canary?", ["None.", "The toggle changes what the user sees; the canary tests a new BFF version on a little traffic.", "The canary is for the app and the toggle for the website.", "The toggle requires a new deploy."], 1, "Toggle: who sees. Canary: where the new code runs.");
  choice("t5", 5, 2, "How does the gateway choose between v3 and v4?", ["By the time of day.", "By a header with the app version, like X-App-Version, in a route rule.", "By the app's color.", "By drawing lots."], 1, "The app reports its version and the gateway route points to the right BFF.");
  tf("t5", 6, 2, "To go back on the new screen, just turn the toggle off, with no new deploy.", true, "That's the toggle's advantage: the code is already live.");
  choice("t6", 1, 1, "What does the bff-app do when the recomendacoes takes more than 100 ms?", ["Waits up to 30 s.", "Gives up on that call and answers with the screen without the section, with recommended empty.", "Takes the screen down.", "Calls the catalogo."], 1, "Timeout and fallback: Lena doesn't even notice.");
  choice("t6", 2, 3, "With no timeout, the recomendacoes goes 30 s without responding. What happens to the bff-app?", ["Nothing.", "Connections pile up until it falls, and the whole home screen disappears.", "Only the section disappears.", "The gateway answers in its place."], 1, "Each screen gets stuck in the wait, and a service that only decorates takes down the app.");
  choice("t6", 3, 2, "What does the app show if the pedidos service goes down?", ["The whole screen as an error.", "The screen with the order section saying \"status unavailable right now\".", "Nothing.", "Someone else's order."], 1, "Small failure, whole screen.");
  choice("t6", 4, 2, "What is blast radius?", ["The size of the server.", "How far a failure reaches: how many channels and users feel it.", "The number of replicas.", "The deploy time."], 1, "If the catalogo goes down, bff-app and bff-web feel it together.");
  tf("t6", 5, 3, "Splitting one BFF per channel already splits the shared dependencies.", false, "The BFFs still call the same services. Isolating the calls is a bulkhead topic.");
  choice("t6", 6, 3, "Canary and blue-green reduce which type of failure?", ["A service that goes down.", "A bad BFF version, validated before it reaches everyone.", "4G network failures.", "None."], 1, "For a service that goes down, timeout, fallback, circuit breaker and bulkhead apply.");
  choice("t7", 1, 2, "What are the metrics of the bff-app and the bff-web?", ["p95 150 ms and 2% errors in the app; p95 300 ms and 0.1% in the web.", "p95 300 ms and 2% in the app; p95 150 ms and 0.1% in the web.", "The same.", "They don't exist."], 0, "Each channel measures its own.");
  choice("t7", 2, 3, "Where do the app's 2% errors come from?", ["From all phones.", "Only from v3 on old Android.", "From the website.", "From the gateway."], 1, "Breaking down by version and OS shows the origin.");
  choice("t7", 3, 3, "In a single backend, why would the app's problem go unnoticed?", ["Because the app doesn't generate errors.", "Because the 2% would be diluted into a total of ~0.6%, together with the website.", "Because Prometheus doesn't work.", "Because v3 would be turned off."], 1, "The total hides the small channel.");
  choice("t7", 4, 1, "What does p95 mean?", ["The average of the requests.", "95 out of every 100 requests were faster than that time.", "95% errors.", "95 ms."], 1, "It shows the slow side that the average hides.");
  choice("t7", 5, 2, "How does a Prometheus query separate the channels?", ["It doesn't.", "With a label (channel, version) on the metric and a sum by on that label.", "Only with logs.", "By swapping the gateway."], 1, "The breakdown by channel is a label.");
  choice("t8", 1, 1, "What is the difference between a BFF and an API Gateway?", ["None.", "The gateway is generic infrastructure (routing, auth, limits); the BFF is product code, owned by the frontend team.", "The BFF only works for the app.", "The gateway composes screens."], 1, "The gateway looks at the front door; the BFF looks at the screen.");
  choice("t8", 2, 2, "What is the full path of an app call?", ["app → services → gw-loja", "app → gw-loja → bff-app → services", "gw-loja → app → services", "app → bff-app → database"], 1, "The gateway at the door, the BFF building the screen, the services behind.");
  choice("t8", 3, 3, "When is a BFF NOT worth using?", ["With very different channels.", "With a single channel and a single team, where a gateway with simple composition solves it.", "With several teams.", "When the screen joins many services."], 1, "The BFF would be just one more hop to maintain.");
  choice("t8", 4, 2, "What is left for module 10 (Service Mesh)?", ["Drawing the screen.", "Timeout, retry, encryption and metrics between services, in the network, once.", "Choosing the frontend.", "Creating the JWT."], 1, "Each team was writing that its own way, in every language.");

  window.QUIZ = out;
})();
