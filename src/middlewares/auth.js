import passport from 'passport';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import { roleRights } from '../config/roles.js';

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/middlewares/auth.js:6',message:'Auth verifyCallback called',data:{hasError:!!err,hasInfo:!!info,hasUser:!!user,userId:user?.id,userRole:user?.role,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-2'})}).catch(()=>{});
  // #endregion

  if (err || info || !user) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/middlewares/auth.js:13',message:'Authentication failed',data:{error:err?.message,info:info?.message,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-2'})}).catch(()=>{});
    // #endregion

    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    // Admin has full access to all APIs
    if (user.role === 'admin') {
      return resolve();
    }
    
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
