"""
Download the game's sounds and music (all CC0) and lay them out for it.

sources.json lists every cue the game plays (footsteps by surface, doors, animals, effects, ambience, music)
and where each comes from: files from Kenney's CC0 audio packs, the best few results of a Freesound search
limited to CC0, a direct URL, or a local file. This writes, under assets/audio/:

  <cue>/<n>.mp3     the sounds, trimmed, levelled and made mono where it helps (needs ffmpeg; without it the
                    originals are copied as they are)
  manifest.json     what the game loads: each cue's files, level and whether it loops
  CREDITS.md        where every file came from (CC0 needs no credit, but it is good to know)
  index.html        a page to listen to everything (open it, or /audio/index.html on the running game)

    export FREESOUND_API_KEY=...      # free: https://freesound.org/apiv2/apply
    python3 words_and_images/audio/fetch_audio.py
    python3 words_and_images/audio/fetch_audio.py --only animal.cat music.night --force

Cues already fetched are kept unless --force. Swap any sound by editing its entry in sources.json (a "url" or
"file" source, or another query) and fetching that cue again.
"""
from __future__ import annotations

import argparse
import fnmatch
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = ROOT / "assets" / "audio"
CACHE = HERE / ".cache"
KENNEY = os.environ.get("KENNEY_BASE", "https://kenney.nl")
FREESOUND = os.environ.get("FREESOUND_BASE", "https://freesound.org")
UA = {"User-Agent": "paper-world-audio-fetch/1.0"}

# loudness targets (LUFS) by kind, before each cue's own gain in the game
LOUDNESS = {"sfx": -18, "ambience": -24, "music": -20}
MAX_SECONDS = {"sfx": 4.0, "ambience": 90.0, "music": 300.0}


def get(url: str, timeout: float = 60) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def kenney_pack(slug: str) -> zipfile.ZipFile:
    """A Kenney asset pack's zip (cached): the pack page links its download."""
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"kenney-{slug}.zip"
    if not path.exists():
        page = get(f"{KENNEY}/assets/{slug}").decode("utf-8", "replace")
        links = re.findall(r'href="([^"]+?\.zip)"', page)
        if not links:
            raise RuntimeError(f"no download link on {KENNEY}/assets/{slug}")
        url = urllib.parse.urljoin(f"{KENNEY}/assets/{slug}", html.unescape(links[0]))
        print(f"  downloading Kenney pack {slug}", flush=True)
        path.write_bytes(get(url, timeout=300))
    return zipfile.ZipFile(path)


def from_kenney(src: dict, tmp: Path) -> list[dict]:
    pack = kenney_pack(src["pack"])
    names = sorted(n for n in pack.namelist() if not n.endswith("/") and "__MACOSX" not in n)
    out = []
    for pattern in src["files"]:
        for n in names:
            base = n.rsplit("/", 1)[-1]
            if fnmatch.fnmatch(base, pattern) or fnmatch.fnmatch(base, pattern + ".*"):
                if any(o["name"] == base for o in out):
                    continue
                p = tmp / f"{len(out)}-{base}"
                p.write_bytes(pack.read(n))
                out.append({"path": p, "name": base, "author": "Kenney", "page": f"{KENNEY}/assets/{src['pack']}", "license": "CC0"})
    if not out:
        raise RuntimeError(f"no files matching {src['files']} in Kenney's {src['pack']}")
    return out[: src.get("n", 6)]


def from_freesound(src: dict, tmp: Path, key: str) -> list[dict]:
    lo, hi = src.get("dur", [0.2, 3.0])
    filt = f'license:"Creative Commons 0" duration:[{lo} TO {hi}]'
    for t in src.get("tags", []):
        filt += f" tag:{t}"
    q = urllib.parse.urlencode({
        "query": src["query"], "filter": filt, "sort": "score", "page_size": 30,
        "fields": "id,name,username,license,previews,duration,avg_rating,num_ratings,url", "token": key,
    })
    data = json.loads(get(f"{FREESOUND}/apiv2/search/text/?{q}"))
    results = data.get("results", [])
    skip = [w.lower() for w in src.get("exclude", [])]
    results = [r for r in results if not any(w in r["name"].lower() for w in skip)]
    # well rated sounds first, keeping the search's own order among equals
    ranked = sorted(enumerate(results), key=lambda ir: (-(ir[1]["avg_rating"] if ir[1]["num_ratings"] >= 2 else 2.5), ir[0]))
    out = []
    for _, r in ranked[: src.get("n", 3)]:
        url = r["previews"].get("preview-hq-mp3") or r["previews"].get("preview-lq-mp3")
        p = tmp / f"{len(out)}-fs{r['id']}.mp3"
        p.write_bytes(get(url))
        out.append({"path": p, "name": r["name"], "author": r["username"], "page": r.get("url") or f"https://freesound.org/s/{r['id']}/", "license": "CC0"})
    if not out:
        raise RuntimeError(f'Freesound found nothing CC0 for "{src["query"]}" between {lo} and {hi} s')
    return out


def from_url(src: dict, tmp: Path) -> list[dict]:
    name = urllib.parse.urlparse(src["url"]).path.rsplit("/", 1)[-1] or "sound"
    p = tmp / name
    p.write_bytes(get(src["url"], timeout=300))
    return [{"path": p, "name": name, "author": src.get("author", "?"), "page": src.get("page", src["url"]), "license": src.get("license", "CC0")}]


def from_file(src: dict, tmp: Path) -> list[dict]:
    path = (HERE / src["file"]).resolve() if not os.path.isabs(src["file"]) else Path(src["file"])
    p = tmp / path.name
    shutil.copy(path, p)
    return [{"path": p, "name": path.name, "author": src.get("author", "?"), "page": src.get("page", ""), "license": src.get("license", "CC0")}]


