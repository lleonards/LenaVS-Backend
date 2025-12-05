import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import projectRoutes from './routes/projects.js';
import exportRoutes from './routes/export.js';
import paymentRoutes from './routes/payment.js';
import reportRoutes from './routes/report.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const __dirname = path.resolve();

// -----------------------------
// CREATE UPLOAD FOLDERS SAFELY
// -----------------------------
function ensureUploadStructure() {
  const folders = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/audio'),
    path.join(__dirname, 'uploads/video'),
    path.join(__dirname, 'uploads/images'),
    path.join(__dirname, 'uploads/lyrics'),
    path.join(__dirname, 'exports'),
  ];

  for (const folder of folders) {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
      console.log('📁 Created folder:', folder);
    } else {
      console.log('📁 Folder already exists:', folder);
    }
  }
}

ensureUploadStructure();

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -----------------------------
// STATIC FILE HOSTING
// -----------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// -----------------------------
// HEALTHCHECK
// -----------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LenaVS Backend is running' });
});

// -----------------------------
// ROUTES
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/report', reportRoutes);

// -----------------------------
// GLOBAL ERRORS
// -----------------------------
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LenaVS Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
