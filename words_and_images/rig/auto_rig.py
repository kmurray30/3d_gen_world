"""
Rig the whole drawing set with a vision model running on your own machine.

For each drawing: segment.py numbers its regions and ink marks on an overlay with rulers; a local vision model
(through any OpenAI-compatible server: Ollama, LM Studio, mlx-vlm) looks at the drawing and the overlay and says
which numbers make which paper piece, in the same label format as labels/*.json; the answer is checked (and sent
back once with what was wrong); build_rig.py turns it into a rig. Drawings with nothing that moves on its own (a
rock, a cup) are skipped and keep moving as one card.

Try two models on 40 varied drawings first, then look at the sheet and pick one:

    python3 words_and_images/rig/auto_rig.py pilot --models qwen3-vl:30b qwen3-vl:32b
    open words_and_images/rig/pilot/index.html

Then rig everything with the one you chose (resumable: run it again and it carries on where it stopped):

    python3 words_and_images/rig/auto_rig.py run --model qwen3-vl:30b
    open words_and_images/rig/review/index.html

The labels go to words_and_images/rig/auto_labels/ (edit one and rebuild it with build_rig.py to fix a rig by
hand), the rigs to assets/rigs/. Hand-made labels in labels/ always win. `--base-url` points at the server
(default Ollama's http://localhost:11434/v1; LM Studio is http://localhost:1234/v1). `--fake` answers with the
hand-made labels instead of a model, to check the pipeline without one.
"""
from __future__ import annotations

import argparse
import base64
import html
import io
import json
import os
import random
import re
import sys
import time
import traceback
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np

from build_rig import FACE, KINDS, RIGS, build, write_index
from segment import ROOT, SPRITES, load, overlay, segment

HERE = Path(__file__).resolve().parent
HAND = HERE / "labels"
AUTO = HERE / "auto_labels"
MANIFEST = ROOT / "assets" / "manifest.json"

# a few of the hand labellings, shown to the model as the shape of an answer
EXAMPLES = ["boy", "dog", "car"]

SYSTEM = """You rig flat cartoon drawings so a game can animate them like paper puppets: an arm swings at the \
shoulder, a head nods, a tail wags, a wheel turns, a hat can be knocked off.

Image 1 is the drawing. Image 2 is the same drawing cut into numbered regions along its outlines: black numbers \
are patches of paint, blue numbers are small ink marks (eyes, pupils, mouths, eyebrows, buttons). Green rulers \
give positions from 0 to 1000 across and down; every coordinate you give uses them. A table lists each number \
with its colour, box [x0, y0, x1, y1] and centre.

Answer with JSON only, one of:
  {"word": W, "static": true}   when nothing in the drawing would move on its own (a rock, a cup, a box, food)
  {"word": W, "view": "front" | "side", "pieces": [...], "face": {...}, "erase": [...]}

Pieces, in order, each {"id", "kind", "parent", "regions": [numbers], ...}:
- The first piece is the root ("body" for creatures, the main part of an object) and has no parent. Every other \
piece names a parent listed before it. Ids are short: body, head, hat, arm_l, hand_l, leg_r, foot_r, tail, ear_l, \
wing_r, wheel_f, wheel_b, door, lid, blade, hand_hour.
- kind: body, head, hair, hat, arm, hand, leg, foot, tail, ear, wing, wheel, door, lid, blade, clock_hand, held, \
accessory, other.
- "side": "l" or "r" on paired limbs; "l" is the one on the LEFT of the image.
- Each region number goes to one piece. Regions nobody names join the nearest piece, so the outline and small \
leftovers need no mention.
- When a piece is drawn joined to another in one region, split it:
  * a hand in the same region as its arm: {"id": "hand_l", "kind": "hand", "parent": "arm_l", "from": "arm_l", \
"split": "wrist"} ("from" takes the arm's pixels, "split" finds the wrist);
  * two legs drawn as one region (trousers, a skirt): give both leg pieces those regions with "split": "legs" \
and each its "side";
  * an arm joined to the shirt: give the arm the shirt's region with "split": "sleeve" and its "side";
  * anything else: "cuts": [[[x, y], [x, y]]] straight cut lines, and "keep": [x, y] a point on this piece's side.
- "poly": [[x, y], ...] a rough outline round a piece that shares regions with others (a wheel on a car body), \
with "claim_ink": true when the piece is mostly black ink (a tyre).
- "pivot": [x, y] where the piece turns, only when it is not where it meets its parent.
- "z": draw order against the parent, only to override (1 in front, -1 behind).
- "detach": "hat" (or another word) on a piece that can come off as a thing of its own.

face, for people and animals with a drawn face: {"eyes": [ink mark numbers], "pupils": [...], "brows": [...], \
"mouth": number}. Only marks really drawn; leave the rest out. An eye drawn as a white with a black pupil: the \
white region is the eye, the ink mark the pupil.
erase: region numbers that are background showing through (the gap between an arm and the body).

What to cut: people and creatures: the head (hair and a fixed hat with it; a hat that could come off as its own \
piece), each arm and hand, each leg and foot, the body, and tails, ears and wings. Objects: only what really \
moves (wheels, doors, lids, blades, clock hands, something held). A piece that is one thing is never spread over \
both sides of the body."""


