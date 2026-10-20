# Judge: Service Mesh (módulo 10)

Passes feitos pelo agente (voz de IA, Strunk & White adaptado, consistência com figura, quiz, glossário e widgets), seguindo ESCRITA.md.

## Voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "não é só X, é Y", "ademais": nenhuma ocorrência nas 6 aulas. Travessões: zero.
- Aula 6: a última frase da seção "E se der errado" estava próxima de um fecho moralizante; mantida porque fecha com o dado (quem precisa vigiar o lugar único), sem resumir a seção.

## Encadeamento
- Todas as aulas abrem com ponte e fecham com "Falta saber…": 1→2 (o que o proxy faz), 2→3 (quem guarda as regras), 3→4 (onde mora o proxy), 4→5 (proxy sem pod), 5→6 (quando compensa), 6→módulo 11 (concorrência dentro do `pedidos`).
- Vocabulário fixo repetido (sidecar, proxy, control plane, data plane, ztunnel, waypoint), sem sinônimos.

## Consistência de números (texto, figura, quiz, glossário, widgets)
- 30 pods / 3 nós / 6 serviços / 3 linguagens; 27 = 3 × 3 × 3 (três saltos: app da Lena → bff-app → pedidos → pagamentos); retry 2× em 503 com 25 ms; timeout 2 s; 403 RBAC: access denied; sidecar 0,1 vCPU e 50 MB → 3 vCPU e 1,5 GB.
- **Divergência corrigida:** a aula 5 e o blueprint diziam ztunnel 0,2 vCPU/100 MB e waypoint 0,25 vCPU/60 MB; a figura usa 0,1 vCPU/50 MB para cada proxy (3 ztunnels + 1 waypoint = 0,4 vCPU e 200 MB). O texto, o widget `sidecarcost` e o quiz seguem a figura; os números medidos pela documentação do Istio ficam só no Aprofundar.
- A figura mapeia os modos às aulas de outro jeito no link "voltar" (`AULA` em `fig3d.js`: regras→A3, falha→A2); os marcadores do MDX seguem o blueprint. Pendência da figura, não do texto.

## Correções ao artigo-base (todas registradas no "Aprofundar" de cada aula)
1. A1: a malha não é "invisível" (tracing exige repassar cabeçalhos, retry só em operação idempotente, o proxy custa CPU e memória).
2. A2: lista de algoritmos de balanceamento do Istio (least connection obsoleto); "fallbacks" são do app, não da malha; tracing precisa de cabeçalhos repassados; retry tem risco.
3. A3: as regras mudam sem reiniciar, mas pôr o sidecar e trocar o Envoy recriam pods.
4. A4: proxyless e sidecarless são modelos diferentes (proxyless = biblioteca gRPC com xDS).
5. A5: sem sidecar reduz CPU e memória, não elimina proxies no caminho; o proxy de L7 compartilhado é o waypoint, opcional.
6. A6: a malha não é parte natural de toda arquitetura de microsserviços; o AWS App Mesh teve o suporte encerrado em 30/09/2026 (o artigo não o cita; registrado a pedido do brief).

## Links
31 links citados, todos 200. O artigo da ACM (SoCC 2023) deu 403 a robôs e saiu das Fontes da aula 4.
