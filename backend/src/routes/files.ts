import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getFiles } from '../controllers/fileController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

// Multer config for local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

router.use(requireAuth);

router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);

export default router;
