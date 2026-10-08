import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITutorConversation extends Document {
  id: string;
  userId?: string;
  title: string;
  messages: any[];
  context?: any;
  explanationMode: string;
  learningMode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TutorConversationSchema = new Schema<ITutorConversation>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
      default: null,
    },
    title: {
      type: String,
      default: 'Tutoring Session',
    },
    messages: {
      type: Array as any,
      default: [],
    },
    context: {
      type: Schema.Types.Mixed,
      default: null,
    },
    explanationMode: {
      type: String,
      default: 'simple',
    },
    learningMode: {
      type: String,
      default: 'direct',
    },
  },
  {
    timestamps: true,
  }
);

export const TutorConversation: Model<ITutorConversation> =
  mongoose.models.TutorConversation ||
  mongoose.model<ITutorConversation>('TutorConversation', TutorConversationSchema);
