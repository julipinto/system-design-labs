# Figuras 3D alinhadas à bíblia (serie.md)

Só strings e rótulos em `fig3d.js` (PT) e `fig3d.en.js` (EN). Geometria, números, IDs, chaves JS (`irmao`, `imob`) e contas ficaram como estavam. Linhas aproximadas (PT).

| Figura | Linha | Antes → depois |
|---|---|---|
| cap-3d | 2, 300, 344–392, 420–426 | Lena em SP / irmão em Recife → Bia em SP (#101 e #102) e Lena em Recife (#103); rótulos LENA/IRMÃO → BIA/LENA; "celular do irmão" → "celular da Lena" |
| acid-3d | 1–5, 30, 152–153, 163–562 | transferência pelo app do banco para o irmão → crédito da carteira da loja, Lena → Bia (150→50, 20→120); `id = 'irmao'` → `'bia'`; "app do banco" → "app da loja"; "conta" → "carteira" |
| acid-3d (cenário I) | 303–378, 562, 573 | aluguel / débito automático / imobiliária → compra de R$ 40 na loja (T2 · compra, linha "loja"); rótulo AUTO DEBIT → COMPRA NA LOJA |
| acid-3d (BASE) | 78, 441–495 | SP(A)–Rio–Recife(C), escrita em A (SP) e irmão lê em C (Recife) → NCITY A=Recife, C=São Paulo: Lena escreve no nó de Recife, Bia lê em São Paulo (nó C) |
| osi-3d, osi (2D: osi-figure.mjs, osi-data(.en).js, osi-stages.en.mjs) | 58, 71, 155–208 | Lena · São Paulo → Lena · Recife; Irmão · Tóquio → Téo · Tóquio; "irmão" → "Téo" |
| tcp-3d | 151, 195, 201, 217 | Lena em São Paulo → Recife; irmão em Tóquio → Téo |
| monolito-3d | 211 | "para o irmão" → "presente de boas-vindas para o Téo" (pedido 1047) |
| dominio-3d | 219 | "presente para o irmão" → "presente de boas-vindas para o Téo" |
| gateway-3d | 242 | "marketplace-xyz" → "MegaMercado (marketplace-xyz nas chaves e nos logs)"; demais rótulos mantêm o ID |
| cubo-3d | 538 | "O marketplace mkt-01" → "O MegaMercado (mkt-01)" |
| isolamento-3d | 300 | "o marketplace parceiro" → "o MegaMercado, parceiro" |
| sinais-3d | 6, 216, 776, 778 | quinta 03/12/2026 → quinta 02/12/2027 (ISO 2027-12-02; EN 12/02/2027) |
| celulas-3d | 320 | "presente para as duas sobrinhas" → "presente para a sala de aula dela" (EN: "a gift for her classroom") |

Não mudaram: celulas-3d/spof-3d/desastre-3d/contrato-3d (sem data de 2026 para trocar; "2027" e "c28.py 21/10/2026" ficam), bff-3d/loja-3d/shards-3d (marketplace-xyz/mkt-01 sem conflito).

## Pendências
- Pôsteres não refeitos: `~/.cache/ms-playwright` não existe após a migração para o Fedora (usei Brave em `CHROME_PATH`), e os builds de acid-3d/cap-3d/osi-3d não tratam `?poster` (saiu a página inteira). `acid-3d-previa.webp` mostra "irmão 20" em texto minúsculo e precisa ser refeito com um build que tenha o modo `.poster` (como balanceador-3d/celulas-3d). cap-3d, osi-3d e tcp-3d: o pôster não mostra texto alterado.
- Testado: build das 11 figuras, captura 1280 e 390 de acid-3d (BASE), cap-3d e osi-3d: console limpo, sem scroll lateral. Temas claro/escuro e os outros passos não foram percorridos.
