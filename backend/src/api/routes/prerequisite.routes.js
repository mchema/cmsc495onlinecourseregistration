import { Router } from 'express';
import PrerequisiteController from '../controllers/prerequisite.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams } from '../middleware/validateRequest.middleware.js';
import { courseIdParamSchema, prerequisiteIdParamSchema } from '../schemas/common.schema.js';
import { prerequisiteBodySchema } from '../schemas/prerequisite.schema.js';

const router = Router();
const prerequisiteController = new PrerequisiteController();

// Public Routes
router.get('/:courseId', validateParams(courseIdParamSchema), prerequisiteController.getPrerequisites);

// Protected Routes (Admin Only)
router.use(authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'));

router.post('/', validateBody(prerequisiteBodySchema), prerequisiteController.addPrerequisite);
router.delete('/:courseId/:prerequisiteId', validateParams(prerequisiteIdParamSchema), prerequisiteController.deletePrerequisite);

export default router;
