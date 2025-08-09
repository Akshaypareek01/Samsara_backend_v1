import express from 'express';
import multer from 'multer';
import uploadController from '../../controllers/upload.controller.js';

const router = express.Router();

// Configure multer for memory storage
// NOTE: Large files are held in memory before being sent to R2. For very large uploads
// or high concurrency, consider switching to a streaming approach instead of memoryStorage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
  },
});

router.post('/', upload.single('file'), uploadController.uploadFile);

export default router; 









// const handleFileUpload = async () => {
//   if (!selectedFile) {
//       setUploadStatus({
//           loading: false,
//           success: false,
//           error: 'Please select a file first'
//       });
//       return;
//   }

//   try {
//       setUploadStatus({
//           loading: true,
//           success: false,
//           error: ''
//       });

//       const formData = new FormData();
//       formData.append('file', selectedFile);

//       const token = localStorage.getItem('token');
//       const response = await axios.post(`http://localhost:3000/v1/upload`, formData, {
//           headers: {
//               'Content-Type': 'multipart/form-data',
//               'Authorization': `Bearer ${token}`
//           }
//       });

//       setUploadStatus({
//           loading: false,
//           success: true,
//           error: '',
//           url: response.data.url,
//           fileName: response.data.fileName
//       });
//   } catch (error) {
//       setUploadStatus({
//           loading: false,
//           success: false,
//           error: 'Failed to upload file. Please try again.'
//       });
//       console.error('Error uploading file:', error);
//   }
// };