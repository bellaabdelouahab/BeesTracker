// Map tile proxy with an on-disk cache.
// Browsers ask us for tiles; we ask OpenStreetMap once (with an identifying User-Agent and Referer, as its tile usage policy
// requires) and keep the result. If OpenStreetMap refuses us, Esri street tiles are served instead of an "access blocked" picture.
const fs = require('fs');
const path = require('path');

const root = path.join(path.dirname(process.env.DB_FILE || path.join(__dirname, '..', 'data', 'ibee.db')), 'tiles');
const SITE = process.env.PUBLIC_URL || 'https://ibee.abdelouahab.xyz';
const UA = `iBee hive monitor (+${SITE})`;
const OSM_TTL = 14 * 864e5;
const ESRI_TTL = 864e5;
const MAX_BYTES = 250 * 1024 * 1024;

// only the region the apiaries live in: keeps this from being a general purpose tile proxy
const inRegion = (z, x, y) => {
  const n = 2 ** z;
  const lon0 = (x / n) * 360 - 180;
  const lon1 = ((x + 1) / n) * 360 - 180;
  const lat = (t) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * t) / n))) * 180) / Math.PI;
  return lon1 > -18 && lon0 < 0 && lat(y) > 20 && lat(y + 1) < 37;
};

const fresh = (file, ttl) => { try { return Date.now() - fs.statSync(file).mtimeMs < ttl; } catch (e) { return false; } };
const save = (file, buf) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); };
const inflight = new Map();

const grab = async (url, headers) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(8000) });
  if (!r.ok || !(r.headers.get('content-type') || '').startsWith('image/')) throw new Error(`upstream ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
};

const load = async (z, x, y) => {
  const osm = path.join(root, 'osm', String(z), String(x), `${y}.png`);
  if (fresh(osm, OSM_TTL)) return { file: osm, type: 'image/png' };
  const esri = path.join(root, 'esri', String(z), String(x), `${y}.jpg`);
  if (fresh(esri, ESRI_TTL)) return { file: esri, type: 'image/jpeg' };
  try {
    save(osm, await grab(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, { Referer: `${SITE}/` }));
    return { file: osm, type: 'image/png' };
  } catch (e) {
    save(esri, await grab(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`, {}));
    return { file: esri, type: 'image/jpeg' };
  }
};

const hits = new Map(); // ip -> { n, reset }
const limited = (ip) => {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60000 }); return false; }
  h.n += 1;
  return h.n > 1200;
};

const handler = async (req, res) => {
  const z = Number(req.params.z), x = Number(req.params.x), y = Number(req.params.y);
  if (![z, x, y].every(Number.isInteger) || z < 3 || z > 19 || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) return res.status(400).end();
  if (!inRegion(z, x, y)) return res.status(404).end();
  if (limited(req.ip)) return res.status(429).end();
  const key = `${z}/${x}/${y}`;
  try {
    if (!inflight.has(key)) inflight.set(key, load(z, x, y).finally(() => inflight.delete(key)));
    const t = await inflight.get(key);
    res.set({ 'Content-Type': t.type, 'Cache-Control': 'public, max-age=604800' });
    res.sendFile(t.file);
  } catch (e) { res.status(502).end(); }
};

// delete expired tiles, then the oldest ones while the cache is over its size budget
const prune = () => {
  const files = [];
  const walk = (d) => { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { const s = fs.statSync(p); files.push({ p, t: s.mtimeMs, size: s.size }); } } };
  walk(root);
  let total = 0;
  files.sort((a, b) => b.t - a.t).forEach((f) => {
    total += f.size;
    if (Date.now() - f.t > OSM_TTL || total > MAX_BYTES) { try { fs.unlinkSync(f.p); } catch (e) { /* already gone */ } }
  });
};

module.exports = { handler, prune, inRegion };
