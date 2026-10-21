/* Prova final do SDLabs: 80 perguntas de múltipla escolha dos módulos 1 a 28, com o módulo de origem em cada pergunta
   e a nota por bloco. Script clássico (funciona em file:// e http), sem bibliotecas. Autoavaliação: sem nota oficial. */
(function () {
  "use strict";

  var QUIZ = window.QUIZ || [];
  var BLOCKS = window.QUIZ_BLOCKS || {};
  var KEY = "sdlabs:provas-finais:quiz:v1";
  var ORDER = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "i"];
  var app = document.getElementById("app");
  var N_FULL = QUIZ.length;

  /* ---------- persistência (funciona sem) ---------- */
  var persistOk = true;
  function load() {
    try {
      var d = JSON.parse(window.localStorage.getItem(KEY) || "{}");
      return { solved: d.solved || {}, missed: d.missed || {}, nota: d.nota || {}, last: d.last || null };
    } catch (e) {
      persistOk = false;
      return { solved: {}, missed: {}, nota: {}, last: null };
    }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(store)); }
    catch (e) { persistOk = false; }
  }
  var store = load();

  /* ---------- utilidades ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function byId(id) { return QUIZ.filter(function (q) { return q.id === id; })[0]; }
  function inGroup(g) { return QUIZ.filter(function (q) { return q.group === g; }); }
  function pct(n) { return Math.round(n * 100) + "%"; }
  function show(screen, focusEl) {
    app.replaceChildren(screen);
    window.scrollTo(0, 0);
    if (focusEl) { try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); } }
  }
  function modLinks(q, prefix) {
    var wrap = h("span", { class: "pf-links" }, prefix || "Rever: ");
    q.mods.forEach(function (n, i) {
      if (i) wrap.appendChild(document.createTextNode(" · "));
      wrap.appendChild(h("a", { href: "../../" + q.modSlugs[i] + "/", target: "_blank", rel: "noopener", "aria-label": "Rever o módulo " + n + " (abre em nova aba)", text: "módulo " + n + " ↗" }));
    });
    return wrap;
  }
  function origin(q) {
    var b = BLOCKS[q.group];
    if (q.group === "i") return "Integradora · módulos " + q.mods.join(", ").replace(/, (\d+)$/, " e $1");
    return b.name.split(" · ")[0] + " · módulo " + q.mods[0];
  }
  /* o bloco mais fraco, pelo último resultado de cada bloco (sem resultado: sorteia um dos 7) */
  function weakest() {
    var pool = ORDER.slice(0, 7), worst = null, wr = 2;
    pool.forEach(function (g) {
      var n = store.nota[g];
      if (n && n.t && n.c / n.t < wr) { wr = n.c / n.t; worst = g; }
    });
    return worst || pool[Math.floor(Math.random() * pool.length)];
  }

  var round = null;

  /* ---------- tela inicial ---------- */
  function home() {
    round = null;
    var solvedTotal = QUIZ.filter(function (q) { return store.solved[q.id]; }).length;
    var missedIds = QUIZ.filter(function (q) { return store.missed[q.id]; }).map(function (q) { return q.id; });

    var title = h("h2", { text: "A prova final", tabindex: "-1" });
    var meter = h("div", { class: "q-meter", "aria-hidden": "true" }, h("i"));
    meter.firstChild.style.width = Math.round(solvedTotal / N_FULL * 100) + "%";

    var full = h("button", { class: "q-btn q-primary", type: "button", text: "Prova completa · " + N_FULL + " perguntas" });
    full.addEventListener("click", function () { startRound(QUIZ.slice(), "full"); });
    var short = h("button", { class: "q-btn", type: "button", text: "Modo curto · 20 perguntas" });
    short.addEventListener("click", function () {
      var g = weakest();
      var mix = inGroup("i").concat(shuffle(inGroup(g)).slice(0, 10));
      startRound(mix, "short", g);
    });

    var chips = h("div", { class: "q-chips", role: "group", "aria-label": "Treinar um bloco" });
    ORDER.forEach(function (g) {
      var list = inGroup(g);
      var ok = list.filter(function (q) { return store.solved[q.id]; }).length;
      var n = store.nota[g];
      var b = h("button", { class: "q-chip", type: "button" });
      b.appendChild(h("strong", null, h("span", { class: "q-tick", "aria-hidden": "true" }), BLOCKS[g].name));
      b.appendChild(h("small", { text: BLOCKS[g].range + " · " + (n ? "última " + n.c + "/" + n.t : "sem rodada ainda") + " · " + ok + " de " + list.length + " acertadas" }));
      b.addEventListener("click", function () { startRound(list.slice(), "train", g); });
      chips.appendChild(b);
    });

    var s = h("section", { class: "q-screen" },
      h("p", { class: "q-stat" }, "Você já acertou ", h("b", { text: solvedTotal + " de " + N_FULL }), " perguntas."),
      meter,
      title,
      h("p", { class: "q-sub", text: "Autoavaliação sem nota oficial: 70 perguntas por bloco e 10 integradoras que misturam módulos. A nota sai por bloco, e abaixo de 70% o quiz mostra o módulo para revisar." }),
      h("div", { class: "pf-start" }, full, short),
      h("p", { class: "q-note", text: "O modo curto tem as 10 integradoras e 10 perguntas do seu bloco mais fraco." }),
      h("h2", { text: "Treinar um bloco" }),
      chips,
      missedIds.length ? h("div", { class: "q-gap" }) : null,
      missedIds.length ? reviewBtn(missedIds) : null,
      h("div", { class: "q-small" },
        h("span", { class: "q-tag", text: persistOk ? "Seu progresso fica salvo neste navegador." : "Este navegador não deixou salvar o progresso." }),
        h("button", { class: "q-link", type: "button", text: "Zerar progresso" }))
    );
    s.querySelector(".q-small button").addEventListener("click", function () {
      if (window.confirm("Apagar notas e o registro de acertos da prova final?")) {
        store = { solved: {}, missed: {}, nota: {}, last: null };
        save();
        home();
      }
    });
    show(s, title);
  }

  function reviewBtn(ids) {
    var b = h("button", { class: "q-btn q-ghost", type: "button", text: "Revisar as que errei (" + ids.length + ")" });
    b.addEventListener("click", function () { startRound(shuffle(ids.map(byId)).slice(0, 20), "review"); });
    return b;
  }

  /* ---------- rodada ---------- */
  function startRound(list, mode, focus) {
    if (!list.length) { home(); return; }
    round = { qs: shuffle(list), i: 0, res: [], mode: mode, focus: focus, answered: false };
    ask();
  }

  function ask() {
    var r = round;
    var q = r.qs[r.i];
    r.inst = { q: q, opts: shuffle(q.options.map(function (t, i) { return { t: t, ok: i === q.answer }; })) };
    r.answered = false;

    var n = r.qs.length;
    var bar = h("div", { class: "q-bar", role: "progressbar", "aria-label": "Progresso da rodada", "aria-valuemin": "0", "aria-valuemax": String(n), "aria-valuenow": String(r.i) }, h("i"));
    bar.firstChild.style.width = Math.round(r.i / n * 100) + "%";
    var prompt = h("h2", { class: "q-prompt", text: q.prompt, tabindex: "-1" });
    var body = h("div", { class: "q-body" });
    var live = h("div", { class: "q-live", "aria-live": "polite", "aria-atomic": "true" });

    var s = h("section", { class: "q-screen" },
      h("div", { class: "q-prog" },
        h("b", { text: "Pergunta " + (r.i + 1) + " de " + n }),
        h("span", { class: "q-tag", text: (r.mode === "review" ? "Revisão · " : "") + origin(q) })),
      bar,
      prompt, body, live,
      h("div", { class: "q-small" }, h("button", { class: "q-link", type: "button", text: "Encerrar rodada" }))
    );
    s.querySelector(".q-small button").addEventListener("click", home);
    r.live = live;

    var list = h("ul", { class: "q-opts" });
    r.inst.btns = r.inst.opts.map(function (o, i) {
      var b = h("button", { class: "q-btn", type: "button" },
        h("span", { class: "q-key", "aria-hidden": "true", text: String(i + 1) }),
        h("span", { class: "q-opt-text", text: o.t }),
        h("span", { class: "q-badge" }));
      b.addEventListener("click", function () { pick(i); });
      list.appendChild(h("li", null, b));
      return b;
    });
    body.appendChild(list);
    r.inst.pick = pick;
    show(s, prompt);
  }

  function mark(btn, kind, label) {
    btn.classList.add(kind);
    btn.querySelector(".q-badge").textContent = label;
  }

  function pick(i) {
    var r = round;
    if (r.answered) return;
    var inst = r.inst;
    inst.btns.forEach(function (b, j) {
      b.disabled = true;
      if (inst.opts[j].ok) mark(b, "is-right", "✓ Certa");
      else if (j === i) mark(b, "is-wrong", "✗ Sua resposta");
      else b.classList.add("is-dim");
    });
    settle(inst.opts[i].ok);
  }

  function settle(ok) {
    var r = round;
    var q = r.inst.q;
    r.answered = true;
    r.res.push({ q: q, ok: ok });
    if (ok) { store.solved[q.id] = 1; delete store.missed[q.id]; }
    else store.missed[q.id] = 1;
    save();

    var last = r.i === r.qs.length - 1;
    var next = h("button", { class: "q-btn q-primary", type: "button", text: last ? "Ver resultado →" : "Próxima →" });
    next.addEventListener("click", advance);
    var fb = h("div", { class: "q-fb " + (ok ? "is-right" : "is-wrong") },
      h("p", { class: "q-fb-head", text: ok ? "✓ Certo!" : "✗ Não foi dessa vez." }),
      ok ? null : h("p", { class: "q-right-ans" }, "Resposta certa: " + q.options[q.answer]),
      h("p", { text: q.explain }),
      h("div", { class: "q-fb-links" }, modLinks(q), next));
    r.live.replaceChildren(fb);
    try { fb.scrollIntoView({ block: "nearest" }); } catch (e) { /* sem scroll */ }
  }

  function advance() {
    var r = round;
    if (!r || !r.answered) return;
    r.i++;
    if (r.i >= r.qs.length) finish(); else ask();
  }

  /* ---------- fim: nota por bloco e geral ---------- */
  function finish() {
    var r = round;
    var total = r.res.length;
    var right = r.res.filter(function (x) { return x.ok; }).length;
    var wrong = r.res.filter(function (x) { return !x.ok; });

    var per = {};
    r.res.forEach(function (x) {
      var k = x.q.group;
      per[k] = per[k] || { c: 0, t: 0 };
      per[k].t++;
      if (x.ok) per[k].c++;
    });
    Object.keys(per).forEach(function (k) { if (r.mode !== "review") store.nota[k] = per[k]; });
    if (r.mode === "full" || r.mode === "short") {
      store.last = { blocos: per, total: { c: right, t: total }, modo: r.mode, quando: new Date().toISOString().slice(0, 10) };
    }
    save();

    var p = right / total;
    var full = r.mode === "full";
    var faixa;
    if (full ? right >= 72 : p >= 0.9) faixa = "Você pode explicar a loja sem olhar.";
    else if (full ? right >= 56 : p >= 0.7) faixa = "Revise os blocos abaixo de 70%.";
    else faixa = "Volte ao bloco mais baixo e refaça o \"Você consegue?\".";

    var title = h("h2", { text: r.mode === "review" ? "Revisão concluída" : "Fim da rodada", tabindex: "-1" });
    var s = h("section", { class: "q-screen" },
      title,
      h("p", { class: "q-score" }, right + " de " + total + " ✓"),
      h("p", { class: "q-sub", text: pct(p) + ". " + faixa + " (Autoavaliação, sem nota oficial.)" })
    );

    /* barras por bloco */
    var keys = ORDER.filter(function (g) { return per[g]; });
    if (keys.length) {
      s.appendChild(h("h2", { text: "Nota por bloco" }));
      var box = h("div", { class: "pf-bars", role: "list" });
      var fracos = [];
      keys.forEach(function (g) {
        var x = per[g], f = x.c / x.t, bad = f < 0.7;
        if (bad && g !== "i") fracos.push(g);
        var fill = h("i", { class: bad ? "bad" : "" });
        fill.style.width = Math.round(f * 100) + "%";
        box.appendChild(h("div", { class: "pf-brow", role: "listitem" },
          h("span", { class: "pf-bl", text: BLOCKS[g].name }),
          h("span", { class: "pf-bt" }, fill),
          h("span", { class: "pf-bv" + (bad ? " bad" : ""), text: x.c + "/" + x.t + " · " + pct(f) })));
      });
      s.appendChild(box);
      if (fracos.length) {
        s.appendChild(h("h2", { text: "Para revisar (abaixo de 70%)" }));
        var ul = h("ul", { class: "q-miss" });
        fracos.forEach(function (g) {
          var mods = {};
          QUIZ.forEach(function (q) { if (q.group === g) q.mods.forEach(function (n, i) { mods[n] = q.modSlugs[i]; }); });
          var li = h("li", null, h("p", { class: "q-m-q", text: BLOCKS[g].name + " (" + BLOCKS[g].range + ")" }));
          var links = h("p", { class: "pf-links" });
          Object.keys(mods).sort(function (a, b) { return a - b; }).forEach(function (n, i) {
            if (i) links.appendChild(document.createTextNode(" · "));
            links.appendChild(h("a", { href: "../../" + mods[n] + "/", target: "_blank", rel: "noopener", text: "módulo " + n + " ↗" }));
          });
          li.appendChild(links);
          ul.appendChild(li);
        });
        s.appendChild(ul);
      }
    }

    if (wrong.length) {
      s.appendChild(h("h2", { text: "Para rever" }));
      var miss = h("ul", { class: "q-miss" });
      wrong.forEach(function (x) {
        miss.appendChild(h("li", null,
          h("p", { class: "q-m-q", text: x.q.prompt }),
          h("p", { class: "q-m-a" }, "Certa: ", h("b", { text: x.q.options[x.q.answer] })),
          modLinks(x.q)));
      });
      s.appendChild(miss);
    }

    var wrongQs = wrong.map(function (x) { return x.q; });
    var actions = h("div", { class: "q-actions", style: "flex-direction:column" });
    if (wrongQs.length) {
      var rev = h("button", { class: "q-btn q-primary", type: "button", text: "Revisar só as que errei (" + wrongQs.length + ")" });
      rev.addEventListener("click", function () { startRound(wrongQs, "review"); });
      actions.appendChild(rev);
    }
    var again = h("button", { class: "q-btn q-ghost", type: "button", text: "Voltar ao início" });
    again.addEventListener("click", home);
    actions.appendChild(again);
    s.appendChild(h("div", { class: "q-gap" }));
    s.appendChild(actions);

    round = null;
    show(s, title);
  }

  /* ---------- teclado ---------- */
  document.addEventListener("keydown", function (e) {
    if (!round || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var tag = e.target && e.target.tagName;
    if (e.key === "Enter") {
      if (tag === "BUTTON" || tag === "A") return;
      if (round.answered) { e.preventDefault(); advance(); }
      return;
    }
    if (round.answered || !round.inst) return;
    if (/^[1-4]$/.test(e.key) && +e.key <= round.inst.btns.length) pick(+e.key - 1);
  });

  if (!QUIZ.length) {
    app.appendChild(h("p", { class: "q-card", text: "Não consegui carregar as perguntas (questions.js)." }));
  } else {
    home();
  }
})();
