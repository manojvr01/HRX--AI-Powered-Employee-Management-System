import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveBalanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveTypeId: mongoose.Types.ObjectId;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalanceDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    leaveTypeId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
      index: true,
    },
    allocatedDays: {
      type: Number,
      required: true,
      default: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
    },
    pendingDays: {
      type: Number,
      default: 0,
    },
    remainingDays: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

export const LeaveBalance = mongoose.model<ILeaveBalanceDocument>('LeaveBalance', leaveBalanceSchema);
