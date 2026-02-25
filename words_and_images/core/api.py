"""API image generation backend using fal.ai. Supports concurrency and rate limit retry."""

import asyncio
import time
from collections import deque
from pathlib import Path

import aiohttp
import fal_client

from .shared import build_prompt, report_progress, word_to_filename


def is_rate_limit_error(exc: Exception) -> bool:
    """Check if exception is a 429 rate limit (don't count toward abort)."""
    if hasattr(exc, "status_code") and exc.status_code == 429:
        return True
    msg = str(exc).lower()
    return "429" in msg or "rate limit" in msg or "too many requests" in msg


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
    config: dict,
) -> tuple[bool, bool, str | None]:
    """
    Generate image for one word. Returns (success, is_rate_limit, error_message).
    """
    model = config["model"]
    image_width = config["image_width"]
    image_height = config["image_height"]
    max_retries = config.get("max_retries", 6)

    async with semaphore:
        prompt = build_prompt(word, word_type)
        filename = word_to_filename(word)
        filepath = output_dir / f"{filename}.png"

        last_exc: Exception | None = None
        for attempt in range(max_retries):
            try:
                result = await fal_client.run_async(
                    model,
                    arguments={
                        "prompt": prompt,
                        "output_format": "png",
                        "image_size": {"width": image_width, "height": image_height},
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
                if is_rate_limit_error(exc) and attempt < max_retries - 1:
                    delay = min(2**attempt, 60)
                    await asyncio.sleep(delay)
                else:
                    break

        return False, is_rate_limit_error(last_exc or Exception()), str(last_exc)


async def _run(
    words: list[tuple[str, str]],
    output_dir: Path,
    config: dict,
    failed_words: list[tuple[str, str, str]],
    recent_results: deque[tuple[bool, bool]],
    completed: list[int],
    total: int,
    start_time: list[float],
) -> bool:
    """
    Process all words. Returns False if aborted, True if completed normally.
    """
    concurrency_limit = config.get("concurrency_limit", 2)
    abort_threshold = config.get("abort_failure_threshold", 6)
    semaphore = asyncio.Semaphore(concurrency_limit)

    async with aiohttp.ClientSession() as session:
        batch: list[tuple[str, str]] = []
        for index, (word, word_type) in enumerate(words):
            batch.append((word, word_type))

            if len(batch) < concurrency_limit and index < len(words) - 1:
                continue

            tasks = [
                generate_one(word, word_type, semaphore, session, output_dir, config)
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
                    if non_rate_limit_failures >= abort_threshold:
                        return False

                completed[0] += 1
                report_progress(completed[0], total, start_time[0])

            batch = []

    return True


def run_api(
    words: list[tuple[str, str]],
    output_dir: Path,
    config: dict,
) -> tuple[list[tuple[str, str, str]], bool]:
    """
    Process words via fal.ai API with concurrency. Returns (failed_words, completed_normally).
    """
    failed_words: list[tuple[str, str, str]] = []
    recent_results: deque[tuple[bool, bool]] = deque(maxlen=10)
    completed: list[int] = [0]
    start_time: list[float] = [time.time()]
    total = len(words)

    completed_normally = asyncio.run(
        _run(
            words, output_dir, config,
            failed_words, recent_results, completed, total, start_time,
        )
    )
    return failed_words, completed_normally
