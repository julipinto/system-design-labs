/* Banco de perguntas do quiz de Protocolos de Rede.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (answer = camada 1..7), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-introducao-a-protocolos", name: "O que é um protocolo" },
    t2: { topic: "aula-2-modelo-osi", name: "Modelo OSI" },
    t3: { topic: "aula-3-ip-ipv4-ipv6", name: "IP, IPv4 e IPv6" },
    t4: { topic: "aula-4-tcp-e-udp", name: "TCP e UDP" },
    t5: { topic: "aula-5-ssl-e-tls", name: "TLS" },
    t6: { topic: "aula-6-dns", name: "DNS" },
    t7: { topic: "aula-7-dhcp", name: "DHCP" },
    t8: { topic: "aula-8-http", name: "HTTP/1.1, HTTP/2 e HTTP/3" },
    t9: { topic: "aula-9-tempo-de-resposta", name: "Tempo de resposta" },
    fig: { topic: "aula-2-modelo-osi", name: "Figura OSI / encapsulamento", group: "figura-osi" }
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

  /* ---------- 1. O que é um protocolo ---------- */
  choice("t1", 1, 1, "O que um protocolo define?", [
    "Formato das mensagens, ordem da conversa e o que fazer quando algo dá errado.",
    "Apenas a velocidade do cabo entre as duas máquinas.",
    "A linguagem de programação que os dois lados precisam usar.",
    "O endereço IP de cada máquina da conversa."
  ], 0, "Protocolo é um acordo sobre formato, ordem e tratamento de erro. Linguagem, cabo e IP são outros assuntos.");
  choice("t1", 2, 1, "Dois sistemas que nunca se viram conseguem conversar. Por quê?", [
    "Porque seguem o mesmo protocolo, um acordo conhecido sobre as mensagens.",
    "Porque rodam o mesmo sistema operacional.",
    "Porque estão ligados na mesma rede física.",
    "Porque um deles adivinha o formato do outro."
  ], 0, "Sem o acordo, os bytes chegam e ninguém sabe o que são. Sistema operacional e rede física não bastam.");
  tf("t1", 3, 1, "Cada protocolo da pilha usa os serviços do que está abaixo e serve o que está acima.", true,
    "É isso que \"empilhar\" quer dizer: cada camada resolve um pedaço e entrega o resultado à vizinha.");
  tf("t1", 4, 2, "Mais garantias de entrega (confirmação, retransmissão) não custam nada em latência.", false,
    "Confiabilidade custa idas e vindas de mensagens, e cada ida e volta custa tempo.");
  choice("t1", 5, 2, "Escolher entre gRPC e REST, TCP e UDP, ou uma conexão e várias é que tipo de decisão?", [
    "Decisão de protocolo: troca performance e resiliência.",
    "Detalhe de estilo, sem efeito na latência.",
    "Decisão que só importa para o front-end.",
    "Decisão que a camada física resolve sozinha."
  ], 0, "Toda escolha dessas é uma escolha de protocolo, com custo e benefício em desempenho e resiliência.");
  choice("t1", 6, 2, "Qual é o ganho de separar a rede em camadas?", [
    "Dá para trocar Wi-Fi por fibra sem reescrever o HTTP.",
    "Todas as camadas passam a ser mais rápidas.",
    "O HTTP passa a conhecer o sinal que viaja no cabo.",
    "Some a necessidade de cabeçalhos."
  ], 0, "Cada camada esconde seus detalhes das outras. O HTTP não sabe como o sinal viaja, então a camada de baixo muda sem afetá-lo.");
  choice("t1", 7, 3, "Dois serviços seus trocam mensagens. Um deles muda o formato de um campo sem avisar o outro e as chamadas passam a falhar. O que quebrou?", [
    "O acordo (protocolo) entre eles: o outro lado não sabe mais ler os bytes.",
    "A camada física, que deixou de transmitir bits.",
    "O roteamento entre as redes.",
    "A largura de banda do enlace."
  ], 0, "A rede entregou os bytes direitinho. O que faltou foi o formato combinado: mudar o contrato sem avisar quebra a conversa.");

  /* ---------- 2. Modelo OSI ---------- */
  order("t2", 1, 1, "Coloque as camadas do OSI na ordem, de cima (mais perto do programa) para baixo (mais perto do cabo).", [
    "7 · Aplicação", "6 · Apresentação", "5 · Sessão", "4 · Transporte", "3 · Rede", "2 · Enlace", "1 · Física"
  ], "Mnemônico de baixo para cima: Foto Enviada Rapidinho, Tóquio Sorriu, Aplaudiu Alto. Lendo ao contrário, você tem a ordem de cima para baixo.");
  choice("t2", 2, 1, "Quem criou o modelo OSI e quando?", [
    "A ISO, nos anos 1980.",
    "A IETF, junto com o TCP/IP, nos anos 1960.",
    "A Xerox, junto com a Ethernet, nos anos 1990.",
    "Tim Berners-Lee, no CERN, junto com a web."
  ], 0, "O OSI é um padrão da ISO dos anos 1980. Hoje serve como mapa conceitual e para diagnosticar problemas.");
  choice("t2", 3, 1, "Como se chama a PDU da camada de Rede (camada 3)?", [
    "Pacote", "Quadro", "Segmento", "Bits"
  ], 0, "Rede: pacote. Enlace: quadro. Transporte: segmento (TCP) ou datagrama (UDP). Física: bits.");
  choice("t2", 4, 2, "Em que camada trabalham o roteador e o switch Ethernet comum?", [
    "Roteador na 3, switch na 2.",
    "Roteador na 4, switch na 3.",
    "Os dois na camada 3.",
    "Os dois na camada 2."
  ], 0, "O roteador decide pelo IP (camada 3). O switch decide pelo MAC (camada 2).");
  tf("t2", 5, 2, "A pilha que roda de verdade na internet é o OSI de 7 camadas.", false,
    "O que foi implementado é o TCP/IP, de 4 camadas. O OSI ficou como modelo didático e de troubleshooting.");
  choice("t2", 6, 2, "Como o TCP/IP (4 camadas) agrupa as camadas do OSI?", [
    "Aplicação junta 7, 6 e 5; Transporte; Internet; Acesso à rede junta 2 e 1.",
    "Aplicação junta 7 e 6; Transporte junta 5 e 4; Internet; Acesso à rede.",
    "Aplicação; Transporte; Internet junta 3 e 2; Acesso à rede só a 1.",
    "Cada camada do OSI vira uma do TCP/IP, mas com outros nomes."
  ], 0, "7+6+5 viram Aplicação, 4 vira Transporte, 3 vira Internet, 2+1 viram Acesso à rede.");
  layer("t2", 7, 1, "Em que camada o endereço MAC é usado?", 2,
    "O MAC identifica o vizinho na mesma rede local. É assunto do enlace (camada 2).");
  layer("t2", 8, 1, "Em que camada ficam os pulsos de luz da fibra óptica?", 1,
    "A camada física transmite bits: luz na fibra, tensão no cobre, rádio no Wi-Fi.");

  /* ---------- 3. IP, IPv4 e IPv6 ---------- */
  choice("t3", 1, 1, "Quantos bits têm um endereço IPv4 e um IPv6?", [
    "32 e 128", "16 e 64", "64 e 128", "32 e 256"
  ], 0, "IPv4: 32 bits (cerca de 4,3 bilhões de endereços). IPv6: 128 bits. O espaço do IPv4 acabou, por isso o IPv6.");
  tf("t3", 2, 1, "O IP garante que os pacotes cheguem em ordem e sem perda.", false,
    "O IP só leva o pacote ao destino, sem garantia. Ordem e entrega são trabalho do TCP, na camada 4.");
  choice("t3", 3, 2, "Qual destes endereços é privado (não roteado na internet)?", [
    "172.20.4.9", "172.32.0.1", "192.169.1.1", "11.0.0.1"
  ], 0, "A faixa privada 172.16.0.0/12 vai de 172.16.0.0 a 172.31.255.255. As outras faixas privadas são 10/8 e 192.168/16.");
  choice("t3", 4, 2, "Seu PC tem 192.168.1.10, mas o mundo enxerga outro IP. Quem faz essa tradução?", [
    "O NAT", "O DHCP", "O ARP", "O TCP"
  ], 0, "O NAT troca o IP privado por um público na saída. O DHCP só entrega o IP, e o ARP descobre MACs na LAN.");
  layer("t3", 5, 1, "O roteador lê o IP de destino para escolher o próximo salto. Em que camada isso acontece?", 3,
    "Endereçamento IP e roteamento são da camada de Rede (3).");
  layer("t3", 6, 2, "O ping falha com \"no route to host\". Qual camada você investiga primeiro?", 3,
    "Falta de rota é problema de roteamento: camada 3. Ferramentas típicas: ping e traceroute.");
  choice("t3", 7, 2, "Para o seu domínio ser alcançado por IPv6, o que precisa existir no DNS?", [
    "Um registro AAAA com o endereço IPv6.",
    "Um registro MX.",
    "Um registro NS por usuário.",
    "Um registro A com o endereço IPv6."
  ], 0, "A guarda IPv4, AAAA guarda IPv6. O dual stack depende de os dois lados terem suporte.");
  choice("t3", 8, 3, "Milhares de instâncias saem para a internet por um único IP via NAT. Qual risco aparece com muitas conexões saindo?", [
    "Esgotar as portas do NAT, e novas conexões falharem ou darem timeout.",
    "O cabeçalho IP crescer a cada conexão.",
    "O DNS deixar de resolver nomes públicos.",
    "Dois aparelhos ficarem com o mesmo MAC."
  ], 0, "O NAT diferencia as conexões pelas portas. Sob muita conexão saindo elas acabam, e as novas conexões falham.");

  /* ---------- 4. TCP e UDP ---------- */
  order("t4", 1, 1, "Abertura de conexão TCP: coloque o three-way handshake na ordem.", [
    "Cliente envia SYN", "Servidor responde SYN-ACK", "Cliente envia ACK"
  ], "SYN, SYN-ACK, ACK. Custa 1 RTT antes de qualquer dado, e cada lado escolhe seu número de sequência inicial.");
  order("t4", 2, 2, "Fechamento TCP (four-way close): coloque na ordem.", [
    "Lado A envia FIN", "Lado B responde ACK", "Lado B envia FIN", "Lado A responde ACK"
  ], "Cada lado manda seu FIN e recebe um ACK. Na prática o ACK e o segundo FIN às vezes viajam juntos, mas o modelo de estudo tem 4 passos.");
  choice("t4", 3, 1, "Qual descrição combina com o UDP?", [
    "Sem conexão, sem ordem e sem confirmação de entrega.",
    "Abre conexão com três mensagens e reenvia o que se perde.",
    "Garante que tudo chega, mas só dentro de uma rede local.",
    "Criptografa os datagramas por padrão."
  ], 0, "UDP manda datagramas independentes e ignora o que se perde. Quem quiser garantias precisa construí-las por cima.");
  tf("t4", 4, 2, "No TCP, o ACK é cumulativo: significa \"recebi tudo até aqui e espero o número X\".", true,
    "Por isso um buraco no meio (bytes que não chegaram) segura o ACK até ser retransmitido.");
  choice("t4", 5, 2, "Qual caso combina melhor com UDP?", [
    "Voz em chamada: o dado velho já não vale nada.",
    "Cobrança de um pagamento.",
    "Consulta SQL a um banco.",
    "Upload de um arquivo que não pode corromper."
  ], 0, "Voz tolera perder um pedacinho e não adianta reenviar tarde. Pagamento, SQL e arquivo não podem faltar: TCP.");
  tf("t4", 6, 2, "O handshake do TCP é custo fixo por conexão, e por isso existem keep-alive e pool de conexões.", true,
    "Reaproveitar a conexão evita pagar o 1 RTT do handshake (e o do TLS) toda vez.");
  layer("t4", 7, 1, "Um load balancer que decide só por IP e porta de destino trabalha em que camada?", 4,
    "IP e porta: camada 4 (L4). Quando o balanceador lê o HTTP para rotear por caminho ou header, ele é L7.");
  layer("t4", 8, 3, "O ping para o servidor responde, mas o app dá timeout: o SYN para a porta 443 fica sem resposta. Qual camada investigar primeiro?", 4,
    "O IP está ok (o ping responde), então o problema está na porta: firewall ou security group filtrando, ou nada escutando. É transporte (4). Se fosse porta fechada, viria \"connection refused\".");

  /* ---------- 5. TLS ---------- */
  choice("t5", 1, 1, "O que o TLS garante?", [
    "Privacidade (criptografia) e integridade (ninguém altera no caminho).",
    "Que o servidor nunca cai.",
    "Que a resposta chega mais rápido.",
    "Que os pacotes chegam em ordem."
  ], 0, "Criptografia e integridade. Ordem de entrega é do TCP, e o TLS ainda soma tempo de handshake.");
  choice("t5", 2, 2, "Depois do handshake, o que criptografa os dados da conversa?", [
    "Uma chave de sessão simétrica, única para aquela conexão.",
    "A chave privada do servidor.",
    "O certificado, que viaja com cada pacote.",
    "A senha do usuário."
  ], 0, "Assimétrica na negociação, simétrica nos dados: a chave de sessão é a que cifra o resto da conversa.");
  order("t5", 3, 2, "Coloque as etapas do TLS na ordem (versão simplificada).", [
    "Negociam versão e algoritmos",
    "Servidor prova quem é com um certificado",
    "Os dois derivam a chave de sessão",
    "Dados trafegam cifrados com a chave de sessão"
  ], "Negociar, provar identidade, chegar a uma chave de sessão e só então cifrar os dados.");
  choice("t5", 4, 2, "Com TCP + TLS 1.3, quantos RTTs passam antes de a requisição HTTP poder sair?", [
    "2", "1", "3", "4"
  ], 0, "TCP: 1 RTT. TLS 1.3: 1 RTT. Total 2. Com TLS 1.2 seriam 3.");
  tf("t5", 5, 2, "O handshake do TLS 1.3 gasta 1 RTT; o do TLS 1.2 gasta 2.", true,
    "Foi um dos ganhos da versão 1.3. Na retomada de sessão ainda existe o 0-RTT, com ressalvas de segurança como replay.");
  layer("t5", 6, 2, "Neste módulo, em que camada do OSI fica a função de comprimir e cifrar os dados?", 6,
    "Apresentação (6): formato, compressão e criptografia. É a convenção do módulo, já que na prática o TLS roda entre o transporte e a aplicação.");
  choice("t5", 7, 3, "Às 3h todos os clientes passam a receber erro de certificado, e nada mudou no código. Qual é a causa clássica?", [
    "Certificado expirado.",
    "Pool DHCP esgotado.",
    "Muitas retransmissões TCP.",
    "TTL do DNS alto demais."
  ], 0, "Certificado expirado é uma das causas mais clássicas de indisponibilidade. Vale monitorar a data de validade.");
  choice("t5", 8, 3, "Usuários distantes sofrem com o tempo do handshake TLS. O que ajuda mais?", [
    "Terminar o TLS perto deles, em um CDN ou load balancer de borda.",
    "Aumentar a banda do servidor de origem.",
    "Trocar a chave por uma maior.",
    "Desligar o TCP."
  ], 0, "O custo está nos RTTs, e a distância manda no RTT. Encerrar o handshake perto do usuário encurta cada ida e volta.");

  /* ---------- 6. DNS ---------- */
  order("t6", 1, 1, "Resolução de nome sem nada em cache: coloque na ordem em que cada passo é consultado.", [
    "Cache (navegador, sistema, resolver)",
    "Servidor raiz",
    "Servidor do TLD (.dev)",
    "Servidor autoritativo"
  ], "Cache primeiro. Raiz indica o TLD, o TLD indica o autoritativo, e o autoritativo dá o IP.");
  choice("t6", 2, 1, "Quem dá a resposta final com o IP do nome?", [
    "O servidor autoritativo.",
    "O servidor raiz.",
    "O servidor do TLD.",
    "O roteador de casa."
  ], 0, "Raiz e TLD só indicam o próximo servidor. A palavra final é do autoritativo.");
  choice("t6", 3, 2, "Qual registro DNS cria um apelido que aponta para outro nome?", [
    "CNAME", "A", "NS", "MX"
  ], 0, "CNAME é apelido. A guarda IPv4, NS diz quem é autoritativo e MX trata de e-mail.");
  choice("t6", 4, 2, "Qual registro guarda um endereço IPv6?", [
    "AAAA", "A", "TXT", "CNAME"
  ], 0, "A guarda IPv4. AAAA (quatro As, por ser quatro vezes maior) guarda IPv6.");
  tf("t6", 5, 2, "TTL alto reduz consultas ao DNS, mas atrasa uma troca de IP (failover).", true,
    "É um equilíbrio: TTL alto, menos consultas e failover lento. TTL baixo, troca rápida e mais consultas.");
  choice("t6", 6, 3, "Você trocou o IP do servidor, mas parte dos usuários continua indo ao IP antigo por horas. Causa mais provável?", [
    "TTL alto: o IP antigo ainda está em cache.",
    "O DHCP não renovou o lease.",
    "O TLS 1.2 está lento.",
    "O HTTP/3 perdeu um pacote."
  ], 0, "Resolvers e navegadores guardam a resposta até o TTL vencer. Antes de uma migração, vale baixar o TTL.");
  choice("t6", 7, 3, "O app não abre pelo nome, mas abre quando você usa o IP direto. Onde investigar?", [
    "Na resolução de nomes (DNS).",
    "No cabo de rede.",
    "No handshake TCP da porta.",
    "No pool de endereços do DHCP."
  ], 0, "Se o IP funciona, a rede e a porta estão ok. Falta só traduzir o nome em IP: DNS.");
  tf("t6", 8, 2, "O servidor raiz responde diretamente o IP de demo.fidelissauro.dev.", false,
    "A raiz só sabe quem cuida do .dev. Quem tem o IP do nome é o autoritativo.");

  /* ---------- 7. DHCP ---------- */
  order("t7", 1, 1, "Coloque as quatro mensagens do DHCP (DORA) na ordem.", [
    "Discover: cliente procura um servidor",
    "Offer: servidor oferece IP e configurações",
    "Request: cliente pede a oferta escolhida",
    "Acknowledgment: servidor confirma"
  ], "Discover, Offer, Request, Acknowledgment. Ao final, o IP é do cliente pelo tempo do lease.");
  choice("t7", 2, 1, "O que o DHCP entrega a quem acabou de entrar na rede?", [
    "IP, máscara, gateway, DNS e tempo de lease.",
    "Só o endereço MAC.",
    "Um certificado TLS.",
    "A rota até o servidor autoritativo."
  ], 0, "O DHCP configura a rede automaticamente: IP, máscara, gateway e DNS, por um tempo (lease).");
  choice("t7", 3, 2, "Por que o Discover vai em broadcast?", [
    "Porque o cliente ainda não tem IP e não sabe quem é o servidor.",
    "Porque o broadcast é mais seguro.",
    "Porque o servidor só escuta broadcast depois das 22h.",
    "Porque o TCP exige."
  ], 0, "Sem IP nem endereço do servidor, o cliente grita para toda a rede local e espera alguém responder.");
  choice("t7", 4, 2, "O aparelho aparece com um IP 169.254.x.x. O que isso indica?", [
    "Ele não conseguiu resposta de um servidor DHCP.",
    "Ele ganhou um IP público válido.",
    "O NAT esgotou as portas.",
    "O DNS caiu."
  ], 0, "169.254.x.x é um endereço local que o próprio aparelho se atribui quando o DHCP não responde. Sintoma clássico.");
  tf("t7", 5, 2, "O IP recebido por DHCP é do aparelho para sempre.", false,
    "É emprestado por um lease e renovado antes de vencer. Quando o aparelho sai, o endereço volta ao pool.");
  tf("t7", 6, 1, "O DHCP usa UDP, com as portas 67 (servidor) e 68 (cliente).", true,
    "Cliente sem IP e sem conexão: o DHCP vai sobre UDP, em broadcast nas primeiras mensagens.");
  choice("t7", 7, 3, "Notebooks novos ficam sem rede com IP 169.254.x.x, e os antigos seguem normais. Hipótese mais provável?", [
    "O pool do DHCP esgotou ou o servidor DHCP caiu.",
    "O certificado TLS do site expirou.",
    "O TTL do DNS está alto.",
    "O HTTP/2 tem head-of-line blocking."
  ], 0, "Os antigos já têm lease e continuam funcionando. Quem chega agora não consegue endereço.");

  /* ---------- 8. HTTP ---------- */
  choice("t8", 1, 1, "O que é head-of-line blocking?", [
    "Uma resposta travada segurar as que vêm atrás dela.",
    "O servidor recusar conexões de um cliente.",
    "O DNS devolver um IP antigo.",
    "O certificado TLS expirar."
  ], 0, "É o problema que as três versões do HTTP tentam resolver, cada uma à sua maneira.");
  choice("t8", 2, 1, "Uma resposta 404 pertence a que classe de status?", [
    "4xx: erro do cliente.",
    "5xx: erro do servidor.",
    "3xx: redirecionamento.",
    "2xx: sucesso."
  ], 0, "4xx é erro do cliente (pediu algo que não existe, sem permissão). 5xx é erro do servidor.");
  choice("t8", 3, 2, "Por que o HTTP/2 ainda sofre head-of-line blocking com perda de pacotes?", [
    "Porque roda sobre TCP: um pacote perdido segura todos os fluxos até ser retransmitido.",
    "Porque só consegue fazer uma requisição por conexão.",
    "Porque não usa cabeçalhos.",
    "Porque o servidor responde sempre na ordem inversa."
  ], 0, "O HTTP/2 multiplexa vários fluxos numa conexão TCP, mas o TCP entrega bytes em ordem e trava tudo atrás do buraco.");
  choice("t8", 4, 2, "Sobre o que roda o HTTP/3?", [
    "QUIC, sobre UDP.",
    "TCP, com TLS 1.2.",
    "SCTP.",
    "Direto sobre IP, sem transporte."
  ], 0, "O HTTP/3 troca o TCP pelo QUIC, que roda sobre UDP e traz o TLS 1.3 embutido no handshake.");
  tf("t8", 5, 2, "No HTTP/3, a conexão pode sobreviver à troca de Wi-Fi para dados móveis, graças ao Connection ID.", true,
    "O QUIC identifica a conexão por um ID, e não por IP e porta. Por isso a troca de rede não derruba a conversa.");
  tf("t8", 6, 2, "No HTTP/1.1, cada requisição precisa abrir uma conexão TCP nova.", false,
    "O HTTP/1.1 tem conexões persistentes. O problema é outro: uma resposta lenta bloqueia as seguintes na mesma conexão.");
  layer("t8", 7, 1, "A conexão abriu normalmente, mas a API respondeu 500. Em que camada do OSI está o problema?", 7,
    "Códigos de status HTTP pertencem à camada de Aplicação (7). A conexão funcionou; a resposta é que veio errada.");
  choice("t8", 8, 3, "O app móvel sofre em redes instáveis. Sem mexer no backend, o que ajuda mais?", [
    "Terminar HTTP/3 em um CDN ou load balancer.",
    "Voltar para HTTP/1.1 com uma conexão só.",
    "Aumentar a banda do servidor.",
    "Reduzir o TTL do DNS para 1 segundo."
  ], 0, "O HTTP/3 isola perdas entre fluxos e sobrevive à troca de rede. Terminar no CDN é a adoção mais simples.");

  /* ---------- 9. Tempo de resposta ---------- */
  order("t9", 1, 2, "Em uma requisição HTTPS nova, coloque as parcelas do tempo na ordem em que acontecem.", [
    "DNS", "Handshake TCP", "Handshake TLS", "Espera pelo primeiro byte", "Download"
  ], "Descobrir o IP, abrir o TCP, negociar o TLS, pedir e esperar o primeiro byte, e só então baixar o conteúdo.");
  choice("t9", 2, 1, "O que é o RTT?", [
    "O tempo de uma ida e volta entre cliente e servidor.",
    "O tempo que o servidor leva para processar a requisição.",
    "A largura de banda do enlace.",
    "O tamanho do cabeçalho TCP."
  ], 0, "RTT (round-trip time) é ida e volta. É dominado pela latência: distância e velocidade da luz.");
  choice("t9", 3, 2, "Para uma resposta pequena, o que mais reduz o tempo?", [
    "Cortar um RTT (por exemplo, reaproveitando a conexão).",
    "Dobrar a largura de banda.",
    "Trocar o tamanho do cabeçalho do IP.",
    "Aumentar o TTL do DNS para 1 ano."
  ], 0, "Em respostas pequenas, quase tudo é RTT. Dobrar a banda quase não muda nada. Cortar um RTT muda tudo.");
  choice("t9", 4, 2, "Conexão nova, TCP + TLS 1.3, sem DNS: em quantos RTTs chega o primeiro byte da resposta?", [
    "3", "2", "4", "1"
  ], 0, "1 do TCP + 1 do TLS + 1 do pedido e resposta = 3. Com TLS 1.2 seriam 4.");
  choice("t9", 5, 2, "Conexão reutilizada (keep-alive): em quantos RTTs chega o primeiro byte?", [
    "1", "0", "2", "3"
  ], 0, "Handshakes já foram pagos. Sobra o RTT do pedido e da resposta, mais o tempo do servidor.");
  tf("t9", 6, 2, "Para avaliar o tempo de resposta, basta olhar a média.", false,
    "A média esconde as piores experiências. Meça percentis (p95, p99).");
  tf("t9", 7, 2, "HTTP/3 com retomada 0-RTT pode ter o primeiro byte da resposta em 1 RTT.", true,
    "Sem handshakes antes do pedido, sobra só o RTT do pedido e da resposta. O 0-RTT tem ressalvas de segurança, como replay.");
  choice("t9", 8, 3, "Uma API devolve 2 KB, os usuários estão longe e o p95 está alto. Qual ataque faz mais sentido?", [
    "Reutilizar conexões e aproximar o servidor ou CDN do usuário.",
    "Dobrar a banda do servidor.",
    "Trocar JSON por XML.",
    "Adicionar mais servidores na mesma região."
  ], 0, "Resposta pequena e usuário distante: o tempo é de RTT. A ordem é eliminar RTTs, depois reduzir o servidor, e só então comprar banda.");

  /* ---------- Figura OSI / encapsulamento ---------- */
  choice("fig", 1, 1, "Na figura, a foto desce da camada 4 para a camada 3. O que ela ganha?", [
    "O cabeçalho IP, com origem e destino, e vira um pacote.",
    "O cabeçalho TCP, com portas e números de sequência.",
    "A criptografia TLS.",
    "O MAC do próximo salto."
  ], 0, "A camada 3 põe o IP de origem e destino: é esse rótulo que os roteadores leem. O TCP entrou antes, na camada 4.");
  order("fig", 2, 2, "Na descida, qual a ordem em que cada envelope é colocado em volta da foto?", [
    "Cabeçalho HTTP (7)",
    "Compressão e TLS (6)",
    "Sessão (5)",
    "Cabeçalho TCP (4)",
    "Cabeçalho IP (3)",
    "MAC e FCS do enlace (2)"
  ], "De cima para baixo, camada por camada. Na física (1) não há envelope: o quadro vira sinal.");
  choice("fig", 3, 2, "Durante o caminho pelos roteadores, o que muda e o que fica igual?", [
    "O IP de destino fica igual; o MAC muda a cada salto.",
    "O MAC fica igual; o IP de destino muda a cada salto.",
    "Os dois ficam iguais até o destino.",
    "Os dois mudam a cada salto."
  ], 0, "O roteador sobe só até a camada 3, lê o IP, monta um quadro novo com o MAC do próximo salto e manda adiante.");
  choice("fig", 4, 2, "O TCP corta os 313 KB da foto em 215 pedaços numerados. Como se chama cada pedaço?", [
    "Segmento", "Pacote", "Quadro", "Datagrama de enlace"
  ], 0, "No transporte, a PDU do TCP é o segmento. Ao descer, vira pacote (camada 3) e depois quadro (camada 2).");
  layer("fig", 5, 3, "O celular mostra sinal de Wi-Fi, mas não se associa ao roteador e não alcança nada da rede local. Qual camada investigar?", 2,
    "Tem sinal (física ok), mas o quadro não chega ao próximo salto: associação Wi-Fi, ou MAC. É a camada de enlace (2).");
  tf("fig", 6, 2, "No destino, o desencapsulamento vai de baixo para cima: o enlace tira o quadro primeiro e a aplicação recebe a foto por último.", true,
    "Cada camada confere e tira o seu cabeçalho e passa o resto para cima, até sobrar só a foto para o app.");

  window.QUIZ = out;
})();
