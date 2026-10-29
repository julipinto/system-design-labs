// "The data now": what the data is at each step of the OSI figure, shown as a STRIP in wire order
// (headers in front, data in the middle, check at the end) + a card "just came in / just came off" explaining the piece.
// English copy of osi-data.js, injected by osi-3d/build.mjs when FIG_LANG=en. Values are examples consistent with each other.

const osiDataView = (() => {
  const HEX = "8f 2a c1 77 0e 9b 4d e2 51 f0 3a 6c b8 19 d4 07 a3 5e 2c 91 7b e8 06 4f".split(" ");
  const hex = (n) => HEX.slice(0, n).join(" ");
  let UDP = false;   // "call" scenario: UDP instead of TCP

  // ── pieces: short label on the strip, full name, layer, size, what it is for, fields ──
  const PART = () => ({
    mac: { t: "MAC", name: "Data link header (MAC)", L: 2, size: "14 B", why: "The next hop's address only: the home router. It changes at every router on the path.", f: ["from a4:5e:60:1c:22:9b (Lena's phone)", "to 3c:84:6a:0f:11:e2 (home router)"] },
    ip: { t: "IP", name: "IP header", L: 3, size: "20 B", why: "The final address, which does not change all the way to Tokyo. Each router reads it to choose the path.", f: ["from 192.168.0.12", "to 198.51.100.7", "TTL 64 (drops by 1 at each router)"] },
    tcp: UDP
      ? { t: "UDP", name: "UDP header", L: 4, size: "8 B", why: "Just the minimum: ports, length and checksum. No sequence number, no acknowledgment, no resend.", f: ["port 50000 → 3478", "length and checksum"] }
      : { t: "TCP", name: "TCP header", L: 4, size: "20 B", why: "Says which app is talking to which app (ports) and where this slice sits (seq), so the receiver can reassemble in order and ask again for whatever is missing.", f: ["port 51234 → 443", "seq 1: this is slice #1 of 215"] },
    fcs: { t: "FCS", name: "Check (FCS)", L: 2, size: "4 B", why: "A calculation over the whole frame. The other side redoes it: if it does not match, some bit got corrupted and the frame is dropped.", f: ["CRC-32 of the frame"] },
    tls: { t: "TLS", name: "TLS header", L: 6, size: "5 B", why: "Announces that what follows is encrypted data and how many bytes it is.", f: ["type 17 = application data", "version and length"] },
    tag: { t: "tag", name: "Authentication tag (TLS)", L: 6, size: "16 B", why: "A signature at the end. If anyone changes 1 bit on the way, the calculation fails and the phone drops it.", f: ["16 bytes computed with the session key"] },
  });
  const seg = (id, st) => { const p = PART()[id]; return `<span class="dv-seg ${id === "fcs" || id === "tag" ? "t" : "h"} ${st || ""}"><b>${p.t}</b><small>${p.size}</small></span>`; };
  const payload = (label, size, st) => `<span class="dv-seg p ${st || ""}"><b>${label}</b><small>${size}</small></span>`;
  // the strip: ids before the payload, the payload, ids after; marks what came in or went out
  const strip = (before, pay, after, add = [], out = []) => {
    const mk = (id) => seg(id, add.includes(id) ? "is-new" : out.includes(id) ? "is-out" : "");
    return `<div class="dv-strip" role="img" aria-label="Order on the wire: ${[...before, "data", ...after].join(", ")}">${before.map(mk).join("")}${pay}${after.map(mk).join("")}</div>
      <div class="dv-legend"><span>← goes out on the wire first</span><span>headers in front · data in the middle · check at the end</span></div>`;
  };
  const card = (ids, kind, extra = "") => ids.map((id) => { const p = PART()[id];
    return `<div class="dv-card ${kind}"><div class="dv-card-h"><span>${kind === "is-new" ? "Just came in" : kind === "is-out" ? "Just came off" : "Changed"}</span><b>${p.name}</b><em>layer ${p.L} · ${p.size}</em></div>
      <p>${p.why}</p><ul>${p.f.map((x) => `<li>${x}</li>`).join("")}</ul>${extra}</div>`; }).join("");
  const note = (t) => `<p class="dv-note2">${t}</p>`;

  // ── visual pieces ──
  const catSvg = (w = 56) => `<svg class="dv-cat" viewBox="0 0 100 100" width="${w}" height="${w}" aria-hidden="true"><path d="M18 44 L24 8 L42 28 L58 28 L76 8 L82 44 Q90 88 50 92 Q10 88 18 44 Z"/><g class="dv-cat-in"><ellipse cx="36" cy="54" rx="7" ry="9"/><ellipse cx="64" cy="54" rx="7" ry="9"/><path d="M45 68 L55 68 L50 74 Z"/></g><g class="dv-cat-pu"><ellipse cx="36" cy="55" rx="2.4" ry="6.5"/><ellipse cx="64" cy="55" rx="2.4" ry="6.5"/></g><path class="dv-cat-wh" d="M40 72 L14 68 M40 76 L14 77 M40 80 L14 86 M60 72 L86 68 M60 76 L86 77 M60 80 L86 86"/></svg>`;
  const camSvg = () => `<svg class="dv-cat" viewBox="0 0 60 48" width="60" height="48" aria-hidden="true"><rect x="2" y="10" width="38" height="28" rx="5"/><path d="M42 18 L58 10 L58 38 L42 30 Z"/></svg>`;
  const photo = (st, sub) => `<div class="dv-photo ${st || ""}">${catSvg()}<div><b>foto.jpg</b><small>${sub}</small></div></div>`;
  const call = (st, sub) => `<div class="dv-photo ${st || ""}">${camSvg()}<div><b>video call</b><small>${sub}</small></div></div>`;
  const http = () => `<pre class="dv-text is-new"><span class="dv-hl">POST /v1/fotos HTTP/1.1
Host: api.chat.exemplo
Content-Type: image/jpeg
Content-Length: 7680000</span></pre>
    <div class="dv-photo dv-body">${catSvg(40)}<div><b>request body: the photo</b><small>7.68 MB of image bytes (they start with ff d8 ff e0, the JPEG signature)</small></div></div>`;
  const sizes = (comp) => `<div class="dv-sizes">
    <div class="dv-size"><span>original</span><i style="width:100%"></i><b>7.68 MB</b></div>
    <div class="dv-size ${comp ? "is-on" : ""}"><span>compressed</span><i style="width:${comp ? 4.1 : 100}%"></i><b>313 KB</b></div></div>`;
  const slices = (done) => { let r = "";
    for (let i = 0; i < 215; i++) r += `<i class="${i === 0 ? "is-first" : ""} ${done ? (UDP && i === 6 ? "is-gap" : "is-ok") : ""}"></i>`;
    return `<div class="dv-slices" aria-label="215 slices">${r}</div>
      <div class="dv-legend"><span>each little square = 1 slice of ~1,460 B</span><span>${done ? (UDP ? "the hollow one is the piece that got lost" : "all arrived and are in order") : "the highlighted one is slice #1, the one we will follow"}</span></div>`; };
  const bits = (rx) => {
    const bytes = [0x3c, 0x84], b = bytes.map((v) => v.toString(2).padStart(8, "0")).join(""), W = 18;
    let d = "M0 " + (b[0] === "1" ? 6 : 28), x = 0, prev = b[0], t = "";
    for (const [i, c] of [...b].entries()) { const y = c === "1" ? 6 : 28; if (c !== prev) d += ` L${x} ${y}`; x += W; d += ` L${x} ${y}`; prev = c;
      t += `<text x="${i * W + W / 2}" y="46" text-anchor="middle">${c}</text>`; }
    return `<div class="dv-bits"><span>the first 2 bytes of the frame:</span><code>3c 84</code><span>=</span><code>0011 1100 · 1000 0100</code></div>
      <svg class="dv-wave" viewBox="0 0 ${b.length * W} 50" aria-hidden="true"><path d="${d}"/><line x1="${8 * W}" y1="0" x2="${8 * W}" y2="34" class="dv-wave-sep"/>${t}</svg>
      <div class="dv-legend"><span>1 = high signal · 0 = low signal</span><span>these bytes are the start of the router's MAC</span></div>
      <div class="dv-media"><span>radio (Wi-Fi) to the router</span><span>pulses on copper</span><span>light in the ocean fiber</span></div>`
      + note(rx ? "On the brother's side the path is reversed: light, then electrical, then radio, and the phone rebuilds the frame's bits." : "The same bits change shape along the way (radio, copper, light), but the content does not change.");
  };

  const PAY = () => payload(UDP ? "encrypted media piece" : "encrypted slice #1", UDP ? "~1,200 B" : "1,460 B");
  const FRAME = (add, out, extra) => strip(["mac", "ip", "tcp"], PAY(), ["fcs"], add, out) + (extra || "");
  const VIEWS = [
    () => photo("", "7.68 MB · for now it is just an image in the app") + note("There is nothing network-related here yet: no header, no address."),
    () => http() + note("The app writes the request: what it wants (POST /v1/fotos), where to (Host) and what goes along (the photo)."),
    () => sizes(true) + strip(["tls"], payload("HTTP request + photo, encrypted", "313 KB", "is-new"), ["tag"], ["tls", "tag"]) + card(["tls", "tag"], "is-new")
      + note("Anyone who intercepts it only sees meaningless bytes: " + hex(8) + " …"),
    () => `<div class="dv-badge is-new">session 9f3a… open between the two apps</div>` + strip(["tls"], payload("HTTP request + photo, encrypted", "313 KB"), ["tag"]) + note("The bytes did not change. The session is the state of the conversation (who talks to whom, where to resume), not a new header."),
    () => slices(false) + strip(["tcp"], PAY(), [], ["tcp"]) + card(["tcp"], "is-new"),
    () => strip(["ip", "tcp"], PAY(), [], ["ip"]) + card(["ip"], "is-new"),
    () => FRAME(["mac", "fcs"], [], card(["mac", "fcs"], "is-new") + note("Done: the complete frame. A packet inside a packet inside a packet: that is encapsulation.")),
    () => bits(false),
    () => FRAME([], [], `<div class="dv-card is-chg"><div class="dv-card-h"><span>At each router</span><b>what changes and what does not</b><em>layers 2 and 3</em></div>
        <ul><li><b>MAC:</b> replaced (now "to the next router")</li><li><b>FCS:</b> recalculated, because the frame changed</li><li><b>Destination IP:</b> the same, 198.51.100.7</li><li><b>TTL:</b> 64 → 63 → 62… (if it reaches 0, the packet is dropped)</li><li><b>${UDP ? "UDP" : "TCP"} and the data:</b> are not even opened</li></ul></div>`),
    () => bits(true),
    () => FRAME([], ["mac", "fcs"], card(["fcs", "mac"], "is-out") + note("Checked: the FCS matched (no bit got corrupted) and the destination MAC is the brother's phone.")),
    () => strip(["ip", "tcp"], PAY(), [], [], ["ip"]) + card(["ip"], "is-out") + note("Checked: the destination IP is his."),
    () => slices(true) + strip(["tcp"], payload(UDP ? "media pieces" : "215 slices in order", UDP ? "#5 #6 · #8" : "313 KB"), [], [], ["tcp"]) + card(["tcp"], "is-out")
      + note(UDP ? "One piece is missing and nobody asked again: the picture stutters for a moment and the call goes on." : "The 215 slices were put together by their numbers, and the missing ones were asked for again."),
    () => `<div class="dv-badge is-out">session 9f3a… (still open)</div>` + strip(["tls"], payload("HTTP request + photo, encrypted", "313 KB"), ["tag"]) + note("No new bytes: the session only confirms which conversation this data belongs to."),
    () => strip(["tls"], payload("decrypted: HTTP request + photo", "313 KB → 7.68 MB", "is-ok"), ["tag"], [], ["tls", "tag"]) + note("The tag checked out (nobody tampered), TLS decrypted it and the photo was decompressed."),
    () => photo("is-new", "7.68 MB · shows up in the brother's chat") + note("Each header was removed by the same layer that added it on the way out."),
  ];
  const UDP_VIEWS = {
    0: () => call("", "live voice and picture, ~50 pieces per second") + note("Now the data is born every instant at the camera and microphone. Arriving late is worse than losing a little piece."),
    1: () => `<pre class="dv-text is-new"><span class="dv-hl">WebRTC · media stream
audio: Opus · video: VP8</span></pre>` + note("No asking and waiting for an answer: the pieces keep going out."),
    2: () => strip(["tls"], payload("encrypted video frame", "~1 KB", "is-new"), [], ["tls"]).replace(/<b>TLS<\/b><small>5 B/, "<b>SRTP</b><small>~12 B") + note("The codec compresses each little piece and SRTP encrypts it. Each piece is small and independent."),
    3: () => `<div class="dv-badge is-new">call open · 00:03</div>` + note("The session is the call itself: who talks to whom, with which codec, for how long."),
    13: () => `<div class="dv-badge is-out">call open · 00:04</div>` + note("The session confirms that these pieces belong to this call."),
    14: () => call("is-ok", "decoded: voice and picture are back") + note("SRTP decrypts and the codec rebuilds voice and picture, even with one little piece missing."),
    15: () => call("is-new", "the call goes on, live") + note("For voice, video and games, arriving now matters more than arriving complete."),
  };
  return (s, halted, mode) => { UDP = mode === "udp"; const v = UDP && UDP_VIEWS[s] ? UDP_VIEWS[s] : VIEWS[s];
    return (halted ? `<p class="dv-cap dv-bad">The trip stopped here. Nothing arrives on the other side: not one byte from this step on.</p>` : "") + v(); };
})();
