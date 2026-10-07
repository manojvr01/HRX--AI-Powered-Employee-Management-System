import { Request, Response, NextFunction } from 'express';
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './departmentService.js';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listDepartments();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getDepartmentById(req.params.id as string);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await createDepartment(req.body, req);
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await updateDepartment(req.params.id as string, req.body, req);
    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteDepartment(req.params.id as string, req);
    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully',
    });
  } catch (err) {
    next(err);
  }
}
