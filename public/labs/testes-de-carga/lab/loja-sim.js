// Simulador de filas do checkout da loja (modelo M/M/1 por pod). Não é a loja: é um modelo.
// Cada pod é uma fila FIFO de um servidor; o tempo de serviço é exponencial com a média do estágio.
// POST /pedidos -> pedidos -> pagamentos -> estoque -> banco (shard por murmur3(cliente_id) mod N). Prazo total: 2 s (timeout do lb-loja).
const http = require('http');
const { murmur3 } = require('./murmur3');
const cfg = JSON.parse(process.env.CFG);
const TIMEOUT_MS = cfg.timeout_ms || 2000;
const mk = (n) => Array.from({ length: n }, () => ({ busy: false, q: [] }));
const stages = cfg.stages.map((s) => ({ ...s, pods: mk(s.pods), rr: 0 }));
const shards = cfg.shards.map((s) => ({ ms: s.ms, pod: { busy: false, q: [] }, rr: 0 }));
const exp = (mean) => -Math.log(1 - Math.random()) * mean;
function pump(ms, pod) {
  if (pod.busy) return;
  while (pod.q.length) {
    const it = pod.q.shift();
    if (it.req.dead) continue;
    pod.busy = true;
    setTimeout(() => { pod.busy = false; it.next(); pump(ms, pod); }, exp(ms));
    return;
  }
}
function submit(ms, pod, req, next) { pod.q.push({ req, next }); pump(ms, pod); }
let served = 0, timedOut = 0;
http.createServer((rq, rs) => {
  if (rq.url === '/stats') { rs.end(JSON.stringify({ served, timedOut })); return; }
  let body = '';
  rq.on('data', (d) => (body += d));
  rq.on('end', () => {
    let cliente = 'c-0';
    try { cliente = JSON.parse(body).cliente_id || cliente; } catch (e) {}
    const req = { dead: false, done: false };
    const timer = setTimeout(() => { if (req.done) return; req.dead = true; timedOut++; rs.statusCode = 504; rs.end('{"erro":"timeout"}'); }, TIMEOUT_MS);
    const path = stages.map((s) => ({ ms: s.ms, pod: s.pods[s.rr++ % s.pods.length] }));
    const ded = (cfg.dedicado || {})[cliente];
    const sh = ded !== undefined ? ded : murmur3(cliente) % (cfg.mod || shards.length);
    path.push({ ms: shards[sh].ms, pod: shards[sh].pod });
    let i = 0;
    const step = () => {
      if (req.dead) return;
      if (i === path.length) { req.done = true; clearTimeout(timer); served++; rs.statusCode = 201; rs.end('{"ok":true,"shard":' + sh + '}'); return; }
      const p = path[i++]; submit(p.ms, p.pod, req, step);
    };
    step();
  });
}).listen(cfg.port || 8080, '127.0.0.1', () => console.log('loja-sim em', cfg.port || 8080));
