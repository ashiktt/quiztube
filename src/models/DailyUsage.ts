import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyUsage extends Document {
  userId: string;
  usageDate: string;
  featureType: string;
  promptCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyUsageSchema = new Schema<IDailyUsage>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    usageDate: {
      type: String,
      required: true,
      index: true,
    },
    featureType: {
      type: String,
      required: true,
    },
    promptCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DailyUsageSchema.index({ userId: 1, usageDate: 1, featureType: 1 }, { unique: true });

export const DailyUsage: Model<IDailyUsage> =
  mongoose.models.DailyUsage ||
  mongoose.model<IDailyUsage>('DailyUsage', DailyUsageSchema);
