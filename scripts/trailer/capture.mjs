import { chromium } from 'playwright';
import fs from 'fs';
const T = process.cwd();
const URL = process.argv[2];
const mode = process.argv[3]; // 'wide' | 'tall'
const save = fs.readFileSync(`${T}/save.json`, 'utf8');
const vp = mode === 'wide' ? { width: 1920, height: 1080 } : { width: 540, height: 960 };
const size = vp;
const ZOOM = mode === 'wide' ? 1.5 : 1;
const out = `${T}/raw-${mode}`; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const marks = {};
const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function scroll(page, dy, ms) {
  await page.evaluate(async ([dy, ms]) => {
    const y0 = window.scrollY, t0 = performance.now();
    await new Promise((res) => { const f = (t) => { const k = Math.min(1, (t - t0) / ms); const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2; window.scrollTo(0, y0 + dy * e); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  }, [dy, ms]);
}
const only = process.argv[4] ? process.argv[4].split(',') : null;
async function shot(name, tz, hash, act) {
  if (only && !only.includes(name)) return;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: tz, recordVideo: { dir: out, size } });
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('dragonvision.save.v1', s); localStorage.setItem('dragonvision.auto', '1'); localStorage.setItem('dragonvision.speed', '2'); sessionStorage.setItem('seeded', '1'); } document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.zoom = String(window.__zoom); }); }, save);
  await ctx.addInitScript((z) => { window.__zoom = z; }, ZOOM);
  const t0 = Date.now();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await page.goto(`${URL}/`);
  await page.waitForLoadState('networkidle');
  await page.evaluate((h) => { history.pushState(null, '', h); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); }, hash);
  await sleep(500);
  await sleep(700);
  marks[name] = (Date.now() - t0) / 1000;
  try { await act(page); } catch (e) { errors.push(`${name} action: ${e.message.split('\n')[0]}`); }
  marks[name + ':end'] = (Date.now() - t0) / 1000;
  const v = page.video();
  await ctx.close();
  fs.renameSync(await v.path(), `${out}/${name}.webm`);
}
const DAY = 'Europe/London', NIGHT = 'Asia/Tokyo';
await shot('home', DAY, '#/home', async (p) => { await sleep(800); await scroll(p, mode === 'wide' ? 500 : 700, 3200); await sleep(400); });
await shot('cityday', DAY, '#/city', async (p) => { await sleep(900); await scroll(p, mode === 'wide' ? 1500 : 2600, 5200); await sleep(300); });
await shot('citynight', NIGHT, '#/city', async (p) => { await sleep(2600); });
await shot('summon', DAY, '#/city/summon', async (p) => {
  await scroll(p, mode === 'wide' ? 260 : 520, 900);
  await p.getByRole('button', { name: /Summon ×10/ }).click(); await sleep(4200);
  await p.getByRole('button', { name: /Reveal all/i }).click({ timeout: 1500 }).catch(() => {}); await sleep(1800);
});
await shot('stages', DAY, '#/stages', async (p) => { await sleep(1200); await scroll(p, mode === 'wide' ? 300 : 500, 1600); await sleep(400);
  await p.locator('.map-node', { hasText: /^62$/ }).first().click(); await sleep(2200); });
await shot('wall', DAY, '#/stages', async (p) => {
  await p.locator('select[aria-label="Chapter"]').selectOption('5'); await sleep(900);
  await p.locator('.map-node', { hasText: /^50$/ }).first().click(); await sleep(2600); });
await shot('battle', DAY, '#/stages', async (p) => {
  await p.locator('.map-node', { hasText: /^62$/ }).first().click(); await sleep(400);
  await p.locator('.stage-sheet .btn.primary.big').first().click(); await sleep(11000); });
await shot('fighters', DAY, '#/fighters', async (p) => { await sleep(700); await scroll(p, mode === 'wide' ? 900 : 1500, 3600); await sleep(300); });
await shot('detail', DAY, '#/fighters/u1', async (p) => { await sleep(900); await scroll(p, mode === 'wide' ? 600 : 1000, 2600); await sleep(300); });
await shot('event', DAY, '#/city/event', async (p) => {
  await sleep(600); for (let i = 0; i < 3; i++) await p.getByRole('button', { name: /^skip$/i }).first().click({ timeout: 800 }).catch(() => {});
  await sleep(900); await scroll(p, mode === 'wide' ? 600 : 900, 2600); await sleep(300); });
await shot('tower', DAY, '#/city/tower', async (p) => { await sleep(900); await scroll(p, 300, 1500); await sleep(300); });
await shot('dungeon', NIGHT, '#/city/dungeon', async (p) => { await sleep(1800); });
await shot('raid', DAY, '#/city/raid', async (p) => { await sleep(1800); });
const prev = fs.existsSync(`${out}/marks.json`) ? JSON.parse(fs.readFileSync(`${out}/marks.json`, 'utf8')) : {};
fs.writeFileSync(`${out}/marks.json`, JSON.stringify({ ...prev, ...marks }, null, 1));
console.log(JSON.stringify(marks)); console.log('errors', errors);
await browser.close();
