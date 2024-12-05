import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
  // SimpleSwap API response fields
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['floating', 'fixed'],
    default: 'floating'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  currency_from: {
    type: String,
    required: true
  },
  currency_to: {
    type: String,
    required: true
  },
  amount_from: {
    type: String,
    required: true
  },
  expected_amount: {
    type: String
  },
  address_from: {
    type: String
  },
  address_to: {
    type: String,
    required: true
  },
  extra_id_from: {
    type: String
  },
  extra_id_to: {
    type: String
  },
  status: {
    type: String,
    enum: ['waiting', 'confirming', 'exchanging', 'sending', 'finished', 'failed', 'refunded', 'expired', 'locked'],
    default: 'waiting'
  },
  // Exchange rate information
  rate: {
    type: String
  },
  // Additional user-related fields
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional since anonymous users can create exchanges
  },
  // Locked transaction fields
  isLocked: {
    type: Boolean,
    default: false
  },
  originalCurrencyTo: {
    type: String
  },
  originalAddressTo: {
    type: String
  },
  originalExpectedAmount: {
    type: String
  },
  verificationCheckedAt: {
    type: Date
  },
  // Tracking fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // This will automatically update the updatedAt timestamp
});

// Create indexes for better query performance
exchangeSchema.index({ id: 1 }, { unique: true });
exchangeSchema.index({ userId: 1 });
exchangeSchema.index({ status: 1 });
exchangeSchema.index({ createdAt: 1 });
exchangeSchema.index({ isLocked: 1 });

const Exchange = mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);

export default Exchange;
