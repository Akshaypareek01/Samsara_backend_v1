import httpStatus from 'http-status';
import HomeBanner from '../models/home-banner.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Active banners for one home placement, sorted for the app carousel.
 * @param {'home_hero'|'home_updates'} placement
 * @returns {Promise<import('mongoose').Document[]>}
 */
const listActiveByPlacement = async (placement) => {
  return HomeBanner.find({ placement, isActive: true }).sort({ order: 1, createdAt: 1 });
};

/**
 * Admin list — includes inactive. Optional placement filter.
 * @param {{ placement?: string }} [filter]
 * @returns {Promise<import('mongoose').Document[]>}
 */
const listForAdmin = async (filter = {}) => {
  const query = {};
  if (filter.placement) {
    query.placement = filter.placement;
  }
  return HomeBanner.find(query).sort({ placement: 1, order: 1, createdAt: 1 });
};

/**
 * @param {string} bannerId
 * @returns {Promise<import('mongoose').Document>}
 */
const getBannerById = async (bannerId) => {
  const banner = await HomeBanner.findById(bannerId);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Banner not found');
  }
  return banner;
};

/**
 * @param {object} body
 * @returns {Promise<import('mongoose').Document>}
 */
const createBanner = async (body) => {
  return HomeBanner.create(body);
};

/**
 * @param {string} bannerId
 * @param {object} updateBody
 * @returns {Promise<import('mongoose').Document>}
 */
const updateBannerById = async (bannerId, updateBody) => {
  const banner = await getBannerById(bannerId);
  Object.assign(banner, updateBody);
  await banner.save();
  return banner;
};

/**
 * Hard-delete a banner.
 * @param {string} bannerId
 * @returns {Promise<void>}
 */
const deleteBannerById = async (bannerId) => {
  const banner = await getBannerById(bannerId);
  await banner.deleteOne();
};

export { listActiveByPlacement, listForAdmin, getBannerById, createBanner, updateBannerById, deleteBannerById };
