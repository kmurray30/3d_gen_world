"""Shared logic for image generation backends (local and API)."""

import csv
import time
from pathlib import Path

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


def word_to_filename(word: str) -> str:
    """Convert word to filesystem-safe filename: spaces -> underscores, remove apostrophes."""
    return word.replace(" ", "_").replace("'", "").lower()


def build_prompt(word: str, word_type: str) -> str:
    """Build prompt from template with word and type-based conditional."""
    conditional = CONDITIONAL_BY_TYPE.get(word_type, "")
    return PROMPT_TEMPLATE.format(word=word, conditional=conditional)


def format_duration(seconds: float) -> str:
    """Format seconds as Xd Xh Xm Xs, omitting zero-valued units."""
    total_secs = int(seconds)
    days = total_secs // 86400
    hours = (total_secs % 86400) // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60

    parts: list[str] = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")
    return " ".join(parts)


def load_words(csv_path: Path, num_words: int | None) -> list[tuple[str, str]]:
    """Load word,type pairs from CSV, optionally limited by num_words."""
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


def report_progress(completed: int, total: int, start_time: float) -> None:
    """Print progress line with elapsed time and ETA."""
    elapsed = time.time() - start_time
    rate = completed / elapsed if elapsed > 0 else 0
    eta_secs = (total - completed) / rate if rate > 0 else 0
    print(
        f"\rProgress: {completed}/{total} | "
        f"Elapsed: {format_duration(elapsed)} | "
        f"ETA: {format_duration(eta_secs)}   ",
        end="",
        flush=True,
    )


def write_failed_words(
    failed_words: list[tuple[str, str, str]], path: Path
) -> None:
    """Write failed words to CSV with word, type, error_message."""
    with open(path, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["word", "type", "error_message"])
        writer.writerows(failed_words)
