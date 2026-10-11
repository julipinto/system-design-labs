// "O dado agora": o que o dado é, byte a byte, em cada passo da figura OSI.
// Este arquivo é injetado pelo osi-figure.mjs dentro do script da figura (não é carregado sozinho).
// Todos os valores (IPs, portas, MACs, bytes) são exemplos coerentes entre si.

const osiDataView = (() => {
  const HEX = "8f 2a c1 77 0e 9b 4d e2 51 f0 3a 6c b8 19 d4 07 a3 5e 2c 91 7b e8 06 4f".split(" ");
  const SRC_IP = "192.168.0.12", DST_IP = "198.51.100.7";
  const PHONE_MAC = "a4:5e:60:1c:22:9b", HOME_MAC = "3c:84:6a:0f:11:e2";
  const CAT = [".X......X.", ".XX....XX.", ".XXXXXXXX.", "XX.XXXX.XX", "XXXXXXXXXX", "XXXX..XXXX", ".XXXXXXXX.", "..XXXXXX.."];

  const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const cat = (big) => {
    const px = big ? 9 : 6;
    let r = "";
    CAT.forEach((row, y) => [...row].forEach((c, x) => { if (c === "X") r += `<rect x="${x * px}" y="${y * px}" width="${px - 1}" height="${px - 1}" rx="1"/>`; }));
    return `<svg class="dv-cat" viewBox="0 0 ${10 * px} ${8 * px}" width="${10 * px}" height="${8 * px}" aria-hidden="true">${r}</svg>`;
  };
  // um cabeçalho ou trailer: camada, nome, campos, tamanho; estado: "" | "is-new" | "is-out" | "is-ok"
  const box = (L, title, fields, size, state = "", note = "") =>
    `<div class="dv-box ${state}"><span class="dv-l">${L}</span><b>${title}</b>${fields.map((f) => `<small>${f}</small>`).join("")}${size ? `<em>${size}</em>` : ""}${note ? `<i class="dv-note">${note}</i>` : ""}</div>`;
  const pay = (title, text, size, state = "") =>
    `<div class="dv-box dv-pay ${state}"><b>${title}</b><small class="dv-mono">${text}</small>${size ? `<em>${size}</em>` : ""}</div>`;
  const row = (...parts) => `<div class="dv-row">${parts.join("")}</div>`;
  const cap = (t) => `<p class="dv-cap">${t}</p>`;
  const hex = (n, from = 0) => HEX.slice(from, from + n).join(" ");

  const eth = (st, note) => box(2, "Enlace", [`de ${PHONE_MAC}`, `para ${HOME_MAC}`, `<span>(o roteador de casa)</span>`], "14 B", st, note);
  const ip = (st, note, ttl = 64) => box(3, "IP", [`de ${SRC_IP}`, `para ${DST_IP}`, `TTL ${ttl}`], "20 B", st, note);
  let UDP = false;   // cenário "ligação": UDP no lugar do TCP
  const tcp = (st, note) => UDP
    ? box(4, "UDP", ["porta 50000 → 3478", "tamanho · checksum", "sem seq, sem ACK"], "8 B", st, note && note.replace(/215 de 215, em ordem/, "chegou o que deu"))
    : box(4, "TCP", ["porta 51234 → 443", "seq 1 · fatia 1 de 215"], "20 B", st, note);
  const tls = (st) => box(6, "TLS", ["17 03 03 = dados cifrados"], "5 B", st);
  const tag = (st) => box(6, "TLS tag", ["prova que ninguém mexeu"], "16 B", st);
  const fcs = (st, note) => box(2, "FCS", ["CRC-32 do quadro"], "4 B", st, note);
  const slice = (st = "") => pay("1.460 B cifrados", `${hex(10)} …`, "", st);

  const http = (st = "") => `<pre class="dv-text ${st}"><span class="dv-hl">POST /v1/fotos HTTP/1.1
Host: api.chat.exemplo
Content-Type: image/jpeg
Content-Length: 7680000</span>

<span class="dv-dim">(linha em branco: aqui acabam os cabeçalhos)</span></pre>
<div class="dv-photo dv-body">${cat(false)}<div><b>corpo do pedido: a foto</b><small>7,68 MB de bytes da imagem, que começam com ff d8 ff e0 (assinatura do JPEG)</small></div></div>`;

  const sizes = (comp) => `<div class="dv-sizes">
    <div class="dv-size"><span>original</span><i style="width:100%"></i><b>7,68 MB</b></div>
    <div class="dv-size ${comp ? "is-on" : ""}"><span>comprimido</span><i style="width:${comp ? 4.1 : 100}%"></i><b>313 KB</b></div>
  </div>`;

  const cipher = (st = "") => row(tls(st), pay("HTTP + foto, cifrados", `${hex(16)} …`, "313 KB", st === "is-new" ? "is-new" : ""), tag(st));

  const slices = (done) => {
    let r = "";
    for (let i = 0; i < 215; i++) r += `<i class="${i === 0 ? "is-first" : ""} ${done ? (UDP && i === 6 ? "is-gap" : "is-ok") : ""}"></i>`;
    return `<div class="dv-slices" aria-label="215 fatias">${r}</div>`;
  };

  const bits = () => {
    const bytes = [0x3c, 0x84, 0x6a, 0x0f];
    const b = bytes.map((v) => v.toString(2).padStart(8, "0")).join("");
    let d = "M0 " + (b[0] === "1" ? 4 : 22), x = 0, prev = b[0];
    for (const c of b) { const y = c === "1" ? 4 : 22; if (c !== prev) d += ` L${x} ${y}`; x += 9; d += ` L${x} ${y}`; prev = c; }
    return `<div class="dv-bits"><span>começo do quadro (o MAC de destino):</span><code>${bytes.map((v) => v.toString(16).padStart(2, "0")).join(" ")} …</code><span>→</span><code>${b.match(/.{8}/g).join(" ")} …</code></div>
      <svg class="dv-wave" viewBox="0 0 ${b.length * 9} 26" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>
      <div class="dv-media"><span>rádio (Wi-Fi)</span><span>pulsos no cobre</span><span>luz na fibra</span></div>`;
  };

  const VIEWS = [
    () => `<div class="dv-photo">${cat(true)}<div><b>foto.jpg</b><small>7,68 MB de pixels</small></div></div>` + cap("Para o app, o dado é só uma imagem. Ainda não tem nenhum cabeçalho de rede."),
    () => http("is-new") + cap("O app escreve um <b>pedido HTTP</b>: linhas de texto legível (o cabeçalho) e, no corpo, os bytes da imagem."),
    () => sizes(true) + cipher("is-new") + cap("A foto é <b>comprimida</b> (7,68 MB → 313 KB) e o pedido inteiro, cabeçalho HTTP incluído, vira bytes <b>cifrados</b>. Quem interceptar só vê <code>8f 2a c1…</code>. O TLS cifra em registros de até 16 KB; aqui aparece como um bloco só."),
    () => `<div class="dv-badge is-new">sessão 9f3a… aberta entre os dois apps</div>` + cipher() + cap("Os bytes não mudam aqui. Na prática a <b>sessão</b> não ganha cabeçalho próprio: é o estado da conversa (a sessão TLS, quem fala com quem, de onde retomar). No desenho, o andar 5 põe um envelope fino só para marcar esse passo."),
    () => slices(false) + row(tcp("is-new"), slice()) + cap("O TCP corta os 313 KB em <b>215 fatias</b> de ~1.460 B. Cada fatia ganha um <b>cabeçalho TCP</b> na frente: portas e o número de sequência, para remontar na ordem."),
    () => row(ip("is-new"), tcp(), slice()) + cap("Cada fatia ganha um <b>cabeçalho IP</b> na frente: de onde vem e para onde vai. O IP de destino não muda até Tóquio."),
    () => row(eth("is-new"), ip(), tcp(), slice(), fcs("is-new")) + cap("O <b>quadro</b> completo, na ordem em que vai pelo fio: MAC na frente (só até o roteador de casa) e o FCS no fim, para detectar bits corrompidos."),
    () => bits() + cap("Os bytes do quadro viram <b>0 e 1</b>, e os bits viram sinal: rádio até o roteador, pulsos elétricos no cobre, luz na fibra do oceano."),
    () => row(box(2, "Enlace", ["de roteador A", "para roteador B <span>(novo)</span>"], "14 B", "is-new", "trocado"), box(3, "IP", [`de ${SRC_IP}`, `para ${DST_IP}`, "TTL 63"], "20 B", "is-ok", "destino igual · TTL −1"), tcp(), slice(), fcs("is-new", "recalculado")) + cap("Em cada roteador: abre até o IP, lê o <b>destino</b> (igual), diminui o <b>TTL</b>, troca o <b>MAC</b> pelo do próximo salto e recalcula o FCS."),
    () => bits() + cap("Em Tóquio, luz vira sinal elétrico e rádio, e o celular do irmão <b>reconstrói os bits</b> do quadro."),
    () => row(eth("is-out", "✓ MAC é o meu"), ip(), tcp(), slice(), fcs("is-out", "✓ FCS confere")) + cap("O enlace confere o <b>FCS</b> (bits intactos) e o <b>MAC</b> de destino. Tira o cabeçalho e o trailer do quadro."),
    () => row(ip("is-out", "✓ IP é o meu", 52), tcp(), slice()) + cap("O IP de destino é o dele. Sai o <b>cabeçalho IP</b>."),
    () => slices(true) + row(tcp("is-out", "✓ 215 de 215, em ordem"), slice()) + cap("O TCP junta as <b>215 fatias</b> pelo número de sequência, pede de novo as que faltaram e confirma com ACK. Sai o cabeçalho TCP."),
    () => `<div class="dv-badge is-out">sessão 9f3a… (segue aberta)</div>` + cipher() + cap("De novo, sem bytes novos: a sessão só confirma de qual conversa esses dados são."),
    () => row(tls("is-out"), pay("decifrado", "POST /v1/fotos HTTP/1.1 …", "313 KB", "is-ok"), tag("is-out")) + sizes(false) + cap("O TLS <b>decifra</b> (e confere a tag) e a foto é <b>descomprimida</b>: o pedido HTTP volta a ser texto legível + imagem."),
    () => `<div class="dv-photo is-new">${cat(true)}<div><b>foto.jpg</b><small>7,68 MB · aparece no app</small></div></div>` + cap("O app lê o HTTP e mostra a <b>foto</b>. Cada cabeçalho foi tirado pela mesma camada que o colocou."),
  ];

  const call = (st) => `<div class="dv-photo ${st || ""}"><svg class="dv-cat" viewBox="0 0 60 48" width="60" height="48" aria-hidden="true"><rect x="2" y="10" width="38" height="28" rx="5"/><path d="M42 18 L58 10 L58 38 L42 30 Z"/></svg><div><b>chamada de vídeo</b><small>voz e imagem ao vivo, ~50 pedaços por segundo</small></div></div>`;
  const UDP_VIEWS = {
    0: () => call() + cap("Agora o dado não é uma foto pronta: é <b>voz e vídeo ao vivo</b>, saindo em fluxo. Aqui chegar atrasado é pior do que perder um pedacinho."),
    1: () => `<pre class="dv-text is-new"><span class="dv-hl">WebRTC · fluxo de mídia
áudio: Opus · vídeo: VP8</span>
<span class="dv-dim">(nada de pedir e esperar resposta: os pedaços saem sem parar)</span></pre>` + cap("O app de chamada não manda um pedido HTTP com tudo de uma vez: ele abre um <b>fluxo</b> e manda pedaços o tempo todo."),
    2: () => row(box(6, "SRTP", ["mídia cifrada"], "~10 B", "is-new"), pay("quadro de vídeo cifrado", `${hex(12)} …`, "~1 KB", "is-new")) + cap("O <b>codec</b> comprime cada pedacinho de voz e imagem e o <b>SRTP</b> cifra. Cada pedaço é pequeno e independente."),
    3: () => `<div class="dv-badge is-new">chamada aberta · 00:03</div>` + cap("A <b>sessão</b> é a própria chamada: quem fala com quem, com que codec, há quanto tempo."),
    4: () => slices(false) + row(tcp("is-new"), pay("~1.200 B de mídia cifrada", `${hex(10)} …`, "")) + cap("Cada pedaço de mídia vai num datagrama com o <b>cabeçalho UDP</b>: só portas, tamanho e checksum. Sem número de sequência na rede, sem confirmação, sem reenvio."),
    12: () => slices(true) + row(tcp("is-out", "✓ chegou o que deu"), pay("pedaços de mídia", "#5 #6 · · #8 #9", "")) + cap("Faltou o <b>#7</b>. O UDP não espera e não pede de novo: a imagem dá uma travadinha de milissegundos e a chamada segue."),
    14: () => call("is-ok") + cap("O SRTP decifra e o codec monta voz e imagem de novo, mesmo com um pedacinho a menos."),
    15: () => call("is-new") + cap("A chamada continua ao vivo. Para voz, vídeo e jogos, <b>chegar agora</b> importa mais que <b>chegar completo</b>."),
  };
  return (s, halted, mode) => { UDP = mode === "udp"; const v = UDP && UDP_VIEWS[s] ? UDP_VIEWS[s] : VIEWS[s];
    return (halted ? `<p class="dv-cap dv-bad">A viagem parou aqui. Do outro lado nada chega: nenhum byte deste passo em diante.</p>` : "") + v(); };
})();
