import mongoose, { Document, Schema } from 'mongoose';
import { DocumentCategory } from '@hrx/shared';

export interface IDocumentRecord extends Document {
  employeeId: mongoose.Types.ObjectId;
  title: string;
  category: DocumentCategory;
  fileUrl: string;
  filePublicId?: string;
  mimeType: string;
  fileSize: number;
  uploaderId: mongoose.Types.ObjectId;
  isConfidential: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocumentRecord>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(DocumentCategory),
      default: DocumentCategory.OTHER_HR_DOCUMENT,
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploaderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ employeeId: 1, category: 1 });

export const DocumentModel = mongoose.model<IDocumentRecord>('Document', documentSchema);
