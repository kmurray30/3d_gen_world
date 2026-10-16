#!/usr/bin/env python3
"""
Convert the processed PNG sprites to WebP at two sizes for the web app.

    python3 words_and_images/optimize_images.py                 # processed_images/local_klein -> ../assets/sprites/{512,256}
    python3 words_and_images/optimize_images.py <input_dir> [-q 82] [-j 8] [--force]

Writes assets/sprites/512/<name>.webp, assets/sprites/256/<name>.webp and assets/sprites/dims.json
(name -> [w, h] of the 512 version). Already converted files are skipped unless --force. Prints the total size,
so you can see what will be committed. Only the WebP output is meant to go into git.
"""
import argparse
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    sys.exit(1)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "assets" / "sprites"
SIZES = (512, 256)
IMAGE_EXTENSIONS = {".png", ".webp", ".jpg", ".jpeg"}


def convert(args: tuple[str, int, bool]) -> tuple[str, tuple[int, int] | None, str | None]:
    src, quality, force = args
    path = Path(src)
    name = path.stem.lower()
    try:
        outs = {s: OUT / str(s) / f"{name}.webp" for s in SIZES}
        if not force and all(o.is_file() for o in outs.values()):
            with Image.open(outs[512]) as im:
                return name, im.size, None
        with Image.open(path) as im:
            im = im.convert("RGBA")
            bbox = im.getbbox()
            if bbox:
                im = im.crop(bbox)
            dims = None
            for size in SIZES:
                w, h = im.size
                scale = min(1.0, size / max(w, h))
                resized = im if scale >= 1.0 else im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
                outs[size].parent.mkdir(parents=True, exist_ok=True)
                resized.save(outs[size], "WEBP", quality=quality, method=6)
                if size == 512:
                    dims = resized.size
            return name, dims, None
    except Exception as exc:  # noqa: BLE001
        return name, None, str(exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="PNG sprites -> WebP 512/256 + dims.json")
    parser.add_argument("input_dir", nargs="?", default=str(HERE / "processed_images" / "local_klein"))
    parser.add_argument("-q", "--quality", type=int, default=82)
    parser.add_argument("-j", "--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    parser.add_argument("--force", action="store_true", help="reconvert even if the WebP files exist")
    args = parser.parse_args()

    src = Path(args.input_dir)
    if not src.is_absolute():
        src = (HERE / src).resolve() if (HERE / src).exists() else (ROOT / src).resolve()
    if not src.is_dir():
        parser.error(f"input directory not found: {src}")
    files = sorted(p for p in src.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS)
    if not files:
        parser.error(f"no images in {src}")

    dims_path = OUT / "dims.json"
    dims: dict[str, list[int]] = {}
    if dims_path.is_file():
        with open(dims_path, encoding="utf-8") as fh:
            dims = json.load(fh)

    total = len(files)
    done = 0
    failed: list[tuple[str, str]] = []
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        futures = [pool.submit(convert, (str(p), args.quality, args.force)) for p in files]
        for fut in as_completed(futures):
            name, size, err = fut.result()
            done += 1
            if err:
                failed.append((name, err))
            elif size:
                dims[f"{name}.webp"] = [size[0], size[1]]
            if done % 50 == 0 or done == total:
                print(f"\r{done}/{total}", end="", flush=True)
    print()
    OUT.mkdir(parents=True, exist_ok=True)
    with open(dims_path, "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(dims.items())), fh, separators=(",", ":"))

    def dir_size(p: Path) -> int:
        return sum(f.stat().st_size for f in p.glob("*.webp")) if p.is_dir() else 0

    mb = lambda n: f"{n / 1024 / 1024:.1f} MB"  # noqa: E731
    print(f"512px: {mb(dir_size(OUT / '512'))}   256px: {mb(dir_size(OUT / '256'))}   dims: {len(dims)} entries -> {dims_path}")
    if failed:
        print(f"{len(failed)} failed, e.g. {failed[:3]}", file=sys.stderr)
    print("Next: python3 words_and_images/build_manifest.py && git add assets && git commit -m 'Add sprites'")


if __name__ == "__main__":
    main()
