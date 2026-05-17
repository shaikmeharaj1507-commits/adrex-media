import { Router } from 'express';
import { signup, login, logout, changePassword, forgotPassword, resetPassword, verifyEmail } from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/signup', signup as any);
router.post('/login', login as any);
router.post('/logout', logout as any);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password', resetPassword as any);
router.post('/verify-email', verifyEmail as any);
router.post('/change-password', requireAuth as any, changePassword as any);

export default router;
