// Self-feeding simulator: posts a reading for every hive through the same ingestion path real sensors use.
const db = require('./db');
const { ingestReading, bus } = require('./ingest');
const { sample, clamp, jit, DAY } = require('./sensorModel');
const log = (m) => console.log(`[simulator] ${m}`);

const state = {
  enabled: false,
  intervalSec: Number(process.env.SIM_INTERVAL_SEC) || 30,
  ambient: process.env.SIM_AMBIENT !== 'false',
  nextEventAt: Date.now() + 90 * 1000,
  sent: 0, startedAt: null, lastTick: null, scenarios: [],
};
const offsets = new Map(); // hiveId -> kg added or removed by past events (swarm, robbing, honey flow)
let timer = null; let dog = null; let pruner = null;

const SCENARIOS = {
  swarm: { label: 'Swarm', description: 'The colony splits: weight drops about 3 kg, the hum rises and the entrance gets crowded.' },
  robbing: { label: 'Robbing', description: 'Foreign bees steal honey: steady weight loss and frantic entrance traffic.' },
  honey_flow: { label: 'Honey flow', description: 'A strong nectar flow: weight climbs by about 2 kg per hour.' },
  heat: { label: 'Heat stress', description: 'Brood nest temperature goes above the safe limit and the air dries.' },
  cold: { label: 'Cold snap', description: 'Brood nest cools down: risk of chilled brood.' },
  lid_open: { label: 'Lid left open', description: 'The hive lid stays open and the nest loses heat.' },
  low_battery: { label: 'Low battery', description: 'The sensor battery voltage falls under the safe limit.' },
  offline: { label: 'Sensor offline', description: 'The hive stops transmitting.' },
};

const active = (hiveId, now) => state.scenarios.filter((s) => s.until > now && (s.hive == null || s.hive === hiveId));

function inject({ type, hive = null, minutes = 10 }) {
  if (!SCENARIOS[type]) throw new Error('Unknown scenario');
  const now = Date.now();
  const sc = { id: `${type}-${now}`, type, hive: hive ? Number(hive) : null, startedAt: now, until: now + minutes * 60000 };
  state.scenarios.push(sc);
  if (type === 'swarm') {
    const ids = sc.hive ? [sc.hive] : db.prepare('SELECT id FROM hives').all().map((h) => h.id);
    ids.forEach((id) => offsets.set(id, (offsets.get(id) || 0) - 3.2));
  }
  return sc;
}

const AMBIENT = ['heat', 'heat', 'cold', 'honey_flow', 'honey_flow', 'lid_open', 'low_battery', 'swarm', 'robbing', 'offline'];
const maybeAmbient = (hives, now) => {
  if (!state.ambient || now < state.nextEventAt || !hives.length) return;
  inject({ type: AMBIENT[Math.floor(Math.random() * AMBIENT.length)], hive: hives[Math.floor(Math.random() * hives.length)].id, minutes: 3 + Math.floor(Math.random() * 4) });
  state.nextEventAt = now + (6 + Math.random() * 8) * 60000;
};

