import mongoose from 'mongoose';
import dotenv from 'dotenv';
import config from './src/config/config.js';
import { User } from './src/models/user.model.js';
import NotificationPreferences from './src/models/notificationPreferences.model.js';

// Load environment variables
dotenv.config();

// Import all models to ensure they are registered
import './src/models/index.js';

/**
 * Migration script to add notification preferences for existing users
 * This script will:
 * 1. Find all users without notification preferences
 * 2. Create default notification preferences for each user
 * 3. Update the user document with the preferences reference
 */
async function migrateNotificationPreferences() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Find all users without notification preferences
    console.log('🔍 Finding users without notification preferences...');
    const usersWithoutPreferences = await User.find({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null }
      ]
    }).select('_id name email');

    console.log(`📊 Found ${usersWithoutPreferences.length} users without notification preferences`);

    if (usersWithoutPreferences.length === 0) {
      console.log('✅ All users already have notification preferences!');
      return;
    }

    // Process users in batches to avoid memory issues
    const batchSize = 100;
    let processedCount = 0;
    let errorCount = 0;

    console.log('🚀 Starting migration process...');

    for (let i = 0; i < usersWithoutPreferences.length; i += batchSize) {
      const batch = usersWithoutPreferences.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersWithoutPreferences.length / batchSize)}`);

      // Process each user in the batch
      for (const user of batch) {
        try {
          // Create notification preferences for the user
          const preferences = await NotificationPreferences.createDefaultPreferences(user._id);
          
          // Update user with preferences reference
          await User.findByIdAndUpdate(user._id, {
            notificationPreferences: preferences._id
          });

          processedCount++;
          
          if (processedCount % 50 === 0) {
            console.log(`✅ Processed ${processedCount}/${usersWithoutPreferences.length} users`);
          }

        } catch (error) {
          console.error(`❌ Error processing user ${user._id} (${user.email}):`, error.message);
          errorCount++;
        }
      }
    }

    // Final summary
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully processed: ${processedCount} users`);
    console.log(`❌ Errors encountered: ${errorCount} users`);
    console.log(`📊 Total users found: ${usersWithoutPreferences.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some users failed to process. You may need to run the script again or check the logs.');
    } else {
      console.log('\n🎉 Migration completed successfully!');
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const remainingUsersWithoutPreferences = await User.countDocuments({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null }
      ]
    });

    if (remainingUsersWithoutPreferences === 0) {
      console.log('✅ Verification passed: All users now have notification preferences!');
    } else {
      console.log(`⚠️  Verification failed: ${remainingUsersWithoutPreferences} users still without preferences`);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

/**
 * Dry run mode - shows what would be done without making changes
 */
async function dryRun() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('✅ Connected to MongoDB');

    // Find all users without notification preferences
    const usersWithoutPreferences = await User.find({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null }
      ]
    }).select('_id name email createdAt').limit(10);

    console.log(`📊 Found ${usersWithoutPreferences.length} users without notification preferences (showing first 10):`);
    
    usersWithoutPreferences.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt}`);
    });

    const totalCount = await User.countDocuments({
      $or: [
        { notificationPreferences: { $exists: false } },
        { notificationPreferences: null }
      ]
    });

    console.log(`\n📈 Total users that would be processed: ${totalCount}`);

  } catch (error) {
    console.error('💥 Dry run failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

if (isDryRun) {
  console.log('🔍 Running in DRY RUN mode - no changes will be made');
  dryRun();
} else {
  console.log('🚀 Running migration script...');
  migrateNotificationPreferences();
}
