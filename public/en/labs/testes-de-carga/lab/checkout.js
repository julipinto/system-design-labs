import http from 'k6/http';
import { check } from 'k6';

// TIPO picks the load profile; TOPO is the final rate (orders/s) of the breakpoint
const TIPO = __ENV.TIPO || 'smoke';
const TOPO = Number(__ENV.TOPO || 60);
const base = __ENV.BASE || 'http://127.0.0.1:8080';

const perfis = {
  smoke: { executor: 'constant-arrival-rate', rate: 2, timeUnit: '1s', duration: '30s', preAllocatedVUs: 5, maxVUs: 20 },
  media: { executor: 'constant-arrival-rate', rate: Number(__ENV.RATE || 30), timeUnit: '1s', duration: '2m', preAllocatedVUs: 50, maxVUs: 300 },
  spike: { executor: 'ramping-arrival-rate', startRate: 5, timeUnit: '1s', preAllocatedVUs: 100, maxVUs: 600,
           stages: [{ target: 5, duration: '30s' }, { target: Number(__ENV.RATE || 60), duration: '10s' }, { target: Number(__ENV.RATE || 60), duration: '60s' }, { target: 5, duration: '10s' }, { target: 5, duration: '90s' }] },
  estresse: { executor: 'ramping-arrival-rate', startRate: 100, timeUnit: '1s', preAllocatedVUs: 200, maxVUs: 1500,
              stages: [{ target: 100, duration: '30s' }, { target: 200, duration: '20s' }, { target: 200, duration: '45s' }, { target: 250, duration: '20s' }, { target: 250, duration: '45s' }, { target: 300, duration: '20s' }, { target: 300, duration: '45s' }, { target: 100, duration: '20s' }, { target: 100, duration: '60s' }] },
  fechado: { executor: 'constant-vus', vus: Number(__ENV.VUS || 20), duration: '60s' },
  breakpoint: { executor: 'ramping-arrival-rate', startRate: 1, timeUnit: '1s', preAllocatedVUs: 100, maxVUs: 1000,
                stages: [{ target: TOPO, duration: __ENV.DUR || '3m' }] },
};

export const options = {
  scenarios: { [TIPO]: perfis[TIPO] },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.001', abortOnFail: TIPO === 'breakpoint' && __ENV.ABORT !== '0', delayAbortEval: '10s' }],
    http_req_duration: [{ threshold: 'p(95)<800', abortOnFail: TIPO === 'breakpoint' && __ENV.ABORT !== '0', delayAbortEval: '10s' }],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const normais = 1500000;
export default function () {
  // 40% of the orders come from partner mkt-01; the rest, from scattered customers (the constant from module 16)
  const cliente = Math.random() < 0.4 ? 'mkt-01' : `c-${Math.floor(Math.random() * normais)}`;
  const res = http.post(`${base}/pedidos`, JSON.stringify({ cliente_id: cliente, itens: [{ produto: 7, qtd: 1 }] }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'status 201': (r) => r.status === 201 });
}
