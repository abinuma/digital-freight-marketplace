import { MapCanvas } from '../../../shared/components/maps/MapCanvas.jsx';

export function LocationPicker({ label, value, onChange }) {
  const hasPoint = value?.lat != null && value?.lng != null;
  const point = hasPoint ? [{ id: `${label}-pin`, position: [value.lat, value.lng], title: label }] : [];
  const center = hasPoint ? [value.lat, value.lng] : [8.9806, 38.7578];
  return <div className="shipper-map-field"><div className="shipper-map-field__head"><span>{label}</span><small>Click the map to set an optional pin</small></div><MapCanvas points={point} center={center} zoom={hasPoint ? 12 : 6} onPick={onChange} className="shipper-map" />{hasPoint && <small className="shipper-coordinate">Pin: {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)} <button type="button" onClick={() => onChange({ lat: null, lng: null })}>Remove pin</button></small>}</div>;
}
