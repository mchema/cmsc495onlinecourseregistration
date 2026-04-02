import { Router } from 'express';
import SectionController from '../controllers/section.controller.js';
import authMiddleware, { firstLoginMiddleware } from '../../middleware/auth.middleware.js';
import authorizeRoles from '../../middleware/rbac.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validateRequest.middleware.js';
import { generateAccessCodesBodySchema, getAllSectionsQuerySchema, revokeAccessCodesBodySchema, sectionBodySchema } from '../schemas/section.schemas.js';
import { courseIdParamSchema, sectionIdParamSchema } from '../schemas/common.schema.js';

const router = Router();
const sectionController = new SectionController();

// Public Section Routes
router.get('/courses/:courseId/sections', validateParams(courseIdParamSchema), validateQuery(getAllSectionsQuerySchema), sectionController.getAllSections);
router.get('/sections', validateQuery(getAllSectionsQuerySchema), sectionController.getAllSections);
router.get('/sections/:sectionId', validateParams(sectionIdParamSchema), sectionController.getSectionInfo);

// Protected Section Routes (Requires ADMIN authorization)
router.post('/courses/:courseId/sections', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), validateParams(courseIdParamSchema), validateBody(sectionBodySchema), sectionController.addSection);
router.patch('/sections/:sectionId', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), validateParams(sectionIdParamSchema), validateBody(sectionBodySchema), sectionController.updateSection);
router.delete('/sections/:sectionId', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN'), validateParams(sectionIdParamSchema), sectionController.removeSection);

// Protected Section Routes (Requires PROFESSOR or ADMIN authorization)
router.get('/sections/:sectionId/access-codes', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN', 'PROFESSOR'), validateParams(sectionIdParamSchema), sectionController.getAccessCodes);
router.post('/sections/:sectionId/access-codes', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN', 'PROFESSOR'), validateParams(sectionIdParamSchema), validateBody(generateAccessCodesBodySchema), sectionController.generateAccessCodes);
router.delete('/sections/:sectionId/access-codes', authMiddleware, firstLoginMiddleware(), authorizeRoles('ADMIN', 'PROFESSOR'), validateParams(sectionIdParamSchema), validateBody(revokeAccessCodesBodySchema), sectionController.revokeAccessCodes);
export default router;
