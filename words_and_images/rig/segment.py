"""
Find the paper pieces a drawing could be cut into, without any AI.

The drawings are flat crayon colours inside thick dark outlines, so: pixels that are near-black are ink; the rest
of the figure falls into a dozen colour clusters; each connected patch of one cluster between ink lines is a
region; small isolated ink blobs (eyes, mouths, noses, buttons) are features. Regions and features get numbers and
are drawn on an overlay so a person or a vision model can say which numbers make an arm, a head, an eye.

    python3 words_and_images/rig/segment.py boy dog clock --out /tmp/seg
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "assets" / "sprites" / "512"

INK_MAX = 72          # a pixel whose brightest channel is below this is ink
MIN_REGION = 40       # px: smaller colour patches merge into a neighbour
FEATURE_MAX = 0.02    # ink blobs under this share of the figure's area are features (eyes, mouths...)
SEAL = 1              # px the ink is thickened by before splitting, to close small gaps in outlines


@dataclass
class Region:
    n: int
    kind: str          # "region" (coloured patch) or "feature" (small ink blob)
    area: int
    bbox: list[int]    # x0, y0, x1, y1
    centroid: list[float]
    color: str


def load(word: str) -> np.ndarray:
    path = SPRITES / f"{word.replace(' ', '_')}.webp"
    return np.asarray(Image.open(path).convert("RGBA"))


def segment(rgba: np.ndarray) -> tuple[np.ndarray, list[Region], np.ndarray]:
    """Label image (0 = background or outline ink, 1.. = regions and features) and the region table."""
    alpha = rgba[..., 3] > 128
    rgb = rgba[..., :3].astype(np.int32)
    ink = alpha & (rgb.max(axis=2) < INK_MAX)
    paint = alpha & ~ink

    # the outlines already split the drawing into its shapes: each patch of paint enclosed by ink is a region
    # (the ink is thickened a little first so a sketchy gap in an outline does not join two shapes)
    sealed = paint & ~ndimage.binary_dilation(ink, iterations=SEAL)
    labels, _ = ndimage.label(sealed)
    # pixels the thickened ink took back go to the nearest region
    labels = grow_into(labels, paint)
    labels = merge_small(labels, paint)

    # features: small ink blobs that are not part of the outline network
    ink_lab, n_ink = ndimage.label(ink, structure=np.ones((3, 3)))
    figure_area = int(alpha.sum())
    features = np.zeros_like(labels)
    if n_ink:
        sizes = ndimage.sum(ink, ink_lab, range(1, n_ink + 1))
        biggest = int(np.argmax(sizes)) + 1
        for k, s in enumerate(sizes, start=1):
            if k == biggest or s < 6 or s > FEATURE_MAX * figure_area:
                continue
            features[ink_lab == k] = k

    # renumber: regions first (biggest first), then features
    out = np.zeros_like(labels)
    table: list[Region] = []
    n = 1
    ids = [i for i in np.unique(labels) if i]
    ids.sort(key=lambda i: -int((labels == i).sum()))
    for i in ids:
        m = labels == i
        out[m] = n
        table.append(describe(n, "region", m, rgba))
        n += 1
    fids = [i for i in np.unique(features) if i]
    fids.sort(key=lambda i: (int(np.argwhere(features == i)[:, 0].mean()), int(np.argwhere(features == i)[:, 1].mean())))
    for i in fids:
        m = features == i
        out[m] = n
        table.append(describe(n, "feature", m, rgba))
        n += 1
    return out, table, ink


def grow_into(labels: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Fill unlabelled pixels of `mask` from the nearest labelled pixel."""
    if not (labels > 0).any():
        return labels
    _, (iy, ix) = ndimage.distance_transform_edt(labels == 0, return_indices=True)
    out = labels.copy()
    hole = mask & (labels == 0)
    out[hole] = labels[iy[hole], ix[hole]]
    return out


