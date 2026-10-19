import mongoose, { Schema, Document, Model } from 'mongoose';
import { ReminderChannel, ReminderStatus } from '@/types/assistant';

export interface IStudentReminder extends Document {
  eventId: mongoose.Types.ObjectId | string;
  userId: string;
  offsetMinutes: number;
  scheduledAt: Date;
  timezone: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  attemptCount: number;
  lastError?: string;
  deliveredAt?: Date;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentReminderSchema = new Schema<IStudentReminder>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentEvent',
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    offsetMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    channel: {
      type: String,
      enum: ['in_app', 'email'],
      default: 'in_app',
    },
    status: {
      type: String,
      enum: ['scheduled', 'delivered', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    deliveredAt: {
      type: Date,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

StudentReminderSchema.index({ status: 1, scheduledAt: 1 });
StudentReminderSchema.index({ userId: 1, scheduledAt: 1 });
StudentReminderSchema.index({ eventId: 1, offsetMinutes: 1, channel: 1 });

export const StudentReminder: Model<IStudentReminder> =
  mongoose.models.StudentReminder || mongoose.model<IStudentReminder>('StudentReminder', StudentReminderSchema);
