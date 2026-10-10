import { Router } from 'express';
import multer from 'multer';
import {
  handleUploadDocument,
  handleListDocuments,
  handleGenerateDownloadUrl,
  handleDownloadDocument,
  handleDeleteDocument,
} from './documentController.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { validateObjectId } from '../../middleware/objectId.js';
import { Permission } from '@hrx/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit in multer so custom 5MB validation triggers cleanly
  },
});

const router = Router();

// Public stream endpoint with short-lived cryptographic signed token
router.get('/download/:token', handleDownloadDocument);

// Authenticated endpoints
router.use(authenticate);

// List documents (scoping in service blocks IDOR)
router.get(
  '/',
  authorize(Permission.DOCUMENTS_READ_SELF),
  handleListDocuments
);

// Upload document (Employee can upload own, HR/Admin can upload for any)
router.post(
  '/upload',
  authorize(Permission.DOCUMENTS_READ_SELF),
  upload.single('file'),
  handleUploadDocument
);

// Generate signed download URL (valid for 5m)
router.get(
  '/:id/download-url',
  validateObjectId('id'),
  authorize(Permission.DOCUMENTS_READ_SELF),
  handleGenerateDownloadUrl
);

// Delete document
router.delete(
  '/:id',
  validateObjectId('id'),
  authorize(Permission.DOCUMENTS_READ_SELF),
  handleDeleteDocument
);

export const documentRoutes = router;
