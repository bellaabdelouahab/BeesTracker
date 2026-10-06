// Demo content: users, apiaries, hives, two weeks of sensor history and the alerts that history would have raised.
const bcrypt = require('bcryptjs');
const db = require('./db');
const { sample, DAY } = require('./sensorModel');
const { evaluate, describe, RULES } = require('./ingest');

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

const FARMS = [
  { name: 'Rucher Taroudant', adress: 'Taroudant, Souss-Massa', lat: 30.4727, lng: -8.8749, altitude: 260,
    description: 'Orange blossom and thyme on the Souss plain.', image: U('1558642452-9d2a7deb7f62'), hives: 5 },
  { name: 'Rucher Aoulouz', adress: 'Aoulouz, Taroudant Province', lat: 30.6803, lng: -8.1647, altitude: 760,
    description: 'Thyme and carob in the High Atlas foothills.', image: U('1473973266408-ed4e27abdd47'), hives: 5 },
  { name: 'Rucher Imouzzer', adress: 'Imouzzer Ida Outanane, Agadir', lat: 30.7167, lng: -9.2167, altitude: 1250,
    description: 'Euphorbia and thyme at altitude, cooler nights.', image: U('1500382017468-9049fed747ef'), hives: 4 },
  { name: 'Rucher Ait Baha', adress: 'Ait Baha, Chtouka Ait Baha', lat: 30.0833, lng: -9.15, altitude: 900,
    description: 'Argan forest on dry terrain, long foraging distances.', image: U('1470071459604-3b5ec3a7fe05'), hives: 4 },
];

const BREEDS = ['Apis mellifera intermissa', 'Apis mellifera intermissa', 'Carniolan cross', 'Buckfast'];
const NOTES = [
  ['Queen seen, solid brood on 7 frames. Second super added.', 'Strong', 'Calm'],
  ['Good stores, no queen cells. Cleaned the bottom board.', 'Good', 'Calm'],
  ['Two queen cells capped on frame 4: swarm preparation. Split planned.', 'Strong', 'Nervous'],
  ['Brood pattern spotty, queen not seen. Re-check next week.', 'Fair', 'Calm'],
  ['Light on stores. Feeding syrup 1:1 for ten days.', 'Low', 'Calm'],
  ['Honey flow started, super half capped.', 'Strong', 'Calm'],
];

// deterministic pseudo random so the same demo is rebuilt after a reset
let s = 7;
const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

const makeProfile = (i, weak, queenless) => ({
  seed: i * 1.7,
  tempBase: weak ? 32.6 : 34.2 + rand() * 0.9,
  tempAmp: weak ? 1.7 : 0.35 + rand() * 0.25,
  humBase: 56 + rand() * 12,
  weightBase: 26 + rand() * 24,
  flow: (rand() - 0.35) * 1.6,
  peakActivity: queenless ? 70 : 110 + rand() * 150,
  soundBase: queenless ? 305 : 232 + rand() * 18,
  battBase: 3.66 + rand() * 0.12,
  rssi: -82 - rand() * 18,
});

// events that happened in the past, so alerts and charts have a story
const HISTORY = [
  { hive: 3, daysAgo: 3.1, hour: 14.2, type: 'swarm' },
  { hive: 8, daysAgo: 5.4, hour: 11.5, type: 'robbing' },
  { hive: 12, daysAgo: 1.6, hour: 13.0, type: 'heat', hours: 3 },
  { hive: 15, daysAgo: 2.4, hour: 20.0, type: 'cold', hours: 4 },
];

