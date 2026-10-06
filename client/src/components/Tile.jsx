import { METRICS } from '../lib/metrics';
import { fmt, unitOf } from '../lib/format';
import { usePrefs } from '../context/Prefs';
import { LimitBar } from './ui';

/** current value of one measurement with its alert range and 24 h spread */
export default function Tile({ metric, value, lo, hi, stats, extra }) {
  const { units } = usePrefs();
  const m = METRICS[metric];
  const out = lo != null && hi != null && value != null && (value < lo || value > hi);
  return (
    <div className="panel flat" style={{ padding: '12px 14px' }} title={m.help}>
      <div className="row between"><span className="small" style={{ font: '600 13px var(--display)', letterSpacing: '0.12em', textTransform: 'uppercase', color: m.color }}>{m.short}</span>{extra}</div>
      <div style={{ font: '600 36px/1 var(--display)', marginTop: 6, color: out ? 'var(--crit)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(metric, value, units)}<small style={{ fontSize: 15, marginLeft: 4, color: 'var(--ink-3)' }}>{unitOf(metric, units)}</small>
      </div>
      {lo != null && <div style={{ marginTop: 10 }}><LimitBar value={value} lo={lo} hi={hi} /><div className="row between small faint" style={{ marginTop: 3 }}><span>{fmt(metric, lo, units)}</span><span>{fmt(metric, hi, units)}</span></div></div>}
      {stats && <div className="small faint" style={{ marginTop: 6 }}>24 h <b className="mono">{fmt(metric, stats.min, units)}</b> to <b className="mono">{fmt(metric, stats.max, units)}</b></div>}
    </div>
  );
}
