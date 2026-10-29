// Glossary for the Backend for Frontends (BFF) module (English). Same format as the Portuguese file.
const [L1, L2, L3, L4, L5, L6, L7, L8] = ['aula-1-introducao-e-responsabilidades', 'aula-2-api-composition', 'aula-3-canais-e-dispositivos',
  'aula-4-microfrontends-e-bffs', 'aula-5-versionamento-e-deployment', 'aula-6-resiliencia-e-blast-radius', 'aula-7-metricas-e-experiencia', 'aula-8-consideracoes-finais'];

export const terms = [
  { term: 'BFF', aliases: ['BFF', 'Backend for Frontend'], short: 'A backend tailored to one frontend. It makes the calls the screen needs and returns only what the screen uses. In the store, the bff-app.', lesson: L1 },
  { term: 'Frontend', aliases: ['frontend', 'frontends'], short: 'The part the user sees and touches: the app, the website, the voice assistant.', lesson: L1 },
  { term: 'Payload', aliases: ['Payload'], short: 'The content of a response, here the JSON. The app home had 180 KB of payload without a BFF and 12 KB with it.', lesson: L1 },
  { term: 'JWT', aliases: ['JWT'], short: 'A signed token that says who the user is. The gateway checks it and the BFF reads it. It goes in the Authorization: Bearer header.', lesson: L1 },
  { term: 'Gateway', aliases: ['gateway', 'API Gateway', 'gw-loja'], short: 'The store\'s single front door (api.loja.com.br): it routes, checks the JWT and limits the bot. It is generic infrastructure; the BFF sits behind it.', lesson: L1 },
  { term: 'API composition', aliases: ['API composition', 'composition', 'compose', 'composes'], short: 'One client call becomes several service-to-service calls, made by the BFF in parallel, which joins the responses into one.', lesson: L2 },
  { term: 'RTT (round trip)', aliases: ['round trip'], short: 'The time of one round trip over the network. On Lena\'s 4G, 120 ms; on Wi-Fi, 30 ms.', lesson: L2 },
  { term: 'Parallel calls', aliases: ['in parallel', 'parallel'], short: 'Several calls leave at the same time, and the total is the time of the slowest one, not the sum. In the bff-app: 25 ms.', lesson: L2 },
  { term: 'Channel', aliases: ['channel', 'channels'], short: 'A way for the user to talk to the store: app, website, voice. Each channel has its own BFF.', lesson: L3 },
  { term: 'SSR', aliases: ['SSR', 'renders the page on the server'], short: 'Server-Side Rendering: the server builds the ready HTML page and the browser just shows it. It is what the bff-web does.', lesson: L3 },
  { term: 'Contract adaptation', aliases: ['Contract adaptation'], short: 'Renaming fields, formatting data and cutting the extras so the response fits the screen. It is BFF work.', lesson: L3 },
  { term: 'Vary', aliases: ['Vary'], short: 'An HTTP header that says which request headers go into the response\'s cache key.', lesson: L3 },
  { term: 'Microfrontend', aliases: ['microfrontend', 'microfrontends', 'micro frontends'], short: 'A piece of the screen, owned by one team, published without waiting for the others. Each one has its own BFF.', lesson: L4 },
  { term: 'Conway\'s Law', aliases: ['Conway\'s Law'], short: 'The system ends up with the shape of the organization that builds it. Three teams, three screen pieces, three BFFs.', lesson: L4 },
  { term: 'Business rule', aliases: ['business rule', 'business rules'], short: 'What decides the result, like the shipping cost. It lives in the service that owns it; the BFF only composes and adapts.', lesson: L4 },
  { term: 'Feature toggle', aliases: ['feature toggle', 'toggle', 'toggles'], short: 'A switch that turns a feature on or off without a new deploy. The nova_home turns the new screen on for 10%, then 50% and 100%.', lesson: L5 },
  { term: 'Gradual rollout', aliases: ['gradual rollout', 'rollout'], short: 'Releasing a change to a slice of users and increasing it little by little. The same person always sees the same version.', lesson: L5 },
  { term: 'Canary', aliases: ['canary'], short: 'Publishing the new BFF version to a small slice of traffic before everyone.', lesson: L5 },
  { term: 'Blue-green', aliases: ['blue-green'], short: 'Two complete environments: traffic is switched from the old to the new at once, and you can go back.', lesson: L5 },
  { term: 'Timeout', aliases: ['timeout'], short: 'The maximum wait for a call. The bff-app waits at most 100 ms for the recomendacoes.', lesson: L6 },
  { term: 'Fallback', aliases: ['fallback'], short: 'Plan B when a call fails: the screen ships without the section, with "recomendado": [].', lesson: L6 },
  { term: 'Circuit breaker', aliases: ['circuit breaker', 'circuit'], short: 'After many failures, it stops calling the service for a while and answers right away with the fallback, until it tests again.', lesson: L6 },
  { term: 'Blast radius', aliases: ['blast radius'], short: 'How far a failure reaches. If the catalogo goes down, bff-app and bff-web feel it together.', lesson: L6 },
  { term: 'Bulkhead', aliases: ['bulkhead'], short: 'Isolating groups of calls so that a failure in one group doesn\'t take the others down with it.', lesson: L6 },
  { term: 'p95', aliases: ['p95', 'p99'], short: '95 out of every 100 requests were faster than that time. It shows the slow side that the average hides.', lesson: L7 },
  { term: 'Error rate', aliases: ['error rate', 'errors'], short: 'The fraction of responses with an error (5xx). The app measures 2% and the website 0.1%.', lesson: L7 },
  { term: 'SLO', aliases: ['SLO'], short: 'A service level objective, like "p95 below 150 ms". Each channel can have its own.', lesson: L7 },
  { term: 'Service Mesh', aliases: ['Service Mesh'], short: 'A network layer that handles timeout, retry, encryption and metrics between services, once. It is module 10.', lesson: L8 }
];
