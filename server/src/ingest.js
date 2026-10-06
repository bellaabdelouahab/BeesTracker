// Single entry point for sensor data: store the reading, evaluate alert rules, broadcast to live clients.
const EventEmitter = require('events');
const db = require('./db');

const bus = new EventEmitter();
bus.setMaxListeners(0);

const RULES = {
  temp_high: { label: 'Temperature above limit', unit: '°C' },
  temp_low: { label: 'Temperature below limit', unit: '°C' },
  humidity_high: { label: 'Humidity above limit', unit: '%' },
  humidity_low: { label: 'Humidity below limit', unit: '%' },
  weight_high: { label: 'Weight above limit', unit: 'kg' },
  weight_low: { label: 'Weight below limit', unit: 'kg' },
  weight_drop: { label: 'Sudden weight loss', unit: 'kg' },
  swarm_risk: { label: 'Swarming signature', unit: 'Hz' },
  lid_open: { label: 'Lid open', unit: 'min' },
  battery_low: { label: 'Low battery', unit: 'V' },
  offline: { label: 'Hive offline', unit: 'min' },
};

const lidSince = new Map(); // hiveId -> timestamp of the first "open" reading of the current run

const round = (v, d = 1) => Number(Number(v).toFixed(d));

const evaluate = (hive, r, now, opts = {}) => {
  const out = {};
  const t = (type, severity, value, threshold) => { out[type] = { severity, value, threshold }; };
  if (hive.max_temperature != null && r.temperature > hive.max_temperature) t('temp_high', r.temperature > hive.max_temperature + 3 ? 'critical' : 'warning', r.temperature, hive.max_temperature);
  if (hive.min_temperature != null && r.temperature < hive.min_temperature) t('temp_low', r.temperature < hive.min_temperature - 4 ? 'critical' : 'warning', r.temperature, hive.min_temperature);
  if (hive.max_humidity != null && r.humidity > hive.max_humidity) t('humidity_high', 'warning', r.humidity, hive.max_humidity);
  if (hive.min_humidity != null && r.humidity < hive.min_humidity) t('humidity_low', 'warning', r.humidity, hive.min_humidity);
  if (hive.max_weight != null && r.weight > hive.max_weight) t('weight_high', 'warning', r.weight, hive.max_weight);
  if (hive.min_weight != null && r.weight < hive.min_weight) t('weight_low', 'warning', r.weight, hive.min_weight);
  if (r.battery < 3.5) t('battery_low', r.battery < 3.3 ? 'critical' : 'warning', r.battery, 3.5);
  if (r.sound > 340 && r.temperature > 35.2) t('swarm_risk', 'warning', r.sound, 340);
  if (r.lid === 1 && !opts.skipDb) {
    if (!lidSince.has(hive.id)) lidSince.set(hive.id, now);
    const mins = (now - lidSince.get(hive.id)) / 60000;
    if (mins >= 10) t('lid_open', 'warning', mins, 10);
  } else if (!opts.skipDb) lidSince.delete(hive.id);
  // weight change over the last 30 minutes
  if (opts.skipDb) return out;
  const past = db.prepare('SELECT weight FROM streams WHERE hive_id = ? AND created_at <= ? ORDER BY created_at DESC LIMIT 1').get(hive.id, now - 30 * 60000);
  if (past && past.weight - r.weight >= 1.5) t('weight_drop', 'critical', past.weight - r.weight, 1.5);
  return out;
};

const describe = (type, v) => {
  const u = RULES[type].unit;
  const n = type === 'swarm_risk' ? Math.round(v.value) : type === 'lid_open' ? Math.round(v.value) : round(v.value, type === 'battery_low' ? 2 : 1);
  const lim = type === 'battery_low' ? round(v.threshold, 2) : round(v.threshold, 1);
  if (type === 'weight_drop') return `${RULES[type].label}: ${n} kg lost in 30 min`;
  if (type === 'swarm_risk') return `${RULES[type].label}: hum at ${n} Hz with a hot brood nest`;
  if (type === 'lid_open') return `${RULES[type].label}: open for ${n} min`;
  return `${RULES[type].label}: ${n} ${u} (limit ${lim} ${u})`;
};

