import mongoose, { Document, Schema } from 'mongoose';
import { EmployeeStatus } from '@hrx/shared';

export interface IEmployeeDocument extends Document {
  userId?: mongoose.Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  departmentId?: mongoose.Types.ObjectId;
  position: string;
  managerId?: mongoose.Types.ObjectId;
  joiningDate: string; // YYYY-MM-DD
  status: EmployeeStatus;
  avatarUrl?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  salary?: {
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployeeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    joiningDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.ACTIVE,
      required: true,
      index: true,
    },
    avatarUrl: {
      type: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ departmentId: 1, status: 1 });
employeeSchema.index({ firstName: 'text', lastName: 'text', position: 'text' });

export const Employee = mongoose.model<IEmployeeDocument>('Employee', employeeSchema);
