import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '@hrx/shared';

export interface IAnnouncementDocument extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorName?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  targetRole?: UserRole | 'ALL';
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncementDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH'],
      default: 'NORMAL',
      index: true,
    },
    targetRole: {
      type: String,
      default: 'ALL',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Announcement = mongoose.model<IAnnouncementDocument>(
  'Announcement',
  announcementSchema
);
