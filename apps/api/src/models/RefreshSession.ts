import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  family: string;
  isRevoked: boolean;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshSessionSchema = new Schema<IRefreshSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

refreshSessionSchema.index({ family: 1, isRevoked: 1 });
refreshSessionSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshSession = mongoose.model<IRefreshSessionDocument>(
  'RefreshSession',
  refreshSessionSchema
);
