import { PcosAssessment } from '../models/pcos-assessment.model.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Get PCOS assessment questions and options
 * @returns {Object} Questions with options
 */
export const getAssessmentQuestions = () => {
    return {
        questions: [
            {
                id: 1,
                question: "When was your last menstrual period?",
                type: "date",
                tag: "last_cycle_date",
                description: "This helps calculate cycle length and irregularity"
            },
            {
                id: 2,
                question: "How is your Menstrual Cycle?",
                type: "select",
                options: [
                    { value: "Regular", score: 0, tag: "regular_cycle" },
                    { value: "Irregular", score: 2, tag: "cycle_irregular" }
                ]
            },
            {
                id: 3,
                question: "What is your Period Duration?",
                type: "select",
                options: [
                    { value: "1-2 days", score: 1, tag: "short_duration" },
                    { value: "3-5 days", score: 0, tag: "normal" },
                    { value: "5-7 days", score: 1, tag: "slightly_long" },
                    { value: "7+ days", score: 2, tag: "prolonged_bleeding" }
                ]
            },
            {
                id: 4,
                question: "How is your Menstrual Flow?",
                type: "select",
                options: [
                    { value: "Normal", score: 0, tag: "normal" },
                    { value: "Scanty", score: 1, tag: "hypomenorrhea" },
                    { value: "Heavy", score: 2, tag: "menorrhagia" }
                ]
            },
            {
                id: 5,
                question: "What is your Menstrual Blood Colour?",
                type: "select",
                options: [
                    { value: "Bright red", score: 0, tag: "normal" },
                    { value: "Brown-Blackish", score: 1, tag: "old_blood" },
                    { value: "Initially brown then red", score: 1, tag: "delayed_shedding" }
                ]
            },
            {
                id: 6,
                question: "Do you have Facial Hair (Hirsutism)?",
                type: "select",
                options: [
                    { value: "Yes", score: 3, tag: "hirsutism" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 7,
                question: "Have you experienced Weight Gain?",
                type: "select",
                options: [
                    { value: "Yes", score: 2, tag: "weight_gain" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 8,
                question: "What type of Food Cravings do you experience?",
                type: "text",
                description: "Describe your food cravings (e.g., sugar, carbs, salty, etc.)"
            },
            {
                id: 9,
                question: "Do you have a History of Hormonal Medications?",
                type: "select",
                options: [
                    { value: "Yes", score: 2, tag: "hormonal_history" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 10,
                question: "How would you describe your Period Pain?",
                type: "select",
                options: [
                    { value: "Absent", score: 0, tag: "none" },
                    { value: "Bearable", score: 1, tag: "mild" },
                    { value: "Unbearable", score: 2, tag: "dysmenorrhea" }
                ]
            },
            {
                id: 11,
                question: "Do you experience Facial Acne?",
                type: "select",
                options: [
                    { value: "Yes", score: 2, tag: "acne" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 12,
                question: "Do you experience Low Libido?",
                type: "select",
                options: [
                    { value: "Yes", score: 1, tag: "low_libido" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 13,
                question: "How would you describe your Hair Thinning/Hair Loss?",
                type: "select",
                options: [
                    { value: "Excess", score: 2, tag: "androgenic_alopecia" },
                    { value: "Normal", score: 0, tag: "normal" },
                    { value: "Absent", score: 0, tag: "none" }
                ]
            },
            {
                id: 14,
                question: "Do you have Dark Skin Patches (e.g., on Neck)?",
                type: "select",
                options: [
                    { value: "Yes", score: 3, tag: "acanthosis_nigricans" },
                    { value: "No", score: 0, tag: "none" }
                ]
            },
            {
                id: 15,
                question: "Have you experienced Difficulty Conceiving?",
                type: "select",
                options: [
                    { value: "Never conceived", score: 3, tag: "infertility_primary" },
                    { value: "Conceived once, then failure", score: 2, tag: "infertility_secondary" },
                    { value: "Second conception failed", score: 1, tag: "possible_hormonal_decline" },
                    { value: "Other", score: 0, tag: "other" }
                ]
            }
        ]
    };
};

/**
 * Calculate cycle length from last cycle date
 * @param {Date} lastCycleDate
 * @returns {number} Cycle length in days
 */
const calculateCycleLength = (lastCycleDate) => {
    const today = new Date();
    const diffTime = Math.abs(today - lastCycleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

/**
 * Calculate individual scores based on answers
 * @param {Object} answers
 * @returns {Object} Scores object
 */
const calculateScores = (answers) => {
    const scores = {};

    // Q2: Cycle Regularity
    scores.cycleIrregularityScore = answers.cycleRegularity === 'Irregular' ? 2 : 0;

    // Q3: Period Duration
    switch (answers.periodDuration) {
        case '1-2 days': scores.periodDurationScore = 1; break;
        case '3-5 days': scores.periodDurationScore = 0; break;
        case '5-7 days': scores.periodDurationScore = 1; break;
        case '7+ days': scores.periodDurationScore = 2; break;
        default: scores.periodDurationScore = 0;
    }

    // Q4: Menstrual Flow
    switch (answers.menstrualFlow) {
        case 'Normal': scores.menstrualFlowScore = 0; break;
        case 'Scanty': scores.menstrualFlowScore = 1; break;
        case 'Heavy': scores.menstrualFlowScore = 2; break;
        default: scores.menstrualFlowScore = 0;
    }

    // Q5: Blood Color
    switch (answers.bloodColor) {
        case 'Bright red': scores.bloodColorScore = 0; break;
        case 'Brown-Blackish': scores.bloodColorScore = 1; break;
        case 'Initially brown then red': scores.bloodColorScore = 1; break;
        default: scores.bloodColorScore = 0;
    }

    // Q6: Facial Hair
    scores.facialHairScore = answers.facialHair === 'Yes' ? 3 : 0;

    // Q7: Weight Gain
    scores.weightGainScore = answers.weightGain === 'Yes' ? 2 : 0;

    // Q8: Food Cravings (check for sugar/carb cravings)
    const foodCravingsLower = answers.foodCravings.toLowerCase();
    const hasSugarCravings = foodCravingsLower.includes('sugar') || 
                           foodCravingsLower.includes('sweet') || 
                           foodCravingsLower.includes('carb') ||
                           foodCravingsLower.includes('chocolate');
    scores.foodCravingsScore = hasSugarCravings ? 1 : 0;

    // Q9: Hormonal Medications
    scores.hormonalMedicationsScore = answers.hormonalMedications === 'Yes' ? 2 : 0;

    // Q10: Period Pain
    switch (answers.periodPain) {
        case 'Absent': scores.periodPainScore = 0; break;
        case 'Bearable': scores.periodPainScore = 1; break;
        case 'Unbearable': scores.periodPainScore = 2; break;
        default: scores.periodPainScore = 0;
    }

    // Q11: Facial Acne
    scores.facialAcneScore = answers.facialAcne === 'Yes' ? 2 : 0;

    // Q12: Low Libido
    scores.lowLibidoScore = answers.lowLibido === 'Yes' ? 1 : 0;

    // Q13: Hair Loss
    switch (answers.hairLoss) {
        case 'Excess': scores.hairLossScore = 2; break;
        case 'Normal': scores.hairLossScore = 0; break;
        case 'Absent': scores.hairLossScore = 0; break;
        default: scores.hairLossScore = 0;
    }

    // Q14: Dark Skin Patches
    scores.darkSkinPatchesScore = answers.darkSkinPatches === 'Yes' ? 3 : 0;

    // Q15: Difficulty Conceiving
    switch (answers.difficultyConceiving) {
        case 'Never conceived': scores.difficultyConceivingScore = 3; break;
        case 'Conceived once, then failure': scores.difficultyConceivingScore = 2; break;
        case 'Second conception failed': scores.difficultyConceivingScore = 1; break;
        case 'Other': scores.difficultyConceivingScore = 0; break;
        default: scores.difficultyConceivingScore = 0;
    }

    return scores;
};

/**
 * Calculate total score and risk level
 * @param {Object} scores
 * @returns {Object} Risk assessment
 */
const calculateRiskLevel = (scores) => {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    let riskLevel, riskDescription, recommendations;

    if (totalScore <= 4) {
        riskLevel = 'Low risk';
        riskDescription = 'Your symptoms suggest a low risk of PCOS/PCOD. Continue monitoring your menstrual health.';
        recommendations = [
            'Maintain a healthy lifestyle',
            'Regular exercise',
            'Balanced diet',
            'Monitor menstrual cycles'
        ];
    } else if (totalScore <= 9) {
        riskLevel = 'Moderate risk';
        riskDescription = 'Your symptoms indicate a moderate risk of PCOS/PCOD. Consider consulting a healthcare provider.';
        recommendations = [
            'Schedule an ultrasound examination',
            'Get blood tests (AMH, LH/FSH, insulin, TSH)',
            'Consult with a gynecologist',
            'Lifestyle modifications',
            'Regular monitoring'
        ];
    } else {
        riskLevel = 'High risk';
        riskDescription = 'Your symptoms strongly suggest PCOS/PCOD. Immediate medical consultation is recommended.';
        recommendations = [
            'Urgent gynecologist consultation',
            'Complete hormone workup',
            'Ultrasound examination',
            'Blood tests (AMH, LH/FSH, insulin, TSH, testosterone)',
            'Lifestyle and dietary changes',
            'Regular follow-up appointments'
        ];
    }

    return {
        totalScore,
        riskLevel,
        riskDescription,
        recommendations
    };
};

/**
 * Create a new PCOS assessment
 * @param {ObjectId} userId
 * @param {Object} answers
 * @returns {Promise<PcosAssessment>}
 */
export const createAssessment = async (userId, answers) => {
    // Calculate cycle length
    const cycleLength = calculateCycleLength(answers.lastCycleDate);
    
    // Calculate individual scores
    const scores = calculateScores(answers);
    
    // Calculate risk level
    const riskAssessment = calculateRiskLevel(scores);
    
    // Create assessment
    const assessment = await PcosAssessment.create({
        userId,
        answers,
        scores,
        totalScore: riskAssessment.totalScore,
        riskLevel: riskAssessment.riskLevel,
        riskDescription: riskAssessment.riskDescription,
        recommendations: riskAssessment.recommendations,
        cycleLength
    });

    return assessment;
};

/**
 * Get assessment by id
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @returns {Promise<PcosAssessment>}
 */
export const getAssessmentById = async (assessmentId, userId) => {
    const assessment = await PcosAssessment.findOne({
        _id: assessmentId,
        userId
    });

    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }

    return assessment;
};

/**
 * Get latest assessment for user
 * @param {ObjectId} userId
 * @returns {Promise<PcosAssessment>}
 */
export const getLatestAssessment = async (userId) => {
    const assessment = await PcosAssessment.findOne({ userId })
        .sort({ assessmentDate: -1 });

    if (!assessment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No assessment found for this user');
    }

    return assessment;
};

/**
 * Get assessment history for user
 * @param {ObjectId} userId
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
export const getAssessmentHistory = async (userId, filter, options) => {
    const assessmentFilter = { userId, ...filter };
    const results = await PcosAssessment.paginate(assessmentFilter, {
        ...options,
        sortBy: 'assessmentDate:desc'
    });
    return results;
};

/**
 * Update existing assessment (reassessment)
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @param {Object} answers
 * @returns {Promise<PcosAssessment>}
 */
export const updateAssessment = async (assessmentId, userId, answers) => {
    const assessment = await getAssessmentById(assessmentId, userId);
    
    // Calculate cycle length
    const cycleLength = calculateCycleLength(answers.lastCycleDate);
    
    // Calculate individual scores
    const scores = calculateScores(answers);
    
    // Calculate risk level
    const riskAssessment = calculateRiskLevel(scores);
    
    // Update assessment
    Object.assign(assessment, {
        answers,
        scores,
        totalScore: riskAssessment.totalScore,
        riskLevel: riskAssessment.riskLevel,
        riskDescription: riskAssessment.riskDescription,
        recommendations: riskAssessment.recommendations,
        cycleLength,
        assessmentDate: new Date()
    });

    await assessment.save();
    return assessment;
};

/**
 * Delete assessment
 * @param {ObjectId} assessmentId
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
export const deleteAssessment = async (assessmentId, userId) => {
    const assessment = await getAssessmentById(assessmentId, userId);
    await assessment.remove();
    
    return {
        message: 'Assessment deleted successfully'
    };
};

/**
 * Get assessment statistics for user
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
export const getAssessmentStats = async (userId) => {
    const stats = await PcosAssessment.aggregate([
        { $match: { userId } },
        {
            $group: {
                _id: null,
                totalAssessments: { $sum: 1 },
                averageScore: { $avg: '$totalScore' },
                latestAssessment: { $max: '$assessmentDate' },
                riskLevelDistribution: {
                    $push: '$riskLevel'
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            totalAssessments: 0,
            averageScore: 0,
            latestAssessment: null,
            riskLevelDistribution: {}
        };
    }

    const stat = stats[0];
    const riskLevelCounts = stat.riskLevelDistribution.reduce((acc, level) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});

    return {
        totalAssessments: stat.totalAssessments,
        averageScore: Math.round(stat.averageScore * 100) / 100,
        latestAssessment: stat.latestAssessment,
        riskLevelDistribution: riskLevelCounts
    };
};

/**
 * Calculate risk level from answers (without saving)
 * @param {Object} answers
 * @returns {Object} Risk assessment
 */
export const calculateRiskFromAnswers = async (answers) => {
    const scores = calculateScores(answers);
    const riskAssessment = calculateRiskLevel(scores);
    
    return {
        scores,
        ...riskAssessment
    };
};

/**
 * Get risk level distribution for all users (admin only)
 * @returns {Promise<Object>}
 */
export const getRiskLevelDistribution = async () => {
    const distribution = await PcosAssessment.aggregate([
        {
            $group: {
                _id: '$riskLevel',
                count: { $sum: 1 },
                averageScore: { $avg: '$totalScore' }
            }
        },
        {
            $project: {
                riskLevel: '$_id',
                count: 1,
                averageScore: { $round: ['$averageScore', 2] }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);

    return distribution;
};

export const pcosAssessmentService = {
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
