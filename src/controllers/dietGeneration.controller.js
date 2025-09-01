import catchAsync from '../utils/catchAsync.js';
import { dietGenerationService } from '../services/dietGeneration.service.js';
import { 
    User, 
    AssessmentResult, 
    BodyStatus, 
    BmiTracker, 
    BirthControl, 
    MedicationTracker, 
    DailySchedule,
    PcosAssessment, 
    PeriodCycle, 
    SleepTracker, 
    ThyroidAssessment, 
    WaterTracker, 
    WorkoutTracker, 
    WeightTracker, 
    MenopauseAssessment 
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';

/**
 * Generate diet for user
 * POST /v1/diet-generation/generate
 */
const generateDiet = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    // Get user data for diet generation
    const user = await User.findById(userId).select('name email age gender height weight targetWeight bodyshape focusarea goal health_issues Address city pincode country');
    
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Fetch all user data from various models
    const [
        doshaData,
        bodyStatusData,
        bmiTrackerData,
        birthControlData,
        medicationData,
        pcosAssessmentData,
        periodCycleData,
        sleepTrackerData,
        thyroidAssessmentData,
        waterTrackerData,
        workoutTrackerData,
        weightTrackerData,
        menopauseAssessmentData
    ] = await Promise.all([
        AssessmentResult.find({ userId }).sort({ submittedAt: -1 }).limit(5),
        BodyStatus.find({ userId }).sort({ measurementDate: -1 }).limit(5),
        BmiTracker.find({ userId }).sort({ measurementDate: -1 }).limit(5),
        BirthControl.findOne({ userId }),
        MedicationTracker.findOne({ userId }),
        PcosAssessment.find({ userId }).sort({ assessmentDate: -1 }).limit(5),
        PeriodCycle.find({ userId }).sort({ cycleStartDate: -1 }).limit(5),
        SleepTracker.find({ userId }).sort({ date: -1 }).limit(5),
        ThyroidAssessment.find({ userId }).sort({ assessmentDate: -1 }).limit(5),
        WaterTracker.find({ userId }).sort({ date: -1 }).limit(5),
        WorkoutTracker.find({ userId }).sort({ date: -1 }).limit(5),
        WeightTracker.find({ userId }).sort({ measurementDate: -1 }).limit(5),
        MenopauseAssessment.find({ userId }).sort({ assessmentDate: -1 }).limit(5)
    ]);

    // Create comprehensive user data object
    const comprehensiveUserData = {
        // Basic user info
        basicInfo: {
            name: user.name,
            age: user.age,
            gender: user.gender,
            height: user.height,
            weight: user.weight,
            targetWeight: user.targetWeight,
            bodyShape: user.bodyshape,
            focusAreas: user.focusarea,
            goals: user.goal,
            healthIssues: user.health_issues
        },
        
        // Dosha assessment data
        doshaAssessments: doshaData,
        
        // Body status and measurements
        bodyStatus: bodyStatusData,
        
        // BMI tracking data
        bmiTracking: bmiTrackerData,
        
        // Birth control information
        birthControl: birthControlData,
        
        // Medication and health conditions
        medications: medicationData,
        
        // PCOS assessment data
        pcosAssessments: pcosAssessmentData,
        
        // Period cycle tracking
        periodCycles: periodCycleData,
        
        // Sleep tracking data
        sleepTracking: sleepTrackerData,
        
        // Thyroid assessment data
        thyroidAssessments: thyroidAssessmentData,
        
        // Water intake tracking
        waterTracking: waterTrackerData,
        
        // Workout tracking data
        workoutTracking: workoutTrackerData,
        
        // Weight tracking data
        weightTracking: weightTrackerData,
        
        // Menopause assessment data
        menopauseAssessments: menopauseAssessmentData,
        
        // Additional request body data
        additionalPreferences: req.body
    };

    // Console log the comprehensive user data
    console.log('=== COMPREHENSIVE USER DATA FOR DIET GENERATION ===');
    console.log('User ID:', userId);
    console.log('Basic Info:', JSON.stringify(comprehensiveUserData.basicInfo, null, 2));
    console.log('Dosha Assessments:', JSON.stringify(doshaData, null, 2));
    console.log('Body Status Data:', JSON.stringify(bodyStatusData, null, 2));
    console.log('BMI Tracking Data:', JSON.stringify(bmiTrackerData, null, 2));
    console.log('Birth Control Data:', JSON.stringify(birthControlData, null, 2));
    console.log('Medication Data:', JSON.stringify(medicationData, null, 2));
    console.log('PCOS Assessments:', JSON.stringify(pcosAssessmentData, null, 2));
    console.log('Period Cycles:', JSON.stringify(periodCycleData, null, 2));
    console.log('Sleep Tracking Data:', JSON.stringify(sleepTrackerData, null, 2));
    console.log('Thyroid Assessments:', JSON.stringify(thyroidAssessmentData, null, 2));
    console.log('Water Tracking Data:', JSON.stringify(waterTrackerData, null, 2));
    console.log('Workout Tracking Data:', JSON.stringify(workoutTrackerData, null, 2));
    console.log('Weight Tracking Data:', JSON.stringify(weightTrackerData, null, 2));
    console.log('Menopause Assessments:', JSON.stringify(menopauseAssessmentData, null, 2));
    console.log('Additional Preferences:', JSON.stringify(req.body, null, 2));
    console.log('=== END COMPREHENSIVE USER DATA ===');

    // Create comprehensive object with all user data and POST request data
    const completeUserData = {
        // Basic user information
        basicInfo: {
            name: user.name,
            email: user.email,
            age: user.age,
            gender: user.gender,
            height: user.height,
            weight: user.weight,
            targetWeight: user.targetWeight,
            bodyShape: user.bodyshape,
            focusAreas: user.focusarea,
            goals: user.goal,
            healthIssues: user.health_issues,
            // Address and location data
            address: user.Address,
            city: user.city,
            pincode: user.pincode,
            country: user.country
        },
        
        // All comprehensive health and lifestyle data
        healthData: {
            doshaAssessments: doshaData,
            bodyStatus: bodyStatusData,
            bmiTracking: bmiTrackerData,
            birthControl: birthControlData,
            medications: medicationData,
            pcosAssessments: pcosAssessmentData,
            periodCycles: periodCycleData,
            sleepTracking: sleepTrackerData,
            thyroidAssessments: thyroidAssessmentData,
            waterTracking: waterTrackerData,
            workoutTracking: workoutTrackerData,
            weightTracking: weightTrackerData,
            menopauseAssessments: menopauseAssessmentData
        },
        
        // POST request data (diet preferences and additional info)
        dietPreferences: {
            // All POST request data
            ...req.body
        },
        
        // Metadata
        metadata: {
            userId: userId,
            requestTimestamp: new Date().toISOString(),
            dataFetchedAt: new Date().toISOString()
        }
    };

    // Log the complete structured object
    console.log('=== COMPLETE STRUCTURED USER DATA OBJECT ===');
    console.log(JSON.stringify(completeUserData, null, 2));
    console.log('=== END COMPLETE STRUCTURED OBJECT ===');

    // Prepare user data for AI model (flattened structure for compatibility)
    const userData = {
        // Basic user information
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        targetWeight: user.targetWeight,
        bodyShape: user.bodyshape,
        focusAreas: user.focusarea,
        goals: user.goal,
        healthIssues: user.health_issues,
        // Address and location data
        address: user.Address,
        city: user.city,
        pincode: user.pincode,
        country: user.country,
        
        // All comprehensive health and lifestyle data
        doshaAssessments: doshaData,
        bodyStatus: bodyStatusData,
        bmiTracking: bmiTrackerData,
        birthControl: birthControlData,
        medications: medicationData,
        pcosAssessments: pcosAssessmentData,
        periodCycles: periodCycleData,
        sleepTracking: sleepTrackerData,
        thyroidAssessments: thyroidAssessmentData,
        waterTracking: waterTrackerData,
        workoutTracking: workoutTrackerData,
        weightTracking: weightTrackerData,
        menopauseAssessments: menopauseAssessmentData,
        
        // Complete structured data object
        completeUserData: completeUserData,
        
        // Additional request preferences
        ...req.body
    };

    const result = await dietGenerationService.processDietGeneration(userId, userData);
    
    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            generationId: result.data._id,
            nextGenerationDate: result.nextGenerationDate,
            pdfUrl: result.data.pdfUrl,
            status: result.data.status
        }
    });
});

