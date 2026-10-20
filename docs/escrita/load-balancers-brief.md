# Módulo 7: Load Balancers e Proxies Reversos (brief canônico)

Fonte principal: https://fidelissauro.dev/load-balancing/ (texto em docs/escrita/load-balancing-artigo.txt, com os códigos Go de Round Robin, Least Request, IP Hash e Random e as Referências).
Lab público: github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design, pasta `exemplos/load-balancing/`: `algoritmos/{round-robin,least-request,ip_hashing,random}/main.go` e `envoy-patterns/` (1 Envoy load balancer em round robin → 3 Envoys proxy reverso → 1 app Node.js; `envoy-configs/load-balancer.yaml`, `reverse-proxy-1..3.yaml`, `docker-compose.yml`, `test-patterns.sh`, `test-weighted-quantum.sh`). Usar o código real em <pre> na aula 10. Não citar curso no site (o link do repositório entra como "repositório público do autor", como no módulo 5).
Fontes primárias: Envoy docs (load balancers, health checking, outlier detection), paper do Maglev (Eisenbud et al., NSDI 2016), NGINX docs (upstream, `least_conn`, `ip_hash`, `health_check`), HAProxy docs (`balance roundrobin|leastconn|source`), AWS ELB docs (ALB "least outstanding requests", NLB camada 4), RFC 9110 para os cabeçalhos HTTP, Karger et al. 1997 (consistent hashing).
Siga PREMISSAS.md e ESCRITA.md. Slug: `load-balancers`. Coleção `src/content/load-balancers/`, página `src/pages/labs/load-balancers/`. Título do módulo: "Load Balancers e Proxies Reversos".

## Onde a história parou e o novo problema
Módulo 6 terminou com a loja partida em serviços e o `catalogo` rodando em várias réplicas na Black Friday. A Lena digita `loja.com.br` e o DNS (módulo 1) devolve **um** IP. Qual réplica responde? Sem ninguém no meio, todo mundo cai na mesma (`catalogo-1`), que satura enquanto as outras ficam paradas — a fila do mercadinho com um caixa só. O módulo é a história do **balanceador** que fica na frente das réplicas.

## História canônica (texto, figuras, quiz, glossário, widgets: OS MESMOS dados)
### O cenário
- Endereço público: `loja.com.br` → **203.0.113.10** (o IP do balanceador `lb-loja`; faixa de documentação, avisada como exemplo).
- Pool do catálogo (3 réplicas, para caber na tela; na Black Friday eram 10): `catalogo-1` **10.0.1.11**, `catalogo-2` **10.0.1.12**, `catalogo-3` **10.0.1.13**, porta **8080**.
- Clientes (elenco fixo): **Lena** (Recife) IP `177.38.20.5`; **Bia** (SP) `189.6.44.10`; **Caio** (Rio) `200.150.7.33`; **Davi** (SP) `187.11.90.2`.
- Dois tipos de pedido: `GET /produtos/42` (a página do gato) **20 ms**; `GET /busca?q=pelucia&ordem=preco` (busca pesada) **900 ms**.
- Sem balanceador: os 9 primeiros pedidos vão todos para `catalogo-1` → CPU **100%**, as outras **0%**; tempo da página do gato **20 ms → 1,8 s**.

### Healthcheck (aula 1)
- `GET /health` a cada **5 s**, timeout **1 s**; **3 falhas seguidas** tiram do pool, **2 sucessos** devolvem.
- 20:00:00 o `catalogo-2` trava. Checks falham às 20:00:05, :10, :15 → fora do pool às **20:00:15**. Nesses **15 s**, **1 de cada 3** pedidos cai nele e falha (erro 502/504). Depois, 100% dos pedidos vão para 1 e 3.
- Volta às 20:05:00; 2 checks ok (20:05:05, :10) → de volta ao pool às **20:05:10**.
- Escalar: entra o `catalogo-4` **10.0.1.14** → o balanceador passa a mandar pedidos para ele assim que o primeiro healthcheck passa.

