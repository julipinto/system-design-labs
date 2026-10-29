// Glossary for the Final Exams module (English). Same format as the Portuguese file. Only terms new to the module
// or for review (the terms of each module are in that module's glossary).
const [L1, L2, L3, L4, L5, L6, L7] = ['aula-1-a-loja-de-um-servidor', 'aula-2-partir-e-ligar', 'aula-3-conversar-e-disputar',
  'aula-4-crescer-e-espalhar', 'aula-5-consistencia-e-resiliencia', 'aula-6-mudar-planejar-testar-isolar', 'aula-7-celulas-desastre-e-sinais'];

export const terms = [
  { term: 'Block', aliases: ['block', 'blocks'], short: 'A set of modules of the story. There are 7: 1–5, 6–10, 11–13, 14–17, 18–21, 22–25 and 26–28.', lesson: L1 },
  { term: 'Piece', aliases: ['piece', 'pieces'], short: 'A component of the store that came in to solve a problem: the cache, the balancer, the gateway, the outbox.', lesson: L1 },
  { term: 'The map', aliases: ['the map', 'store map'], short: 'The figure of the whole store: it lights up block by block, in the order of the story, and lets you take down any piece.', lesson: L1 },
  { term: 'The 28 numbers', aliases: ['28 numbers', 'the 28 numbers'], short: "The module's cheat sheet: the number that stays from each chapter, like 215 slices in module 1 and 43.2 min in 28.", lesson: L1 },
  { term: 'Take a piece out', aliases: ['take a piece out', 'Take a piece out'], short: 'The exercise of looking at "if it goes wrong" backwards: what breaks, with the number, if a piece does not exist.', lesson: L1 },
  { term: 'Can you do it?', aliases: ['Can you do it?'], short: 'The 5-item self-assessment at the end of each lesson: things to draw or calculate from memory.', lesson: L1 },
  { term: 'Final exam', aliases: ['final exam'], short: 'The general quiz of 80 questions that mix the modules. It is a self-assessment, with no official score.', lesson: L7 },
  { term: 'Integrative', aliases: ['integrative'], short: 'A question that mixes several modules at once. The final exam has 10.', lesson: L7 },
  { term: 'Order 1060', aliases: ['1060'], short: 'Lena, celula-recife, 20:25:00.000: 2 cats at 159.80 + shipping of 15.00 = 174.80. It goes through 14 hops.', lesson: L7 },
  { term: 'Blast radius', aliases: ['blast radius', 'radius'], short: 'How far a failure reaches. Reviewed in every block: the deploy (fraction × time × cost), the bulkhead and the cell.', lesson: L6 },
  { term: 'Error budget', aliases: ['error budget'], short: 'What is left between the SLO and 100%. With 99.9% over 30 days that is 43.2 min, or 12,960 bad requests.', lesson: L7 },
  { term: 'MTTD', aliases: ['MTTD'], short: 'The mean time to detect the failure. It is the part of the RTO that observability shortens: 30 s with a probe, 60 min without.', lesson: L7 },
  { term: 'RTO', aliases: ['RTO'], short: 'The time until it is back, counted from the interruption (it includes the MTTD). On the SP outage: 30 s + 35 s = 65 s.', lesson: L7 },
  { term: 'RPO', aliases: ['RPO'], short: 'How much data you accept losing: rate × lag. On celula-sp, 9.9 × 0.3 = 2.97 orders.', lesson: L4 },
  { term: 'Cell', aliases: ['cell', 'cells'], short: 'A whole stack with its own data: celula-sp, celula-rio, celula-recife and celula-mkt. A failure stays inside the cell.', lesson: L7 },
];
