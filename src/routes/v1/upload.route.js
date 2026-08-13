import express from 'express';
import multer from 'multer';
import uploadController from '../../controllers/upload.controller.js';
import auth from '../../middlewares/auth.js';
import { uploadLimiter } from '../../middlewares/rateLimiter.js';
import { MAX_UPLOAD_FILE_SIZE_BYTES } from '../../config/uploadLimits.js';

const router = express.Router();

// Memory storage: files are held in RAM before being streamed to R2, so the
// size cap is also the per-request memory cost. nginx is pinned at 50M
// (deploy/nginx) so Multer is the one that 413s first.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    files: 1,
    fields: 10,
  },
});

router.post('/', auth(), uploadLimiter, upload.single('file'), uploadController.uploadFile);

export default router;
