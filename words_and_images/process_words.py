#!/usr/bin/env python3
"""
Process words from words_filtered.csv via Grok to produce words_processed.json.
Each word gets: word, file, type, height_cm, tags (matches WordEntry in core.word_entry).
Batches of 10 words per Grok call, 10 concurrent calls.

Example:
    python words_and_images/process_words.py
    python words_and_images/process_words.py --count 50

Output defaults to words_and_images/words_processed.json. Use --output to override.

Requires XAI_API_KEY in .env.
"""

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm

from core.shared import load_words, word_to_filename

BATCH_SIZE = 10
MAX_CONCURRENT = 10
GROK_MODEL = "grok-4-1-fast-non-reasoning"

SYSTEM_PROMPT = """You return JSON only. No markdown, no explanation."""

USER_PROMPT_TEMPLATE = """For each word below, return a JSON array with one object per word, in the same order.
Each object must have:
- word: the exact word string from the input
- height_cm: approximate real-world height in centimeters (e.g. ruler ~30, human ~170, building ~1000)
- tags: MINIMAL list of 0-5 common synonyms or alternate phrasings people might type (e.g. ruler for king, ice tea for iced tea, flying car for hovercraft). Only exact-match alternatives.

Words: {words_json}

Return ONLY a valid JSON array, no other text."""


def _chunk(batch_size: int, items: list) -> list[list]:
    """Split items into chunks of batch_size."""
    chunks: list[list] = []
    for index in range(0, len(items), batch_size):
        chunks.append(items[index : index + batch_size])
    return chunks


def _call_grok(client: OpenAI, batch: list[tuple[str, str]]) -> list[dict]:
    """Call Grok for one batch of (word, type) pairs. Returns list of dicts with word, height_cm, tags."""
    words_payload = [{"word": word, "type": word_type} for word, word_type in batch]
    user_message = USER_PROMPT_TEMPLATE.format(words_json=json.dumps(words_payload))

    completion = client.chat.completions.create(
        model=GROK_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
        max_tokens=2048,
    )
    raw_response = completion.choices[0].message.content or ""

    # Strip markdown code blocks if present
    cleaned = raw_response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise ValueError("Expected JSON array")
    return parsed


def _process_batch(
    client: OpenAI,
    batch: list[tuple[str, str]],
    batch_index: int,
) -> tuple[int, list[dict]]:
    """Process one batch. Returns (batch_index, results) for ordering."""
    max_retries = 2
    last_error: Exception | None = None
    for attempt in range(max_retries):
        try:
            grok_results = _call_grok(client, batch)
            # Build full output entries: word, file, type, height (cm), tags
            results: list[dict] = []
            for index, (word, word_type) in enumerate(batch):
                entry: dict = {
                    "word": word.lower(),
                    "file": f"{word_to_filename(word)}.png",
                    "type": word_type,
                    "height (cm)": None,
                    "tags": [],
                }
                if index < len(grok_results) and isinstance(grok_results[index], dict):
                    grok_entry = grok_results[index]
                    entry["height (cm)"] = grok_entry.get("height_cm")
                    tags = grok_entry.get("tags")
                    if isinstance(tags, list):
                        entry["tags"] = [str(t).lower() for t in tags]
                results.append(entry)
            return (batch_index, results)
        except Exception as error:
            last_error = error
            if attempt < max_retries - 1:
                continue
    # Fallback: return entries with error
    results = [
        {
            "word": word.lower(),
            "file": f"{word_to_filename(word)}.png",
            "type": word_type,
            "height_cm": None,
            "tags": [],
            "error": str(last_error) if last_error else "Unknown error",
        }
        for word, word_type in batch
    ]
    return (batch_index, results)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Process words via Grok to produce words_processed.json"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="Limit to N words (default: all)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output JSON path (default: words_and_images/words_processed.json)",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    load_dotenv(script_dir.parent / ".env")

    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        print("XAI_API_KEY not found in environment. Set it in .env or export it.")
        sys.exit(1)

    csv_path = script_dir / "words_filtered.csv"
    output_path = args.output or (script_dir / "words_processed.json")

    words = load_words(csv_path, args.count)
    if not words:
        print("No words to process.")
        sys.exit(0)

    batches = _chunk(BATCH_SIZE, words)
    client = OpenAI(api_key=api_key, base_url="https://api.x.ai/v1")

    # Submit all batches, collect by index to preserve order
    batch_results: dict[int, list[dict]] = {}
    total_words = len(words)

    with ThreadPoolExecutor(max_workers=MAX_CONCURRENT) as executor:
        futures = {
            executor.submit(_process_batch, client, batch, index): index
            for index, batch in enumerate(batches)
        }
        with tqdm(
            total=total_words,
            unit="word",
            desc="Processing",
            bar_format="{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]",
        ) as progress_bar:
            for future in as_completed(futures):
                batch_index, results = future.result()
                batch_results[batch_index] = results
                progress_bar.update(len(results))

    # Merge in order
    merged: list[dict] = []
    for index in range(len(batches)):
        merged.extend(batch_results[index])

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(merged, file, indent=2, ensure_ascii=False)

    print(f"\nWrote {len(merged)} entries to {output_path}")


if __name__ == "__main__":
    main()
