/**
 * Worked examples for catalog authors (not part of the catalog). Each shows one way of building a thing:
 * plain solids, rods between points, mirrored pairs, repeats, a person from the accessory library, an animal from
 * a kit with extras, labels, named moving parts.
 */
import { e, type CatalogEntry } from './types';
import { around, m } from '../dsl';
import { ani, beast, body, face, hat, held, wear, who } from '../accessories';
import { bird, dragon } from '../kit';
import { bug, fish, snake } from '../creatures';

export const EXAMPLES: CatalogEntry[] = [
  // a kitchen thing from four solids: body, lid, knob, spout as a rod, handle as a ring turned sideways
  e('teapot', 'kitchen', 'teaware', () =>
    m('teapot')
      .ball([0.24, 0.18, 0.24], [0, 0.1, 0], { color: 'white' })
      .cyl([0.12, 0.03, 0.12], [0, 0.19, 0], { color: 'white', name: 'lid' })
      .ball(0.035, [0, 0.215, 0], { color: 'blue', parent: 'lid' })
      .rod([0.1, 0.09, 0], [0.19, 0.17, 0], 0.03, 'white')
      .torus([0.11, 0.11, 0.025], [-0.13, 0.11, 0], { color: 'white', rot: [0, 90, 0] })
      .done(),
  ),
  // food: a cone turned upside down and a tuft of leaves
  e('carrot', 'food', 'vegetables', () =>
    m('carrot')
      .cone([0.05, 0.2, 0.05], [0, 0.1, 0], { color: 'orange', rot: [180, 0, 0] })
      .rod([0, 0.2, 0], [-0.02, 0.27, 0], 0.012, 'leaf')
      .rod([0, 0.2, 0], [0.02, 0.28, 0.01], 0.012, 'leaf')
      .rod([0, 0.2, 0], [0, 0.29, -0.015], 0.012, 'leaf')
      .done(),
  ),
  e('banana', 'food', 'fruit', () =>
    m('banana')
      .rod([-0.09, 0.05, 0], [0, 0.02, 0], 0.04, 'banana')
      .rod([0, 0.02, 0], [0.09, 0.06, 0], 0.04, 'banana')
      .ball(0.018, [0.1, 0.07, 0], { color: 'darkbrown' })
      .done(),
  ),
  // a vehicle: body, cabin, four wheels from a mirrored pair loop, lights
  e('car', 'garage', 'cars', () =>
    m('car', { view: 'side' })
      .box([1.7, 0.55, 3.9], [0, 0.6, 0], { color: 'red', round: 0.5 })
      .box([1.5, 0.5, 2.0], [0, 1.08, -0.2], { color: 'red', round: 0.5 })
      .box([1.52, 0.36, 1.6], [0, 1.1, -0.2], { color: 'glass', round: 0.4 })
      .torus([0.62, 0.62, 0.24], [0.8, 0.31, 1.25], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 })
      .torus([0.62, 0.62, 0.24], [-0.8, 0.31, 1.25], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 })
      .torus([0.62, 0.62, 0.24], [0.8, 0.31, -1.25], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 })
      .torus([0.62, 0.62, 0.24], [-0.8, 0.31, -1.25], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 })
      .ball([0.25, 0.15, 0.06], [0.55, 0.65, 1.95], { color: 'yellow', glow: true })
      .ball([0.25, 0.15, 0.06], [-0.55, 0.65, 1.95], { color: 'yellow', glow: true })
      .done(),
  ),
  // furniture with legs as sticks
  e('chair', 'home', 'seating', () => {
    const c = m('chair').box([0.46, 0.06, 0.44], [0, 0.45, 0], { color: 'wood' }).box([0.46, 0.5, 0.05], [0, 0.72, -0.2], { color: 'wood' });
    for (const [x, z] of [[0.19, 0.18], [-0.19, 0.18], [0.19, -0.18], [-0.19, -0.18]]) c.stick([x, 0, z], [x, 0.43, z], 0.04, 'darkwood');
    return c.done();
  }),
  // an instrument: body balls, neck box, head, strings as thin noInk sticks, sound hole
  e('guitar', 'music', 'strings', () =>
    m('guitar')
      .ball([0.36, 0.3, 0.1], [0, 0.17, 0], { color: 'wood' })
      .ball([0.28, 0.24, 0.1], [0, 0.4, 0], { color: 'wood' })
      .box([0.06, 0.45, 0.04], [0, 0.73, 0], { color: 'darkwood' })
      .box([0.09, 0.12, 0.04], [0, 1.0, 0], { color: 'darkwood' })
      .cyl([0.08, 0.01, 0.08], [0, 0.32, 0.052], { color: 'black', rot: [90, 0, 0] })
      .done(),
  ),
  // a person: one line from the accessory library
  e('pirate', 'town', 'sailors', () => who('pirate', { top: 'white', bottom: 'black', shoes: 'black', beard: 'black', acc: [hat('pirate'), face('eyepatch'), wear('sash', 'red'), held('sword')] })),
  // an animal from the four-legged kit plus extras (spots, a long neck)
  e('giraffe', 'wild', 'savanna', () =>
    beast('giraffe', { color: '#e8b45a', body: [1.6, 0.9, 0.7], bodyShape: 'capsule', legL: 1.6, legW: 0.14, hoof: 'darkbrown', neckL: 1.9, neckLean: 18, neckW: 0.25, head: [0.55, 0.3, 0.26], snout: { len: 0.2, h: 0.18, w: 0.18, color: '#d9a35f' }, ears: 'side', earSize: 0.16, tail: 'tuft', acc: [ani.spots('#8a5a2b', 10), ani.horns('#8a5a2b', 'goat')] }),
  ),
  e('goldfish', 'sea', 'pond fish', () => fish('goldfish', { length: 0.18, color: 'orange', fin: '#f6b04a', shape: 'round' })),
  e('bee', 'bugs', 'flying insects', () => bug('bee', { length: 0.02, color: 'yellow', stripes: 'black', wings: 'clear' })),
  e('cobra', 'wild', 'reptiles', () => snake('cobra', { length: 1.8, color: '#8a6a3a', belly: 'cream', hood: true })),
  // a big round thing in the sky district, with a ring and a glowing label-free surface
  e('saturn', 'sky', 'planets', () =>
    m('saturn')
      .ball(2, [0, 1.5, 0], { color: '#e8cf8a' })
      .torus([3.6, 3.6, 0.08], [0, 1.5, 0], { color: '#c9a86a', rot: [80, 0, 15], tube: 0.18 })
      .done(),
  ),
  // letters, numbers and signs are label cards on a stand
  e('j (letter)', 'ideas', 'letters', () => m('j (letter)').label('J', [0.5, 0.6], [0, 0.55, 0], { color: 'blue' }).box([0.3, 0.25, 0.2], [0, 0.125, 0], { color: 'wood' }).done()),
  // birds, dragons: kits with colours
  e('parrot', 'aviary', 'tropical birds', () => bird('parrot', { height: 0.4, color: 'red', wing: 'blue', beak: 'cream', legs: 'gray', tail: ['blue', 'yellow', 'red'] })),
  e('wyvern', 'fantasy', 'dragons', () => dragon('wyvern', { size: 1.6, scales: 'purple', belly: 'pink', wing: 'magenta', spikes: 'gold', horns: 'cream' })),
  // person with wings (angel) and a halo
  e('angel', 'fantasy', 'spirits', () => who('angel', { top: 'white', bottom: 'white', skirt: 'white', long: true, hair: 'gold', style: 'long', acc: [hat('halo'), body('angelwings')] })),
];

void around;
