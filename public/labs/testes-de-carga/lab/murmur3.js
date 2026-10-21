// murmur3 32 bits (x86_32), seed 0, sobre bytes UTF-8 (a função canônica do módulo 16)
function murmur3(str, seed = 0) {
  const data = Buffer.from(str, 'utf8');
  const len = data.length, nblocks = len >> 2;
  let h1 = seed >>> 0;
  const c1 = 0xcc9e2d51, c2 = 0x1b873593;
  for (let i = 0; i < nblocks; i++) {
    let k1 = data.readUInt32LE(i * 4);
    k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2);
    h1 ^= k1; h1 = (h1 << 13) | (h1 >>> 19); h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }
  let k1 = 0; const tail = nblocks * 4;
  switch (len & 3) {
    case 3: k1 ^= data[tail + 2] << 16;
    case 2: k1 ^= data[tail + 1] << 8;
    case 1: k1 ^= data[tail];
      k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2); h1 ^= k1;
  }
  h1 ^= len;
  h1 ^= h1 >>> 16; h1 = Math.imul(h1, 0x85ebca6b); h1 ^= h1 >>> 13; h1 = Math.imul(h1, 0xc2b2ae35); h1 ^= h1 >>> 16;
  return h1 >>> 0;
}
module.exports = { murmur3 };
if (require.main === module) {
  const t = [['', 0], ['hello', 0x248bfa47], ['The quick brown fox jumps over the lazy dog', 0x2e4ff723]];
  for (const [s, e] of t) console.log(JSON.stringify(s), murmur3(s).toString(16), murmur3(s) === e ? 'OK' : 'ERRO');
  console.log('seed1 vazio', murmur3('', 1).toString(16), murmur3('', 1) === 0x514e28b7 ? 'OK' : 'ERRO');
  for (const c of ['lena-77', 'bia-31', 'caio-58', 'davi-12', 'mkt-01']) { const h = murmur3(c); console.log(c, '0x' + h.toString(16).padStart(8, '0'), 'mod3', h % 3, 'mod4', h % 4); }
}
