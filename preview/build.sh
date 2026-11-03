#!/bin/sh
# Builds app.js from src/ (in order) and escapes non-ASCII so the WebView reads it the same everywhere.
cd "$(dirname "$0")"
cat src/a1_core.js src/a2_home.js src/a3_food.js src/a4_train.js src/a5_progress.js src/a6_full.js src/a7_actions.js src/a8_native.js src/a8b_food2.js src/a9_end.js > app.js
python3 -I -c "p='app.js';s=open(p,encoding='utf-8').read();s=''.join(c if ord(c)<128 else '\\\\u%04x'%ord(c) for c in s);open(p,'w').write(s)"
node --check app.js && node test_logic.js | tail -1