def merge_small(labels: np.ndarray, paint: np.ndarray) -> np.ndarray:
    """Give patches smaller than MIN_REGION to the neighbouring patch they touch most (crayon speckle)."""
    for _ in range(3):
        ids, counts = np.unique(labels[labels > 0], return_counts=True)
        small = ids[counts < MIN_REGION]
        if not len(small):
            break
        for i in small:
            m = labels == i
            ring = ndimage.binary_dilation(m, iterations=2) & ~m & (labels > 0)
            if ring.any():
                vals, cnt = np.unique(labels[ring], return_counts=True)
                labels[m] = vals[np.argmax(cnt)]
            else:
                labels[m] = 0
    return labels


def describe(n: int, kind: str, m: np.ndarray, rgba: np.ndarray) -> Region:
    ys, xs = np.nonzero(m)
    col = rgba[ys, xs, :3].mean(axis=0).astype(int)
    return Region(
        n=n,
        kind=kind,
        area=int(m.sum()),
        bbox=[int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
        centroid=[round(float(xs.mean()), 1), round(float(ys.mean()), 1)],
        color="#%02x%02x%02x" % tuple(col),
    )


def overlay(rgba: np.ndarray, labels: np.ndarray, table: list[Region], scale: int = 2) -> Image.Image:
    """The drawing faded, region borders in red, each region's number at its centre (features in blue)."""
    h, w = labels.shape
    base = Image.fromarray(rgba).convert("RGBA")
    bg = Image.new("RGBA", base.size, (255, 255, 255, 255))
    bg.alpha_composite(base)
    faded = Image.blend(bg, Image.new("RGBA", base.size, (255, 255, 255, 255)), 0.35)
    edge = np.zeros((h, w), bool)
    edge[:, 1:] |= labels[:, 1:] != labels[:, :-1]
    edge[1:, :] |= labels[1:, :] != labels[:-1, :]
    edge &= (labels > 0) | np.roll(labels > 0, 1, axis=0) | np.roll(labels > 0, 1, axis=1)
    arr = np.asarray(faded).copy()
    arr[edge] = [220, 40, 40, 255]
    img = Image.fromarray(arr).resize((w * scale, h * scale), Image.NEAREST)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 13 * scale // 2 + 4)
    except OSError:
        font = ImageFont.load_default()
    # rulers in thousandths of the width and height, so positions can be read off (and given back) as 0-1000
    try:
        small = ImageFont.truetype("DejaVuSans.ttf", 10)
    except OSError:
        small = font
    for k in range(0, 1001, 100):
        x = k / 1000 * (w * scale - 1)
        y = k / 1000 * (h * scale - 1)
        d.line([x, 6, x, h * scale], fill=(170, 210, 170, 255), width=1)
        d.line([6, y, w * scale, y], fill=(170, 210, 170, 255), width=1)
        d.text((x + 1, 6), str(k), fill=(0, 120, 0), font=small)
        d.text((7, y + 1), str(k), fill=(0, 120, 0), font=small)
    for r in table:
        if r.area < 25 and r.kind == "region":
            continue
        x, y = r.centroid[0] * scale, r.centroid[1] * scale
        txt = str(r.n)
        col = (30, 60, 220) if r.kind == "feature" else (0, 0, 0)
        tw = d.textlength(txt, font=font)
        d.rectangle([x - tw / 2 - 2, y - 9, x + tw / 2 + 2, y + 9], fill=(255, 255, 255, 220))
        d.text((x - tw / 2, y - 9), txt, fill=col, font=font)
    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("words", nargs="+")
    ap.add_argument("--out", default="/tmp/seg")
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for word in args.words:
        rgba = load(word)
        labels, table, _ = segment(rgba)
        overlay(rgba, labels, table).save(out / f"{word}-regions.png")
        np.save(out / f"{word}-labels.npy", labels)
        (out / f"{word}-regions.json").write_text(json.dumps([asdict(r) for r in table], indent=1))
        print(word, len([r for r in table if r.kind == "region"]), "regions", len([r for r in table if r.kind == "feature"]), "features")


if __name__ == "__main__":
    main()
