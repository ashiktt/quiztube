import mongoose, { Schema, Document, Model } from 'mongoose';
import { AcademicEventType, EventStatus } from '@/types/assistant';

export interface IStudentEvent extends Document {
  userId: string;
  title: string;
  eventType: AcademicEventType;
  description?: string;
  startAt: Date;
  endAt?: Date;
  timezone: string;
  location?: string;
  status: EventStatus;
  confidence: number;
  rawInputSnippet?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const StudentEventSchema = new Schema<IStudentEvent>(
  {
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
    eventType: {
      type: String,
      enum: ['exam', 'assignment', 'class', 'project_deadline', 'meeting', 'study_session', 'general'],
      default: 'general',
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    startAt: {
      type: Date,
      required: true,
      index: true,
    },
    endAt: {
      type: Date,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ['draft', 'needs_confirmation', 'confirmed', 'scheduled', 'completed', 'cancelled', 'rejected'],
      default: 'needs_confirmation',
      index: true,
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
    rawInputSnippet: {
      type: String,
      default: '',
      maxlength: 500,
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

StudentEventSchema.index({ userId: 1, startAt: 1 });
StudentEventSchema.index({ userId: 1, status: 1 });

export const StudentEvent: Model<IStudentEvent> =
  mongoose.models.StudentEvent || mongoose.model<IStudentEvent>('StudentEvent', StudentEventSchema);