/**
 * Get diet generation status for user
 * GET /v1/diet-generation/status
 */
const getDietGenerationStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const status = await dietGenerationService.getDietGenerationStatus(userId);
    
    res.status(200).json({
        status: 'success',
        data: status
    });
});

/**
 * Get diet generation history for user
 * GET /v1/diet-generation/history
 */
const getDietGenerationHistory = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { generatedAt: -1 }
    };
    
    const history = await dietGenerationService.getDietGenerationHistory(userId, filter, options);
    
    res.status(200).json({
        status: 'success',
        data: history
    });
});

/**
 * Download latest diet PDF
 * GET /v1/diet-generation/download
 */
const downloadLatestDiet = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const latestGeneration = await dietGenerationService.getLatestDietGeneration(userId);
    
    if (!latestGeneration || latestGeneration.status !== 'generated') {
        throw new ApiError(404, 'No generated diet found for download');
    }
    
    if (!latestGeneration.pdfUrl) {
        throw new ApiError(404, 'PDF not available for this diet generation');
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            pdfUrl: latestGeneration.pdfUrl,
            generatedAt: latestGeneration.generatedAt,
            nextGenerationDate: latestGeneration.nextGenerationDate
        }
    });
});

/**
 * Check diet generation eligibility
 * GET /v1/diet-generation/eligibility
 */
const checkEligibility = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const eligibility = await dietGenerationService.checkDietGenerationEligibility(userId);
    
    res.status(200).json({
        status: 'success',
        data: {
            canGenerate: eligibility.canGenerate,
            remainingDays: eligibility.remainingDays,
            lastGeneration: eligibility.lastGeneration ? {
                generatedAt: eligibility.lastGeneration.generatedAt,
                status: eligibility.lastGeneration.status
            } : null
        }
    });
});

export const dietGenerationController = {
    generateDiet,
    getDietGenerationStatus,
    getDietGenerationHistory,
    downloadLatestDiet,
    checkEligibility
};
