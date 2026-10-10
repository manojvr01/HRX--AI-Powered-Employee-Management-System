import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicyDocument extends Document {
  title: string;
  category: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicyDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0',
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

policySchema.index({ category: 1, isActive: 1 });

export const Policy = mongoose.model<IPolicyDocument>('Policy', policySchema);
