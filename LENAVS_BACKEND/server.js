import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import uploadRoutes from './routes/upload.js';
import exportRoutes from './routes/export.js';
import paymentRoutes from './routes/payment.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* ===========================================================
   🔥 CORS COMPLETO (corrige erro do download)
   =========================================================== */
const allowedOrigins = [
  process.env.FRONTEND_URL,       // URL do frontend no Render
  'http://localhost:5173',        // Vite
  'http://localhost:3000',        // React / fallback
].filter(Boolean); // Remove undefined

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    // 🔥 Importante para download de vídeos
    res.header(
      'Access-Control-Expose-Headers',
      'Content-Disposition, Content-Length, Content-Type'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  }

  console.warn('🚫 CORS bloqueado:', origin);
  return res.status(403).json({ error: 'CORS blocked: origem não permitida' });
});

/* ===========================================================
   Middleware principal
   =========================================================== */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ===========================================================
   Pastas públicas
   =========================================================== */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

/* ===========================================================
   Rota de teste (Render usa)
   =========================================================== */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LenaVS Backend is running',
    frontend: process.env.FRONTEND_URL || 'not set'
  });
});

/* ===========================================================
   Rotas principais
   =========================================================== */
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/payment', paymentRoutes);

/* ===========================================================
   Handler global de erros
   =========================================================== */
app.use(errorHandler);

/* ===========================================================
   Start server
   =========================================================== */
app.listen(PORT, () => {
  console.log(`\n✅ LenaVS Backend running on port ${PORT}`);
  console.log(`🌐 Allowed Origins:`, allowedOrigins);
  console.log(`📦 FRONTEND_URL: ${process.env.FRONTEND_URL}`);
});
