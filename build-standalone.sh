#!/bin/bash
# Crée un exécutable standalone Windows avec toutes les DLL embarquées
set -e
cd "$(dirname "$0")"

echo "=== Build de l'exécutable standalone ==="

# 1. Compiler le binaire Tauri pour Windows (cross-compilation)
echo "1/3: Compilation du binaire Tauri..."
source ~/.cargo/env
cd src-tauri
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc \
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_AR=x86_64-w64-mingw32-ar \
cargo build --target x86_64-pc-windows-gnu --release
cd ..

# 2. Créer le dossier de sortie
OUTPUT_DIR="dist-standalone"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 3. Copier l'exécutable
echo "2/3: Copie de l'exécutable..."
cp src-tauri/target/x86_64-pc-windows-gnu/release/app.exe "$OUTPUT_DIR/SpaceInvadersBis.exe"

# 4. Trouver et copier les DLL nécessaires
echo "3/3: Recherche des DLL nécessaires..."

# Utiliser objdump ou strings pour identifier les dépendances
# Pour MinGW, les DLL sont généralement dans /usr/x86_64-w64-mingw32/lib/
MINGW_LIB="/usr/x86_64-w64-mingw32/lib"

if [ -d "$MINGW_LIB" ]; then
  # Copier les DLL essentielles pour Tauri/WebView2
  for dll in libwinpthread-1.dll libstdc++-6.dll libgcc_s_seh-1.dll libgomp-1.dll; do
    if [ -f "$MINGW_LIB/$dll" ]; then
      cp "$MINGW_LIB/$dll" "$OUTPUT_DIR/"
      echo "  ✓ $dll"
    fi
  done
  
  # WebView2Loader si disponible
  if [ -f "$MINGW_LIB/WebView2Loader.dll" ]; then
    cp "$MINGW_LIB/WebView2Loader.dll" "$OUTPUT_DIR/"
    echo "  ✓ WebView2Loader.dll"
  fi
else
  echo "⚠ MinGW lib directory not found at $MINGW_LIB"
  echo "  Les DLL devront être copiées manuellement"
fi

# 5. Créer un README
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
Space Invaders Bis - Exécutable Standalone Windows
===================================================

Contenu du dossier :
- SpaceInvadersBis.exe : L'application principale
- *.dll : Bibliothèques dynamiques nécessaires

Pour lancer le jeu :
  Double-cliquez sur SpaceInvadersBis.exe
  Ou depuis le terminal : ./SpaceInvadersBis.exe

Prérequis :
- Windows 10 ou 11
- Microsoft Edge WebView2 Runtime (installé par défaut sur Windows 10/11)

Les scores sont sauvegardés dans :
  %APPDATA%/space-invaders-bis/scores.json
EOF

# 6. Créer une archive ZIP
echo "Création de l'archive ZIP..."
cd "$OUTPUT_DIR"
zip -r "../space-invaders-bis-standalone.zip" .
cd ..

echo ""
echo "=== Build terminé ==="
echo "Dossier : $(pwd)/$OUTPUT_DIR"
echo "Archive : $(pwd)/space-invaders-bis-standalone.zip"
echo ""
ls -lh "$OUTPUT_DIR"
echo ""
du -sh "$OUTPUT_DIR" space-invaders-bis-standalone.zip
