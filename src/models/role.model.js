import mongoose from 'mongoose';
import { toJSON, paginate } from './plugins/index.js';

const permissionSchema = new mongoose.Schema(
    {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
    },
    { _id: false }
);

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        permissions: {
            dashboard: {
                read: { type: Boolean, default: false },
            },
            userManagement: {
                users: permissionSchema,
                teachers: permissionSchema,
                trainers: permissionSchema,
            },
            companyManagement: permissionSchema,
            bookingManagement: permissionSchema,
            membershipManagement: permissionSchema,
            classManagement: permissionSchema,
            eventManagement: permissionSchema,
            support: permissionSchema,
            roleManagement: permissionSchema,
            teamManagement: permissionSchema,
        },
        isSystemRole: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
roleSchema.plugin(toJSON);
roleSchema.plugin(paginate);

/**
 * @typedef Role
 */
const Role = mongoose.model('Role', roleSchema);

export default Role;
