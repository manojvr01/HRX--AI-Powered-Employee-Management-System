import mongoose, { Document, Schema } from 'mongoose';

export interface IHolidayDocument extends Document {
  name: string;
  date: string; // YYYY-MM-DD
  year: number;
  description?: string;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const holidaySchema = new Schema<IHolidayDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
      default: () => new Date().getFullYear(),
    },
    description: {
      type: String,
      trim: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

holidaySchema.index({ year: 1, date: 1 });

export const Holiday = mongoose.model<IHolidayDocument>('Holiday', holidaySchema);
