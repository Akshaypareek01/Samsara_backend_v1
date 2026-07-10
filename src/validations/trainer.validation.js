import Joi from 'joi';
import { objectId } from './custom.validation.js';
import {
  TRAINER_CATEGORY_ENUM,
  TRAINER_EXPERIENCE_ENUM,
  TRAINER_SPECIALIST_IN_ALL,
  TRAINER_SPECIALIST_IN_CURRENT,
  TRAINER_TYPE_OF_TRAINING_ALL,
  TRAINER_TYPE_OF_TRAINING_CURRENT,
  TRAINER_CITY_ENUM,
} from '../constants/trainerProfileEnums.js';
import {
  MAX_TRAINER_CERTIFICATION_ENTRIES,
  MAX_TRAINER_EDUCATION_ENTRIES,
  normalizeQualificationListForValidation,
} from '../utils/trainerQualificationUtils.js';
import { normalizeTrainerCategories } from '../utils/trainerCategoryUtils.js';

const categoryEnum = TRAINER_CATEGORY_ENUM;
const specialistInEnum = TRAINER_SPECIALIST_IN_CURRENT;
const specialistInUpdateEnum = TRAINER_SPECIALIST_IN_ALL;
const typeOfTrainingEnum = TRAINER_TYPE_OF_TRAINING_CURRENT;
const typeOfTrainingUpdateEnum = TRAINER_TYPE_OF_TRAINING_ALL;
const experienceEnum = TRAINER_EXPERIENCE_ENUM;

/** Query param may be a single value or repeated array from the client. */
const queryStringOrArray = (enumValues) =>
  Joi.alternatives().try(
    Joi.string().valid(...enumValues),
    Joi.array().items(Joi.string().valid(...enumValues)).min(1)
  );

/** Maximum training gallery images per trainer profile. */
const MAX_TRAINER_GALLERY_IMAGES = 6;

const trainerGalleryImageSchema = Joi.object().keys({
  key: Joi.string().required(),
  path: Joi.string().required(),
  _id: Joi.any().strip(),
});

const trainerGalleryImagesSchema = Joi.array()
  .items(trainerGalleryImageSchema)
  .max(MAX_TRAINER_GALLERY_IMAGES)
  .messages({
    'array.max': `You can upload at most ${MAX_TRAINER_GALLERY_IMAGES} gallery photos`,
  });

/** Cities where the trainer operates (deduped, valid enum values). */
const citiesSchema = Joi.array()
  .items(Joi.string().valid(...TRAINER_CITY_ENUM))
  .unique()
  .messages({
    'array.unique': 'Duplicate cities are not allowed',
    'any.only': 'Please select valid cities',
  });

const optionalCitiesSchema = citiesSchema.min(1).messages({
  'array.min': 'Select at least one city',
});

const registrationCitiesSchema = citiesSchema.min(1).required().messages({
  'any.required': 'At least one city is required',
  'array.min': 'Select at least one city',
  'any.only': 'Please select valid cities',
});

/** Trainer category — accepts legacy single string or array; normalizes to string[]. */
const categoryInputSchema = Joi.alternatives()
  .try(
    Joi.string().valid(...categoryEnum),
    Joi.array().items(Joi.string().valid(...categoryEnum)).min(1).unique()
  )
  .custom((value) => {
    const normalized = normalizeTrainerCategories(value);
    if (normalized.length === 0) {
      throw new Error('Trainer category is required');
    }
    return normalized;
  })
  .messages({
    'any.only': `Category must be one of: ${categoryEnum.join(', ')}`,
    'array.min': 'Select at least one trainer category',
    'array.unique': 'Duplicate categories are not allowed',
  });

const categoryRequiredSchema = categoryInputSchema.required().messages({
  'any.required': 'Trainer category is required',
});

const categoryOptionalSchema = categoryInputSchema.optional();

// Shared optional sub-schemas reused across create/update validators
const educationSchema = Joi.object().keys({
  qualification: Joi.string().trim().allow('', null),
  university: Joi.string().trim().allow('', null),
  yearOfCompletion: Joi.number().integer().min(1900).max(2100).allow(null),
  _id: Joi.any().strip(),
});

const certificationSchema = Joi.object().keys({
  name: Joi.string().trim().allow('', null),
  institute: Joi.string().trim().allow('', null),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  _id: Joi.any().strip(),
});

