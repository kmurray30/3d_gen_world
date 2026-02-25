"""Shared word/tag data structures for process_words and map_words."""

from dataclasses import dataclass


@dataclass
class WordEntry:
    word: str
    file: str
    type: str
    height_cm: float
    tags: list[str]


@dataclass
class WordMatches:
    is_primary: bool
    words: list[str]