### Proxy reverso vs load balancer (aula 2)
- **Proxy reverso 1:1**: um NGINX na frente do `pagamentos` (um só host): termina TLS, limita upload a 1 MB, esconde o IP interno, guarda cache. A Lena fala com o proxy, nunca com o `pagamentos`.
- **Load balancer 1:N**: o `lb-loja` na frente das 3 réplicas do catálogo. Os dois são **padrões**; a mesma ferramenta (Envoy, NGINX, HAProxy) faz os dois papéis.

### Algoritmos (aulas 3–7): a mesma fila de 9 pedidos
Fila (ordem de chegada): P1 Lena gato · P2 Bia busca · P3 Caio gato · P4 Davi gato · P5 Lena busca · P6 Bia gato · P7 Caio gato · P8 Davi busca · P9 Lena gato.
- **Round robin (aula 3):** 1,2,3,1,2,3,1,2,3 → P2, P5 e P8 (as 3 buscas de 900 ms) caem **todas** no `catalogo-2` (2,7 s de trabalho contra 60 ms nos outros). A conta parece justa (3 pedidos cada) e não é. Variante com quantum (o código Go do artigo: 300 ms de quantum, um pedido a cada 200 ms → cada host recebe 2 seguidos). Variante com peso (`catalogo-3` com o dobro de CPU, peso 2).
- **Least request (aula 4):** o próximo vai para quem **atendeu menos pedidos até agora** (contador). Com os 3 juntos desde o início, empata com o round robin. **E se der errado:** entra o `catalogo-4` com contador 0 enquanto os outros têm 3.000 → os próximos 3.000 pedidos vão **todos** para ele (negação de serviço involuntária) se o contador não for zerado/janelado.
- **Least connection (aula 5):** vai para quem tem **menos conexões abertas agora**. `catalogo-1` tem 5 conexões keep-alive paradas (navegadores ociosos), `catalogo-2` 3 conexões fazendo busca pesada → o LC manda para o 2, que está mais ocupado. Conexão aberta não é trabalho.
- **Least outstanding requests, LOR (aula 6):** vai para quem tem **menos pedidos em andamento** (sem resposta ainda). No mesmo instante: `catalogo-1` 0 pendentes, `catalogo-2` 3 pendentes (as buscas), `catalogo-3` 1 → o LOR escolhe o 1. É o que o ALB da AWS chama de "least outstanding requests".
- **IP hash, Maglev e Random (aula 7):**
  - IP hash: `hash(IP) % 3`. Lena `177.38.20.5` → sempre `catalogo-2` (exemplo fixo; o widget calcula com um hash simples documentado). Bom para sessão/cache local. **E se der errado:** um escritório em SP com **500 pessoas** atrás de **um IP** (NAT) → todas no mesmo host.
  - Tirar o `catalogo-3`: com `% 2` cerca de **2/3** dos clientes trocam de host (só fica quem tem `h % 6` em {0, 1}); com hashing consistente/Maglev só **1/3** muda (quem estava no 3).
  - Random: 10 pedidos com sorteio podem dar **2 / 5 / 3** (desigual com pouco tráfego); com 10.000 tende a 1/3 cada.

### Camadas 4 e 7 (aula 8) — liga com o módulo 1 (OSI)
- **L4** vê só `TCP 177.38.20.5:51514 → 203.0.113.10:443` (IP, porta). Não lê HTTP; rápido; repassa a conexão inteira para uma réplica.
- **L7** abre o pedido: `GET /produtos/42 HTTP/1.1 · Host: loja.com.br · Cookie: sessao=…` e roteia por caminho: `/produtos/*` → `catalogo`, `/carrinho/*` → `carrinho`, `/pedidos/*` → `pedidos` (os serviços do módulo 6). Para ler o HTTP precisa **terminar o TLS** (o certificado de `loja.com.br` fica no balanceador; módulo 1, aula 5).
- Custo: L7 gasta mais CPU e latência por pedido (exemplo: +1 ms); L4 quase nada (exemplo: +0,1 ms).

### Tecnologias (aula 9)
Envoy (Lyft, CNCF; L4 e L7; base de Istio, Contour, Gloo), NGINX (Igor Sysoev, 2004 público), HAProxy (Willy Tarreau, 2000), Traefik (2015, descobre containers), Ingress Controllers do Kubernetes, e os gerenciados (AWS ALB L7 / NLB L4). Conferir datas nas fontes primárias (NGINX: escrito em 2002, lançado em 2004; corrigir o artigo se preciso).

