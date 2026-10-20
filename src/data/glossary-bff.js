// Glossário do módulo Backend for Frontends (BFF). Mesmo formato do módulo 1 (veja glossary.js).
const [L1, L2, L3, L4, L5, L6, L7, L8] = ['aula-1-introducao-e-responsabilidades', 'aula-2-api-composition', 'aula-3-canais-e-dispositivos',
  'aula-4-microfrontends-e-bffs', 'aula-5-versionamento-e-deployment', 'aula-6-resiliencia-e-blast-radius', 'aula-7-metricas-e-experiencia', 'aula-8-consideracoes-finais'];

export const bff = [
  { term: 'BFF', aliases: ['BFF', 'BFFs', 'Backend for Frontend', 'Backends for Frontends', 'Backend for Frontends'], short: 'Um backend feito sob medida para um frontend. Faz as chamadas que a tela precisa e devolve só o que ela usa. Na loja, o bff-app.', lesson: L1 },
  { term: 'Frontend', aliases: ['frontend', 'frontends'], short: 'A parte que o usuário vê e toca: o app, o site, o assistente de voz.', lesson: L1 },
  { term: 'Payload', aliases: ['payload', 'payloads'], short: 'O conteúdo de uma resposta, aqui o JSON. A home do app tinha 180 KB de payload sem BFF e 12 KB com ele.', lesson: L1 },
  { term: 'JWT', aliases: ['JWT'], short: 'Token assinado que diz quem é o usuário. O gateway confere e o BFF lê. Vai no cabeçalho Authorization: Bearer.', lesson: L1 },
  { term: 'Gateway', aliases: ['gateway', 'API Gateway', 'gw-loja'], short: 'Porta única da loja (api.loja.com.br): roteia, confere o JWT e limita o robô. É infraestrutura genérica; o BFF fica atrás dele.', lesson: L1 },
  { term: 'API composition', aliases: ['API composition', 'composição', 'compor', 'compõe'], short: 'Uma chamada do cliente vira várias chamadas entre serviços, feitas pelo BFF em paralelo, que junta as respostas numa só.', lesson: L2 },
  { term: 'RTT (ida e volta)', aliases: ['ida e volta', 'RTT'], short: 'O tempo de uma viagem de ida e volta pela rede. No 4G da Lena, 120 ms; no Wi-Fi, 30 ms.', lesson: L2 },
  { term: 'Chamada em paralelo', aliases: ['em paralelo', 'paralelo'], short: 'Várias chamadas saem ao mesmo tempo, e o total é o tempo da mais lenta, não a soma. No bff-app: 25 ms.', lesson: L2 },
  { term: 'Canal', aliases: ['canal', 'canais'], short: 'Um jeito de o usuário falar com a loja: app, site, voz. Cada canal tem o seu BFF.', lesson: L3 },
  { term: 'SSR', aliases: ['SSR', 'renderiza no servidor'], short: 'Server-Side Rendering: o servidor monta a página HTML pronta e o navegador só a mostra. É o que o bff-web faz.', lesson: L3 },
  { term: 'Adaptação de contrato', aliases: ['adaptação de contrato', 'adaptar'], short: 'Renomear campos, formatar dados e cortar o que sobra, para a resposta caber na tela. É trabalho de BFF.', lesson: L3 },
  { term: 'Vary', aliases: ['Vary'], short: 'Cabeçalho HTTP que diz quais cabeçalhos da requisição entram na chave do cache da resposta.', lesson: L3 },
  { term: 'Microfrontend', aliases: ['microfrontend', 'microfrontends', 'micro frontends'], short: 'Um pedaço da tela, de um time só, publicado sem esperar os outros. Cada um tem o seu BFF.', lesson: L4 },
  { term: 'Lei de Conway', aliases: ['Lei de Conway'], short: 'O sistema acaba com a forma da organização que o faz. Três times, três pedaços de tela, três BFFs.', lesson: L4 },
  { term: 'Regra de negócio', aliases: ['regra de negócio', 'regras de negócio'], short: 'O que decide o resultado, como o valor do frete. Mora no serviço que é dono dela; o BFF só compõe e adapta.', lesson: L4 },
  { term: 'Feature toggle', aliases: ['feature toggle', 'toggle', 'toggles', 'feature flag'], short: 'Chave que liga ou desliga uma função sem novo deploy. A nova_home liga a tela nova para 10%, depois 50% e 100%.', lesson: L5 },
  { term: 'Rollout gradual', aliases: ['rollout gradual', 'rollout'], short: 'Liberar uma mudança para uma fatia dos usuários e aumentar aos poucos. A mesma pessoa vê sempre a mesma versão.', lesson: L5 },
  { term: 'Canary', aliases: ['canary'], short: 'Publicar a versão nova do BFF para uma fatia pequena do tráfego antes de todos.', lesson: L5 },
  { term: 'Blue-green', aliases: ['blue-green'], short: 'Dois ambientes completos: troca-se o tráfego do antigo para o novo de uma vez e dá para voltar.', lesson: L5 },
  { term: 'Timeout', aliases: ['timeout', 'timeouts'], short: 'O prazo máximo de espera por uma chamada. O bff-app espera no máximo 100 ms pelo recomendacoes.', lesson: L6 },
  { term: 'Fallback', aliases: ['fallback', 'fallbacks'], short: 'O plano B quando uma chamada falha: a tela sai sem a seção, com "recomendado": [].', lesson: L6 },
  { term: 'Circuit breaker', aliases: ['circuit breaker', 'Circuit Breakers'], short: 'Depois de muitas falhas, para de chamar o serviço por um tempo e responde logo com o fallback, até testar de novo.', lesson: L6 },
  { term: 'Raio de explosão', aliases: ['raio de explosão', 'blast radius'], short: 'O alcance de uma falha. Se o catalogo cai, bff-app e bff-web sentem juntos.', lesson: L6 },
  { term: 'Bulkhead', aliases: ['bulkhead', 'bulkheads'], short: 'Isolar grupos de chamadas para que a falha de um grupo não leve os outros junto.', lesson: L6 },
  { term: 'p95', aliases: ['p95', 'p99'], short: '95 de cada 100 pedidos foram mais rápidos que esse tempo. Mostra o lado lento que a média esconde.', lesson: L7 },
  { term: 'Taxa de erro', aliases: ['taxa de erro', 'erros'], short: 'A fração de respostas com erro (5xx). O app mede 2% e o site 0,1%.', lesson: L7 },
  { term: 'SLO', aliases: ['SLO', 'Service Levels'], short: 'Objetivo de nível de serviço, como "p95 abaixo de 150 ms". Cada canal pode ter o seu.', lesson: L7 },
  { term: 'Service Mesh', aliases: ['Service Mesh'], short: 'Camada de rede que cuida de timeout, retry, criptografia e métrica entre os serviços, uma vez só. É o módulo 10.', lesson: L8 }
];
