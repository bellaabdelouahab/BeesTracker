const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const { Server } = require('socket.io');
const auth = require('./auth');
const routes = require('./routes');
const demo = require('./demo');
const simulator = require('./simulator');
const tiles = require('./tiles');
const { bus } = require('./ingest');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); next(); });
app.get('/tiles/:z/:x/:y.png', tiles.handler);
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ message: 'Unknown endpoint' }));

// the built React client
const clientDir = process.env.CLIENT_DIR || path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir, { maxAge: '1h', index: false, setHeaders: (res, file) => { if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
  app.get('*', (req, res) => res.sendFile(path.join(clientDir, 'index.html')));
}
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Server error' }); }); // eslint-disable-line no-unused-vars

const server = http.createServer(app);
const io = new Server(server, { serveClient: false });
io.use((socket, next) => {
  try {
    const user = auth.verify(socket.handshake.auth.token || '');
    if (!user) throw new Error('no user');
    socket.data.user = user;
    next();
  } catch (e) { next(new Error('unauthorized')); }
});
io.on('connection', (socket) => {
  socket.join('all');
  socket.join(`user-${socket.data.user.id}`);
  socket.emit('hello', { serverTime: Date.now(), simulator: simulator.status().enabled });
});
bus.on('reading', (r) => io.to('all').emit('reading', r));
bus.on('notification', (n) => io.to('all').emit('notification', n));

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`iBee listening on :${port}`);
  try {
    if (process.env.SEED_DEMO !== 'false') console.log('[demo]', JSON.stringify(demo.bootstrap({ password: process.env.ADMIN_PASSWORD })));
    simulator.startBackground();
    setInterval(tiles.prune, 6 * 3600e3);
    if (process.env.SIMULATOR !== 'false') simulator.start();
  } catch (e) { console.error('Bootstrap failed', e); }
});
