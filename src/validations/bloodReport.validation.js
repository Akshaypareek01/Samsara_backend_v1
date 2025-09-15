import Joi from 'joi';

// Common validation schema for test values
const testValueSchema = Joi.object({
  value: Joi.number().required(),
  unit: Joi.string().optional(),
  normalRange: Joi.string().optional()
});

// CBC Validation Schema
const cbcValidation = Joi.object({
  hemoglobin: testValueSchema.required(),
  rbcCount: testValueSchema.required(),
  wbcCount: testValueSchema.required(),
  plateletCount: testValueSchema.required(),
  lymphocytes: testValueSchema.required()
});

// Blood Sugar Validation Schema
const bloodSugarValidation = Joi.object({
  fastingBloodSugar: testValueSchema.required(),
  postprandial: testValueSchema.required(),
  hba1cNormal: testValueSchema.required(),
  hba1cPreDiabetes: testValueSchema.required(),
  hba1cDiabetes: testValueSchema.required()
});

// Thyroid Profile Validation Schema
const thyroidProfileValidation = Joi.object({
  t3Total: testValueSchema.required(),
  t4Total: testValueSchema.required(),
  tsh: testValueSchema.required(),
  antiTPO: testValueSchema.required()
});

// Lipid Profile Validation Schema
const lipidProfileValidation = Joi.object({
  totalCholesterol: testValueSchema.required(),
  hdl: testValueSchema.required(),
  ldl: testValueSchema.required(),
  vldl: testValueSchema.required(),
  triglycerides: testValueSchema.required(),
  cholesterolHdlRatio: testValueSchema.required()
});

// Liver Function Test Validation Schema
const liverFunctionValidation = Joi.object({
  totalBilirubin: testValueSchema.required(),
  directBilirubin: testValueSchema.required(),
  indirectBilirubin: testValueSchema.required(),
  sgptAlt: testValueSchema.required(),
  sgotAst: testValueSchema.required(),
  alkalinePhosphatase: testValueSchema.required(),
  totalProtein: testValueSchema.required(),
  globulin: testValueSchema.required(),
  agRatio: testValueSchema.required()
});

// Kidney Function Test Validation Schema
const kidneyFunctionValidation = Joi.object({
  bloodUrea: testValueSchema.required(),
  serumCreatinine: testValueSchema.required(),
  uricAcid: testValueSchema.required(),
  sodium: testValueSchema.required(),
  potassium: testValueSchema.required(),
  chloride: testValueSchema.required(),
  calcium: testValueSchema.required(),
  phosphorus: testValueSchema.required(),
  egfr: testValueSchema.required()
});

