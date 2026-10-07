import mongoose, { Document, Schema } from 'mongoose';
import { PerformanceReviewStatus } from '@hrx/shared';

export interface IPerformanceReviewDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  reviewPeriod: string;
  ratings: {
    category: string;
    score: number;
    comments?: string;
  }[];
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  aiSummary?: string;
  status: PerformanceReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const performanceReviewSchema = new Schema<IPerformanceReviewDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewPeriod: {
      type: String,
      required: true,
      trim: true,
    },
    ratings: [
      {
        category: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
        comments: { type: String },
      },
    ],
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    strengths: { type: String },
    areasForImprovement: { type: String },
    goals: { type: String },
    aiSummary: { type: String },
    status: {
      type: String,
      enum: Object.values(PerformanceReviewStatus),
      default: PerformanceReviewStatus.DRAFT,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

performanceReviewSchema.index({ employeeId: 1, reviewPeriod: 1 });

export const PerformanceReview = mongoose.model<IPerformanceReviewDocument>(
  'PerformanceReview',
  performanceReviewSchema
);
