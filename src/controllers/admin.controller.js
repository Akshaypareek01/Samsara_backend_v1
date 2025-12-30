import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { loginAdminWithEmailAndPassword } from '../services/admin.service.js';
import { generateAdminAuthTokens } from '../services/token.service.js';

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const admin = await loginAdminWithEmailAndPassword(email, password);
  const tokens = await generateAdminAuthTokens(admin);
  res.send({ admin, tokens });
});

export const getProfile = async (req, res) => {
  // auth.js always attaches authenticated entity to req.user
  return res.status(200).json(req.user);
};
export { login };
