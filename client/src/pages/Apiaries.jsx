import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ErrorBox, Hex, PageHead, Panel, Skeleton, StatusTag } from '../components/ui';
import { farmStatsLive } from '../lib/farm';
import { useData } from '../context/Data';
import { useLive } from '../context/Live';
import { usePrefs } from '../context/Prefs';
import { fmt, signed } from '../lib/format';

export default function Apiaries() {
  const { data, error, loading, reload } = useData();
  const { latest } = useLive();
  const { units } = usePrefs();
  if (error && !data) return <div className="page"><ErrorBox error={error} onRetry={reload} /></div>;
  return (
    <div className="page">
      <PageHead title="Apiaries" sub="Each apiary is a site with its own forage, altitude and set of hives." />
      <div className="grid g2">
        {loading && !data && [1, 2].map((i) => <Skeleton key={i} h={380} />)}
        {data?.farms.map((f) => {
          const s = farmStatsLive(f, latest);
          return (
            <Panel key={f.id} flush>
              <div className="apiary__photo" style={{ backgroundImage: `linear-gradient(180deg, #17120a00 35%, #17120acc), url(${f.image})` }}>
                <div className="row between top"><span className="onphoto"><StatusTag status={f.status} /></span><span className="tag amber onphoto">{f.altitude} m</span></div>
                <div><h2 style={{ color: '#fff', fontSize: 30 }}>{f.name}</h2><div className="small" style={{ color: '#e3d9b9' }}>{f.adress}</div></div>
              </div>
              <div className="panel__body stack" style={{ gap: 16 }}>
                <p className="muted">{f.description}</p>
                <div className="apiary__nums">
                  <div><small>Hives</small><span className="num">{f.hives.length}</span></div>
                  <div><small>Brood temp</small><span className="num">{fmt('temperature', s.avgTemp, units)}°</span></div>
                  <div><small>Weight</small><span className="num">{fmt('weight', s.totalWeight, units)}<i>{units === 'imperial' ? 'lb' : 'kg'}</i></span></div>
                  <div><small>24 h</small><span className="num" style={{ color: f.weightDelta >= 0 ? 'var(--ok)' : 'var(--crit)' }}>{f.weightDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />} {signed(f.weightDelta)}</span></div>
                </div>
                <div className="hexgrid">
                  {s.hives.map((h) => (
                    <Link key={h.id} to={`/hives/${h.id}`} className="hexcell" title={`${h.name}: ${h.status}`}>
                      <Hex status={h.status} size={12} /><b>{h.name}</b><span className="mono small">{fmt('weight', h.last?.weight, units)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
