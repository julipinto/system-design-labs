#!/usr/bin/env bash
# Publica o site no GitHub Pages sem GitHub Actions: gera dist/ e envia para a branch gh-pages.
# Uso: npm run deploy   (o Pages do repositório está configurado para servir a branch gh-pages)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
REMOTE="$(git remote get-url origin)"
HELPER="$(git config --get-all credential.https://github.com.helper | tail -1 || true)"
TMP="$(mktemp -d)"
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git config user.name "$(git -C "$ROOT" config user.name)"
git config user.email "$(git -C "$ROOT" config user.email)"
if [ -n "$HELPER" ]; then git config --add credential.https://github.com.helper ""; git config --add credential.https://github.com.helper "$HELPER"; fi
git add -A
git commit -q -m "Deploy $(git -C "$ROOT" rev-parse --short HEAD)"
git push -q -f "$REMOTE" gh-pages
echo "publicado: $(git -C "$ROOT" rev-parse --short HEAD) → gh-pages"
rm -rf "$TMP"
