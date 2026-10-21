// Pool de 20 conexões ao banco do `pedidos` (modelo). Cada requisição segura 1 conexão pelo tempo que o banco leva:
// POST /pedidos (checkout) ~20 ms; GET /pedidos/1054 ("meus pedidos") ~5 ms; POST /relatorio (o relatório das 23:00) ~4 s.
// MODE=shared: 1 pool de POOL conexões para tudo. MODE=bulkhead: POOL_INT (checkout + meus pedidos) e POOL_BATCH (relatório).
// Pool cheio => 503 na hora (sem fila), como um semáforo de bulkhead.
const http = require('http');
const MODE = process.env.MODE || 'shared';
const POOL = Number(process.env.POOL || 20), POOL_INT = Number(process.env.POOL_INT || 16), POOL_BATCH = Number(process.env.POOL_BATCH || 4);
const W_POST = Number(process.env.W_POST || 20), W_GET = Number(process.env.W_GET || 5), W_BATCH = Number(process.env.W_BATCH || 4000);
const exp = (m) => -Math.log(1 - Math.random()) * m;
const shared = { n: POOL, busy: 0 }, inter = { n: POOL_INT, busy: 0 }, batch = { n: POOL_BATCH, busy: 0 };
const poolDe = (tipo) => (MODE === 'shared' ? shared : tipo === 'batch' ? batch : inter);
http.createServer((rq, rs) => {
  const tipo = rq.url.startsWith('/relatorio') ? 'batch' : rq.method === 'POST' ? 'post' : 'get';
  rq.resume();
  rq.on('end', () => {
    const pool = poolDe(tipo);
    if (pool.busy >= pool.n) { rs.statusCode = 503; rs.end('{"erro":"pool cheio"}'); return; }
    pool.busy++;
    const w = exp(tipo === 'batch' ? W_BATCH : tipo === 'post' ? W_POST : W_GET);
    setTimeout(() => { pool.busy--; rs.statusCode = tipo === 'post' ? 201 : 200; rs.end('{"ok":true}'); }, w);
  });
}).listen(Number(process.env.PORT || 8081), '127.0.0.1', () => console.log('loja-pool', MODE, 'em', process.env.PORT || 8081));
