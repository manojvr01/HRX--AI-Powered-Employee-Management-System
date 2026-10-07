import { Request, Response, NextFunction } from 'express';
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteOrDeactivateEmployee,
} from './employeeService.js';
import { UnauthorizedError } from '../../utils/errors.js';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const result = await listEmployees(req.user, req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await getEmployeeById(req.params.id as string, req.user);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await createEmployee(req.body, req.user, req);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    const data = await updateEmployee(req.params.id as string, req.body, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError();
    await deleteOrDeactivateEmployee(req.params.id as string, req.user, req);
    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (err) {
    next(err);
  }
}
