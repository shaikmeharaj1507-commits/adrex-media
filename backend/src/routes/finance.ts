import express from 'express';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getExpenses, createExpense, updateExpense, deleteExpense } from '../controllers/financeController';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = express.Router();
router.use(requireAuth);

router.use(requireRole(['SUPER_ADMIN', 'MANAGER', 'PERFORMANCE_MARKETER']));

router.get('/invoices', getInvoices);
router.post('/invoices', createInvoice);
router.put('/invoices/:id', updateInvoice);
router.delete('/invoices/:id', deleteInvoice);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

export default router;