const educationListSchema = Joi.alternatives()
  .try(
    Joi.array().items(educationSchema).max(MAX_TRAINER_EDUCATION_ENTRIES),
    educationSchema
  )
  .custom((value) =>
    normalizeQualificationListForValidation(
      value,
      ['qualification', 'university', 'yearOfCompletion'],
      MAX_TRAINER_EDUCATION_ENTRIES
    )
  );

const certificationListSchema = Joi.alternatives()
  .try(
    Joi.array().items(certificationSchema).max(MAX_TRAINER_CERTIFICATION_ENTRIES),
    certificationSchema
  )
  .custom((value) =>
    normalizeQualificationListForValidation(
      value,
      ['name', 'institute', 'year'],
      MAX_TRAINER_CERTIFICATION_ENTRIES
    )
  );

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PERSON_NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const TIME_SLOT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const weeklyAvailabilitySlotSchema = Joi.object().keys({
  startTime: Joi.string().pattern(TIME_SLOT_REGEX).required().messages({
    'string.pattern.base': 'Start time must be in HH:MM format (24-hour)',
  }),
  endTime: Joi.string().pattern(TIME_SLOT_REGEX).required().messages({
    'string.pattern.base': 'End time must be in HH:MM format (24-hour)',
  }),
  _id: Joi.any().strip(),
});

const weeklyAvailabilitySchema = Joi.array()
  .items(
    Joi.object().keys({
      dayOfWeek: Joi.number().integer().min(0).max(6).required(),
      slots: Joi.array().items(weeklyAvailabilitySlotSchema).min(1).required(),
      _id: Joi.any().strip(),
    })
  )
  .optional();

const panDocumentSchema = Joi.object()
  .keys({
    key: Joi.string().trim().allow('', null),
    path: Joi.string().trim().allow('', null),
  })
  .optional();

const gstDocumentSchema = Joi.object()
  .keys({
    key: Joi.string().trim().allow('', null),
    path: Joi.string().trim().allow('', null),
  })
  .optional();

const accountDetailsSchema = Joi.object().keys({
  upiId: Joi.string().trim().allow('', null).optional(),
  bankName: Joi.string().trim().allow('', null).optional(),
  accountNumber: Joi.string().trim().allow('', null).optional(),
  ifscCode: Joi.string().trim().uppercase().allow('', null).optional(),
  accountHolderName: Joi.string().trim().allow('', null).optional(),
  panNumber: Joi.string().trim().uppercase().pattern(PAN_REGEX).allow('', null).optional(),
  panDocument: panDocumentSchema,
  gstNumber: Joi.string().trim().uppercase().pattern(GST_REGEX).allow('', null).optional(),
  gstDocument: gstDocumentSchema,
});

// Personal/profile detail keys shared by create and update payloads
const profileDetailKeys = {
  dateOfBirth: Joi.date().allow(null),
  cities: optionalCitiesSchema,
  pinCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .allow('', null)
    .messages({ 'string.pattern.base': 'PIN code must be 6 digits' }),
  experience: Joi.string()
    .valid(...experienceEnum)
    .allow('', null),
  education: educationListSchema,
  certification: certificationListSchema,
};

/** Required personal details for public trainer registration */
const registrationProfileDetailKeys = {
  dateOfBirth: Joi.date().required().max('now').messages({
    'any.required': 'Date of birth is required',
    'date.base': 'Please enter a valid date of birth',
    'date.max': 'Date of birth cannot be in the future',
  }),
  cities: registrationCitiesSchema,
  pinCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'any.required': 'PIN code is required',
      'string.empty': 'PIN code is required',
      'string.pattern.base': 'PIN code must be exactly 6 digits',
    }),
  experience: Joi.string()
    .valid(...experienceEnum)
    .required()
    .messages({
      'any.required': 'Years of experience is required',
      'any.only': 'Please select a valid experience range',
      'string.empty': 'Years of experience is required',
    }),
  education: educationListSchema,
  certification: certificationListSchema,
};

