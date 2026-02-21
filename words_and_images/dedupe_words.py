#!/usr/bin/env python3
"""
Deduplicates words_filtered.csv by word.
Keeps first occurrence. Logs a warning if the same word appears with different types.
"""

import csv
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
INPUT_PATH = SCRIPT_DIR / "words_filtered.csv"
OUTPUT_PATH = SCRIPT_DIR / "words_filtered.csv"


def main() -> None:
    seen_words: dict[str, str] = {}  # word -> type (first occurrence)
    rows_to_keep: list[tuple[str, str]] = []
    warnings: list[str] = []
    original_row_count = 0

    with open(INPUT_PATH, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        if reader.fieldnames != ["word", "type"]:
            print(f"Unexpected columns: {reader.fieldnames}", file=sys.stderr)
            sys.exit(1)

        for row in reader:
            original_row_count += 1
            word = row["word"].strip()
            word_type = row["type"].strip()

            if word in seen_words:
                print(f"Deduped: '{word}' (type: {word_type})", file=sys.stderr)
                if seen_words[word] != word_type:
                    warnings.append(
                        f"Word '{word}' appears with different types: "
                        f"'{seen_words[word]}' (kept) vs '{word_type}' (dropped)"
                    )
                continue

            seen_words[word] = word_type
            rows_to_keep.append((word, word_type))

    for warning in warnings:
        print(f"WARNING: {warning}", file=sys.stderr)

    with open(OUTPUT_PATH, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["word", "type"])
        writer.writerows(rows_to_keep)

    removed_count = original_row_count - len(rows_to_keep)
    print(f"Kept {len(rows_to_keep)} unique words. Removed {removed_count} duplicates.")
    if warnings:
        print(f"Logged {len(warnings)} warning(s) for type conflicts.", file=sys.stderr)


if __name__ == "__main__":
    main()
