import express from 'express';
import { getDashboardStats, getReportStats } from '../controllers/statsController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM', 'PERFORMANCE_MARKETER', 'SOCIAL_MEDIA_MANAGER']));

router.get('/dashboard', getDashboardStats);
router.get('/reports', getReportStats);

export default router;
