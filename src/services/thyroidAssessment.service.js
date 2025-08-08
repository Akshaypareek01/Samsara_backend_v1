import mongoose from 'mongoose';
import { ThyroidAssessment } from '../models/thyroid-assessment.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Get all thyroid assessment questions and options
 */
const getAssessmentQuestions = () => {
    return {
        questions: [
            {
                id: 1,
                question: "Bowel Movements",
                options: [
                    "Regular",
                    "Irregular",
                    "Urge of defecation just after eating",
                    "Constipated (>3 days)",
                    "Diarrhea"
                ],
                type: "single_select",
                tag: "bowel_movements"
            },
            {
                id: 2,
                question: "Acidity (Burning Sensation)",
                options: ["Yes", "No", "Sometimes"],
                type: "single_select",
                tag: "acidity"
            },
            {
                id: 3,
                question: "Intolerance to Heat",
                options: ["Yes", "No"],
                type: "single_select",
                tag: "heat_intolerance"
            },
            {
                id: 4,
                question: "Sudden (Unexplained) Weight Issues",
                options: ["Weight Gain", "Weight Loss"],
                type: "single_select",
                tag: "weight_issues"
            },
            {
                id: 5,
                question: "Sensitivity to Cold",
                options: ["Yes", "No"],
                type: "single_select",
                tag: "cold_sensitivity"
            },
            {
                id: 6,
                question: "Appetite",
                options: ["Increased", "Low", "Regular"],
                type: "single_select",
                tag: "appetite"
            },
            {
                id: 7,
                question: "Morning Joint Stiffness",
                options: ["Yes", "No"],
                type: "single_select",
                tag: "joint_stiffness"
            },
            {
                id: 8,
                question: "Puffy Face / Swollen Eyes",
                options: ["Yes", "Sometimes", "No"],
                type: "single_select",
                tag: "facial_swelling"
            },
            {
                id: 9,
                question: "Anxiety / Heart Palpitations",
                options: ["Yes", "No", "Stress Induced"],
                type: "single_select",
                tag: "anxiety"
            },
            {
                id: 10,
                question: "Sleep Pattern",
                options: ["7–8 hrs", "Disturbed Sleep Pattern", "Difficulty in Sleeping"],
                type: "single_select",
                tag: "sleep_pattern"
            },
            {
                id: 11,
                question: "Dry Skin / Hair",
                options: ["Extremely Dry", "Normal"],
                type: "single_select",
                tag: "dry_skin_hair"
            },
            {
                id: 12,
                question: "Nails",
                options: ["Brittle", "Healthy"],
                type: "single_select",
                tag: "nails"
            },
            {
                id: 13,
                question: "Sweating",
                options: ["Extreme", "Normal", "Absent"],
                type: "single_select",
                tag: "sweating"
            },
            {
                id: 14,
                question: "Hoarseness in Voice",
                options: ["Present", "Absent"],
                type: "single_select",
                tag: "voice_hoarseness"
            },
            {
                id: 15,
                question: "Past Illness",
                options: ["Diabetes", "Hypertension", "Other"],
                type: "multi_select",
                tag: "past_illness"
            },
            {
                id: 16,
                question: "Family History of Thyroid",
                options: ["Mother", "Father", "Maternal Family", "Paternal Family", "None"],
                type: "multi_select",
                tag: "family_thyroid_history"
            },
            {
                id: 17,
                question: "Thyroid Profile Checked?",
                options: ["Yes (share reports)", "No"],
                type: "single_select",
                tag: "thyroid_profile_checked"
            },
            {
                id: 18,
                question: "Hair Fall / Eyebrow Thinning",
                options: ["Yes", "No"],
                type: "single_select",
                tag: "hair_thinning"
            },
            {
                id: 19,
                question: "Heart Rate",
                options: ["Too slow", "Too fast", "Normal"],
                type: "single_select",
                tag: "heart_rate"
            },
            {
                id: 20,
                question: "Neck Swelling or Pressure",
                options: ["Yes", "No"],
                type: "single_select",
                tag: "neck_swelling"
            }
        ]
    };
};

/**
 * Calculate scores for each answer
 */
