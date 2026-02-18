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
    })
    .min(1),
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(20),
      mobile: Joi.string().min(10).max(15),
      emergencyMobile: Joi.string().min(10).max(15),
      gender: Joi.string(),
      dob: Joi.string(),
      age: Joi.string(),
      Address: Joi.string(),
      city: Joi.string(),
      pincode: Joi.string(),
      country: Joi.string(),
      height: Joi.string(),
      weight: Joi.string(),
      targetWeight: Joi.string(),
      bodyshape: Joi.string(),
      weeklyyogaplan: Joi.string(),
      practicetime: Joi.string(),
      focusarea: Joi.array().items(Joi.string()),
      goal: Joi.array().items(Joi.string()),
      health_issues: Joi.array().items(Joi.string()),
      howyouknowus: Joi.string(),
      PriorExperience: Joi.string(),
      description: Joi.string(),
      achievements: Joi.array().items(Joi.string()),
      // User category (for regular users)
      userCategory: Joi.string().valid('Personal', 'Corporate'),
      // Teacher specific fields
      teacherCategory: Joi.string().valid(
        'Fitness Coach',
        'Ayurveda Specialist',
        'Mental Health Specialist',
        'Yoga Trainer',
        'General Trainer'
      ),
      teachingExperience: Joi.string(),
      expertise: Joi.array().items(Joi.string()),
      qualification: Joi.array().items(Joi.object()),
      additional_courses: Joi.array().items(Joi.object()),
      // Company related fields (for corporate users)
      company_name: Joi.string().custom(objectId),
      companyId: Joi.string(),
      corporate_id: Joi.string(),
      profileImage: Joi.string().uri().allow('').optional(),
      AboutMe: Joi.string().allow('').optional(),
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

const updateNotificationToken = {
  body: Joi.object().keys({
    notificationToken: Joi.string().required().min(1).max(500),
  }),
};

export { createUser, getUsers, getUser, updateUser, updateProfile, updateProfileImage, deleteUser, updateNotificationToken };