def encode(src: Path, dst: Path, kind: str, ffmpeg: str | None) -> Path:
    """Trim, level and encode one sound to mp3 (or copy it as it is without ffmpeg)."""
    if not ffmpeg:
        out = dst.with_suffix(src.suffix.lower())
        shutil.copy(src, out)
        return out
    filters = []
    if kind == "sfx":
        # start on the sound, not the silence before it
        filters.append("silenceremove=start_periods=1:start_threshold=-50dB")
    filters.append(f"loudnorm=I={LOUDNESS[kind]}:TP=-2:LRA=11")
    if kind != "sfx":
        # soft ends, so a loop's seam can be cross-faded
        filters.append("afade=t=in:d=0.5")
    args = [ffmpeg, "-y", "-loglevel", "error", "-i", str(src), "-t", str(MAX_SECONDS[kind]), "-af", ",".join(filters), "-ar", "44100"]
    args += ["-ac", "2", "-b:a", "128k"] if kind == "music" else ["-ac", "1", "-b:a", "96k" if kind == "sfx" else "112k"]
    out = dst.with_suffix(".mp3")
    subprocess.run(args + [str(out)], check=True)
    return out


def fetch_cue(name: str, spec: dict, key: str | None, ffmpeg: str | None) -> list[dict]:
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        if "kenney" in spec:
            got = from_kenney(spec["kenney"], tmp)
        elif "freesound" in spec:
            if not key:
                raise RuntimeError("needs FREESOUND_API_KEY (free at https://freesound.org/apiv2/apply)")
            got = from_freesound(spec["freesound"], tmp, key)
        elif "url" in spec:
            got = from_url(spec, tmp)
        elif "file" in spec:
            got = from_file(spec, tmp)
        else:
            raise RuntimeError("no source")
        folder = OUT / name
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True)
        kind = spec.get("kind", "sfx")
        files = []
        for i, g in enumerate(got):
            out = encode(g["path"], folder / str(i), kind, ffmpeg)
            files.append({**{k: v for k, v in g.items() if k != "path"}, "file": f"{name}/{out.name}"})
        return files


def write_outputs(sources: dict, done: dict[str, list[dict]]) -> None:
    cues = {}
    for name, spec in sources["cues"].items():
        files = done.get(name)
        if not files:
            continue
        cues[name] = {"files": [f["file"] for f in files], "gain": spec.get("gain", 0.6), **({"loop": True} if spec.get("loop") else {}), "kind": spec.get("kind", "sfx")}
    (OUT / "manifest.json").write_text(json.dumps({"v": 1, "cues": cues}, indent=1) + "\n")
    lines = ["# Sound credits", "", "Every sound here is CC0 (public domain): no credit is required. Where each one came from:", ""]
    for name in sorted(done):
        for f in done[name]:
            lines.append(f"- `{f['file']}`: \"{f['name']}\" by {f['author']} ({f['license']}), {f['page']}")
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n")
    rows = []
    for name in sorted(cues):
        players = "".join(f'<audio controls preload="none" src="{html.escape(f)}"></audio>' for f in cues[name]["files"])
        rows.append(f"<tr><td><b>{html.escape(name)}</b><br><small>{cues[name]['kind']}, gain {cues[name]['gain']}</small></td><td>{players}</td></tr>")
    missing = [n for n in sources["cues"] if n not in cues]
    page = (
        '<!doctype html><meta charset="utf-8"><title>Paper World sounds</title>'
        "<style>body{font:14px system-ui,sans-serif;margin:16px;background:#faf8f2}td{border-bottom:1px solid #ddd;padding:6px;vertical-align:top}"
        "audio{height:32px;margin:2px}small{color:#777}</style>"
        f"<h1>Paper World sounds</h1><p>{len(cues)} cues. Not fetched yet: {html.escape(', '.join(missing)) or 'none'}.</p>"
        f"<table>{''.join(rows)}</table>"
    )
    (OUT / "index.html").write_text(page)


def load_done() -> dict[str, list[dict]]:
    """What is already here, from the last credits written (so a partial run keeps earlier cues)."""
    path = OUT / "fetched.json"
    return json.loads(path.read_text()) if path.exists() else {}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*", help="only these cues")
    ap.add_argument("--force", action="store_true", help="fetch again even if already here")
    ap.add_argument("--key", default=os.environ.get("FREESOUND_API_KEY"))
    args = ap.parse_args()
    sources = json.loads((HERE / "sources.json").read_text())
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("ffmpeg not found: copying sounds as they are (brew install ffmpeg to trim and level them, and to make mp3s every browser plays)")
    OUT.mkdir(parents=True, exist_ok=True)
    done = load_done()
    names = args.only or list(sources["cues"])
    failed = []
    for name in names:
        spec = sources["cues"].get(name)
        if spec is None:
            print(f"{name}: not in sources.json")
            continue
        if name in done and not args.force and all((OUT / f["file"]).exists() for f in done[name]):
            continue
        try:
            done[name] = fetch_cue(name, spec, args.key, ffmpeg)
            print(f"{name}: {len(done[name])} file(s)", flush=True)
        except Exception as e:  # one bad source should not stop the rest
            failed.append(name)
            print(f"{name}: FAILED ({e})", flush=True)
        (OUT / "fetched.json").write_text(json.dumps(done, indent=1))
        write_outputs(sources, done)
    write_outputs(sources, done)
    size = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"\n{len(done)} of {len(sources['cues'])} cues in {OUT} ({size / 1e6:.1f} MB). Listen: {OUT / 'index.html'}")
    if failed:
        print("Failed:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()
