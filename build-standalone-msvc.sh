#!/bin/bash
# Crée un exécutable standalone Windows SANS AUCUNE DLL externe
# Utilise cargo-xwin + LLVM pour compiler avec le target MSVC
set -e
cd "$(dirname "$0")"

echo "=== Build de l'exécutable standalone (MSVC, sans DLL) ==="

# Utiliser les outils de build du projet planet-invaders
PLANET_INVADERS="/home/blockapicoder/qwen-generation/planet-invaders"

if [[ -d "$PLANET_INVADERS/.build-tools/rustup" ]]; then
  export RUSTUP_HOME="$PLANET_INVADERS/.build-tools/rustup"
  export CARGO_HOME="$PLANET_INVADERS/.build-tools/cargo"
  export PATH="$CARGO_HOME/bin:$PATH"
fi

if [[ -d "$PLANET_INVADERS/.build-tools/llvm/usr/lib/llvm-18/bin" ]]; then
  export PATH="$PLANET_INVADERS/.build-tools/llvm/usr/lib/llvm-18/bin:$PATH"
  llvm_multiarch="$(cc -dumpmachine)"
  export LD_LIBRARY_PATH="$PLANET_INVADERS/.build-tools/llvm/usr/lib/$llvm_multiarch${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

# Vérifier que cargo-xwin est disponible
if ! command -v cargo-xwin &> /dev/null; then
  echo "⚠ cargo-xwin introuvable"
  echo "  Installation requise : cargo install cargo-xwin"
  exit 1
fi

# 1. Compiler avec cargo-xwin (target MSVC)
echo "1/2: Compilation du binaire Tauri (MSVC via cargo-xwin)..."
cd src-tauri

export CARGO_TARGET_DIR="$(pwd)/target"
XWIN_CACHE_DIR="${XWIN_CACHE_DIR:-$CARGO_TARGET_DIR/xwin}"

cargo xwin build --release --target x86_64-pc-windows-msvc

cd ..

# 2. Créer le dossier de sortie
OUTPUT_DIR="dist-standalone-msvc"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 3. Copier l'exécutable
echo "2/2: Création du package..."
cp src-tauri/target/x86_64-pc-windows-msvc/release/app.exe "$OUTPUT_DIR/SpaceInvadersBis.exe"

# 4. Créer un README
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
Space Invaders Bis - Exécutable Standalone Windows
===================================================

Ce fichier EXE est 100% autonome :
- Aucune DLL externe requise
- Toutes les dépendances sont intégrées
- Prêt à être copié et exécuté sur n'importe quel PC Windows

Pour lancer le jeu :
  Double-cliquez sur SpaceInvadersBis.exe

Prérequis système :
- Windows 10 ou 11 (64 bits)
- Microsoft Edge WebView2 Runtime (installé par défaut)

Les scores sont sauvegardés dans :
  %APPDATA%/space-invaders-bis/scores.json
EOF

# 5. Créer une archive ZIP
echo "Création de l'archive ZIP..."
cd "$OUTPUT_DIR"
zip "../space-invaders-bis-standalone-msvc.zip" SpaceInvadersBis.exe README.txt
cd ..

echo ""
echo "=== Build terminé ==="
echo "Exécutable : $(pwd)/$OUTPUT_DIR/SpaceInvadersBis.exe"
echo "Archive    : $(pwd)/space-invaders-bis-standalone-msvc.zip"
echo ""
ls -lh "$OUTPUT_DIR"
echo ""
du -sh "$OUTPUT_DIR/SpaceInvadersBis.exe" space-invaders-bis-standalone-msvc.zip
