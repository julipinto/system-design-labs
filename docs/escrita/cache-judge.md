---
type: judge-report
module: cache
---
# Relatório do Judge: módulo 5, Estratégias de Cache

## Passes feitos
1. **Voz de IA (português).** Busca automática por: crucial, fundamental, essencial, vale ressaltar, além disso, ademais, em suma, "não é apenas/só X", "robusto", "poderoso" e travessões (— e –). Nenhuma ocorrência nas 7 aulas.
2. **Strunk & White adaptado.** Frases terminam no fato, verbos simples ("é", "tem", "custa"), um parágrafo por ideia. A palavra certa se repete ("cache", "chave", "hit", "miss", "TTL", "evicção", "cópia") em vez de sinônimos.
3. **Ponte e gancho.** Cada aula abre retomando o problema deixado pela anterior (a 1 retoma o módulo 4: a tabela `pedidos`, o pedido 1042 e a frase da aula 15 sobre leitura intensiva) e fecha com "Falta saber…" (checado por busca: uma ocorrência por aula, 7 de 7). A última da série aponta para sharding e replicação, o mesmo gancho que o módulo 4 deixou.
4. **Encadeamento das listas** de "Como funciona": aula 1 (pergunta → miss → grava → hit → vence), aula 2 (t = 0 → t = 20 → t = 30 → t = 60 → DEL), aula 3 (sequência → 99 chega → LRU → LFU → FIFO), aula 4 (contar → taxa → custo → média → sensibilidade), aula 5 (hashmap → 3 frias → preços → apagar → Redis), aula 6 (aside → through → ordem → behind → falha), aula 7 (constantes → chave → pergunta → miss → hit).
5. **Elenco e história contínua (PREMISSAS 15b).** Lena (Recife), Bia, Caio e Davi, a loja, o produto 42 (gato de pelúcia), o PostgreSQL do módulo 4 e a origem em São Paulo. Pronomes: Davi e Bia aparecem só pelo nome ("um pedido do Davi"), sem artigo ou pronome de gênero.
6. **Consistência de números** entre texto, widgets, quiz e glossário: 40 ms (banco), 1 ms (Redis), 0,05 ms (hashmap), TTL 60 s, 8 hits e 2 misses = 80%, 9 ms contra 40 ms, miss = 41 ms, limiar de 2,5% (1 ÷ 40), 50% = 21 ms, 90% = 5 ms, 99% = 1,4 ms, 0% = 41 ms; relógio t = 0 / 20 / 60 s (40 s de dado velho); 3 vagas e a sequência 42, 7, 42, 13, 99 (LRU e LFU tiram o 7, FIFO tira o 42); réplicas A, B e C com t = 0, 10 e 30 (89.90, 89.90, 79.90) e 70% contra 90%; write-through 40 + 1 = 41 ms; CDN de 120 KB, ~50 ms, ~5 ms, `Age: 12`, `max-age=3600`; SHA-1 de `GET/gato.jpg` = `f34b9897…ffa`.

## Corrigido durante a escrita
- Aula 2: a ponte dizia que a Lena "abriu o link que a Bia mandou" e pagava outro valor, uma cena que a história não tinha. Reduzida para a Bia vendo 89.90 com o banco em 79.90.
- Aula 3: o cache de 3 vagas ia ter "caneca azul" e "camiseta preta", nomes que não batem com os produtos 7 e 13 da sequência. Passou para "outros dois produtos (7 e 13)". No quiz, a pergunta da LRU foi reescrita para listar os acessos em ordem.
- Aula 5: a documentação do Redis sobre client-side caching foi movida para `.../develop/reference/client-side-caching/` (o endereço antigo é um redirecionamento por meta refresh).
- Aula 7: o código ficou sem alteração alguma, numerado à esquerda para ser lido linha a linha. A frase sobre CDNs e erros 404/500 foi suavizada ("costuma tratar os erros à parte"), porque não há fonte conferida para negative caching.
- Aula 6: a afirmação de que o write-through enche o cache com o que ninguém pede é raciocínio próprio; a página da AWS não a traz, e o registro de fontes diz isso.

