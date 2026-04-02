import { Router } from 'express';
import SemesterController from '../controllers/semester.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams } from '../middleware/validateRequest.middleware.js';
import { semesterBodySchema } from '../schemas/semester.schema.js';
import { semesterIdParamSchema } from '../schemas/common.schema.js';

const router = Router();
const semesterController = new SemesterController();

router.get('/', semesterController.getAllSemesters);
router.get('/:semesterId', validateParams(semesterIdParamSchema), semesterController.getSemesterInfo);

router.use(authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'));

router.post('/', validateBody(semesterBodySchema), semesterController.addSemester);
router.delete('/:semesterId', validateParams(semesterIdParamSchema), semesterController.removeSemester);

export default router;
