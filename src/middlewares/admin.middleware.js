import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware to verify if the authenticated user is an admin
 * Must be used AFTER auth() middleware
 */
const adminOnly = () => async (req, res, next) => {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/middlewares/admin.middleware.js:8',message:'Admin middleware triggered',data:{hasUser:!!req.user,userId:req.user?.id,userRole:req.user?.role,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-2'})}).catch(()=>{});
    // #endregion

    console.log('🔐 Admin middleware called');
    console.log('req.user:', req.user);

    if (!req.user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/middlewares/admin.middleware.js:17',message:'No user in request - authentication failed',data:{reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-2'})}).catch(()=>{});
      // #endregion

      console.log('❌ No user found in request');
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    console.log('User role:', req.user.role);

    if (req.user.role !== 'admin') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5f6679be-04c6-4efb-aaf8-56fa2fb8e96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/middlewares/admin.middleware.js:30',message:'User is not admin - access denied',data:{userId:req.user?.id,userRole:req.user?.role,reqUrl:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'initial-test',hypothesisId:'hypothesis-3'})}).catch(()=>{});
      // #endregion

      console.log('❌ User is not admin');
      return next(new ApiError(httpStatus.FORBIDDEN, 'Admin access required'));
    }

    console.log('✅ Admin verified, proceeding');
    next();
  } catch (error) {
    console.log('❌ Admin middleware error:', error);
    next(error);
  }
};

export default adminOnly;