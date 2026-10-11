// "O dado agora": o que o dado é em cada passo da figura OSI, mostrado como uma FAIXA na ordem do fio
// (cabeçalhos na frente, dados no meio, conferência no fim) + um cartão "entrou/saiu agora" explicando a peça.
// Injetado pelo osi-figure.mjs (2D) e pelo osi-3d/build.mjs (3D). Valores são exemplos coerentes entre si.

const osiDataView = (() => {
  const HEX = "8f 2a c1 77 0e 9b 4d e2 51 f0 3a 6c b8 19 d4 07 a3 5e 2c 91 7b e8 06 4f".split(" ");
  const hex = (n) => HEX.slice(0, n).join(" ");
  let UDP = false;   // cenário "ligação": UDP no lugar do TCP

  // ── peças: rótulo curto na faixa, nome completo, camada, tamanho, para que serve, campos ──
  const PART = () => ({
    mac: { t: "MAC", name: "Cabeçalho de enlace (MAC)", L: 2, size: "14 B", why: "Endereço do próximo salto apenas: o roteador de casa. Muda a cada roteador do caminho.", f: ["de a4:5e:60:1c:22:9b (celular da Lena)", "para 3c:84:6a:0f:11:e2 (roteador de casa)"] },
    ip: { t: "IP", name: "Cabeçalho IP", L: 3, size: "20 B", why: "Endereço final, que não muda até Tóquio. É o que cada roteador lê para escolher o caminho.", f: ["de 192.168.0.12", "para 198.51.100.7", "TTL 64 (cai 1 a cada roteador)"] },
    tcp: UDP
      ? { t: "UDP", name: "Cabeçalho UDP", L: 4, size: "8 B", why: "Só o mínimo: portas, tamanho e checksum. Sem número de sequência, sem confirmação, sem reenvio.", f: ["porta 50000 → 3478", "tamanho e checksum"] }
      : { t: "TCP", name: "Cabeçalho TCP", L: 4, size: "20 B", why: "Diz de qual app para qual app (portas) e qual é a posição desta fatia (seq), para remontar na ordem e pedir de novo o que faltar.", f: ["porta 51234 → 443", "seq 1: esta é a fatia #1 de 215"] },
    fcs: { t: "FCS", name: "Conferência (FCS)", L: 2, size: "4 B", why: "Uma conta feita sobre o quadro inteiro. Do outro lado a conta é refeita: se não bater, algum bit estragou e o quadro é descartado.", f: ["CRC-32 do quadro"] },
    tls: { t: "TLS", name: "Cabeçalho TLS", L: 6, size: "5 B", why: "Avisa que o que vem depois são dados cifrados e quantos bytes são.", f: ["tipo 17 = dados de aplicação", "versão e tamanho"] },
    tag: { t: "tag", name: "Tag de autenticação (TLS)", L: 6, size: "16 B", why: "Uma assinatura no fim. Se alguém mexer em 1 bit no caminho, a conta não fecha e o celular descarta.", f: ["16 bytes calculados com a chave da sessão"] },
  });
  const seg = (id, st) => { const p = PART()[id]; return `<span class="dv-seg ${id === "fcs" || id === "tag" ? "t" : "h"} ${st || ""}"><b>${p.t}</b><small>${p.size}</small></span>`; };
  const payload = (label, size, st) => `<span class="dv-seg p ${st || ""}"><b>${label}</b><small>${size}</small></span>`;
  // a faixa: ids antes do payload, o payload, ids depois; marca o que entrou ou saiu
  const strip = (before, pay, after, add = [], out = []) => {
    const mk = (id) => seg(id, add.includes(id) ? "is-new" : out.includes(id) ? "is-out" : "");
    return `<div class="dv-strip" role="img" aria-label="Ordem no fio: ${[...before, "dados", ...after].join(", ")}">${before.map(mk).join("")}${pay}${after.map(mk).join("")}</div>
      <div class="dv-legend"><span>← sai primeiro pelo fio</span><span>cabeçalhos na frente · dados no meio · conferência no fim</span></div>`;
  };
  const card = (ids, kind, extra = "") => ids.map((id) => { const p = PART()[id];
    return `<div class="dv-card ${kind}"><div class="dv-card-h"><span>${kind === "is-new" ? "Entrou agora" : kind === "is-out" ? "Saiu agora" : "Mudou"}</span><b>${p.name}</b><em>camada ${p.L} · ${p.size}</em></div>
      <p>${p.why}</p><ul>${p.f.map((x) => `<li>${x}</li>`).join("")}</ul>${extra}</div>`; }).join("");
  const note = (t) => `<p class="dv-note2">${t}</p>`;

  // ── peças visuais ──
  const catSvg = (w = 56) => `<svg class="dv-cat" viewBox="0 0 100 100" width="${w}" height="${w}" aria-hidden="true"><path d="M18 44 L24 8 L42 28 L58 28 L76 8 L82 44 Q90 88 50 92 Q10 88 18 44 Z"/><g class="dv-cat-in"><ellipse cx="36" cy="54" rx="7" ry="9"/><ellipse cx="64" cy="54" rx="7" ry="9"/><path d="M45 68 L55 68 L50 74 Z"/></g><g class="dv-cat-pu"><ellipse cx="36" cy="55" rx="2.4" ry="6.5"/><ellipse cx="64" cy="55" rx="2.4" ry="6.5"/></g><path class="dv-cat-wh" d="M40 72 L14 68 M40 76 L14 77 M40 80 L14 86 M60 72 L86 68 M60 76 L86 77 M60 80 L86 86"/></svg>`;
  const camSvg = () => `<svg class="dv-cat" viewBox="0 0 60 48" width="60" height="48" aria-hidden="true"><rect x="2" y="10" width="38" height="28" rx="5"/><path d="M42 18 L58 10 L58 38 L42 30 Z"/></svg>`;
  const photo = (st, sub) => `<div class="dv-photo ${st || ""}">${catSvg()}<div><b>foto.jpg</b><small>${sub}</small></div></div>`;
  const call = (st, sub) => `<div class="dv-photo ${st || ""}">${camSvg()}<div><b>chamada de vídeo</b><small>${sub}</small></div></div>`;
  const http = () => `<pre class="dv-text is-new"><span class="dv-hl">POST /v1/fotos HTTP/1.1
Host: api.chat.exemplo
Content-Type: image/jpeg
Content-Length: 7680000</span></pre>
    <div class="dv-photo dv-body">${catSvg(40)}<div><b>corpo do pedido: a foto</b><small>7,68 MB de bytes da imagem (começam com ff d8 ff e0, a assinatura do JPEG)</small></div></div>`;
  const sizes = (comp) => `<div class="dv-sizes">
    <div class="dv-size"><span>original</span><i style="width:100%"></i><b>7,68 MB</b></div>
    <div class="dv-size ${comp ? "is-on" : ""}"><span>comprimido</span><i style="width:${comp ? 4.1 : 100}%"></i><b>313 KB</b></div></div>`;
  const slices = (done) => { let r = "";
    for (let i = 0; i < 215; i++) r += `<i class="${i === 0 ? "is-first" : ""} ${done ? (UDP && i === 6 ? "is-gap" : "is-ok") : ""}"></i>`;
    return `<div class="dv-slices" aria-label="215 fatias">${r}</div>
      <div class="dv-legend"><span>cada quadradinho = 1 fatia de ~1.460 B</span><span>${done ? (UDP ? "o vazado é o pedaço que se perdeu" : "todas chegaram e estão em ordem") : "o destacado é a fatia #1, a que vamos seguir"}</span></div>`; };
  const bits = (rx) => {
    const bytes = [0x3c, 0x84], b = bytes.map((v) => v.toString(2).padStart(8, "0")).join(""), W = 18;
    let d = "M0 " + (b[0] === "1" ? 6 : 28), x = 0, prev = b[0], t = "";
    for (const [i, c] of [...b].entries()) { const y = c === "1" ? 6 : 28; if (c !== prev) d += ` L${x} ${y}`; x += W; d += ` L${x} ${y}`; prev = c;
      t += `<text x="${i * W + W / 2}" y="46" text-anchor="middle">${c}</text>`; }
    return `<div class="dv-bits"><span>os 2 primeiros bytes do quadro:</span><code>3c 84</code><span>=</span><code>0011 1100 · 1000 0100</code></div>
      <svg class="dv-wave" viewBox="0 0 ${b.length * W} 50" aria-hidden="true"><path d="${d}"/><line x1="${8 * W}" y1="0" x2="${8 * W}" y2="34" class="dv-wave-sep"/>${t}</svg>
      <div class="dv-legend"><span>1 = sinal alto · 0 = sinal baixo</span><span>esses bytes são o começo do MAC do roteador</span></div>
      <div class="dv-media"><span>rádio (Wi-Fi) até o roteador</span><span>pulsos no cobre</span><span>luz na fibra do oceano</span></div>`
      + note(rx ? "Do lado do irmão o caminho é o inverso: luz, depois elétrico, depois rádio, e o celular remonta os bits do quadro." : "Os mesmos bits mudam de forma no caminho (rádio, cobre, luz), mas o conteúdo não muda.");
  };

  const PAY = () => payload(UDP ? "pedaço de mídia cifrado" : "fatia #1 cifrada", UDP ? "~1.200 B" : "1.460 B");
  const FRAME = (add, out, extra) => strip(["mac", "ip", "tcp"], PAY(), ["fcs"], add, out) + (extra || "");
  const VIEWS = [
    () => photo("", "7,68 MB · por enquanto é só uma imagem no app") + note("Ainda não tem nada de rede aqui: nenhum cabeçalho, nenhum endereço."),
    () => http() + note("O app escreve o pedido: o que quer (POST /v1/fotos), para onde (Host) e o que vai junto (a foto)."),
    () => sizes(true) + strip(["tls"], payload("pedido HTTP + foto, cifrados", "313 KB", "is-new"), ["tag"], ["tls", "tag"]) + card(["tls", "tag"], "is-new")
      + note("Quem interceptar só vê bytes sem sentido: " + hex(8) + " …"),
    () => `<div class="dv-badge is-new">sessão 9f3a… aberta entre os dois apps</div>` + strip(["tls"], payload("pedido HTTP + foto, cifrados", "313 KB"), ["tag"]) + note("Os bytes não mudaram. A sessão é o estado da conversa (quem fala com quem, de onde retomar), não um cabeçalho novo."),
    () => slices(false) + strip(["tcp"], PAY(), [], ["tcp"]) + card(["tcp"], "is-new"),
    () => strip(["ip", "tcp"], PAY(), [], ["ip"]) + card(["ip"], "is-new"),
    () => FRAME(["mac", "fcs"], [], card(["mac", "fcs"], "is-new") + note("Pronto: o quadro completo. Pacote dentro de pacote dentro de pacote: isso é encapsulamento.")),
    () => bits(false),
    () => FRAME([], [], `<div class="dv-card is-chg"><div class="dv-card-h"><span>Em cada roteador</span><b>o que muda e o que não muda</b><em>camadas 2 e 3</em></div>
        <ul><li><b>MAC:</b> trocado (agora "para o roteador seguinte")</li><li><b>FCS:</b> recalculado, porque o quadro mudou</li><li><b>IP de destino:</b> igual, 198.51.100.7</li><li><b>TTL:</b> 64 → 63 → 62… (se chegar a 0, o pacote é descartado)</li><li><b>${UDP ? "UDP" : "TCP"} e os dados:</b> nem são abertos</li></ul></div>`),
    () => bits(true),
    () => FRAME([], ["mac", "fcs"], card(["fcs", "mac"], "is-out") + note("Conferido: o FCS bateu (nenhum bit estragou) e o MAC de destino é o do celular do irmão.")),
    () => strip(["ip", "tcp"], PAY(), [], [], ["ip"]) + card(["ip"], "is-out") + note("Conferido: o IP de destino é o dele."),
    () => slices(true) + strip(["tcp"], payload(UDP ? "pedaços de mídia" : "215 fatias em ordem", UDP ? "#5 #6 · #8" : "313 KB"), [], [], ["tcp"]) + card(["tcp"], "is-out")
      + note(UDP ? "Faltou um pedaço e ninguém pediu de novo: a imagem dá uma travadinha e a chamada segue." : "As 215 fatias foram juntadas pela numeração, e as que faltaram foram pedidas de novo."),
    () => `<div class="dv-badge is-out">sessão 9f3a… (segue aberta)</div>` + strip(["tls"], payload("pedido HTTP + foto, cifrados", "313 KB"), ["tag"]) + note("Sem bytes novos: a sessão só confirma de qual conversa esses dados são."),
    () => strip(["tls"], payload("decifrado: pedido HTTP + foto", "313 KB → 7,68 MB", "is-ok"), ["tag"], [], ["tls", "tag"]) + note("A tag conferiu (ninguém mexeu), o TLS decifrou e a foto foi descomprimida."),
    () => photo("is-new", "7,68 MB · aparece no chat do irmão") + note("Cada cabeçalho foi tirado pela mesma camada que o colocou na ida."),
  ];
  const UDP_VIEWS = {
    0: () => call("", "voz e imagem ao vivo, ~50 pedaços por segundo") + note("Agora o dado nasce a cada instante na câmera e no microfone. Chegar atrasado é pior do que perder um pedacinho."),
    1: () => `<pre class="dv-text is-new"><span class="dv-hl">WebRTC · fluxo de mídia
áudio: Opus · vídeo: VP8</span></pre>` + note("Nada de pedir e esperar resposta: os pedaços saem sem parar."),
    2: () => strip(["tls"], payload("quadro de vídeo cifrado", "~1 KB", "is-new"), [], ["tls"]).replace(/<b>TLS<\/b><small>5 B/, "<b>SRTP</b><small>~12 B") + note("O codec comprime cada pedacinho e o SRTP cifra. Cada pedaço é pequeno e independente."),
    3: () => `<div class="dv-badge is-new">chamada aberta · 00:03</div>` + note("A sessão é a própria chamada: quem fala com quem, com que codec, há quanto tempo."),
    13: () => `<div class="dv-badge is-out">chamada aberta · 00:04</div>` + note("A sessão confirma que esses pedaços são desta chamada."),
    14: () => call("is-ok", "decodificado: voz e imagem de volta") + note("O SRTP decifra e o codec remonta voz e imagem, mesmo com um pedacinho a menos."),
    15: () => call("is-new", "a chamada continua ao vivo") + note("Para voz, vídeo e jogos, chegar agora importa mais que chegar completo."),
  };
  return (s, halted, mode) => { UDP = mode === "udp"; const v = UDP && UDP_VIEWS[s] ? UDP_VIEWS[s] : VIEWS[s];
    return (halted ? `<p class="dv-cap dv-bad">A viagem parou aqui. Do outro lado nada chega: nenhum byte deste passo em diante.</p>` : "") + v(); };
})();
