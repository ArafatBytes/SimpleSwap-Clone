import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    email: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        required: true,
        enum: ['passport', 'nationalId', 'drivingLicense']
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    documentNumber: {
        type: String,
        required: true
    },
    frontImage: {
        type: String,  // URL/path to the stored image
        required: true
    },
    backImage: {
        type: String,  // URL/path to the stored image
        required: true
    },
    selfieImage: {
        type: String,  // URL/path to the stored image
        required: true
    },
    verificationStatus: {
        type: String,
        enum: ['Unverified', 'Pending', 'Verified', 'Rejected'],
        default: 'Unverified'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
verificationSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

const Verification = mongoose.models.Verification || mongoose.model('Verification', verificationSchema);

export default Verification;
