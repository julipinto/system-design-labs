// Monta links internos respeitando o `base` do astro.config.mjs (/system-design-labs).
//   withBase('labs/protocolos-de-rede/') -> '/system-design-labs/labs/protocolos-de-rede/'
export function withBase(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return base + '/' + String(path).replace(/^\/+/, '');
}
