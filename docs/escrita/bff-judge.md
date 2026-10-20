---
type: judge-report
module: bff
---
# Relatório do Judge: módulo 9, Backend for Frontends (BFF)

## Passes feitos
1. **Voz de IA (português).** Busca por: crucial, fundamental, essencial, vale ressaltar, além disso, ademais, em suma, "não é apenas/só X", "robusto", "poderoso" e travessões (— e –) nas aulas, glossário, widgets e quiz. Uma ocorrência de "Essencial" (rótulo de categoria na aula 6) foi trocada por "Indispensável"; nenhum travessão.
2. **Strunk & White adaptado.** Frases terminam no fato, verbos simples, um parágrafo por ideia. Repetição deliberada de "BFF", "canal", "tela", "serviço", "chamada", "timeout", "fallback".
3. **Ponte e gancho.** 8 de 8 aulas têm `p.ponte` e `p.gancho` com "Falta saber…" (busca automática). A 1 retoma o módulo 8 (gw-loja como porta única); a 8 puxa o módulo 10 (Service Mesh) como o brief pede.
4. **Encadeamento das listas** de "Como funciona": aula 1 (4 coisas → 4 chamadas em fila → 480 ms → 180 KB → o que a tela usa), aula 2 (1 chamada → gateway → 4 em paralelo → espera a mais lenta → monta 12 KB), aula 3 (app → site → voz → mesmo serviço → parceiro fora), aula 4 (casca → cada pedaço ao seu BFF → compõe → publica sozinho), aula 5 (cabeçalho → dois BFFs → 10% → 50/100% → v3 sai), aula 6 (chama os 4 → espera 100 ms → fallback → pedidos cai → a Lena nem percebe), aula 7 (mede → app × web → origem dos 2% → 0,6% diluído → time corrige), aula 8 (gateway → BFF → caminho → quem olha o quê).
5. **Elenco e história contínua.** Lena (Recife, 4G), Bia (site), gw-loja, o gato (produto 42), a caneca azul, pedido 1048, SP/Recife; os três times do módulo 6. Pronomes: Bia e Lena só pelo nome ou "ela" para a Lena (personagem estabelecida).
6. **Consistência de números** entre texto, widgets, quiz e glossário: 120 ms (4G) e 30 ms (Wi-Fi), 4 × 120 = 480 ms, 180 KB → 12 KB, 25 ms, ~150 ms (120 + 25 + 5), timeout 100 ms, 30 s, 30% (v3), 10/50/100%, abaixo de 1%, p95 150 e 300 ms, erros 2% e 0,1%, 0,6% total. Quiz: 46 perguntas (6 + 7 + 6 + 6 + 6 + 6 + 5 + 4).

## Corrigido durante a escrita
- Aula 1: a primeira versão dizia que Sam Newman define o BFF pela experiência de uso e que iOS e Android podem dividir um BFF "segundo ele". A conferência da fonte mostrou que Newman prefere um BFF por **tipo de cliente**; o texto virou "escolha do exemplo". Também corrigida a autoria do termo (Nick Fisher, citado por Calçado).
- Aula 3: o roteamento do exemplo Envoy usava `/v2/` para o marketplace, o que não vem do módulo 8; trocado por `prefix: "/"` (a API pública pega o resto).
- Aula 5: a estratégia `flexibleRollout` e seus parâmetros foram conferidos no código do cliente Node do Unleash, já que a página de conceitos não traz o nome interno.
- Aula 8: removido o resumo em cinco linhas do Aprofundar (resumia o que acabou de ser dito).

## Pendências (decisão da Juliana ou da integração das figuras)
1. Os "Faça agora" das aulas 1, 2, 3, 5, 6 e 7 são genéricos sobre a figura; os nomes reais dos botões e dos modos entram na integração.
2. A **proporção de 26 pedidos do app a cada 100** (aula 7) foi inventada para fechar o 0,6% do brief. A figura `metricas` deve usá-la ou o texto muda.
3. Os ~5 ms de montagem do BFF fazem 120 + 25 + 5 = 150 ms; se a figura mostrar outro desdobramento do "~150 ms", ajustar.
4. As aulas 4 e 8 não têm figura 3D (como no brief): a 4 tem uma tabela de times, pedaços de tela e BFFs; a 8, uma tabela de decisão.
5. Home: o módulo entra com `n: 9` (campo novo `n` opcional no array `modules`). O "Em breve" continua com a numeração por posição e passa a mostrar "07"; o maestro ajusta. A prévia `labs/bff/bff-3d-previa.webp` ainda não existe (vem com a figura).
6. `min` (tempo de leitura) estimado, não medido.
7. As duas Referências do Medium dão 403 para robôs; não foram lidas nem citadas.
