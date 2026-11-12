/**
 * Faces for people, painted with canvas strokes so an expression is a handful of numbers: eye shape, brow angle,
 * mouth curve. The paper style draws them on a transparent piece over the head; the 3D style paints them onto the
 * head's own texture.
 */
import type { Expr } from '../../../shared/figure/anim';
import type { FaceSpec } from '../../../shared/figure/types';

const INK = '#2b2118';

/** Draw a face filling the box (x, y, w, h): the box is the head seen from the front. */
export function drawFace(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: FaceSpec, expr: Expr): void {
  const cx = x + w / 2;
  const eyeY = y + h * 0.56;
  const eyeDX = w * 0.19;
  const er = w * 0.062;
  const lw = Math.max(1.5, w * 0.032);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // cheeks first so features sit on top
  if (f.blush && expr !== 'angry' && expr !== 'scared') {
    ctx.fillStyle = hexA(f.blush, expr === 'love' || expr === 'laugh' ? 0.6 : 0.38);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * w * 0.29, y + h * 0.69, w * 0.085, h * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (f.beard) {
    ctx.fillStyle = hexA(f.beard, 0.28);
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.83, w * 0.3, h * 0.13, 0, 0, Math.PI);
    ctx.fill();
  }

  const stroke = (fn: () => void, width = lw, color = INK) => {
    ctx.beginPath();
    fn();
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  };
  const ovalEye = (ex: number, scaleY = 1, look: [number, number] = [0, 0], big = 1) => {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(ex + look[0] * er * 0.5, eyeY + look[1] * er * 0.5, er * 0.82 * big, er * 1.25 * scaleY * big, 0, 0, Math.PI * 2);
    ctx.fill();
    if (scaleY > 0.5) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex - er * 0.25 * big + look[0] * er * 0.5, eyeY - er * 0.45 * big + look[1] * er * 0.5, er * 0.28 * big, er * 0.34 * big, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const roundEye = (ex: number, pupil = 0.45) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, er * 1.35, er * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex, eyeY + er * 0.1, er * pupil * 1.4, 0, Math.PI * 2);
    ctx.fill();
  };
  const arcEye = (ex: number, up: boolean) => stroke(() => (up ? ctx.arc(ex, eyeY + er * 0.6, er * 1.05, Math.PI * 1.1, Math.PI * 1.9) : ctx.arc(ex, eyeY - er * 0.5, er * 1.0, Math.PI * 0.15, Math.PI * 0.85)), lw * 1.2);
  const lineEye = (ex: number) => stroke(() => {
    ctx.moveTo(ex - er * 1.0, eyeY + er * 0.2);
    ctx.lineTo(ex + er * 1.0, eyeY + er * 0.2);
  }, lw * 1.1);
  const heartEye = (ex: number) => {
    const s = er * 1.25;
    ctx.fillStyle = '#e8394d';
    ctx.beginPath();
    ctx.moveTo(ex, eyeY + s * 0.9);
    ctx.bezierCurveTo(ex - s * 1.6, eyeY - s * 0.1, ex - s * 0.7, eyeY - s * 1.3, ex, eyeY - s * 0.4);
    ctx.bezierCurveTo(ex + s * 0.7, eyeY - s * 1.3, ex + s * 1.6, eyeY - s * 0.1, ex, eyeY + s * 0.9);
    ctx.fill();
  };
  const brows = (tilt: number, lift = 0, color = f.brow) => {
    for (const s of [-1, 1]) {
      const bx = cx + s * eyeDX;
      const by = eyeY - er * 2.3 - lift * er;
      stroke(() => {
        // positive tilt: inner ends down (angry); negative: inner ends up (sad, worried)
        ctx.moveTo(bx - s * er * 1.1, by + tilt * er * 0.6);
        ctx.lineTo(bx + s * er * 1.0, by - tilt * er * 0.35);
      }, lw * 1.25, color);
    }
  };
  const mouthY = y + h * 0.78;
  const smile = (wd: number, curve: number) => stroke(() => {
    ctx.moveTo(cx - wd * w, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + curve * h, cx + wd * w, mouthY);
  });
  const openMouth = (wd: number, ht: number, rounded: boolean) => {
    ctx.fillStyle = '#6e2424';
    ctx.beginPath();
    if (rounded) ctx.ellipse(cx, mouthY + ht * h * 0.3, wd * w, ht * h, 0, 0, Math.PI * 2);
    else {
      ctx.moveTo(cx - wd * w, mouthY - ht * h * 0.2);
      ctx.quadraticCurveTo(cx, mouthY - ht * h * 0.35, cx + wd * w, mouthY - ht * h * 0.2);
      ctx.quadraticCurveTo(cx + wd * w * 0.9, mouthY + ht * h * 1.4, cx, mouthY + ht * h * 1.3);
      ctx.quadraticCurveTo(cx - wd * w * 0.9, mouthY + ht * h * 1.4, cx - wd * w, mouthY - ht * h * 0.2);
    }
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    if (!rounded) {
      ctx.fillStyle = '#e8737a';
      ctx.beginPath();
      ctx.ellipse(cx, mouthY + ht * h * 0.95, wd * w * 0.5, ht * h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const L = cx - eyeDX;
  const R = cx + eyeDX;
  switch (expr) {
    case 'neutral':
      ovalEye(L), ovalEye(R), brows(0), smile(0.07, 0.03);
      break;
    case 'happy':
      ovalEye(L), ovalEye(R), brows(-0.2, 0.2), smile(0.12, 0.09);
      break;
    case 'laugh':
      arcEye(L, true), arcEye(R, true), brows(-0.3, 0.4), openMouth(0.12, 0.07, false);
      break;
    case 'surprised':
      roundEye(L), roundEye(R), brows(-0.1, 1.0), openMouth(0.05, 0.055, true);
      break;
    case 'angry':
      ovalEye(L, 0.75), ovalEye(R, 0.75), brows(1.3, -0.2, INK), smile(0.08, -0.06);
      break;
    case 'sad':
      ovalEye(L, 0.9, [0, 0.5]), ovalEye(R, 0.9, [0, 0.5]), brows(-1.2, 0.2), smile(0.08, -0.07);
      ctx.fillStyle = '#7cc3f0';
      ctx.beginPath();
      ctx.ellipse(R + er * 0.4, eyeY + er * 2.2, er * 0.45, er * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'scared':
      roundEye(L, 0.28), roundEye(R, 0.28), brows(-1.0, 0.9);
      stroke(() => {
        const n = 5;
        for (let i = 0; i <= n; i++) {
          const px = cx - w * 0.1 + (i / n) * w * 0.2;
          const py = mouthY + (i % 2 ? -1 : 1) * h * 0.014;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      });
      break;
    case 'sleepy':
      arcEye(L, false), arcEye(R, false), brows(-0.3, -0.2);
      openMouth(0.035, 0.035, true);
      break;
    case 'wink':
      ovalEye(L), arcEye(R, true), brows(-0.2, 0.25), smile(0.11, 0.08);
      break;
    case 'thinking':
      ovalEye(L, 1, [0.7, -0.8]), ovalEye(R, 1, [0.7, -0.8]);
      for (const [s, lift] of [[-1, 0.1], [1, 0.9]] as const) {
        const bx = cx + s * eyeDX;
        const by = eyeY - er * 2.3 - lift * er;
        stroke(() => {
          ctx.moveTo(bx - er, by);
          ctx.lineTo(bx + er, by - (s > 0 ? er * 0.3 : 0));
        }, lw * 1.25, f.brow);
      }
      stroke(() => {
        ctx.moveTo(cx - w * 0.06, mouthY + h * 0.01);
        ctx.lineTo(cx + w * 0.08, mouthY - h * 0.01);
      });
      break;
    case 'determined':
      ovalEye(L, 0.85), ovalEye(R, 0.85), brows(0.8, 0, f.brow);
      stroke(() => {
        ctx.moveTo(cx - w * 0.08, mouthY);
        ctx.quadraticCurveTo(cx + w * 0.02, mouthY + h * 0.012, cx + w * 0.09, mouthY - h * 0.02);
      });
      break;
    case 'love':
      heartEye(L), heartEye(R), brows(-0.3, 0.4), smile(0.12, 0.1);
      break;
    case 'blink':
      arcEye(L, false), arcEye(R, false), brows(0), smile(0.07, 0.03);
      break;
    case 'talk':
      ovalEye(L), ovalEye(R), brows(-0.1, 0.15), openMouth(0.06, 0.045, true);
      break;
  }
  // a small nose: a soft curve
  ctx.globalAlpha = 0.55;
  stroke(() => ctx.arc(cx, y + h * 0.66, w * 0.03, Math.PI * 0.15, Math.PI * 0.85), lw * 0.8, '#8a5a40');
  ctx.globalAlpha = 1;
  if (f.glasses) {
    for (const s of [-1, 1]) stroke(() => ctx.ellipse(cx + s * eyeDX, eyeY, er * 1.8, er * 1.7, 0, 0, Math.PI * 2), lw * 0.9, f.glasses);
    stroke(() => {
      ctx.moveTo(cx - eyeDX + er * 1.8, eyeY);
      ctx.lineTo(cx + eyeDX - er * 1.8, eyeY);
    }, lw * 0.9, f.glasses);
  }
  ctx.restore();
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
