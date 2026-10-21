# Judge do módulo 22: Modelos de Deployment

Fase Judge (writing-with-agents) sobre as 12 aulas de `src/content/deployment/`, seguindo ESCRITA.md. O agente aplicou os passes e corrigiu o que achou.

## Passe 1: voz de IA
- Busca por "crucial", "fundamental", "vale ressaltar", "além disso", "em suma", "ademais", "não é só X, é Y", travessões e "essencial": **2 ocorrências** (um "fundamental" numa descrição da aula 1 e um título "Não é só para consumidor Kafka" na aula 2), reescritas. Sem travessões nos textos.
- Fechamentos: nenhuma seção termina em resumo; os fechamentos de seção são o dado (a perda, o tempo, o erro).

## Passe 2: ponte e gancho (lendo só a primeira e a última frase de cada aula)
1. **Abre:** "No fim do módulo 21 a loja aguentava o PSP lento… a causa mais comum de incidente é a própria mudança." **Fecha:** "Falta saber qual é o jeito mais simples de publicar."
2. **Abre:** "Na aula passada a volta ficou clara…" **Fecha:** "Falta saber se dá para trocar sem parar."
3. Rolling: abre com o custo dos 40 s do Recreate; fecha com "como testar a versão nova antes de ela atender".
4. Blue/Green: abre no rolling que pôs a 2.5.0 em 100% sem teste; fecha em "o que o laboratório faz".
5. Exemplo blue/green: abre no que o blue/green prometeu; fecha em "e se a gente não virar tudo, e sim uma fatia".
6. Canary: abre na análise cega ao frete; fecha em "como o laboratório escreve isso em YAML".
7. Exemplo canary: abre na definição de canary; fecha em "e se a coluna mudou".
8. Migrations: abre no dado escondido na análise do canary; fecha em "como testar com tráfego real sem arriscar o dado".
9. Shadow: abre na 2.5.0 que ainda não viu um pedido real; fecha em "como o laboratório configura isso no Istio".
10. Exemplo shadow: abre no espelho em papel; fecha em "separar publicar de liberar".
11. Flags: abre no risco da regra; fecha em "quem recebe primeiro".
12. Anéis: abre no sorteio que não escolhe quem; fecha com "Falta saber como prever a capacidade… módulo 23, Capacity Planning".

A história do módulo se conta só com essas pontas.

## Passe 3: consistência de termos e números com a figura, o widget, o quiz e o glossário
- **Mantidos iguais em todos:** 2.4.0 → 2.5.0 (e 2.6.0 na aula 8); pedido 1059 (64,00 → 49,00); Recife 1 pedido/s, R$ 15/s; 3.600 pedidos e R$ 54.000 (R$ 486.000 às 23:00); 40 s, 80 s, 90 s; R$ 450 (30 pedidos); R$ 9.600 (150 cobranças); 150 pedidos e 22%; 298 requisições; buckets 3 · 19 · 38 · 41 · 94 (e 80 · 2 · 72 · 67 · 87); 985 · 9.878 · 49.909; anéis 20/20/60 → 20 → 40 → 100%; 30 min por shard; 3,2 ms · 1,9 ms · 7,9 s · 8,0 s · +100% × +22% · 4,0 s × 1,0 s · 2,0 s × 2,95 s.
- **Verificados contra o código:** o `murmur3` do widget dá os buckets do brief; a simulação do rolling do widget dá 90 s (3 pods) e 60 s com mínimo de 8 prontos (10 pods); a conta do canary dá 22,1%, 298 e 10 min (4,7 s no catálogo); o backfill dá 29,6 min por shard.
- **Linhas de código citadas** (aulas 5, 7 e 10) conferidas com os arquivos copiados em `src/lab-code/deployment/`.

## Passe 4: Strunk & White (adaptado)
- Frases curtas depois de médias no ponto principal; voz ativa; palavra repetida em vez de sinônimo (*green*, *blue*, *canary*, *shadow*, *anel*).
- Listas de até 5 itens, encadeadas pela ordem em que as coisas acontecem.
- Termos novos só depois do problema (*raio de explosão* na aula 1 com a perda de R$ 54.000; *amostra* na aula 6 com os 150 pedidos).

## Pendências para o maestro
- Os marcadores `{/* FIG:rollout mode=x */}` e `{/* FIG:liberacao mode=x */}` estão no lugar do `Figure3D` (um por aula); os "Faça agora" usam os nomes dos botões informados (Rollback, Recreate, Rolling, Blue/Green, Canary, Migração, Shadow, Flag, Anéis) e, nas aulas 5, 7 e 10, descrevem o ajuste que a figura precisa mostrar (janela do blue, análise de negócio, espelho a 100%).
