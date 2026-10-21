# Blueprint do módulo 19: Saga Pattern

Fase Architect (writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md; o agente aprova o próprio blueprint. Brief: `docs/escrita/saga-brief.md`.

## Fio condutor
Uma operação que atravessa serviços sem transação distribuída termina inteira ou é desfeita por compensações: o módulo mostra quem coordena, onde mora o estado, como desfazer, registrar e não perder, até o laboratório do autor lido com o pedido 1057 do Davi.

## Tese de cada aula e a pergunta que deixa

| # | Aula | Tese | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução e motivações | A Saga faz a operação terminar inteira ou ser desfeita (1057: 44,95 s; sem saga, pago e sem estoque). | Por que um ROLLBACK não resolve? |
| 2 | Transações longas e distribuídas | A ACID não atravessa bancos e a espera de 41,2 s impede trava; o 2PC bloqueia e não fala com o PSP. | O que fazer com os passos já feitos? |
| 3 | A proposta arquitetural | Passos locais e compensações em ordem inversa; compensação é transação nova; sem isolamento. | Quem decide o próximo passo? |
| 4 | Saga coreografado | Ninguém manda: 4 e 5 eventos; o fluxo não está em lugar nenhum. | E se um lugar soubesse o mapa? |
| 5 | Saga orquestrado | O orquestrador guarda o mapa: 6 e 8 mensagens; custo de ser ponto central. | Que estrutura guarda o "estou aqui"? |
| 6 | State machines | Estado + evento decidem; transição condicional ignora duplicata (`f`); vigia. | Como desfazer na ordem certa? |
| 7 | Fluxos de compensação | Desfazer idempotente e repetível em ordem inversa; 31 s de backoff e INTERVENCAO. | Onde fica a memória? |
| 8 | Logs de saga | Log de só-acréscimo: rastreio, retomada, auditoria; 1,6 bilhão de linhas. | Como gravar e mandar sem perder um? |
| 9 | Dual write | Duas escritas não atômicas; outbox e comando idempotente. | Como fica tudo junto? |
| 10 | Exemplo de sistema de pedidos | O laboratório lido; 85,5%; duas ordens (44,95 s × 100 ms; 3.600 presas). | E se o estado fosse só a lista de eventos? (módulo 20) |

## Decisões
1. **Uma figura por aula.** A1 `saga sem-saga`; A2 `saga sem-saga`; A3 `saga state-machine`; A4 `saga coreografado`; A5 `saga orquestrado`; A6 `compensacao log` (o brief citava também `saga state-machine`: o "Faça agora" remete ao diagrama da aula 3); A7 `compensacao estorno-falha`; A8 `compensacao log`; A9 `compensacao dual-write`; A10 `compensacao lab` (o "Faça agora" manda apertar o botão da `reserva-antes`).
2. **Widgets:** `simulador` (A3), `coreo-orq` (A5), `maquina` e `vigia` (A6), `compensacao` (A7), `probabilidades` e `reserva-presa` (A10).
3. **Código real** em `src/lab-code/saga/` (`orquestrador-main.go`, `estoque-main.go`) via `CodeLab`, imports juntos no topo.
4. **Ordem da falha de entrega** na A7 usa a ordem do laboratório (estornar, liberar, cancelar); na ordem da loja o simulador mostra liberar antes de estornar.
5. **Números derivados** (não no brief): 30 × 41,2 = 1.236 transações abertas (A2); 326,6 GB na conta de 200 B por linha (A8, o brief diz ~300 GB); 1,9 estornos na ordem da loja com os 5% de pagamento antes (o brief diz 2,0; as duas contas aparecem na A10 e no widget).
6. **Observação extra de leitura:** `CANCEL_PAYMENT` não sai na falha do pagamento (A10).
7. **Vocabulário fixo do brief:** compensação (nunca "rollback distribuído"), estorno, orquestrador, coreografia, comando e resposta, transição condicional, vigia, intervenção.
