/** Catalog chunk objects-04: the words in assign/objects-04.tsv. */
import { e, type CatalogEntry } from './types';
import { around, m, M } from '../dsl';
import { hat, held, who, wear } from '../accessories';

type V = [number, number, number];

/** A little building: walls, flat or gable roof, a door that opens, a row or two of windows and a sign. */
function house(key: string, o: { w: number; h: number; d: number; wall: string; roof?: string; gable?: number; sign: string; signC?: string; door?: string; win?: string; rows?: number }): M {
  const { w, h, d } = o;
  const fz = d / 2;
  const b = m(key).box([w, h, d], [0, h / 2, 0], { color: o.wall, round: 0.04 });
  if (o.gable) b.wedge([w + 0.4, o.gable, d + 0.4], [0, h + o.gable / 2, 0], { color: o.roof ?? 'darkred' });
  else b.box([w + 0.3, 0.3, d + 0.3], [0, h + 0.15, 0], { color: o.roof ?? 'gray', round: 0.1 });
  const dw = Math.min(1.2, w * 0.22), dh = Math.min(2.2, h * 0.5);
  b.box([dw, dh, 0.1], [0, dh / 2, fz + 0.04], { color: o.door ?? 'darkwood', name: 'door', pivot: [-dw / 2, dh / 2, fz + 0.04] });
  const wh = Math.min(1.4, h * 0.22);
  for (let r = 0; r < (o.rows ?? 1); r++) b.pair((s) => void b.box([w * 0.2, wh, 0.08], [s * w * 0.3, h * (0.38 + r * 0.27), fz + 0.03], { color: o.win ?? 'glass', round: 0.1 }));
  b.label(o.sign, [w * 0.7, Math.min(1, h * 0.15)], [0, h * 0.87, fz + 0.06], { color: o.signC ?? 'white' });
  return b;
}

/** A white key-cap tile for a symbol; draw the glyph on its front at z = 0.02. */
function tile(key: string, c = 'white'): M {
  return m(key).box([0.13, 0.13, 0.03], [0, 0.065, 0], { color: c, round: 0.25 });
}

/** A bottle standing at (x, z): body, shoulder, neck, cap, optional label band. */
function bottle(b: M, x: number, z: number, h: number, dia: number, color: string, cap: string, band?: string): M {
  const bh = h * 0.62;
  b.cyl([dia, bh, dia], [x, bh / 2, z], { color })
    .cyl([dia, h * 0.18, dia], [x, bh + h * 0.09, z], { color, taper: 0.4 })
    .cyl([dia * 0.4, h * 0.12, dia * 0.4], [x, h * 0.86, z], { color })
    .cyl([dia * 0.46, h * 0.08, dia * 0.46], [x, h * 0.96, z], { color: cap });
  if (band) b.cyl([dia * 1.03, bh * 0.5, dia * 1.03], [x, bh * 0.5, z], { color: band, noInk: true });
  return b;
}

/** A tree: trunk from the ground and a few crown blobs. */
function tree(key: string, o: { h: number; trunk?: string; crown: string; w?: number; fruit?: string; nf?: number; fs?: number }): M {
  const { h } = o, w = o.w ?? h * 0.6;
  const b = m(key).stick([0, 0, 0], [0, h * 0.55, 0], h * 0.07, o.trunk ?? 'bark');
  b.ball([w, h * 0.5, w], [0, h * 0.72, 0], { color: o.crown, name: 'top' })
    .ball([w * 0.6, h * 0.35, w * 0.6], [w * 0.32, h * 0.62, w * 0.1], { color: o.crown, parent: 'top' })
    .ball([w * 0.6, h * 0.35, w * 0.6], [-w * 0.32, h * 0.64, -w * 0.05], { color: o.crown, parent: 'top' });
  if (o.fruit) for (const [x, z] of around(o.nf ?? 7, w * 0.46, 0.4)) b.ball(o.fs ?? h * 0.05, [x, h * (0.6 + Math.abs((x * 7) % 0.12)), z + w * 0.12], { color: o.fruit, parent: 'top' });
  return b;
}

