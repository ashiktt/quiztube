import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISolvedExam extends Document {
  id: string;
  userId?: string;
  subject: string;
  academicLevel: string;
  totalMarks: number;
  rawQuestionsText: string;
  overallExamSummary: string;
  solutions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const SolvedExamSchema = new Schema<ISolvedExam>(
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
    subject: {
      type: String,
      default: 'University Examination',
    },
    academicLevel: {
      type: String,
      default: 'Undergraduate',
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    rawQuestionsText: {
      type: String,
      default: '',
    },
    overallExamSummary: {
      type: String,
      default: '',
    },
    solutions: {
      type: Array as any,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const SolvedExam: Model<ISolvedExam> =
  mongoose.models.SolvedExam || mongoose.model<ISolvedExam>('SolvedExam', SolvedExamSchema);
