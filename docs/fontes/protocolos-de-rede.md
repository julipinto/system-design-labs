# Fontes: Protocolos de Rede

Registro dos links de fonte do módulo, com o que cada um traz de útil, em quais aulas entrou e se abriu na conferência.

**Fonte principal:** [Protocolos de rede, por Matheus Fidelis (fidelissauro.dev)](https://fidelissauro.dev/protocolos-de-rede/), citada em todas as 9 aulas.

**Aulas:** 1 O que é um protocolo · 2 Modelo OSI · 3 IP, IPv4 e IPv6 · 4 TCP e UDP · 5 TLS · 6 DNS · 7 DHCP · 8 HTTP/1.1, HTTP/2 e HTTP/3 · 9 Tempo de resposta

Conferência feita em 2026-10-17: 36 links, todos com status 200.

| Fonte | Tipo | O que tem de útil | Aulas | Status |
|---|---|---|---|---|
| [Protocolos de rede, Matheus Fidelis](https://fidelissauro.dev/protocolos-de-rede/) | artigo base | Base do módulo: as aulas seguem a ordem dele, da teoria de protocolos até o tempo de resposta. | 1, 2, 3, 4, 5, 6, 7, 8, 9 | 200 |
| [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293) | RFC/padrão | Define o TCP, com o controle de ordem, confirmação e janela que a aula 4 descreve. | 4 | 200 |
| [RFC 791: IP](https://www.rfc-editor.org/rfc/rfc791) | RFC/padrão | Define o IP, base da aula 3 sobre endereçamento e roteamento. | 3 | 200 |
| [RFC 8200: IPv6](https://www.rfc-editor.org/rfc/rfc8200) | RFC/padrão | Define o IPv6, com o cabeçalho mais simples para os roteadores, que a aula 3 destaca. | 3 | 200 |
| [RFC 792: ICMP](https://www.rfc-editor.org/rfc/rfc792) | RFC/padrão | Define as mensagens de aviso do IP, como destination unreachable e time exceeded, usadas pelo ping e pelo traceroute. | 3 | 200 |
| [RFC 826: ARP](https://www.rfc-editor.org/rfc/rfc826) | RFC/padrão | Define o ARP, que descobre o MAC de um IP na rede local. | 3 | 200 |
| [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768) | RFC/padrão | Define o UDP, cujo cabeçalho de 8 bytes a aula 4 compara com o do TCP. | 4 | 200 |
| [RFC 9260: SCTP](https://www.rfc-editor.org/rfc/rfc9260) | RFC/padrão | Define o SCTP, com multi-streaming e multihoming, citado na aula 4. | 4 | 200 |
| [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000) | RFC/padrão | Define o QUIC, transporte sobre UDP com fluxos independentes e TLS 1.3, base do HTTP/3. | 4, 8 | 200 |
| [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) | RFC/padrão | Define o TLS 1.3, cujo handshake de uma ida e volta a aula 5 compara com o TLS 1.2. | 5 | 200 |
| [RFC 1034: DNS, conceitos](https://www.rfc-editor.org/rfc/rfc1034) | RFC/padrão | Explica os conceitos do DNS, como a consulta que passa pelos servidores raiz, TLD e autoritativo. | 6 | 200 |
| [RFC 1035: DNS, implementação](https://www.rfc-editor.org/rfc/rfc1035) | RFC/padrão | Detalha a implementação do DNS e os registros A, AAAA, CNAME, NS, MX e TXT. | 6 | 200 |
| [RFC 2131: DHCP](https://www.rfc-editor.org/rfc/rfc2131) | RFC/padrão | Define o DHCP e o fluxo DORA (Discover, Offer, Request, Acknowledgment) da aula 7. | 7 | 200 |
| [RFC 9001: TLS para o QUIC](https://www.rfc-editor.org/rfc/rfc9001) | RFC/padrão | Mostra como o TLS protege o QUIC, detalhe citado na aula 8. | 8 | 200 |
| [RFC 9002: perda e congestionamento no QUIC](https://www.rfc-editor.org/rfc/rfc9002) | RFC/padrão | Descreve a detecção de perda e o controle de congestionamento do QUIC, com o parecido com NewReno. | 8 | 200 |
| [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114) | RFC/padrão | Define o HTTP/3, sobre o QUIC. | 8 | 200 |
| [RFC 9204: QPACK](https://www.rfc-editor.org/rfc/rfc9204) | RFC/padrão | Define o QPACK, a compressão de cabeçalhos do HTTP/3 que substitui o HPACK. | 8 | 200 |
| [RFC 9110: semântica do HTTP](https://www.rfc-editor.org/rfc/rfc9110) | RFC/padrão | Define a semântica do HTTP, comum às versões 1.1, 2 e 3. | 8 | 200 |
| [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) | RFC/padrão | Define o HTTP/2, que a aula 8 compara com o HTTP/3. | 8 | 200 |
| [ITU-T X.200 (ISO/IEC 7498-1:1994)](https://www.itu.int/rec/T-REC-X.200-199407-I/en) | RFC/padrão | Recomendação que equivale ao modelo de referência OSI da aula 2 (versão de 1994). | 2 | 200 |
| [IANA: servidores raiz](https://www.iana.org/domains/root/servers) | documentação | Lista oficial dos servidores raiz do DNS, citados na aula 6 como 13 conjuntos. | 6 | 200 |
| [MDN: protocolo](https://developer.mozilla.org/en-US/docs/Glossary/Protocol) | documentação | Definição de protocolo, usada na abertura do módulo. | 1 | 200 |
| [MDN: pacote](https://developer.mozilla.org/en-US/docs/Glossary/Packet) | documentação | Definição de pacote, usada na aula 1. | 1 | 200 |
| [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security) | documentação | Visão geral do TLS, de apoio à aula 5. | 5 | 200 |
| [MDN: latência](https://developer.mozilla.org/en-US/docs/Glossary/Latency) | documentação | Definição de latência, usada na aula 9 para separar RTT de banda. | 9 | 200 |
| [MDN: TTFB](https://developer.mozilla.org/en-US/docs/Glossary/Time_to_first_byte) | documentação | Definição do TTFB, o tempo até o primeiro byte da resposta. | 9 | 200 |
| [MDN: largura de banda](https://developer.mozilla.org/en-US/docs/Glossary/Bandwidth) | documentação | Definição de largura de banda, contraposta à latência na aula 9. | 9 | 200 |
| [Microsoft Learn: three-way handshake do TCP/IP](https://learn.microsoft.com/pt-br/troubleshoot/windows-server/networking/three-way-handshake-via-tcpip) | documentação | Explica o handshake de três vias do TCP, citado na aula 4. | 4 | 200 |
| [ipv6.br: endereçamento](https://ipv6.br/post/enderecamento/) | referência do artigo | Explica o endereçamento IPv6 em português, de apoio à aula 3. | 3 | 200 |
| [osi-model.com: camada de sessão](https://osi-model.com/session-layer/) | referência do artigo | Explica a camada de sessão, usada na aula 2. | 2 | 200 |
| [GeeksforGeeks: como o DORA funciona](https://www.geeksforgeeks.org/how-dora-works/) | referência do artigo | Explica o DORA do DHCP com exemplo, de apoio à aula 7. | 7 | 200 |
| [AWS: o que é certificado SSL](https://aws.amazon.com/pt/what-is/ssl-certificate/) | referência do artigo | Explica o que é um certificado SSL, de apoio à aula 5. | 5 | 200 |
| [AWS: diferença entre SSL e TLS](https://aws.amazon.com/pt/compare/the-difference-between-ssl-and-tls/) | referência do artigo | Compara SSL e TLS, citado na aula 5. | 5 | 200 |
| [Cloudflare: um ano de HTTP/3](https://blog.cloudflare.com/http3-usage-one-year-on) | referência do artigo | Mostra como o HTTP/3 foi usado na prática depois de um ano, citado na aula 8. | 8 | 200 |
| [root-servers.org: mapa dos servidores raiz](https://root-servers.org/) | outro | Mapa dos servidores raiz, de apoio à aula 6. | 6 | 200 |
| [http.cat: códigos de status](https://http.cat/) | outro | Códigos de status HTTP ilustrados, para memorizar na aula 8. | 8 | 200 |
| Livro Redes de Computadores, Andrew Tanenbaum | livro | Referência de apoio ao modelo OSI na aula 2. Sem link, não entra na conferência. | 2 | sem link |

## Links que não abriram

Nenhum. Todos os 36 links retornaram 200.
