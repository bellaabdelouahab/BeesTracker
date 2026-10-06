import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const WORST = { critical: 3, offline: 3, warning: 2, online: 1 };
const CLUSTER_BELOW = 15; // below this zoom the hives of one apiary collapse into a single numbered hexagon

const fitTo = (map, markers, focus) => {
  const pts = markers.map((m) => [m.lat, m.lng]);
  if (!pts.length) return;
  if (pts.length === 1) map.setView(pts[0], 16);
  else map.fitBounds(L.latLngBounds(pts), { padding: focus?.padding || [70, 70], maxZoom: 17 });
};

// frame once and again only when the set of hives changes: live data must never move the user's view
function Fit({ markers, focus }) {
  const map = useMap();
  const ref = useRef({ markers, focus });
  ref.current = { markers, focus };
  const key = markers.map((m) => m.id).sort().join('|') + (focus?.key || '');
  useEffect(() => { fitTo(map, ref.current.markers, ref.current.focus); }, [map, key]);
  return null;
}
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 17), { duration: 0.7 }); }, [map, target?.id, target?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
function Controls({ markers }) {
  const map = useMap();
  useEffect(() => {
    const on = () => map.scrollWheelZoom.enable(); const off = () => map.scrollWheelZoom.disable();
    map.on('click', on); map.on('mouseout', off);
    return () => { map.off('click', on); map.off('mouseout', off); };
  }, [map]);
  return <button type="button" className="map-fit" onClick={() => fitTo(map, markers)}>Fit all</button>;
}

// Hives of the same apiary overlap at low zoom, so they are grouped until the user zooms in.
function Markers({ markers, selected, onSelect, colors }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const icons = useRef(new Map());
  const cached = (key, build) => { if (!icons.current.has(key)) icons.current.set(key, build()); return icons.current.get(key); };
  const single = (m) => cached(`${m.color}|${m.label}|${selected === m.id}`, () => L.divIcon({ className: '', html: `<div class="hexpin ${selected === m.id ? 'sel' : ''}" style="--c:${m.color}"><span>${m.label ?? ''}</span></div>`, iconSize: [50, 44], iconAnchor: [25, 22] }));

  const groups = useMemo(() => {
    const g = {};
    markers.forEach((m) => { (g[m.group] = g[m.group] || { id: m.group, name: m.groupName, items: [] }).items.push(m); });
    return Object.values(g).map((x) => ({
      ...x, lat: x.items.reduce((a, m) => a + m.lat, 0) / x.items.length, lng: x.items.reduce((a, m) => a + m.lng, 0) / x.items.length,
      status: x.items.reduce((w, m) => (WORST[m.status] > WORST[w] ? m.status : w), 'online'),
    }));
  }, [markers]);

  if (zoom < CLUSTER_BELOW && groups.length && markers.every((m) => m.group != null)) {
    return groups.map((g) => (
      <Marker key={`g${g.id}`} position={[g.lat, g.lng]} zIndexOffset={500}
        icon={cached(`c|${g.status}|${g.items.length}|${g.name}`, () => L.divIcon({ className: '', html: `<div class="hexpin cluster" style="--c:${colors[g.status]}"><span>${g.items.length}</span><small>${g.name}</small></div>`, iconSize: [60, 53], iconAnchor: [30, 26] }))}
        eventHandlers={{ click: () => map.flyTo([g.lat, g.lng], 16, { duration: 0.7 }) }} />
    ));
  }
  return markers.map((m) => (
    <Marker key={m.id} position={[m.lat, m.lng]} icon={single(m)} eventHandlers={onSelect ? { click: () => onSelect(m.id) } : undefined}>
      {m.title && <Popup><b>{m.title}</b><div style={{ fontSize: 12, marginTop: 2 }}>{m.body}</div></Popup>}
    </Marker>
  ));
}

// street tiles come through our own server (/tiles), which caches them and talks to OpenStreetMap for us
const TILES = {
  osm: ['/tiles/{z}/{x}/{y}.png', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'],
  sat: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'Tiles &copy; Esri'],
};

/** markers: [{ id, lat, lng, color, status, label, title, body, group, groupName }] */
export default function MapView({ markers, height = '100%', selected, onSelect, focus, flyTo, satellite = false, colors }) {
  const first = useMemo(() => (markers[0] ? [markers[0].lat, markers[0].lng] : [30.47, -8.88]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const base = satellite ? 'sat' : 'osm';
  const [url, attribution] = TILES[base];
  return (
    <div className="mapbox" style={{ height, width: '100%' }}>
      <MapContainer center={first} zoom={9} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer key={base} url={url} attribution={attribution} maxZoom={19} />
        <Fit markers={markers} focus={focus} />
        <FlyTo target={flyTo} />
        <Controls markers={markers} />
        <Markers markers={markers} selected={selected} onSelect={onSelect} colors={colors} />
      </MapContainer>
    </div>
  );
}
