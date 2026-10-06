import { prisma } from '../../shared/db/prisma.js';

// Prisma access for the shipment module is kept in this repository layer.
export const shipmentRepository = prisma.shipment;
export const shipmentImageRepository = prisma.shipmentImage;
