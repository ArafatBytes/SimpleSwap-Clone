import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fromCurrency: {
        type: String,
        required: true
    },
    toCurrency: {
        type: String,
        required: true
    },
    fromAmount: {
        type: Number,
        required: true
    },
    toAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed'],
        default: 'Pending'
    },
    fromAddress: {
        type: String,
        required: true
    },
    toAddress: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
exchangeSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Exchange = mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);

export default Exchange;
