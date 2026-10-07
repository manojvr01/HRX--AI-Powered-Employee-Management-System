import { Router, Request, Response, NextFunction } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
} from './employeeController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { validateObjectId } from '../../middleware/objectId.js';
import { ForbiddenError } from '../../utils/errors.js';
import {
  Permission,
  hasAnyPermission,
  createEmployeeSchema,
  updateEmployeeSchema,
} from '@hrx/shared';

const router = Router();

router.use(authenticate);

function authorizeAny(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }
    if (!hasAnyPermission(req.user.role, permissions)) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of: [${permissions.join(', ')}]`
        )
      );
    }
    next();
  };
}

router.get(
  '/',
  authorizeAny(Permission.EMPLOYEES_READ, Permission.EMPLOYEES_READ_SELF),
  getAll
);

router.get(
  '/:id',
  validateObjectId('id'),
  authorizeAny(Permission.EMPLOYEES_READ, Permission.EMPLOYEES_READ_SELF),
  getOne
);

router.post(
  '/',
  authorize(Permission.EMPLOYEES_CREATE),
  validateBody(createEmployeeSchema),
  create
);

router.patch(
  '/:id',
  validateObjectId('id'),
  authorizeAny(Permission.EMPLOYEES_EDIT, Permission.EMPLOYEES_READ_SELF),
  validateBody(updateEmployeeSchema),
  update
);

router.delete(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.EMPLOYEES_DELETE),
  remove
);

export const employeeRoutes = router;
