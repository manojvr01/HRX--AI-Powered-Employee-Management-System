import mongoose, { Document, Schema } from 'mongoose';

export interface IOrgSettingsDocument extends Document {
  companyName: string;
  timezone: string;
  lateThresholdMinutes: number;
  workWeekDays: number[];
  workDayStartHour: number;
  workDayEndHour: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const orgSettingsSchema = new Schema<IOrgSettingsDocument>(
  {
    companyName: {
      type: String,
      required: true,
      default: 'HRX Technologies',
    },
    timezone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },
    lateThresholdMinutes: {
      type: Number,
      required: true,
      default: 15,
    },
    workWeekDays: {
      type: [Number],
      required: true,
      default: [1, 2, 3, 4, 5], // Monday through Friday
    },
    workDayStartHour: {
      type: Number,
      required: true,
      default: 9,
    },
    workDayEndHour: {
      type: Number,
      required: true,
      default: 18,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
  },
  {
    timestamps: true,
  }
);

export const OrgSettings = mongoose.model<IOrgSettingsDocument>(
  'OrgSettings',
  orgSettingsSchema
);
