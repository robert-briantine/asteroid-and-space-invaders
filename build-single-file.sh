#!/bin/bash
# Combine index.html + main.js + config.json en un seul fichier HTML
# pour que Tauri n'ait qu'un seul asset à embedder
set -e
cd "$(dirname "$0")"

OUTPUT="public/game.html"

# Lire les fichiers
HTML=$(cat public/index.html)
JS=$(cat public/main.js)
CONFIG=$(cat public/config.json)

# Créer le fichier combiné
cat > "$OUTPUT" << 'HEADER'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Space Invaders Bis</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
    #game { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module">
HEADER

# Injecter la config comme une constante
echo "const __CONFIG__ = $CONFIG;" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Injecter le JS
echo "$JS" >> "$OUTPUT"

# Fermer
cat >> "$OUTPUT" << 'FOOTER'
  </script>
</body>
</html>
FOOTER

echo "✓ $OUTPUT créé ($(wc -c < "$OUTPUT") octets)"
