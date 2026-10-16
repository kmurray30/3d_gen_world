# Asset pipeline

1. `words_filtered.csv`: the vocabulary (word, type).
2. `process_words.py`: asks Grok for heights and synonyms -> `words_processed.json`.
3. `map_words.py`: builds `word_map.json` (primary words) and `tag_map.json` (synonyms).
4. `generate_images.py --config local_klein`: draws one PNG per word -> `generated_images/<config>/`.
5. `vectorize_images.py generated_images/local_klein`: removes the white background and crops ->
   `processed_images/local_klein/`.
6. `optimize_images.py`: PNG -> WebP at 512px and 256px -> `../assets/sprites/{512,256}/` plus `dims.json`.
   This is the only image output that is committed.
7. `build_manifest.py`: joins everything into `../assets/manifest.json`.

`overrides.json` fixes synonym traps by hand (alias -> primary word). `words_gap.csv` lists common
words that still need sprites; run steps 4-7 on it.

Install deps with `pip install -r requirements.txt` (Pillow is enough for steps 6-7).
