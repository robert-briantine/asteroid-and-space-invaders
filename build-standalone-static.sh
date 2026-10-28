#!/bin/bash
# Crée un exécutable standalone Windows SANS DLL externes
# Toutes les dépendances sont intégrées dans le binaire
set -e
cd "$(dirname "$0")"

echo "=== Build de l'exécutable standalone (static) ==="

# 1. Compiler le binaire Tauri pour Windows avec static linking
echo "1/2: Compilation du binaire Tauri (static)..."
source ~/.cargo/env
cd src-tauri

# Utiliser le profil release avec static linking
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER=x86_64-w64-mingw32-gcc \
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_AR=x86_64-w64-mingw32-ar \
RUSTFLAGS="-C target-feature=+crt-static" \
cargo build --target x86_64-pc-windows-gnu --release

cd ..

# 2. Créer le dossier de sortie
OUTPUT_DIR="dist-standalone-static"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 3. Copier l'exécutable
echo "2/2: Création du package..."
cp src-tauri/target/x86_64-pc-windows-gnu/release/app.exe "$OUTPUT_DIR/SpaceInvadersBis.exe"

# 4. Copier WebView2Loader.dll (indispensable pour Tauri, ne peut pas être statique)
echo "Copie de WebView2Loader.dll..."
if [ -f "dist-windows/WebView2Loader.dll" ]; then
  cp "dist-windows/WebView2Loader.dll" "$OUTPUT_DIR/"
  echo "  ✓ WebView2Loader.dll copiée depuis dist-windows/"
else
  echo "  ⚠ WebView2Loader.dll introuvable dans dist-windows/"
  echo "    Il faudra la télécharger manuellement depuis Microsoft"
fi

# 4. Vérifier que le binaire est vraiment standalone
echo "Vérification des dépendances..."
if command -v objdump &> /dev/null; then
  DEPS=$(objdump -p "$OUTPUT_DIR/SpaceInvadersBis.exe" | grep "DLL Name" | awk '{print $3}' || true)
  if [ -z "$DEPS" ]; then
    echo "  ✓ Aucune DLL externe détectée - binaire 100% standalone"
  else
    echo "  ⚠ DLLs détectées:"
    echo "$DEPS"
  fi
else
  echo "  ℹ objdump non disponible, vérification manuelle nécessaire"
fi

# 5. Créer un README
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
Space Invaders Bis - Exécutable Standalone Windows
===================================================

Contenu du dossier :
- SpaceInvadersBis.exe : L'application principale
- WebView2Loader.dll : Bibliothèque requise par Tauri (158 Ko)

Pour lancer le jeu :
  Double-cliquez sur SpaceInvadersBis.exe
  OU copiez les deux fichiers dans le même dossier et lancez l'EXE

Prérequis système :
- Windows 10 ou 11 (64 bits)
- Microsoft Edge WebView2 Runtime (installé par défaut sur Windows 10/11)

Les scores sont sauvegardés dans :
  %APPDATA%/space-invaders-bis/scores.json

Note : WebView2Loader.dll est la seule DLL externe requise.
Toutes les autres dépendances sont intégrées dans l'exécutable.
EOF

# 6. Créer une archive ZIP
echo "Création de l'archive ZIP..."
cd "$OUTPUT_DIR"
zip "../space-invaders-bis-standalone-static.zip" SpaceInvadersBis.exe README.txt
cd ..

echo ""
echo "=== Build terminé ==="
echo "Exécutable : $(pwd)/$OUTPUT_DIR/SpaceInvadersBis.exe"
echo "Archive    : $(pwd)/space-invaders-bis-standalone-static.zip"
echo ""
ls -lh "$OUTPUT_DIR"
echo ""
du -sh "$OUTPUT_DIR/SpaceInvadersBis.exe" space-invaders-bis-standalone-static.zip
