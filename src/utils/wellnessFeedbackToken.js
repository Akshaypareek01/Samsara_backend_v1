import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../config/config.js';
import { tokenTypes } from '../config/tokens.js';
import ApiError from './ApiError.js';

/**
 * Signs a JWT for public wellness feedback tied to a completed booking.
 *
 * @param {{ bookingId: string, companyId: string, trainerIds: string[] }} params
 * @returns {{ token: string, expiresAt: Date }}
 */
export function signWellnessFeedbackToken({ bookingId, companyId, trainerIds }) {
    const days = config.wellnessFeedback?.tokenExpirationDays ?? 90;
    const expires = moment().add(days, 'days');
    const payload = {
        sub: bookingId,
        companyId,
        trainerIds,
        type: tokenTypes.WELLNESS_FEEDBACK,
        iat: moment().unix(),
        exp: expires.unix(),
    };
    return {
        token: jwt.sign(payload, config.jwt.secret),
        expiresAt: expires.toDate(),
    };
}

/**
 * Verifies and decodes a wellness feedback share token.
 *
 * @param {string} token - JWT from share link.
 * @returns {{ bookingId: string, companyId: string, trainerIds: string[] }}
 */
export function verifyWellnessFeedbackToken(token) {
    try {
        const payload = jwt.verify(token, config.jwt.secret);
        if (payload.type !== tokenTypes.WELLNESS_FEEDBACK) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid feedback link');
        }
        return {
            bookingId: String(payload.sub),
            companyId: String(payload.companyId),
            trainerIds: Array.isArray(payload.trainerIds)
                ? payload.trainerIds.map(String)
                : [],
        };
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(httpStatus.UNAUTHORIZED, 'This feedback link is invalid or has expired');
    }
}
