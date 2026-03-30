import { Router } from 'express';
import CourseController from '../controllers/course.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';

const router = Router();
const courseController = new CourseController();

// Public Course Routes
router.get('/:courseId', courseController.getCourseInfo);

// Protected Course Routes (Requires ADMIN authorization)
router.post('/', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), courseController.addNewCourse);
router.patch('/:courseId', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), courseController.updateCourse);
router.delete('/:courseId', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), courseController.removeCourse);

export default router;
