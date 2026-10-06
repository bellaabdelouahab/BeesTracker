const express = require('express');
const db = require('./db');
const auth = require('./auth');
const simulator = require('./simulator');
const { ingestReading, RULES } = require('./ingest');

const router = express.Router();
const DAY = 864e5;
const r1 = (v, d = 1) => (v == null ? null : Number(Number(v).toFixed(d)));
const bad = (res, code, message) => res.status(code).json({ message });

const RANGES = { '1h': [3600e3, 60e3], '6h': [6 * 3600e3, 5 * 60e3], '24h': [DAY, 15 * 60e3], '3d': [3 * DAY, 30 * 60e3], '7d': [7 * DAY, 3600e3], '14d': [14 * DAY, 2 * 3600e3] };

// ---------------------------------------------------------------- shared builders
const LAST_COLS = 's.created_at AS s_at, s.status AS s_status, s.temperature, s.humidity, s.weight, s.lid, s.activity, s.sound, s.battery, s.rssi';

const shapeHive = (row, openByHive) => {
  const open = openByHive[row.id] || [];
  const stale = !row.s_at || Date.now() - row.s_at > simulator.offlineLimit();
  const status = stale ? 'offline' : open.some((n) => n.severity === 'critical') ? 'critical' : open.length ? 'warning' : 'online';
  return {
    id: row.id, name: row.name, farmId: row.farm_id, farmName: row.farm_name, lat: row.lat, lng: row.lng,
    breed: row.breed, queenYear: row.queen_year, supers: row.supers, status, openAlerts: open.length,
    thresholds: { minTemperature: row.min_temperature, maxTemperature: row.max_temperature, minHumidity: row.min_humidity, maxHumidity: row.max_humidity, minWeight: row.min_weight, maxWeight: row.max_weight },
    last: row.s_at ? { createdAt: row.s_at, status: row.s_status, temperature: row.temperature, humidity: row.humidity, weight: row.weight, lid: row.lid, activity: row.activity, sound: row.sound, battery: row.battery, rssi: row.rssi } : null,
  };
};

const openAlerts = () => {
  const out = {};
  db.prepare("SELECT * FROM notifications WHERE status = 'open'").all().forEach((n) => { (out[n.hive_id] = out[n.hive_id] || []).push(n); });
  return out;
};

const allHives = (where = '', args = []) => {
  const open = openAlerts();
  return db.prepare(`SELECT h.*, f.name AS farm_name, ${LAST_COLS} FROM hives h JOIN farms f ON f.id = h.farm_id LEFT JOIN streams s ON s.id = h.last_stream_id ${where} ORDER BY h.id`)
    .all(...args).map((row) => shapeHive(row, open));
};

const stats = (since, ids) => {
  const marks = ids.map(() => '?').join(',');
  const rows = db.prepare(`SELECT hive_id, COUNT(*) AS n, MIN(temperature) AS tmin, MAX(temperature) AS tmax, AVG(temperature) AS tavg, MIN(humidity) AS hmin, MAX(humidity) AS hmax, AVG(humidity) AS havg,
      MIN(weight) AS wmin, MAX(weight) AS wmax, AVG(activity) AS aavg, MAX(activity) AS amax, AVG(sound) AS savg,
      (SELECT weight FROM streams x WHERE x.hive_id = s.hive_id AND x.created_at >= ? ORDER BY x.created_at ASC LIMIT 1) AS w0,
      (SELECT weight FROM streams x WHERE x.hive_id = s.hive_id ORDER BY x.created_at DESC LIMIT 1) AS w1
    FROM streams s WHERE s.created_at >= ? AND s.hive_id IN (${marks}) GROUP BY s.hive_id`).all(since, since, ...ids);
  const out = {};
  rows.forEach((x) => {
    out[x.hive_id] = {
      readings: x.n,
      temperature: { min: r1(x.tmin, 2), max: r1(x.tmax, 2), avg: r1(x.tavg, 2) }, humidity: { min: r1(x.hmin), max: r1(x.hmax), avg: r1(x.havg) },
      weight: { min: r1(x.wmin, 2), max: r1(x.wmax, 2), delta: r1(x.w1 - x.w0, 2) },
      activity: { avg: r1(x.aavg, 0), max: x.amax }, sound: { avg: r1(x.savg, 0) },
    };
  });
  return out;
};