const applyHistory = (hiveIdx, t, r) => {
  for (const e of HISTORY) {
    if (e.hive !== hiveIdx) continue;
    const t0 = Date.now() - e.daysAgo * DAY;
    const dt = t - t0;
    if (dt < 0) continue;
    if (e.type === 'swarm') {
      const f = Math.max(0, 1 - dt / (2 * DAY));
      r.weight = +(r.weight - 3.4 * f).toFixed(2);
      if (dt < 3 * 3600e3) { r.sound += 90; r.activity = Math.round(r.activity * 1.9 + 40); r.temperature += 1.2; }
    }
    if (e.type === 'robbing') {
      const f = Math.max(0, 1 - dt / (1.5 * DAY));
      r.weight = +(r.weight - 2.1 * f).toFixed(2);
      if (dt < 2 * 3600e3) r.activity = Math.round(r.activity * 2.2 + 30);
    }
    if (e.type === 'heat' && dt < e.hours * 3600e3) { r.temperature = +(r.temperature + 3.6).toFixed(2); r.humidity = Math.max(25, r.humidity - 12); }
    if (e.type === 'cold' && dt < e.hours * 3600e3) { r.temperature = +(r.temperature - 4.4).toFixed(2); }
  }
  return r;
};

const ensureUsers = (password) => {
  if (!password) return;
  // once an administrator exists (whatever its email), demo accounts are never recreated
  if (db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) return;
  const add = db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
  const hash = bcrypt.hashSync(password, 10);
  add.run('Administrator', (process.env.ADMIN_EMAIL || 'admin@ibee.abdelouahab.xyz').toLowerCase(), hash, 'admin', Date.now());
  add.run('Youssef Amrani', 'youssef@ibee.demo', hash, 'keeper', Date.now());
};

const reset = () => {
  db.exec('DELETE FROM inspections; DELETE FROM notifications; DELETE FROM streams; DELETE FROM hives; DELETE FROM farms;');
  const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  const owner = admin ? admin.id : null;
  const addFarm = db.prepare('INSERT INTO farms (name, adress, description, lat, lng, altitude, image, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const addHive = db.prepare(`INSERT INTO hives (name, farm_id, user_id, lat, lng, breed, queen_year, supers, min_temperature, max_temperature, min_humidity, max_humidity, min_weight, max_weight, profile, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 31.5, 36.5, 40, 80, 12, 62, ?, ?)`);
  let n = 0;
  const hives = [];
  FARMS.forEach((f, fi) => {
    const farmId = addFarm.run(f.name, f.adress, f.description, f.lat, f.lng, f.altitude, f.image, owner).lastInsertRowid;
    for (let k = 0; k < f.hives; k++) {
      n += 1;
      const weak = n === 14;
      const queenless = n === 6;
      const profile = makeProfile(n, weak, queenless);
      const row = k % 3; const col = Math.floor(k / 3);
      const lat = f.lat + 0.0006 * (row - 1) + (fi % 2 ? 0.0002 : 0);
      const lng = f.lng + 0.0007 * col - 0.0005;
      const id = addHive.run(`R${n}`, farmId, owner, lat, lng, BREEDS[n % BREEDS.length], 2021 + (n % 4), 1 + (n % 3), JSON.stringify(profile), Date.now()).lastInsertRowid;
      hives.push({ id, index: n, profile, row: db.prepare('SELECT * FROM hives WHERE id = ?').get(id) });
    }
  });
  // inspection log
  const addInsp = db.prepare('INSERT INTO inspections (hive_id, author, date, queen_seen, brood, stores, temper, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  hives.forEach((h, i) => {
    if (i % 2) return;
    const [notes, stores, temper] = NOTES[i % NOTES.length];
    const date = Date.now() - (2 + (i * 3) % 18) * DAY;
    addInsp.run(h.id, 'Youssef Amrani', date, i % 4 === 3 ? 0 : 1, i % 4 === 3 ? 'Spotty' : 'Solid', stores, temper, notes, date);
  });
  return hives;
};

