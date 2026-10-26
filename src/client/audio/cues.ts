/**
 * Which sound fits what just happened: an animal's call from its word, footsteps and landings from the surface,
 * a built thing's moving piece from its name, and the cue for each effect, exit and move. Pure, so it is tested.
 */
import type { Surface } from '../../shared/terrain/surface';

const ANIMALS: Array<[RegExp, string]> = [
  [/\b(cat|kitten|kitty|tabby|lynx)\b/, 'cat'],
  [/\b(dog|puppy|hound|poodle|terrier|retriever|bulldog|dalmatian|beagle|corgi|pug|husky|wolfhound)\b/, 'dog'],
  [/\b(cow|calf|bull|ox|bison|buffalo|yak)\b/, 'cow'],
  [/\b(sheep|lamb|ram)\b/, 'sheep'],
  [/\b(goat|kid goat)\b/, 'goat'],
  [/\b(pig|piglet|hog|boar)\b/, 'pig'],
  [/\b(horse|pony|foal|stallion|mare|zebra|unicorn)\b/, 'horse'],
  [/\b(donkey|mule)\b/, 'donkey'],
  [/\b(duck|duckling|goose|swan)\b/, 'duck'],
  [/\b(rooster|cockerel)\b/, 'rooster'],
  [/\b(chicken|hen|chick)\b/, 'chicken'],
  [/\b(owl)\b/, 'owl'],
  [/\b(seagull|gull|albatross|pelican)\b/, 'seagull'],
  [/\b(crow|raven|magpie)\b/, 'crow'],
  [/\b(parrot|macaw|cockatoo|toucan)\b/, 'parrot'],
  [/\b(turkey)\b/, 'turkey'],
  [/\b(frog|toad)\b/, 'frog'],
  [/\b(mouse|mice|rat|hamster|gerbil|squirrel|chipmunk|guinea pig)\b/, 'mouse'],
  [/\b(lion|tiger|leopard|cheetah|jaguar|panther|cougar)\b/, 'lion'],
  [/\b(bear|grizzly|panda|polar bear)\b/, 'bear'],
  [/\b(wolf|coyote|fox|jackal)\b/, 'wolf'],
  [/\b(elephant|mammoth)\b/, 'elephant'],
  [/\b(monkey|ape|chimp|chimpanzee|gorilla|orangutan|baboon|lemur)\b/, 'monkey'],
  [/\b(snake|cobra|python|viper|serpent|rattlesnake)\b/, 'snake'],
  [/\b(bee|wasp|hornet|fly|mosquito|bumblebee)\b/, 'bee'],
  [/\b(seal|sea lion|walrus)\b/, 'seal'],
  [/\b(dragon|dinosaur|t-rex|trex|monster|kraken|beast|yeti|godzilla)\b/, 'monster'],
  [/\b(bird|sparrow|robin|finch|canary|bluebird|songbird|pigeon|dove|budgie|hummingbird|blackbird|wren|tit)\b/, 'bird'],
];

/** The call an animal makes, from its word: a cue name, or null when nothing fits (it then stays quiet). */
export function animalCue(word: string): string | null {
  const w = word.toLowerCase().replace(/_/g, ' ');
  for (const [re, cue] of ANIMALS) if (re.test(w)) return `animal.${cue}`;
  return null;
}

/** A footstep on a surface. */
export function stepCue(s: Surface): string {
  switch (s) {
    case 'wood':
      return 'step.wood';
    case 'stone':
    case 'metal':
      return 'step.stone';
    case 'gravel':
      return 'step.gravel';
    case 'sand':
      return 'step.sand';
    case 'water':
      return 'step.water';
    default:
      return 'step.grass';
  }
}

/** Something landing: by how heavy it is and what it lands on. */
export function landCue(mass: string, s: Surface): string {
  if (s === 'water') return 'land.water';
  if (mass === 'heavy') return 'land.heavy';
  if (s === 'wood') return 'land.wood';
  if (s === 'metal') return 'land.metal';
  return mass === 'light' ? 'land.soft' : 'land.thud';
}

/**
 * A built thing's moving piece changing state (its state key and new value): the cue, or null. Mailbox doors
 * and flags are small metal; a bin's lid clangs; a well winds; lamps click; fountains gush when turned on.
 */
export function moverCue(gen: string, key: string, value: boolean): string | null {
  if (key === 'door_open' || /^open_door(_\d+)?$/.test(key)) {
    if (gen === 'mailbox') return 'metal.small';
    return value ? 'door.open' : 'door.close';
  }
  if (/^open_window_\d+$/.test(key)) return value ? 'window.open' : 'window.close';
  if (/^open_shutters_\d+$/.test(key)) return 'shutter';
  switch (key) {
    case 'open_flag':
      return 'metal.small';
    case 'open_lid':
      return 'lid';
    case 'open_bucket':
      return 'winch';
    case 'open_lamp':
      return 'switch';
    case 'open_water':
      return value ? 'switch' : 'water.on';
  }
  return key.startsWith('open_') ? 'door.open' : null;
}

/** One-shot effects. Looping ones (fire, rain, steam, spray) are ambience at their source instead. */
export function effectCue(name: string): string | null {
  switch (name) {
    case 'explosion':
      return 'fx.explosion';
    case 'sparkle':
      return 'fx.sparkle';
    case 'hearts':
      return 'fx.hearts';
    case 'dust':
      return 'fx.dust';
    case 'steam':
      return 'fx.steam';
    case 'water_spray':
      return 'fx.splash';
    default:
      return null;
  }
}

/** The loop a lasting effect makes where it is. */
export function effectLoop(name: string): string | null {
  switch (name) {
    case 'fire':
      return 'amb.fire';
    case 'rain':
      return 'amb.rain';
    case 'water_spray':
      return 'amb.fountain';
    case 'steam':
      return 'fx.steam';
    default:
      return null;
  }
}

/** How something leaves the world. Exploding is the explosion effect's sound. */
export function removeCue(how: string | undefined): string | null {
  switch (how) {
    case 'pop':
      return 'gone.pop';
    case 'sink':
      return 'gone.sink';
    case 'fly_away':
    case 'fade':
      return 'gone.whoosh';
    case 'explode':
      return null;
    default:
      return 'gone.pop';
  }
}

/** Whole-body moves and gestures with a sound of their own; voices (laughs, sobs, gasps) are babble. */
export function animCue(name: string): { cue: string; every?: number; delay?: number } | null {
  switch (name) {
    case 'hop':
    case 'bounce':
      return { cue: 'boing' };
    case 'wobble':
      return { cue: 'boing' };
    case 'spin':
      return { cue: 'whoosh' };
    case 'shake':
      return { cue: 'rattle' };
    case 'fall_over':
      return { cue: 'land.thud', delay: 0.45 };
    case 'clap':
      return { cue: 'clap', every: 0.32 };
    case 'flap':
      return { cue: 'flap' };
    case 'wave':
    case 'bow':
      return { cue: 'swish' };
    case 'apart':
      return { cue: 'paper' };
    default:
      return null;
  }
}

/** Gestures that are a voice's noise. */
export function animNoise(name: string): 'laugh' | 'sob' | 'gasp' | 'hum_yes' | 'hum_no' | 'huh' | null {
  switch (name) {
    case 'laugh':
      return 'laugh';
    case 'cry':
      return 'sob';
    case 'gasp':
      return 'gasp';
    case 'nod':
      return 'hum_yes';
    case 'shake_head':
      return 'hum_no';
    case 'shrug':
      return 'huh';
    default:
      return null;
  }
}