const lastInspection = db.prepare('SELECT date FROM inspections WHERE hive_id = ? ORDER BY date DESC LIMIT 1');

const insightsFor = (hive, st) => {
  const out = [];
  const l = hive.last;
  if (!l || hive.status === 'offline') return [{ level: 'warn', title: 'No live data', text: 'The sensor has not reported recently. Check the battery and radio coverage.' }];
  if (l.temperature < 32.5) out.push({ level: 'warn', title: 'Cold brood nest', text: `${l.temperature.toFixed(1)} °C is low for brood rearing. The colony may be small or broodless.` });
  else if (l.temperature >= 33 && l.temperature <= 36) out.push({ level: 'good', title: 'Brood nest regulated', text: `${l.temperature.toFixed(1)} °C sits inside the 33-36 °C brood range.` });
  if (st) {
    if (st.weight.delta > 0.4) out.push({ level: 'good', title: 'Honey flow', text: `+${st.weight.delta.toFixed(1)} kg in the last 24 hours.` });
    else if (st.weight.delta < -0.6) out.push({ level: 'warn', title: 'Losing weight', text: `${st.weight.delta.toFixed(1)} kg in 24 hours. Check stores, robbing or a swarm.` });
    if (st.sound.avg > 292 && st.activity.avg < 45) out.push({ level: 'warn', title: 'Queenless signature', text: 'A high, steady hum with low entrance traffic often means the colony has lost its queen.' });
  }
  if (l.sound > 330) out.push({ level: 'warn', title: 'Swarm preparation', text: `The hum has risen to ${l.sound} Hz. Look for queen cells.` });
  if (l.humidity > 75 && l.temperature < 33.5) out.push({ level: 'info', title: 'Condensation risk', text: 'High humidity with a cool nest. Check ventilation.' });
  if (l.battery < 3.55) out.push({ level: 'warn', title: 'Weak battery', text: `${l.battery.toFixed(2)} V. Clean the solar cell or replace the battery.` });
  const insp = lastInspection.get(hive.id);
  const days = insp ? Math.round((Date.now() - insp.date) / DAY) : null;
  if (days == null) out.push({ level: 'info', title: 'No inspection logged', text: 'Add the first inspection from the Log tab.' });
  else if (days > 21) out.push({ level: 'info', title: 'Inspection overdue', text: `Last inspection ${days} days ago.` });
  return out.slice(0, 5);
};

const shapeNotification = (n) => ({
  id: n.id, hiveId: n.hive_id, hiveName: n.hive_name, farmName: n.farm_name, type: n.type, label: RULES[n.type] ? RULES[n.type].label : n.type,
  severity: n.severity, content: n.content, value: n.value, threshold: n.threshold, unit: n.unit, status: n.status, read: !!n.read, count: n.count,
  createdAt: n.created_at, lastSeen: n.last_seen, resolvedAt: n.resolved_at,
});
const NOTIF_SQL = 'SELECT n.*, h.name AS hive_name, f.name AS farm_name FROM notifications n JOIN hives h ON h.id = n.hive_id JOIN farms f ON f.id = h.farm_id';

// ---------------------------------------------------------------- public
router.post('/auth/login', auth.login);
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Sensor gateway endpoint (the "sensoring" service of the original architecture). Optional shared secret.
router.post('/ingest', (req, res) => {
  if (process.env.DEVICE_API_KEY && req.headers['x-api-key'] !== process.env.DEVICE_API_KEY) return bad(res, 401, 'Invalid API key');
  const b = req.body || {};
  const hive = b.hiveId ? db.prepare('SELECT id FROM hives WHERE id = ?').get(Number(b.hiveId)) : db.prepare('SELECT id FROM hives WHERE name = ?').get(String(b.hive || ''));
  if (!hive) return bad(res, 404, 'Unknown hive (send hiveId or hive name)');
  try {
    const p = ingestReading({ hiveId: hive.id, values: { lid: 0, activity: 0, sound: 0, battery: 3.8, rssi: -90, ...b }, createdAt: b.timestamp ? new Date(b.timestamp).getTime() : Date.now() });
    res.status(201).json({ id: p.id, status: p.status });
  } catch (e) { bad(res, e.status || 500, e.message); }
});

