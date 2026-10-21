# Blueprint: módulo 26, Cell-Based Architecture

**Fio condutor (1 frase):** um único pedido envenenado derruba a pilha inteira da loja, e a saída é dividir a pilha em células que não compartilham nada, pagando o piso de cada uma, roteando cada cliente à sua e deixando uma cópia passiva (ou mais de uma) para quando a célula cair.

Personagens e números: o `mkt-01` (o veneno e a célula própria), a Lena (o 1060 em `celula-recife`), a Bia e o Davi (SP), o Caio (Rio); as 4 células 40 · 33 · 15 · 12%; 7.200 × 2.880 tentativas; 41 → 53 vCPU; 150 MB de mapa; 80,1% × ~20% × 0; 2,97 · 1,35 · 2,88 · 9,6; 24 e 164 ms; 0,526% × 1%. Tudo vem do brief; nada foi acrescentado, exceto os rótulos dos widgets.

## Aulas (tese · pergunta que deixa para a seguinte)
1. **Introdução ao Cell-Based** · o *bulkhead* divide recursos; a célula divide a pilha inteira; o incidente das 20:25 e o raio desigual (40 · 33 · 15 · 12%). *Deixa:* o que tem dentro de uma célula?
2. **Estrutura celular** · cinco dimensões, uma só porta, piso (41 → 53), estoque por célula (6 · 3 · 2 · 8) e deploy por anéis. *Deixa:* como o pedido da Lena chega à célula certa?
3. **Roteamento celular** · roteador fino, determinístico e mais disponível; mapa de 150 MB, *rehash*, *edge cells*, síncrono × assíncrono. *Deixa:* e se a célula cair, para onde vão os clientes e os dados?
4. **Replicação celular** · passiva assíncrona (taxa × lag), 2PC (24 e 164 ms), folga e *shuffle sharding* exato. *Deixa:* e se for a região de SP inteira? Módulo 27.

## Decisões do Architect
- **Uma figura por aula, a mesma (`celulas`).** Marcadores `{/* FIG:celulas mode=pilha */}` (1), `mode=celula` (2), `mode=roteador` (3) e `mode=shuffle` (4). Os outros modes que o brief cita por aula (`raio`, `assincrono`, `replicacao`) ficam como botão: cada "Faça agora" manda apertar o botão certo. Os nomes dos botões são genéricos (Pilha, Raio, Célula, Último gato, Roteador, Assíncrono, Shuffle, Replicação); o maestro alinha com a figura.
- **Widgets:** 1 veneno e raio · 2 piso e estoque · 3 roteador · 4 replicacao, folga e shuffle (8 no total, os do brief; "folga" fica na aula 4 junto da tabela).
- **Ponte da aula 1** com o gancho do módulo 25 (aula 5 do Bulkhead): "uma pilha só, o estoque, o pagamentos e o lb-loja compartilhados".
- **A analogia do navio** só como ponte, em uma frase na aula 1 (o módulo 25 já a usou). A nota dos dois sentidos de "célula" é um `callout.why` na aula 1.
- **Anel do widget:** 100 pontos por célula (500 com 5), porque com 40 a variância dava 14,5% de 4 para 5; com 100 dá 19,7%, perto do ~20% da teoria.
- **`folga` com f quedas:** o acréscimo é f ÷ (N − f) (o brief escreve 1 ÷ (N − f), que vale para f = 1); a tabela fixa é 1 ÷ (N − 1).
- **"E se der errado" em toda aula** (estoque compartilhado, o último gato, o `mapa-v43`, a passiva que não aguenta) e as correções ao artigo dentro dos `Deep` e em `docs/fontes/cell-based.md`.
- **Sem lab do autor:** a aula 3 cita `exemplos/sharding` como o código mais próximo; os números de 2PC são modelo e os do Kafka são taxa × tempo, avisados nas aulas.