## Pendências (decisão da Juliana ou da integração das figuras)
1. Os "Faça agora" das aulas 1 a 7 são genéricos ("avance os passos e observe X"). Os nomes reais dos botões e modos entram na integração.
2. **Aula 4** reaproveita `cache mode=aside` (contadores de hits, misses, hit rate e ms) em vez de ter um modo próprio; a aula 1 usa a mesma figura. Se a figura trouxer um modo dedicado a "10 pedidos, 8 hits", o marcador da aula 4 troca.
3. **Aula 6** tem um marcador só (`cache mode=through`); o `behind` (e se o Redis cair) depende do toggle no painel. O DoIt pede essa troca. A CDN fica só em texto na aula 6, e a figura `cdn` entra na aula 7 (`mode=lab`, com o painel trocando para `miss`, `hit` e `expire`).
4. Aula 3: a figura precisa aceitar `&pol=` para o DoIt "troque a política no painel" fazer sentido.
5. `min` (tempo de leitura) estimado, não medido.
6. O endereço do repositório público de exemplos contém o nome de um curso. O texto das aulas não cita o curso e só reproduz o código público de `cdn/main.go` e um trecho de `app/cache-memory/main.go`. Se preferir não linkar o repositório, tirar o item da lista de Fontes da aula 7 (o código lido continua válido).
7. O brief falava em 29 links nas Referências; são 9 (8 distintos, e o do Medium dá 403 para robôs). Ver `docs/fontes/cache.md`.
8. O Medium (403) não foi aberto nem pelo navegador embutido; se importar, a Juliana pode exportar o texto.

## Checklist do ESCRITA.md (primeira e última frase de cada aula)
1. "O módulo 4 terminou com a loja bem guardada: a tabela pedidos no PostgreSQL, o pedido 1042 da Lena no lugar certo, [...]" / "[...] Falta saber por quanto tempo essa cópia pode continuar dizendo o valor antigo e quem decide isso."
2. "Na aula passada a cópia do produto:42 entrou no cache com o preço de 89.90. [...]" / "[...] Falta saber qual cópia sai para abrir espaço."
3. "Na aula passada o cache da loja ganhou prazo de validade, mas ainda tem um limite que o TTL não resolve: a memória acaba. [...]" / "[...] Falta saber como medir o quanto o cache acerta e quanto isso vale em milissegundos."
4. "Agora o cache da loja guarda, esquece pelo tempo e esquece pelo espaço, [...]" / "[...] Falta saber o que acontece com o hit rate e com o preço quando a loja sobe 3 réplicas do app."
5. "Os 80% da aula passada imaginavam um cache só. [...]" / "[...] Falta saber quem faz cada uma dessas duas coisas, e em que ordem, para a Lena não pagar o preço velho."
6. "Na aula passada ficou aberta a pergunta de quem enche o cache e de quem o atualiza quando o preço muda. [...]" / "[...] Falta saber como se escreve um desses, linha a linha, e o que um proxy de 85 linhas ainda não faz."
7. "Na aula passada o edge de Recife guardou o gato.jpg de 120 KB e passou a entregá-lo à Lena em 5 ms, [...]" / "[...] Falta saber o que fazer quando o próprio banco não aguenta mais, dividindo os dados entre vários servidores (sharding) e copiando-os (replicação)."

## Teste de tela (Haiku, 390 e 1280 px, claro e escuro)
Console limpo, sem scroll horizontal, widgets conferidos contra os números do brief (ttl, evict, hitrate, cdnkey com os 3 hashes), `<pre>` das aulas 5, 6 e 7 rolando sozinhos, quiz com 46 perguntas e os 3 tipos funcionando, home com o card do módulo 5 e "Em breve" para o 6. Corrigido depois do teste: quebra de palavra no meio ("TT/L") nas tabelas dos widgets, "1 hits" e "1000" sem separador de milhar.
