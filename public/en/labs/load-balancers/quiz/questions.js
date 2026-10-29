/* Question bank for the Load Balancers and Reverse Proxies quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles them),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-balanceadores-escalabilidade-e-healthchecks", name: "Load balancers, scaling and healthchecks" },
    t2: { topic: "aula-2-load-balancer-vs-proxy-reverso", name: "Load balancer vs reverse proxy" },
    t3: { topic: "aula-3-round-robin", name: "Round robin" },
    t4: { topic: "aula-4-least-request", name: "Least request" },
    t5: { topic: "aula-5-least-connection", name: "Least connection" },
    t6: { topic: "aula-6-least-outstanding-requests", name: "Least outstanding requests" },
    t7: { topic: "aula-7-ip-hash-maglev-e-random", name: "IP hash, Maglev and random" },
    t8: { topic: "aula-8-camadas-4-e-7", name: "Layers 4 and 7" },
    t9: { topic: "aula-9-tecnologias-de-mercado", name: "Market technologies" },
    t10: { topic: "aula-10-laboratorio-envoy", name: "Lab with Envoy" }
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

  /* ---------- 1. Load balancers, scaling and healthchecks ---------- */
  choice("t1", 1, 1, "What does a load balancer do?", [
    "Keeps copies of pages to answer faster.",
    "Takes every request on a single address and picks, request by request, which replica answers.",
    "Creates new replicas when the store grows.",
    "Changes the replicas' IP on every request."
  ], 1, "The balancer is the single entry point. Keeping copies is the cache's job, and creating replicas is the job of whoever scales the store.");
  choice("t1", 2, 2, "Without a balancer, the first 9 requests all arrive at catalogo-1. What is the result?", [
    "The three servers split the work in equal parts.",
    "catalogo-1 goes to 100% CPU, the other two stay at 0%, and the cat page goes from 20 ms to 1.8 s.",
    "DNS changes IP on its own and redistributes the requests.",
    "The extra requests are silently dropped."
  ], 1, "DNS returned a single IP, catalogo-1's. It's the grocery store with a single open register.");
  choice("t1", 3, 1, "What is the store's healthcheck?", [
    "GET /health every 5 s, with a 1 s timeout; 3 failures in a row take the replica out and 2 successes put it back.",
    "One ping per minute; one failure takes the replica out forever.",
    "GET /produtos/42 on every real request from Lena.",
    "A person checks the servers every hour."
  ], 0, "That's a 5 s interval, a 1 s timeout, 3 failures to leave and 2 successes to return.");
  choice("t1", 4, 2, "catalogo-2 hangs at 20:00:00. When does it leave the pool and how many requests fail until then?", [
    "At 20:00:05; none fail.",
    "At 20:00:15; 1 in every 3 requests lands on it and fails (502 or 504).",
    "At 20:01:00; all of them fail.",
    "At 20:00:15; 1 in every 10 requests fails."
  ], 1, "The checks fail at 20:00:05, :10 and :15 (5 s × 3 = 15 s). With 3 replicas in the pool, 1 in every 3 requests lands on the one that hung.");
  order("t1", 5, 2, "Put in order what happens to catalogo-2, from the failure to the return to the pool.", [
    "20:00:00: catalogo-2 hangs",
    "20:00:15: the third check fails and it leaves the pool",
    "20:05:00: it starts answering again",
    "20:05:10: the second good check puts it back in the pool"
  ], "To leave, 3 failures in a row (5 s each). To return, 2 successes in a row: the checks at 20:05:05 and 20:05:10.");
  choice("t1", 6, 3, "The store scales and brings up catalogo-4 (10.0.1.14). What happens to the requests?", [
    "Lena has to change the address she types.",
    "The balancer has to be restarted.",
    "As soon as its first healthcheck passes, the balancer already sends it requests, with nobody telling Lena.",
    "Requests only reach it on the next Black Friday."
  ], 2, "The pool belongs to the balancer. Those outside only see lb-loja's address, 203.0.113.10.");

  /* ---------- 2. Load balancer vs reverse proxy ---------- */
  choice("t2", 1, 1, "What is the difference between a reverse proxy and a load balancer?", [
    "The reverse proxy sits in front of one server (1:1) and the load balancer in front of several (1:N).",
    "The reverse proxy only works on the internet and the load balancer only on the internal network.",
    "The reverse proxy reads HTTP and the load balancer never does.",
    "They are the same thing with different company names."
  ], 0, "They are two usage patterns. What changes is how many servers are behind it and what you ask of the device.");
  tf("t2", 2, 1, "Envoy, NGINX and HAProxy are balancers and cannot be reverse proxies.", false,
    "They are tools that implement both patterns. The pattern depends on how you use them.");
  choice("t2", 3, 2, "The NGINX in front of pagamentos (a single host) does which of these jobs?", [
    "Choosing among three pagamentos replicas.",
    "Terminates TLS, limits uploads to 1 MB, hides the internal IP and caches responses.",
    "Taking replicas out of the pool when they hang.",
    "Switching the balancing algorithm."
  ], 1, "With a single server there is nothing to choose. The proxy's value lies in everything it does for the host behind it.");
  choice("t2", 4, 2, "Lena talks to the NGINX in front of pagamentos. Does she ever talk to pagamentos itself?", [
    "Yes, NGINX just hands her its IP.",
    "Yes, after the first request.",
    "No: she talks to the proxy, never to pagamentos, and the internal IP stays hidden.",
    "Only if the upload is bigger than 1 MB."
  ], 2, "Hiding the infrastructure is one of the reverse proxy's roles.");
  choice("t2", 5, 3, "Which question helps choose between the two patterns?", [
    "What is the tool's brand?",
    "How many servers are behind it and what do I need from it: just look after one, or choose among several and take out of the pool the one that stopped?",
    "How many customers does the store have?",
    "Is the server in the cloud or in the office?"
  ], 1, "The pattern is decided by the design, not by the program's name.");

  /* ---------- 3. Round robin ---------- */
  choice("t3", 1, 1, "How does round robin choose the replica?", [
    "By the one that answered fastest last time.",
    "By a draw.",
    "It keeps an index and advances it with each request, in a circle: 1, 2, 3, 1, 2, 3.",
    "By the client's IP."
  ], 2, "It only keeps the turn. It looks at neither the request nor the replica.");
  choice("t3", 2, 2, "On the queue of 9 requests (the searches are P2, P5 and P8), where do the searches land with round robin?", [
    "One on each replica.",
    "All three on catalogo-1.",
    "All three on catalogo-3.",
    "All three on catalogo-2."
  ], 3, "The index 1, 2, 3 always gives requests 2, 5 and 8 to catalogo-2.");
  choice("t3", 3, 3, "How much work does each replica pile up with round robin on the queue of 9?", [
    "940 ms on each.",
    "2.7 s on catalogo-2 and 60 ms on the other two.",
    "1.8 s on catalogo-1 and nothing on the others.",
    "300 ms on each."
  ], 1, "3 searches × 900 ms = 2.7 s, against 3 cats × 20 ms = 60 ms. Each got 3 requests, and the math looks fair.");
  choice("t3", 4, 2, "With a 300 ms quantum and one request every 200 ms, how many requests in a row does each replica get?", [
    "1",
    "2",
    "3",
    "9"
  ], 1, "It only switches after the quantum. The requests at 0 and 200 ms arrive within the 300 ms; the one at 400 ms already lands on the next replica.");
  choice("t3", 5, 2, "catalogo-3 has twice the CPU and gets weight 2. What does the round robin round look like?", [
    "1, 2, 3, 3.",
    "1, 1, 2, 3.",
    "3, 3, 3, 3.",
    "1, 2, 3, 4."
  ], 0, "It enters twice per round. Weight handles the difference between machines.");
  tf("t3", 6, 3, "Round robin's weight compensates for a search costing 45 times more than a cat.", false,
    "Weight compensates for different machines, not different requests. The queue's order may even help, but another order brings the problem back.");

  /* ---------- 4. Least request ---------- */
  choice("t4", 1, 1, "What does the article's least request count?", [
    "How many connections the replica has open right now.",
    "How many requests the replica has served so far.",
    "How much CPU the replica uses.",
    "The average response time."
  ], 1, "It's a counter per replica. The next request goes to the one with the lowest number.");
  tf("t4", 2, 2, "On the queue of 9 requests, with the 3 replicas together from the start, least request gives the same result as round robin.", true,
    "All the counters go up together, and a tie goes to the first. The order comes out 1, 2, 3, 1, 2, 3, 1, 2, 3, and the searches land on catalogo-2 again.");
  choice("t4", 3, 3, "catalogo-4 joins with counter 0, while the others are at 3,000. What happens?", [
    "The balancer ignores it until the counter reaches 3,000.",
    "The requests split into four equal parts.",
    "The next 3,000 requests all go to catalogo-4, an involuntary denial of service.",
    "catalogo-4 never receives requests."
  ], 2, "By the rule, the lowest counter always wins. The new host gets hammered right when it has just come up.");
  choice("t4", 4, 2, "How do you keep the new host from being flooded in least request with a counter?", [
    "Swap the algorithm for random.",
    "Reset the counters, or use a time window.",
    "Bring the host up quietly, without a healthcheck.",
    "Give the new host weight 0 forever."
  ], 1, "An accumulated counter carries the past. Resetting or windowing lets the new host join on equal footing.");
  choice("t4", 5, 3, "Envoy's LEAST_REQUEST picks, between randomly drawn replicas, the one with the fewest what?", [
    "Requests served since the start.",
    "Active requests, that is, in flight.",
    "Idle connections.",
    "Bytes sent."
  ], 1, "Unlike the article, Envoy looks at active requests. Close to lesson 6's LOR.");

  /* ---------- 5. Least connection ---------- */
  choice("t5", 1, 1, "What does least connection measure?", [
    "How many requests the replica has served.",
    "How many connections the replica has open at this moment.",
    "How long the replica takes to answer.",
    "The distance to the client."
  ], 1, "It looks at the present: the connections open now.");
  choice("t5", 2, 1, "What is keep-alive?", [
    "A kind of healthcheck.",
    "Keeping the connection open after the response, so the next request goes out faster.",
    "Resending the request if there is an error.",
    "A limit on requests per minute."
  ], 1, "It helps speed, but creates parked connections, which least connection counts.");
  choice("t5", 3, 3, "The pool has 5 · 3 · 4 connections (catalogo-1, 2, 3). catalogo-1 has only idle connections; catalogo-2 is running 3 searches of 900 ms. Where does P9 go?", [
    "To catalogo-1.",
    "To catalogo-3.",
    "To catalogo-2, the one with the lowest number, which is exactly the busiest.",
    "To catalogo-4."
  ], 2, "Least connection compares 5, 3 and 4 and picks 2. An open connection is not work.");
  choice("t5", 4, 2, "When does least connection work well?", [
    "With short requests, with a lot of parked keep-alive.",
    "With long-lived, similar connections, like WebSocket and gRPC.",
    "When there is only one replica.",
    "When the healthcheck is turned off."
  ], 1, "There each connection is a real load, and counting connections is counting work.");
  tf("t5", 5, 2, "A replica with 5 open connections is necessarily busier than one with 3.", false,
    "The 5 may be idle browsers, and the 3 may be running heavy searches.");

  /* ---------- 6. Least outstanding requests ---------- */
  choice("t6", 1, 1, "What is a pending request?", [
    "A request the balancer has already forwarded and hasn't received the response for.",
    "An open, idle connection.",
    "A request that failed.",
    "A request that reached the balancer more than 1 s ago."
  ], 0, "An idle connection has none; one with a 900 ms search in the middle has one.");
  choice("t6", 2, 3, "Same moment as the last lesson: pending 0 · 3 · 1 (catalogo-1, 2, 3). Where does LOR send P9?", [
    "To catalogo-1, the only one really free.",
    "To catalogo-2.",
    "To catalogo-3.",
    "To the one with the fewest connections."
  ], 0, "LOR compares 0, 3 and 1 and picks 1. Least connection had picked 2 in the same scenario.");
  choice("t6", 3, 2, "What is the difference between least connection and LOR?", [
    "None: they are different names for the same rule.",
    "Least connection counts open connections; LOR counts requests still being processed.",
    "LOR only works at layer 4.",
    "Least connection looks at the IP and LOR looks at the cookie."
  ], 1, "catalogo-1's 5 idle connections weigh on least connection and don't weigh on LOR.");
  choice("t6", 4, 1, "What does AWS's ALB call the LOR algorithm?", [
    "least_outstanding_requests.",
    "least_connections.",
    "leastconn.",
    "LEAST_REQUEST."
  ], 0, "The ALB offers round_robin (the default), least_outstanding_requests and weighted_random.");
  choice("t6", 5, 3, "catalogo-3 loses its database connection and starts answering 500 in 1 ms. What does LOR do?", [
    "Takes catalogo-3 out of the pool right away.",
    "Sends it almost every new request, because it answers instantly and always stays at 0 pending.",
    "Splits the requests evenly.",
    "Waits 30 s before deciding."
  ], 1, "Answering fast is not answering right. LOR needs a healthcheck, or outlier detection, next to it.");

  /* ---------- 7. IP hash, Maglev and random ---------- */
  choice("t7", 1, 1, "How does IP hash choose the replica?", [
    "It draws on every request.",
    "It turns the client's IP into a number and uses the remainder of the division by the pool size.",
    "It picks the replica with the fewest connections.",
    "It reads the session cookie."
  ], 1, "hash(IP) % 3 with 3 replicas. The same IP always lands on the same replica.");
  choice("t7", 2, 2, "With the example hash, Lena (177.38.20.5) gives h = 20 × 256 + 5 = 5,125. Which replica is it?", [
    "catalogo-1.",
    "catalogo-2.",
    "catalogo-3.",
    "It varies on every request."
  ], 1, "5,125 % 3 = 1, the second position of a list that starts at 0: catalogo-2, on all her requests.");
  choice("t7", 3, 3, "An office in SP has 500 people behind one IP (NAT). What does IP hash do?", [
    "Spreads the 500 people across the three replicas.",
    "Sends all 500 to the same replica, because to the hash it is a single client.",
    "Refuses the office's requests.",
    "Uses each person's cookie."
  ], 1, "The hash only sees the IP. The replica gets 500 times the load of one person alone.");
  choice("t7", 4, 3, "catalogo-3 leaves and the balancer swaps % 3 for % 2. How many clients change replica?", [
    "Almost none.",
    "About 1/3.",
    "About 2/3.",
    "All of them, without exception."
  ], 2, "Only those with h % 6 in {0, 1} stay where they were. Each one that changes loses the session and the local cache.");
  choice("t7", 5, 2, "With consistent hashing (or Maglev), when catalogo-3 leaves, who changes replica?", [
    "Only the clients that were on catalogo-3, about 1/3.",
    "All the clients.",
    "Only catalogo-1's clients.",
    "Half, chosen at random."
  ], 0, "Each replica owns pieces of a table that doesn't depend only on N. Only the pieces of the one that left are redistributed.");
  choice("t7", 6, 1, "What is Maglev?", [
    "A kind of Envoy healthcheck.",
    "A Google layer 4 balancer that uses a variant of consistent hashing.",
    "An algorithm that draws the replica.",
    "A TLS certificate."
  ], 1, "The Maglev paper is from Google's team (NSDI 2016). Envoy has a MAGLEV policy.");
  choice("t7", 7, 2, "A draw of 10 requests (random) can give 2 · 5 · 3. And with 10,000?", [
    "It stays uneven, like 2,000 · 5,000 · 3,000.",
    "It tends to a third for each replica.",
    "It always gives exactly 3,333 for each.",
    "Everything goes to catalogo-1."
  ], 1, "With little traffic the draw comes out uneven. With a lot, each replica gets close to 1/3.");
  tf("t7", 8, 3, "NGINX's ip_hash uses only the first three octets of the IPv4 as the key, so an entire /24 range lands together.", true,
    "That's what NGINX's documentation says. The lesson's example uses the last two numbers just so the math fits on the screen.");

  /* ---------- 8. Layers 4 and 7 ---------- */
  choice("t8", 1, 1, "What does a layer 4 balancer see of Lena's request?", [
    "The path /produtos/42 and the cookie.",
    "Only IP and port: TCP 177.38.20.5:51514 → 203.0.113.10:443.",
    "Nothing: the request arrives empty.",
    "The body of the response."
  ], 1, "It forwards the whole connection without opening the content, which stays encrypted.");
  choice("t8", 2, 2, "Where does a layer 7 balancer send GET /carrinho/9?", [
    "To catalogo.",
    "To the carrinho service.",
    "To pedidos.",
    "To the replica with the fewest connections, whichever it is."
  ], 1, "Path-based routing: /produtos/* goes to catalogo, /carrinho/* to carrinho, /pedidos/* to pedidos.");
  choice("t8", 3, 2, "What does the balancer need to do to read the HTTP of an HTTPS request?", [
    "Terminate TLS: the loja.com.br certificate lives on it.",
    "Ask the client for the private key.",
    "Use layer 4.",
    "Swap port 443 for 80 on Lena's side."
  ], 0, "It's the price of opening the envelope. Afterwards it talks plain HTTP, or a new encrypted connection, to the replica.");
  tf("t8", 4, 1, "A layer 4 balancer can route by the session cookie.", false,
    "The cookie is an HTTP header, inside TLS. Whoever doesn't open the request doesn't see it.");
  choice("t8", 5, 2, "In the store's example, what is each layer's cost per request?", [
    "L4: +1 ms; L7: +0.1 ms.",
    "L7: about +1 ms and more CPU; L4: about +0.1 ms.",
    "Both cost 0.1 ms.",
    "Both cost 1 ms."
  ], 1, "They are example numbers, but the proportion is the idea: reading costs.");
  choice("t8", 6, 1, "Which of these AWS managed balancers works at layer 4?", [
    "ALB.",
    "NLB.",
    "Both.",
    "Neither."
  ], 1, "The NLB is L4; the ALB is L7.");

  /* ---------- 9. Market technologies ---------- */
  choice("t9", 1, 2, "When was NGINX released to the public?", [
    "On October 4, 2004 (version 0.1.0); the article says 2002, when development started.",
    "In 1995.",
    "In 2016, along with Envoy.",
    "In 2018, at the CNCF."
  ], 0, "The changelog at nginx.org gives the date of the first public version.");
  choice("t9", 2, 1, "Which tool was born at Lyft and is the base of Istio and Contour?", [
    "HAProxy.",
    "NGINX.",
    "Envoy.",
    "Traefik."
  ], 2, "Envoy does L4 and L7 and is now a CNCF project.");
  choice("t9", 3, 2, "What is the round robin rule called in each tool?", [
    "ROUND_ROBIN in Envoy and roundrobin in HAProxy.",
    "least_conn in NGINX and leastconn in HAProxy.",
    "ip_hash in Envoy and source in NGINX.",
    "weighted_random in all of them."
  ], 0, "The names change from tool to tool, but the rules are the lessons' ones.");
  choice("t9", 4, 3, "The store doesn't want to operate any balancer. What does it choose, knowing the limit?", [
    "Write the balancer in Go.",
    "The ALB or the NLB, accepting only the algorithms and tuning AWS offers.",
    "One Envoy per replica.",
    "Go back to DNS with a single IP."
  ], 1, "Managed trades control for less operational work.");

  /* ---------- 10. Lab with Envoy ---------- */
  choice("t10", 1, 1, "What is each Envoy's role in the lab?", [
    "All seven are round robin balancers.",
    "The load-balancer (port 80) is the 1:N balancer; the three reverse-proxy-N are 1:1 reverse proxies, each in front of its backend-app-N.",
    "One is a balancer and the other six are just cache.",
    "The load-balancer is the Node.js app."
  ], 1, "They are lesson 2's two patterns running on the same tool. The seven containers are 3 apps, 3 proxies and 1 balancer.");
  choice("t10", 2, 2, "Six curls to http://localhost/, with the three weights equal to 1. How do they split across the proxies?", [
    "All on reverse-proxy-1.",
    "They go through the three proxies, with no guarantee of 2 / 2 / 2: each worker rotates its own turn (when run, it came out 3 / 3 / 0).",
    "Always 2 / 2 / 2, in the order 1, 2, 3, 1, 2, 3.",
    "Only through the proxy whose application is faster."
  ], 1, "lb_policy: ROUND_ROBIN with load_balancing_weight: 1 on all three. Each Envoy worker rotates its own turn (and there is slow start), so the split only evens out with many requests. In the lab, 12 curls gave 3 / 6 / 3.");
  choice("t10", 3, 3, "You run docker compose stop reverse-proxy-2. Before the healthcheck notices, what happens?", [
    "No request fails.",
    "Requests that land on the stopped proxy hang (or return 503 after a few seconds); the others go through.",
    "All requests fail.",
    "The balancer stops answering."
  ], 1, "The balancer still counts the host in the pool and keeps rotating. When run, the stopped container neither answers nor refuses: the request waits, and the client gives up (8 of 200 requests hung) until Envoy removes the host.");
  choice("t10", 4, 2, "The load-balancer.yaml's health_checks has interval: 10s, timeout: 1s and unhealthy_threshold: 3. How long until the stopped proxy leaves the pool?", [
    "By the math, up to 30 s; measured, it took from about 30 to about 47 s.",
    "In 1 s.",
    "Only when someone restarts the balancer.",
    "In 5 minutes."
  ], 0, "3 failures in a row, one every 10 s, give up to 30 s by the math. In the lab, the last request to fail arrived at 47 s, because the host also goes through a DNS removal. In the store, with 5 s, it was 15 s.");
  choice("t10", 5, 3, "What is slow_start_window: 60s for in the cluster?", [
    "For the balancer to start slowly when it is turned on.",
    "So a host newly added to the pool receives a growing share of the requests over 60 s, instead of everything at once.",
    "To limit each client to 60 requests.",
    "To wait 60 s before each healthcheck."
  ], 1, "It's Envoy's answer to the flooded-new-host problem we saw in least request.");
  tf("t10", 6, 2, "In Envoy, load_balancing_weight is the same thing as lesson 3's round robin quantum.", false,
    "Weight decides how many requests per round; the quantum decides for how long to stay on a replica. Envoy only has the weight.");

  window.QUIZ = out;
})();
