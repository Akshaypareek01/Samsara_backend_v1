import Joi from 'joi';
import { objectId } from './custom.validation.js';

export const dietGenerationValidation = {
    generateDiet: {
        body: Joi.object().keys({
            // Optional additional fields that can be passed to AI model
            dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
            preferredCuisine: Joi.array().items(Joi.string()).optional(),
            mealCount: Joi.number().integer().min(1).max(6).optional(),
            calorieTarget: Joi.number().positive().optional(),
            proteinTarget: Joi.number().positive().optional(),
            carbTarget: Joi.number().positive().optional(),
            fatTarget: Joi.number().positive().optional(),
            notes: Joi.string().max(500).optional()
        })
    },

    getHistory: {
        query: Joi.object().keys({
            page: Joi.number().integer().positive().optional(),
            limit: Joi.number().integer().positive().max(100).optional(),
            status: Joi.string().valid('generated', 'failed', 'pending').optional()
        })
    }
};
