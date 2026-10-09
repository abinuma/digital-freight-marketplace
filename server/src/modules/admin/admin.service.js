import * as shipmentService from '../shipment/shipment.service.js';

export function listShipments(user, query) {
  return shipmentService.listAdminShipments(user, query);
}

export function removeShipment(user, id) {
  return shipmentService.softRemoveShipment(user, id);
}
