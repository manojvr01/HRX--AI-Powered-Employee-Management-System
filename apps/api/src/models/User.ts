import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, UserStatus } from '@hrx/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  employeeId?: mongoose.Types.ObjectId;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.EMPLOYEE,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1, status: 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);
