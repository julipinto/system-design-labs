/* Question bank for the Service Mesh quiz (English).
   Types: choice (answer = index in options), order (options already in the right order; the quiz shuffles),
   layer (not used in this module), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao", name: "Introduction to service mesh" },
    t2: { topic: "aula-2-features-agregadas", name: "Features aggregated by the mesh" },
    t3: { topic: "aula-3-control-plane-e-data-plane", name: "Control plane and data plane" },
    t4: { topic: "aula-4-modelos-sdk-sidecar-e-proxyless", name: "Models: SDK, sidecar and proxyless" },
    t5: { topic: "aula-5-modelos-ebpf-e-ztunnel", name: "Models: eBPF and ztunnel (ambient)" },
    t6: { topic: "aula-6-casos-de-uso-e-alternativas", name: "Use cases and alternatives" }
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


  /* ---------- 1. Introduction to service mesh ---------- */
  choice("t1", 1, 1, "What is a service mesh, in one sentence?", [
    "A distributed database for the shop's services.",
    "A network layer that handles the conversation between services with a proxy next to each one, in place of retry, timeout and TLS written in each codebase.",
    "A load balancer that sits in front of the whole shop.",
    "A logging library every service has to import."
  ], 1, "The mesh moves to the network what each team used to write in code. The proxy sits next to each service and the app keeps calling http://pagamentos:8080/cobrancas as before.");
  choice("t1", 2, 1, "What was the shop's problem before the mesh?", [
    "The services were too slow for Kubernetes.",
    "Each team wrote retry, timeout, TLS and metrics its own way: pedidos retries 5 times with no wait, estoque does not encrypt, catalogo measures nothing.",
    "There was only one service, and it did not scale.",
    "The database no longer accepted connections."
  ], 1, "There were 6 services in 3 languages, and each one handled the network on its own. The rule existed, but it was different in every codebase.");
  tf("t1", 3, 1, "To use the mesh, pedidos has to change the call it makes to pagamentos.", false,
    "The outgoing call stays the same. The proxy next to pedidos intercepts it and applies the rules. The mesh is not invisible, but the code of the call does not change.");
  choice("t1", 4, 2, "pedidos retries 5 times, with no wait, when pagamentos answers 503. How many calls does pagamentos receive per charge?", [
    "5.",
    "6.",
    "10.",
    "25."
  ], 1, "The original plus 5 repeats: 6 calls, all back to back. That is the 'when it fails' of the lesson: retry with no wait makes a failure that already exists worse.");
  choice("t1", 5, 2, "Among the 'first meshes' in history are Finagle, Stubby and Hystrix. What do they have in common?", [
    "They were proxies that ran next to each pod.",
    "They were libraries inside the code, which each service had to import.",
    "They were Linux kernel components.",
    "They were the control plane of a certificate system."
  ], 1, "The modern mesh moves the same function from libraries inside the code to proxies outside it.");
  choice("t1", 6, 3, "Three languages (Go, Node.js and Java) and a new retry rule. With no mesh, what has to be done?", [
    "Change the rule in one place only, in the control plane.",
    "Rewrite the rule in the 3 network libraries and redeploy the services.",
    "Restart Kubernetes.",
    "Nothing, the languages already share the retry."
  ], 1, "Each language has its own library. With the mesh, the rule is written once and applies to all of them.");

  /* ---------- 2. Features aggregated by the mesh ---------- */
  choice("t2", 1, 1, "Which retry rule does the shop use in the mesh for pagamentos?", [
    "Up to 5 attempts, with no wait, for any error.",
    "Up to 2 attempts, with 25 ms between them, only for 503 and only on idempotent operations.",
    "One attempt every second, forever.",
    "None: the mesh does not do retry."
  ], 1, "The rule has a limit, a wait, an error type and only applies if the operation can be repeated. It is the opposite of the raw retry in each codebase.");
  choice("t2", 2, 1, "What is the shop's timeout for pagamentos, and what does the proxy answer when it is exceeded?", [
    "200 ms, and it answers 429.",
    "2 s, and it answers 504.",
    "30 s, and it answers 500.",
    "2 s, and it answers 403."
  ], 1, "Past 2 s, the proxy cancels the call and returns 504 (upstream request timeout). The pedidos app only sees the final result.");
  choice("t2", 3, 2, "What does mTLS add to the TLS from module 1?", [
    "It swaps TLS for an unencrypted connection, which is faster.",
    "Both sides present a certificate: each service proves who it is.",
    "The certificate starts to be issued by each team.",
    "It only works for calls coming from the internet."
  ], 1, "In plain TLS only the server identifies itself. In mTLS pedidos also shows a certificate, with the identity spiffe://loja.local/ns/loja/sa/pedidos.");
  choice("t2", 4, 2, "catalogo tries POST /cobrancas on pagamentos. With the shop's authorization policy, what happens?", [
    "200, but nothing is saved.",
    "403 with the body RBAC: access denied, with no line of code in pagamentos.",
    "pagamentos receives the call and decides on its own.",
    "The call is stuck until the timeout."
  ], 1, "pagamentos' proxy checks the identity in the certificate and blocks it. The decision belongs to the mesh, not to the code.");
  choice("t2", 5, 3, "One tap from Lena goes through 3 hops (app → bff-app → pedidos → pagamentos), each with 3 attempts. How many calls reach pagamentos?", [
    "9.",
    "12.",
    "27.",
    "81."
  ], 2, "3 × 3 × 3 = 27: each attempt above triggers 3 below. That is the retry storm. Retry at one level only and a retry budget prevent it.");
  order("t2", 6, 2, "Put in order what happens to the call for order 1048 inside the mesh.", [
    "The two proxies do the mTLS handshake and prove who they are",
    "pagamentos' proxy checks the authorization policy",
    "pagamentos answers 503 and pedidos' proxy repeats the call, up to 2 times",
    "Each proxy notes latency, error and a tracing span"
  ], "First the identity (mTLS), then the authorization, the retry when something fails, and the telemetry records everything.");
  tf("t2", 7, 2, "Retrying POST /cobrancas is safe because the mesh knows which operations can be repeated.", false,
    "The mesh does not know. The service's team does: that is why pedidos sends Idempotency-Key: pedido-1048 and pagamentos charges once per key.");
  choice("t2", 8, 3, "To test bff-app's fallback, the shop injects 10% of 503s into recomendacoes. Where is the failure invented?", [
    "In recomendacoes' code, which has to be changed.",
    "In the caller's proxy, and recomendacoes never receives the call.",
    "In recomendacoes' database.",
    "In the control plane, which takes the pod down."
  ], 1, "The caller's Envoy returns the fake 503 (fault injection). recomendacoes was not touched, and bff-app's fallback (module 9) can be tested.");

  /* ---------- 3. Control plane and data plane ---------- */
  choice("t3", 1, 1, "What does the control plane do, and what does the data plane do?", [
    "The control plane runs the calls; the data plane keeps the rules.",
    "The control plane keeps the rules and the certificates and pushes them to the proxies; the data plane is the proxies that run the rules on every call.",
    "Both do the same job, in different places.",
    "The control plane is the database; the data plane is the cache."
  ], 1, "The one that decides is separate from the one that does. In Istio, the control plane is istiod and the data plane is the Envoys.");
  choice("t3", 2, 1, "Which protocol does the control plane use to deliver configuration to Envoy?", [
    "SMTP.",
    "xDS.",
    "DHCP.",
    "FTP."
  ], 1, "The xDS API (LDS, RDS, CDS, EDS, SDS) delivers listeners, routes, clusters, endpoints and secrets to the proxies.");
  tf("t3", 3, 2, "The call for order 1048 goes through istiod on its way to pagamentos.", false,
    "It runs directly between the data plane proxies. istiod only pushes rules and certificates; it is never in the path of a call.");
  choice("t3", 4, 3, "istiod goes down. What happens to the call for order 1048?", [
    "All calls fail immediately.",
    "It keeps going, with the last configuration received; what stops is a new rule and the renewal of certificates.",
    "The pods restart on their own.",
    "The proxies start accepting any call without mTLS."
  ], 1, "The proxies keep the last configuration. But a new rule does not arrive, and the 24 h certificates expire without rotation.");
  choice("t3", 5, 2, "Who issues the mTLS certificates, and how often are they replaced in the shop's example?", [
    "Each team, once a year.",
    "The control plane (as the certificate authority), before the 24 h of validity run out.",
    "Kubernetes, unrelated to the mesh.",
    "Lena's browser."
  ], 1, "istiod signs one certificate per service, with the SPIFFE identity, and replaces it before it expires.");
  choice("t3", 6, 3, "A retry rule changed in the YAML. What has to be restarted for it to take effect?", [
    "The shop's 30 pods.",
    "Only the pedidos pods.",
    "Nothing: the control plane pushes the rule to the proxies, which apply it without restarting.",
    "The whole cluster."
  ], 2, "Rules change without a restart. Putting the sidecar in a pod or swapping the Envoy version does require recreating the pod (lesson 4).");

  /* ---------- 4. Models: SDK, sidecar and proxyless ---------- */
  choice("t4", 1, 1, "Where does the proxy live in the sidecar model?", [
    "Inside the app's code, as a library.",
    "In a container next to the app, in the same pod; traffic goes through it via iptables.",
    "On a single central server for the whole shop.",
    "In the node's kernel."
  ], 1, "One Envoy in each pod. Every call that enters or leaves the pod goes through it, without the app knowing.");
  choice("t4", 2, 2, "How much do the shop's sidecars cost in the example numbers?", [
    "0.1 vCPU and 50 MB in total.",
    "30 × 0.1 = 3 vCPU and 30 × 50 MB = 1.5 GB.",
    "10 vCPU and 10 GB.",
    "Nothing: the sidecar uses the app's resources."
  ], 1, "There are 30 pods, and each one has an Envoy of 0.1 vCPU and 50 MB. The cost grows with the number of pods.");
  choice("t4", 3, 2, "How many proxies does the call for order 1048 go through in the sidecar model, and how much does it cost in time (in the example)?", [
    "1 proxy, no cost.",
    "2 proxies (pedidos' outbound and pagamentos' inbound), about 1 ms.",
    "3 proxies, about 50 ms.",
    "None: the proxy stays out of the path."
  ], 1, "One Envoy on each side. The 80 ms call becomes 81 ms in the example.");
  choice("t4", 4, 3, "A new Envoy version is released. What does the shop have to do in the sidecar model?", [
    "Update a single central component.",
    "Restart the 30 pods, because the proxy lives inside each one.",
    "Nothing: Envoy updates itself.",
    "Rewrite the network libraries in the 3 languages."
  ], 1, "That is the 'when it fails' of the lesson: the proxy only changes version when the pod is recreated.");
  choice("t4", 5, 2, "What does the proxyless model require from the service?", [
    "That it runs inside an Envoy sidecar.",
    "That it speaks gRPC and uses a library with xDS support, which plays the proxy's role.",
    "That it is written in Java.",
    "That it is on the same node as the control plane."
  ], 1, "The app opens xds:///pagamentos, and the gRPC library speaks xDS directly with the control plane. It does not work for those who do not use gRPC.");
  choice("t4", 6, 3, "What is the price of the SDK model (library inside the app) compared with the sidecar?", [
    "One more proxy per pod.",
    "The mesh gets coupled to the code: one library per language (3 for the shop), and the rule changes by redeploying the services.",
    "It requires a newer kernel.",
    "It does not encrypt anything."
  ], 1, "The SDK takes the proxy out of the pod, but gives the rule back to the code of each language, which was the original problem.");

  /* ---------- 5. Models: eBPF and ztunnel ---------- */
  choice("t5", 1, 1, "What does ztunnel do?", [
    "It reads the HTTP header and does retry and canary.",
    "It handles L4 per node: mTLS, identity and policy by identity, without reading HTTP.",
    "It keeps the rules and issues the certificates.",
    "It replaces Kubernetes."
  ], 1, "ztunnel is a per-node agent, in Rust, for L4 only. The tunnel between ztunnels is HBONE, on port 15008.");
  choice("t5", 2, 2, "When does the waypoint come in on Istio ambient?", [
    "In every pod, always.",
    "Only when the service needs L7: retry, canary by weight or header, policy by method and path.",
    "Only when the control plane goes down.",
    "Never: ztunnel already does everything."
  ], 1, "The waypoint is one Envoy per namespace or service, outside the pods. Whoever does not need L7 does not go through it.");
  choice("t5", 3, 2, "With 3 nodes and 1 waypoint, how many proxies does the shop have in ambient, against the sidecar?", [
    "30 against 30.",
    "3 ztunnels and 1 waypoint, against 30 sidecars.",
    "1 against 30.",
    "6 against 30."
  ], 1, "In the example, 4 proxies × 0.1 vCPU and 50 MB = 0.4 vCPU and 200 MB, against the sidecars' 3 vCPU and 1.5 GB.");
  choice("t5", 4, 2, "What does eBPF do in a mesh like Cilium's, and where does it stop?", [
    "It does all of L7 inside the kernel.",
    "Programs in the node's kernel handle L4 without a proxy per pod; for L7 you still need an Envoy, one per node.",
    "It replaces certificates with passwords.",
    "It is only good for measuring CPU."
  ], 1, "eBPF takes the proxy out of the pod for L4, but HTTP and gRPC still ask for an Envoy, and that one is per node.");
  choice("t5", 5, 3, "A policy 'only POST /cobrancas' stays in force on ztunnel, with no waypoint. What happens?", [
    "It works normally.",
    "ztunnel does not read method or path and treats it as deny all (it fails to the safe side): pedidos' connection is refused (ztunnel does not speak HTTP, so there is not even a 403).",
    "ztunnel ignores it and lets everything through.",
    "The waypoint is created on its own."
  ], 1, "The L7 policy has to be attached to the waypoint (with targetRefs) and the waypoint has to exist.");
  tf("t5", 6, 3, "In ambient, the pedidos → pagamentos call stops going through proxies.", false,
    "It still goes through 2 ztunnels, and through 3 proxies when there is a waypoint. The CPU and memory cost goes down, but the call does not end up with no proxy.");

  /* ---------- 6. Use cases and alternatives ---------- */
  choice("t6", 1, 1, "Which situation calls for a mesh?", [
    "3 services, 1 language and 1 team, with no mTLS requirement.",
    "Many services, several languages, mTLS required everywhere and a platform team to operate it.",
    "A static site with a single page.",
    "A service that calls no other."
  ], 1, "The mesh pays off when the network rule starts to diverge between services and teams and there is someone to operate the control plane.");
  choice("t6", 2, 2, "In a shop with 3 services and 1 team, what is usually enough in place of the mesh?", [
    "A control plane with 24 h certificates.",
    "A retry and timeout library plus a good gateway.",
    "A sidecar in each pod, with no control plane.",
    "Switching languages."
  ], 1, "It costs less than operating a control plane and a proxy per pod. The mesh can wait for the day the rule starts to diverge.");
  choice("t6", 3, 3, "What is the biggest cost of adopting a mesh?", [
    "The sidecars' 3 vCPU.",
    "Operating it: keeping the control plane, swapping Envoy, writing and debugging the YAML.",
    "The price of the certificate.",
    "There is no cost."
  ], 1, "The 3 vCPU and 1.5 GB are the smallest price. The biggest is having one more system to maintain.");
  choice("t6", 4, 3, "A team applies PeerAuthentication STRICT on the loja namespace. A pod that came up without a sidecar keeps sending plain text. What happens to its calls?", [
    "They go through normally.",
    "They are refused: in STRICT mode, the pod only accepts calls with mTLS.",
    "The control plane installs the sidecar on the spot.",
    "They become L7 calls."
  ], 1, "That is the 'when it fails' of the lesson: the mesh applies to everyone, and so do its mistakes.");
  choice("t6", 5, 2, "Which of these meshes uses its own proxy, written in Rust, instead of Envoy?", [
    "Istio.",
    "Linkerd (linkerd2-proxy).",
    "Consul.",
    "Kuma."
  ], 1, "Istio, Consul and Kuma use Envoy. Linkerd has its own proxy, written in Rust.");
  tf("t6", 6, 2, "AWS App Mesh is still a good option for someone choosing a mesh now.", false,
    "AWS announced the end of support for September 30, 2026, after which the console and the resources are no longer accessible.");

  window.QUIZ = out;
})();