def manifest() -> list[dict]:
    m = json.loads(MANIFEST.read_text())
    out = []
    for word, v in m["words"].items():
        if v.get("f"):
            out.append({"word": word, "stem": v["f"][:-5], "kind": v.get("t", "object")})
    return out


def png_data_url(img) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def region_table(table, w: int, h: int, limit: int = 90) -> str:
    rows = []
    total = sum(r.area for r in table if r.kind == "region") or 1
    keep = sorted((r for r in table if r.kind == "feature" or r.area >= 25), key=lambda r: -r.area)[:limit]
    for r in sorted(keep, key=lambda r: r.n):
        k = lambda v, s: round(v / s * 1000)
        box = [k(r.bbox[0], w), k(r.bbox[1], h), k(r.bbox[2], w), k(r.bbox[3], h)]
        c = [k(r.centroid[0], w), k(r.centroid[1], h)]
        share = f"{r.area / total * 100:.1f}%" if r.kind == "region" else "mark"
        rows.append(f"{r.n} {r.kind} {r.color} box {box} centre {c} {share}")
    return "\n".join(rows)


def examples() -> str:
    out = []
    for word in EXAMPLES:
        p = HAND / f"{word}.json"
        if p.exists():
            out.append(f"Example answer for a {word} (its numbers refer to its own drawing):\n{json.dumps(json.loads(p.read_text()), separators=(',', ':'))}")
    return "\n\n".join(out)


