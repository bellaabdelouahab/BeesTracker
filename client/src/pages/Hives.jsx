import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Empty, ErrorBox, Hex, PageHead, Panel, Seg, Skeleton, StatusTag } from '../components/ui';
import useApi from '../lib/useApi';
import useNow from '../lib/useNow';
import { api } from '../api';
import { withLive } from '../context/Data';
import { useLive } from '../context/Live';
import { usePrefs } from '../context/Prefs';
import { fmt, signed, timeAgo } from '../lib/format';

const RANK = { critical: 0, offline: 1, warning: 2, online: 3 };

export default function Hives() {
  const { latest } = useLive();
  const { units, refresh } = usePrefs();
  const now = useNow(5000);
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(() => api.hives(), [], { interval: refresh });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [farm, setFarm] = useState('all');
  const [sort, setSort] = useState('name');

  const rows = useMemo(() => (data || []).map((h) => withLive(h, latest)), [data, latest]);
  const farms = useMemo(() => [...new Map(rows.map((h) => [h.farmId, h.farmName])).entries()], [rows]);
  const list = useMemo(() => {
    const f = rows.filter((h) => `${h.name} ${h.farmName} ${h.breed}`.toLowerCase().includes(q.toLowerCase()) && (status === 'all' || (status === 'attention' ? h.status !== 'online' : h.status === status)) && (farm === 'all' || String(h.farmId) === farm));
    const key = { name: (h) => h.id, weight: (h) => -(h.last?.weight ?? 0), delta: (h) => -(h.stats?.weight.delta ?? -99), temp: (h) => -(h.last?.temperature ?? 0), status: (h) => RANK[h.status] };
    return [...f].sort((a, b) => key[sort](a) - key[sort](b));
  }, [rows, q, status, farm, sort]);

  if (error && !data) return <div className="page"><ErrorBox error={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHead title="Hives" sub={`${rows.length} hives across ${farms.length} apiaries.`} />
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ink-3)' }} />
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Search hive, apiary, breed" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search hives" />
        </div>
        <select className="select" value={farm} onChange={(e) => setFarm(e.target.value)} aria-label="Apiary"><option value="all">All apiaries</option>{farms.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <Seg value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'online', label: 'Healthy' }, { value: 'attention', label: 'Attention' }, { value: 'offline', label: 'Offline' }]} />
        <span className="spacer" />
        <label className="row small muted" style={{ gap: 8 }}>Sort
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}><option value="name">Hive</option><option value="weight">Weight</option><option value="delta">24 h change</option><option value="temp">Temperature</option><option value="status">Status</option></select>
        </label>
      </div>
      <Panel flush>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Hive</th><th>Apiary</th><th>Status</th><th className="r">Weight</th><th className="r">24 h</th><th className="r">Brood</th><th className="r">Humidity</th><th className="r">Traffic</th><th className="r">Hum Hz</th><th className="r">Battery</th><th>Seen</th></tr></thead>
          <tbody>
            {loading && !data && [1, 2, 3, 4].map((i) => <tr key={i}><td colSpan={11}><Skeleton h={20} /></td></tr>)}
            {list.map((h) => (
              <tr key={h.id} className="click" onClick={() => nav(`/hives/${h.id}`)}>
                <td><span className="row" style={{ gap: 8 }}><Hex status={h.status} /><b style={{ font: '600 17px var(--display)', letterSpacing: '0.06em' }}>{h.name}</b></span></td>
                <td>{h.farmName.replace('Rucher ', '')}</td>
                <td><StatusTag status={h.status} />{h.openAlerts > 0 && <span className="tag crit" style={{ marginLeft: 6 }}>{h.openAlerts}</span>}</td>
                <td className="r">{fmt('weight', h.last?.weight, units)}</td>
                <td className="r" style={{ color: (h.stats?.weight.delta ?? 0) >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{signed(h.stats?.weight.delta)}</td>
                <td className="r">{fmt('temperature', h.last?.temperature, units)}°</td><td className="r">{fmt('humidity', h.last?.humidity, units)}%</td>
                <td className="r">{h.last?.activity ?? '--'}</td><td className="r">{h.last?.sound ?? '--'}</td><td className="r">{fmt('battery', h.last?.battery)} V</td>
                <td className="small faint nowrap">{timeAgo(h.last?.createdAt, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>{data && !list.length && <Empty title="No hive matches">Change the filters above.</Empty>}</div>
      </Panel>
    </div>
  );
}
