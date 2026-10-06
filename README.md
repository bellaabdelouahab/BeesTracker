# iBee

Hive monitoring: weight, brood temperature, humidity, entrance traffic and hum frequency for every hive of every apiary, with live updates, alerts and an inspection log.

This repository is one project in one folder:

```
client/   React + Vite single page app (map, apiaries, hives, alerts, analytics, control)
server/   Node + Express + Socket.IO API, SQLite storage, alert engine and a built-in simulator
Dockerfile, docker-compose.yaml   one container serves the API, the sockets and the built client
```

It replaces the earlier split between a static front end (BeesTracker) and a JHipster microservice back end (Ibee: gateway, management and sensoring services). The domain model is the same: **farms** (apiaries), **hives** (ruches, with min/max limits for temperature, humidity and weight), **streams** (sensor readings) and **notifications** (alerts). It runs as a single small process instead of three JVMs plus a registry.

## Run

```bash
JWT_SECRET=change-me ADMIN_PASSWORD=choose-one docker compose up --build   # http://localhost:3000 once port 3000 is published
```

Development: `cd server && npm i && npm start`, then `cd client && npm i && npm run dev` (the dev server proxies `/api` and `/socket.io` to port 3000).

On first start the server creates demo data: 4 apiaries, 18 hives, 14 days of readings and the alerts that history would have raised. Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `JWT_SECRET` | none, required | signs login tokens |
| `ADMIN_EMAIL` | `admin@ibee.abdelouahab.xyz` | email of the administrator created on first start |
| `ADMIN_PASSWORD` | none, required | password given to the demo accounts on first start. Not applied again once an administrator exists |
| `SIMULATOR` | `true` | feed every hive with generated readings. Set `false` when real sensors are connected |
| `SIM_AMBIENT` | `true` | random short events (heat, swarm, low battery...) so alerts appear and clear |
| `SIM_INTERVAL_SEC` | `30` | one simulator cycle |
| `DEVICE_API_KEY` | empty | when set, `POST /api/ingest` requires this value in the `x-api-key` header |
| `SEED_DEMO` | `true` | create demo content when the database is empty |
| `DB_FILE` | `server/data/ibee.db` | SQLite file |

## Sensor endpoint

```http
POST /api/ingest
{ "hive": "R1", "temperature": 34.6, "humidity": 58, "weight": 40.2, "activity": 90, "sound": 245, "battery": 3.8, "lid": 0, "rssi": -92 }
```

`hive` is the hive name (or send `hiveId`). Each reading is stored, checked against the hive limits (temperature, humidity, weight, sudden weight loss, swarming hum, lid open, battery, offline) and pushed to open pages.

## API

All endpoints except `/api/auth/login`, `/api/health` and `/api/ingest` need `Authorization: Bearer <token>`.

`GET /api/overview` · `GET /api/hives` · `GET /api/hives/:id` · `PATCH /api/hives/:id` (limits) · `GET /api/hives/:id/streams?range=1h|6h|24h|3d|7d|14d` · `GET|POST /api/hives/:id/inspections` · `GET /api/farms/:id` · `GET /api/notifications` · `GET /api/analytics?days=` · `GET|POST /api/simulator` · `GET /api/system`

Live updates use Socket.IO with the token in the handshake: `reading` and `notification` events.
