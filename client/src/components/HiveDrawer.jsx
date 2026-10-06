import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, DoorOpen } from 'lucide-react';
import { Drawer, Hex, Skeleton, StatusTag } from './ui';
import Tile from './Tile';
import TimeChart from './TimeChart';
import useApi from '../lib/useApi';
import useNow from '../lib/useNow';
import { api } from '../api';
import { useLive } from '../context/Live';
import { withLive } from '../context/Data';
import { timeAgo } from '../lib/format';

const LEVEL = { good: 'ok', warn: 'warn', info: 'info' };

export default function HiveDrawer({ id, onClose }) {
  const { latest } = useLive();
  const now = useNow(5000);
  const { data: h } = useApi(() => api.hive(id), [id], { interval: 20, enabled: !!id });
  const { data: s } = useApi(() => api.streams(id, '24h'), [id], { interval: 30, enabled: !!id });
  const hive = useMemo(() => (h ? withLive(h, latest) : null), [h, latest]);
  const t = hive?.thresholds;
  return (
    <Drawer open={!!id} onClose={onClose} title={hive ? hive.name : 'Hive'} sub={hive ? `${hive.farmName} · ${hive.breed}` : ''}>
      {!hive && <><Skeleton h={90} /><Skeleton h={220} /></>}
      {hive && (
        <>
          <div className="row between">
            <span className="row" style={{ gap: 8 }}><Hex status={hive.status} live={hive.status === 'online'} /><StatusTag status={hive.status} /></span>
            <span className="small faint">{timeAgo(hive.last?.createdAt, now)}</span>
            <Link to={`/hives/${hive.id}`} className="btn sm primary" onClick={onClose}>Open hive<ArrowRight size={14} /></Link>
          </div>
          <div className="grid g2" style={{ gap: 12 }}>
            <Tile metric="weight" value={hive.last?.weight} lo={t.minWeight} hi={t.maxWeight} stats={hive.stats?.weight} />
            <Tile metric="temperature" value={hive.last?.temperature} lo={t.minTemperature} hi={t.maxTemperature} stats={hive.stats?.temperature} />
            <Tile metric="humidity" value={hive.last?.humidity} lo={t.minHumidity} hi={t.maxHumidity} stats={hive.stats?.humidity} />
            <Tile metric="activity" value={hive.last?.activity} extra={hive.last?.lid ? <span className="tag warn"><DoorOpen size={12} />lid open</span> : null} />
          </div>
          <div className="panel"><div className="panel__head"><h3 className="panel__title">Weight, 24 hours</h3></div>
            <div className="panel__body">{s?.points?.length ? <TimeChart points={s.points} metric="weight" height={190} mini limits={{ lo: t.minWeight, hi: t.maxWeight }} /> : <Skeleton h={190} />}</div></div>
          <div className="panel"><div className="panel__head"><h3 className="panel__title">Colony notes</h3></div>
            <div className="panel__body stack" style={{ gap: 10 }}>{h.insights.map((i, n) => (
              <div key={n} className="row top"><span className={`tag ${LEVEL[i.level]}`} style={{ marginTop: 2 }}>{i.level === 'good' ? 'ok' : i.level}</span><div><b>{i.title}</b><div className="muted small">{i.text}</div></div></div>
            ))}</div></div>
        </>
      )}
    </Drawer>
  );
}
