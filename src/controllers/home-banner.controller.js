import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import * as homeBannerService from '../services/home-banner.service.js';

/**
 * GET /home-banners — active banners for the consumer app.
 */
const listActive = catchAsync(async (req, res) => {
  const banners = await homeBannerService.listActiveByPlacement(req.query.placement);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Banners fetched',
    data: banners,
  });
});

/**
 * GET /home-banners/admin — all banners including inactive.
 */
const listAdmin = catchAsync(async (req, res) => {
  const banners = await homeBannerService.listForAdmin({ placement: req.query.placement });
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Banners fetched',
    data: banners,
  });
});

/**
 * GET /home-banners/:bannerId
 */
const getBanner = catchAsync(async (req, res) => {
  const banner = await homeBannerService.getBannerById(req.params.bannerId);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Banner fetched',
    data: banner,
  });
});

/**
 * POST /home-banners
 */
const createBanner = catchAsync(async (req, res) => {
  const banner = await homeBannerService.createBanner(req.body);
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Banner created',
    data: banner,
  });
});

/**
 * PATCH /home-banners/:bannerId
 */
const updateBanner = catchAsync(async (req, res) => {
  const banner = await homeBannerService.updateBannerById(req.params.bannerId, req.body);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Banner updated',
    data: banner,
  });
});

/**
 * DELETE /home-banners/:bannerId
 */
const deleteBanner = catchAsync(async (req, res) => {
  await homeBannerService.deleteBannerById(req.params.bannerId);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Banner deleted',
    data: null,
  });
});

export { listActive, listAdmin, getBanner, createBanner, updateBanner, deleteBanner };
