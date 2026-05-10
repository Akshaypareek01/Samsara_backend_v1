import Joi from 'joi';

const leaderboardQuery = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100),
  }),
};

export { leaderboardQuery };
