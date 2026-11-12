/**
 * A tiny software renderer for preview sheets: sculpted meshes drawn with flat-ish lighting into an RGB buffer,
 * written as PNG with node's zlib. No browser needed, so authors can look at hundreds of models quickly.
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import type { Sculpt } from '../../src/shared/figure/sculpt';

export class Canvas {
  readonly rgb: Uint8Array;
  readonly depth: Float32Array;
  constructor(
    readonly w: number,
    readonly h: number,
    bg: [number, number, number] = [236, 240, 232],
  ) {
    this.rgb = new Uint8Array(w * h * 3);
    for (let i = 0; i < w * h; i++) this.rgb.set(bg, i * 3);
    this.depth = new Float32Array(w * h).fill(Infinity);
  }

  rect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.rgb.set(c, (j * this.w + i) * 3);
  }

  /** 3x5 digits, scaled. */
  number(n: number, x: number, y: number, scale = 2, c: [number, number, number] = [40, 40, 40]): void {
    const F: Record<string, string> = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111', '9': '111101111001111' };
    let cx = x;
    for (const ch of String(n)) {
      const g = F[ch];
      for (let k = 0; k < 15; k++) if (g[k] === '1') this.rect(cx + (k % 3) * scale, y + Math.floor(k / 3) * scale, scale, scale, c);
      cx += 4 * scale;
    }
  }

  /** Draw a sculpt into the tile at (ox, oy) of size s, seen from front-left and a little above. */
  sculpt(sc: Sculpt, ox: number, oy: number, s: number, yawDeg = 35, pitchDeg = 18): void {
    const P = sc.positions, N = sc.normals, Cc = sc.colors, I = sc.indices;
    const yaw = (yawDeg * Math.PI) / 180, pit = (pitchDeg * Math.PI) / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
    const nv = P.length / 3;
    const X = new Float32Array(nv), Y = new Float32Array(nv), Z = new Float32Array(nv);
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for (let v = 0; v < nv; v++) {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      // turn the model by -yaw so its front-left faces the viewer, then tilt to look down a little
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      X[v] = x1, Y[v] = y2, Z[v] = z2;
      minx = Math.min(minx, x1), maxx = Math.max(maxx, x1), miny = Math.min(miny, y2), maxy = Math.max(maxy, y2);
    }
    const span = Math.max(maxx - minx, maxy - miny) || 1;
    const k = (s * 0.86) / span;
    const cx0 = ox + s / 2 - ((minx + maxx) / 2) * k, cy0 = oy + s / 2 + ((miny + maxy) / 2) * k;
    const L = [-0.45, 0.75, 0.48];
    const ll = Math.hypot(L[0], L[1], L[2]);
    for (let t = 0; t < I.length; t += 3) {
      const a = I[t], b = I[t + 1], c = I[t + 2];
      const ax = cx0 + X[a] * k, ay = cy0 - Y[a] * k, bx = cx0 + X[b] * k, by = cy0 - Y[b] * k, cx = cx0 + X[c] * k, cy2 = cy0 - Y[c] * k;
      const area = (bx - ax) * (cy2 - ay) - (by - ay) * (cx - ax);
      if (Math.abs(area) < 1e-9) continue;
      const x0 = Math.max(ox, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(ox + s - 1, Math.ceil(Math.max(ax, bx, cx)));
      const y0 = Math.max(oy, Math.floor(Math.min(ay, by, cy2))), y1 = Math.min(oy + s - 1, Math.ceil(Math.max(ay, by, cy2)));
      for (let py = y0; py <= y1; py++)
        for (let px = x0; px <= x1; px++) {
          const qx = px + 0.5, qy = py + 0.5;
          const w0 = ((bx - qx) * (cy2 - qy) - (by - qy) * (cx - qx)) / area;
          const w1 = ((cx - qx) * (ay - qy) - (cy2 - qy) * (ax - qx)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * Z[a] + w1 * Z[b] + w2 * Z[c];
          const di = py * this.w + px;
          if (-z >= this.depth[di]) continue;
          this.depth[di] = -z;
          // normal in view space for lighting
          const nx = w0 * N[a * 3] + w1 * N[b * 3] + w2 * N[c * 3];
          const ny = w0 * N[a * 3 + 1] + w1 * N[b * 3 + 1] + w2 * N[c * 3 + 1];
          const nz = w0 * N[a * 3 + 2] + w1 * N[b * 3 + 2] + w2 * N[c * 3 + 2];
          const n1x = nx * cy - nz * sy, n1z = nx * sy + nz * cy;
          const n2y = ny * cp - n1z * sp, n2z = ny * sp + n1z * cp;
          const nl = Math.hypot(n1x, n2y, n2z) || 1;
          const lam = Math.max(0, (n1x * L[0] + n2y * L[1] + n2z * L[2]) / (nl * ll));
          const shade = lam > 0.12 ? 1 : 0.68;
          const rim = n2z / nl < 0.25 ? 0.82 : 1;
          for (let ch = 0; ch < 3; ch++) {
            const lin = w0 * Cc[a * 3 + ch] + w1 * Cc[b * 3 + ch] + w2 * Cc[c * 3 + ch];
            const srgb = lin <= 0.0031308 ? lin * 12.92 : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
            this.rgb[di * 3 + ch] = Math.max(0, Math.min(255, Math.round(srgb * 255 * shade * rim)));
          }
        }
    }
  }

  png(file: string): void {
    const raw = Buffer.alloc((this.w * 3 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 3 + 1)] = 0;
      Buffer.from(this.rgb.buffer, this.rgb.byteOffset + y * this.w * 3, this.w * 3).copy(raw, y * (this.w * 3 + 1) + 1);
    }
    const crcTable = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
    const crc = (buf: Buffer) => {
      let c = 0xffffffff;
      for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const td = Buffer.concat([Buffer.from(type), data]);
      const c = Buffer.alloc(4);
      c.writeUInt32BE(crc(td));
      return Buffer.concat([len, td, c]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  }
}
