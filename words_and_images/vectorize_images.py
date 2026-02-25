#!/usr/bin/env python3
"""
Batch-remove white backgrounds from images in a directory.
Reads images from generated_images/<dir_name> (or any dir), writes to
processed_images/<dir_name>/ with transparency. Uses Pillow flood fill + boundary
expansion—no AI. Each image is cropped to the content bounding box (tightest
rectangle around non-transparent pixels, touching the object's black border).

Usage:
    python words_and_images/vectorize_images.py <input_dir> [-o OUTPUT] [-t TOLERANCE] [-a AGGRESSIVE] [-n COUNT]

Arguments:
    input_dir    Directory of images (e.g. generated_images/local_klein_base)
    -o, --output    Output directory (default: processed_images/<input_dir_name>)
    -t, --tolerance    Flood fill tolerance, higher=more off-white (default: 40)
    -a, --aggressive   Halo removal strength, higher=more aggressive (default: 10)
    -n, --count       Max number of images to process (default: all)

Examples:
    python words_and_images/vectorize_images.py generated_images/local_klein_base
    python words_and_images/vectorize_images.py generated_images/api -n 5
    python words_and_images/vectorize_images.py generated_images/local_klein -t 50 -a 12
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

# Supported image extensions for batch processing
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def remove_white_background(
    image: Image.Image,
    tolerance: int = 40,
    aggressive: int = 6,
) -> Image.Image:
    """
    Replace white background with transparency. Two passes:
    1. Flood fill from corners - catches connected background (stops at black border).
    2. Boundary expansion - only remove near-white pixels adjacent to transparent.
       Expands into the halo at the edge, going further into the black outline.
       Does NOT touch enclosed white (e.g. armpits).

    Args:
        image: Input PIL Image (will be converted to RGBA).
        tolerance: Flood fill color similarity (0=exact, ~40 catches near-white).
        aggressive: Higher=more halo removal (more iterations, lower cutoff). Default 6.
    """
    # Single knob: scales iterations and cutoff together
    expand_iterations = 4 + aggressive * 2
    expand_cutoff = max(100, 240 - aggressive * 12)
    image = image.convert("RGBA")
    width, height = image.size

    transparent = (0, 0, 0, 0)

    # Pass 1: Flood fill from corners - catches main background
    corner_seeds = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ]
    for seed in corner_seeds:
        ImageDraw.floodfill(image, seed, transparent, thresh=tolerance)

    # Pass 2: Boundary expansion - only remove near-white adjacent to transparent
    # (removes halo, goes further into black outline; does not touch enclosed white)
    pixels = image.load()
    for _ in range(expand_iterations):
        to_clear = []
        for y in range(height):
            for x in range(width):
                if pixels[x, y][3] == 0:
                    continue  # already transparent
                red, green, blue, _ = pixels[x, y]
                if red < expand_cutoff or green < expand_cutoff or blue < expand_cutoff:
                    continue  # not light enough
                # Check if adjacent to transparent (8-connected for faster expansion)
                for dx, dy in (
                    (-1, 0), (1, 0), (0, -1), (0, 1),
                    (-1, -1), (-1, 1), (1, -1), (1, 1),
                ):
                    neighbor_x, neighbor_y = x + dx, y + dy
                    if 0 <= neighbor_x < width and 0 <= neighbor_y < height:
                        if pixels[neighbor_x, neighbor_y][3] == 0:
                            to_clear.append((x, y))
                            break
        for x, y in to_clear:
            pixels[x, y] = transparent

    return image


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Batch-remove white background from images in a directory."
    )
    parser.add_argument(
        "input_dir",
        type=Path,
        help="Input directory of images (e.g. generated_images/flux2_api)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output directory (default: processed_images/<input_dir_name>)",
    )
    parser.add_argument(
        "-t",
        "--tolerance",
        type=int,
        default=40,
        help="Flood fill tolerance, higher=more off-white (default: 40)",
    )
    parser.add_argument(
        "-a",
        "--aggressive",
        type=int,
        default=10,
        help="Halo removal strength, higher=more aggressive (default: 10)",
    )
    parser.add_argument(
        "-n",
        "--count",
        type=int,
        default=None,
        metavar="N",
        help="Max number of images to process (default: all)",
    )

    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    # Resolve input: relative paths are relative to script dir
    input_path = args.input_dir if args.input_dir.is_absolute() else script_dir / args.input_dir

    if not input_path.exists():
        parser.error(f"Input directory not found: {input_path}")

    if not input_path.is_dir():
        parser.error(f"Input must be a directory: {input_path}")

    if args.output is None:
        output_path = script_dir / "processed_images" / input_path.name
    else:
        output_path = args.output if args.output.is_absolute() else script_dir / args.output

    output_path.mkdir(parents=True, exist_ok=True)

    image_files = [
        path for path in input_path.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]

    if not image_files:
        print(f"No image files (.png, .jpg, .jpeg, .webp) found in {input_path}")
        return

    image_files = sorted(image_files)
    if args.count is not None:
        image_files = image_files[: args.count]

    for image_path in image_files:
        image = Image.open(image_path)
        result = remove_white_background(
            image,
            tolerance=args.tolerance,
            aggressive=args.aggressive,
        )
        bbox = result.getbbox()
        if bbox is not None:
            result = result.crop(bbox)
        out_file = output_path / image_path.name
        result.save(out_file)
        print(f"Saved {out_file}")

    print(f"Done. Processed {len(image_files)} images -> {output_path}")


if __name__ == "__main__":
    main()