export const ENTRIES: CatalogEntry[] = [
  e('electric blanket', 'home', 'bedding', () => {
    const b = m('electric blanket');
    b.pair((s) => void b.rod([s * 0.62, 0, 0.36], [s * 0.62, 1.2, 0], 0.035, 'wood').rod([s * 0.62, 0, -0.36], [s * 0.62, 1.2, 0], 0.035, 'wood'));
    b.stick([-0.66, 1.2, 0], [0.66, 1.2, 0], 0.05, 'wood')
      .box([1.15, 0.9, 0.1], [0, 0.78, 0.16], { color: '#ef9a8a', rot: [-16, 0, 0], round: 0.6 })
      .box([1.15, 0.9, 0.1], [0, 0.78, -0.16], { color: '#ef9a8a', rot: [16, 0, 0], round: 0.6 })
      .each(4, (i) => void b.box([1.1, 0.025, 0.01], [0, 0.79 + (i - 1.5) * 0.2 * 0.961, 0.215 - (i - 1.5) * 0.2 * 0.276], { color: '#c95a52', rot: [-16, 0, 0], noInk: true }))
      .rod([0.45, 0.38, 0.27], [0.62, 0.04, 0.45], 0.02, 'white')
      .box([0.1, 0.16, 0.05], [0.72, 0.08, 0.46], { color: 'white' })
      .ball(0.03, [0.72, 0.12, 0.49], { color: 'orange', glow: true });
    return b.done();
  }),
  e('electric chair', 'armory', 'execution', () => {
    const b = m('electric chair');
    b.box([0.72, 0.12, 0.6], [0, 0.5, 0], { color: 'darkwood' })
      .box([0.72, 1.0, 0.12], [0, 1.0, -0.26], { color: 'darkwood' })
      .pair((s) => {
        b.box([0.1, 0.5, 0.1], [s * 0.31, 0.22, 0.24], { color: 'darkwood' }).box([0.1, 0.5, 0.1], [s * 0.31, 0.22, -0.24], { color: 'darkwood' });
        b.box([0.1, 0.3, 0.1], [s * 0.31, 0.7, 0.24], { color: 'darkwood' }).box([0.12, 0.08, 0.62], [s * 0.31, 0.88, 0], { color: 'darkwood' });
        b.box([0.14, 0.05, 0.08], [s * 0.31, 0.92, 0.1], { color: 'leather' }).box([0.14, 0.08, 0.08], [s * 0.31, 0.15, 0.3], { color: 'leather' });
      })
      .box([0.6, 0.08, 0.1], [0, 1.2, -0.18], { color: 'leather' })
      .stick([0, 1.5, -0.26], [0, 1.68, -0.26], 0.05, 'iron')
      .stick([0, 1.68, -0.26], [0, 1.68, -0.05], 0.05, 'iron')
      .ball([0.28, 0.16, 0.28], [0, 1.58, -0.05], { color: 'metal' })
      .rod([0.12, 1.6, -0.05], [0.42, 1.2, -0.4], 0.025, 'black')
      .box([0.2, 0.3, 0.12], [0.5, 1.05, -0.45], { color: 'gray' })
      .rod([0.5, 1.15, -0.38], [0.6, 1.28, -0.32], 0.03, 'red');
    return b.done();
  }),
  e('electric guitar', 'music', 'strings', () => {
    const b = m('electric guitar');
    b.ball([0.36, 0.26, 0.08], [0, 0.14, 0], { color: 'red' })
      .ball([0.27, 0.22, 0.08], [0, 0.31, 0], { color: 'red' })
      .ball([0.08, 0.18, 0.07], [0.1, 0.44, 0], { color: 'red', rot: [0, 0, -15] })
      .ball([0.07, 0.13, 0.07], [-0.09, 0.42, 0], { color: 'red', rot: [0, 0, 15] })
      .box([0.16, 0.24, 0.01], [0.03, 0.2, 0.036], { color: 'white', noInk: true, round: 0.6 })
      .box([0.08, 0.025, 0.012], [0, 0.27, 0.042], { color: 'black' })
      .box([0.08, 0.025, 0.012], [0, 0.18, 0.042], { color: 'black' })
      .box([0.08, 0.02, 0.012], [0, 0.09, 0.04], { color: 'silver' })
      .each(2, (i) => void b.cyl([0.025, 0.015, 0.025], [-0.1 + i * 0.04, 0.08, 0.04], { color: 'cream', rot: [90, 0, 0] }))
      .box([0.05, 0.5, 0.03], [0, 0.62, 0.005], { color: 'wood' })
      .box([0.075, 0.14, 0.02], [0.01, 0.94, 0], { color: 'darkwood', rot: [0, 0, -8] })
      .each(3, (i) => void b.ball(0.018, [-0.05, 0.9 + i * 0.035, 0], { color: 'silver' }));
    return b.done();
  }),
  e('electric mixer', 'kitchen', 'appliances', () =>
    m('electric mixer')
      .box([0.22, 0.05, 0.32], [0, 0.025, 0.02], { color: 'red', round: 0.5 })
      .box([0.12, 0.27, 0.12], [0, 0.18, -0.1], { color: 'red', round: 0.5 })
      .box([0.15, 0.13, 0.34], [0, 0.34, -0.01], { color: 'red', round: 0.7 })
      .cyl([0.04, 0.01, 0.04], [0, 0.34, 0.165], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.2, 0.15, 0.2], [0, 0.125, 0.06], { color: 'metal', taper: 1.25 })
      .cyl([0.02, 0.07, 0.02], [0, 0.24, 0.06], { color: 'silver' })
      .ball([0.06, 0.08, 0.06], [0, 0.18, 0.06], { color: 'silver' })
      .cyl([0.04, 0.02, 0.04], [0.08, 0.3, -0.1], { color: 'silver', rot: [0, 0, 90] })
      .done(),
  ),
  e('electric razor', 'home', 'bathroom', () => {
    const b = m('electric razor');
    b.box([0.055, 0.12, 0.036], [0, 0.06, 0], { color: 'black', round: 0.7 })
      .box([0.075, 0.035, 0.046], [0, 0.135, 0], { color: 'silver', round: 0.5 })
      .box([0.012, 0.03, 0.006], [0, 0.07, 0.019], { color: 'blue', glow: true });
    for (const [x, z] of around(3, 0.017, Math.PI / 2)) b.cyl([0.026, 0.012, 0.026], [x, 0.157, z], { color: 'metal' });
    return b.done();
  }),
  e('electrical outlet', 'home', 'electrical', () => {
    const b = m('electrical outlet').box([0.075, 0.12, 0.014], [0, 0.06, 0], { color: 'white', round: 0.2 });
    for (const y of [0.088, 0.032]) {
      b.box([0.042, 0.036, 0.006], [0, y, 0.008], { color: 'cream', round: 0.5 });
      b.pair((s) => void b.box([0.004, 0.012, 0.004], [s * 0.008, y + 0.004, 0.011], { color: 'black', noInk: true }));
      b.ball(0.006, [0, y - 0.01, 0.011], { color: 'black', noInk: true });
    }
    return b.cyl([0.008, 0.003, 0.008], [0, 0.06, 0.008], { color: 'silver', rot: [90, 0, 0] }).done();
  }),
  e('electricity pylon', 'tech', 'power', () => {
    const b = m('electricity pylon');
    const lx = (y: number) => 1.8 - (1.3 / 9) * y;
    b.pair((s) => {
      b.rod([s * 1.8, 0, 1.8], [s * 0.5, 9, 0.5], 0.16, 'steel').rod([s * 1.8, 0, -1.8], [s * 0.5, 9, -0.5], 0.16, 'steel');
      b.rod([s * 0.5, 9, 0.5], [s * 0.15, 12, 0.15], 0.12, 'steel').rod([s * 0.5, 9, -0.5], [s * 0.15, 12, -0.15], 0.12, 'steel');
      for (let i = 0; i < 3; i++) {
        const y0 = i * 3, y1 = y0 + 3;
        b.rod([-s * lx(y0), y0, lx(y0)], [s * lx(y1), y1, lx(y1)], 0.07, 'steel');
        b.rod([-s * lx(y0), y0, -lx(y0)], [s * lx(y1), y1, -lx(y1)], 0.07, 'steel');
      }
      b.cyl([0.18, 0.7, 0.18], [s * 3.2, 7.65, 0], { color: '#cfe0e8' }).cyl([0.18, 0.7, 0.18], [s * 2.2, 10.15, 0], { color: '#cfe0e8' });
    });
    b.pair((s) => void b.box([1.1, 0.9, 1.1], [s * 1.75, 0.45, 1.75], { color: 'stone' }).box([1.1, 0.9, 1.1], [s * 1.75, 0.45, -1.75], { color: 'stone' }));
    return b.box([7, 0.3, 0.5], [0, 8.15, 0], { color: 'steel', round: 0 }).box([5, 0.3, 0.5], [0, 10.65, 0], { color: 'steel', round: 0 }).done();
  }),
  e('electrodes', 'clinic', 'medical devices', () => {
    const b = m('electrodes').box([0.035, 0.02, 0.018], [0, 0.01, 0.03], { color: 'gray' });
    ['red', 'green', 'yellow'].forEach((c, i) => {
      const x = (i - 1) * 0.05;
      b.cyl([0.042, 0.006, 0.042], [x, 0.075, 0], { color: 'white', rot: [90, 0, 0] })
        .ball(0.012, [x, 0.075, 0.006], { color: 'silver' })
        .rod([x, 0.055, 0.002], [x * 0.25, 0.012, 0.03], 0.006, c);
    });
    return b.done();
  }),
  e('electronics store', 'places', 'shops', () => {
    const b = house('electronics store', { w: 6, h: 4, d: 4, wall: '#d8dde6', roof: '#4a5a70', sign: 'ELECTRONICS', signC: 'blue', win: '#2a3040' });
    b.pair((s) => void b.box([0.9, 0.55, 0.04], [s * 1.8, 1.55, 2.1], { color: 'cyan', glow: true }));
    return b.done();
  }),
  e('elephant trunk', 'wild', 'animal parts', () => {
    const b = m('elephant trunk').ball([0.9, 0.8, 0.8], [0, 1.75, -0.2], { color: '#9a9aa2' });
    b.pair((s) => {
      b.ball([0.7, 0.85, 0.12], [s * 0.62, 1.72, -0.3], { color: '#8a8a92', rot: [0, -s * 25, 0] });
      b.ball(0.06, [s * 0.25, 1.85, 0.16], { color: 'black', eye: true });
      b.rod([s * 0.15, 1.45, 0.15], [s * 0.2, 1.15, 0.45], 0.07, 'cream');
    });
    const pts: V[] = [[0, 1.55, 0.18], [0, 1.15, 0.3], [0, 0.75, 0.33], [0, 0.4, 0.3], [0, 0.12, 0.38], [0, 0.1, 0.52], [0, 0.22, 0.6]];
    const th = [0.32, 0.26, 0.21, 0.17, 0.14, 0.12];
    for (let i = 0; i < 6; i++) b.rod(pts[i], pts[i + 1], th[i], '#9a9aa2');
    return b.ball(0.06, [0, 0.27, 0.62], { color: '#5a5a62' }).done();
  }),
  e('elevator', 'places', 'building parts', () =>
    m('elevator')
      .box([2.6, 2.7, 0.25], [0, 1.35, -0.13], { color: 'beige' })
      .box([1.45, 2.3, 0.1], [0, 1.15, 0.02], { color: 'steel' })
      .box([0.58, 2.05, 0.06], [-0.3, 1.03, 0.09], { color: 'silver', name: 'door', pivot: [-0.59, 1.03, 0.09] })
      .box([0.58, 2.05, 0.06], [0.3, 1.03, 0.09], { color: 'silver' })
      .box([0.5, 0.18, 0.05], [0, 2.45, 0.02], { color: 'black' })
      .cone([0.08, 0.08, 0.02], [0, 2.45, 0.05], { color: 'orange', glow: true })
      .box([0.14, 0.3, 0.04], [0.98, 1.15, 0.02], { color: 'silver' })
      .cyl([0.06, 0.02, 0.06], [0.98, 1.22, 0.05], { color: 'white', rot: [90, 0, 0], glow: true })
      .cyl([0.06, 0.02, 0.06], [0.98, 1.08, 0.05], { color: 'white', rot: [90, 0, 0], glow: true })
      .done(),
  ),
  e('elliptical machine', 'sports', 'gym', () => {
    const b = m('elliptical machine', { view: 'side' });
    b.box([0.14, 0.08, 1.6], [0, 0.04, 0], { color: 'darkgray' })
      .box([0.6, 0.06, 0.1], [0, 0.03, -0.75], { color: 'darkgray' })
      .cyl([0.14, 0.5, 0.5], [0, 0.3, 0.6], { color: 'black', rot: [0, 0, 90], name: 'wheel' })
      .rod([0, 0.3, 0.55], [0, 1.25, 0.45], 0.08, 'silver')
      .box([0.32, 0.2, 0.06], [0, 1.32, 0.45], { color: 'black', rot: [-30, 0, 0] })
      .box([0.24, 0.13, 0.02], [0, 1.33, 0.48], { color: 'cyan', rot: [-30, 0, 0], glow: true });
    b.pair((s) => {
      b.rod([s * 0.13, 0.3, 0.55], [s * 0.13, 0.22, -0.4], 0.05, 'silver');
      b.box([0.13, 0.04, 0.34], [s * 0.13, s > 0 ? 0.26 : 0.2, s > 0 ? -0.15 : -0.35], { color: 'black' });
      b.rod([s * 0.2, 0.32, 0.5], [s * 0.26, 1.6, s > 0 ? 0.25 : 0.38], 0.045, 'silver');
    });
    return b.done();
  }),
  e('embassy', 'places', 'government', () => {
    const b = m('embassy')
      .box([8, 5, 5], [0, 2.5, 0], { color: 'cream', round: 0.03 })
      .box([8.4, 0.35, 5.4], [0, 5.17, 0], { color: '#8a96a4', round: 0.1 })
      .box([5.4, 0.3, 1.8], [0, 0.15, 3.3], { color: 'stone' })
      .box([1.3, 2.4, 0.1], [0, 1.5, 2.54], { color: 'darkwood', name: 'door', pivot: [-0.65, 1.5, 2.54] })
      .box([5, 0.45, 1.5], [0, 4.25, 3.15], { color: 'white', round: 0.05 })
      .wedge([5.3, 1.1, 1.5], [0, 5.02, 3.15], { color: 'white' })
      .label('EMBASSY', [3.6, 0.38], [0, 4.25, 3.92], { color: 'navy' });
    b.each(4, (i) => void b.cyl([0.4, 3.75, 0.4], [-2.1 + i * 1.4, 2.17, 3.6], { color: 'white' }));
    b.pair((s) => void b.box([1.2, 1.3, 0.08], [s * 3, 3, 2.52], { color: 'glass' }));
    return b.stick([0, 5.3, -1], [0, 8.5, -1], 0.1, 'silver').box([1.4, 0.9, 0.05], [0.72, 8, -1], { color: 'red' }).box([0.4, 0.9, 0.06], [0.25, 8, -1], { color: 'white' }).done();
  }),
  e('emerald', 'nature', 'gems', () =>
    m('emerald')
      .box([0.075, 0.1, 0.04], [0, 0.05, 0], { color: '#178a4e', round: 0.12 })
      .box([0.056, 0.08, 0.012], [0, 0.05, 0.02], { color: '#2fb26a', round: 0.1 })
      .box([0.036, 0.06, 0.01], [0, 0.05, 0.026], { color: '#6fe0a0', round: 0.1 })
      .ball(0.01, [0.012, 0.07, 0.032], { color: 'white', glow: true })
      .done(),
  ),
  e('emergency exit', 'places', 'building parts', () =>
    m('emergency exit')
      .box([1.7, 2.7, 0.25], [0, 1.35, -0.125], { color: 'lightgray' })
      .box([1.15, 2.2, 0.08], [0, 1.1, 0.02], { color: 'darkgray' })
      .box([0.95, 2.05, 0.06], [0, 1.03, 0.07], { color: 'green', name: 'door', pivot: [-0.475, 1.03, 0.07] })
      .stick([-0.38, 1.0, 0.13], [0.38, 1.0, 0.13], 0.05, 'silver', { parent: 'door' })
      .box([0.7, 0.26, 0.08], [0, 2.4, 0.04], { color: 'white' })
      .label('EXIT', [0.62, 0.2], [0, 2.4, 0.09], { color: 'green' })
      .done(),
  ),
  e('emergency room', 'places', 'hospital', () => {
    const b = house('emergency room', { w: 7, h: 4, d: 4, wall: 'white', roof: 'lightgray', sign: 'EMERGENCY', signC: 'red', door: 'glass' });
    b.box([3, 0.25, 2.2], [0, 2.9, 3.1], { color: 'white' });
    b.pair((s) => void b.stick([s * 1.3, 0, 4], [s * 1.3, 2.8, 4], 0.12, 'silver'));
    return b.box([1.3, 1.3, 0.2], [0, 4.95, 0], { color: 'white' }).box([0.9, 0.3, 0.06], [0, 4.95, 0.12], { color: 'red' }).box([0.3, 0.9, 0.06], [0, 4.95, 0.12], { color: 'red' }).done();
  }),
  e('employment office', 'places', 'offices', () => {
    const b = house('employment office', { w: 6, h: 4, d: 4, wall: 'tan', roof: 'brown', sign: 'JOB CENTER', signC: 'green' });
    return b.wedge([0.8, 1.1, 0.5], [1.4, 0.55, 3.2], { color: 'wood' }).label('HIRING', [0.55, 0.3], [1.4, 0.55, 3.47], { color: 'yellow', rot: [-12, 0, 0] }).done();
  }),
  e('energy bar', 'food', 'snacks', () =>
    m('energy bar')
      .box([0.05, 0.12, 0.02], [0, 0.06, 0], { color: 'orange', round: 0.3 })
      .box([0.054, 0.012, 0.012], [0, 0.006, 0], { color: 'orange', round: 0.1 })
      .box([0.044, 0.05, 0.016], [0, 0.14, 0], { color: 'chocolate', round: 0.3 })
      .ball(0.008, [-0.01, 0.15, 0.008], { color: 'tan', noInk: true })
      .ball(0.008, [0.01, 0.135, 0.008], { color: 'cream', noInk: true })
      .ball(0.007, [0.005, 0.158, 0.008], { color: 'tan', noInk: true })
      .label('ENERGY', [0.04, 0.03], [0, 0.07, 0.012], { color: 'black' })
      .done(),
  ),
  e('energy drink', 'food', 'drinks', () =>
    m('energy drink')
      .cyl([0.066, 0.16, 0.066], [0, 0.08, 0], { color: '#1a1a1a' })
      .cyl([0.058, 0.012, 0.058], [0, 0.166, 0], { color: 'silver', taper: 0.9 })
      .box([0.012, 0.004, 0.02], [0, 0.173, 0.01], { color: 'silver' })
      .rod([0.014, 0.135, 0.035], [-0.009, 0.088, 0.035], 0.012, 'lime', { noInk: true })
      .rod([-0.009, 0.088, 0.035], [0.009, 0.088, 0.035], 0.012, 'lime', { noInk: true })
      .rod([0.009, 0.088, 0.035], [-0.014, 0.04, 0.035], 0.012, 'lime', { noInk: true })
      .done(),
  ),
  e('english muffin', 'food', 'bread', () =>
    m('english muffin')
      .cyl([0.09, 0.025, 0.09], [-0.05, 0.0125, 0], { color: '#d9a860' })
      .cyl([0.084, 0.004, 0.084], [-0.05, 0.026, 0], { color: '#f0d9a0', noInk: true })
      .box([0.03, 0.01, 0.03], [-0.05, 0.032, 0], { color: '#ffe680' })
      .cyl([0.09, 0.025, 0.09], [0.05, 0.0125, 0.01], { color: '#d9a860' })
      .cyl([0.09, 0.008, 0.09], [0.05, 0.029, 0.01], { color: '#f0d9a0' })
      .cyl([0.09, 0.025, 0.09], [0.05, 0.045, 0.01], { color: '#d9a860' })
      .done(),
  ),
  e('entertainment center', 'home', 'furniture', () => {
    const b = m('entertainment center')
      .box([1.8, 0.5, 0.45], [0, 0.25, 0], { color: 'darkwood' })
      .box([1.6, 0.08, 0.02], [0, 0.25, 0.23], { color: 'wood', noInk: true })
      .box([2.6, 0.12, 0.45], [0, 1.86, 0], { color: 'darkwood' })
      .box([0.4, 0.04, 0.2], [0, 0.52, 0], { color: 'black' })
      .stick([0, 0.54, 0], [0, 0.64, 0], 0.05, 'black')
      .box([1.2, 0.68, 0.06], [0, 0.98, 0], { color: 'black' })
      .box([1.1, 0.6, 0.01], [0, 0.98, 0.035], { color: '#3a6ab0', glow: true });
    b.pair((s) => {
      b.box([0.4, 1.8, 0.45], [s * 1.1, 0.9, 0], { color: 'darkwood' });
      b.cyl([0.22, 0.03, 0.22], [s * 1.1, 1.2, 0.23], { color: 'black', rot: [90, 0, 0] }).cyl([0.14, 0.03, 0.14], [s * 1.1, 0.8, 0.23], { color: 'black', rot: [90, 0, 0] });
    });
    return b.done();
  }),
  e('envelope', 'study', 'mail', () =>
    m('envelope')
      .box([0.22, 0.11, 0.018], [0, 0.055, 0], { color: 'white', round: 0.15 })
      .wedge([0.22, 0.065, 0.004], [0, 0.0775, 0.011], { color: 'cream', rot: [180, 0, 0] })
      .cyl([0.026, 0.004, 0.026], [0, 0.048, 0.014], { color: 'red', rot: [90, 0, 0] })
      .done(),
  ),
  e('equal sign', 'ideas', 'math symbols', () =>
    tile('equal sign')
      .box([0.08, 0.02, 0.012], [0, 0.085, 0.018], { color: 'blue', round: 0.4 })
      .box([0.08, 0.02, 0.012], [0, 0.045, 0.018], { color: 'blue', round: 0.4 })
      .done(),
  ),
  e('eraser', 'study', 'stationery', () =>
    m('eraser')
      .box([0.035, 0.035, 0.026], [-0.02, 0.0175, 0], { color: 'pink', round: 0.35 })
      .box([0.042, 0.037, 0.028], [0.017, 0.0185, 0], { color: 'blue', round: 0.2 })
      .label('ERASER', [0.034, 0.015], [0.017, 0.019, 0.015], { color: 'white' })
      .done(),
  ),
  e('escalator', 'places', 'building parts', () => {
    const b = m('escalator');
    b.each(12, (i) => void b.box([0.9, 0.3, 0.52], [0, 0.15 + i * 0.29, 3 - i * 0.5], { color: 'metal', round: 0.1 }).box([0.9, 0.03, 0.04], [0, 0.31 + i * 0.29, 3.24 - i * 0.5], { color: 'yellow', noInk: true }));
    b.box([1.0, 0.6, 7.2], [0, 1.4, 0.2], { color: 'darkgray', rot: [30, 0, 0] })
      .box([1.2, 0.3, 1.0], [0, 0.15, 3.7], { color: 'steel' })
      .box([1.2, 0.3, 1.2], [0, 3.34, -3.3], { color: 'steel' })
      .box([0.6, 3.2, 0.6], [0, 1.6, -3.4], { color: 'gray' });
    b.pair((s) => void b.box([0.06, 0.7, 7.0], [s * 0.52, 2.3, 0.2], { color: 'darkgray', rot: [30, 0, 0] }).rod([s * 0.52, 1.07, 3.5], [s * 0.52, 4.8, -3.0], 0.1, 'black'));
    return b.done();
  }),
  e('eucalyptus tree', 'garden', 'trees', () => {
    const b = m('eucalyptus tree')
      .stick([0, 0, 0], [0.2, 6.5, 0], 0.55, '#ddd6c6')
      .rod([0.2, 6.2, 0], [-1.4, 8.4, 0.3], 0.25, '#ddd6c6')
      .rod([0.2, 6.2, 0], [1.6, 8.8, -0.2], 0.25, '#ddd6c6')
      .rod([0.2, 6.4, 0], [0.3, 9.6, 0.2], 0.25, '#ddd6c6')
      .ball([2.6, 1.6, 2.4], [-1.5, 8.8, 0.3], { color: '#7fa28e', name: 'top' })
      .ball([2.6, 1.6, 2.4], [1.7, 9.2, -0.2], { color: '#7fa28e', parent: 'top' })
      .ball([2.8, 1.8, 2.6], [0.3, 10.1, 0.2], { color: '#8db09a', parent: 'top' });
    b.each(4, (i) => void b.ball([0.3, 0.6, 0.12], [0.05 + i * 0.03, 1 + i * 1.4, 0.26], { color: '#b8a888', noInk: true }));
    return b.done();
  }),
  e('excalibur', 'fantasy', 'magic items', () =>
    m('excalibur')
      .ball([0.75, 0.5, 0.6], [0, 0.18, 0], { color: 'stone' })
      .box([0.065, 0.62, 0.016], [0, 0.56, 0], { color: 'silver', round: 0.1 })
      .box([0.28, 0.045, 0.045], [0, 0.88, 0], { color: 'gold', round: 0.5 })
      .ball(0.035, [0, 0.88, 0.025], { color: 'blue' })
      .cyl([0.035, 0.16, 0.035], [0, 0.98, 0], { color: 'navy' })
      .ball(0.06, [0, 1.08, 0], { color: 'gold' })
      .done(),
  ),
  e('exclamation point (punctuation)', 'ideas', 'punctuation', () =>
    tile('exclamation point (punctuation)')
      .box([0.028, 0.065, 0.012], [0, 0.083, 0.018], { color: 'red', round: 0.5 })
      .ball([0.028, 0.028, 0.012], [0, 0.03, 0.018], { color: 'red' })
      .done(),
  ),
  e('exercise ball', 'sports', 'gym', () =>
    m('exercise ball')
      .ball(0.65, [0, 0.325, 0], { color: '#3a8fd8' })
      .torus([0.652, 0.652, 0.012], [0, 0.325, 0], { color: '#6ab4f0', rot: [0, 30, 0], noInk: true, tube: 0.03 })
      .cyl([0.03, 0.015, 0.03], [0, 0.325, 0.325], { color: 'white', rot: [90, 0, 0] })
      .done(),
  ),
  e('exercise cycle', 'sports', 'gym', () => {
    const b = m('exercise cycle', { view: 'side' });
    b.box([0.5, 0.06, 0.08], [0, 0.03, 0.45], { color: 'darkgray' })
      .box([0.5, 0.06, 0.08], [0, 0.03, -0.45], { color: 'darkgray' })
      .stick([0, 0.06, -0.45], [0, 0.06, 0.45], 0.07, 'darkgray')
      .cyl([0.12, 0.46, 0.46], [0, 0.35, 0.33], { color: 'silver', rot: [0, 0, 90], name: 'wheel' })
      .rod([0, 0.06, -0.35], [0, 0.85, -0.25], 0.06, 'red')
      .rod([0, 0.06, 0.15], [0, 1.05, 0.3], 0.06, 'red')
      .rod([0, 0.4, -0.3], [0, 0.4, 0.2], 0.06, 'red')
      .box([0.24, 0.08, 0.3], [0, 0.9, -0.27], { color: 'black', round: 0.6 })
      .stick([-0.24, 1.08, 0.36], [0.24, 1.08, 0.36], 0.04, 'black')
      .rod([0, 1.05, 0.3], [0, 1.08, 0.36], 0.05, 'red')
      .box([0.18, 0.12, 0.04], [0, 1.16, 0.3], { color: 'black', rot: [-30, 0, 0] })
      .cyl([0.1, 0.03, 0.1], [0.06, 0.38, 0], { color: 'gray', rot: [0, 0, 90] });
    b.pair((s) => void b.box([0.1, 0.03, 0.06], [s * 0.12, s > 0 ? 0.5 : 0.26, 0], { color: 'black' }));
    return b.done();
  }),
  e('exit sign', 'ideas', 'signs', () =>
    m('exit sign')
      .box([0.12, 0.04, 0.06], [0, 0.02, 0], { color: 'gray' })
      .box([0.38, 0.17, 0.06], [0, 0.125, 0], { color: 'green', round: 0.15 })
      .label('EXIT', [0.22, 0.12], [-0.06, 0.125, 0.035], { color: 'green' })
      .stick([0.06, 0.125, 0.035], [0.12, 0.125, 0.035], 0.025, 'white', { noInk: true })
      .cone([0.07, 0.05, 0.012], [0.14, 0.125, 0.035], { color: 'white', rot: [0, 0, -90], noInk: true })
      .done(),
  ),
  e('extension cord', 'home', 'electrical', () => {
    const b = m('extension cord');
    b.each(3, (i) => void b.torus([0.17, 0.17, 0.025], [-0.08, 0.087, -0.02 + i * 0.02], { color: 'orange', tube: 0.12, rot: [0, 0, i * 20] }));
    b.rod([-0.08, 0.005, 0.02], [0.08, 0.012, 0.05], 0.02, 'orange')
      .box([0.2, 0.04, 0.06], [0.16, 0.02, 0.05], { color: 'white' })
      .each(3, (i) => void b.box([0.03, 0.006, 0.03], [0.1 + i * 0.055, 0.042, 0.05], { color: 'gray', noInk: true }))
      .box([0.035, 0.05, 0.03], [-0.08, 0.2, -0.02], { color: 'orange' })
      .pair((s) => void b.box([0.006, 0.025, 0.004], [-0.08 + s * 0.008, 0.235, -0.02], { color: 'brass' }));
    return b.done();
  }),
  e('eye chart', 'clinic', 'eye care', () =>
    m('eye chart')
      .rod([-0.12, 0, 0.05], [-0.1, 0.25, -0.02], 0.02, 'darkgray')
      .rod([0.12, 0, 0.05], [0.1, 0.25, -0.02], 0.02, 'darkgray')
      .rod([0, 0, -0.12], [0, 0.25, -0.03], 0.02, 'darkgray')
      .box([0.3, 0.42, 0.05], [0, 0.36, -0.015], { color: 'white' })
      .label('E', [0.1, 0.09], [0, 0.505, 0.012], { color: 'white' })
      .label('F P', [0.14, 0.055], [0, 0.42, 0.012], { color: 'white' })
      .label('T O Z', [0.18, 0.045], [0, 0.36, 0.012], { color: 'white' })
      .label('L P E D', [0.22, 0.035], [0, 0.31, 0.012], { color: 'white' })
      .label('P E C F D', [0.24, 0.03], [0, 0.27, 0.012], { color: 'white' })
      .box([0.26, 0.006, 0.004], [0, 0.245, 0.012], { color: 'red', noInk: true })
      .label('E D F C Z P', [0.24, 0.025], [0, 0.22, 0.012], { color: 'white' })
      .done(),
  ),
  e('eye drops', 'clinic', 'medicine', () =>
    m('eye drops')
      .box([0.032, 0.05, 0.022], [0, 0.025, 0], { color: 'white', round: 0.6 })
      .cyl([0.028, 0.012, 0.02], [0, 0.056, 0], { color: 'white', taper: 0.5 })
      .cone([0.012, 0.022, 0.012], [0, 0.073, 0], { color: 'white' })
      .box([0.034, 0.022, 0.024], [0, 0.026, 0], { color: 'skyblue', round: 0.5, noInk: true })
      .ball([0.008, 0.011, 0.008], [0, 0.098, 0], { color: 'water' })
      .done(),
  ),
  e('eye liner', 'wardrobe', 'makeup', () =>
    m('eye liner')
      .cyl([0.013, 0.09, 0.013], [0, 0.045, 0], { color: 'black' })
      .cyl([0.014, 0.008, 0.014], [0, 0.094, 0], { color: 'silver' })
      .cyl([0.01, 0.012, 0.01], [0, 0.104, 0], { color: 'black', taper: 0.6 })
      .cone([0.005, 0.016, 0.005], [0, 0.118, 0], { color: 'black' })
      .done(),
  ),
  e('eye patch', 'wardrobe', 'accessories', () =>
    m('eye patch')
      .ball([0.075, 0.06, 0.022], [0, 0.045, 0], { color: 'black', rot: [0, 0, -10] })
      .rod([-0.035, 0.055, 0], [-0.1, 0.06, -0.02], 0.006, 'black')
      .rod([-0.1, 0.06, -0.02], [-0.13, 0.004, -0.04], 0.006, 'black')
      .rod([0.035, 0.035, 0], [0.1, 0.03, -0.02], 0.006, 'black')
      .rod([0.1, 0.03, -0.02], [0.12, 0.004, -0.04], 0.006, 'black')
      .done(),
  ),
  e('eye shadow', 'wardrobe', 'makeup', () => {
    const b = m('eye shadow').box([0.09, 0.012, 0.07], [0, 0.006, 0], { color: 'black', round: 0.3 });
    ['pink', 'violet', 'gold', 'brown', 'skyblue', 'peach'].forEach((c, i) => void b.cyl([0.022, 0.004, 0.022], [-0.027 + (i % 3) * 0.027, 0.013, -0.013 + Math.floor(i / 3) * 0.027], { color: c }));
    return b
      .box([0.09, 0.008, 0.07], [0, 0.046, -0.045], { color: 'black', rot: [-100, 0, 0], name: 'lid', pivot: [0, 0.012, -0.035] })
      .box([0.075, 0.003, 0.055], [0, 0.047, -0.04], { color: 'silver', rot: [-100, 0, 0], parent: 'lid' })
      .rod([-0.03, 0.006, 0.05], [0.03, 0.006, 0.05], 0.004, 'black')
      .ball([0.012, 0.008, 0.008], [0.035, 0.006, 0.05], { color: 'gray' })
      .done();
  }),
  e('eyebrow pencil', 'wardrobe', 'makeup', () =>
    m('eyebrow pencil')
      .capsule([0.012, 0.028, 0.012], [0, 0.014, 0], { color: 'black' })
      .cyl([0.01, 0.006, 0.01], [0, 0.03, 0], { color: 'gold' })
      .cyl([0.009, 0.11, 0.009], [0, 0.088, 0], { color: '#6a4632' })
      .cone([0.009, 0.016, 0.009], [0, 0.151, 0], { color: 'lightwood' })
      .cone([0.004, 0.006, 0.004], [0, 0.157, 0], { color: 'darkbrown' })
      .done(),
  ),
  e('eyedropper', 'study', 'lab gear', () =>
    m('eyedropper')
      .cyl([0.04, 0.05, 0.04], [0, 0.025, 0], { color: '#8a4a1a' })
      .cyl([0.04, 0.012, 0.04], [0, 0.056, 0], { color: '#8a4a1a', taper: 0.55 })
      .cyl([0.026, 0.012, 0.026], [0, 0.068, 0], { color: 'black' })
      .cyl([0.01, 0.03, 0.01], [0, 0.088, 0], { color: 'glass' })
      .capsule([0.02, 0.035, 0.02], [0, 0.115, 0], { color: 'red' })
      .box([0.042, 0.022, 0.042], [0, 0.025, 0], { color: 'white', round: 0.1, noInk: true })
      .done(),
  ),
  e('eyeglasses', 'wardrobe', 'eyewear', () => {
    const b = m('eyeglasses');
    b.pair((s) => {
      b.torus([0.05, 0.042, 0.012], [s * 0.032, 0.025, 0], { color: 'black', tube: 0.16 })
        .cyl([0.044, 0.003, 0.036], [s * 0.032, 0.025, 0], { color: 'glass', rot: [90, 0, 0] })
        .rod([s * 0.057, 0.032, -0.003], [s * 0.063, 0.03, -0.12], 0.005, 'black')
        .rod([s * 0.063, 0.03, -0.12], [s * 0.063, 0.008, -0.145], 0.005, 'black');
    });
    return b.rod([-0.008, 0.033, 0], [0.008, 0.033, 0], 0.005, 'black').done();
  }),
  e('factory', 'places', 'industry', () => {
    const b = m('factory')
      .box([8, 4, 5], [0, 2, 0], { color: '#b5654a', round: 0.03 })
      .box([2.2, 2.6, 0.1], [-1.8, 1.3, 2.54], { color: 'gray', name: 'door', pivot: [-2.9, 1.3, 2.54] })
      .label('FACTORY', [3.4, 0.6], [1.5, 3.3, 2.56], { color: 'yellow' });
    b.each(3, (i) => void b.wedge([8 / 3, 1.4, 5], [-8 / 3 + i * (8 / 3), 4.7, 0], { color: 'darkgray', apex: 0.5 }));
    b.each(3, (i) => void b.box([1.1, 0.9, 0.08], [0.4 + i * 1.3, 1.6, 2.53], { color: 'glass' }));
    b.cyl([0.8, 4.6, 0.8], [2.6, 6.3, -1.4], { color: '#8a4a3a' }).cyl([0.82, 0.4, 0.82], [2.6, 7.8, -1.4], { color: 'white' });
    b.cyl([0.7, 3.4, 0.7], [1.2, 5.7, -1.6], { color: '#8a4a3a' });
    return b.ball([1.2, 0.9, 1.0], [2.7, 9.0, -1.4], { color: 'lightgray' }).ball([1.6, 1.1, 1.3], [3.3, 9.8, -1.4], { color: 'lightgray' }).done();
  }),
  e('fan (tool)', 'wardrobe', 'accessories', () => {
    const b = m('fan (tool)')
      .stick([0, 0, 0], [0, 0.12, 0], 0.026, 'lightwood')
      .cyl([0.22, 0.008, 0.2], [0, 0.21, 0], { color: '#f4b6c2', rot: [90, 0, 0] })
      .torus([0.222, 0.202, 0.01], [0, 0.21, 0], { color: 'lightwood', tube: 0.04 });
    for (const a of [-50, -25, 0, 25, 50]) b.rod([0, 0.12, 0.006], [Math.sin((a * Math.PI) / 180) * 0.09, 0.21 + Math.cos((a * Math.PI) / 180) * 0.08, 0.006], 0.004, 'lightwood', { noInk: true });
    return b.ball([0.05, 0.05, 0.004], [0.04, 0.24, 0.007], { color: 'red', noInk: true }).done();
  }),
  e('fang', 'wild', 'animal parts', () =>
    m('fang')
      .cyl([0.036, 0.018, 0.03], [0, 0.009, 0], { color: '#d8c8a0' })
      .cone([0.034, 0.06, 0.029], [0.003, 0.048, 0], { color: '#f6f0de', rot: [0, 0, -8], taper: 0.45 })
      .cone([0.016, 0.04, 0.014], [0.012, 0.095, 0], { color: '#f6f0de', rot: [0, 0, -18] })
      .done(),
  ),
  e('fangs', 'wild', 'animal parts', () => {
    const b = m('fangs')
      .box([0.13, 0.025, 0.05], [0, 0.0125, -0.01], { color: 'pink', round: 0.8 })
      .box([0.13, 0.03, 0.05], [0, 0.1, -0.01], { color: 'pink', round: 0.8 });
    b.pair((s) => void b.rod([s * 0.065, 0.02, -0.025], [s * 0.065, 0.095, -0.025], 0.025, 'pink'));
    b.each(6, (i) => {
      const x = -0.05 + i * 0.02;
      b.box([0.016, 0.014, 0.012], [x, 0.03, 0.012 - Math.abs(x) * 0.15], { color: 'white', round: 0.4 });
      if (i !== 1 && i !== 4) b.box([0.016, 0.018, 0.012], [x, 0.08, 0.014 - Math.abs(x) * 0.15], { color: 'white', round: 0.4 });
    });
    return b.pair((s) => void b.cone([0.022, 0.06, 0.016], [s * 0.03, 0.06, 0.016], { color: 'white', rot: [180, 0, 0] })).done();
  }),
  e('fanny pack', 'wardrobe', 'bags', () =>
    m('fanny pack')
      .box([0.24, 0.13, 0.08], [0, 0.065, 0], { color: 'teal', round: 0.75 })
      .box([0.15, 0.06, 0.03], [0, 0.05, 0.04], { color: '#1f7a7a', round: 0.6 })
      .rod([-0.1, 0.105, 0.035], [0.1, 0.105, 0.035], 0.006, 'black', { noInk: true })
      .torus([0.42, 0.34, 0.03], [0, 0.015, -0.13], { color: 'black', rot: [90, 0, 0], tube: 0.1 })
      .box([0.05, 0.03, 0.035], [0, 0.015, -0.3], { color: 'gray' })
      .done(),
  ),
  e('farm', 'places', 'countryside', () => {
    const b = m('farm')
      .box([4, 3, 4], [0, 1.5, 0], { color: 'red', round: 0.03 })
      .wedge([4.4, 2, 4.4], [0, 4, 0], { color: 'darkred' })
      .box([1.6, 2, 0.1], [0, 1, 2.04], { color: 'red', name: 'door', pivot: [-0.8, 1, 2.04] })
      .rod([-0.75, 0.05, 2.1], [0.75, 1.95, 2.1], 0.08, 'white', { parent: 'door' })
      .rod([0.75, 0.05, 2.1], [-0.75, 1.95, 2.1], 0.08, 'white', { parent: 'door' })
      .box([0.8, 0.7, 0.08], [0, 3.6, 2.02], { color: 'white' })
      .cyl([1.6, 5, 1.6], [3, 2.5, -1], { color: 'silver' })
      .ball([1.6, 1.0, 1.6], [3, 5, -1], { color: 'gray' });
    b.each(5, (i) => void b.stick([-3.5 + i * 1.0, 0, 3.2], [-3.5 + i * 1.0, 0.9, 3.2], 0.1, 'white'));
    b.stick([-3.6, 0.7, 3.2], [0.6, 0.7, 3.2], 0.07, 'white').stick([-3.6, 0.4, 3.2], [0.6, 0.4, 3.2], 0.07, 'white');
    return b.label('FARM', [1.2, 0.45], [-2, 0.9, 3.26], { color: 'wood' }).done();
  }),
  e('faucet', 'home', 'plumbing', () => {
    const b = m('faucet')
      .box([0.24, 0.02, 0.06], [0, 0.01, 0], { color: 'silver', round: 0.5 })
      .cyl([0.04, 0.12, 0.04], [0, 0.08, 0], { color: 'silver' })
      .rod([0, 0.14, 0], [0, 0.2, 0.03], 0.022, 'silver')
      .rod([0, 0.2, 0.03], [0, 0.195, 0.09], 0.022, 'silver')
      .rod([0, 0.195, 0.09], [0, 0.15, 0.12], 0.022, 'silver')
      .ball([0.01, 0.014, 0.01], [0, 0.11, 0.12], { color: 'water' });
    b.pair((s) => void b.cyl([0.03, 0.04, 0.03], [s * 0.085, 0.04, 0], { color: 'silver' }).box([0.05, 0.01, 0.01], [s * 0.085, 0.065, 0], { color: 'silver' }).cyl([0.016, 0.006, 0.016], [s * 0.085, 0.073, 0], { color: s > 0 ? 'blue' : 'red' }));
    return b.done();
  }),
  e('fax machine', 'tech', 'office machines', () => {
    const b = m('fax machine')
      .box([0.34, 0.1, 0.26], [0, 0.05, 0], { color: '#e8e4d8', round: 0.3 })
      .box([0.22, 0.01, 0.16], [-0.04, 0.15, -0.14], { color: 'gray', rot: [50, 0, 0] })
      .box([0.2, 0.012, 0.14], [-0.04, 0.16, -0.13], { color: 'white', rot: [50, 0, 0], noInk: true })
      .box([0.2, 0.004, 0.08], [-0.04, 0.06, 0.16], { color: 'white', rot: [-12, 0, 0] })
      .box([0.06, 0.04, 0.22], [0.13, 0.12, 0], { color: 'darkgray', round: 0.8 })
      .box([0.08, 0.025, 0.002], [-0.02, 0.101, 0.06], { color: 'lime', glow: true });
    b.each(9, (i) => void b.box([0.016, 0.006, 0.016], [-0.1 + (i % 3) * 0.022, 0.102, -0.02 + Math.floor(i / 3) * 0.022], { color: 'gray' }));
    return b.done();
  }),
  e('feather', 'aviary', 'feathers', () =>
    m('feather')
      .rod([0, 0, 0], [0.012, 0.16, 0], 0.005, 'cream')
      .ball([0.045, 0.12, 0.012], [0.01, 0.1, 0], { color: 'white', rot: [0, 0, -5] })
      .ball([0.02, 0.05, 0.013], [0.022, 0.08, 0], { color: 'skyblue', noInk: true, rot: [0, 0, -5] })
      .done(),
  ),
  e('feather duster', 'home', 'cleaning', () => {
    const b = m('feather duster').stick([0, 0, 0], [0, 0.42, 0], 0.03, 'darkwood').cyl([0.04, 0.04, 0.04], [0, 0.44, 0], { color: 'brass' });
    b.ball([0.24, 0.3, 0.24], [0, 0.6, 0], { color: '#5a4030' });
    for (const [x, z] of around(6, 0.09)) b.ball([0.1, 0.24, 0.1], [x, 0.58, z], { color: '#7a5a40', rot: [z * 200, 0, -x * 200] });
    return b.ball([0.14, 0.2, 0.14], [0, 0.74, 0], { color: '#4a3428' }).done();
  }),
  e('fedora', 'wardrobe', 'hats', () =>
    m('fedora')
      .cyl([0.34, 0.016, 0.3], [0, 0.008, 0], { color: '#6a5a4a' })
      .cyl([0.2, 0.11, 0.18], [0, 0.07, 0], { color: '#6a5a4a', taper: 0.85 })
      .ball([0.17, 0.05, 0.15], [0, 0.12, 0], { color: '#6a5a4a' })
      .box([0.03, 0.03, 0.12], [0, 0.135, -0.01], { color: '#4a3e34', noInk: true })
      .cyl([0.205, 0.028, 0.185], [0, 0.03, 0], { color: 'black' })
      .done(),
  ),
  e('feet', 'clinic', 'body parts', () => {
    const b = m('feet');
    b.pair((s) => {
      b.ball([0.1, 0.07, 0.24], [s * 0.07, 0.035, 0.03], { color: 'skin2' }).cyl([0.07, 0.16, 0.08], [s * 0.07, 0.12, -0.04], { color: 'skin2' });
      b.each(5, (i) => void b.ball(0.034 - i * 0.004, [s * (0.035 + i * 0.017), 0.03 - i * 0.002, 0.15 - i * 0.012], { color: 'skin2' }));
    });
    return b.done();
  }),
  e('ferris wheel', 'places', 'fairground', () => {
    const b = m('ferris wheel')
      .box([4, 0.8, 2.6], [0, 0.4, 0], { color: 'gray' })
      .torus([9, 9, 0.3], [0, 5.8, 0], { color: 'white', tube: 0.04, name: 'wheel' })
      .ball(1.0, [0, 5.8, 0], { color: 'red', parent: 'wheel' });
    b.pair((s) => void b.rod([s * 2, 0.8, 0.9], [0, 5.8, 0.3], 0.25, 'white').rod([s * 2, 0.8, -0.9], [0, 5.8, -0.3], 0.25, 'white'));
    const cols = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink', 'teal'];
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI * 2, x = Math.sin(a) * 4.35, y = 5.8 + Math.cos(a) * 4.35;
      b.rod([0, 5.8, 0], [x, y, 0], 0.12, 'white', { parent: 'wheel' }).box([0.85, 0.85, 0.85], [x, y - 0.6, 0.45], { color: cols[i], round: 0.4, parent: 'wheel' });
    });
    return b.done();
  }),
  e('fertilizer', 'garden', 'garden supplies', () =>
    m('fertilizer')
      .box([0.3, 0.36, 0.14], [0, 0.18, 0], { color: '#5a8a3a', round: 0.5 })
      .box([0.28, 0.06, 0.06], [0, 0.37, 0], { color: '#5a8a3a', round: 0.3 })
      .label('FERTILIZER', [0.24, 0.07], [0, 0.22, 0.075], { color: 'yellow' })
      .rod([0, 0.08, 0.07], [0, 0.14, 0.072], 0.012, 'leaf', { noInk: true })
      .ball([0.04, 0.02, 0.01], [0.02, 0.14, 0.073], { color: 'leaf', noInk: true })
      .ball([0.16, 0.05, 0.12], [0.16, 0.025, 0.12], { color: 'darkbrown' })
      .done(),
  ),
  e('feta', 'food', 'cheese', () =>
    m('feta')
      .cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'skyblue' })
      .box([0.09, 0.055, 0.07], [-0.01, 0.04, 0], { color: 'white', round: 0.15 })
      .box([0.025, 0.022, 0.025], [0.055, 0.023, 0.04], { color: 'white', round: 0.3 })
      .box([0.02, 0.018, 0.02], [0.065, 0.021, -0.02], { color: 'white', round: 0.3 })
      .ball([0.024, 0.02, 0.02], [-0.04, 0.022, 0.06], { color: '#2a2030' })
      .ball(0.01, [0.03, 0.07, 0.01], { color: 'leaf' })
      .done(),
  ),
  e('fidget spinner', 'toys', 'fidget toys', () => {
    const b = m('fidget spinner').cyl([0.03, 0.014, 0.03], [0, 0.048, 0], { color: 'silver', rot: [90, 0, 0], name: 'fan' });
    b.each(3, (i) => {
      const a = ((90 + i * 120) * Math.PI) / 180, x = Math.cos(a) * 0.03, y = 0.048 - Math.sin(a) * 0.03;
      b.stick([0, 0.048, 0], [x, y, 0], 0.016, 'blue', { parent: 'fan' })
        .cyl([0.032, 0.012, 0.032], [x, y, 0], { color: 'blue', rot: [90, 0, 0], parent: 'fan' })
        .cyl([0.018, 0.014, 0.018], [x, y, 0], { color: 'silver', rot: [90, 0, 0], parent: 'fan' });
    });
    return b.done();
  }),
  e('field goalpost', 'sports', 'fields', () => {
    const b = m('field goalpost')
      .box([0.8, 1.8, 0.8], [0, 0.9, 0], { color: 'navy', round: 0.2 })
      .rod([0, 1.8, 0], [0, 3.0, 0.3], 0.2, 'yellow')
      .rod([0, 3.0, 0.3], [0, 3.05, 1.4], 0.2, 'yellow')
      .stick([-2.8, 3.05, 1.4], [2.8, 3.05, 1.4], 0.18, 'yellow');
    b.pair((s) => void b.stick([s * 2.8, 3.05, 1.4], [s * 2.8, 10, 1.4], 0.15, 'yellow').box([0.12, 0.9, 0.04], [s * 2.8, 9.4, 1.48], { color: 'orange' }));
    return b.done();
  }),
  e('fig', 'food', 'fruit', () =>
    m('fig')
      .ball([0.05, 0.05, 0.05], [-0.03, 0.025, 0], { color: '#6a2a5a' })
      .cone([0.04, 0.035, 0.04], [-0.03, 0.06, 0], { color: '#6a2a5a', taper: 0.25 })
      .rod([-0.03, 0.075, 0], [-0.026, 0.09, 0], 0.006, 'darkbrown')
      .ball([0.05, 0.065, 0.025], [0.035, 0.032, 0], { color: '#6a2a5a' })
      .ball([0.04, 0.052, 0.004], [0.035, 0.032, 0.012], { color: '#e0607a' })
      .ball([0.02, 0.03, 0.004], [0.035, 0.03, 0.014], { color: '#f4c0a0', noInk: true })
      .done(),
  ),
  e('fig tree', 'garden', 'trees', () => tree('fig tree', { h: 5, trunk: '#8a8478', crown: '#3f7a2f', w: 4.2, fruit: '#6a2a5a', nf: 8, fs: 0.3 }).done()),
  e('fighter jet', 'garage', 'aircraft', () => {
    const b = m('fighter jet', { view: 'side' })
      .capsule([1.0, 8, 1.1], [0, 1.6, -0.3], { color: '#8a96a0', rot: [90, 0, 0] })
      .cone([1.0, 1.6, 1.0], [0, 1.6, 4.4], { color: '#8a96a0', rot: [90, 0, 0] })
      .ball([0.6, 0.55, 1.8], [0, 2.1, 2.2], { color: 'glass' })
      .wedge([6.4, 4.4, 0.18], [0, 1.45, -1.2], { color: '#7a8690', rot: [90, 0, 0] })
      .wedge([2.6, 1.4, 0.12], [0, 1.5, -3.6], { color: '#7a8690', rot: [90, 0, 0] })
      .cyl([0.8, 0.5, 0.8], [0, 1.6, -4.45], { color: 'darkgray', rot: [90, 0, 0] })
      .cone([0.6, 0.9, 0.6], [0, 1.6, -5.1], { color: 'fire', rot: [-90, 0, 0], glow: true });
    b.pair((s) => void b.wedge([2.0, 1.9, 0.12], [s * 0.45, 2.85, -3.4], { color: '#7a8690', rot: [0, 90, s * 12], apex: 0.35 }));
    b.stick([0, 0, 2.8], [0, 1.2, 2.8], 0.1, 'gray').torus([0.45, 0.45, 0.18], [0, 0.22, 2.8], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    b.pair((s) => void b.stick([s * 0.9, 0, -1.2], [s * 0.7, 1.3, -1.2], 0.1, 'gray').torus([0.5, 0.5, 0.2], [s * 0.9, 0.25, -1.2], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    return b.done();
  }),
  e('fighter plane', 'garage', 'aircraft', () => {
    const b = m('fighter plane', { view: 'side' })
      .capsule([1.0, 7, 1.1], [0, 1.9, 0], { color: '#5a6a3a', rot: [90, 0, 0] })
      .cyl([0.9, 0.5, 0.9], [0, 1.9, 3.5], { color: '#5a6a3a', rot: [90, 0, 0], taper: 0.7 })
      .ball([0.35, 0.35, 0.5], [0, 1.9, 3.85], { color: 'red', name: 'fan' })
      .box([0.2, 2.8, 0.08], [0, 1.9, 3.95], { color: 'darkgray', parent: 'fan', round: 0.8 })
      .box([2.8, 0.2, 0.08], [0, 1.9, 3.95], { color: 'darkgray', parent: 'fan', round: 0.8 })
      .ball([0.55, 0.5, 1.2], [0, 2.45, 0.6], { color: 'glass' })
      .ball([9, 0.22, 2.0], [0, 1.6, 1.2], { color: '#5a6a3a' })
      .ball([3, 0.15, 1.0], [0, 2.0, -3.1], { color: '#5a6a3a' })
      .wedge([1.4, 1.5, 0.12], [0, 2.9, -3.0], { color: '#5a6a3a', rot: [0, 90, 0], apex: 0.3 });
    b.pair((s) => {
      b.cyl([0.8, 0.02, 0.8], [s * 2.8, 1.72, 1.2], { color: 'blue', noInk: true }).cyl([0.4, 0.024, 0.4], [s * 2.8, 1.72, 1.2], { color: 'red', noInk: true });
      b.stick([s * 1.2, 1.6, 1.6], [s * 1.3, 0.3, 1.8], 0.1, 'gray').torus([0.6, 0.6, 0.2], [s * 1.3, 0.3, 1.8], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    });
    return b.torus([0.3, 0.3, 0.1], [0, 0.8, -3.3], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }).stick([0, 0.9, -3.3], [0, 1.6, -3.2], 0.08, 'gray').done();
  }),
  e('figurine', 'home', 'decor', () =>
    m('figurine')
      .cyl([0.07, 0.02, 0.07], [0, 0.01, 0], { color: 'gold' })
      .cone([0.07, 0.05, 0.07], [0, 0.05, 0], { color: 'pink', taper: 0.2 })
      .capsule([0.022, 0.04, 0.018], [0, 0.085, 0], { color: 'pink' })
      .ball(0.022, [0, 0.118, 0], { color: 'cream' })
      .ball(0.014, [0, 0.13, -0.006], { color: 'gold' })
      .rod([0.01, 0.1, 0], [0.035, 0.125, 0], 0.007, 'cream')
      .rod([-0.01, 0.1, 0], [-0.035, 0.125, 0], 0.007, 'cream')
      .rod([0.004, 0.025, 0], [0.004, 0.0, 0.002], 0.008, 'cream')
      .done(),
  ),
  e('file (tool)', 'workshop', 'hand tools', () => {
    const b = m('file (tool)')
      .capsule([0.03, 0.1, 0.03], [0, 0.05, 0], { color: 'red' })
      .cyl([0.032, 0.01, 0.032], [0, 0.1, 0], { color: 'silver' })
      .box([0.022, 0.17, 0.007], [0, 0.19, 0], { color: 'iron', round: 0.1 })
      .cone([0.022, 0.02, 0.007], [0, 0.285, 0], { color: 'iron', taper: 0.5 });
    b.each(7, (i) => void b.box([0.022, 0.003, 0.002], [0, 0.125 + i * 0.022, 0.004], { color: 'gray', rot: [0, 0, 30], noInk: true }));
    return b.done();
  }),
  e('filing cabinet', 'study', 'office furniture', () => {
    const b = m('filing cabinet').box([0.5, 1.3, 0.62], [0, 0.65, 0], { color: '#8a929a', round: 0.04 });
    b.each(4, (i) => {
      const y = 0.18 + i * 0.31, z = i === 2 ? 0.45 : 0.32;
      if (i === 2) b.box([0.44, 0.27, 0.3], [0, y, 0.3], { color: '#7a828a', round: 0.05 });
      b.box([0.46, 0.28, 0.03], [0, y, z], { color: '#9aa2aa', round: 0.1 })
        .box([0.14, 0.03, 0.03], [0, y + 0.03, z + 0.025], { color: 'silver' })
        .box([0.1, 0.05, 0.01], [0, y + 0.09, z + 0.018], { color: 'white', noInk: true });
    });
    return b.done();
  }),
  e('film (material)', 'kitchen', 'kitchen supplies', () =>
    m('film (material)')
      .box([0.32, 0.06, 0.06], [0, 0.03, 0], { color: 'blue', round: 0.15 })
      .box([0.3, 0.02, 0.05], [0, 0.065, -0.005], { color: 'skyblue', round: 0.2 })
      .label('CLING WRAP', [0.18, 0.035], [-0.03, 0.03, 0.032], { color: 'white' })
      .box([0.24, 0.005, 0.12], [0.02, 0.05, 0.09], { color: '#d8eef6', rot: [-25, 0, 0] })
      .done(),
  ),
  e('film reel', 'tech', 'cinema', () => {
    const b = m('film reel')
      .cyl([0.3, 0.035, 0.3], [0, 0.15, 0], { color: 'silver', rot: [90, 0, 0], name: 'wheel' })
      .cyl([0.22, 0.04, 0.22], [0, 0.15, 0], { color: '#2a2420', rot: [90, 0, 0], parent: 'wheel' })
      .cyl([0.05, 0.045, 0.05], [0, 0.15, 0], { color: 'silver', rot: [90, 0, 0], parent: 'wheel' })
      .box([0.05, 0.006, 0.3], [0.12, 0.003, 0.15], { color: '#2a2420' });
    for (const [x, y] of around(5, 0.09)) b.cyl([0.05, 0.008, 0.05], [x, 0.15 + y, 0.02], { color: '#3a3a40', rot: [90, 0, 0], parent: 'wheel', noInk: true });
    return b.done();
  }),
  e('fin (organic)', 'sea', 'sea animal parts', () =>
    m('fin (organic)')
      .cyl([0.6, 0.02, 0.45], [0, 0.01, 0], { color: 'water' })
      .wedge([0.32, 0.32, 0.06], [0, 0.17, 0], { color: '#6a7a8a', rot: [0, 90, 0], apex: 0.38 })
      .ball([0.3, 0.06, 0.08], [0, 0.03, 0], { color: '#6a7a8a' })
      .done(),
  ),
  e('finger', 'clinic', 'body parts', () =>
    m('finger')
      .box([0.08, 0.065, 0.06], [0, 0.0325, 0], { color: 'skin2', round: 0.7 })
      .capsule([0.022, 0.085, 0.022], [0.022, 0.1, 0.012], { color: 'skin2' })
      .box([0.016, 0.018, 0.006], [0.022, 0.13, 0.022], { color: '#f4c4c0', round: 0.5 })
      .capsule([0.02, 0.05, 0.02], [-0.04, 0.035, 0.02], { color: 'skin2', rot: [0, 0, 40] })
      .done(),
  ),
  e('fingerless glove', 'wardrobe', 'gloves', () => {
    const b = m('fingerless glove')
      .box([0.1, 0.05, 0.035], [0, 0.025, 0], { color: '#8a2a2a', round: 0.4 })
      .box([0.095, 0.08, 0.032], [0, 0.09, 0], { color: '#c84040', round: 0.5 })
      .capsule([0.026, 0.05, 0.026], [-0.055, 0.1, 0.005], { color: '#c84040', rot: [0, 0, 40] })
      .ball(0.022, [-0.07, 0.12, 0.005], { color: 'skin2' });
    b.each(4, (i) => void b.cyl([0.022, 0.025, 0.022], [-0.03 + i * 0.021, 0.14, 0], { color: '#c84040' }).capsule([0.018, 0.035, 0.018], [-0.03 + i * 0.021, 0.16, 0], { color: 'skin2' }));
    return b.done();
  }),
  e('fingerprint', 'ideas', 'symbols', () => {
    const b = m('fingerprint').box([0.11, 0.14, 0.014], [0, 0.07, 0], { color: 'white', round: 0.2 });
    b.each(5, (i) => {
      const w = 0.085 - i * 0.016, h = w * 1.3;
      b.torus([w, h, 0.004], [0, 0.07 - i * 0.003, 0.008], { color: '#3a3a8a', tube: 0.0035 / (w / 2), noInk: true });
    });
    return b.done();
  }),
  e('finish line', 'sports', 'racing', () => {
    const b = m('finish line').box([1.2, 0.02, 0.45], [0, 0.01, 0], { color: 'white', round: 0 });
    b.each(18, (i) => void b.box([0.15, 0.006, 0.15], [-0.525 + (i % 6) * 0.21, 0.022, -0.15 + Math.floor(i / 6) * 0.15], { color: 'black', noInk: true, round: 0 }));
    b.pair((s) => {
      b.cone([0.2, 0.3, 0.2], [s * 0.75, 0.15, 0], { color: 'orange' }).stick([s * 0.75, 0.25, 0], [s * 0.75, 0.39, 0], 0.012, 'silver');
      b.box([0.14, 0.1, 0.01], [s * 0.75 + 0.07, 0.34, 0], { color: 'white' }).box([0.07, 0.05, 0.012], [s * 0.75 + 0.035, 0.365, 0], { color: 'black', noInk: true }).box([0.07, 0.05, 0.012], [s * 0.75 + 0.105, 0.315, 0], { color: 'black', noInk: true });
    });
    return b.done();
  }),
  e('fire alarm', 'home', 'safety', () =>
    m('fire alarm')
      .box([0.14, 0.3, 0.04], [0, 0.15, 0], { color: 'white', round: 0.2 })
      .cyl([0.15, 0.06, 0.15], [0, 0.22, 0.04], { color: 'red', rot: [90, 0, 0], taper: 0.85 })
      .ball(0.025, [0, 0.22, 0.075], { color: 'silver' })
      .box([0.1, 0.11, 0.05], [0, 0.07, 0.03], { color: 'red', round: 0.2 })
      .box([0.06, 0.025, 0.02], [0, 0.06, 0.06], { color: 'white' })
      .label('FIRE', [0.07, 0.025], [0, 0.105, 0.056], { color: 'red' })
      .done(),
  ),
  e('fire engine', 'garage', 'emergency vehicles', () => {
    const b = m('fire engine', { view: 'side' })
      .box([2.3, 1.6, 2.0], [0, 1.45, 2.4], { color: 'red', round: 0.2 })
      .box([2.2, 0.8, 0.1], [0, 1.85, 3.42], { color: 'glass' })
      .box([2.4, 1.9, 4.6], [0, 1.6, -0.9], { color: 'red', round: 0.1 })
      .box([2.42, 0.18, 6.8], [0, 1.0, 0.2], { color: 'white', noInk: true })
      .box([2.0, 0.08, 4.8], [0, 2.6, -0.6], { color: 'silver' })
      .box([0.9, 0.16, 0.2], [0, 2.32, 2.6], { color: 'blue', glow: true })
      .box([2.0, 0.3, 0.2], [0, 0.6, 3.45], { color: 'silver' });
    b.pair((s) => void b.stick([s * 0.4, 2.75, 1.6], [s * 0.4, 2.75, -3.0], 0.08, 'silver'));
    b.each(9, (i) => void b.stick([-0.4, 2.75, 1.4 - i * 0.5], [0.4, 2.75, 1.4 - i * 0.5], 0.05, 'silver'));
    for (const z of [2.4, -0.6, -2.0]) b.pair((s) => void b.torus([1.0, 1.0, 0.35], [s * 1.05, 0.5, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }).cyl([0.4, 0.36, 0.4], [s * 1.05, 0.5, z], { color: 'silver', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('fire escape', 'places', 'building parts', () => {
    const b = m('fire escape').box([3.2, 3.6, 0.3], [0, 1.8, -0.15], { color: '#a8503a', round: 0.02 });
    b.pair((s) => void b.box([0.7, 0.9, 0.06], [s * 0.8, 1.9, 0.02], { color: 'glass' }).box([0.7, 0.9, 0.06], [s * 0.8, 3.1, 0.02], { color: 'glass' }));
    for (const y of [1.3, 2.5]) {
      b.box([2.6, 0.08, 0.8], [0, y, 0.45], { color: 'black', round: 0 });
      b.stick([-1.3, y + 0.5, 0.85], [1.3, y + 0.5, 0.85], 0.04, 'black');
      b.each(6, (i) => void b.stick([-1.3 + i * 0.52, y, 0.85], [-1.3 + i * 0.52, y + 0.5, 0.85], 0.03, 'black'));
    }
    b.box([0.55, 0.06, 1.5], [0.6, 1.9, 0.45], { color: 'darkgray', rot: [0, 90, 38], round: 0 });
    b.box([0.55, 0.06, 1.5], [0.6, 0.7, 0.45], { color: 'darkgray', rot: [0, 90, -38], round: 0 });
    return b.done();
  }),
  e('fire extinguisher', 'home', 'safety', () =>
    m('fire extinguisher')
      .cyl([0.15, 0.42, 0.15], [0, 0.21, 0], { color: 'red' })
      .ball([0.15, 0.1, 0.15], [0, 0.42, 0], { color: 'red' })
      .cyl([0.152, 0.12, 0.152], [0, 0.22, 0], { color: 'white', noInk: true })
      .cyl([0.04, 0.06, 0.04], [0, 0.48, 0], { color: 'black' })
      .box([0.03, 0.02, 0.14], [0, 0.52, -0.03], { color: 'silver', rot: [-10, 0, 0] })
      .box([0.03, 0.02, 0.12], [0, 0.495, -0.04], { color: 'silver' })
      .cyl([0.035, 0.012, 0.035], [0.035, 0.49, 0.02], { color: 'white', rot: [90, 0, 0] })
      .rod([0, 0.5, 0.03], [0, 0.45, 0.12], 0.025, 'black')
      .rod([0, 0.45, 0.12], [0, 0.2, 0.11], 0.025, 'black')
      .cone([0.04, 0.08, 0.04], [0, 0.15, 0.11], { color: 'black', rot: [180, 0, 0], taper: 0.5 })
      .done(),
  ),
  e('fire hose', 'home', 'safety', () => {
    const b = m('fire hose').cyl([0.4, 0.09, 0.4], [0, 0.2, 0], { color: '#c83a2a', rot: [90, 0, 0] });
    b.each(4, (i) => void b.torus([0.34 - i * 0.07, 0.34 - i * 0.07, 0.092], [0, 0.2, 0], { color: '#8a2a1a', tube: 0.06, noInk: true }));
    return b
      .cyl([0.08, 0.095, 0.08], [0, 0.2, 0], { color: '#2a2a2a', rot: [90, 0, 0] })
      .cyl([0.07, 0.06, 0.07], [0.19, 0.035, 0.04], { color: 'brass', rot: [0, 0, 90] })
      .cyl([0.06, 0.16, 0.06], [0.3, 0.035, 0.04], { color: 'black', rot: [0, 0, -90], taper: 0.5 })
      .done();
  }),
  e('fire hydrant', 'places', 'street furniture', () => {
    const b = m('fire hydrant')
      .cyl([0.36, 0.06, 0.36], [0, 0.03, 0], { color: 'red' })
      .cyl([0.26, 0.55, 0.26], [0, 0.33, 0], { color: 'red' })
      .cyl([0.32, 0.06, 0.32], [0, 0.62, 0], { color: 'red' })
      .ball([0.26, 0.2, 0.26], [0, 0.66, 0], { color: 'red' })
      .cyl([0.08, 0.08, 0.08], [0, 0.78, 0], { color: 'yellow', segs: 5 })
      .cyl([0.14, 0.12, 0.14], [0, 0.42, 0.14], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.12, 0.04, 0.12], [0, 0.42, 0.21], { color: 'yellow', rot: [90, 0, 0] });
    b.pair((s) => void b.cyl([0.1, 0.12, 0.1], [s * 0.17, 0.45, 0], { color: 'red', rot: [0, 0, 90] }).cyl([0.09, 0.04, 0.09], [s * 0.24, 0.45, 0], { color: 'yellow', rot: [0, 0, 90] }));
    return b.done();
  }),
  e('fire log', 'home', 'fireplace', () =>
    m('fire log')
      .cyl([0.14, 0.45, 0.14], [-0.08, 0.07, 0], { color: 'bark', rot: [0, 20, 90] })
      .cyl([0.13, 0.45, 0.13], [0.08, 0.065, 0.04], { color: 'bark', rot: [0, -15, 90] })
      .cyl([0.12, 0.4, 0.12], [0, 0.18, 0.02], { color: '#7a5030', rot: [0, 75, 90] })
      .cyl([0.1, 0.005, 0.1], [0, 0.18, 0.225], { color: 'lightwood', rot: [90, 0, 0], noInk: true })
      .cone([0.12, 0.2, 0.08], [0, 0.32, 0], { color: 'flame', glow: true })
      .cone([0.07, 0.14, 0.05], [0.05, 0.3, 0.02], { color: 'yellow', glow: true })
      .done(),
  ),
  e('fire pit', 'garden', 'backyard', () => {
    const b = m('fire pit').cyl([0.8, 0.04, 0.8], [0, 0.02, 0], { color: 'darkgray' });
    for (const [x, z] of around(11, 0.48)) b.ball([0.2, 0.17, 0.2], [x, 0.085, z], { color: 'stone' });
    b.cyl([0.1, 0.6, 0.1], [0, 0.1, 0], { color: 'bark', rot: [0, 30, 80] }).cyl([0.1, 0.6, 0.1], [0, 0.12, 0], { color: 'bark', rot: [0, -40, 80] });
    return b.cone([0.32, 0.4, 0.26], [0, 0.32, 0], { color: 'flame', glow: true }).cone([0.18, 0.3, 0.14], [0.06, 0.3, 0.05], { color: 'yellow', glow: true }).cone([0.3, 0.3, 0.26], [0, 0.25, 0], { color: 'orange' }).done();
  }),
  e('fire station', 'places', 'emergency', () => {
    const b = m('fire station')
      .box([8, 5, 5], [0, 2.5, 0], { color: '#b0503a', round: 0.03 })
      .box([8.3, 0.3, 5.3], [0, 5.15, 0], { color: 'gray' })
      .box([1.8, 7.5, 1.8], [-3.2, 3.75, -1.2], { color: '#b0503a' })
      .wedge([2.2, 1.2, 2.2], [-3.2, 8.1, -1.2], { color: 'darkgray' })
      .label('FIRE STATION', [5.2, 0.8], [0.6, 4.3, 2.56], { color: 'white' });
    b.box([2.4, 3.0, 0.1], [-1.0, 1.5, 2.53], { color: 'red', name: 'door', pivot: [-1, 3.0, 2.53] }).box([2.4, 3.0, 0.1], [2.0, 1.5, 2.53], { color: 'red' });
    b.each(4, (i) => void b.box([2.2, 0.03, 0.02], [-1.0, 0.4 + i * 0.7, 2.59], { color: 'darkred', noInk: true, parent: 'door' }).box([2.2, 0.03, 0.02], [2.0, 0.4 + i * 0.7, 2.59], { color: 'darkred', noInk: true }));
    return b.box([0.8, 0.8, 0.08], [-3.2, 6.2, -0.27], { color: 'glass' }).done();
  }),
  e('firecracker', 'toys', 'fireworks', () =>
    m('firecracker')
      .cyl([0.045, 0.15, 0.045], [0, 0.075, 0], { color: 'red' })
      .cyl([0.047, 0.012, 0.047], [0, 0.02, 0], { color: 'gold' })
      .cyl([0.047, 0.012, 0.047], [0, 0.13, 0], { color: 'gold' })
      .rod([0, 0.15, 0], [0.015, 0.18, 0], 0.005, 'tan')
      .rod([0.015, 0.18, 0], [0.005, 0.2, 0], 0.005, 'tan')
      .star(0.035, [0.005, 0.21, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('fireman uniform', 'wardrobe', 'uniforms', () => who('fireman uniform', { top: '#c9a24a', bottom: '#c9a24a', shoes: 'black', long: true, acc: [hat('helmet', 'red'), wear('belt', 'yellow'), held('hose')] })),
  e('fireplace', 'home', 'fireplace', () =>
    m('fireplace')
      .box([1.4, 0.95, 0.4], [0, 0.475, 0], { color: '#a8503a', round: 0.03 })
      .box([1.6, 0.08, 0.5], [0, 0.99, 0.02], { color: 'darkwood' })
      .box([0.8, 0.6, 0.1], [0, 0.32, 0.17], { color: '#1a1414' })
      .box([1.5, 0.06, 0.45], [0, 0.03, 0.08], { color: 'stone' })
      .cyl([0.1, 0.6, 0.1], [0, 0.1, 0.18], { color: 'bark', rot: [0, 0, 90] })
      .cone([0.4, 0.4, 0.15], [0, 0.32, 0.2], { color: 'orange' })
      .cone([0.2, 0.3, 0.1], [0, 0.3, 0.23], { color: 'yellow', glow: true })
      .box([0.12, 0.16, 0.08], [0.45, 1.11, 0], { color: 'gold' })
      .done(),
  ),
  e('fireworks', 'toys', 'fireworks', () => {
    const b = m('fireworks').cyl([0.09, 0.14, 0.09], [0, 0.07, 0], { color: 'blue' }).cyl([0.092, 0.03, 0.092], [0, 0.1, 0], { color: 'yellow', noInk: true });
    b.rod([0, 0.14, 0], [0.02, 0.6, 0], 0.012, 'orange', { noInk: true });
    const cols = ['red', 'yellow', 'lime', 'cyan', 'magenta', 'orange', 'white', 'violet'];
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2, x = 0.02 + Math.sin(a) * 0.25, y = 0.85 + Math.cos(a) * 0.25;
      b.rod([0.02, 0.85, 0], [x, y, 0], 0.016, cols[i % 8], { noInk: true }).ball(0.055, [x, y, 0], { color: cols[i % 8] });
    });
    return b.ball(0.08, [0.02, 0.85, 0], { color: 'white', glow: true }).done();
  }),
  e('first aid kit', 'clinic', 'medical supplies', () =>
    m('first aid kit')
      .box([0.3, 0.2, 0.1], [0, 0.1, 0], { color: 'red', round: 0.2 })
      .box([0.3, 0.012, 0.102], [0, 0.15, 0], { color: 'darkred', noInk: true })
      .box([0.1, 0.03, 0.02], [0, 0.085, 0.055], { color: 'white' })
      .box([0.03, 0.1, 0.02], [0, 0.085, 0.055], { color: 'white' })
      .torus([0.1, 0.06, 0.025], [0, 0.215, 0], { color: 'darkgray', tube: 0.25 })
      .done(),
  ),
  e('fish bait', 'sports', 'fishing', () => {
    const b = m('fish bait')
      .cyl([0.1, 0.06, 0.1], [0, 0.03, 0], { color: 'silver' })
      .cyl([0.094, 0.005, 0.094], [0, 0.06, 0], { color: 'darkbrown' })
      .label('BAIT', [0.06, 0.025], [0, 0.03, 0.05], { color: 'yellow' });
    b.rod([0.01, 0.06, 0], [0.03, 0.1, 0.01], 0.012, 'pink').rod([0.03, 0.1, 0.01], [0.06, 0.09, 0.03], 0.012, 'pink').rod([0.06, 0.09, 0.03], [0.07, 0.06, 0.04], 0.012, 'pink');
    return b.rod([-0.02, 0.06, 0.01], [-0.03, 0.09, 0.02], 0.011, '#e0808a').rod([-0.03, 0.09, 0.02], [-0.01, 0.11, 0.02], 0.011, '#e0808a').done();
  }),
  e('fish food', 'pets', 'pet supplies', () => {
    const b = m('fish food')
      .cyl([0.06, 0.1, 0.06], [0, 0.05, 0], { color: 'yellow' })
      .cyl([0.064, 0.025, 0.064], [0, 0.112, 0], { color: 'red' })
      .ball([0.03, 0.02, 0.008], [0, 0.05, 0.03], { color: 'orange', noInk: true })
      .cone([0.012, 0.014, 0.006], [-0.02, 0.05, 0.03], { color: 'orange', rot: [0, 0, 90], noInk: true });
    ['orange', 'red', 'tan', 'yellow', 'orange'].forEach((c, i) => void b.box([0.012, 0.003, 0.01], [0.05 + (i % 3) * 0.015, 0.0015, 0.02 + i * 0.008], { color: c, noInk: true, rot: [0, i * 30, 0] }));
    return b.done();
  }),
  e('fish market', 'places', 'shops', () => {
    const b = m('fish market')
      .box([3.2, 1.0, 1.2], [0, 0.5, 0], { color: 'wood' })
      .box([3.0, 0.12, 1.0], [0, 1.06, 0.02], { color: 'ice' })
      .wedge([3.6, 0.6, 1.8], [0, 2.9, 0.2], { color: 'blue' })
      .label('FISH MARKET', [2.4, 0.4], [0, 2.35, 1.0], { color: 'white' });
    b.pair((s) => void b.stick([s * 1.6, 0, 0.55], [s * 1.6, 2.6, 0.55], 0.1, 'white').stick([s * 1.6, 0, -0.55], [s * 1.6, 2.6, -0.55], 0.1, 'white'));
    b.box([3.6, 0.1, 1.8], [0, 2.6, 0.2], { color: 'white' });
    b.each(5, (i) => {
      const x = -1.2 + i * 0.6;
      b.ball([0.18, 0.13, 0.55], [x, 1.18, 0.05], { color: i % 2 ? 'silver' : '#e88a6a' }).cone([0.16, 0.14, 0.04], [x, 1.18, -0.28], { color: i % 2 ? 'silver' : '#e88a6a', rot: [-90, 0, 0] });
    });
    return b.done();
  }),
  e('fish stick', 'food', 'seafood', () =>
    m('fish stick')
      .cyl([0.2, 0.01, 0.2], [0, 0.005, 0], { color: 'white' })
      .box([0.03, 0.022, 0.11], [-0.035, 0.021, 0], { color: '#e0a040', round: 0.25 })
      .box([0.03, 0.022, 0.11], [0.0, 0.021, 0.005], { color: '#e0a040', round: 0.25 })
      .box([0.03, 0.022, 0.11], [-0.018, 0.043, 0], { color: '#e0a040', round: 0.25, rot: [0, 25, 0] })
      .box([0.026, 0.02, 0.002], [0.0, 0.021, 0.061], { color: 'white', noInk: true })
      .cyl([0.04, 0.02, 0.04], [0.055, 0.02, -0.03], { color: 'cream' })
      .done(),
  ),
  e('fish tail', 'sea', 'sea animal parts', () =>
    m('fish tail')
      .cyl([0.4, 0.02, 0.3], [0, 0.01, 0], { color: 'water' })
      .ball([0.09, 0.14, 0.06], [0, 0.07, 0], { color: 'orange' })
      .ball([0.07, 0.2, 0.025], [0.05, 0.2, 0], { color: 'orange', rot: [0, 0, -32] })
      .ball([0.07, 0.2, 0.025], [-0.05, 0.2, 0], { color: 'orange', rot: [0, 0, 32] })
      .rod([0, 0.12, 0.013], [0.08, 0.26, 0.013], 0.006, '#e86a20', { noInk: true })
      .rod([0, 0.12, 0.013], [-0.08, 0.26, 0.013], 0.006, '#e86a20', { noInk: true })
      .done(),
  ),
  e('fish tank', 'pets', 'pet supplies', () => {
    const b = m('fish tank')
      .box([0.62, 0.04, 0.32], [0, 0.02, 0], { color: 'black', round: 0.1 })
      .box([0.6, 0.36, 0.3], [0, 0.22, 0], { color: '#9ad4ea', round: 0.04 })
      .box([0.62, 0.04, 0.32], [0, 0.42, 0], { color: 'black', round: 0.1 })
      .box([0.58, 0.05, 0.28], [0, 0.065, 0], { color: 'sand' });
    b.each(3, (i) => void b.rod([-0.2 + i * 0.05, 0.08, -0.06 + i * 0.04], [-0.22 + i * 0.06, 0.25 + i * 0.03, -0.06 + i * 0.04], 0.025, 'green'));
    b.ball([0.07, 0.045, 0.02], [0.08, 0.24, 0.16], { color: 'orange' }).cone([0.04, 0.03, 0.01], [0.13, 0.24, 0.16], { color: 'orange', rot: [0, 0, 90] });
    return b.ball([0.05, 0.035, 0.02], [-0.06, 0.32, 0.16], { color: 'yellow' }).cone([0.03, 0.025, 0.01], [-0.1, 0.32, 0.16], { color: 'yellow', rot: [0, 0, -90] }).done();
  }),
  e('fishing hook', 'sports', 'fishing', () =>
    m('fishing hook')
      .torus([0.024, 0.024, 0.01], [0.018, 0.097, 0], { color: 'silver', tube: 0.3 })
      .rod([0.018, 0.087, 0], [0.018, 0.03, 0], 0.012, 'silver')
      .rod([0.018, 0.03, 0], [0.008, 0.005, 0], 0.012, 'silver')
      .rod([0.008, 0.005, 0], [-0.012, 0.008, 0], 0.012, 'silver')
      .rod([-0.012, 0.008, 0], [-0.02, 0.04, 0], 0.012, 'silver')
      .cone([0.016, 0.02, 0.01], [-0.016, 0.035, 0], { color: 'silver', rot: [0, 0, -30] })
      .done(),
  ),
  e('fishing line', 'sports', 'fishing', () =>
    m('fishing line')
      .box([0.2, 0.04, 0.2], [0, 0.02, 0], { color: 'wood' })
      .stick([0, 0.04, 0], [0, 0.65, 0], 0.03, 'wood')
      .stick([0, 0.63, 0], [0.25, 0.63, 0], 0.025, 'wood')
      .cyl([0.12, 0.08, 0.12], [-0.02, 0.09, 0.12], { color: 'white', rot: [0, 0, 90] })
      .cyl([0.1, 0.082, 0.1], [-0.02, 0.09, 0.12], { color: '#4ac0a0', rot: [0, 0, 90] })
      .rod([0.24, 0.62, 0], [0.24, 0.24, 0], 0.004, '#4ac0a0')
      .ball(0.05, [0.24, 0.22, 0], { color: 'red' })
      .ball([0.05, 0.025, 0.05], [0.24, 0.24, 0], { color: 'white' })
      .rod([0.24, 0.2, 0], [0.24, 0.08, 0], 0.004, '#4ac0a0')
      .rod([0.24, 0.08, 0], [0.235, 0.06, 0], 0.006, 'silver')
      .rod([0.235, 0.06, 0], [0.225, 0.07, 0], 0.006, 'silver')
      .done(),
  ),
  e('fishing pole', 'sports', 'fishing', () =>
    m('fishing pole')
      .cyl([0.28, 0.28, 0.28], [0, 0.14, 0], { color: 'blue', taper: 1.15 })
      .cyl([0.3, 0.02, 0.3], [0, 0.28, 0], { color: 'silver' })
      .rod([0, 0.1, 0], [0.9, 2.3, 0], 0.035, '#d8c070')
      .rod([0.9, 2.3, 0], [0.9, 0.8, 0], 0.005, 'white')
      .ball(0.06, [0.9, 0.78, 0], { color: 'red' })
      .ball([0.06, 0.03, 0.06], [0.9, 0.8, 0], { color: 'white' })
      .rod([0.9, 0.75, 0], [0.9, 0.5, 0], 0.005, 'white')
      .done(),
  ),
  e('fishing rod', 'sports', 'fishing', () =>
    m('fishing rod')
      .box([0.4, 0.2, 0.22], [0, 0.1, 0], { color: 'green', round: 0.2 })
      .box([0.12, 0.03, 0.04], [0, 0.215, 0], { color: 'darkgray' })
      .capsule([0.04, 0.3, 0.04], [-0.28, 0.2, 0], { color: 'black', rot: [0, 0, -35] })
      .rod([-0.36, 0.08, 0], [0.75, 1.65, 0], 0.022, 'darkgray')
      .cyl([0.1, 0.05, 0.1], [-0.2, 0.26, 0.07], { color: 'silver', rot: [90, 0, 0] })
      .rod([-0.24, 0.3, 0.05], [-0.2, 0.26, 0.03], 0.014, 'silver')
      .rod([0.75, 1.65, 0], [0.75, 0.45, 0], 0.004, 'white')
      .rod([0.75, 0.45, 0], [0.74, 0.42, 0], 0.006, 'silver')
      .done(),
  ),
  e('fishing reel', 'sports', 'fishing', () =>
    m('fishing reel')
      .ball([0.09, 0.09, 0.08], [0, 0.07, 0], { color: 'darkgray' })
      .cyl([0.085, 0.07, 0.085], [0, 0.07, 0.08], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.07, 0.072, 0.07], [0, 0.07, 0.08], { color: '#4ac0a0', rot: [90, 0, 0] })
      .torus([0.11, 0.11, 0.008], [0, 0.07, 0.1], { color: 'silver', tube: 0.06, rot: [0, 0, 30] })
      .box([0.025, 0.1, 0.03], [0, 0.14, 0], { color: 'darkgray' })
      .stick([0, 0.2, -0.25], [0, 0.2, 0.3], 0.03, 'black')
      .stick([0.05, 0.07, 0], [0.08, 0.07, 0], 0.012, 'silver', { name: 'crank', pivot: [0.06, 0.07, 0] })
      .rod([0.08, 0.07, 0], [0.08, 0.02, 0], 0.012, 'silver', { parent: 'crank' })
      .capsule([0.022, 0.035, 0.022], [0.095, 0.02, 0], { color: 'black', rot: [0, 0, 90], parent: 'crank' })
      .done(),
  ),
  e('fitness tracker', 'tech', 'wearables', () =>
    m('fitness tracker')
      .torus([0.07, 0.06, 0.02], [0, 0.03, 0], { color: 'black', tube: 0.16, rot: [90, 0, 0] })
      .box([0.025, 0.045, 0.012], [0, 0.03, 0.035], { color: 'black', round: 0.4 })
      .box([0.019, 0.036, 0.004], [0, 0.03, 0.042], { color: 'cyan', glow: true })
      .done(),
  ),
  e('fixed ladder', 'workshop', 'ladders', () => {
    const b = m('fixed ladder').box([1.4, 3.2, 0.25], [0, 1.6, -0.3], { color: 'stone' });
    b.pair((s) => void b.stick([s * 0.22, 0, 0], [s * 0.22, 3.4, 0], 0.05, 'yellow').stick([s * 0.22, 3.0, 0], [s * 0.22, 3.0, -0.2], 0.04, 'yellow').stick([s * 0.22, 0.5, 0], [s * 0.22, 0.5, -0.2], 0.04, 'yellow'));
    b.each(11, (i) => void b.stick([-0.22, 0.25 + i * 0.3, 0], [0.22, 0.25 + i * 0.3, 0], 0.035, 'yellow'));
    b.each(4, (i) => void b.torus([0.7, 0.7, 0.04], [0, 1.6 + i * 0.5, 0.15], { color: 'yellow', rot: [90, 0, 0], tube: 0.06 }));
    return b.done();
  }),
  e('flag', 'ideas', 'flags', () =>
    m('flag')
      .box([0.36, 0.14, 0.36], [0, 0.07, 0], { color: 'darkgray' })
      .stick([0, 0.14, 0], [0, 1.5, 0], 0.035, 'silver')
      .ball(0.06, [0, 1.53, 0], { color: 'gold' })
      .box([0.4, 0.5, 0.025], [0.21, 1.2, 0.02], { color: 'red', rot: [0, -10, 0] })
      .box([0.36, 0.5, 0.025], [0.58, 1.18, 0.02], { color: 'red', rot: [0, 12, 0] })
      .star(0.18, [0.3, 1.22, 0.05], { color: 'yellow' })
      .done(),
  ),
  e('flagpole', 'places', 'street furniture', () =>
    m('flagpole')
      .box([1.6, 0.8, 1.6], [0, 0.4, 0], { color: 'stone' })
      .stick([0, 0.8, 0], [0, 10, 0], 0.18, 'silver')
      .ball(0.35, [0, 10.15, 0], { color: 'gold' })
      .box([2.4, 1.6, 0.06], [1.25, 9.0, 0], { color: 'blue', rot: [0, -8, 0] })
      .box([2.0, 0.3, 0.07], [1.25, 9.0, 0.02], { color: 'white', rot: [0, -8, 0], noInk: true })
      .done(),
  ),
  e('flamethrower', 'armory', 'heavy weapons', () =>
    m('flamethrower', { view: 'side' })
      .cyl([0.16, 0.5, 0.16], [0, 0.08, -0.1], { color: 'red', rot: [90, 0, 0] })
      .box([0.08, 0.1, 0.5], [0, 0.2, -0.05], { color: 'darkgray' })
      .stick([0, 0.22, 0.2], [0, 0.22, 0.62], 0.05, 'iron')
      .cyl([0.08, 0.06, 0.08], [0, 0.22, 0.64], { color: 'black', rot: [90, 0, 0] })
      .box([0.05, 0.14, 0.06], [0, 0.2, -0.32], { color: 'black', rot: [20, 0, 0] })
      .box([0.05, 0.12, 0.05], [0, 0.18, 0.18], { color: 'black', rot: [-10, 0, 0] })
      .cone([0.2, 0.35, 0.2], [0, 0.22, 0.85], { color: 'orange', rot: [-90, 0, 0], taper: 0.15 })
      .cone([0.1, 0.25, 0.1], [0, 0.22, 0.8], { color: 'yellow', rot: [-90, 0, 0], glow: true })
      .done(),
  ),
  e('flare', 'sports', 'outdoor gear', () =>
    m('flare')
      .cyl([0.035, 0.17, 0.035], [0, 0.085, 0], { color: 'red' })
      .cyl([0.037, 0.03, 0.037], [0, 0.02, 0], { color: 'black' })
      .cyl([0.03, 0.02, 0.03], [0, 0.18, 0], { color: '#ff6060' })
      .ball([0.05, 0.06, 0.05], [0, 0.21, 0], { color: '#ff3040', glow: true })
      .ball([0.06, 0.05, 0.06], [0.02, 0.27, 0], { color: 'lightgray' })
      .done(),
  ),
  e('flare gun', 'sports', 'outdoor gear', () =>
    m('flare gun', { view: 'side' })
      .box([0.045, 0.12, 0.05], [0, 0.06, -0.06], { color: 'orange', rot: [-15, 0, 0], round: 0.4 })
      .box([0.05, 0.06, 0.1], [0, 0.14, -0.04], { color: 'orange', round: 0.3 })
      .cyl([0.055, 0.16, 0.055], [0, 0.15, 0.08], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.06, 0.02, 0.06], [0, 0.15, 0.16], { color: '#d85a10', rot: [90, 0, 0] })
      .torus([0.04, 0.04, 0.01], [0, 0.085, -0.01], { color: 'orange', rot: [0, 90, 0] })
      .box([0.015, 0.03, 0.015], [0, 0.18, -0.09], { color: 'black' })
      .done(),
  ),
  e('flash bomb', 'armory', 'grenades', () => {
    const b = m('flash bomb')
      .cyl([0.045, 0.11, 0.045], [0, 0.055, 0], { color: '#3a3a40' })
      .cyl([0.03, 0.02, 0.03], [0, 0.12, 0], { color: 'silver' })
      .box([0.012, 0.09, 0.006], [0, 0.085, 0.026], { color: 'silver', rot: [-5, 0, 0] })
      .torus([0.03, 0.03, 0.005], [0.03, 0.13, 0], { color: 'silver', tube: 0.15 });
    b.each(3, (i) => void b.box([0.012, 0.02, 0.004], [-0.015, 0.03 + i * 0.03, 0.022], { color: 'black', noInk: true }));
    return b.cyl([0.047, 0.012, 0.047], [0, 0.1, 0], { color: 'yellow', noInk: true }).done();
  }),
  e('flashcard', 'study', 'school supplies', () =>
    m('flashcard')
      .box([0.14, 0.025, 0.09], [0, 0.0125, 0], { color: 'white', round: 0.1 })
      .box([0.14, 0.004, 0.09], [0, 0.026, 0], { color: 'skyblue', noInk: true, round: 0 })
      .box([0.13, 0.08, 0.008], [0, 0.065, -0.03], { color: 'white', rot: [-12, 0, 0], round: 0.1 })
      .box([0.13, 0.006, 0.009], [0, 0.095, -0.036], { color: 'red', rot: [-12, 0, 0], noInk: true })
      .label('A B C', [0.1, 0.04], [0, 0.06, -0.02], { color: 'white', rot: [-12, 0, 0] })
      .done(),
  ),
  e('flashlight', 'tech', 'gadgets', () =>
    m('flashlight', { view: 'side' })
      .cyl([0.035, 0.12, 0.035], [0, 0.0255, -0.03], { color: 'black', rot: [90, 0, 0] })
      .cyl([0.036, 0.04, 0.036], [0, 0.0255, 0.045], { color: 'black', rot: [90, 0, 0], taper: 1.45 })
      .cyl([0.05, 0.006, 0.05], [0, 0.0255, 0.067], { color: 'yellow', rot: [90, 0, 0], glow: true })
      .box([0.012, 0.01, 0.02], [0, 0.045, -0.01], { color: 'red' })
      .cone([0.09, 0.16, 0.09], [0, 0.0455, 0.15], { color: 'cream', rot: [-90, 0, 0], glow: true })
      .done(),
  ),
  e('flier (paper)', 'study', 'paper goods', () => {
    const b = m('flier (paper)')
      .box([0.26, 0.03, 0.08], [0, 0.015, 0], { color: 'wood' })
      .box([0.21, 0.29, 0.008], [0, 0.17, -0.02], { color: 'white', rot: [-8, 0, 0], round: 0.05 })
      .label('SALE!', [0.17, 0.05], [0, 0.27, -0.008], { color: 'red', rot: [-8, 0, 0] })
      .box([0.12, 0.08, 0.004], [0, 0.185, -0.012], { color: 'skyblue', rot: [-8, 0, 0], noInk: true })
      .ball([0.04, 0.04, 0.005], [0.03, 0.195, -0.01], { color: 'yellow', noInk: true });
    b.each(3, (i) => void b.box([0.16, 0.008, 0.004], [0, 0.12 - i * 0.025, -0.02 + (0.12 - i * 0.025) * 0.03], { color: 'gray', rot: [-8, 0, 0], noInk: true }));
    return b.done();
  }),
  e('floodlight', 'home', 'lighting', () =>
    m('floodlight')
      .box([0.24, 0.03, 0.14], [0, 0.015, 0], { color: 'darkgray' })
      .stick([0, 0.03, 0], [0, 0.12, 0], 0.03, 'darkgray')
      .stick([-0.16, 0.12, 0], [0.16, 0.12, 0], 0.03, 'darkgray')
      .stick([0.16, 0.12, 0], [0.16, 0.22, 0], 0.03, 'darkgray')
      .stick([-0.16, 0.12, 0], [-0.16, 0.22, 0], 0.03, 'darkgray')
      .box([0.26, 0.2, 0.1], [0, 0.22, 0.02], { color: 'black', rot: [-15, 0, 0], round: 0.15 })
      .box([0.22, 0.16, 0.01], [0, 0.23, 0.075], { color: '#fffbe0', rot: [-15, 0, 0], glow: true })
      .done(),
  ),
  e('floor', 'home', 'flooring', () => {
    const b = m('floor');
    const cols = ['wood', 'lightwood', '#b07840', 'wood', 'lightwood'];
    b.each(5, (i) => void b.box([0.2, 0.08, 1.0], [-0.4 + i * 0.2, 0.04, ((i % 2) - 0.5) * 0.06], { color: cols[i], round: 0.1 }));
    b.each(5, (i) => void b.box([0.19, 0.005, 0.01], [-0.4 + i * 0.2, 0.081, 0.15 + (i % 3) * 0.1], { color: 'darkwood', noInk: true }));
    return b.done();
  }),
  e('floor lamp', 'home', 'lighting', () =>
    m('floor lamp')
      .cyl([0.32, 0.04, 0.32], [0, 0.02, 0], { color: 'black' })
      .stick([0, 0.04, 0], [0, 1.25, 0], 0.03, 'brass')
      .cyl([0.42, 0.32, 0.42], [0, 1.32, 0], { color: 'cream', taper: 0.6 })
      .ball(0.1, [0, 1.22, 0], { color: '#fff4c0', glow: true })
      .cyl([0.05, 0.04, 0.05], [0, 1.5, 0], { color: 'brass' })
      .done(),
  ),
  e('floor tile', 'home', 'flooring', () =>
    m('floor tile')
      .box([0.32, 0.08, 0.32], [0, 0.04, 0], { color: '#c8b8a0', round: 0.1 })
      .box([0.3, 0.3, 0.025], [0, 0.17, -0.12], { color: 'white', rot: [-15, 0, 0], round: 0.1 })
      .box([0.14, 0.14, 0.004], [0, 0.17, -0.105], { color: 'navy', rot: [-15, 0, 45], noInk: true })
      .box([0.07, 0.07, 0.006], [0, 0.17, -0.102], { color: 'gold', rot: [-15, 0, 45], noInk: true })
      .done(),
  ),
  e('floppy disk', 'tech', 'computer things', () =>
    m('floppy disk')
      .box([0.09, 0.094, 0.01], [0, 0.047, 0], { color: '#2a3a8a', round: 0.1 })
      .box([0.045, 0.03, 0.012], [0.004, 0.079, 0], { color: 'silver', round: 0.05 })
      .box([0.012, 0.022, 0.014], [0.012, 0.079, 0], { color: '#2a3a8a', round: 0.05 })
      .box([0.065, 0.045, 0.004], [0, 0.03, 0.006], { color: 'white', noInk: true, round: 0.1 })
      .box([0.055, 0.004, 0.002], [0, 0.04, 0.009], { color: 'skyblue', noInk: true })
      .done(),
  ),
  e('floss', 'home', 'bathroom', () =>
    m('floss')
      .box([0.05, 0.06, 0.022], [0, 0.03, 0], { color: 'white', round: 0.6 })
      .box([0.052, 0.025, 0.024], [0, 0.065, 0], { color: '#5ac8b0', round: 0.6 })
      .box([0.035, 0.015, 0.003], [0, 0.03, 0.012], { color: '#5ac8b0', noInk: true })
      .rod([0, 0.078, 0.005], [0.03, 0.1, 0.02], 0.003, 'white')
      .rod([0.03, 0.1, 0.02], [0.06, 0.06, 0.03], 0.003, 'white')
      .done(),
  ),
  e('flour', 'food', 'baking', () =>
    m('flour')
      .box([0.16, 0.24, 0.1], [0, 0.12, 0], { color: '#f4ecd8', round: 0.2 })
      .wedge([0.16, 0.04, 0.06], [0, 0.26, 0], { color: '#f4ecd8' })
      .label('FLOUR', [0.12, 0.04], [0, 0.17, 0.052], { color: 'blue' })
      .rod([0, 0.06, 0.052], [0, 0.12, 0.052], 0.008, 'gold', { noInk: true })
      .ball([0.015, 0.025, 0.006], [0.01, 0.1, 0.053], { color: 'gold', noInk: true })
      .ball([0.015, 0.025, 0.006], [-0.01, 0.09, 0.053], { color: 'gold', noInk: true })
      .ball([0.12, 0.04, 0.1], [0.13, 0.02, 0.08], { color: 'white' })
      .done(),
  ),
  e('flower box', 'garden', 'planters', () => {
    const b = m('flower box').box([0.6, 0.15, 0.16], [0, 0.075, 0], { color: '#b8603a', round: 0.15 }).box([0.56, 0.02, 0.13], [0, 0.15, 0], { color: 'dirt' });
    ['red', 'yellow', 'pink', 'violet', 'orange'].forEach((c, i) => {
      const x = -0.22 + i * 0.11;
      b.rod([x, 0.15, 0], [x, 0.25, 0.01], 0.012, 'leaf').ball([0.06, 0.03, 0.03], [x + 0.025, 0.18, 0.02], { color: 'leaf' }).ball(0.055, [x, 0.27, 0.01], { color: c }).ball(0.02, [x, 0.27, 0.035], { color: 'yellow' });
    });
    return b.done();
  }),
  e('flower shop', 'places', 'shops', () => {
    const b = house('flower shop', { w: 6, h: 4, d: 4, wall: '#f8e8f0', roof: '#5a8a5a', sign: 'FLOWERS', signC: 'pink' });
    b.box([6, 0.1, 1.2], [0, 2.7, 2.6], { color: 'pink', rot: [15, 0, 0] });
    b.pair((s) => {
      b.cyl([0.5, 0.5, 0.5], [s * 1.8, 0.25, 2.8], { color: 'silver' });
      ['red', 'yellow', 'violet'].forEach((c, i) => void b.ball(0.32, [s * 1.8 + (i - 1) * 0.2, 0.65 + (i % 2) * 0.12, 2.8], { color: c }));
    });
    return b.done();
  }),
  e('flowerbed', 'garden', 'beds', () => {
    const b = m('flowerbed').box([1.2, 0.15, 0.6], [0, 0.075, 0], { color: 'darkwood', round: 0.1 }).box([1.12, 0.03, 0.52], [0, 0.15, 0], { color: 'dirt' });
    const cols = ['red', 'yellow', 'pink', 'violet', 'orange', 'white'];
    b.each(12, (i) => {
      const x = -0.45 + (i % 6) * 0.18, z = i < 6 ? 0.12 : -0.12, h = 0.24 + (i % 3) * 0.04;
      b.rod([x, 0.15, z], [x, h, z], 0.02, 'leaf').ball(0.12, [x, h + 0.03, z], { color: cols[(i + (i < 6 ? 0 : 3)) % 6] });
    });
    return b.done();
  }),
  e('flowerpot', 'garden', 'planters', () =>
    m('flowerpot')
      .cyl([0.13, 0.13, 0.13], [0, 0.065, 0], { color: '#c06a40', taper: 1.3 })
      .cyl([0.18, 0.035, 0.18], [0, 0.14, 0], { color: '#c06a40' })
      .cyl([0.16, 0.01, 0.16], [0, 0.155, 0], { color: 'dirt' })
      .rod([0, 0.155, 0], [0, 0.25, 0], 0.012, 'leaf')
      .ball([0.06, 0.02, 0.03], [0.03, 0.2, 0], { color: 'leaf', rot: [0, 0, 20] })
      .ball(0.06, [0, 0.27, 0], { color: 'red' })
      .ball(0.025, [0, 0.27, 0.025], { color: 'yellow' })
      .done(),
  ),
  e('flute', 'music', 'woodwinds', () => {
    const b = m('flute').cyl([0.16, 0.055, 0.16], [0, 0.0275, 0], { color: 'black' }).cone([0.03, 0.12, 0.03], [0, 0.09, 0], { color: 'black' });
    b.cyl([0.024, 0.66, 0.024], [0, 0.4, 0], { color: 'silver' }).box([0.018, 0.025, 0.012], [0, 0.66, 0.012], { color: 'silver', round: 0.4 });
    b.each(7, (i) => void b.cyl([0.014, 0.006, 0.014], [0, 0.2 + i * 0.045, 0.014], { color: 'metal', rot: [90, 0, 0] }));
    return b.stick([0, 0.24, 0.012], [0, 0.5, 0.012], 0.006, 'metal').done();
  }),
  e('fly swatter', 'home', 'cleaning', () => {
    const b = m('fly swatter')
      .capsule([0.036, 0.13, 0.036], [0, 0.065, 0], { color: 'red' })
      .stick([0, 0.12, 0], [0, 0.36, 0], 0.008, 'silver')
      .box([0.12, 0.14, 0.01], [0, 0.42, 0], { color: 'yellow', round: 0.2 });
    b.each(4, (i) => void b.box([0.004, 0.13, 0.012], [-0.045 + i * 0.03, 0.42, 0], { color: '#c8a020', noInk: true }).box([0.11, 0.004, 0.012], [0, 0.375 + i * 0.03, 0], { color: '#c8a020', noInk: true }));
    return b.done();
  }),
  e('flying car', 'garage', 'cars', () => {
    const b = m('flying car', { view: 'side' })
      .box([1.7, 0.5, 3.8], [0, 0.95, 0], { color: 'teal', round: 0.6 })
      .ball([1.4, 0.7, 1.8], [0, 1.25, -0.2], { color: 'glass' })
      .box([0.5, 0.06, 0.2], [0, 1.0, 1.9], { color: 'yellow', glow: true });
    b.pair((s) => {
      b.cyl([0.6, 0.9, 0.6], [s * 1.0, 0.65, 1.2], { color: 'silver', rot: [90, 0, 0] }).cyl([0.6, 0.9, 0.6], [s * 1.0, 0.65, -1.2], { color: 'silver', rot: [90, 0, 0] });
      b.cone([0.4, 0.5, 0.4], [s * 1.0, 0.25, 1.2], { color: 'cyan', rot: [180, 0, 0], glow: true }).cone([0.4, 0.5, 0.4], [s * 1.0, 0.25, -1.2], { color: 'cyan', rot: [180, 0, 0], glow: true });
      b.wedge([1.2, 0.08, 0.8], [s * 1.2, 1.0, -0.4], { color: 'teal', rot: [90, 0, s * -90] });
    });
    return b.done();
  }),
  e('foam', 'home', 'cleaning', () => {
    const b = m('foam');
    const B: Array<[number, V]> = [[0.07, [0, 0.035, 0]], [0.06, [0.05, 0.03, 0.02]], [0.055, [-0.05, 0.028, 0.01]], [0.05, [0.02, 0.07, -0.01]], [0.045, [-0.025, 0.065, 0.02]], [0.04, [0.035, 0.03, -0.045]], [0.04, [-0.03, 0.03, -0.04]], [0.035, [0, 0.1, 0]], [0.03, [0.08, 0.018, -0.01]]];
    B.forEach(([d, at], i) => void b.ball(d, at, { color: i % 3 ? 'white' : '#e0f0ff' }));
    return b.done();
  }),
  e('foam block', 'toys', 'blocks', () => {
    const b = m('foam block').box([0.3, 0.18, 0.2], [0, 0.09, 0], { color: 'yellow', round: 0.35 }).wedge([0.2, 0.12, 0.18], [0.02, 0.24, 0], { color: 'blue' });
    b.each(8, (i) => void b.ball(0.012, [-0.12 + (i % 4) * 0.08, 0.05 + Math.floor(i / 4) * 0.07, 0.1], { color: '#d8b820', noInk: true }));
    return b.box([0.12, 0.12, 0.12], [-0.22, 0.06, 0.06], { color: 'red', round: 0.35 }).done();
  }),
  e('foam dart', 'toys', 'toy guns', () =>
    m('foam dart')
      .cyl([0.015, 0.07, 0.015], [0, 0.035, 0], { color: 'blue' })
      .cyl([0.016, 0.014, 0.016], [0, 0.077, 0], { color: 'orange' })
      .ball([0.016, 0.01, 0.016], [0, 0.084, 0], { color: 'orange' })
      .cyl([0.015, 0.07, 0.015], [0.05, 0.0075, 0.02], { color: 'blue', rot: [0, 30, 90] })
      .cyl([0.016, 0.014, 0.016], [0.088, 0.0075, 0.042], { color: 'orange', rot: [0, 30, 90] })
      .done(),
  ),
  e('foam dart gun', 'toys', 'toy guns', () =>
    m('foam dart gun', { view: 'side' })
      .box([0.07, 0.12, 0.42], [0, 0.22, 0.02], { color: 'blue', round: 0.4 })
      .box([0.06, 0.16, 0.07], [0, 0.09, -0.08], { color: 'orange', rot: [-15, 0, 0], round: 0.4 })
      .cyl([0.06, 0.24, 0.06], [0, 0.24, 0.32], { color: 'blue', rot: [90, 0, 0] })
      .cyl([0.065, 0.03, 0.065], [0, 0.24, 0.45], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.12, 0.1, 0.12], [0, 0.22, 0.1], { color: 'orange', rot: [90, 0, 0] })
      .box([0.06, 0.1, 0.16], [0, 0.18, -0.25], { color: 'orange', round: 0.4 })
      .box([0.05, 0.05, 0.12], [0, 0.31, -0.02], { color: 'yellow', round: 0.4 })
      .torus([0.07, 0.07, 0.015], [0, 0.12, 0.0], { color: 'blue', rot: [0, 90, 0] })
      .done(),
  ),
  e('foam finger', 'sports', 'fan gear', () =>
    m('foam finger')
      .box([0.2, 0.2, 0.08], [0, 0.1, 0], { color: 'blue', round: 0.4 })
      .capsule([0.065, 0.22, 0.07], [0.03, 0.3, 0], { color: 'blue' })
      .capsule([0.05, 0.1, 0.06], [-0.11, 0.17, 0], { color: 'blue', rot: [0, 0, 40] })
      .box([0.18, 0.05, 0.07], [-0.02, 0.21, 0.01], { color: 'blue', round: 0.6 })
      .label('#1', [0.13, 0.08], [0, 0.09, 0.045], { color: 'yellow' })
      .done(),
  ),
  e('fog horn', 'sea', 'seaside things', () =>
    m('fog horn')
      .box([0.3, 0.12, 0.3], [0, 0.06, 0], { color: 'darkgray' })
      .stick([0, 0.12, 0], [0, 0.22, 0], 0.08, 'darkgray')
      .cyl([0.1, 0.25, 0.1], [0, 0.26, -0.12], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.1, 0.35, 0.1], [0, 0.26, 0.17], { color: 'red', rot: [90, 0, 0], taper: 3.4 })
      .cyl([0.3, 0.02, 0.3], [0, 0.26, 0.345], { color: '#2a1a1a', rot: [90, 0, 0] })
      .done(),
  ),
  e('folder', 'study', 'office supplies', () =>
    m('folder')
      .box([0.24, 0.29, 0.026], [0, 0.145, 0], { color: '#e8c878', round: 0.05 })
      .box([0.08, 0.025, 0.026], [-0.07, 0.3, 0], { color: '#e8c878', round: 0.2 })
      .box([0.2, 0.04, 0.012], [0.01, 0.29, 0.002], { color: 'white' })
      .box([0.12, 0.03, 0.004], [0.03, 0.2, 0.014], { color: 'white', noInk: true })
      .done(),
  ),
  e('folding chair', 'home', 'seating', () => {
    const b = m('folding chair')
      .box([0.44, 0.065, 0.4], [0, 0.45, 0.02], { color: '#5a6470', round: 0.4 })
      .box([0.42, 0.22, 0.04], [0, 0.72, -0.2], { color: '#5a6470', rot: [-8, 0, 0] });
    b.pair((s) => {
      b.stick([s * 0.21, 0, 0.25], [s * 0.21, 0.85, -0.22], 0.025, 'silver');
      b.stick([s * 0.21, 0, -0.22], [s * 0.21, 0.45, 0.15], 0.025, 'silver');
      b.box([0.05, 0.03, 0.06], [s * 0.21, 0.015, 0.25], { color: 'black' }).box([0.05, 0.03, 0.06], [s * 0.21, 0.015, -0.22], { color: 'black' });
    });
    return b.done();
  }),
  e('folding fan', 'wardrobe', 'accessories', () => {
    const b = m('folding fan').ball(0.045, [0, 0.04, 0.01], { color: 'gold' });
    b.each(9, (i) => {
      const a = ((-72 + i * 18) * Math.PI) / 180;
      b.box([0.052, 0.18, 0.032], [Math.sin(a) * 0.13, 0.04 + Math.cos(a) * 0.13, 0], { color: i % 2 ? 'red' : '#e85060', rot: [0, 0, (-a * 180) / Math.PI], round: 0.1 });
      b.stick([0, 0.04, 0.014], [Math.sin(a) * 0.05, 0.04 + Math.cos(a) * 0.05, 0.014], 0.008, 'darkwood');
    });
    return b.rod([0, 0.025, 0.01], [0, 0.005, 0.03], 0.012, 'gold').ball([0.06, 0.04, 0.008], [0.06, 0.15, 0.016], { color: 'gold', noInk: true }).done();
  }),
  e('folding screen', 'home', 'furniture', () => {
    const b = m('folding screen');
    b.each(4, (i) => {
      const x = -0.75 + i * 0.5, z = i % 2 ? 0.1 : -0.1, ry = i % 2 ? -22 : 22;
      b.box([0.5, 1.75, 0.05], [x, 0.95, z], { color: 'darkwood', rot: [0, ry, 0], round: 0.05 })
        .box([0.42, 1.6, 0.056], [x, 0.97, z], { color: 'cream', rot: [0, ry, 0], round: 0.02 })
        .box([0.42, 0.02, 0.06], [x, 0.7, z], { color: 'darkwood', rot: [0, ry, 0], noInk: true })
        .box([0.42, 0.02, 0.06], [x, 1.25, z], { color: 'darkwood', rot: [0, ry, 0], noInk: true })
        .box([0.02, 1.6, 0.06], [x, 0.97, z], { color: 'darkwood', rot: [0, ry, 0], noInk: true })
        .box([0.16, 0.14, 0.16], [x, 0.07, z], { color: 'darkwood', round: 0.3 });
    });
    return b.done();
  }),
  e('folding table', 'home', 'furniture', () => {
    const b = m('folding table')
      .box([0.86, 0.075, 0.86], [0, 0.72, 0], { color: 'darkgreen', round: 0.15 })
      .box([0.88, 0.04, 0.88], [0, 0.69, 0], { color: 'black', round: 0.2 });
    for (const [x, z] of [[0.38, 0.38], [-0.38, 0.38], [0.38, -0.38], [-0.38, -0.38]]) b.stick([x, 0, z], [x, 0.68, z], 0.03, 'black');
    b.pair((s) => void b.stick([s * 0.38, 0.3, 0.38], [s * 0.1, 0.66, 0.38], 0.015, 'silver'));
    return b.done();
  }),
  e('food', 'food', 'meals', () =>
    m('food')
      .cyl([0.26, 0.015, 0.26], [0, 0.0075, 0], { color: 'white' })
      .box([0.1, 0.03, 0.07], [-0.03, 0.03, -0.02], { color: '#7a3a20', round: 0.4 })
      .ball([0.08, 0.05, 0.07], [0.06, 0.035, -0.03], { color: '#f4ecc0' })
      .ball(0.04, [0.04, 0.03, 0.06], { color: 'green' })
      .ball(0.035, [0.07, 0.03, 0.04], { color: 'darkgreen' })
      .stick([0.04, 0.012, 0.06], [0.03, 0.03, 0.06], 0.012, '#9ac060')
      .ball(0.018, [-0.06, 0.025, 0.06], { color: 'orange' })
      .ball(0.018, [-0.04, 0.025, 0.08], { color: 'orange' })
      .done(),
  ),
  e('food truck', 'garage', 'trucks', () => {
    const b = m('food truck', { view: 'side' })
      .box([2.2, 2.4, 4.6], [0, 1.65, -0.4], { color: '#f0c030', round: 0.15 })
      .box([2.1, 1.6, 1.4], [0, 1.25, 2.4], { color: '#f0c030', round: 0.3 })
      .box([2.0, 0.7, 0.1], [0, 1.65, 3.12], { color: 'glass' })
      .box([0.1, 1.0, 2.4], [1.11, 1.9, -0.5], { color: '#2a2a2a' })
      .box([0.9, 0.06, 2.6], [1.5, 2.5, -0.5], { color: 'red', rot: [0, 0, -18] })
      .box([0.3, 0.1, 2.4], [1.2, 1.35, -0.5], { color: 'silver' })
      .label('TACOS', [0.06, 0.5], [1.14, 2.62, -0.5], { color: 'white', rot: [0, 90, 0] })
      .box([0.9, 0.5, 0.9], [0, 3.1, -0.6], { color: '#f0a020', round: 0.8 });
    for (const z of [1.9, -1.6]) b.pair((s) => void b.torus([0.9, 0.9, 0.3], [s * 1.0, 0.45, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    return b.done();
  }),
  e('foosball', 'toys', 'games', () => {
    const b = m('foosball')
      .box([1.2, 0.2, 0.7], [0, 0.8, 0], { color: 'darkwood', round: 0.1 })
      .box([1.12, 0.02, 0.62], [0, 0.9, 0], { color: 'green', noInk: true });
    for (const [x, z] of [[0.55, 0.3], [-0.55, 0.3], [0.55, -0.3], [-0.55, -0.3]]) b.stick([x, 0, z], [x, 0.72, z], 0.07, 'darkwood');
    b.each(4, (i) => {
      const x = -0.42 + i * 0.28, c = i % 2 ? 'blue' : 'red';
      b.stick([x, 0.96, -0.5], [x, 0.96, 0.5], 0.02, 'silver');
      b.each(3, (j) => void b.box([0.04, 0.09, 0.04], [x, 0.94, -0.2 + j * 0.2], { color: c, round: 0.4 }));
      b.capsule([0.045, 0.12, 0.045], [x, 0.96, i % 2 ? -0.56 : 0.56], { color: 'black', rot: [90, 0, 0] });
    });
    return b.done();
  }),
  e('foot', 'clinic', 'body parts', () => {
    const b = m('foot').ball([0.11, 0.075, 0.26], [0, 0.0375, 0.03], { color: 'skin3' }).cyl([0.08, 0.16, 0.09], [0, 0.12, -0.05], { color: 'skin3' }).ball([0.04, 0.03, 0.03], [0.045, 0.1, -0.05], { color: 'skin3' });
    b.each(5, (i) => void b.ball(0.036 - i * 0.004, [-0.035 + i * 0.018, 0.032 - i * 0.002, 0.16 - i * 0.012], { color: 'skin3' }));
    return b.done();
  }),
  e('football', 'sports', 'balls', () => {
    const b = m('football').ball(0.22, [0, 0.11, 0], { color: 'white' });
    const f = 1.618;
    const N: V[] = [[0, 1, f], [0, 1, -f], [0, -1, f], [0, -1, -f], [1, f, 0], [-1, f, 0], [1, -f, 0], [-1, -f, 0], [f, 0, 1], [-f, 0, 1], [f, 0, -1], [-f, 0, -1]];
    for (const n of N) {
      const l = Math.hypot(...n), u = n.map((v) => v / l) as V;
      b.cyl([0.06, 0.008, 0.06], [u[0] * 0.108, 0.11 + u[1] * 0.108, u[2] * 0.108], { color: 'black', noInk: true, rot: [(Math.atan2(u[2], u[1]) * 180) / Math.PI, 0, (-Math.asin(u[0]) * 180) / Math.PI] });
    }
    return b.done();
  }),
  e('football helmet', 'sports', 'protective gear', () => {
    const b = m('football helmet')
      .ball([0.26, 0.24, 0.3], [0, 0.15, -0.02], { color: 'navy' })
      .box([0.03, 0.006, 0.28], [0, 0.27, -0.02], { color: 'white', noInk: true, rot: [0, 0, 0] })
      .ball(0.05, [0.12, 0.13, 0], { color: 'darkgray' })
      .ball(0.05, [-0.12, 0.13, 0], { color: 'darkgray' });
    b.pair((s) => void b.rod([s * 0.11, 0.13, 0.04], [s * 0.06, 0.06, 0.15], 0.015, 'gray'));
    b.each(3, (i) => void b.rod([-0.08, 0.04 + i * 0.045, 0.12 + i * 0.01], [0.08, 0.04 + i * 0.045, 0.12 + i * 0.01], 0.014, 'gray'));
    return b.stick([0, 0.04, 0.15], [0, 0.14, 0.15], 0.014, 'gray').done();
  }),
  e('fork', 'kitchen', 'cutlery', () => {
    const b = m('fork')
      .box([0.022, 0.11, 0.015], [0, 0.055, 0], { color: 'silver', round: 0.6 })
      .box([0.012, 0.03, 0.01], [0, 0.12, 0], { color: 'silver', round: 0.4 })
      .box([0.03, 0.02, 0.008], [0, 0.142, 0], { color: 'silver', round: 0.4 });
    b.each(4, (i) => void b.box([0.005, 0.05, 0.006], [-0.0115 + i * 0.0077, 0.175, 0], { color: 'silver', round: 0.4 }));
    return b.done();
  }),
  e('forklift', 'garage', 'work vehicles', () => {
    const b = m('forklift', { view: 'side' })
      .box([1.1, 0.8, 1.8], [0, 0.7, -0.1], { color: '#f0b020', round: 0.2 })
      .box([1.1, 0.7, 0.5], [0, 0.65, -1.15], { color: '#3a3a3a', round: 0.2 })
      .box([0.5, 0.15, 0.45], [0, 1.18, -0.3], { color: 'black' })
      .box([0.5, 0.5, 0.1], [0, 1.4, -0.55], { color: 'black' })
      .box([1.2, 0.08, 1.4], [0, 2.15, -0.2], { color: '#3a3a3a' });
    b.pair((s) => {
      b.stick([s * 0.5, 1.1, 0.45], [s * 0.5, 2.15, 0.45], 0.06, '#3a3a3a').stick([s * 0.5, 1.1, -0.85], [s * 0.5, 2.15, -0.85], 0.06, '#3a3a3a');
      b.box([0.08, 2.4, 0.12], [s * 0.35, 1.25, 1.0], { color: 'darkgray' });
      b.box([0.1, 0.05, 1.0], [s * 0.2, 0.12, 1.55], { color: 'iron' }).box([0.1, 0.5, 0.05], [s * 0.2, 0.37, 1.07], { color: 'iron' });
      b.torus([0.6, 0.6, 0.25], [s * 0.55, 0.3, 0.55], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 }).torus([0.5, 0.5, 0.22], [s * 0.55, 0.25, -0.9], { color: 'rubber', rot: [0, 90, 0], tube: 0.4 });
    });
    return b.stick([-0.35, 2.3, 1.0], [0.35, 2.3, 1.0], 0.08, 'darkgray').box([0.15, 0.1, 0.15], [0, 2.25, -0.3], { color: 'orange', glow: true }).done();
  }),
  e('fort', 'places', 'castles', () => {
    const b = m('fort')
      .box([7, 3, 0.8], [0, 1.5, 2.6], { color: 'stone' })
      .box([7, 3, 0.8], [0, 1.5, -2.6], { color: 'stone' })
      .box([0.8, 3, 5.2], [3.1, 1.5, 0], { color: 'stone' })
      .box([0.8, 3, 5.2], [-3.1, 1.5, 0], { color: 'stone' })
      .box([1.6, 2.0, 0.1], [0, 1.0, 3.04], { color: 'darkwood', name: 'door', pivot: [-0.8, 1.0, 3.04] });
    for (const [x, z] of [[3.1, 2.6], [-3.1, 2.6], [3.1, -2.6], [-3.1, -2.6]]) b.cyl([1.6, 4.4, 1.6], [x, 2.2, z], { color: '#9a9488' }).cone([1.9, 1.4, 1.9], [x, 5.1, z], { color: 'darkred' });
    b.each(5, (i) => void b.box([0.5, 0.5, 0.8], [-2.0 + i * 1.0, 3.25, 2.6], { color: 'stone' }));
    b.label('FORT', [1.4, 0.45], [0, 2.45, 3.02], { color: 'wood' });
    return b.stick([0, 3, -2.6], [0, 6.0, -2.6], 0.1, 'darkwood').box([1.2, 0.8, 0.05], [0.62, 5.5, -2.6], { color: 'red' }).done();
  }),
  e('fortune cookie', 'food', 'desserts', () =>
    m('fortune cookie')
      .ball([0.075, 0.04, 0.05], [0, 0.022, 0], { color: '#e8b860' })
      .ball([0.045, 0.045, 0.045], [0.026, 0.026, 0], { color: '#e8b860', rot: [0, 0, -25] })
      .ball([0.045, 0.045, 0.045], [-0.026, 0.026, 0], { color: '#e8b860', rot: [0, 0, 25] })
      .box([0.012, 0.005, 0.03], [0, 0.044, 0.01], { color: '#c89040', noInk: true })
      .box([0.06, 0.012, 0.003], [0.035, 0.03, 0.026], { color: 'white', rot: [0, -20, -10] })
      .done(),
  ),
  e('foundation (makeup)', 'wardrobe', 'makeup', () =>
    m('foundation (makeup)')
      .box([0.045, 0.08, 0.03], [0, 0.04, 0], { color: 'glass', round: 0.3 })
      .box([0.038, 0.065, 0.024], [0, 0.036, 0], { color: '#e0b090', round: 0.3 })
      .cyl([0.022, 0.012, 0.022], [0, 0.086, 0], { color: 'gold' })
      .cyl([0.018, 0.025, 0.018], [0, 0.104, 0], { color: 'black' })
      .box([0.012, 0.008, 0.026], [0, 0.118, 0.006], { color: 'black' })
      .ball([0.05, 0.006, 0.03], [0.05, 0.003, 0.02], { color: '#e0b090' })
      .done(),
  ),
  e('foundation (stone)', 'workshop', 'construction', () => {
    const b = m('foundation (stone)')
      .box([3.2, 0.1, 2.4], [0, 0.05, 0], { color: 'sand', round: 0 })
      .box([3, 0.7, 0.3], [0, 0.45, 1.05], { color: '#a8a8a0', round: 0.05 })
      .box([3, 0.7, 0.3], [0, 0.45, -1.05], { color: '#a8a8a0', round: 0.05 })
      .box([0.3, 0.7, 1.8], [1.35, 0.45, 0], { color: '#a8a8a0', round: 0.05 })
      .box([0.3, 0.7, 1.8], [-1.35, 0.45, 0], { color: '#a8a8a0', round: 0.05 });
    b.each(6, (i) => void b.stick([-1.2 + i * 0.48, 0.8, 1.05], [-1.2 + i * 0.48, 1.25, 1.05], 0.03, '#9a5a3a'));
    return b.done();
  }),
  e('fountain', 'garden', 'garden features', () => {
    const b = m('fountain')
      .cyl([2.2, 0.45, 2.2], [0, 0.225, 0], { color: 'stone' })
      .cyl([2.0, 0.08, 2.0], [0, 0.42, 0], { color: 'water' })
      .cyl([0.3, 0.9, 0.3], [0, 0.85, 0], { color: 'stone' })
      .cyl([1.0, 0.2, 1.0], [0, 1.35, 0], { color: 'stone', taper: 1.2 })
      .cyl([1.0, 0.04, 1.0], [0, 1.46, 0], { color: 'water' })
      .cyl([0.14, 0.4, 0.14], [0, 1.6, 0], { color: 'stone' })
      .ball([0.24, 0.16, 0.24], [0, 1.82, 0], { color: 'stone' });
    b.cone([0.12, 0.25, 0.12], [0, 2.0, 0], { color: 'water' });
    for (const [x, z] of around(6, 0.5)) b.rod([x * 0.9, 1.44, z * 0.9], [x * 1.6, 0.48, z * 1.6], 0.05, 'skyblue', { noInk: true });
    return b.done();
  }),
  e('frame', 'home', 'decor', () => {
    const b = m('frame')
      .box([0.32, 0.4, 0.012], [0, 0.21, -0.005], { color: 'skyblue', round: 0 })
      .ball([0.3, 0.16, 0.01], [0, 0.07, 0.002], { color: 'green', noInk: true })
      .ball(0.07, [0.08, 0.3, 0.002], { color: 'yellow', noInk: true });
    b.pair((s) => void b.box([0.05, 0.44, 0.04], [s * 0.18, 0.22, 0], { color: 'gold', round: 0.2 }).box([0.4, 0.05, 0.04], [0, s > 0 ? 0.42 : 0.025, 0], { color: 'gold', round: 0.2 }));
    return b.rod([0, 0.3, -0.02], [0, 0.0, -0.15], 0.02, 'darkwood').done();
  }),
  e('freckle', 'clinic', 'body parts', () => {
    const b = m('freckle').ball([0.2, 0.19, 0.17], [0, 0.095, 0], { color: 'skin1' }).ball([0.21, 0.08, 0.17], [0, 0.17, -0.015], { color: 'orange' });
    b.pair((s) => {
      b.ball([0.02, 0.028, 0.01], [s * 0.04, 0.11, 0.08], { color: 'black', eye: true });
      [[0.05, 0.075], [0.065, 0.065], [0.04, 0.06], [0.075, 0.08], [0.055, 0.05]].forEach(([x, y]) => void b.ball(0.01, [s * x, y, 0.072], { color: '#b0603a', noInk: true }));
    });
    return b.rod([-0.03, 0.045, 0.078], [0.03, 0.045, 0.078], 0.008, '#a0402a').done();
  }),
  e('freezer', 'kitchen', 'appliances', () =>
    m('freezer')
      .box([0.7, 1.7, 0.7], [0, 0.85, 0], { color: 'white', round: 0.08 })
      .box([0.68, 1.6, 0.04], [0, 0.88, 0.36], { color: '#f4f8fa', name: 'door', pivot: [-0.34, 0.88, 0.36], round: 0.1 })
      .box([0.04, 0.4, 0.04], [0.28, 1.2, 0.4], { color: 'silver', parent: 'door' })
      .rod([0, 1.18, 0.39], [0, 1.42, 0.39], 0.02, 'skyblue', { noInk: true, parent: 'door' })
      .rod([-0.1, 1.24, 0.39], [0.1, 1.36, 0.39], 0.02, 'skyblue', { noInk: true, parent: 'door' })
      .rod([-0.1, 1.36, 0.39], [0.1, 1.24, 0.39], 0.02, 'skyblue', { noInk: true, parent: 'door' })
      .box([0.6, 0.05, 0.6], [0, 0.03, 0], { color: 'gray' })
      .done(),
  ),
  e('french braid', 'wardrobe', 'hairstyles', () => {
    const b = m('french braid').ball([0.2, 0.2, 0.2], [0, 0.32, 0], { color: '#b07840' }).ball([0.16, 0.12, 0.1], [0, 0.22, -0.04], { color: 'skin2' });
    b.each(7, (i) => {
      const y = 0.37 - i * 0.045, s = i % 2 ? 1 : -1, w = 0.07 - i * 0.004;
      b.ball([w, 0.06, 0.04], [s * 0.012, y, 0.09 - Math.max(0, i - 2) * 0.012 + (i < 3 ? 0.01 : 0)], { color: i % 2 ? '#a06830' : '#c08850', rot: [0, 0, s * 25] });
    });
    return b.ball(0.03, [0, 0.06, 0.04], { color: 'pink' }).rod([0, 0.045, 0.04], [0.005, 0.0, 0.04], 0.03, '#b07840').done();
  }),
  e('french doors', 'home', 'doors', () => {
    const b = m('french doors').box([1.7, 2.25, 0.2], [0, 1.125, -0.1], { color: 'white' });
    b.pair((s) => {
      const o = s > 0 ? { name: 'door', pivot: [0.78, 1.05, 0.03] as V } : {};
      b.box([0.76, 2.05, 0.06], [s * 0.39, 1.05, 0.03], { color: 'white', ...o });
      const par = s > 0 ? { parent: 'door' } : {};
      b.each(6, (i) => void b.box([0.28, 0.5, 0.02], [s * 0.39 + (i % 2 ? 0.16 : -0.16), 0.55 + Math.floor(i / 2) * 0.58, 0.065], { color: 'glass', ...par }));
      b.ball(0.04, [s * 0.06, 1.0, 0.08], { color: 'brass', ...par });
    });
    return b.done();
  }),
  e('french horn', 'music', 'brass', () =>
    m('french horn')
      .cyl([0.18, 0.04, 0.18], [0, 0.02, 0], { color: 'darkgray' })
      .stick([0, 0.04, 0], [0, 0.12, 0], 0.03, 'darkgray')
      .torus([0.36, 0.36, 0.04], [0, 0.32, 0], { color: 'brass', tube: 0.14 })
      .torus([0.26, 0.26, 0.04], [0.01, 0.32, 0.02], { color: 'brass', tube: 0.16 })
      .torus([0.16, 0.16, 0.035], [0.02, 0.32, 0.04], { color: 'brass', tube: 0.2 })
      .box([0.1, 0.06, 0.06], [0.06, 0.34, 0.05], { color: 'brass', round: 0.4 })
      .cyl([0.06, 0.3, 0.06], [0.2, 0.22, -0.05], { color: 'brass', rot: [0, 0, 135], taper: 4.5 })
      .rod([-0.1, 0.45, 0.02], [-0.18, 0.55, 0.04], 0.02, 'brass')
      .done(),
  ),
  e('french toast', 'food', 'breakfast', () =>
    m('french toast')
      .cyl([0.26, 0.012, 0.26], [0, 0.006, 0], { color: 'white' })
      .box([0.12, 0.022, 0.12], [-0.02, 0.023, 0], { color: '#c8803a', round: 0.3, rot: [0, 15, 0] })
      .box([0.12, 0.022, 0.12], [0.02, 0.045, 0.01], { color: '#d8903a', round: 0.3, rot: [0, -10, 0] })
      .box([0.03, 0.012, 0.03], [0.02, 0.061, 0.01], { color: '#ffe680' })
      .ball(0.02, [-0.08, 0.025, 0.07], { color: 'red' })
      .ball(0.02, [-0.06, 0.025, 0.09], { color: 'navy' })
      .ball([0.1, 0.008, 0.08], [0.02, 0.058, 0.01], { color: '#a8601a', noInk: true })
      .done(),
  ),
  e('fried chicken', 'food', 'meals', () => {
    const b = m('fried chicken').cyl([0.14, 0.13, 0.14], [0, 0.065, 0], { color: 'white', taper: 1.25 });
    b.each(5, (i) => {
      const a = (i - 2) * 0.55, sx = Math.sin(a), cz = Math.cos(a);
      b.stick([sx * 0.07, 0.003, cz * 0.07], [sx * 0.087, 0.127, cz * 0.087], 0.022, 'red', { noInk: true });
    });
    b.ball([0.08, 0.06, 0.07], [-0.03, 0.15, 0.01], { color: '#c87a2a' }).ball([0.07, 0.06, 0.07], [0.035, 0.145, -0.02], { color: '#d0882a' });
    return b.ball([0.06, 0.08, 0.06], [0.01, 0.17, 0.04], { color: '#c87a2a', rot: [30, 0, -20] }).rod([0.03, 0.2, 0.06], [0.05, 0.23, 0.08], 0.015, 'cream').ball(0.022, [0.052, 0.235, 0.082], { color: 'cream' }).done();
  }),
  e('fried rice', 'food', 'meals', () => {
    const b = m('fried rice')
      .cyl([0.1, 0.05, 0.1], [0, 0.025, 0], { color: 'white', taper: 1.5 })
      .cyl([0.16, 0.008, 0.16], [0, 0.05, 0], { color: 'navy', noInk: true })
      .ball([0.13, 0.09, 0.13], [0, 0.06, 0], { color: '#f0dca0' });
    const c = ['green', 'orange', 'yellow', 'green', 'orange', 'yellow', 'green', 'pink'];
    c.forEach((col, i) => {
      const a = i * 0.8, r = 0.02 + (i % 3) * 0.015;
      b.ball(0.018, [Math.cos(a) * r, 0.1 - r * 0.7, Math.sin(a) * r + 0.012], { color: col, noInk: true });
    });
    return b.stick([0.04, 0.09, -0.04], [0.1, 0.055, 0.08], 0.008, 'wood').stick([0.055, 0.09, -0.045], [0.115, 0.055, 0.075], 0.008, 'wood').done();
  }),
  e('fries', 'food', 'fast food', () => {
    const b = m('fries');
    b.each(9, (i) => {
      const x = -0.035 + (i % 5) * 0.0175, z = i < 5 ? 0.008 : -0.012;
      b.box([0.012, 0.11, 0.012], [x, 0.1 + (i % 3) * 0.012, z], { color: '#f6c840', rot: [0, 0, (i - 4) * 4], round: 0.2 });
    });
    return b.box([0.1, 0.1, 0.05], [0, 0.05, 0], { color: 'red', round: 0.15 }).box([0.104, 0.03, 0.054], [0, 0.085, 0], { color: 'red', round: 0.15 }).ball(0.03, [0, 0.05, 0.026], { color: 'yellow', noInk: true }).done();
  }),
  e('frog legs', 'food', 'meals', () => {
    const b = m('frog legs').cyl([0.24, 0.012, 0.24], [0, 0.006, 0], { color: 'white' }).ball([0.05, 0.035, 0.04], [0, 0.03, 0], { color: '#d8a050' });
    b.pair((s) => {
      b.rod([s * 0.015, 0.035, 0], [s * 0.05, 0.11, 0], 0.03, '#d8a050').rod([s * 0.05, 0.11, 0], [s * 0.08, 0.02, 0.01], 0.018, '#d8a050');
      b.ball([0.035, 0.012, 0.03], [s * 0.095, 0.016, 0.02], { color: '#d8a050' });
    });
    return b.wedge([0.05, 0.03, 0.03], [0.0, 0.027, 0.08], { color: 'yellow' }).done();
  }),
  e('fruit', 'food', 'fruit', () =>
    m('fruit')
      .cyl([0.26, 0.07, 0.26], [0, 0.035, 0], { color: 'wood', taper: 1.3 })
      .ball(0.08, [-0.05, 0.1, 0.03], { color: 'red' })
      .rod([-0.05, 0.14, 0.03], [-0.045, 0.16, 0.03], 0.008, 'darkbrown')
      .ball(0.08, [0.06, 0.1, 0.02], { color: 'orange' })
      .ball(0.075, [0.0, 0.11, -0.06], { color: 'green' })
      .rod([-0.1, 0.13, -0.02], [0.0, 0.15, 0.06], 0.035, 'banana')
      .rod([0.0, 0.15, 0.06], [0.09, 0.17, 0.02], 0.035, 'banana')
      .ball(0.035, [0.1, 0.12, -0.06], { color: 'purple' })
      .ball(0.035, [0.08, 0.12, -0.08], { color: 'purple' })
      .ball(0.035, [0.1, 0.15, -0.07], { color: 'purple' })
      .done(),
  ),
  e('fruitcake', 'food', 'cakes', () => {
    const b = m('fruitcake').box([0.2, 0.08, 0.1], [-0.03, 0.04, 0], { color: '#7a4020', round: 0.2 }).box([0.03, 0.08, 0.1], [0.11, 0.04, 0.03], { color: '#8a5028', round: 0.2, rot: [0, -20, 0] });
    const c = ['red', 'green', 'red', 'yellow', 'green', 'red'];
    c.forEach((col, i) => void b.box([0.014, 0.012, 0.012], [-0.1 + i * 0.03, 0.082, (i % 2) * 0.03 - 0.015], { color: col, noInk: true }).box([0.006, 0.012, 0.012], [0.127, 0.02 + (i % 3) * 0.02, 0.0 + (i % 2) * 0.03], { color: col, noInk: true, rot: [0, -20, 0] }));
    return b.done();
  }),
  e('fudge', 'food', 'sweets', () =>
    m('fudge')
      .box([0.16, 0.004, 0.1], [0, 0.002, 0], { color: 'white', round: 0 })
      .box([0.045, 0.035, 0.045], [-0.03, 0.022, 0], { color: '#6a3a1a', round: 0.2 })
      .box([0.045, 0.035, 0.045], [0.025, 0.022, 0.01], { color: '#6a3a1a', round: 0.2 })
      .box([0.045, 0.035, 0.045], [-0.002, 0.058, 0.004], { color: '#7a4a24', round: 0.2, rot: [0, 25, 0] })
      .ball(0.012, [0.0, 0.078, 0.004], { color: 'tan' })
      .done(),
  ),
  e('fun house', 'places', 'fairground', () => {
    const b = m('fun house')
      .box([6, 4, 4], [0, 2, 0], { color: '#f0d020', round: 0.05 })
      .label('FUN HOUSE', [4.2, 0.8], [0, 4.6, 2.1], { color: 'magenta' })
      .ball([2.6, 2.4, 0.3], [0, 2.0, 2.05], { color: 'white' })
      .ball(0.4, [-0.6, 2.5, 2.25], { color: 'black' })
      .ball(0.4, [0.6, 2.5, 2.25], { color: 'black' })
      .ball(0.45, [0, 2.0, 2.3], { color: 'red' })
      .box([1.4, 0.9, 0.1], [0, 1.0, 2.22], { color: 'darkred', name: 'door', pivot: [-0.7, 1.0, 2.22], round: 0.5 });
    b.each(5, (i) => void b.box([0.5, 4.0, 0.06], [-2.6 + i * 1.3, 2, 2.02], { color: i % 2 ? 'cyan' : 'magenta', noInk: true }));
    b.each(4, (i) => void b.cone([1.5, 1.4, 1.5], [-2.25 + i * 1.5, 4.7, 0], { color: ['red', 'blue', 'lime', 'purple'][i], rot: [0, 0, (i % 2 ? 1 : -1) * 12] }));
    return b.done();
  }),
  e('funeral home', 'places', 'services', () => {
    const b = house('funeral home', { w: 7, h: 4, d: 5, wall: '#e8e4dc', roof: '#4a4058', gable: 2, sign: 'FUNERAL HOME', signC: '#4a4058', door: '#2a2420' });
    b.box([2.4, 0.2, 1.4], [0, 2.9, 3.1], { color: '#4a4058' });
    b.pair((s) => void b.cyl([0.3, 2.8, 0.3], [s * 1.0, 1.4, 3.6], { color: 'white' }).ball([0.8, 0.6, 0.8], [s * 2.8, 0.3, 3.2], { color: 'darkgreen' }));
    return b.done();
  }),
  e('fungus', 'garden', 'mushrooms', () => {
    const b = m('fungus').cyl([0.16, 0.18, 0.16], [0, 0.09, 0], { color: 'bark' }).cyl([0.14, 0.01, 0.14], [0, 0.18, 0], { color: 'lightwood' });
    b.cyl([0.12, 0.025, 0.06], [0.06, 0.13, 0.05], { color: '#e09040', rot: [0, -40, 0] }).cyl([0.1, 0.022, 0.05], [0.07, 0.08, 0.045], { color: '#d07a30', rot: [0, -40, 0] }).cyl([0.1, 0.022, 0.05], [-0.06, 0.11, 0.05], { color: '#e0a050', rot: [0, 40, 0] });
    return b.stick([-0.11, 0, 0.06], [-0.11, 0.04, 0.06], 0.012, 'cream').ball([0.045, 0.025, 0.045], [-0.11, 0.045, 0.06], { color: '#a05a30' }).stick([0.12, 0, 0.08], [0.12, 0.03, 0.08], 0.01, 'cream').ball([0.035, 0.02, 0.035], [0.12, 0.033, 0.08], { color: '#a05a30' }).done();
  }),
  e('funnel', 'kitchen', 'utensils', () =>
    m('funnel')
      .cyl([0.025, 0.06, 0.025], [0, 0.03, 0], { color: 'orange' })
      .cyl([0.04, 0.1, 0.04], [0, 0.11, 0], { color: 'orange', taper: 3.5 })
      .cyl([0.142, 0.01, 0.142], [0, 0.162, 0], { color: '#d86a10' })
      .cyl([0.12, 0.004, 0.12], [0, 0.166, 0], { color: '#5a2a08', noInk: true })
      .torus([0.04, 0.04, 0.008], [0.085, 0.15, 0], { color: 'orange', rot: [90, 0, 0] })
      .done(),
  ),
  e('funnel cake', 'food', 'desserts', () => {
    const b = m('funnel cake').cyl([0.24, 0.01, 0.24], [0, 0.005, 0], { color: 'white' });
    b.each(8, (i) => {
      const a = (i / 8) * Math.PI;
      b.rod([Math.cos(a) * 0.09, 0.02 + (i % 2) * 0.008, Math.sin(a) * 0.09], [-Math.cos(a) * 0.09, 0.02 + ((i + 1) % 2) * 0.008, -Math.sin(a) * 0.09], 0.022, '#d89a48');
    });
    b.torus([0.2, 0.2, 0.022], [0, 0.022, 0], { color: '#d89a48', rot: [90, 0, 0], tube: 0.11 });
    b.each(7, (i) => void b.ball([0.04, 0.008, 0.04], [Math.cos(i * 0.9) * (0.02 + i * 0.01), 0.037, Math.sin(i * 0.9) * (0.02 + i * 0.01)], { color: 'white', noInk: true }));
    return b.ball([0.035, 0.03, 0.03], [0.02, 0.045, 0.02], { color: 'red' }).done();
  }),
  e('fur', 'wardrobe', 'fabrics', () => {
    const b = m('fur').ball([0.3, 0.05, 0.22], [0, 0.025, 0], { color: '#8a6040' });
    b.each(14, (i) => {
      const a = i * 2.4, r = 0.03 + (i % 5) * 0.022;
      b.ball([0.07, 0.05, 0.05], [Math.cos(a) * r * 1.3, 0.04 + (i % 3) * 0.01, Math.sin(a) * r], { color: i % 3 ? '#9a7050' : '#7a5034', rot: [0, i * 37, 0] });
    });
    return b.done();
  }),
  e('fur coat', 'wardrobe', 'coats', () => {
    const b = m('fur coat')
      .rod([0, 0.98, 0], [0, 1.06, 0], 0.012, 'silver')
      .rod([-0.2, 0.86, 0], [0.2, 0.86, 0], 0.03, 'wood')
      .cyl([0.4, 0.8, 0.26], [0, 0.44, 0], { color: '#9a7050', taper: 0.8 })
      .torus([0.32, 0.22, 0.2], [0, 0.82, 0.02], { color: '#c8a880', rot: [90, 0, 0], tube: 0.35 });
    b.pair((s) => void b.capsule([0.12, 0.6, 0.12], [s * 0.24, 0.52, 0], { color: '#9a7050', rot: [0, 0, s * 8] }).ball([0.14, 0.1, 0.14], [s * 0.27, 0.22, 0], { color: '#c8a880' }));
    b.each(3, (i) => void b.ball(0.03, [0.0, 0.62 - i * 0.18, 0.13], { color: 'gold' }));
    b.each(8, (i) => void b.ball(0.07, [-0.15 + (i % 4) * 0.1, 0.15 + Math.floor(i / 4) * 0.3, 0.1], { color: '#8a6040', noInk: true }));
    return b.done();
  }),
  e('furnace (appliance)', 'home', 'appliances', () => {
    const b = m('furnace (appliance)')
      .box([0.6, 1.4, 0.7], [0, 0.7, 0], { color: '#c8c4b8', round: 0.05 })
      .box([0.5, 0.25, 0.6], [0, 1.53, 0], { color: 'silver', round: 0.05 })
      .cyl([0.2, 0.4, 0.2], [0, 1.85, -0.1], { color: 'silver' })
      .box([0.2, 0.15, 0.04], [0, 0.6, 0.36], { color: 'black' })
      .box([0.14, 0.09, 0.02], [0, 0.6, 0.385], { color: 'orange', glow: true })
      .box([0.12, 0.06, 0.03], [0.15, 1.1, 0.36], { color: 'darkgray' });
    b.each(5, (i) => void b.box([0.46, 0.02, 0.02], [0, 0.95 + i * 0.05, 0.355], { color: 'gray', noInk: true }).box([0.46, 0.02, 0.02], [0, 0.15 + i * 0.05, 0.355], { color: 'gray', noInk: true }));
    return b.done();
  }),
  e('furniture store', 'places', 'shops', () => {
    const b = house('furniture store', { w: 7, h: 4, d: 4, wall: '#d8c8a8', roof: '#6a4a30', sign: 'FURNITURE', signC: 'darkwood' });
    return b
      .box([1.6, 0.45, 0.7], [-2.0, 0.35, 2.8], { color: 'teal', round: 0.4 })
      .box([1.6, 0.5, 0.25], [-2.0, 0.75, 2.55], { color: 'teal', round: 0.5 })
      .box([0.25, 0.4, 0.7], [-2.85, 0.6, 2.8], { color: 'teal', round: 0.5 })
      .box([0.25, 0.4, 0.7], [-1.15, 0.6, 2.8], { color: 'teal', round: 0.5 })
      .box([0.6, 0.08, 0.6], [2.0, 0.6, 2.8], { color: 'wood' })
      .stick([2.0, 0, 2.8], [2.0, 0.58, 2.8], 0.1, 'darkwood')
      .done();
  }),
  e('fuse', 'home', 'electrical', () =>
    m('fuse')
      .cyl([0.022, 0.05, 0.022], [0, 0.035, 0], { color: '#d8eef8' })
      .cyl([0.025, 0.012, 0.025], [0, 0.006, 0], { color: 'silver' })
      .cyl([0.025, 0.012, 0.025], [0, 0.064, 0], { color: 'silver' })
      .stick([0, 0.012, 0], [0, 0.058, 0], 0.003, 'copper', { noInk: true })
      .done(),
  ),
  e('fuse box', 'home', 'electrical', () => {
    const b = m('fuse box')
      .box([0.3, 0.38, 0.1], [0, 0.19, 0], { color: '#9aa0a8', round: 0.08 })
      .box([0.26, 0.34, 0.02], [0.0, 0.19, 0.06], { color: '#4a4e54' })
      .box([0.3, 0.38, 0.02], [0.3, 0.19, 0.15], { color: '#aab0b8', rot: [0, -70, 0], name: 'door', pivot: [0.15, 0.19, 0.06] })
      .wedge([0.08, 0.07, 0.006], [0.26, 0.24, 0.27], { color: 'yellow', rot: [0, -70, 0], parent: 'door' });
    b.each(8, (i) => void b.box([0.04, 0.06, 0.03], [-0.075 + (i % 4) * 0.05, 0.26 - Math.floor(i / 4) * 0.12, 0.075], { color: i === 5 ? 'red' : 'black', round: 0.2 }));
    return b.done();
  }),
  e('gadget', 'tech', 'gadgets', () =>
    m('gadget')
      .box([0.14, 0.1, 0.08], [0, 0.05, 0], { color: '#5a7a9a', round: 0.3 })
      .box([0.07, 0.045, 0.01], [-0.025, 0.06, 0.04], { color: 'lime', glow: true })
      .cyl([0.025, 0.012, 0.025], [0.04, 0.07, 0.042], { color: 'red', rot: [90, 0, 0] })
      .cyl([0.025, 0.012, 0.025], [0.04, 0.03, 0.042], { color: 'yellow', rot: [90, 0, 0] })
      .stick([0.04, 0.1, -0.02], [0.05, 0.18, -0.02], 0.006, 'silver')
      .ball(0.02, [0.05, 0.185, -0.02], { color: 'red', glow: true })
      .torus([0.05, 0.05, 0.01], [-0.04, 0.115, 0], { color: 'silver', rot: [90, 0, 0] })
      .done(),
  ),
  e('gallows', 'armory', 'execution', () => {
    const b = m('gallows')
      .box([2.6, 1.4, 2.0], [0, 0.7, 0], { color: 'darkwood', round: 0.03 })
      .stick([-0.9, 1.4, -0.6], [-0.9, 4.0, -0.6], 0.18, 'darkwood')
      .stick([-0.95, 3.9, -0.6], [0.5, 3.9, -0.6], 0.16, 'darkwood')
      .rod([-0.9, 3.3, -0.6], [-0.3, 3.9, -0.6], 0.1, 'darkwood')
      .stick([0.4, 3.82, -0.6], [0.4, 2.7, -0.6], 0.03, '#c8a060')
      .torus([0.3, 0.36, 0.04], [0.4, 2.55, -0.6], { color: '#c8a060', tube: 0.15 })
      .box([0.7, 0.04, 0.7], [0.4, 1.41, -0.6], { color: '#3a2a1a', round: 0 });
    b.each(4, (i) => void b.box([0.9, 0.12, 0.3], [0.8, 0.18 + i * 0.32, 1.15 + (3 - i) * 0.3], { color: 'wood' }));
    return b.done();
  }),
  e('game guide', 'study', 'books', () =>
    m('game guide')
      .box([0.17, 0.24, 0.03], [0, 0.12, 0], { color: 'purple', round: 0.08 })
      .box([0.16, 0.23, 0.032], [0.004, 0.12, -0.001], { color: 'white', round: 0.05 })
      .box([0.17, 0.24, 0.01], [0, 0.12, 0.012], { color: 'purple', round: 0.1 })
      .label('GAME GUIDE', [0.14, 0.04], [0, 0.2, 0.018], { color: 'yellow' })
      .ball([0.09, 0.05, 0.01], [0, 0.1, 0.018], { color: 'black', noInk: true })
      .box([0.03, 0.01, 0.004], [-0.022, 0.1, 0.024], { color: 'white', noInk: true })
      .box([0.01, 0.03, 0.004], [-0.022, 0.1, 0.024], { color: 'white', noInk: true })
      .ball(0.012, [0.025, 0.1, 0.024], { color: 'red', noInk: true })
      .done(),
  ),
  e('gamepad', 'tech', 'gaming', () => {
    const b = m('gamepad').ball([0.16, 0.08, 0.05], [0, 0.085, 0], { color: '#2a2a30' });
    b.pair((s) => void b.ball([0.055, 0.1, 0.048], [s * 0.058, 0.05, -0.002], { color: '#2a2a30', rot: [0, 0, s * 22] }));
    b.box([0.03, 0.01, 0.01], [-0.045, 0.09, 0.025], { color: 'gray' }).box([0.01, 0.03, 0.01], [-0.045, 0.09, 0.025], { color: 'gray' });
    ['green', 'red', 'blue', 'yellow'].forEach((c, i) => {
      const a = (i * Math.PI) / 2;
      b.ball(0.013, [0.045 + Math.sin(a) * 0.013, 0.09 - Math.cos(a) * 0.013, 0.024], { color: c });
    });
    return b.pair((s) => void b.cyl([0.02, 0.012, 0.02], [s * 0.022, 0.065, 0.024], { color: 'gray', rot: [90, 0, 0] })).done();
  }),
  e('garage (room)', 'places', 'houses', () =>
    m('garage (room)')
      .box([3.6, 2.6, 0.2], [0, 1.3, -2.4], { color: 'beige' })
      .box([0.2, 2.6, 5], [1.8, 1.3, 0], { color: 'beige' })
      .box([0.2, 2.6, 5], [-1.8, 1.3, 0], { color: 'beige' })
      .wedge([4.2, 1.2, 5.4], [0, 3.2, 0], { color: 'darkred' })
      .box([3.4, 0.6, 0.1], [0, 2.3, 2.45], { color: 'white' })
      .box([3.6, 0.05, 5], [0, 0.025, 0], { color: 'gray' })
      .box([1.7, 0.55, 3.0], [0, 0.6, -0.3], { color: 'blue', round: 0.5 })
      .box([1.5, 0.45, 1.6], [0, 1.05, -0.5], { color: 'blue', round: 0.5 })
      .box([1.52, 0.32, 1.3], [0, 1.07, -0.5], { color: 'glass', round: 0.4 })
      .box([0.1, 1.0, 1.4], [-1.65, 1.4, -0.8], { color: 'wood' })
      .done(),
  ),
  e('garage door', 'places', 'building parts', () => {
    const b = m('garage door').box([3.0, 2.6, 0.3], [0, 1.3, -0.15], { color: '#c8b8a0' }).box([2.6, 2.2, 0.06], [0, 1.1, 0.03], { color: 'white' });
    b.each(4, (i) => void b.box([2.6, 0.03, 0.07], [0, 0.55 * (i + 1), 0.04], { color: 'lightgray', noInk: true }));
    b.each(4, (i) => void b.box([0.5, 0.3, 0.07], [-0.96 + i * 0.64, 1.9, 0.04], { color: 'glass' }));
    return b.box([0.3, 0.06, 0.08], [0, 0.3, 0.08], { color: 'gray' }).done();
  }),
  e('garbage bag', 'home', 'cleaning', () =>
    m('garbage bag')
      .ball([0.56, 0.62, 0.5], [0, 0.31, 0], { color: '#2a2a2e' })
      .cone([0.2, 0.2, 0.2], [0, 0.66, 0], { color: '#2a2a2e', rot: [180, 0, 0], taper: 0.25 })
      .ball([0.12, 0.07, 0.07], [-0.06, 0.78, 0], { color: '#2a2a2e', rot: [0, 0, 30] })
      .ball([0.12, 0.07, 0.07], [0.06, 0.78, 0], { color: '#2a2a2e', rot: [0, 0, -30] })
      .ball([0.06, 0.15, 0.02], [-0.12, 0.42, 0.22], { color: '#5a5a64', noInk: true, rot: [0, 0, 20] })
      .done(),
  ),
  e('garbage can', 'home', 'cleaning', () => {
    const b = m('garbage can').cyl([0.48, 0.75, 0.48], [0, 0.375, 0], { color: '#9aa0a8', taper: 1.08 });
    b.each(3, (i) => void b.torus([0.5, 0.5, 0.025], [0, 0.18 + i * 0.22, 0], { color: '#8a9098', rot: [90, 0, 0], tube: 0.04 }));
    return b
      .cyl([0.56, 0.06, 0.56], [0, 0.78, 0], { color: '#8a9098', name: 'lid', pivot: [0, 0.78, -0.28] })
      .ball([0.3, 0.08, 0.3], [0, 0.82, 0], { color: '#8a9098', parent: 'lid' })
      .torus([0.16, 0.1, 0.03], [0, 0.88, 0], { color: 'darkgray', parent: 'lid' })
      .done();
  }),
  e('garbage dump', 'places', 'industry', () => {
    const b = m('garbage dump')
      .ball([6, 3.2, 4.5], [0, 0.4, 0], { color: '#7a6a50' })
      .ball([2.6, 1.6, 2.0], [-1.5, 1.6, 0.3], { color: '#6a6050' })
      .torus([0.9, 0.9, 0.3], [1.2, 1.75, 1.0], { color: 'rubber', rot: [20, 30, 0], tube: 0.35 })
      .box([0.7, 0.5, 0.5], [0.2, 2.0, 0.5], { color: 'blue', rot: [10, 30, 15] })
      .ball([0.6, 0.6, 0.6], [-1.0, 2.4, 0.6], { color: '#2a2a2e' })
      .ball([0.5, 0.5, 0.5], [1.8, 1.2, 1.4], { color: '#2a2a2e' })
      .box([0.6, 0.6, 0.6], [-2.2, 1.2, 1.4], { color: 'tan', rot: [0, 20, 10] })
      .stick([2.6, 0, 2.6], [2.6, 1.6, 2.6], 0.1, 'wood')
      .label('DUMP', [1.2, 0.5], [2.6, 1.6, 2.66], { color: 'yellow' });
    return b.ball(0.35, [0.8, 2.3, 0.2], { color: 'white' }).cone([0.4, 0.6, 0.4], [-0.4, 2.5, -0.3], { color: 'green', rot: [0, 0, 40] }).done();
  }),
  e('garlic', 'food', 'vegetables', () => {
    const b = m('garlic');
    b.each(6, (i) => {
      const a = (i / 6) * Math.PI * 2;
      b.ball([0.035, 0.05, 0.035], [Math.cos(a) * 0.016, 0.03, Math.sin(a) * 0.016], { color: i % 2 ? '#f4ecdc' : '#ece0cc', rot: [Math.sin(a) * 15, 0, -Math.cos(a) * 15] });
    });
    b.ball([0.055, 0.055, 0.055], [0, 0.03, 0], { color: '#f4ecdc' }).cone([0.03, 0.04, 0.03], [0, 0.07, 0], { color: '#ece0cc', taper: 0.15 });
    b.each(4, (i) => void b.rod([0, 0.004, 0], [(i - 1.5) * 0.008, -0.0, 0.006], 0.003, 'tan'));
    return b.ball([0.02, 0.035, 0.016], [0.05, 0.012, 0.02], { color: '#f4ecdc', rot: [0, 0, -70] }).done();
  }),
  e('garlic bread', 'food', 'bread', () => {
    const b = m('garlic bread').box([0.3, 0.015, 0.12], [0.02, 0.0075, 0], { color: 'wood', round: 0.2 });
    b.each(4, (i) => {
      const x = -0.08 + i * 0.06;
      b.ball([0.075, 0.065, 0.022], [x, 0.045, 0], { color: '#d89a48', rot: [-0, 0, -28] })
        .ball([0.06, 0.05, 0.004], [x + 0.002, 0.046, 0.011], { color: '#f4d880', rot: [0, 0, -28] })
        .ball(0.008, [x - 0.01, 0.05, 0.014], { color: 'green', noInk: true })
        .ball(0.008, [x + 0.012, 0.04, 0.014], { color: 'green', noInk: true });
    });
    return b.done();
  }),
  e('garlic fries', 'food', 'fast food', () => {
    const b = m('garlic fries').box([0.16, 0.05, 0.1], [0, 0.025, 0], { color: 'white', round: 0.2 });
    b.each(4, (i) => void b.box([0.02, 0.05, 0.004], [-0.06 + i * 0.04, 0.025, 0.051], { color: 'red', noInk: true }));
    b.each(10, (i) => void b.box([0.012, 0.012, 0.09], [-0.06 + i * 0.013, 0.058 + (i % 3) * 0.008, 0], { color: '#f6c840', rot: [0, (i - 5) * 12, (i % 2) * 15], round: 0.2 }));
    b.each(8, (i) => void b.ball(0.01, [-0.05 + i * 0.014, 0.08, ((i * 7) % 5) * 0.012 - 0.024], { color: i % 2 ? 'green' : 'cream', noInk: true }));
    return b.done();
  }),
  e('gas mask', 'armory', 'protective gear', () => {
    const b = m('gas mask')
      .ball([0.18, 0.2, 0.13], [0, 0.11, 0], { color: '#4a5a3a' })
      .cyl([0.08, 0.08, 0.08], [0, 0.05, 0.08], { color: '#3a3a3a', rot: [70, 0, 0] })
      .cyl([0.084, 0.02, 0.084], [0, 0.03, 0.115], { color: 'silver', rot: [70, 0, 0] })
      .torus([0.22, 0.18, 0.02], [0, 0.12, -0.05], { color: 'black', rot: [90, 0, 0], tube: 0.08 });
    b.pair((s) => void b.cyl([0.06, 0.03, 0.06], [s * 0.045, 0.14, 0.055], { color: 'glass', rot: [80, 0, 0] }).torus([0.068, 0.068, 0.02], [s * 0.045, 0.14, 0.06], { color: 'black', rot: [-10, 0, 0], tube: 0.2 }));
    return b.done();
  }),
  e('gas pump', 'garage', 'gas station', () =>
    m('gas pump')
      .box([0.7, 0.1, 0.5], [0, 0.05, 0], { color: 'gray' })
      .box([0.6, 1.45, 0.4], [0, 0.82, 0], { color: 'red', round: 0.1 })
      .box([0.62, 0.3, 0.42], [0, 1.6, 0], { color: 'white', round: 0.15 })
      .label('GAS', [0.4, 0.18], [0, 1.6, 0.22], { color: 'white' })
      .box([0.4, 0.22, 0.02], [0, 1.2, 0.21], { color: 'black' })
      .box([0.34, 0.08, 0.02], [0, 1.25, 0.22], { color: 'lime', glow: true })
      .box([0.12, 0.25, 0.08], [0.2, 0.75, 0.22], { color: 'darkgray' })
      .box([0.05, 0.15, 0.06], [0.2, 0.78, 0.28], { color: 'black', rot: [20, 0, 0] })
      .rod([0.2, 0.65, 0.28], [0.32, 0.3, 0.3], 0.03, 'black')
      .rod([0.32, 0.3, 0.3], [0.32, 1.0, 0.1], 0.03, 'black')
      .done(),
  ),
  e('gas station', 'places', 'shops', () => {
    const b = m('gas station')
      .box([6, 0.4, 3.4], [0, 4.0, 1.2], { color: 'white' })
      .box([6.04, 0.25, 3.44], [0, 3.9, 1.2], { color: 'red', noInk: true })
      .label('GAS', [1.4, 0.3], [0, 4.0, 2.92], { color: 'red' })
      .box([4, 3, 2.4], [0, 1.5, -2.2], { color: '#e8e0d0' })
      .box([4.2, 0.25, 2.6], [0, 3.1, -2.2], { color: 'red' })
      .box([1.6, 1.2, 0.06], [-0.8, 1.4, -0.98], { color: 'glass' })
      .box([0.8, 2, 0.08], [1.1, 1.0, -0.98], { color: 'glass', name: 'door', pivot: [0.7, 1.0, -0.98] });
    b.pair((s) => {
      b.box([0.4, 3.8, 0.4], [s * 2.2, 1.9, 1.2], { color: 'white' });
      b.box([0.5, 1.4, 0.4], [s * 1.0, 0.8, 1.2], { color: 'red', round: 0.1 }).box([0.52, 0.25, 0.42], [s * 1.0, 1.5, 1.2], { color: 'white' });
    });
    return b.box([3.2, 0.15, 1.0], [0, 0.075, 1.2], { color: 'gray' }).done();
  }),
  e('gas tank', 'garage', 'fuel', () =>
    m('gas tank')
      .cyl([0.8, 1.8, 0.8], [0, 0.6, 0], { color: 'white', rot: [0, 0, 90] })
      .ball([0.3, 0.8, 0.8], [0.9, 0.6, 0], { color: 'white' })
      .ball([0.3, 0.8, 0.8], [-0.9, 0.6, 0], { color: 'white' })
      .box([0.2, 0.28, 0.9], [0.55, 0.14, 0], { color: 'darkgray' })
      .box([0.2, 0.28, 0.9], [-0.55, 0.14, 0], { color: 'darkgray' })
      .cyl([0.2, 0.1, 0.2], [0.3, 1.02, 0], { color: 'darkgray' })
      .label('FUEL', [0.6, 0.25], [-0.2, 0.62, 0.41], { color: 'red' })
      .box([1.82, 0.08, 0.82], [0, 0.45, 0], { color: 'red', noInk: true })
      .done(),
  ),
  e('gasoline', 'garage', 'fuel', () =>
    m('gasoline')
      .box([0.32, 0.38, 0.16], [0, 0.19, 0], { color: 'red', round: 0.2 })
      .rod([-0.12, 0.43, 0], [0.04, 0.43, 0], 0.04, 'red')
      .stick([-0.12, 0.38, 0], [-0.12, 0.43, 0], 0.04, 'red')
      .stick([0.04, 0.38, 0], [0.04, 0.43, 0], 0.04, 'red')
      .cyl([0.05, 0.04, 0.05], [0.12, 0.4, 0], { color: 'black' })
      .stick([0.12, 0.42, 0], [0.2, 0.52, 0], 0.03, 'yellow')
      .rod([-0.12, 0.08, 0.082], [0.12, 0.3, 0.082], 0.02, '#c02020', { noInk: true })
      .rod([0.12, 0.08, 0.082], [-0.12, 0.3, 0.082], 0.02, '#c02020', { noInk: true })
      .done(),
  ),
  e('gateway', 'places', 'landmarks', () => {
    const b = m('gateway').box([3.2, 0.4, 0.6], [0, 2.6, 0], { color: 'stone' }).wedge([3.4, 0.4, 0.7], [0, 3.0, 0], { color: 'stone' });
    b.pair((s) => void b.box([0.5, 2.4, 0.6], [s * 1.25, 1.2, 0], { color: 'stone' }).ball(0.3, [s * 1.25, 3.0, 0], { color: 'stone' }));
    b.box([1.0, 0.06, 0.04], [-0.5, 2.0, 0.05], { color: 'black', name: 'door', pivot: [-1.0, 1.1, 0.05] });
    b.box([1.0, 0.06, 0.04], [-0.5, 0.2, 0.05], { color: 'black', parent: 'door' });
    b.each(5, (i) => void b.stick([-0.9 + i * 0.2, 0.15, 0.05], [-0.9 + i * 0.2, 2.15, 0.05], 0.04, 'black', { parent: 'door' }));
    b.box([1.0, 0.06, 0.04], [0.5, 2.0, 0.05], { color: 'black' }).box([1.0, 0.06, 0.04], [0.5, 0.2, 0.05], { color: 'black' });
    b.each(5, (i) => void b.stick([0.1 + i * 0.2, 0.15, 0.05], [0.1 + i * 0.2, 2.15, 0.05], 0.04, 'black'));
    return b.done();
  }),
  e('gauge', 'tech', 'instruments', () => {
    const b = m('gauge')
      .stick([0, 0, 0], [0, 0.04, 0], 0.025, 'brass')
      .cyl([0.12, 0.04, 0.12], [0, 0.1, 0], { color: 'silver', rot: [90, 0, 0] })
      .cyl([0.105, 0.006, 0.105], [0, 0.1, 0.02], { color: 'white', rot: [90, 0, 0] });
    b.each(7, (i) => {
      const a = ((-135 + i * 45) * Math.PI) / 180;
      b.box([0.004, 0.012, 0.004], [Math.sin(a) * 0.042, 0.1 + Math.cos(a) * 0.042, 0.024], { color: i > 4 ? 'red' : 'black', rot: [0, 0, (-a * 180) / Math.PI], noInk: true });
    });
    return b.rod([0, 0.1, 0.026], [0.025, 0.125, 0.026], 0.005, 'red').ball(0.01, [0, 0.1, 0.027], { color: 'black' }).done();
  }),
  e('gauntlet', 'armory', 'armour', () => {
    const b = m('gauntlet')
      .cyl([0.14, 0.2, 0.12], [0, 0.1, 0], { color: '#a8b0bc', taper: 0.7 })
      .cyl([0.15, 0.02, 0.13], [0, 0.01, 0], { color: '#6a7480' })
      .box([0.11, 0.1, 0.06], [0, 0.25, 0], { color: '#a8b0bc', round: 0.4 })
      .ball([0.12, 0.04, 0.07], [0, 0.205, 0], { color: '#6a7480' })
      .capsule([0.035, 0.08, 0.035], [-0.07, 0.25, 0.01], { color: '#a8b0bc', rot: [0, 0, 35] });
    b.each(4, (i) => {
      const x = -0.036 + i * 0.024;
      b.capsule([0.022, 0.05, 0.022], [x, 0.32, 0], { color: '#a8b0bc' }).capsule([0.02, 0.04, 0.02], [x, 0.37, 0.003], { color: '#6a7480' });
    });
    return b.done();
  }),
  e('gauze', 'clinic', 'medical supplies', () => {
    const b = m('gauze')
      .cyl([0.13, 0.1, 0.13], [0, 0.065, 0.02], { color: 'white', rot: [0, 0, 90] })
      .cyl([0.04, 0.102, 0.04], [0, 0.065, 0.02], { color: 'lightgray', rot: [0, 0, 90] })
      .box([0.1, 0.004, 0.2], [0, 0.002, 0.15], { color: 'white', round: 0 })
      .box([0.17, 0.17, 0.03], [0.05, 0.085, -0.12], { color: 'white', round: 0.1 })
      .box([0.09, 0.03, 0.01], [0.05, 0.1, -0.102], { color: 'blue', noInk: true })
      .box([0.03, 0.09, 0.01], [0.05, 0.1, -0.102], { color: 'blue', noInk: true });
    b.each(4, (i) => void b.box([0.1, 0.002, 0.004], [0, 0.005, 0.08 + i * 0.04], { color: '#d8d8d8', noInk: true }));
    return b.done();
  }),
  e('gazebo', 'garden', 'garden features', () => {
    const b = m('gazebo').cyl([3, 0.3, 3], [0, 0.15, 0], { color: 'wood', segs: 6 }).cone([3.6, 1.2, 3.6], [0, 3.0, 0], { color: 'darkgreen', segs: 6 }).cyl([3.6, 0.15, 3.6], [0, 2.38, 0], { color: 'white', segs: 6 });
    for (const [x, z] of around(6, 1.35, Math.PI / 6)) b.stick([x, 0.3, z], [x, 2.35, z], 0.14, 'white');
    for (let i = 0; i < 6; i++) {
      if (i === 1) continue;
      const [x1, z1] = around(6, 1.35, Math.PI / 6)[i], [x2, z2] = around(6, 1.35, Math.PI / 6)[(i + 1) % 6];
      b.stick([x1, 0.9, z1], [x2, 0.9, z2], 0.07, 'white');
    }
    return b.ball(0.3, [0, 3.7, 0], { color: 'gold' }).done();
  }),
  e('gear', 'workshop', 'machine parts', () => {
    const b = m('gear').cyl([0.08, 0.02, 0.08], [0, 0.052, 0], { color: 'steel', rot: [90, 0, 0], name: 'fan' });
    b.each(10, (i) => {
      const a = (i / 10) * Math.PI * 2;
      b.box([0.016, 0.02, 0.02], [Math.sin(a) * 0.044, 0.052 + Math.cos(a) * 0.044, 0], { color: 'steel', rot: [0, 0, (-a * 180) / Math.PI], parent: 'fan', round: 0.1 });
    });
    return b.cyl([0.02, 0.022, 0.02], [0, 0.052, 0], { color: '#2a2a2a', rot: [90, 0, 0], parent: 'fan' }).cyl([0.05, 0.022, 0.05], [0, 0.052, 0], { color: 'iron', rot: [90, 0, 0], parent: 'fan', noInk: true }).done();
  }),
  e('geiger counter', 'tech', 'instruments', () =>
    m('geiger counter')
      .box([0.2, 0.12, 0.1], [0, 0.06, 0], { color: 'yellow', round: 0.2 })
      .rod([-0.07, 0.12, 0], [-0.07, 0.17, 0], 0.025, 'black')
      .rod([0.07, 0.12, 0], [0.07, 0.17, 0], 0.025, 'black')
      .rod([-0.07, 0.17, 0], [0.07, 0.17, 0], 0.025, 'black')
      .cyl([0.06, 0.01, 0.06], [-0.04, 0.065, 0.05], { color: 'white', rot: [90, 0, 0] })
      .rod([-0.04, 0.065, 0.056], [-0.02, 0.085, 0.056], 0.004, 'red')
      .cyl([0.02, 0.012, 0.02], [0.05, 0.07, 0.05], { color: 'black', rot: [90, 0, 0] })
      .rod([0.1, 0.04, 0], [0.2, 0.02, 0.06], 0.012, 'black')
      .cyl([0.035, 0.16, 0.035], [0.26, 0.0175, 0.12], { color: 'silver', rot: [90, 30, 0] })
      .done(),
  ),
  e('gel', 'home', 'bathroom', () =>
    m('gel')
      .cyl([0.09, 0.06, 0.09], [0, 0.03, 0], { color: 'white' })
      .cyl([0.08, 0.008, 0.08], [0, 0.061, 0], { color: '#40a0e0' })
      .ball([0.04, 0.03, 0.04], [0, 0.07, 0], { color: '#60b8f0' })
      .cyl([0.095, 0.02, 0.095], [0.06, 0.045, -0.02], { color: 'blue', rot: [0, 0, 70] })
      .label('GEL', [0.05, 0.025], [0, 0.03, 0.046], { color: 'blue' })
      .done(),
  ),
  e('gelatin', 'food', 'desserts', () =>
    m('gelatin')
      .cyl([0.18, 0.01, 0.18], [0, 0.005, 0], { color: 'white' })
      .cyl([0.12, 0.07, 0.12], [0, 0.045, 0], { color: '#e02040', taper: 0.75 })
      .torus([0.11, 0.11, 0.01], [0, 0.03, 0], { color: '#f04060', rot: [90, 0, 0], tube: 0.1 })
      .ball([0.09, 0.03, 0.09], [0, 0.08, 0], { color: '#e02040' })
      .ball([0.04, 0.03, 0.04], [0, 0.1, 0], { color: 'white' })
      .ball(0.014, [0, 0.12, 0], { color: 'red' })
      .done(),
  ),
  e('gem', 'nature', 'gems', () =>
    m('gem')
      .box([0.12, 0.03, 0.1], [0, 0.015, 0], { color: 'darkred', round: 0.5 })
      .cone([0.09, 0.055, 0.09], [0, 0.0575, 0], { color: '#8a40d0', rot: [180, 0, 0], segs: 8 })
      .cyl([0.09, 0.025, 0.09], [0, 0.0975, 0], { color: '#a060e8', taper: 0.65, segs: 8 })
      .ball(0.012, [0.015, 0.105, 0.025], { color: 'white', glow: true })
      .done(),
  ),
  e('generator', 'tech', 'power', () => {
    const b = m('generator')
      .box([0.5, 0.35, 0.4], [0, 0.3, 0], { color: 'red', round: 0.2 })
      .box([0.4, 0.15, 0.35], [0, 0.55, 0], { color: 'yellow', round: 0.3 })
      .cyl([0.06, 0.03, 0.06], [0.1, 0.64, 0], { color: 'black' })
      .box([0.2, 0.14, 0.02], [-0.08, 0.3, 0.21], { color: 'darkgray' })
      .cyl([0.025, 0.01, 0.025], [-0.12, 0.3, 0.225], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.025, 0.01, 0.025], [-0.04, 0.3, 0.225], { color: 'orange', rot: [90, 0, 0] })
      .cyl([0.1, 0.02, 0.1], [0.16, 0.3, 0.21], { color: 'gray', rot: [90, 0, 0] });
    b.pair((s) => {
      b.stick([s * 0.3, 0.1, 0.22], [s * 0.3, 0.68, 0.22], 0.035, 'black').stick([s * 0.3, 0.1, -0.22], [s * 0.3, 0.68, -0.22], 0.035, 'black');
      b.stick([s * 0.3, 0.68, 0.22], [s * 0.3, 0.68, -0.22], 0.035, 'black').stick([s * 0.3, 0.1, 0.22], [s * 0.3, 0.1, -0.22], 0.035, 'black');
      b.torus([0.2, 0.2, 0.08], [s * 0.34, 0.1, -0.15], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 });
    });
    return b.box([0.06, 0.1, 0.06], [-0.3, 0.05, 0.18], { color: 'black' }).done();
  }),
  e('gift', 'toys', 'party', () =>
    m('gift')
      .box([0.2, 0.15, 0.2], [0, 0.075, 0], { color: 'red', round: 0.05 })
      .box([0.04, 0.152, 0.202], [0, 0.075, 0], { color: 'gold', round: 0.05, noInk: true })
      .box([0.202, 0.152, 0.04], [0, 0.075, 0], { color: 'gold', round: 0.05, noInk: true })
      .box([0.22, 0.05, 0.22], [0, 0.175, 0], { color: 'red', round: 0.1, name: 'lid', pivot: [0, 0.15, -0.11] })
      .box([0.04, 0.052, 0.222], [0, 0.175, 0], { color: 'gold', parent: 'lid', noInk: true })
      .box([0.222, 0.052, 0.04], [0, 0.175, 0], { color: 'gold', parent: 'lid', noInk: true })
      .ball([0.08, 0.05, 0.03], [0.04, 0.215, 0], { color: 'gold', rot: [0, 0, 25], parent: 'lid' })
      .ball([0.08, 0.05, 0.03], [-0.04, 0.215, 0], { color: 'gold', rot: [0, 0, -25], parent: 'lid' })
      .ball(0.03, [0, 0.21, 0], { color: 'gold', parent: 'lid' })
      .done(),
  ),
  e('gift certificate', 'toys', 'party', () =>
    m('gift certificate')
      .box([0.08, 0.02, 0.05], [0, 0.01, 0], { color: 'darkwood' })
      .box([0.16, 0.1, 0.012], [0, 0.07, 0], { color: 'gold', round: 0.15 })
      .box([0.025, 0.1, 0.014], [-0.045, 0.07, 0], { color: 'red', noInk: true })
      .label('GIFT CARD', [0.08, 0.03], [0.025, 0.08, 0.008], { color: 'gold' })
      .ball([0.035, 0.022, 0.012], [-0.055, 0.1, 0.01], { color: 'red', rot: [0, 0, 25] })
      .ball([0.035, 0.022, 0.012], [-0.035, 0.1, 0.01], { color: 'red', rot: [0, 0, -25] })
      .done(),
  ),
  e('gift shop', 'places', 'shops', () => {
    const b = house('gift shop', { w: 6, h: 4, d: 4, wall: '#f0e0c0', roof: '#c04050', gable: 1.6, sign: 'GIFTS', signC: '#c04050' });
    b.box([6, 0.1, 1.2], [0, 2.8, 2.5], { color: '#c04050', rot: [15, 0, 0] });
    return b.box([0.6, 0.6, 0.6], [1.8, 0.3, 2.7], { color: 'blue' }).box([0.62, 0.1, 0.62], [1.8, 0.62, 2.7], { color: 'gold' }).box([0.5, 0.5, 0.5], [-1.8, 0.25, 2.7], { color: 'green' }).box([0.52, 0.08, 0.52], [-1.8, 0.52, 2.7], { color: 'red' }).done();
  }),
  e('gill', 'sea', 'sea animal parts', () =>
    m('gill', { view: 'side' })
      .cyl([0.14, 0.015, 0.1], [0, 0.0075, 0], { color: 'water' })
      .stick([0, 0.015, 0], [0, 0.05, 0], 0.01, 'gray')
      .ball([0.05, 0.065, 0.16], [0, 0.085, 0], { color: 'silver' })
      .cone([0.05, 0.05, 0.015], [0, 0.085, -0.095], { color: 'silver', rot: [-90, 0, 0] })
      .ball(0.014, [0.02, 0.095, 0.05], { color: 'black', eye: true })
      .torus([0.04, 0.05, 0.01], [0.022, 0.085, 0.02], { color: 'red', rot: [0, 90, 0], tube: 0.18 })
      .torus([0.032, 0.042, 0.01], [-0.022, 0.085, 0.02], { color: 'red', rot: [0, 90, 0], tube: 0.18 })
      .done(),
  ),
  e('ginger ale', 'food', 'drinks', () => {
    const b = bottle(m('ginger ale'), 0, 0, 0.26, 0.07, '#2a8a3a', 'gold', 'cream');
    return b.label('GINGER ALE', [0.05, 0.035], [0, 0.08, 0.037], { color: 'cream' }).done();
  }),
  e('gingerbread', 'food', 'sweets', () => {
    const b = m('gingerbread')
      .ball([0.05, 0.045, 0.016], [0, 0.1, 0], { color: '#a8602a' })
      .box([0.05, 0.05, 0.016], [0, 0.06, 0], { color: '#a8602a', round: 0.6 });
    b.pair((s) => {
      b.capsule([0.022, 0.05, 0.016], [s * 0.035, 0.07, 0], { color: '#a8602a', rot: [0, 0, s * 70] });
      b.capsule([0.022, 0.05, 0.016], [s * 0.015, 0.022, 0], { color: '#a8602a', rot: [0, 0, s * 15] });
      b.ball(0.007, [s * 0.01, 0.105, 0.008], { color: 'white', noInk: true });
    });
    b.each(2, (i) => void b.ball(0.009, [0, 0.07 - i * 0.02, 0.009], { color: i ? 'green' : 'red' }));
    return b.rod([-0.008, 0.09, 0.008], [0.008, 0.09, 0.008], 0.004, 'white', { noInk: true }).done();
  }),
  e('gingerbread house', 'food', 'sweets', () => {
    const b = m('gingerbread house')
      .box([0.24, 0.16, 0.2], [0, 0.08, 0], { color: '#a8602a', round: 0.05 })
      .wedge([0.28, 0.12, 0.24], [0, 0.22, 0], { color: 'white' })
      .wedge([0.26, 0.11, 0.25], [0, 0.215, 0], { color: '#a8602a' })
      .box([0.06, 0.09, 0.01], [0, 0.045, 0.102], { color: '#6a3a1a', round: 0.3, name: 'door', pivot: [-0.03, 0.045, 0.102] })
      .box([0.05, 0.04, 0.01], [0.075, 0.1, 0.102], { color: 'yellow', glow: true })
      .box([0.05, 0.04, 0.01], [-0.075, 0.1, 0.102], { color: 'yellow', glow: true });
    ['red', 'green', 'yellow', 'pink', 'blue'].forEach((c, i) => void b.ball(0.022, [-0.1 + i * 0.05, 0.265 - Math.abs(i - 2) * 0.03, 0.1], { color: c }).ball(0.02, [-0.1 + i * 0.05, 0.012, 0.115], { color: c }));
    return b.stick([0.13, 0, 0.11], [0.13, 0.13, 0.11], 0.016, 'white').stick([0.13, 0.03, 0.11], [0.13, 0.06, 0.11], 0.017, 'red', { noInk: true }).done();
  }),
  e('girdle', 'wardrobe', 'underwear', () => {
    const b = m('girdle')
      .cyl([0.06, 0.04, 0.06], [0, 0.02, 0], { color: 'black' })
      .stick([0, 0.04, 0], [0, 0.08, 0], 0.015, 'black')
      .cyl([0.2, 0.12, 0.15], [0, 0.14, 0], { color: '#e85a8a', taper: 0.72 })
      .cyl([0.144, 0.13, 0.108], [0, 0.265, 0], { color: '#e85a8a', taper: 1.35 })
      .torus([0.2, 0.15, 0.012], [0, 0.33, 0], { color: 'white', rot: [90, 0, 0], tube: 0.05 });
    b.each(4, (i) => {
      const y = 0.11 + i * 0.055;
      b.rod([-0.018, y, 0.06], [0.018, y + 0.04, 0.06], 0.005, 'black', { noInk: true }).rod([0.018, y, 0.06], [-0.018, y + 0.04, 0.06], 0.005, 'black', { noInk: true });
    });
    return b.done();
  }),
  e('glacier', 'nature', 'landforms', () =>
    m('glacier')
      .box([10, 0.3, 6], [0, 0.15, 0], { color: 'water', round: 0.1 })
      .cone([6, 7, 5], [-1.5, 3.5, -1.5], { color: 'rock' })
      .cone([3.2, 2.4, 2.8], [-1.5, 5.8, -1.5], { color: 'snow' })
      .box([4, 3, 4], [1.5, 1.6, 0.5], { color: '#d8f0fa', rot: [0, 0, -12], round: 0.15 })
      .box([3, 2.2, 3.6], [-0.2, 3.0, -0.2], { color: '#c8e8f6', rot: [0, 0, -20], round: 0.15 })
      .box([0.2, 2.2, 0.1], [2.2, 1.7, 2.52], { color: '#6ab8e0', noInk: true, rot: [0, 0, -12] })
      .box([0.2, 2.2, 0.1], [1.0, 1.9, 2.52], { color: '#6ab8e0', noInk: true, rot: [0, 0, -12] })
      .box([1.2, 0.9, 1.0], [3.8, 0.6, 1.8], { color: 'ice', rot: [0, 30, 8] })
      .done(),
  ),
  e('gland', 'clinic', 'organs', () =>
    m('gland')
      .box([0.12, 0.02, 0.06], [0, 0.01, 0], { color: 'white', round: 0.4 })
      .ball([0.045, 0.08, 0.035], [0.035, 0.06, 0.01], { color: '#c8505a', rot: [0, 0, -12] })
      .ball([0.045, 0.08, 0.035], [-0.035, 0.06, 0.01], { color: '#c8505a', rot: [0, 0, 12] })
      .box([0.04, 0.025, 0.025], [0, 0.045, 0.012], { color: '#b84050', round: 0.6 })
      .rod([0.035, 0.09, 0.03], [0.02, 0.06, 0.03], 0.004, '#7a2a4a', { noInk: true })
      .rod([-0.035, 0.09, 0.03], [-0.02, 0.06, 0.03], 0.004, '#7a2a4a', { noInk: true })
      .done(),
  ),
  e('glass slipper', 'fantasy', 'magic items', () =>
    m('glass slipper', { view: 'side' })
      .box([0.07, 0.014, 0.08], [0, 0.007, 0.06], { color: '#cfeefa', round: 0.5 })
      .ball([0.075, 0.05, 0.1], [0, 0.028, 0.06], { color: '#cfeefa' })
      .box([0.06, 0.014, 0.12], [0, 0.045, -0.035], { color: '#cfeefa', rot: [28, 0, 0], round: 0.5 })
      .cyl([0.016, 0.075, 0.016], [0, 0.0375, -0.085], { color: '#cfeefa', taper: 1.5 })
      .ball([0.068, 0.05, 0.06], [0, 0.088, -0.078], { color: '#cfeefa' })
      .ball([0.05, 0.012, 0.05], [0, 0.11, -0.07], { color: '#7ab8d8', noInk: true })
      .star(0.03, [0.04, 0.07, 0.04], { color: 'white', glow: true })
      .done(),
  ),
  e('glaze', 'food', 'baking', () => {
    const b = m('glaze').cyl([0.2, 0.012, 0.2], [0, 0.006, 0], { color: 'white' }).cyl([0.16, 0.07, 0.16], [0, 0.047, 0], { color: '#b07038', taper: 0.85 });
    b.ball([0.14, 0.03, 0.14], [0, 0.08, 0], { color: 'cream' }).cyl([0.04, 0.03, 0.04], [0, 0.09, 0], { color: '#b07038' });
    for (const [x, z] of around(7, 0.07, 0.3)) b.capsule([0.018, 0.04, 0.012], [x, 0.065, z], { color: 'cream' });
    return b.done();
  }),
  e('globe', 'study', 'geography', () =>
    m('globe')
      .cyl([0.16, 0.025, 0.16], [0, 0.0125, 0], { color: 'darkwood' })
      .stick([0, 0.025, 0], [0, 0.07, 0], 0.025, 'darkwood')
      .torus([0.3, 0.3, 0.015], [0, 0.22, 0], { color: 'brass', rot: [0, 90, 23], tube: 0.06 })
      .ball(0.26, [0, 0.22, 0], { color: '#3a7ac8', name: 'rotor' })
      .ball([0.1, 0.12, 0.05], [-0.04, 0.25, 0.1], { color: 'green', parent: 'rotor', noInk: true })
      .ball([0.08, 0.1, 0.05], [0.07, 0.18, 0.09], { color: 'green', parent: 'rotor', noInk: true })
      .ball([0.09, 0.06, 0.06], [0.08, 0.28, -0.07], { color: 'green', parent: 'rotor', noInk: true })
      .ball([0.06, 0.03, 0.06], [0, 0.345, 0], { color: 'white', parent: 'rotor', noInk: true })
      .done(),
  ),
  e('glove', 'wardrobe', 'gloves', () => {
    const b = m('glove')
      .cyl([0.1, 0.07, 0.045], [0, 0.035, 0], { color: '#8a5030', taper: 0.9 })
      .box([0.1, 0.1, 0.04], [0, 0.12, 0], { color: '#9a6038', round: 0.45 })
      .capsule([0.028, 0.07, 0.028], [-0.065, 0.13, 0.005], { color: '#9a6038', rot: [0, 0, 40] });
    b.each(4, (i) => void b.capsule([0.024, 0.075 + (i === 1 || i === 2 ? 0.015 : 0), 0.026], [-0.034 + i * 0.023, 0.2 + (i === 1 || i === 2 ? 0.007 : 0), 0], { color: '#9a6038' }));
    return b.box([0.1, 0.008, 0.046], [0, 0.07, 0], { color: '#6a3a20', noInk: true }).done();
  }),
  e('gloves', 'wardrobe', 'gloves', () => {
    const b = m('gloves');
    b.pair((s) => {
      b.box([0.1, 0.05, 0.045], [s * 0.075, 0.025, 0], { color: 'white', round: 0.5 })
        .box([0.1, 0.16, 0.042], [s * 0.075, 0.13, 0], { color: 'red', round: 0.7 })
        .capsule([0.035, 0.07, 0.035], [s * 0.075 + s * 0.06, 0.12, 0.004], { color: 'red', rot: [0, 0, -s * 35] })
        .star(0.04, [s * 0.075, 0.13, 0.024], { color: 'white', noInk: true });
    });
    return b.rod([-0.075, 0.03, -0.02], [0, 0.005, -0.05], 0.006, 'white').rod([0, 0.005, -0.05], [0.075, 0.03, -0.02], 0.006, 'white').done();
  }),
  e('glow stick', 'toys', 'party', () =>
    m('glow stick')
      .capsule([0.022, 0.2, 0.022], [-0.02, 0.1, 0], { color: 'lime', rot: [0, 0, 12] })
      .capsule([0.01, 0.16, 0.01], [-0.02, 0.1, 0.008], { color: '#d8ff80', rot: [0, 0, 12], glow: true })
      .capsule([0.022, 0.2, 0.022], [0.03, 0.1, 0.02], { color: 'magenta', rot: [0, 0, -15] })
      .capsule([0.01, 0.16, 0.01], [0.03, 0.1, 0.028], { color: '#ffa0f0', rot: [0, 0, -15], glow: true })
      .torus([0.1, 0.1, 0.014], [0.0, 0.007, 0.07], { color: 'cyan', rot: [90, 0, 0], tube: 0.14 })
      .done(),
  ),
  e('glue', 'study', 'stationery', () =>
    m('glue')
      .cyl([0.055, 0.1, 0.035], [0, 0.05, 0], { color: 'white' })
      .cyl([0.055, 0.02, 0.035], [0, 0.11, 0], { color: 'white', taper: 0.5 })
      .cone([0.028, 0.04, 0.028], [0, 0.14, 0], { color: 'orange', taper: 0.2 })
      .cyl([0.058, 0.05, 0.038], [0, 0.05, 0], { color: 'orange', noInk: true })
      .label('GLUE', [0.04, 0.025], [0, 0.05, 0.02], { color: 'white' })
      .done(),
  ),
  e('glue gun', 'workshop', 'power tools', () =>
    m('glue gun', { view: 'side' })
      .box([0.05, 0.07, 0.17], [0, 0.15, 0.0], { color: 'teal', round: 0.5 })
      .box([0.045, 0.13, 0.05], [0, 0.07, -0.04], { color: 'teal', rot: [-12, 0, 0], round: 0.5 })
      .box([0.015, 0.04, 0.02], [0, 0.1, 0.01], { color: 'yellow', round: 0.4 })
      .cone([0.025, 0.05, 0.025], [0, 0.15, 0.11], { color: 'silver', rot: [90, 0, 0], taper: 0.3 })
      .cyl([0.012, 0.1, 0.012], [0, 0.16, -0.12], { color: 'white', rot: [90, 0, 0] })
      .rod([0.0, 0.03, 0.03], [0.0, 0.0, 0.08], 0.012, 'silver')
      .done(),
  ),
  e('goalpost', 'sports', 'fields', () => {
    const b = m('goalpost')
      .stick([-2.5, 2.2, 0], [2.5, 2.2, 0], 0.15, 'white')
      .box([5.0, 2.2, 0.04], [0, 1.1, -1.4], { color: '#e4e4e8', noInk: true })
      .box([5.0, 0.04, 1.4], [0, 2.2, -0.7], { color: '#e4e4e8', noInk: true });
    b.pair((s) => {
      b.stick([s * 2.5, 0, 0], [s * 2.5, 2.27, 0], 0.15, 'white').box([0.04, 2.2, 1.4], [s * 2.5, 1.1, -0.7], { color: '#e4e4e8', noInk: true });
      b.box([0.5, 0.36, 0.4], [s * 2.2, 0.18, -1.2], { color: '#8a7a50', round: 0.6 });
    });
    b.each(7, (i) => void b.stick([-2.25 + i * 0.75, 0.05, -1.37], [-2.25 + i * 0.75, 2.15, -1.37], 0.02, 'lightgray', { noInk: true }));
    b.each(3, (i) => void b.stick([-2.45, 0.55 + i * 0.55, -1.37], [2.45, 0.55 + i * 0.55, -1.37], 0.02, 'lightgray', { noInk: true }));
    return b.ball(0.22, [1.0, 0.11, 0.8], { color: 'white' }).done();
  }),
  e('goblet', 'kitchen', 'tableware', () =>
    m('goblet')
      .cyl([0.09, 0.012, 0.09], [0, 0.006, 0], { color: 'silver' })
      .cyl([0.02, 0.08, 0.02], [0, 0.05, 0], { color: 'silver' })
      .ball(0.03, [0, 0.07, 0], { color: 'silver' })
      .cyl([0.06, 0.08, 0.06], [0, 0.13, 0], { color: 'silver', taper: 1.45 })
      .cyl([0.08, 0.006, 0.08], [0, 0.17, 0], { color: 'darkred', noInk: true })
      .ball(0.018, [0, 0.12, 0.034], { color: 'red' })
      .ball(0.014, [0.03, 0.12, 0.024], { color: 'blue' })
      .done(),
  ),
  e('goggles', 'sports', 'protective gear', () => {
    const b = m('goggles');
    b.pair((s) => {
      b.ball([0.06, 0.045, 0.035], [s * 0.035, 0.035, 0], { color: 'black' }).ball([0.05, 0.036, 0.012], [s * 0.035, 0.035, 0.014], { color: '#4ab0e0' });
      b.rod([s * 0.062, 0.035, -0.01], [s * 0.075, 0.03, -0.1], 0.012, 'blue').rod([s * 0.075, 0.03, -0.1], [s * 0.07, 0.006, -0.14], 0.012, 'blue');
    });
    return b.done();
  }),
  e('gold', 'nature', 'gems', () =>
    m('gold')
      .box([0.1, 0.035, 0.045], [-0.028, 0.0175, 0], { color: 'gold', round: 0.2 })
      .box([0.1, 0.035, 0.045], [0.028, 0.0175, 0.005], { color: 'gold', round: 0.2 })
      .box([0.1, 0.035, 0.045], [0, 0.0525, 0.002], { color: '#f0c840', round: 0.2, rot: [0, 8, 0] })
      .star(0.025, [0.03, 0.08, 0.02], { color: 'white', glow: true })
      .done(),
  ),
  e('gold mine', 'places', 'industry', () => {
    const b = m('gold mine')
      .ball([8, 6, 5], [0, 1.5, -1.2], { color: '#8a7058' })
      .box([2.0, 2.4, 0.4], [0, 1.2, 1.15], { color: '#1a1410' })
      .label('GOLD MINE', [2.2, 0.5], [0, 3.0, 1.5], { color: 'wood' });
    b.pair((s) => void b.box([0.3, 2.6, 0.3], [s * 1.1, 1.3, 1.35], { color: 'wood' }));
    b.box([2.6, 0.3, 0.35], [0, 2.65, 1.35], { color: 'wood' });
    b.pair((s) => void b.stick([s * 0.4, 0.04, 1.2], [s * 0.4, 0.04, 4.0], 0.06, 'iron'));
    b.each(5, (i) => void b.box([1.1, 0.05, 0.14], [0, 0.02, 1.5 + i * 0.6], { color: 'darkwood' }));
    b.box([1.0, 0.6, 1.2], [0, 0.55, 3.2], { color: 'iron', round: 0.1 });
    b.pair((s) => void b.torus([0.36, 0.36, 0.1], [s * 0.52, 0.2, 3.2], { color: 'darkgray', rot: [0, 90, 0] }));
    return b.ball([0.3, 0.25, 0.3], [-0.2, 0.9, 3.1], { color: 'gold' }).ball([0.3, 0.25, 0.3], [0.2, 0.92, 3.3], { color: 'gold' }).ball([0.25, 0.2, 0.25], [0.05, 1.05, 3.2], { color: 'gold' }).done();
  }),
  e('golden egg', 'fantasy', 'magic items', () => {
    const b = m('golden egg').torus([0.16, 0.16, 0.05], [0, 0.02, 0], { color: '#b08848', rot: [90, 0, 0], tube: 0.35 }).cyl([0.12, 0.02, 0.12], [0, 0.01, 0], { color: '#9a7040' });
    return b.ball([0.09, 0.12, 0.09], [0, 0.075, 0], { color: 'gold' }).star(0.03, [0.03, 0.12, 0.04], { color: 'white', glow: true }).done();
  }),
  e('golf bag', 'sports', 'golf', () => {
    const b = m('golf bag')
      .cyl([0.26, 0.85, 0.26], [0, 0.425, 0], { color: 'navy' })
      .cyl([0.28, 0.08, 0.28], [0, 0.85, 0], { color: 'white' })
      .box([0.14, 0.4, 0.08], [0, 0.35, 0.13], { color: '#2a3a7a', round: 0.4 })
      .rod([-0.12, 0.75, 0.02], [-0.12, 0.25, 0.04], 0.04, 'white');
    [[-0.06, 0.03, 'silver'], [0.04, 0.05, 'silver'], [0.0, -0.06, 'black'], [0.07, -0.03, 'darkgray']].forEach(([x, z, c], i) => {
      const xx = x as number, zz = z as number;
      b.stick([xx, 0.85, zz], [xx * 1.3, 1.0 + i * 0.03, zz * 1.3], 0.015, 'gray').ball([0.07, 0.05, 0.05], [xx * 1.3, 1.03 + i * 0.03, zz * 1.3], { color: c as string });
    });
    return b.done();
  }),
  e('golf ball', 'sports', 'golf', () => {
    const b = m('golf ball').cyl([0.012, 0.04, 0.012], [0, 0.02, 0], { color: 'wood', taper: 2 }).ball(0.043, [0, 0.0615, 0], { color: 'white' });
    b.each(8, (i) => void b.ball(0.006, [Math.sin(i * 0.8) * 0.017, 0.0615 + Math.cos(i * 1.3) * 0.012, 0.019], { color: 'lightgray', noInk: true }));
    return b.done();
  }),
  e('golf cart', 'garage', 'cars', () => {
    const b = m('golf cart', { view: 'side' })
      .box([1.2, 0.5, 2.3], [0, 0.55, 0], { color: 'white', round: 0.3 })
      .box([1.1, 0.25, 0.6], [0, 0.85, -0.2], { color: 'tan', round: 0.4 })
      .box([1.1, 0.5, 0.15], [0, 1.1, -0.45], { color: 'tan', round: 0.4 })
      .box([1.25, 0.08, 2.0], [0, 1.85, -0.1], { color: 'white', round: 0.3 })
      .box([1.1, 0.5, 0.06], [0, 1.4, 0.8], { color: 'glass' })
      .cyl([0.25, 0.8, 0.25], [0, 0.95, -1.05], { color: 'navy', rot: [-15, 0, 0] })
      .box([0.4, 0.1, 0.1], [0, 0.7, 1.16], { color: 'yellow', glow: true });
    b.pair((s) => void b.stick([s * 0.55, 0.8, 0.75], [s * 0.55, 1.85, 0.8], 0.05, 'gray').stick([s * 0.55, 0.8, -0.9], [s * 0.55, 1.85, -0.95], 0.05, 'gray'));
    for (const z of [0.75, -0.75]) b.pair((s) => void b.torus([0.45, 0.45, 0.2], [s * 0.55, 0.225, z], { color: 'rubber', rot: [0, 90, 0], tube: 0.35 }));
    return b.done();
  }),
  e('golf club', 'sports', 'golf', () =>
    m('golf club')
      .ball([0.13, 0.08, 0.1], [0.05, 0.04, 0], { color: 'darkgray' })
      .box([0.08, 0.02, 0.004], [0.06, 0.04, 0.05], { color: 'silver', noInk: true })
      .rod([0.0, 0.06, 0], [-0.25, 1.0, 0], 0.016, 'silver')
      .rod([-0.21, 0.86, 0], [-0.27, 1.08, 0], 0.03, 'black')
      .done(),
  ),
  e('golf course', 'sports', 'golf', () => {
    const b = m('golf course')
      .ball([7, 0.6, 5], [0, 0, 0], { color: 'grass' })
      .ball([3, 0.5, 2.4], [0.6, 0.12, 0.4], { color: '#6ad04a' })
      .ball([1.6, 0.3, 1.0], [-2.2, 0.08, 1.2], { color: 'sand' })
      .ball([1.8, 0.2, 1.2], [2.4, 0.05, -1.2], { color: 'water' })
      .cyl([0.12, 0.04, 0.12], [0.8, 0.36, 0.6], { color: 'black' })
      .stick([0.8, 0.3, 0.6], [0.8, 2.4, 0.6], 0.04, 'white')
      .box([0.7, 0.45, 0.03], [1.15, 2.15, 0.6], { color: 'red' })
      .ball(0.12, [0.3, 0.38, 1.0], { color: 'white' });
    for (const [x, z] of [[-2.6, -1.4], [-1.4, -1.9]]) b.stick([x, 0, z], [x, 1.8, z], 0.2, 'bark').ball([1.2, 1.4, 1.2], [x, 2.4, z], { color: 'darkgreen' });
    return b.done();
  }),
  e('golf glove', 'sports', 'golf', () => {
    const b = m('golf glove')
      .box([0.09, 0.03, 0.04], [0, 0.015, 0], { color: 'white', round: 0.4 })
      .box([0.09, 0.1, 0.036], [0, 0.08, 0], { color: 'white', round: 0.45 })
      .box([0.06, 0.04, 0.01], [0, 0.06, 0.02], { color: 'navy', round: 0.4 })
      .capsule([0.026, 0.06, 0.026], [-0.058, 0.09, 0.004], { color: 'white', rot: [0, 0, 40] });
    b.each(4, (i) => void b.capsule([0.022, 0.07 + (i === 1 || i === 2 ? 0.012 : 0), 0.024], [-0.032 + i * 0.021, 0.16 + (i === 1 || i === 2 ? 0.006 : 0), 0], { color: 'white' }));
    b.each(6, (i) => void b.ball(0.005, [-0.025 + (i % 3) * 0.025, 0.1 + Math.floor(i / 3) * 0.015, 0.019], { color: 'lightgray', noInk: true }));
    return b.done();
  }),
  e('gong', 'music', 'percussion', () => {
    const b = m('gong')
      .cyl([0.6, 0.035, 0.6], [0, 0.46, 0], { color: 'bronze', rot: [90, 0, 0] })
      .cyl([0.15, 0.05, 0.15], [0, 0.46, 0.01], { color: '#c8903a', rot: [90, 0, 0] })
      .torus([0.62, 0.62, 0.04], [0, 0.46, 0], { color: '#8a5a20', tube: 0.04 })
      .stick([-0.45, 0.88, 0], [0.45, 0.88, 0], 0.06, 'darkred');
    b.pair((s) => {
      b.stick([s * 0.42, 0, 0], [s * 0.42, 0.9, 0], 0.06, 'darkred').box([0.14, 0.08, 0.32], [s * 0.42, 0.04, 0], { color: 'darkred' });
      b.rod([s * 0.12, 0.75, 0], [s * 0.2, 0.86, 0], 0.012, 'tan');
    });
    return b.rod([0.25, 0.02, 0.2], [0.4, 0.08, 0.35], 0.02, 'wood').ball(0.07, [0.22, 0.03, 0.18], { color: 'cream' }).done();
  }),
  e('gorge', 'nature', 'landforms', () => {
    const b = m('gorge').box([8, 0.3, 4], [0, 0.15, 0], { color: '#a8603a' }).box([1.4, 0.1, 4], [0, 0.32, 0], { color: 'water' });
    b.pair((s) => {
      b.box([3, 5, 4], [s * 2.5, 2.5, 0], { color: '#c06a3a', round: 0.08, rot: [0, 0, s * 4] });
      b.each(3, (i) => void b.box([3.02, 0.25, 4.02], [s * 2.5 - s * i * 0.07, 1.2 + i * 1.3, 0], { color: '#e08a50', noInk: true, rot: [0, 0, s * 4] }));
      b.ball([1.2, 1.0, 1.2], [s * 3.2, 5.2, -0.8], { color: 'darkgreen' });
    });
    return b.done();
  }),
  e('gps', 'tech', 'gadgets', () =>
    m('gps')
      .cyl([0.06, 0.012, 0.06], [0, 0.006, 0], { color: 'black' })
      .rod([0, 0.01, 0], [0, 0.035, -0.01], 0.012, 'black')
      .box([0.13, 0.085, 0.02], [0, 0.075, 0], { color: '#2a2a2e', rot: [-10, 0, 0], round: 0.3 })
      .box([0.11, 0.065, 0.004], [0, 0.076, 0.011], { color: '#8ad08a', rot: [-10, 0, 0], glow: true })
      .rod([-0.04, 0.06, 0.016], [0.0, 0.08, 0.012], 0.006, 'blue', { noInk: true })
      .rod([0.0, 0.08, 0.012], [0.035, 0.09, 0.01], 0.006, 'blue', { noInk: true })
      .cone([0.012, 0.018, 0.006], [0.035, 0.102, 0.012], { color: 'red', rot: [180, 0, 0] })
      .done(),
  ),
  e('graffiti', 'places', 'street art', () => {
    const b = m('graffiti').box([3.2, 2.0, 0.3], [0, 1.0, -0.15], { color: '#b8705a', round: 0.02 });
    const C = ['magenta', 'lime', 'cyan', 'yellow', 'orange', 'purple'];
    b.each(6, (i) => void b.ball([0.6, 0.7, 0.04], [-1.25 + i * 0.5, 1.1 + (i % 2) * 0.15, 0.01], { color: C[i], noInk: true, rot: [0, 0, (i - 2.5) * 10] }));
    b.rod([-1.4, 0.5, 0.04], [1.4, 0.6, 0.04], 0.12, 'black', { noInk: true }).star(0.4, [1.3, 1.7, 0.04], { color: 'yellow', noInk: true });
    return b.cyl([0.08, 0.22, 0.08], [0.9, 0.11, 0.4], { color: 'red' }).cyl([0.03, 0.03, 0.03], [0.9, 0.235, 0.4], { color: 'white' }).done();
  }),
  e('grail', 'fantasy', 'magic items', () =>
    m('grail')
      .cyl([0.1, 0.015, 0.1], [0, 0.0075, 0], { color: 'gold' })
      .cyl([0.03, 0.07, 0.03], [0, 0.05, 0], { color: 'gold', taper: 0.6 })
      .ball([0.04, 0.025, 0.04], [0, 0.085, 0], { color: 'gold' })
      .ball([0.09, 0.08, 0.09], [0, 0.13, 0], { color: 'gold' })
      .cyl([0.09, 0.025, 0.09], [0, 0.16, 0], { color: 'gold' })
      .ball(0.02, [0, 0.13, 0.044], { color: 'red' })
      .ball([0.12, 0.08, 0.12], [0, 0.21, 0], { color: '#fff8c0', glow: true })
      .star(0.05, [0, 0.28, 0], { color: 'yellow', glow: true })
      .done(),
  ),
  e('grandfather clock', 'home', 'furniture', () =>
    m('grandfather clock')
      .box([0.5, 0.3, 0.3], [0, 0.15, 0], { color: 'darkwood' })
      .box([0.4, 1.15, 0.26], [0, 0.87, 0], { color: 'darkwood' })
      .box([0.28, 0.85, 0.04], [0, 0.83, 0.12], { color: '#2a1a12' })
      .box([0.5, 0.48, 0.3], [0, 1.68, 0], { color: 'darkwood' })
      .wedge([0.56, 0.18, 0.32], [0, 2.01, 0], { color: 'darkwood' })
      .cyl([0.34, 0.02, 0.34], [0, 1.68, 0.15], { color: 'cream', rot: [90, 0, 0] })
      .stick([0, 1.68, 0.165], [0, 1.8, 0.165], 0.015, 'black')
      .stick([0, 1.68, 0.165], [0.09, 1.66, 0.165], 0.015, 'black')
      .stick([0, 1.2, 0.15], [0, 0.65, 0.15], 0.015, 'brass', { name: 'top', pivot: [0, 1.2, 0.15] })
      .cyl([0.14, 0.02, 0.14], [0, 0.6, 0.15], { color: 'gold', rot: [90, 0, 0], parent: 'top' })
      .done(),
  ),
  e('granite', 'nature', 'rocks', () => {
    const b = m('granite').ball([0.6, 0.45, 0.5], [0, 0.2, 0], { color: '#b8a8a0' }).ball([0.3, 0.25, 0.3], [0.22, 0.12, 0.12], { color: '#c8b0a8' });
    const P: V[] = [[0.1, 0.33, 0.18], [-0.15, 0.3, 0.17], [0.02, 0.22, 0.25], [-0.22, 0.15, 0.18], [0.18, 0.38, 0.05], [-0.05, 0.4, 0.1], [0.3, 0.18, 0.2], [0.2, 0.08, 0.25]];
    P.forEach((p, i) => void b.ball(0.04, p, { color: i % 3 ? '#2a2a2a' : '#e8d8d0', noInk: true }));
    return b.done();
  }),
  e('grape', 'food', 'fruit', () =>
    m('grape')
      .ball([0.034, 0.038, 0.034], [0, 0.019, 0], { color: '#6a2a7a' })
      .rod([0, 0.037, 0], [0.004, 0.05, 0], 0.004, 'darkgreen')
      .ball([0.04, 0.004, 0.025], [0.02, 0.05, 0], { color: 'leaf', rot: [0, 0, -20] })
      .ball(0.007, [-0.007, 0.028, 0.014], { color: 'white', noInk: true })
      .done(),
  ),
  e('grape juice', 'food', 'drinks', () => {
    const b = bottle(m('grape juice'), 0, 0, 0.3, 0.09, '#5a1a6a', 'purple', 'white');
    return b.label('GRAPE', [0.06, 0.04], [0, 0.093, 0.047], { color: 'white' }).ball(0.022, [-0.015, 0.075, 0.047], { color: 'purple', noInk: true }).ball(0.022, [0.015, 0.075, 0.047], { color: 'purple', noInk: true }).done();
  }),
  e('grape soda', 'food', 'drinks', () => {
    const b = m('grape soda')
      .cyl([0.066, 0.16, 0.066], [0, 0.08, 0], { color: 'purple' })
      .cyl([0.058, 0.012, 0.058], [0, 0.166, 0], { color: 'silver', taper: 0.9 })
      .box([0.012, 0.004, 0.02], [0, 0.173, 0.01], { color: 'silver' })
      .label('GRAPE', [0.05, 0.02], [0, 0.12, 0.034], { color: 'yellow' });
    [[0, 0.08], [-0.01, 0.065], [0.01, 0.065], [0, 0.05], [-0.02, 0.08], [0.02, 0.08]].forEach(([x, y]) => void b.ball(0.014, [x, y, 0.032], { color: '#c060e0', noInk: true }));
    return b.ball([0.02, 0.012, 0.006], [0.012, 0.094, 0.033], { color: 'lime', noInk: true }).done();
  }),
  e('grapefruit tree', 'garden', 'trees', () => tree('grapefruit tree', { h: 5, trunk: 'bark', crown: '#3f8a3a', w: 3.6, fruit: '#f4a070', nf: 9, fs: 0.38 }).done()),
  e('grapes', 'food', 'fruit', () => {
    const b = m('grapes');
    const rows = [4, 3, 3, 2, 1];
    let y = 0.13;
    rows.forEach((n, r) => {
      for (let i = 0; i < n; i++) b.ball(0.03, [(i - (n - 1) / 2) * 0.026, y, (r % 2) * 0.008], { color: '#6a2a7a' });
      y -= 0.025;
    });
    return b.rod([0, 0.14, 0], [0.01, 0.17, 0], 0.006, 'darkbrown').ball([0.07, 0.005, 0.05], [0.04, 0.16, 0], { color: 'leaf', rot: [0, 0, -25] }).done();
  }),
  e('grapevine', 'garden', 'vines', () => {
    const b = m('grapevine');
    b.pair((s) => void b.stick([s * 1.2, 0, 0], [s * 1.2, 2.0, 0], 0.12, 'wood').box([0.3, 0.2, 0.3], [s * 1.2, 0.1, 0], { color: 'dirt' }));
    b.stick([-1.2, 1.9, 0], [1.2, 1.9, 0], 0.03, 'gray').stick([-1.2, 1.3, 0], [1.2, 1.3, 0], 0.03, 'gray');
    b.rod([0, 0, 0], [0.05, 1.3, 0.02], 0.1, 'bark').rod([0.05, 1.3, 0.02], [-1.0, 1.4, 0.03], 0.05, 'bark').rod([0.05, 1.3, 0.02], [1.0, 1.35, 0.03], 0.05, 'bark');
    b.each(8, (i) => void b.ball([0.36, 0.3, 0.12], [-1.0 + i * 0.28, 1.5 + (i % 2) * 0.15, 0.06], { color: i % 2 ? 'leaf' : 'green' }));
    for (const x of [-0.7, 0.3, 0.8]) b.cone([0.22, 0.32, 0.18], [x, 1.1, 0.12], { color: '#6a2a7a', rot: [180, 0, 0] });
    return b.done();
  }),
  e('graph paper', 'study', 'paper goods', () => {
    const b = m('graph paper')
      .box([0.26, 0.03, 0.08], [0, 0.015, 0.04], { color: 'darkwood' })
      .box([0.24, 0.32, 0.024], [0, 0.17, -0.02], { color: '#a87a4a', rot: [-10, 0, 0], round: 0.1 })
      .box([0.21, 0.27, 0.004], [0, 0.155, -0.005], { color: 'white', rot: [-10, 0, 0] })
      .box([0.08, 0.03, 0.03], [0, 0.31, 0.0], { color: 'silver', rot: [-10, 0, 0] });
    b.each(7, (i) => void b.box([0.002, 0.26, 0.004], [-0.09 + i * 0.03, 0.155, -0.001], { color: 'skyblue', rot: [-10, 0, 0], noInk: true }).box([0.2, 0.002, 0.004], [0, 0.04 + i * 0.035, -0.0005 - (i * 0.035) * 0.17], { color: 'skyblue', rot: [-10, 0, 0], noInk: true }));
    return b.rod([-0.08, 0.07, 0.004], [0, 0.15, -0.01], 0.006, 'red', { noInk: true }).rod([0, 0.15, -0.01], [0.08, 0.22, -0.023], 0.006, 'red', { noInk: true }).done();
  }),
  e('grass', 'garden', 'plants', () => {
    const b = m('grass').ball([0.22, 0.07, 0.22], [0, 0.02, 0], { color: 'dirt' });
    b.each(11, (i) => {
      const a = (i / 11) * Math.PI * 2, r = 0.02 + (i % 3) * 0.025, t = 18 + (i % 4) * 8;
      b.cone([0.04, 0.32 + (i % 3) * 0.06, 0.012], [Math.cos(a) * r, 0.19 + (i % 3) * 0.03, Math.sin(a) * r], { color: i % 2 ? 'grass' : 'green', rot: [Math.sin(a) * t, 0, -Math.cos(a) * t] });
    });
    return b.done();
  }),
  e('grassland', 'nature', 'landforms', () => {
    const b = m('grassland').cyl([3.2, 0.12, 2.4], [0, 0.06, 0], { color: '#a8c060' });
    b.each(9, (i) => {
      const x = -1.2 + (i % 5) * 0.55, z = i < 5 ? 0.6 : -0.5;
      b.cone([0.3, 0.45 + (i % 3) * 0.1, 0.3], [x, 0.3, z], { color: i % 2 ? '#c8c060' : '#98b048' });
    });
    return b.stick([0.9, 0.1, -0.3], [0.9, 1.1, -0.3], 0.12, 'bark').ball([1.3, 0.3, 1.0], [0.9, 1.2, -0.3], { color: '#5a8a3a' }).done();
  }),
  e('grate', 'places', 'street furniture', () => {
    const b = m('grate').box([0.5, 0.12, 0.5], [0, 0.06, 0], { color: 'stone' }).box([0.38, 0.03, 0.38], [0, 0.11, 0], { color: '#1a1a1a' });
    b.each(7, (i) => void b.box([0.025, 0.035, 0.38], [-0.15 + i * 0.05, 0.125, 0], { color: 'iron', round: 0.2 }));
    return b.box([0.38, 0.035, 0.03], [0, 0.126, 0], { color: 'iron' }).done();
  }),
  e('grater', 'kitchen', 'utensils', () => {
    const b = m('grater')
      .box([0.11, 0.22, 0.09], [0, 0.11, 0], { color: 'silver', round: 0.08 })
      .torus([0.07, 0.05, 0.02], [0, 0.245, 0], { color: 'black', tube: 0.2 })
      .box([0.08, 0.02, 0.06], [0, 0.225, 0], { color: 'black' });
    b.each(12, (i) => void b.box([0.014, 0.006, 0.004], [-0.03 + (i % 4) * 0.02, 0.05 + Math.floor(i / 4) * 0.055, 0.046], { color: '#4a4a52', noInk: true }));
    return b.done();
  }),
  e('grave', 'places', 'cemetery', () =>
    m('grave')
      .box([0.6, 0.7, 0.15], [0, 0.35, -0.6], { color: 'gray', round: 0.1 })
      .cyl([0.6, 0.15, 0.3], [0, 0.7, -0.6], { color: 'gray', rot: [90, 0, 0] })
      .label('R.I.P.', [0.4, 0.15], [0, 0.6, -0.52], { color: 'gray' })
      .box([0.8, 0.12, 1.2], [0, 0.06, 0.1], { color: 'dirt', round: 0.5 })
      .ball(0.08, [-0.15, 0.15, -0.4], { color: 'red' })
      .ball(0.08, [-0.05, 0.15, -0.4], { color: 'yellow' })
      .ball([0.2, 0.06, 0.1], [-0.1, 0.12, -0.42], { color: 'leaf' })
      .done(),
  ),
  e('gravel', 'nature', 'rocks', () => {
    const b = m('gravel').ball([0.3, 0.06, 0.24], [0, 0.015, 0], { color: '#a8a098' });
    b.each(16, (i) => {
      const a = i * 2.4, r = 0.02 + (i % 5) * 0.022;
      b.ball([0.04, 0.03, 0.035], [Math.cos(a) * r, 0.035 + (0.11 - r) * 0.25, Math.sin(a) * r * 0.8], { color: ['#8a8680', '#b8b0a4', '#9a8a78', '#6a6a6a'][i % 4], rot: [0, i * 30, 0] });
    });
    return b.done();
  }),
  e('graveyard', 'places', 'cemetery', () => {
    const b = m('graveyard').box([5, 0.1, 4], [0, 0.05, 0], { color: 'grass' });
    for (const [x, z, h] of [[-1.5, -0.8, 0.8], [0, -1.0, 1.0], [1.5, -0.7, 0.75], [-0.8, 0.8, 0.7]] as V[]) {
      b.box([0.55, h, 0.15], [x, 0.1 + h / 2, z], { color: 'gray', round: 0.1 }).cyl([0.55, 0.15, 0.27], [x, 0.1 + h, z], { color: 'gray', rot: [90, 0, 0] });
    }
    b.box([0.12, 1.1, 0.12], [1.0, 0.65, 0.9], { color: 'stone' }).box([0.6, 0.12, 0.12], [1.0, 0.95, 0.9], { color: 'stone' });
    b.rod([2.0, 0.1, -1.5], [2.0, 1.8, -1.5], 0.14, 'darkbrown').rod([2.0, 1.4, -1.5], [1.5, 1.9, -1.5], 0.07, 'darkbrown').rod([2.0, 1.6, -1.5], [2.4, 2.0, -1.5], 0.06, 'darkbrown');
    b.each(9, (i) => void b.stick([-2.4 + i * 0.6, 0.1, 1.9], [-2.4 + i * 0.6, 0.8, 1.9], 0.05, 'black'));
    return b.stick([-2.4, 0.6, 1.9], [2.4, 0.6, 1.9], 0.04, 'black').ball([0.8, 0.35, 0.6], [-1.8, 1.7, -1.7], { color: 'lightgray' }).done();
  }),
  e('gravy', 'food', 'sauces', () =>
    m('gravy')
      .cyl([0.22, 0.012, 0.22], [0, 0.006, 0], { color: 'white' })
      .ball([0.13, 0.08, 0.12], [0, 0.04, 0], { color: '#f4ecd0' })
      .ball([0.1, 0.03, 0.09], [0, 0.07, 0], { color: '#7a4a20' })
      .capsule([0.02, 0.04, 0.015], [0.04, 0.05, 0.035], { color: '#7a4a20', rot: [20, 0, 20] })
      .ball([0.1, 0.01, 0.08], [0.05, 0.013, 0.05], { color: '#7a4a20' })
      .done(),
  ),
  e('gravy boat', 'kitchen', 'tableware', () =>
    m('gravy boat')
      .ball([0.2, 0.01, 0.12], [0, 0.005, 0], { color: 'white' })
      .ball([0.1, 0.08, 0.16], [0, 0.05, 0], { color: 'white' })
      .ball([0.085, 0.01, 0.13], [0, 0.085, 0], { color: '#7a4a20', noInk: true })
      .cone([0.05, 0.06, 0.025], [0, 0.085, 0.085], { color: 'white', rot: [-60, 0, 0], taper: 0.4 })
      .torus([0.05, 0.06, 0.015], [0, 0.07, -0.085], { color: 'white', rot: [0, 90, 0] })
      .done(),
  ),
  e('greater than sign', 'ideas', 'math symbols', () =>
    tile('greater than sign')
      .rod([-0.03, 0.1, 0.018], [0.032, 0.065, 0.018], 0.018, 'green')
      .rod([0.032, 0.065, 0.018], [-0.03, 0.03, 0.018], 0.018, 'green')
      .done(),
  ),
  e('greek temple', 'places', 'landmarks', () => {
    const b = m('greek temple')
      .box([8, 0.3, 5], [0, 0.15, 0], { color: 'stone' })
      .box([7.4, 0.3, 4.4], [0, 0.45, 0], { color: '#e8e4d8' })
      .box([6.2, 3.4, 3.2], [0, 2.3, -0.2], { color: '#d8d4c8' })
      .box([7.4, 0.5, 4.4], [0, 4.35, 0], { color: '#e8e4d8' })
      .wedge([7.6, 1.4, 4.6], [0, 5.3, 0], { color: '#e8e4d8' })
      .wedge([6.4, 1.0, 0.1], [0, 5.15, 2.31], { color: '#c8c0b0', noInk: true });
    b.each(6, (i) => void b.cyl([0.45, 3.5, 0.45], [-3.2 + i * 1.28, 2.35, 1.9], { color: 'white' }).cyl([0.6, 0.15, 0.6], [-3.2 + i * 1.28, 4.0, 1.9], { color: 'white' }));
    return b.done();
  }),
  e('green button', 'tech', 'controls', () =>
    m('green button')
      .box([0.12, 0.04, 0.12], [0, 0.02, 0], { color: 'darkgray', round: 0.2 })
      .cyl([0.09, 0.012, 0.09], [0, 0.046, 0], { color: 'silver' })
      .cyl([0.075, 0.025, 0.075], [0, 0.064, 0], { color: 'lime' })
      .ball([0.075, 0.03, 0.075], [0, 0.076, 0], { color: 'lime' })
      .done(),
  ),
  e('green switch', 'tech', 'controls', () =>
    m('green switch')
      .box([0.08, 0.12, 0.02], [0, 0.06, 0], { color: 'white', round: 0.2 })
      .box([0.045, 0.075, 0.02], [0, 0.06, 0.018], { color: '#2a2a2a', round: 0.2 })
      .box([0.035, 0.032, 0.025], [0, 0.077, 0.026], { color: 'lime', rot: [12, 0, 0], round: 0.3 })
      .box([0.035, 0.032, 0.02], [0, 0.043, 0.024], { color: '#1a8a2a', rot: [-12, 0, 0], round: 0.3 })
      .box([0.004, 0.014, 0.004], [0, 0.08, 0.04], { color: 'white', noInk: true, rot: [12, 0, 0] })
      .done(),
  ),
  e('greenhouse', 'garden', 'garden features', () => {
    const b = m('greenhouse').box([3.2, 2.0, 2.4], [0, 1.0, 0], { color: '#cfeee0', round: 0.02 }).wedge([3.3, 1.0, 2.5], [0, 2.5, 0], { color: '#cfeee0' });
    b.each(5, (i) => void b.stick([-1.6 + i * 0.8, 0, 1.22], [-1.6 + i * 0.8, 2.0, 1.22], 0.06, 'white'));
    b.stick([-1.6, 2.0, 1.22], [1.6, 2.0, 1.22], 0.06, 'white').stick([-1.6, 1.0, 1.22], [1.6, 1.0, 1.22], 0.04, 'white').stick([0, 3.0, -1.25], [0, 3.0, 1.25], 0.06, 'white');
    b.pair((s) => void b.rod([s * 1.65, 2.0, 1.25], [0, 3.0, 1.25], 0.06, 'white'));
    b.each(4, (i) => void b.ball([0.4, 0.5, 0.3], [-1.2 + i * 0.8, 0.5, 1.1], { color: i % 2 ? 'green' : 'leaf' }));
    return b.box([0.7, 1.7, 0.06], [0, 0.85, 1.24], { color: '#b8e0d0', name: 'door', pivot: [-0.35, 0.85, 1.24] }).cyl([0.4, 0.35, 0.4], [2.0, 0.175, 1.2], { color: '#c06a40', taper: 1.2 }).ball(0.5, [2.0, 0.6, 1.2], { color: 'red' }).done();
  }),
  e('grenade', 'armory', 'grenades', () => {
    const b = m('grenade').ball([0.065, 0.085, 0.065], [0, 0.043, 0], { color: '#5a6a3a' });
    b.each(3, (i) => void b.torus([0.067, 0.08, 0.004], [0, 0.043, 0], { color: '#3a4a2a', rot: [0, i * 60, 0], tube: 0.06, noInk: true }));
    b.torus([0.066, 0.066, 0.004], [0, 0.043, 0], { color: '#3a4a2a', rot: [90, 0, 0], tube: 0.06, noInk: true });
    return b
      .cyl([0.028, 0.025, 0.028], [0, 0.093, 0], { color: 'gray' })
      .box([0.012, 0.08, 0.008], [0, 0.07, 0.035], { color: 'gray', rot: [-12, 0, 0] })
      .torus([0.03, 0.03, 0.005], [0.025, 0.1, 0], { color: 'silver', tube: 0.15, rot: [0, 30, 0] })
      .done();
  }),
  e('grenade launcher', 'armory', 'guns', () =>
    m('grenade launcher', { view: 'side' })
      .cyl([0.16, 0.18, 0.16], [0, 0.1, 0.0], { color: '#3a3a3a', rot: [90, 0, 0] })
      .stick([0, 0.13, 0.08], [0, 0.13, 0.5], 0.07, '#2a2a2a')
      .box([0.07, 0.08, 0.3], [0, 0.17, -0.12], { color: '#4a4a40' })
      .box([0.05, 0.12, 0.05], [0, 0.08, -0.12], { color: '#3a3a3a', rot: [-15, 0, 0] })
      .box([0.06, 0.1, 0.3], [0, 0.12, -0.38], { color: '#5a5040', rot: [8, 0, 0], round: 0.3 })
      .box([0.03, 0.05, 0.03], [0, 0.23, 0.3], { color: '#2a2a2a' })
      .cyl([0.08, 0.02, 0.08], [0, 0.13, 0.51], { color: 'black', rot: [90, 0, 0] })
      .done(),
  ),
  e('griddle', 'kitchen', 'cookware', () =>
    m('griddle')
      .box([0.4, 0.045, 0.28], [0, 0.0225, 0], { color: '#2a2a2e', round: 0.2 })
      .box([0.08, 0.03, 0.06], [0.24, 0.03, 0], { color: '#2a2a2e', round: 0.3 })
      .box([0.08, 0.03, 0.06], [-0.24, 0.03, 0], { color: '#2a2a2e', round: 0.3 })
      .cyl([0.12, 0.02, 0.12], [-0.08, 0.055, 0], { color: '#d8a050' })
      .cyl([0.12, 0.02, 0.12], [0.08, 0.055, 0.01], { color: '#d8a050' })
      .box([0.08, 0.004, 0.06], [0.12, 0.072, -0.06], { color: 'silver', rot: [0, 30, 0] })
      .rod([0.12, 0.072, -0.06], [0.22, 0.1, -0.16], 0.014, 'black')
      .done(),
  ),
  e('grill', 'garden', 'backyard', () => {
    const b = m('grill')
      .ball([0.56, 0.4, 0.56], [0, 0.72, 0], { color: '#1a1a1e' })
      .cyl([0.57, 0.02, 0.57], [0, 0.72, 0], { color: 'silver' })
      .ball([0.56, 0.36, 0.56], [0, 0.73, 0], { color: '#1a1a1e', name: 'lid', pivot: [0, 0.73, -0.28] })
      .cyl([0.06, 0.04, 0.06], [0, 0.92, 0], { color: 'silver', parent: 'lid' })
      .box([0.16, 0.03, 0.04], [0, 0.95, 0], { color: 'darkwood', parent: 'lid' })
      .cyl([0.2, 0.02, 0.2], [0, 0.35, 0], { color: 'silver' })
      .torus([0.16, 0.16, 0.05], [0.24, 0.08, -0.14], { color: 'rubber', rot: [0, 60, 0] });
    for (const [x, z] of around(3, 0.22, Math.PI / 2)) b.stick([x * 1.1, 0, z * 1.1], [x * 0.7, 0.6, z * 0.7], 0.04, 'silver');
    return b.done();
  }),
  e('grilled cheese', 'food', 'sandwiches', () =>
    m('grilled cheese')
      .cyl([0.24, 0.01, 0.24], [0, 0.005, 0], { color: 'white' })
      .wedge([0.13, 0.13, 0.026], [-0.03, 0.023, 0.0], { color: '#d89a40', rot: [90, 0, 30] })
      .wedge([0.135, 0.135, 0.012], [-0.03, 0.042, 0.0], { color: 'orange', rot: [90, 0, 30] })
      .wedge([0.13, 0.13, 0.026], [-0.03, 0.061, 0.0], { color: '#e0a848', rot: [90, 0, 30] })
      .wedge([0.13, 0.13, 0.026], [0.07, 0.07, -0.02], { color: '#d89a40', rot: [40, 0, -150] })
      .capsule([0.016, 0.035, 0.012], [0.0, 0.04, 0.05], { color: 'orange', rot: [0, 0, 10] })
      .done(),
  ),
  e('grinder (tool)', 'workshop', 'power tools', () =>
    m('grinder (tool)')
      .capsule([0.065, 0.24, 0.065], [-0.06, 0.075, 0], { color: 'yellow', rot: [0, 0, 80] })
      .box([0.09, 0.07, 0.07], [0.08, 0.08, 0], { color: '#2a2a2a', round: 0.3 })
      .cyl([0.06, 0.04, 0.06], [0.09, 0.035, 0], { color: 'gray' })
      .cyl([0.12, 0.008, 0.12], [0.09, 0.014, 0], { color: '#4a4a52' })
      .cyl([0.13, 0.03, 0.13], [0.07, 0.03, -0.01], { color: 'silver', taper: 0.9 })
      .rod([0.08, 0.09, 0.03], [0.08, 0.11, 0.12], 0.025, 'black')
      .star(0.035, [0.16, 0.04, 0.06], { color: 'orange', glow: true })
      .done(),
  ),
];

void hat;
void held;
void who;
void wear;
