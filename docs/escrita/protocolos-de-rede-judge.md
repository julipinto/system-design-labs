# Judge: Protocolos de Rede

## Passe 1: voz de IA (português)
Busca por: crucial, fundamental, essencial, vale ressaltar/destacar, além disso/ademais em sequência, em suma/em resumo, "não é apenas X, é Y", travessões, inflação de importância.
- Nenhuma ocorrência nas 9 aulas, antes e depois da revisão (grep). Nenhum travessão.
- Nos textos novos, evitei: resumo no fim de seção (os ganchos apontam para a próxima aula, não repetem a atual), tríades forçadas e fecho de efeito.
- Corrigido: "Em respostas pequenas, dobrar a banda... Cortar um RTT muda tudo." (aula 9) virou uma causa ligada à frase anterior, sem o contraste de duas frases de efeito.
- Corrigido: "Acabou." solto (aula 3) virou "Esse espaço acabou."
- Pendência leve: "o dia da virada" (aula 1, Deep) soa um pouco inflado; não mexi porque o fato vem da fonte.

## Passe 2: Strunk & White adaptado
- Sujeito explícito no começo de seções soltas do Deep ("O UDP quase não tem...", "O TCP abre, mantém...").
- Voz ativa e verbos simples mantidos ("é", "tem", "sai").
- Itens de lista começaram a se referir uns aos outros (aulas 1, 2, 3, 4, 5, 6, 7, 8) com marcadores de tempo: "primeiro", "depois", "só então", "com a conexão aberta".
- Aula 8: "Por que existe" reordenado para seguir a causa (HOL no TCP, depois ossificação, depois a saída do QUIC).

## Passe 3: consistência com as figuras e entre aulas
| Item | Valor | Onde confere |
|---|---|---|
| Personagens | Lena (São Paulo), irmão (Tóquio), foto do gato | aula 1, 2; Lena também em 3 a 9 |
| Foto | 7,68 MB, 313 KB, 215 fatias, IP 198.51.100.7 | figura OSI, aulas 2, 3, 4 |
| RTT | 80 ms (TLS 240/160/80 ms; HTTP 160 ms de TCP+TLS; calculadora da aula 9) | aulas 5 e 9 |
| DNS sem cache | 85 ms (5 + 25 + 25 + 30); com cache no resolver 5 ms; no navegador 0 | figura DNS, aula 6 |
| RTTs antes do pedido | TLS 1.2 = 3, TLS 1.3 = 2, QUIC = 1, 0-RTT = 0 | aulas 5, 8, 9 |
| Termos | fatia (aula 2 e 3), segmento (TCP, definido na aula 4), datagrama (UDP) | aula 4 liga os dois |

## Corrigido nesta rodada
- Aula 8 tinha duas seções "Por que importa em System Design" (uma como h4). A do h4 virou "O que o QUIC muda na prática", e o bloco `WhyItMatters` subiu para antes dos dois `Deep`, para as seções não ficarem intercaladas.
- Aula 4: lista começava pelo UDP, mas OneLiner e figura começam pelo TCP. Agora o TCP vem primeiro, o UDP fecha a lista.
- Aula 6 e 7: a ordem real (DHCP antes do DNS) agora é dita na abertura da aula 7.

## Pendências (para a Juliana decidir)
1. **Figura TCP (aula 4):** usa celular e servidor com 300 bytes, não a Lena e as 215 fatias. O texto avisa e liga os dois, mas a figura em si não tem personagem. Mexer exige alterar src/figures.
2. **ARP:** a aula 2 o trata como camada 2 e a aula 3 repete a convenção; o texto do cartão da camada 3 (Deep, aula 2) ainda explica a ambiguidade em uma frase longa.
3. **Aula 8, cartões das três versões (Deep):** repetem em parte a lista do começo da aula. Mantive por trazerem os anos (1997, 2015) e o QPACK/HPACK; dá para cortar o cartão do HTTP/3.
4. **Reordenar as aulas** (DHCP e DNS antes de TCP e TLS seguiria a ordem real do tempo) não foi feito: muda `order`, links e quiz.
5. **Tempo de leitura (`min`):** as pontes e os ganchos somaram cerca de 30 a 60 palavras por aula; não mudei `min`.
6. **Aula 9:** a figura da aula 8 usa HTTP/3 de 2022; a aula 8 não cita o ano. Sem ação, só conferência.
