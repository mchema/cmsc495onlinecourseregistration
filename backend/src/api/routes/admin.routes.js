import { Router } from 'express';
import AdminController from '../controllers/admin.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.middleware.js';
import { addUserSchema, setUserRoleSchema, getAllUsersQuerySchema } from '../schemas/admin.schemas.js';
import { idParamSchema } from '../schemas/common.schema.js';

const router = Router();
const adminController = new AdminController();

// Apply auth + first-login to all admin routes
router.use(authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'));

// Admin-only routes
router.post('/users', validateBody(addUserSchema), adminController.addUser);
router.patch('/users/:id/role', validateParams(idParamSchema), validateBody(setUserRoleSchema), adminController.setUserRole);
router.delete('/users/:id', validateParams(idParamSchema), adminController.removeUser);
router.get('/users/:id', validateParams(idParamSchema), adminController.getUserByID);
router.get('/users', validateQuery(getAllUsersQuerySchema), adminController.getAllUsers);

export default router;
