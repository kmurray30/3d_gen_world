#!/usr/bin/env bash
# Draws the 14 priority missing words (words_and_images/words_priority.csv) with your local image model,
# then converts them to WebP and rebuilds the manifest. Needs a GPU machine.  Run: ./make_gap_sprites.sh
set -euo pipefail
cd "$(dirname "$0")"

python3 -m pip install -r words_and_images/requirements.txt
cd words_and_images
python3 generate_images.py --config gap --words words_priority.csv
python3 vectorize_images.py generated_images/gap
python3 optimize_images.py processed_images/gap
cd ..
python3 words_and_images/build_manifest.py --no-images-ok

echo
echo "Done. Now publish them:"
echo "  git add assets && git commit -m 'Add gap sprites' && git push"
