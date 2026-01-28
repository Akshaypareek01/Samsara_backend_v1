import Joi from 'joi';
import { objectId } from './custom.validation.js';

const permissionSchema = Joi.object().keys({
    create: Joi.boolean(),
    read: Joi.boolean(),
    update: Joi.boolean(),
    delete: Joi.boolean(),
});

const createRole = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        permissions: Joi.object().keys({
            dashboard: Joi.object().keys({
                read: Joi.boolean(),
            }),
            userManagement: Joi.object().keys({
                users: permissionSchema,
                teachers: permissionSchema,
                trainers: permissionSchema,
            }),
            companyManagement: permissionSchema,
            bookingManagement: permissionSchema,
            membershipManagement: permissionSchema,
            classManagement: permissionSchema,
            eventManagement: permissionSchema,
            support: permissionSchema,
            roleManagement: permissionSchema,
            teamManagement: permissionSchema,
        }),
    }),
};

const getRoles = {
    query: Joi.object().keys({
        name: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
    }),
};

const getRole = {
    params: Joi.object().keys({
        roleId: Joi.string().custom(objectId),
    }),
};

const updateRole = {
    params: Joi.object().keys({
        roleId: Joi.required().custom(objectId),
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            description: Joi.string().allow(''),
            permissions: Joi.object().keys({
                dashboard: Joi.object().keys({
                    read: Joi.boolean(),
                }),
                userManagement: Joi.object().keys({
                    users: permissionSchema,
                    teachers: permissionSchema,
                    trainers: permissionSchema,
                }),
                companyManagement: permissionSchema,
                bookingManagement: permissionSchema,
                membershipManagement: permissionSchema,
                classManagement: permissionSchema,
                eventManagement: permissionSchema,
                support: permissionSchema,
                roleManagement: permissionSchema,
                teamManagement: permissionSchema,
            }),
        })
        .min(1),
};

const deleteRole = {
    params: Joi.object().keys({
        roleId: Joi.string().custom(objectId),
    }),
};

export {
    createRole,
    getRoles,
    getRole,
    updateRole,
    deleteRole,
};