// Hormonal Analysis Validation Schema
const hormonalAnalysisValidation = Joi.object({
  estradiol: Joi.object({
    follicularPhase: testValueSchema.required(),
    preOvulatoryPeak: testValueSchema.required(),
    lutealPhase: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  progesterone: Joi.object({
    follicularPhase: testValueSchema.required(),
    lutealPhase: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  totalTestosterone: testValueSchema.required(),
  fsh: Joi.object({
    follicularPhase: testValueSchema.required(),
    midCyclePeak: testValueSchema.required(),
    lutealPhase: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  lh: Joi.object({
    follicularPhase: testValueSchema.required(),
    midCyclePeak: testValueSchema.required(),
    lutealPhase: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  prolactin: testValueSchema.required(),
  cortisol: Joi.object({
    morning8AM: testValueSchema.required(),
    afternoon4PM: testValueSchema.required()
  }).required()
});

// PCOS/PCOD Panel Validation Schema
const pcosPcodPanelValidation = Joi.object({
  dheaS: Joi.object({
    female18to30: testValueSchema.required(),
    female31to40: testValueSchema.required(),
    female41to50: testValueSchema.required()
  }).required(),
  progesterone: Joi.object({
    follicularPhase: testValueSchema.required(),
    lutealPhase: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  androstenedione: testValueSchema.required(),
  amh: Joi.object({
    normalOvarian: testValueSchema.required(),
    lowOvarian: testValueSchema.required(),
    high: testValueSchema.required()
  }).required(),
  fastingInsulin: testValueSchema.required(),
  fastingGlucose: Joi.object({
    normal: testValueSchema.required(),
    prediabetes: testValueSchema.required(),
    diabetes: testValueSchema.required()
  }).required(),
  shbgFemale: testValueSchema.required()
});

// Menopause Profile Validation Schema
const menopauseProfileValidation = Joi.object({
  inhibinB: Joi.object({
    premenopausal1: testValueSchema.required(),
    postmenopausal1: testValueSchema.required(),
    premenopausal2: testValueSchema.required(),
    postmenopausal2: testValueSchema.required()
  }).required(),
  boneALP: testValueSchema.required(),
  osteocalcin: testValueSchema.required(),
  ctx: Joi.object({
    premenopausal: testValueSchema.required(),
    postmenopausal: testValueSchema.required()
  }).required(),
  calciumTotal: testValueSchema.required(),
  phosphorus: testValueSchema.required(),
  magnesium: testValueSchema.required()
});

// Urine Routine Validation Schema
const urineRoutineValidation = Joi.object({
  color: Joi.object({
    value: Joi.string().required(),
    normalRange: Joi.string().optional()
  }).required(),
  specificGravity: Joi.object({
    value: Joi.number().required(),
    normalRange: Joi.string().optional()
  }).required(),
  ph: Joi.object({
    value: Joi.number().required(),
    normalRange: Joi.string().optional()
  }).required(),
  protein: Joi.object({
    value: Joi.string().required(),
    normalRange: Joi.string().optional()
  }).required(),
  glucose: Joi.object({
    value: Joi.string().required(),
    normalRange: Joi.string().optional()
  }).required(),
  ketones: Joi.object({
    value: Joi.string().required(),
    normalRange: Joi.string().optional()
  }).required(),
  rbc: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string().optional(),
    normalRange: Joi.string().optional()
  }).required(),
  wbc: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string().optional(),
    normalRange: Joi.string().optional()
  }).required()
});

// Semen Analysis Validation Schema
const semenAnalysisValidation = Joi.object({
  volume: testValueSchema.required(),
  ph: Joi.object({
    value: Joi.number().required(),
    normalRange: Joi.string().optional()
  }).required(),
  spermConcentration: testValueSchema.required(),
  totalSpermCount: testValueSchema.required(),
  mobility: testValueSchema.required(),
  totalMobility: testValueSchema.required(),
  morphology: testValueSchema.required(),
  vitality: testValueSchema.required()
});

// Weight Gain/Loss Validation Schema
const weightGainLossValidation = Joi.object({
  tsh: testValueSchema.required(),
  freeT3: testValueSchema.required(),
  freeT4: testValueSchema.required(),
  cortisol: testValueSchema.required(),
  insulin: testValueSchema.required(),
  homaIR: Joi.object({
    value: Joi.number().required(),
    normalRange: Joi.string().optional()
  }).required()
});

// Main Blood Report Validation Schema
const createBloodReportValidation = Joi.object({
  referringDoctor: Joi.object({
    name: Joi.string().required().min(2).max(100),
    specialization: Joi.string().optional().max(100),
    contactNumber: Joi.string().optional().pattern(/^[0-9+\-\s()]+$/),
    email: Joi.string().email().optional()
  }).required(),
  labName: Joi.string().required().min(2).max(200),
  reportDate: Joi.date().max('now').optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').required(),
  clinicalNotes: Joi.string().max(2000).optional(),
  testCategories: Joi.object({
    cbc: cbcValidation.optional(),
    bloodSugar: bloodSugarValidation.optional(),
    thyroidProfile: thyroidProfileValidation.optional(),
    lipidProfile: lipidProfileValidation.optional(),
    liverFunction: liverFunctionValidation.optional(),
    kidneyFunction: kidneyFunctionValidation.optional(),
    hormonalAnalysis: hormonalAnalysisValidation.optional(),
    pcosPcodPanel: pcosPcodPanelValidation.optional(),
    menopauseProfile: menopauseProfileValidation.optional(),
    urineRoutine: urineRoutineValidation.optional(),
    semenAnalysis: semenAnalysisValidation.optional(),
    weightGainLoss: weightGainLossValidation.optional()
  }).min(1).required(),
  status: Joi.string().valid('pending', 'completed', 'reviewed').optional()
});

const updateBloodReportValidation = Joi.object({
  referringDoctor: Joi.object({
    name: Joi.string().min(2).max(100),
    specialization: Joi.string().max(100),
    contactNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    email: Joi.string().email()
  }).optional(),
  labName: Joi.string().min(2).max(200).optional(),
  reportDate: Joi.date().max('now').optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  clinicalNotes: Joi.string().max(2000).optional(),
  testCategories: Joi.object({
    cbc: cbcValidation.optional(),
    bloodSugar: bloodSugarValidation.optional(),
    thyroidProfile: thyroidProfileValidation.optional(),
    lipidProfile: lipidProfileValidation.optional(),
    liverFunction: liverFunctionValidation.optional(),
    kidneyFunction: kidneyFunctionValidation.optional(),
    hormonalAnalysis: hormonalAnalysisValidation.optional(),
    pcosPcodPanel: pcosPcodPanelValidation.optional(),
    menopauseProfile: menopauseProfileValidation.optional(),
    urineRoutine: urineRoutineValidation.optional(),
    semenAnalysis: semenAnalysisValidation.optional(),
    weightGainLoss: weightGainLossValidation.optional()
  }).optional(),
  status: Joi.string().valid('pending', 'completed', 'reviewed').optional()
});

const getBloodReportsValidation = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid('reportDate', 'createdAt', 'labName').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  status: Joi.string().valid('pending', 'completed', 'reviewed').optional(),
  labName: Joi.string().optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional()
});

export default {
  createBloodReportValidation,
  updateBloodReportValidation,
  getBloodReportsValidation,
  cbcValidation,
  bloodSugarValidation,
  thyroidProfileValidation,
  lipidProfileValidation,
  liverFunctionValidation,
  kidneyFunctionValidation,
  hormonalAnalysisValidation,
  pcosPcodPanelValidation,
  menopauseProfileValidation,
  urineRoutineValidation,
  semenAnalysisValidation,
  weightGainLossValidation
};
