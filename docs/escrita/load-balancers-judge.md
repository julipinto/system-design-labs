---
type: judge-report
module: load-balancers
---
# Relatório do Judge: módulo 7, Load Balancers e Proxies Reversos

## Passes feitos
1. **Voz de IA (português).** Busca automática por: crucial, fundamental, essencial, vale ressaltar, além disso, ademais, em suma, "não é apenas/só X", "mais do que", "robusto", "poderoso", jornada, panorama, ecossistema e travessões (— e –). Três ocorrências, todas trocadas: "Mais do que balancear" (aula 8, virou "O mesmo passo serve a outros trabalhos"), "fama de robusto" (aula 9 e glossário, virou "usado onde o balanceador precisa ser rápido e estável") e "por inteiro" (aula 10, que não lia o arquivo inteiro). Nenhum travessão.
2. **Strunk & White adaptado.** Frases terminam no fato, verbos simples, um parágrafo por ideia. A palavra certa se repete ("réplica", "pool", "pedido pendente", "conexão", "healthcheck") em vez de sinônimos.
3. **Ponte e gancho.** Cada aula abre retomando a pergunta deixada pela anterior e fecha com "Falta saber…" (checado por busca: uma ocorrência por aula, 10 de 10). A aula 1 liga com o fim do módulo 6 (a loja em serviços, o `catalogo` em réplicas); a 10 puxa o módulo 8 (API Gateways: login, limite e versões feitos uma só vez, na porta).
4. **Encadeamento das listas** de "Como funciona": aula 1 (sem balanceador → com → healthcheck → trava → volta e escala), aula 3 (fila → rodízio → problema → quantum → peso), aula 4 (contador → escolha → fila de 9 → onde brilha → catalogo-4), aula 5 (conexão → regra → foto → erro → quando funciona), aula 10 (7 containers → curl → 6 curls → stop → healthcheck).
5. **Elenco e história contínua.** Lena, Bia, Caio e Davi, `loja.com.br` (203.0.113.10), `catalogo-1` a `-4` e o `lb-loja`; o NGINX na frente do `pagamentos` volta na aula 2; as camadas da aula 8 ligam com o módulo 1 (OSI e TLS). Os pronomes de Bia, Caio e Davi não aparecem.
6. **Consistência de números** entre texto, widgets, quiz, glossário e figuras: gato 20 ms, busca 900 ms; sem balanceador 100% / 0% e 20 ms → 1,8 s; healthcheck 5 s, timeout 1 s, 3 falhas, 2 sucessos, 20:00:15 e 20:05:10; round robin 2,7 s contra 60 ms; quantum 300 ms (2 por vez); peso 1, 2, 3, 3; least request com 3.000 contra 0; least connection 5 · 3 · 4; LOR 0 · 3 · 1; LOR na fila de 9 com um pedido a cada 100 ms = 940 ms por réplica (conferido no simulador); IP hash com h = octeto3 × 256 + octeto4 (5.125, 11.274, 1.825, 23.042) → `catalogo-2`, `-1`, `-2`, `-3`; NAT de 500 pessoas; saída da `catalogo-3`: 2/3 com módulo e 1/3 com hashing consistente; random 2 · 5 · 3; L4 +0,1 ms e L7 +1 ms; laboratório com 7 containers, healthcheck de 10 s e até 30 s para sair do pool.

## Corrigido durante a escrita
- **Aula 7: o hash de exemplo divergia.** O texto dizia `octeto1 × octeto3 + octeto2 × octeto4` (Lena = 3.730), e a figura `balanceador-3d` usa `octeto3 × 256 + octeto4` (Lena = 5.125). As duas dão `catalogo-2` para a Lena, mas os números mostrados não batiam. O texto, o flashcard e o widget passaram a usar o da figura. As figuras não foram tocadas.
- **Aula 3:** o título do widget `sim-rr` dizia "seis regras" e o widget mostra três rodízios; título trocado.
- **Aula 10: o brief e o repositório divergem do código.** O brief falava em um app Node.js e em health check "se houver", e dizia que sem health check a saída seria pela outlier detection. O `docker-compose.yml` sobe três apps (um por proxy) e o `load-balancer.yaml` tem healthcheck ativo. A aula segue os arquivos e registra as divergências (README, porta 9902 do `reverse-proxy-2`, `test-patterns.sh` que lê o cabeçalho no corpo, `test-weighted-quantum.sh` com pesos 5/3/2 que o YAML não tem, e "quantum" para `load_balancing_weight`).
- **Aula 10, slow start:** a primeira redação dizia que o slow start vale para o host que "volta" ao pool; a documentação do Envoy fala em endpoints recém-adicionados. Corrigido na aula, no quiz e no glossário.
- **Fontes:** a linha do RFC 9110 dizia que ele cobre o `Cookie`; o `Cookie` é do RFC 6265. Removido.
- **"Faça agora" das aulas 1 a 8** reescritos com os nomes reais dos botões (Sem LB, Health, RR, LR, LC, LOR, Hash, Random, Proxy, L4, L7, Lab) e dos passos de cada figura.

## Pendências (decisão da Juliana ou da integração das figuras)
1. **Os marcadores `{/* FIG:... */}` ainda não viraram `<Figure3D>`:** as aulas 1 a 8 e 10 trazem o marcador e a aula 9 não tem figura. Posters provisórios (`balanceador-3d-previa.webp`, modo `rr`, passo 5; `camadas-3d-previa.webp`, modo `lab`, passo 4) foram gerados por captura da própria figura embutida, em tema escuro; se a figura ganhar um poster oficial, é só substituir os arquivos.
2. **Aula 8 e figura `camadas`:** o marcador usa `mode=l4` e o "Faça agora" manda trocar para L7 no painel. Se preferir, a integração pode abrir o `l7` na aula.
3. **O laboratório da aula 10 não foi executado** (não subi os 7 containers; memória do WSL). O texto descreve o que os arquivos dizem, e a aula avisa isso no "Como rodar". A ordem exata dos 6 curls e o código (503) da queda do `reverse-proxy-2` dependem do DNS interno do Docker; vale rodar uma vez.
4. **Home:** a entrada do módulo usa `n: 7` (campo novo, opcional, no tipo `Mod` de `src/pages/index.astro`), porque a posição no array daria "06". O cartão "Em breve" continua mostrando "07" (posição no array, não mexi nele); quando os módulos 6 e 8 entrarem a numeração se acerta.
5. **`npm run build:3d`** não inclui `balanceador-3d` nem `camadas-3d` (`package.json` é proibido pela regra). Os dois builds precisam entrar no script na integração; por enquanto os HTML estão em `public/labs/load-balancers/*-3d/` (ignorados pelo git).
6. **`node_modules` do checkout principal está quebrado:** `sdlabs/node_modules` virou um link para si mesmo às 19:59 (loop de symlinks) e os worktrees m8, m9 e m10 apontam para ele. Neste worktree troquei o link por um `npm ci` local. Os outros três precisam de `npm ci` (ou o link refeito).
7. `min` (tempo de leitura) estimado, não medido.
8. O endereço do repositório público de exemplos contém o nome de um curso. O texto das aulas não cita o curso; só reproduz código público. Se preferir não linkar, tirar o item da lista de Fontes da aula 10.