const createTrainer = {
  body: Joi.object().keys({
    email: Joi.string().required().trim().email().messages({
      'any.required': 'Email is required',
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
    }),
    mobile: Joi.string()
      .required()
      .pattern(/^[0-9]{10}$/)
      .messages({
        'any.required': 'Mobile number is required',
        'string.empty': 'Mobile number is required',
        'string.pattern.base': 'Mobile number must be exactly 10 digits',
      }),
    name: Joi.string()
      .required()
      .trim()
      .pattern(PERSON_NAME_REGEX)
      .messages({
        'any.required': 'Full name is required',
        'string.empty': 'Full name is required',
        'string.pattern.base': "Name must contain only letters, spaces, and . ' -",
      }),
    title: Joi.string().required().trim().messages({
      'any.required': 'Professional title is required',
      'string.empty': 'Professional title is required',
    }),
    bio: Joi.string().required().max(2000).trim().messages({
      'any.required': 'Bio is required',
      'string.empty': 'Bio is required',
      'string.max': 'Bio must be 2000 characters or less',
    }),
    category: categoryRequiredSchema,
    specialistIn: Joi.array()
      .items(Joi.string().valid(...specialistInEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'Select at least one Training For option',
        'any.required': 'Training For is required',
      }),
    typeOfTraining: Joi.array()
      .items(Joi.string().valid(...typeOfTrainingEnum))
      .min(1)
      .required()
      .messages({
        'array.min': 'Select at least one specialization',
        'any.required': 'Specializations are required',
      }),
    ...registrationProfileDetailKeys,
    images: trainerGalleryImagesSchema.optional(),
    profilePhoto: Joi.object()
      .keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
        _id: Joi.any().strip(), // Allow _id but strip it (MongoDB auto-generates this)
      })
      .optional(),
    status: Joi.boolean().optional(),
    acceptingBookings: Joi.boolean().optional(),
    weeklyAvailability: weeklyAvailabilitySchema,
  }),
};

const getTrainers = {
  query: Joi.object().keys({
    name: Joi.string(),
    category: Joi.string().valid(...categoryEnum),
    excludeCategory: Joi.string().valid(...categoryEnum),
    specialistIn: queryStringOrArray(specialistInEnum),
    typeOfTraining: queryStringOrArray(typeOfTrainingEnum),
    city: Joi.string().valid(...TRAINER_CITY_ENUM),
    status: Joi.boolean(),
    acceptingBookings: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const getTrainer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateMe = {
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      title: Joi.string().trim(),
      bio: Joi.string().max(2000).trim(),
      category: categoryOptionalSchema,
      specialistIn: Joi.array().items(Joi.string().valid(...specialistInUpdateEnum)).min(1),
      typeOfTraining: Joi.array().items(Joi.string().valid(...typeOfTrainingUpdateEnum)).min(1),
      ...profileDetailKeys,
      images: trainerGalleryImagesSchema,
      profilePhoto: Joi.object().keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
        _id: Joi.any().strip(), // Allow _id but strip it (MongoDB auto-generates this)
      }),
      status: Joi.boolean(),
      acceptingBookings: Joi.boolean(),
      weeklyAvailability: weeklyAvailabilitySchema,
      accountDetails: accountDetailsSchema.optional(),
    })
    .min(1),
};

const updateTrainer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      title: Joi.string().trim(),
      bio: Joi.string().max(2000).trim(),
      category: categoryOptionalSchema,
      specialistIn: Joi.array().items(Joi.string().valid(...specialistInUpdateEnum)).min(1),
      typeOfTraining: Joi.array().items(Joi.string().valid(...typeOfTrainingUpdateEnum)).min(1),
      ...profileDetailKeys,
      images: trainerGalleryImagesSchema,
      profilePhoto: Joi.object().keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
        _id: Joi.any().strip(), // Allow _id but strip it (MongoDB auto-generates this)
      }),
      status: Joi.boolean(),
      acceptingBookings: Joi.boolean(),
      weeklyAvailability: weeklyAvailabilitySchema,
      accountDetails: accountDetailsSchema.optional(),
    })
    .min(1),
};

const deleteTrainer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const addTrainerImage = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    key: Joi.string().required(),
    path: Joi.string().required(),
  }),
};

const removeTrainerImage = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    imageIndex: Joi.string().required(),
  }),
};

const updateTrainerProfilePhoto = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    key: Joi.string().required(),
    path: Joi.string().required(),
  }),
};

export {
  createTrainer,
  getTrainers,
  getTrainer,
  updateMe,
  updateTrainer,
  deleteTrainer,
  addTrainerImage,
  removeTrainerImage,
  updateTrainerProfilePhoto,
};





