import { Router } from 'express';
import EnrollmentController from '../controllers/enrollment.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams } from '../middleware/validateRequest.middleware.js';
import { enrollmentCreateBodySchema, enrollmentUpdateBodySchema } from '../schemas/enrollment.schema.js';
import { enrollmentIdParamSchema } from '../schemas/common.schema.js';

const router = Router();
const enrollmentController = new EnrollmentController();

// Apply auth + first-login to all routes
router.use(authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN', 'STUDENT'));

// Protected Enrollment Routes (Requires ADMIN or STUDENT authorization)
router.get('/:enrollmentId', validateParams(enrollmentIdParamSchema), enrollmentController.getEnrollmentInfo);
router.post('/', validateBody(enrollmentCreateBodySchema), enrollmentController.addEnrollment);
router.patch('/:enrollmentId', validateParams(enrollmentIdParamSchema), validateBody(enrollmentUpdateBodySchema), enrollmentController.updateEnrollment);
router.delete('/:enrollmentId', authorizeRoles('ADMIN'), validateParams(enrollmentIdParamSchema), enrollmentController.removeEnrollment);

export default router;
