/* Question bank for the Network Protocols quiz (English).
   Types: choice (answer = index into options), order (options already in the right order; the quiz shuffles),
   layer (answer = layer 1..7), truefalse (answer = true/false). level: 1 definition, 2 apply, 3 scenario. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-a-protocolos", name: "What is a protocol" },
    t2: { topic: "aula-2-modelo-osi", name: "OSI model" },
    t3: { topic: "aula-3-ip-ipv4-ipv6", name: "IP, IPv4 and IPv6" },
    t4: { topic: "aula-4-tcp-e-udp", name: "TCP and UDP" },
    t5: { topic: "aula-5-ssl-e-tls", name: "TLS" },
    t6: { topic: "aula-6-dns", name: "DNS" },
    t7: { topic: "aula-7-dhcp", name: "DHCP" },
    t8: { topic: "aula-8-http", name: "HTTP/1.1, HTTP/2 and HTTP/3" },
    t9: { topic: "aula-9-tempo-de-resposta", name: "Response time" },
    fig: { topic: "aula-2-modelo-osi", name: "OSI figure / encapsulation", group: "figura-osi" }
  };
  var out = [];
  function add(k, n, type, level, prompt, options, answer, explain) {
    var t = T[k];
    out.push({
      id: k + "-" + (n < 10 ? "0" : "") + n,
      topic: t.topic,
      group: t.group || t.topic,
      topicName: t.name,
      type: type,
      level: level,
      prompt: prompt,
      options: options,
      answer: answer,
      explain: explain
    });
  }
  function choice(k, n, level, prompt, options, answer, explain) { add(k, n, "choice", level, prompt, options, answer, explain); }
  function order(k, n, level, prompt, items, explain) { add(k, n, "order", level, prompt, items, null, explain); }
  function layer(k, n, level, prompt, answer, explain) { add(k, n, "layer", level, prompt, null, answer, explain); }
  function tf(k, n, level, prompt, answer, explain) { add(k, n, "truefalse", level, prompt, null, answer, explain); }

  /* ---------- 1. What is a protocol ---------- */
  choice("t1", 1, 1, "What does a protocol define?", [
    "The format of the messages, the order of the conversation and what to do when something goes wrong.",
    "Only the speed of the cable between the two machines.",
    "The programming language both sides have to use.",
    "The IP address of each machine in the conversation."
  ], 0, "A protocol is an agreement on format, order and error handling. Language, cable and IP are other subjects.");
  choice("t1", 2, 1, "Two systems that have never met can talk to each other. Why?", [
    "Because they follow the same protocol, a known agreement about the messages.",
    "Because they run the same operating system.",
    "Because they are connected to the same physical network.",
    "Because one of them guesses the other's format."
  ], 0, "Without the agreement, the bytes arrive and nobody knows what they are. Operating system and physical network are not enough.");
  tf("t1", 3, 1, "Each protocol in the stack uses the services of the one below and serves the one above.", true,
    "That is what \"stacking\" means: each layer solves one piece and hands the result to its neighbor.");
  tf("t1", 4, 2,
    "More delivery guarantees (acknowledgment, retransmission) cost nothing in latency.", false,
    "Reliability costs message round trips, and each round trip costs time.");
  choice("t1", 5, 2, "Choosing between gRPC and REST, TCP and UDP, or one connection and several is what kind of decision?", [
    "A protocol decision: it trades performance and resilience.",
    "A style detail, with no effect on latency.",
    "A decision that only matters to the front end.",
    "A decision the physical layer settles by itself."
  ], 0, "Each of these choices is a protocol choice, with a cost and a benefit in performance and resilience.");
  choice("t1", 6, 2, "What is the gain from splitting the network into layers?", [
    "You can swap Wi-Fi for fiber without rewriting HTTP.",
    "All the layers become faster.",
    "HTTP comes to know the signal traveling over the cable.",
    "The need for headers goes away."
  ], 0, "Each layer hides its details from the others. HTTP doesn't know how the signal travels, so the layer below can change without affecting it.");
  choice("t1", 7, 3, "Two of your services exchange messages. One changes the format of a field without telling the other, and the calls start failing. What broke?", [
    "The agreement (protocol) between them: the other side can no longer read the bytes.",
    "The physical layer, which stopped transmitting bits.",
    "The routing between networks.",
    "The link's bandwidth."
  ], 0, "The network delivered the bytes just fine. What was missing was the agreed format: changing the contract without warning breaks the conversation.");

  /* ---------- 2. OSI model ---------- */
  order("t2", 1, 1, "Put the OSI layers in order, from top (closest to the program) to bottom (closest to the cable).", [
    "7 · Application", "6 · Presentation", "5 · Session", "4 · Transport", "3 · Network", "2 · Data Link", "1 · Physical"
  ], "Mnemonic from bottom to top: Photo Dashed Nonstop; Tokyo Smiled, Praised, Applauded. Read backwards, you get the order from top to bottom.");
  choice("t2", 2, 1, "Who created the OSI model and when?", [
    "ISO, in the 1980s.",
    "The IETF, together with TCP/IP, in the 1960s.",
    "Xerox, together with Ethernet, in the 1990s.",
    "Tim Berners-Lee, at CERN, together with the web."
  ], 0, "OSI is an ISO standard from the 1980s. Today it serves as a conceptual map and for diagnosing problems.");
  choice("t2", 3, 1, "What is the PDU of the Network layer (layer 3) called?", [
    "Packet", "Frame", "Segment", "Bits"
  ], 0, "Network: packet. Data Link: frame. Transport: segment (TCP) or datagram (UDP). Physical: bits.");
  choice("t2", 4, 2, "At which layer do the router and the ordinary Ethernet switch work?", [
    "Router at 3, switch at 2.",
    "Router at 4, switch at 3.",
    "Both at layer 3.",
    "Both at layer 2."
  ], 0, "The router decides by IP (layer 3). The switch decides by MAC (layer 2).");
  tf("t2", 5, 2, "The stack that actually runs on the internet is the 7-layer OSI.", false,
    "What was implemented is TCP/IP, with 4 layers. OSI stayed as a teaching and troubleshooting model.");
  choice("t2", 6, 2, "How does TCP/IP (4 layers) group the OSI layers?", [
    "Application merges 7, 6 and 5; Transport; Internet; Network access merges 2 and 1.",
    "Application merges 7 and 6; Transport merges 5 and 4; Internet; Network access.",
    "Application; Transport; Internet merges 3 and 2; Network access is only 1.",
    "Each OSI layer becomes one TCP/IP layer, just with other names."
  ], 0, "7+6+5 become Application, 4 becomes Transport, 3 becomes Internet, 2+1 become Network access.");
  layer("t2", 7, 1, "At which layer is the MAC address used?", 2,
    "The MAC identifies the neighbor on the same local network. It belongs to the data link (layer 2).");
  layer("t2", 8, 1, "At which layer are the light pulses of the optical fiber?", 1,
    "The physical layer transmits bits: light in fiber, voltage in copper, radio in Wi-Fi.");

  /* ---------- 3. IP, IPv4 and IPv6 ---------- */
  choice("t3", 1, 1, "How many bits does an IPv4 address have, and an IPv6 one?", [
    "32 and 128", "16 and 64", "64 and 128", "32 and 256"
  ], 0, "IPv4: 32 bits (about 4.3 billion addresses). IPv6: 128 bits. The IPv4 space ran out, which is why IPv6 exists.");
  tf("t3", 2, 1, "IP guarantees that packets arrive in order and without loss.", false,
    "IP only carries the packet to the destination, with no guarantee. Order and delivery are TCP's job, at layer 4.");
  choice("t3", 3, 2, "Which of these addresses is private (not routed on the internet)?", [
    "172.20.4.9", "172.32.0.1", "192.169.1.1", "11.0.0.1"
  ], 0, "The private range 172.16.0.0/12 goes from 172.16.0.0 to 172.31.255.255. The other private ranges are 10/8 and 192.168/16.");
  choice("t3", 4, 2, "Your PC has 192.168.1.10, but the world sees another IP. Who does that translation?", [
    "NAT", "DHCP", "ARP", "TCP"
  ], 0, "NAT swaps the private IP for a public one on the way out. DHCP only hands out the IP, and ARP finds MACs on the LAN.");
  layer("t3", 5, 1, "The router reads the destination IP to choose the next hop. At which layer does this happen?", 3,
    "IP addressing and routing belong to the Network layer (3).");
  layer("t3", 6, 2, "Ping fails with \"no route to host\". Which layer do you investigate first?", 3,
    "A missing route is a routing problem: layer 3. Typical tools: ping and traceroute.");
  choice("t3", 7, 2, "For your domain to be reached over IPv6, what needs to exist in DNS?", [
    "An AAAA record with the IPv6 address.",
    "An MX record.",
    "One NS record per user.",
    "An A record with the IPv6 address."
  ], 0, "A holds IPv4, AAAA holds IPv6. Dual stack depends on both sides having support.");
  choice("t3", 8, 3, "Thousands of instances go out to the internet through a single IP via NAT. What risk shows up with many connections going out?", [
    "Running out of NAT ports, and new connections failing or timing out.",
    "The IP header growing with each connection.",
    "DNS no longer resolving public names.",
    "Two devices ending up with the same MAC."
  ], 0, "NAT tells connections apart by ports. With many connections going out they run out, and new connections fail.");

  /* ---------- 4. TCP and UDP ---------- */
  order("t4", 1, 1, "Opening a TCP connection: put the three-way handshake in order.", [
    "Client sends SYN", "Server answers SYN-ACK", "Client sends ACK"
  ], "SYN, SYN-ACK, ACK. It costs 1 RTT before any data, and each side picks its own initial sequence number.");
  order("t4", 2, 2, "TCP close (four-way close): put it in order.", [
    "Side A sends FIN", "Side B answers ACK", "Side B sends FIN", "Side A answers ACK"
  ], "Each side sends its FIN and gets an ACK. In practice the ACK and the second FIN sometimes travel together, but the study model has 4 steps.");
  choice("t4", 3, 1, "Which description fits UDP?", [
    "No connection, no order and no delivery acknowledgment.",
    "Opens a connection with three messages and resends what gets lost.",
    "Guarantees everything arrives, but only inside a local network.",
    "Encrypts the datagrams by default."
  ], 0, "UDP sends independent datagrams and ignores what gets lost. Whoever wants guarantees has to build them on top.");
  tf("t4", 4, 2, "In TCP, the ACK is cumulative: it means \"I received everything up to here and I expect number X\".", true,
    "That's why a hole in the middle (bytes that didn't arrive) holds the ACK until it is retransmitted.");
  choice("t4", 5, 2, "Which case fits UDP best?", [
    "Voice on a call: old data is worth nothing.",
    "Charging a payment.",
    "A SQL query to a database.",
    "Uploading a file that can't get corrupted."
  ], 0, "Voice tolerates losing a little piece and there's no point resending it late. Payment, SQL and file can't go missing: TCP.");
  tf("t4", 6, 2, "The TCP handshake is a fixed cost per connection, which is why keep-alive and connection pools exist.", true,
    "Reusing the connection avoids paying the 1 RTT of the handshake (and the TLS one) every time.");
  layer("t4", 7, 1, "A load balancer that decides only by destination IP and port works at which layer?", 4,
    "IP and port: layer 4 (L4). When the balancer reads the HTTP to route by path or header, it is L7.");
  layer("t4", 8, 3, "Ping to the server answers, but the app times out: the SYN to port 443 gets no reply. Which layer do you investigate first?", 4,
    "The IP is fine (ping answers), so the problem is at the port: a firewall or security group filtering, or nothing listening. That's transport (4). If the port were closed, you'd get \"connection refused\".");

  /* ---------- 5. TLS ---------- */
  choice("t5", 1, 1, "What does TLS guarantee?", [
    "Privacy (encryption) and integrity (nobody alters it along the way).",
    "That the server never goes down.",
    "That the response arrives faster.",
    "That the packets arrive in order."
  ], 0, "Encryption and integrity. Delivery order is TCP's job, and TLS even adds handshake time.");
  choice("t5", 2, 2, "After the handshake, what encrypts the conversation's data?", [
    "A symmetric session key, unique to that connection.",
    "The server's private key.",
    "The certificate, which travels with every packet.",
    "The user's password."
  ], 0, "Asymmetric for the negotiation, symmetric for the data: the session key is the one that encrypts the rest of the conversation.");
  order("t5", 3, 2, "Put the TLS steps in order (simplified version).", [
    "They negotiate version and algorithms",
    "Server proves who it is with a certificate",
    "The two derive the session key",
    "Data travels encrypted with the session key"
  ], "Negotiate, prove identity, arrive at a session key and only then encrypt the data.");
  choice("t5", 4, 2, "With TCP + TLS 1.3, how many RTTs pass before the HTTP request can go out?", [
    "2", "1", "3", "4"
  ], 0, "TCP: 1 RTT. TLS 1.3: 1 RTT. Total 2. With TLS 1.2 it would be 3.");
  tf("t5", 5, 2, "The TLS 1.3 handshake takes 1 RTT; the TLS 1.2 one takes 2.", true,
    "It was one of the gains of version 1.3. On session resumption there is still 0-RTT, with security caveats such as replay.");
  layer("t5", 6, 2, "In this module, at which OSI layer does the function of compressing and encrypting data sit?", 6,
    "Presentation (6): format, compression and encryption. It is the module's convention, since in practice TLS runs between transport and application.");
  choice("t5", 7, 3, "At 3 a.m. all clients start getting a certificate error, and nothing changed in the code. What is the classic cause?", [
    "An expired certificate.",
    "An exhausted DHCP pool.",
    "Many TCP retransmissions.",
    "A DNS TTL that is too high."
  ], 0, "An expired certificate is one of the most classic causes of downtime. It's worth monitoring the expiry date.");
  choice("t5", 8, 3, "Distant users suffer from the TLS handshake time. What helps most?", [
    "Terminating TLS close to them, at a CDN or edge load balancer.",
    "Increasing the origin server's bandwidth.",
    "Switching to a larger key.",
    "Turning off TCP."
  ], 0, "The cost is in the RTTs, and distance rules the RTT. Ending the handshake close to the user shortens each round trip.");

  /* ---------- 6. DNS ---------- */
  order("t6", 1, 1, "Name resolution with nothing cached: put in the order each step is queried.", [
    "Cache (browser, system, resolver)",
    "Root server",
    "TLD server (.dev)",
    "Authoritative server"
  ], "Cache first. The root points to the TLD, the TLD points to the authoritative server, and the authoritative server gives the IP.");
  choice("t6", 2, 1, "Who gives the final answer with the name's IP?", [
    "The authoritative server.",
    "The root server.",
    "The TLD server.",
    "The home router."
  ], 0, "Root and TLD only point to the next server. The final word belongs to the authoritative server.");
  choice("t6", 3, 2, "Which DNS record creates an alias that points to another name?", [
    "CNAME", "A", "NS", "MX"
  ], 0, "CNAME is an alias. A holds IPv4, NS says who is authoritative and MX handles email.");
  choice("t6", 4, 2, "Which record holds an IPv6 address?", [
    "AAAA", "A", "TXT", "CNAME"
  ], 0, "A holds IPv4. AAAA (four As, because it is four times bigger) holds IPv6.");
  tf("t6", 5, 2, "A high TTL reduces DNS lookups, but delays an IP switch (failover).", true,
    "It's a balance: high TTL, fewer lookups and slow failover. Low TTL, fast switch and more lookups.");
  choice("t6", 6, 3, "You changed the server's IP, but some users keep going to the old IP for hours. Most likely cause?", [
    "A high TTL: the old IP is still cached.",
    "DHCP didn't renew the lease.",
    "TLS 1.2 is slow.",
    "HTTP/3 lost a packet."
  ], 0, "Resolvers and browsers keep the answer until the TTL expires. Before a migration, it's worth lowering the TTL.");
  choice("t6", 7, 3, "The app doesn't open by name, but opens when you use the IP directly. Where do you investigate?", [
    "In name resolution (DNS).",
    "In the network cable.",
    "In the port's TCP handshake.",
    "In the DHCP address pool."
  ], 0, "If the IP works, the network and the port are fine. All that's missing is translating the name into an IP: DNS.");
  tf("t6", 8, 2, "The root server directly answers the IP of demo.fidelissauro.dev.", false,
    "The root only knows who handles .dev. The one that has the name's IP is the authoritative server.");

  /* ---------- 7. DHCP ---------- */
  order("t7", 1, 1, "Put the four DHCP messages (DORA) in order.", [
    "Discover: client looks for a server",
    "Offer: server offers IP and settings",
    "Request: client asks for the chosen offer",
    "Acknowledgment: server confirms"
  ], "Discover, Offer, Request, Acknowledgment. At the end, the IP is the client's for the length of the lease.");
  choice("t7", 2, 1, "What does DHCP hand to whoever just joined the network?", [
    "IP, mask, gateway, DNS and lease time.",
    "Only the MAC address.",
    "A TLS certificate.",
    "The route to the authoritative server."
  ], 0, "DHCP configures the network automatically: IP, mask, gateway and DNS, for a while (lease).");
  choice("t7", 3, 2, "Why does Discover go by broadcast?", [
    "Because the client doesn't have an IP yet and doesn't know who the server is.",
    "Because broadcast is more secure.",
    "Because the server only listens to broadcast after 10 p.m.",
    "Because TCP requires it."
  ], 0, "With no IP and no server address, the client shouts to the whole local network and waits for someone to answer.");
  choice("t7", 4, 2, "The device shows up with a 169.254.x.x IP. What does that indicate?", [
    "It got no answer from a DHCP server.",
    "It got a valid public IP.",
    "NAT ran out of ports.",
    "DNS went down."
  ], 0, "169.254.x.x is a local address the device assigns itself when DHCP doesn't answer. A classic symptom.");
  tf("t7", 5, 2, "The IP received by DHCP belongs to the device forever.", false,
    "It is borrowed through a lease and renewed before it expires. When the device leaves, the address goes back to the pool.");
  tf("t7", 6, 1, "DHCP uses UDP, with ports 67 (server) and 68 (client).", true,
    "A client with no IP and no connection: DHCP goes over UDP, by broadcast in the first messages.");
  choice("t7", 7, 3, "New laptops end up with no network and a 169.254.x.x IP, while the old ones carry on normally. Most likely hypothesis?", [
    "The DHCP pool ran out or the DHCP server went down.",
    "The site's TLS certificate expired.",
    "The DNS TTL is high.",
    "HTTP/2 has head-of-line blocking."
  ], 0, "The old ones already have a lease and keep working. Whoever arrives now can't get an address.");

  /* ---------- 8. HTTP ---------- */
  choice("t8", 1, 1, "What is head-of-line blocking?", [
    "One stuck response holding back the ones behind it.",
    "The server refusing connections from a client.",
    "DNS returning an old IP.",
    "The TLS certificate expiring."
  ], 0, "It's the problem the three HTTP versions try to solve, each in its own way.");
  choice("t8", 2, 1, "A 404 response belongs to which status class?", [
    "4xx: client error.",
    "5xx: server error.",
    "3xx: redirection.",
    "2xx: success."
  ], 0, "4xx is a client error (asked for something that doesn't exist, no permission). 5xx is a server error.");
  choice("t8", 3, 2, "Why does HTTP/2 still suffer head-of-line blocking with packet loss?", [
    "Because it runs over TCP: a lost packet holds back all the streams until it is retransmitted.",
    "Because it can only make one request per connection.",
    "Because it doesn't use headers.",
    "Because the server always answers in reverse order."
  ], 0, "HTTP/2 multiplexes several streams over one TCP connection, but TCP delivers bytes in order and blocks everything behind the hole.");
  choice("t8", 4, 2, "What does HTTP/3 run on?", [
    "QUIC, over UDP.",
    "TCP, with TLS 1.2.",
    "SCTP.",
    "Directly over IP, with no transport."
  ], 0, "HTTP/3 swaps TCP for QUIC, which runs over UDP and brings TLS 1.3 built into the handshake.");
  tf("t8", 5, 2, "In HTTP/3, the connection can survive the switch from Wi-Fi to mobile data, thanks to the Connection ID.", true,
    "QUIC identifies the connection by an ID, not by IP and port. That's why a network switch doesn't kill the conversation.");
  tf("t8", 6, 2, "In HTTP/1.1, each request has to open a new TCP connection.", false,
    "HTTP/1.1 has persistent connections. The problem is another one: a slow response blocks the following ones on the same connection.");
  layer("t8", 7, 1, "The connection opened normally, but the API answered 500. At which OSI layer is the problem?", 7,
    "HTTP status codes belong to the Application layer (7). The connection worked; it's the response that came back wrong.");
  choice("t8", 8, 3, "The mobile app suffers on unstable networks. Without touching the backend, what helps most?", [
    "Terminating HTTP/3 at a CDN or load balancer.",
    "Going back to HTTP/1.1 with a single connection.",
    "Increasing the server's bandwidth.",
    "Reducing the DNS TTL to 1 second."
  ], 0, "HTTP/3 isolates losses between streams and survives a network switch. Terminating at the CDN is the simplest adoption.");
  choice("t8", 9, 2, "Why does QUIC run in user space, over UDP, instead of inside the kernel like TCP?", [
    "To evolve fast: you just update the app or the browser, without waiting for the operating system or the middleboxes.",
    "Because UDP already guarantees in-order delivery.",
    "Because the kernel can't encrypt data.",
    "To skip the TLS handshake."
  ], 0, "TCP is in the kernel and middleboxes lock in its format (ossification). In user space, QUIC changes with a new version of the software. UDP only delivers datagrams: order and reliability are handled by QUIC itself.");
  tf("t8", 10, 2, "QUIC's 0-RTT is safe for any request, including a POST that charges a payment.", false,
    "0-RTT data can suffer replay: an attacker repeats the first request. It only works for requests that are safe to repeat, like a GET.");
  choice("t8", 11, 3, "A corporate firewall blocks UDP/443. What happens to a user whose browser speaks HTTP/3?", [
    "The browser falls back to HTTP/2 or 1.1 over TCP, and the site keeps opening.",
    "The site goes down for that user.",
    "QUIC starts running over TCP.",
    "The browser waits for the firewall to open the port."
  ], 0, "HTTP/3 is announced as an option (Alt-Svc), and TCP stays available. If UDP fails, the client falls back to TCP. That's why the server needs to keep HTTP/2 working.");
  order("t8", 12, 2, "Order from the scenario with the MOST RTTs before the request to the one with the FEWEST.", [
    "TCP + TLS 1.2 (3 RTTs)",
    "TCP + TLS 1.3 (2 RTTs)",
    "QUIC, new connection (1 RTT)",
    "QUIC, resumption with 0-RTT (0 RTT)"
  ], "TLS 1.3 cuts one RTT from 1.2. QUIC merges the transport handshake with the TLS one and ends up at 1. On resumption, the request goes out with the first message.");

  /* ---------- 9. Response time ---------- */
  order("t9", 1, 2, "In a new HTTPS request, put the time components in the order they happen.", [
    "DNS", "TCP handshake", "TLS handshake", "Wait for the first byte", "Download"
  ], "Find the IP, open TCP, negotiate TLS, ask and wait for the first byte, and only then download the content.");
  choice("t9", 2, 1, "What is RTT?", [
    "The time of a round trip between client and server.",
    "The time the server takes to process the request.",
    "The link's bandwidth.",
    "The size of the TCP header."
  ], 0, "RTT (round-trip time) is the round trip. It is dominated by latency: distance and the speed of light.");
  choice("t9", 3, 2, "For a small response, what reduces time the most?", [
    "Cutting one RTT (for example, by reusing the connection).",
    "Doubling the bandwidth.",
    "Changing the size of the IP header.",
    "Raising the DNS TTL to 1 year."
  ], 0, "For small responses, almost everything is RTT. Doubling the bandwidth barely changes anything. Cutting one RTT changes everything.");
  choice("t9", 4, 2, "New connection, TCP + TLS 1.3, no DNS: in how many RTTs does the first byte of the response arrive?", [
    "3", "2", "4", "1"
  ], 0, "1 for TCP + 1 for TLS + 1 for the request and response = 3. With TLS 1.2 it would be 4.");
  choice("t9", 5, 2, "Reused connection (keep-alive): in how many RTTs does the first byte arrive?", [
    "1", "0", "2", "3"
  ], 0, "The handshakes have already been paid. What's left is the RTT of the request and response, plus the server time.");
  tf("t9", 6, 2, "To evaluate response time, looking at the average is enough.", false,
    "The average hides the worst experiences. Measure percentiles (p95, p99).");
  tf("t9", 7, 2, "HTTP/3 with 0-RTT resumption can have the first byte of the response in 1 RTT.", true,
    "With no handshakes before the request, only the RTT of the request and response is left. 0-RTT has security caveats, such as replay.");
  choice("t9", 8, 3, "An API returns 2 KB, users are far away and the p95 is high. Which attack makes the most sense?", [
    "Reuse connections and bring the server or CDN closer to the user.",
    "Double the server's bandwidth.",
    "Swap JSON for XML.",
    "Add more servers in the same region."
  ], 0, "Small response and distant user: the time is RTT. The order is to eliminate RTTs, then reduce server time, and only then buy bandwidth.");

  /* ---------- OSI figure / encapsulation ---------- */
  choice("fig", 1, 1, "In the figure, the photo goes down from layer 4 to layer 3. What does it gain?", [
    "The IP header, with source and destination, and it becomes a packet.",
    "The TCP header, with ports and sequence numbers.",
    "TLS encryption.",
    "The MAC of the next hop."
  ], 0, "Layer 3 adds the source and destination IP: that's the label routers read. TCP came in earlier, at layer 4.");
  order("fig", 2, 2, "On the way down, in what order is each envelope put around the photo?", [
    "HTTP header (7)",
    "Compression and TLS (6)",
    "Session (5)",
    "TCP header (4)",
    "IP header (3)",
    "MAC and FCS of the data link (2)"
  ], "From top to bottom, layer by layer. At the physical layer (1) there is no envelope: the frame becomes signal.");
  choice("fig", 3, 2, "Along the path through the routers, what changes and what stays the same?", [
    "The destination IP stays the same; the MAC changes at each hop.",
    "The MAC stays the same; the destination IP changes at each hop.",
    "Both stay the same until the destination.",
    "Both change at each hop."
  ], 0, "The router goes up only to layer 3, reads the IP, builds a new frame with the next hop's MAC and sends it on.");
  choice("fig", 4, 2, "TCP cuts the photo's 313 KB into 215 numbered pieces. What is each piece called?", [
    "Segment", "Packet", "Frame", "Data link datagram"
  ], 0, "At transport, TCP's PDU is the segment. Going down, it becomes a packet (layer 3) and then a frame (layer 2).");
  layer("fig", 5, 3, "The phone shows a Wi-Fi signal, but doesn't associate with the router and can't reach anything on the local network. Which layer do you investigate?", 2,
    "There is signal (physical is fine), but the frame doesn't reach the next hop: Wi-Fi association, or MAC. That's the data link layer (2).");
  tf("fig", 6, 2, "At the destination, decapsulation goes from the bottom up: the data link removes the frame first and the application receives the photo last.", true,
    "Each layer checks and removes its header and passes the rest up, until only the photo is left for the app.");

  window.QUIZ = out;
})();
