import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const thyroidAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: true,
      index: true,
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
    },
    answers: {
      // Q1. Bowel Movements
      bowelMovements: {
        type: String,
        enum: ['Regular', 'Irregular', 'Urge of defecation just after eating', 'Constipated (>3 days)', 'Diarrhea'],
        required: true,
      },
      // Q2. Acidity (Burning Sensation)
      acidity: {
        type: String,
        enum: ['Yes', 'No', 'Sometimes'],
        required: true,
      },
      // Q3. Intolerance to Heat
      heatIntolerance: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
      },
      // Q4. Sudden (Unexplained) Weight Issues
      weightIssues: {
        type: String,
        enum: ['Weight Gain', 'Weight Loss'],
        required: true,
      },
      // Q5. Sensitivity to Cold
      coldSensitivity: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
      },
      // Q6. Appetite
      appetite: {
        type: String,
        enum: ['Increased', 'Low', 'Regular'],
        required: true,
      },
      // Q7. Morning Joint Stiffness
      jointStiffness: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
      },
      // Q8. Puffy Face / Swollen Eyes
      facialSwelling: {
        type: String,
        enum: ['Yes', 'Sometimes', 'No'],
        required: true,
      },
      // Q9. Anxiety / Heart Palpitations
      anxiety: {
        type: String,
        enum: ['Yes', 'No', 'Stress Induced'],
        required: true,
      },
      // Q10. Sleep Pattern
      sleepPattern: {
        type: String,
        enum: ['7–8 hrs', 'Disturbed Sleep Pattern', 'Difficulty in Sleeping'],
        required: true,
      },
      // Q11. Dry Skin / Hair
      drySkinHair: {
        type: String,
        enum: ['Extremely Dry', 'Normal'],
        required: true,
      },
      // Q12. Nails
      nails: {
        type: String,
        enum: ['Brittle', 'Healthy'],
        required: true,
      },
      // Q13. Sweating
      sweating: {
        type: String,
        enum: ['Extreme', 'Normal', 'Absent'],
        required: true,
      },
      // Q14. Hoarseness in Voice
      voiceHoarseness: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
      },
      // Q15. Past Illness (multi-select)
      pastIllness: {
        type: [String],
        enum: ['Diabetes', 'Hypertension', 'Other'],
        default: [],
      },
      pastIllnessOther: {
        type: String,
        maxlength: 500,
      },
      // Q16. Family History of Thyroid (multi-select)
      familyHistory: {
        type: [String],
        enum: ['Mother', 'Father', 'Maternal Family', 'Paternal Family', 'None'],
        default: [],
      },
      // Q17. Thyroid Profile Checked?
      thyroidProfileChecked: {
        type: String,
        enum: ['Yes (share reports)', 'No'],
        required: true,
      },
      // Q18. Hair Fall / Eyebrow Thinning
      hairThinning: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
      },
      // Q19. Heart Rate
      heartRate: {
        type: String,
        enum: ['Too slow', 'Too fast', 'Normal'],
        required: true,
      },
      // Q20. Neck Swelling or Pressure
      neckSwelling: {
        type: String,
        enum: ['Yes', 'No'],
        required: true,
      },
    },
    scores: {
      bowelMovementsScore: {
        type: Number,
        min: 0,
        max: 2,
        required: true,
      },
      acidityScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      heatIntoleranceScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      weightIssuesScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      coldSensitivityScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      appetiteScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      jointStiffnessScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      facialSwellingScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      anxietyScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      sleepPatternScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      drySkinHairScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      nailsScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      sweatingScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      voiceHoarsenessScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      pastIllnessScore: {
        type: Number,
        min: 0,
        max: 2,
        required: true,
      },
      familyHistoryScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      thyroidProfileCheckedScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      hairThinningScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      heartRateScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
      neckSwellingScore: {
        type: Number,
        min: 0,
        max: 1,
        required: true,
      },
    },
    totalScore: {
      type: Number,
      min: 0,
      max: 20,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      required: true,
    },
    riskDescription: {
      type: String,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply plugins
thyroidAssessmentSchema.plugin(toJSON);
thyroidAssessmentSchema.plugin(paginate);

// Pre-save middleware to calculate scores and risk level
thyroidAssessmentSchema.pre('save', function (next) {
  // Calculate individual scores based on answers
  this.scores.bowelMovementsScore = this.getScoreForAnswer('bowelMovements', this.answers.bowelMovements);
  this.scores.acidityScore = this.getScoreForAnswer('acidity', this.answers.acidity);
  this.scores.heatIntoleranceScore = this.getScoreForAnswer('heatIntolerance', this.answers.heatIntolerance);
  this.scores.weightIssuesScore = this.getScoreForAnswer('weightIssues', this.answers.weightIssues);
  this.scores.coldSensitivityScore = this.getScoreForAnswer('coldSensitivity', this.answers.coldSensitivity);
  this.scores.appetiteScore = this.getScoreForAnswer('appetite', this.answers.appetite);
  this.scores.jointStiffnessScore = this.getScoreForAnswer('jointStiffness', this.answers.jointStiffness);
  this.scores.facialSwellingScore = this.getScoreForAnswer('facialSwelling', this.answers.facialSwelling);
  this.scores.anxietyScore = this.getScoreForAnswer('anxiety', this.answers.anxiety);
  this.scores.sleepPatternScore = this.getScoreForAnswer('sleepPattern', this.answers.sleepPattern);
  this.scores.drySkinHairScore = this.getScoreForAnswer('drySkinHair', this.answers.drySkinHair);
  this.scores.nailsScore = this.getScoreForAnswer('nails', this.answers.nails);
  this.scores.sweatingScore = this.getScoreForAnswer('sweating', this.answers.sweating);
  this.scores.voiceHoarsenessScore = this.getScoreForAnswer('voiceHoarseness', this.answers.voiceHoarseness);
  this.scores.pastIllnessScore = this.getScoreForAnswer('pastIllness', this.answers.pastIllness);
  this.scores.familyHistoryScore = this.getScoreForAnswer('familyHistory', this.answers.familyHistory);
  this.scores.thyroidProfileCheckedScore = this.getScoreForAnswer(
    'thyroidProfileChecked',
    this.answers.thyroidProfileChecked
  );
  this.scores.hairThinningScore = this.getScoreForAnswer('hairThinning', this.answers.hairThinning);
  this.scores.heartRateScore = this.getScoreForAnswer('heartRate', this.answers.heartRate);
  this.scores.neckSwellingScore = this.getScoreForAnswer('neckSwelling', this.answers.neckSwelling);

  // Calculate total score
  this.totalScore = Object.values(this.scores).reduce((sum, score) => sum + score, 0);

  // Determine risk level and description
  const { riskLevel, riskDescription, recommendations } = this.calculateRiskLevel(this.totalScore);
  this.riskLevel = riskLevel;
  this.riskDescription = riskDescription;
  this.recommendations = recommendations;

  next();
});

// Method to get score for an answer
thyroidAssessmentSchema.methods.getScoreForAnswer = function (field, answer) {
  const scoreMappings = {
    bowelMovements: {
      Regular: 0,
      Irregular: 1,
      'Urge of defecation just after eating': 1,
      'Constipated (>3 days)': 2,
      Diarrhea: 1,
    },
    acidity: {
      Yes: 1,
      No: 0,
      Sometimes: 0.5,
    },
    heatIntolerance: {
      Yes: 1,
      No: 0,
    },
    weightIssues: {
      'Weight Gain': 1,
      'Weight Loss': 1,
    },
    coldSensitivity: {
      Yes: 1,
      No: 0,
    },
    appetite: {
      Increased: 1,
      Low: 1,
      Regular: 0,
    },
    jointStiffness: {
      Yes: 1,
      No: 0,
    },
    facialSwelling: {
      Yes: 1,
      Sometimes: 0.5,
      No: 0,
    },
    anxiety: {
      Yes: 1,
      No: 0,
      'Stress Induced': 0.5,
    },
    sleepPattern: {
      '7–8 hrs': 0,
      'Disturbed Sleep Pattern': 1,
      'Difficulty in Sleeping': 1,
    },
    drySkinHair: {
      'Extremely Dry': 1,
      Normal: 0,
    },
    nails: {
      Brittle: 1,
      Healthy: 0,
    },
    sweating: {
      Extreme: 1,
      Normal: 0,
      Absent: 1,
    },
    voiceHoarseness: {
      Present: 1,
      Absent: 0,
    },
    pastIllness: (illnesses) => (illnesses.length > 0 ? Math.min(illnesses.length, 2) : 0),
    familyHistory: (history) => (history.includes('None') ? 0 : 1),
    thyroidProfileChecked: {
      'Yes (share reports)': 0,
      No: 1,
    },
    hairThinning: {
      Yes: 1,
      No: 0,
    },
    heartRate: {
      'Too slow': 1,
      'Too fast': 1,
      Normal: 0,
    },
    neckSwelling: {
      Yes: 1,
      No: 0,
    },
  };

  const mapping = scoreMappings[field];
  if (typeof mapping === 'function') {
    return mapping(answer);
  }
  return mapping[answer] || 0;
};

// Method to calculate risk level based on total score
thyroidAssessmentSchema.methods.calculateRiskLevel = function (totalScore) {
  let riskLevel;
  let riskDescription;
  let recommendations;

  if (totalScore <= 3) {
    riskLevel = 'Low';
    riskDescription = 'Low risk of thyroid dysfunction. Continue monitoring and maintain healthy lifestyle.';
    recommendations = [
      'Continue regular health checkups',
      'Maintain balanced diet',
      'Exercise regularly',
      'Monitor for any new symptoms',
    ];
  } else if (totalScore <= 7) {
    riskLevel = 'Moderate';
    riskDescription = 'Moderate risk of thyroid dysfunction. Further evaluation recommended.';
    recommendations = [
      'Suggest full thyroid panel (TSH, FT3, FT4, Anti-TPO)',
      'Consult with healthcare provider',
      'Monitor symptoms closely',
      'Consider lifestyle modifications',
    ];
  } else {
    riskLevel = 'High';
    riskDescription = 'High risk of thyroid dysfunction. Immediate medical consultation strongly recommended.';
    recommendations = [
      'Immediate thyroid function tests required',
      'Consult endocrinologist',
      'Monitor symptoms daily',
      'Consider medication if prescribed',
    ];
  }

  return { riskLevel, riskDescription, recommendations };
};

// Static method to get latest assessment for a user
thyroidAssessmentSchema.statics.getLatestAssessment = function (userId) {
  return this.findOne({ userId }).sort({ createdAt: -1 });
};

// Static method to get assessment history for a user
thyroidAssessmentSchema.statics.getAssessmentHistory = function (userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Create indexes for efficient queries
thyroidAssessmentSchema.index({ userId: 1, assessmentDate: -1 });
thyroidAssessmentSchema.index({ riskLevel: 1 });

export const ThyroidAssessment = mongoose.model('ThyroidAssessment', thyroidAssessmentSchema);
