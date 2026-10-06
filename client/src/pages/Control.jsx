import { useState } from 'react';
import { ArrowRight, Play, Send, Square, Zap } from 'lucide-react';
import { ErrorBox, Kpi, PageHead, Panel, Skeleton, Switch } from '../components/ui';
import useApi from '../lib/useApi';
import useNow from '../lib/useNow';
import { api } from '../api';
import { useAuth } from '../context/Auth';
import { useData } from '../context/Data';
import { useLive } from '../context/Live';
import { usePrefs } from '../context/Prefs';
import { useToast } from '../context/Toast';
import { fmt, fmtTime, timeAgo } from '../lib/format';

const PIPE = [
  ['Hive sensors', 'Weight cell, temperature, humidity, hum microphone and a lid switch, read every few minutes.'],
  ['Gateway', 'Collects the radio packets in the apiary and forwards them over the internet.'],
  ['POST /api/ingest', 'One JSON reading per request: hive, temperature, humidity, weight, traffic, hum, battery.'],
  ['Ingest and rules', 'Stores the reading, compares it to the hive limits, opens or closes alerts.'],
  ['SQLite', 'Readings and alerts are kept in a single file database. 15 days of history.'],
  ['Socket to browsers', 'The server pushes every reading and alert to open pages, no refresh needed.'],
];
const dur = (s) => { const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`; };

export default function Control() {
  const { isAdmin } = useAuth();
  const { data: ov } = useData();
  const { feed } = useLive();
  const { units } = usePrefs();
  const toast = useToast();
  const now = useNow(1000);
  const { data: sys, error, reload } = useApi(() => api.system(), [], { interval: 5 });
  const [target, setTarget] = useState('');
  const [minutes, setMinutes] = useState(8);
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState({ hive: 'R1', temperature: 34.6, humidity: 58, weight: 40, activity: 90, sound: 245, battery: 3.8, lid: 0 });
  const [res, setRes] = useState(null);

  const sim = sys?.simulator;
  const hives = (ov?.farms || []).flatMap((f) => f.hives);
  const control = async (body, ok) => {
    setBusy(true);
    try { await api.simulate(body); toast.push({ tone: 'ok', title: ok }); reload(); } catch (e) { toast.push({ tone: 'crit', title: 'Failed', text: e.message }); } finally { setBusy(false); }
  };
  const send = async () => {
    try { const r = await api.sendReading(test); setRes({ ok: true, text: `201 stored, status ${['normal', 'warning', 'critical'][r.status]}.` }); } catch (e) { setRes({ ok: false, text: `${e.status || ''} ${e.message}` }); }
  };
  if (error && !sys) return <div className="page"><ErrorBox error={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHead title="Control" sub="Data pipeline, the built-in simulator and a test endpoint." />
      <div className="grid g4" style={{ marginBottom: 20 }}>
        <Kpi label="Database" loading={!sys} value={sys ? sys.db.streams.toLocaleString() : ''} meta={sys && `${sys.db.notifications} alerts · ${sys.db.hives} hives`} />
        <Kpi label="Ingest rate" loading={!sys} value={sys?.throughput.perMinute} unit="/min" meta={sys && `${sys.throughput.lastHour.toLocaleString()} in the last hour`} />
        <Kpi label="Last reading" loading={!sys} value={sys?.lastReading ? timeAgo(sys.lastReading.at, now).replace(' ago', '') : '--'} meta={sys?.lastReading && `from ${sys.lastReading.hive}`} />
        <Kpi label="Server" loading={!sys} value={sys && dur(sys.uptimeSec)} meta={sys && `${sys.memoryMb} MB · Node ${sys.node}`} />
      </div>

      <Panel title="Data pipeline" sub="From the hive to the screen. With the simulator running, the first two steps are simulated." style={{ marginBottom: 20 }}>
        <div className="pipe">
          {PIPE.map(([t, d], i) => (
            <div key={t} className="pipe__item">
              <div className={`pipe__node ${i < 2 && sim?.enabled ? 'sim' : ''}`}><b>{t}</b><p className="small muted">{d}</p>{i < 2 && sim?.enabled && <span className="tag info">simulated</span>}{i === 3 && <span className="tag ok">{sys?.throughput.last5min ?? 0} in 5 min</span>}</div>
              {i < PIPE.length - 1 && <ArrowRight className="pipe__arrow" size={18} />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid side" style={{ marginBottom: 20 }}>
        <Panel title="Simulator" sub="Generates readings with a day and night cycle for every hive"
          actions={isAdmin ? (sim?.enabled ? <button className="btn sm danger" disabled={busy} onClick={() => control({ action: 'stop' }, 'Simulator stopped')}><Square size={13} />Stop</button> : <button className="btn sm primary" disabled={busy} onClick={() => control({ action: 'start' }, 'Simulator started')}><Play size={13} />Start</button>) : <span className="tag">admin only</span>}>
          {!sim ? <Skeleton h={120} /> : (
            <>
              <div className="row wrap" style={{ gap: 20, marginBottom: 16 }}>
                <span className={`tag ${sim.enabled ? 'ok' : 'off'}`}>{sim.enabled ? 'Running' : 'Stopped'}</span>
                <span className="small muted">one cycle every <b>{sim.intervalSec}s</b></span>
                <span className="small muted"><b>{sim.sent.toLocaleString()}</b> readings sent</span>
                <label className="row small muted" style={{ gap: 8 }} title="Every few minutes a short random event hits one hive">Random events <Switch on={!!sim.ambient} onChange={(v) => isAdmin && control({ action: 'ambient', enabled: v }, v ? 'Random events on' : 'Random events off')} label="Random events" /></label>
              </div>
              <h3 style={{ marginBottom: 8 }}>Scenarios</h3>
              <div className="row wrap" style={{ marginBottom: 12 }}>
                <label className="row small muted" style={{ gap: 6 }}>Hive <select className="select" value={target} onChange={(e) => setTarget(e.target.value)}><option value="">All hives</option>{hives.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
                <label className="row small muted" style={{ gap: 6 }}>For <select className="select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>{[3, 5, 8, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label>
              </div>
              <div className="grid fit" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {sim.catalog.map((c) => (
                  <div key={c.id} className="panel flat" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <b style={{ font: '600 17px var(--display)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{c.label}</b>
                    <p className="small muted" style={{ flex: 1 }}>{c.description}</p>
                    <button className="btn sm" disabled={!isAdmin || !sim.enabled || busy} onClick={() => control({ action: 'inject', type: c.id, hive: target || null, minutes }, `${c.label} started`)}><Zap size={12} />Start</button>
                  </div>
                ))}
              </div>
              <h3 style={{ margin: '18px 0 8px' }}>Running</h3>
              {sim.scenarios.length ? sim.scenarios.map((s) => (
                <div key={s.id} className="row between" style={{ padding: '8px 0', borderBottom: '1px dotted var(--line-strong)' }}>
                  <span><b>{s.type.replace('_', ' ')}</b> <span className="muted small">on {s.hive ? hives.find((h) => h.id === s.hive)?.name : 'all hives'} · ends in {Math.max(0, Math.round((s.until - now) / 60000))} min</span></span>
                  {isAdmin && <button className="btn sm ghost" onClick={() => control({ action: 'clear', id: s.id }, 'Scenario stopped')}>Stop</button>}
                </div>
              )) : <p className="muted small">No scenario is running.</p>}
            </>
          )}
        </Panel>
        <Panel title="Send a test reading" sub="Posts to the same endpoint a gateway uses">
          <div className="grid g2" style={{ gap: 10 }}>
            <div className="field"><label>Hive</label><select className="select" style={{ width: '100%' }} value={test.hive} onChange={(e) => setTest({ ...test, hive: e.target.value })}>{hives.map((h) => <option key={h.id}>{h.name}</option>)}</select></div>
            <div className="field"><label>Lid</label><select className="select" style={{ width: '100%' }} value={test.lid} onChange={(e) => setTest({ ...test, lid: Number(e.target.value) })}><option value={0}>Closed</option><option value={1}>Open</option></select></div>
            {[['temperature', 'Temperature °C'], ['humidity', 'Humidity %'], ['weight', 'Weight kg'], ['activity', 'Traffic /min'], ['sound', 'Hum Hz'], ['battery', 'Battery V']].map(([k, l]) => (
              <div className="field" key={k}><label htmlFor={`t-${k}`}>{l}</label><input id={`t-${k}`} className="input" type="number" step="0.1" value={test[k]} onChange={(e) => setTest({ ...test, [k]: e.target.value })} /></div>
            ))}
          </div>
          <pre className="code">{`POST ${window.location.origin}/api/ingest\n${JSON.stringify({ ...test, temperature: Number(test.temperature), weight: Number(test.weight) }, null, 1).replace(/\n\s+/g, ' ')}`}</pre>
          <div className="row"><button className="btn primary" onClick={send}><Send size={14} />Send reading</button>{res && <span className="small" style={{ color: res.ok ? 'var(--ok)' : 'var(--crit)' }}>{res.text}</span>}</div>
          <p className="faint small" style={{ marginTop: 10 }}>A temperature above the hive maximum raises an alert immediately.</p>
        </Panel>
      </div>

      <Panel title="Incoming readings" sub="Newest first" flush>
        <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}><table className="table">
          <thead><tr><th>Time</th><th>Hive</th><th>Apiary</th><th className="r">Weight</th><th className="r">Brood</th><th className="r">Humidity</th><th className="r">Traffic</th><th className="r">Hum Hz</th><th className="r">Battery</th></tr></thead>
          <tbody>{feed.slice(0, 40).map((r) => <tr key={r._id} className="flash-row"><td className="mono small nowrap">{fmtTime(r.createdAt, true)}</td><td><b>{r.hiveName}</b></td><td className="small">{r.farmName.replace('Rucher ', '')}</td><td className="r">{fmt('weight', r.weight, units)}</td><td className="r">{fmt('temperature', r.temperature, units)}</td><td className="r">{fmt('humidity', r.humidity, units)}</td><td className="r">{r.activity}</td><td className="r">{r.sound}</td><td className="r">{fmt('battery', r.battery)}</td></tr>)}</tbody>
        </table>{!feed.length && <div className="empty">Waiting for the first reading.</div>}</div>
      </Panel>
    </div>
  );
}
