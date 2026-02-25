"""Build tag_map and word_map from words_processed.json."""

import json
from dataclasses import asdict
from pathlib import Path

from core.word_entry import WordEntry, WordMatches

script_dir = Path(__file__).resolve().parent
input_json_path = script_dir / "words_processed.json"
tag_map_path = script_dir / "tag_map.json"
word_map_path = script_dir / "word_map.json"

with open(input_json_path, encoding="utf-8") as file:
    input_json = json.load(file)

tag_map: dict[str, WordMatches] = {}
word_map: dict[str, WordEntry] = {}

for word in input_json:
    word_entry = WordEntry(**word)

    # Process tags: each tag maps to list of words that have it
    for tag in word_entry.tags:
        if tag not in tag_map:
            tag_map[tag] = WordMatches(is_primary=False, words=[])
        tag_map[tag].words.append(word_entry.word)

    # Primary word entry: canonical lookup by word itself
    if word_entry.word not in tag_map:
        tag_map[word_entry.word] = WordMatches(is_primary=True, words=[])
    else:
        tag_map[word_entry.word].is_primary = True

    word_map[word_entry.word] = word_entry

# Serialize dataclasses to dicts for JSON
tag_map_serializable = {key: asdict(value) for key, value in tag_map.items()}
word_map_serializable = {key: asdict(value) for key, value in word_map.items()}

with open(tag_map_path, "w", encoding="utf-8") as file:
    json.dump(tag_map_serializable, file, indent=2)

with open(word_map_path, "w", encoding="utf-8") as file:
    json.dump(word_map_serializable, file, indent=2)
