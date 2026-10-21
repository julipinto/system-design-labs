# Blueprint do módulo 14: Performance, Capacidade e Escalabilidade

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim. Brief: `docs/escrita/performance-brief.md` (versão final).

## Fio condutor do módulo
A Black Friday mostrou um catálogo que respondeu em 2 s para parte dos clientes sem que ninguém soubesse quanto a loja aguenta; o módulo ensina a medir direito (três pontos, quatro sinais, percentis), a descobrir o limite de cada elo (capacidade, joelho, gargalo) e a decidir quanto adicionar e quando (vertical, horizontal, HPA), até o gargalo parar no banco do `pedidos`.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Definindo e metrificando performance | Performance é o que quem usa sente e só vira engenharia com número, ponto de medida e meta: tempo de resposta = rede + processamento, medido em três pontos, contra p95 ≤ 300 ms; a média de 135 ms (verde) esconde os 2 s da Lena. | Que números olhar além do tempo médio? |
| 2 | Métricas de performance | Quatro sinais e percentis dizem o que a média esconde (média 135, p50 32, p95 800, p99 2.000); saturação é trabalho esperando; a média dos p99 (269) mente. | Quanto a frota aguenta no total? |
| 3 | Entendendo a capacidade em sistemas | Capacidade é o máximo com resposta aceitável (100 req/s por réplica, seguro até 70%); gargalo é demanda maior que o elo mais fraco, e escalar o elo errado (`estoque`) não muda a saída de 40/s. | Como aumentar a capacidade: máquina maior ou mais máquinas? |
| 4 | Escalabilidade vertical e horizontal | Vertical muda o tamanho (8 vCPU = 600 req/s por Amdahl) e horizontal muda o número (10 × 100 = 1.000); a queda de réplicas satura a 4 caídas e a réplica única leva 100%. | Quantas réplicas e quando adicionar? |
| 5 | Fórmula de capacity e HPA | `⌈atuais × atual ÷ desejado⌉` leva 95% a 14 réplicas; a média esconde a réplica quente e o atraso de 60 s custa 6.000 requisições. | O que continua sem resolver com réplicas? |
| 6 | Conclusão | Medir, limitar e crescer são o mesmo problema; capacidade por vCPU também é alavanca; o gargalo andou até o banco (150/s). | Qual a forma de crescer de cada gargalo? (Scale Cube, módulo 15) |

## Decisões
1. **Uma figura por aula, no máximo.** A1 `latencia mode=medir`; A2 `latencia mode=percentis` (o "Faça agora" manda apertar o botão do cenário `quente`); A3 `capacidade mode=cadeia` (a curva do joelho, que o brief liga à figura `latencia`, fica só no widget `joelho`, e o "Faça agora" avisa); A4 `capacidade mode=horizontal` (o "Faça agora" manda apertar o botão `vertical`); A5 `capacidade mode=hpa` (manda apertar `hpa-media`); A6 `capacidade mode=cadeia`. Os nomes de botão nos "Faça agora" são genéricos e o maestro os alinha.
2. **Widgets:** `percentis` (aula 2), `joelho` e `cadeia` (aula 3), `queda` com vertical × horizontal (aula 4) e `hpa` (aula 5). As aulas 1 e 6 não têm widget: a 1 tem a figura e a 6 tem a tabela dos números medidos.
3. **Analogias do artigo, uma vez cada:** o ônibus na aula 4 e o ar-condicionado (como termostato do HPA) na aula 5.
4. **Pedido 1052** do Davi: abre a aula 1 (o 504 de 2,1 s e o pedido às 20:03:30) e volta na aula 5 (o retry soma 1% ao tráfego: 6,4 req/s a 640 req/s).
5. **Correções ao artigo** ficam no Aprofundar da aula a que pertencem e na lista de `docs/fontes/performance.md`.
6. **Modelagem da cadeia no widget:** o pedido passa por `pedidos`, é gravado no banco, depois paga e baixa o estoque; o "recebe" de cada elo é o que o anterior deixou passar. O brief só dá as capacidades, então essa ordem é decisão do widget e vem avisada na nota dele.
7. **Vocabulário fixo do brief:** tempo de resposta (latência só no sentido do painel), vazão, taxa de erros, utilização, saturação, percentil, média, amostra, capacidade, gargalo, joelho da curva, folga, elo mais fraco, represamento, fila, custo por transação, escalabilidade vertical e horizontal, elasticidade, réplica quente, HPA, alvo, tolerância, N+k.
8. **Newsletter às 20:00** (fato novo do brief final): aparece na ponte da aula 1 (cliques entre 20:01 e 20:09) e como exemplo de planejamento agendado na aula 5.
