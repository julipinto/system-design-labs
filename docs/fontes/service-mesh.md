# Fontes: Service Mesh

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [System Design - Service Mesh, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/service-mesh/), citada nas aulas 1 a 6.

**Aulas:** 1 Introdução · 2 Features agregadas · 3 Control plane e data plane · 4 Modelos: SDK, sidecar e proxyless · 5 Modelos: eBPF e ztunnel · 6 Casos de uso e alternativas

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`): 31 links citados nas aulas, todos com 200. O artigo `dl.acm.org/doi/10.1145/3620678.3624652` (Dissecting Overheads of Service Mesh Sidecars, SoCC 2023) devolveu **403** para acesso automatizado e foi retirado das Fontes da aula 4. O brief mandava conferir a data do fim do suporte do AWS App Mesh: a própria documentação da AWS traz 30 de setembro de 2026.

**Sobre as Referências do artigo:** o artigo-base (`docs/escrita/service-mesh-artigo.txt`) não traz uma seção de Referências com links externos; as fontes primárias saíram do brief (Istio, Envoy, gRPC, SPIFFE, Cilium, Buoyant, AWS, Linkerd, Consul e Kuma).

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Artigo público de Matheus Fidelis sobre Service Mesh (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/service-mesh/) | artigo base | Base do módulo: o que é a malha, features, control plane e data plane, modelos (SDK, sidecar, proxyless, eBPF) e casos de uso. As 6 aulas seguem a ordem dele, com correções registradas em cada Aprofundar. | 1, 3, 4, 5, 6 | 200 |
| [William Morgan, "What's a service mesh? And why do I need one?" (Buoyant, 2017, cópia no Internet Archive)](https://web.archive.org/web/20180104233448/https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/) | fonte primária (texto fundador) | William Morgan, 2017: a malha como camada de proxies ao lado dos serviços, e as bibliotecas anteriores (Finagle, Stubby, Hystrix). Cópia no Internet Archive. | 1 | 200 |
| [Istio: o que é um service mesh](https://istio.io/latest/about/service-mesh/) | documentação | O que é um service mesh, segundo o Istio: tráfego, observabilidade e segurança sem mudar o código. | 1 | 200 |
| [Red Hat: o que é um service mesh](https://www.redhat.com/pt-br/topics/microservices/what-is-a-service-mesh) | documentação | Explicação em português do que a malha resolve e do problema dos serviços chamando serviços. | 1 | 200 |
| [Cilium: o que é service mesh e quais requisitos ele atende](https://docs.cilium.io/en/stable/network/servicemesh/) | documentação | Cilium service mesh: eBPF no kernel do nó para L4 e Envoy (um por nó) para L7. | 1, 5 | 200 |
| [Istio: VirtualService (rotas, retries, timeout, fault)](https://istio.io/latest/docs/reference/config/networking/virtual-service/) | fonte primária (referência) | Campos reais do VirtualService: routes com weight, retries, timeout, fault. Origem do YAML de canary, retry e fault injection. | 2 | 200 |
| [Istio: DestinationRule (balanceamento, outlierDetection, connectionPool)](https://istio.io/latest/docs/reference/config/networking/destination-rule/) | fonte primária (referência) | DestinationRule: subsets, trafficPolicy, loadBalancer (round robin, least request), outlierDetection e connectionPool (maxRetries). | 2 | 200 |
| [Istio: PeerAuthentication](https://istio.io/latest/docs/reference/config/security/peer_authentication/) | fonte primária (referência) | PeerAuthentication e o modo STRICT do mTLS. | 2 | 200 |
| [Istio: AuthorizationPolicy](https://istio.io/latest/docs/reference/config/security/authorization-policy/) | fonte primária (referência) | AuthorizationPolicy: action ALLOW, principals, operation (methods, paths) e targetRefs. | 2 | 200 |
| [Istio: tarefa de fault injection](https://istio.io/latest/docs/tasks/traffic-management/fault-injection/) | fonte primária (tarefa) | Fault injection com abort e delay; aviso de que timeout e retries da mesma rota não atuam com a injeção do lado do cliente. | 2 | 200 |
| [Envoy: retry budget (circuit breakers)](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/circuit_breaker.proto) | fonte primária (referência) | retry_budget do Envoy: 20% por padrão e piso de 3 retries simultâneos. | 2 | 200 |
| [Istio: arquitetura (istiod, Envoy, data plane e control plane)](https://istio.io/latest/docs/ops/deployment/architecture/) | fonte primária (documentação) | Arquitetura do Istio: istiod (control plane) e Envoys (data plane). | 3 | 200 |
| [Envoy: protocolo xDS (SotW, incremental, ADS, TTL)](https://www.envoyproxy.io/docs/envoy/latest/api-docs/xds_protocol) | fonte primária (protocolo) | O protocolo xDS: SotW, incremental, ADS e os tipos de recurso (LDS, RDS, CDS, EDS, SDS). | 3 | 200 |
| [Envoy: retry_policy (retry_on, num_retries, retry_back_off)](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto) | fonte primária (referência) | retry_policy do Envoy: retry_on, num_retries, retry_back_off (espera padrão de 25 ms). | 3 | 200 |
| [Istio: segurança (identidade, CA e rotação de certificados)](https://istio.io/latest/docs/concepts/security/) | fonte primária (documentação) | Identidade, CA do istiod e rotação de certificados. | 3 | 200 |
| [SPIFFE: conceitos (SPIFFE ID, trust domain, SVID)](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/) | fonte primária (padrão) | SPIFFE ID, trust domain e SVID. | 3 | 200 |
| [Istio: instalação do sidecar e injeção automática](https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/) | fonte primária (documentação) | Injeção automática do sidecar: o pod precisa ser recriado. | 4 | 200 |
| [Istio: requisitos da aplicação (portas 15001 e 15006)](https://istio.io/latest/docs/ops/deployment/application-requirements/) | fonte primária (documentação) | Requisitos do app no sidecar: portas 15001 e 15006 e o redirecionamento por iptables. | 4 | 200 |
| [Istio: desempenho (CPU e memória do sidecar, latência)](https://istio.io/latest/docs/ops/deployment/performance-and-scalability/) | fonte primária (medição) | Consumo de CPU e memória do sidecar, do ztunnel e do waypoint e a latência de cada modo (1.24). | 4 | 200 |
| [gRFC A27: gRPC com xDS (formato do bootstrap)](https://github.com/grpc/proposal/blob/master/A27-xds-global-load-balancing.md) | fonte primária (gRFC) | gRPC com xDS: o formato do bootstrap e o esquema xds:///. | 4 | 200 |
| [grpc-go: exemplo de cliente xDS](https://github.com/grpc/grpc-go/blob/master/examples/features/xds/README.md) | fonte primária (exemplo) | Cliente grpc-go com xDS, base do modelo proxyless. | 4 | 200 |
| [Istio ambient: visão geral (ztunnel e waypoint)](https://istio.io/latest/docs/ambient/overview/) | fonte primária (documentação) | Visão geral do ambient: ztunnel (L4) e waypoint (L7). | 5 | 200 |
| [Istio ambient: configurar waypoints](https://istio.io/latest/docs/ambient/usage/waypoint/) | fonte primária (documentação) | Como criar e usar um waypoint (Gateway com istio-waypoint, istio.io/use-waypoint). | 5 | 200 |
| [Istio ambient: funções de L7 e políticas presas ao waypoint](https://istio.io/latest/docs/ambient/usage/l7-features/) | fonte primária (documentação) | Funções de L7 e políticas que precisam estar presas ao waypoint; política de L7 no ztunnel vira negar tudo. | 5 | 200 |
| [Istio: ambient mode chega à disponibilidade geral (1.24)](https://istio.io/latest/blog/2024/ambient-reaches-ga/) | fonte primária (anúncio) | O ambient chega à disponibilidade geral no Istio 1.24. | 5 | 200 |
| [ebpf.io: o que é eBPF](https://ebpf.io/what-is-ebpf/) | documentação | O que é eBPF: programas no kernel, carregados com segurança. | 5 | 200 |
| [AWS App Mesh: aviso de fim de suporte em 30 de setembro de 2026](https://docs.aws.amazon.com/app-mesh/latest/userguide/what-is-app-mesh.html) | fonte primária (aviso oficial) | Aviso de fim de suporte do AWS App Mesh em 30 de setembro de 2026. | 6 | 200 |
| [AWS: migrando do App Mesh para o Amazon ECS Service Connect](https://aws.amazon.com/blogs/containers/migrating-from-aws-app-mesh-to-amazon-ecs-service-connect/) | fonte primária (guia) | Migração do App Mesh para o Amazon ECS Service Connect. | 6 | 200 |
| [Linkerd: arquitetura (linkerd2-proxy em Rust)](https://linkerd.io/2-edge/reference/architecture/) | fonte primária (documentação) | O linkerd2-proxy é um micro-proxy escrito em Rust, feito só para a malha. | 6 | 200 |
| [Consul: service mesh com sidecars Envoy e mTLS](https://developer.hashicorp.com/consul/docs/connect) | fonte primária (documentação) | Consul: sidecars Envoy, autoridade certificadora embutida e mTLS. | 6 | 200 |
| [Kuma: documentação (Envoy, Kubernetes e VMs)](https://kuma.io/docs/) | fonte primária (documentação) | Kuma: malha sobre Envoy, em Kubernetes e em máquinas virtuais. | 6 | 200 |
