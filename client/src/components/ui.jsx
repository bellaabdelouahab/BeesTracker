import { useEffect } from 'react';
import { X } from 'lucide-react';
import { STATUS } from '../lib/metrics';
import { clamp, cx } from '../lib/format';

export function Panel({ title, sub, icon: I, actions, children, className, bodyClass, flush, tone, ...rest }) {
  return (
    <section className={cx('panel', tone, className)} {...rest}>
      {(title || actions) && (
        <header className="panel__head">
          <div>
            <h3 className="panel__title">{I && <I size={16} strokeWidth={2} />}{title}</h3>
            {sub && <div className="panel__sub">{sub}</div>}
          </div>
          {actions && <div className="row" style={{ gap: 8 }}>{actions}</div>}
        </header>
      )}
      <div className={cx('panel__body', flush && 'flush', bodyClass)}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, unit, meta, icon: I, loading, ...rest }) {
  return (
    <div className="kpi" {...rest}>
      <i className="kpi__bar" />
      <div className="kpi__label">{I && <I size={14} />}{label}</div>
      {loading ? <div className="skeleton" style={{ height: 36, width: 100, marginTop: 8 }} /> : <div className="kpi__value">{value}{unit && <small>{unit}</small>}</div>}
      {meta && <div className="kpi__meta">{meta}</div>}
    </div>
  );
}

export const Hex = ({ status = 'online', live, size }) => <i className={cx('hex', `s-${status}`, live && 'live')} style={size ? { width: size, height: size * 1.08 } : undefined} />;

export function StatusTag({ status }) {
  const s = STATUS[status] || STATUS.offline;
  return <span className={cx('tag', s.tone)}>{s.label}</span>;
}
export const SeverityTag = ({ severity }) => <span className={cx('tag', severity === 'critical' ? 'crit' : 'warn')}>{severity}</span>;

export function Seg({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => { const v = o.value ?? o; return <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{o.label ?? o}</button>; })}
    </div>
  );
}
export const Switch = ({ on, onChange, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} className={cx('switch', on && 'on')} onClick={() => onChange(!on)} />;

export function Tabs({ value, onChange, items }) {
  return <div className="tabs" role="tablist">{items.map(([v, l]) => <button key={v} role="tab" aria-selected={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export const Skeleton = ({ h = 16, w = '100%' }) => <div className="skeleton" style={{ height: h, width: w }} />;

export function Empty({ icon: I, title, children, action }) {
  return <div className="empty">{I && <I size={32} color="var(--ink-3)" />}<b>{title}</b>{children && <div style={{ maxWidth: 380 }}>{children}</div>}{action}</div>;
}
export const ErrorBox = ({ error, onRetry }) => (
  <div className="empty"><b>Could not load</b><div>{error?.message}</div>{onRetry && <button className="btn" onClick={onRetry}>Retry</button>}</div>
);

export function PageHead({ title, sub, children }) {
  return (
    <div className="page__head">
      <div><h1>{title}</h1>{sub && <p className="page__sub">{sub}</p>}</div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}

export function Spark({ data = [], w = 110, h = 30, color = '#b87800' }) {
  const v = data.filter((x) => x != null);
  if (v.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...v), max = Math.max(...v), span = max - min || 1;
  const pts = v.map((x, i) => `${((i / (v.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - ((x - min) / span) * (h - 8)).toFixed(1)}`);
  return <svg width={w} height={h} aria-hidden="true"><polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" /><circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r="2.6" fill={color} /></svg>;
}

/** where a value sits between its two alert limits */
export function LimitBar({ value, lo, hi }) {
  if (lo == null || hi == null || value == null) return null;
  const span = hi - lo;
  const pos = clamp((value - (lo - span * 0.3)) / (span * 1.6), 0, 1);
  const out = value < lo || value > hi;
  return (
    <div className="meter" style={{ background: `linear-gradient(90deg, var(--warn-soft) 18.75%, var(--ok-soft) 18.75% 81.25%, var(--warn-soft) 81.25%)` }}>
      <i style={{ left: `calc(${pos * 100}% - 2px)`, background: out ? 'var(--crit)' : 'var(--ink)' }} />
    </div>
  );
}

export function Drawer({ open, onClose, title, sub, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <div><h2>{title}</h2>{sub && <div className="small" style={{ color: '#cfc4a3' }}>{sub}</div>}</div>
          <button className="btn icon sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="drawer__body">{children}</div>
      </aside>
    </>
  );
}
