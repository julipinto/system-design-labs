/* Quiz de Event Sourcing. Script clássico (funciona em file:// e http), sem bibliotecas. */
(function () {
  "use strict";

  var QUIZ = window.QUIZ || [];
  var KEY = "sdlabs:event-sourcing:quiz:v1";
  var LAYERS = { cp: "CP", ap: "AP", ca: "CA" };
  var LAYER_ORDER = ["cp", "ap", "ca"];
  var LEVELS = { 1: "definição", 2: "aplicar", 3: "cenário" };
  var app = document.getElementById("app");

  /* ---------- grupos (chips) ---------- */
  var groups = [];
  QUIZ.forEach(function (q) {
    var g = groups.filter(function (x) { return x.key === q.group; })[0];
    if (!g) { g = { key: q.group, name: q.topicName, ids: [] }; groups.push(g); }
    g.ids.push(q.id);
  });

  /* ---------- persistência (funciona sem) ---------- */
  var persistOk = true;
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var d = raw ? JSON.parse(raw) : {};
      return { solved: d.solved || {}, missed: d.missed || {}, best: d.best || {} };
    } catch (e) {
      persistOk = false;
      return { solved: {}, missed: {}, best: {} };
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
  function count(list, map) { return list.filter(function (id) { return map[id]; }).length; }
  function linkFor(q) { return "../index.html#" + q.topic; }
  function show(screen, focusEl) {
    app.replaceChildren(screen);
    window.scrollTo(0, 0);
    if (focusEl) { try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); } }
  }
  function answerText(q) {
    if (q.type === "choice") return q.options[q.answer];
    if (q.type === "truefalse") return q.answer ? "Verdadeira" : "Falsa";
    if (q.type === "layer") return LAYERS[q.answer];
    return q.options.join(" → ");
  }

  /* ---------- estado ---------- */
  var sel = {};
  groups.forEach(function (g) { sel[g.key] = true; });
  var size = 10;
  var round = null;

  /* ---------- tela inicial ---------- */
  function home() {
    round = null;
    var solvedTotal = count(QUIZ.map(function (q) { return q.id; }), store.solved);
    var missedIds = QUIZ.filter(function (q) { return store.missed[q.id]; }).map(function (q) { return q.id; });

    var title = h("h2", { text: "Escolha o que treinar", tabindex: "-1" });
    var chipsBox = h("div", { class: "q-chips", role: "group", "aria-label": "Tópicos" });
    var chipEls = groups.map(function (g) {
      var b = h("button", { class: "q-chip", type: "button", "aria-pressed": "true" });
      var left = g.ids.length - count(g.ids, store.solved);
      var best = store.best[g.key];
      b.appendChild(h("strong", null, h("span", { class: "q-tick", "aria-hidden": "true" }), g.name));
      b.appendChild(h("small", { text: (best ? "melhor " + best.c + "/" + best.t : "sem rodada ainda") + " · " + (left ? "faltam " + left + " de " + g.ids.length : "todas acertadas ✓") }));
      b.addEventListener("click", function () { sel[g.key] = !sel[g.key]; refresh(); });
      chipsBox.appendChild(b);
      return b;
    });

    var toggleAll = h("button", { class: "q-link", type: "button" });
    toggleAll.addEventListener("click", function () {
      var any = groups.some(function (g) { return sel[g.key]; });
      groups.forEach(function (g) { sel[g.key] = !any; });
      refresh();
    });

    var segBox = h("div", { class: "q-seg", role: "radiogroup", "aria-label": "Tamanho da rodada" });
    var segEls = [5, 10, 20].map(function (n) {
      var b = h("button", { class: "q-btn", type: "button", role: "radio" }, h("b", { text: String(n) }), " ", h("span", { text: "perguntas" }));
      b.addEventListener("click", function () { size = n; refresh(); });
      segBox.appendChild(b);
      return b;
    });

    var note = h("p", { class: "q-note", "aria-live": "polite" });
    var start = h("button", { class: "q-btn q-primary", type: "button" });
    start.addEventListener("click", function () { startRound(pickNew(), "normal"); });

    var meter = h("div", { class: "q-meter", "aria-hidden": "true" }, h("i"));
    meter.firstChild.style.width = Math.round(solvedTotal / QUIZ.length * 100) + "%";

    function refresh() {
      chipEls.forEach(function (b, i) { b.setAttribute("aria-pressed", sel[groups[i].key] ? "true" : "false"); });
      var any = groups.some(function (g) { return sel[g.key]; });
      toggleAll.textContent = any ? "Desmarcar todos" : "Marcar todos";
      segEls.forEach(function (b, i) { b.setAttribute("aria-checked", [5, 10, 20][i] === size ? "true" : "false"); });
      var pool = QUIZ.filter(function (q) { return sel[q.group]; });
      var fresh = pool.filter(function (q) { return !store.solved[q.id]; }).length;
      var n = Math.min(size, pool.length);
      start.disabled = !pool.length;
      start.textContent = pool.length ? "Começar · " + n + " perguntas" : "Escolha ao menos um tópico";
      note.textContent = pool.length
        ? pool.length + " perguntas nos tópicos escolhidos, " + fresh + " ainda não acertadas. As que faltam vêm primeiro."
        : "Nenhum tópico marcado.";
    }

    var s = h("section", { class: "q-screen" },
      h("p", { class: "q-stat" }, "Você já acertou ", h("b", { text: solvedTotal + " de " + QUIZ.length }), " perguntas."),
      meter,
      title,
      h("p", { class: "q-sub", text: "Toque para marcar ou desmarcar." }),
      chipsBox,
      toggleAll,
      h("h2", { text: "Tamanho da rodada" }),
      segBox,
      note,
      start,
      missedIds.length ? h("div", { class: "q-gap" }) : null,
      missedIds.length ? reviewBtn(missedIds) : null,
      h("div", { class: "q-small" },
        h("span", { class: "q-tag", text: persistOk ? "Seu progresso fica salvo neste navegador." : "Este navegador não deixou salvar o progresso." }),
        h("button", { class: "q-link", type: "button", text: "Zerar progresso", onclick: null }))
    );
    s.querySelector(".q-small button").addEventListener("click", function () {
      if (window.confirm("Apagar placares e o registro de acertos deste quiz?")) {
        store = { solved: {}, missed: {}, best: {} };
        save();
        home();
      }
    });
    refresh();
    show(s, title);
  }

  function reviewBtn(ids) {
    var b = h("button", { class: "q-btn q-ghost", type: "button", text: "Revisar as que errei (" + ids.length + ")" });
    b.addEventListener("click", function () {
      startRound(shuffle(ids.map(byId)).slice(0, 20), "review");
    });
    return b;
  }

  function pickNew() {
    var pool = shuffle(QUIZ.filter(function (q) { return sel[q.group]; }));
    pool.sort(function (a, b) { return (store.solved[a.id] ? 1 : 0) - (store.solved[b.id] ? 1 : 0); });
    return pool.slice(0, size);
  }

  /* ---------- rodada ---------- */
  function startRound(list, mode) {
    if (!list.length) { home(); return; }
    round = { qs: shuffle(list), i: 0, res: [], mode: mode, answered: false };
    ask();
  }

  function prepare(q) {
    var inst = { q: q };
    if (q.type === "choice") {
      inst.opts = shuffle(q.options.map(function (t, i) { return { t: t, ok: i === q.answer }; }));
    } else if (q.type === "order") {
      var idx = q.options.map(function (_, i) { return i; });
      var tries = 0;
      do { inst.perm = shuffle(idx); tries++; }
      while (tries < 20 && inst.perm.every(function (v, i) { return v === i; }));
      inst.placed = [];
    }
    return inst;
  }

  function ask() {
    var r = round;
    var q = r.qs[r.i];
    r.inst = prepare(q);
    r.answered = false;

    var n = r.qs.length;
    var bar = h("div", { class: "q-bar", role: "progressbar", "aria-label": "Progresso da rodada", "aria-valuemin": "0", "aria-valuemax": String(n), "aria-valuenow": String(r.i) }, h("i"));
    bar.firstChild.style.width = Math.round(r.i / n * 100) + "%";
    var kind = q.type === "truefalse" ? "Verdadeiro ou falso" : q.type === "order" ? "Ordenar" : q.type === "layer" ? "Qual camada?" : "Escolha uma";
    var prompt = h("h2", { class: "q-prompt", text: q.prompt, tabindex: "-1" });
    var body = h("div", { class: "q-body" });
    var live = h("div", { class: "q-live", "aria-live": "polite", "aria-atomic": "true" });

    var s = h("section", { class: "q-screen" },
      h("div", { class: "q-prog" },
        h("b", { text: "Pergunta " + (r.i + 1) + " de " + n }),
        h("span", { class: "q-tag", text: (r.mode === "review" ? "Revisão · " : "") + q.topicName })),
      bar,
      h("div", { class: "q-tag", text: kind + " · nível: " + LEVELS[q.level] }),
      prompt, body, live,
      h("div", { class: "q-small" },
        h("button", { class: "q-link", type: "button", text: "Encerrar rodada", onclick: null }))
    );
    s.querySelector(".q-small button").addEventListener("click", function () { home(); });
    r.live = live;
    r.body = body;

    if (q.type === "choice") buildChoice(r.inst, body);
    else if (q.type === "truefalse") buildTF(r.inst, body);
    else if (q.type === "layer") buildLayer(r.inst, body);
    else buildOrder(r.inst, body);

    show(s, prompt);
  }

  function optionBtn(key, text) {
    return h("button", { class: "q-btn", type: "button" },
      h("span", { class: "q-key", "aria-hidden": "true", text: String(key) }),
      h("span", { class: "q-opt-text", text: text }),
      h("span", { class: "q-badge" }));
  }
  function mark(btn, kind, label) {
    btn.classList.add(kind);
    btn.querySelector(".q-badge").textContent = label;
  }

  function buildChoice(inst, body) {
    var list = h("ul", { class: "q-opts" });
    inst.btns = inst.opts.map(function (o, i) {
      var b = optionBtn(i + 1, o.t);
      b.addEventListener("click", function () { pickChoice(i); });
      list.appendChild(h("li", null, b));
      return b;
    });
    body.appendChild(list);
    inst.pick = pickChoice;
    function pickChoice(i) {
      if (round.answered) return;
      var ok = inst.opts[i].ok;
      inst.btns.forEach(function (b, j) {
        b.disabled = true;
        if (inst.opts[j].ok) mark(b, "is-right", "✓ Certa");
        else if (j === i) mark(b, "is-wrong", "✗ Sua resposta");
        else b.classList.add("is-dim");
      });
      settle(ok);
    }
  }

  function buildTF(inst, body) {
    var q = inst.q;
    var list = h("ul", { class: "q-opts" });
    var vals = [true, false];
    inst.btns = ["Verdadeira", "Falsa"].map(function (t, i) {
      var b = optionBtn(i + 1, t);
      b.addEventListener("click", function () { pickTF(i); });
      list.appendChild(h("li", null, b));
      return b;
    });
    body.appendChild(list);
    inst.pick = pickTF;
    function pickTF(i) {
      if (round.answered) return;
      inst.btns.forEach(function (b, j) {
        b.disabled = true;
        if (vals[j] === q.answer) mark(b, "is-right", "✓ Certa");
        else if (j === i) mark(b, "is-wrong", "✗ Sua resposta");
        else b.classList.add("is-dim");
      });
      settle(vals[i] === q.answer);
    }
  }

  function buildLayer(inst, body) {
    var q = inst.q;
    var list = h("ul", { class: "q-opts q-layers" });
    inst.btns = LAYER_ORDER.map(function (L) {
      var b = optionBtn(LAYERS[L].charAt(0), LAYERS[L]);
      b.addEventListener("click", function () { pickLayer(L); });
      list.appendChild(h("li", null, b));
      return b;
    });
    body.appendChild(list);
    inst.pick = pickLayer;
    function pickLayer(L) {
      if (round.answered || !LAYERS[L]) return;
      inst.btns.forEach(function (b, j) {
        var lay = LAYER_ORDER[j];
        b.disabled = true;
        if (lay === q.answer) mark(b, "is-right", "✓ Certa");
        else if (lay === L) mark(b, "is-wrong", "✗ Sua resposta");
        else b.classList.add("is-dim");
      });
      settle(L === q.answer);
    }
  }

  function buildOrder(inst, body) {
    var q = inst.q;
    var n = q.options.length;
    var slots = h("ol", { class: "q-slots", "aria-label": "Sua ordem" });
    var pool = h("ul", { class: "q-opts q-pool", "aria-label": "Itens para ordenar" });
    var undo = h("button", { class: "q-btn", type: "button", text: "↶ Desfazer" });
    var check = h("button", { class: "q-btn q-primary", type: "button", text: "Conferir" });
    var actions = h("div", { class: "q-actions" }, undo, check);

    var slotEls = q.options.map(function (_, i) {
      var li = h("li", { class: "q-slot" }, h("span", { class: "q-key", "aria-hidden": "true", text: String(i + 1) }), h("span", { class: "q-opt-text" }), h("span", { class: "q-badge" }));
      slots.appendChild(li);
      return li;
    });
    var poolBtns = inst.perm.map(function (orig, k) {
      var b = optionBtn(k + 1, q.options[orig]);
      b.querySelector(".q-badge").remove();
      b.addEventListener("click", function () { place(k); });
      pool.appendChild(h("li", null, b));
      return b;
    });

    function paint() {
      slotEls.forEach(function (li, i) {
        var has = i < inst.placed.length;
        li.classList.toggle("is-filled", has);
        li.querySelector(".q-opt-text").textContent = has ? q.options[inst.perm[inst.placed[i]]] : (i === inst.placed.length ? "toque o item " + (i + 1) : "");
      });
      poolBtns.forEach(function (b, k) { b.disabled = inst.placed.indexOf(k) !== -1; });
      undo.disabled = !inst.placed.length;
      check.disabled = inst.placed.length !== n;
    }
    function place(k) {
      if (round.answered || inst.placed.indexOf(k) !== -1 || k >= n) return;
      inst.placed.push(k);
      paint();
    }
    function remove() {
      if (round.answered || !inst.placed.length) return;
      inst.placed.pop();
      paint();
    }
    function conferir() {
      if (round.answered || inst.placed.length !== n) return;
      var allOk = true;
      slotEls.forEach(function (li, i) {
        var right = inst.perm[inst.placed[i]] === i;
        if (!right) allOk = false;
        li.classList.add(right ? "is-right" : "is-wrong");
        li.querySelector(".q-badge").textContent = right ? "✓" : "✗";
      });
      pool.remove();
      poolLabel.remove();
      actions.remove();
      settle(allOk);
    }
    undo.addEventListener("click", remove);
    check.addEventListener("click", conferir);
    inst.pick = function (k) { place(k - 1); };
    inst.undo = remove;
    inst.check = conferir;

    body.appendChild(h("p", { class: "q-order-label", text: "Sua ordem (toque nos itens, do primeiro ao último):" }));
    body.appendChild(slots);
    var poolLabel = h("p", { class: "q-order-label", text: "Itens:" });
    body.appendChild(poolLabel);
    body.appendChild(pool);
    body.appendChild(actions);
    paint();
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
      ok ? null : q.type === "order"
        ? h("div", null, h("p", { class: "q-right-ans", text: "Ordem certa:" }), orderedList(q.options))
        : h("p", { class: "q-right-ans" }, "Resposta certa: " + answerText(q)),
      h("p", { text: q.explain }),
      h("div", { class: "q-fb-links" },
        h("a", { href: linkFor(q), target: "_blank", rel: "noopener", "aria-label": "Rever no tópico " + q.topicName + " (abre em nova aba)", text: "Rever no tópico ↗" }),
        next));
    r.live.replaceChildren(fb);
    try { fb.scrollIntoView({ block: "nearest" }); } catch (e) { /* sem scroll */ }
  }

  function orderedList(items) {
    var ol = h("ol", { class: "q-right-list" });
    items.forEach(function (t) { ol.appendChild(h("li", { text: t })); });
    return ol;
  }

  function advance() {
    var r = round;
    if (!r || !r.answered) return;
    r.i++;
    if (r.i >= r.qs.length) finish(); else ask();
  }

  /* ---------- fim ---------- */
  function finish() {
    var r = round;
    var total = r.res.length;
    var right = r.res.filter(function (x) { return x.ok; }).length;
    var wrong = r.res.filter(function (x) { return !x.ok; });

    if (r.mode === "normal") {
      var per = {};
      r.res.forEach(function (x) {
        var k = x.q.group;
        per[k] = per[k] || { c: 0, t: 0 };
        per[k].t++;
        if (x.ok) per[k].c++;
      });
      Object.keys(per).forEach(function (k) {
        var b = store.best[k], p = per[k];
        if (!b || p.c / p.t > b.c / b.t || (p.c / p.t === b.c / b.t && p.t > b.t)) store.best[k] = p;
      });
      save();
    }

    var pct = right / total;
    var msg = pct === 1 ? "Rodada perfeita."
      : pct >= 0.8 ? "Muito bom. O que errou já está listado abaixo."
      : pct >= 0.5 ? "Bom avanço. Revise as erradas e fixe."
      : "Errar faz parte. Revise as erradas e repita: é assim que fixa.";

    var title = h("h2", { text: r.mode === "review" ? "Revisão concluída" : "Fim da rodada", tabindex: "-1" });
    var s = h("section", { class: "q-screen" },
      title,
      h("p", { class: "q-score" }, right + " de " + total + " ✓"),
      h("p", { class: "q-sub", text: msg })
    );

    if (wrong.length) {
      s.appendChild(h("h2", { text: "Para rever" }));
      var ul = h("ul", { class: "q-miss" });
      wrong.forEach(function (x) {
        ul.appendChild(h("li", null,
          h("p", { class: "q-m-q", text: x.q.prompt }),
          h("p", { class: "q-m-a" }, "Certa: ", h("b", { text: answerText(x.q) })),
          h("a", { href: linkFor(x.q), target: "_blank", rel: "noopener", text: "Rever no tópico ↗" })));
      });
      s.appendChild(ul);
    }

    var wrongQs = wrong.map(function (x) { return x.q; });
    var again = h("button", { class: "q-btn q-primary", type: "button", text: r.mode === "review" ? "Nova rodada" : "Nova rodada (mesmos tópicos)" });
    again.addEventListener("click", function () { startRound(pickNew(), "normal"); });
    var actions = h("div", { class: "q-actions", style: "flex-direction:column" });
    if (wrongQs.length) {
      var rev = h("button", { class: "q-btn q-primary", type: "button", text: "Revisar só as que errei (" + wrongQs.length + ")" });
      rev.addEventListener("click", function () { startRound(wrongQs, "review"); });
      actions.appendChild(rev);
      again.classList.remove("q-primary");
      again.classList.add("q-ghost");
    }
    actions.appendChild(again);
    var topics = h("button", { class: "q-btn q-ghost", type: "button", text: "Escolher outros tópicos" });
    topics.addEventListener("click", home);
    actions.appendChild(topics);
    s.appendChild(h("div", { class: "q-gap" }));
    s.appendChild(actions);

    round = null;
    show(s, title);
  }

  /* ---------- teclado ---------- */
  document.addEventListener("keydown", function (e) {
    if (!round || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var inst = round.inst;
    var tag = e.target && e.target.tagName;
    if (e.key === "Enter") {
      if (tag === "BUTTON" || tag === "A") return;
      if (round.answered) { e.preventDefault(); advance(); }
      else if (inst && inst.check) { e.preventDefault(); inst.check(); }
      return;
    }
    if (round.answered || !inst) return;
    if (e.key === "Backspace" && inst.undo) { e.preventDefault(); inst.undo(); return; }
    if (/^[1-9]$/.test(e.key) && inst.pick) {
      var k = +e.key;
      if (inst.q.type === "choice" || inst.q.type === "truefalse") { if (k <= inst.btns.length) inst.pick(k - 1); }
      else inst.pick(k);
    }
  });

  if (!QUIZ.length) {
    app.appendChild(h("p", { class: "q-card", text: "Não consegui carregar as perguntas (questions.js)." }));
  } else {
    home();
  }
})();
