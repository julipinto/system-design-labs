/* SDLabs final exam (English): 80 multiple-choice questions from modules 1 to 28, with the source module on each question
   and the score by block. Classic script (works on file:// and http), no libraries. Self-assessment: no official score. */
(function () {
  "use strict";

  var QUIZ = window.QUIZ || [];
  var BLOCKS = window.QUIZ_BLOCKS || {};
  var KEY = "sdlabs:provas-finais:quiz:v1";
  var ORDER = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "i"];
  var app = document.getElementById("app");
  var N_FULL = QUIZ.length;

  /* ---------- persistence (works without it) ---------- */
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

  /* ---------- utilities ---------- */
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
    var wrap = h("span", { class: "pf-links" }, prefix || "Review: ");
    q.mods.forEach(function (n, i) {
      if (i) wrap.appendChild(document.createTextNode(" · "));
      wrap.appendChild(h("a", { href: "../../" + q.modSlugs[i] + "/", target: "_blank", rel: "noopener", "aria-label": "Review module " + n + " (opens in a new tab)", text: "module " + n + " ↗" }));
    });
    return wrap;
  }
  function origin(q) {
    var b = BLOCKS[q.group];
    if (q.group === "i") return "Integrative · modules " + q.mods.join(", ").replace(/, (\d+)$/, " and $1");
    return b.name.split(" · ")[0] + " · module " + q.mods[0];
  }
  /* the weakest block, by the last result of each block (no result: picks one of the 7 at random) */
  function weakest() {
    var pool = ORDER.slice(0, 7), worst = null, wr = 2;
    pool.forEach(function (g) {
      var n = store.nota[g];
      if (n && n.t && n.c / n.t < wr) { wr = n.c / n.t; worst = g; }
    });
    return worst || pool[Math.floor(Math.random() * pool.length)];
  }

  var round = null;

  /* ---------- start screen ---------- */
  function home() {
    round = null;
    var solvedTotal = QUIZ.filter(function (q) { return store.solved[q.id]; }).length;
    var missedIds = QUIZ.filter(function (q) { return store.missed[q.id]; }).map(function (q) { return q.id; });

    var title = h("h2", { text: "The final exam", tabindex: "-1" });
    var meter = h("div", { class: "q-meter", "aria-hidden": "true" }, h("i"));
    meter.firstChild.style.width = Math.round(solvedTotal / N_FULL * 100) + "%";

    var full = h("button", { class: "q-btn q-primary", type: "button", text: "Full exam · " + N_FULL + " questions" });
    full.addEventListener("click", function () { startRound(QUIZ.slice(), "full"); });
    var short = h("button", { class: "q-btn", type: "button", text: "Short mode · 20 questions" });
    short.addEventListener("click", function () {
      var g = weakest();
      var mix = inGroup("i").concat(shuffle(inGroup(g)).slice(0, 10));
      startRound(mix, "short", g);
    });

    var chips = h("div", { class: "q-chips", role: "group", "aria-label": "Practice a block" });
    ORDER.forEach(function (g) {
      var list = inGroup(g);
      var ok = list.filter(function (q) { return store.solved[q.id]; }).length;
      var n = store.nota[g];
      var b = h("button", { class: "q-chip", type: "button" });
      b.appendChild(h("strong", null, h("span", { class: "q-tick", "aria-hidden": "true" }), BLOCKS[g].name));
      b.appendChild(h("small", { text: BLOCKS[g].range + " · " + (n ? "last " + n.c + "/" + n.t : "no round yet") + " · " + ok + " of " + list.length + " right" }));
      b.addEventListener("click", function () { startRound(list.slice(), "train", g); });
      chips.appendChild(b);
    });

    var s = h("section", { class: "q-screen" },
      h("p", { class: "q-stat" }, "You have already got ", h("b", { text: solvedTotal + " of " + N_FULL }), " questions right."),
      meter,
      title,
      h("p", { class: "q-sub", text: "Self-assessment with no official score: 70 questions by block and 10 integrative ones that mix modules. The score comes out by block, and below 70% the quiz shows the module to review." }),
      h("div", { class: "pf-start" }, full, short),
      h("p", { class: "q-note", text: "Short mode has the 10 integrative questions and 10 questions from your weakest block." }),
      h("h2", { text: "Practice a block" }),
      chips,
      missedIds.length ? h("div", { class: "q-gap" }) : null,
      missedIds.length ? reviewBtn(missedIds) : null,
      h("div", { class: "q-small" },
        h("span", { class: "q-tag", text: persistOk ? "Your progress is saved in this browser." : "This browser did not let the progress be saved." }),
        h("button", { class: "q-link", type: "button", text: "Reset progress" }))
    );
    s.querySelector(".q-small button").addEventListener("click", function () {
      if (window.confirm("Erase the scores and the record of right answers from the final exam?")) {
        store = { solved: {}, missed: {}, nota: {}, last: null };
        save();
        home();
      }
    });
    show(s, title);
  }

  function reviewBtn(ids) {
    var b = h("button", { class: "q-btn q-ghost", type: "button", text: "Review the ones I got wrong (" + ids.length + ")" });
    b.addEventListener("click", function () { startRound(shuffle(ids.map(byId)).slice(0, 20), "review"); });
    return b;
  }

  /* ---------- round ---------- */
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
    var bar = h("div", { class: "q-bar", role: "progressbar", "aria-label": "Round progress", "aria-valuemin": "0", "aria-valuemax": String(n), "aria-valuenow": String(r.i) }, h("i"));
    bar.firstChild.style.width = Math.round(r.i / n * 100) + "%";
    var prompt = h("h2", { class: "q-prompt", text: q.prompt, tabindex: "-1" });
    var body = h("div", { class: "q-body" });
    var live = h("div", { class: "q-live", "aria-live": "polite", "aria-atomic": "true" });

    var s = h("section", { class: "q-screen" },
      h("div", { class: "q-prog" },
        h("b", { text: "Question " + (r.i + 1) + " of " + n }),
        h("span", { class: "q-tag", text: (r.mode === "review" ? "Review · " : "") + origin(q) })),
      bar,
      prompt, body, live,
      h("div", { class: "q-small" }, h("button", { class: "q-link", type: "button", text: "End round" }))
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
      if (inst.opts[j].ok) mark(b, "is-right", "✓ Right");
      else if (j === i) mark(b, "is-wrong", "✗ Your answer");
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
    var next = h("button", { class: "q-btn q-primary", type: "button", text: last ? "See the result →" : "Next →" });
    next.addEventListener("click", advance);
    var fb = h("div", { class: "q-fb " + (ok ? "is-right" : "is-wrong") },
      h("p", { class: "q-fb-head", text: ok ? "✓ Right!" : "✗ Not this time." }),
      ok ? null : h("p", { class: "q-right-ans" }, "Right answer: " + q.options[q.answer]),
      h("p", { text: q.explain }),
      h("div", { class: "q-fb-links" }, modLinks(q), next));
    r.live.replaceChildren(fb);
    try { fb.scrollIntoView({ block: "nearest" }); } catch (e) { /* no scroll */ }
  }

  function advance() {
    var r = round;
    if (!r || !r.answered) return;
    r.i++;
    if (r.i >= r.qs.length) finish(); else ask();
  }

  /* ---------- end: score by block and overall ---------- */
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
    if (full ? right >= 72 : p >= 0.9) faixa = "You can explain the store without looking.";
    else if (full ? right >= 56 : p >= 0.7) faixa = "Review the blocks below 70%.";
    else faixa = "Go back to the lowest block and redo \"Can you do it?\".";

    var title = h("h2", { text: r.mode === "review" ? "Review complete" : "End of the round", tabindex: "-1" });
    var s = h("section", { class: "q-screen" },
      title,
      h("p", { class: "q-score" }, right + " of " + total + " ✓"),
      h("p", { class: "q-sub", text: pct(p) + ". " + faixa + " (Self-assessment, no official score.)" })
    );

    /* bars by block */
    var keys = ORDER.filter(function (g) { return per[g]; });
    if (keys.length) {
      s.appendChild(h("h2", { text: "Score by block" }));
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
        s.appendChild(h("h2", { text: "To review (below 70%)" }));
        var ul = h("ul", { class: "q-miss" });
        fracos.forEach(function (g) {
          var mods = {};
          QUIZ.forEach(function (q) { if (q.group === g) q.mods.forEach(function (n, i) { mods[n] = q.modSlugs[i]; }); });
          var li = h("li", null, h("p", { class: "q-m-q", text: BLOCKS[g].name + " (" + BLOCKS[g].range + ")" }));
          var links = h("p", { class: "pf-links" });
          Object.keys(mods).sort(function (a, b) { return a - b; }).forEach(function (n, i) {
            if (i) links.appendChild(document.createTextNode(" · "));
            links.appendChild(h("a", { href: "../../" + mods[n] + "/", target: "_blank", rel: "noopener", text: "module " + n + " ↗" }));
          });
          li.appendChild(links);
          ul.appendChild(li);
        });
        s.appendChild(ul);
      }
    }

    if (wrong.length) {
      s.appendChild(h("h2", { text: "To go over" }));
      var miss = h("ul", { class: "q-miss" });
      wrong.forEach(function (x) {
        miss.appendChild(h("li", null,
          h("p", { class: "q-m-q", text: x.q.prompt }),
          h("p", { class: "q-m-a" }, "Right: ", h("b", { text: x.q.options[x.q.answer] })),
          modLinks(x.q)));
      });
      s.appendChild(miss);
    }

    var wrongQs = wrong.map(function (x) { return x.q; });
    var actions = h("div", { class: "q-actions", style: "flex-direction:column" });
    if (wrongQs.length) {
      var rev = h("button", { class: "q-btn q-primary", type: "button", text: "Review only the ones I got wrong (" + wrongQs.length + ")" });
      rev.addEventListener("click", function () { startRound(wrongQs, "review"); });
      actions.appendChild(rev);
    }
    var again = h("button", { class: "q-btn q-ghost", type: "button", text: "Back to the start" });
    again.addEventListener("click", home);
    actions.appendChild(again);
    s.appendChild(h("div", { class: "q-gap" }));
    s.appendChild(actions);

    round = null;
    show(s, title);
  }

  /* ---------- keyboard ---------- */
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
    app.appendChild(h("p", { class: "q-card", text: "Could not load the questions (questions.js)." }));
  } else {
    home();
  }
})();
