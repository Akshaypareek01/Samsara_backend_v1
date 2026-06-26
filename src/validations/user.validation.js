import Joi from 'joi';
import { password, objectId } from './custom.validation.js';

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'teacher'),
    profileImage: Joi.string().uri().allow('').optional(),
    AboutMe: Joi.string().allow('').optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    search: Joi.string().allow('').optional(),
    userCategory: Joi.string().valid('Personal', 'Corporate'),
    companyId: Joi.string().allow('').optional(),
    companyName: Joi.string().allow('').optional(),
    corporate_id: Joi.string().allow('').optional(),
    mobile: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    status: Joi.string().valid('true', 'false', '').optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

/** Profile + admin fields allowed when updating a user by id (CRM admin). */
const adminUserProfileKeys = {
  mobile: Joi.string().min(10).max(15).allow(''),
  emergencyMobile: Joi.string().min(10).max(15).allow(''),
  gender: Joi.string().allow(''),
  dob: Joi.string().allow(''),
  age: Joi.string().allow(''),
  Address: Joi.string().allow(''),
  city: Joi.string().allow(''),
  pincode: Joi.string().allow(''),
  country: Joi.string().allow(''),
  height: Joi.string().allow(''),
  weight: Joi.string().allow(''),
  targetWeight: Joi.string().allow(''),
  bodyshape: Joi.string().allow(''),
  weeklyyogaplan: Joi.string().allow(''),
  practicetime: Joi.string().allow(''),
  focusarea: Joi.array().items(Joi.string()),
  goal: Joi.array().items(Joi.string()),
  health_issues: Joi.array().items(Joi.string()),
  howyouknowus: Joi.string().allow(''),
  PriorExperience: Joi.string().allow(''),
  description: Joi.string().allow(''),
  achievements: Joi.array().items(Joi.string()),
  userCategory: Joi.string().valid('Personal', 'Corporate'),
  teacherCategory: Joi.string().valid(
    'Fitness Coach',
    'Ayurveda Specialist',
    'Mental Health Specialist',
    'Yoga Trainer',
    'Sound Healing',
    'Psychologist',
    'General Trainer'
  ),
  teachingExperience: Joi.string().allow(''),
  expertise: Joi.array().items(Joi.string()),
  qualification: Joi.array().items(Joi.object()),
  additional_courses: Joi.array().items(Joi.object()),
  company_name: Joi.string().allow(''),
  companyId: Joi.string().allow(''),
  corporate_id: Joi.string().allow(''),
  status: Joi.boolean(),
  active: Joi.boolean(),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      profileImage: Joi.string().uri().allow('').optional(),
      AboutMe: Joi.string().allow('').optional(),
      notificationToken: Joi.string().min(1).max(500).optional(),
      ...adminUserProfileKeys,
    })
    .min(1),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(20),
      profileImage: Joi.string().uri().allow('').optional(),
      AboutMe: Joi.string().allow('').optional(),
      ...adminUserProfileKeys,
    })
    .min(1),
};

const updateProfileImage = {
  body: Joi.object().keys({
    profileImage: Joi.string().uri().required(),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const bulkDeleteUsers = {
  body: Joi.object().keys({
    userIds: Joi.array().items(Joi.string().custom(objectId)).min(1).max(50).required(),
  }),
};

const updateNotificationToken = {
  body: Joi.object().keys({
    notificationToken: Joi.string().required().min(1).max(500),
  }),
};

export {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateProfile,
  updateProfileImage,
  deleteUser,
  bulkDeleteUsers,
  updateNotificationToken,
};
