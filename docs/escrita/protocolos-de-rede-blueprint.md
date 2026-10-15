# Blueprint: Protocolos de Rede (módulo 1)

Aprovado pelo próprio agente seguindo PREMISSAS.md e ESCRITA.md (a Juliana revisa depois). Decisões registradas no fim.

## Fio condutor
Para a foto do gato chegar da Lena ao irmão, cada protocolo responde a uma pergunta que o anterior deixou em aberto (quem entende o quê, para onde vai, com que garantia, em segredo, com que nome, a partir de que endereço, em que formato), e cada resposta custa idas e voltas (RTTs), que a última aula soma.

## Exemplo e personagens canônicos
- **Lena** (São Paulo) manda a **foto do gato** ao **irmão** (Tóquio). Números da figura OSI: 7,68 MB, 313 KB depois de comprimir e cifrar, 215 fatias de até 1.460 bytes, IP de destino 198.51.100.7.
- A mesma Lena aparece nas figuras de TLS (Wi-Fi público, RTT de 80 ms), DNS (`demo.fidelissauro.dev`), DHCP (café, IP 192.168.0.105) e HTTP (página de loja no notebook, 6 arquivos, RTT de 80 ms). O irmão só aparece na aula 2.
- A figura do TCP usa um exemplo menor e inventado (300 bytes, 3 segmentos de 100 bytes, celular e servidor). A aula 4 avisa isso e liga ao exemplo das 215 fatias.
- RTT de 80 ms é o valor comum de TLS, HTTP e da calculadora da aula 9.

## Ordem didática x ordem real
As aulas seguem a ordem do mapa (camadas, depois cada camada de cima para baixo na rede, depois a aplicação). Na vida real a ordem no tempo é outra: DHCP, DNS, TCP, TLS, HTTP. A aula 7 diz isso de forma explícita, para a leitora não achar que o DHCP é "o último passo".

## Por aula

### 1. O que é um protocolo
- **Tese:** protocolo é o acordo de formato e ordem das mensagens, e os protocolos se empilham em camadas.
- **Problema de abertura:** início do módulo. Abre com o caso concreto: a Lena manda uma foto e dois sistemas que nunca se viram precisam se entender.
- **Pergunta que deixa:** se os protocolos se empilham, quais são as camadas e o que cada uma faz com a foto?

### 2. Modelo OSI
- **Tese:** o OSI dá nome às 7 camadas, e cada uma embrulha os dados da de cima com o seu cabeçalho até virarem bits.
- **Problema de abertura:** "empilham, mas quais camadas?" Segue a foto da Lena descendo a pilha.
- **Pergunta que deixa:** na camada 3 o pacote precisa de um endereço que valha no mundo inteiro. Como o IP faz isso?

### 3. IP, IPv4 e IPv6
- **Tese:** o IP dá a cada dispositivo um endereço lógico na camada 3, e o IPv6 existe porque os 32 bits do IPv4 acabaram.
- **Problema de abertura:** cada uma das 215 fatias precisa saber para onde vai (o 198.51.100.7 da figura da aula 2).
- **Pergunta que deixa:** o IP leva a fatia até a máquina certa, mas não garante entrega nem ordem. Quem garante?

### 4. TCP e UDP
- **Tese:** o TCP troca velocidade por garantia (conexão, numeração, ACK, reenvio); o UDP faz o contrário.
- **Problema de abertura:** o IP pode perder, duplicar ou trocar a ordem das fatias.
- **Pergunta que deixa:** o TCP entrega tudo inteiro, mas em claro. No Wi-Fi do café qualquer um lê o gato. Como esconder?

### 5. TLS
- **Tese:** o TLS autentica o servidor e cifra a conversa com uma chave de sessão que os dois combinam sem que ninguém no meio a veja.
- **Problema de abertura:** o TCP entrega em claro; a camada 6 da aula 2 já mostrou a foto virando ruído, e aqui vem o "como".
- **Pergunta que deixa:** tudo isso supõe que a Lena já tem o IP do servidor. De onde ele vem?

