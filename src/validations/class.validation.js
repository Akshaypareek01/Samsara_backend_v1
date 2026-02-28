import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createClass = {
  body: Joi.object().keys({
    classImage: Joi.string().uri().optional(),
    className: Joi.string().required().min(3).max(100),
    classType: Joi.string().required().valid('online', 'offline'),
    duration: Joi.number().integer().min(15).max(480).required(),
    maxCapacity: Joi.number().integer().min(1).max(100).required(),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
    schedule: Joi.array()
      .items(
        Joi.object().keys({
          day: Joi.string().required().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
          startTime: Joi.string()
            .required()
            .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string()
            .required()
            .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      )
      .min(1)
      .required(),
    classDetails: Joi.string().required().min(10).max(2000),
    perfectFor: Joi.string().required().min(10).max(500),
    skipIf: Joi.string().required().min(10).max(500),
    whatYouWillGain: Joi.string().required().min(10).max(1000),
    teacher: Joi.string().custom(objectId).required(),
    price: Joi.number().min(0).default(0),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    tags: Joi.array().items(Joi.string().trim()),
    category: Joi.string().trim(),
    prerequisites: Joi.array().items(Joi.string().trim()),
    materials: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().trim(),
        type: Joi.string().valid('document', 'video', 'link', 'other').default('document'),
        url: Joi.string().uri().optional(),
        description: Joi.string().trim(),
      })
    ),
    enrollmentStartDate: Joi.date(),
    enrollmentEndDate: Joi.date().min(Joi.ref('enrollmentStartDate')),
    classStartDate: Joi.date(),
    classEndDate: Joi.date().min(Joi.ref('classStartDate')),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
  }),
};

const getClasses = {
  query: Joi.object().keys({
    className: Joi.string(),
    classType: Joi.string().valid('online', 'offline'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    teacher: Joi.string().custom(objectId),
    status: Joi.string().valid('active', 'inactive', 'completed', 'cancelled'),
    isPublished: Joi.boolean(),
    category: Joi.string(),
    tags: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    minRating: Joi.number().min(0).max(5),
    maxCapacity: Joi.number().integer().min(1),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
  }),
};

const getClass = {
  params: Joi.object().keys({
    classId: Joi.string().custom(objectId),
  }),
};

const updateClass = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      classImage: Joi.string().uri(),
      className: Joi.string().min(3).max(100),
      classType: Joi.string().valid('online', 'offline'),
      duration: Joi.number().integer().min(15).max(480),
      maxCapacity: Joi.number().integer().min(1).max(100),
      level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
      schedule: Joi.array().items(
        Joi.object().keys({
          day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
          startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
          endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        })
      ),
      classDetails: Joi.string().min(10).max(2000),
      perfectFor: Joi.string().min(10).max(500),
      skipIf: Joi.string().min(10).max(500),
      whatYouWillGain: Joi.string().min(10).max(1000),
      teacher: Joi.string().custom(objectId),
      status: Joi.string().valid('active', 'inactive', 'completed', 'cancelled'),
      isPublished: Joi.boolean(),
      price: Joi.number().min(0),
      currency: Joi.string().valid('INR', 'USD', 'EUR'),
      tags: Joi.array().items(Joi.string().trim()),
      category: Joi.string().trim(),
      prerequisites: Joi.array().items(Joi.string().trim()),
      materials: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().trim(),
          type: Joi.string().valid('document', 'video', 'link', 'other'),
          url: Joi.string().uri(),
          description: Joi.string().trim(),
        })
      ),
      enrollmentStartDate: Joi.date(),
      enrollmentEndDate: Joi.date().min(Joi.ref('enrollmentStartDate')),
      classStartDate: Joi.date(),
      classEndDate: Joi.date().min(Joi.ref('classStartDate')),
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    })
    .min(1),
};

const deleteClass = {
  params: Joi.object().keys({
    classId: Joi.string().custom(objectId),
  }),
};

const enrollStudent = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const removeStudent = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const addRating = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(500).optional(),
  }),
};

const removeRating = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const markAttendance = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
    date: Joi.date().required(),
    status: Joi.string().valid('present', 'absent', 'late').default('present'),
    notes: Joi.string().max(200).optional(),
  }),
};

const updateClassStatus = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('active', 'inactive', 'completed', 'cancelled').required(),
      isPublished: Joi.boolean(),
    })
    .min(1),
};

const publishClass = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    isPublished: Joi.boolean().required(),
  }),
};

const getClassStudents = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getClassRatings = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    minRating: Joi.number().min(1).max(5),
    maxRating: Joi.number().min(1).max(5),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getClassAttendance = {
  params: Joi.object().keys({
    classId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
    date: Joi.date(),
    status: Joi.string().valid('present', 'absent', 'late'),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  enrollStudent,
  removeStudent,
  addRating,
  removeRating,
  markAttendance,
  updateClassStatus,
  publishClass,
  getClassStudents,
  getClassRatings,
  getClassAttendance,
};
