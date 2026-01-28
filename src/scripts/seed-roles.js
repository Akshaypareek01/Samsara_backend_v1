import Joi from 'joi';
import mongoose from 'mongoose';
import config from '../config/config.js';
import Role from '../models/role.model.js';
import Admin from '../models/admin.model.js';

const seedRoles = async () => {
    try {
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('Connected to MongoDB');

        // Create Super Admin Role
        const superAdminRoleData = {
            name: 'Super Admin',
            description: 'Full access to all modules',
            isSystemRole: true,
            permissions: {
                dashboard: { read: true },
                userManagement: {
                    users: { create: true, read: true, update: true, delete: true },
                    teachers: { create: true, read: true, update: true, delete: true },
                    trainers: { create: true, read: true, update: true, delete: true },
                },
                companyManagement: { create: true, read: true, update: true, delete: true },
                bookingManagement: { create: true, read: true, update: true, delete: true },
                membershipManagement: { create: true, read: true, update: true, delete: true },
                classManagement: { create: true, read: true, update: true, delete: true },
                eventManagement: { create: true, read: true, update: true, delete: true },
                support: { create: true, read: true, update: true, delete: true },
                roleManagement: { create: true, read: true, update: true, delete: true },
                teamManagement: { create: true, read: true, update: true, delete: true },
            },
        };

        let superAdminRole = await Role.findOne({ name: 'Super Admin' });
        if (!superAdminRole) {
            superAdminRole = await Role.create(superAdminRoleData);
            console.log('Super Admin role created');
        } else {
            Object.assign(superAdminRole, superAdminRoleData);
            await superAdminRole.save();
            console.log('Super Admin role updated');
        }

        // Assign this role to existing admins who don't have a role
        const adminsWithoutRole = await Admin.find({ role: { $exists: false } });
        if (adminsWithoutRole.length > 0) {
            await Admin.updateMany({ role: { $exists: false } }, { $set: { role: superAdminRole._id } });
            console.log(`Assigned Super Admin role to ${adminsWithoutRole.length} admins`);
        }

        // Create a demo "Support" role
        const supportRoleData = {
            name: 'Support Staff',
            description: 'Access to support and bookings only',
            permissions: {
                dashboard: { read: true },
                userManagement: {
                    users: { create: false, read: true, update: false, delete: false },
                    teachers: { create: false, read: true, update: false, delete: false },
                    trainers: { create: false, read: true, update: false, delete: false },
                },
                companyManagement: { create: false, read: true, update: false, delete: false },
                bookingManagement: { create: false, read: true, update: true, delete: false },
                membershipManagement: { create: false, read: true, update: false, delete: false },
                classManagement: { create: false, read: true, update: false, delete: false },
                eventManagement: { create: false, read: true, update: false, delete: false },
                support: { create: true, read: true, update: true, delete: false },
            },
        };

        let supportRole = await Role.findOne({ name: 'Support Staff' });
        if (!supportRole) {
            await Role.create(supportRoleData);
            console.log('Support Staff role created');
        }

        console.log('Seeding completed');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
