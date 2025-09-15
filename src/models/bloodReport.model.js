import mongoose from 'mongoose';

// Complete Blood Count (CBC) Schema
const cbcSchema = new mongoose.Schema({
  hemoglobin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'g/dL' },
    normalRange: { type: String, default: '12-17' }
  },
  rbcCount: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'million/µL' },
    normalRange: { type: String, default: '4.2-5.4' }
  },
  wbcCount: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'thousand/µL' },
    normalRange: { type: String, default: '4.0-11.0' }
  },
  plateletCount: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'thousand/µL' },
    normalRange: { type: String, default: '150-450' }
  },
  lymphocytes: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '20-50' }
  }
});

// Blood Sugar Schema
const bloodSugarSchema = new mongoose.Schema({
  fastingBloodSugar: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '70-99' }
  },
  postprandial: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '<140' }
  },
  hba1cNormal: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '<5.7' }
  },
  hba1cPreDiabetes: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '5.7-6.4' }
  },
  hba1cDiabetes: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '>6.5' }
  }
});

// Thyroid Profile Schema
const thyroidProfileSchema = new mongoose.Schema({
  t3Total: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/dL' },
    normalRange: { type: String, default: '70-200' }
  },
  t4Total: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µg/dL' },
    normalRange: { type: String, default: '4.6-12' }
  },
  tsh: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µIU/mL' },
    normalRange: { type: String, default: '0.4-4.0' }
  },
  antiTPO: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'IU/mL' },
    normalRange: { type: String, default: '<35' }
  }
});

// Lipid Profile Schema
const lipidProfileSchema = new mongoose.Schema({
  totalCholesterol: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '<200' }
  },
  hdl: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '>40-50' }
  },
  ldl: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '<100' }
  },
  vldl: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '10-30' }
  },
  triglycerides: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '<150' }
  },
  cholesterolHdlRatio: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '<4.5' }
  }
});

// Liver Function Test Schema
const liverFunctionSchema = new mongoose.Schema({
  totalBilirubin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '15-40' }
  },
  directBilirubin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '0.6-1.2' }
  },
  indirectBilirubin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '3.5-7.2' }
  },
  sgptAlt: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '135-145' }
  },
  sgotAst: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '3.5-5.0' }
  },
  alkalinePhosphatase: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '98-107' }
  },
  totalProtein: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '8.5-10.5' }
  },
  globulin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '2.5-4.5' }
  },
  agRatio: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '>90/min/1.7m2' }
  }
});

// Kidney Function Test Schema
const kidneyFunctionSchema = new mongoose.Schema({
  bloodUrea: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '15-40' }
  },
  serumCreatinine: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '0.6-1.2' }
  },
  uricAcid: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '3.5-7.2' }
  },
  sodium: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '135-145' }
  },
  potassium: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '3.5-5.0' }
  },
  chloride: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mmol/L' },
    normalRange: { type: String, default: '98-107' }
  },
  calcium: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '8.5-10.5' }
  },
  phosphorus: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '2.5-4.5' }
  },
  egfr: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '>90/min/1.7m2' }
  }
});

// Hormonal Analysis Schema
const hormonalAnalysisSchema = new mongoose.Schema({
  estradiol: {
    follicularPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '30-120' }
    },
    preOvulatoryPeak: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '130-400' }
    },
    lutealPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '70-250' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '<30' }
    }
  },
  progesterone: {
    follicularPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '0.2-1.5' }
    },
    lutealPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '1.7-25' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '<0.5' }
    }
  },
  totalTestosterone: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/dL' },
    normalRange: { type: String, default: '15-70' }
  },
  fsh: {
    follicularPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '3.5-12.5' }
    },
    midCyclePeak: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '4.7-21.5' }
    },
    lutealPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '1.7-7.7' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '25-135' }
    }
  },
  lh: {
    follicularPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '2.4-12.6' }
    },
    midCyclePeak: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '14-95' }
    },
    lutealPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '1-11' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mIU/mL' },
      normalRange: { type: String, default: '7.7-59' }
    }
  },
  prolactin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/dL' },
    normalRange: { type: String, default: '<23.3' }
  },
  cortisol: {
    morning8AM: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'µg/dL' },
      normalRange: { type: String, default: '6.2-19.4' }
    },
    afternoon4PM: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'µg/dL' },
      normalRange: { type: String, default: '2-9' }
    }
  }
});

// PCOS/PCOD Panel Schema
const pcosPcodPanelSchema = new mongoose.Schema({
  dheaS: {
    female18to30: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'µg/dL' },
      normalRange: { type: String, default: '65-380' }
    },
    female31to40: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'µg/dL' },
      normalRange: { type: String, default: '45-270' }
    },
    female41to50: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'µg/dL' },
      normalRange: { type: String, default: '30-200' }
    }
  },
  progesterone: {
    follicularPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '0.2-1.3' }
    },
    lutealPhase: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '1.0-4.5' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '<0.2' }
    }
  },
  androstenedione: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/dL' },
    normalRange: { type: String, default: '0.7-3.1' }
  },
  amh: {
    normalOvarian: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '1.0-4.0' }
    },
    lowOvarian: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '<1.0' }
    },
    high: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '>4.0' }
    }
  },
  fastingInsulin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µIU/mL' },
    normalRange: { type: String, default: '2.6-24.9' }
  },
  fastingGlucose: {
    normal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mg/dL' },
      normalRange: { type: String, default: '70-100' }
    },
    prediabetes: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mg/dL' },
      normalRange: { type: String, default: '100-125' }
    },
    diabetes: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'mg/dL' },
      normalRange: { type: String, default: '≥126' }
    }
  },
  shbgFemale: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'nmol/L' },
    normalRange: { type: String, default: '18-144' }
  }
});

