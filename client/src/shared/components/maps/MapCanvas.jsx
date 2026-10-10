import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { Link } from 'react-router-dom';

const addisAbaba = [8.9806, 38.7578];

function ClickHandler({ onPick }) {
  useMapEvents({ click(event) { onPick?.({ lat: event.latlng.lat, lng: event.latlng.lng }); } });
  return null;
}

export function MapCanvas({ points = [], center = addisAbaba, zoom = 6, scrollWheelZoom = false, onPick, className = '' }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={scrollWheelZoom} className={`shared-map ${className}`.trim()}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onPick={onPick} />
      {points.map((point) => <CircleMarker key={point.id} center={Array.isArray(point.position) ? point.position : [point.position.lat, point.position.lng]} radius={point.radius || 8} pathOptions={{ color: point.color || '#2446b8', fillColor: point.fillColor || '#5574d2', fillOpacity: .82 }}>
        {(point.title || point.description || point.href) && <Popup>{point.title && <strong>{point.title}</strong>}{point.description && <><br />{point.description}</>}{point.href && <><br /><Link to={point.href}>{point.linkText || 'View details'}</Link></>}</Popup>}
      </CircleMarker>)}
    </MapContainer>
  );
}
