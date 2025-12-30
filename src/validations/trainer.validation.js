import Joi from 'joi';
import { objectId } from './custom.validation.js';

const specialistInEnum = [
  'Mental Health',
  'Fitness',
  'Yoga',
  'Pilates',
  'Strength Training',
  'Cardio',
  'Weight Loss',
  'Weight Gain',
  'Nutrition',
  'Ayurveda',
  'Meditation',
  'Wellness',
  'Rehabilitation',
  'Sports Training',
  'Dance Fitness',
  'HIIT',
  'CrossFit',
  'Bodybuilding',
  'General Training',
];

const createTrainer = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    title: Joi.string().required().trim(),
    bio: Joi.string().required().max(2000).trim(),
    specialistIn: Joi.string()
      .required()
      .valid(...specialistInEnum),
    typeOfTraining: Joi.string().required().trim(),
    duration: Joi.string().required().trim(),
    images: Joi.array()
      .items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      )
      .optional(),
    profilePhoto: Joi.object()
      .keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      })
      .optional(),
    status: Joi.boolean().optional(),
  }),
};

const getTrainers = {
  query: Joi.object().keys({
    name: Joi.string(),
    specialistIn: Joi.string().valid(...specialistInEnum),
    typeOfTraining: Joi.string(),
    status: Joi.boolean(),
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

const updateTrainer = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim(),
      title: Joi.string().trim(),
      bio: Joi.string().max(2000).trim(),
      specialistIn: Joi.string().valid(...specialistInEnum),
      typeOfTraining: Joi.string().trim(),
      duration: Joi.string().trim(),
      images: Joi.array().items(
        Joi.object().keys({
          key: Joi.string().required(),
          path: Joi.string().required(),
        })
      ),
      profilePhoto: Joi.object().keys({
        key: Joi.string().allow(null, ''),
        path: Joi.string().allow(null, ''),
      }),
      status: Joi.boolean(),
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
  updateTrainer,
  deleteTrainer,
  addTrainerImage,
  removeTrainerImage,
  updateTrainerProfilePhoto,
};




