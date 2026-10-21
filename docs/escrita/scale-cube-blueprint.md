# Blueprint do módulo 15: Scale Cube

Fase Architect (skill writing-with-agents) seguindo PREMISSAS.md e ESCRITA.md. O agente aprova o próprio blueprint; as decisões ficam registradas no fim. Brief: `docs/escrita/scale-cube-brief.md`.

## Fio condutor do módulo
Cada gargalo da Black Friday se resolveu e andou para outro lugar, até o banco do `pedidos` (150 pedidos/s), que clonar serviço não move; o módulo dá o mapa de três perguntas (clonar, separar por função, separar por dados) para decidir por onde crescer, em que ordem e a que custo.

## Tese de cada aula e a pergunta que deixa para a próxima

| # | Aula | Tese (1 frase) | Pergunta que deixa |
|---|---|---|---|
| 1 | Introdução ao modelo conceitual | O Scale Cube é um vocabulário de três perguntas (X copia, Y separa o diferente, Z separa o igual grande demais); a loja está em (10, 9, 1) e a tabela liga cada sintoma a um eixo, inclusive o "nenhum" da busca de 900 ms. | Onde o X, o eixo mais fácil, para? |
| 2 | Eixo X: escalabilidade horizontal | O X é copiar e dividir o tráfego (640 ÷ 10 = 64) e funciona enquanto cada cópia só depender de cópia; o carrinho na memória e a sexta réplica do `pedidos` mostram onde ele falha. | Como ver o X acontecendo de verdade? |
| 3 | Eixo X: exemplo | Clonar é um comando (`kubectl scale`) e a prova de que as cópias são idênticas é cada resposta de `/hostname` dizer um pod diferente; sem prontidão, apagar um pod derruba requisições. | E se o problema é que as funções são diferentes? |
| 4 | Eixo Y: quebra de funcionalidade | O Y separa o que é diferente (verbo × substantivo), custa 25 vCPU contra 80, dá dono a cada time e exige dados próprios; o serviço por tabela troca 2 ms de JOIN por 105 ms de rede. | Quem divide os dados? |
| 5 | Eixo Z: sharding e particionamento de dados | O Z separa o que é igual, mas grande demais: mesmo código, um roteador e uma chave; fecha os 200 pedidos/s com 3 shards, e a consulta sem a chave vira scatter-gather. | Em que ordem e quantas unidades juntando os três? |
| 6 | Conversão dos eixos | Os eixos se multiplicam e a ordem é a do gargalo: (1,1,1) → (1,9,1) → (10,9,1) → (10,9,3), 30 pods viram 36, e usar os três sem sintoma dá 120 pods. | Como partir a tabela de 50 milhões de linhas de verdade? (módulo 16) |

## Decisões
1. **Uma figura por aula, no máximo, sempre a `cubo`.** A1 `cubo`, A2 `x` (o "Faça agora" manda trocar para o cenário `x-teto`), A3 `x` (com o laboratório ao lado), A4 `y`, A5 `z`, A6 `conversao` (o "Faça agora" manda trocar para o cenário `loja`). Os nomes dos botões nos "Faça agora" são genéricos; o maestro os alinha.
2. **A ponte da aula 1** é o gancho do fim do módulo 14 (`aula-6-conclusao`): o banco do `pedidos` a 150/s, que réplicas não resolvem, e a promessa de um mapa.
3. **A conta de 200 pedidos/s** aparece em três lugares com o mesmo dado: um resumo no Aprofundar da aula 1 ("a conta que as aulas 5 e 6 fecham"), a tabela completa no corpo da aula 5 (com o `mkt-01` e as conexões) e a tabela por estado e coordenada na aula 6.
4. **O laboratório da aula 3 é do SDLabs** (não do autor). Os três manifestos vão em `<pre>` no Aprofundar, com a saída de exemplo avisada como ilustrativa e o aviso de que os YAMLs não foram aplicados num cluster.
5. **Widgets onde o brief manda:** `diagnostico` na aula 1, `cubo-pods` nas aulas 2 e 6 (mesma peça; na 2 para ver o teto, na 6 para juntar os eixos), `vcpu` na 4, `roteador` e `scatter` na 5. O `vcpu` assume que só o catálogo cresce com o tráfego da vitrine e os outros 15 vCPU ficam fixos, o que reproduz 80 contra 25 a 10×.
6. **Correções ao artigo** (8) ficam no Aprofundar da aula a que pertencem e no resumo de `docs/fontes/scale-cube.md`: 1, 2 e 8 na aula 1; 4 na 2; 5 na 4; 3 e 7 na 5; 6 na 6.
7. **"Pod" só no sentido da AKF**, com o aviso de que não é o pod do Kubernetes, na aula 5 (primeira vez), na 6 e no glossário.
8. **O ônibus do módulo 14 não volta** neste módulo (o brief permite uma vez, e nenhuma aula pedia a analogia).
9. **Vocabulário fixo** do brief: Scale Cube, eixo X (clonar), eixo Y (separar por função), eixo Z (separar por dados), decomposição funcional, por verbo, por substantivo, roteador, scatter-gather, pod, sem estado, sticky. Nenhuma marca de curso.
