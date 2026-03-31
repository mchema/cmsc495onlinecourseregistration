import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validateRequest.middleware.js';
import { loginSchema, changePasswordSchema, updateUserSchema } from '../schemas/auth.schemas.js';

const router = Router();
const authController = new AuthController();

// Public Auth Routes
router.post('/login', validateBody(loginSchema), authController.login);

// Protected Auth/User Routes (Requires a valid token)
router.post('/logout', authMiddleware, firstLoginMiddleware(), authController.logout);
router.get('/me', authMiddleware, firstLoginMiddleware(), authController.getCurrentUser);
router.post('/change-password', authMiddleware, firstLoginMiddleware(), validateBody(changePasswordSchema), authController.changePassword);
router.post('/update-user', authMiddleware, firstLoginMiddleware(), validateBody(updateUserSchema), authController.updateUserInfo);

export default router;
