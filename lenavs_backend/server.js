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

// Middleware
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000
const __dirname = path.resolve()

// --------------------------------------------------
// CREATE REQUIRED FOLDERS
// --------------------------------------------------
function ensureFolders() {
  const folders = [
    'uploads',
    'uploads/audio',
    'uploads/video',
    'uploads/images',
    'uploads/lyrics',
    'exports'
  ]

  folders.forEach(folder => {
    const fullPath = path.join(__dirname, folder)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log('📁 Created:', fullPath)
    }
  })
}

ensureFolders()

// --------------------------------------------------
// MIDDLEWARES
// --------------------------------------------------
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// --------------------------------------------------
// STATIC FILES (APENAS uploads / exports)
// --------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/exports', express.static(path.join(__dirname, 'exports')))

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LenaVS Backend',
    env: process.env.NODE_ENV || 'development'
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
// API 404 (JSON)
// --------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl
  })
})

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------
app.use(errorHandler)

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 LenaVS Backend running')
  console.log('🌍 Port:', PORT)
})
