# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **A Juliana**: estuda System Design para o trabalho, tem TDAH e estuda principalmente no celular, em sessões curtas. Precisa ver onde parou e o que falta, uma aula por vez.
- **Quem estuda System Design em português**: gente nova na área que cai num termo técnico e precisa da ficha do glossário sem sair da aula.

## Product Purpose
Laboratórios visuais e interativos de System Design (rede, storage, CAP/ACID, bancos, cache…). O objetivo é "inesquecível": depois de mexer na figura e no widget, a pessoa consegue explicar o assunto sem olhar. Sucesso = aula entendida (botão "Entendi"), flashcards respondidos de cabeça, quiz do módulo feito.

## Positioning
A mesma história atravessa todos os módulos: a Lena (Recife) compra o gato de pelúcia na loja, e cada módulo é o próximo problema dessa loja que cresce. As figuras 3D (iso-glow) mostram o dado real em cada passo (bytes, endereços, páginas, SQL com a resposta), não caixinhas.

## Operating Context
- Leitura no celular a 390px, uma aula por vez (modo foco), com barra fixa de progresso e navegação entre aulas.
- No desktop, a figura 3D fica embutida (iframe) e responde às setas com o mouse em cima; no celular aparece como prévia com botão para abrir em tela cheia.
- Cada aula: Em uma frase → Faça agora → Como funciona → Por que importa → Aprofundar → Fontes → Pra não esquecer (flashcards) → Entendi.
- Quiz standalone por módulo (HTML/JS puro), glossário por módulo com fichas tocáveis.

## Capabilities and Constraints
- Astro estático, sem framework de UI. Publicado em GitHub Pages sob `/system-design-labs/` (links sempre com `withBase`).
- Figuras 3D geradas no build a partir de `tools/iso-glow/gallery-3d.html`; aceitam `?mode=` e `?embed=1`.
- Progresso no localStorage (`sdl-<módulo>:`), sem conta nem servidor.
- Tudo em português. Texto das aulas é autoral; não muda por motivo de design.

## Brand Commitments
- Nome: SDLabs. Notas pessoais de estudo, com palavras próprias, a partir dos artigos públicos de Matheus Fidelis (fidelissauro.dev), com crédito e "sem vínculo".
- Não citar curso nem marca de terceiros; não reproduzir títulos ou durações de aulas pagas.
- Elenco fixo: Lena, a loja, Bia, Caio, Davi; cidades SP, Rio, Recife; o gato de pelúcia.

## Evidence on Hand
- 4 módulos publicados (Protocolos de Rede, Storage/RAID/IO, CAP/ACID/BASE, Databases), módulo 5 (cache) em produção.
- Prévias webp das figuras em `public/labs/<módulo>/*-3d-previa.webp`.
- Sem depoimentos, métricas de uso ou números de audiência: não inventar.

## Product Principles
1. Uma coisa por vez: uma aula, uma ação, uma frase para guardar.
2. O progresso está sempre à vista.
3. O que está ativo acende; o resto fica quieto.
4. Celular primeiro; o desktop ganha a figura viva.
5. Mesmos personagens e números no texto, na figura, no glossário e no quiz.

## Accessibility & Inclusion
- TDAH: frases curtas, listas de até 5 itens, passos numerados, pouca distração visual, progresso visível.
- WCAG AA (contraste ≥ 4,5:1) nos temas claro e escuro; alvos de toque ≥ 44px; respeitar `prefers-reduced-motion`.
