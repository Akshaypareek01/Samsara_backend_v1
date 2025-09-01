import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const dietGenerationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true
    },
    generatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    nextGenerationDate: {
        type: Date,
        required: true
    },
    dietData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    pdfUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['generated', 'failed', 'pending'],
        default: 'pending'
    },
    errorMessage: {
        type: String,
        default: null
    },
    generationAttempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
dietGenerationSchema.index({ userId: 1, generatedAt: -1 });
dietGenerationSchema.index({ userId: 1, nextGenerationDate: 1 });

// Virtual for checking if user can generate diet
dietGenerationSchema.virtual('canGenerate').get(function() {
    return new Date() >= this.nextGenerationDate;
});

// Virtual for remaining days
dietGenerationSchema.virtual('remainingDays').get(function() {
    const now = new Date();
    const nextDate = this.nextGenerationDate;
    const diffTime = nextDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
});

// Ensure virtuals are serialized
dietGenerationSchema.set('toJSON', { virtuals: true });
dietGenerationSchema.set('toObject', { virtuals: true });

// Apply plugins
dietGenerationSchema.plugin(toJSON);
dietGenerationSchema.plugin(paginate);

// Static method to check if user can generate diet
dietGenerationSchema.statics.canUserGenerateDiet = async function(userId) {
    const latestGeneration = await this.findOne(
        { userId },
        {},
        { sort: { generatedAt: -1 } }
    );

    if (!latestGeneration) {
        return { canGenerate: true, remainingDays: 0, lastGeneration: null };
    }

    const canGenerate = new Date() >= latestGeneration.nextGenerationDate;
    const remainingDays = Math.max(0, Math.ceil((latestGeneration.nextGenerationDate - new Date()) / (1000 * 60 * 60 * 24)));

    return {
        canGenerate,
        remainingDays,
        lastGeneration: latestGeneration
    };
};

// Static method to create new diet generation record
dietGenerationSchema.statics.createDietGeneration = async function(userId) {
    const nextGenerationDate = new Date();
    nextGenerationDate.setDate(nextGenerationDate.getDate() + 15);

    return await this.create({
        userId,
        nextGenerationDate,
        status: 'pending'
    });
};

export const DietGeneration = mongoose.model('DietGeneration', dietGenerationSchema);
