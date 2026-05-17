import express from 'express';
import multer from 'multer';
import path from 'path';
import { updateProfile, uploadAvatar } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.use(requireAuth);

router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
