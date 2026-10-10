import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

const defaultCenter = [8.9806, 38.7578];

function LocationClickHandler({ value, onChange }) {
  useMapEvents({ click(event) { onChange({ lat: event.latlng.lat, lng: event.latlng.lng }); } });
  return value?.lat != null && value?.lng != null ? <CircleMarker center={[value.lat, value.lng]} radius={8} pathOptions={{ color: '#2446b8', fillColor: '#2446b8', fillOpacity: 0.8 }} /> : null;
}

export function LocationPicker({ label, value, onChange }) {
  const center = value?.lat != null && value?.lng != null ? [value.lat, value.lng] : defaultCenter;
  return <div className="shipper-map-field"><div className="shipper-map-field__head"><span>{label}</span><small>Click the map to set an optional pin</small></div><MapContainer center={center} zoom={value?.lat != null ? 12 : 6} scrollWheelZoom={false} className="shipper-map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><LocationClickHandler value={value} onChange={onChange} /></MapContainer>{value?.lat != null && <small className="shipper-coordinate">Pin: {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)} <button type="button" onClick={() => onChange({ lat: null, lng: null })}>Remove pin</button></small>}</div>;
}