const calculateScores = (answers) => {
    const scores = {};

    // Q1. Bowel Movements
    switch (answers.bowelMovements) {
        case 'Regular':
            scores.bowelMovementsScore = 0;
            break;
        case 'Irregular':
            scores.bowelMovementsScore = 1;
            break;
        case 'Urge of defecation just after eating':
            scores.bowelMovementsScore = 1;
            break;
        case 'Constipated (>3 days)':
            scores.bowelMovementsScore = 2;
            break;
        case 'Diarrhea':
            scores.bowelMovementsScore = 1;
            break;
        default:
            scores.bowelMovementsScore = 0;
    }

    // Q2. Acidity
    scores.acidityScore = answers.acidity === 'Yes' ? 1 : 0;

    // Q3. Heat Intolerance
    scores.heatIntoleranceScore = answers.heatIntolerance === 'Yes' ? 1 : 0;

    // Q4. Weight Issues
    scores.weightIssuesScore = answers.weightIssues ? 1 : 0;

    // Q5. Cold Sensitivity
    scores.coldSensitivityScore = answers.coldSensitivity === 'Yes' ? 1 : 0;

    // Q6. Appetite
    switch (answers.appetite) {
        case 'Increased':
        case 'Low':
            scores.appetiteScore = 1;
            break;
        default:
            scores.appetiteScore = 0;
    }

    // Q7. Joint Stiffness
    scores.jointStiffnessScore = answers.jointStiffness === 'Yes' ? 1 : 0;

    // Q8. Facial Swelling
    switch (answers.facialSwelling) {
        case 'Yes':
            scores.facialSwellingScore = 1;
            break;
        case 'Sometimes':
            scores.facialSwellingScore = 0.5;
            break;
        default:
            scores.facialSwellingScore = 0;
    }

    // Q9. Anxiety
    scores.anxietyScore = answers.anxiety === 'Yes' ? 1 : 0;

    // Q10. Sleep Pattern
    switch (answers.sleepPattern) {
        case 'Disturbed Sleep Pattern':
        case 'Difficulty in Sleeping':
            scores.sleepPatternScore = 1;
            break;
        default:
            scores.sleepPatternScore = 0;
    }

    // Q11. Dry Skin/Hair
    scores.drySkinHairScore = answers.drySkinHair === 'Extremely Dry' ? 1 : 0;

    // Q12. Nails
    scores.nailsScore = answers.nails === 'Brittle' ? 1 : 0;

    // Q13. Sweating
    switch (answers.sweating) {
        case 'Extreme':
        case 'Absent':
            scores.sweatingScore = 1;
            break;
        default:
            scores.sweatingScore = 0;
    }

    // Q14. Voice Hoarseness
    scores.voiceHoarsenessScore = answers.voiceHoarseness === 'Present' ? 1 : 0;

    // Q15. Past Illness
    scores.pastIllnessScore = answers.pastIllness.length > 0 ? Math.min(answers.pastIllness.length, 2) : 0;

    // Q16. Family History
    scores.familyHistoryScore = answers.familyHistory.includes('None') ? 0 : 1;

    // Q17. Thyroid Profile Checked
    scores.thyroidProfileCheckedScore = answers.thyroidProfileChecked === 'No' ? 1 : 0;

    // Q18. Hair Thinning
    scores.hairThinningScore = answers.hairThinning === 'Yes' ? 1 : 0;

    // Q19. Heart Rate
    switch (answers.heartRate) {
        case 'Too slow':
        case 'Too fast':
            scores.heartRateScore = 1;
            break;
        default:
            scores.heartRateScore = 0;
    }

    // Q20. Neck Swelling
    scores.neckSwellingScore = answers.neckSwelling === 'Yes' ? 1 : 0;

    return scores;
};

/**
 * Calculate risk level based on total score
 */
