import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import { tokenTypes } from '../config/tokens.js';

const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [tokenTypes.REFRESH, tokenTypes.RESET_PASSWORD, tokenTypes.VERIFY_EMAIL],
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

/**
 * @typedef Token
 */
// Refresh/reset lookups filter on these; without indexes every logout and
// refresh is a collection scan over long JWT strings.
tokenSchema.index({ token: 1 });
tokenSchema.index({ user: 1, type: 1 });
// Self-clean expired rows so the collection stops growing without bound.
tokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const Token = mongoose.model('Token', tokenSchema);

export default Token;
