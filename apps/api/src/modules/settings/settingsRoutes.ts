import { Router } from 'express';
import {
  handleGetSettings,
  handleUpdateSettings,
  handleListHolidays,
  handleCreateHoliday,
  handleDeleteHoliday,
} from './settingsController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateObjectId } from '../../middleware/objectId.js';
import { Permission } from '@hrx/shared';

const router = Router();

router.use(authenticate);

// Settings
router.get('/', authorize(Permission.SETTINGS_READ), handleGetSettings);
router.patch('/', authorize(Permission.SETTINGS_MANAGE), handleUpdateSettings);

// Holidays
router.get('/holidays', handleListHolidays);
router.post('/holidays', authorize(Permission.SETTINGS_MANAGE), handleCreateHoliday);
router.delete('/holidays/:id', validateObjectId('id'), authorize(Permission.SETTINGS_MANAGE), handleDeleteHoliday);

export const settingsRoutes = router;
