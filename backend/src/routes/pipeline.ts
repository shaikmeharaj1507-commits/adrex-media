import express from 'express';
import { getLeads, createLead, updateLead, deleteLead } from '../controllers/pipelineController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM']));

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
