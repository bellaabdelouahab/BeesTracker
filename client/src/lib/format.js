import { METRICS } from './metrics';

export const cx = (...a) => a.filter(Boolean).join(' ');
const toF = (c) => (c * 9) / 5 + 32;
const toLb = (kg) => kg * 2.20462;

export const convert = (key, v, units) => {
  if (v == null || Number.isNaN(v)) return null;
  if (units === 'imperial') { if (key === 'temperature') return toF(v); if (key === 'weight') return toLb(v); }
  return v;
};
export const unitOf = (key, units) => (units === 'imperial' ? (key === 'temperature' ? '°F' : key === 'weight' ? 'lb' : METRICS[key]?.unit) : METRICS[key]?.unit) || '';
export const fmt = (key, v, units = 'metric', withUnit = false) => {
  const c = convert(key, v, units);
  if (c == null) return '--';
  const d = METRICS[key]?.decimals ?? 1;
  const s = c.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return withUnit ? `${s} ${unitOf(key, units)}` : s;
};
export const signed = (v, d = 1) => (v == null ? '--' : `${v > 0 ? '+' : ''}${v.toFixed(d)}`);

export const timeAgo = (t, now = Date.now()) => {
  if (!t) return 'never';
  const s = Math.max(0, Math.round((now - new Date(t).getTime()) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
export const fmtTime = (t, sec = false) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', ...(sec ? { second: '2-digit' } : {}) });
export const fmtDateTime = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtDay = (t) => new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const downloadText = (name, text, type = 'text/csv') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};
