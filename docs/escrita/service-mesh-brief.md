# Módulo 10: Service Mesh (brief canônico)

Fonte principal: https://fidelissauro.dev/service-mesh/ (texto em docs/escrita/service-mesh-artigo.txt; ver as Referências no fim). Fontes primárias: documentação do Istio (arquitetura, sidecar, ambient mode: ztunnel e waypoint, PeerAuthentication, AuthorizationPolicy, VirtualService, DestinationRule, fault injection), Linkerd docs, Cilium service mesh (eBPF), Envoy xDS API, gRPC proxyless xDS, SPIFFE (spiffe.io), William Morgan "What is a service mesh?" (Buoyant, 2017), anúncio de fim de suporte do AWS App Mesh (conferir data).
O repositório público de labs não tem exemplo deste dia: não há aula de laboratório. Não citar curso.
Siga PREMISSAS.md e ESCRITA.md. Slug: `service-mesh`. Coleção `src/content/service-mesh/`, página `src/pages/labs/service-mesh/`. Título do módulo: "Service Mesh".
**Uma figura só** neste módulo (6 aulas): `mesh-3d`.

## Onde a história parou e o novo problema
Módulo 9 terminou com o `bff-app` montando a tela da Lena com timeout e fallback. Mas dentro da loja há **6 serviços** conversando entre si (`pedidos → pagamentos`, `pedidos → estoque`, `bff-app → catalogo`…), em 3 linguagens (Go, Node.js, Java), e cada time escreveu retry, timeout, TLS e métrica do seu jeito: o `pedidos` tenta de novo 5 vezes sem esperar, o `estoque` não usa TLS, o `catalogo` não mede nada. O problema do módulo: **tirar isso do código e colocar na rede, uma vez só, igual para todos**.

## História canônica (texto, figura, quiz, glossário, widgets: OS MESMOS dados)
### O cenário
- Kubernetes, namespace `loja`. **30 pods** no total (catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4, bff-web 4).
- Chamada-estrela: o `pedidos` cobrando o pedido **1048** (94.90) no `pagamentos`: `POST http://pagamentos:8080/cobrancas { "pedido_id": 1048, "valor": 94.90 }`.

### Features (aula 2)
- **Roteamento:** `pedidos` v2 recebe **10%** das chamadas (canary), por peso; ou só quem manda o cabeçalho `x-versao: v2`.
- **Balanceamento por serviço:** o `catalogo` com least request, o `pagamentos` com round robin (os algoritmos do módulo 7, agora no sidecar de quem chama, sem um balanceador no meio).
- **Retry com regra:** `pagamentos` responde **503** uma vez; a malha tenta de novo até **2 vezes**, com **25 ms** entre tentativas, só para erros 503 e só em operações idempotentes. **E se der errado:** retry sem limite em 3 camadas (bff → pedidos → pagamentos, 3 tentativas cada) = **27** chamadas ao `pagamentos` por um clique (tempestade de retries).
- **Timeout:** 2 s para o `pagamentos`.
- **mTLS:** toda chamada entre pods é cifrada e cada lado prova quem é; identidade SPIFFE `spiffe://loja.local/ns/loja/sa/pedidos`. O control plane emite e troca os certificados (validade de exemplo: 24 h). Liga com o TLS do módulo 1: aqui **os dois lados** apresentam certificado.
- **Autorização:** só o `pedidos` pode chamar `POST /cobrancas` do `pagamentos`. O `catalogo` tenta → **403 RBAC: access denied**, sem nenhuma linha de código no `pagamentos`.
- **Telemetria de graça:** latência p50/p99, taxa de erro e vazão por par de serviços, e spans de tracing (o `trace_id` do módulo 6) gerados pelos sidecars.
- **Fault injection:** injetar **10%** de 503 ou **2 s** de atraso no `recomendacoes` para testar o fallback do `bff-app` (módulo 9).

### Control plane e data plane (aula 3)
- **Control plane** (no Istio, o `istiod`): guarda as regras (as acima, escritas em YAML: VirtualService, DestinationRule, AuthorizationPolicy, PeerAuthentication) e o certificado de cada serviço, e empurra tudo para os proxies (API xDS do Envoy).
- **Data plane:** os proxies que estão no caminho de cada chamada e executam as regras. Se o control plane cai, as chamadas **continuam** com a última configuração recebida; só não chega regra nova.

