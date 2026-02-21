#!/usr/bin/env python3
"""
Generate cartoon-style images for each word in words_filtered.csv using fal.ai API.
Supports resume, concurrent batching, progress with ETA, error handling, and rate limit retry.

Usage:
    Run from the project root. Requires FAL_KEY in .env.

    Example:
        cd /path/to/3d_gen_world
        python words/generate_images.py

    Images are saved to words/generated_images/. Failed words go to words/failed_words.csv.
    Re-run to resume; already-generated images are skipped.
"""

import asyncio
import csv
import time
from collections import deque
from pathlib import Path

import aiohttp
import fal_client
from dotenv import load_dotenv

# --- Configuration ---
NUM_WORDS = None  # None = process all
CONCURRENCY_LIMIT = 2  # Max concurrent API calls at once, as per https://docs.fal.ai/model-apis/faq#is-there-a-rate-limit
MODEL = "fal-ai/flux-2"

IMAGE_WIDTH = 512
IMAGE_HEIGHT = 512

PROMPT_TEMPLATE = (
    "simple, single cartoon {word}{conditional}. flat colors, thick outline, "
    "minimal shading, low-detail, centered, white background. entire object "
    "in-frame. no bottom shadow. No words. Nothing else in frame. crayon art style"
)

CONDITIONAL_BY_TYPE = {
    "human": " (full body)",
    "humanoid": " (full body)",
    "animal": " (full body)",
}

OUTPUT_DIR = "words/generated_images"
FAILED_WORDS_FILE = "words/failed_words.csv"
CSV_PATH = "words/words_filtered.csv"

MAX_RETRIES = 6  # For rate limit exponential backoff
ABORT_FAILURE_THRESHOLD = 6  # Abort if this many non-rate-limit failures in last 10


def word_to_filename(word: str) -> str:
    """Convert word to filesystem-safe filename: spaces -> underscores, remove apostrophes."""
    return word.replace(" ", "_").replace("'", "").lower()


def build_prompt(word: str, word_type: str) -> str:
    """Build prompt from template with word and type-based conditional."""
    conditional = CONDITIONAL_BY_TYPE.get(word_type, "")
    return PROMPT_TEMPLATE.format(word=word, conditional=conditional)


def is_rate_limit_error(exc: Exception) -> bool:
    """Check if exception is a 429 rate limit (don't count toward abort)."""
    if hasattr(exc, "status_code") and exc.status_code == 429:
        return True
    msg = str(exc).lower()
    return "429" in msg or "rate limit" in msg or "too many requests" in msg


