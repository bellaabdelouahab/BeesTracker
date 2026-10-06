const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const secret = () => process.env.JWT_SECRET || 'dev-only-secret';
const sign = (user) => jwt.sign({ id: user.id }, secret(), { expiresIn: '30d' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const attempts = new Map(); // ip -> { n, until }
const login = (req, res) => {
  const ip = req.ip;
  const a = attempts.get(ip);
  if (a && a.n >= 8 && a.until > Date.now()) return res.status(429).json({ message: 'Too many attempts, try again in a few minutes.' });
  const { email, password } = req.body || {};
  const user = email ? db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase()) : null;
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    attempts.set(ip, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 10 * 60000 });
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }
  attempts.delete(ip);
  res.json({ token: sign(user), user: publicUser(user) });
};

const verify = (token) => {
  const { id } = jwt.verify(token, secret());
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};
const protect = (req, res, next) => {
  const h = req.headers.authorization || '';
  try {
    const user = verify(h.startsWith('Bearer ') ? h.slice(7) : '');
    if (!user) throw new Error('no user');
    req.user = user;
    next();
  } catch (e) { res.status(401).json({ message: 'Please sign in.' }); }
};
const adminOnly = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Administrators only.' }));

module.exports = { login, protect, adminOnly, verify, publicUser };
