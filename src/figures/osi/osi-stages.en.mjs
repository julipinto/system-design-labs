// English OSI script (STAGES + TAGS + LOOKS), used only by osi-3d/build.mjs when FIG_LANG=en.
export const STAGES = [
  { side: "sp", L: 7, name: "Send", pdu: "data", title: "Lena taps send", body: "The cat photo is 7.68 MB and for now it is just data inside the app, at the top of the stack. It will go down the 7 layers of Lena's phone, cross the planet and go up the 7 layers of her brother's phone in Tokyo.", protos: [] },
  { side: "sp", L: 7, name: "Application", pdu: "data", title: "7 · Application: the app asks to send", body: "The app builds an HTTP request (method, URL, headers). Before that it used DNS to find the destination IP. This is the layer the software sees.", protos: ["HTTP", "DNS", "gRPC", "WebSocket", "SSH"] },
  { side: "sp", L: 6, name: "Presentation", pdu: "data", title: "6 · Presentation: compress and encrypt", body: "Format, compression and encryption. The photo is compressed (7.68 MB → 313 KB) and encrypted with TLS. That is why the middle block shrinks.", protos: ["TLS", "JPEG", "PNG", "UTF-8"] },
  { side: "sp", L: 5, name: "Session", pdu: "data", title: "5 · Session: open the conversation", body: "Opens, keeps and closes the conversation between the two apps. If the connection drops halfway, this is where the apps know where to resume.", protos: ["TLS session", "RPC", "sockets"] },
  { side: "sp", L: 4, name: "Transport", pdu: "segment", title: "4 · Transport: cut into 215 numbered pieces", body: "TCP cuts the 313 KB into 215 segments of ~1,460 bytes, numbers each one, adds source and destination ports and resends whatever gets lost. TCP header: 20 bytes.", protos: ["TCP", "UDP"] },
  { side: "sp", L: 3, name: "Network", pdu: "packet", title: "3 · Network: add the destination IP", body: "Each segment becomes a packet with a source IP and a destination IP (20-byte IPv4 header, 40-byte IPv6). Routers read this label along the way.", protos: ["IPv4", "IPv6", "ICMP"] },
  { side: "sp", L: 2, name: "Data link", pdu: "frame", title: "2 · Data link: the next hop's MAC", body: "To leave the house, the packet first has to reach the Wi-Fi router. It gets that next hop's MAC address and a trailer (FCS) that detects corrupted bits. This address is only valid until the next hop.", protos: ["Wi-Fi 802.11", "Ethernet", "ARP"] },
  { side: "sp", L: 1, name: "Physical", pdu: "bits", title: "1 · Physical: it becomes a signal", body: "The frame becomes a signal: radio waves on Wi-Fi, electrical pulses on copper, light in the fiber that crosses the ocean. There is no envelope here, only bits.", protos: ["radio", "copper", "optical fiber"] },
  { side: "x", L: 3, name: "Routers", pdu: "bits → packet → bits", title: "Hop by hop to Tokyo", body: "Each router goes up only to layer 3: it opens the frame, reads the destination IP, picks the next hop and builds a new frame with a new MAC. The destination IP does not change on the way; the MAC changes at every hop.", protos: ["routing", "BGP", "TTL"] },
  { side: "tk", L: 1, name: "Physical", pdu: "bits", title: "1 · Physical: the signal arrives", body: "The light in the fiber becomes an electrical signal and then radio, and her brother's phone rebuilds the frame's bits. The way back is the same ladder, from the bottom up.", protos: ["optical fiber", "radio"] },
  { side: "tk", L: 2, name: "Data link", pdu: "frame", title: "2 · Data link: check and remove the frame", body: "Checks the FCS (if it arrived corrupted, it drops the frame) and sees that the destination MAC is its own. Removes the data link envelope and hands the packet up.", protos: ["Wi-Fi 802.11", "Ethernet"] },
  { side: "tk", L: 3, name: "Network", pdu: "packet", title: "3 · Network: the IP is mine", body: "The destination IP is his. It removes the IP header and hands the segment to transport.", protos: ["IPv4", "IPv6"] },
  { side: "tk", L: 4, name: "Transport", pdu: "segment", title: "4 · Transport: put in order and acknowledge", body: "TCP puts the 215 segments in order, asks again for the ones that are missing and confirms with ACKs. The destination port tells it which app gets the data.", protos: ["TCP", "ACK"] },
  { side: "tk", L: 5, name: "Session", pdu: "data", title: "5 · Session: the conversation goes on", body: "The session between the two apps is still open; the data keeps going up through the same conversation.", protos: ["TLS session"] },
  { side: "tk", L: 6, name: "Presentation", pdu: "data", title: "6 · Presentation: decrypt and decompress", body: "Decrypts the TLS and decompresses: the 313 KB become an image ready to display. The middle block goes back to its original size.", protos: ["TLS", "JPEG"] },
  { side: "tk", L: 7, name: "Application", pdu: "data", title: "7 · Application: a cat shows up", body: "The app receives the photo and shows the cat. Each layer only talked to the matching layer on the other side: each one put an envelope on the way out and the same layer took it off on the way back.", protos: ["HTTP"] },
];

const TAGS = ["the photo · 7.68 MB", "+ HTTP header", "compress and encrypt (+ TLS)", "+ session", "+ TCP header · 215 pieces", "+ IP header", "+ MAC and FCS", "becomes a signal: just bits", "router reads the IP", "bits become a frame", "− MAC (checks the FCS)", "− IP header", "− TCP (puts in order)", "− session", "decrypt and decompress", "photo delivered"];
const LOOKS = [
  "Left tower (Lena): the phone screen at the top is lit and the elevator is on floor 7 carrying only the white block, the photo, with no envelope.",
  "The elevator stays on floor 7 and the photo got its first step underneath: the HTTP header. The floor 7 lamp turned on.",
  "Floor 6: the white block shrank (compression) and one more step appeared, the TLS one.",
  "Floor 5: one more step, the session.",
  "Floor 4: the TCP step comes in. The load already has 4 envelopes.",
  "Floor 3: the IP step comes in. This is the label the routers will read.",
  "Floor 2: the widest step comes in, the data link frame. The pyramid is complete, with 6 envelopes around the photo.",
  "Floor 1: the pyramid disappears from the elevator, because from here on it is only signal. The light on the little box at the base of the tower turns on.",
  "The white dots running along the cable are the bits. Each router lights up as they pass: there the frame is opened up to the IP and rebuilt.",
  "Right tower (brother), floor 1: the whole pyramid reappears in the elevator, rebuilt from the bits.",
  "Floor 2: the widest step comes off, the data link one.",
  "Floor 3: the IP step comes off.",
  "Floor 4: the TCP step comes off.",
  "Floor 5: the session step comes off.",
  "Floor 6: the TLS step comes off and the white block returns to its original size.",
  "Floor 7: the last step comes off, HTTP. Only the photo is left, and her brother's phone screen lights up.",
];
STAGES.forEach((st, i) => { st.tag = TAGS[i]; st.look = LOOKS[i]; });