// ---------------------------------------------------------------- authenticated
router.use(auth.protect);
router.get('/auth/me', (req, res) => res.json({ user: auth.publicUser(req.user) }));

router.get('/overview', (req, res) => {
  const hives = allHives();
  const farms = db.prepare('SELECT * FROM farms ORDER BY id').all();
  const st = stats(Date.now() - DAY, hives.map((h) => h.id));
  const live = hives.filter((h) => h.last && h.status !== 'offline');
  const avg = (k) => (live.length ? r1(live.reduce((a, h) => a + h.last[k], 0) / live.length, 1) : null);
  const now = Date.now();
  const spark = {};
  db.prepare(`SELECT hive_id, CAST(created_at / 3600000 AS INTEGER) * 3600000 AS t, AVG(weight) AS w FROM streams WHERE created_at >= ? GROUP BY hive_id, t ORDER BY t`).all(now - DAY).forEach((x) => { (spark[x.hive_id] = spark[x.hive_id] || []).push(r1(x.w, 2)); });
  const farmOut = farms.map((f) => {
    const hs = hives.filter((h) => h.farmId === f.id).map((h) => ({ ...h, stats: st[h.id] || null, spark: spark[h.id] || [] }));
    const worst = hs.reduce((w, h) => ({ critical: 3, offline: 3, warning: 2, online: 1 }[h.status] > { critical: 3, offline: 3, warning: 2, online: 1 }[w] ? h.status : w), 'online');
    const lv = hs.filter((h) => h.last && h.status !== 'offline');
    return { id: f.id, name: f.name, adress: f.adress, description: f.description, lat: f.lat, lng: f.lng, altitude: f.altitude, image: f.image, status: hs.length ? worst : 'offline',
      hives: hs, avgTemp: lv.length ? r1(lv.reduce((a, h) => a + h.last.temperature, 0) / lv.length, 1) : null, totalWeight: r1(lv.reduce((a, h) => a + h.last.weight, 0), 1),
      weightDelta: r1(hs.reduce((a, h) => a + (h.stats ? h.stats.weight.delta : 0), 0), 1), openAlerts: hs.reduce((a, h) => a + h.openAlerts, 0) };
  });
  const open = db.prepare("SELECT severity, COUNT(*) c FROM notifications WHERE status = 'open' GROUP BY severity").all();
  const perMin = db.prepare('SELECT COUNT(*) c FROM streams WHERE created_at >= ?').get(now - 5 * 60000).c / 5;
  const best = [...hives].filter((h) => st[h.id]).sort((a, b) => st[b.id].weight.delta - st[a.id].weight.delta)[0];
  res.json({
    kpis: {
      apiaries: farms.length, hives: hives.length, hivesOnline: hives.filter((h) => h.status !== 'offline').length, hivesOffline: hives.filter((h) => h.status === 'offline').length,
      alertsCritical: (open.find((x) => x.severity === 'critical') || {}).c || 0, alertsWarning: (open.find((x) => x.severity === 'warning') || {}).c || 0,
      avgTemp: avg('temperature'), avgHum: avg('humidity'), totalWeight: r1(live.reduce((a, h) => a + h.last.weight, 0), 1),
      weightDelta: r1(Object.values(st).reduce((a, x) => a + x.weight.delta, 0), 1), activity: live.length ? Math.round(live.reduce((a, h) => a + h.last.activity, 0) / live.length) : 0,
      readingsPerMin: r1(perMin, 1), bestHive: best ? { id: best.id, name: best.name, delta: st[best.id].weight.delta } : null,
    },
    farms: farmOut,
    notifications: db.prepare(`${NOTIF_SQL} ORDER BY CASE n.status WHEN 'open' THEN 0 ELSE 1 END, n.last_seen DESC LIMIT 8`).all().map(shapeNotification),
    simulator: simulator.status().enabled,
    serverTime: Date.now(),
  });
});

