import { Request, Response, NextFunction } from 'express';
import {
  uploadDocument,
  listDocuments,
  generateDownloadUrl,
  downloadDocumentByToken,
  deleteDocument,
} from './documentService.js';
import { UnauthorizedError } from '../../utils/errors.js';

export async function handleUploadDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await uploadDocument(req.user, req.file, req.body, req);
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListDocuments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await listDocuments(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGenerateDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await generateDownloadUrl(req.user, req.params.id as string, req);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDownloadDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.params.token as string;
    await downloadDocumentByToken(token, req, res);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteDocument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    await deleteDocument(req.user, req.params.id as string, req);
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