### Laboratório Envoy (aula 10)
O `envoy-patterns` do repositório: `lb-loja` (Envoy LB, porta 80, round robin) → `proxy-1/2/3` (Envoys proxy reverso, 8081–8083) → `app` (Node.js). Explicar `load-balancer.yaml` (listener, cluster, `lb_policy: ROUND_ROBIN`, endpoints, health check se houver) linha a linha com o código real; `curl http://localhost/` 6 vezes → respostas passando por proxy-1, 2, 3, 1, 2, 3. **E se der errado:** derrubar o `proxy-2` (`docker compose stop`) → sem health check ativo, 1 em 3 pedidos falha até o Envoy marcar o host (outlier detection); com health check, some do pool.

## Aulas (10): seguem a ordem dos vídeos; arquivos `aula-N-<slug>.mdx`
1 balanceadores-escalabilidade-e-healthchecks · 2 load-balancer-vs-proxy-reverso · 3 round-robin · 4 least-request · 5 least-connection · 6 least-outstanding-requests · 7 ip-hash-maglev-e-random · 8 camadas-4-e-7 · 9 tecnologias-de-mercado · 10 laboratorio-envoy (fecha com "Falta saber…": cada serviço confere login, limita abuso e mantém versões de API por conta própria; quem faz isso uma vez só, na porta? → módulo 8, API Gateways)

## Widgets 2D (Sonnet)
- Simulador de algoritmos: a fila P1–P9, botões RR / LR / LC / LOR / IP hash / Random, mostra para onde vai cada pedido e o trabalho acumulado (ms) por réplica.
- Relógio de healthcheck: intervalo, timeout e limiar ajustáveis → quantos segundos e quantos pedidos falham até o host sair (com 5 s × 3 = 15 s).
- Calculadora de remapeamento: N hosts → N−1 com módulo vs consistente (fração que muda).
- Aula 8: "L4 ou L7 vê isto?" (campos do pedido da Lena, marcar quem enxerga).

## Figuras 3D (Opus) e modes
### `balanceador-3d` (aulas 1, 3–7): o `lb-loja` e as 3 réplicas recebendo a fila P1–P9
Um balanceador na frente, 3 réplicas atrás (mais `catalogo-4` quando entra), pedidos como pacotes coloridos (gato pequeno, busca grande), barra de CPU/ms por réplica; painel com a fila e o contador por réplica.
modes: `sem` (sem balanceador: tudo no 1, CPU 100%), `health` (2 trava, 3 checks falham, sai às 20:00:15, volta às 20:05:10; entra o 4), `rr` (round robin; as 3 buscas no 2), `lr` (least request; e se der errado: catalogo-4 novo com contador 0 recebe tudo), `lc` (least connection; keep-alive parado engana), `lor` (pedidos pendentes; escolhe certo), `hash` (IP hash; NAT de 500 pessoas; tirar o 3: módulo vs consistente), `random`.
### `camadas-3d` (aulas 2, 8, 10): o que o balanceador enxerga e o lab do Envoy
O pedido da Lena como envelope em camadas (o mesmo visual do módulo 1): L4 enxerga só o envelope de fora, L7 abre e lê o HTTP; proxy 1:1 vs LB 1:N.
modes: `proxy` (NGINX 1:1 na frente do pagamentos: TLS, limite de upload, IP escondido) vs LB 1:N, `l4` (só IP:porta; repassa a conexão), `l7` (termina TLS, lê `GET /produtos/42`, roteia por caminho para catalogo/carrinho/pedidos), `lab` (Envoy LB → proxy-1/2/3 → app; 6 curls; e se der errado: proxy-2 parado).

Marcadores no MDX: `{/* FIG:balanceador mode=rr */}`, `{/* FIG:camadas mode=l7 */}` etc.

## Vocabulário fixo
"balanceador de carga" (ou "load balancer"), "proxy reverso", "réplica", "pool", "healthcheck", "fora do pool", "round robin", "least request", "least connection", "least outstanding requests (LOR)", "IP hash", "hashing consistente", "Maglev", "camada 4 (L4)", "camada 7 (L7)", "terminar TLS", "keep-alive", "pedido pendente".
