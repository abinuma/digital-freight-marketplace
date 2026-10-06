import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/users/user.routes.js';
import shipmentRouter from './modules/shipment/shipment.routes.js';
import { authenticate } from './shared/middleware/authenticate.js';
import { requireProfileComplete } from './shared/middleware/requireProfileComplete.js';

const router = Router();
router.use('/auth', authRouter);
router.use(authenticate, requireProfileComplete);
router.use('/users', userRouter);
router.use('/shipments', shipmentRouter);

export default router;
