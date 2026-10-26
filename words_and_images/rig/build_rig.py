"""
Turn a labelling of a drawing's regions into a rig the game can animate.

A labelling says which numbered regions (from segment.py) make each paper piece, where a piece must be cut off
another one (a hand at the wrist, a dog's tail at its base), and which small ink marks are eyes, pupils,
eyebrows and the mouth. Coordinates are thousandths of the drawing's width and height (0-1000), as on the
overlay's rulers. This writes, per drawing:

  assets/rigs/<file>.json   pieces with their kind, parent, joint (pivot) and draw order, plus face fills
  assets/rigs/<file>.png    the piece map: each pixel's value is its piece's index + 1 (0 = empty)

and a review picture with every piece tinted and its joint marked.

    python3 words_and_images/rig/build_rig.py words_and_images/rig/labels/boy.json --review /tmp/review
"""
from __future__ import annotations

import argparse
import colorsys
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

from segment import ROOT, load, segment

RIGS = ROOT / "assets" / "rigs"

KINDS = {
    "body", "head", "hair", "hat", "arm", "hand", "leg", "foot", "tail", "ear", "wing", "eye", "pupil", "brow",
    "mouth", "accessory", "held", "wheel", "clock_hand", "door", "lid", "blade", "other",
}
FACE = {"eye", "pupil", "brow", "mouth"}
# default draw order relative to the parent: limbs tuck behind the body so their cut ends stay hidden
Z_BY_KIND = {"arm": -1, "hand": -1, "leg": -2, "foot": -1, "tail": -3, "wing": -1, "ear": -1, "head": 2, "hair": 1,
             "hat": 3, "eye": 4, "pupil": 5, "brow": 5, "mouth": 4, "held": 3, "accessory": 1, "wheel": 1,
             "clock_hand": 2, "door": 1, "lid": 1, "blade": 1}
# what a detachable piece becomes in the world
DETACH_WORD = {"hat": "hat", "held": None, "wheel": "wheel", "accessory": None}


def to_px(p: list[float], w: int, h: int) -> tuple[float, float]:
    return (p[0] / 1000 * (w - 1), p[1] / 1000 * (h - 1))


