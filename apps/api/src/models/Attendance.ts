import mongoose, { Document, Schema } from 'mongoose';
import { AttendanceStatus } from '@hrx/shared';

export interface IAttendanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkInTime: Date;
  checkOutTime?: Date | null;
  durationMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendanceDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      default: AttendanceStatus.PRESENT,
      required: true,
      index: true,
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

// One attendance record per employee per workday
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

export const Attendance = mongoose.model<IAttendanceDocument>('Attendance', attendanceSchema);
