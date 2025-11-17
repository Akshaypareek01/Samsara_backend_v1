import mongoose from 'mongoose';
import config from './src/config/config.js';
import Admin from './src/models/admin.model.js';

/**
 * Create admin user
 */
async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@samsarawellness.in' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = await Admin.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@samsarawellness.in',
      password: 'admin@1234',
      status: true,
    });

    console.log('Admin user created successfully:');
    console.log({
      id: admin._id,
      name: admin.name,
      username: admin.username,
      email: admin.email,
      status: admin.status,
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdminUser();

