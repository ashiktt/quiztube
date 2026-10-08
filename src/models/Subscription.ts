import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscription extends Document {
  id: string;
  userId: string;
  plan: 'free' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  paymentProvider?: string;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  startDate?: Date;
  expiryDate?: Date;
  autoRenew?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'pro',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    paymentProvider: {
      type: String,
      default: 'razorpay',
    },
    orderId: {
      type: String,
      default: '',
    },
    paymentId: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
