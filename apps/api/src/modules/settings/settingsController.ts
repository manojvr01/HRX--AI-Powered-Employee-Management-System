import { Request, Response, NextFunction } from 'express';
import {
  getSettings,
  updateSettings,
  listHolidays,
  createHoliday,
  deleteHoliday,
} from './settingsService.js';

export async function handleGetSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getSettings();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await updateSettings(req.body, req);
    res.status(200).json({
      success: true,
      message: 'Organization settings updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleListHolidays(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const data = await listHolidays(year);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateHoliday(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await createHoliday(req.body, req);
    res.status(201).json({
      success: true,
      message: 'Holiday added successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteHoliday(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await deleteHoliday(req.params.id as string, req);
    res.status(200).json({
      success: true,
      message: 'Holiday removed successfully',
    });
  } catch (err) {
    next(err);
  }
}