const calculateRiskLevel = (totalScore) => {
    let riskLevel, riskDescription, recommendations;

    if (totalScore <= 3) {
        riskLevel = 'Low';
        riskDescription = 'Low risk of thyroid dysfunction. Continue monitoring symptoms.';
        recommendations = [
            'Monitor symptoms for any changes',
            'Retake assessment after 3 months',
            'Maintain healthy lifestyle habits'
        ];
    } else if (totalScore <= 6) {
        riskLevel = 'Moderate';
        riskDescription = 'Moderate risk of thyroid dysfunction. Further evaluation recommended.';
        recommendations = [
            'Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)',
            'Consult with healthcare provider',
            'Monitor symptoms closely',
            'Consider lifestyle modifications'
        ];
    } else {
        riskLevel = 'High';
        riskDescription = 'High risk of thyroid dysfunction. Immediate medical evaluation strongly recommended.';
        recommendations = [
            'Strongly recommend endocrinologist consult',
            'Complete thyroid function tests',
            'Immediate medical evaluation',
            'Monitor for severe symptoms'
        ];
    }

    return { riskLevel, riskDescription, recommendations };
};

/**
 * Create a new thyroid assessment
 */
const createAssessment = async (userId, answers) => {
    const scores = calculateScores(answers);
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const { riskLevel, riskDescription, recommendations } = calculateRiskLevel(totalScore);

    const assessment = new ThyroidAssessment({
        userId,
        answers,
        scores,
        totalScore,
        riskLevel,
        riskDescription,
        recommendations
    });

    return await assessment.save();
};

/**
 * Get assessment by ID
 */
const getAssessmentById = async (assessmentId) => {
    const assessment = await ThyroidAssessment.findById(assessmentId);
    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }
    return assessment;
};

/**
 * Get latest assessment for user
 */
const getLatestAssessment = async (userId) => {
    const assessment = await ThyroidAssessment.findOne({ userId })
        .sort({ assessmentDate: -1 });
    
    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No assessment found for this user');
    }
    
    return assessment;
};

/**
 * Get assessment history with pagination and filtering
 */
const getAssessmentHistory = async (userId, options) => {
    const { page = 1, limit = 10, riskLevel } = options;
    
    const filter = { userId };
    if (riskLevel) {
        filter.riskLevel = riskLevel;
    }

    const assessments = await ThyroidAssessment.find(filter)
        .sort({ assessmentDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const total = await ThyroidAssessment.countDocuments(filter);

    return {
        assessments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
    };
};

/**
 * Update assessment
 */
const updateAssessment = async (assessmentId, answers) => {
    const scores = calculateScores(answers);
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const { riskLevel, riskDescription, recommendations } = calculateRiskLevel(totalScore);

    const assessment = await ThyroidAssessment.findByIdAndUpdate(
        assessmentId,
        {
            answers,
            scores,
            totalScore,
            riskLevel,
            riskDescription,
            recommendations,
            assessmentDate: new Date()
        },
        { new: true, runValidators: true }
    );

    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }

    return assessment;
};

/**
 * Delete assessment
 */
const deleteAssessment = async (assessmentId) => {
    const assessment = await ThyroidAssessment.findByIdAndDelete(assessmentId);
    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }
    return assessment;
};

/**
 * Get assessment statistics
 */
const getAssessmentStats = async (userId) => {
    const stats = await ThyroidAssessment.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalAssessments: { $sum: 1 },
                averageScore: { $avg: '$totalScore' },
                latestScore: { $first: '$totalScore' },
                latestRiskLevel: { $first: '$riskLevel' }
            }
        }
    ]);

    const riskDistribution = await ThyroidAssessment.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$riskLevel',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        stats: stats[0] || {
            totalAssessments: 0,
            averageScore: 0,
            latestScore: 0,
            latestRiskLevel: null
        },
        riskDistribution
    };
};

/**
 * Calculate risk level from answers without saving
 */
const calculateRiskFromAnswers = async (answers) => {
    const scores = calculateScores(answers);
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const { riskLevel, riskDescription, recommendations } = calculateRiskLevel(totalScore);

    return {
        scores,
        totalScore,
        riskLevel,
        riskDescription,
        recommendations
    };
};

/**
 * Get risk level distribution for admin
 */
const getRiskLevelDistribution = async () => {
    return await ThyroidAssessment.aggregate([
        {
            $group: {
                _id: '$riskLevel',
                count: { $sum: 1 },
                averageScore: { $avg: '$totalScore' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

export const thyroidAssessmentService = {
    getAssessmentQuestions,
    createAssessment,
    getAssessmentById,
    getLatestAssessment,
    getAssessmentHistory,
    updateAssessment,
    deleteAssessment,
    getAssessmentStats,
    calculateRiskFromAnswers,
    getRiskLevelDistribution
};
