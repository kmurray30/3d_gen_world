/**
 * Worked examples for catalog authors (not part of the catalog). Each is a real-size thing a person would
 * recognise at a glance, with crisp or soft edges chosen per part, named moving parts, sockets where other things
 * go, and an act: what it does when clicked. Copy the patterns.
 *
 *   npx tsx scripts/preview-catalog.ts examples 0 20 /tmp/ex.png     (each beside a 1.7 m person)
 *   npx tsx scripts/preview-act.ts examples toaster /tmp/toaster.png  (its act, frame by frame)
 */
import { e, x, type CatalogEntry } from './types';
import { A, m, withAct, withParts, withSockets } from '../dsl';
import { beast, hat, held, who } from '../accessories';
import { fish } from '../creatures';

export const EXAMPLES: CatalogEntry[] = [
  // A machine with a mover, two sockets and a setup: bread goes in, toast comes out, then burnt toast, then
  // fresh bread again. Sharp edges: it is pressed metal. Things in a 'slot' socket sink most of the way in.
  e('toaster', 'kitchen', 'appliances', () =>
    m('toaster', { edge: 'sharp' })
      .box([0.28, 0.19, 0.17], [0, 0.105, 0], { color: 'silver', round: 0.35, name: 'body' })
      .box([0.2, 0.012, 0.03], [0, 0.205, 0.035], { color: '#2a2726', parent: 'body' })
      .box([0.2, 0.012, 0.03], [0, 0.205, -0.035], { color: '#2a2726', parent: 'body' })
      .box([0.03, 0.022, 0.05], [0.155, 0.16, 0], { color: 'black', name: 'lever', parent: 'body', mover: { kind: 'slide', axis: 'y', amount: -0.08 } })
      .cyl([0.03, 0.02, 0.03], [0.15, 0.06, 0.05], { color: 'black', rot: [0, 0, 90], parent: 'body' })
      .box([0.24, 0.012, 0.13], [0, 0.006, 0], { color: '#3a3633', edge: 'soft' })
      .socket('slot1', [0, 0.2, 0.035], 'slot', { size: 0.13 })
      .socket('slot2', [0, 0.2, -0.035], 'slot', { size: 0.13 })
      .act({
        setup: [A.spawn('a', 'slice of bread'), A.spawn('b', 'slice of bread'), A.attach('a', 'self', 'slot1'), A.attach('b', 'self', 'slot2')],
        click: [
          [A.operate('lever', 'down'), A.say('Toasting...', 2.5), A.wait(3), A.par(A.morph('toast', 'self.slot1'), A.morph('toast', 'self.slot2')), A.operate('lever', 'up'), A.par(A.anim('hop', 1, 'self.slot1'), A.anim('hop', 1, 'self.slot2'), A.say('Ding!', 1.5))],
          [A.operate('lever', 'down'), A.wait(3), A.effect('smoke', { dur: 2.5 }), A.par(A.morph('burnt toast', 'self.slot1'), A.morph('burnt toast', 'self.slot2')), A.operate('lever', 'up'), A.say('Oops...', 1.5)],
          [A.par(A.remove('self.slot1', 'pop'), A.remove('self.slot2', 'pop')), A.spawn('a', 'slice of bread'), A.spawn('b', 'slice of bread'), A.attach('a', 'self', 'slot1'), A.attach('b', 'self', 'slot2'), A.say('Fresh bread!', 1.5)],
        ],
      })
      .done(),
  ),
  // Act-only props for the toaster (no vocabulary word fits): x() entries are never placed in the city.
  x('slice of bread', () =>
    m('slice of bread')
      .box([0.11, 0.11, 0.014], [0, 0.055, 0], { color: 'cream', round: 0.5 })
      .box([0.116, 0.116, 0.012], [0, 0.056, 0], { color: 'crust', round: 0.6 })
      .act({ click: [A.anim('hop')] })
      .done(),
  ),
  x('burnt toast', () =>
    m('burnt toast')
      .box([0.11, 0.11, 0.014], [0, 0.055, 0], { color: '#3a2a1e', round: 0.5 })
      .box([0.116, 0.116, 0.012], [0, 0.056, 0], { color: '#1e1612', round: 0.6 })
      .act({ click: [A.effect('smoke', { dur: 1.5 })] })
      .done(),
  ),

  // A vegetable with a piece cut off that can come away and go back: the slice is a `piece`, so it is not melted
  // into the yam and can detach cleanly.
  e('yam', 'food', 'vegetables', () =>
    m('yam')
      .loft([0.075, 0.07, 0.22], [0, 0.036, 0], [[0, 0.2, 0.2], [0.2, 0.85, 0.8], [0.6, 1, 1], [1, 0.85, 0.85]], { color: '#8a3f2e', name: 'body', rot: [0, 90, 0] })
      .cyl([0.06, 0.022, 0.058], [-0.124, 0.036, 0], { color: '#f0923b', rot: [0, 0, 90], name: 'slice', parent: 'body', piece: true })
      .cyl([0.064, 0.02, 0.062], [-0.124, 0.036, 0], { color: '#8a3f2e', rot: [0, 0, 90], parent: 'slice', noInk: true })
      .act({ click: [[A.detach('slice', 'bit')], [A.reattach('slice')]] })
      .done(),
  ),

  // A vehicle at its real size: a city bus 12 m long and 3.2 m tall, so a person reaches the window sill and
  // fits through the door. Profile view (nose to +z). Sharp body, soft tyres, all wheels roll (wheel* names), a
  // door that swings open on its hinge, glowing headlights, a seat socket for the driver.
  e('bus', 'garage', 'buses', () =>
    m('bus', { view: 'side', edge: 'sharp' })
      .box([2.55, 2.75, 12], [0, 1.8, 0], { color: '#e0473b', round: 0.08, name: 'body' })
      .box([2.57, 0.95, 9.4], [0, 2.35, -0.9], { color: '#2f3d52', parent: 'body' })
      .box([2.57, 0.12, 12.02], [0, 1.72, 0], { color: 'white', parent: 'body' })
      .box([2.3, 1.35, 0.06], [0, 2.25, 6.0], { color: '#2f3d52', parent: 'body' })
      .label('42 CITY CENTRE', [1.9, 0.3], [0, 3.0, 6.02], { color: '#1e1e1e', parent: 'body', depth: 0.03 })
      .box([0.06, 2.1, 1.15], [-1.29, 1.55, 4.75], { color: '#2f3d52', name: 'door', parent: 'body', pivot: [-1.29, 1.55, 5.32], mover: { kind: 'swing', axis: 'y', amount: -85 } })
      .box([2.6, 0.35, 0.25], [0, 0.6, 6.05], { color: '#3a3633', parent: 'body' })
      .box([2.6, 0.35, 0.25], [0, 0.6, -6.05], { color: '#3a3633', parent: 'body' })
      .ball([0.28, 0.22, 0.08], [0.95, 0.95, 6.03], { color: '#fff6c8', glow: true, parent: 'body' })
      .ball([0.28, 0.22, 0.08], [-0.95, 0.95, 6.03], { color: '#fff6c8', glow: true, parent: 'body' })
      .cyl([1.0, 0.32, 1.0], [1.12, 0.5, 4.0], { color: 'rubber', rot: [0, 0, 90], name: 'wheel1', edge: 'soft' })
      .cyl([1.0, 0.32, 1.0], [-1.12, 0.5, 4.0], { color: 'rubber', rot: [0, 0, 90], name: 'wheel2', edge: 'soft' })
      .cyl([1.0, 0.32, 1.0], [1.12, 0.5, -3.6], { color: 'rubber', rot: [0, 0, 90], name: 'wheel3', edge: 'soft' })
      .cyl([1.0, 0.32, 1.0], [-1.12, 0.5, -3.6], { color: 'rubber', rot: [0, 0, 90], name: 'wheel4', edge: 'soft' })
      .socket('seat', [0.7, 1.0, 5.0], 'seat')
      .act({
        click: [
          [A.operate('door', 'open'), A.say('All aboard!', 2), A.wait(2.5), A.operate('door', 'close')],
          [A.par(A.anim('shake'), A.say('Beep beep!', 1.5))],
        ],
      })
      .done(),
  ),

  // An aircraft from a loft: the fuselage swells from the tail to the cockpit and rounds off at the nose. Two
  // sharp wings with struts, a propeller that spins when the engine is on (a `spin` mover).
  e('biplane', 'garage', 'aircraft', () =>
    m('biplane', { view: 'side' })
      .loft([1.0, 1.2, 6.6], [0, 1.55, 0], [[0, 0.12, 0.3, 0.15], [0.35, 0.8, 0.85, 0.02], [0.8, 1, 1, 0], [0.95, 0.95, 0.95, 0], [1, 0.75, 0.8, 0]], { color: '#e0473b', name: 'fuselage' })
      .box([9, 0.12, 1.5], [0, 2.75, 1.2], { color: '#f6d24a', edge: 'sharp', round: 0.4 })
      .box([8.2, 0.12, 1.4], [0, 1.05, 1.3], { color: '#f6d24a', edge: 'sharp', round: 0.4 })
      .rod([2.8, 1.1, 1.3], [2.8, 2.7, 1.2], 0.06, 'darkwood')
      .rod([-2.8, 1.1, 1.3], [-2.8, 2.7, 1.2], 0.06, 'darkwood')
      .wedge([0.1, 1.1, 1.0], [0, 2.4, -2.9], { color: '#e0473b', rot: [0, 90, 0], apex: 0.4, edge: 'sharp' })
      .box([2.6, 0.08, 0.8], [0, 1.85, -2.95], { color: '#f6d24a', edge: 'sharp' })
      .dome([0.7, 0.35, 0.9], [0, 2.15, 0.3], { color: 'glass' })
      .ball(0.5, [0, 1.55, 3.32], { color: '#3a3633', name: 'hub' })
      .box([0.16, 2.2, 0.08], [0, 1.55, 3.45], { color: 'darkwood', name: 'propeller', pivot: [0, 1.55, 3.45], mover: { kind: 'spin', axis: 'z', amount: 900 }, edge: 'sharp' })
      .rod([0.55, 0.45, 1.6], [0.35, 1.0, 1.4], 0.06, 'gray')
      .rod([-0.55, 0.45, 1.6], [-0.35, 1.0, 1.4], 0.06, 'gray')
      .cyl([0.6, 0.14, 0.6], [0.6, 0.3, 1.6], { color: 'rubber', rot: [0, 0, 90], name: 'wheelL' })
      .cyl([0.6, 0.14, 0.6], [-0.6, 0.3, 1.6], { color: 'rubber', rot: [0, 0, 90], name: 'wheelR' })
      .act({ click: [[A.operate('propeller', 'on'), A.say('Vrrrrm!', 2)], [A.operate('propeller', 'off'), A.say('Phut phut...', 1.5)]] })
      .done(),
  ),

  // Furniture-sized appliance with doors on hinges and a socket inside: milk waits in it.
  e('refrigerator', 'kitchen', 'appliances', () =>
    m('refrigerator', { edge: 'sharp' })
      .box([0.75, 1.8, 0.68], [0, 0.92, 0], { color: 'white', round: 0.06, name: 'body' })
      .box([0.75, 0.55, 0.05], [0, 1.535, 0.365], { color: '#f2f2ee', round: 0.2, name: 'freezer', parent: 'body', pivot: [0.375, 1.535, 0.365], mover: { kind: 'swing', axis: 'y', amount: 110 } })
      .box([0.75, 1.18, 0.05], [0, 0.65, 0.365], { color: '#f2f2ee', round: 0.1, name: 'door', parent: 'body', pivot: [0.375, 0.65, 0.365], mover: { kind: 'swing', axis: 'y', amount: 110 } })
      .box([0.03, 0.3, 0.04], [-0.32, 1.4, 0.41], { color: 'silver', parent: 'freezer' })
      .box([0.03, 0.4, 0.04], [-0.32, 1.0, 0.41], { color: 'silver', parent: 'door' })
      .box([0.68, 0.06, 0.62], [0, 0.03, 0], { color: '#3a3633' })
      .socket('shelf', [0, 0.9, 0.05], 'inside', { size: 0.4 })
      .act({
        setup: [A.spawn('milk', 'milk'), A.attach('milk', 'self', 'shelf')],
        click: [
          [A.operate('door', 'open'), A.say('Brrr!', 1.5), A.wait(2.5), A.operate('door', 'close')],
          [A.operate('freezer', 'open'), A.effect('snow', { dur: 1.5 }), A.wait(2), A.operate('freezer', 'close')],
        ],
      })
      .done(),
  ),

  // A person: who() with a pose (forearms forward, holding the pan), and an act in steps: a gesture, a line that
  // fits it, and food that appears and goes again so clicks do not pile things up.
  e('chef', 'town', 'food service', () =>
    withAct(who('chef', { top: 'white', bottom: '#2a2726', shoes: 'black', pose: 'hold', acc: [hat('chef'), held('pan')] }), {
      click: [
        [A.par(A.anim('nod'), A.say('Order up!', 2)), A.spawn('dish', 'pancake', { rel: 'front', of: 'self', dist: 'close' }), A.wait(2.5), A.remove('dish', 'pop')],
        [A.par(A.anim('point'), A.say('Try the soup!', 2))],
      ],
    }),
  ),

  // An animal from a kit, with an act: a wag, and a game of fetch with a bone that goes away afterwards.
  e('dog', 'pets', 'dogs', () =>
    withAct(beast('dog', { color: 'tan', body: [0.62, 0.3, 0.26], legL: 0.3, legW: 0.07, neckL: 0.16, neckLean: 30, head: [0.2, 0.18, 0.16], snout: { len: 0.1, h: 0.08, w: 0.08 }, nose: 'black', ears: 'floppy', earSize: 0.09, tail: 'long', tailAngle: 40 }), {
      click: [
        [A.par(A.anim('wag', 2), A.say('Woof!', 1.5))],
        [A.spawn('bone', 'bone', { rel: 'front', of: 'self', dist: 'near' }), A.move('self', { rel: 'near', of: 'bone', dist: 'touch' }, { speed: 'run' }), A.say('Woof woof!', 1.5), A.remove('bone', 'pop')],
      ],
    }),
  ),

  // A lamp: the bulb is a `light` mover, so operating it switches the glow.
  e('lamp', 'home', 'lighting', () =>
    m('lamp')
      .cyl([0.2, 0.03, 0.2], [0, 0.015, 0], { color: '#3a3633', edge: 'sharp' })
      .rod([0, 0.03, 0], [0, 0.4, 0], 0.025, 'brass')
      .ball(0.08, [0, 0.42, 0], { color: '#fff6c8', glow: true, name: 'bulb', mover: { kind: 'light', on: true } })
      .cyl([0.3, 0.2, 0.3], [0, 0.46, 0], { color: 'cream', taper: 0.6 })
      .act({ click: [A.operate('bulb')] })
      .done(),
  ),

  // A boat from a loft cut in half: the hull. The boom swings across (a swing mover about y).
  e('sailboat', 'sea', 'boats', () =>
    m('sailboat', { view: 'side' })
      .loft([2.6, 1.4, 9], [0, 0.5, 0], [[0, 0.7, 0.8, 0.1], [0.3, 1, 1, 0], [0.75, 0.9, 1, 0], [1, 0.05, 1, 0.05]], { color: 'white', cut: 'bottom', boxy: 0.2, name: 'hull' })
      .box([2.3, 0.06, 7.8], [0, 0.98, -0.2], { color: 'lightwood', edge: 'sharp' })
      .stick([0, 1.0, 1.0], [0, 11.5, 1.0], 0.16, 'silver')
      .stick([0, 1.9, 0.9], [0, 1.9, -3.3], 0.1, 'silver', { name: 'boom', pivot: [0, 1.9, 1.0], mover: { kind: 'swing', axis: 'y', amount: 35 } })
      .wedge([0.04, 9.2, 4.2], [0, 6.5, -1.0], { color: 'white', rot: [0, 90, 0], apex: 0.5, parent: 'boom', edge: 'sharp' })
      .act({ click: [[A.operate('boom', 'out'), A.effect('water_spray', { dur: 1.5 })], [A.operate('boom', 'in')]] })
      .done(),
  ),

  // A fish from the kit; its act is a flip and a little splash.
  e('goldfish', 'sea', 'pond fish', () => withAct(fish('goldfish', { length: 0.18, color: 'orange', fin: '#f6b04a', shape: 'round' }), { click: [A.par(A.anim('spin'), A.effect('water_spray', { dur: 1 }))] })),

  // A kit figure given a socket and a mover after it is built (withSockets / withParts work on any figure).
  e('wheelbarrow', 'farm', 'farm things', () =>
    withAct(
      withSockets(
        withParts(
          m('wheelbarrow', { view: 'side' })
            .loft([0.62, 0.32, 0.85], [0, 0.6, -0.05], [[0, 0.75, 1, 0.1], [0.5, 1, 1, 0], [1, 0.8, 0.7, 0.05]], { color: '#4e8fd6', cut: 'bottom', boxy: 0.7, name: 'tray', edge: 'sharp' })
            .cyl([0.38, 0.08, 0.38], [0, 0.19, 0.55], { color: 'rubber', rot: [0, 0, 90], name: 'wheel' })
            .rod([0.22, 0.55, 0.3], [0.28, 0.75, -0.75], 0.035, 'darkwood')
            .rod([-0.22, 0.55, 0.3], [-0.28, 0.75, -0.75], 0.035, 'darkwood')
            .rod([0.2, 0.42, -0.25], [0.2, 0.02, -0.3], 0.03, 'darkwood')
            .rod([-0.2, 0.42, -0.25], [-0.2, 0.02, -0.3], 0.03, 'darkwood')
            .done(),
          ['wheel'],
          { edge: 'soft' },
        ),
        [{ name: 'tray', at: [0, 0.62, -0.05], kind: 'top', size: 0.5 }],
      ),
      { click: [A.par(A.pose('wheel', { rot: [360, 0, 0], dur: 1 }), A.say('Squeak!', 1))] },
    ),
  ),
];
