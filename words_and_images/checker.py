#!/usr/bin/env python3
"""
Check consistency between words_processed.json and processed_images/local_klein/.

Reports:
- Paths in words_processed that don't point to existing files (orphaned references)
- Files in local_klein that have no entry in words_processed (unreferenced files)

Example:
    python words_and_images/checker.py
"""

import json
from pathlib import Path

# Paths relative to this script
SCRIPT_DIR = Path(__file__).resolve().parent
WORDS_PROCESSED = SCRIPT_DIR / "words_processed.json"
IMAGES_DIR = SCRIPT_DIR / "processed_images" / "local_klein"


def main() -> None:
    # Load words_processed.json
    with open(WORDS_PROCESSED, encoding="utf-8") as file:
        entries = json.load(file)

    # Collect all file paths referenced in words_processed
    referenced_files: set[str] = set()
    for entry in entries:
        file_path = entry.get("file")
        if file_path:
            referenced_files.add(file_path)

    # Check which referenced paths don't exist
    missing_paths: list[str] = []
    for file_path in sorted(referenced_files):
        full_path = IMAGES_DIR / file_path
        if not full_path.is_file():
            missing_paths.append(file_path)

    # Collect all actual files in local_klein
    if not IMAGES_DIR.is_dir():
        print(f"ERROR: Images directory does not exist: {IMAGES_DIR}")
        return

    actual_files: set[str] = {path.name for path in IMAGES_DIR.iterdir() if path.is_file()}

    # Files that exist but have no entry pointing to them
    unreferenced_files = sorted(actual_files - referenced_files)

    # Report
    print("=== Paths in words_processed that don't point to existing files ===\n")
    if missing_paths:
        for path in missing_paths:
            print(f"  {path}")
        print(f"\nTotal: {len(missing_paths)} orphaned reference(s)")
    else:
        print("  (none)")

    print("\n=== Files in local_klein with no entry in words_processed ===\n")
    if unreferenced_files:
        for file_name in unreferenced_files:
            print(f"  {file_name}")
        print(f"\nTotal: {len(unreferenced_files)} unreferenced file(s)")
    else:
        print("  (none)")


if __name__ == "__main__":
    main()
