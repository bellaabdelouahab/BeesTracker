import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, DoorOpen, Plus, Save } from 'lucide-react';
import { Empty, ErrorBox, Hex, Panel, Seg, Skeleton, StatusTag, Tabs } from '../components/ui';
import Tile from '../components/Tile';
import TimeChart from '../components/TimeChart';
import AlertRow from '../components/AlertRow';
import useApi from '../lib/useApi';
import useNow from '../lib/useNow';
import { api } from '../api';
import { withLive } from '../context/Data';
import { useLive } from '../context/Live';
import { usePrefs } from '../context/Prefs';
import { useToast } from '../context/Toast';
import { CHART_METRICS, METRICS } from '../lib/metrics';
import { downloadText, fmt, fmtDateTime, signed, timeAgo } from '../lib/format';

const SPAN = { '1h': 3600e3, '6h': 6 * 3600e3, '24h': 864e5, '3d': 3 * 864e5, '7d': 7 * 864e5, '14d': 14 * 864e5 };
const LEVEL = { good: 'ok', warn: 'warn', info: 'info' };
const LIMIT_FIELDS = [['minWeight', 'Minimum weight', 'kg'], ['maxWeight', 'Maximum weight', 'kg'], ['minTemperature', 'Minimum brood temperature', '°C'], ['maxTemperature', 'Maximum brood temperature', '°C'], ['minHumidity', 'Minimum humidity', '%'], ['maxHumidity', 'Maximum humidity', '%']];

