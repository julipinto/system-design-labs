# Conciliação dos módulos 6–9

Conferência da história entre Microsserviços (6), Load Balancers (7), API Gateways (8) e BFF (9), contra `historia-mestre.md` e os briefs. Correções pequenas, sem mexer em `src/figures/`. `npm run build` passa.

## 1. Pontes
Lidas só as primeiras frases da aula 1 e os "Falta saber…" finais, a história se conta: 5 → 6 → 7 → 8 → 9 → 10.
- **6 → 7, 7 → 8, 8 → 9, 9 → 10:** já fechavam (réplicas do catálogo → lb-loja → porta única → tela por canal → service mesh).
- **5 → 6 (corrigido):** `cache/aula-7-criando-uma-cdn.mdx` terminava puxando sharding e replicação (módulos 16–17), enquanto a aula 1 do módulo 6 abre com "um programa só". O fecho agora puxa o módulo 6: a loja continua um programa só, com três times no mesmo código.

## 2. Nomes e números
| Onde | O que mudou | Por quê |
|---|---|---|
| `api-gateways/aula-1` (flashcard), `aula-3` (passos, Deep, flashcards), `public/labs/api-gateways/quiz/questions.js` (q. da cadeia e V/F do t3) | `lb-catalogo` → `lb-loja` | O módulo 7 e o texto da própria aula 3 (ponte, gancho da aula 2) já diziam `lb-loja`; é o mesmo balanceador (203.0.113.10) na frente do catálogo. Flashcard "Quem fica atrás do gw-loja?" agora cita o `lb-loja`, não "os load balancers de cada serviço". Aula 3 ganhou "quando está na frente do catálogo". |
| `docs/escrita/api-gateways-brief.md` | idem | Brief canônico alinhado. |
| `api-gateways/aula-4` (passo 2) | Primeira vez que o 1048 aparece como criação: "o 1048 (o 1047, dela também, foi no módulo 6): 79.90 + 15.00 = 94.90, estoque do gato de 2 para 1" | Os módulos 8–9 usavam 1048 e 94.90 sem ligar ao 1047 do módulo 6 nem ao estoque. |
| `bff/aula-1` | `recomendacoes` apresentado ("serviço novo que lê o grafo do módulo 4") e o 1048 ligado ao módulo 8 | O serviço aparecia sem origem. |
| `bff/aula-3` (gancho) | "no módulo 6 ela [a tela] foi dividida entre Vitrine, Checkout e Logística" → "a loja foi dividida entre três times" | O módulo 6 dividiu times e serviços, não a tela. |
| `load-balancers/aula-1` | Frase: o pool tem 3 réplicas só para caber na tela; na Black Friday do módulo 6 eram 10 | O módulo 6 termina com 10 réplicas e o 7 mostrava 3 sem explicar. |

Conferido e sem divergência: pedido 1047 (79.90 + 15.00 = 94.90, estoque 3 → 2, módulo 6), pedido 1048 (módulos 8–9, mesmo total), times Vitrine/Checkout/Logística (6 e 9), serviços e nomes (`catalogo`, `carrinho`, `pedidos`, `pagamentos`, `estoque`, `entregas`, `pedidos-v2`, `recomendacoes`, `clientes`, `bff-*`), IPs Lena 177.38.20.5 / Bia 189.6.44.10 / Caio 200.150.7.33 / Davi 187.11.90.2 (texto, widgets, quiz, glossário do módulo 7), `lb-loja` 203.0.113.10, réplicas 10.0.1.11–13, cidades Recife/SP/Rio.

## 3. Vocabulário
Sem variantes erradas ("micro-serviço", "microserviço", "monólito"); "microservice" só aparece em títulos e URLs de fontes. "API Gateway"/"gateway", "balanceador de carga"/"load balancer" coerentes. Nada a corrigir.

## 4. Quiz e glossário
Só o quiz do módulo 8 precisou mudar (lb-loja). Glossários de 6–9 não citam o nome antigo nem os trechos editados; nenhuma mudança.

## Figura × texto (pendência para quem cuida de `src/figures/`)
- `src/figures/gateway-3d/fig3d.js` (linhas ~53, 55, 400–405, 427–428, 450–451, 599) ainda diz **`lb-catalogo`/"LB-CATALOGO"** (cadeia, painel, "o lb-catalogo não sabe de chave…"). Pela instrução da tarefa o texto foi unificado em `lb-loja`; a figura precisa ser renomeada para voltar a bater (o IP 203.0.113.10 já é o do `lb-loja`). Até lá, as aulas 1 e 3 do módulo 8 e a figura divergem só nesse nome.
- `src/figures/camadas-3d/fig3d.js` usa o IP 203.0.113.20 para o NGINX na frente do `pagamentos`; o texto da aula 2 do módulo 7 não cita esse IP (sem conflito, só informativo).

## Pendências
- Renomear `lb-catalogo` na figura `gateway-3d` (acima) e rodar `npm run build:3d` se for o caso.
- Verificação visual (390/1280 px, claro/escuro) não foi refeita: as edições são só de texto curto dentro de itens existentes.
