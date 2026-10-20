# Premissas do SDLabs (o que a Juliana aprovou nos módulos 1, 2 e 3)

O objetivo é **inesquecível**: depois de mexer, ela tem que conseguir explicar o assunto sem olhar.

## Figuras
1. **A cena é o mecanismo real acontecendo**, não um diagrama de caixinhas. Se só a pirâmide crescia, ela não entendia; quando **o dado em si mudou** (foto → ruído cifrado → fatias → caixas de cabeçalho), entendeu na hora.
2. **Mostrar o DADO REAL em cada passo**: bytes, campos, endereços, números (MAC, IP, TTL, seq/ack, LBA, XOR com bits, SQL com a resposta do banco). Exemplos coerentes do início ao fim e avisados como exemplos.
3. **A peça ativa sai da pilha ou acende** (gaveta) para ficar inteira à vista; nada importante embaixo de outra coisa, do painel ou dos botões no celular.
4. **Comparar cenários com um toggle**, e a mesma figura entra em várias aulas com `?mode=` (cada aula abre no seu cenário: RAID 0/1/5/6/10, DAS/NAS/block/file/object, CP/AP/CA/PACELC, A/C/I/D/BASE).
5. **Sempre um "e se der errado"**, e ir até o fim dele: pacote perdido, disco que queima e **o segundo disco que queima** (é o que diferencia os níveis), cabo cortado, servidor que cai, regra que bloqueia. Mostrar a conta que fecha e a que não fecha.
6. **Rótulos grandes, longe uns dos outros, presos ao que nomeiam.** Nada de texto ilegível, ASCII estranho ou bytes "ÿØÿà" sem explicação.
7. Linhas e conexões grossas o bastante para ver (a "sessão" virou uma ponte de luz com pontos indo e voltando, que acompanha as gavetas).
8. **Os personagens e números da figura são os mesmos do texto, do quiz e do glossário.** Quando uma figura ou uma aula muda um número, os outros três mudam junto.

## Painel (texto da figura)
9. **Conta uma história contínua**: cada passo continua o anterior ("Só que 313 KB não cabem num pacote…").
10. Formato fixo: **história** (2 a 3 frases) → **Olhe no desenho** (1 linha: o que mudou na cena) → **Em uma frase** (o conceito para guardar) → **dados reais** (details). Quando ajudar, uma faixa fixa com o comando real ("Como o programa pede a foto", "Comando SQL").
11. Blocos de dados **numa faixa estável e explicada** (ex.: ordem no fio, com legenda), com um cartão "Entrou agora / Saiu agora" dizendo **para que serve** cada peça.

## Escrita das aulas (cadência e encadeamento, ver ESCRITA.md)
12. **Cada aula abre retomando o problema que a anterior deixou** e **fecha com um "Falta saber…"** que puxa a próxima. Lendo só a primeira e a última frase de cada aula, a história do módulo se conta.
13. **Um fio condutor por módulo** (1 frase) e uma tese por aula, registrados em `docs/escrita/<modulo>-blueprint.md`.
14. Itens de lista **encadeados** (um conversa com o vizinho), frases-dobradiça entre seções, conceito novo só depois do problema concreto, repetir a palavra certa em vez de sinônimos.
15. **Sem voz de IA**: nada de "crucial", "vale ressaltar", "além disso" em sequência, "em suma", "não é só X, é Y", travessões em excesso ou resumo no fim da seção.

15b. **Mesma história em todos os módulos (storytelling contínuo)**: o elenco é fixo e atravessa o estudo inteiro. A **Lena** (cliente, mora em Recife, compra o gato de pelúcia), **a loja** (o sistema que cresce: rede → disco → réplicas → banco → cache → …), a Bia, o Caio e o Davi como outros clientes, e as cidades SP, Rio e Recife. Cada módulo é o próximo capítulo do mesmo problema da loja: abre lembrando onde a história parou no módulo anterior e mostra o novo problema que ela enfrenta. Personagem e números novos só quando a história pede, e entram no brief antes de texto e figuras.