// Menopause Profile Schema
const menopauseProfileSchema = new mongoose.Schema({
  inhibinB: {
    premenopausal1: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '5-45' }
    },
    postmenopausal1: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '<5' }
    },
    premenopausal2: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '17-200' }
    },
    postmenopausal2: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'pg/mL' },
      normalRange: { type: String, default: '<65' }
    }
  },
  boneALP: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'U/L' },
    normalRange: { type: String, default: '11.6-29.6' }
  },
  osteocalcin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/mL' },
    normalRange: { type: String, default: '11-43' }
  },
  ctx: {
    premenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '0.1-0.6' }
    },
    postmenopausal: {
      value: { type: Number, required: true },
      unit: { type: String, default: 'ng/mL' },
      normalRange: { type: String, default: '0.2-1.0' }
    }
  },
  calciumTotal: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '8.5-10.5' }
  },
  phosphorus: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '2.5-4.5' }
  },
  magnesium: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/dL' },
    normalRange: { type: String, default: '1.7-2.2' }
  }
});

// Urine Routine Schema
const urineRoutineSchema = new mongoose.Schema({
  color: {
    value: { type: String, required: true },
    normalRange: { type: String, default: 'Pale Yellow' }
  },
  specificGravity: {
    value: { type: Number, required: true },
    normalRange: { type: String, default: '1.005-1.030' }
  },
  ph: {
    value: { type: Number, required: true },
    normalRange: { type: String, default: '4.6-8.0' }
  },
  protein: {
    value: { type: String, required: true },
    normalRange: { type: String, default: 'Negative' }
  },
  glucose: {
    value: { type: String, required: true },
    normalRange: { type: String, default: 'Negative' }
  },
  ketones: {
    value: { type: String, required: true },
    normalRange: { type: String, default: 'Negative' }
  },
  rbc: {
    value: { type: Number, required: true },
    unit: { type: String, default: '/hpf' },
    normalRange: { type: String, default: '0-2' }
  },
  wbc: {
    value: { type: Number, required: true },
    unit: { type: String, default: '/hpf' },
    normalRange: { type: String, default: '0-5' }
  }
});

// Semen Analysis Schema
const semenAnalysisSchema = new mongoose.Schema({
  volume: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mL' },
    normalRange: { type: String, default: '>1.5' }
  },
  ph: {
    value: { type: Number, required: true },
    normalRange: { type: String, default: '7.2-8.0' }
  },
  spermConcentration: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'million/mL' },
    normalRange: { type: String, default: '>15' }
  },
  totalSpermCount: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'million' },
    normalRange: { type: String, default: '>39' }
  },
  mobility: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '>32' }
  },
  totalMobility: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '>40' }
  },
  morphology: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '>4' }
  },
  vitality: {
    value: { type: Number, required: true },
    unit: { type: String, default: '%' },
    normalRange: { type: String, default: '>58' }
  }
});

// Weight Gain/Loss Schema
const weightGainLossSchema = new mongoose.Schema({
  tsh: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µIU/mL' },
    normalRange: { type: String, default: '0.4-4.5' }
  },
  freeT3: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'pg/mL' },
    normalRange: { type: String, default: '2.0-4.4' }
  },
  freeT4: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'ng/dL' },
    normalRange: { type: String, default: '0.9-2.3' }
  },
  cortisol: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µg/dL' },
    normalRange: { type: String, default: '5-25' }
  },
  insulin: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'µg/mL' },
    normalRange: { type: String, default: '2-25' }
  },
  homaIR: {
    value: { type: Number, required: true },
    normalRange: { type: String, default: '<2.0 Ideal' }
  }
});

// Main Blood Report Schema
const bloodReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referringDoctor: {
    name: { type: String, required: true },
    specialization: { type: String },
    contactNumber: { type: String },
    email: { type: String }
  },
  labName: {
    type: String,
    required: true
  },
  reportDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  clinicalNotes: {
    type: String,
    maxlength: 2000
  },
  testCategories: {
    cbc: cbcSchema,
    bloodSugar: bloodSugarSchema,
    thyroidProfile: thyroidProfileSchema,
    lipidProfile: lipidProfileSchema,
    liverFunction: liverFunctionSchema,
    kidneyFunction: kidneyFunctionSchema,
    hormonalAnalysis: hormonalAnalysisSchema,
    pcosPcodPanel: pcosPcodPanelSchema,
    menopauseProfile: menopauseProfileSchema,
    urineRoutine: urineRoutineSchema,
    semenAnalysis: semenAnalysisSchema,
    weightGainLoss: weightGainLossSchema
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'reviewed'],
    default: 'completed'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bloodReportSchema.index({ userId: 1, reportDate: -1 });
bloodReportSchema.index({ labName: 1 });
bloodReportSchema.index({ status: 1 });

// Virtual for formatted report date
bloodReportSchema.virtual('formattedReportDate').get(function() {
  return this.reportDate.toLocaleDateString();
});

// Ensure virtual fields are serialized
bloodReportSchema.set('toJSON', { virtuals: true });

export default mongoose.model('BloodReport', bloodReportSchema);
