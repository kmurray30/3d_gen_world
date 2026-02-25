#!/usr/bin/env python3
"""
Remove white backgrounds from images, making them transparent.
Targets images with white backgrounds and a thick black border—flood fill from
corners stops at the border. No AI, just Pillow.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


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
        description="Remove white background from images (makes it transparent)."
    )
    parser.add_argument(
        "input",
        type=Path,
        help="Input image path",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output path (default: input with -nobg before extension)",
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
        default=6,
        help="Halo removal strength, higher=more aggressive (default: 6)",
    )

    args = parser.parse_args()

    if not args.input.exists():
        parser.error(f"Input file not found: {args.input}")

    if args.output is None:
        stem = args.input.stem
        suffix = args.input.suffix
        args.output = args.input.parent / f"{stem}-nobg{suffix}"

    image = Image.open(args.input)
    result = remove_white_background(
        image,
        tolerance=args.tolerance,
        aggressive=args.aggressive,
    )
    result.save(args.output)
    print(f"Saved {args.output}")


if __name__ == "__main__":
    main()
