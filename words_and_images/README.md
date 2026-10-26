# Asset pipeline

The game ships WebP sprites under `assets/sprites/{512,256}/` plus `assets/manifest.json`. Everything in
this folder exists to produce those two things.

## One-time: convert the existing sprites


```
pip install -r words_and_images/requirements.txt        # Pillow is enough for steps 2-3
python3 words_and_images/optimize_images.py             # processed_images/local_klein -> assets/sprites/{512,256} + dims.json
python3 words_and_images/build_manifest.py              # -> assets/manifest.json (fails if sprites are missing; add --no-images-ok to allow)
git add assets && git commit -m "Add sprites" && git push
```

Expect roughly 50 KB per 512px sprite and a third of that at 256px. The 1.4 GB of PNGs never enters git.

## Gap words

`words_priority.csv` is the 14 most useful of these; `python3 words_and_images/make_gap_sprites.py` draws them (and runs the steps below for you). `words_gap.csv` lists common words the Scribblenauts list lacks (ball, plant, star, river, child, queen...).
They are already part of the vocabulary (the manifest merges the CSV) and show as cards until drawn:

```
python3 words_and_images/generate_images.py --config local_klein --words words_gap.csv
python3 words_and_images/vectorize_images.py generated_images/local_klein
python3 words_and_images/optimize_images.py
python3 words_and_images/build_manifest.py
git add assets && git commit -m "Add gap sprites" && git push
```

`overrides.json` maps tricky synonyms to the right entry by hand (plant -> potted plant until the real
plant sprite exists, kid -> boy, bow -> bow (weapon)). Edit it whenever a word resolves to the wrong picture.

## Rigs (paper puppets)

`rig/` cuts drawings into pieces the game animates (arms, heads, tails, wheels, faces). A starter set of 20 is
hand-labelled; `rig/auto_rig.py` labels the rest with a vision model running on your own machine. See
[rig/README.md](rig/README.md).

## The original pipeline (for reference)

1. `words_filtered.csv`: the vocabulary (word, type).
2. `process_words.py`: asks Grok for heights and synonyms -> `words_processed.json`.
3. `map_words.py`: builds `word_map.json` (primary words) and `tag_map.json` (synonyms).
4. `generate_images.py --config local_klein`: one PNG per word -> `generated_images/<config>/`.
5. `vectorize_images.py generated_images/local_klein`: removes the white background and crops ->
   `processed_images/local_klein/`.
