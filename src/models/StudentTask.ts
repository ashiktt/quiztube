import mongoose, { Schema, Document, Model } from 'mongoose';
import { TaskPriority, TaskStatus } from '@/types/assistant';

export interface IStudentTask extends Document {
  eventId?: mongoose.Types.ObjectId | string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedMinutes?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentTaskSchema = new Schema<IStudentTask>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentEvent',
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

StudentTaskSchema.index({ userId: 1, dueDate: 1 });
StudentTaskSchema.index({ userId: 1, status: 1 });

export const StudentTask: Model<IStudentTask> =
  mongoose.models.StudentTask || mongoose.model<IStudentTask>('StudentTask', StudentTaskSchema);
