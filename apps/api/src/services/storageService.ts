import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { UnauthorizedError, NotFoundError } from '../utils/errors.js';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'documents');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface StoredFileResult {
  fileUrl: string;
  filePublicId?: string;
  storageProvider: 'cloudinary' | 'local';
}

export async function storeFile(
  buffer: Buffer,
  safeFilename: string,
  mimeType: string
): Promise<StoredFileResult> {
  if (hasCloudinary) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hrx/documents',
          resource_type: 'auto',
          type: 'authenticated', // Private authenticated upload
          public_id: path.parse(safeFilename).name,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary upload failed'));
          } else {
            resolve({
              fileUrl: result.secure_url,
              filePublicId: result.public_id,
              storageProvider: 'cloudinary',
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  // Local storage fallback
  const targetPath = path.join(UPLOAD_DIR, safeFilename);
  await fs.promises.writeFile(targetPath, buffer);

  return {
    fileUrl: `/api/v1/documents/files/${safeFilename}`,
    filePublicId: safeFilename,
    storageProvider: 'local',
  };
}

export async function removeFile(filePublicId?: string): Promise<void> {
  if (!filePublicId) return;

  if (hasCloudinary && filePublicId.startsWith('hrx/')) {
    try {
      await cloudinary.uploader.destroy(filePublicId, { type: 'authenticated' });
    } catch {
      // Ignore removal error
    }
    return;
  }

  // Local storage deletion
  const targetPath = path.join(UPLOAD_DIR, filePublicId);
  if (fs.existsSync(targetPath)) {
    try {
      await fs.promises.unlink(targetPath);
    } catch {
      // Ignore
    }
  }
}

/**
 * Creates a signed short-lived download token valid for 5 minutes (300 seconds).
 */
export function generateSignedDownloadToken(documentId: string, userId: string): string {
  return jwt.sign(
    { docId: documentId, sub: userId, purpose: 'doc_download' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
}

/**
 * Verifies a short-lived download token.
 */
export function verifyDownloadToken(token: string): { docId: string; sub: string } {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      docId: string;
      sub: string;
      purpose: string;
    };
    if (payload.purpose !== 'doc_download') {
      throw new UnauthorizedError('Invalid download token purpose');
    }
    return { docId: payload.docId, sub: payload.sub };
  } catch (err: any) {
    throw new UnauthorizedError(err?.message || 'Download link expired or invalid');
  }
}

/**
 * Retrieves the local absolute file path for streaming.
 */
export function getLocalFilePath(filePublicId: string): string {
  const filePath = path.join(UPLOAD_DIR, filePublicId);
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('File not found on storage server');
  }
  return filePath;
}
