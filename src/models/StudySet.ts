import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudySet extends Document {
  id: string;
  userId?: string;
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationFormatted?: string;
  difficulty: string;
  overallSummary: string;
  keyTakeaways: string[];
  chapters: any[];
  questions: any[];
  flashcards: any[];
  cheatsheet?: any;
  attempts?: any[];
  createdAt: Date;
  updatedAt: Date;
}

const StudySetSchema = new Schema<IStudySet>(
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
    videoUrl: {
      type: String,
      default: '',
    },
    videoId: {
      type: String,
      default: '',
    },
    videoTitle: {
      type: String,
      default: 'Untitled Lecture',
    },
    channelTitle: {
      type: String,
      default: 'Educational Material',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    durationFormatted: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      default: 'medium',
    },
    overallSummary: {
      type: String,
      default: '',
    },
    keyTakeaways: {
      type: [String],
      default: [],
    },
    chapters: {
      type: Array as any,
      default: [],
    },
    questions: {
      type: Array as any,
      default: [],
    },
    flashcards: {
      type: Array as any,
      default: [],
    },
    cheatsheet: {
      type: Schema.Types.Mixed,
      default: null,
    },
    attempts: {
      type: Array as any,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const StudySet: Model<IStudySet> =
  mongoose.models.StudySet || mongoose.model<IStudySet>('StudySet', StudySetSchema);
