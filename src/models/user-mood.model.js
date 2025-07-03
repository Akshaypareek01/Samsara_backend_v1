import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    mood: {
        type: String,
        required: true,
        enum: ['Happy', 'Sad', 'Angry', 'Anxious', 'Excited', 'Calm', 'Stressed', 'Energetic', 'Tired', 'Neutral']
    },
    note: {
        type: String,
        default: '' // Optional note for the mood
    }
}, {
    timestamps: true
});

// Create index for efficient queries
moodSchema.index({ userId: 1, createdAt: -1 });

export const Mood = mongoose.model('Mood', moodSchema); 