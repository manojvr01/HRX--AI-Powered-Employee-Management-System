import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveTypeDocument extends Document {
  name: string;
  code: string;
  daysAllowedPerYear: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leaveTypeSchema = new Schema<ILeaveTypeDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    daysAllowedPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveType = mongoose.model<ILeaveTypeDocument>('LeaveType', leaveTypeSchema);
