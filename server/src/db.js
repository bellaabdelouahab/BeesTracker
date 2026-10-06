const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'ibee.db');
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'keeper',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS farms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  adress TEXT NOT NULL,
  description TEXT,
  lat REAL, lng REAL, altitude INTEGER,
  image TEXT,
  user_id INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS hives (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  lat REAL, lng REAL,
  breed TEXT, queen_year INTEGER, supers INTEGER DEFAULT 1,
  last_stream_id INTEGER,
  min_temperature REAL, max_temperature REAL,
  min_humidity REAL, max_humidity REAL,
  min_weight REAL, max_weight REAL,
  profile TEXT,                         -- JSON: parameters used by the simulator
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS streams (
  id INTEGER PRIMARY KEY,
  hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,    -- 0 normal, 1 warning, 2 critical
  temperature REAL, humidity REAL, weight REAL,
  lid INTEGER, activity INTEGER, sound INTEGER,
  battery REAL, rssi INTEGER
);
CREATE INDEX IF NOT EXISTS idx_streams_hive_time ON streams (hive_id, created_at);
CREATE INDEX IF NOT EXISTS idx_streams_time ON streams (created_at);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY,
  hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  content TEXT NOT NULL,
  user_room TEXT,
  value REAL, threshold REAL, unit TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open | resolved
  read INTEGER NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notif_state ON notifications (status, last_seen);
CREATE INDEX IF NOT EXISTS idx_notif_hive ON notifications (hive_id, type, status);
CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY,
  hive_id INTEGER NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  author TEXT,
  date INTEGER NOT NULL,
  queen_seen INTEGER NOT NULL DEFAULT 0,
  brood TEXT, stores TEXT, temper TEXT, notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_insp_hive ON inspections (hive_id, date);
`);

module.exports = db;
