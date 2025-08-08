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

// Create indexes for efficient queries
pcosAssessmentSchema.index({ userId: 1, assessmentDate: -1 });
pcosAssessmentSchema.index({ riskLevel: 1 });

export const PcosAssessment = mongoose.model('PcosAssessment', pcosAssessmentSchema);
