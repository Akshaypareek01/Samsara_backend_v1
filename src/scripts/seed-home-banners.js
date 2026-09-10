import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from '../config/config.js';
import Role from '../models/role.model.js';
import HomeBanner from '../models/home-banner.model.js';
import R2Service from '../services/r2.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_ASSETS_ROOT = path.resolve(__dirname, '../../../Samsara_app_prod');

const fullCrud = { create: true, read: true, update: true, delete: true };

/**
 * Grant Super Admin the homeBanners leaf so CRM CRUD is not 403.
 * @returns {Promise<void>}
 */
const patchSuperAdminPermission = async () => {
  const result = await Role.updateOne(
    { name: 'Super Admin' },
    { $set: { 'permissions.homeBanners': fullCrud } }
  );
  console.log(
    result.matchedCount
      ? 'Super Admin homeBanners permission set'
      : 'Super Admin role not found — run seed-roles.js first'
  );
};

/**
 * @param {string} assetsRoot
 * @param {string} relativePath
 * @returns {Promise<{ url: string, fileName: string }>}
 */
const uploadPng = async (assetsRoot, relativePath) => {
  const abs = path.join(assetsRoot, relativePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Asset missing: ${abs}`);
  }
  const buffer = fs.readFileSync(abs);
  return R2Service.uploadFile(buffer, path.basename(relativePath), 'image/png');
};

/**
 * Upload the five current Home creatives to R2 and insert HomeBanner docs.
 */
const seedHomeBanners = async () => {
  try {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    await patchSuperAdminPermission();

    const existing = await HomeBanner.countDocuments();
    if (existing > 0 && process.env.FORCE_SEED_HOME_BANNERS !== '1') {
      console.log(`homebanners already has ${existing} docs — skip insert (FORCE_SEED_HOME_BANNERS=1 to replace)`);
      await mongoose.disconnect();
      return;
    }

    if (process.env.FORCE_SEED_HOME_BANNERS === '1' && existing > 0) {
      await HomeBanner.deleteMany({});
      console.log('Cleared existing home banners');
    }

    const assetsRoot = process.env.APP_ASSETS_ROOT || DEFAULT_ASSETS_ROOT;
    console.log(`Uploading assets from ${assetsRoot}`);

    const hero1 = await uploadPng(assetsRoot, 'assets/bannerapp1.png');
    const hero2 = await uploadPng(assetsRoot, 'assets/bannerapp2.png');
    const hero3 = await uploadPng(assetsRoot, 'assets/bannerapp3.png');
    const webLogin = await uploadPng(assetsRoot, 'assets/Teacher/TeacherDashbord/bubble1.png');
    const homeUpdates = await uploadPng(assetsRoot, 'assets/Images/HomeUpdates.png');

    await HomeBanner.insertMany([
      {
        placement: 'home_hero',
        imageUrl: hero1.url,
        title: 'Begin Your Journey',
        targetScreen: 'GroupClassesAll',
        order: 0,
        isActive: true,
      },
      {
        placement: 'home_hero',
        imageUrl: hero2.url,
        title: 'Start Today',
        targetScreen: 'GroupClassesAll',
        order: 1,
        isActive: true,
      },
      {
        placement: 'home_hero',
        imageUrl: hero3.url,
        title: 'Explore Now',
        targetScreen: 'GroupClassesAll',
        order: 2,
        isActive: true,
      },
      {
        placement: 'home_updates',
        imageUrl: webLogin.url,
        title: 'Web Login',
        subtitle: 'You can see us on Big screens as well',
        ctaText: 'Click Here to see How',
        targetScreen: 'Guidevideo',
        order: 0,
        isActive: true,
      },
      {
        placement: 'home_updates',
        imageUrl: homeUpdates.url,
        title: 'Home Updates',
        targetScreen: null,
        order: 1,
        isActive: true,
      },
    ]);

    console.log('Seeded 5 home banners');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding home banners:', error);
    process.exit(1);
  }
};

seedHomeBanners();
