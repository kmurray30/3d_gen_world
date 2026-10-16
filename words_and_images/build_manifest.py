#!/usr/bin/env python3
"""
Build assets/manifest.json from word_map.json, tag_map.json, overrides.json and the sprite files
that actually exist. The server loads this for word resolution and sizing; the client never does.

Entry shape:  words[word] = { f: "file.webp"|null, w, h, t: type, hm: heightM, solid, huge, tags: [...] }
Also:         aliases[alias] = [primary words]  (non-primary tag_map entries)
              overrides[alias] = primary word    (manual fixes, validated against words)
              version = short content hash

Usage:
    python3 words_and_images/build_manifest.py              # fails if sprites are missing for words
    python3 words_and_images/build_manifest.py --no-images-ok   # allow missing sprites (f = null)
Dims come from assets/sprites/dims.json (written by optimize_images.py) or, if Pillow is importable,
straight from the WebP headers; otherwise a per-type default aspect is used.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ASSETS = ROOT / "assets"
SPRITES_512 = ASSETS / "sprites" / "512"

HEIGHT_MIN_M = 0.1
HEIGHT_MAX_M = 12.0
HUGE_FROM_M = 12.0
DEFAULT_HEIGHT_M = {"object": 0.5, "human": 1.7, "humanoid": 1.7, "animal": 0.6, "other": 1.0}
# Default sprite aspect (w/h) when the file is missing.
DEFAULT_ASPECT = {"object": 1.0, "human": 0.5, "humanoid": 0.55, "animal": 1.2, "other": 1.0}
NON_SOLID_WORDS = {
    "cloud", "ghost", "rainbow", "smoke", "shadow (light)", "steam", "fog", "mist", "wind", "sun", "moon",
    "sky", "aurora borealis", "lightning", "fire", "spirit", "soul", "air", "bubble", "bubbles", "dust",
    "snow", "rain", "acid rain", "tornado", "hurricane", "storm", "thunderstorm", "blizzard", "puddle",
    "mud", "grass", "pond", "stream", "lake", "ocean", "river", "sea", "road", "path", "sidewalk", "rug",
    "carpet", "mat", "shadow",
}


def word_to_filename(word: str) -> str:
    return word.replace(" ", "_").replace("'", "").lower()


def clamp_height(word_type: str, height_cm) -> float:
    try:
        h = float(height_cm or 0) / 100.0
    except (TypeError, ValueError):
        h = 0.0
    if h <= 0:
        return DEFAULT_HEIGHT_M.get(word_type, 1.0)
    return max(HEIGHT_MIN_M, min(HEIGHT_MAX_M, h))


def load_dims(files: list[str]) -> dict[str, tuple[int, int]]:
    dims_path = ASSETS / "sprites" / "dims.json"
    if dims_path.is_file():
        with open(dims_path, encoding="utf-8") as fh:
            raw = json.load(fh)
        return {k: (int(v[0]), int(v[1])) for k, v in raw.items()}
    try:
        from PIL import Image  # type: ignore
    except Exception:
        return {}
    dims: dict[str, tuple[int, int]] = {}
    for name in files:
        try:
            with Image.open(SPRITES_512 / name) as im:
                dims[name] = im.size
        except Exception:
            pass
    return dims


def main() -> None:
    parser = argparse.ArgumentParser(description="Build assets/manifest.json")
    parser.add_argument("--no-images-ok", action="store_true", help="do not fail when sprites are missing")
    args = parser.parse_args()

    with open(HERE / "word_map.json", encoding="utf-8") as fh:
        word_map = json.load(fh)
    with open(HERE / "tag_map.json", encoding="utf-8") as fh:
        tag_map = json.load(fh)
    # Extra words that the Scribblenauts list lacks (words_gap.csv: word,type,height_cm). They join the vocabulary
    # immediately and show a placeholder card until their sprite is generated.
    gap_path = HERE / "words_gap.csv"
    if gap_path.is_file():
        import csv
        with open(gap_path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                word = (row.get("word") or "").strip().lower()
                if word and word not in word_map:
                    word_map[word] = {"word": word, "file": f"{word_to_filename(word)}.png", "type": (row.get("type") or "object").strip(), "height_cm": float(row.get("height_cm") or 0), "tags": []}
    overrides_raw = {}
    if (HERE / "overrides.json").is_file():
        with open(HERE / "overrides.json", encoding="utf-8") as fh:
            overrides_raw = {k: v for k, v in json.load(fh).items() if not k.startswith("_")}

    existing = set()
    if SPRITES_512.is_dir():
        existing = {p.name for p in SPRITES_512.iterdir() if p.suffix == ".webp"}
    dims = load_dims(sorted(existing))

    words: dict[str, dict] = {}
    missing: list[str] = []
    for word, entry in word_map.items():
        word_type = entry.get("type") or "object"
        fname = f"{word_to_filename(word)}.webp"
        has_file = fname in existing
        if not has_file:
            missing.append(word)
        if has_file and fname in dims:
            w, h = dims[fname]
        else:
            aspect = DEFAULT_ASPECT.get(word_type, 1.0)
            w, h = (int(512 * aspect), 512) if aspect <= 1 else (512, int(512 / aspect))
        height_m = clamp_height(word_type, entry.get("height_cm"))
        solid = word_type != "other" and word not in NON_SOLID_WORDS
        words[word] = {
            "f": fname if has_file else None,
            "w": w,
            "h": h,
            "t": word_type,
            "hm": round(height_m, 3),
            "solid": solid,
            "huge": height_m >= HUGE_FROM_M,
            "tags": [t for t in (entry.get("tags") or []) if isinstance(t, str)],
        }

    aliases: dict[str, list[str]] = {}
    for alias, info in tag_map.items():
        if info.get("is_primary"):
            continue
        targets = [w for w in info.get("words", []) if w in words]
        if targets and alias not in words:
            aliases[alias] = targets

    overrides: dict[str, str] = {}
    for alias, target in overrides_raw.items():
        if target in words:
            overrides[alias] = target
        else:
            print(f"warning: override target not in vocabulary: {alias!r} -> {target!r}", file=sys.stderr)

    body = {"words": words, "aliases": aliases, "overrides": overrides}
    digest = hashlib.sha1(json.dumps(body, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()[:10]
    manifest = {"version": digest, "counts": {"words": len(words), "withSprite": len(words) - len(missing), "aliases": len(aliases)}, **body}

    ASSETS.mkdir(parents=True, exist_ok=True)
    out = ASSETS / "manifest.json"
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, separators=(",", ":"))

    unreferenced = sorted(existing - {f"{word_to_filename(w)}.webp" for w in word_map})
    print(f"manifest {digest}: {len(words)} words, {len(words) - len(missing)} with sprites, {len(aliases)} aliases, "
          f"{len(overrides)} overrides -> {out} ({out.stat().st_size // 1024} KB)")
    if unreferenced:
        print(f"note: {len(unreferenced)} sprite files have no vocabulary entry, e.g. {unreferenced[:5]}")
    if missing and not args.no_images_ok:
        print(f"ERROR: {len(missing)} words have no sprite (first: {missing[:8]}). Pass --no-images-ok to allow.", file=sys.stderr)
        sys.exit(1)
    if missing:
        print(f"note: {len(missing)} words have no sprite yet")


if __name__ == "__main__":
    main()
