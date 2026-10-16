#!/usr/bin/env python3
"""
Generate the new (missing) sprites end to end. Run from anywhere:

    python3 words_and_images/make_gap_sprites.py                    # the 14 priority words (words_priority.csv)
    python3 words_and_images/make_gap_sprites.py --words words_gap.csv   # all 36

It runs your existing scripts in order and prints each command before running it:
  1. generate_images.py   draw the words      -> generated_images/gap
  2. vectorize_images.py  remove backgrounds  -> processed_images/gap
  3. optimize_images.py   PNG -> WebP         -> ../assets/sprites/{512,256}
  4. build_manifest.py    rebuild ../assets/manifest.json
Then commit and push `assets/`. Needs the image-model setup (pip install -r requirements.txt) and Pillow.
"""
import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def run(*args: str) -> None:
    print("\n$ python3 " + " ".join(args), flush=True)
    subprocess.run([sys.executable, *args], cwd=HERE, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate, clean and convert the missing sprites.")
    parser.add_argument("--words", default="words_priority.csv", help="word,type CSV (default: words_priority.csv)")
    args = parser.parse_args()

    run("generate_images.py", "--config", "gap", "--words", args.words)
    run("vectorize_images.py", "generated_images/gap")
    run("optimize_images.py", "processed_images/gap")
    run("build_manifest.py", "--no-images-ok")
    print("\nDone. Publish with:\n  git add assets && git commit -m 'Add gap sprites' && git push")


if __name__ == "__main__":
    main()
