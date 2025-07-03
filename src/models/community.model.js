import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index';

const CommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const CommunityPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
    },
    attachmentUrl: {
      type: String,
    },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
    },
    type: {
      type: String,
      enum: ['post', 'challenge', 'question'],
      default: 'post',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [CommentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CommunityPostSchema.plugin(toJSON);
CommunityPostSchema.plugin(paginate);

export const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);
