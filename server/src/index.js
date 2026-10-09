import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/users/user.routes.js';
import shipmentRouter from './modules/shipment/shipment.routes.js';
import bidRouter from './modules/bid/bid.routes.js';
import messagingRouter from './modules/messaging/messaging.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import { authenticate } from './shared/middleware/authenticate.js';
import { requireProfileComplete } from './shared/middleware/requireProfileComplete.js';

const router = Router();
router.use('/auth', authRouter);
router.use(authenticate, requireProfileComplete);
router.use('/users', userRouter);
router.use('/shipments', shipmentRouter);
router.use(bidRouter);
router.use(messagingRouter);
router.use(adminRouter);

export default router;
