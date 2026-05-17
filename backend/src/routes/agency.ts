import express from 'express';
import multer from 'multer';
import path from 'path';
import { getAgency, updateAgency, uploadLogo } from '../controllers/agencyController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/logos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.use(requireAuth);

router.get('/', getAgency);
router.put('/', updateAgency);
router.post('/logo', logoUpload.single('logo'), uploadLogo);

export default router;
