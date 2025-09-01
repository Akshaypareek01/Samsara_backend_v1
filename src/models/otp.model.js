import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      length: 4,
    },
    type: {
      type: String,
      enum: ['registration', 'login'],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired OTPs
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for email and type
otpSchema.index({ email: 1, type: 1 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
