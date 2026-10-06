// What a healthy (and a not so healthy) hive looks like through its sensors.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const jit = (s) => (Math.random() * 2 - 1) * s;
const DAY = 864e5;

// Morocco local time (UTC+1)
const localHour = (t) => {
  const d = new Date(t);
  return (d.getUTCHours() + 1 + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600) % 24;
};
const wave = (t, seed, periodDays) => Math.sin((t / (periodDays * DAY)) * 2 * Math.PI + seed);

/**
 * profile: { tempBase, tempAmp, humBase, weightBase, flow (-1..1), peakActivity, soundBase, battBase, rssi, seed }
 * Bees keep the brood nest around 34-35 °C whatever the weather, weak colonies cannot.
 */
const sample = (p, t) => {
  const h = localHour(t);
  const sun = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));            // 0 at night, 1 at noon
  const forage = Math.max(0, Math.sin(((h - 7.5) / 10) * Math.PI)) ** 1.2; // foraging flight window
  const day = Math.sin(((h - 15) / 24) * 2 * Math.PI);
  const activity = Math.max(0, Math.round(p.peakActivity * forage * (0.85 + 0.3 * wave(t, p.seed + 1, 3)) + jit(forage * 6)));
  return {
    temperature: +(p.tempBase + p.tempAmp * day + 0.25 * wave(t, p.seed, 0.4) + jit(0.12)).toFixed(2),
    humidity: +clamp(p.humBase - 7 * day + 5 * wave(t, p.seed + 2, 2.7) + jit(0.8), 20, 95).toFixed(1),
    weight: +(p.weightBase + 2.4 * p.flow * wave(t, p.seed, 17) + 0.3 * Math.abs(p.flow) * Math.sin(((h - 6) / 24) * 2 * Math.PI) + jit(0.03)).toFixed(2),
    lid: 0,
    activity,
    sound: Math.round(p.soundBase + 22 * forage + jit(4)),
    battery: +(p.battBase + 0.32 * sun + jit(0.01)).toFixed(2),
    rssi: Math.round(p.rssi + jit(2)),
  };
};

module.exports = { sample, localHour, clamp, jit, DAY };