### Modelos (aulas 4–5)
- **SDK / client-server:** biblioteca dentro do app (em cada linguagem; 3 bibliotecas para a loja); acopla a malha ao código.
- **Sidecar:** um Envoy em cada pod; o tráfego de entrada e saída passa por ele (iptables). Custo de exemplo: **0,1 vCPU e 50 MB** por sidecar × 30 pods = **3 vCPU e 1,5 GB**; cada chamada passa por **2 proxies** (+~**1 ms** de exemplo). Atualizar o Envoy = reiniciar os 30 pods.
- **Proxyless:** a biblioteca gRPC fala xDS direto com o control plane (sem sidecar), só para gRPC.
- **eBPF (Cilium):** programas no kernel do nó fazem o L4 (rota, política, métricas) sem proxy por pod; L7 ainda precisa de um Envoy por nó.
- **Ambient (Istio): ztunnel + waypoint:** um **ztunnel por nó** (L4: mTLS e autorização por identidade) e um **waypoint** por namespace/serviço só quando precisa de L7 (retry, roteamento por cabeçalho). Com 3 nós: 3 ztunnels em vez de 30 sidecars.
- Comparação no fim: onde mora o proxy, custo, o que cada um faz em L4 e L7.

### Casos de uso e alternativas (aula 6)
Quando vale (muitos serviços, várias linguagens, exigência de mTLS em tudo, times de plataforma) e quando não (3 serviços, 1 time: biblioteca e um bom gateway bastam; a malha também é um sistema a operar). Alternativas: Istio (sidecar e ambient), Linkerd (proxy próprio em Rust), Consul Connect, Cilium, Kuma; AWS App Mesh (fim de suporte anunciado: conferir data e corrigir o artigo se ele citar como opção atual).

## Aulas (6): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1 introducao · 2 features-agregadas · 3 control-plane-e-data-plane · 4 modelos-sdk-sidecar-e-proxyless · 5 modelos-ebpf-e-ztunnel · 6 casos-de-uso-e-alternativas (fecha com "Falta saber…": a malha cuida da conversa entre os serviços, mas dentro de cada serviço o `pedidos` atende centenas de chamadas ao mesmo tempo; como um programa faz várias coisas ao mesmo tempo sem uma pisar na outra? → módulo 11, Concorrência e Paralelismo)

## Widgets 2D (Sonnet)
- Tempestade de retries: nº de camadas × tentativas por camada → chamadas no último serviço (3 × 3 × 3 = 27), com e sem orçamento de retry.
- Custo do sidecar: nº de pods × (vCPU, MB) por sidecar vs ztunnel por nó.
- "Quem pode chamar?": matriz origem × destino com a AuthorizationPolicy (200 ou 403).

## Figura 3D (Opus) e modes
### `mesh-3d` (aulas 1–5): os pods da loja e a malha entre eles
Pods como caixas com o app dentro e o sidecar colado ao lado (ou não, conforme o modo); o control plane acima, ligado aos proxies por linhas finas de configuração; a chamada `pedidos → pagamentos` do pedido 1048 como pacote que acende ao passar por cada proxy. Painel com o YAML da regra ativa e o resultado real (cabeçalhos, código HTTP, ms).
modes: `sem` (cada app com sua lógica: retry 5× sem espera, estoque sem TLS, catálogo sem métrica), `sidecar` (Envoy em cada pod; mTLS com o SPIFFE ID; métricas aparecem), `regras` (control plane empurra: canary 10%, retry 2× em 503, timeout 2 s, AuthorizationPolicy; catálogo → 403), `falha` (fault injection 10% 503 no recomendacoes; e se der errado: tempestade de 27 chamadas), `ambient` (os sidecars somem; ztunnel por nó para L4 e um waypoint para L7; contador de vCPU/MB 30 sidecars vs 3 ztunnels).

Marcadores no MDX: `{/* FIG:mesh mode=sidecar */}` etc. Aula 6 sem figura 3D.

## Vocabulário fixo
"service mesh" (ou "malha de serviço"), "sidecar", "proxy", "control plane", "data plane", "mTLS", "identidade", "SPIFFE", "política de autorização", "retry", "timeout", "canary", "fault injection", "telemetria", "eBPF", "ztunnel", "waypoint", "ambient", "proxyless", "xDS".
