import { Router } from 'express';
import * as shipmentController from './shipment.controller.js';

const router = Router();

// Route handlers are added as each shipment capability is implemented.
router.use(shipmentController.notImplemented);

export default router;
