import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getFiles, deleteFile, renameFile, moveFile, getFileStats } from '../controllers/fileController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

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
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.use(requireAuth);

router.get('/stats', getFileStats);
router.get('/', getFiles);
router.post('/upload', upload.single('file'), uploadFile);
router.patch('/:id/rename', renameFile);
router.patch('/:id/move', moveFile);
router.delete('/:id', deleteFile);

export default router;
