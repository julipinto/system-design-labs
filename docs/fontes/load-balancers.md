# Fontes: Load Balancers e Proxies Reversos

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [Load Balancers e Proxies Reversos, por Matheus Fidelis (fidelissauro.dev, sem vínculo)](https://fidelissauro.dev/load-balancing/), citada nas aulas 1 a 9. O texto está salvo em `docs/escrita/load-balancing-artigo.txt`.

**Aulas:** 1 Balanceadores, escalabilidade e healthchecks · 2 Load balancer vs proxy reverso · 3 Round robin · 4 Least request · 5 Least connection · 6 Least outstanding requests · 7 IP hash, Maglev e random · 8 Camadas 4 e 7 · 9 Tecnologias de mercado · 10 Laboratório com Envoy

Conferência feita em 2026-10-20 (curl com `-L` e `User-Agent: Mozilla/5.0`): os 21 links citados nas aulas abrem com 200. O código do laboratório (aula 10) foi lido pela API do GitHub (`gh api`), arquivo por arquivo, em `exemplos/load-balancing/envoy-patterns/`: `docker-compose.yml`, `envoy-configs/load-balancer.yaml`, `envoy-configs/reverse-proxy-1.yaml` a `-3.yaml`, `app/server.js`, `README.md`, `test-patterns.sh` e `test-weighted-quantum.sh`. **O laboratório não foi executado** (não subi os 7 containers); o texto da aula descreve o que os arquivos dizem.

**Trechos conferidos no texto das páginas:**
- NGINX, módulo upstream: "The first three octets of the client IPv4 address, or the entire IPv6 address, are used as a hashing key" (`ip_hash`, aula 7).
- NGINX, registro de mudanças: "Changes with nginx 0.1.0, 04 Oct 2004: The first public version" (aula 9).
- AWS, target groups do ALB: o algoritmo é `round_robin` (padrão), `least_outstanding_requests` ou `weighted_random` (aulas 3, 6 e 9).
- Envoy, balanceadores: `LEAST_REQUEST` escolhe N hosts aleatórios (2 por padrão) e fica com o que tem menos **pedidos ativos** (aula 4); o Maglev implementa hashing consistente com tabela de 65537 posições (aula 7).
- Envoy, slow start: aumenta aos poucos o tráfego dos endpoints **recém-adicionados**, e vale para round robin e least request (aula 10).

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Load Balancers e Proxies Reversos, Matheus Fidelis](https://fidelissauro.dev/load-balancing/) | artigo base | Base do módulo: balanceador, proxy reverso, round robin, least request, IP hash, random e tecnologias, com os códigos em Go. As aulas 1 a 9 seguem a ordem dele. | 1 a 9 | 200 |
| [Repositório público de exemplos do autor: envoy-patterns](https://github.com/msfidelis/linuxtips-curso-descomplicando-o-system-design/tree/main/exemplos/load-balancing/envoy-patterns) | outro (código público) | O laboratório da aula 10: `docker-compose.yml`, os 4 YAMLs do Envoy, o app Node.js e os dois scripts de teste. O endereço contém o nome de um curso; o texto das aulas não cita o curso nem reproduz material pago, só o código público. | 10 | 200 |
| [Envoy: tipos de balanceadores](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers) | documentação | `ROUND_ROBIN` (com pesos), `LEAST_REQUEST` (pedidos ativos, 2 hosts sorteados), `RING_HASH`, `MAGLEV`, `RANDOM`. | 2, 3, 4, 6, 7, 8, 10 | 200 |
| [Envoy: health checking ativo](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/health_checking) | documentação | Checks HTTP periódicos, limiares de falha e de sucesso e o `timeout`. | 1, 10 | 200 |
| [Envoy: outlier detection](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier) | documentação | Detecção passiva: tira do pool o host que devolve 5xx em sequência, sem perguntar `/health`. O laboratório não a configura. | 1, 10 | 200 |
| [Envoy: slow start](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/slow_start) | documentação | `slow_start_window`: o peso de um endpoint novo cresce durante a janela. Suportado em round robin e least request. | 10 | 200 |
| [Envoy: filtro local rate limit](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/local_rate_limit_filter) | documentação | Token bucket por Envoy (`max_tokens`, `tokens_per_fill`, `fill_interval`). Cada proxy conta sozinho. | 10 | 200 |
| [Envoy na CNCF](https://www.cncf.io/projects/envoy/) | outro | Datas de entrada (2017) e graduação (2018) na CNCF. | 9 | 200 |
| [NGINX: balanceamento de carga HTTP](https://nginx.org/en/docs/http/load_balancing.html) | documentação | Round robin é o padrão, com pesos; `least_conn`; `ip_hash`. | 1, 2, 3, 5 | 200 |
| [NGINX: módulo upstream](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) | documentação | `ip_hash` (três primeiros octetos do IPv4), `hash ... consistent`, `random`, `least_conn`, `health_check` (comercial). | 4, 5, 7 | 200 |
| [NGINX: registro de mudanças](https://nginx.org/en/CHANGES) | outro | 0.1.0 de 4 de outubro de 2004, "the first public version". Corrige o "2002" do artigo. | 9 | 200 |
| [HAProxy: documentação de configuração](https://docs.haproxy.org/3.0/configuration.html) | documentação | `balance roundrobin`, `leastconn` e `source`. | 3, 5, 7 | 200 |
| [Wikipédia: HAProxy](https://en.wikipedia.org/wiki/HAProxy) | outro | "Escrito em 2000 por Willy Tarreau". O site oficial não traz o ano. | 9 | 200 |
| [AWS: Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html) | documentação | ALB trabalha na camada 7. | 1, 6, 8, 9 | 200 |
| [AWS ALB: target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html) | documentação | `round_robin` (padrão), `least_outstanding_requests` e `weighted_random`. | 3, 6 | 200 |
| [AWS: Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html) | documentação | NLB trabalha na camada 4. | 8 | 200 |
| [Traefik: documentação](https://doc.traefik.io/traefik/) | documentação | Descoberta de containers e rotas dinâmicas. O ano (2015) vem do artigo e não foi confirmado em fonte primária. | 9 | 200 |
| [Maglev: a fast and reliable software network load balancer (Google, NSDI 2016)](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/) | fonte primária (paper) | O balanceador de camada 4 do Google e o hashing consistente com tabela de busca. | 7 | 200 |
| [Karger et al., 1997: consistent hashing and random trees (PDF)](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf) | fonte primária (paper) | A origem do hashing consistente: quando o número de nós muda, só uma fração das chaves se move. | 7 | 200 |
| [RFC 9110: semântica HTTP](https://www.rfc-editor.org/rfc/rfc9110) | fonte primária (RFC) | Método, caminho e `Host` como partes do pedido HTTP lidas na camada 7. | 2, 8 | 200 |
| [Scaler: round robin no escalonamento de processos](https://www.scaler.com/topics/round-robin-scheduling-in-os/) | outro | A origem do round robin e do quantum no escalonador de CPU. | 3 | 200 |

## Correções ao artigo e ao repositório (registradas nas aulas)

- **NGINX (aula 9):** o artigo diz 2002; a primeira versão pública é de 4 de outubro de 2004.
- **Least request (aula 4):** o artigo conta pedidos já atendidos; o `LEAST_REQUEST` do Envoy conta pedidos ativos (e sorteia 2 hosts).
- **Quantum (aulas 3 e 10):** o quantum é do escalonador de CPU e do exemplo em Go; as ferramentas giram por pedido, com pesos. O YAML do repositório chama `load_balancing_weight` de "quantum", e não é.
- **Uma aplicação ou três (aula 10):** o README do repositório desenha um backend; o `docker-compose.yml` sobe três (`backend-app-1` a `-3`), um por proxy.
- **Healthcheck e outlier detection (aula 10):** o `load-balancer.yaml` tem healthcheck ativo (10 s, timeout 1 s, 3 falhas para sair, 2 para voltar, até 30 s para sair do pool). A outlier detection não está configurada.
- **Portas de administração (aula 10):** o `docker-compose.yml` publica `9902:9902` para o `reverse-proxy-2`, mas o `reverse-proxy-2.yaml` deixa a administração na 9901; o healthcheck do Docker desse container falha.
- **`test-patterns.sh` (aula 10):** lê `x-proxy-server` no corpo JSON, mas o cabeçalho é da resposta; use `curl -sI`. O `test-weighted-quantum.sh` espera pesos 5/3/2, e o YAML tem 1/1/1.
- **Hash de exemplo do IP hash (aula 7):** texto, figura e widget usam o mesmo: `octeto3 × 256 + octeto4` (Lena: 5.125, e 5.125 % 3 = 1, `catalogo-2`).