class Model:
    """A chat model behind an OpenAI-compatible endpoint."""

    def __init__(self, name: str, base_url: str, timeout: float = 600):
        self.name = name
        self.url = base_url.rstrip("/") + "/chat/completions"
        self.timeout = timeout
        self.json_mode = True

    def ask(self, messages: list[dict]) -> tuple[str, dict]:
        body = {"model": self.name, "messages": messages, "temperature": 0.1, "max_tokens": 2500}
        if self.json_mode:
            body["response_format"] = {"type": "json_object"}
        req = urllib.request.Request(self.url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            if self.json_mode and e.code in (400, 422):
                # some servers do not take response_format; ask for JSON in words only
                self.json_mode = False
                return self.ask(messages)
            raise
        text = data["choices"][0]["message"].get("content") or ""
        return text, data.get("usage", {})


class Fake:
    """Answers with the hand-made labels (static when there are none), to run the pipeline without a model."""

    name = "fake"

    def __init__(self):
        self.word = ""

    def ask(self, messages: list[dict]) -> tuple[str, dict]:
        p = HAND / f"{self.word}.json"
        return (p.read_text() if p.exists() else json.dumps({"word": self.word, "static": True})), {}


def parse(text: str) -> dict:
    """The JSON object in a reply, ignoring any thinking or code fences around it."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    start = text.find("{")
    if start < 0:
        raise ValueError("no JSON object in the reply")
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : i + 1])
    raise ValueError("the JSON object in the reply is not closed")


def check(spec: dict, table) -> list[str]:
    """What is wrong with a labelling, in words the model can act on."""
    errs: list[str] = []
    if spec.get("static"):
        return errs
    nums = {r.n: r for r in table}
    pieces = spec.get("pieces")
    if not isinstance(pieces, list) or not pieces:
        return ['"pieces" must be a non-empty list (or answer {"static": true})']
    seen: set[str] = set()
    for i, p in enumerate(pieces):
        if not isinstance(p, dict) or not p.get("id"):
            errs.append(f"piece {i} has no id")
            continue
        pid = p["id"]
        if pid in seen:
            errs.append(f"two pieces are called {pid}")
        if p.get("kind") not in KINDS or p.get("kind") in FACE:
            errs.append(f"{pid}: kind {p.get('kind')!r} is not one of the piece kinds")
        if i == 0 and p.get("parent"):
            errs.append(f"{pid}: the first piece is the root and has no parent")
        if i > 0 and p.get("parent") not in seen:
            errs.append(f"{pid}: parent {p.get('parent')!r} must be a piece listed before it")
        if p.get("from") and p["from"] not in seen:
            errs.append(f"{pid}: from {p['from']!r} must be a piece listed before it")
        if p.get("split") and p["split"] not in ("wrist", "legs", "sleeve"):
            errs.append(f"{pid}: split must be wrist, legs or sleeve")
        if p.get("cuts") and not p.get("keep"):
            errs.append(f"{pid}: cuts need a keep point")
        for n in p.get("regions", []):
            if n not in nums:
                errs.append(f"{pid}: there is no region {n}")
        if not p.get("regions") and not p.get("from") and not p.get("poly"):
            errs.append(f"{pid}: give it regions")
        seen.add(pid)
    face = spec.get("face") or {}
    for key in ("eyes", "pupils", "brows", "mouth"):
        v = face.get(key, [])
        for n in v if isinstance(v, list) else [v]:
            if n not in nums:
                errs.append(f"face {key}: there is no mark {n}")
    for n in spec.get("erase", []):
        if n not in nums:
            errs.append(f"erase: there is no region {n}")
    return errs


def rig_one(model, item: dict, out_labels: Path, out_rigs: Path, review: Path | None) -> dict:
    """Label and build one drawing. Returns a result record (status, seconds, pieces, error)."""
    word, stem = item["word"], item["stem"]
    t0 = time.time()
    rec: dict = {"word": word, "stem": stem, "kind": item["kind"], "model": model.name}
    try:
        rgba = load(stem)
        h, w = rgba.shape[:2]
        labels, table, _ = segment(rgba)
        if isinstance(model, Fake):
            model.word = stem
        from PIL import Image

        clean = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        clean.alpha_composite(Image.fromarray(rgba))
        ov = overlay(rgba, labels, table)
        if max(ov.size) > 1024:
            ov.thumbnail((1024, 1024))
        user = [
            {"type": "text", "text": f"The drawing is called \"{word}\" ({item['kind']}).\n\nRegions and marks:\n{region_table(table, w, h)}\n\n{examples()}\n\nAnswer for \"{stem}\" with the JSON only."},
            {"type": "image_url", "image_url": {"url": png_data_url(clean.convert("RGB"))}},
            {"type": "image_url", "image_url": {"url": png_data_url(ov.convert("RGB"))}},
        ]
        messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]
        spec = None
        tokens = 0
        for attempt in range(2):
            text, usage = model.ask(messages)
            tokens += int(usage.get("completion_tokens") or 0)
            problem = ""
            try:
                spec = parse(text)
                spec["word"] = stem
                errs = check(spec, table)
                if not errs and not spec.get("static"):
                    try:
                        rig = build(json.loads(json.dumps(spec)), review, out_rigs)
                        rec["pieces"] = len(rig["pieces"])
                    except (SystemExit, AssertionError, ValueError, KeyError, IndexError) as e:
                        errs = [f"building it failed: {e}"]
                problem = "; ".join(errs)
            except (ValueError, json.JSONDecodeError) as e:
                problem = f"that was not valid JSON ({e})"
            if not problem:
                break
            rec["first_error"] = problem
            messages += [{"role": "assistant", "content": text}, {"role": "user", "content": f"Problems: {problem}. Send the corrected JSON only."}]
            spec = None
        rec["tokens"] = tokens
        if spec is None:
            rec["status"] = "failed"
            rec["error"] = rec.get("first_error", "no answer")
        elif spec.get("static"):
            rec["status"] = "static"
        else:
            out_labels.mkdir(parents=True, exist_ok=True)
            (out_labels / f"{stem}.json").write_text(json.dumps(spec, indent=1))
            rec["status"] = "rigged"
    except Exception as e:  # a bad drawing or a dropped connection: note it and carry on
        rec["status"] = "failed"
        rec["error"] = f"{type(e).__name__}: {e}"
        if not isinstance(e, (urllib.error.URLError, TimeoutError)):
            rec["trace"] = traceback.format_exc(limit=3)
    rec["seconds"] = round(time.time() - t0, 1)
    return rec


def pick_pilot(items: list[dict], n: int, seed: int) -> list[dict]:
    """A spread of drawings: mostly people and animals (the hard ones), some objects, none from the hand set."""
    hand = {p.stem for p in HAND.glob("*.json")}
    rng = random.Random(seed)
    pool = [i for i in items if i["stem"] not in hand]
    share = {"human": 0.35, "humanoid": 0.1, "animal": 0.3, "object": 0.2, "other": 0.05}
    out: list[dict] = []
    for kind, f in share.items():
        group = [i for i in pool if i["kind"] == kind]
        rng.shuffle(group)
        out += group[: max(1, round(n * f))]
    return out[:n]


def load_results(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    out = {}
    for line in path.read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            out[r["stem"]] = r
    return out


def run_list(model, items: list[dict], out_labels: Path, out_rigs: Path, review: Path, results: Path, retry_failed: bool) -> list[dict]:
    done = load_results(results)
    results.parent.mkdir(parents=True, exist_ok=True)
    todo = [i for i in items if i["stem"] not in done or (retry_failed and done[i["stem"]]["status"] == "failed")]
    print(f"{model.name}: {len(items) - len(todo)} done before, {len(todo)} to go", flush=True)
    t_start = time.time()
    with results.open("a") as f:
        for k, item in enumerate(todo, 1):
            rec = rig_one(model, item, out_labels, out_rigs, review)
            done[item["stem"]] = rec
            f.write(json.dumps(rec) + "\n")
            f.flush()
            per = (time.time() - t_start) / k
            left = per * (len(todo) - k)
            print(f"[{k}/{len(todo)}] {item['stem']}: {rec['status']} {rec.get('pieces', '')} in {rec['seconds']}s"
                  f"{'  (' + rec['error'][:80] + ')' if rec.get('error') else ''}  ~{left / 3600:.1f}h left", flush=True)
            if rec["status"] == "failed" and "Connection refused" in rec.get("error", ""):
                sys.exit(f"cannot reach the model server at {getattr(model, 'url', '?')}: is it running?")
    return [done[i["stem"]] for i in items if i["stem"] in done]


def stats(recs: list[dict], total: int) -> dict:
    n = len(recs) or 1
    secs = [r["seconds"] for r in recs]
    rigged = sum(r["status"] == "rigged" for r in recs)
    static = sum(r["status"] == "static" for r in recs)
    failed = sum(r["status"] == "failed" for r in recs)
    mean = sum(secs) / n
    return {"n": len(recs), "rigged": rigged, "static": static, "failed": failed, "fixed_on_retry": sum(1 for r in recs if r.get("first_error") and r["status"] != "failed"),
            "mean_s": round(mean, 1), "median_s": round(float(np.median(secs)) if secs else 0, 1), "full_set_hours": round(mean * total / 3600, 1)}


def img_tag(path: Path, base: Path) -> str:
    if not path.exists():
        return '<div class="none">no rig</div>'
    return f'<img loading="lazy" src="{html.escape(str(path.relative_to(base)))}">'


PAGE = """<!doctype html><meta charset="utf-8"><title>{title}</title>
<style>body{{font:14px system-ui,sans-serif;margin:16px;background:#faf8f2;color:#222}}table{{border-collapse:collapse}}
td,th{{border:1px solid #ddd;padding:6px;vertical-align:top;background:#fff}}img{{max-width:300px;max-height:300px}}
.none{{width:200px;height:120px;display:flex;align-items:center;justify-content:center;color:#999}}
.failed{{color:#b00}}.static{{color:#777}}.rigged{{color:#070}}code{{font-size:12px}}h1{{font-size:20px}}
.stats td{{min-width:90px}}small{{color:#666}}</style><h1>{title}</h1>{body}"""


def pilot_sheet(root: Path, models: list[str], items: list[dict], recs: dict[str, dict[str, dict]], total: int) -> Path:
    rows = []
    head = "".join(f"<th>{html.escape(m)}</th>" for m in models)
    srows = "".join(
        f"<tr><td>{html.escape(m)}</td>" + "".join(f"<td>{v}</td>" for v in stats(list(recs[m].values()), total).values()) + "</tr>" for m in models
    )
    stat_head = "".join(f"<th>{k}</th>" for k in ("drawings", "rigged", "static", "failed", "fixed on retry", "mean s", "median s", f"hours for all {total}"))
    for item in items:
        sprite = os.path.relpath(SPRITES / (item["stem"] + ".webp"), root)
        cells = [f'<td><b>{html.escape(item["word"])}</b><br><small>{item["kind"]}</small><br><img loading="lazy" src="{html.escape(sprite)}"></td>']
        for m in models:
            r = recs[m].get(item["stem"], {})
            st = r.get("status", "-")
            note = html.escape(r.get("error", "")[:200])
            cells.append(f'<td><span class="{st}">{st}</span> <small>{r.get("pieces", "")} pieces, {r.get("seconds", "?")}s</small><br>{img_tag(root / safe(m) / "review" / (item["stem"] + "-rig.png"), root)}<br><small>{note}</small></td>')
        rows.append("<tr>" + "".join(cells) + "</tr>")
    body = (f"<p>Each piece is tinted its own colour, joints are red dots, cut lines red. Pick the model whose rigs look right more often; "
            f"its speed here times the {total} drawings in scope is the last column.</p>"
            f'<table class="stats"><tr><th>model</th>{stat_head}</tr>{srows}</table><br>'
            f"<table><tr><th>drawing</th>{head}</tr>{''.join(rows)}</table>")
    out = root / "index.html"
    out.write_text(PAGE.format(title="Rig pilot", body=body))
    return out


def review_sheet(review: Path, recs: list[dict]) -> Path:
    order = {"failed": 0, "rigged": 1, "static": 2}
    rows = []
    for r in sorted(recs, key=lambda r: (order.get(r["status"], 3), r["stem"])):
        pic = img_tag(review / (r["stem"] + "-rig.png"), review) if r["status"] == "rigged" else ""
        rows.append(f'<tr><td><b>{html.escape(r["word"])}</b><br><small>{r["kind"]}</small></td><td class="{r["status"]}">{r["status"]}<br><small>{html.escape(r.get("error", "")[:300])}</small></td><td>{pic}</td></tr>')
    review.mkdir(parents=True, exist_ok=True)
    s = stats(recs, len(recs))
    body = f"<p>{s['rigged']} rigged, {s['static']} static, {s['failed']} failed; {s['mean_s']}s a drawing. Fix one by editing words_and_images/rig/auto_labels/&lt;word&gt;.json and running build_rig.py on it.</p><table>{''.join(rows)}</table>"
    out = review / "index.html"
    out.write_text(PAGE.format(title="Rig review", body=body))
    return out


def safe(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", name)


def scope(items: list[dict], kinds: str, words: list[str] | None) -> list[dict]:
    if words:
        want = {w.replace(" ", "_") for w in words}
        return [i for i in items if i["stem"] in want or i["word"] in words]
    allowed = set(kinds.split(","))
    return [i for i in items if i["kind"] in allowed]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("pilot", "run"):
        p = sub.add_parser(name)
        p.add_argument("--base-url", default="http://localhost:11434/v1")
        p.add_argument("--kinds", default="human,humanoid,animal,object,other", help="which kinds of drawing are in scope")
        p.add_argument("--words", nargs="*", help="only these drawings")
        p.add_argument("--fake", action="store_true", help="answer with the hand-made labels instead of a model")
        p.add_argument("--timeout", type=float, default=600)
        if name == "pilot":
            p.add_argument("--models", nargs="+", default=["qwen3-vl:30b", "qwen3-vl:32b"])
            p.add_argument("--n", type=int, default=40)
            p.add_argument("--seed", type=int, default=7)
            p.add_argument("--out", type=Path, default=HERE / "pilot")
        else:
            p.add_argument("--model", default="qwen3-vl:30b")
            p.add_argument("--limit", type=int, default=0, help="stop after this many (0 = all)")
            p.add_argument("--retry-failed", action="store_true")
    args = ap.parse_args()
    items = scope(manifest(), args.kinds, args.words)

    if args.cmd == "pilot":
        chosen = items if args.words else pick_pilot(items, args.n, args.seed)
        if args.fake:
            # the fake model only knows the hand-made drawings
            hand = {p.stem for p in HAND.glob("*.json")}
            chosen = [i for i in manifest() if i["stem"] in hand][: args.n]
        recs: dict[str, dict[str, dict]] = {}
        for m in args.models:
            model = Fake() if args.fake else Model(m, args.base_url, args.timeout)
            if args.fake:
                model.name = m
            root = args.out / safe(m)
            got = run_list(model, chosen, root / "labels", root / "rigs", root / "review", root / "results.jsonl", retry_failed=False)
            recs[m] = {r["stem"]: r for r in got}
            print(json.dumps({m: stats(got, len(items))}), flush=True)
        sheet = pilot_sheet(args.out, args.models, chosen, recs, len(items))
        print(f"\nPilot sheet: {sheet}")
        return

    model = Fake() if args.fake else Model(args.model, args.base_url, args.timeout)
    hand = {p.stem for p in HAND.glob("*.json")}
    todo = [i for i in items if i["stem"] not in hand]
    if args.limit:
        todo = todo[: args.limit]
    review = HERE / "review"
    got = run_list(model, todo, AUTO, RIGS, review, HERE / "auto_results.jsonl", args.retry_failed)
    write_index()
    sheet = review_sheet(review, got)
    print(json.dumps(stats(got, len(todo))))
    print(f"\nReview sheet: {sheet}\nRigs are in {RIGS}; commit assets/rigs and words_and_images/rig/auto_labels to ship them.")


if __name__ == "__main__":
    main()