export default function HiveDetail() {
  const { id } = useParams();
  const { units, refresh } = usePrefs();
  const { latest, alertTick } = useLive();
  const toast = useToast();
  const now = useNow(5000);
  const { data: h, error, loading, reload } = useApi(() => api.hive(id), [id], { interval: refresh });
  const [tab, setTab] = useState('live');
  const [metric, setMetric] = useState('weight');
  const [range, setRange] = useState('24h');
  const [band, setBand] = useState(true);
  const { data: s } = useApi(() => api.streams(id, range), [id, range], { interval: 30 });
  const { data: readings } = useApi(() => api.readings(id, 10), [id], { interval: 20 });
  const { data: insp, reload: reloadInsp } = useApi(() => api.inspections(id), [id], { enabled: tab === 'log' });
  const [limits, setLimits] = useState({});
  const [form, setForm] = useState({ queenSeen: true, brood: 'Solid', stores: 'Good', temper: 'Calm', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);

  useEffect(() => { setTab('live'); }, [id]);
  useEffect(() => { if (alertTick) reload(); }, [alertTick]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (h) setLimits(h.thresholds); }, [h?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const hive = useMemo(() => (h ? withLive(h, latest) : null), [h, latest]);

  if (error && !h) return <div className="page"><Link to="/hives" className="btn sm" style={{ marginBottom: 14 }}><ArrowLeft size={14} />Hives</Link><ErrorBox error={error} onRetry={reload} /></div>;
  if (loading && !h) return <div className="page"><Skeleton h={60} w={300} /><div style={{ height: 16 }} /><Skeleton h={160} /></div>;

  const t = hive.thresholds;
  const limitFor = { weight: { lo: t.minWeight, hi: t.maxWeight }, temperature: { lo: t.minTemperature, hi: t.maxTemperature }, humidity: { lo: t.minHumidity, hi: t.maxHumidity } }[metric];
  const dirty = LIMIT_FIELDS.some(([k]) => Number(limits[k]) !== t[k]);
  const exportCsv = () => downloadText(`${hive.name}-${range}.csv`, `time,brood_temp_c,humidity_pct,weight_kg,traffic_per_min,hum_hz,battery_v\n${(s?.points || []).map((p) => [new Date(p.t).toISOString(), p.temperature, p.humidity, p.weight, p.activity, p.sound, p.battery].join(',')).join('\n')}`);
  const saveLimits = async () => {
    setBusy(true);
    try { await api.updateHive(id, Object.fromEntries(LIMIT_FIELDS.map(([k]) => [k, Number(limits[k])]))); toast.push({ tone: 'ok', title: 'Limits saved', text: 'New readings use the updated range.' }); reload(); } catch (e) { toast.push({ tone: 'crit', title: 'Not saved', text: e.message }); } finally { setBusy(false); }
  };
  const addInspection = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.addInspection(id, form); setForm({ ...form, notes: '' }); reloadInsp(); toast.push({ tone: 'ok', title: 'Inspection logged' }); } catch (err) { toast.push({ tone: 'crit', title: 'Not saved', text: err.message }); } finally { setBusy(false); }
  };
  const L = hive.last;

  return (
    <div className="page">
      <Link to="/hives" className="btn sm ghost" style={{ marginBottom: 8 }}><ArrowLeft size={14} />All hives</Link>
      <div className="page__head">
        <div>
          <div className="row" style={{ gap: 12 }}><Hex status={hive.status} live={hive.status === 'online'} size={20} /><h1 style={{ fontSize: 44 }}>{hive.name}</h1><StatusTag status={hive.status} /></div>
          <p className="page__sub"><Link to="/apiaries" style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{hive.farm.name}</Link> · {hive.breed} · queen {hive.queenYear} · {hive.supers} super{hive.supers > 1 ? 's' : ''} · {timeAgo(L?.createdAt, now)}</p>
        </div>
        <div className="row wrap" style={{ gap: 22 }}>
          <div><div className="faint small" style={{ font: '600 12px var(--display)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>24 h weight</div><div className="num" style={{ fontSize: 34, color: (hive.stats?.weight.delta ?? 0) >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{signed(hive.stats?.weight.delta)} <small style={{ fontSize: 15 }}>kg</small></div></div>
          <div><div className="faint small" style={{ font: '600 12px var(--display)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>7 day weight</div><div className="num" style={{ fontSize: 34, color: (hive.week?.weight.delta ?? 0) >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{signed(hive.week?.weight.delta)} <small style={{ fontSize: 15 }}>kg</small></div></div>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={[['live', 'Live'], ['log', 'Inspections'], ['limits', 'Limits'], ['alerts', `Alerts${hive.alerts.filter((a) => a.status === 'open').length ? ` (${hive.alerts.filter((a) => a.status === 'open').length})` : ''}`]]} />
      <div style={{ height: 18 }} />

      {tab === 'live' && (
        <>
          <div className="grid g3 tiles" style={{ marginBottom: 18 }}>
            <Tile metric="weight" value={L?.weight} lo={t.minWeight} hi={t.maxWeight} stats={hive.stats?.weight} />
            <Tile metric="temperature" value={L?.temperature} lo={t.minTemperature} hi={t.maxTemperature} stats={hive.stats?.temperature} />
            <Tile metric="humidity" value={L?.humidity} lo={t.minHumidity} hi={t.maxHumidity} stats={hive.stats?.humidity} />
            <Tile metric="activity" value={L?.activity} extra={L?.lid ? <span className="tag warn"><DoorOpen size={12} />lid open</span> : <span className="tag ok">lid closed</span>} />
            <Tile metric="sound" value={L?.sound} />
            <Tile metric="battery" value={L?.battery} />
          </div>
          <div className="grid side">
            <Panel title="History" sub={`${METRICS[metric].label}, last ${range}. The band is the spread inside each slot.`}
              actions={<><Seg value={range} onChange={setRange} options={Object.keys(SPAN)} /><button className="btn sm" onClick={exportCsv}><Download size={13} />CSV</button></>}>
              <div className="row wrap" style={{ marginBottom: 12 }}>
                {CHART_METRICS.map((k) => <button key={k} className={`chip ${metric === k ? 'on' : ''}`} onClick={() => setMetric(k)}><i style={{ background: METRICS[k].color }} />{METRICS[k].short}</button>)}
                <span className="spacer" />
                <label className="row small muted" style={{ gap: 6 }}><input type="checkbox" checked={band} onChange={(e) => setBand(e.target.checked)} />min / max band</label>
              </div>
              {s?.points?.length ? <TimeChart points={s.points} metric={metric} height={330} band={band && metric !== 'battery'} limits={limitFor} span={SPAN[range]} /> : <Skeleton h={330} />}
            </Panel>
            <div className="stack">
              <Panel title="Colony notes" sub="Read from the last day of data">
                <div className="stack" style={{ gap: 12 }}>{hive.insights.map((i, n) => (
                  <div key={n} className="row top"><span className={`tag ${LEVEL[i.level]}`} style={{ marginTop: 2 }}>{i.level === 'good' ? 'ok' : i.level}</span><div><b>{i.title}</b><div className="muted small">{i.text}</div></div></div>
                ))}</div>
              </Panel>
              <Panel title="Hive" flush>
                <table className="table"><tbody>
                  {[['Apiary', hive.farm.name], ['Breed', hive.breed], ['Queen year', hive.queenYear], ['Supers', hive.supers], ['Signal', L ? `${L.rssi} dBm` : '--'], ['Traffic 24 h', hive.stats ? `${hive.stats.activity.avg} avg · ${hive.stats.activity.max} peak` : '--']].map(([k, v]) => <tr key={k}><td className="faint">{k}</td><td className="r" style={{ textAlign: 'right' }}>{v}</td></tr>)}
                </tbody></table>
              </Panel>
            </div>
          </div>
          <Panel title="Latest readings" sub="Auto-refreshing" flush style={{ marginTop: 18 }}>
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Time</th><th className="r">Weight</th><th className="r">Brood</th><th className="r">Humidity</th><th className="r">Traffic</th><th className="r">Hum Hz</th><th className="r">Lid</th><th className="r">Battery</th></tr></thead>
              <tbody>{(readings || []).map((r) => <tr key={r.id}><td className="mono small nowrap">{fmtDateTime(r.createdAt)}</td><td className="r">{fmt('weight', r.weight, units)}</td><td className="r">{fmt('temperature', r.temperature, units)}</td><td className="r">{fmt('humidity', r.humidity, units)}</td><td className="r">{r.activity}</td><td className="r">{r.sound}</td><td className="r">{r.lid ? 'open' : 'closed'}</td><td className="r">{fmt('battery', r.battery)}</td></tr>)}</tbody>
            </table></div>
          </Panel>
        </>
      )}

      {tab === 'log' && (
        <div className="grid side">
          <Panel title="Inspection log" sub="What was seen on each visit" flush>
            {!insp ? <div style={{ padding: 18 }}><Skeleton h={80} /></div> : insp.length === 0 ? <Empty title="No inspection yet">Log the first visit with the form.</Empty> : insp.map((i) => (
              <div key={i.id} className="alertrow">
                <div className="num" style={{ fontSize: 22, minWidth: 64, lineHeight: 1 }}>{new Date(i.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                <div style={{ flex: 1 }}>
                  <div className="row wrap" style={{ gap: 6 }}><span className={`tag ${i.queenSeen ? 'ok' : 'warn'}`}>{i.queenSeen ? 'queen seen' : 'queen not seen'}</span>{i.brood && <span className="tag">{i.brood} brood</span>}{i.stores && <span className="tag">stores {i.stores.toLowerCase()}</span>}{i.temper && <span className="tag">{i.temper.toLowerCase()}</span>}</div>
                  <div style={{ marginTop: 6 }}>{i.notes}</div><div className="faint small">{i.author}</div>
                </div>
              </div>
            ))}
          </Panel>
          <Panel title="New inspection">
            <form className="stack" onSubmit={addInspection} style={{ gap: 12 }}>
              <div className="field"><label htmlFor="d">Date</label><input id="d" className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid g2" style={{ gap: 10 }}>
                {[['brood', 'Brood', ['Solid', 'Spotty', 'None']], ['stores', 'Stores', ['Low', 'Fair', 'Good', 'Strong']], ['temper', 'Temper', ['Calm', 'Nervous', 'Aggressive']]].map(([k, l, opts]) => (
                  <div className="field" key={k}><label>{l}</label><select className="select" style={{ width: '100%' }} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
                ))}
                <div className="field"><label>Queen</label><select className="select" style={{ width: '100%' }} value={form.queenSeen ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, queenSeen: e.target.value === 'yes' })}><option value="yes">Seen</option><option value="no">Not seen</option></select></div>
              </div>
              <div className="field"><label htmlFor="n">Notes</label><textarea id="n" className="textarea" required value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Frames of brood, queen cells, treatments, supers added" /></div>
              <button className="btn primary" disabled={busy}><Plus size={15} />Log inspection</button>
            </form>
          </Panel>
        </div>
      )}

      {tab === 'limits' && (
        <Panel title="Alert limits" sub="A reading outside these values raises an alert for this hive. It closes by itself when the value is back in range." style={{ maxWidth: 760 }}>
          <div className="grid g2" style={{ gap: 14 }}>
            {LIMIT_FIELDS.map(([k, label, unit]) => (
              <div className="field" key={k}><label htmlFor={k}>{label} ({unit})</label><input id={k} className="input" type="number" step="0.1" value={limits[k] ?? ''} onChange={(e) => setLimits({ ...limits, [k]: e.target.value })} /></div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn primary" disabled={!dirty || busy} onClick={saveLimits}><Save size={15} />Save limits</button>
            {dirty && <button className="btn ghost" onClick={() => setLimits(t)}>Reset</button>}
            <span className="faint small">Brood nests are normally kept at 33-36 °C.</span>
          </div>
        </Panel>
      )}

      {tab === 'alerts' && (
        <Panel title="Alerts for this hive" flush>
          {hive.alerts.length ? hive.alerts.map((n) => <AlertRow key={n.id} n={n} now={now} />) : <Empty title="No alert yet">Nothing has gone out of range on this hive.</Empty>}
        </Panel>
      )}
    </div>
  );
}
