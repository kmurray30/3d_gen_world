#!/usr/bin/env python3
"""
Generate cartoon-style images for each word in words_filtered.csv.
Supports local (Flux2Klein) or API (fal.ai) backends.

Usage:
    python words_and_images/generate_images.py              # default: local
    python words_and_images/generate_images.py --backend api

Requires FAL_KEY in .env for API backend.
Images saved to words_and_images/generated_images/. Failed words to failed_words.csv.
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
        "--backend",
        choices=["local", "api"],
        default="local",
        help="Backend to use: local (Flux2Klein) or api (fal.ai). Default: local",
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
    project_root = script_dir.parent
    config_path = script_dir / "configs" / f"{args.backend}.json"
    with open(config_path, encoding="utf-8") as file:
        config = json.load(file)

    csv_path = script_dir / "words_filtered.csv"
    output_dir = project_root / config["output_dir"]
    failed_path = script_dir / "failed_words.csv"

    words = load_words(csv_path, args.count)
    words = apply_resume(words, output_dir)
    total = len(words)

    if total == 0:
        print("No words to process (all already generated or empty input).")
        return

    if args.backend == "api":
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
