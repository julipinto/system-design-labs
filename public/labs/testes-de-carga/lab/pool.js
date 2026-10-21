import http from 'k6/http';
const base = __ENV.BASE || 'http://127.0.0.1:8081';
export const options = {
  scenarios: {
    escrita: { executor: 'constant-arrival-rate', rate: 10, timeUnit: '1s', duration: '80s', preAllocatedVUs: 100, maxVUs: 400, exec: 'escrita' },
    leitura: { executor: 'constant-arrival-rate', rate: 40, timeUnit: '1s', duration: '80s', preAllocatedVUs: 100, maxVUs: 400, exec: 'leitura' },
    relatorio: { executor: 'constant-arrival-rate', rate: 10, timeUnit: '1s', startTime: '20s', duration: '30s', preAllocatedVUs: 100, maxVUs: 400, exec: 'relatorio' },
  },
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max'],
};
export function escrita() { http.post(`${base}/pedidos`, JSON.stringify({ cliente_id: 'lena-77' })); }
export function leitura() { http.get(`${base}/pedidos/1054`); }
export function relatorio() { http.post(`${base}/relatorio`, '{}'); }
