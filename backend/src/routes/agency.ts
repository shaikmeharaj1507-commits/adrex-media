import express from 'express';
import { getAgency, updateAgency } from '../controllers/agencyController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/', getAgency);
router.put('/', updateAgency);

export default router;
