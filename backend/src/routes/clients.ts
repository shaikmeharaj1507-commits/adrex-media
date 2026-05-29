import express from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'SALES_TEAM']));

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
