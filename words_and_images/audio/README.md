# Sounds and music

The game plays cues: footsteps by surface, doors and windows, animal calls, landings, effects, the command
box, ambience loops and music by time of day. Every cue is listed in `sources.json` with where its sound comes
from. All of them are CC0 (public domain), so the files can live in the repo and need no credit line.

People's voices need no files: they are generated babble, one syllable a word, in each character's own voice.
Everything else stays silent until it has been fetched.

| file | what it does |
| --- | --- |
| `sources.json` | every cue, its level in the mix, and its source: Kenney pack files, a Freesound search (CC0 only), a URL or a local file |
| `fetch_audio.py` | downloads and processes everything into `assets/audio/` (sounds, `manifest.json`, `CREDITS.md`, a listening page) |

## Fetching

```
brew install ffmpeg                       # trims, levels and makes mp3s every browser plays
export FREESOUND_API_KEY=...              # free: https://freesound.org/apiv2/apply ("API key", not OAuth)
python3 words_and_images/audio/fetch_audio.py
open assets/audio/index.html              # listen to everything
```

Kenney's packs need no key. The script keeps cues it has already fetched, so it can run again after an error.
`--only animal.cat music.night --force` fetches just those again. It takes a few minutes and comes to about
10 to 20 MB, mostly music.

## Choosing better sounds

Freesound searches take the best-rated CC0 matches. Most are fine; some will not be. To change a cue:

- Edit its query in `sources.json` (and its duration range, or `"exclude": ["word"]` to skip matching names)
  and fetch it again with `--only <cue> --force`.
- Or point it at a sound you picked: `{"url": "https://cdn.freesound.org/previews/...-hq.mp3", "author": "...",
  "page": "https://freesound.org/s/123/", "gain": 0.5}`. A CC0 track from OpenGameArt works the same way.
- Or a file of your own: `{"file": "my_sounds/meow.wav", "author": "me"}`.

Music deserves a listen: the four tracks (`music.dawn`, `music.day`, `music.sunset`, `music.night`) cross-fade
with the time of day. CC0 music worth trying on OpenGameArt includes the collections by Juhani Junkala and
Tallbeard Studios.

## Shipping

Commit `assets/audio/` (the sounds, `manifest.json`, `CREDITS.md` and `index.html`). The game loads
`/audio/manifest.json` on start, so new sounds go live with the next deploy, and the listening page is at
`/audio/index.html` on the site.
