import mongoose from 'mongoose';
import { toJSON } from './plugins/index.js';
import { HOME_BANNER_PLACEMENTS, HOME_BANNER_SCREENS } from '../constants/homeBannerScreens.js';

const homeBannerSchema = new mongoose.Schema(
  {
    placement: {
      type: String,
      enum: HOME_BANNER_PLACEMENTS,
      required: [true, 'Placement is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    ctaText: {
      type: String,
      trim: true,
      default: '',
    },
    targetScreen: {
      type: String,
      enum: [...HOME_BANNER_SCREENS, null],
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

homeBannerSchema.index({ placement: 1, isActive: 1, order: 1 });

homeBannerSchema.plugin(toJSON);

/**
 * @typedef HomeBanner
 */
const HomeBanner = mongoose.model('HomeBanner', homeBannerSchema);

export default HomeBanner;
