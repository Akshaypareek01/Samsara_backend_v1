import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const menopauseAssessmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true
    },
    assessmentDate: {
        type: Date,
        default: Date.now
    },
    answers: {
        irregularPeriods: {
            type: String,
            enum: ['Yes, frequently', 'Sometimes', 'Rarely', 'No, Never'],
            required: true
        },
        fatigue: {
            type: String,
            enum: ['Always tired', 'Often tired', 'Sometimes tired', 'Rarely tired'],
            required: true
        },
        weightChanges: {
            type: String,
            enum: ['Significant weight gain', 'Slight weight gain', 'Weight remains stable', 'Weight loss'],
            required: true
        },
        sleepQuality: {
            type: String,
            enum: ['Very poor sleep', 'Poor sleep', 'Average sleep', 'Good sleep'],
            required: true
        },
        moodSwings: {
            type: String,
            enum: ['Very frequently', 'Frequently', 'Sometimes', 'Never'],
            required: true
        }
    },
    scores: {
        irregularPeriodsScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        fatigueScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        weightChangesScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        sleepQualityScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        moodSwingsScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        }
    },
    totalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 15
    },
    averageScore: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    riskLevel: {
        type: String,
        enum: ['High Risk', 'Moderate Risk', 'Low-Moderate Risk', 'Low Risk'],
        required: true
    },
    riskDescription: {
        type: String,
        required: true
    },
    isLatest: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Apply plugins
menopauseAssessmentSchema.plugin(toJSON);
menopauseAssessmentSchema.plugin(paginate);

// Pre-save middleware to calculate scores and risk level
menopauseAssessmentSchema.pre('save', function(next) {
    // Calculate individual scores based on answers
    this.scores.irregularPeriodsScore = this.getScoreForAnswer(this.answers.irregularPeriods);
    this.scores.fatigueScore = this.getScoreForAnswer(this.answers.fatigue);
    this.scores.weightChangesScore = this.getScoreForAnswer(this.answers.weightChanges);
    this.scores.sleepQualityScore = this.getScoreForAnswer(this.answers.sleepQuality);
    this.scores.moodSwingsScore = this.getScoreForAnswer(this.answers.moodSwings);
    
    // Calculate total and average scores
    this.totalScore = this.scores.irregularPeriodsScore + this.scores.fatigueScore + 
                     this.scores.weightChangesScore + this.scores.sleepQualityScore + 
                     this.scores.moodSwingsScore;
    this.averageScore = this.totalScore / 5;
    
    // Determine risk level and description
    const { riskLevel, riskDescription } = this.calculateRiskLevel(this.averageScore);
    this.riskLevel = riskLevel;
    this.riskDescription = riskDescription;
    
    next();
});

// Method to get score for an answer (0-3 scale, higher index = lower risk)
menopauseAssessmentSchema.methods.getScoreForAnswer = function(answer) {
    const answerMappings = {
        // Irregular periods
        'Yes, frequently': 0,
        'Sometimes': 1,
        'Rarely': 2,
        'No, Never': 3,
        
        // Fatigue
        'Always tired': 0,
        'Often tired': 1,
        'Sometimes tired': 2,
        'Rarely tired': 3,
        
        // Weight changes
        'Significant weight gain': 0,
        'Slight weight gain': 1,
        'Weight remains stable': 2,
        'Weight loss': 3,
        
        // Sleep quality
        'Very poor sleep': 0,
        'Poor sleep': 1,
        'Average sleep': 2,
        'Good sleep': 3,
        
        // Mood swings
        'Very frequently': 0,
        'Frequently': 1,
        'Sometimes': 2,
        'Never': 3
    };
    
    return answerMappings[answer] || 0;
};

// Method to calculate risk level based on average score
menopauseAssessmentSchema.methods.calculateRiskLevel = function(averageScore) {
    let riskLevel, riskDescription;
    
    if (averageScore >= 2.5) {
        riskLevel = 'Low Risk';
        riskDescription = 'Your symptoms indicate a low risk of menopause-related issues. Continue maintaining a healthy lifestyle.';
    } else if (averageScore >= 1.5) {
        riskLevel = 'Low-Moderate Risk';
        riskDescription = 'You may be experiencing some menopause-related symptoms. Consider lifestyle adjustments and consult with healthcare providers if symptoms persist.';
    } else if (averageScore >= 0.5) {
        riskLevel = 'Moderate Risk';
        riskDescription = 'You are showing moderate signs of menopause-related symptoms. It is recommended to consult with a healthcare provider for proper guidance and management.';
    } else {
        riskLevel = 'High Risk';
        riskDescription = 'Your symptoms indicate a high risk of menopause-related issues. Immediate consultation with a healthcare provider is strongly recommended for proper assessment and treatment.';
    }
    
    return { riskLevel, riskDescription };
};

// Static method to get latest assessment for a user
menopauseAssessmentSchema.statics.getLatestAssessment = function(userId) {
    return this.findOne({ userId, isLatest: true }).sort({ createdAt: -1 });
};

// Static method to get assessment history for a user
menopauseAssessmentSchema.statics.getAssessmentHistory = function(userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

// Static method to mark previous assessments as not latest
menopauseAssessmentSchema.statics.markPreviousAsNotLatest = function(userId) {
    return this.updateMany(
        { userId, isLatest: true },
        { isLatest: false }
    );
};

export const MenopauseAssessment = mongoose.model('MenopauseAssessment', menopauseAssessmentSchema);
