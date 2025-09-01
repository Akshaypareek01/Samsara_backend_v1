import Joi from 'joi';
import { password, objectId } from './custom.validation.js';

const createTeacher = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    gender: Joi.string().valid('male', 'female', 'other'),
    mobile: Joi.string().required().min(10).max(15),
    teachingExperience: Joi.number().min(0).max(50),
    dob: Joi.date().required().max('now'),
    images: Joi.array().items(
      Joi.object().keys({
        filename: Joi.string().required(),
        path: Joi.string().required(),
        alt: Joi.string(),
      })
    ),
    address: Joi.object()
      .keys({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        pincode: Joi.string()
          .required()
          .pattern(/^[1-9][0-9]{5}$/),
        country: Joi.string().required().default('India'),
      })
      .required(),
    expertise: Joi.array().items(Joi.string()).min(1),
    qualification: Joi.array()
      .items(
        Joi.object().keys({
          degree: Joi.string().required(),
          institution: Joi.string().required(),
          year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
          grade: Joi.string(),
          certificate: Joi.object().keys({
            filename: Joi.string(),
            path: Joi.string(),
          }),
        })
      )
      .min(1),
    additionalCourses: Joi.array().items(
      Joi.object().keys({
        courseName: Joi.string().required(),
        institution: Joi.string().required(),
        duration: Joi.string(),
        completionDate: Joi.date(),
        certificate: Joi.object().keys({
          filename: Joi.string(),
          path: Joi.string(),
        }),
      })
    ),
    description: Joi.string().max(1000),
    achievements: Joi.array().items(Joi.string()),
  }),
};

const getTeachers = {
  query: Joi.object().keys({
    name: Joi.string(),
    email: Joi.string().email(),
    gender: Joi.string().valid('male', 'female', 'other'),
    city: Joi.string(),
    expertise: Joi.string(),
    status: Joi.boolean(),
    active: Joi.boolean(),
    isEmailVerified: Joi.boolean(),
    isProfileComplete: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTeacher = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId),
  }),
};

const updateTeacher = {
  params: Joi.object().keys({
    teacherId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(50),
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      gender: Joi.string().valid('male', 'female', 'other'),
      mobile: Joi.string().min(10).max(15),
      teachingExperience: Joi.number().min(0).max(50),
      dob: Joi.date().max('now'),
      images: Joi.array().items(
        Joi.object().keys({
          filename: Joi.string().required(),
          path: Joi.string().required(),
          alt: Joi.string(),
        })
      ),
      address: Joi.object().keys({
        street: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        pincode: Joi.string().pattern(/^[1-9][0-9]{5}$/),
        country: Joi.string(),
      }),
      expertise: Joi.array().items(Joi.string()),
      qualification: Joi.array().items(
        Joi.object().keys({
          degree: Joi.string().required(),
          institution: Joi.string().required(),
          year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
          grade: Joi.string(),
          certificate: Joi.object().keys({
            filename: Joi.string(),
            path: Joi.string(),
          }),
        })
      ),
      additionalCourses: Joi.array().items(
        Joi.object().keys({
          courseName: Joi.string().required(),
          institution: Joi.string().required(),
          duration: Joi.string(),
          completionDate: Joi.date(),
          certificate: Joi.object().keys({
            filename: Joi.string(),
            path: Joi.string(),
          }),
        })
      ),
      description: Joi.string().max(1000),
      achievements: Joi.array().items(Joi.string()),
      status: Joi.boolean(),
      active: Joi.boolean(),
      isEmailVerified: Joi.boolean(),
    })
    .min(1),
};

const deleteTeacher = {
  params: Joi.object().keys({
    teacherId: Joi.string().custom(objectId),
  }),
};

const updateTeacherStatus = {
  params: Joi.object().keys({
    teacherId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.boolean().required(),
      active: Joi.boolean(),
      isEmailVerified: Joi.boolean(),
    })
    .min(1),
};

const resetPassword = {
  params: Joi.object().keys({
    teacherId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPasswordToken = {
  body: Joi.object().keys({
    token: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  params: Joi.object().keys({
    teacherId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    isEmailVerified: Joi.boolean().required(),
  }),
};

export {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  updateTeacherStatus,
  resetPassword,
  forgotPassword,
  resetPasswordToken,
  verifyEmail,
};
