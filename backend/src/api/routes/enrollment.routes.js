import { Router } from 'express';
import EnrollmentController from '../controllers/enrollment.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams } from '../middleware/validateRequest.middleware.js';
import { enrollmentBodySchema } from '../schemas/enrollment.schemas.js';
import { enrollmentIdParamSchema } from '../schemas/common.schema.js';

const router = Router();
const enrollmentController = new EnrollmentController();

// Apply auth + first-login to all routes
router.use(authMiddleware, firstLoginMiddleware());

// Public Enrollment Routes (Requires authentication)
router.get('/:enrollmentId', validateParams(enrollmentIdParamSchema), enrollmentController.getEnrollmentInfo);

// Protected Enrollment Routes (Requires ADMIN or STUDENT authorization)
router.post('/', validateBody(enrollmentBodySchema), authorizeRoles('ADMIN', 'STUDENT'), enrollmentController.addNewEnrollment);
router.delete('/:enrollmentId', validateParams(enrollmentIdParamSchema), authorizeRoles('ADMIN', 'STUDENT'), enrollmentController.removeEnrollment);

export default router;
