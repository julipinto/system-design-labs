/* ---------- home como mapa da história: trilha vertical, uma estação por módulo, o pacote onde a pessoa parou ----------
   Lê o progresso que o modo foco grava (sdl-<módulo>:done). Estação cheia = módulo completo; contorno sódio = em andamento.
   Ao abrir a home, o pacote desce pela trilha até o módulo em andamento (ou o primeiro que falta), com mola. */
import { animate } from 'motion';

const list = document.querySelector('.mods');
if (list) {
  const EN = /^en/.test(document.documentElement.lang);
  const mods = Array.from(list.querySelectorAll('.mod[data-mod]'));
  let firstGoing = null, lastDone = -1;
  mods.forEach((li, i) => {
    let n = 0; const total = +li.dataset.total;
    try { n = (JSON.parse(localStorage.getItem('sdl-' + li.dataset.mod + ':done') || '[]') || []).length; } catch (e) { /* sem storage: mapa sem progresso */ }
    n = Math.min(n, total);
    if (n >= total) { li.classList.add('done'); lastDone = i; }
    else if (n > 0) { li.classList.add('going'); if (!firstGoing) firstGoing = li; }
    if (!n) return;
    const box = li.querySelector('.mod-prog'), bar = li.querySelector('.mod-bar');
    for (let k = 0; k < total; k++) { const s = document.createElement('i'); if (k < n) s.className = 'done'; bar.appendChild(s); }
    li.querySelector('.mod-prog-t').textContent = EN ? n + ' of ' + total + ' understood' : n + ' de ' + total + ' entendidas';
    box.hidden = false;
  });
  const here = firstGoing || mods[lastDone + 1] || mods[0];
  here.classList.add('here');

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
      animate(pkt, { y: [0, y] }, { type: 'spring', stiffness: 60, damping: 16, mass: 1, delay: 0.25 });
      animate(lit, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { type: 'spring', stiffness: 60, damping: 16, mass: 1, delay: 0.25 });
    } else { first = false; animate(pkt, { y }, { duration: 0 }); }
  };
  place();
  addEventListener('resize', () => { const y = yOf(here); lit.style.height = y + 'px'; animate(pkt, { y }, { duration: 0 }); });
}
