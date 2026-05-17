import express from 'express';
import { generateInvoicePDF, generateReportPDF } from '../controllers/pdfController';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Custom auth for PDF routes that supports ?token= query param for browser downloads
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const tokenQuery = req.query.token as string;
  const token = authHeader?.split(' ')[1] || tokenQuery;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    (req as any).user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/invoice/:id', generateInvoicePDF);
router.get('/report', generateReportPDF);

export default router;
