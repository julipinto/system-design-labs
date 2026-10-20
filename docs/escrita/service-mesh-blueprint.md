# Blueprint do módulo 10: Service Mesh

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim.

## Fio condutor do módulo
A loja tem 30 pods que se chamam o tempo todo e cada time resolveu retry, timeout, TLS e métrica do seu jeito; a malha de serviço tira isso do código, põe na rede e deixa uma equipe só escrever a regra, igual para todos.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução | Cada time reescreveu o mesmo código de rede dentro do seu serviço; a malha move esse código para um proxy ao lado de cada app, e o app continua chamando `http://pagamentos:8080/cobrancas` como sempre. | O que exatamente esse proxy faz com a chamada do pedido 1048? |
| 2 | Features agregadas | A mesma chamada ganha, sem código novo, roteamento, balanceamento, retry com regra, timeout, mTLS, autorização, telemetria e fault injection; o preço é que regra mal escrita (retry sem limite) também vale para todos. | Quem guarda essas regras e quem as executa? |
| 3 | Control plane e data plane | Quem decide (control plane, `istiod`) é separado de quem faz (proxies do data plane); por isso a regra muda sem reiniciar nada e a chamada continua se o control plane cair. | Onde mora o proxy: dentro do código, do lado do app ou na rede? |
| 4 | SDK, sidecar e proxyless | O proxy pode morar na biblioteca (SDK), num container ao lado de cada app (sidecar) ou na própria biblioteca gRPC falando xDS (proxyless); cada lugar troca acoplamento por custo. | E se o proxy não precisasse existir em cada pod? |
| 5 | eBPF e ztunnel | Tirar o proxy do pod deixa o L4 (mTLS, política por identidade) num agente por nó e só chama um proxy L7 (waypoint) onde precisa; 3 ztunnels no lugar de 30 sidecars. | Então toda loja deveria ter uma malha? |
| 6 | Casos de uso e alternativas | A malha vale quando há muitos serviços, várias linguagens e exigência de mTLS; com 3 serviços e 1 time ela é um sistema a mais para operar. | A malha cuida da conversa entre serviços; e dentro do `pedidos`, centenas de chamadas ao mesmo tempo? (módulo 11) |

## Decisões
1. **Uma figura por aula, no máximo.** A1 `sem`, A2 `regras`, A3 `sidecar`, A4 `sidecar`, A5 `ambient`, A6 sem figura. O cenário `falha` (fault injection e a tempestade de 27 chamadas) fica acessível pelo painel da figura na A2; a A2 também tem o widget da tempestade, para a conta não depender da figura.
2. **A chamada-estrela é a mesma em todas as aulas:** o `pedidos` cobrando o pedido 1048 (94.90) no `pagamentos`. Os personagens do módulo são os serviços, e a Lena só entra como quem clica.
3. **Config real, não inventada.** Todo YAML veio da referência do Istio (VirtualService, DestinationRule, PeerAuthentication, AuthorizationPolicy, Gateway do waypoint) ou do Envoy (retry policy); está em `docs/fontes/service-mesh.md` com a página de onde saiu. Valores numéricos são os do brief.
4. **Cada aula tem uma seção "E se der errado"** dentro do passo a passo ou no Aprofundar: A1 (cada time erra de um jeito), A2 (27 chamadas), A3 (control plane cai), A4 (atualizar o Envoy = reiniciar 30 pods), A5 (política L7 sem waypoint), A6 (a malha também cai).
5. **Correção ao artigo-base** em cada aula onde o artigo está impreciso (lista completa na aula correspondente e no relatório do Judge).
6. **Números novos além do brief** (avisados na aula como exemplo e registrados aqui): cabeçalho `Idempotency-Key: pedido-1048` (para explicar por que o retry do `POST /cobrancas` é seguro); ztunnel e waypoint de exemplo com o mesmo custo de um sidecar (0,1 vCPU e 50 MB), como na figura: 3 ztunnels + 1 waypoint = 0,4 vCPU e 200 MB contra 3 vCPU e 1,5 GB (a documentação do Istio mede um waypoint em 0,25 vCPU e 60 MB e um ztunnel em 0,06 vCPU e 12 MB; a aula 5 cita isso no Aprofundar); 10 pods por nó (30 pods ÷ 3 nós); orçamento de retry de 20% (padrão do Envoy).
7. **Ponto de atenção do brief:** "3 camadas, 3 tentativas cada = 27" só fecha com três saltos de retry. A aula define os três como app da Lena → `bff-app`, `bff-app` → `pedidos`, `pedidos` → `pagamentos`. Com só os dois saltos entre serviços seriam 9.

## Vocabulário fixo (repetir, não sinonimizar)
service mesh (malha de serviço), sidecar, proxy, control plane, data plane, mTLS, identidade, SPIFFE, política de autorização, retry, timeout, canary, fault injection, telemetria, eBPF, ztunnel, waypoint, ambient, proxyless, xDS.

## Decisões da retomada (aula 6 e ajustes)
- A3 passa a abrir a figura em `mode=regras step=1` (passos "O istiod guarda as regras e empurra" e "E se der errado: o istiod cai"); A2 em `mode=regras step=2` (canary, retry, timeout, autorização) e depois `Falha` (tempestade de 27). A4 fica em `sidecar`.
- Aula 6 sem figura; ganhou a calculadora `valemalha` ("a loja precisa de malha?"), de regra de bolso.