router.get('/hives', (req, res) => {
  const hives = allHives();
  const st = stats(Date.now() - DAY, hives.map((h) => h.id));
  res.json(hives.map((h) => ({ ...h, stats: st[h.id] || null })));
});

router.get('/hives/:id', (req, res) => {
  const [hive] = allHives('WHERE h.id = ?', [Number(req.params.id)]);
  if (!hive) return bad(res, 404, 'Hive not found');
  const st = stats(Date.now() - DAY, [hive.id])[hive.id] || null;
  const week = stats(Date.now() - 7 * DAY, [hive.id])[hive.id] || null;
  const farm = db.prepare('SELECT id, name, adress, lat, lng FROM farms WHERE id = ?').get(hive.farmId);
  const alerts = db.prepare(`${NOTIF_SQL} WHERE n.hive_id = ? ORDER BY n.last_seen DESC LIMIT 12`).all(hive.id).map(shapeNotification);
  res.json({ ...hive, farm, stats: st, week, insights: insightsFor(hive, st), alerts });
});

router.patch('/hives/:id', (req, res) => {
  const b = req.body || {};
  const map = { minTemperature: 'min_temperature', maxTemperature: 'max_temperature', minHumidity: 'min_humidity', maxHumidity: 'max_humidity', minWeight: 'min_weight', maxWeight: 'max_weight' };
  const sets = []; const args = [];
  for (const [k, col] of Object.entries(map)) if (b[k] !== undefined) { const v = Number(b[k]); if (!Number.isFinite(v)) return bad(res, 400, `${k} must be a number`); sets.push(`${col} = ?`); args.push(v); }
  if (b.name) { sets.push('name = ?'); args.push(String(b.name).slice(0, 40)); }
  if (!sets.length) return bad(res, 400, 'Nothing to update');
  const r = db.prepare(`UPDATE hives SET ${sets.join(', ')} WHERE id = ?`).run(...args, Number(req.params.id));
  if (!r.changes) return bad(res, 404, 'Hive not found');
  res.json({ ok: true });
});

router.get('/hives/:id/streams', (req, res) => {
  const [span, bin] = RANGES[req.query.range] || RANGES['24h'];
  const rows = db.prepare(`SELECT CAST(created_at / ? AS INTEGER) * ? AS t, COUNT(*) AS n,
      AVG(temperature) AS temperature, MIN(temperature) AS temperatureMin, MAX(temperature) AS temperatureMax,
      AVG(humidity) AS humidity, MIN(humidity) AS humidityMin, MAX(humidity) AS humidityMax,
      AVG(weight) AS weight, MIN(weight) AS weightMin, MAX(weight) AS weightMax,
      AVG(activity) AS activity, AVG(sound) AS sound, AVG(battery) AS battery
    FROM streams WHERE hive_id = ? AND created_at >= ? GROUP BY t ORDER BY t`).all(bin, bin, Number(req.params.id), Date.now() - span);
  res.json({ range: req.query.range || '24h', binMs: bin, points: rows.map((x) => ({ ...x, temperature: r1(x.temperature, 2), temperatureMin: r1(x.temperatureMin, 2), temperatureMax: r1(x.temperatureMax, 2),
    humidity: r1(x.humidity), humidityMin: r1(x.humidityMin), humidityMax: r1(x.humidityMax), weight: r1(x.weight, 2), weightMin: r1(x.weightMin, 2), weightMax: r1(x.weightMax, 2),
    activity: Math.round(x.activity), sound: Math.round(x.sound), battery: r1(x.battery, 2) })) });
});

router.get('/hives/:id/readings', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 200);
  res.json(db.prepare('SELECT * FROM streams WHERE hive_id = ? ORDER BY created_at DESC LIMIT ?').all(Number(req.params.id), limit)
    .map((s) => ({ id: s.id, createdAt: s.created_at, status: s.status, temperature: s.temperature, humidity: s.humidity, weight: s.weight, lid: s.lid, activity: s.activity, sound: s.sound, battery: s.battery, rssi: s.rssi })));
});

