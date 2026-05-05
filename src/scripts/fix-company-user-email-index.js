/**
 * Drops legacy unique indexes on (companyId, email) that block soft-delete re-use
 * of the same email, then syncs indexes from the CompanyUser model (partial unique).
 *
 * Partial filter in the model uses `isActive: { $ne: false }` for MongoDB Atlas
 * (partial indexes with `$exists: false` are rejected on some clusters).
 *
 * Run: npm run fix:company-user-index
 * Requires MONGODB_URL (via .env / NODE_ENV) like other scripts.
 */
import mongoose from 'mongoose';
import config from '../config/config.js';
import CompanyUser from '../models/company-user.model.js';

/**
 * @returns {boolean} true if the index key is exactly { companyId: 1, email: 1 }
 */
const isCompanyEmailCompoundKey = (key) => {
  if (!key || typeof key !== 'object') return false;
  const names = Object.keys(key);
  return names.length === 2 && key.companyId === 1 && key.email === 1;
};

const run = async () => {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('Connected to MongoDB');

  const coll = CompanyUser.collection;
  const indexes = await coll.indexes();

  const drops = [];
  for (const ix of indexes) {
    if (ix.name === '_id_') continue;
    if (!ix.unique || !isCompanyEmailCompoundKey(ix.key)) continue;
    drops.push(ix.name);
  }

  if (drops.length === 0) {
    console.log('No unique compound (companyId, email) indexes to drop.');
  } else {
    for (const name of drops) {
      console.log(`Dropping index: ${name}`);
      await coll.dropIndex(name);
    }
  }

  console.log('Syncing indexes from CompanyUser schema...');
  const synced = await CompanyUser.syncIndexes();
  console.log('syncIndexes result:', synced);

  const after = await coll.indexes();
  console.log(
    'Indexes on companyusers after fix:',
    after.map((i) => ({ name: i.name, key: i.key, unique: i.unique, partialFilterExpression: i.partialFilterExpression }))
  );

  await mongoose.connection.close();
  console.log('Done.');
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
  mongoose.connection.close().catch(() => {});
});
