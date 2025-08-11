import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const pcosAssessmentSchema = new mongoose.Schema({
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
        // Q1. Last Menstrual Period (Open-ended)
        lastCycleDate: {
            type: Date,
            required: true
        },
        // Q2. How is the Menstrual Cycle?
        cycleRegularity: {
            type: String,
            enum: ['Regular', 'Irregular'],
            required: true
        },
        // Q3. Period Duration?
        periodDuration: {
            type: String,
            enum: ['1-2 days', '3-5 days', '5-7 days', '7+ days'],
            required: true
        },
        // Q4. Menstrual Flow?
        menstrualFlow: {
            type: String,
            enum: ['Normal', 'Scanty', 'Heavy'],
            required: true
        },
        // Q5. Menstrual Blood Colour?
        bloodColor: {
            type: String,
            enum: ['Bright red', 'Brown-Blackish', 'Initially brown then red'],
            required: true
        },
        // Q6. Facial Hair (Hirsutism)?
        facialHair: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q7. Weight Gain?
        weightGain: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q8. Food Cravings (Type)?
        foodCravings: {
            type: String,
            required: true
        },
        // Q9. History of Hormonal Medications?
        hormonalMedications: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q10. Period Pain?
        periodPain: {
            type: String,
            enum: ['Absent', 'Bearable', 'Unbearable'],
            required: true
        },
        // Q11. Facial Acne?
        facialAcne: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q12. Low Libido?
        lowLibido: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q13. Hair Thinning / Hair Loss?
        hairLoss: {
            type: String,
            enum: ['Excess', 'Normal', 'Absent'],
            required: true
        },
        // Q14. Dark Skin Patches (e.g., Neck)?
        darkSkinPatches: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q15. Difficulty Conceiving?
        difficultyConceiving: {
            type: String,
            enum: ['Never conceived', 'Conceived once, then failure', 'Second conception failed', 'Other'],
            required: true
        }
    },
    scores: {
        cycleIrregularityScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        periodDurationScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        menstrualFlowScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        bloodColorScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        facialHairScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        weightGainScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        foodCravingsScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        hormonalMedicationsScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        periodPainScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        facialAcneScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        lowLibidoScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        hairLossScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        darkSkinPatchesScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        },
        difficultyConceivingScore: {
            type: Number,
            min: 0,
            max: 3,
            required: true
        }
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 25,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['Low risk', 'Moderate risk', 'High risk'],
        required: true
    },
    riskDescription: {
        type: String,
        required: true
    },
    recommendations: {
        type: [String],
        default: []
    },
    cycleLength: {
        type: Number,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Apply plugins
pcosAssessmentSchema.plugin(toJSON);
pcosAssessmentSchema.plugin(paginate);

// Pre-save middleware to calculate scores and risk level
pcosAssessmentSchema.pre('save', function(next) {
    // Only run middleware if we have answers
    if (!this.answers) {
        return next();
    }
    
    // Initialize scores object if it doesn't exist
    if (!this.scores) {
        this.scores = {};
    }
    
    // Calculate individual scores based on answers
    this.scores.cycleIrregularityScore = this.getScoreForAnswer('cycleRegularity', this.answers.cycleRegularity);
    this.scores.periodDurationScore = this.getScoreForAnswer('periodDuration', this.answers.periodDuration);
    this.scores.menstrualFlowScore = this.getScoreForAnswer('menstrualFlow', this.answers.menstrualFlow);
    this.scores.bloodColorScore = this.getScoreForAnswer('bloodColor', this.answers.bloodColor);
    this.scores.facialHairScore = this.getScoreForAnswer('facialHair', this.answers.facialHair);
    this.scores.weightGainScore = this.getScoreForAnswer('weightGain', this.answers.weightGain);
    this.scores.foodCravingsScore = this.getScoreForAnswer('foodCravings', this.answers.foodCravings);
    this.scores.hormonalMedicationsScore = this.getScoreForAnswer('hormonalMedications', this.answers.hormonalMedications);
    this.scores.periodPainScore = this.getScoreForAnswer('periodPain', this.answers.periodPain);
    this.scores.facialAcneScore = this.getScoreForAnswer('facialAcne', this.answers.facialAcne);
    this.scores.lowLibidoScore = this.getScoreForAnswer('lowLibido', this.answers.lowLibido);
    this.scores.hairLossScore = this.getScoreForAnswer('hairLoss', this.answers.hairLoss);
    this.scores.darkSkinPatchesScore = this.getScoreForAnswer('darkSkinPatches', this.answers.darkSkinPatches);
    this.scores.difficultyConceivingScore = this.getScoreForAnswer('difficultyConceiving', this.answers.difficultyConceiving);
    
    // Calculate total score
    this.totalScore = Object.values(this.scores).reduce((sum, score) => sum + score, 0);
    
    // Calculate cycle length
    console.log('Pre-save: lastCycleDate from answers:', this.answers.lastCycleDate);
    this.cycleLength = this.calculateCycleLength(this.answers.lastCycleDate);
    console.log('Pre-save: calculated cycleLength:', this.cycleLength);
    
    // Determine risk level and description
    const { riskLevel, riskDescription, recommendations } = this.calculateRiskLevel(this.totalScore);
    this.riskLevel = riskLevel;
    this.riskDescription = riskDescription;
    this.recommendations = recommendations;
    
    next();
});

// Method to get score for an answer
pcosAssessmentSchema.methods.getScoreForAnswer = function(field, answer) {
    const scoreMappings = {
        cycleRegularity: {
            'Regular': 0,
            'Irregular': 2
        },
        periodDuration: {
            '1-2 days': 1,
            '3-5 days': 0,
            '5-7 days': 1,
            '7+ days': 2
        },
        menstrualFlow: {
            'Normal': 0,
            'Scanty': 1,
            'Heavy': 2
        },
        bloodColor: {
            'Bright red': 0,
            'Brown-Blackish': 1,
            'Initially brown then red': 1
        },
        facialHair: {
            'Yes': 3,
            'No': 0
        },
        weightGain: {
            'Yes': 2,
            'No': 0
        },
        foodCravings: (cravings) => {
            const cravingsLower = cravings.toLowerCase();
            const hasSugarCravings = cravingsLower.includes('sugar') || 
                                   cravingsLower.includes('sweet') || 
                                   cravingsLower.includes('carb') ||
                                   cravingsLower.includes('chocolate');
            return hasSugarCravings ? 1 : 0;
        },
        hormonalMedications: {
            'Yes': 2,
            'No': 0
        },
        periodPain: {
            'Absent': 0,
            'Bearable': 1,
            'Unbearable': 2
        },
        facialAcne: {
            'Yes': 2,
            'No': 0
        },
        lowLibido: {
            'Yes': 1,
            'No': 0
        },
        hairLoss: {
            'Excess': 2,
            'Normal': 0,
            'Absent': 0
        },
        darkSkinPatches: {
            'Yes': 3,
            'No': 0
        },
        difficultyConceiving: {
            'Never conceived': 3,
            'Conceived once, then failure': 2,
            'Second conception failed': 1,
            'Other': 0
        }
    };
    
    const mapping = scoreMappings[field];
    if (typeof mapping === 'function') {
        return mapping(answer);
    }
    return mapping[answer] || 0;
};

// Method to calculate cycle length
pcosAssessmentSchema.methods.calculateCycleLength = function(lastCycleDate) {
    // Add validation and debugging
    if (!lastCycleDate) {
        console.log('Warning: lastCycleDate is undefined or null');
        return 0;
    }
    
    const today = new Date();
    const lastCycle = new Date(lastCycleDate);
    
    // Check if the date is valid
    if (isNaN(lastCycle.getTime())) {
        console.log('Warning: Invalid lastCycleDate:', lastCycleDate);
        return 0;
    }
    
    const diffTime = Math.abs(today - lastCycle);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Ensure we return a valid number
    if (isNaN(diffDays)) {
        console.log('Warning: Calculated diffDays is NaN');
        return 0;
    }
    
    return diffDays;
};

// Method to calculate risk level based on total score
pcosAssessmentSchema.methods.calculateRiskLevel = function(totalScore) {
    let riskLevel, riskDescription, recommendations;
    
    if (totalScore <= 5) {
        riskLevel = 'Low risk';
        riskDescription = 'Low risk of PCOS. Continue monitoring your menstrual health.';
        recommendations = [
            'Maintain regular menstrual tracking',
            'Continue healthy lifestyle',
            'Regular gynecological checkups',
            'Monitor for any new symptoms'
        ];
    } else if (totalScore <= 12) {
        riskLevel = 'Moderate risk';
        riskDescription = 'Moderate risk of PCOS. Consider consulting with a healthcare provider.';
        recommendations = [
            'Consult with gynecologist',
            'Consider hormonal testing',
            'Monitor menstrual patterns closely',
            'Lifestyle modifications recommended'
        ];
    } else {
        riskLevel = 'High risk';
        riskDescription = 'High risk of PCOS. Immediate consultation with healthcare provider recommended.';
        recommendations = [
            'Immediate gynecological consultation',
            'Comprehensive hormonal panel testing',
            'Ultrasound examination recommended',
            'Consider specialist referral'
        ];
    }
    
    return { riskLevel, riskDescription, recommendations };
};

// Static method to get latest assessment for a user
pcosAssessmentSchema.statics.getLatestAssessment = function(userId) {
    return this.findOne({ userId }).sort({ createdAt: -1 });
};

// Static method to get assessment history for a user
pcosAssessmentSchema.statics.getAssessmentHistory = function(userId) {
    return this.find({ userId }).sort({ createdAt: -1 });
};

// Create indexes for efficient queries
pcosAssessmentSchema.index({ userId: 1, assessmentDate: -1 });
pcosAssessmentSchema.index({ riskLevel: 1 });

export const PcosAssessment = mongoose.model('PcosAssessment', pcosAssessmentSchema);
