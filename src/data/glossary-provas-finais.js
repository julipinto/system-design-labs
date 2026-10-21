// Glossário do módulo Provas Finais. Mesmo formato do módulo 1 (veja glossary.js). Só termos novos do módulo
// ou de revisão (os termos de cada módulo estão no glossário dele).
const [L1, L2, L3, L4, L5, L6, L7] = ['aula-1-a-loja-de-um-servidor', 'aula-2-partir-e-ligar', 'aula-3-conversar-e-disputar',
  'aula-4-crescer-e-espalhar', 'aula-5-consistencia-e-resiliencia', 'aula-6-mudar-planejar-testar-isolar', 'aula-7-celulas-desastre-e-sinais'];

export const provasFinais = [
  { term: 'Bloco', aliases: ['bloco', 'blocos'], short: 'Um conjunto de módulos da história. São 7: 1–5, 6–10, 11–13, 14–17, 18–21, 22–25 e 26–28.', lesson: L1 },
  { term: 'Peça', aliases: ['peça', 'peças'], short: 'Um componente da loja que entrou para resolver um problema: o cache, o balanceador, o gateway, o outbox.', lesson: L1 },
  { term: 'O mapa', aliases: ['o mapa', 'mapa da loja'], short: 'A figura da loja inteira: ela acende bloco a bloco, na ordem da história, e deixa derrubar qualquer peça.', lesson: L1 },
  { term: 'Os 28 números', aliases: ['28 números', 'os 28 números'], short: 'A cola do módulo: o número que fica de cada capítulo, como 215 fatias no módulo 1 e 43,2 min no 28.', lesson: L1 },
  { term: 'Tire uma peça', aliases: ['tire uma peça'], short: 'O exercício de olhar o "e se der errado" ao contrário: o que quebra, com o número, se uma peça não existir.', lesson: L1 },
  { term: 'Você consegue?', aliases: ['Você consegue?'], short: 'A autoavaliação de 5 itens no fim de cada aula: coisas para desenhar ou calcular de memória.', lesson: L1 },
  { term: 'Prova final', aliases: ['prova final'], short: 'O quiz geral de 80 perguntas que misturam os módulos. É uma autoavaliação, sem nota oficial.', lesson: L7 },
  { term: 'Integradora', aliases: ['integradora', 'integradoras'], short: 'A pergunta que mistura vários módulos de uma vez. A prova final tem 10.', lesson: L7 },
  { term: 'Pedido 1060', aliases: ['1060'], short: 'Lena, celula-recife, 20:25:00.000: 2 gatos de 159,80 + frete de 15,00 = 174,80. Passa por 14 saltos.', lesson: L7 },
  { term: 'Raio de explosão', aliases: ['raio de explosão', 'raio'], short: 'Até onde uma falha chega. Revisto em cada bloco: o deploy (fração × tempo × custo), o bulkhead e a célula.', lesson: L6 },
  { term: 'Orçamento de erro', aliases: ['orçamento de erro'], short: 'O que sobra entre o SLO e 100%. Com 99,9% em 30 dias são 43,2 min, ou 12.960 requisições ruins.', lesson: L7 },
  { term: 'MTTD', aliases: ['MTTD'], short: 'O tempo médio até detectar a falha. É a parte do RTO que a observabilidade encurta: 30 s com sonda, 60 min sem.', lesson: L7 },
  { term: 'RTO', aliases: ['RTO'], short: 'O tempo até voltar, contado da interrupção (inclui o MTTD). Na queda de SP: 30 s + 35 s = 65 s.', lesson: L7 },
  { term: 'RPO', aliases: ['RPO'], short: 'Quanto dado se aceita perder: taxa × lag. Na celula-sp, 9,9 × 0,3 = 2,97 pedidos.', lesson: L4 },
  { term: 'Célula', aliases: ['célula', 'células'], short: 'Uma pilha inteira com o seu dado: celula-sp, celula-rio, celula-recife e celula-mkt. Uma falha fica na célula.', lesson: L7 },
];
