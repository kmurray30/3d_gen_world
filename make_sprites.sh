#!/usr/bin/env bash
# Converts your finished sprites (words_and_images/processed_images/local_klein/*.png) into the web
# app's WebP set and rebuilds the manifest. Run from anywhere:  ./make_sprites.sh
set -euo pipefail
cd "$(dirname "$0")"

python3 -m pip install Pillow
python3 words_and_images/optimize_images.py
python3 words_and_images/build_manifest.py --no-images-ok

echo
echo "Done. Now publish them:"
echo "  git add assets && git commit -m 'Add sprites' && git push"
