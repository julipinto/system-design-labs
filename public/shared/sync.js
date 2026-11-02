/* SDLabs · progresso entre aparelhos: login (Google pelo Supabase) e sincronização.
   O núcleo (carimbos e junção) está em sync-core.js, carregado antes. Este arquivo:
   1. liga o "Entrar" do topo e o modal (src/components/Account.astro), quando existem na página;
   2. carrega o supabase-js (vendor/) só se há sessão salva, se a página volta do Google, ou no clique em Entrar;
   3. sincroniza ao carregar, depois de cada mudança (com espera de 3 s) e ao sair da aba.
   Sem rede ou com o projeto pausado, nada quebra: o progresso fica no navegador e sobe na próxima vez. */
(function () {
  'use strict';
  var S = window.SDLSync;
  if (!S) return;
  var URL_ = 'https://evcsiwtgfckpdkfwynbh.supabase.co';
  var KEY = 'sb_publishable_Mwhbx3qfxabNm1TlrQlwYg_jfCoOPRH';
  var TOKEN = 'sb-evcsiwtgfckpdkfwynbh-auth-token';
  var WHO = 'sdl-sync:who', LAST = 'sdl-sync:last', RELOADED = 'sdl-sync:reloaded';
  var me = document.currentScript;
  var LIB = (me && me.src ? me.src.replace(/sync\.js(\?.*)?$/, '') : '/system-design-labs/shared/') + 'vendor/supabase-2.118.0.js';

  var btn = document.querySelector('[data-acct]'), dlg = document.getElementById('acct-dlg');
  var client = null, libP = null, user = null, timer = 0, busy = false, again = false;

  function get(k) { return S.rawGet(k); }
  function set(k, v) { S.rawSet(k, v); }
  function returning() { return /[?&]code=/.test(location.search) || /access_token=|error_description=/.test(location.hash); }
  function hasToken() { return get(TOKEN) != null; }

  /* ---------- biblioteca e cliente ---------- */
  function lib() {
    if (libP) return libP;
    libP = new Promise(function (ok, fail) {
      if (window.supabase && window.supabase.createClient) return ok();
      var s = document.createElement('script');
      s.src = LIB; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { libP = null; fail(new Error('lib')); };
      document.head.appendChild(s);
    }).then(function () {
      client = client || window.supabase.createClient(URL_, KEY, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: TOKEN }
      });
      client.auth.onAuthStateChange(function (ev, session) {
        user = session && session.user || null;
        if (ev === 'SIGNED_OUT') { user = null; try { localStorage.removeItem(WHO); } catch (e) { /* bloqueado */ } }
        paint();
      });
      return client;
    });
    return libP;
  }

  function cleanUrl() {
    if (!returning()) return;
    var u = new URL(location.href);
    ['code', 'state', 'error', 'error_code', 'error_description'].forEach(function (k) { u.searchParams.delete(k); });
    if (/access_token=|error_description=/.test(u.hash)) u.hash = '';
    history.replaceState(history.state, '', u.pathname + u.search + u.hash);
  }

  /* ---------- sincronizar ---------- */
  function status(kind, extra) {
    if (!dlg) return;
    var p = dlg.querySelector('.acct-status');
    if (!p) return;
    p.dataset.kind = kind;
    p.textContent = kind === 'syncing' ? dlg.dataset.syncing
      : kind === 'synced' ? dlg.dataset.synced + extra
      : kind === 'offline' ? dlg.dataset.offline : dlg.dataset.never;
    if (btn) btn.dataset.state = kind;
  }
  function hhmm(t) { var d = new Date(t * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  function sync() {
    if (!client || !user) return Promise.resolve();
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; status('syncing');
    var uid = user.id;
    return client.from('progress').select('data').eq('user_id', uid).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      var remote = r.data ? r.data.data : null;
      var res = S.absorb(remote);
      var push = !remote || !S.same(res.doc, remote);
      return (push ? client.from('progress').upsert({ user_id: uid, data: res.doc }) : Promise.resolve({})).then(function (w) {
        if (w && w.error) throw w.error;
        var t = S.now();
        set(LAST, String(t));
        status('synced', hhmm(t));
        // a página leu o progresso antes da junção: recarrega uma vez para mostrar o estado novo
        if (res.changed.length) {
          var last = 0;
          try { last = +sessionStorage.getItem(RELOADED) || 0; } catch (e) { /* bloqueado */ }
          if (Date.now() - last > 15000) {
            try { sessionStorage.setItem(RELOADED, String(Date.now())); } catch (e) { /* bloqueado */ }
            location.reload();
          }
        }
      });
    }).catch(function () { status('offline'); }).then(function () {
      busy = false;
      if (again) { again = false; schedule(500); }
    });
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(sync, ms); }

  addEventListener('sdl-progress-change', function () { if (user) schedule(3000); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && user && timer) { clearTimeout(timer); timer = 0; sync(); }
    else if (document.visibilityState === 'visible' && user) schedule(1000);  // volta à aba: pode ter mudado em outro aparelho
  });

  function start() {
    return lib().then(function (c) { return c.auth.getSession(); }).then(function (r) {
      cleanUrl();
      user = r.data && r.data.session ? r.data.session.user : null;
      paint();
      if (user) return sync();
    }).catch(function () { cleanUrl(); if (hasToken()) status('offline'); paint(); });
  }

  /* ---------- topo e modal ---------- */
  function initial(u) {
    var m = u && u.user_metadata || {}, n = (m.full_name || m.name || u && u.email || '?').trim();
    return n.charAt(0).toUpperCase();
  }
  function paint() {
    if (user) { try { localStorage.setItem(WHO, JSON.stringify({ e: user.email || '', i: initial(user) })); } catch (e) { /* bloqueado */ } }
    var who = user ? { e: user.email || '', i: initial(user) } : (hasToken() ? JSON.parse(get(WHO) || 'null') : null);
    if (btn) {
      btn.hidden = false;
      var on = !!who, av = btn.querySelector('.acct-av'), txt = btn.querySelector('.acct-in');
      btn.classList.toggle('is-on', on);
      av.hidden = !on; txt.hidden = on;
      av.textContent = on ? who.i : '';
      btn.setAttribute('aria-label', on ? btn.dataset.ariaOn.replace('{e}', who.e) : btn.getAttribute('data-aria-off') || btn.getAttribute('aria-label'));
    }
    if (dlg) {
      var signed = !!who;
      dlg.querySelector('.acct-out').hidden = signed;
      dlg.querySelector('.acct-on').hidden = !signed;
      dlg.querySelector('#acct-h').textContent = signed ? dlg.dataset.titleOn : dlg.dataset.titleOut;
      if (signed) {
        dlg.querySelector('.acct-email').textContent = who.e;
        var p = dlg.querySelector('.acct-status');
        if (p && !p.dataset.kind) { var l = +get(LAST) || 0; status(l ? 'synced' : 'never', l ? hhmm(l) : ''); }
      }
    }
  }

  if (btn && dlg) {
    btn.setAttribute('data-aria-off', btn.getAttribute('aria-label'));
    btn.addEventListener('click', function () {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      if (!client) lib().catch(function () { /* o clique em Google tenta de novo */ });
    });
    dlg.querySelector('[data-acct-close]').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });  // clique fora do cartão
    var err = dlg.querySelector('.acct-err');
    dlg.querySelector('[data-acct-google]').addEventListener('click', function () {
      err.hidden = true;
      var back = location.href.split('#')[0];
      lib().then(function (c) {
        return c.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } });
      }).then(function (r) { if (r && r.error) throw r.error; })
        .catch(function () { err.textContent = dlg.dataset.error; err.hidden = false; });
    });
    dlg.querySelector('[data-acct-out]').addEventListener('click', function () {
      var done = function () { user = null; try { localStorage.removeItem(WHO); localStorage.removeItem(TOKEN); } catch (e) { /* bloqueado */ } paint(); dlg.close(); };
      (client ? client.auth.signOut({ scope: 'local' }) : Promise.resolve()).then(done, done);
    });
  }

  paint();
  if (hasToken() || returning()) start();
})();
