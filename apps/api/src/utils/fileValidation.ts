import path from 'path';
import crypto from 'crypto';
import { ValidationError } from './errors.js';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

/**
 * Validates magic bytes (file signature) against expected MIME types to block disguised/tampered files.
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): void {
  if (!buffer || buffer.length < 4) {
    throw new ValidationError('File is empty or corrupted');
  }

  // PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
  const isPdf =
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  // PNG magic bytes: 0x89 0x50 0x4E 0x47
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  // JPEG magic bytes: 0xFF 0xD8 0xFF
  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  let actualMime: string | null = null;
  if (isPdf) actualMime = 'application/pdf';
  else if (isPng) actualMime = 'image/png';
  else if (isJpeg) actualMime = 'image/jpeg';

  if (!actualMime) {
    throw new ValidationError(
      'Invalid file content. Only PDF, PNG, and JPEG documents are permitted.'
    );
  }

  if (actualMime !== declaredMimeType && !(declaredMimeType === 'image/jpg' && actualMime === 'image/jpeg')) {
    throw new ValidationError(
      `File content signature (${actualMime}) does not match declared type (${declaredMimeType})`
    );
  }
}

/**
 * Sanitizes original filename:
 * - Strips directory traversal (.. / \\)
 * - Removes non-alphanumeric special characters
 * - Prepends a cryptographic random UUID to prevent collisions & overwrites
 */
export function sanitizeFilename(originalName: string): { safeFilename: string; cleanDisplayName: string } {
  // Extract base filename without path
  const basename = path.basename(originalName);
  const ext = path.extname(basename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError(`Unsupported file extension: ${ext}`);
  }

  // Clean the display name
  const nameWithoutExt = basename.slice(0, basename.length - ext.length);
  const sanitizedBase = nameWithoutExt
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);

  const cleanDisplayName = `${sanitizedBase || 'document'}${ext}`;
  const randomPrefix = crypto.randomUUID();
  const safeFilename = `${randomPrefix}_${cleanDisplayName}`;

  return { safeFilename, cleanDisplayName };
}
