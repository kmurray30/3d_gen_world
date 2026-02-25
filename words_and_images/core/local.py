"""Local image generation backend using Flux2Klein. Sequential, no concurrency."""

import time
from datetime import datetime
from pathlib import Path

import torch
from diffusers import Flux2KleinPipeline

from .shared import build_prompt, report_progress, word_to_filename


def run_local(
    words: list[tuple[str, str]],
    output_dir: Path,
    config: dict,
) -> tuple[list[tuple[str, str, str]], bool]:
    """
    Process words sequentially. Returns (failed_words, completed_normally).
    Local always completes normally (no abort logic).
    """
    device = config.get("device", "mps")
    dtype_str = config.get("dtype", "bfloat16")
    dtype = torch.bfloat16 if dtype_str == "bfloat16" else torch.float32

    pipe = Flux2KleinPipeline.from_pretrained(
        config["model"], torch_dtype=dtype
    )
    pipe.to(device)

    failed_words: list[tuple[str, str, str]] = []
    total = len(words)
    start_time = time.time()

    output_dir.mkdir(parents=True, exist_ok=True)

    for index, (word, word_type) in enumerate(words):
        prompt = build_prompt(word, word_type)
        filename = word_to_filename(word)
        filepath = output_dir / f"{filename}.png"

        print(f"[local] Processing {index + 1}/{total}: {word!r}", flush=True)
        try:
            seed = (
                config.get("seed")
                if config.get("seed") is not None
                else int(datetime.now().timestamp())
            )
            image = pipe(
                prompt=prompt,
                height=config["height"],
                width=config["width"],
                guidance_scale=config["guidance_scale"],
                num_inference_steps=config["num_inference_steps"],
                generator=torch.Generator(device=device).manual_seed(seed),
            ).images[0]
            filepath.parent.mkdir(parents=True, exist_ok=True)
            image.save(filepath)
            print(f"[local]   -> Saved {filepath}", flush=True)
        except Exception as exc:
            failed_words.append((word, word_type, str(exc)))
            print(f"[local]   -> FAILED: {exc}", flush=True)

        report_progress(index + 1, total, start_time)

    return failed_words, True
