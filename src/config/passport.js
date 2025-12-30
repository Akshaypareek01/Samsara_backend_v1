import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import config from './config.js';
import { tokenTypes } from './tokens.js';
import { User, Admin, Company } from '../models/index.js';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type');
    }
    
    // Check if token is for admin, company, or user
    const userType = payload.userType || 'user';
    
    if (userType === 'admin') {
      const admin = await Admin.findById(payload.sub);
      if (!admin || !admin.status) {
        return done(null, false);
      }
      // Add role to admin object for auth middleware
      admin.role = 'admin';
      return done(null, admin);
    } else if (userType === 'company') {
      const company = await Company.findById(payload.sub);
      if (!company || !company.status) {
        return done(null, false);
      }
      // Add role to company object for auth middleware
      company.role = 'company';
      return done(null, company);
    } else {
      const user = await User.findById(payload.sub);
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    }
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export { jwtStrategy };
