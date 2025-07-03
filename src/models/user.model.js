import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { toJSON, paginate } from './plugins/index.js';
import Membership from './membership.model.js';
import EventApplication from './eventApplication.model.js';
import { CustomSession } from './customSession.model.js';
import { Mood } from './userMood.model.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        maxlength: [20, 'Username must be less than or equal to 20 characters.']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    gender: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'teacher'],
        default: "user"
    },
    // User category (for regular users)
    userCategory: {
        type: String,
        enum: ['Personal', 'Corporate'],
        required: function() { return this.role === 'user'; }
    },
    // Teacher specific fields
    teacherCategory: {
        type: String,
        enum: ['Fitness Coach', 'Ayurveda Specialist', 'Mental Health Specialist', 'Yoga Trainer', 'General Trainer'],
        required: function() { return this.role === 'teacher'; }
    },
    teachingExperience: {
        type: String,
        required: false
    },
    expertise: [String],
    qualification: [Object],
    additional_courses: [Object],
    
    // Company related fields (for corporate users)
    company_name: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false,
    },
    companyId: {
        type: String,
        ref: 'Company',
        required: false,
    },
    corporate_id: {
        type: String,
        required: function() { return this.role === 'user' && this.userCategory === 'Corporate'; }
    },
    
    password: {
        type: String,
        // required: [false, 'Please provide a password'],
        // minlength: 8
    },
    mobile: {
        type: String,
        required: [false, 'Please provide a mobile number'],
        minlength: 10,
        unique: true,
        sparse: true // Allow multiple null values
    },
    dob: {
        type: String,
        required: [false, 'Please provide date of birth'],
    },
    age: {
        type: String,
        required: [false, 'Please provide user age'],
    },
    Address: {
        type: String,
        required: [false, 'Please provide address'],
    },
    city: {
        type: String,
        required: [false, 'A user must have a city'],
    },
    pincode: {
        type: String,
        required: [false, 'A user must have a pincode'],
    },
    country: {
        type: String,
        required: [false, 'A user must have a country'],
    },
    height: {
        type: String,
        required: [false, 'user height is required'],
    },
    weight: {
        type: String,
        required: [false, 'user weight is required'],
    },
    targetWeight: {
        type: String,
        required: [false, 'Please provide user target weight'],
    },
    bodyshape: {
        type: String,
        required: [false, 'Please provide user body shape'],
    },
    weeklyyogaplan: {
        type: String,
        required: [false, 'Please provide user weekly yoga plan'],
    },
    practicetime: {
        type: String,
        required: [false, 'Please provide user practice time'],
    },
    focusarea: [String],
    goal: [String],
    health_issues: [String],
    howyouknowus: {
        type: String,
        required: [false, 'howyouknowus is required'],
    },
    PriorExperience: {
        type: String,
        required: [false, 'PriorExperience is required'],
    },
    description: {
        type: String,
    },
    attendance: [
        {
            classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
            joinedAt: Date,
            leftAt: Date,
            durationMinutes: Number,
            kcalBurned: Number
        }
    ],
    achievements: [String],
    assessments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }],
    classFeedback: [
        {
            classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
            formData: { type: mongoose.Schema.Types.Mixed },
        },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    status: {
        type: Boolean,
        default: true,
    },
    active: {
        type: Boolean,
        default: false,
    },
    images: [{
        filename: String, // Store the filename of the image
        path: String,
        key: String,     // Store the path to the image in the media folder
    }],
    notificationToken: {
        type: String,
        default: ""
    },
}, {
    timestamps: {}
});

// Apply plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre('remove', async function(next) {
    try {
        console.log("In remove function this delete ==>", this._id)
        await Membership.deleteMany({ userId: this._id });
        await EventApplication.deleteMany({ userId: this._id });
        await CustomSession.deleteMany({ user: this._id });
        await Mood.deleteMany({ userId: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

/**
 * Reset Password
 */
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime());
        return JWTTimestamp < changedTimestamp;
    }
    // False means Not Changed
    return false;
}

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
};

export const User = mongoose.model('Users', userSchema);