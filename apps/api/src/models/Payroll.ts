import mongoose, { Document, Schema } from 'mongoose';
import { PayrollStatus } from '@hrx/shared';

export interface IPayrollDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayrollDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(PayrollStatus),
      default: PayrollStatus.DRAFT,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ employeeId: 1, year: 1, month: 1 }, { unique: true });

export const Payroll = mongoose.model<IPayrollDocument>('Payroll', payrollSchema);
