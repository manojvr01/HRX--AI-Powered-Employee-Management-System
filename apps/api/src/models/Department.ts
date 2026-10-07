import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartmentDocument extends Document {
  name: string;
  code: string;
  description?: string;
  headId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartmentDocument>(
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
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    headId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
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

export const Department = mongoose.model<IDepartmentDocument>('Department', departmentSchema);
