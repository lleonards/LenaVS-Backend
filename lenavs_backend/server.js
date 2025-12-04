import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import projectRoutes from './routes/projects.js';
import exportRoutes from './routes/export.js';
import paymentRoutes from './routes/payment.js';
import reportRoutes from './routes/report.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createUploadDirs } from './utils/fileSystem.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories
createUploadDirs();

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/exports', express.static('exports'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LenaVS Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/report', reportRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LenaVS Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
