import express from 'express';
import { createFolder, getFolders, deleteFolder } from '../controllers/folderController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getFolders);
router.post('/', createFolder);
router.delete('/:id', deleteFolder);

export default router;
