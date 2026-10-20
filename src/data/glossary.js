import { storageRaidIo } from './glossary-storage-raid-io.js';
import { capAcidBase } from './glossary-cap-acid-base.js';
import { databases } from './glossary-databases.js';
import { cache } from './glossary-cache.js';
import { microsservicos } from './glossary-microsservicos.js';
import { apiGateways } from './glossary-api-gateways.js';
import { loadBalancers } from './glossary-load-balancers.js';
import { bff } from './glossary-bff.js';
// Glossário por módulo. Cada termo: term (nome na ficha), aliases (como aparece no texto, a primeira
// ocorrência por aula vira tocável), short (1 frase simples), layer (camada OSI, quando faz sentido)
// e lesson (id da aula onde é explicado). Plural com "s" simples é aceito sozinho pelo script.
const L1 = 'aula-1-introducao-a-protocolos', L2 = 'aula-2-modelo-osi', L3 = 'aula-3-ip-ipv4-ipv6',
  L4 = 'aula-4-tcp-e-udp', L5 = 'aula-5-ssl-e-tls', L6 = 'aula-6-dns', L7 = 'aula-7-dhcp',
  L8 = 'aula-8-http', L9 = 'aula-9-tempo-de-resposta';

export const glossaries = {
  'protocolos-de-rede': [
    { term: 'Protocolo', aliases: ['protocolo'], short: 'Combinado sobre como duas máquinas conversam: formato das mensagens, ordem e o que fazer se algo der errado.', lesson: L1 },
    { term: 'OSI', aliases: ['OSI', 'modelo OSI'], short: 'Mapa de 7 camadas que mostra onde cada parte da comunicação na rede acontece, do programa até o cabo.', lesson: L2 },
    { term: 'TCP/IP', aliases: ['TCP/IP', 'pilha TCP/IP'], short: 'A pilha de 4 camadas que a internet usa de verdade. É o OSI na versão que foi construída.', lesson: L2 },
    { term: 'PDU', aliases: ['PDU'], short: 'O pacote de dados com o nome que ele tem em cada camada: dados, segmento, pacote, quadro, bits.', lesson: L2 },
    { term: 'SDU', aliases: ['SDU'], short: 'O dado que veio da camada de cima, sem mexer. É o conteúdo que a camada vai embrulhar.', lesson: L2 },
    { term: 'PCI', aliases: ['PCI'], short: 'O cabeçalho que a camada põe na frente dos dados. PDU = PCI + SDU.', lesson: L2 },
    { term: 'Encapsulamento', aliases: ['encapsulamento', 'encapsula', 'encapsular', 'desencapsulamento', 'desencapsula'], short: 'Cada camada que o dado desce põe o seu cabeçalho por fora, como carta no envelope e envelope na caixa.', lesson: L2 },
    { term: 'Quadro (frame)', aliases: ['quadro', 'frame'], short: 'O pacote de dados da camada 2: leva o MAC de origem e de destino do próximo salto e um código de conferência no fim.', layer: 2, lesson: L2 },
    { term: 'Pacote', aliases: ['pacote'], short: 'O pacote de dados da camada 3: leva o IP de origem e de destino no cabeçalho.', layer: 3, lesson: L2 },
    { term: 'Segmento e datagrama', aliases: ['segmento', 'datagrama'], short: 'Pacote de dados da camada 4: segmento no TCP (com portas e número de sequência), datagrama no UDP (mensagem solta).', layer: 4, lesson: L2 },
    { term: 'MAC', aliases: ['MAC'], short: 'Endereço de fábrica da placa de rede. Serve para entregar ao vizinho na mesma rede local.', layer: 2, lesson: L2 },
    { term: 'ARP', aliases: ['ARP'], short: 'Pergunta em voz alta na rede local: "quem tem o IP X?". O dono responde com o seu MAC.', layer: 2, lesson: L3 },
    { term: 'IP', aliases: ['IP', 'endereço IP'], short: 'Endereço de um dispositivo na rede, como CEP e número. Diz ao pacote aonde chegar.', layer: 3, lesson: L3 },
    { term: 'IPv4', aliases: ['IPv4'], short: 'IP de 32 bits, escrito como 4 números (192.168.1.10). Cerca de 4,3 bilhões de endereços, e eles acabaram.', layer: 3, lesson: L3 },
    { term: 'IPv6', aliases: ['IPv6'], short: 'IP de 128 bits, escrito em 8 grupos hexadecimais (2001:db8::1). Espaço praticamente ilimitado.', layer: 3, lesson: L3 },
    { term: 'NAT', aliases: ['NAT'], short: 'Troca o IP privado pelo público na saída, e assim milhares de aparelhos dividem um IP só.', layer: 3, lesson: L3 },
    { term: 'TTL', aliases: ['TTL'], short: 'Prazo de validade. No IP, é o limite de saltos do pacote. No DNS, é o tempo que a resposta fica guardada.', lesson: L3 },
    { term: 'ICMP', aliases: ['ICMP'], short: 'O canal de avisos do IP: diz quando o pacote não chega ou o TTL zerou. O ping usa ele.', layer: 3, lesson: L3 },
    { term: 'ping', aliases: ['ping'], short: 'Manda um "tem alguém aí?" a um IP e mede quanto demora a resposta.', layer: 3, lesson: L3 },
    { term: 'traceroute', aliases: ['traceroute'], short: 'Mostra o caminho até um destino, roteador por roteador, com pacotes de TTL 1, 2, 3 e assim por diante.', layer: 3, lesson: L3 },
    { term: 'Roteador', aliases: ['roteador', 'roteadores'], short: 'Aparelho que lê o IP de destino e empurra o pacote para o próximo salto, de uma rede para outra.', layer: 3, lesson: L2 },
    { term: 'Porta', aliases: ['porta', 'portas'], short: 'Número que diz qual programa da máquina recebe os dados (443 é a do HTTPS).', layer: 4, lesson: L2 },
    { term: 'TCP', aliases: ['TCP'], short: 'Transporte com garantias: abre conexão, numera, confirma e reenvia o que se perde. Entrega na ordem.', layer: 4, lesson: L4 },
    { term: 'UDP', aliases: ['UDP'], short: 'Transporte sem garantias: manda e segue. Sem conexão, sem ordem, sem confirmação. Leve e rápido.', layer: 4, lesson: L4 },
    { term: 'Handshake', aliases: ['handshake', 'three-way handshake', 'handshake de três vias'], short: 'Troca de mensagens para combinar tudo antes de falar. No TCP são 3; no TLS, termina numa chave secreta.', lesson: L4 },
    { term: 'SYN', aliases: ['SYN', 'SYN-ACK'], short: 'Mensagem que abre a conexão TCP: "quero conversar". A resposta do servidor é o SYN-ACK.', layer: 4, lesson: L4 },
    { term: 'ACK', aliases: ['ACK'], short: 'Confirmação de recebimento. No TCP é cumulativo: "recebi tudo até aqui, espero o byte X".', layer: 4, lesson: L4 },
    { term: 'FIN', aliases: ['FIN'], short: 'Mensagem que diz "terminei de enviar". Cada lado manda a sua para fechar a conexão TCP.', layer: 4, lesson: L4 },
    { term: 'RTT', aliases: ['RTT', 'round-trip time'], short: 'Tempo de uma ida e volta entre você e o servidor. Cada handshake gasta pelo menos um.', lesson: L5 },
    { term: 'Latência', aliases: ['latência'], short: 'Atraso para o dado atravessar a rede, dominado pela distância. É o tamanho da estrada.', lesson: L9 },
    { term: 'Largura de banda', aliases: ['largura de banda', 'banda'], short: 'Quantos bits passam por segundo. É o número de pistas da estrada: não encurta a distância.', lesson: L9 },
    { term: 'TLS', aliases: ['TLS', 'TLS 1.2', 'TLS 1.3'], short: 'Embaralha a conversa para ninguém ler nem alterar no caminho. Sucessor do SSL.', layer: 6, lesson: L5 },
    { term: 'SSL', aliases: ['SSL'], short: 'O antecessor do TLS. O nome ficou na boca do povo, mas hoje o que roda é o TLS.', layer: 6, lesson: L5 },
    { term: 'Certificado', aliases: ['certificado'], short: 'Documento digital que o servidor mostra para provar quem é. Se vence, a conexão falha.', layer: 6, lesson: L5 },
    { term: 'DNS', aliases: ['DNS'], short: 'A lista telefônica da internet: troca um nome (demo.fidelissauro.dev) pelo IP.', layer: 7, lesson: L6 },
    { term: 'Resolver', aliases: ['resolver'], short: 'O servidor que faz as perguntas do DNS por você (o do provedor, o 8.8.8.8, o 1.1.1.1) e guarda as respostas.', lesson: L6 },
    { term: 'TLD', aliases: ['TLD'], short: 'O final do nome: .com, .dev, .br. O servidor do TLD sabe quem cuida de cada nome dentro dele.', lesson: L6 },
    { term: 'Autoritativo', aliases: ['autoritativo'], short: 'O servidor com a palavra final sobre um domínio. É ele que entrega o IP de verdade.', lesson: L6 },
    { term: 'Registro A e AAAA', aliases: ['registros A e AAAA', 'AAAA'], short: 'Linhas do DNS que ligam um nome a um IP. O A guarda um IPv4 e o AAAA guarda um IPv6.', lesson: L6 },
    { term: 'DHCP', aliases: ['DHCP'], short: 'Entrega IP, máscara, gateway e DNS sozinho para quem acabou de entrar na rede.', layer: 7, lesson: L7 },
    { term: 'DORA', aliases: ['DORA'], short: 'As 4 mensagens do DHCP: Discover, Offer, Request, Acknowledgment.', layer: 7, lesson: L7 },
    { term: 'HTTP', aliases: ['HTTP', 'HTTPS'], short: 'O protocolo de pedido e resposta da web. O HTTPS é o mesmo HTTP, mas por dentro do TLS.', layer: 7, lesson: L8 },
    { term: 'Status code', aliases: ['status code', 'Status Code'], short: 'Número de 3 dígitos da resposta HTTP: 2xx deu certo, 4xx erro de quem pediu, 5xx erro do servidor.', layer: 7, lesson: L8 },
    { term: 'HOL blocking', aliases: ['head-of-line blocking', 'HOL'], short: 'Uma resposta travada segura todas as que vêm atrás na fila, mesmo as que já estavam prontas.', lesson: L8 },
    { term: 'Multiplexação', aliases: ['multiplexação'], short: 'Várias requisições e respostas ao mesmo tempo na mesma conexão, sem uma esperar a outra.', lesson: L8 },
    { term: 'QUIC', aliases: ['QUIC'], short: 'Transporte moderno sobre UDP, com conexão, fluxos independentes e TLS 1.3 juntos. Base do HTTP/3.', layer: 4, lesson: L8 },
    { term: 'TTFB', aliases: ['TTFB'], short: 'Tempo até chegar o primeiro byte da resposta. Já inclui DNS, TCP e TLS.', lesson: L9 },
    { term: 'Keep-alive', aliases: ['keep-alive', 'conexão reutilizada', 'conexões persistentes'], short: 'Reaproveitar a conexão que já está aberta em vez de abrir outra, e pular os handshakes.', lesson: L9 },
    { term: 'Connection ID', aliases: ['Connection ID', 'connection ID'], short: 'Número que identifica a conexão QUIC no lugar de IP e porta. Por isso ela sobrevive à troca de rede.', lesson: L8 },
    { term: '0-RTT', aliases: ['0-RTT'], short: 'Retomada que já manda o pedido na primeira mensagem. Risco: alguém pode repetir esse pedido (replay).', lesson: L5 },
    { term: 'FCS', aliases: ['FCS'], short: 'Código no fim do quadro para o receptor perceber se algum bit chegou errado.', layer: 2, lesson: L2 }
  ],
  'storage-raid-io': storageRaidIo,
  'cap-acid-base': capAcidBase,
  databases,
  cache,
  microsservicos,
  'api-gateways': apiGateways,
  'load-balancers': loadBalancers,
  bff
};
