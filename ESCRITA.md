# Escrita do SDLabs: cadência e encadeamento

O formato i-have-adhd continua (frases curtas, listas de até 5 itens, ação concreta). Este guia resolve o que faltava: **coesão**. Cada parte precisa puxar a próxima. A leitora tem que sentir que está seguindo um fio, não juntando cartões soltos.

Junto com isto, siga a skill `writing-prose-like-a-human`, adaptada ao português: frases que terminam no fato, sem inflar a importância, verbos simples ("é", "tem"), sem "além disso / ademais / vale ressaltar" em sequência e sem resumir o que acabou de ser dito.

## Entre aulas
1. **Abrir com uma ponte**: a primeira frase da aula liga com a anterior pelo **problema que ficou em aberto**. Ex.: "Na aula passada a foto virou 215 fatias. Mas como cada fatia sabe para onde ir? É o trabalho do IP."
2. **Fechar com um gancho**: a última frase antes dos flashcards aponta a próxima aula pela pergunta que ela responde. Nada de "na próxima aula veremos X"; use "Falta saber como…".
3. **O mesmo personagem e o mesmo exemplo** atravessam o módulo (no módulo 1: Lena, irmão, foto do gato; no módulo 2: a loja, `pedidos.db`, fotos de produto; no módulo 3: Lena, irmão, gato de pelúcia, SP/Rio/Recife).

## Dentro da aula
4. **Cada seção responde a uma pergunta que a anterior deixou.** "Em uma frase" → (por quê?) → "Como funciona" → (e daí?) → "Por que importa" → (e os detalhes?) → "Aprofundar". Use uma frase-dobradiça curta entre as seções quando a ligação não for óbvia.
5. **Listas encadeadas**: os itens de "Como funciona" seguem a ordem em que as coisas acontecem e se referem uns aos outros ("Com o IP em mãos, o roteador…"). Um item que não conversa com o vizinho deve ir para outro lugar.
6. **Conceitos novos só depois de criar a necessidade**: primeiro o problema concreto, depois o nome técnico.
7. **Repetir a palavra certa** em vez de trocar por sinônimos ("segmento… segmento", não "segmento… pedaço… porção"). Repetir dá coesão.

## Cadência
8. **Alternar frases curtas e médias.** Uma frase curta depois de duas médias marca o ponto principal.
9. **Um parágrafo = uma ideia**, de 1 a 3 frases. A primeira frase diz a ideia; as outras dão o dado concreto.
10. **Ritmo de passo a passo**: quando houver sequência, use marcadores de tempo ("primeiro… quando chega… só então…") em vez de "além disso".

## Checklist de revisão
- Lendo só a primeira e a última frase de cada aula, dá para contar a história do módulo?
- Toda seção começa respondendo a algo que a anterior deixou?
- Algum item de lista está solto, sem ligação com o vizinho?
- Aparecem palavras de IA (crucial, fundamental, vale ressaltar, além disso em sequência, em suma)?
- O exemplo e os números batem com a figura 3D da aula?

## Método (skill Writing With Agents, adaptado para revisão)
Skills em ~/.claude/skills/writing-with-agents/skills/ (architect, carpenter, judge…). Fluxo usado no SDLabs:
1. **Architect**: escrever o fio condutor do módulo (1 frase) e, para cada aula, a tese (1 frase) + a pergunta que ela deixa para a próxima. Arquivo: `docs/escrita/<modulo>-blueprint.md`.
2. **Carpenter**: reescrever seguindo o blueprint: ponte na abertura, frase-tópico em cada parágrafo, transição no fim de cada seção, gancho no fim da aula.
3. **Judge**: passes de voz de IA, Strunk & White (adaptado ao português), consistência de termos e números com as figuras. Relatório em `docs/escrita/<modulo>-judge.md`.
Como a Juliana revisa depois (e não a cada fase), o agente aprova o próprio blueprint seguindo PREMISSAS.md e este guia, e registra as decisões no blueprint.