def format_duration(seconds: float) -> str:
    """Format seconds as Xm Ys."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    if minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


def load_words(project_root: Path, num_words: int | None) -> list[tuple[str, str]]:
    """Load word,type pairs from CSV, optionally limited by num_words."""
    csv_path = project_root / CSV_PATH
    words: list[tuple[str, str]] = []
    with open(csv_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            word = (row.get("word") or "").strip()
            word_type = (row.get("type") or "").strip()
            if not word or not word_type:
                continue
            words.append((word, word_type))
            if num_words is not None and len(words) >= num_words:
                break
    return words


def apply_resume(
    words: list[tuple[str, str]], output_dir: Path
) -> list[tuple[str, str]]:
    """Filter out words that already have an output file."""
    return [
        (word, word_type)
        for word, word_type in words
        if not (output_dir / f"{word_to_filename(word)}.png").exists()
    ]


async def download_and_save(
    session: aiohttp.ClientSession, url: str, filepath: Path
) -> None:
    """Download image from URL and save to filepath."""
    async with session.get(url) as response:
        response.raise_for_status()
        data = await response.read()
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "wb") as file:
        file.write(data)


async def generate_one(
    word: str,
    word_type: str,
    semaphore: asyncio.Semaphore,
    session: aiohttp.ClientSession,
    output_dir: Path,
) -> tuple[bool, bool, str | None]:
    """
    Generate image for one word. Returns (success, is_rate_limit, error_message).
    """
    async with semaphore:
        prompt = build_prompt(word, word_type)
        filename = word_to_filename(word)
        filepath = output_dir / f"{filename}.png"

        last_exc: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                result = await fal_client.run_async(
                    MODEL,
                    arguments={
                        "prompt": prompt,
                        "output_format": "png",
                        "image_size": {"width": IMAGE_WIDTH, "height": IMAGE_HEIGHT},
                    },
                )
                images = result.get("images") or []
                if not images:
                    return False, False, "No images in result"
                url = images[0].get("url")
                if not url:
                    return False, False, "No URL in result"
                await download_and_save(session, url, filepath)
                return True, False, None
            except Exception as exc:
                last_exc = exc
                if is_rate_limit_error(exc) and attempt < MAX_RETRIES - 1:
                    delay = min(2**attempt, 60)
                    await asyncio.sleep(delay)
                else:
                    break

        return False, is_rate_limit_error(last_exc or Exception()), str(last_exc)


async def run(
    words: list[tuple[str, str]],
    output_dir: Path,
    failed_words: list[tuple[str, str, str]],
    recent_results: deque[tuple[bool, bool]],
    completed: list[int],
    total: int,
    start_time: list[float],
) -> bool:
    """
    Process all words. Returns False if aborted, True if completed normally.
    """
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

    async with aiohttp.ClientSession() as session:
        batch: list[tuple[str, str]] = []
        for index, (word, word_type) in enumerate(words):
            batch.append((word, word_type))

            if len(batch) < CONCURRENCY_LIMIT and index < len(words) - 1:
                continue

            tasks = [
                generate_one(word, word_type, semaphore, session, output_dir)
                for word, word_type in batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for (word, word_type), result in zip(batch, results):
                if isinstance(result, Exception):
                    success, is_rate_limit = False, is_rate_limit_error(result)
                    error_msg = str(result)
                else:
                    success, is_rate_limit, error_msg = result
                    error_msg = error_msg or ""

                recent_results.append((success, is_rate_limit))

                if not success:
                    failed_words.append((word, word_type, error_msg))
                    non_rate_limit_failures = sum(
                        1 for s, rl in recent_results if not s and not rl
                    )
                    if non_rate_limit_failures >= ABORT_FAILURE_THRESHOLD:
                        return False

                completed[0] += 1

                if completed[0] % CONCURRENCY_LIMIT == 0:
                    elapsed = time.time() - start_time[0]
                    rate = completed[0] / elapsed if elapsed > 0 else 0
                    eta_secs = (total - completed[0]) / rate if rate > 0 else 0
                    print(
                        f"\rProgress: {completed[0]}/{total} | "
                        f"Elapsed: {format_duration(elapsed)} | "
                        f"ETA: {format_duration(eta_secs)}   ",
                        end="",
                        flush=True,
                    )

            batch = []

    return True


def main() -> None:
    """Load config, run generation, write failed words if any."""
    project_root = Path(__file__).resolve().parent.parent
    load_dotenv(project_root / ".env")

    output_dir = project_root / OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    words = load_words(project_root, NUM_WORDS)
    words = apply_resume(words, output_dir)
    total = len(words)

    if total == 0:
        print("No words to process (all already generated or empty input).")
        return

    print(f"Processing {total} words with concurrency_limit={CONCURRENCY_LIMIT}...")

    failed_words: list[tuple[str, str, str]] = []
    recent_results: deque[tuple[bool, bool]] = deque(maxlen=10)
    completed: list[int] = [0]
    start_time: list[float] = [time.time()]

    completed_normally = asyncio.run(
        run(words, output_dir, failed_words, recent_results, completed, total, start_time)
    )

    print()  # Newline after progress

    if not completed_normally:
        print("Run aborted: >50% of last 10 attempts failed (excluding rate limits).")

    if failed_words:
        failed_path = project_root / FAILED_WORDS_FILE
        with open(failed_path, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(["word", "type", "error_message"])
            writer.writerows(failed_words)
        print(f"Saved {len(failed_words)} failed words to {failed_path}")

    print("Done.")


if __name__ == "__main__":
    main()
