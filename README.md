# System Design Labs

Laboratórios visuais e interativos para estudar System Design.

Notas pessoais de estudo, escritas com minhas palavras. Fonte: artigos públicos de Matheus Fidelis em
[fidelissauro.dev](https://fidelissauro.dev). Sem vínculo com o autor ou com qualquer curso.

**Módulos**
- [Protocolos de Rede](https://julipinto.github.io/system-design-labs/labs/protocolos-de-rede/): OSI numa figura interativa, IP, TCP/UDP, TLS, DNS, DHCP, HTTP e tempo de resposta.

**Rodar local** (Node 22.12 ou mais novo):

```sh
npm install
npm run dev       # gera a figura 3D e abre http://localhost:4321/system-design-labs/
npm run build     # gera a figura 3D (build:3d) e o site em dist/
npm run preview   # serve o dist/
```

Feito com [Astro](https://astro.build), sem framework de UI. As aulas ficam em `src/content/<módulo>/*.mdx`.
Para criar um módulo novo, veja `src/content/_template/README.md`.

O kit isométrico em `src/figures/anatomy/` e o modelo 3D em `tools/iso-glow/` são MIT (ver os `LICENSE` de cada pasta).

## Para publicar com Astro

O workflow `.github/workflows/deploy.yml` já builda e publica a cada push na `main`. Falta um passo, feito à mão
no GitHub: **Settings → Pages → Source: GitHub Actions** (hoje está em "Deploy from a branch"). Depois disso,
o merge da branch `astro` na `main` publica o site novo nas mesmas URLs.
