import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Routes
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import projectRoutes from './routes/projects.js'
import exportRoutes from './routes/export.js'
import paymentRoutes from './routes/payment.js'
import reportRoutes from './routes/report.js'

// Middlewares
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000

// --------------------------------------------------
// __dirname (ESM SAFE)
// --------------------------------------------------
const __dirname = path.resolve()

// --------------------------------------------------
// CREATE UPLOAD / EXPORT FOLDERS
// --------------------------------------------------
function ensureUploadStructure() {
  const folders = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/audio'),
    path.join(__dirname, 'uploads/video'),
    path.join(__dirname, 'uploads/images'),
    path.join(__dirname, 'uploads/lyrics'),
    path.join(__dirname, 'exports'),
  ]

  folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
      console.log('📁 Created folder:', folder)
    }
  })
}

ensureUploadStructure()

// --------------------------------------------------
// MIDDLEWARES
// --------------------------------------------------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// --------------------------------------------------
// STATIC FILES (uploads / exports)
// --------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/exports', express.static(path.join(__dirname, 'exports')))

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LenaVS Backend',
    timestamp: new Date().toISOString(),
  })
})

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/report', reportRoutes)

// --------------------------------------------------
// FRONTEND (REACT SPA)
// --------------------------------------------------

// Pasta do build do React (Vite / CRA)
const frontendPath = path.join(__dirname, 'dist')

// Serve arquivos estáticos do frontend
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))
}

// SPA FALLBACK (ESSENCIAL PARA /login, /register, /editor)
app.get('*', (req, res) => {
  // Se for rota de API → 404 JSON
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
    })
  }

  // Qualquer outra rota → React
  res.sendFile(path.join(frontendPath, 'index.html'))
})

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------
app.use(errorHandler)

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 LenaVS Backend running')
  console.log(`🌍 Port: ${PORT}`)
  console.log(`⚙️ Environment: ${process.env.NODE_ENV || 'development'}`)
})