## Página e estudo (ela tem TDAH)
16. Uma aula por vez, passos numerados, no máximo 5 itens por lista, frases curtas, progresso visível, "Faça agora" com uma ação concreta que **a figura realmente mostra**, flashcards e quiz.
17. **Celular primeiro**: navegação boa a 390px; no celular, a figura aparece como prévia (imagem do passo mais revelador) com botão; no desktop, fica embutida e as setas do teclado funcionam com o mouse em cima.
18. Glossário por módulo com fichas tocáveis para quem é novo na área; quiz por módulo com botão fixo na barra.
19. Conteúdo com palavras próprias, fontes primárias citadas e sem marca de curso.

## Material que a Juliana passa (busca em profundidade)
20. **Ler tudo o que ela colocar**: notas do canvas, MDs, imagens das aulas e links, por inteiro, antes de escrever. A lista de aulas da imagem define a ordem e os títulos; se a imagem cortar uma aula, conferir no artigo.
21. **Seguir os links em profundidade**: abrir o artigo indicado, **todas as referências que ele usa** e, quando valer, **o link do link** (a fonte primária: RFC, documentação, paper). Conferir cada link (status 200) e só citar o que abre.
22. **Página com login ou bloqueio** (NotebookLM, sites que barram robôs): usar o navegador embutido do Maestri (portal), que tem internet e às vezes a sessão dela; se ainda assim não der, pedir que ela exporte ou cole o conteúdo.
23. **Vídeos** (TikTok, YouTube): baixar numa pasta temporária, extrair os frames para analisar e apagar tudo no fim.
24. **Registrar as fontes do módulo** em `docs/fontes/<modulo>.md` (link, o que tem de útil, em qual aula entrou) e colocar 2 a 6 links por aula no bloco "Fontes", priorizando artigo dela > fonte primária > referências do artigo.
25. **Corrigir o material quando ele estiver errado** (ex.: a ISO 7498-1 é de 1994; a ARPANET ligou o SRI), avisando o que foi corrigido.

## Como cada módulo é feito
- **Conteúdo** (Sonnet): aulas MDX com marcadores `{/* FIG:<figura> mode=<cenário> */}`, widgets 2D (calculadoras e simuladores), glossário e quiz. A história canônica é combinada **antes**, no brief, para texto e figuras nascerem iguais.
- **Figuras 3D** (Opus, até 2 em paralelo): `src/figures/<nome>-3d/`, com `?mode=` e `embed=1`.
- **Integração** (maestro): `build:3d` no package.json, prévia em webp, `<Figure3D path=…?mode=…>` no lugar do marcador.
- **Revisão de escrita** (Sonnet): Architect → Carpenter → Judge da skill Writing With Agents, seguindo ESCRITA.md; depois alinhar quiz, glossário e widgets.
- **Teste** (Haiku 5.5): o site publicado, celular e desktop.
- **Publicar**: git push na main → GitHub Actions publica sozinho.
- **Orquestração**: o maestro pode criar terminais novos no canvas (skill maestri-manager), um por frente longa (ex.: um terminal por figura), além dos subagentes. Terminais ficam visíveis para a Juliana acompanhar; abrir cada um já no modelo do papel e dentro de sdlabs/.

## Skills e ferramentas que usamos (para reaproveitar)
- **iso-glow** (~/.claude/skills/iso-glow): figuras 3D (three.js), o padrão. Modelo em sdlabs/tools/iso-glow/; figuras em src/figures/<nome>-3d/ (as mais completas: raid-3d, storage-3d, cap-3d, acid-3d).
- **anatomy**: figuras isométricas 2D em SVG (a primeira figura OSI); os scripts capture.mjs e drive.mjs são usados em TODOS os testes de tela.
- **Writing With Agents** (plugin de jeffallan; skills architect, carpenter, judge, whirlybird…): revisão de cadência e encadeamento.
- **writing-prose-like-a-human**: frases sem cara de IA.
- **i-have-adhd** (github ayghri/i-have-adhd): formato das aulas e das respostas.
- **maestri / maestri-manager / maestri-portal / maestri-portal-devices**: terminais extras (SDLabs), notas, navegador embutido com GPU (teste no celular de verdade).
- **update-config**: modelos por papel (settings.json por projeto).
- Componentes Astro reutilizáveis: Figure3D (iframe no desktop, prévia no celular, `?mode=`), Lesson/OneLiner/DoIt/HowItWorks/Deep/Sources/Flashcards, glossário e quiz por módulo.
- Modelos: Opus = figuras e estrutura · Sonnet = texto, revisão técnica e de escrita · Haiku 5.5 = testes de tela e pesquisa.
