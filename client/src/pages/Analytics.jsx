import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { ErrorBox, Kpi, PageHead, Panel, Seg, Skeleton } from '../components/ui';
import useApi from '../lib/useApi';
import { api } from '../api';
import { usePrefs } from '../context/Prefs';
import { convert, downloadText, fmtDay, signed, unitOf } from '../lib/format';

const axis = { tick: { fontSize: 11, fill: 'var(--ink-3)', fontFamily: 'IBM Plex Mono' }, axisLine: { stroke: 'var(--ink)' }, tickLine: false };
const tip = { contentStyle: { background: 'var(--ink)', border: 0, borderRadius: 0, color: 'var(--panel)', fontSize: 12 }, labelStyle: { color: '#cfc4a3' }, itemStyle: { color: 'var(--panel)' }, cursor: { fill: 'var(--amber-soft)' } };

export default function Analytics() {
  const { units } = usePrefs();
  const [days, setDays] = useState(7);
  const { data, error, loading, reload } = useApi(() => api.analytics(days), [days], { interval: 60 });
  const W = (v) => (v == null ? v : +convert('weight', v, units).toFixed(1));

  const ranking = useMemo(() => [...(data?.perHive || [])].filter((h) => h.weightDelta != null).sort((a, b) => b.weightDelta - a.weightDelta).map((h) => ({ name: h.name, delta: W(h.weightDelta) })), [data, units]); // eslint-disable-line react-hooks/exhaustive-deps
  const stability = useMemo(() => [...(data?.perHive || [])].filter((h) => h.tempStability != null).sort((a, b) => a.tempStability - b.tempStability).map((h) => ({ name: h.name, sd: h.tempStability })), [data]);
  const total = (data?.daily || []).map((d) => ({ ...d, w: W(d.totalWeight) }));
  const alertDays = useMemo(() => {
    const m = {};
    (data?.alertsDaily || []).forEach((a) => { m[a.d] = { ...(m[a.d] || { d: a.d, critical: 0, warning: 0 }), [a.severity]: a.n }; });
    return Object.values(m).sort((a, b) => a.d - b.d);
  }, [data]);
  const hourly = (data?.hourly || []).map((h) => ({ ...h, label: `${String(h.hour).padStart(2, '0')}h` }));
  const best = ranking[0];
  const steadiest = stability[0];
  const exportCsv = () => downloadText(`ibee-hives-${days}d.csv`, `hive,apiary,weight_change_kg,avg_brood_temp_c,brood_temp_sd,avg_traffic,alerts\n${(data?.perHive || []).map((h) => [h.name, h.farmName, h.weightDelta, h.avgTemp, h.tempStability, h.avgActivity, h.alerts].join(',')).join('\n')}`);

  if (error && !data) return <div className="page"><ErrorBox error={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHead title="Analytics" sub="Compare hives and apiaries over a period.">
        <Seg value={days} onChange={setDays} options={[{ value: 3, label: '3 days' }, { value: 7, label: '7 days' }, { value: 14, label: '14 days' }]} />
        <button className="btn" onClick={exportCsv}><Download size={14} />CSV</button>
      </PageHead>
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Kpi label="Best honey flow" loading={loading && !data} value={best ? best.name : '--'} meta={best && <>{best.delta >= 0 ? '+' : ''}{best.delta} {unitOf('weight', units)} in {days} days</>} />
        <Kpi label="Steadiest brood" loading={loading && !data} value={steadiest ? steadiest.name : '--'} meta={steadiest && <>±{steadiest.sd} °C swing</>} />
        <Kpi label="Colony total" loading={loading && !data} value={total.length ? total[total.length - 1].w : '--'} unit={unitOf('weight', units)} meta={total.length > 1 && <>{signed(total[total.length - 1].w - total[0].w)} since {fmtDay(total[0].date)}</>} />
        <Kpi label="Alerts" loading={loading && !data} value={(data?.alertsByType || []).reduce((a, b) => a + b.n, 0)} meta={`in the last ${days} days`} />
      </div>
      <div className="grid g2" style={{ marginBottom: 20 }}>
        <Panel title="Honey flow by hive" sub={`Weight change over ${days} days`}>
          {loading && !data ? <Skeleton h={290} /> : <div style={{ height: 300 }}><ResponsiveContainer><BarChart data={ranking} margin={{ left: -14 }}><CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="name" {...axis} interval={0} /><YAxis {...axis} /><Tooltip {...tip} formatter={(v) => [`${v} ${unitOf('weight', units)}`, 'Change']} /><Bar dataKey="delta" isAnimationActive={false}>{ranking.map((r, i) => <Cell key={i} fill={r.delta >= 0 ? '#b87800' : '#b3301c'} />)}</Bar></BarChart></ResponsiveContainer></div>}
        </Panel>
        <Panel title="Colony weight" sub="All hives together, daily average">
          {loading && !data ? <Skeleton h={290} /> : <div style={{ height: 300 }}><ResponsiveContainer><AreaChart data={total} margin={{ left: -4 }}><CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="date" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtDay} {...axis} /><YAxis {...axis} domain={['auto', 'auto']} /><Tooltip {...tip} labelFormatter={fmtDay} formatter={(v) => [`${v} ${unitOf('weight', units)}`, 'Total']} /><Area isAnimationActive={false} dataKey="w" stroke="#b87800" strokeWidth={2.4} fill="#f0a500" fillOpacity={0.25} /></AreaChart></ResponsiveContainer></div>}
        </Panel>
      </div>
      <div className="grid g2" style={{ marginBottom: 20 }}>
        <Panel title="Brood temperature swing" sub="Standard deviation: lower means a better regulated nest">
          {loading && !data ? <Skeleton h={290} /> : <div style={{ height: 300 }}><ResponsiveContainer><BarChart data={stability} margin={{ left: -14 }}><CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="name" {...axis} interval={0} /><YAxis {...axis} unit="°" /><Tooltip {...tip} formatter={(v) => [`±${v} °C`, 'Swing']} /><Bar dataKey="sd" fill="#cf4a0c" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>}
        </Panel>
        <Panel title="Entrance traffic by hour" sub="Average bees per minute, local time">
          {loading && !data ? <Skeleton h={290} /> : <div style={{ height: 300 }}><ResponsiveContainer><AreaChart data={hourly} margin={{ left: -14 }}><CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="label" {...axis} interval={2} /><YAxis {...axis} /><Tooltip {...tip} formatter={(v) => [`${v} /min`, 'Traffic']} /><Area isAnimationActive={false} dataKey="activity" stroke="#3d7a3a" strokeWidth={2.4} fill="#3d7a3a" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div>}
        </Panel>
      </div>
      <div className="grid side">
        <Panel title="Hive comparison" flush>
          <div className="table-wrap"><table className="table"><thead><tr><th>Hive</th><th>Apiary</th><th className="r">Weight Δ</th><th className="r">Brood °C</th><th className="r">Swing</th><th className="r">Traffic</th><th className="r">Alerts</th></tr></thead>
            <tbody>{(data?.perHive || []).map((h) => <tr key={h.id}><td><b style={{ font: '600 16px var(--display)', letterSpacing: '0.06em' }}>{h.name}</b></td><td>{h.farmName.replace('Rucher ', '')}</td>
              <td className="r" style={{ color: (h.weightDelta ?? 0) >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{signed(W(h.weightDelta))}</td><td className="r">{h.avgTemp ?? '--'}</td><td className="r">{h.tempStability ?? '--'}</td><td className="r">{h.avgActivity ?? '--'}</td><td className="r">{h.alerts}</td></tr>)}</tbody></table></div>
        </Panel>
        <Panel title="Alerts per day" sub="By severity">
          {alertDays.length ? <div style={{ height: 230 }}><ResponsiveContainer><BarChart data={alertDays} margin={{ left: -24 }}><CartesianGrid stroke="var(--line)" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="d" type="number" scale="time" domain={['dataMin - 43200000', 'dataMax + 43200000']} tickFormatter={fmtDay} {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} labelFormatter={fmtDay} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="warning" stackId="a" fill="#c87600" isAnimationActive={false} /><Bar dataKey="critical" stackId="a" fill="#b3301c" isAnimationActive={false} /></BarChart></ResponsiveContainer></div> : <div className="empty">No alert in this period.</div>}
          <div className="row wrap" style={{ marginTop: 8 }}>{(data?.alertsByType || []).map((a) => <span key={a.type} className="tag">{a.label} · {a.n}</span>)}</div>
        </Panel>
      </div>
    </div>
  );
}
