import mongoose from 'mongoose';
import { User } from './src/models/index.js';
import config from './src/config/config.js';

/**
 * Migration script to add profileImage and AboutMe fields to all existing users
 * Uses bulk operations for better performance
 * Run with: node migrate-add-user-fields-bulk.js
 */

const migrateUserFieldsBulk = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    // Find users that don't have the new fields
    const usersToUpdate = await User.find({
      $or: [
        { profileImage: { $exists: false } },
        { AboutMe: { $exists: false } },
        { profileImage: null },
        { AboutMe: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users that need migration`);

    if (usersToUpdate.length === 0) {
      console.log('No users need migration. All users already have the new fields.');
      return;
    }

    // Prepare bulk operations
    const bulkOps = usersToUpdate.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            profileImage: user.profileImage || "https://pub-4471af5ad08f4d59887c139e8f2cd164.r2.dev/d06d8c7c-ca07-4bab-a53b-8564f9bf0bb5.jpg",
            AboutMe: user.AboutMe || ""
          }
        }
      }
    }));

    // Execute bulk operations
    const result = await User.bulkWrite(bulkOps);
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${result.matchedCount}`);
    console.log(`Users updated: ${result.modifiedCount}`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateUserFieldsBulk(); 