router.get('/hives/:id/inspections', (req, res) => {
  res.json(db.prepare('SELECT id, author, date, queen_seen AS queenSeen, brood, stores, temper, notes FROM inspections WHERE hive_id = ? ORDER BY date DESC LIMIT 50').all(Number(req.params.id)));
});
router.post('/hives/:id/inspections', (req, res) => {
  const b = req.body || {};
  if (!db.prepare('SELECT id FROM hives WHERE id = ?').get(Number(req.params.id))) return bad(res, 404, 'Hive not found');
  if (!String(b.notes || '').trim()) return bad(res, 400, 'Add a note');
  const date = b.date ? new Date(b.date).getTime() : Date.now();
  const id = db.prepare('INSERT INTO inspections (hive_id, author, date, queen_seen, brood, stores, temper, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(Number(req.params.id), req.user.name, date, b.queenSeen ? 1 : 0, String(b.brood || '').slice(0, 30), String(b.stores || '').slice(0, 30), String(b.temper || '').slice(0, 30), String(b.notes).slice(0, 1000), Date.now()).lastInsertRowid;
  res.status(201).json({ id });
});

router.get('/farms/:id', (req, res) => {
  const f = db.prepare('SELECT * FROM farms WHERE id = ?').get(Number(req.params.id));
  if (!f) return bad(res, 404, 'Apiary not found');
  const hives = allHives('WHERE h.farm_id = ?', [f.id]);
  res.json({ ...f, hives });
});

router.get('/notifications', (req, res) => {
  const { status = 'active', severity, hive, type } = req.query;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const where = []; const args = [];
  if (status === 'active') where.push("n.status = 'open'"); else if (status === 'resolved') where.push("n.status = 'resolved'");
  if (severity) { where.push('n.severity = ?'); args.push(severity); }
  if (hive) { where.push('n.hive_id = ?'); args.push(Number(hive)); }
  if (type) { where.push('n.type = ?'); args.push(type); }
  const w = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM notifications n${w}`).get(...args).c;
  const items = db.prepare(`${NOTIF_SQL}${w} ORDER BY n.last_seen DESC LIMIT ? OFFSET ?`).all(...args, limit, (page - 1) * limit).map(shapeNotification);
  const by = (col, cond = '') => Object.fromEntries(db.prepare(`SELECT ${col} k, COUNT(*) c FROM notifications ${cond} GROUP BY ${col}`).all().map((x) => [x.k, x.c]));
  res.json({ total, page, pages: Math.ceil(total / limit), items, summary: { bySeverity: by('severity', "WHERE status = 'open'"), byStatus: by('status'), unread: db.prepare("SELECT COUNT(*) c FROM notifications WHERE read = 0 AND status = 'open'").get().c } });
});
router.patch('/notifications/:id/read', (req, res) => { db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(Number(req.params.id)); res.json({ ok: true }); });
router.post('/notifications/read-all', (req, res) => res.json({ updated: db.prepare('UPDATE notifications SET read = 1 WHERE read = 0').run().changes }));

router.get('/analytics', (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 14);
  const since = Date.now() - days * DAY;
  const hives = allHives();
  const st = stats(since, hives.map((h) => h.id));
  const tz = 3600000; // Morocco is UTC+1
  const perHive = hives.map((h) => {
    const s = st[h.id];
    const sd = db.prepare('SELECT AVG(temperature * temperature) - AVG(temperature) * AVG(temperature) AS v FROM streams WHERE hive_id = ? AND created_at >= ?').get(h.id, since).v;
    const alerts = db.prepare('SELECT COUNT(*) c FROM notifications WHERE hive_id = ? AND created_at >= ?').get(h.id, since).c;
    return { id: h.id, name: h.name, farmName: h.farmName, weightDelta: s ? s.weight.delta : null, avgTemp: s ? s.temperature.avg : null, tempStability: sd == null ? null : r1(Math.sqrt(Math.max(sd, 0)), 2),
      avgActivity: s ? s.activity.avg : null, avgWeight: s ? r1((s.weight.min + s.weight.max) / 2, 1) : null, alerts };
  });
  const daily = db.prepare(`SELECT CAST((created_at + ?) / 86400000 AS INTEGER) * 86400000 - ? AS d, AVG(weight) AS w, AVG(temperature) AS t, AVG(humidity) AS h, AVG(activity) AS a, hive_id
    FROM streams WHERE created_at >= ? GROUP BY d, hive_id ORDER BY d`).all(tz, tz, since);
  const byDay = {};
  daily.forEach((x) => { const e = (byDay[x.d] = byDay[x.d] || { date: x.d, weight: 0, t: [], h: [], a: [], n: 0 }); e.weight += x.w; e.t.push(x.t); e.h.push(x.h); e.a.push(x.a); e.n += 1; });
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const hourly = db.prepare(`SELECT (CAST(created_at / 3600000 AS INTEGER) + 1) % 24 AS hour, AVG(activity) AS activity, AVG(temperature) AS temperature, AVG(sound) AS sound FROM streams WHERE created_at >= ? GROUP BY hour ORDER BY hour`).all(since);
  const alertsDaily = db.prepare(`SELECT CAST((created_at + ?) / 86400000 AS INTEGER) * 86400000 - ? AS d, severity, COUNT(*) AS n FROM notifications WHERE created_at >= ? GROUP BY d, severity ORDER BY d`).all(tz, tz, since);
  const alertsByType = db.prepare('SELECT type, COUNT(*) AS n FROM notifications WHERE created_at >= ? GROUP BY type ORDER BY n DESC').all(since).map((x) => ({ ...x, label: RULES[x.type] ? RULES[x.type].label : x.type }));
  res.json({
    days, perHive,
    daily: Object.values(byDay).map((e) => ({ date: e.date, totalWeight: r1(e.weight, 1), avgTemp: r1(mean(e.t), 1), avgHum: r1(mean(e.h), 0), avgActivity: Math.round(mean(e.a)) })),
    hourly: hourly.map((x) => ({ hour: x.hour, activity: Math.round(x.activity), temperature: r1(x.temperature, 1), sound: Math.round(x.sound) })),
    alertsDaily, alertsByType,
  });
});

router.get('/simulator', (req, res) => res.json(simulator.status()));
router.post('/simulator', auth.adminOnly, (req, res) => {
  const { action, type, hive, minutes, id, enabled } = req.body || {};
  try {
    if (action === 'start') simulator.start();
    else if (action === 'stop') simulator.stop();
    else if (action === 'inject') simulator.inject({ type, hive, minutes: Math.min(Number(minutes) || 10, 120) });
    else if (action === 'clear') simulator.clear(id);
    else if (action === 'ambient') simulator.setAmbient(enabled);
    else return bad(res, 400, 'Unknown action');
    res.json(simulator.status());
  } catch (e) { bad(res, 400, e.message); }
});

router.get('/system', (req, res) => {
  const now = Date.now();
  const c = (sql, ...a) => db.prepare(sql).get(...a).c;
  const last = db.prepare('SELECT s.created_at, h.name FROM streams s JOIN hives h ON h.id = s.hive_id ORDER BY s.created_at DESC LIMIT 1').get();
  res.json({
    uptimeSec: Math.round(process.uptime()), node: process.version, memoryMb: Math.round(process.memoryUsage().rss / 1048576),
    db: { streams: c('SELECT COUNT(*) c FROM streams'), notifications: c('SELECT COUNT(*) c FROM notifications'), hives: c('SELECT COUNT(*) c FROM hives'), users: c('SELECT COUNT(*) c FROM users') },
    lastReading: last ? { at: last.created_at, hive: last.name } : null,
    throughput: { perMinute: c('SELECT COUNT(*) c FROM streams WHERE created_at >= ?', now - 60000), last5min: c('SELECT COUNT(*) c FROM streams WHERE created_at >= ?', now - 300000), lastHour: c('SELECT COUNT(*) c FROM streams WHERE created_at >= ?', now - 3600000) },
    simulator: simulator.status(),
  });
});

module.exports = router;