def segment_mask(shape: tuple[int, int], a: tuple[float, float], b: tuple[float, float], width: float = 1.6) -> np.ndarray:
    """Pixels within `width` of the segment a-b."""
    h, w = shape
    x0, x1 = int(max(0, min(a[0], b[0]) - 3)), int(min(w, max(a[0], b[0]) + 4))
    y0, y1 = int(max(0, min(a[1], b[1]) - 3)), int(min(h, max(a[1], b[1]) + 4))
    out = np.zeros(shape, bool)
    if x1 <= x0 or y1 <= y0:
        return out
    ys, xs = np.mgrid[y0:y1, x0:x1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    L2 = dx * dx + dy * dy or 1.0
    t = np.clip(((xs - a[0]) * dx + (ys - a[1]) * dy) / L2, 0, 1)
    d = np.hypot(xs - (a[0] + t * dx), ys - (a[1] + t * dy))
    out[y0:y1, x0:x1] = d <= width
    return out


def split(mask: np.ndarray, cuts: list, keep: tuple[float, float]) -> np.ndarray:
    """The part of `mask` on the `keep` side of the cut lines (each cut is two points)."""
    blocked = mask.copy()
    for a, b in cuts:
        blocked &= ~segment_mask(mask.shape, a, b)
    lab, n = ndimage.label(blocked)
    kx, ky = int(round(keep[0])), int(round(keep[1]))
    hit = lab[min(max(ky, 0), mask.shape[0] - 1), min(max(kx, 0), mask.shape[1] - 1)]
    if not hit:
        # the keep point fell on a line or outside: take the component nearest to it
        ys, xs = np.nonzero(blocked)
        if not len(xs):
            return np.zeros_like(mask)
        i = int(np.argmin((xs - kx) ** 2 + (ys - ky) ** 2))
        hit = lab[ys[i], xs[i]]
    part = lab == hit
    # the cut line itself goes to whichever side it touches most: here, to this side where it borders it
    line = mask & ~blocked
    part |= line & ndimage.binary_dilation(part, iterations=2)
    return part


def _runs(row: np.ndarray, offset: int) -> list[tuple[int, int]]:
    """Start and end (exclusive) of each stretch of set pixels in a row."""
    edges = np.flatnonzero(np.diff(np.concatenate([[0], row.astype(np.int8), [0]])))
    return [(int(edges[i]) + offset, int(edges[i + 1]) + offset) for i in range(0, len(edges), 2)]


def _longest_band(rows: list[tuple[int, object]]) -> list[tuple[int, object]]:
    """The longest stretch of consecutive rows in a list of (y, data)."""
    best: list = []
    cur: list = []
    for item in rows:
        if cur and item[0] != cur[-1][0] + 1:
            if len(cur) > len(best):
                best = cur
            cur = []
        cur.append(item)
    return cur if len(cur) > len(best) else best


def auto_cut(m: np.ndarray, how: str, side: str | None) -> tuple[list, tuple[float, float]] | None:
    """Cut lines for the common splits, so a labelling need not give coordinates:
    wrist: the hand below the narrowest row of the lower part of a hanging arm;
    legs: one leg of trousers or a skirt that covers both, split up the middle from the crotch;
    sleeve: an arm joined to its shirt, cut along the shoulder from the armpit."""
    ys, xs = np.nonzero(m)
    if not len(ys):
        return None
    y0, y1 = int(ys.min()), int(ys.max())
    x0, x1 = int(xs.min()), int(xs.max())
    if how == "wrist":
        best, at = None, None
        for y in range(int(y0 + (y1 - y0) * 0.5), int(y0 + (y1 - y0) * 0.9) + 1):
            row = np.nonzero(m[y])[0]
            if len(row) < 2:
                continue
            w = row.max() - row.min()
            if best is None or w < best:
                best, at = w, y
        if at is None:
            return None
        return [[(x0 - 4, at), (x1 + 4, at)]], ((x0 + x1) / 2, (at + y1) / 2 + 1)
    if how == "legs":
        # rows where the shape is two legs side by side; the crotch is the top of the longest such stretch
        rows = []
        for y in range(y0, y1 + 1):
            runs = [r for r in _runs(m[y, x0 : x1 + 1], x0) if r[1] - r[0] >= 3]
            if len(runs) >= 2:
                rows.append((y, runs))
        band = _longest_band(rows)
        if not band:
            return None
        crotch, runs = band[0]
        # the gap nearest the middle splits the two legs
        mid = (x0 + x1) / 2
        gaps = [((a[1] + b[0]) / 2) for a, b in zip(runs, runs[1:])]
        gap_x = min(gaps, key=lambda g: abs(g - mid))
        keep_x = (x0 + gap_x) / 2 if side == "l" else (gap_x + x1) / 2
        return [[(gap_x, y0 - 4), (gap_x, crotch + 2)]], (keep_x, (crotch + band[-1][0]) / 2)
    if how == "sleeve":
        # below the armpit the sleeve and the body are two runs on this side of the middle; the armpit is the
        # top of the longest such stretch, and the shoulder seam runs from it up and out
        mid = (x0 + x1) / 2
        rows = []
        for y in range(y0, y1 + 1):
            runs = [r for r in _runs(m[y, x0 : x1 + 1], x0) if r[1] - r[0] >= 2]
            if side == "l":
                runs = [r for r in runs if r[0] < mid]
            else:
                runs = [r for r in runs if r[1] > mid]
            if len(runs) >= 2:
                outer = runs[0] if side == "l" else runs[-1]
                # the sleeve is the narrow outer run
                if outer[1] - outer[0] < (x1 - x0) * 0.35:
                    rows.append((y, runs))
        band = _longest_band(rows)
        if len(band) < 4:
            return None
        top_y, runs = band[0]
        if side == "l":
            sleeve, body = runs[0], runs[1]
            gap_x = (sleeve[1] + body[0]) / 2
            outer_x = sleeve[0] - 6
        else:
            sleeve, body = runs[-1], runs[-2]
            gap_x = (body[1] + sleeve[0]) / 2
            outer_x = sleeve[1] + 6
        rise = abs(gap_x - outer_x) * 0.75
        mid_y, mid_runs = band[len(band) // 2]
        s_run = mid_runs[0] if side == "l" else mid_runs[-1]
        keep = ((s_run[0] + s_run[1]) / 2, mid_y)
        return [[(gap_x, top_y + 3), (outer_x, top_y - rise)]], keep
    raise SystemExit(f"unknown split {how}")


def ring_colour(rgba: np.ndarray, m: np.ndarray, owner_mask: np.ndarray, ink: np.ndarray) -> str:
    """Median colour of the paint just around a feature (what shows when the feature moves away)."""
    ring = ndimage.binary_dilation(m, iterations=7) & ~ndimage.binary_dilation(m, iterations=2) & owner_mask & ~ink
    if ring.sum() < 8:
        ring = owner_mask & ~ink & ~m
    if not ring.any():
        return "#ffffff"
    col = np.median(rgba[ring][:, :3], axis=0).astype(int)
    return "#%02x%02x%02x" % tuple(col)


def build(spec: dict, review: Path | None = None) -> dict:
    word = spec["word"]
    rgba = load(word)
    h, w = rgba.shape[:2]
    labels, table, ink = segment(rgba)
    alpha = rgba[..., 3] > 128
    by_n = {r.n: r for r in table}
    pieces = spec["pieces"]
    for p in pieces:
        assert p["kind"] in KINDS, f"{word}: unknown kind {p['kind']}"
    masks: dict[str, np.ndarray] = {}
    order: list[str] = []

    def region_mask(ns: list[int]) -> np.ndarray:
        m = np.zeros((h, w), bool)
        for n in ns:
            assert n in by_n, f"{word}: no region {n}"
            r = labels == n
            if by_n[n].kind == "feature":
                r = ndimage.binary_fill_holes(r)
            m |= r
        return m

    for p in pieces:
        m = region_mask(p.get("regions", []))
        src = p.get("from")
        if src:
            m |= masks[src]
        if p.get("poly"):
            # a rough outline drawn round the piece: it gets the part of its regions inside it
            lasso = Image.new("L", (w, h), 0)
            ImageDraw.Draw(lasso).polygon([to_px(q, w, h) for q in p["poly"]], fill=255)
            inside = np.asarray(lasso) > 0
            m &= inside
            if p.get("claim_ink"):
                # a black tyre is all outline ink: the wheel takes the ink inside its outline too
                m |= ink & inside
            for k in order:
                masks[k] &= ~m
        if p.get("split"):
            found = auto_cut(m, p["split"], p.get("side"))
            if not found:
                raise SystemExit(f"{word}: could not find the {p['split']} of {p['id']}")
            cuts, keep = found
            p["_cuts_px"] = cuts
            m = split(m, cuts, keep)
        elif p.get("cuts"):
            cuts = [[to_px(a, w, h), to_px(b, w, h)] for a, b in p["cuts"]]
            p["_cuts_px"] = cuts
            m = split(m, cuts, to_px(p["keep"], w, h))
        # a piece takes its pixels from every earlier piece (a hand cut off its arm, eyes off the head)
        for k in order:
            masks[k] &= ~m
        masks[p["id"]] = m
        order.append(p["id"])

    # face marks: eyes, pupils, brows and the mouth become pieces of the head (or whatever holds them)
    face = spec.get("face", {})
    head_id = face.get("on") or next((p["id"] for p in pieces if p["kind"] == "head"), pieces[0]["id"])
    face_pieces: list[dict] = []
    for kind, key in (("eye", "eyes"), ("pupil", "pupils"), ("brow", "brows"), ("mouth", "mouth")):
        ns = face.get(key, [])
        ns = ns if isinstance(ns, list) else [ns]
        found = []
        for n in ns:
            m = region_mask([n])
            r = by_n[n]
            found.append((r.centroid[0], n, m))
        found.sort()
        for i, (_, n, m) in enumerate(found):
            side = "" if len(found) == 1 else ("_l" if i == 0 else "_r" if i == len(found) - 1 else f"_{i}")
            pid = f"{kind}{side}"
            parent = head_id
            if kind == "pupil":
                # a pupil sits in the eye it overlaps most
                best = max((f for f in face_pieces if f["kind"] == "eye"), key=lambda f: (masks[f["id"]] & ndimage.binary_dilation(m, iterations=3)).sum(), default=None)
                if best:
                    parent = best["id"]
            for k in order:
                if k != parent or kind != "pupil":
                    masks[k] &= ~m
            if kind == "pupil" and parent in masks:
                masks[parent] &= ~m
            masks[pid] = m
            order.append(pid)
            face_pieces.append({"id": pid, "kind": kind, "parent": parent})

    # regions to drop: background trapped between an arm and the body, stray specks
    erased = region_mask(spec.get("erase", []))
    for k in order:
        masks[k] &= ~erased
    # everything nobody claimed (unlabelled paint, the outline ink) joins the nearest piece
    owner = np.zeros((h, w), np.int32)
    ids = order
    for i, k in enumerate(ids):
        owner[masks[k]] = i + 1
    if (owner > 0).any():
        _, (iy, ix) = ndimage.distance_transform_edt(owner == 0, return_indices=True)
        rest = alpha & (owner == 0) & ~erased
        owner[rest] = owner[iy[rest], ix[rest]]
    for i, k in enumerate(ids):
        masks[k] = owner == i + 1

    all_specs = {p["id"]: p for p in pieces}
    for f in face_pieces:
        all_specs[f["id"]] = f
    out_pieces = []
    for i, k in enumerate(ids):
        p = all_specs[k]
        m = masks[k]
        if not m.any():
            raise SystemExit(f"{word}: piece {k} came out empty")
        ys, xs = np.nonzero(m)
        entry: dict = {"id": k, "kind": p["kind"]}
        if p.get("parent"):
            entry["parent"] = p["parent"]
        pivot = p.get("pivot")
        if pivot:
            px, py = to_px(pivot, w, h)
        else:
            px, py = auto_pivot(p, m, masks.get(p.get("parent", ""), None), w, h)
        entry["pivot"] = [round(px / (w - 1), 4), round(py / (h - 1), 4)]
        entry["z"] = p.get("z", Z_BY_KIND.get(p["kind"], 0))
        entry["bbox"] = [round(float(xs.min()) / w, 4), round(float(ys.min()) / h, 4), round(float(xs.max() + 1) / w, 4), round(float(ys.max() + 1) / h, 4)]
        if p.get("side"):
            entry["side"] = p["side"]
        detach = p.get("detach", DETACH_WORD.get(p["kind"]))
        if detach:
            entry["detach"] = detach
        if p["kind"] in FACE:
            holder = masks.get(entry.get("parent", head_id))
            entry["fill"] = ring_colour(rgba, m, holder if holder is not None else alpha, ink)
        for extra in ("spin", "open", "hinge", "word"):
            if extra in p:
                entry[extra] = p[extra]
        out_pieces.append(entry)

    file = f"{word.replace(' ', '_')}.webp"
    rig = {"v": 1, "file": file, "w": w, "h": h, "view": spec.get("view", "front"), "pieces": out_pieces}
    if "mouth_at" in face:
        mx, my = to_px(face["mouth_at"], w, h)
        rig["mouth_at"] = [round(mx / (w - 1), 4), round(my / (h - 1), 4), face.get("mouth_w", 60) / 1000]
    RIGS.mkdir(parents=True, exist_ok=True)
    stem = file[:-5]
    Image.fromarray(owner.astype(np.uint8), "L").save(RIGS / f"{stem}.png", optimize=True)
    (RIGS / f"{stem}.json").write_text(json.dumps(rig, separators=(",", ":")))
    if review:
        review.mkdir(parents=True, exist_ok=True)
        cuts = [c for p in pieces for c in p.get("_cuts_px", [])]
        review_image(rgba, owner, {**rig, "_cuts": cuts}).save(review / f"{stem}-rig.png")
    return rig


def auto_pivot(p: dict, m: np.ndarray, parent: np.ndarray | None, w: int, h: int) -> tuple[float, float]:
    """Where a piece turns: its cut line, else where it meets its parent (the top of an arm or leg, the bottom of
    a head), else its middle (wheels, eyes); the root stands on its lowest point."""
    ys, xs = np.nonzero(m)
    kind = p["kind"]
    if p.get("_cuts_px") and kind not in ("leg", "arm"):
        (ax, ay), (bx, by) = p["_cuts_px"][0]
        return ((ax + bx) / 2, (ay + by) / 2)
    if p.get("_cuts_px") and kind == "arm":
        # an arm cut off a sleeve at the shoulder turns about the middle of the cut
        (ax, ay), (bx, by) = p["_cuts_px"][0]
        return ((ax + bx) / 2, (ay + by) / 2)
    if parent is None or kind in ("wheel", "eye", "pupil", "brow", "mouth", "blade"):
        if parent is None:
            return (float(xs.mean()), float(ys.max()))
        return (float(xs.mean()), float(ys.mean()))
    touch = m & ndimage.binary_dilation(parent, iterations=3)
    if not touch.any():
        return (float(xs.mean()), float(ys.min()))
    ty, tx = np.nonzero(touch)
    if kind in ("arm", "leg", "hand", "foot", "wing", "ear", "hat", "hair"):
        # limbs hang from the top of where they meet the body
        top = ty <= ty.min() + max(3, (ys.max() - ys.min()) * 0.15)
        return (float(tx[top].mean()), float(ty[top].mean()))
    if kind == "head":
        bottom = ty >= ty.max() - max(3, (ys.max() - ys.min()) * 0.15)
        return (float(tx[bottom].mean()), float(ty[bottom].mean()))
    return (float(tx.mean()), float(ty.mean()))


def review_image(rgba: np.ndarray, owner: np.ndarray, rig: dict, scale: int = 2) -> Image.Image:
    """Each piece tinted its own colour over the drawing, joints as dots, ids in the middle."""
    h, w = owner.shape
    base = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    base.alpha_composite(Image.fromarray(rgba))
    arr = np.asarray(base).astype(np.float32)
    n = len(rig["pieces"])
    for i, p in enumerate(rig["pieces"]):
        r, g, b = colorsys.hsv_to_rgb((i * 0.618) % 1, 0.75, 1)
        m = owner == i + 1
        arr[m, :3] = arr[m, :3] * 0.55 + np.array([r, g, b]) * 255 * 0.45
    edge = np.zeros((h, w), bool)
    edge[:, 1:] |= owner[:, 1:] != owner[:, :-1]
    edge[1:, :] |= owner[1:, :] != owner[:-1, :]
    arr[edge, :3] = 30
    img = Image.fromarray(arr.astype(np.uint8)).resize((w * scale, h * scale), Image.NEAREST)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 12)
    except OSError:
        font = ImageFont.load_default()
    for (ax, ay), (bx, by) in rig.get("_cuts", []):
        d.line([ax * scale, ay * scale, bx * scale, by * scale], fill=(255, 0, 0), width=2)
    for p in rig["pieces"]:
        px, py = p["pivot"][0] * (w - 1) * scale, p["pivot"][1] * (h - 1) * scale
        d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(255, 0, 0), outline=(0, 0, 0))
        bx = (p["bbox"][0] + p["bbox"][2]) / 2 * w * scale
        by = (p["bbox"][1] + p["bbox"][3]) / 2 * h * scale
        if p["kind"] not in FACE:
            d.text((bx - 14, by - 6), p["id"], fill=(0, 0, 0), font=font, stroke_width=2, stroke_fill=(255, 255, 255))
    del n
    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("labels", nargs="+", type=Path)
    ap.add_argument("--review", type=Path, default=None)
    args = ap.parse_args()
    for path in args.labels:
        spec = json.loads(path.read_text())
        rig = build(spec, args.review)
        print(spec["word"], len(rig["pieces"]), "pieces")
    write_index()


def write_index() -> None:
    """assets/rigs/index.json: which sprite files have a rig, so the game only asks for those."""
    files = sorted(p.name[:-5] + ".webp" for p in RIGS.glob("*.json") if p.name != "index.json")
    (RIGS / "index.json").write_text(json.dumps({"v": 1, "files": files}))


if __name__ == "__main__":
    main()
