import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createEvent = {
  body: Joi.object().keys({
    eventName: Joi.string().required().min(3).max(100),
    eventMode: Joi.string().required().valid('offline', 'online'),
    location: Joi.when('eventMode', {
      is: 'offline',
      then: Joi.string().required().min(5).max(200),
      otherwise: Joi.string().optional(),
    }),
    meetingLink: Joi.when('eventMode', {
      is: 'online',
      then: Joi.string().uri().required(),
      otherwise: Joi.string().optional(),
    }),
    meetingPassword: Joi.when('eventMode', {
      is: 'online',
      then: Joi.string().min(4).required(),
      otherwise: Joi.string().optional(),
    }),
    eventImage: Joi.string().uri().optional(),
    eventDetails: Joi.string().required().min(10).max(2000),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').optional(),
    maxSeats: Joi.number().integer().min(1).max(1000).required(),
    eventDate: Joi.date().min('now').required(),
    eventTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    duration: Joi.number().integer().min(15).max(480).required(),
    moderator: Joi.string().custom(objectId).required(),
    offlineRequirements: Joi.when('eventMode', {
      is: 'offline',
      then: Joi.array()
        .items(
          Joi.object().keys({
            point: Joi.string().required().min(5).max(200),
            order: Joi.number().integer().min(1).max(5).required(),
          })
        )
        .min(1)
        .max(5),
      otherwise: Joi.array().optional(),
    }),
    onlineRequirements: Joi.when('eventMode', {
      is: 'online',
      then: Joi.array()
        .items(
          Joi.object().keys({
            point: Joi.string().required().min(5).max(200),
            order: Joi.number().integer().min(1).max(5).required(),
          })
        )
        .min(1)
        .max(5),
      otherwise: Joi.array().optional(),
    }),
    isPaid: Joi.boolean().default(false),
    price: Joi.when('isPaid', {
      is: true,
      then: Joi.number().min(1).required(),
      otherwise: Joi.number().min(0).default(0),
    }),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    registrationStartDate: Joi.date().min('now'),
    registrationEndDate: Joi.date().min(Joi.ref('registrationStartDate')),
    tags: Joi.array().items(Joi.string().trim()),
    category: Joi.string().trim(),
    highlights: Joi.array().items(Joi.string().trim().max(100)),
    speakers: Joi.array().items(
      Joi.object().keys({
        name: Joi.string().required().trim().min(2).max(50),
        designation: Joi.string().trim().max(100),
        bio: Joi.string().trim().max(500),
        image: Joi.string().uri(),
      })
    ),
    certificates: Joi.boolean().default(false),
    certificateTemplate: Joi.when('certificates', {
      is: true,
      then: Joi.string().trim().optional(),
      otherwise: Joi.string().optional(),
    }),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
  }),
};

const getEvents = {
  query: Joi.object().keys({
    eventName: Joi.string(),
    eventMode: Joi.string().valid('offline', 'online'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    moderator: Joi.string().custom(objectId),
    status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled'),
    isPaid: Joi.boolean(),
    category: Joi.string(),
    tags: Joi.string(),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    minRating: Joi.number().min(0).max(5),
    maxSeats: Joi.number().integer().min(1),
    eventDate: Joi.date(),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
    certificates: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
  }),
};

const getEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId),
  }),
};

const updateEvent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      eventName: Joi.string().min(3).max(100),
      eventMode: Joi.string().valid('offline', 'online'),
      location: Joi.string().min(5).max(200),
      meetingLink: Joi.string().uri(),
      meetingPassword: Joi.string().min(4),
      eventImage: Joi.string().uri(),
      eventDetails: Joi.string().min(10).max(2000),
      level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
      maxSeats: Joi.number().integer().min(1).max(1000),
      eventDate: Joi.date().min('now'),
      eventTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      duration: Joi.number().integer().min(15).max(480),
      moderator: Joi.string().custom(objectId),
      offlineRequirements: Joi.array()
        .items(
          Joi.object().keys({
            point: Joi.string().min(5).max(200),
            order: Joi.number().integer().min(1).max(5),
          })
        )
        .max(5),
      onlineRequirements: Joi.array()
        .items(
          Joi.object().keys({
            point: Joi.string().min(5).max(200),
            order: Joi.number().integer().min(1).max(5),
          })
        )
        .max(5),
      isPaid: Joi.boolean(),
      price: Joi.number().min(0),
      currency: Joi.string().valid('INR', 'USD', 'EUR'),
      status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled'),
      registrationStartDate: Joi.date(),
      registrationEndDate: Joi.date().min(Joi.ref('registrationStartDate')),
      tags: Joi.array().items(Joi.string().trim()),
      category: Joi.string().trim(),
      highlights: Joi.array().items(Joi.string().trim().max(100)),
      speakers: Joi.array().items(
        Joi.object().keys({
          name: Joi.string().trim().min(2).max(50),
          designation: Joi.string().trim().max(100),
          bio: Joi.string().trim().max(500),
          image: Joi.string().uri(),
        })
      ),
      certificates: Joi.boolean(),
      certificateTemplate: Joi.string().trim(),
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    })
    .min(1),
};

const deleteEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId),
  }),
};

const enrollStudent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const removeStudent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const addFeedback = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    review: Joi.string().max(500).optional(),
  }),
};

const removeFeedback = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    studentId: Joi.string().custom(objectId).required(),
  }),
};

const updateEventStatus = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').required(),
    })
    .min(1),
};

const getEventStudents = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEventFeedback = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  query: Joi.object().keys({
    minRating: Joi.number().min(1).max(5),
    maxRating: Joi.number().min(1).max(5),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUpcomingEvents = {
  query: Joi.object().keys({
    eventMode: Joi.string().valid('offline', 'online'),
    level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
    isPaid: Joi.boolean(),
    category: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOngoingEvents = {
  query: Joi.object().keys({
    eventMode: Joi.string().valid('offline', 'online'),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getCompletedEvents = {
  query: Joi.object().keys({
    eventMode: Joi.string().valid('offline', 'online'),
    moderator: Joi.string().custom(objectId),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  enrollStudent,
  removeStudent,
  addFeedback,
  removeFeedback,
  updateEventStatus,
  getEventStudents,
  getEventFeedback,
  getUpcomingEvents,
  getOngoingEvents,
  getCompletedEvents,
};
