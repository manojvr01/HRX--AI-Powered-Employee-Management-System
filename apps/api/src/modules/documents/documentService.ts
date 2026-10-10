import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { DocumentModel, IDocumentRecord } from '../../models/Document.js';
import { Employee } from '../../models/Employee.js';
import { User } from '../../models/User.js';
import { AuthenticatedUser } from '../../middleware/auth.js';
import { UserRole, DocumentCategory } from '@hrx/shared';
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors.js';
import {
  validateMagicBytes,
  sanitizeFilename,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from '../../utils/fileValidation.js';
import {
  storeFile,
  removeFile,
  generateSignedDownloadToken,
  verifyDownloadToken,
  getLocalFilePath,
} from '../../services/storageService.js';
import { logAudit } from '../../services/auditService.js';
import { createAndSendNotification } from '../../services/notificationService.js';

export async function uploadDocument(
  uploader: AuthenticatedUser,
  file: Express.Multer.File | undefined,
  data: {
    employeeId: string;
    title: string;
    category: DocumentCategory;
    isConfidential?: boolean;
  },
  req?: Request
): Promise<IDocumentRecord> {
  if (!file) {
    throw new ValidationError('File upload is required');
  }

  // File size validation (5MB max)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed size of 5 MB`
    );
  }

  // Mime type allowlist validation
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Unsupported file type: ${file.mimetype}. Permitted types are PDF, PNG, and JPEG`
    );
  }

  // Magic bytes / file signature validation (blocks disguised malicious files)
  validateMagicBytes(file.buffer, file.mimetype);

  // Filename sanitization
  const { safeFilename } = sanitizeFilename(file.originalname);

  // Authorization check: Employees and Managers can only upload documents for themselves
  if (uploader.role === UserRole.EMPLOYEE || uploader.role === UserRole.MANAGER) {
    if (data.employeeId !== uploader.employeeId) {
      throw new ForbiddenError('You can only upload documents to your own profile');
    }
  }

  const employee = await Employee.findById(data.employeeId);
  if (!employee) throw new NotFoundError('Target employee profile not found');

  // Store file securely
  const storageResult = await storeFile(file.buffer, safeFilename, file.mimetype);

  const isConfidential =
    uploader.role === UserRole.ADMIN || uploader.role === UserRole.HR
      ? Boolean(data.isConfidential)
      : false;

  const doc = await DocumentModel.create({
    employeeId: new mongoose.Types.ObjectId(data.employeeId),
    title: data.title.trim(),
    category: data.category,
    fileUrl: storageResult.fileUrl,
    filePublicId: storageResult.filePublicId,
    mimeType: file.mimetype,
    fileSize: file.size,
    uploaderId: new mongoose.Types.ObjectId(uploader.id),
    isConfidential,
  });

  // Audit log
  await logAudit({
    userId: uploader.id,
    action: 'DOCUMENT_UPLOADED',
    entity: 'Document',
    entityId: doc._id.toString(),
    details: {
      employeeId: data.employeeId,
      title: data.title,
      category: data.category,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
    req,
  });

  // If HR/Admin uploaded for an employee, send a real-time notification
  if (
    (uploader.role === UserRole.ADMIN || uploader.role === UserRole.HR) &&
    data.employeeId !== uploader.employeeId
  ) {
    const employeeUser = await User.findOne({ employeeId: employee._id });
    if (employeeUser) {
      await createAndSendNotification({
        userId: employeeUser._id,
        title: 'New Document Uploaded',
        message: `A new document "${data.title}" has been uploaded to your profile.`,
        type: 'INFO',
        link: '/documents',
      });
    }
  }

  return doc;
}

export async function listDocuments(
  user: AuthenticatedUser,
  query: {
    employeeId?: string;
    category?: DocumentCategory;
    page?: number;
    limit?: number;
  }
) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (user.role === UserRole.EMPLOYEE || user.role === UserRole.MANAGER) {
    // Both Employee and Manager can only read their OWN documents (Per Agents.md 1.5)
    if (!user.employeeId) return { data: [], meta: { page: 1, limit, total: 0, totalPages: 0 } };
    filter.employeeId = new mongoose.Types.ObjectId(user.employeeId);
    filter.isConfidential = false;
  } else {
    // HR and Admin can view all or filter by employee
    if (query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(query.employeeId);
    }
  }

  if (query.category) {
    filter.category = query.category;
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter)
      .populate('employeeId', 'firstName lastName employeeCode email departmentId')
      .populate('uploaderId', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return {
    data: documents,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function generateDownloadUrl(
  user: AuthenticatedUser,
  documentId: string,
  req?: Request
): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found');

  // IDOR check: Non-HR/Admin users can only download their own documents
  if (user.role === UserRole.EMPLOYEE || user.role === UserRole.MANAGER) {
    if (doc.employeeId.toString() !== user.employeeId) {
      throw new ForbiddenError('You can only download documents assigned to your profile');
    }
    if (doc.isConfidential) {
      throw new ForbiddenError('Access to confidential document is restricted');
    }
  }

  const token = generateSignedDownloadToken(doc._id.toString(), user.id);

  await logAudit({
    userId: user.id,
    action: 'DOCUMENT_DOWNLOAD_REQUESTED',
    entity: 'Document',
    entityId: doc._id.toString(),
    req,
  });

  return {
    downloadUrl: `/api/v1/documents/download/${token}`,
    expiresInSeconds: 300,
  };
}

export async function downloadDocumentByToken(
  token: string,
  req: Request,
  res: Response
): Promise<void> {
  const { docId, sub } = verifyDownloadToken(token);

  const doc = await DocumentModel.findById(docId);
  if (!doc) throw new NotFoundError('Document not found');

  await logAudit({
    userId: sub,
    action: 'DOCUMENT_DOWNLOADED',
    entity: 'Document',
    entityId: doc._id.toString(),
    req,
  });

  if (doc.filePublicId && !doc.filePublicId.startsWith('hrx/')) {
    // Local secure storage streaming
    const filePath = getLocalFilePath(doc.filePublicId);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.title)}"`);
    res.sendFile(filePath);
  } else {
    // Cloudinary or remote storage redirect
    res.redirect(doc.fileUrl);
  }
}

export async function deleteDocument(
  user: AuthenticatedUser,
  documentId: string,
  req?: Request
): Promise<void> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found');

  // Authorization check: Only HR/Admin or document owner can delete
  if (user.role === UserRole.EMPLOYEE || user.role === UserRole.MANAGER) {
    if (doc.employeeId.toString() !== user.employeeId) {
      throw new ForbiddenError('You can only delete your own documents');
    }
    if (doc.isConfidential) {
      throw new ForbiddenError('Cannot delete confidential document');
    }
  }

  // Remove file from storage
  await removeFile(doc.filePublicId);

  // Delete DB record
  await DocumentModel.findByIdAndDelete(documentId);

  await logAudit({
    userId: user.id,
    action: 'DOCUMENT_DELETED',
    entity: 'Document',
    entityId: documentId,
    details: { title: doc.title, category: doc.category },
    req,
  });
}
