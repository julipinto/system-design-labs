#!/bin/sh
cd "$(dirname "$0")"
{ cat <<'H'
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview · Protocolos de Rede</title>
<link rel="stylesheet" href="../../shared/sdlabs.css"><link rel="stylesheet" href="content.css"></head>
<body><main class="sdl-content">
H
cat content.html
echo '</main><script src="content.js"></script></body></html>'
} > preview.html