### 6. DNS
- **Tese:** o DNS troca nome por IP perguntando a servidores cada vez mais específicos, e o cache faz quase toda consulta custar pouco.
- **Problema de abertura:** a Lena toca num link com nome, e o celular precisa de um IP antes de abrir qualquer conexão.
- **Pergunta que deixa:** o DNS só funciona se o celular já tem IP e sabe qual resolver perguntar. Quem entrega isso a quem acabou de chegar na rede?

### 7. DHCP
- **Tese:** o DHCP empresta IP, máscara, gateway e DNS a quem entra na rede, em 4 mensagens (DORA).
- **Problema de abertura:** o celular da Lena chega no café sem IP, sem gateway e sem DNS.
- **Pergunta que deixa:** com a rede configurada, o celular está pronto para falar. O que ele diz, e por que o HTTP ganhou três versões?

### 8. HTTP/1.1, HTTP/2 e HTTP/3
- **Tese:** cada versão do HTTP ataca o head-of-line blocking; o HTTP/3 troca o TCP pelo QUIC.
- **Problema de abertura:** a página da loja precisa de 6 arquivos e uma resposta travada segura as outras.
- **Pergunta que deixa:** cada versão corta esperas. Quanto tempo leva uma requisição inteira, e onde cortar?

### 9. Tempo de resposta
- **Tese:** o tempo de resposta é a soma de esperas (DNS, TCP, TLS, servidor, download), e a maioria é RTT, não banda.
- **Problema de abertura:** as aulas 4 a 8 deixaram cada uma a sua conta de RTTs; agora se soma tudo.
- **Pergunta que deixa:** fecha o módulo (sem próxima aula). O gancho é a ordem de ataque: cortar RTT antes de comprar banda.

## Pontos que hoje quebram o fio
1. **Aula 1 abre abstrata** e não apresenta a Lena; o exemplo só nasce na aula 2.
2. **Aulas 3 a 9 abrem direto na definição**, sem ponte com a anterior. Nenhuma fecha com gancho.
3. **Aula 2:** "Quem decide em qual camada?" aparece sem ligação com o item anterior; a pilha e os equipamentos parecem dois assuntos.
4. **Aula 3:** os itens de "Como funciona" não conversam ("Acabou." sem dizer por que importa; dual stack sem ligação com NAT).
5. **Aula 4:** a lista começa pelo UDP, mas a figura e o OneLiner começam pelo TCP. O exemplo da figura (300 bytes) não se liga às 215 fatias.
6. **Aula 5:** não diz de onde vem o problema (TCP em claro) nem liga com a camada 6 da aula 2. Fala "celular", sem a Lena.
7. **Aulas 6 e 7:** a ordem real (DHCP antes do DNS) fica escondida. O DHCP entrega o DNS, e isso não é dito.
8. **Aula 8:** a página tem dois blocos "Como funciona", dois "Por que importa" e três "Deep" intercalados, sem hinge entre HTTP e QUIC. A Lena e os 6 arquivos da figura não aparecem.
9. **Aula 9:** não retoma o RTT de 80 ms das figuras nem as contas das aulas 4, 5 e 6.

## Decisões
- **Não reordenar aulas** (frontmatter `order` fica). A ordem didática é mantida e a diferença para a ordem real é dita na aula 7.
- **Ponte de abertura** em `<p class="ponte">` antes do OneLiner; **gancho** em `<p class="gancho">` depois do último bloco e antes dos flashcards. Sem CSS novo (parágrafos comuns).
- **Aula 1** ganha a Lena (3 linhas) na abertura, para o exemplo atravessar o módulo inteiro.
- **Aula 4:** itens do TCP primeiro, UDP por último, na mesma ordem da figura.
- **Números das figuras** (215 fatias, 80 ms, 85 ms de DNS sem cache) entram só onde a figura mostra o mesmo valor.
- **Flashcards:** não mudam; nenhum exemplo estava desalinhado.
- **Aula 2 (Deep):** os cartões das 7 camadas ficam como estão (são referência); só mudam as frases de ligação.
