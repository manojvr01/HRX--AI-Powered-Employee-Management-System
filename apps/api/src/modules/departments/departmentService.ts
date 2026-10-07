import { Department, IDepartmentDocument } from '../../models/Department.js';
import { Employee } from '../../models/Employee.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { logAudit } from '../../services/auditService.js';
import { Request } from 'express';
import mongoose from 'mongoose';

export async function listDepartments(): Promise<any[]> {
  const departments = await Department.find({ isActive: true })
    .populate('headId', 'firstName lastName email employeeCode')
    .sort({ name: 1 })
    .lean();

  // Aggregate employee counts per department
  const counts = await Employee.aggregate([
    { $match: { status: { $ne: 'TERMINATED' } } },
    { $group: { _id: '$departmentId', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  counts.forEach((c) => {
    if (c._id) countMap.set(c._id.toString(), c.count);
  });

  return departments.map((dept) => ({
    ...dept,
    employeeCount: countMap.get(dept._id.toString()) || 0,
  }));
}

export async function getDepartmentById(id: string): Promise<any> {
  const dept = await Department.findById(id)
    .populate('headId', 'firstName lastName email employeeCode')
    .lean();
  if (!dept) throw new NotFoundError('Department not found');

  const employeeCount = await Employee.countDocuments({
    departmentId: dept._id,
    status: { $ne: 'TERMINATED' },
  });

  return { ...dept, employeeCount };
}

export async function createDepartment(
  data: { name: string; code: string; description?: string; headId?: string },
  req?: Request
): Promise<IDepartmentDocument> {
  const existingName = await Department.findOne({
    name: { $regex: new RegExp(`^${data.name}$`, 'i') },
  });
  if (existingName) throw new ConflictError('Department with this name already exists');

  const existingCode = await Department.findOne({ code: data.code.toUpperCase() });
  if (existingCode) throw new ConflictError('Department with this code already exists');

  const dept = await Department.create({
    name: data.name,
    code: data.code.toUpperCase(),
    description: data.description,
    headId: data.headId ? new mongoose.Types.ObjectId(data.headId) : undefined,
    isActive: true,
  });

  await logAudit({
    userId: req?.user?.id,
    action: 'DEPARTMENT_CREATED',
    entity: 'Department',
    entityId: dept._id.toString(),
    details: { name: dept.name, code: dept.code },
    req,
  });

  return dept;
}

export async function updateDepartment(
  id: string,
  data: { name?: string; code?: string; description?: string; headId?: string; isActive?: boolean },
  req?: Request
): Promise<IDepartmentDocument> {
  const dept = await Department.findById(id);
  if (!dept) throw new NotFoundError('Department not found');

  if (data.name && data.name !== dept.name) {
    const existing = await Department.findOne({
      _id: { $ne: dept._id },
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });
    if (existing) throw new ConflictError('Department name already taken');
    dept.name = data.name;
  }

  if (data.code && data.code.toUpperCase() !== dept.code) {
    const existingCode = await Department.findOne({
      _id: { $ne: dept._id },
      code: data.code.toUpperCase(),
    });
    if (existingCode) throw new ConflictError('Department code already taken');
    dept.code = data.code.toUpperCase();
  }

  if (data.description !== undefined) dept.description = data.description;
  if (data.headId !== undefined) {
    dept.headId = data.headId ? new mongoose.Types.ObjectId(data.headId) : undefined;
  }
  if (data.isActive !== undefined) dept.isActive = data.isActive;

  await dept.save();

  await logAudit({
    userId: req?.user?.id,
    action: 'DEPARTMENT_UPDATED',
    entity: 'Department',
    entityId: dept._id.toString(),
    details: data,
    req,
  });

  return dept;
}

export async function deleteDepartment(id: string, req?: Request): Promise<void> {
  const dept = await Department.findById(id);
  if (!dept) throw new NotFoundError('Department not found');

  const employeesInDept = await Employee.countDocuments({
    departmentId: dept._id,
    status: { $ne: 'TERMINATED' },
  });

  if (employeesInDept > 0) {
    throw new ConflictError(
      `Cannot delete department: ${employeesInDept} active employee(s) are assigned to it. Reassign employees first.`
    );
  }

  // Soft deactivate
  dept.isActive = false;
  await dept.save();

  await logAudit({
    userId: req?.user?.id,
    action: 'DEPARTMENT_DEACTIVATED',
    entity: 'Department',
    entityId: dept._id.toString(),
    req,
  });
}
