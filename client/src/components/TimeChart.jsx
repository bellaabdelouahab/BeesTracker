import { useMemo } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { METRICS } from '../lib/metrics';
import { convert, unitOf } from '../lib/format';
import { usePrefs } from '../context/Prefs';

const tick = (span) => (t) => {
  const d = new Date(t);
  if (span <= 36 * 3600e3) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

/** points: [{ t, <metric>, <metric>Min, <metric>Max }] */
export default function TimeChart({ points, metric, height = 280, band = true, limits, span = 864e5, mini = false }) {
  const { units } = usePrefs();
  const m = METRICS[metric];
  const rows = useMemo(() => points.map((p) => ({
    t: p.t,
    v: convert(metric, p[metric], units),
    band: band && p[`${metric}Min`] != null ? [convert(metric, p[`${metric}Min`], units), convert(metric, p[`${metric}Max`], units)] : null,
  })), [points, metric, units, band]);
  const lo = limits?.lo != null ? convert(metric, limits.lo, units) : null;
  const hi = limits?.hi != null ? convert(metric, limits.hi, units) : null;
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: mini ? -24 : -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tick(span)} tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'IBM Plex Mono' }} axisLine={{ stroke: 'var(--ink)' }} tickLine={false} minTickGap={44} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} width={mini ? 42 : 50} domain={['auto', 'auto']} tickFormatter={(v) => (Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2))} />
          {hi != null && <ReferenceLine y={hi} stroke="var(--crit)" strokeDasharray="5 4" label={{ value: 'max', fill: 'var(--crit)', fontSize: 10, position: 'insideTopRight' }} />}
          {lo != null && <ReferenceLine y={lo} stroke="var(--info)" strokeDasharray="5 4" label={{ value: 'min', fill: 'var(--info)', fontSize: 10, position: 'insideBottomRight' }} />}
          {band && <Area dataKey="band" stroke="none" fill={m.color} fillOpacity={0.14} isAnimationActive={false} connectNulls />}
          <Line dataKey="v" stroke={m.color} strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: 'var(--ink)' }} isAnimationActive={false} connectNulls />
          <Tooltip
            cursor={{ stroke: 'var(--ink)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div style={{ background: 'var(--ink)', color: 'var(--panel)', padding: '8px 12px', fontSize: 12 }}>
                  <div style={{ color: '#cfc4a3' }}>{new Date(p.t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  <b style={{ fontFamily: 'Barlow Condensed', fontSize: 20, color: 'var(--amber)' }}>{p.v == null ? '--' : p.v.toFixed(m.decimals + (metric === 'weight' ? 1 : 0))}</b> {unitOf(metric, units)}
                </div>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
