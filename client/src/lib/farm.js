import { withLive } from '../context/Data';

/** farm summary recomputed from live-overlaid hives */
export const farmStatsLive = (farm, latest) => {
  const hives = farm.hives.map((h) => withLive(h, latest));
  const live = hives.filter((h) => h.last && h.status !== 'offline');
  const avg = (k) => (live.length ? live.reduce((a, h) => a + h.last[k], 0) / live.length : null);
  return { hives, avgTemp: avg('temperature'), avgHum: avg('humidity'), totalWeight: live.reduce((a, h) => a + h.last.weight, 0) };
};
