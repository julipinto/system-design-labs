# Judge: API Gateways (módulo 8)

Revisão feita lendo as 7 aulas contra ESCRITA.md, PREMISSAS.md e o brief.

## Voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "ademais", "não é só" e travessões: **nenhuma ocorrência** nas 7 aulas.
- Sem resumo no fim de seção; as seções terminam no fato ou no gancho.

## Encadeamento
- Todas as aulas têm `ponte` e `gancho`, e cada gancho é a pergunta que a aula seguinte responde (conferido de 1→2 até 6→7; o gancho da 7 puxa o módulo 9, BFF, como o brief pede).
- Listas de "Como funciona" com até 5 itens, ordenadas pelo que acontece.

## Consistência com figuras, quiz, glossário e widgets
- Corrigido: os "Faça agora" das aulas 1 a 6 falavam em "cenário" e "painel" de forma genérica, e a aula 1 mandava trocar para um "cenário da porta única" que não existe. Agora citam os botões e os títulos de passo reais.
- A aula 5 usa o balde de 200/100 (global), os 12 da Lena (2 passam, 10 levam 429 no balde global) e o balde por chave de 20/10, como a figura `limite-3d`.
- O quiz da aula 7 (6 perguntas) e o glossário (Kong, Service, Plugin, DB-less, path_handling, policy) batem com o texto: 20 pedidos com dois nós locais, plugin não é token bucket.

## Exatidão (aula 7)
- Linhas citadas (2-3, 6-7, 8-11, 12-13, 33-39) conferidas contra o arquivo.
- `path_handling` v0/v1 conferido na tabela da documentação; com `strip_path: true` os dois dão o mesmo caminho.
- Sem execução do Kong: afirmações sobre respostas vêm do código Go e da documentação, e o texto diz isso.

## Pendências
- Prévias `gateway-3d-previa.webp` e `limite-3d-previa.webp` e a troca dos marcadores `FIG:` por `<Figure3D>` são da integração (a home já aponta para `gateway-3d-previa.webp`).
- `build:3d` do package.json não inclui `gateway-3d` e `limite-3d` (regra: não editar package.json).
