import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Rate Limiter configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middleware
app.use(express.json());
app.use('/api', apiLimiter);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL || ''].filter(Boolean),
  credentials: true,
}));
app.use(morgan('dev'));

import path from 'path';

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

import authRoutes from './routes/auth';
import influencerRoutes from './routes/influencers';
import taskRoutes from './routes/tasks';
import calendarRoutes from './routes/calendar';
import clientRoutes from './routes/clients';
import campaignRoutes from './routes/campaigns';
import statsRoutes from './routes/stats';
import aiRoutes from './routes/ai';
import userRoutes from './routes/user';
import agencyRoutes from './routes/agency';
import teamRoutes from './routes/team';
import pipelineRoutes from './routes/pipeline';
import financeRoutes from './routes/finance';
import whatsappRoutes from './routes/whatsapp';
import fileRoutes from './routes/files';
import messageRoutes from './routes/messages';
import pdfRoutes from './routes/pdf';

// Basic Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/pdf', pdfRoutes);

import { createServer } from 'http';
import { setupSocketIO } from './socket';

const httpServer = createServer(app);
const io = setupSocketIO(httpServer);

// Make io accessible globally if needed in controllers (optional)
app.set('io', io);

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSockets enabled on port ${PORT}`);
});
