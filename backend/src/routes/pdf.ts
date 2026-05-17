import express from 'express';
import { generateInvoicePDF, generateReportPDF } from '../controllers/pdfController';
import { requireAuth } from '../middlewares/auth';

const router = express.Router();

router.use(requireAuth);

router.get('/invoice/:id', generateInvoicePDF);
router.get('/report', generateReportPDF);

export default router;
