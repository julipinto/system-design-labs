---
type: blueprint
module: load-balancers
version: 1
---
# Blueprint: módulo 7, Load Balancers e Proxies Reversos

Aprovado pelo próprio agente, seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois). Dados canônicos: `docs/escrita/load-balancers-brief.md`.

## Fio condutor (1 frase)
Quando o catálogo ganha réplicas, alguém precisa ficar na porta e escolher uma para cada pedido; cada regra de escolha (girar, contar pedidos, contar conexões, contar pendentes, calcular pelo IP) enxerga um pedaço diferente da carga, e por isso uma delas sempre erra onde a outra acerta.

## Exemplo e personagens canônicos
- `loja.com.br` → **203.0.113.10** (o `lb-loja`, faixa de documentação). Pool do `catalogo`: `catalogo-1` 10.0.1.11, `-2` 10.0.1.12, `-3` 10.0.1.13, `-4` 10.0.1.14 (quando entra), porta 8080.
- Elenco: **Lena** (Recife, `177.38.20.5`), **Bia** (SP, `189.6.44.10`), **Caio** (Rio, `200.150.7.33`), **Davi** (SP, `187.11.90.2`).
- Pedidos: gato `GET /produtos/42` **20 ms**; busca `GET /busca?q=pelucia&ordem=preco` **900 ms**. Fila: P1 Lena gato · P2 Bia busca · P3 Caio gato · P4 Davi gato · P5 Lena busca · P6 Bia gato · P7 Caio gato · P8 Davi busca · P9 Lena gato, um pedido a cada 100 ms.
- Sem balanceador: 9 pedidos no `catalogo-1`, CPU 100% contra 0%, gato de 20 ms para 1,8 s.
- Healthcheck: `GET /health` a cada 5 s, timeout 1 s, 3 falhas saem, 2 sucessos voltam. Trava 20:00:00, sai 20:00:15 (1 de 3 pedidos falha), volta 20:05:00, no pool 20:05:10.
- Hash de exemplo (figura, widget e texto): `octeto3 × 256 + octeto4`; Lena 5.125 → `catalogo-2`, Bia 11.274 → `-1`, Caio 1.825 → `-2`, Davi 23.042 → `-3`.
- Vocabulário fixo: "balanceador de carga", "proxy reverso", "réplica", "pool", "healthcheck", "fora do pool", "round robin", "least request", "least connection", "LOR", "IP hash", "hashing consistente", "Maglev", "camada 4 (L4)", "camada 7 (L7)", "terminar TLS", "keep-alive", "pedido pendente".

## Aulas: tese e pergunta que fica para a próxima

| # | Tese (1 frase) | Gancho ("Falta saber…") |
|---|---|---|
| 1 | Um balanceador recebe tudo num endereço só e o healthcheck tira do pool quem parou: sem ele, uma réplica satura e as outras ficam paradas. | O `lb-loja` parece o NGINX na frente do `pagamentos`: são a mesma coisa, ou a diferença é quantos servidores existem atrás? |
| 2 | Proxy reverso (1:1) e load balancer (1:N) são padrões, não produtos; a mesma ferramenta faz os dois. | Como o `lb-loja` escolhe entre três réplicas? O jeito mais simples é um depois do outro. |
| 3 | Round robin é justo na contagem e cego no trabalho: as 3 buscas caem na `catalogo-2` (2,7 s contra 60 ms). | E se o balanceador mandasse o próximo pedido para quem atendeu menos até agora? |
| 4 | Least request com contador olha o passado: com a fila de 9 empata com o round robin, e quando entra a `catalogo-4` com contador 0 ela recebe tudo. | E se, em vez do passado, olhasse as conexões abertas agora? |
| 5 | Least connection olha o presente, mas conexão aberta não é trabalho: o keep-alive parado faz a mais ocupada parecer a mais livre (5 · 3 · 4). | Como contar o que interessa: os pedidos que entraram e ainda não voltaram? |
| 6 | LOR conta pedidos pendentes (0 · 3 · 1) e escolhe certo; erra para quem responde erro rápido, então precisa de healthcheck ao lado. | Como fazer o balanceador lembrar quem é quem sem uma tabela de clientes? |
| 7 | IP hash calcula a réplica pelo IP (sessão e cache local); falha com NAT e quando o pool muda, e o hashing consistente (Maglev) limita a troca a 1/3. | O que o balanceador vê quando olha só IP e porta, e o que muda quando abre o pedido? |
| 8 | L4 repassa a conexão sem abrir o envelope; L7 termina o TLS, lê o caminho e roteia, ao custo de CPU e latência. | Que ferramentas fazem isso e quando cada uma nasceu? |
| 9 | Envoy, NGINX, HAProxy, Traefik, Ingress e gerenciados fazem as mesmas coisas com pesos diferentes. | Como um Envoy de verdade escreve isso em YAML e o que acontece quando um servidor cai? |
| 10 | O laboratório `envoy-patterns` é o módulo em YAML: listener, cluster, round robin, healthcheck e proxies 1:1; a queda de um proxy custa até 30 s de 1 pedido em 3. | Cada serviço confere login, limita abuso e mantém versões de API por conta própria: dá para fazer isso uma só vez, na porta? (módulo 8, API Gateways) |

## Decisões de estrutura
- Cada aula: ponte, "Em uma frase", "Faça agora", figura (`{/* FIG:... */}`, no máximo uma), "Como funciona" em ordem de acontecimento, widget, "Por que importa", "Aprofundar" (com as correções ao artigo), gancho, flashcards.
- Figuras: `balanceador-3d` nas aulas 1 (mode=sem), 3 (rr), 4 (lr), 5 (lc), 6 (lor), 7 (hash); `camadas-3d` nas aulas 2 (proxy), 8 (l4) e 10 (lab). A aula 9 não tem figura. Os modos `health`, `random` e `l7` ficam para troca no painel da figura, citados nos "Faça agora".
- Widgets: `health` (aula 1), `sim-rr` (3), `sim-lr` (4), `sim-lc` (5), `sim-lor` (6), `sim-hash` e `remap` (7), `camadas` (8). Todos com os dados do brief; o simulador usa um pedido a cada 100 ms, o que reproduz os 940 ms por réplica do LOR da aula 6.
- Correções registradas no Aprofundar: NGINX 2004 (não 2002), `LEAST_REQUEST` do Envoy conta ativos, quantum ≠ peso, quatro divergências do repositório do laboratório (uma ou três apps, healthcheck existe, porta 9902, script lê o corpo).
