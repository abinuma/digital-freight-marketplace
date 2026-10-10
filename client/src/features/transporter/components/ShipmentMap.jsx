import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router-dom';

const defaultCenter = [8.9806, 38.7578];

export function ShipmentMap({ shipments }) {
  const first = shipments.find((shipment) => shipment.pickupLat != null && shipment.pickupLng != null);
  const center = first ? [first.pickupLat, first.pickupLng] : defaultCenter;
  return <MapContainer center={center} zoom={first ? 6 : 5} scrollWheelZoom={false} className="transporter-map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{shipments.flatMap((shipment) => [
    shipment.pickupLat != null && shipment.pickupLng != null ? <CircleMarker key={`${shipment.id}-pickup`} center={[shipment.pickupLat, shipment.pickupLng]} radius={8} pathOptions={{ color: '#2446b8', fillColor: '#5574d2', fillOpacity: .8 }}><Popup><strong>Pickup: {shipment.pickupLocation}</strong><br />to {shipment.deliveryLocation}<br /><Link to={`/transporter/shipments/${shipment.id}`}>View shipment</Link></Popup></CircleMarker> : null,
    shipment.deliveryLat != null && shipment.deliveryLng != null ? <CircleMarker key={`${shipment.id}-delivery`} center={[shipment.deliveryLat, shipment.deliveryLng]} radius={7} pathOptions={{ color: '#b97414', fillColor: '#e5ad52', fillOpacity: .85 }}><Popup><strong>Delivery: {shipment.deliveryLocation}</strong><br />from {shipment.pickupLocation}<br /><Link to={`/transporter/shipments/${shipment.id}`}>View shipment</Link></Popup></CircleMarker> : null,
  ])}</MapContainer>;
}
