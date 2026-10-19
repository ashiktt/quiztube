import mongoose, { Schema, Document, Model } from 'mongoose';
import { AssistantActionStatus, AssistantActionType } from '@/types/assistant';

export interface IAssistantActionRun extends Document {
  userId: string;
  eventId?: mongoose.Types.ObjectId | string;
  actionType: AssistantActionType;
  payload: Record<string, unknown>;
  status: AssistantActionStatus;
  idempotencyKey: string;
  n8nExecutionId?: string;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssistantActionRunSchema = new Schema<IAssistantActionRun>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentEvent',
      index: true,
    },
    actionType: {
      type: String,
      enum: [
        'event.confirmed',
        'task.created',
        'reminders.create',
        'event.updated',
        'event.cancelled',
        'study_plan.suggested',
      ],
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'dispatched', 'completed', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    n8nExecutionId: {
      type: String,
      trim: true,
    },
    result: {
      type: Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: '',
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

AssistantActionRunSchema.index({ userId: 1, createdAt: -1 });

export const AssistantActionRun: Model<IAssistantActionRun> =
  mongoose.models.AssistantActionRun ||
  mongoose.model<IAssistantActionRun>('AssistantActionRun', AssistantActionRunSchema);
