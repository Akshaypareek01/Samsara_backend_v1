import express from 'express';
import multer from 'multer';
import uploadController from '../../controllers/upload.controller.js';
import auth from '../../middlewares/auth.js';
import { uploadLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

// Memory storage: files are held in RAM before being streamed to R2, so the
// size cap is also the per-request memory cost. Keep it tight.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB — photos, PDFs, and larger reports
    files: 1,
    fields: 10,
  },
});

router.post('/', auth(), uploadLimiter, upload.single('file'), uploadController.uploadFile);

export default router;
