import mongoose, { Document, Schema } from 'mongoose';
import { LeaveRequestStatus } from '@hrx/shared';

export interface ILeaveRequestDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  leaveTypeId: mongoose.Types.ObjectId;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveRequestStatus;
  approverId?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  appliedAt: Date;
  actionedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequestDocument>(
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
    startDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    endDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    daysCount: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(LeaveRequestStatus),
      default: LeaveRequestStatus.PENDING,
      required: true,
      index: true,
    },
    approverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    actionedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index({ employeeId: 1, startDate: 1 });
leaveRequestSchema.index({ employeeId: 1, status: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequestDocument>('LeaveRequest', leaveRequestSchema);
