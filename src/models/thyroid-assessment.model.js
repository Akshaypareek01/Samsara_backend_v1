import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const thyroidAssessmentSchema = new mongoose.Schema({
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
        // Q1. Bowel Movements
        bowelMovements: {
            type: String,
            enum: ['Regular', 'Irregular', 'Urge of defecation just after eating', 'Constipated (>3 days)', 'Diarrhea'],
            required: true
        },
        // Q2. Acidity (Burning Sensation)
        acidity: {
            type: String,
            enum: ['Yes', 'No', 'Sometimes'],
            required: true
        },
        // Q3. Intolerance to Heat
        heatIntolerance: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q4. Sudden (Unexplained) Weight Issues
        weightIssues: {
            type: String,
            enum: ['Weight Gain', 'Weight Loss'],
            required: true
        },
        // Q5. Sensitivity to Cold
        coldSensitivity: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q6. Appetite
        appetite: {
            type: String,
            enum: ['Increased', 'Low', 'Regular'],
            required: true
        },
        // Q7. Morning Joint Stiffness
        jointStiffness: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q8. Puffy Face / Swollen Eyes
        facialSwelling: {
            type: String,
            enum: ['Yes', 'Sometimes', 'No'],
            required: true
        },
        // Q9. Anxiety / Heart Palpitations
        anxiety: {
            type: String,
            enum: ['Yes', 'No', 'Stress Induced'],
            required: true
        },
        // Q10. Sleep Pattern
        sleepPattern: {
            type: String,
            enum: ['7–8 hrs', 'Disturbed Sleep Pattern', 'Difficulty in Sleeping'],
            required: true
        },
        // Q11. Dry Skin / Hair
        drySkinHair: {
            type: String,
            enum: ['Extremely Dry', 'Normal'],
            required: true
        },
        // Q12. Nails
        nails: {
            type: String,
            enum: ['Brittle', 'Healthy'],
            required: true
        },
        // Q13. Sweating
        sweating: {
            type: String,
            enum: ['Extreme', 'Normal', 'Absent'],
            required: true
        },
        // Q14. Hoarseness in Voice
        voiceHoarseness: {
            type: String,
            enum: ['Present', 'Absent'],
            required: true
        },
        // Q15. Past Illness (multi-select)
        pastIllness: {
            type: [String],
            enum: ['Diabetes', 'Hypertension', 'Other'],
            default: []
        },
        pastIllnessOther: {
            type: String,
            maxlength: 500
        },
        // Q16. Family History of Thyroid (multi-select)
        familyHistory: {
            type: [String],
            enum: ['Mother', 'Father', 'Maternal Family', 'Paternal Family', 'None'],
            default: []
        },
        // Q17. Thyroid Profile Checked?
        thyroidProfileChecked: {
            type: String,
            enum: ['Yes (share reports)', 'No'],
            required: true
        },
        // Q18. Hair Fall / Eyebrow Thinning
        hairThinning: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        },
        // Q19. Heart Rate
        heartRate: {
            type: String,
            enum: ['Too slow', 'Too fast', 'Normal'],
            required: true
        },
        // Q20. Neck Swelling or Pressure
        neckSwelling: {
            type: String,
            enum: ['Yes', 'No'],
            required: true
        }
    },
    scores: {
        bowelMovementsScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        acidityScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        heatIntoleranceScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        weightIssuesScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        coldSensitivityScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        appetiteScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        jointStiffnessScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        facialSwellingScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        anxietyScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        sleepPatternScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        drySkinHairScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        nailsScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        sweatingScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        voiceHoarsenessScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        pastIllnessScore: {
            type: Number,
            min: 0,
            max: 2,
            required: true
        },
        familyHistoryScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        thyroidProfileCheckedScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        hairThinningScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        heartRateScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        },
        neckSwellingScore: {
            type: Number,
            min: 0,
            max: 1,
            required: true
        }
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 20,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High'],
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
    isCompleted: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Apply plugins
thyroidAssessmentSchema.plugin(toJSON);
thyroidAssessmentSchema.plugin(paginate);

// Create indexes for efficient queries
thyroidAssessmentSchema.index({ userId: 1, assessmentDate: -1 });
thyroidAssessmentSchema.index({ riskLevel: 1 });

export const ThyroidAssessment = mongoose.model('ThyroidAssessment', thyroidAssessmentSchema);
