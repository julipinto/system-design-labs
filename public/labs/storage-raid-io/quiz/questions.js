/* Banco de perguntas do quiz de Storage, RAID e I/O.
   Tipos: choice (answer = índice em options), order (options já na ordem certa; o quiz embaralha),
   layer (answer = nível de RAID: 0, 1, 5, 6 ou 10), truefalse (answer = true/false). level: 1 definição, 2 aplicar, 3 cenário. */
(function () {
  var T = {
    t1: { topic: "aula-1-storage-em-system-design", name: "Storage em System Design" },
    t2: { topic: "aula-2-throughput-bandwidth-iops", name: "Throughput, bandwidth e IOPS" },
    t3: { topic: "aula-3-das", name: "DAS" },
    t4: { topic: "aula-4-nas", name: "NAS" },
    t5: { topic: "aula-5-block-storage", name: "Block Storage" },
    t6: { topic: "aula-6-file-storage", name: "File Storage" },
    t7: { topic: "aula-7-object-storage", name: "Object Storage" },
    t8: { topic: "aula-8-raid-0", name: "RAID 0" },
    t9: { topic: "aula-9-raid-1", name: "RAID 1" },
    t10: { topic: "aula-10-raid-5", name: "RAID 5" },
    t11: { topic: "aula-11-raid-6", name: "RAID 6" },
    t12: { topic: "aula-12-raid-10", name: "RAID 10" },
    t13: { topic: "aula-13-resumo-raid", name: "Resumo e comparativos de RAID" }
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


  /* ---------- 1. Storage em System Design ---------- */
  choice("t1", 1, 1, "Na loja, o que é o storage?", [
    "O lugar onde o sistema guarda dados para eles sobreviverem a um reinício.",
    "A memória RAM, que é apagada ao desligar.",
    "O cabo que liga o servidor à internet.",
    "O programa que desenha as páginas do site."
  ], 0, "Storage é persistência: o dado continua lá depois que o programa fecha ou a máquina desliga.");
  choice("t1", 2, 2, "Qual dos dados da loja mais pede latência baixa?", [
    "Os pedidos no banco de dados.",
    "Os backups noturnos.",
    "As fotos antigas de produtos.",
    "Os logs de meses atrás."
  ], 0, "O banco é lido e gravado o tempo todo, em pontos aleatórios: cada milissegundo conta no checkout.");
  choice("t1", 3, 1, "Qual a ordem de latência típica, do mais rápido ao mais lento?", [
    "NVMe (~0,1 ms), SSD SATA (~0,2 ms), HDD (5 a 10 ms).",
    "HDD, SSD SATA, NVMe.",
    "SSD SATA, NVMe, HDD.",
    "Todos têm a mesma latência; só a capacidade muda."
  ], 0, "NVMe fala direto com a flash por PCIe; o HDD precisa mover mecanicamente a cabeça.");
  tf("t1", 4, 1, "Guardar tudo da loja num único disco é um ponto único de falha.", true,
    "Se aquele disco queima, pedidos, fotos e tudo mais somem junto. Por isso existem réplicas, RAID e backups.");
  choice("t1", 5, 3, "Fotos de produtos (~1,2 TB, como o gato.jpg, gravadas uma vez, lidas muitas) e o banco de pedidos (200 GB, pequenos e aleatórios). Qual o raciocínio certo?", [
    "Cada um pede um storage diferente: fotos, espaço barato e escalável; banco, latência baixa.",
    "Os dois devem ir para o mesmo disco NVMe, para simplificar.",
    "O banco vai para o disco mais barato, porque é o menor.",
    "As fotos vão para o disco mais rápido, porque são maiores."
  ], 0, "Tamanho e padrão de acesso diferem. Pagar NVMe por foto é desperdício e banco em disco lento trava o checkout.");

  /* ---------- 2. Throughput, bandwidth e IOPS ---------- */
  choice("t2", 1, 1, "O que mede o IOPS?", [
    "Quantas operações de leitura ou escrita o disco faz por segundo.",
    "Quantos MB por segundo o cabo aguenta.",
    "Quanto espaço livre sobrou no disco.",
    "O tempo de uma ida e volta na rede."
  ], 0, "IOPS conta pedidos por segundo, sem olhar o tamanho de cada um.");
  choice("t2", 2, 2, "Um volume faz 3.000 IOPS com blocos de 8 KB. Qual o throughput?", [
    "24 MB/s (3.000 x 8 KB).",
    "375 MB/s.",
    "3.000 MB/s.",
    "125 MB/s."
  ], 0, "3.000 x 8 KB = 24.000 KB/s, ou cerca de 24 MB/s. O gargalo é o IOPS, porque a banda de 125 MB/s sobra.");
  choice("t2", 3, 2, "Um gp3 padrão (3.000 IOPS e 125 MB/s) lê blocos de 64 KB. Qual o throughput real e o gargalo?", [
    "125 MB/s, limitado pela banda (3.000 x 64 KB daria 192 MB/s).",
    "192 MB/s, limitado pelos IOPS.",
    "125 MB/s, limitado pelos IOPS.",
    "3.000 MB/s, sem gargalo."
  ], 0, "3.000 x 64 KB = 192 MB/s, mas o link só passa 125. O menor dos dois manda, e aqui é a banda.");
  tf("t2", 4, 2, "Se o gargalo é a banda do link, comprar mais IOPS aumenta o throughput.", false,
    "Mais IOPS não ajuda quando o cano já está cheio. É preciso mais banda ou menos dados.");
  choice("t2", 5, 3, "O HDD de 7200 rpm faz ~150 IOPS. A loja grava vídeos grandes e sequenciais e, em outro disco, o banco com blocos de 8 KB. Qual disco sofre mais com o banco?", [
    "O HDD: 150 x 8 KB é só ~1,2 MB/s em acesso aleatório.",
    "O NVMe, porque tem blocos pequenos demais.",
    "Nenhum, porque os IOPS não dependem do tipo de acesso.",
    "O HDD só sofre com vídeos, nunca com o banco."
  ], 0, "O HDD precisa mover a cabeça a cada acesso aleatório: 150 operações de 8 KB dão cerca de 1,2 MB/s.");

  /* ---------- 3. DAS ---------- */
  choice("t3", 1, 1, "O que é DAS?", [
    "Disco ligado direto ao servidor, sem rede no meio.",
    "Servidor de arquivos acessado pela rede.",
    "Um serviço de objetos na nuvem.",
    "Um nível de RAID com paridade."
  ], 0, "DAS é Direct-Attached Storage: SATA, USB ou NVMe ligados direto à máquina.");
  choice("t3", 2, 1, "Qual a principal vantagem do DAS?", [
    "Latência baixa e desempenho alto, por ter menos saltos.",
    "Vários servidores usam o mesmo disco ao mesmo tempo.",
    "Escala sozinho na horizontal.",
    "Tem redundância automática."
  ], 0, "Sem rede no caminho, o acesso é o mais curto possível. Compartilhar e escalar é que são os pontos fracos.");
  tf("t3", 3, 2, "Dois servidores da loja conseguem ler o mesmo disco DAS sem configuração extra.", false,
    "O DAS é preso à máquina onde está. Para compartilhar, é preciso um NAS ou outro storage de rede.");
  choice("t3", 4, 2, "Qual o principal limite de crescer um DAS?", [
    "Exige colocar mais discos na máquina e migrar dados na mão.",
    "A rede fica saturada.",
    "O DAS não aceita SSD.",
    "O DAS não guarda arquivos grandes."
  ], 0, "Cabem poucos discos por servidor, então o crescimento é para cima, e não para os lados.");
  choice("t3", 5, 3, "O servidor da loja com um NVMe interno queima. O que acontece com o disco?", [
    "Fica inacessível junto, a menos que haja réplica ou RAID.",
    "Outro servidor assume o disco automaticamente.",
    "O disco continua acessível pela rede.",
    "Os dados migram sozinhos para a nuvem."
  ], 0, "O DAS é ponto único de falha: sem réplica, a máquina e o disco caem juntos.");

  /* ---------- 4. NAS ---------- */
  choice("t4", 1, 1, "O que é NAS?", [
    "Servidor de arquivos na rede, usado por vários clientes ao mesmo tempo.",
    "Disco ligado direto ao servidor.",
    "Um volume de blocos cru, sem sistema de arquivos.",
    "Um nível de RAID."
  ], 0, "NAS é Network Attached Storage: pastas compartilhadas pela rede.");
  choice("t4", 2, 1, "Qual protocolo de NAS é o mais comum entre Linux e Unix?", [
    "NFS.", "SMB.", "SMTP.", "DNS."
  ], 0, "NFS é o do mundo Linux e Unix. SMB é o do Windows.");
  choice("t4", 3, 2, "O que limita o desempenho de um NAS?", [
    "A latência e a banda da rede, além do disco do próprio NAS.",
    "Só a cor do cabo.",
    "O número de pastas.",
    "Nada, é sempre mais rápido que um disco local."
  ], 0, "Cada operação atravessa a rede: soma latência e usa a banda do link.");
  choice("t4", 4, 2, "Um link de 1 Gbps passa no máximo quantos MB/s?", [
    "Cerca de 125 MB/s.", "Cerca de 1.000 MB/s.", "Cerca de 12,5 MB/s.", "Cerca de 1,25 GB/s."
  ], 0, "1 Gbps = 1.000 Mbit/s; dividido por 8 bits por byte dá 125 MB/s.");
  tf("t4", 5, 3, "Três servidores web da loja precisam da mesma pasta de fotos: um NAS atende essa necessidade melhor que um DAS em cada servidor.", true,
    "O NAS é um lugar só, que todos montam. Com DAS, cada servidor teria uma cópia diferente.");

  /* ---------- 5. Block Storage ---------- */
  choice("t5", 1, 1, "O que é block storage?", [
    "Um disco cru dividido em blocos de tamanho fixo, cada um com um endereço.",
    "Uma árvore de pastas compartilhada.",
    "Objetos com chave dentro de buckets.",
    "Uma cópia espelhada de dois discos."
  ], 0, "No block storage, quem usa o volume decide o que guardar: um sistema de arquivos ou um banco direto.");
  choice("t5", 2, 1, "O que é LBA?", [
    "O número do bloco no disco (Logical Block Address).",
    "O nome do arquivo no disco.",
    "A velocidade do disco em MB/s.",
    "O tipo de RAID usado."
  ], 0, "LBA é o endereço do bloco: bloco 0, bloco 1, bloco 2048.");
  choice("t5", 3, 2, "O gato.jpg tem 2,4 MB (2.457.600 bytes). Em blocos de 4 KB, ocupa quantos blocos?", [
    "600.", "1.024.", "2.400.", "150."
  ], 0, "2.457.600 bytes / 4.096 = 600 blocos (no volume da loja, LBA 2048 a 2647).");
  choice("t5", 4, 2, "Qual serviço da AWS é block storage?", [
    "EBS.", "S3.", "EFS.", "CloudFront."
  ], 0, "EBS entrega volumes de blocos que se anexam a uma instância. S3 é objeto e EFS é arquivo.");
  tf("t5", 5, 3, "O EBS normalmente é usado por uma instância por vez e não compartilha arquivos sozinho.", true,
    "Para compartilhar pastas entre servidores usa-se file storage (como o EFS). O EBS é o disco de uma máquina.");

  /* ---------- 6. File Storage ---------- */
  choice("t6", 1, 1, "Como um arquivo é identificado em file storage?", [
    "Pelo caminho mais o nome, e não pode haver dois nomes iguais na mesma pasta.",
    "Por uma chave única dentro de um bucket.",
    "Pelo número do bloco (LBA).",
    "Pelo IP do servidor."
  ], 0, "A identidade é a árvore de pastas: caminho + nome.");
  choice("t6", 2, 1, "O que é um inode?", [
    "A ficha do arquivo no Linux, com tamanho, dono, datas e onde estão os blocos.",
    "Um tipo de disco SSD.",
    "O nome do bucket.",
    "Um protocolo de rede."
  ], 0, "O nome fica na pasta; o inode guarda os metadados e aponta para os blocos.");
  choice("t6", 3, 2, "O que o sistema de arquivos faz?", [
    "Transforma blocos do disco em arquivos e pastas com nome.",
    "Replica os dados para outra região.",
    "Calcula a paridade do RAID.",
    "Cobra pelo uso do disco."
  ], 0, "É a camada que dá nome e pasta aos blocos. ext4, XFS e NTFS são exemplos.");
  choice("t6", 4, 2, "Qual o ponto fraco do file storage em larga escala?", [
    "A hierarquia: pastas com milhões de arquivos ficam lentas.",
    "Não tem metadados.",
    "Só funciona com um cliente.",
    "Não aceita arquivos grandes."
  ], 0, "A estrutura em árvore complica a escala. Por isso o object storage usa chave plana.");
  tf("t6", 5, 2, "File storage compartilhado por vários clientes costuma ser acessado por NFS ou SMB.", true,
    "NFS e SMB montam a pasta remota como se fosse local. É o caso do NAS e do EFS.");

  /* ---------- 7. Object Storage ---------- */
  choice("t7", 1, 1, "O que compõe um objeto no object storage?", [
    "Conteúdo, metadados e uma chave única.",
    "Apenas o conteúdo.",
    "Um caminho de pastas e um inode.",
    "Um número de bloco e uma paridade."
  ], 0, "O objeto leva tudo junto: os bytes, os dados sobre eles e a chave que o identifica.");
  tf("t7", 2, 2, "No S3, produtos/gatos/ é uma pasta de verdade dentro do bucket loja-fotos.", false,
    "As \"pastas\" são só parte do nome da chave. O bucket é plano, sem árvore real.");
  choice("t7", 3, 1, "Como se acessa object storage?", [
    "Por API HTTP (PUT, GET, DELETE).",
    "Montando um disco com mount.",
    "Por um cabo SATA.",
    "Por um sistema de arquivos ext4."
  ], 0, "É uma chamada de rede por objeto, sem montar nada.");
  choice("t7", 4, 2, "Qual uso NÃO combina com object storage?", [
    "Banco de dados transacional.",
    "Fotos de produtos.",
    "Backups.",
    "Vídeos grandes."
  ], 0, "O objeto é trocado inteiro e cada acesso é uma chamada de rede. Banco precisa de blocos e baixa latência.");
  choice("t7", 5, 3, "A loja quer guardar backups noturnos com durabilidade altíssima e custo baixo. Qual a melhor escolha?", [
    "Object storage, em outra região, com regras de ciclo de vida.",
    "Um RAID 0 no servidor da loja.",
    "Um DAS no mesmo servidor do banco.",
    "A memória RAM."
  ], 0, "Object storage replica sozinho e é barato. Backup no mesmo servidor morre junto com ele.");

  /* ---------- 8. RAID 0 ---------- */
  choice("t8", 1, 1, "O que o RAID 0 faz?", [
    "Fatia os dados e espalha entre os discos, somando a velocidade.",
    "Grava cada dado em dois discos.",
    "Guarda uma paridade distribuída.",
    "Guarda duas paridades."
  ], 0, "É o striping: só desempenho, sem redundância.");
  choice("t8", 2, 2, "Qual a capacidade de um RAID 0 com 4 discos de 1 TB?", [
    "4 TB.", "3 TB.", "2 TB.", "1 TB."
  ], 0, "RAID 0 soma tudo: 4 x 1 = 4 TB, aproveitamento de 100%.");
  choice("t8", 3, 2, "Quantos discos podem falhar num RAID 0 sem perda de dados?", [
    "Nenhum.", "Um.", "Dois.", "Metade."
  ], 0, "Cada arquivo tem pedaços em todos os discos. Perdeu um, perdeu tudo.");
  tf("t8", 4, 2, "Quanto mais discos num RAID 0, maior a chance de perder todos os dados.", true,
    "Qualquer disco que falhe derruba o conjunto. Com 4 discos há 4 chances de falha.");
  layer("t8", 5, 2, "A loja quer uma área temporária de renderização de imagens, rápida, em que perder os arquivos não importa. Qual nível de RAID?", 0,
    "Dado refazível pede velocidade, não proteção: RAID 0.");

  /* ---------- 9. RAID 1 ---------- */
  choice("t9", 1, 1, "O que o RAID 1 faz?", [
    "Grava tudo em dois discos iguais (espelho).",
    "Fatia os dados sem cópia.",
    "Calcula paridade com XOR.",
    "Junta pares em fatias."
  ], 0, "Mirroring: cada escrita vai para os dois discos.");
  choice("t9", 2, 2, "Qual a capacidade útil de 2 discos de 1 TB em RAID 1?", [
    "1 TB.", "2 TB.", "0,5 TB.", "1,5 TB."
  ], 0, "Os dois discos guardam a mesma coisa, então só se aproveita um: 50%.");
  choice("t9", 3, 2, "Qual a penalidade de escrita do RAID 1?", [
    "2.", "1.", "4.", "6."
  ], 0, "Cada escrita lógica vira duas físicas, uma por disco.");
  tf("t9", 4, 2, "Se alguém executar um DELETE errado no banco, o RAID 1 permite recuperar a tabela.", false,
    "O espelho copia tudo na hora, inclusive o erro. RAID não é backup.");
  layer("t9", 5, 2, "Um servidor pequeno precisa de proteção contra falha de um disco, e a loja quer o mais simples possível, com 2 discos. Qual nível?", 1,
    "Dois discos espelhados: RAID 1.");

  /* ---------- 10. RAID 5 ---------- */
  choice("t10", 1, 1, "Qual a capacidade do RAID 5 com 4 discos de 1 TB?", [
    "3 TB.", "4 TB.", "2 TB.", "1 TB."
  ], 0, "(N - 1) x tamanho = 3 x 1 = 3 TB (75%). O equivalente a um disco vai para a paridade.");
  choice("t10", 2, 1, "Quantos discos podem falhar no RAID 5?", [
    "Um.", "Nenhum.", "Dois.", "Metade."
  ], 0, "A paridade permite refazer um disco perdido, mas só um por vez.");
  choice("t10", 3, 2, "Blocos A1 = 1011, A2 = 0110, A3 = 0101. Qual a paridade P1 (XOR dos três)?", [
    "1000.", "1111.", "0000.", "1010."
  ], 0, "1011 xor 0110 = 1101; 1101 xor 0101 = 1000.");
  choice("t10", 4, 2, "Quantas operações no disco gera uma escrita pequena no RAID 5?", [
    "4: lê dado e paridade antigos, grava dado e paridade novos.",
    "2: grava o dado em dois discos.",
    "1: só grava o dado.",
    "6: grava duas paridades."
  ], 0, "É a penalidade de escrita do RAID 5: 2 leituras + 2 escritas.");
  choice("t10", 5, 3, "Por que o rebuild de um RAID 5 é arriscado, sobretudo se os discos fossem de 10 TB?", [
    "Lê todos os outros discos por horas ou dias, e um erro de leitura (URE) nesse momento pode causar perda.",
    "Apaga os dados novos para economizar espaço.",
    "O disco novo é sempre defeituoso.",
    "A paridade é recalculada com a loja desligada."
  ], 0, "Reconstruir um disco de 10 TB a 150 MB/s leva mais de 18 horas (com 1 TB, umas 2 horas). Sem paridade sobrando, um URE no caminho é perda.");
  tf("t10", 6, 2, "No RAID 5, a paridade fica sempre num disco dedicado.", false,
    "Ela é distribuída: gira de disco em cada linha, para não sobrecarregar um só.");

  /* ---------- 11. RAID 6 ---------- */
  choice("t11", 1, 1, "O que o RAID 6 tem a mais que o RAID 5?", [
    "Uma segunda paridade, que permite perder dois discos.",
    "Um espelho completo.",
    "Nenhuma paridade.",
    "Discos mais rápidos."
  ], 0, "P e Q: duas equações, dois blocos desconhecidos recuperáveis.");
  choice("t11", 2, 2, "Qual a capacidade do RAID 6 com 5 discos de 1 TB?", [
    "3 TB.", "4 TB.", "2 TB.", "5 TB."
  ], 0, "(N - 2) x tamanho = 3 x 1 = 3 TB (60%).");
  choice("t11", 3, 2, "Qual a penalidade de escrita do RAID 6?", [
    "6.", "4.", "2.", "1."
  ], 0, "Lê dado, P e Q antigos e grava dado, P e Q novos: 3 leituras + 3 escritas.");
  choice("t11", 4, 1, "Qual o número mínimo de discos do RAID 6?", [
    "4.", "2.", "3.", "6."
  ], 0, "São dois discos de dados e dois de paridade, no mínimo.");
  layer("t11", 5, 3, "A loja guarda um arquivo de fotos com 12 discos grandes, dados por anos, e não pode perder nada se um segundo disco falhar durante o rebuild. Qual nível?", 6,
    "Muitos discos grandes e rebuild longo: a dupla paridade do RAID 6 cobre a segunda falha.");

  /* ---------- 12. RAID 10 ---------- */
  choice("t12", 1, 1, "Como o RAID 10 é montado?", [
    "Pares espelhados (RAID 1) com os dados fatiados entre eles (RAID 0).",
    "Fatias com uma paridade distribuída.",
    "Dois discos com cópia exata.",
    "Quatro discos sem nenhuma cópia."
  ], 0, "RAID 1+0: primeiro espelha, depois faz striping entre os pares.");
  choice("t12", 2, 2, "Qual a capacidade do RAID 10 com 4 discos de 1 TB?", [
    "2 TB.", "4 TB.", "3 TB.", "1 TB."
  ], 0, "Metade do total: 4 x 1 / 2 = 2 TB.");
  choice("t12", 3, 3, "RAID 10 com 4 discos (pares D1-D2 e D3-D4). Falham D1 e D3. O que acontece?", [
    "Os dados sobrevivem: sobrou um disco de cada par.",
    "Tudo é perdido.",
    "Só os dados do par D1-D2 se perdem.",
    "O RAID vira RAID 0 e para."
  ], 0, "Cada par ainda tem um disco com a cópia completa.");
  choice("t12", 4, 3, "RAID 10 com 4 discos (pares D1-D2 e D3-D4). Falham D1 e D2. O que acontece?", [
    "Tudo é perdido: o par D1-D2 inteiro foi embora.",
    "Os dados sobrevivem, porque há D3 e D4.",
    "Só metade dos arquivos se perde.",
    "O RAID reconstrói D1 e D2 de D3 e D4."
  ], 0, "Os dados estão fatiados entre os pares. Sem o par D1-D2, faltam pedaços de todos os arquivos.");
  layer("t12", 5, 3, "O banco de pedidos tem muita escrita, não pode parar e tem orçamento para perder metade do espaço. Qual nível?", 10,
    "Penalidade de escrita 2 e rebuild simples: RAID 10 é a escolha clássica para transações.");

  /* ---------- 13. Resumo e comparativos ---------- */
  choice("t13", 1, 2, "Com 4 discos de 1 TB cada, qual a ordem de capacidade útil, do maior ao menor, entre RAID 0, 5 e 10?", [
    "RAID 0 (4 TB), RAID 5 (3 TB), RAID 10 (2 TB).",
    "RAID 5 (4 TB), RAID 0 (3 TB), RAID 10 (2 TB).",
    "RAID 10 (4 TB), RAID 5 (3 TB), RAID 0 (2 TB).",
    "Os três dão 4 TB."
  ], 0, "0: N x S = 4. 5: (N - 1) x S = 3. 10: N x S / 2 = 2.");
  order("t13", 2, 2, "Ordene as penalidades de escrita, da menor para a maior.", [
    "RAID 0 (1)",
    "RAID 1 e RAID 10 (2)",
    "RAID 5 (4)",
    "RAID 6 (6)"
  ], "RAID 0 não duplica nada; espelho grava 2; RAID 5 faz 4 I/Os; RAID 6 faz 6.");
  choice("t13", 3, 2, "Com 150 IOPS por disco, qual a escrita aleatória teórica de um RAID 5 com 4 discos?", [
    "150 IOPS (4 x 150 / 4).",
    "600 IOPS.",
    "300 IOPS.",
    "75 IOPS."
  ], 0, "O total bruto é 4 x 150 = 600; a penalidade de 4 divide por quatro: 150. O RAID 10 com os mesmos 4 discos faz 4 x 150 / 2 = 300.");
  choice("t13", 4, 2, "Qual combinação de falhas toleradas está CORRETA?", [
    "RAID 0: 0; RAID 5: 1; RAID 6: 2.",
    "RAID 0: 1; RAID 5: 1; RAID 6: 2.",
    "RAID 0: 0; RAID 5: 2; RAID 6: 3.",
    "RAID 0: 1; RAID 5: 2; RAID 6: 2."
  ], 0, "RAID 0 não tolera nada. RAID 5 tolera 1 e RAID 6 tolera 2.");
  tf("t13", 5, 1, "RAID substitui o backup.", false,
    "RAID protege contra falha de disco, não contra erro humano, ransomware, incêndio ou bug. Backup fica fora do conjunto.");

  window.QUIZ = out;
})();
