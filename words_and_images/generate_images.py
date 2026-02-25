#!/usr/bin/env python3
"""
Generate cartoon-style images for each word in words_filtered.csv.
Supports local (Flux2Klein) or API (fal.ai) backends via config files.

Usage:
    python words_and_images/generate_images.py --config local_klein
    python words_and_images/generate_images.py --config api

Requires FAL_KEY in .env for API configs.
Images saved to words_and_images/generated_images/<config_name>/. Failed words to failed_words.csv.
Re-run to resume; already-generated images are skipped.
"""

import argparse
import json
from pathlib import Path

from dotenv import load_dotenv

from core.shared import apply_resume, load_words, write_failed_words


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate images for words in CSV.")
    parser.add_argument(
        "--config",
        default="local_klein",
        help="Config name (e.g. local_klein, local_klein_base, api). Loads from configs/<name>.json. Default: local_klein",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="Limit to N words (default: all)",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    config_path = script_dir / "configs" / f"{args.config}.json"
    with open(config_path, encoding="utf-8") as file:
        config = json.load(file)

    csv_path = script_dir / "words_filtered.csv"
    # Output folder is derived from config name, not from config file
    output_dir = script_dir / "generated_images" / args.config
    failed_path = script_dir / "failed_words.csv"

    words = load_words(csv_path, args.count)
    words = apply_resume(words, output_dir)
    total = len(words)

    if total == 0:
        print("No words to process (all already generated or empty input).")
        return

    # API configs have concurrency_limit; local configs use device/mps
    use_api = "concurrency_limit" in config
    if use_api:
        load_dotenv(script_dir.parent / ".env")
        from core.api import run_api
        print(f"Processing {total} words with concurrency_limit={config.get('concurrency_limit', 2)}...")
        failed_words, completed_normally = run_api(words, output_dir, config)
    else:
        from core.local import run_local
        print(f"Processing {total} words (local, sequential)...")
        failed_words, completed_normally = run_local(words, output_dir, config)

    print()  # Newline after progress

    if not completed_normally:
        print("Run aborted: >50% of last 10 attempts failed (excluding rate limits).")

    if failed_words:
        write_failed_words(failed_words, failed_path)
        print(f"Saved {len(failed_words)} failed words to {failed_path}")

    print("Done.")


if __name__ == "__main__":
    main()
