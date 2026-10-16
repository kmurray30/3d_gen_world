import './styles.css';

// M0 placeholder: confirms the client bundle and the API are wired up. Replaced in M1.
const hud = document.getElementById('hud')!;
const banner = document.createElement('div');
banner.style.cssText = 'position:absolute;top:12px;left:12px;background:#fffdf7;border:3px solid #2b2b2b;border-radius:10px;padding:8px 12px;font-weight:700';
banner.textContent = 'Paper World: loading...';
hud.appendChild(banner);

fetch('/api/health')
  .then((r) => r.json())
  .then((h: { ok: boolean; sprites: number }) => {
    banner.textContent = `Paper World: server ok, ${h.sprites} sprites`;
  })
  .catch(() => {
    banner.textContent = 'Paper World: server unreachable';
  });
