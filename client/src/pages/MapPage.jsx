import { useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import MapView from '../components/MapView';
import HiveDrawer from '../components/HiveDrawer';
import { Hex, Seg, Skeleton } from '../components/ui';
import { useData, withLive } from '../context/Data';
import { useLive } from '../context/Live';
import { usePrefs } from '../context/Prefs';
import { STATUS_COLOR } from '../lib/metrics';
import { fmt, signed } from '../lib/format';

export default function MapPage() {
  const { data } = useData();
  const { latest } = useLive();
  const { units } = usePrefs();
  const [farm, setFarm] = useState('all');
  const [metric, setMetric] = useState('weight');
  const [selected, setSelected] = useState(null);
  const [fly, setFly] = useState(null);
  const [sat, setSat] = useState(false);

  const all = useMemo(() => (data?.farms || []).flatMap((f) => f.hives.map((h) => withLive({ ...h, farmName: f.name }, latest))), [data, latest]);
  const hives = all.filter((h) => farm === 'all' || String(h.farmId) === farm);
  const label = (h) => (h.last ? (metric === 'weight' ? fmt('weight', h.last.weight, units) : metric === 'temperature' ? `${fmt('temperature', h.last.temperature, units)}°` : String(h.last.activity)) : '--');
  const markers = hives.map((h) => ({ id: h.id, lat: h.lat, lng: h.lng, color: STATUS_COLOR[h.status], status: h.status, group: h.farmId, groupName: h.farmName.replace('Rucher ', ''), label: label(h), title: `${h.name} · ${h.farmName}`, body: h.last ? `${fmt('weight', h.last.weight, units, true)}, ${fmt('temperature', h.last.temperature, units, true)}` : 'no data' }));
  const k = data?.kpis;
  const pick = (id) => { setSelected(id); const h = all.find((x) => x.id === id); if (h) setFly({ id, lat: h.lat, lng: h.lng, nonce: Date.now() }); };

  return (
    <div className="mappage">
      <aside className="mappage__side">
        <div className="mappage__stats">
          <div><span className="num">{k ? k.hives : '-'}</span><small>hives</small></div>
          <div><span className="num">{k ? k.hivesOnline : '-'}</span><small>online</small></div>
          <div><span className="num" style={{ color: k && k.alertsCritical + k.alertsWarning ? 'var(--crit)' : undefined }}>{k ? k.alertsCritical + k.alertsWarning : '-'}</span><small>alerts</small></div>
        </div>
        <div className="mappage__tools">
          <select className="select" style={{ width: '100%' }} value={farm} onChange={(e) => setFarm(e.target.value)} aria-label="Apiary">
            <option value="all">All apiaries</option>
            {(data?.farms || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <Seg value={metric} onChange={setMetric} options={[{ value: 'weight', label: 'Weight' }, { value: 'temperature', label: 'Temp' }, { value: 'activity', label: 'Traffic' }]} />
        </div>
        <div className="mappage__list">
          {!data && [1, 2, 3, 4, 5].map((i) => <div key={i} style={{ padding: 12 }}><Skeleton h={28} /></div>)}
          {hives.map((h) => (
            <button key={h.id} className={`hiverow ${selected === h.id ? 'on' : ''}`} onClick={() => pick(h.id)}>
              <Hex status={h.status} />
              <span><b>{h.name}</b> <span className="faint small">{h.farmName.replace('Rucher ', '')}</span></span>
              <span className="num" style={{ fontSize: 18 }}>{fmt('weight', h.last?.weight, units)}<small className="faint" style={{ fontSize: 12 }}> {units === 'imperial' ? 'lb' : 'kg'}</small></span>
              <span className="mono small" style={{ color: 'var(--m-temperature)' }}>{fmt('temperature', h.last?.temperature, units)}°</span>
            </button>
          ))}
        </div>
        {k && <div className="mappage__foot small faint">Colony weight <b className="num" style={{ color: 'var(--ink)', fontSize: 16 }}>{fmt('weight', k.totalWeight, units)}</b> {units === 'imperial' ? 'lb' : 'kg'} · 24 h <b className="num" style={{ color: k.weightDelta >= 0 ? 'var(--ok)' : 'var(--crit)', fontSize: 16 }}>{signed(k.weightDelta)}</b></div>}
      </aside>
      <div className="mappage__map">
        <MapView markers={markers} selected={selected} onSelect={pick} flyTo={fly} satellite={sat} colors={STATUS_COLOR} />
        <button className="map-layer" onClick={() => setSat(!sat)} title="Switch base map"><Layers size={15} />{sat ? 'Map' : 'Satellite'}</button>
      </div>
      <HiveDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
