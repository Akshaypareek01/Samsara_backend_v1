import Joi from 'joi';
import { objectId } from './custom.validation.js';

/**
 * Request validation for the Events and Classes write routes.
 *
 * Written against the **actual** models and the payloads the three live clients
 * send. The pre-existing `event.validation.js` / `class.validation.js` describe
 * a different, never-shipped shape (`maxSeats`, `eventDate`, `duration`,
 * `moderator`) and would reject every real request — they are dead code.
 *
 * Three details that must not be "tidied up":
 *
 * 1. The mobile app sends `startDate` as `MM/DD/YYYY` (`toLocaleDateString`
 *    en-US), not ISO. `Joi.date().iso()` rejects every event the app creates.
 *    `Joi.date()` accepts both, matching Mongoose's own casting.
 * 2. Classes are created with `schedules[]` and **no** `schedule`; a pre-save
 *    hook derives `schedule` from `schedules[0].date`. Requiring `schedule`
 *    breaks class creation from every client.
 * 3. `availableseats` is a String on the Event model even though clients put a
 *    number in it, so it accepts both and is normalised by Mongoose.
 */

/** HH:MM, 24-hour. Matches the app's `formatTimeForApi`. */
const timeOfDay = Joi.string()
  .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
  .messages({ 'string.pattern.base': '{{#label}} must be in HH:MM 24-hour format' });

/** Accepts MM/DD/YYYY, ISO strings and Date objects alike. */
const flexibleDate = Joi.date();

const latitude = Joi.number().min(-90).max(90);
const longitude = Joi.number().min(-180).max(180);

/* ────────────────────────────── EVENTS ────────────────────────────── */

const eventBody = {
  eventName: Joi.string().trim().min(3).max(150),
  details: Joi.string().trim().max(5000).allow(''),
  teacher: Joi.string().custom(objectId),
  type: Joi.string().valid('free', 'paid'),
  level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced'),
  // String on the model; clients send a number. Accept both, reject nonsense.
  availableseats: Joi.alternatives().try(
    Joi.number().integer().min(1).max(100),
    Joi.string().pattern(/^(?:[1-9]|[1-9]\d|100)$/)
  ),
  image: Joi.string().uri().allow('', null),
  startDate: flexibleDate,
  startTime: timeOfDay,
  endTime: timeOfDay.allow('', null),
  eventmode: Joi.string().valid('online', 'offline'),
  location: Joi.string().trim().max(300).allow(''),
  latitude,
  longitude,
  whoitsfor: Joi.string().trim().max(2000).allow(''),
  whoitsnotfor: Joi.string().trim().max(2000).allow(''),
  howItWillHelp: Joi.string().trim().max(2000).allow(''),
  howItWillnotHelp: Joi.string().trim().max(2000).allow(''),
  status: Joi.boolean(),
  // Set server-side by the Zoom flow; never accepted from a client.
  password: Joi.any().forbidden(),
  meeting_number: Joi.any().forbidden(),
  zoomAccountUsed: Joi.any().forbidden(),
  students: Joi.any().forbidden(),
};

const createEvent = {
  body: Joi.object()
    .keys({ ...eventBody, eventName: eventBody.eventName.required() })
    .messages({ 'any.unknown': '{{#label}} is not accepted on this endpoint' }),
};

const updateEvent = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId).required() }),
  body: Joi.object().keys(eventBody).min(1),
};

const eventIdParam = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId).required() }),
};

const registerUserToEvent = {
  body: Joi.object().keys({
    eventId: Joi.string().custom(objectId).required(),
    userId: Joi.string().custom(objectId).required(),
  }),
};

/* ────────────────────────────── CLASSES ───────────────────────────── */

const scheduleEntry = Joi.object().keys({
  date: flexibleDate,
  days: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  startTime: timeOfDay,
  endTime: timeOfDay,
});

const classBody = {
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().max(5000).allow(''),
  teacher: Joi.string().custom(objectId),
  status: Joi.boolean(),
  cancelled: Joi.any().forbidden(),
  cancelledAt: Joi.any().forbidden(),
  cancellationReason: Joi.any().forbidden(),
  // Either form is valid: `schedule` directly, or `schedules[]` from which the
  // model's pre-save hook derives it.
  schedule: flexibleDate,
  schedules: Joi.array().items(scheduleEntry).max(50),
  startTime: timeOfDay,
  endTime: timeOfDay,
  level: Joi.array().items(Joi.string().valid('Beginner', 'Intermediate', 'Advanced')),
  image: Joi.string().uri().allow('', null),
  classType: Joi.string().valid('online', 'offline'),
  classCategory: Joi.string().valid('yoga class', 'meditation class', 'pcos/pcod class', 'thyroid class'),
  duration: Joi.number().integer().min(5).max(480),
  maxCapacity: Joi.number().integer().min(1).max(60),
  perfectFor: Joi.array().items(Joi.string().max(300)).max(20),
  skipIf: Joi.array().items(Joi.string().max(300)).max(20),
  whatYoullGain: Joi.array().items(Joi.string().max(300)).max(20),
  latitude,
  longitude,
  // Zoom fields are server-owned.
  password: Joi.any().forbidden(),
  meeting_number: Joi.any().forbidden(),
  zoomAccountUsed: Joi.any().forbidden(),
  zoomJoinUrl: Joi.any().forbidden(),
  zoomStartUrl: Joi.any().forbidden(),
  zoomMeetingId: Joi.any().forbidden(),
  students: Joi.any().forbidden(),
};

const createClass = {
  body: Joi.object()
    .keys({
      ...classBody,
      title: classBody.title.required(),
      teacher: classBody.teacher.required(),
      classType: classBody.classType.required(),
    })
    // The model requires `schedule`, but clients send `schedules`; accept either.
    .or('schedule', 'schedules')
    .messages({ 'object.missing': 'Either schedule or schedules is required' }),
};

const updateClass = {
  params: Joi.object().keys({ classId: Joi.string().custom(objectId).required() }),
  body: Joi.object().keys(classBody).min(1),
};

const classIdParam = {
  params: Joi.object().keys({ classId: Joi.string().custom(objectId).required() }),
};

export const eventValidation = { createEvent, updateEvent, eventIdParam, registerUserToEvent };
export const classValidation = { createClass, updateClass, classIdParam };