const backfill = (hives, from, to, stepMin) => {
  const insert = db.prepare(`INSERT INTO streams (hive_id, created_at, status, temperature, humidity, weight, lid, activity, sound, battery, rssi)
    VALUES (@hive_id, @created_at, @status, @temperature, @humidity, @weight, @lid, @activity, @sound, @battery, @rssi)`);
  const addNotif = db.prepare(`INSERT INTO notifications (hive_id, type, severity, content, user_room, value, threshold, unit, status, read, count, created_at, last_seen, resolved_at)
    VALUES (@hive_id, @type, @severity, @content, @user_room, @value, @threshold, @unit, @status, @read, @count, @created_at, @last_seen, @resolved_at)`);
  const episodes = {};
  const finished = [];
  let readings = 0;
  const run = db.transaction(() => {
    for (const h of hives) {
      let last = null;
      let prev = [];
      for (let t = from; t <= to; t += stepMin * 60000) {
        const r = applyHistory(h.index, t, sample(h.profile, t));
        // weight 30 minutes ago comes from the same synthetic series, evaluate() would query the table
        const trig = evaluateSynthetic(h.row, r, t, prev);
        prev.push({ t, weight: r.weight }); if (prev.length > 4) prev.shift();
        const sev = Object.values(trig).map((x) => x.severity);
        const status = sev.includes('critical') ? 2 : sev.length ? 1 : 0;
        const id = insert.run({ hive_id: h.id, created_at: t, status, ...r }).lastInsertRowid;
        last = id; readings += 1;
        for (const type of Object.keys(RULES)) {
          if (type === 'offline') continue;
          const key = `${h.id}:${type}`;
          const ep = episodes[key];
          if (trig[type]) {
            if (ep) { ep.count += 1; ep.last = t; ep.value = trig[type].value; if (trig[type].severity === 'critical') ep.severity = 'critical'; }
            else episodes[key] = { hive: h, type, severity: trig[type].severity, value: trig[type].value, threshold: trig[type].threshold, count: 1, first: t, last: t };
          } else if (ep) { finished.push({ ...ep, resolved: t }); delete episodes[key]; }
        }
      }
      db.prepare('UPDATE hives SET last_stream_id = ? WHERE id = ?').run(last, h.id);
    }
    const toRow = (e, status, resolved) => ({ hive_id: e.hive.id, type: e.type, severity: e.severity, content: describe(e.type, e), user_room: `user-${e.hive.row.user_id || 1}`,
      value: e.value, threshold: e.threshold, unit: RULES[e.type].unit, status, read: status === 'resolved' ? 1 : 0, count: e.count, created_at: e.first, last_seen: e.last, resolved_at: resolved || null });
    finished.filter((e) => e.count >= 2).forEach((e) => addNotif.run(toRow(e, 'resolved', e.resolved)));
    Object.values(episodes).forEach((e) => addNotif.run(toRow(e, 'open')));
  });
  run();
  return { readings, alerts: finished.filter((e) => e.count >= 2).length + Object.keys(episodes).length };
};

// same rules as live ingestion, with the 30 minute weight lookup served from the in-memory window
const evaluateSynthetic = (hive, r, t, prev) => {
  const out = evaluate({ ...hive, id: -hive.id }, r, t, { skipDb: true });
  const ref = prev.find((p) => p.t <= t - 30 * 60000) || null;
  if (ref && ref.weight - r.weight >= 1.5) out.weight_drop = { severity: 'critical', value: ref.weight - r.weight, threshold: 1.5 };
  return out;
};

const seed = ({ password, days = 14 } = {}) => {
  ensureUsers(password);
  const hives = reset();
  const now = Date.now();
  return backfill(hives, now - days * DAY, now, 30);
};

const bootstrap = ({ password }) => {
  ensureUsers(password);
  const farms = db.prepare('SELECT COUNT(*) c FROM farms').get().c;
  if (!farms) return { created: seed({ password }) };
  const last = db.prepare('SELECT MAX(created_at) t FROM streams').get().t;
  if (!last || Date.now() - last > 12 * DAY) return { rebuilt: seed({ password }) };
  if (Date.now() - last > 5 * 60000) {
    const hives = db.prepare('SELECT * FROM hives').all().map((row) => ({ id: row.id, index: row.id, profile: JSON.parse(row.profile), row }));
    return { gapFilled: backfill(hives, last + 30 * 60000, Date.now(), 30) };
  }
  return {};
};

module.exports = { FARMS, seed, bootstrap };
