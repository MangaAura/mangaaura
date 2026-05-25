#!/bin/bash
# Extract ESLint errors with their file paths
cd "C:/Users/migue/OneDrive/Documentos/codigo/Manga Web IA/MangaAura"
npx eslint src/ --max-warnings 500 2>&1 | awk '
/^C:.*(src\\|src\/)/ { file=$0; next }
/ error / { print file " | " $0 }
' | head -100