const tick = () => {
  if (!state.enabled) return;
  const now = Date.now();
  state.scenarios = state.scenarios.filter((s) => s.until > now);
  state.lastTick = new Date();
  const hives = db.prepare('SELECT id, profile FROM hives ORDER BY id').all();
  maybeAmbient(hives, now);
  for (const h of hives) {
    try {
      const sc = active(h.id, now);
      if (sc.some((s) => s.type === 'offline')) continue;
      const r = sample(JSON.parse(h.profile), now);
      let off = offsets.get(h.id) || 0;
      for (const s of sc) {
        const f = clamp((now - s.startedAt) / 60000, 0.2, 1);
        switch (s.type) {
          case 'swarm': r.sound += 95 * f; r.activity = r.activity * 1.8 + 40; r.temperature += 1.2 * f; break;
          case 'robbing': off -= 0.25; r.activity = r.activity * 2 + 30; break;
          case 'honey_flow': off += 0.017; r.activity = r.activity * 1.4 + 10; break;
          case 'heat': r.temperature += 4.2 * f; r.humidity -= 14 * f; break;
          case 'cold': r.temperature -= 5 * f; break;
          case 'lid_open': r.lid = 1; r.temperature -= 3 * f; r.sound += 40; break;
          case 'low_battery': r.battery = 3.22 + jit(0.01); break;
          default: break;
        }
      }
      off = clamp(off, -6, 8) * 0.992; // past events slowly fade so the demo does not drift away
      offsets.set(h.id, off);
      r.weight = +(r.weight + off).toFixed(2);
      r.temperature = +r.temperature.toFixed(2);
      r.humidity = +clamp(r.humidity, 15, 98).toFixed(1);
      r.sound = Math.round(r.sound);
      r.activity = Math.max(0, Math.round(r.activity));
      ingestReading({ hiveId: h.id, values: r });
      state.sent += 1;
    } catch (e) { log(`hive ${h.id}: ${e.message}`); }
  }
};

const offlineLimit = () => (Number(process.env.OFFLINE_MIN) || (state.enabled ? 3 : 90)) * 60000;

const watchdog = () => {
  try {
    const now = Date.now();
    const rows = db.prepare('SELECT h.id, h.name, h.user_id, f.name AS farm, s.created_at AS last FROM hives h JOIN farms f ON f.id = h.farm_id LEFT JOIN streams s ON s.id = h.last_stream_id').all();
    for (const h of rows) {
      if (h.last && now - h.last <= offlineLimit()) continue;
      const mins = h.last ? Math.round((now - h.last) / 60000) : 0;
      const open = db.prepare("SELECT id FROM notifications WHERE hive_id = ? AND type = 'offline' AND status = 'open'").get(h.id);
      if (open) { db.prepare('UPDATE notifications SET last_seen = ?, count = count + 1, value = ? WHERE id = ?').run(now, mins, open.id); continue; }
      const id = db.prepare(`INSERT INTO notifications (hive_id, type, severity, content, user_room, value, threshold, unit, created_at, last_seen)
        VALUES (?, 'offline', 'critical', ?, ?, ?, ?, 'min', ?, ?)`).run(h.id, `Hive offline: no data for ${mins} min`, `user-${h.user_id || 1}`, mins, offlineLimit() / 60000, now, now).lastInsertRowid;
      bus.emit('notification', { kind: 'new', notification: db.prepare('SELECT * FROM notifications WHERE id = ?').get(id), hiveName: h.name, farmName: h.farm });
    }
  } catch (e) { log(`watchdog: ${e.message}`); }
};

const prune = () => {
  db.prepare('DELETE FROM streams WHERE created_at < ?').run(Date.now() - 15 * DAY);
  db.prepare("DELETE FROM notifications WHERE status = 'resolved' AND resolved_at < ?").run(Date.now() - 45 * DAY);
};

const start = () => { state.enabled = true; state.startedAt = state.startedAt || new Date(); clearInterval(timer); timer = setInterval(tick, state.intervalSec * 1000); tick(); };
const stop = () => { state.enabled = false; clearInterval(timer); timer = null; };
const startBackground = () => { if (!dog) dog = setInterval(watchdog, 30000); if (!pruner) { pruner = setInterval(prune, 3600e3); prune(); } };
const setAmbient = (on) => { state.ambient = !!on; if (on) state.nextEventAt = Date.now() + 30000; };
const clear = (id) => { state.scenarios = id ? state.scenarios.filter((s) => s.id !== id) : []; };
const status = () => ({
  enabled: state.enabled, intervalSec: state.intervalSec, ambient: state.ambient, sent: state.sent, startedAt: state.startedAt, lastTick: state.lastTick,
  scenarios: state.scenarios.filter((s) => s.until > Date.now()),
  catalog: Object.entries(SCENARIOS).map(([id, v]) => ({ id, ...v })),
});

module.exports = { start, stop, startBackground, setAmbient, inject, clear, status, offlineLimit, SCENARIOS };
