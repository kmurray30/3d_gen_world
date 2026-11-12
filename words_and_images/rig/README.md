# Rigging the drawings (paper puppets)

A rig says how a drawing comes apart: which pixels are the head, each arm and hand, the legs, a tail, a hat, a
car's wheels; where each piece turns; and which ink marks are the eyes, pupils, brows and mouth. The game cuts
the drawing into those pieces in the browser and animates them (idle life, walking, gestures, expressions,
pieces coming off). A drawing without a rig still works: it moves as one card.

Each rig is one small JSON file in `assets/rigs/` (about 8 KB, with each piece's exact pixel mask) plus the
labelling that made it. All the cutting happens here, offline: the game only stamps the drawing through the
masks, so it never reads pixels back from a canvas (Safari and other privacy-minded browsers add noise to such
reads, which would scatter pixels across pieces). The game only asks for the drawings listed in `assets/rigs/index.json`.

| file | what it does |
| --- | --- |
| `segment.py` | numbers a drawing's regions (paint between outlines) and ink marks on an overlay with 0-1000 rulers |
| `build_rig.py` | turns a labelling (`labels/<word>.json`) into the rig with its piece masks, plus a review picture |
| `labels/` | the 20 hand-made labellings of the starter set (they always win over automatic ones) |
| `auto_rig.py` | labels drawings with a vision model on your own machine, checks and builds them |
| `auto_labels/` | the labellings `auto_rig.py` made (edit one and rebuild it to fix a rig by hand) |

```
pip install -r words_and_images/requirements.txt      # numpy, scipy and Pillow are what the rig tools need
```

## Rigging everything on a Mac with a local model

This needs no API key and no money, only time. It talks to any OpenAI-compatible server; Ollama is the
simplest.

### 1. Install a server and the two pilot models

```
brew install ollama
ollama serve &                       # or open the Ollama app
ollama pull qwen3-vl:30b             # "reasonable": Qwen3-VL 30B-A3B, about 20 GB
ollama pull qwen3-vl:32b             # "best" dense model, about 21 GB
```

Tags change now and then: if a pull fails, look the model up on ollama.com and use the tag shown there.
LM Studio works too (load the model, start its server, pass `--base-url http://localhost:1234/v1` and the
model name LM Studio shows). With 96 GB of unified memory either model fits with lots of room; a 72B model
(`qwen2.5vl:72b`, about 49 GB at 4-bit) fits as well if you want to try a third.

### 2. Pilot: 40 drawings on both models

```
caffeinate -i python3 words_and_images/rig/auto_rig.py pilot --models qwen3-vl:30b qwen3-vl:32b
open words_and_images/rig/pilot/index.html
```

The sheet shows each drawing next to both models' rigs (every piece tinted its own colour, joints as red dots,
cut lines in red), how many were rigged, left static or failed, the seconds per drawing, and what that speed
means for the whole set. Pick the model whose rigs look right more often; if both look about the same, take
the faster one. Running it again skips what is done; delete `pilot/` to start over.

### 2b. The village first: see it in the game

`village_words.txt` lists the 26 drawings villages use (people, animals, the scarecrow, flowers, crates,
trees; `scripts/village-sprites.ts` makes it). Compare both models on just those, with the hand-made rigs
beside them for reference, then put the one you like into the game and walk round a village:

```
caffeinate -i python3 words_and_images/rig/auto_rig.py pilot --models qwen3-vl:30b qwen3-vl:32b \
  --words-file words_and_images/rig/village_words.txt --out words_and_images/rig/pilot-village
open words_and_images/rig/pilot-village/index.html
python3 words_and_images/rig/auto_rig.py run --model qwen3-vl:30b --words-file words_and_images/rig/village_words.txt --redo-hand
npm run build && node dist/server/index.js     # then open http://localhost:8787/?preset=village
```

`--redo-hand` lets the model rig the 12 hand-made ones too (over their hand rigs), so the village shows the
model's work on people and animals. To put the hand-made rigs back:
`python3 words_and_images/rig/build_rig.py words_and_images/rig/labels/*.json` (or `git checkout assets/rigs`).

### 3. The full run

```
caffeinate -i python3 words_and_images/rig/auto_rig.py run --model qwen3-vl:30b
open words_and_images/rig/review/index.html
```

It prints progress and an estimate of the time left, and can be stopped and started again at any time
(`--retry-failed` gives the failures another go). `--kinds human,humanoid,animal` does people and animals
first; `--words cat robot` does just those; `--limit 50` stops after 50.

Rough times on a 96 GB M-series Mac (the pilot measures yours):

| model | a person or animal | an object | all 3,710 drawings |
| --- | --- | --- | --- |
| Qwen3-VL 30B-A3B (reasonable) | 10-20 s | 3-6 s | about 6-10 hours |
| Qwen3-VL 32B dense (best) | 40-70 s | 10-20 s | about 1-1.5 days |
| Qwen2.5-VL 72B | 60-120 s | 15-30 s | about 2 days |
| Qwen3-VL 8B (fast) | 5-8 s | 2-3 s | about 2-4 hours, more to fix by hand |

Objects go faster because most answer "nothing here moves" in a few words.

### 4. Check, fix, ship

The review sheet lists failures first. To fix a rig, edit `auto_labels/<word>.json` (look at the numbers with
`python3 words_and_images/rig/segment.py <word> --out /tmp/seg`) and rebuild it:

```
python3 words_and_images/rig/build_rig.py words_and_images/rig/auto_labels/<word>.json --review /tmp/review
```

Moving a labelling into `labels/` makes it a hand-made one that later runs leave alone. To ship, commit
`assets/rigs/` and `words_and_images/rig/auto_labels/`; the game picks the new rigs up on its next deploy.

`--fake` runs the whole pipeline with the hand-made labels standing in for a model, to check it works before
you download anything.

## The labelling format

```json
{"word": "boy", "view": "front",
 "pieces": [
  {"id": "body", "kind": "body", "regions": [1, 9]},
  {"id": "head", "kind": "head", "parent": "body", "regions": [3, 4]},
  {"id": "arm_l", "kind": "arm", "side": "l", "parent": "body", "regions": [5]},
  {"id": "hand_l", "kind": "hand", "side": "l", "parent": "arm_l", "from": "arm_l", "split": "wrist"},
  {"id": "leg_l", "kind": "leg", "side": "l", "parent": "body", "regions": [2], "split": "legs"}
 ],
 "face": {"eyes": [14, 15], "brows": [12, 13], "mouth": 17}}
```

Pieces come in order, each naming a parent listed before it. `regions` are numbers from the overlay; `from`
takes another piece's pixels; `split` finds a common cut by itself (`wrist`, `legs`, `sleeve`); `cuts` and
`keep` cut with straight lines in 0-1000 coordinates; `poly` lassoes a piece that shares regions (with
`claim_ink` for black tyres); `pivot` and `z` override the joint and draw order; `detach` names what a piece
becomes when it comes off. `face` lists the ink marks that are eyes, pupils, brows and the mouth; `erase`
drops background regions. `{"word": "rock", "static": true}` means nothing moves.
