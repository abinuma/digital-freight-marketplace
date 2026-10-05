import { Router } from 'express';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/users/user.routes.js';

const router = Router();
router.use('/auth', authRouter);
router.use('/users', userRouter);

export default router;
