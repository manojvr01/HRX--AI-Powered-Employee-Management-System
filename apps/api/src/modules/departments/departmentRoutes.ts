import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from './departmentController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { validateObjectId } from '../../middleware/objectId.js';
import {
  Permission,
  createDepartmentSchema,
  updateDepartmentSchema,
} from '@hrx/shared';

const router = Router();

router.use(authenticate);

router.get('/', authorize(Permission.DEPARTMENTS_READ), getAll);
router.get('/:id', validateObjectId('id'), authorize(Permission.DEPARTMENTS_READ), getOne);
router.post(
  '/',
  authorize(Permission.DEPARTMENTS_MANAGE),
  validateBody(createDepartmentSchema),
  create
);
router.patch(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.DEPARTMENTS_MANAGE),
  validateBody(updateDepartmentSchema),
  update
);
router.delete(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.DEPARTMENTS_MANAGE),
  remove
);

export const departmentRoutes = router;
