import { MapCanvas } from '../../../shared/components/maps/MapCanvas.jsx';

const defaultCenter = [8.9806, 38.7578];

export function ShipmentMap({ shipments }) {
  const first = shipments.find((shipment) => shipment.pickupLat != null && shipment.pickupLng != null);
  const center = first ? [first.pickupLat, first.pickupLng] : defaultCenter;
  const points = shipments.flatMap((shipment) => [
    shipment.pickupLat != null && shipment.pickupLng != null ? { id: `${shipment.id}-pickup`, position: [shipment.pickupLat, shipment.pickupLng], title: `Pickup: ${shipment.pickupLocation}`, description: `To ${shipment.deliveryLocation}`, href: `/transporter/shipments/${shipment.id}`, linkText: 'View shipment' } : null,
    shipment.deliveryLat != null && shipment.deliveryLng != null ? { id: `${shipment.id}-delivery`, position: [shipment.deliveryLat, shipment.deliveryLng], title: `Delivery: ${shipment.deliveryLocation}`, description: `From ${shipment.pickupLocation}`, href: `/transporter/shipments/${shipment.id}`, linkText: 'View shipment', color: '#b97414', fillColor: '#e5ad52', radius: 7 } : null,
  ]).filter(Boolean);
  return <MapCanvas center={center} zoom={first ? 6 : 5} points={points} className="transporter-map" />;
}