const hiveName = db.prepare('SELECT h.name, f.name AS farm FROM hives h JOIN farms f ON f.id = h.farm_id WHERE h.id = ?');
const openFor = db.prepare("SELECT * FROM notifications WHERE hive_id = ? AND status = 'open' AND type != 'offline'");
const insertNotif = db.prepare(`INSERT INTO notifications (hive_id, type, severity, content, user_room, value, threshold, unit, created_at, last_seen)
  VALUES (@hive_id, @type, @severity, @content, @user_room, @value, @threshold, @unit, @created_at, @last_seen)`);
const bump = db.prepare('UPDATE notifications SET count = count + 1, last_seen = ?, value = ?, severity = ?, content = ? WHERE id = ?');
const resolve = db.prepare("UPDATE notifications SET status = 'resolved', resolved_at = ? WHERE id = ?");

const syncNotifications = (hive, triggered, ts) => {
  const emit = [];
  const byType = Object.fromEntries(openFor.all(hive.id).map((n) => [n.type, n]));
  for (const [type, v] of Object.entries(triggered)) {
    const content = describe(type, v);
    if (byType[type]) bump.run(ts, v.value, v.severity, content, byType[type].id);
    else {
      const id = insertNotif.run({ hive_id: hive.id, type, severity: v.severity, content, user_room: `user-${hive.user_id || 1}`, value: v.value, threshold: v.threshold, unit: RULES[type].unit, created_at: ts, last_seen: ts }).lastInsertRowid;
      emit.push({ kind: 'new', notification: db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) });
    }
  }
  for (const [type, n] of Object.entries(byType)) {
    if (!triggered[type]) {
      resolve.run(ts, n.id);
      emit.push({ kind: 'resolved', notification: { ...n, status: 'resolved', resolved_at: ts } });
    }
  }
  return emit;
};

const insertStream = db.prepare(`INSERT INTO streams (hive_id, created_at, status, temperature, humidity, weight, lid, activity, sound, battery, rssi)
  VALUES (@hive_id, @created_at, @status, @temperature, @humidity, @weight, @lid, @activity, @sound, @battery, @rssi)`);
const setLast = db.prepare('UPDATE hives SET last_stream_id = ? WHERE id = ?');
const resolveOffline = db.prepare("SELECT id FROM notifications WHERE hive_id = ? AND type = 'offline' AND status = 'open'");

const FIELDS = ['temperature', 'humidity', 'weight', 'lid', 'activity', 'sound', 'battery', 'rssi'];

/** values: { temperature, humidity, weight, lid, activity, sound, battery, rssi } */
const ingestReading = ({ hiveId, values, createdAt = Date.now() }) => {
  const hive = db.prepare('SELECT * FROM hives WHERE id = ?').get(hiveId);
  if (!hive) throw Object.assign(new Error('Hive not found'), { status: 404 });
  const r = {};
  for (const k of FIELDS) {
    r[k] = Number(values[k]);
    if (!Number.isFinite(r[k])) throw Object.assign(new Error(`Missing or invalid ${k}`), { status: 400 });
  }
  r.lid = r.lid ? 1 : 0;
  const triggered = evaluate(hive, r, createdAt);
  const severities = Object.values(triggered).map((x) => x.severity);
  const status = severities.includes('critical') ? 2 : severities.length ? 1 : 0;
  const id = insertStream.run({ hive_id: hive.id, created_at: createdAt, status, ...r }).lastInsertRowid;
  setLast.run(id, hive.id);

  const events = [];
  const off = resolveOffline.get(hive.id);
  if (off) {
    resolve.run(createdAt, off.id);
    events.push({ kind: 'resolved', notification: { ...db.prepare('SELECT * FROM notifications WHERE id = ?').get(off.id) } });
  }
  events.push(...syncNotifications(hive, triggered, createdAt));

  const names = hiveName.get(hive.id);
  const payload = { id, hiveId: hive.id, hiveName: names.name, farmName: names.farm, createdAt, status, ...r };
  bus.emit('reading', payload);
  events.forEach((e) => bus.emit('notification', { ...e, hiveName: names.name, farmName: names.farm }));
  return payload;
};

module.exports = { bus, ingestReading, evaluate, describe, RULES, FIELDS, syncNotifications };
