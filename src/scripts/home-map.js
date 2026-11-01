/* ---------- home como mapa da história: trilha vertical, uma estação por módulo, o pacote onde a pessoa parou ----------
   Lê o progresso que o modo foco grava (sdl-<módulo>:done). Estação cheia = módulo completo; contorno sódio = em andamento.
   Ao abrir a home, o pacote desce pela trilha até o módulo em andamento (ou o primeiro que falta), com mola. */
import { animate } from 'motion';

const list = document.querySelector('.mods');
if (list) {
  const EN = /^en/.test(document.documentElement.lang);
  const mods = Array.from(list.querySelectorAll('.mod[data-mod]'));
  // aulas de cada capítulo ([id, título, min]), postas pela home no build
  let data = {};
  try { JSON.parse(document.getElementById('chapters-data').textContent).forEach((c) => { data[c.s] = c; }); } catch (e) { /* sem dados: só o mapa */ }
  const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const doneOf = (slug) => { try { return new Set(JSON.parse(read('sdl-' + slug + ':done') || '[]') || []); } catch (e) { return new Set(); } };
  let firstGoing = null, lastDone = -1, any = false;
  mods.forEach((li, i) => {
    const total = +li.dataset.total, ch = data[li.dataset.mod], dn = doneOf(li.dataset.mod);
    let n = ch ? ch.l.filter((l) => dn.has(l[0])).length : dn.size;
    n = Math.min(n, total); if (n) any = true;
    if (n >= total) { li.classList.add('done'); lastDone = i; }
    else if (n > 0) { li.classList.add('going'); if (!firstGoing) firstGoing = li; }
    if (!n) return;
    const box = li.querySelector('.mod-prog'), bar = li.querySelector('.mod-bar');
    for (let k = 0; k < total; k++) { const s = document.createElement('i'); if (k < n) s.className = 'done'; bar.appendChild(s); }
    // o que falta, em aulas e minutos (parece mais perto do que "7 de 9")
    const left = total - n, mins = ch ? ch.l.filter((l) => !dn.has(l[0])).reduce((a, l) => a + l[2], 0) : 0;
    li.querySelector('.mod-prog-t').textContent = !left ? (EN ? 'Complete' : 'Completo')
      : EN ? (left === 1 ? '1 lesson left' : left + ' lessons left') + (mins ? ' · ~' + mins + ' min' : '')
      : (left === 1 ? 'falta 1 aula' : 'faltam ' + left + ' aulas') + (mins ? ' · ~' + mins + ' min' : '');
    box.hidden = false;
  });
  const here = firstGoing || mods[lastDone + 1] || mods[0];
  here.classList.add('here');

  // "o que eu faço agora?": com progresso, o botão do topo vai para a aula de onde a pessoa parou nesse capítulo
  // (a aberta por último, se não foi entendida; senão a primeira que falta). Tudo completo: o botão sai.
  const next = document.querySelector('[data-home-next]'), hc = data[here.dataset.mod];
  if (next && any && hc) {
    if (mods.every((li) => li.classList.contains('done'))) next.hidden = true;
    else {
      const dn = doneOf(hc.s), cur = read('sdl-' + hc.s + ':cur');
      let k = hc.l.findIndex((l) => l[0] === cur && !dn.has(l[0]));
      if (k < 0) k = Math.max(0, hc.l.findIndex((l) => !dn.has(l[0])));
      const L = hc.l[k];
      next.href = next.href.replace(/labs\/[^/]+\/#.*$/, 'labs/' + hc.s + '/#' + L[0]);
      next.querySelector('.home-next-k').textContent = EN ? 'Pick up where you left off' : 'Continuar de onde parou';
      next.querySelector('.home-next-t').textContent = hc.t;
      next.querySelector('.home-next-l').textContent = (EN ? 'Lesson ' : 'Aula ') + (k + 1) + ': ' + L[1];
      next.querySelector('.home-next-m').textContent = '~' + L[2] + ' min';
    }
  }

  const lit = document.createElement('span'); lit.className = 'map-lit'; lit.setAttribute('aria-hidden', 'true');
  const pkt = document.createElement('span'); pkt.className = 'map-pkt'; pkt.setAttribute('aria-hidden', 'true');
  list.append(lit, pkt);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // centro da estação do módulo, medido no ::before do link (o CSS define o top da estação)
  const yOf = (li) => { const a = li.querySelector('.mod-link'); return a.offsetTop + parseFloat(getComputedStyle(a, '::before').top) + 6; };   // o link é posicionado: offsetTop já é relativo à lista
  let first = true;
  const place = () => {
    const y = yOf(here);
    lit.style.height = y + 'px';
    if (first && !still && y > 40) {
      first = false;
      const sp = { type: 'spring', stiffness: 60, damping: 16, mass: 1, delay: 0.25 };
      // o pacote pousou: a estação "de onde parou" confirma com um respiro (CSS .landed)
      animate(pkt, { y: [0, y] }, sp).finished.then(() => here.classList.add('landed'), () => {});
      animate(lit, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, sp);
    } else { first = false; animate(pkt, { y }, { duration: 0 }); }
  };
  place();
  addEventListener('resize', () => { const y = yOf(here); lit.style.height = y + 'px'; animate(pkt, { y }, { duration: 0 }); });
}
