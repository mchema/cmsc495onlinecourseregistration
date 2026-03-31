import { Router } from 'express';
import CourseController from '../controllers/course.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.middleware.js';
import { courseBodySchema, getAllCoursesQuerySchema } from '../schemas/course.schemas.js';
import { courseIdParamSchema } from '../schemas/common.schema.js';

const router = Router();
const courseController = new CourseController();

// Public Course Routes
router.get('/:courseId', validateParams(courseIdParamSchema), courseController.getCourseInfo);
router.get('/', validateQuery(getAllCoursesQuerySchema), courseController.getAllCourses);

// Apply auth + first-login + ADMIN role to all routes below
router.use(authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'));

// Protected Course Routes (Requires ADMIN authorization)
router.post('/', validateBody(courseBodySchema), courseController.addNewCourse);
router.patch('/:courseId', validateParams(courseIdParamSchema), validateBody(courseBodySchema), courseController.updateCourse);
router.delete('/:courseId', validateParams(courseIdParamSchema), courseController.removeCourse);

export default router;
