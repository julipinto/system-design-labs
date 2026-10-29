// Queue simulator of the store checkout (M/M/1 model per pod). It is not the store: it is a model.
// Each pod is a single-server FIFO queue; service time is exponential with the stage mean.
// POST /pedidos -> pedidos -> pagamentos -> estoque -> DB (shard by murmur3(cliente_id) mod N). Total deadline: 2 s (lb-loja timeout).
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
